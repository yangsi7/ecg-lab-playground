/**
 * FILE: src/hooks/api/useChunkedECG.ts
 * 
 * Hook for efficient ECG data loading using chunked retrieval.
 * Integrates with React Query for caching and uses the new
 * downsample_ecg_chunked function.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/supabase';
import { logger } from '@/lib/logger';
import type { ECGData } from '@/types/domain/ecg';
import { toECGData } from '@/types/domain/ecg';

export interface ECGSample {
  time: string;
  channels: [number, number, number];
  lead_on_p: [boolean, boolean, boolean];
  lead_on_n: [boolean, boolean, boolean];
  quality: [boolean, boolean, boolean];
}

export interface ECGChunk {
  chunk_start: string;
  chunk_end: string;
  samples: ECGSample[];
}

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

interface UseChunkedECGParams {
  pod_id: string;
  time_start: string;
  time_end: string;
  factor?: number;
  chunk_minutes?: number;
  enabled?: boolean;
}

/**
 * Hook for loading ECG data in chunks with React Query infinite scroll support.
 * Uses the optimized downsample_ecg_chunked function.
 */
export function useChunkedECG({
  pod_id,
  time_start,
  time_end,
  factor = 4,
  chunk_minutes = 5,
  enabled = true
}: UseChunkedECGParams) {
  const queryKey = ['ecg-chunks', pod_id, time_start, time_end, factor, chunk_minutes];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery<ECGChunk[], Error>({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      logger.info("[useChunkedECG] fetching chunk", {
        pod_id, time_start, time_end, factor, chunk_minutes, offset: pageParam
      });

      // @ts-ignore - RPC function exists but types are not up to date
      const { data: chunks, error: rpcError } = await supabase.rpc(
        'downsample_ecg_chunked',
        {
          p_pod_id: pod_id,
          p_time_start: time_start,
          p_time_end: time_end,
          p_factor: factor,
          p_chunk_minutes: chunk_minutes,
          p_offset: pageParam,
          p_limit: 5 // Get 5 chunks at a time (25 minutes of data)
        }
      );

      if (rpcError) throw new Error(rpcError.message);
      return chunks as ECGChunk[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got a full page, there might be more
      if (lastPage.length === 5) {
        return allPages.length * 5; // Next offset
      }
      return undefined; // No more pages
    },
    enabled: enabled && Boolean(pod_id && time_start && time_end),
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    staleTime: 5 * 60 * 1000 // Consider data fresh for 5 minutes
  });

  // Flatten all chunks into a single array for easier consumption
  const samples = data?.pages.flatMap(chunks => 
    chunks.flatMap(chunk => chunk.samples)
  ) ?? [];

  return {
    samples,
    chunks: data?.pages.flat() ?? [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: status === 'pending',
    error: error?.message ?? null
  };
}

/**
 * Hook for loading ECG diagnostics in chunks with React Query.
 * Uses the optimized get_ecg_diagnostics_chunked function.
 */
export function useChunkedECGDiagnostics({
  pod_id,
  time_start,
  time_end,
  chunk_minutes = 5,
  enabled = true
}: Omit<UseChunkedECGParams, 'factor'>) {
  const queryKey = ['ecg-diagnostics', pod_id, time_start, time_end, chunk_minutes];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery<ECGDiagnosticChunk[], Error>({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      logger.info("[useChunkedECGDiagnostics] fetching chunk", {
        pod_id, time_start, time_end, chunk_minutes, offset: pageParam
      });

      // @ts-ignore - RPC function exists but types are not up to date
      const { data: chunks, error: rpcError } = await supabase.rpc(
        'get_ecg_diagnostics_chunked',
        {
          p_pod_id: pod_id,
          p_time_start: time_start,
          p_time_end: time_end,
          p_chunk_minutes: chunk_minutes,
          p_offset: pageParam,
          p_limit: 5
        }
      );

      if (rpcError) throw new Error(rpcError.message);
      return chunks as ECGDiagnosticChunk[];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 5) {
        return lastPage.length;
      }
      return undefined;
    },
    enabled: enabled && Boolean(pod_id && time_start && time_end),
    gcTime: 30 * 60 * 1000,
    staleTime: 5 * 60 * 1000
  });

  return {
    diagnostics: data?.pages.flat() ?? [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: status === 'pending',
    error: error?.message ?? null
  };
} 