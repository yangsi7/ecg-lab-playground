/**
PHASE: Edge Function
FILE: get-ecg-diagnostics/index.ts
*/
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-client',
    'Access-Control-Max-Age': '86400'
}
// Create a Supabase client using service role key and anon key for authorization
const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
        auth: { persistSession: false },
        global: {
            headers: {
                apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? ""
            }
        }
    }
);

interface DiagnosticsParams {
    pod_id: string;
    time_start: string;
    time_end: string;
    chunk_minutes?: number;
}

function extractUserIdFromToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match || !match[1]) return null;
    const token = match[1];
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload.sub || null;
    } catch (error) {
        console.error("[get-ecg-diagnostics] Error extracting user ID from token:", error);
        return null;
    }
}

function validateParams(params: DiagnosticsParams): string | null {
    if (!params.pod_id) return "Missing required parameter: pod_id";
    if (!params.time_start) return "Missing required parameter: time_start";
    if (!params.time_end) return "Missing required parameter: time_end";
    const start = new Date(params.time_start);
    const end = new Date(params.time_end);
    if (isNaN(start.getTime())) return "Invalid time_start format";
    if (isNaN(end.getTime())) return "Invalid time_end format";
    if (end <= start) return "time_end must be after time_start";
    if (params.chunk_minutes !== undefined) {
        if (typeof params.chunk_minutes !== 'number') return "chunk_minutes must be a number";
        if (params.chunk_minutes < 1) return "chunk_minutes must be positive";
    }
    return null;
}

function getOptimalChunkSize(start: Date, end: Date, requestedChunkMinutes?: number): number {
    if (requestedChunkMinutes) return requestedChunkMinutes;
    const HOUR_IN_MS = 60 * 60 * 1000;
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / HOUR_IN_MS;
    if (durationHours > 24) return 60;
    if (durationHours > 12) return 30;
    if (durationHours > 6) return 15;
    if (durationHours > 1) return 10;
    return 5;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }
    
    const startTime = Date.now();
    const functionName = "get_ecg_diagnostics_chunked";
    let userId = extractUserIdFromToken(req.headers.get('Authorization'));
    
    try {
        if (req.method !== "POST") {
            throw new Error("Method not allowed");
        }
        
        const params: DiagnosticsParams = await req.json();
        const validationError = validateParams(params);
        if (validationError) {
            throw new Error(validationError);
        }
        
        const start = new Date(params.time_start);
        const end = new Date(params.time_end);
        
        console.log("[get-ecg-diagnostics] Request:", {
            pod_id: params.pod_id,
            time_start: params.time_start,
            time_end: params.time_end,
            chunk_minutes: params.chunk_minutes
        });
        
        // Calculate optimal chunk size
        const chunkMinutes = getOptimalChunkSize(start, end, params.chunk_minutes);
        console.log(`[get-ecg-diagnostics] Using ${chunkMinutes} minute chunks`);
        
        // Call the RPC function
        const { data, error } = await supabase.rpc(functionName, {
            p_pod_id: params.pod_id,
            p_time_start: params.time_start,
            p_time_end: params.time_end,
            p_chunk_minutes: chunkMinutes
        });
        
        // Log the function call
        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: !error,
                user_id: userId
            });
            
        if (error) {
            console.error(`[get-ecg-diagnostics] RPC error (${functionName}):`, error);
            throw error;
        }
        
        // Return the first chunk's metrics as the response
        // This matches the expected format in useECGDiagnostics
        if (data && data.length > 0) {
            return new Response(
                JSON.stringify(data[0].metrics),
                {
                    status: 200,
                    headers: corsHeaders
                }
            );
        } else {
            // Return empty metrics if no data
            return new Response(
                JSON.stringify({}),
                {
                    status: 200,
                    headers: corsHeaders
                }
            );
        }
    } catch (err) {
        console.error("[get-ecg-diagnostics] Error:", err);
        await supabase
            .from('edge_function_stats')
            .insert({
                function_name: functionName,
                execution_duration: Date.now() - startTime,
                success: false,
                error_message: err instanceof Error ? err.message : "Unknown error",
                user_id: userId
            });
        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
                code: err instanceof Error && 'code' in err ? err.code : undefined
            }),
            {
                status: err instanceof Error && err.message.includes("Missing") ? 400 : 500,
                headers: corsHeaders
            }
        );
    }
});
