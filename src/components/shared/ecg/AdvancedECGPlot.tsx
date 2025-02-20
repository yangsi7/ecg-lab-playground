/**
 * AdvancedECGPlot.tsx
 *
 * Phase 3 advanced interactive ECG:
 *  - Horizontal pan & pinch-zoom (via mouse wheel).
 *  - Color-blind mode toggles wave color for better accessibility.
 *  - Minimal tooltip to show time & amplitude on hover.
 *  - Y-range adjustable: zoom in/out or fit data automatically.
 *
 * Usage:
 *   <AdvancedECGPlot data={downsampleData} channel={1} />
 */

import React, { useEffect } from 'react'
import { ZoomIn, ZoomOut, Crop, EyeOff } from 'lucide-react'
import type { ECGData } from '../../../types/domain/ecg'
import { useECGCanvas } from '../../../hooks/api/ecg'

interface AdvancedECGPlotProps {
    data: ECGData[]
    channel: 1 | 2 | 3
    width?: number
    height?: number
    label?: string
    defaultYMin?: number
    defaultYMax?: number
    colorBlindMode?: boolean
}

export function AdvancedECGPlot({
    data,
    channel,
    width = 800,
    height = 250,
    label = `Advanced Ch ${channel}`,
    defaultYMin = -50,
    defaultYMax = 50,
    colorBlindMode = false
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
        handleMouseLeave,
        zoomInRange,
        zoomOutRange,
        fitYRange,
        toggleColorBlindMode
    } = useECGCanvas({
        data,
        channel,
        width,
        height,
        defaultYMin,
        defaultYMax,
        colorBlindMode
    })

    // Compute time domain
    const t0 = data.length ? new Date(data[0].sample_time).getTime() : 0
    const t1 = data.length ? new Date(data[data.length - 1].sample_time).getTime() : 0
    const totalMs = Math.max(1, t1 - t0)

    // Drawing
    useEffect(() => {
        if (!canvasRef.current) return
        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, width, height)
        // background
        ctx.fillStyle = '#111111'
        ctx.fillRect(0, 0, width, height)
        // subtle grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        for (let yy = 0; yy < height; yy += 25) {
            ctx.beginPath()
            ctx.moveTo(0, yy)
            ctx.lineTo(width, yy)
            ctx.stroke()
        }
        for (let xx = 0; xx < width; xx += 50) {
            ctx.beginPath()
            ctx.moveTo(xx, 0)
            ctx.lineTo(xx, height)
            ctx.stroke()
        }

        if (!data.length) {
            ctx.fillStyle = 'gray'
            ctx.fillText('No data', 10, height / 2)
            return
        }
        const yRange = yMax - yMin
        const msInView = totalMs / scaleX
        const panMsOffset = (-translateX / width) * msInView

        ctx.beginPath()
        ctx.lineWidth = 1.4
        ctx.strokeStyle = waveColor

        let firstValid = true
        for (let i = 0; i < data.length; i++) {
            const pt = data[i]
            let waveVal = 0
            let leadOn = false
            if (channel === 1) {
                waveVal = pt.downsampled_channel_1
                leadOn = pt.lead_on_p_1 && pt.lead_on_n_1
            } else if (channel === 2) {
                waveVal = pt.downsampled_channel_2
                leadOn = pt.lead_on_p_2 && pt.lead_on_n_2
            } else {
                waveVal = pt.downsampled_channel_3
                leadOn = pt.lead_on_p_3 && pt.lead_on_n_3
            }

            const ptMs = new Date(pt.sample_time).getTime()
            const localMs = ptMs - t0
            const shiftedMs = localMs - panMsOffset
            const xRatio = shiftedMs / msInView
            const x = xRatio * width
            if (x < 0 || x > width) {
                // skip if off screen
                continue
            }
            if (!leadOn) {
                // skip if lead off
                ctx.moveTo(x, height / 2)
                continue
            }
            const yVal = (waveVal - yMin) / yRange
            const scrY = height - (yVal * height)
            if (firstValid) {
                ctx.moveTo(x, scrY)
                firstValid = false
            } else {
                ctx.lineTo(x, scrY)
            }
        }
        ctx.stroke()

        // label
        ctx.fillStyle = 'white'
        ctx.font = '12px sans-serif'
        ctx.fillText(`${label} (zoom x${scaleX.toFixed(1)})`, 8, 14)
    }, [data, channel, width, height, yMin, yMax, translateX, scaleX, waveColor, label, t0, totalMs])

    return (
        <div 
            className="relative bg-white/5 border border-white/10 rounded-md shadow-sm w-full p-2 select-none"
            onMouseLeave={handleMouseLeave}
        >
            {/* Top row controls */}
            <div className="flex items-center gap-2 pb-2">
                <button 
                    onClick={zoomOutRange}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-sm text-gray-300"
                    title="Expand Y-range"
                >
                    <ZoomOut className="h-4 w-4"/>
                </button>
                <button 
                    onClick={zoomInRange}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-sm text-gray-300"
                    title="Compress Y-range"
                >
                    <ZoomIn className="h-4 w-4"/>
                </button>
                <button 
                    onClick={fitYRange}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded text-sm text-gray-300"
                    title="Fit Y-range to data"
                >
                    <Crop className="h-4 w-4"/>
                </button>
                <button
                    onClick={toggleColorBlindMode}
                    className={`p-1 rounded text-sm transition-colors ${
                        isColorBlindMode ? 'bg-orange-500/20 text-orange-300' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                    title="Toggle color-blind-friendly palette"
                >
                    <EyeOff className="h-4 w-4" />
                </button>
            </div>

            <div style={{ width: `${width}px`, height: `${height}px` }} className="relative">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="w-full h-auto touch-none"
                    aria-label={isColorBlindMode ? "ECG wave (color-blind mode)" : "ECG wave chart"}
                />
                {showTooltip && tooltipText && (
                    <div 
                        className="absolute px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none"
                        style={{ left: tooltipX + 8, top: tooltipY + 8 }}
                    >
                        {tooltipText}
                    </div>
                )}
            </div>
        </div>
    )
}
