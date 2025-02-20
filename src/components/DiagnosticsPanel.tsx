import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  AlertTriangle, Info, CheckCircle2, XCircle, Database as DatabaseIcon, Code, 
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import type { 
  RPCCallInfo, 
  ActiveComponent,
  EdgeFunctionStats,
  DatabaseStatsRPC
} from '../types/utils';
import { 
  isEdgeFunctionStats, 
  isDatabaseStatsRPC,
  assertDatabaseStatsRPC 
} from '../types/utils';
import { useDiagnostics } from '../hooks/api/useDiagnostics';

// Helper function for consistent number formatting
function formatNumber(val: number | null | undefined, decimals = 1): string {
  if (val == null) return 'N/A';
  return val.toFixed(decimals);
}

// Helper function for locale string formatting
function formatLocaleNumber(val: number | null | undefined): string {
  if (val == null) return 'N/A';
  return val.toLocaleString();
}

// Helper function for percentage formatting with width calculation
function formatPercentage(value: number | null): { display: string; width: string } {
  if (value == null) {
    return { display: 'N/A', width: '0%' };
  }
  const percentage = Math.min(Math.max(value, 0), 100);
  return {
    display: `${percentage.toFixed(1)}%`,
    width: `${percentage}%`
  };
}

// Exact stat types as returned by the database
const STAT_TYPES = {
  CACHE_HIT_RATES: 'Cache Hit Rates',
  TABLE_HIT_RATE: 'Table Hit Rate',
  MOST_TIME_CONSUMING: 'Most Time Consuming Queries',
  CUMULATIVE_EXECUTION_TIME: 'Cumulative Total Execution Time'
} as const;

function formatStatValue(stat: DatabaseStatsRPC): string {
  if (stat.stat_type === STAT_TYPES.CACHE_HIT_RATES || stat.stat_type === STAT_TYPES.TABLE_HIT_RATE) {
    return stat.hit_rate != null ? `${stat.hit_rate.toFixed(1)}%` : 'N/A';
  }
  
  if (stat.stat_type === STAT_TYPES.MOST_TIME_CONSUMING) {
    if (stat.calls == null || stat.mean_time == null) return 'N/A';
    return `${stat.calls.toString()} calls, ${stat.mean_time.toFixed(2)}ms avg`;
  }
  
  if (stat.prop_total_time) {
    return stat.prop_total_time;
  }
  
  return 'N/A';
}

function getStatLabel(stat: DatabaseStatsRPC): string {
  switch (stat.stat_type) {
    case STAT_TYPES.CACHE_HIT_RATES:
      return 'Cache Hit Rate';
    case STAT_TYPES.TABLE_HIT_RATE:
      return 'Table Hit Rate';
    case STAT_TYPES.MOST_TIME_CONSUMING:
      return `Query: ${stat.query?.substring(0, 50) || 'Unknown'}...`;
    case STAT_TYPES.CUMULATIVE_EXECUTION_TIME:
      return `${stat.rolname || 'Unknown'}: ${stat.query?.substring(0, 50) || 'Unknown'}...`;
    default:
      return stat.stat_type;
  }
}

// Define the type for RPC diagnostics
type RPCDiagnostics = {
  lastCall?: {
    component?: string;
    context?: unknown;
  };
  calls: RPCCallInfo[];
  stats: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageExecutionTime: number;
  };
};

// Declare the global property with the correct type
declare global {
  interface Window {
    __rpcDiagnostics?: RPCDiagnostics;
  }
}

const DiagnosticsPanel: React.FC = () => {
  const location = useLocation();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [activeComponents, setActiveComponents] = useState<ActiveComponent[]>([]);
  const { databaseStats: stats, edgeFunctionStats: edgeStats, error: queryError } = useDiagnostics();

  // Check Supabase connection
  useEffect(() => {
    async function initialize() {
      try {
        const { error: connError } = await supabase.from('study').select('count', { count: 'exact', head: true });
        if (connError) throw connError;
        setSupabaseStatus('connected');
      } catch (err) {
        setSupabaseStatus('error');
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Supabase connection error:', errorMessage);
      }
    }
    initialize();
  }, []);

  // Track active components from RPC calls
  useEffect(() => {
    function updateActiveComponents() {
      const components = new Set<string>();
      window.__rpcDiagnostics?.calls.forEach(call => {
        if (call.component) {
          components.add(call.component);
        }
      });
      setActiveComponents(Array.from(components).map(component => ({
        id: component,
        name: component,
        mountedAt: new Date(),
        lastUpdated: new Date(),
        updateCount: 0
      })));
    }

    // Update initially
    updateActiveComponents();

    // Set up interval to update
    const interval = setInterval(updateActiveComponents, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to safely convert unknown to ReactNode for display
  function toReactNode(value: unknown): React.ReactNode {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Error) return value.message;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }
    return String(value);
  }

  // Render RPC call details
  const renderRPCCalls = () => {
    if (!window.__rpcDiagnostics?.calls) return null;

    return window.__rpcDiagnostics.calls.map((call, index) => (
      <div key={index} className="space-y-2 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium
            ${call.status === 'error' ? 'bg-red-500/20 text-red-400' :
            call.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'}`}
          >
            {toReactNode(call.status)}
          </span>
          <span className="text-sm text-gray-400">
            {new Date(call.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{toReactNode(call.functionName)}</p>
          {call.component && (
            <p className="text-xs text-gray-400">Component: {toReactNode(call.component)}</p>
          )}
          {call.args && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Parameters:</p>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                {toReactNode(call.args)}
              </pre>
            </div>
          )}
          {typeof call.context !== 'undefined' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Context:</p>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                {toReactNode(call.context)}
              </pre>
            </div>
          )}
          {call.error && (
            <div className="space-y-1">
              <p className="text-xs text-red-400">Error:</p>
              <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto text-red-400">
                {toReactNode(call.error)}
              </pre>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <aside className="w-96 border-l border-white/10 p-4 bg-gray-900/50 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info className="w-5 h-5" />
        Diagnostics
      </h2>
      
      <div className="space-y-4">
        {/* Current Route */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Current Route</h3>
          <p className="text-sm text-white/70">{location.pathname}</p>
        </div>

        {/* Environment */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Environment</h3>
          <p className="text-sm text-white/70">
            {import.meta.env.MODE === 'development' ? 'Development' : 'Production'}
          </p>
        </div>

        {/* Supabase Connection */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4" />
            Supabase Connection
          </h3>
          <div className="space-y-2">
            {supabaseStatus === 'checking' && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Checking connection...</span>
              </div>
            )}
            {supabaseStatus === 'connected' && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected</span>
              </div>
            )}
            {supabaseStatus === 'error' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span>Connection Error</span>
                </div>
                {queryError && (
                  <p className="text-xs text-red-400/70 pl-6">{queryError.message}</p>
                )}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              <div>URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}</div>
              <div>Project Ref: {import.meta.env.VITE_SUPABASE_URL?.split('.')?.[0]?.split('/').pop()}</div>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Database Stats</h3>
          {queryError ? (
            <p className="text-sm text-red-400">Failed to load database stats: {queryError.message}</p>
          ) : !stats ? (
            <p className="text-sm text-gray-400">Loading stats...</p>
          ) : (
            <div className="space-y-2">
              {stats.map((stat, index) => (
                <div key={`${stat.stat_type}-${index}`} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{getStatLabel(stat)}</span>
                  <span className="text-sm text-white">{formatStatValue(stat)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edge Function Stats */}
        {edgeStats && edgeStats.length > 0 && (
          <div className="p-3 rounded-lg bg-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Edge Function Performance
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              {edgeStats.map((stat, index) => (
                <div key={index}>
                  <p className="text-xs font-medium text-gray-300">{stat.function_name}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      Invocations: {formatLocaleNumber(stat.total_invocations)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Avg Duration: {formatNumber(stat.average_duration_ms, 2)}ms
                    </p>
                    <p className="text-xs text-gray-400">
                      Memory: {formatLocaleNumber(stat.memory_usage)} bytes
                    </p>
                    <p className="text-xs text-gray-400">
                      CPU Time: {stat.cpu_time || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Peak Concurrent: {formatLocaleNumber(stat.peak_concurrent_executions)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last Invoked: {new Date(stat.last_invocation).toLocaleString()}
                    </p>
                    {stat.success_rate < 1 && (
                      <p className="text-xs text-red-400">
                        Success Rate: {(stat.success_rate * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Components */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Active Components</h3>
          <div className="space-y-4">
            {activeComponents.map((component) => (
              <div key={component.id} className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm font-medium text-white">{component.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">
                    Mounted: {component.mountedAt.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last Updated: {component.lastUpdated.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Update Count: {component.updateCount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent RPC Calls */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Recent RPC Calls
          </h3>
          <div className="space-y-2">
            {renderRPCCalls()}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DiagnosticsPanel; 