/**
 * Hook for fetching and managing diagnostic data
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import { useRPC } from '@/hooks/api/core';

import { useEffect, useState } from 'react';
import type { EdgeFunctionStats, DatabaseStatsRPC, RPCMetrics, SystemMetrics } from '@/types'
import { logger } from '@/lib/logger';

export interface DiagnosticsResult {
  edgeFunctionStats: EdgeFunctionStats[];
  databaseStats: DatabaseStatsRPC[];
  rpcMetrics: RPCMetrics[];
  systemMetrics: SystemMetrics | null;
  lastRPCCalls: RPCCall[];
  connectionErrors: ConnectionError[];
  isLoading: boolean;
  error: Error | null;
}

export interface ConnectionError {
  message: string;
  timestamp: string;
  details?: string;
}

export interface RPCCall {
  function: string;
  timestamp: string;
  duration: number;
  error?: string;
  params?: Record<string, unknown>;
}

function extractTableName(query: string | null, index: number): string {
  if (!query) return `unknown-${index}`;
  try {
    // Remove any subqueries first
    const cleanQuery = query.replace(/\(([^()]+|\(([^()]+|\([^()]*\))*\))*\)/g, '');
    
    // Try to extract table name from SQL query
    const words = cleanQuery.split(' ');
    const fromIndex = words.findIndex(word => word.toLowerCase() === 'from');
    if (fromIndex >= 0 && words[fromIndex + 1]) {
      const tableName = words[fromIndex + 1].replace(/[";]/g, '').split('.').pop() || '';
      return tableName.toLowerCase() === 'select' ? `complex-query-${index}` : tableName;
    }
    return `unknown-${index}`;
  } catch (err) {
    logger.warn('Failed to extract table name from query', { query });
    return `unknown-${index}`;
  }
}

export function useDiagnostics(): DiagnosticsResult {
  const queryClient = useQueryClient();
  const { callRPC } = useRPC();
  
  // Use constants instead of state since we don't update these values
  const lastRPCCalls: RPCCall[] = [];
  const connectionErrors: ConnectionError[] = [];

  // Set up realtime subscription for edge function stats
  useEffect(() => {
    const subscription = supabase
      .channel('diagnostics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'edge_function_stats' }, () => {
        queryClient.invalidateQueries({ queryKey: ['diagnostics', 'edge-functions'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Fetch edge function stats
  const edgeFunctionQuery = useQuery({
    queryKey: ['diagnostics', 'edge-functions'],
    queryFn: async () => {
      try {
        // Use callRPC instead of supabase.rpc
        const data = await callRPC('get_edge_function_stats', {}, {
          component: 'useDiagnostics',
          context: { query: 'edge-functions' }
        });

        // Validate and transform data
        if (!Array.isArray(data)) {
          logger.error('Invalid edge function stats data', { data });
          return [];
        }

        // The RPC function already provides aggregated stats, so we can use it directly
        return data.map(stat => ({
          function_name: stat.function_name,
          total_invocations: stat.total_invocations,
          average_duration_ms: stat.average_duration_ms,
          last_invocation: stat.last_invocation,
          success_rate: stat.success_rate,
          error_count: Math.round(stat.total_invocations * (1 - (stat.success_rate / 100))),
          memory_usage: stat.memory_usage,
          cpu_time: stat.cpu_time,
          peak_concurrent_executions: stat.peak_concurrent_executions
        }));
      } catch (error) {
        logger.error('Failed to fetch edge function stats', { error });
        throw error;
      }
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch database stats
  const databaseQuery = useQuery({
    queryKey: ['diagnostics', 'database'],
    queryFn: async () => {
      try {
        // Use callRPC instead of supabase.rpc
        const data = await callRPC('get_database_stats', {}, {
          component: 'useDiagnostics',
          context: { query: 'database' }
        });

        if (!Array.isArray(data)) {
          logger.error('Invalid database stats data', { data });
          return [];
        }

        // Transform into our expected format
        return data.map((row, index) => ({
          table_name: extractTableName(row.query, index),
          row_count: row.avg_rows || 0,
          last_vacuum: new Date().toISOString(), // Not available in stats
          size_bytes: 0, // Not available in stats
          index_size_bytes: 0, // Not available in stats
          cache_hit_ratio: row.hit_rate || 0,
          query_id: `${row.query || 'unknown'}-${index}` // Add a unique identifier
        }));
      } catch (error) {
        logger.error('Failed to fetch database stats', { error });
        throw error;
      }
    },
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Fetch RPC metrics
  const rpcQuery = useQuery({
    queryKey: ['diagnostics', 'rpc'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('rpc_call_info')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) throw error;

        if (!Array.isArray(data)) {
          logger.error('Invalid RPC metrics data', { data });
          return [];
        }

        // Group by function name and calculate stats
        const rpcStats = new Map<string, RPCMetrics>();
        data.forEach(row => {
          const stats = rpcStats.get(row.function_name) || {
            function_name: row.function_name,
            total_calls: 0,
            average_duration_ms: 0,
            error_rate: 0,
            cache_hit_ratio: 0
          };

          stats.total_calls++;
          if (row.status === 'error') {
            stats.error_rate = (stats.error_rate * (stats.total_calls - 1) + 100) / stats.total_calls;
          }

          rpcStats.set(row.function_name, stats);
        });

        return Array.from(rpcStats.values());
      } catch (error) {
        logger.error('Failed to fetch RPC metrics', { error });
        throw error;
      }
    },
    staleTime: 30000,
  });

  // Calculate system metrics from edge function stats
  const systemQuery = useQuery({
    queryKey: ['diagnostics', 'system'],
    queryFn: async () => {
      try {
        const { data: edgeFunctionData, error } = await supabase
          .from('edge_function_stats')
          .select('memory_usage,cpu_time')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (!Array.isArray(edgeFunctionData) || edgeFunctionData.length === 0) {
          return null;
        }

        // Calculate averages
        let totalMemory = 0;
        let totalCpu = 0;
        let validMemoryCount = 0;
        let validCpuCount = 0;

        edgeFunctionData.forEach(row => {
          if (row.memory_usage !== null) {
            totalMemory += row.memory_usage;
            validMemoryCount++;
          }
          if (row.cpu_time !== null && typeof row.cpu_time === 'number') {
            totalCpu += row.cpu_time;
            validCpuCount++;
          }
        });

        return {
          cpu_usage: validCpuCount > 0 ? totalCpu / validCpuCount : 0,
          memory_usage: validMemoryCount > 0 ? totalMemory / validMemoryCount : 0,
          disk_usage: 0, // Not available
          network_latency_ms: 0, // Not available
          active_connections: 0 // Not available
        };
      } catch (error) {
        logger.error('Failed to fetch system metrics', { error });
        throw error;
      }
    },
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  // Combine all results
  return {
    edgeFunctionStats: edgeFunctionQuery.data ?? [],
    databaseStats: databaseQuery.data ?? [],
    rpcMetrics: rpcQuery.data ?? [],
    systemMetrics: systemQuery.data ?? null,
    lastRPCCalls,
    connectionErrors,
    isLoading: edgeFunctionQuery.isLoading || databaseQuery.isLoading || rpcQuery.isLoading || systemQuery.isLoading,
    error: edgeFunctionQuery.error || databaseQuery.error || rpcQuery.error || systemQuery.error,
  };
}
