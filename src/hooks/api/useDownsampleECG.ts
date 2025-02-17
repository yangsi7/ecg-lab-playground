/**
 * FILE: src/hooks/useDownsampleECG.ts
 * 
 * Now calls the Edge Function with "factor" 
 * instead of "max_pts." Picks every factor-th sample.
 * Factor is clamped in the DB function to [1..3].
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

export interface DownsamplePoint {
    sample_time: string;
    downsampled_channel_1: number;
    downsampled_channel_2: number;
    downsampled_channel_3: number;
    lead_on_p_1: boolean;
    lead_on_p_2: boolean;
    lead_on_p_3: boolean;
    lead_on_n_1: boolean;
    lead_on_n_2: boolean;
    lead_on_n_3: boolean;
    quality_1: boolean;
    quality_2: boolean;
    quality_3: boolean;
}

interface UseDownsampleParams {
    pod_id: string;
    time_start: string;  // ISO
    time_end: string;    // ISO
    overrideFactor?: number;  // user sets factor 1..3
}

/**
 * Picks every 'factor'-th row from ecg_sample, 
 * as defined by the new naive approach.
 */
export function useDownsampleECG({
    pod_id,
    time_start,
    time_end,
    overrideFactor
}: UseDownsampleParams) {
    const [data, setData] = useState<DownsamplePoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;

        if (!pod_id || !time_start || !time_end) {
            setData([]);
            setError(null);
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);
            setError(null);

            try {
                // If overrideFactor is undefined, default to 1 => pick every row
                // If user tries factor>3, server will clamp it to 3
                const factor = overrideFactor && overrideFactor > 0 ? overrideFactor : 1;

                logger.info("[useDownsampleECG] calling factor-based decimation", {
                    pod_id, time_start, time_end, factor
                });

                const { data: result, error: fnError } = await supabase.functions.invoke('downsample-ecg', {
                    body: {
                        pod_id,
                        time_start,
                        time_end,
                        factor
                    }
                });

                if (canceled) return;
                if (fnError) throw new Error(fnError.message);
                if (!Array.isArray(result)) {
                    throw new Error("Downsample ECG did not return an array.");
                }

                setData(result);
            } catch (err: any) {
                if (!canceled) {
                    logger.error("useDownsampleECG error", err);
                    setError(err.message || "Failed to decimate ECG data");
                    setData([]);
                }
            } finally {
                if (!canceled) {
                    setLoading(false);
                }
            }
        })();

        return () => { canceled = true; };
    }, [pod_id, time_start, time_end, overrideFactor]);

    return { data, loading, error };
}
