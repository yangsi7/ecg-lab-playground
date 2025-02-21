import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/supabase';
import { logger } from '@/lib/logger';
import { ECGData, ECGQueryOptions, toECGData } from '../../types/domain/ecg';
import type { ECGSampleRow } from '../../lib/supabase/client';

/**
 * useECGData
 * - Uses Supabase Edge Function to fetch downsampled ECG data
 */
export function useECGData(options: ECGQueryOptions) {
  const [data, setData] = useState<ECGData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { pod_id, time_start, time_end, max_pts = 2000 } = {
    pod_id: options.podId,
    time_start: options.timeStart,
    time_end: options.timeEnd,
    max_pts: options.maxPoints
  };

  // Prepare request body once
  const requestBody = useMemo(() => ({
    pod_id,
    time_start,
    time_end,
    max_pts
  }), [pod_id, time_start, time_end, max_pts]);

  const fetchECG = useCallback(async () => {
    // If missing required fields => skip
    if (!pod_id || !time_start || !time_end) {
      setError("Missing pod_id or time range");
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
      logger.info("useECGData: requesting ECG data from downsample-ecg function", requestBody);

      const { data: json, error: fnError } = await supabase.functions.invoke('downsample-ecg', {
        body: requestBody,
      });

      if (fnError) {
        throw fnError;
      }

      if (!Array.isArray(json)) {
        throw new Error("Downsample ECG response is not an array");
      }

      // Transform raw data to domain type and sort by time ascending
      const ecgData = json.map(toECGData).sort(
        (a, b) => new Date(a.sample_time).getTime() - new Date(b.sample_time).getTime()
      );

      logger.info(`useECGData: loaded ${ecgData.length} points.`, { pod_id, timeRange: [time_start, time_end] });

      setData(ecgData);
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
  }, [requestBody, pod_id, time_start, time_end]);

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
