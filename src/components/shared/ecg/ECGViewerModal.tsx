/********************************************************************
 * FILE: src/components/labs/ECGViewerModal.tsx
 * 
 * - This modal now simply calls "useDownsampleECG" to fetch wave data.
 * - It supports an overrideMaxPoints input for naive capping logic, 
 *   or uses dynamic from the hook's logic (time range × 100).
 ********************************************************************/
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDownsampleECG } from '../../hooks/useDownsampleECG';
import { AdvancedECGPlot } from './AdvancedECGPlot';

interface ECGViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    podId: string;
    timeStart: string;
    timeEnd: string;
}

export default function ECGViewerModal({
    isOpen,
    onClose,
    podId,
    timeStart,
    timeEnd
}: ECGViewerModalProps) {
    const [overrideMaxPoints, setOverrideMaxPoints] = useState<number | undefined>(undefined);

    // Hook fetch
    const { data, loading, error } = useDownsampleECG({
        pod_id: podId,
        time_start: timeStart,
        time_end: timeEnd,
        overrideMaxPoints
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            {/* Modal box */}
            <div className="relative bg-gray-800 p-4 rounded-md w-full max-w-5xl border border-white/10">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 bg-white/10 rounded hover:bg-white/20"
                >
                    <X className="h-4 w-4 text-white" />
                </button>

                <h2 className="text-white font-semibold mb-2 text-lg">
                    ECG Viewer: {podId}
                </h2>
                <div className="text-sm text-gray-300 mb-2">
                    {timeStart} → {timeEnd}
                </div>

                {/* Override input */}
                <div className="flex gap-2 items-center mb-2">
                    <label className="text-xs text-gray-400">Max Points Override:</label>
                    <input
                        type="number"
                        className="bg-white/5 border border-white/10 px-2 py-1 rounded text-sm text-white"
                        placeholder="0=auto"
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setOverrideMaxPoints(val <= 0 ? undefined : val);
                        }}
                    />
                </div>

                {/* States */}
                {loading && <p className="text-gray-400">Loading ECG data...</p>}
                {error && <p className="text-red-400">Error: {error}</p>}
                {!loading && !error && data.length === 0 && (
                    <p className="text-gray-300">No ECG data in this time window.</p>
                )}

                {/* Wave display */}
                {!loading && !error && data.length > 0 && (
                    <div className="space-y-6">
                        <AdvancedECGPlot data={data} channel={1} label="Lead I" />
                        <AdvancedECGPlot data={data} channel={2} label="Lead II" />
                        <AdvancedECGPlot data={data} channel={3} label="Lead III" />
                    </div>
                )}
            </div>
        </div>
    );
}
