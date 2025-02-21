/**
 * DiagnosticsPanel.tsx
 * 
 * A real-time diagnostics panel showing:
 * - Edge function performance
 * - Database stats
 * - RPC metrics
 * - System metrics
 */
import { Activity, Database, Zap, Cpu } from 'lucide-react';
import { useDiagnostics } from '@/hooks/api/useDiagnostics';

interface DiagnosticsPanelProps {
  className?: string;
}

export default function DiagnosticsPanel({ className = '' }: DiagnosticsPanelProps) {
  const { edgeFunctionStats, databaseStats, rpcMetrics, systemMetrics, isLoading, error } = useDiagnostics();

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
        {/* Edge Functions */}
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">Edge Functions</h3>
          </div>
          <div className="space-y-2">
            {edgeFunctionStats.map(stat => (
              <div key={stat.function_name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{stat.function_name}</span>
                  <span className="text-gray-400">{stat.total_invocations} calls</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Avg: {stat.average_duration_ms.toFixed(2)}ms</span>
                  <span>Success: {stat.success_rate.toFixed(1)}%</span>
                </div>
                {/* Success rate bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all" 
                    style={{ width: `${stat.success_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">Database Stats</h3>
          </div>
          <div className="space-y-2">
            {databaseStats.map(stat => (
              <div key={stat.table_name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{stat.table_name}</span>
                  <span className="text-gray-400">{stat.row_count.toLocaleString()} rows</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Cache Hit: {(stat.cache_hit_ratio * 100).toFixed(1)}%</span>
                  {stat.last_vacuum && (
                    <span>Last Vacuum: {new Date(stat.last_vacuum).toLocaleDateString()}</span>
                  )}
                </div>
                {/* Cache hit ratio bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all" 
                    style={{ width: `${stat.cache_hit_ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RPC Metrics */}
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">RPC Metrics</h3>
          </div>
          <div className="space-y-2">
            {rpcMetrics.map(metric => (
              <div key={metric.function_name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{metric.function_name}</span>
                  <span className="text-gray-400">{metric.total_calls} calls</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Avg: {metric.average_duration_ms.toFixed(2)}ms</span>
                  <span>Cache Hit: {(metric.cache_hit_ratio * 100).toFixed(1)}%</span>
                </div>
                {/* Error rate bar (inverted) */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all" 
                    style={{ width: `${100 - metric.error_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

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
                  <span className="text-gray-400">{systemMetrics.cpu_usage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all" 
                    style={{ width: `${systemMetrics.cpu_usage}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Memory Usage</span>
                  <span className="text-gray-400">{(systemMetrics.memory_usage / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all" 
                    style={{ width: `${(systemMetrics.memory_usage / 512) * 100}%` }}
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