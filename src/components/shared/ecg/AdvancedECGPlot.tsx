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

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { DownsamplePoint } from '../../hooks/useDownsampleECG'
import { ZoomIn, ZoomOut, Crop, EyeOff } from 'lucide-react'

interface AdvancedECGPlotProps {
    data: DownsamplePoint[]
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
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Horizontal zoom/pan
    const [scaleX, setScaleX] = useState(1)         // horizontal zoom factor
    const [translateX, setTranslateX] = useState(0) // horizontal shift in px
    const [panning, setPanning] = useState(false)
    const [panStartX, setPanStartX] = useState(0)

    // Y-range management
    const [yMin, setYMin] = useState(defaultYMin)
    const [yMax, setYMax] = useState(defaultYMax)

    // Tooltip
    const [showTooltip, setShowTooltip] = useState(false)
    const [tooltipX, setTooltipX] = useState(0)
    const [tooltipY, setTooltipY] = useState(0)
    const [tooltipText, setTooltipText] = useState('')

    // color-blind mode
    const [isColorBlindMode, setIsColorBlindMode] = useState(colorBlindMode)
    const waveColorNormal = 'rgba(129,230,217,0.8)' // pastel teal
    const waveColorBlind  = 'rgba(0,120,180,0.9)'
    const waveColor = isColorBlindMode ? waveColorBlind : waveColorNormal

    // Compute time domain
    const t0 = data.length ? new Date(data[0].sample_time).getTime() : 0
    const t1 = data.length ? new Date(data[data.length - 1].sample_time).getTime() : 0
    const totalMs = Math.max(1, t1 - t0)

    // MouseWheel => horizontal zoom
    const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        // negative delta => zoom in
        const direction = e.deltaY < 0 ? 1.1 : 0.9
        setScaleX((prev) => {
            const next = prev * direction
            if (next < 0.5) return 0.5
            if (next > 10) return 10
            return next
        })
    }, [])

    // Pan
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setPanning(true)
        setPanStartX(e.clientX)
    }
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const xPos = e.clientX - rect.left
        const yPos = e.clientY - rect.top

        if (panning) {
            // dragging => pan
            const dx = e.clientX - panStartX
            setTranslateX((t) => t + dx)
            setPanStartX(e.clientX)
        } else {
            // show tooltip if data
            if (!data.length) return
            setShowTooltip(true)

            const msInView = totalMs / scaleX
            const panMsOffset = (-translateX / width) * msInView
            const localMs = (xPos / width) * msInView - panMsOffset
            const actualMs = t0 + localMs
            // find closest point
            let closest = data[0]
            let minDist = Infinity
            for (let i = 0; i < data.length; i++) {
                const thisMs = new Date(data[i].sample_time).getTime()
                const dist = Math.abs(thisMs - actualMs)
                if (dist < minDist) {
                    minDist = dist
                    closest = data[i]
                }
            }
            let waveVal = 0
            if (channel === 1) waveVal = closest.downsampled_channel_1
            else if (channel === 2) waveVal = closest.downsampled_channel_2
            else waveVal = closest.downsampled_channel_3

            const ts = new Date(closest.sample_time).toLocaleTimeString([], { hour12: false })
            setTooltipText(`${ts} • ${waveVal.toFixed(1)}µV`)
            setTooltipX(xPos)
            setTooltipY(yPos)
        }
    }
    const handleMouseUp = () => setPanning(false)
    const handleMouseLeave = () => {
        setPanning(false)
        setShowTooltip(false)
    }

    // Y-range adjustments
    const zoomOutRange = () => {
        setYMin(m => m * 1.2)
        setYMax(m => m * 1.2)
    }
    const zoomInRange = () => {
        setYMin(m => m * 0.8)
        setYMax(m => m * 0.8)
    }
    const fitYRange = () => {
        if (!data.length) return
        let minVal = Infinity
        let maxVal = -Infinity
        data.forEach(pt => {
            let v = 0
            if (channel === 1) v = pt.downsampled_channel_1
            else if (channel === 2) v = pt.downsampled_channel_2
            else v = pt.downsampled_channel_3
            if (v < minVal) minVal = v
            if (v > maxVal) maxVal = v
        })
        if (minVal === Infinity || maxVal === -Infinity) return
        const pad = (maxVal - minVal) * 0.1
        setYMin(minVal - pad)
        setYMax(maxVal + pad)
    }

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
    }, [data, channel, width, height, yMin, yMax, translateX, scaleX, waveColor])

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
                    onClick={() => setIsColorBlindMode(b => !b)}
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
