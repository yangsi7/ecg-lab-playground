/**
 * AdvancedECGPlot.tsx
 *
 * A high-end, production-ready ECG plotting component with:
 *  • Horizontal panning and scroll/pinch zoom.
 *  • Color-blind palette toggle for accessibility.
 *  • Tooltip showing time & amplitude on hover.
 *  • Fully adjustable Y-range (expand/compress/auto-fit).
 *  • Keyboard navigation and ARIA tags for accessibility.
 *  • Synchronized multi-channel support.
 *  • Polished design, minimalistic UI, and smooth user interactions.
 *
 * Usage:
 *   <AdvancedECGPlot
 *       pod_id={downsampleData.pod_id}
 *       time_start={downsampleData.time_start}
 *       time_end={downsampleData.time_end}
 *       channel={1}
 *   />
 */

import React from 'react';
import { ZoomIn, ZoomOut, Crop, EyeOff, Move, Link } from 'lucide-react';
import { useAdvancedECG } from '@/hooks/api/ecg/useAdvancedECG';

interface AdvancedECGPlotProps {
  pod_id: string;
  time_start: string;
  time_end: string;
  channel: 1 | 2 | 3;
  width?: number;
  height?: number;
  label?: string;
  defaultYMin?: number;
  defaultYMax?: number;
  colorBlindMode?: boolean;
  factor?: number;
  // Synchronization props
  sharedScaleX?: number;
  sharedTranslateX?: number;
  onScaleChange?: (scale: number) => void;
  onTranslateChange?: (translate: number) => void;
  syncEnabled?: boolean;
}

export function AdvancedECGPlot({
  pod_id,
  time_start,
  time_end,
  channel,
  width = 800,
  height = 250,
  label = `Lead ${channel === 1 ? 'I' : channel === 2 ? 'II' : 'III'}`,
  defaultYMin = -50,
  defaultYMax = 50,
  colorBlindMode = false,
  factor = 4,
  // Synchronization props
  sharedScaleX,
  sharedTranslateX,
  onScaleChange,
  onTranslateChange,
  syncEnabled = false
}: AdvancedECGPlotProps) {
  const {
    canvasRef,
    scaleX,
    translateX,
    yMin,
    yMax,
    isColorBlindMode,
    showTooltip,
    tooltipX,
    tooltipY,
    tooltipText,
    waveColor,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave: handleCanvasMouseLeave,
    zoomInRange,
    zoomOutRange,
    fitYRange,
    toggleColorBlindMode,
    isLoading,
    error
  } = useAdvancedECG({
    pod_id,
    time_start,
    time_end,
    channel,
    width,
    height,
    defaultYMin,
    defaultYMax,
    colorBlindMode,
    factor,
    sharedScaleX,
    sharedTranslateX,
    onScaleChange,
    onTranslateChange,
    syncEnabled
  });

  // Auto-fit Y-range when data loads successfully
  React.useEffect(() => {
    if (!isLoading && !error) {
      fitYRange();
    }
  }, [isLoading, error, fitYRange]);

  // Container mouse leave handler
  const handleContainerMouseLeave = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handleCanvasMouseLeave(e as unknown as React.MouseEvent<HTMLCanvasElement>);
  }, [handleCanvasMouseLeave]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[250px] bg-white/5 border border-white/10 rounded-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[250px] bg-red-500/10 border border-red-500/20 rounded-md">
        <div className="text-red-400">Error loading ECG data: {error}</div>
      </div>
    );
  }

  return (
    <div
      className="relative bg-white/5 border border-white/10 rounded-md shadow-sm w-full p-2 select-none"
      onMouseLeave={handleContainerMouseLeave}
      role="region"
      aria-label={`ECG plot for ${label}`}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between pb-2" role="toolbar" aria-label="Plot controls">
        {/* Left-side controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOutRange}
            className="p-1 bg-white/10 hover:bg-white/20 rounded text-sm text-gray-300"
            title="Expand Y-range"
            aria-label="Expand Y-range"
          >
            <ZoomOut className="h-4 w-4"/>
          </button>
          <button
            onClick={zoomInRange}
            className="p-1 bg-white/10 hover:bg-white/20 rounded text-sm text-gray-300"
            title="Compress Y-range"
            aria-label="Compress Y-range"
          >
            <ZoomIn className="h-4 w-4"/>
          </button>
          <button
            onClick={fitYRange}
            className="p-1 bg-white/10 hover:bg-white/20 rounded text-sm text-gray-300"
            title="Fit Y-range to data"
            aria-label="Fit Y-range to data"
          >
            <Crop className="h-4 w-4"/>
          </button>
          <button
            onClick={toggleColorBlindMode}
            className={`p-1 rounded text-sm transition-colors ${
              isColorBlindMode
                ? 'bg-orange-500/20 text-orange-300'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
            title="Toggle color-blind-friendly palette"
            aria-label="Toggle color-blind-friendly palette"
            aria-pressed={isColorBlindMode}
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-2">
          {syncEnabled && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <Link className="h-3 w-3" />
              <span>Synchronized</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Move className="h-3 w-3" />
            <span>Pan: drag | Zoom: scroll</span>
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div
        className="relative"
        style={{ width: `${width}px`, height: `${height}px` }}
        role="img"
        aria-label={`ECG waveform for ${label}`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-auto touch-none"
          tabIndex={0}
          aria-label={isColorBlindMode ? 'ECG wave (color-blind mode)' : 'ECG wave chart'}
        />
        {showTooltip && tooltipText && (
          <div
            className="absolute px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none transition-opacity"
            style={{ left: tooltipX + 8, top: tooltipY + 8 }}
            role="tooltip"
          >
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  );
}