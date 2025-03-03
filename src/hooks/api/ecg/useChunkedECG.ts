/**
 * FILE: src/hooks/api/ecg/useChunkedECG.ts
 * 
 * Hook for efficient ECG data loading from the downsample-ecg edge function.
 * Integrates with React Query for caching and handles the parallel array format
 * returned by the downsample_ecg function.
 */
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

// Define the sample structure expected by the application
export interface ECGSample {
  time: string;
  channels: [number, number, number];
  lead_on_p: [boolean, boolean, boolean];
  lead_on_n: [boolean, boolean, boolean];
  quality: [boolean, boolean, boolean];
}

// For backward compatibility, we still use the ECGChunk interface
export interface ECGChunk {
  chunk_start: string;
  chunk_end: string;
  samples: ECGSample[];
}

// Diagnostic chunk interface for signal quality metrics
export interface ECGDiagnosticChunk {
  chunk_start: string;
  chunk_end: string;
  metrics: {
    signal_quality: {
      noise_levels: {
        channel_1: number;
        channel_2: number;
        channel_3: number;
      };
      quality_scores: {
        channel_1: number;
        channel_2: number;
        channel_3: number;
      };
    };
    connection_stats: {
      total_samples: number;
      missing_samples: number;
      connection_drops: number;
      sampling_frequency: number;
    };
  };
}

// Parameters for the hook
interface UseECGDataParams {
  pod_id: string;
  time_start: string;
  time_end: string;
  factor?: number;
  enabled?: boolean;
}

// Interface matching the parallel arrays returned by downsample_ecg
interface ParallelArrayECGData {
  timestamps: string[];
  channel_1: number[];
  channel_2: number[];
  channel_3: number[];
  lead_on_p_1: boolean[];
  lead_on_p_2: boolean[];
  lead_on_p_3: boolean[];
  lead_on_n_1: boolean[];
  lead_on_n_2: boolean[];
  lead_on_n_3: boolean[];
  quality_1: boolean[];
  quality_2: boolean[];
  quality_3: boolean[];
}

/**
 * Hook for loading ECG data directly from the downsample-ecg edge function
 * Returns data in the same format as the previous useChunkedECG for backward compatibility
 */
export function useChunkedECG({
  pod_id,
  time_start,
  time_end,
  factor = 4,
  enabled = true
}: UseECGDataParams) {
  const queryKey = ['ecg-data', pod_id, time_start, time_end, factor];

  const {
    data,
    status,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      logger.info("[useChunkedECG] Fetching ECG data from edge function", {
        pod_id, time_start, time_end, factor
      });

      try {
        // Call the downsample-ecg edge function directly
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/downsample-ecg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            pod_id,
            time_start,
            time_end,
            factor
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Edge function returned status ${response.status}`);
        }

        const parallelData = await response.json() as ParallelArrayECGData;

        // Transform the parallel arrays into our expected ECGSample format
        const transformedSamples: ECGSample[] = [];
        
        if (parallelData.timestamps && Array.isArray(parallelData.timestamps)) {
          for (let i = 0; i < parallelData.timestamps.length; i++) {
            transformedSamples.push({
              time: parallelData.timestamps[i],
              channels: [
                parallelData.channel_1?.[i] ?? 0,
                parallelData.channel_2?.[i] ?? 0,
                parallelData.channel_3?.[i] ?? 0
              ],
              lead_on_p: [
                parallelData.lead_on_p_1?.[i] ?? false,
                parallelData.lead_on_p_2?.[i] ?? false,
                parallelData.lead_on_p_3?.[i] ?? false
              ],
              lead_on_n: [
                parallelData.lead_on_n_1?.[i] ?? false,
                parallelData.lead_on_n_2?.[i] ?? false,
                parallelData.lead_on_n_3?.[i] ?? false
              ],
              quality: [
                parallelData.quality_1?.[i] ?? false,
                parallelData.quality_2?.[i] ?? false,
                parallelData.quality_3?.[i] ?? false
              ]
            });
          }
        }
        
        // For backward compatibility, we'll create a single chunk with all samples
        const chunk: ECGChunk = {
          chunk_start: time_start,
          chunk_end: time_end,
          samples: transformedSamples
        };
        
        return [chunk];
      } catch (err) {
        logger.error("[useChunkedECG] Error fetching ECG data", { error: err });
        throw err;
      }
    },
    enabled: enabled && Boolean(pod_id && time_start && time_end),
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    staleTime: 5 * 60 * 1000 // Consider data fresh for 5 minutes
  });

  return {
    samples: data?.[0]?.samples ?? [],
    chunks: data || [],
    isLoading: status === 'pending',
    error: error instanceof Error ? error.message : null as any,
    refetch
  };
}

/**
 * Hook for loading ECG diagnostics with React Query.
 * Uses the get_ecg_diagnostics RPC function.
 */
export function useChunkedECGDiagnostics({
  pod_id,
  time_start,
  time_end,
  enabled = true
}: Omit<UseECGDataParams, 'factor'>) {
  const queryKey = ['ecg-diagnostics', pod_id, time_start, time_end];

  const {
    data,
    status,
    error,
    refetch
  } = useQuery<ECGDiagnosticChunk[], Error>({
    queryKey,
    queryFn: async () => {
      logger.info("[useChunkedECGDiagnostics] Fetching diagnostics", {
        pod_id, time_start, time_end
      });

      try {
        // Call the downsample-ecg edge function to get diagnostics
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ecg-diagnostics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            pod_id,
            time_start,
            time_end
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `Edge function returned status ${response.status}`);
        }

        const diagnosticsData = await response.json();
        return [
          {
            chunk_start: time_start,
            chunk_end: time_end,
            metrics: diagnosticsData
          }
        ] as ECGDiagnosticChunk[];
      } catch (err) {
        logger.error("[useChunkedECGDiagnostics] Error fetching diagnostics", { error: err });
        throw err;
      }
    },
    enabled: enabled && Boolean(pod_id && time_start && time_end),
    gcTime: 30 * 60 * 1000,
    staleTime: 5 * 60 * 1000
  });

  return {
    diagnostics: data || [],
    isLoading: status === 'pending',
    error: error?.message ?? null
  };
} 