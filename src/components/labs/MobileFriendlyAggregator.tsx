/**
 * MobileFriendlyAggregator.tsx
 * 
 * Alternative aggregator for minute-level subwindow selection on small screens.
 * Instead of 60 bars, we use a dual-range approach with "From" and "To" sliders for easier mobile usage.
 *
 * Usage:
 *  <MobileFriendlyAggregator
 *    hourStartISO={someHour.toISOString()}
 *    onSubwindowFinal={(startIso, endIso) => { ... }}
 *    defaultMinutes={4}
 *    maxMinutes={60}
 *  />
 */

import React, { useState, useEffect } from 'react'

interface MobileFriendlyAggregatorProps {
    hourStartISO: string
    onSubwindowFinal: (startIso: string, endIso: string) => void
    defaultMinutes?: number
    maxMinutes?: number
}

export function MobileFriendlyAggregator({
    hourStartISO,
    onSubwindowFinal,
    defaultMinutes = 4,
    maxMinutes = 60
}: MobileFriendlyAggregatorProps) {
    const [startMin, setStartMin] = useState(maxMinutes - defaultMinutes)
    const [endMin, setEndMin] = useState(maxMinutes)

    // On mount, pick the last "defaultMinutes" from the hour
    useEffect(() => {
        setStartMin(Math.max(0, endMin - defaultMinutes))
    }, [])

    // Whenever range changes, update subwindow
    useEffect(() => {
        if (startMin < 0) return
        if (endMin > maxMinutes) return
        if (startMin >= endMin) return

        // Convert from minute offset to real ISO time
        const base = new Date(hourStartISO).getTime()
        const sMs = base + startMin * 60000
        const eMs = base + endMin * 60000
        onSubwindowFinal(new Date(sMs).toISOString(), new Date(eMs).toISOString())
    }, [startMin, endMin])

    return (
        <div className="bg-white/10 border border-white/20 rounded p-3 space-y-3">
            <h3 className="text-sm text-gray-300">Mobile Minute Selector</h3>
            <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">From:</label>
                <input
                    type="range"
                    min="0"
                    max={endMin.toString()}
                    value={startMin}
                    onChange={e => {
                        const val = +e.target.value
                        if (val < endMin) {
                            setStartMin(val)
                        }
                    }}
                    className="flex-1"
                />
                <span className="text-xs text-gray-300 w-12 text-right">{startMin}m</span>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">To:</label>
                <input
                    type="range"
                    min={startMin.toString()}
                    max={maxMinutes.toString()}
                    value={endMin}
                    onChange={e => {
                        const val = +e.target.value
                        if (val > startMin) {
                            setEndMin(val)
                        }
                    }}
                    className="flex-1"
                />
                <span className="text-xs text-gray-300 w-12 text-right">{endMin}m</span>
            </div>
            <div className="text-xs text-blue-300">
                Subwindow: [ {startMin}m → {endMin}m ]
            </div>
        </div>
    )
}
