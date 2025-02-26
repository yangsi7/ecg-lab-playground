// src/hooks/usePodEarliestLatest.ts
import { useQuery } from '@tanstack/react-query';
import { useRPC } from '@/hooks/api/core';
import { logger } from '@/lib/logger';

interface PodTimeRow {
  earliest_time: string | null;
  latest_time: string | null;
}

/**
 * Queries get_pod_earliest_latest(p_pod_id) from Supabase
 * Uses React Query for data fetching and caching
 */
export function usePodEarliestLatest(podId: string | null): {
  earliest_time: Date | null;
  latest_time: Date | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { callRPC } = useRPC();
  
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['pod-earliest-latest', podId],
    queryFn: async () => {
      if (!podId) {
        return { earliest_time: null, latest_time: null };
      }
      
      logger.debug('Fetching earliest/latest times for pod', { podId });
      
      try {
        const data = await callRPC('get_pod_earliest_latest', {
          p_pod_id: podId
        }, {
          component: 'usePodEarliestLatest',
          context: { podId }
        });
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          return { earliest_time: null, latest_time: null };
        }
        
        const row = data[0] as PodTimeRow;
        return {
          earliest_time: row.earliest_time ? new Date(row.earliest_time) : null,
          latest_time: row.latest_time ? new Date(row.latest_time) : null
        };
      } catch (error) {
        logger.error('Failed to fetch pod times', { error, podId });
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    enabled: !!podId,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  });
  
  const error = queryError instanceof Error ? queryError.message : null;
  
  return { 
    earliest_time: data?.earliest_time || null,
    latest_time: data?.latest_time || null,
    loading, 
    error,
    refetch
  };
}
