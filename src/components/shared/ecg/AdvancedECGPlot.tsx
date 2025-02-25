/**
 * AdvancedECGPlot.tsx
 *
 * Phase 3 advanced interactive ECG:
 *  - Horizontal pan & pinch-zoom (via mouse wheel or touch).
 *  - Color-blind mode toggles wave color for better accessibility.
 *  - Minimal tooltip to show time & amplitude on hover.
 *  - Y-range adjustable: zoom in/out or fit data automatically.
 *  - Keyboard navigation support.
 *  - ARIA labels and roles for accessibility.
 *
 * Usage:
 *   <AdvancedECGPlot pod_id={downsampleData.pod_id} time_start={downsampleData.time_start} time_end={downsampleData.time_end} channel={1} />
 */

import React from 'react';
import { ZoomIn, ZoomOut, Crop, EyeOff, Move } from 'lucide-react';
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
    chunk_minutes?: number;
}

export function AdvancedECGPlot({
    pod_id,
    time_start,
    time_end,
    channel,
    width = 800,
    height = 250,
    label = `Advanced Ch ${channel}`,
    defaultYMin = -50,
    defaultYMax = 50,
    colorBlindMode = false,
    factor = 4,
    chunk_minutes = 5
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
        error,
        hasMoreData,
        isFetchingMore,
        loadMoreData
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
        chunk_minutes
    });

    // Touch event handlers
    const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const canvas = e.currentTarget;
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            handleMouseDown({ 
                clientX: x,
                currentTarget: canvas,
                preventDefault: () => e.preventDefault()
            } as React.MouseEvent<HTMLCanvasElement>);
        }
    }, [handleMouseDown]);

    const handleTouchMove = React.useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const canvas = e.currentTarget;
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            handleMouseMove({
                clientX: x,
                currentTarget: canvas,
                preventDefault: () => e.preventDefault()
            } as React.MouseEvent<HTMLCanvasElement>);
        }
    }, [handleMouseMove]);

    const handleTouchEnd = React.useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        handleMouseUp(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    }, [handleMouseUp]);

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
            {/* Controls */}
            <div className="flex items-center gap-2 pb-2" role="toolbar" aria-label="Plot controls">
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
                        isColorBlindMode ? 'bg-orange-500/20 text-orange-300' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                    title="Toggle color-blind-friendly palette"
                    aria-label="Toggle color-blind-friendly palette"
                    aria-pressed={isColorBlindMode}
                >
                    <EyeOff className="h-4 w-4" />
                </button>
                <div className="ml-2 flex items-center gap-1 text-xs text-gray-400">
                    <Move className="h-3 w-3" />
                    <span>Pan: drag | Zoom: scroll | Keys: ←→+-fc</span>
                </div>
            </div>

            {/* Canvas container */}
            <div 
                style={{ width: `${width}px`, height: `${height}px` }} 
                className="relative"
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
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="w-full h-auto touch-none"
                    tabIndex={0}
                    aria-label={isColorBlindMode ? "ECG wave (color-blind mode)" : "ECG wave chart"}
                />
                {showTooltip && tooltipText && (
                    <div 
                        className="absolute px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none"
                        style={{ left: tooltipX + 8, top: tooltipY + 8 }}
                        role="tooltip"
                    >
                        {tooltipText}
                    </div>
                )}
            </div>

            {/* Load more button */}
            {hasMoreData && (
                <div className="mt-2 flex justify-center">
                    <button
                        onClick={() => loadMoreData()}
                        disabled={isFetchingMore}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isFetchingMore
                                ? 'bg-blue-500/20 text-blue-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        {isFetchingMore ? 'Loading...' : 'Load More Data'}
                    </button>
                </div>
            )}
        </div>
    );
}
