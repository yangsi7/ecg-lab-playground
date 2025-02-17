/**
 * FILE: src/components/labs/MainECGViewer.tsx
 * 
 * Replaces the "overrideMaxPoints" with "overrideFactor".
 * If user sets factor=1 => pick every sample,
 * factor=2 => every 2nd, factor=3 => every 3rd,
 * server clamps >3 => 3
 */
import React from 'react'
import { X } from 'lucide-react'
import { useECGData } from '../../../hooks/api/useECGData'
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
    const { data, loading, error } = useECGData({
        podId,
        timeStart,
        timeEnd
    });

    return (
        <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="h-5 w-5 text-gray-400" />
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-red-400">Error loading ECG data</h3>
                    <p className="mt-1 text-sm text-red-300">{error}</p>
                </div>
            )}

            {!loading && !error && data && (
                <div className="space-y-6">
                    <AdvancedECGPlot data={data} channel={1} label="Lead I" />
                    <AdvancedECGPlot data={data} channel={2} label="Lead II" />
                    <AdvancedECGPlot data={data} channel={3} label="Lead III" />
                </div>
            )}
        </div>
    );
}
