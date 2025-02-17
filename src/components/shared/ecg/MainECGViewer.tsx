/**
 * FILE: src/components/labs/MainECGViewer.tsx
 * 
 * Replaces the "overrideMaxPoints" with "overrideFactor".
 * If user sets factor=1 => pick every sample,
 * factor=2 => every 2nd, factor=3 => every 3rd,
 * server clamps >3 => 3
 */
import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useDownsampleECG } from '../../hooks/useDownsampleECG'
import { AdvancedECGPlot } from './AdvancedECGPlot'

interface MainECGViewerProps {
    podId: string;
    timeStart: string;
    timeEnd: string;
    onClose: () => void;
}

export default function MainECGViewer({
    podId,
    timeStart,
    timeEnd,
    onClose
}: MainECGViewerProps) {
    const [overrideFactor, setOverrideFactor] = useState<number | undefined>(1);

    const { data, loading, error } = useDownsampleECG({
        pod_id: podId,
        time_start: timeStart,
        time_end: timeEnd,
        overrideFactor
    });

    function handleFactorChange(val: number) {
        if (val < 1) {
            setOverrideFactor(1);
        } else if (val > 3) {
            setOverrideFactor(3);
        } else {
            setOverrideFactor(val);
        }
    }

    return (
        <div className="relative rounded-xl bg-white/10 backdrop-blur-lg shadow-xl border border-white/20 p-4 
                        animate-fade-in flex flex-col gap-4 max-w-4xl w-full">
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-md bg-white/5 hover:bg-white/20 text-gray-300"
                title="Close ECG Viewer"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex justify-between items-center">
                <div className="text-white font-medium text-sm">
                    Subwindow: {timeStart} → {timeEnd}
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                    <label className="text-xs text-gray-400">Factor:</label>
                    <input
                        type="number"
                        min={1}
                        max={3}
                        value={overrideFactor}
                        onChange={(e) => handleFactorChange(Number(e.target.value))}
                        className="w-16 p-1 rounded bg-white/10 border border-white/20 focus:outline-none text-xs"
                    />
                </div>
            </div>

            {loading && (
                <div className="w-full py-6 text-center text-gray-400 text-sm">
                    Loading ECG waveform...
                </div>
            )}
            {error && !loading && (
                <div className="w-full py-6 text-center text-red-300 text-sm">
                    {error}
                </div>
            )}
            {!loading && !error && data.length === 0 && (
                <div className="w-full py-6 text-center text-gray-400 text-sm">
                    No data in this time window.
                </div>
            )}

            {!loading && !error && data.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    <AdvancedECGPlot data={data} channel={1} label="Lead I (Naive Decimation)" />
                    <AdvancedECGPlot data={data} channel={2} label="Lead II (Naive Decimation)" />
                    <AdvancedECGPlot data={data} channel={3} label="Lead III (Naive Decimation)" />
                </div>
            )}
        </div>
    );
}
