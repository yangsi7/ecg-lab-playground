/**
 * ECGViewerPage.tsx
 * 
 * Enhanced navigation for ECG studies with:
 * - Study selector with search
 * - Calendar for day selection
 * - Time range slider
 * - Quick presets for common time ranges
 */

import React, { useEffect, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Calendar, Clock, FastForward, Rewind, Download } from 'lucide-react'
import { useStudyContext } from '@/context/StudyContext'
import { useTimeRange } from '@/context/TimeRangeContext'
import { CalendarSelector } from '@/components/shared/CalendarSelector/index'
import { EcgAggregatorView } from './EcgAggregatorView'
import MainECGViewer from './MainECGViewer'
import { usePodDays } from '@/hooks/api/pod/usePodDays'
import { useStudyDetails } from '@/hooks/api/study/useStudyDetails'
import { useLatestECGTimestamp } from '@/hooks/api/ecg/useLatestECGTimestamp'
import { supabase } from '@/types/supabase'
import type { Database } from '@/types'
import { logger } from '@/lib/logger'

// Time range presets
const TIME_PRESETS = [
    { minutes: 5, label: '5 min' },
    { minutes: 15, label: '15 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 60, label: '1 hour' }
]

type PodDay = Database['public']['Functions']['get_pod_days']['Returns'][0]

export default function ECGViewerPage() {
    const { studyId } = useParams<{ studyId: string }>()
    const { data: study, isLoading: studyLoading, error: studyError } = useStudyDetails(studyId || '')
    const { data: latestTimestamp, isLoading: timestampLoading } = useLatestECGTimestamp(studyId || '')
    
    // Get time range context
    const {
        selectedDay,
        timeRange,
        selectedPreset,
        setSelectedDay,
        setTimeRange,
        setSelectedPreset,
        updateTimeRangeForDay
    } = useTimeRange()

    const [selectedHour, setSelectedHour] = React.useState<number | null>(null)
    const [viewerOpen, setViewerOpen] = React.useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [downsampleFactor, setDownsampleFactor] = useState(4) // Default to 4 (80Hz)
    const [selectedChannels, setSelectedChannels] = useState({
        channel1: true,
        channel2: true,
        channel3: true,
        leadStatus: true,
        quality: true
    })
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
        visible: boolean;
    } | null>(null)
    const [filename, setFilename] = useState<string>(() => {
        return study?.study_id ? `ECG_${study.study_id}` : 'ECG_data';
    });

    // Load available days for the selected pod
    const { data: podDays, isLoading: daysLoading } = usePodDays(study?.pod_id || '')

    // Set initial day when study data loads
    useEffect(() => {
        // Only proceed if we don't have a selected day and have required data
        if (!selectedDay && !studyLoading && !daysLoading) {
            // Find the most recent day with ECG data
            if (podDays && podDays.length > 0) {
                // Sort days in descending order (newest first)
                const sortedDays = [...podDays].sort((a, b) => {
                    return b.getTime() - a.getTime();
                });
                
                // Select the most recent day
                const mostRecentDay = sortedDays[0];
                console.log('Setting selected day to most recent day with ECG data', { mostRecentDay });
                setSelectedDay(mostRecentDay);
                
                // Only update time range if it doesn't exist
                if (!timeRange) {
                    updateTimeRangeForDay(mostRecentDay);
                }
            } else if (latestTimestamp) {
                // Fall back to latest timestamp if no pod days available
                const latestDate = new Date(latestTimestamp);
                console.log('Setting selected day from latest timestamp', { latestDate });
                setSelectedDay(latestDate);
                
                // Only update time range if it doesn't exist
                if (!timeRange) {
                    updateTimeRangeForDay(latestDate);
                }
            } else if (study?.study_start) {
                // Fall back to study start time if no latest timestamp
                const startDate = new Date(study.study_start);
                console.log('Setting selected day from study start', { startDate });
                setSelectedDay(startDate);
                
                // Only update time range if it doesn't exist
                if (!timeRange) {
                    updateTimeRangeForDay(startDate);
                }
            }
        }
    }, [selectedDay, studyLoading, daysLoading, podDays, latestTimestamp, study, setSelectedDay, timeRange, updateTimeRangeForDay]);

    // Navigation helpers
    const moveTimeRange = (direction: 'forward' | 'backward') => {
        if (!timeRange) return
        const currentStart = new Date(timeRange.start)
        const currentEnd = new Date(timeRange.end)
        const duration = currentEnd.getTime() - currentStart.getTime()

        if (direction === 'forward') {
            const newStart = new Date(currentEnd)
            const newEnd = new Date(newStart.getTime() + duration)
            setTimeRange({
                start: newStart.toISOString(),
                end: newEnd.toISOString()
            })
            setSelectedDay(newStart) // Update selected day to match the new range
        } else {
            const newEnd = new Date(currentStart)
            const newStart = new Date(newEnd.getTime() - duration)
            setTimeRange({
                start: newStart.toISOString(),
                end: newEnd.toISOString()
            })
            setSelectedDay(newStart) // Update selected day to match the new range
        }
    }

    // Memoize the onSelectDay callback
    const handleSelectDay = useCallback((date: Date) => {
        setSelectedDay(date);
        updateTimeRangeForDay(date);
    }, [setSelectedDay, updateTimeRangeForDay]);

    // Show notification with auto-hide
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({
            type,
            message,
            visible: true
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, visible: false } : null);
        }, 5000);
    };

    // Toggle channel selection
    const toggleChannel = (channel: keyof typeof selectedChannels) => {
        setSelectedChannels(prev => ({
            ...prev,
            [channel]: !prev[channel]
        }));
    };

    interface ECGSample {
        time: string;
        downsampled_channel_1: number;
        downsampled_channel_2: number;
        downsampled_channel_3: number;
        lead_on_p_1: boolean;
        lead_on_p_2: boolean;
        lead_on_p_3: boolean;
        lead_on_n_1: boolean;
        lead_on_n_2: boolean;
        lead_on_n_3: boolean;
        quality_1: boolean;
        quality_2: boolean;
        quality_3: boolean;
    }
    
    // Interface for parallel array response from downsample_ecg
    interface ParallelECGData {
        timestamps: string[];
        channel_1: number[];
        channel_2: number[];
        channel_3: number[];
        lead_on_p_1: boolean[];
        lead_on_p_2: boolean[];
        lead_on_p_3: boolean[];
        lead_on_n_1: boolean[];
        lead_on_n_2: boolean[];
        lead_on_n_3: boolean[];
        quality_1: boolean[];
        quality_2: boolean[];
        quality_3: boolean[];
    }

    const downloadECG = async () => {
        if (!timeRange || !study?.pod_id) return;
        
        try {
            setIsDownloading(true);
            setDownloadProgress(0);
            
            const { data, error } = await supabase.rpc('downsample_ecg', {
                p_pod_id: study.pod_id,
                p_time_start: timeRange.start,
                p_time_end: timeRange.end,
                p_factor: downsampleFactor
                // No chunk_minutes parameter for downsample_ecg
            });
            
            if (error) throw error;
            
            if (!data) {
                throw new Error('No ECG data available for the selected time range');
            }
            
            // Process parallel array data structure 
            const parallelData = data as unknown as ParallelECGData;
            
            if (!parallelData.timestamps || !Array.isArray(parallelData.timestamps) || parallelData.timestamps.length === 0) {
                throw new Error('No ECG timestamps available for the selected time range');
            }
            
            const totalSamples = parallelData.timestamps.length;
            const updateFrequency = Math.max(1, Math.floor(totalSamples / 20)); // Update progress ~20 times
            
            // Convert to CSV
            // Build header based on selected channels
            const headerParts: string[] = ['timestamp'];
            if (selectedChannels.channel1) headerParts.push('channel_1');
            if (selectedChannels.channel2) headerParts.push('channel_2');
            if (selectedChannels.channel3) headerParts.push('channel_3');
            
            if (selectedChannels.leadStatus) {
                headerParts.push('lead_on_p_1', 'lead_on_p_2', 'lead_on_p_3', 'lead_on_n_1', 'lead_on_n_2', 'lead_on_n_3');
            }
            
            if (selectedChannels.quality) {
                headerParts.push('quality_1', 'quality_2', 'quality_3');
            }
            
            const header = headerParts.join(',');
            
            // Build rows based on selected channels and parallel arrays
            const rows: string[] = [];
            
            for (let i = 0; i < totalSamples; i++) {
                const rowParts: (string | number | boolean)[] = [parallelData.timestamps[i]];
                
                if (selectedChannels.channel1) rowParts.push(parallelData.channel_1[i]);
                if (selectedChannels.channel2) rowParts.push(parallelData.channel_2[i]);
                if (selectedChannels.channel3) rowParts.push(parallelData.channel_3[i]);
                
                if (selectedChannels.leadStatus) {
                    rowParts.push(
                        parallelData.lead_on_p_1[i],
                        parallelData.lead_on_p_2[i],
                        parallelData.lead_on_p_3[i],
                        parallelData.lead_on_n_1[i],
                        parallelData.lead_on_n_2[i],
                        parallelData.lead_on_n_3[i]
                    );
                }
                
                if (selectedChannels.quality) {
                    rowParts.push(
                        parallelData.quality_1[i],
                        parallelData.quality_2[i],
                        parallelData.quality_3[i]
                    );
                }
                
                rows.push(rowParts.join(','));
                
                // Update progress periodically
                if (i % updateFrequency === 0 || i === totalSamples - 1) {
                    const progress = Math.round(((i + 1) / totalSamples) * 100);
                    setDownloadProgress(progress);
                }
            }
            
            const csv = [header, ...rows].join('\n');
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('success', `ECG data successfully downloaded as ${filename}.csv`);
        } catch (err) {
            console.error('Error downloading ECG data:', err);
            console.error('Study pod_id:', study?.pod_id);
            showNotification('error', `Failed to download ECG data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    if (studyLoading || daysLoading || timestampLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
        )
    }

    if (studyError || !study) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-500/10 rounded-xl p-4">
                        <h2 className="text-lg font-medium text-red-400">Error Loading Study</h2>
                        <p className="mt-2 text-sm text-red-300">
                            {studyError?.message || 'Study not found'}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
            {/* Notification */}
            {notification && notification.visible && (
                <div 
                    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-opacity duration-300 ${
                        notification.type === 'success' 
                            ? 'bg-emerald-500/90 text-white' 
                            : 'bg-red-500/90 text-white'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span>{notification.message}</span>
                        <button 
                            onClick={() => setNotification(prev => prev ? { ...prev, visible: false } : null)}
                            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Close notification"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Study Info */}
                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-400" />
                        Study Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Study ID:</span>
                            <span className="ml-2 text-white">{study.study_id}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Pod ID:</span>
                            <span className="ml-2 text-white">{study.pod_id}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Start Time:</span>
                            <span className="ml-2 text-white">
                                {study.study_start ? new Date(study.study_start).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">End Time:</span>
                            <span className="ml-2 text-white">
                                {study.study_completed ? new Date(study.study_completed).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Calendar & Time Selection */}
                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        Time Selection
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calendar */}
                        <div>
                            <h3 className="text-sm text-gray-400 mb-2">Select Day</h3>
                            {(!podDays || podDays.length === 0) ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <Calendar className="h-5 w-5" />
                                        <h3 className="text-sm font-medium">No recording days available</h3>
                                    </div>
                                    <p className="mt-2 text-sm text-amber-300">
                                        There may be an issue fetching the day data for this study, or no recordings are available yet.
                                    </p>
                                    <p className="mt-2 text-sm text-amber-300">
                                        <strong>Quick Fix:</strong> Try searching for a different pod in your study list to verify that ECG viewing works properly.
                                    </p>
                                </div>
                            ) : (
                                <CalendarSelector
                                    availableDays={podDays}
                                    onSelectDay={handleSelectDay}
                                    selectedDate={selectedDay}
                                />
                            )}
                        </div>

                        {/* Time Range Selection */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm text-gray-400 mb-2">Quick Presets</h3>
                                <div className="flex flex-wrap gap-2">
                                    {TIME_PRESETS.map(preset => (
                                        <button
                                            key={preset.minutes}
                                            onClick={() => {
                                                setSelectedPreset(preset.minutes)
                                                updateTimeRangeForDay(selectedDay)
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                selectedPreset === preset.minutes
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {timeRange && (
                                <div className="space-y-2">
                                    <h3 className="text-sm text-gray-400">Selected Range</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => moveTimeRange('backward')}
                                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg"
                                            title="Previous range"
                                        >
                                            <Rewind className="h-4 w-4" />
                                        </button>
                                        <div className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm">
                                            <div className="flex items-center justify-between text-gray-300">
                                                <span>{new Date(timeRange.start).toLocaleTimeString()}</span>
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span>{new Date(timeRange.end).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => moveTimeRange('forward')}
                                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg"
                                            title="Next range"
                                        >
                                            <FastForward className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* View ECG Button */}
                            {timeRange && study.pod_id && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={() => setViewerOpen(true)}
                                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                                                 rounded-lg text-white font-medium transition-colors"
                                    >
                                        View ECG
                                    </button>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="downsample-factor" className="text-xs text-gray-400">
                                                Resolution
                                            </label>
                                            <select
                                                id="downsample-factor"
                                                value={downsampleFactor}
                                                onChange={(e) => setDownsampleFactor(Number(e.target.value))}
                                                className="px-3 py-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                title="Select downsampling factor"
                                            >
                                                <option value="1">320Hz (Raw)</option>
                                                <option value="2">160Hz</option>
                                                <option value="4">80Hz</option>
                                                <option value="8">40Hz</option>
                                                <option value="16">20Hz</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="filename" className="text-xs text-gray-400">
                                                Filename
                                            </label>
                                            <input
                                                id="filename"
                                                type="text"
                                                value={filename}
                                                onChange={(e) => setFilename(e.target.value)}
                                                placeholder="ECG_data"
                                                className="px-3 py-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                title="Enter filename for download"
                                            />
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-400">Channels</span>
                                            <div className="flex gap-2 flex-wrap bg-gray-700 p-2 rounded-lg">
                                                <label className="flex items-center gap-1.5 text-sm text-white cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedChannels.channel1}
                                                        onChange={() => toggleChannel('channel1')}
                                                        className="rounded text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span>Ch 1</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 text-sm text-white cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedChannels.channel2}
                                                        onChange={() => toggleChannel('channel2')}
                                                        className="rounded text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span>Ch 2</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 text-sm text-white cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedChannels.channel3}
                                                        onChange={() => toggleChannel('channel3')}
                                                        className="rounded text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span>Ch 3</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 text-sm text-white cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedChannels.leadStatus}
                                                        onChange={() => toggleChannel('leadStatus')}
                                                        className="rounded text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span>Lead Status</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 text-sm text-white cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedChannels.quality}
                                                        onChange={() => toggleChannel('quality')}
                                                        className="rounded text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span>Quality</span>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            onClick={downloadECG}
                                            disabled={isDownloading}
                                            className={`w-full px-4 py-2 ${
                                                isDownloading
                                                    ? 'bg-blue-400 cursor-wait'
                                                    : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                                            } rounded-lg text-white font-medium transition-colors relative overflow-hidden`}
                                        >
                                            {isDownloading && (
                                                <div 
                                                    className="absolute left-0 top-0 bottom-0 bg-blue-600 transition-all" 
                                                    style={{ width: `${downloadProgress}%` }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {isDownloading ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                        Downloading... {downloadProgress}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4" />
                                                        Download ECG
                                                    </>
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Aggregator View */}
                {selectedDay && selectedHour !== null && study.pod_id && (
                    <EcgAggregatorView
                        podId={study.pod_id}
                        timeInterval="hourly"
                        initialDate={selectedDay}
                        onTimeRangeSelect={(start, end) => {
                            setSelectedHour(null)
                            setTimeRange({ start, end })
                            setSelectedDay(new Date(start))
                        }}
                        pageSize={60}
                    />
                )}
            </div>

            {/* ECG Viewer Modal */}
            {viewerOpen && timeRange && study.pod_id && (
                <MainECGViewer
                    podId={study.pod_id}
                    timeStart={timeRange.start}
                    timeEnd={timeRange.end}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </div>
    )
}
