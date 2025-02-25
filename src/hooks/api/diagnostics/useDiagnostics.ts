/**
 * Hook for fetching and managing diagnostic data
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
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
/*************  ✨ Codeium Command ⭐  *************/
  /**
   * Fetches the latest edge function stats from the database,
   * groups the data by function name, and calculates the
   * total invocations, average duration, success rate, and
   * last invocation time for each function.
   * @returns An array of EdgeFunctionStats objects, each
   * representing a distinct edge function.
   */
/******  8b7e3efc-9eaf-4610-94a5-8484f2ccdb90  *******/    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Validate and transform data
      if (!Array.isArray(data)) {
        logger.error('Invalid edge function stats data', { data });
        return [];
      }

      // Group by function name and calculate stats
      const functionStats = new Map<string, EdgeFunctionStats>();
      data.forEach(row => {
        const stats = functionStats.get(row.function_name) || {
          function_name: row.function_name,
          total_invocations: 0,
          average_duration_ms: 0,
          last_invocation: row.created_at,
          success_rate: 0,
          error_count: 0
        };

        stats.total_invocations++;
        if (row.execution_duration) {
          stats.average_duration_ms = (stats.average_duration_ms * (stats.total_invocations - 1) + Number(row.execution_duration)) / stats.total_invocations;
        }
        if (!row.success) {
          stats.error_count++;
        }
        stats.success_rate = ((stats.total_invocations - stats.error_count) / stats.total_invocations) * 100;

        functionStats.set(row.function_name, stats);
      });

      return Array.from(functionStats.values());
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch database stats
  const databaseQuery = useQuery({
    queryKey: ['diagnostics', 'database'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_database_stats');

      if (error) throw error;

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
    },
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Fetch RPC metrics
  const rpcQuery = useQuery({
    queryKey: ['diagnostics', 'rpc'],
    queryFn: async () => {
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
    },
    staleTime: 30000,
  });

  // Calculate system metrics from edge function stats
  const systemQuery = useQuery({
    queryKey: ['diagnostics', 'system'],
    queryFn: async () => {
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
