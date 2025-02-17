/**
 * FILE: src/components/labs/ECGViewer.tsx
 * 
 * Aggregator-based subwindow approach. No direct factor usage here.
 * If you want to open MainECGViewer after picking subwindow,
 * pass the chosen time range to MainECGViewer.
 */
import { useState } from 'react'
import { useECGAggregates } from '../../../hooks/api/useECGAggregates'
import { HourlyECGAggregator } from './HourlyECGAggregator'

interface ECGViewerProps {
    study: {
        pod_id: string;
        start_timestamp: string;
        end_timestamp: string;
    };
    onClose: () => void;
}

export function ECGViewer({ study, onClose }: ECGViewerProps) {
    const [windowRange, setWindowRange] = useState<{start: string, end: string} | null>(null);

    function handleFinalSubwindow(startIso: string, endIso: string) {
        setWindowRange({ start: startIso, end: endIso });
        // In a real scenario, you could open MainECGViewer with these times.
    }

    return (
        <div className="p-4 text-white">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">ECG Viewer (Aggregator Flow)</h2>
                <button
                    onClick={onClose}
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                    Close
                </button>
            </div>
            <p className="text-sm text-gray-300 mb-2">Pod ID: {study.pod_id}</p>

            <HourlyECGAggregator
                podId={study.pod_id}
                date={new Date(study.start_timestamp)}
                hour={0}
                onSubwindowFinal={handleFinalSubwindow}
            />
            {windowRange && (
                <div className="mt-4 text-blue-300 text-sm">
                    Final Subwindow: {windowRange.start} → {windowRange.end}
                </div>
            )}
        </div>
    );
}
