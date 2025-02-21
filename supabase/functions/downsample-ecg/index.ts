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
    Deno.env.get("VITE_SUPABASE_URL") ?? "",
    Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") ?? "",
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
    
    return null;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { 
            status: 204, 
            headers: corsHeaders 
        });
    }

    const functionName = "downsample_ecg"; // Function name for logging
    const startTime = Date.now();

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

        // Log request parameters
        console.log("[downsample-ecg] Request:", {
            pod_id: params.pod_id,
            time_start: params.time_start,
            time_end: params.time_end,
            factor: params.factor ?? 4
        });

        // Call DB function (factor defaults to 4 for 80Hz visualization)
        const { data, error } = await supabase.rpc(functionName, {
            p_pod_id: params.pod_id,
            p_time_start: params.time_start,
            p_time_end: params.time_end,
            p_factor: params.factor ?? 4
        });

        // Log success
        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: !error,
                user_id: req.headers.get('Authorization') // Extract user ID if needed
            });

        if (error) {
            console.error("[downsample-ecg] RPC error:", error);
            throw error;
        }

        // Return downsampled data
        return new Response(
            JSON.stringify({
                data,
                metadata: {
                    original_frequency: 320,
                    target_frequency: 320 / (params.factor ?? 4),
                    points: data.length
                }
            }), 
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