/**
 * ECGViewerPage.tsx
 * 
 * Enhanced navigation for ECG studies with:
 * - Study selector with search
 * - Calendar for day selection
 * - Time range slider
 * - Quick presets for common time ranges
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Calendar, Clock, ChevronLeft, ChevronRight, FastForward, Rewind } from 'lucide-react'
import { useStudyContext } from '@/context/StudyContext'
import { CalendarSelector } from '../CalendarSelector'
import { EcgAggregatorView } from './EcgAggregatorView'
import MainECGViewer from './MainECGViewer'
import { usePodDays } from '../../../hooks/api/usePodDays'
import { useStudyDetails } from '../../../hooks/api/useStudyDetails'
import type { Database } from '../../../types/database.types'

// Time range presets
const TIME_PRESETS = [
    { minutes: 5, label: '5 min' },
    { minutes: 15, label: '15 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 60, label: '1 hour' }
]

function formatTimeRange(date: Date, minutes: number): { start: string; end: string } {
    const start = new Date(date)
    const end = new Date(start.getTime() + minutes * 60 * 1000)
    return {
        start: start.toISOString(),
        end: end.toISOString()
    }
}

type PodDay = Database['public']['Functions']['get_pod_days']['Returns'][0]

export default function ECGViewerPage() {
    const { studyId } = useParams<{ studyId: string }>()
    const { data: study, isLoading: studyLoading, error: studyError } = useStudyDetails(studyId || '')
    const [selectedDay, setSelectedDay] = useState<Date>(new Date())
    const [selectedHour, setSelectedHour] = useState<number | null>(null)
    const [subwindow, setSubwindow] = useState<{ start: string; end: string } | null>(null)
    const [viewerOpen, setViewerOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPreset, setSelectedPreset] = useState<number>(15) // Default to 15min

    // Load available days for the selected pod
    const { data: podDays, isLoading: daysLoading } = usePodDays(study?.pod_id || '')

    // Set initial day when study data loads
    useEffect(() => {
        if (study?.start_timestamp) {
            setSelectedDay(new Date(study.start_timestamp))
        }
    }, [study?.start_timestamp])

    // Navigation helpers
    const moveTimeRange = (direction: 'forward' | 'backward') => {
        if (!subwindow) return
        const currentStart = new Date(subwindow.start)
        const currentEnd = new Date(subwindow.end)
        const duration = currentEnd.getTime() - currentStart.getTime()

        if (direction === 'forward') {
            const newStart = new Date(currentEnd)
            const newEnd = new Date(newStart.getTime() + duration)
            setSubwindow({
                start: newStart.toISOString(),
                end: newEnd.toISOString()
            })
        } else {
            const newEnd = new Date(currentStart)
            const newStart = new Date(newEnd.getTime() - duration)
            setSubwindow({
                start: newStart.toISOString(),
                end: newEnd.toISOString()
            })
        }
    }

    if (studyLoading || daysLoading) {
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
                            <CalendarSelector
                                availableDays={podDays?.map((d: PodDay) => d.day_value) || []}
                                onSelectDay={setSelectedDay}
                                selectedDate={selectedDay}
                            />
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
                                                setSubwindow(formatTimeRange(selectedDay, preset.minutes))
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

                            {subwindow && (
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
                                                <span>{new Date(subwindow.start).toLocaleTimeString()}</span>
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span>{new Date(subwindow.end).toLocaleTimeString()}</span>
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
                            {subwindow && study.pod_id && (
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
                            setSubwindow({ start, end })
                        }}
                        pageSize={60}
                    />
                )}
            </div>

            {/* ECG Viewer Modal */}
            {viewerOpen && subwindow && study.pod_id && (
                <MainECGViewer
                    podId={study.pod_id}
                    timeStart={subwindow.start}
                    timeEnd={subwindow.end}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </div>
    )
}
