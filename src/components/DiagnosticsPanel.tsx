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
import { useQuery } from '@tanstack/react-query';
import { StatTypes } from '../types/supabase';
import type { DatabaseStat, StatType } from '../types/supabase';

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

// Use exact types from the database
type DatabaseStatsRPC = {
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
};

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

// Exact stat types as returned by the database
const STAT_TYPES = {
  CACHE_HIT_RATES: 'Cache Hit Rates',
  TABLE_HIT_RATE: 'Table Hit Rate',
  TIME_CONSUMING_QUERIES: 'Most Time Consuming Queries',
  CUMULATIVE_EXECUTION_TIME: 'Cumulative Total Execution Time'
} as const;

async function fetchDatabaseStats(): Promise<DatabaseStatsRPC[]> {
  const { data, error } = await supabase.rpc('get_database_stats');
  
  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Validate the structure of the returned data
  if (!Array.isArray(data) || !data.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'stat_type' in item
  )) {
    throw new Error('Invalid response format from get_database_stats');
  }

  return data;
}

function formatStatValue(stat: DatabaseStatsRPC): string {
  if (stat.stat_type === STAT_TYPES.CACHE_HIT_RATES || stat.stat_type === STAT_TYPES.TABLE_HIT_RATE) {
    return stat.hit_rate != null ? `${stat.hit_rate.toFixed(1)}%` : 'N/A';
  }
  
  if (stat.stat_type === STAT_TYPES.TIME_CONSUMING_QUERIES) {
    if (stat.calls == null || stat.mean_time == null) return 'N/A';
    return `${stat.calls} calls, ${stat.mean_time.toFixed(2)}ms avg`;
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
    case STAT_TYPES.TIME_CONSUMING_QUERIES:
      return `Query: ${stat.query?.substring(0, 50) || 'Unknown'}...`;
    case STAT_TYPES.CUMULATIVE_EXECUTION_TIME:
      return `${stat.rolname || 'Unknown'}: ${stat.query?.substring(0, 50) || 'Unknown'}...`;
    default:
      return stat.stat_type;
  }
}

type EdgeFunctionStatsRPC = RPCFunctionReturns<'get_edge_function_stats'>;

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

const DiagnosticsPanel: React.FC = () => {
  const location = useLocation();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [activeComponents, setActiveComponents] = useState<Set<string>>(new Set());
  const [databaseStats, setDatabaseStats] = useState<DatabaseStatsRPC[]>([]);
  const [edgeFunctionStats, setEdgeFunctionStats] = useState<EdgeFunctionStats | null>(null);

  const { data: stats, error } = useQuery({
    queryKey: ['database-stats'],
    queryFn: fetchDatabaseStats,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Check Supabase connection and fetch initial stats
  useEffect(() => {
    async function initialize() {
      try {
        // Check connection
        const { error: connError } = await supabase.from('study').select('count', { count: 'exact', head: true });
        if (connError) throw connError;
        setSupabaseStatus('connected');

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
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Supabase connection error:', errorMessage);
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
                stat.query != null &&
                stat.calls != null &&
                stat.mean_time != null
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
              stat.query != null &&
              stat.prop_total_time != null
            )
            .slice(0, 3)
            .map((stat, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="truncate" title={stat.query || ''}>
                  {stat.query 
                    ? `${stat.query.slice(0, 50)}${stat.query.length > 50 ? '...' : ''}`
                    : 'Unknown Query'}
                </span>
                <span>{stat.prop_total_time}</span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Render RPC call details
  const renderRPCCalls = () => {
    if (!window.__rpcDiagnostics?.calls) return null;

    return window.__rpcDiagnostics.calls.map((call, index) => {
      // Safely convert any unknown values to strings
      const params = call.params ? toReactNode(call.params) : null;
      const context = call.context ? toReactNode(call.context) : null;
      const error = call.error ? toReactNode(call.error) : null;

      return (
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
          {params && (
            <div className="text-xs text-gray-400/70 pl-6 font-mono break-all">
              Args: {params}
            </div>
          )}
          {context && (
            <div className="text-xs text-gray-400/70 pl-6">
              Context: {context}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-400/70 pl-6 break-all">
              {error}
            </div>
          )}
        </div>
      );
    });
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
                {error && (
                  <p className="text-xs text-red-400/70 pl-6">{error.message}</p>
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
          {error ? (
            <p className="text-sm text-red-400">Failed to load database stats: {error.message}</p>
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
            {renderRPCCalls()}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DiagnosticsPanel; 