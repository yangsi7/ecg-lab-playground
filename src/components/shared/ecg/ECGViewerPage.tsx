/**
 * ECGViewerPage.tsx
 * 
 * Enhanced navigation for ECG studies with:
 * - Study selector with search
 * - Calendar for day selection
 * - Time range slider
 * - Quick presets for common time ranges
 */

import React, { useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Calendar, Clock, FastForward, Rewind } from 'lucide-react'
import { useStudyContext } from '@/context/StudyContext'
import { useTimeRange } from '@/context/TimeRangeContext'
import { CalendarSelector } from '@/components/shared/CalendarSelector/index'
import { EcgAggregatorView } from './EcgAggregatorView'
import MainECGViewer from './MainECGViewer'
import { usePodDays } from '@/hooks/api/pod/usePodDays'
import { useStudyDetails } from '@/hooks/api/study/useStudyDetails'
import { useLatestECGTimestamp } from '@/hooks/api/ecg/useLatestECGTimestamp'
import type { Database } from '@/types'

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

    // Load available days for the selected pod
    const { data: podDays, isLoading: daysLoading } = usePodDays(study?.pod_id || '')

    // Set initial day when study data loads
    useEffect(() => {
        // Only proceed if we don't have a selected day and have required data
        if (!selectedDay && !studyLoading) {
            if (latestTimestamp) {
                // Use the latest timestamp if available
                const latestDate = new Date(latestTimestamp)
                console.log('Setting selected day from latest timestamp', { latestDate })
                setSelectedDay(latestDate)
                
                // Only update time range if it doesn't exist
                if (!timeRange) {
                    updateTimeRangeForDay(latestDate)
                }
            } else if (study?.start_timestamp) {
                // Fall back to study start time if no latest timestamp
                const startDate = new Date(study.start_timestamp)
                console.log('Setting selected day from study start', { startDate })
                setSelectedDay(startDate)
                
                // Only update time range if it doesn't exist
                if (!timeRange) {
                    updateTimeRangeForDay(startDate)
                }
            }
        }
    }, [latestTimestamp, study, setSelectedDay, updateTimeRangeForDay, selectedDay, timeRange, studyLoading])

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
                                {study.start_timestamp ? new Date(study.start_timestamp).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400">End Time:</span>
                            <span className="ml-2 text-white">
                                {study.end_timestamp ? new Date(study.end_timestamp).toLocaleString() : 'N/A'}
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
                                <button
                                    onClick={() => setViewerOpen(true)}
                                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                                             rounded-lg text-white font-medium transition-colors"
                                >
                                    View ECG
                                </button>
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
