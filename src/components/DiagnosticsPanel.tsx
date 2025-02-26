/**
 * DiagnosticsPanel.tsx
 *
 * A real-time diagnostics panel showing:
 * - Edge function performance
 * - Database stats (query performance from "get_database_stats")
 * - RPC metrics
 * - System metrics
 * - Connection status
 * - Detailed error tracking
 * - Real-time query monitoring with parameters and timing
 */
import { Activity, Database, Zap, Cpu, AlertTriangle, Wifi, FileSignature, SearchIcon, Clock, XCircle, BarChart2 } from 'lucide-react';
import { supabase } from '@/hooks';
import { useDiagnostics } from '@/hooks/api/diagnostics/useDiagnostics';
import { useECGQueryTracker } from '@/hooks/api/diagnostics/useECGQueryTracker';
import { useQueryLogger } from '@/hooks/api/diagnostics/useQueryLogger';
import { useStudyDiagnostics } from '@/hooks/api/study/useStudyDiagnostics';
import type { 
  ConnectionError,
  RPCCall
} from '@/hooks/api/diagnostics/useDiagnostics';
import type { EdgeFunctionStats, DatabaseStatsRPC, RPCMetrics } from '@/types';
import { useEffect, useState } from 'react';

/**
 * Local types for debugging panel
 */
interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
}

interface DiagnosticsPanelProps {
  className?: string;
}

/**
 * In the updated useDiagnostics hook, we return:
 * {
 *   studyDiagnosticsQuery,   // UseQueryResult<StudyDiagnostics, Error>
 *   edgeFunctionStatsQuery,  // UseQueryResult<EdgeFunctionStat[], Error>
 *   databaseStatsQuery,      // UseQueryResult<DatabasePerfStat[], Error>
 *   // optionally: systemMetricsQuery? (UseQueryResult<SystemMetrics, Error>)
 * }
 * 
 * For now, we handle systemMetrics as a placeholder. 
 * We'll define it manually to avoid TS "never" errors.
 */
export default function DiagnosticsPanel({ className = '' }: DiagnosticsPanelProps) {
  // Destructure the query objects from the hook
  const {
    edgeFunctionStats,
    databaseStats,
    rpcMetrics,
    systemMetrics,
    lastRPCCalls,
    connectionErrors,
    isLoading,
    error
  } = useDiagnostics();

  // Get ECG query tracking data
  const { queries: ecgQueries } = useECGQueryTracker();

  // Get detailed query tracking data
  const { queries: dbQueries, stats: queryStats } = useQueryLogger();

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastChecked: new Date()
  });

  // Add the study diagnostics hook - use the current study if available
  // This would typically come from a route param or context
  const urlParams = new URLSearchParams(window.location.search);
  const studyIdParam = urlParams.get('studyId') || urlParams.get('study_id');
  const { data: studyDiagnostics, isLoading: studyDiagnosticsLoading } = useStudyDiagnostics(studyIdParam || undefined);

  // Check Supabase connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('clinics').select('count').limit(1);
        setConnectionStatus({
          isConnected: !error,
          lastChecked: new Date(),
          error: error?.message
        });
      } catch (err) {
        setConnectionStatus({
          isConnected: false,
          lastChecked: new Date(),
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <aside className={`w-full md:w-96 border-l border-white/10 p-4 bg-gray-900/50 overflow-y-auto ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className={`w-full md:w-96 border-l border-white/10 p-4 bg-gray-900/50 overflow-y-auto ${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-red-400">Error loading diagnostics</h3>
          <p className="mt-1 text-sm text-red-300">{error.message}</p>
        </div>
      </aside>
    );
  }

  // Format the database duration in a human readable way
  const formatDuration = (ms: number): string => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <aside className={`w-full md:w-96 border-l border-white/10 p-4 bg-gray-900/50 overflow-y-auto ${className}`}>
      <h2 className="text-lg font-semibold text-white mb-4">Diagnostics</h2>
      <div className="space-y-4">
        {/* Connection Status */}
        <div
          className={`rounded-xl p-4 ${
            connectionStatus.isConnected ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wifi
              className={`h-5 w-5 ${
                connectionStatus.isConnected ? 'text-green-400' : 'text-red-400'
              }`}
            />
            <h3 className="font-medium text-white">Connection Status</h3>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-sm">
              <span
                className={
                  connectionStatus.isConnected ? 'text-green-400' : 'text-red-400'
                }
              >
                {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-gray-400 text-xs ml-2">
                Last checked: {connectionStatus.lastChecked.toLocaleTimeString()}
              </span>
            </div>
            {connectionStatus.error && (
              <div className="text-xs text-red-400">
                Error: {connectionStatus.error}
              </div>
            )}
          </div>
        </div>

        {/* Query Monitor (NEW) */}
        <div className="bg-purple-500/10 rounded-xl p-4 space-y-2 border border-purple-500/20">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium text-white">Live Query Monitor</h3>
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-300">
              <Clock className="h-3 w-3" />
              <span>Avg: {formatDuration(queryStats.avgDuration)}</span>
            </div>
          </div>
          
          {/* Query Stats */}
          <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">Queries</div>
              <div className="text-lg font-semibold text-white">{queryStats.totalQueries}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">Error Rate</div>
              <div className={`text-lg font-semibold ${queryStats.errorRate > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {queryStats.errorRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">Slowest</div>
              <div className="text-lg font-semibold text-yellow-400">
                {queryStats.slowestQuery ? formatDuration(queryStats.slowestQuery.duration) : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Recent Queries */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dbQueries.slice(0, 8).map((query, idx) => (
              <div 
                key={`${query.tableName}-${idx}`} 
                className={`text-sm rounded-lg p-2 ${
                  !query.success ? 'bg-red-500/10 border border-red-500/30' : 
                  query.duration > 500 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  'bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1">
                    {query.operation === 'rpc' ? (
                      <Activity className="h-4 w-4 text-blue-400" />
                    ) : query.operation === 'query' ? (
                      <Database className="h-4 w-4 text-green-400" />
                    ) : query.operation === 'insert' ? (
                      <BarChart2 className="h-4 w-4 text-purple-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="font-mono text-gray-300">
                      {query.tableName}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs font-mono ${
                      query.duration > 500 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {formatDuration(query.duration)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(query.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                {/* Parameters (collapsible) */}
                <div className="mt-1 text-xs">
                  <div className="flex gap-1 items-center text-gray-400">
                    <span>Params:</span>
                    <code className="text-xs font-mono text-gray-500 bg-black/30 p-1 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">
                      {query.params ? JSON.stringify(query.params, null, 2) : 'none'}
                    </code>
                  </div>
                </div>
                
                {/* Show errors if any */}
                {query.error ? (
                  <div className="mt-1 text-xs text-red-400 bg-red-500/10 p-1 rounded">
                    {String(query.error)}
                  </div>
                ) : null}
                
                {/* Result snippet if available */}
                {query.result && (
                  <div className="mt-1 text-xs text-gray-400">
                    <span>Result: </span>
                    <span className="text-gray-500">
                      {typeof query.result === 'object' 
                        ? JSON.stringify(query.result).substring(0, 50) + (JSON.stringify(query.result).length > 50 ? '...' : '')
                        : String(query.result).substring(0, 50) + (String(query.result).length > 50 ? '...' : '')
                      }
                    </span>
                  </div>
                )}
              </div>
            ))}

            {dbQueries.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-2">
                No queries tracked yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Connection Errors */}
        {connectionErrors.length > 0 && (
          <div className="bg-red-500/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="font-medium text-white">Recent Connection Errors</h3>
            </div>
            <div className="space-y-2">
              {connectionErrors.map((err: ConnectionError, index: number) => (
                <div key={index} className="text-sm text-red-300 bg-red-500/5 rounded p-2">
                  <div className="flex items-start justify-between">
                    <span>{err.message}</span>
                    <span className="text-xs text-red-400">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {err.details && (
                    <div className="text-xs text-red-400 mt-1">{err.details}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last RPC Calls */}
        {lastRPCCalls.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white">Last RPC Calls</h3>
            </div>
            <div className="space-y-2">
              {lastRPCCalls.map((call: RPCCall, index: number) => (
                <div
                  key={index}
                  className={`text-sm rounded p-2 ${
                    call.error ? 'bg-red-500/10' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-gray-300">{call.function}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {call.error ? (
                    <div className="text-xs text-red-400 mt-1">{call.error}</div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">
                      Duration: {call.duration}ms
                    </div>
                  )}
                  {call.params && (
                    <div className="text-xs text-gray-500 mt-1">
                      Params: {JSON.stringify(call.params)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edge Functions */}
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">Edge Functions</h3>
          </div>
          <div className="space-y-2">
            {edgeFunctionStats.map((stat: EdgeFunctionStats) => (
              <div key={stat.function_name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{stat.function_name}</span>
                  <span className="text-gray-400">{stat.total_invocations} calls</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Avg: {stat.average_duration_ms.toFixed(2)}ms</span>
                  <span>Success: {stat.success_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Last call: {new Date(stat.last_invocation).toLocaleTimeString()}</span>
                  <span>Errors: {stat.error_count ?? 0}</span>
                </div>
                {/* Success rate bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stat.success_rate > 90
                        ? 'bg-green-400'
                        : stat.success_rate > 70
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${stat.success_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Stats (from get_database_stats) */}
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">Database Stats</h3>
          </div>
          <div className="space-y-2">
            {databaseStats.map((stat: DatabaseStatsRPC, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{stat.table_name}</span>
                  <span className="text-gray-400">
                    {stat.row_count !== null ? `${stat.row_count} rows` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Size:{' '}
                    {stat.size_bytes ? (stat.size_bytes / 1024).toFixed(1) + ' KB' : 'N/A'}
                  </span>
                  {stat.cache_hit_ratio !== null && (
                    <span>Cache Hit: {(stat.cache_hit_ratio * 100).toFixed(1)}%</span>
                  )}
                </div>
                {/* If we want, show a small bar for the hit rate */}
                {stat.cache_hit_ratio !== null && (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stat.cache_hit_ratio > 0.9
                          ? 'bg-green-400'
                          : stat.cache_hit_ratio > 0.7
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${stat.cache_hit_ratio * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RPC Metrics */}
        {rpcMetrics.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white">RPC Metrics</h3>
            </div>
            <div className="space-y-2">
              {rpcMetrics.map((metric: RPCMetrics) => (
                <div key={metric.function_name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{metric.function_name}</span>
                    <span className="text-gray-400">{metric.total_calls} calls</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avg: {metric.average_duration_ms.toFixed(2)}ms</span>
                    <span>
                      Cache Hit: {(metric.cache_hit_ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Error Rate: {metric.error_rate.toFixed(1)}%</span>
                  </div>
                  {/* Error rate bar (inverted) */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        metric.error_rate < 1
                          ? 'bg-green-400'
                          : metric.error_rate < 5
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${100 - metric.error_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Metrics */}
        {systemMetrics && (
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white">System Metrics</h3>
            </div>
            <div className="space-y-2">
              {/* CPU Usage */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">CPU Usage</span>
                  <span className="text-gray-400">
                    {systemMetrics.cpu_usage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      systemMetrics.cpu_usage < 50
                        ? 'bg-green-400'
                        : systemMetrics.cpu_usage < 80
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${systemMetrics.cpu_usage}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Memory Usage</span>
                  <span className="text-gray-400">
                    {(systemMetrics.memory_usage / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      systemMetrics.memory_usage < 256 * 1024 * 1024
                        ? 'bg-green-400'
                        : systemMetrics.memory_usage < 384 * 1024 * 1024
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{
                      width: `${
                        (systemMetrics.memory_usage / (512 * 1024 * 1024)) * 100
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* Network Latency */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Network Latency</span>
                  <span className="text-gray-400">
                    {systemMetrics.network_latency_ms}ms
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      systemMetrics.network_latency_ms < 100
                        ? 'bg-green-400'
                        : systemMetrics.network_latency_ms < 300
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        (systemMetrics.network_latency_ms / 500) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Active Connections */}
              <div className="flex justify-between text-sm text-gray-400">
                <span>Active Connections</span>
                <span>{systemMetrics.active_connections}</span>
              </div>
            </div>
          </div>
        )}

        {/* Study Diagnostics */}
        {studyIdParam && (
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white">Study Diagnostics</h3>
              {studyDiagnosticsLoading ? (
                <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
              ) : null}
            </div>
            {studyDiagnostics ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Study ID</span>
                  <span className="text-gray-400 truncate max-w-[150px]">{studyDiagnostics.study_id}</span>
                </div>
                
                {/* Quality Fraction Variability */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Quality Variability</span>
                    <span className="text-gray-400">
                      {(studyDiagnostics.quality_fraction_variability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        studyDiagnostics.quality_fraction_variability < 0.1
                          ? 'bg-green-400'
                          : studyDiagnostics.quality_fraction_variability < 0.3
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{
                        width: `${Math.min(studyDiagnostics.quality_fraction_variability * 100 * 5, 100)}%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Minute Variability */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Time Variability</span>
                    <span className="text-gray-400">
                      {(studyDiagnostics.total_minute_variability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        studyDiagnostics.total_minute_variability < 0.1
                          ? 'bg-green-400'
                          : studyDiagnostics.total_minute_variability < 0.3
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{
                        width: `${Math.min(studyDiagnostics.total_minute_variability * 100 * 5, 100)}%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Interruptions */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Interruptions</span>
                    <span className="text-gray-400">{studyDiagnostics.interruptions}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        studyDiagnostics.interruptions < 2
                          ? 'bg-green-400'
                          : studyDiagnostics.interruptions < 5
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{
                        width: `${Math.min(studyDiagnostics.interruptions * 10, 100)}%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Bad Hours */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Bad Hours</span>
                    <span className="text-gray-400">{studyDiagnostics.bad_hours}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        studyDiagnostics.bad_hours < 5
                          ? 'bg-green-400'
                          : studyDiagnostics.bad_hours < 12
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{
                        width: `${Math.min(studyDiagnostics.bad_hours * 4, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {studyIdParam 
                  ? "No diagnostics available for this study"
                  : "No study selected"}
              </div>
            )}
          </div>
        )}

        {/* ECG Diagnostics */}
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">ECG Data Queries</h3>
          </div>
          
          {/* Real ECG Query Info */}
          <div className="space-y-3">
            {ecgQueries.length > 0 ? (
              ecgQueries.map((query, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{query.functionName}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(query.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Day:</span>
                      <span className="text-gray-300">{query.day}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Range:</span>
                      <span className="text-gray-300">
                        {query.timeRange.start} - {query.timeRange.end}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Timestamps:</span>
                      <span className="text-gray-300 truncate max-w-[200px]">
                        {query.timestamps.start} - {query.timestamps.end}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Points:</span>
                      <span className="text-gray-300">{query.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-gray-300">{query.duration}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pod ID:</span>
                      <span className="text-gray-300 truncate max-w-[150px]">{query.podId}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 bg-white/5 rounded-lg p-3 text-center">
                No ECG queries tracked yet
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

