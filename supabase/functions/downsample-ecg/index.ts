/**
PHASE: Edge Function
FILE: downsample-ecg/index.ts
*/
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

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

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-application-name",
    "Access-Control-Max-Age": "86400"
};

interface DownsampleParams {
    pod_id: string;
    time_start: string;
    time_end: string;
    factor?: number;
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
        console.error("[downsample-ecg] Error extracting user ID from token:", error);
        return null;
    }
}

function validateParams(params: DownsampleParams): string | null {
    if (!params.pod_id) return "Missing required parameter: pod_id";
    if (!params.time_start) return "Missing required parameter: time_start";
    if (!params.time_end) return "Missing required parameter: time_end";
    const start = new Date(params.time_start);
    const end = new Date(params.time_end);
    if (isNaN(start.getTime())) return "Invalid time_start format";
    if (isNaN(end.getTime())) return "Invalid time_end format";
    if (end <= start) return "time_end must be after time_start";
    if (params.factor !== undefined) {
        if (typeof params.factor !== 'number') return "factor must be a number";
        if (params.factor < 1 || params.factor > 20) return "factor must be between 1 and 20";
    }
    return null;
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
    const functionName = "downsample_ecg"; // Always use downsample_ecg
    let userId = extractUserIdFromToken(req.headers.get('Authorization'));
    
    try {
        if (req.method !== "POST") {
            throw new Error("Method not allowed");
        }
        
        const params: DownsampleParams = await req.json();
        const validationError = validateParams(params);
        if (validationError) {
            throw new Error(validationError);
        }
        
        const factor = params.factor ?? 4;
        console.log("[downsample-ecg] Request:", {
            pod_id: params.pod_id,
            time_start: params.time_start,
            time_end: params.time_end,
            factor: factor
        });
        
        // Always use downsample_ecg function
        const { data, error } = await supabase.rpc(functionName, {
            p_pod_id: params.pod_id,
            p_time_start: params.time_start,
            p_time_end: params.time_end,
            p_factor: factor
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
            console.error(`[downsample-ecg] RPC error (${functionName}):`, error);
            throw error;
        }
        
        return new Response(
            JSON.stringify(data),
            {
                status: 200,
                headers: corsHeaders
            }
        );
    } catch (err) {
        console.error("[downsample-ecg] Error:", err);
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