import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  AlertTriangle, Info, CheckCircle2, XCircle, Database as DatabaseIcon, Code, 
  Server, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { callRPC } from '../lib/supabase/client';
import type { RPCFunctionReturns, RPCCallInfo } from '../types/utils';
import type { Database } from '../types/database.types';

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
function formatPercentage(val: number | null | undefined): { display: string; width: string } {
  if (val == null) return { display: 'N/A', width: '0%' };
  const safeValue = Math.max(0, Math.min(100, val)); // Clamp between 0-100
  return {
    display: `${safeValue.toFixed(1)}%`,
    width: `${safeValue}%`
  };
}

// Use exact types from the database
type DatabaseStatsRPC = RPCFunctionReturns<'get_database_stats'>;
type EdgeFunctionStatsRPC = RPCFunctionReturns<'get_edge_function_stats'>;

type DatabaseStat = NonNullable<DatabaseStatsRPC>[number];
type EdgeFunctionStats = NonNullable<EdgeFunctionStatsRPC>[number];

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

// Exact stat types as returned by the database
const STAT_TYPES = {
  CACHE_HIT_RATES: 'Cache Hit Rates',
  TABLE_HIT_RATE: 'Table Hit Rate',
  TIME_CONSUMING_QUERIES: 'Most Time Consuming Queries',
  CUMULATIVE_EXECUTION_TIME: 'Cumulative Total Execution Time'
} as const;

// Helper function to safely stringify unknown values
function safeStringify(value: unknown): string {
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

// Helper function to safely convert unknown to ReactNode
function toReactNode(value: unknown): React.ReactNode {
  return safeStringify(value);
}

const DiagnosticsPanel: React.FC = () => {
  const location = useLocation();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeComponents, setActiveComponents] = useState<Set<string>>(new Set());
  const [databaseStats, setDatabaseStats] = useState<DatabaseStat[]>([]);
  const [edgeFunctionStats, setEdgeFunctionStats] = useState<EdgeFunctionStats | null>(null);

  // Check Supabase connection and fetch initial stats
  useEffect(() => {
    async function initialize() {
      try {
        // Check connection
        const { error: connError } = await supabase.from('study').select('count', { count: 'exact', head: true });
        if (connError) throw connError;
        setSupabaseStatus('connected');
        setErrorMessage(null);

        try {
          // Fetch database stats (wrapped in try-catch since function might not exist)
          const dbStats = await callRPC('get_database_stats', undefined, {
            component: 'DiagnosticsPanel',
            context: { action: 'initialize' }
          });
          
          if (dbStats) {
            setDatabaseStats(dbStats);
          }
        } catch (error) {
          // Silently ignore missing function error
          const statsError = error instanceof Error ? error.message : String(error);
          if (statsError.includes('Could not find the function')) {
            console.info('Database stats function not available yet');
          } else {
            throw error;
          }
        }

        try {
          // Fetch edge function stats for last hour
          const now = new Date();
          const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          const edgeStats = await callRPC('get_edge_function_stats', {
            p_function_name: 'downsample-ecg',
            p_time_start: hourAgo.toISOString(),
            p_time_end: now.toISOString()
          }, {
            component: 'DiagnosticsPanel',
            context: { action: 'initialize' }
          });

          if (edgeStats?.[0]) {
            const stat = edgeStats[0];
            setEdgeFunctionStats({
              ...stat,
              cpu_time: String(stat.cpu_time) // Convert interval to string
            });
          }
        } catch (error) {
          // Silently ignore missing function error
          const statsError = error instanceof Error ? error.message : String(error);
          if (statsError.includes('Could not find the function')) {
            console.info('Edge function stats not available yet');
          } else {
            throw error;
          }
        }

      } catch (err) {
        setSupabaseStatus('error');
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    }
    initialize();

    // Refresh stats every minute
    const interval = setInterval(initialize, 60000);
    return () => clearInterval(interval);
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
      setActiveComponents(components);
    }

    // Update initially
    updateActiveComponents();

    // Set up interval to update
    const interval = setInterval(updateActiveComponents, 1000);
    return () => clearInterval(interval);
  }, []);

  // Render database stats section
  const renderDatabaseStats = () => {
    if (!databaseStats || databaseStats.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5" />
          Database Statistics
        </h3>

        {/* Cache Hit Rates */}
        {databaseStats
          .filter(stat => 
            stat.stat_type === STAT_TYPES.CACHE_HIT_RATES || 
            stat.stat_type === STAT_TYPES.TABLE_HIT_RATE
          )
          .map((stat, idx) => {
            const { display, width } = formatPercentage(stat.hit_rate);
            return (
              <div key={idx} className="space-y-1">
                <h4 className="font-medium">{stat.stat_type}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-grow bg-gray-700/50 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width }}
                    />
                  </div>
                  <span>{display}</span>
                </div>
              </div>
            );
          })}

        {/* Most Time Consuming Queries */}
        <div className="space-y-2">
          <h4 className="font-medium">Most Time Consuming Queries</h4>
          <div className="space-y-4">
            {databaseStats
              .filter(stat => 
                stat.stat_type === STAT_TYPES.TIME_CONSUMING_QUERIES && 
                stat.query != null
              )
              .slice(0, 5)
              .map((stat, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Query {idx + 1}</span>
                    <span>{stat.rolname || 'Unknown Role'}</span>
                  </div>
                  <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                    {stat.query || 'Query text not available'}
                  </pre>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-gray-400">
                    <span>{formatLocaleNumber(stat.calls)} calls</span>
                    <span>{formatNumber(stat.mean_time, 2)}ms avg</span>
                    <span>
                      {stat.avg_rows != null 
                        ? `${formatLocaleNumber(Math.round(stat.avg_rows))} rows/call` 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Cumulative Execution Time */}
        <div className="space-y-2">
          <h4 className="font-medium">Cumulative Total Execution Time</h4>
          {databaseStats
            .filter(stat => 
              stat.stat_type === STAT_TYPES.CUMULATIVE_EXECUTION_TIME && 
              stat.query != null
            )
            .slice(0, 3)
            .map((stat, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="truncate" title={stat.query || ''}>
                  {stat.query 
                    ? `${stat.query.slice(0, 50)}${stat.query.length > 50 ? '...' : ''}`
                    : 'Unknown Query'}
                </span>
                <span>{stat.prop_total_time || 'N/A'}</span>
              </div>
            ))}
        </div>
      </div>
    );
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
                {errorMessage && (
                  <p className="text-xs text-red-400/70 pl-6">{errorMessage}</p>
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
        {renderDatabaseStats()}

        {/* Edge Function Stats */}
        {edgeFunctionStats && (
          <div className="p-3 rounded-lg bg-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Edge Function Performance
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>Invocations: {formatLocaleNumber(edgeFunctionStats.total_invocations)}</div>
              <div>Success Rate: {formatNumber(edgeFunctionStats.success_rate * 100)}%</div>
              <div>Avg Duration: {formatNumber(edgeFunctionStats.average_duration_ms, 2)}ms</div>
              <div>Memory Usage: {formatNumber(edgeFunctionStats.memory_usage / 1024 / 1024, 2)}MB</div>
              <div>CPU Time: {String(edgeFunctionStats.cpu_time)}</div>
              <div>Peak Concurrent: {formatLocaleNumber(edgeFunctionStats.peak_concurrent_executions)}</div>
              <div className="col-span-2">
                Last Invocation: {edgeFunctionStats.last_invocation ? new Date(edgeFunctionStats.last_invocation).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Active Components */}
        <div className="p-3 rounded-lg bg-white/5">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Active Components</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(activeComponents).map(component => (
              <span key={component} className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                {component}
              </span>
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
            {window.__rpcDiagnostics?.calls.map((call, index) => (
              <div key={index} className="text-sm border-l-2 pl-2 py-1 space-y-1"
                   style={{ 
                     borderColor: call.status === 'success' ? '#4ade80' : 
                                call.status === 'error' ? '#f87171' : '#60a5fa'
                   }}>
                <div className="flex items-center gap-2">
                  {call.status === 'pending' && <AlertTriangle className="w-3 h-3 text-blue-400" />}
                  {call.status === 'success' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  {call.status === 'error' && <XCircle className="w-3 h-3 text-red-400" />}
                  <span className="text-white/70">{call.functionName}</span>
                  {call.component && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                      {call.component}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {call.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {/* Display parameters */}
                {call.params && (
                  <div className="text-xs text-gray-400/70 pl-6 font-mono break-all">
                    Args: {toReactNode(call.params)}
                  </div>
                )}
                {/* Display context if available */}
                {call.context && (
                  <div className="text-xs text-gray-400/70 pl-6">
                    Context: {toReactNode(call.context)}
                  </div>
                )}
                {call.error && (
                  <div className="text-xs text-red-400/70 pl-6 break-all">
                    {(() => {
                      if (call.error instanceof Error) return call.error.message;
                      if (typeof call.error === 'object' && call.error !== null && 'message' in call.error) {
                        return toReactNode((call.error as { message: unknown }).message);
                      }
                      return toReactNode(call.error);
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DiagnosticsPanel; 