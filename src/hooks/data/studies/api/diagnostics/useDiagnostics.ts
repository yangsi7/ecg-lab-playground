// Original imports
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/data/studies/api/supabase';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/logger';
import { useDiagnosticsStore } from '@/stores/diagnostics';

// Types
type RawDiagnostics = Database['public']['Functions']['get_study_diagnostics']['Returns'][0];

// Transform function for the original study diagnostics result
const transformDiagnosticsResponse = (raw: RawDiagnostics) => ({
  qualityFractionVariability: raw.quality_fraction_variability,
  totalMinuteVariability: raw.total_minute_variability,
  interruptions: raw.interruptions,
  badHours: raw.bad_hours
});

/**
 * useDiagnostics
 * Fetches study diagnostics from the 'get_study_diagnostics' RPC.
 * Optionally fetches Edge Function stats and Database stats if requested.
 */
export function useDiagnostics(
  studyId?: string,
  fetchEdgeStats?: boolean,
  fetchDbStats?: boolean,
  edgeFunctionName?: string
) {
  const { setMetrics } = useDiagnosticsStore();

  // Query for study diagnostics
  const queryFnStudy = useCallback(async () => {
    if (!studyId) throw new Error('Study ID required');
    const { data, error } = await supabase
      .rpc('get_study_diagnostics', { p_study_id: studyId });

    if (error) {
      logger.error('Diagnostics query failed', { error });
      throw error;
    }

    // Transform and store in state
    const metrics = transformDiagnosticsResponse(data[0]);
    setMetrics(metrics);
    return metrics;
  }, [studyId, setMetrics]);

  // React Query for study diagnostics
  const studyDiagnosticsQuery = useQuery({
    queryKey: ['diagnostics', studyId],
    queryFn: queryFnStudy,
    enabled: !!studyId,
    staleTime: 60_000 // 1 minute cache
  });

  // Optional: Query for edge function stats
  const edgeFunctionStatsQuery = useQuery({
    queryKey: ['edgeFunctionStats', edgeFunctionName],
    queryFn: async () => {
      if (!fetchEdgeStats) return null;
      // Example date range for demonstration purposes
      const timeStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const timeEnd = new Date().toISOString();

      const { data, error } = await supabase.rpc('get_edge_function_stats', {
        p_function_name: edgeFunctionName ?? undefined,
        p_time_start: timeStart,
        p_time_end: timeEnd
      });
      if (error) {
        logger.error('Edge stats query failed', { error });
        throw error;
      }
      logger.debug('Edge function stats data', { data });
      return data;
    },
    enabled: !!fetchEdgeStats,
    staleTime: 60_000
  });

  // Optional: Query for database stats
  const databaseStatsQuery = useQuery({
    queryKey: ['databaseStats'],
    queryFn: async () => {
      if (!fetchDbStats) return null;
      const { data, error } = await supabase.rpc('get_database_stats');
      if (error) {
        logger.error('Database stats query failed', { error });
        throw error;
      }
      logger.debug('Database stats data', { data });
      return data;
    },
    enabled: !!fetchDbStats,
    staleTime: 60_000
  });

  return {
    studyDiagnosticsQuery,
    edgeFunctionStatsQuery,
    databaseStatsQuery
  };
}