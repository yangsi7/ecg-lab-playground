import { useQuery } from '@tanstack/react-query';
import { useRPC } from './core/useRPC';
import type { Database } from '../../types/database.types';
import type { EdgeFunctionStats, DatabaseStatsRPC } from '../../types/utils';

export function useDiagnostics() {
  const { callRPC } = useRPC();

  const { data: databaseStats, error: dbError } = useQuery({
    queryKey: ['database-stats'],
    queryFn: () => callRPC('get_database_stats'),
    refetchInterval: 5000
  });

  const { data: edgeFunctionStats, error: edgeError } = useQuery({
    queryKey: ['edge-function-stats'],
    queryFn: async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return callRPC('get_edge_function_stats', {
        p_function_name: 'downsample-ecg',
        p_time_start: hourAgo.toISOString(),
        p_time_end: now.toISOString()
      });
    },
    refetchInterval: 60000
  });

  return {
    databaseStats: databaseStats as DatabaseStatsRPC[] | undefined,
    edgeFunctionStats: edgeFunctionStats as EdgeFunctionStats[] | undefined,
    error: dbError || edgeError
  };
} 