/**
 * MinuteSlider.tsx
 * 
 * Presents a quick minute-level slider to pick a subrange within an hour.
 * Then calls onRangeConfirm(startIso, endIso).
 */
import React, { useState, useEffect } from 'react';

interface MinuteSliderProps {
    date: Date;
    hour: number;
    onRangeConfirm: (startIso: string, endIso: string) => void;
}

export default function MinuteSlider({ date, hour, onRangeConfirm }: MinuteSliderProps) {
    const [startMin, setStartMin] = useState(0);
    const [endMin, setEndMin] = useState(60);

    useEffect(() => {
        setStartMin(0);
        setEndMin(60);
    }, [date, hour]);

    const handleConfirm = () => {
        const base = new Date(date);
        base.setHours(hour, 0, 0, 0);
        const startTime = new Date(base.getTime() + startMin * 60000);
        const endTime = new Date(base.getTime() + endMin * 60000);
        onRangeConfirm(startTime.toISOString(), endTime.toISOString());
    };

    return (
        <div className="p-3 bg-white/10 border border-white/20 rounded space-y-2">
            <p className="text-sm text-gray-200">
                Hour {hour} - Select minutes range
            </p>
            <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300">Start:</label>
                <input
                    type="range"
                    min={0}
                    max={59}
                    value={startMin}
                    onChange={(e) => setStartMin(Number(e.target.value))}
                />
                <span className="text-xs text-blue-300 w-10 text-right">{startMin}m</span>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300">End:</label>
                <input
                    type="range"
                    min={startMin}
                    max={60}
                    value={endMin}
                    onChange={(e) => setEndMin(Number(e.target.value))}
                />
                <span className="text-xs text-blue-300 w-10 text-right">{endMin}m</span>
            </div>

            <button
                onClick={handleConfirm}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition text-sm"
            >
                Confirm
            </button>
        </div>
    );
}
