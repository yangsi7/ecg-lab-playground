import React, { useState } from 'react';
import { X, Activity, ChevronDown, ChevronUp, Clock, Cpu, AlertTriangle, Database } from 'lucide-react';
import { useECGQueryTracker } from '../../../hooks/api/diagnostics/useECGQueryTracker';

interface ECGDiagnosticsPanelProps {
  initiallyOpen?: boolean;
  onClose?: () => void;
}

/**
 * ECG Diagnostics Panel
 * 
 * A floating panel that shows diagnostic information about ECG data fetching
 * and visualization. Useful for development and debugging.
 */
export const ECGDiagnosticsPanel: React.FC<ECGDiagnosticsPanelProps> = ({
  initiallyOpen = false,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const { queries } = useECGQueryTracker();
  const [activeTab, setActiveTab] = useState<'queries' | 'performance' | 'errors'>('queries');

  // Get averages from queries
  const stats = React.useMemo(() => {
    if (!queries.length) return { avgDuration: 0, avgPoints: 0, maxDuration: 0, maxPoints: 0, totalQueries: 0 };
    
    const totalDuration = queries.reduce((sum, q) => sum + q.duration, 0);
    const totalPoints = queries.reduce((sum, q) => sum + q.points, 0);
    const maxDuration = Math.max(...queries.map(q => q.duration));
    const maxPoints = Math.max(...queries.map(q => q.points));

    return {
      avgDuration: totalDuration / queries.length,
      avgPoints: totalPoints / queries.length,
      maxDuration,
      maxPoints,
      totalQueries: queries.length
    };
  }, [queries]);

  // Toggle panel open/closed
  const togglePanel = () => {
    setIsOpen(prev => !prev);
  };

  // Handle close button click
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Queries tab content
  const renderQueriesTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-blue-500/10 rounded-lg p-2">
          <div className="text-xs text-blue-300">Total Queries</div>
          <div className="text-lg font-semibold">{stats.totalQueries}</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-2">
          <div className="text-xs text-green-300">Avg. Duration</div>
          <div className="text-lg font-semibold">{stats.avgDuration.toFixed(0)}ms</div>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-2">
          <div className="text-xs text-yellow-300">Avg. Points</div>
          <div className="text-lg font-semibold">{stats.avgPoints.toFixed(0)}</div>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-2">
          <div className="text-xs text-purple-300">Max Duration</div>
          <div className="text-lg font-semibold">{stats.maxDuration}ms</div>
        </div>
      </div>

      <div className="text-sm text-gray-300 mb-1 mt-3">Recent Queries</div>
      <div className="bg-black/20 rounded-lg max-h-40 overflow-y-auto">
        {queries.length === 0 ? (
          <div className="text-gray-400 p-3 text-center">No queries recorded yet</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-black/30">
              <tr>
                <th className="py-1 px-2 text-left">Time</th>
                <th className="py-1 px-2 text-right">Points</th>
                <th className="py-1 px-2 text-right">Duration</th>
                <th className="py-1 px-2 text-left">Pod ID</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-black/10' : ''}>
                  <td className="py-1 px-2">{new Date(query.timestamp).toLocaleTimeString()}</td>
                  <td className="py-1 px-2 text-right">{query.points}</td>
                  <td className="py-1 px-2 text-right">{query.duration}ms</td>
                  <td className="py-1 px-2 truncate max-w-[80px]">{query.podId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // Performance tab content
  const renderPerformanceTab = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Memory Usage</div>
          <div className="bg-black/20 rounded-lg p-2">
            <div id="memory-usage-placeholder" className="text-sm">
              {/* Memory info filled by hook - placeholder */}
              {typeof performance !== 'undefined' && 
              typeof (performance as any).memory !== 'undefined' ? 
                `${Math.round((performance as any).memory?.usedJSHeapSize / (1024 * 1024))} MB` : 
                'Not available'}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Canvas Render Time</div>
          <div className="bg-black/20 rounded-lg p-2">
            <div id="render-time-placeholder" className="text-sm">
              {/* Will be filled by performanceObserver if available */}
              Monitoring...
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-3 mb-1">Performance Recommendations</div>
      <ul className="text-xs space-y-1 bg-black/20 p-2 rounded-lg">
        <li className="flex items-center gap-1">
          <span className="text-blue-300">•</span>
          Use smaller time ranges for better performance
        </li>
        <li className="flex items-center gap-1">
          <span className="text-blue-300">•</span> 
          Default max points: 2,000 (adjust if needed)
        </li>
        <li className="flex items-center gap-1">
          <span className="text-yellow-300">•</span>
          {stats.avgDuration > 500 ? 'Query times are high (>500ms)' : 'Query times look good (<500ms)'}
        </li>
      </ul>
    </div>
  );

  // Error monitoring tab content
  const renderErrorsTab = () => (
    <div className="space-y-3">
      <div className="bg-black/20 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-1">Error Monitoring</div>
        <div id="error-log-container" className="text-xs space-y-2 max-h-40 overflow-y-auto">
          {/* Error log entries will be added here by error interceptor */}
          <div className="text-gray-500">No errors recorded in this session</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg py-1.5 text-xs" 
          onClick={() => {
            // Force an error for testing
            try {
              throw new Error("Test error from diagnostics panel");
            } catch (err) {
              console.error(err);
            }
          }}
        >
          Test Error
        </button>
        <button 
          className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg py-1.5 text-xs"
          onClick={() => {
            // Clear error log
            const container = document.getElementById('error-log-container');
            if (container) {
              container.innerHTML = '<div class="text-gray-500">Error log cleared</div>';
            }
          }}
        >
          Clear Log
        </button>
      </div>

      <div className="text-xs text-gray-400 mb-1">Common Issues</div>
      <ul className="text-xs space-y-1 bg-black/20 p-2 rounded-lg">
        <li className="flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
          <span>If edge function times out, check your Supabase deployment</span>
        </li>
        <li className="flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
          <span>No data may indicate incorrect pod ID or empty time range</span>
        </li>
        <li className="flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
          <span>Canvas rendering issues often related to invalid data points</span>
        </li>
      </ul>
    </div>
  );

  // Render tab content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'queries':
        return renderQueriesTab();
      case 'performance':
        return renderPerformanceTab();
      case 'errors':
        return renderErrorsTab();
      default:
        return renderQueriesTab();
    }
  };

  // If panel is closed, just show the toggle button
  if (!isOpen) {
    return (
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 bg-blue-600/80 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center"
        aria-label="Open ECG diagnostics"
        title="Open ECG diagnostics"
      >
        <Activity className="h-5 w-5" />
      </button>
    );
  }

  // Render full panel when open
  return (
    <div className="fixed bottom-4 right-4 w-full sm:w-[400px] md:w-[500px] bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <h3 className="font-medium text-white">ECG Diagnostics</h3>
          <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-xs">
            Debug
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={togglePanel}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md"
            aria-label="Toggle panel"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md"
            aria-label="Close diagnostics"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-700/50">
        <button
          onClick={() => setActiveTab('queries')}
          className={`flex items-center gap-1 py-2 px-3 text-sm ${
            activeTab === 'queries'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" />
          Queries
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-1 py-2 px-3 text-sm ${
            activeTab === 'performance'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Cpu className="h-4 w-4" />
          Performance
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`flex items-center gap-1 py-2 px-3 text-sm ${
            activeTab === 'errors'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Errors
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {renderContent()}
      </div>
    </div>
  );
};

export default ECGDiagnosticsPanel; 