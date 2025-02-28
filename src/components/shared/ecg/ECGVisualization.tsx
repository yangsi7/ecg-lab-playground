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
  channel = 0,
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
  
  // Y-axis range (default values that work well for most ECG data)
  const yMin = -1000;
  const yMax = 1000;
  
  return (
    <div className="relative">
      {/* Main ECG Plot */}
      <AdvancedECGPlot
        pod_id={podId}
        time_start={timeStart}
        time_end={timeEnd}
        channel={channel as 1 | 2 | 3}
        width={width}
        height={height}
        colorBlindMode={colorBlindMode}
        defaultYMin={yMin}
        defaultYMax={yMax}
      />
      
      {/* Debug toggle button */}
      {debug && (
        <button
          onClick={toggleDiagnostics}
          className="absolute top-2 right-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 p-1.5 rounded-md"
          title="Toggle diagnostics"
        >
          <Bug className="h-4 w-4" />
        </button>
      )}
      
      {/* Data metrics - only shown in debug mode */}
      {debug && (
        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-xs text-gray-300 rounded px-2 py-1 flex items-center gap-2">
          <ActivitySquare className="h-3 w-3 text-blue-400" />
          <span>{data.length} points</span>
          {metrics.queryDuration > 0 && (
            <span className="text-gray-400">{Math.round(metrics.queryDuration)}ms</span>
          )}
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
