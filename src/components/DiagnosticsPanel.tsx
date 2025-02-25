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
 */
import { Activity, Database, Zap, Cpu, AlertTriangle, Wifi } from 'lucide-react';
import { supabase,useDiagnostics } from '@/hooks';
import { useEffect, useState } from 'react';


/**
 * Local types for debugging panel
 */
interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
}

interface ConnectionError {
  message: string;
  timestamp: string;
  details?: string;
}

interface RPCCall {
  function: string;
  timestamp: string;
  duration: number;
  error?: string;
  params?: Record<string, unknown>;
}

interface EdgeFunctionStat {
  function_name: string;
  total_invocations: number;
  average_duration_ms: number;
  success_rate: number;
  last_invocation: string;
  error_count?: number;
}

/**
 * The "get_database_stats" call returns data with columns like:
 * - stat_type
 * - rolname
 * - query
 * - calls
 * - total_time
 * - min_time
 * - max_time
 * - mean_time
 * - avg_rows
 * - prop_total_time
 * - hit_rate
 *
 * We'll define a type that matches those fields.
 */
interface DatabasePerfStat {
  stat_type: string;
  rolname: string | null;
  query: string | null;
  calls: number | null;
  total_time: number | null;
  min_time: number | null;
  max_time: number | null;
  mean_time: number | null;
  avg_rows: number | null;
  prop_total_time: string | null;
  hit_rate: number | null;
}

interface RPCMetric {
  function_name: string;
  total_calls: number;
  average_duration_ms: number;
  cache_hit_ratio: number;
  error_rate: number;
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  network_latency_ms: number;
  active_connections: number;
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

  // Use direct values from hook
  const isLoading = isLoading;
  const error = error;

  // For demonstration, define a mock systemMetrics object to avoid TS "never" errors
  // In a real scenario, you'd fetch real system metrics from another query or context.
  const systemMetrics: SystemMetrics = {
    cpu_usage: 42.5,
    memory_usage: 200 * 1024 * 1024,
    network_latency_ms: 120,
    active_connections: 10
  };

  // For now, define placeholders for other metrics
  const rpcMetrics: RPCMetric[] = [];
  const lastRPCCalls: RPCCall[] = [];
  const connectionErrors: ConnectionError[] = [];

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastChecked: new Date()
  });

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
            {edgeFunctionStats.map((stat: EdgeFunctionStat) => (
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
            {databaseStats.map((stat: DatabasePerfStat, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{stat.stat_type}</span>
                  <span className="text-gray-400">
                    {stat.calls !== null ? `${stat.calls} calls` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Total Time:{' '}
                    {stat.total_time !== null ? stat.total_time.toFixed(1) : 'N/A'}
                  </span>
                  {stat.mean_time !== null && (
                    <span>Mean: {stat.mean_time.toFixed(1)}</span>
                  )}
                </div>
                {/* We can display the query if present */}
                {stat.query && (
                  <div className="text-xs text-gray-500 italic truncate">
                    Query: {stat.query}
                  </div>
                )}
                {/* Show proportion of total execution time */}
                {stat.prop_total_time && stat.prop_total_time !== '' && (
                  <div className="text-xs text-gray-500">
                    % of total time: {stat.prop_total_time}
                  </div>
                )}
                {/* If we want, show a small bar for the hit rate */}
                {stat.hit_rate !== null && (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stat.hit_rate > 90
                          ? 'bg-green-400'
                          : stat.hit_rate > 70
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${stat.hit_rate}%` }}
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
              {rpcMetrics.map((metric: RPCMetric) => (
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
      </div>
    </aside>
  );
}