/**
 * FILE: src/components/shared/ecg/MainECGViewer.tsx
 * 
 * Uses efficient data loading from the downsample-ecg edge function
 * for ECG visualization. Enhanced with responsive design, diagnostics,
 * and synchronized multi-lead viewing.
 */
import React, { useEffect, useRef, useMemo, useState } from 'react'
import { 
    X, AlertTriangle, Heart, Activity, Zap, 
    Download, Link, Link2Off, Maximize, Minimize 
} from 'lucide-react'
import { useECG, useECGDiagnostics } from '@/hooks/api/ecg'
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(true);
    
    // Shared state for synchronized plots
    const [syncEnabled, setSyncEnabled] = useState(true);
    const [sharedScaleX, setSharedScaleX] = useState(1);
    const [sharedTranslateX, setSharedTranslateX] = useState(0);
    const [colorBlindMode, setColorBlindMode] = useState(false);
    
    // Load ECG data
    const {
        samples,
        isLoading: dataLoading,
        error: dataError
    } = useECG({
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
    } = useECGDiagnostics({
        pod_id: podId,
        time_start: timeStart,
        time_end: timeEnd
    });

    // Function to download ECG data as CSV
    const handleDownloadECG = () => {
        if (!samples || samples.length === 0) {
            console.error('No ECG data available for download');
            return;
        }
        
        try {
            // Create CSV header
            const csvHeader = 'Time,Channel1,Channel2,Channel3,LeadOnP1,LeadOnP2,LeadOnP3,LeadOnN1,LeadOnN2,LeadOnN3,Quality1,Quality2,Quality3\n';
            
            // Convert samples to CSV rows
            const csvRows = samples.map(sample => {
                return [
                    sample.time,
                    sample.channels[0],
                    sample.channels[1],
                    sample.channels[2],
                    sample.lead_on_p[0],
                    sample.lead_on_p[1],
                    sample.lead_on_p[2],
                    sample.lead_on_n[0],
                    sample.lead_on_n[1],
                    sample.lead_on_n[2],
                    sample.quality[0],
                    sample.quality[1],
                    sample.quality[2]
                ].join(',');
            }).join('\n');
            
            // Combine header and rows
            const csvContent = `data:text/csv;charset=utf-8,${csvHeader}${csvRows}`;
            
            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `ecg_${podId}_${new Date(timeStart).toISOString().slice(0,19).replace(/:/g,'-')}.csv`);
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Clean up
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading ECG data:', error);
        }
    };

    // Calculate quality metrics
    const qualityMetrics = useMemo(() => {
        if (!samples.length) return null;
        const totalSamples = samples.length;
        const qualityStats = {
            lead1: { good: 0, leadOff: 0 },
            lead2: { good: 0, leadOff: 0 },
            lead3: { good: 0, leadOff: 0 }
        };

        samples.forEach(sample => {
            // Lead 1
            if (sample.lead_on_p[0] && sample.lead_on_n[0]) {
                if (sample.quality[0]) qualityStats.lead1.good++;
            } else {
                qualityStats.lead1.leadOff++;
            }
            // Lead 2
            if (sample.lead_on_p[1] && sample.lead_on_n[1]) {
                if (sample.quality[1]) qualityStats.lead2.good++;
            } else {
                qualityStats.lead2.leadOff++;
            }
            // Lead 3
            if (sample.lead_on_p[2] && sample.lead_on_n[2]) {
                if (sample.quality[2]) qualityStats.lead3.good++;
            } else {
                qualityStats.lead3.leadOff++;
            }
        });

        return {
            lead1: {
                qualityPercent: (qualityStats.lead1.good / totalSamples) * 100,
                leadOffPercent: (qualityStats.lead1.leadOff / totalSamples) * 100
            },
            lead2: {
                qualityPercent: (qualityStats.lead2.good / totalSamples) * 100,
                leadOffPercent: (qualityStats.lead2.leadOff / totalSamples) * 100
            },
            lead3: {
                qualityPercent: (qualityStats.lead3.good / totalSamples) * 100,
                leadOffPercent: (qualityStats.lead3.leadOff / totalSamples) * 100
            }
        };
    }, [samples]);

    // Toggle synchronization
    const toggleSync = () => {
        setSyncEnabled(prev => !prev);
    };

    // Toggle diagnostics panel
    const toggleDiagnostics = () => {
        setShowDiagnostics(prev => !prev);
    };

    // Toggle color blind mode for all plots
    const toggleColorBlindMode = () => {
        setColorBlindMode(prev => !prev);
    };

    // Show loading state
    if (dataLoading || diagLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 z-50">
                <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                        <button 
                            onClick={onClose} 
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close viewer"
                        >
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (dataError || diagError) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 z-50">
                <div className="bg-gray-800 p-6 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                        <button 
                            onClick={onClose} 
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close viewer"
                        >
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
            </div>
        );
    }

    // Show data
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto" ref={scrollRef}>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="space-y-1">
                        <h2 className="text-lg font-medium text-white">ECG Viewer</h2>
                        {diagnostics[0] && (
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="text-gray-400 flex items-center gap-1">
                                    <Activity className="h-4 w-4" />
                                    Sampling Rate: {diagnostics[0].metrics.connection_stats.sampling_frequency}Hz
                                </div>
                                <div className="text-gray-400 flex items-center gap-1">
                                    <Zap className="h-4 w-4" />
                                    Quality: {Math.round(diagnostics[0].metrics.signal_quality.quality_scores.channel_1)}%
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSync}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                syncEnabled 
                                    ? 'bg-blue-500/20 text-blue-300' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            title={syncEnabled ? "Disable synchronized viewing" : "Enable synchronized viewing"}
                        >
                            {syncEnabled ? <Link className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
                            {syncEnabled ? 'Synced' : 'Unsynced'}
                        </button>
                        <button
                            onClick={toggleDiagnostics}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                showDiagnostics 
                                    ? 'bg-purple-500/20 text-purple-300' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            title={showDiagnostics ? "Hide diagnostics panel" : "Show diagnostics panel"}
                        >
                            {showDiagnostics ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            {showDiagnostics ? 'Hide Stats' : 'Show Stats'}
                        </button>
                        <button
                            onClick={handleDownloadECG}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                                     rounded-lg text-white font-medium transition-colors"
                            disabled={!samples || samples.length === 0}
                            title="Download ECG data as CSV"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </button>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close viewer"
                        >
                            <X className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ECG Plots */}
                    <div className="flex-1 space-y-6">
                        <AdvancedECGPlot
                            pod_id={podId}
                            time_start={timeStart}
                            time_end={timeEnd}
                            channel={1}
                            label="Lead I"
                            width={800}
                            height={200}
                            colorBlindMode={colorBlindMode}
                            // Synchronization props
                            sharedScaleX={sharedScaleX}
                            sharedTranslateX={sharedTranslateX}
                            onScaleChange={setSharedScaleX}
                            onTranslateChange={setSharedTranslateX}
                            syncEnabled={syncEnabled}
                        />
                        <AdvancedECGPlot
                            pod_id={podId}
                            time_start={timeStart}
                            time_end={timeEnd}
                            channel={2}
                            label="Lead II"
                            width={800}
                            height={200}
                            colorBlindMode={colorBlindMode}
                            // Synchronization props
                            sharedScaleX={sharedScaleX}
                            sharedTranslateX={sharedTranslateX}
                            onScaleChange={setSharedScaleX}
                            onTranslateChange={setSharedTranslateX}
                            syncEnabled={syncEnabled}
                        />
                        <AdvancedECGPlot
                            pod_id={podId}
                            time_start={timeStart}
                            time_end={timeEnd}
                            channel={3}
                            label="Lead III"
                            width={800}
                            height={200}
                            colorBlindMode={colorBlindMode}
                            // Synchronization props
                            sharedScaleX={sharedScaleX}
                            sharedTranslateX={sharedTranslateX}
                            onScaleChange={setSharedScaleX}
                            onTranslateChange={setSharedTranslateX}
                            syncEnabled={syncEnabled}
                        />
                    </div>

                    {/* Diagnostics Panel */}
                    {showDiagnostics && qualityMetrics && (
                        <div className="lg:w-80 shrink-0 space-y-4">
                            <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2 text-white">
                                    <Heart className="h-5 w-5 text-blue-400" />
                                    <h3 className="font-medium">Signal Quality</h3>
                                </div>

                                {/* Lead I Stats */}
                                <div className="space-y-2">
                                    <h4 className="text-sm text-gray-400">Lead I</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Quality</span>
                                            <span className="text-gray-300">{qualityMetrics.lead1.qualityPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-400 rounded-full transition-all" 
                                                style={{ width: `${qualityMetrics.lead1.qualityPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Lead Off</span>
                                            <span className="text-gray-300">{qualityMetrics.lead1.leadOffPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-400 rounded-full transition-all" 
                                                style={{ width: `${qualityMetrics.lead1.leadOffPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Lead II Stats */}
                                <div className="space-y-2">
                                    <h4 className="text-sm text-gray-400">Lead II</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Quality</span>
                                            <span className="text-gray-300">{qualityMetrics.lead2.qualityPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-400 rounded-full transition-all" 
                                                style={{ width: `${qualityMetrics.lead2.qualityPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Lead Off</span>
                                            <span className="text-gray-300">{qualityMetrics.lead2.leadOffPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-400 rounded-full transition-all" 
                                                style={{ width: `${qualityMetrics.lead2.leadOffPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Lead III Stats */}
                                <div className="space-y-2">
                                    <h4 className="text-sm text-gray-400">Lead III</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Quality</span>
                                            <span className="text-gray-300">{qualityMetrics.lead3.qualityPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-400 rounded-full transition-all" 
                                                style={{ width: `${qualityMetrics.lead3.qualityPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Lead Off</span>
                                            <span className="text-gray-300">{qualityMetrics.lead3.leadOffPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-400 rounded-full transition-all" 
                                                style={{ width: `${qualityMetrics.lead3.leadOffPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional diagnostics from the backend */}
                            {diagnostics[0] && (
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <h3 className="font-medium text-white">Additional Metrics</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Connection Stats</span>
                                            <span className="text-gray-300">
                                                {diagnostics[0].metrics.connection_stats.sampling_frequency}Hz
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Signal Quality (Ch1)</span>
                                            <span className="text-gray-300">
                                                {diagnostics[0].metrics.signal_quality.quality_scores.channel_1}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Noise Level (Ch1)</span>
                                            <span className="text-gray-300">
                                                {diagnostics[0].metrics.signal_quality.noise_levels.channel_1}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
