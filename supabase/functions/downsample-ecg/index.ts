/**
 * FILE: downsample-ecg/index.ts
 * 
 * Now expects "factor" from the request body, 
 * passes as p_factor to the DB function.
 */
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import {
    createClient,
    SupabaseClient
} from "https://esm.sh/@supabase/supabase-js@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-application-name",
    "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const { pod_id, time_start, time_end, factor } = await req.json();

        console.log("[downsample-ecg] Received:", { pod_id, time_start, time_end, factor });

        if (!pod_id || !time_start || !time_end) {
            return new Response(JSON.stringify({
                error: "Missing required parameters (pod_id, time_start, time_end)"
            }), { status: 400, headers: corsHeaders });
        }

        // Call DB function with p_factor
        const { data, error } = await supabase.rpc("downsample_ecg", {
            p_pod_id: pod_id,
            p_time_start: time_start,
            p_time_end: time_end,
            p_factor: factor
        });

        if (error) {
            console.error("[downsample-ecg] RPC error:", error.message);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400, headers: corsHeaders
            });
        }

        return new Response(JSON.stringify(data), {
            status: 200, headers: corsHeaders
        });
    } catch (err) {
        const msg = (err instanceof Error) ? err.message : "Unknown error";
        return new Response(JSON.stringify({ error: msg }), {
            status: 500, headers: corsHeaders
        });
    }
});
