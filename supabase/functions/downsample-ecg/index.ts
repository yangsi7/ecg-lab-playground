/**
 * FILE: downsample-ecg/index.ts
 * 
 * Supports factor-based decimation up to factor=4 (80Hz).
 * Factor is clamped to [1..4] in the DB function.
 * 
 * Original data is at 320Hz, so:
 * - factor=1: 320Hz (no decimation)
 * - factor=2: 160Hz
 * - factor=3: ~107Hz
 * - factor=4: 80Hz (recommended for visualization)
 */
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Environment variables are pre-populated
const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
        auth: { persistSession: false },
    }
);

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-application-name",
    "Access-Control-Max-Age": "86400",
};

interface DownsampleParams {
    pod_id: string;
    time_start: string;
    time_end: string;
    factor?: number;
    chunk_minutes?: number; // New parameter for chunked processing
}

function validateParams(params: DownsampleParams): string | null {
    if (!params.pod_id) return "Missing required parameter: pod_id";
    if (!params.time_start) return "Missing required parameter: time_start";
    if (!params.time_end) return "Missing required parameter: time_end";
    
    // Validate time range
    const start = new Date(params.time_start);
    const end = new Date(params.time_end);
    if (isNaN(start.getTime())) return "Invalid time_start format";
    if (isNaN(end.getTime())) return "Invalid time_end format";
    if (end <= start) return "time_end must be after time_start";
    
    // Validate factor (if provided)
    if (params.factor !== undefined) {
        if (typeof params.factor !== 'number') return "factor must be a number";
        if (params.factor < 1 || params.factor > 4) return "factor must be between 1 and 4";
    }
    
    // Validate chunk_minutes (if provided)
    if (params.chunk_minutes !== undefined) {
        if (typeof params.chunk_minutes !== 'number') return "chunk_minutes must be a number";
        if (params.chunk_minutes < 1) return "chunk_minutes must be positive";
    }
    
    return null;
}

// Calculate if the time range exceeds the threshold that would likely cause a timeout
function shouldUseChunkedProcessing(start: Date, end: Date, chunkMinutesRequested?: number): boolean {
    const HOUR_IN_MS = 60 * 60 * 1000;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / HOUR_IN_MS;
    
    // Use chunked processing for time ranges longer than 1 hour or if explicitly requested
    return durationHours > 1 || chunkMinutesRequested !== undefined;
}

// Determine appropriate chunk size based on time range
function getOptimalChunkSize(start: Date, end: Date, requestedChunkMinutes?: number): number {
    if (requestedChunkMinutes) return requestedChunkMinutes;
    
    const HOUR_IN_MS = 60 * 60 * 1000;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / HOUR_IN_MS;
    
    // Scale chunk size based on duration
    if (durationHours > 24) return 60; // 1 hour chunks for multi-day ranges
    if (durationHours > 12) return 30; // 30 min chunks for 12+ hours
    if (durationHours > 6) return 15;  // 15 min chunks for 6-12 hours
    if (durationHours > 1) return 10;  // 10 min chunks for 1-6 hours
    
    return 5; // 5 min chunks for < 1 hour
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { 
            status: 204, 
            headers: corsHeaders 
        });
    }

    const startTime = Date.now();
    let functionName = "downsample_ecg"; // Default function name for logging

    try {
        if (req.method !== "POST") {
            throw new Error("Method not allowed");
        }

        // Parse and validate request
        const params: DownsampleParams = await req.json();
        const validationError = validateParams(params);
        if (validationError) {
            throw new Error(validationError);
        }

        const start = new Date(params.time_start);
        const end = new Date(params.time_end);
        const factor = params.factor ?? 4;

        // Log request parameters
        console.log("[downsample-ecg] Request:", {
            pod_id: params.pod_id,
            time_start: params.time_start,
            time_end: params.time_end,
            factor: factor,
            chunk_minutes: params.chunk_minutes
        });

        let data, error;

        // Determine whether to use chunked processing
        const useChunkedProcessing = shouldUseChunkedProcessing(start, end, params.chunk_minutes);
        
        if (useChunkedProcessing) {
            // Use chunked processing for larger time ranges
            functionName = "downsample_ecg_chunked";
            const chunkMinutes = getOptimalChunkSize(start, end, params.chunk_minutes);
            
            console.log(`[downsample-ecg] Using chunked processing with ${chunkMinutes} minute chunks`);
            
            const result = await supabase.rpc(functionName, {
                p_pod_id: params.pod_id,
                p_time_start: params.time_start,
                p_time_end: params.time_end,
                p_factor: factor,
                p_chunk_minutes: chunkMinutes
            });
            
            data = result.data;
            error = result.error;
        } else {
            // Use standard processing for smaller time ranges
            const result = await supabase.rpc(functionName, {
                p_pod_id: params.pod_id,
                p_time_start: params.time_start,
                p_time_end: params.time_end,
                p_factor: factor
            });
            
            data = result.data;
            error = result.error;
        }

        // Log execution
        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: !error,
                user_id: req.headers.get('Authorization') // Extract user ID if needed
            });

        if (error) {
            console.error(`[downsample-ecg] RPC error (${functionName}):`, error);
            throw error;
        }

        // Return downsampled data
        return new Response(
            JSON.stringify(data), 
            { 
                status: 200, 
                headers: corsHeaders 
            }
        );

    } catch (err) {
        console.error("[downsample-ecg] Error:", err);
        
        // Log error
        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: false,
                error_message: err instanceof Error ? err.message : "Unknown error occurred",
                user_id: req.headers.get('Authorization') // Extract user ID if needed
            });

        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error occurred",
                code: err instanceof Error && 'code' in err ? err.code : undefined
            }), 
            { 
                status: err instanceof Error && err.message.includes("Missing") ? 400 : 500,
                headers: corsHeaders 
            }
        );
    }
});