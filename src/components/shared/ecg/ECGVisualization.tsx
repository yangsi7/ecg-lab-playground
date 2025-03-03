import React, { useState, useEffect } from 'react';
import { AdvancedECGPlot } from './AdvancedECGPlot';
import { useECGData } from '../../../hooks/api/ecg/useECGData';
import { Loader2, AlertTriangle, RefreshCw, BarChart, Bug, List, Layers, Activity, ActivitySquare } from 'lucide-react';
import ECGDiagnosticsPanel from './ECGDiagnosticsPanel';

export interface ECGVisualizationProps {
  /**
   * The ID of the pod to fetch ECG data from
   */
  podId: string;
  
  /**
   * ISO timestamp for the start time
   */
  timeStart: string;
  
  /**
   * ISO timestamp for the end time
   */
  timeEnd: string;
  
  /**
   * The ECG channel to display (0, 1, or 2)
   */
  channel?: number;
  
  /**
   * Width of the visualization in pixels
   */
  width?: number;
  
  /**
   * Height of the visualization in pixels
   */
  height?: number;
  
  /**
   * Whether to show zoom and pan controls
   */
  showControls?: boolean;
  
  /**
   * Whether to use a color blind-friendly mode
   */
  colorBlindMode?: boolean;
  
  /**
   * Downsampling factor to apply. Higher values mean fewer points.
   * Default is auto-calculated based on time range.
   */
  downsamplingFactor?: number;
  
  /**
   * Maximum points to retrieve. Default is 2000.
   */
  maxPoints?: number;
  
  /**
   * Function to call when data is loaded
   */
  onDataLoaded?: (pointCount: number) => void;
  
  /**
   * Function to call when an error occurs
   */
  onError?: (error: string) => void;
  
  /**
   * Enable debug mode with additional diagnostics
   */
  debug?: boolean;
}

/**
 * ECG Visualization Component
 * 
 * Displays ECG data fetched from the Supabase edge function.
 * Handles loading, error states, and provides debug information.
 */
export const ECGVisualization: React.FC<ECGVisualizationProps> = ({
  podId,
  timeStart,
  timeEnd,
  channel = 1,
  width = 800,
  height = 400,
  showControls = true,
  colorBlindMode = false,
  downsamplingFactor,
  maxPoints = 2000,
  onDataLoaded,
  onError,
  debug = false
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(debug);
  const [activeChannel, setActiveChannel] = useState<1 | 2 | 3>(channel as 1 | 2 | 3);
  const [autoScroll, setAutoScroll] = useState(false);
  const [quickPresetMinutes, setQuickPresetMinutes] = useState(5);
  
  // Validate inputs before making the request
  const validationError = validateInputs(podId, timeStart, timeEnd);
  
  // Calculate auto downsampling factor based on time range if not provided
  const calculatedFactor = downsamplingFactor || calculateDownsamplingFactor(timeStart, timeEnd);
  
  // Fetch ECG data
  const { data, loading, error, refetch, metrics } = useECGData(
    podId,
    timeStart,
    timeEnd,
    {
      downsamplingFactor: calculatedFactor,
      maxPoints,
      onError: (err) => {
        if (onError) onError(err);
      },
      onSuccess: (data) => {
        if (onDataLoaded) onDataLoaded(data.length);
      }
    }
  );
  
  // Auto-refresh data when continuous scrolling is enabled
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (autoScroll && !loading && !error) {
      intervalId = window.setInterval(() => {
        const now = new Date();
        const newEndTime = now.toISOString();
        const newStartTime = new Date(now.getTime() - quickPresetMinutes * 60 * 1000).toISOString();
        
        // We'll need to update these parameters with the latest time range
        refetch();
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [autoScroll, loading, error, refetch, quickPresetMinutes]);
  
  // Call onError if validation fails
  useEffect(() => {
    if (validationError && onError) {
      onError(validationError);
    }
  }, [validationError, onError]);
  
  // Toggle diagnostics panel
  const toggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
  };
  
  // Apply a time quick preset
  const applyQuickPreset = (minutes: number) => {
    setQuickPresetMinutes(minutes);
    // In a real implementation, this would update timeStart and timeEnd
    // and trigger a refetch with the new time range
  };
  
  // Handle channel selection
  const changeChannel = (newChannel: 1 | 2 | 3) => {
    setActiveChannel(newChannel);
  };
  
  // If we have a validation error, show that instead of making the request
  if (validationError) {
    return (
      <div 
        className="bg-gray-900/50 rounded-lg flex flex-col items-center justify-center gap-3 p-4"
        style={{ width, height }}
      >
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <div className="text-center">
          <div className="text-red-400 font-medium">Invalid Parameters</div>
          <div className="text-gray-400 text-sm mt-1">{validationError}</div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div 
        className="bg-gray-900/50 rounded-lg flex flex-col items-center justify-center gap-3 p-4"
        style={{ width, height }}
      >
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <div className="text-center">
          <div className="text-blue-400 font-medium">Loading ECG Data</div>
          <div className="text-gray-400 text-sm mt-1">Fetching {maxPoints} points from Pod {podId}</div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        className="bg-gray-900/50 rounded-lg flex flex-col items-center justify-center gap-3 p-4"
        style={{ width, height }}
      >
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <div className="text-red-400 font-medium">Error Loading ECG Data</div>
          <div className="text-gray-400 text-sm mt-1">{error}</div>
          <button 
            onClick={() => refetch()} 
            className="mt-3 flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-md text-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Empty data state
  if (!data || data.length === 0) {
    return (
      <div 
        className="bg-gray-900/50 rounded-lg flex flex-col items-center justify-center gap-3 p-4"
        style={{ width, height }}
      >
        <Layers className="h-8 w-8 text-gray-500" />
        <div className="text-center">
          <div className="text-gray-300 font-medium">No ECG Data Available</div>
          <div className="text-gray-400 text-sm mt-1">
            No data was found for Pod {podId} in the selected time range.
          </div>
          <button 
            onClick={() => refetch()} 
            className="mt-3 flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-md text-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Y-axis range - adjusted to better display typical ECG values
  const yMin = -5;
  const yMax = 5;
  
  return (
    <div className="relative border border-gray-700/40 rounded-lg bg-gray-900/70 overflow-hidden shadow-lg">
      {/* Top Control Bar with Quick Presets and Lead Selection */}
      <div className="flex justify-between items-center bg-gray-800/70 px-3 py-2 border-b border-gray-700/40">
        <div className="flex items-center space-x-3">
          {/* Lead Selector */}
          <div className="flex items-center bg-gray-900/50 rounded-md p-0.5">
            <button
              onClick={() => changeChannel(1)}
              className={`px-2 py-1 text-xs rounded-sm font-medium transition-colors ${
                activeChannel === 1
                  ? 'bg-blue-500/40 text-blue-200'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
              aria-pressed={activeChannel === 1}
            >
              Lead I
            </button>
            <button
              onClick={() => changeChannel(2)}
              className={`px-2 py-1 text-xs rounded-sm font-medium transition-colors ${
                activeChannel === 2
                  ? 'bg-blue-500/40 text-blue-200'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
              aria-pressed={activeChannel === 2}
            >
              Lead II
            </button>
            <button
              onClick={() => changeChannel(3)}
              className={`px-2 py-1 text-xs rounded-sm font-medium transition-colors ${
                activeChannel === 3
                  ? 'bg-blue-500/40 text-blue-200'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
              aria-pressed={activeChannel === 3}
            >
              Lead III
            </button>
          </div>
          
          {/* Quick Time Presets */}
          <div className="flex items-center">
            <span className="text-xs text-gray-400 mr-2">Time window:</span>
            <div className="flex items-center bg-gray-900/50 rounded-md p-0.5">
              <button
                onClick={() => applyQuickPreset(1)}
                className={`px-2 py-1 text-xs rounded-sm transition-colors ${
                  quickPresetMinutes === 1
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                1m
              </button>
              <button
                onClick={() => applyQuickPreset(5)}
                className={`px-2 py-1 text-xs rounded-sm transition-colors ${
                  quickPresetMinutes === 5
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                5m
              </button>
              <button
                onClick={() => applyQuickPreset(15)}
                className={`px-2 py-1 text-xs rounded-sm transition-colors ${
                  quickPresetMinutes === 15
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                15m
              </button>
              <button
                onClick={() => applyQuickPreset(60)}
                className={`px-2 py-1 text-xs rounded-sm transition-colors ${
                  quickPresetMinutes === 60
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                1h
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
              autoScroll
                ? 'bg-purple-500/30 text-purple-200'
                : 'bg-gray-900/50 hover:bg-white/5 text-gray-300'
            }`}
            aria-pressed={autoScroll}
          >
            <RefreshCw className="h-3 w-3" />
            <span>Live View</span>
          </button>
          
          {/* Debug toggle (if enabled) */}
          {debug && (
            <button
              onClick={toggleDiagnostics}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                showDiagnostics
                  ? 'bg-amber-500/30 text-amber-200'
                  : 'bg-gray-900/50 hover:bg-white/5 text-gray-300'
              }`}
            >
              <Bug className="h-3 w-3" />
              <span>Debug</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Time Range Indicator */}
      <div className="bg-gray-800/40 px-3 py-1 flex justify-between items-center text-xs text-gray-400 border-b border-gray-700/40">
        <div>
          From: <span className="text-gray-300">{new Date(timeStart).toLocaleString()}</span>
        </div>
        <div>
          To: <span className="text-gray-300">{new Date(timeEnd).toLocaleString()}</span>
        </div>
        <div>
          Duration: <span className="text-gray-300">{formatDuration(new Date(timeStart), new Date(timeEnd))}</span>
        </div>
      </div>
      
      {/* Main ECG Plot */}
      <div className="p-3">
        <AdvancedECGPlot
          pod_id={podId}
          time_start={timeStart}
          time_end={timeEnd}
          channel={activeChannel}
          width={width}
          height={height}
          colorBlindMode={colorBlindMode}
          defaultYMin={yMin}
          defaultYMax={yMax}
        />
      </div>
      
      {/* Data metrics - only shown in debug mode */}
      {debug && (
        <div className="bg-gray-800/70 px-3 py-2 border-t border-gray-700/40 text-xs text-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivitySquare className="h-3 w-3 text-blue-400" />
            <span>{data?.length || 0} data points</span>
          </div>
          {metrics?.queryDuration > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Query time: {Math.round(metrics.queryDuration)}ms</span>
              <span className="text-gray-400">Downsampling: {calculatedFactor}x</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reload</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Diagnostics panel */}
      {showDiagnostics && <ECGDiagnosticsPanel
        initiallyOpen={true}
        onClose={() => setShowDiagnostics(false)}
      />}
    </div>
  );
};

// Helper function to validate inputs
function validateInputs(podId: string, timeStart: string, timeEnd: string): string | null {
  if (!podId) {
    return "Pod ID is required";
  }
  
  if (!timeStart || !timeEnd) {
    return "Start and end times are required";
  }
  
  const start = new Date(timeStart);
  const end = new Date(timeEnd);
  
  if (isNaN(start.getTime())) {
    return "Invalid start time format";
  }
  
  if (isNaN(end.getTime())) {
    return "Invalid end time format";
  }
  
  if (start >= end) {
    return "Start time must be before end time";
  }
  
  const durationMs = end.getTime() - start.getTime();
  const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in ms
  
  if (durationMs > maxDuration) {
    return `Time range too large (${Math.round(durationMs / (60 * 60 * 1000))} hours). Maximum is 24 hours.`;
  }
  
  return null;
}

// Format duration between two dates into a readable string
function formatDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000);
  
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

// Helper function to calculate appropriate downsampling factor based on time range
function calculateDownsamplingFactor(timeStart: string, timeEnd: string): number {
  try {
    const start = new Date(timeStart);
    const end = new Date(timeEnd);
    const durationMs = end.getTime() - start.getTime();
    
    // For longer time periods, increase downsampling
    if (durationMs > 12 * 60 * 60 * 1000) { // > 12 hours
      return 15; 
    } else if (durationMs > 6 * 60 * 60 * 1000) { // > 6 hours
      return 10;
    } else if (durationMs > 3 * 60 * 60 * 1000) { // > 3 hours
      return 8;
    } else if (durationMs > 1 * 60 * 60 * 1000) { // > 1 hour
      return 5;
    } else if (durationMs > 30 * 60 * 1000) { // > 30 minutes
      return 3;
    } else if (durationMs > 10 * 60 * 1000) { // > 10 minutes
      return 2;
    }
    
    // Default - no downsampling for short periods
    return 1;
  } catch (e) {
    // If there's any error in calculation, return a safe default
    return 5;
  }
}

export default ECGVisualization;
