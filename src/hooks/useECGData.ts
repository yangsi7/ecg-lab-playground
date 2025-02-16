import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '../lib/logger';

/**
 * ECGData
 * Represents the final wave data from the Edge Function "downsample-ecg" or a similar endpoint.
 */
export interface ECGData {
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

interface ECGQueryOptions {
  podId: string;
  timeStart: string;
  timeEnd: string;
  maxPoints?: number;
}

/**
 * useECGData
 * - Performs a fetch directly to the Edge Function via a fetch POST request.
 * - Example usage: if you want more direct control vs. supabase.functions.invoke
 */
export function useECGData(options: ECGQueryOptions) {
  const [data, setData] = useState<ECGData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { podId, timeStart, timeEnd, maxPoints = 2000 } = options;

  // Prepare request body once
  const requestBody = useMemo(() => ({
    pod_id: podId,
    time_start: timeStart,
    time_end: timeEnd,
    max_pts: maxPoints
  }), [podId, timeStart, timeEnd, maxPoints]);

  const fetchECG = useCallback(async () => {
    // If missing required fields => skip
    if (!podId || !timeStart || !timeEnd) {
      setError("Missing podId or time range");
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);

    // Cancel existing
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      logger.info("useECGData: requesting ECG data (fetch) from downsample-ecg function", requestBody);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/downsample-ecg`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Possibly also pass an Auth bearer if needed:
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(requestBody),
          signal: abortRef.current.signal
        }
      );

      if (!resp.ok) {
        throw new Error(`HTTP error from Edge Function: ${resp.status}`);
      }

      const json = await resp.json();
      if (!Array.isArray(json)) {
        throw new Error("Downsample ECG response is not an array");
      }

      // Sort data by time ascending
      json.sort(
        (a: ECGData, b: ECGData) =>
          new Date(a.sample_time).getTime() - new Date(b.sample_time).getTime()
      );

      logger.info(`useECGData: loaded ${json.length} points.`, { podId, timeRange: [timeStart, timeEnd] });

      setData(json);
    } catch (err: any) {
      if (err.name === "AbortError") {
        logger.info("useECGData: fetch aborted");
        return;
      }
      logger.error("useECGData: fetch error", err);
      setError(err.message || "Failed to load ECG data");
    } finally {
      setLoading(false);
    }
  }, [requestBody, podId, timeStart, timeEnd]);

  useEffect(() => {
    fetchECG();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchECG]);

  return { data, loading, error };
}
