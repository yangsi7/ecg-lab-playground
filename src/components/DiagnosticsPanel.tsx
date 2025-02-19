import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  AlertTriangle, Info, CheckCircle2, XCircle, Database as DatabaseIcon, Code, 
  Activity, Server, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { callRPC } from '../lib/supabase/client';
import type { Database } from '../types/database.types';

type DatabaseStat = Database['public']['Functions']['get_database_stats']['Returns'][0];
type EdgeFunctionStats = Database['public']['Functions']['get_edge_function_stats']['Returns'][0];
type ECGDiagnostics = Database['public']['Functions']['get_ecg_diagnostics']['Returns'][0];

interface RPCCallInfo {
  functionName: string;
  status: 'pending' | 'success' | 'error';
  error?: any;
  timestamp: Date;
  params?: any;
  component?: string;
  context?: any;
}

const DiagnosticsPanel: React.FC = () => {
  const location = useLocation();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeComponents, setActiveComponents] = useState<Set<string>>(new Set());
  const [databaseStats, setDatabaseStats] = useState<DatabaseStat[]>([]);
  const [edgeFunctionStats, setEdgeFunctionStats] = useState<EdgeFunctionStats | null>(null);
  const [ecgDiagnostics, setEcgDiagnostics] = useState<ECGDiagnostics | null>(null);

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
          if (dbStats) setDatabaseStats(dbStats);
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
          if (edgeStats?.[0]) setEdgeFunctionStats(edgeStats[0]);
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
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    initialize();

    // Refresh stats every minute
    const interval = setInterval(initialize, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch ECG diagnostics when on ECG viewer page
  useEffect(() => {
    if (!location.pathname.startsWith('/ecg/')) {
      setEcgDiagnostics(null);
      return;
    }

    const studyId = location.pathname.split('/')[2];
    if (!studyId) return;

    async function fetchEcgDiagnostics() {
      try {
        const { data: study } = await supabase
          .from('study')
          .select('pod_id')
          .eq('study_id', studyId)
          .single();

        if (!study?.pod_id) return;

        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const ecgStats = await callRPC('get_ecg_diagnostics', {
          p_pod_id: study.pod_id,
          p_time_start: hourAgo.toISOString(),
          p_time_end: now.toISOString()
        }, {
          component: 'DiagnosticsPanel',
          context: { studyId, action: 'fetchEcgDiagnostics' }
        });

        if (ecgStats?.[0]) setEcgDiagnostics(ecgStats[0]);
      } catch (err) {
        console.error('Failed to fetch ECG diagnostics:', err);
      }
    }

    fetchEcgDiagnostics();
  }, [location.pathname]);

  // Track active components from RPC calls
  useEffect(() => {
    function updateActiveComponents() {
      const components = new Set<string>();
      window.__rpcDiagnostics?.calls?.forEach(call => {
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

        {/* Table Statistics */}
        <div className="space-y-2">
          <h4 className="font-medium">Table Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databaseStats.map((stat, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg">
                <h5 className="font-medium">{stat.table_name}</h5>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Rows: {stat.row_count.toLocaleString()}</p>
                  <p>Size: {(stat.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Last Vacuum: {new Date(stat.last_vacuum).toLocaleString()}</p>
                  <p>Last Analyze: {new Date(stat.last_analyze).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Index Usage */}
        <div className="space-y-2">
          <h4 className="font-medium">Index Usage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databaseStats.flatMap(stat => 
              stat.index_usage.map((index, i) => (
                <div key={`${stat.table_name}-${i}`} className="p-4 bg-white/5 rounded-lg">
                  <h5 className="font-medium">{index.index_name}</h5>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Scans: {index.scan_count.toLocaleString()}</p>
                    <p>Size: {(index.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Query Statistics */}
        <div className="space-y-2">
          <h4 className="font-medium">Query Performance</h4>
          <div className="space-y-4">
            {databaseStats.flatMap(stat => 
              stat.query_stats
                .sort((a, b) => b.total_time - a.total_time)
                .slice(0, 5)
                .map((query, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {query.query_pattern}
                    </pre>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Calls</p>
                        <p>{query.calls.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Time</p>
                        <p>{query.total_time.toFixed(2)}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Avg Time</p>
                        <p>{(query.total_time / query.calls).toFixed(2)}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Rows</p>
                        <p>{query.rows_processed.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
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
              <div>Invocations: {edgeFunctionStats.total_invocations.toLocaleString()}</div>
              <div>Success Rate: {(edgeFunctionStats.success_rate * 100).toFixed(1)}%</div>
              <div>Avg Duration: {edgeFunctionStats.average_duration_ms.toFixed(2)}ms</div>
              <div>Memory Usage: {(edgeFunctionStats.memory_usage / 1024 / 1024).toFixed(2)}MB</div>
              <div>CPU Time: {edgeFunctionStats.cpu_time}ms</div>
              <div>Peak Concurrent: {edgeFunctionStats.peak_concurrent_executions}</div>
              <div className="col-span-2">
                Last Invocation: {new Date(edgeFunctionStats.last_invocation).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* ECG Diagnostics */}
        {ecgDiagnostics && (
          <div className="p-3 rounded-lg bg-white/5">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              ECG Diagnostics
            </h3>
            <div className="space-y-3 text-xs">
              {/* Signal Quality */}
              <div>
                <h4 className="text-gray-300 mb-1">Signal Quality</h4>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div>SNR: {ecgDiagnostics.signal_quality.snr.toFixed(2)}</div>
                  <div>Baseline Wander: {ecgDiagnostics.signal_quality.baseline_wander.toFixed(2)}</div>
                  <div>Noise Level: {ecgDiagnostics.signal_quality.noise_level.toFixed(2)}</div>
                  <div>Quality Scores:</div>
                  <div>Ch1: {ecgDiagnostics.signal_quality.quality_scores.channel_1.toFixed(1)}%</div>
                  <div>Ch2: {ecgDiagnostics.signal_quality.quality_scores.channel_2.toFixed(1)}%</div>
                  <div>Ch3: {ecgDiagnostics.signal_quality.quality_scores.channel_3.toFixed(1)}%</div>
                </div>
              </div>

              {/* Connection Stats */}
              <div>
                <h4 className="text-gray-300 mb-1">Connection Stats</h4>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div>Total Samples: {ecgDiagnostics.connection_stats.total_samples.toLocaleString()}</div>
                  <div>Missing: {ecgDiagnostics.connection_stats.missing_samples.toLocaleString()}</div>
                  <div>Drops: {ecgDiagnostics.connection_stats.connection_drops}</div>
                  <div>Sampling Rate: {ecgDiagnostics.connection_stats.sampling_frequency}Hz</div>
                </div>
              </div>

              {/* Data Quality */}
              <div>
                <h4 className="text-gray-300 mb-1">Data Quality</h4>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div>Recording Gaps: {ecgDiagnostics.data_quality.recording_gaps}</div>
                  <div>Leads Connected: {ecgDiagnostics.data_quality.all_leads_connected_percent.toFixed(1)}%</div>
                  <div>Max Continuous: {(ecgDiagnostics.data_quality.max_continuous_segment_seconds / 60).toFixed(1)} min</div>
                </div>
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
            {window.__rpcDiagnostics?.calls?.map((call, index) => (
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
                    Args: {JSON.stringify(call.params)}
                  </div>
                )}
                {/* Display context if available */}
                {call.context && (
                  <div className="text-xs text-gray-400/70 pl-6">
                    Context: {JSON.stringify(call.context)}
                  </div>
                )}
                {call.error && (
                  <div className="text-xs text-red-400/70 pl-6 break-all">
                    {call.error.message || JSON.stringify(call.error)}
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