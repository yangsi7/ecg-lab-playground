/**
 * FILE: src/components/labs/MainECGViewer.tsx
 * 
 * Uses chunked data loading with infinite scroll for efficient
 * ECG visualization.
 */
import React, { useEffect, useRef, useMemo } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useChunkedECG, useChunkedECGDiagnostics, type ECGSample } from '../../../hooks/api/useChunkedECG'
import { AdvancedECGPlot } from './AdvancedECGPlot'
import type { ECGData } from '../../../types/domain/ecg'

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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load ECG data in chunks
    const {
        samples,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: dataLoading,
        error: dataError
    } = useChunkedECG({
        pod_id: podId,
        time_start: timeStart,
        time_end: timeEnd,
        factor: 4 // 80Hz visualization
    });

    // Load diagnostics in parallel
    const {
        diagnostics,
        isLoading: diagLoading,
        error: diagError
    } = useChunkedECGDiagnostics({
        pod_id: podId,
        time_start: timeStart,
        time_end: timeEnd
    });

    // Transform samples into ECGData format
    const ecgData = useMemo<ECGData[]>(() => 
        samples.map(sample => ({
            sample_time: sample.time,
            downsampled_channel_1: sample.channels[0],
            downsampled_channel_2: sample.channels[1],
            downsampled_channel_3: sample.channels[2],
            lead_on_p_1: sample.lead_on_p[0],
            lead_on_p_2: sample.lead_on_p[1],
            lead_on_p_3: sample.lead_on_p[2],
            lead_on_n_1: sample.lead_on_n[0],
            lead_on_n_2: sample.lead_on_n[1],
            lead_on_n_3: sample.lead_on_n[2],
            quality_1: sample.quality[0],
            quality_2: sample.quality[1],
            quality_3: sample.quality[2]
        })), [samples]);

    // Handle infinite scroll
    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        const handleScroll = () => {
            const { scrollHeight, scrollTop, clientHeight } = scrollElement;
            // Load more when within 500px of bottom
            if (scrollHeight - scrollTop - clientHeight < 500 && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        };

        scrollElement.addEventListener('scroll', handleScroll);
        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Show loading state
    if (dataLoading || diagLoading) {
        return (
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                </div>
            </div>
        );
    }

    // Show error state
    if (dataError || diagError) {
        return (
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="text-sm font-medium">Error loading ECG data</h3>
                    </div>
                    <p className="mt-1 text-sm text-red-300">{dataError || diagError}</p>
                </div>
            </div>
        );
    }

    // Show data
    return (
        <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" ref={scrollRef}>
            <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                    {diagnostics[0] && (
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-gray-400">
                                Sampling Rate: {diagnostics[0].metrics.connection_stats.sampling_frequency}Hz
                            </div>
                            <div className="text-gray-400">
                                Quality: {Math.round(diagnostics[0].metrics.signal_quality.quality_scores.channel_1)}%
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Channel plots */}
                <AdvancedECGPlot
                    data={ecgData}
                    channel={1}
                    label="Lead I"
                />
                <AdvancedECGPlot
                    data={ecgData}
                    channel={2}
                    label="Lead II"
                />
                <AdvancedECGPlot
                    data={ecgData}
                    channel={3}
                    label="Lead III"
                />

                {/* Loading indicator for next chunk */}
                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
                    </div>
                )}
            </div>
        </div>
    );
}
