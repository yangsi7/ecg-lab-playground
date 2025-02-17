/**
 * ECGViewerPage.tsx
 * The final "page" that orchestrates:
 *  1) a date-based calendar
 *  2) daily aggregator (3 stacked bars)
 *  3) hourly aggregator subwindow selection
 *  4) open MainECGViewer as modal
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftCircle } from 'lucide-react'
import CalendarSelectorPodDays from '../CalendarSelectorPodDays'
import { ECGAggregator } from './ECGAggregator'
import { HourlyECGAggregator } from './HourlyECGAggregator'
import MainECGViewer from './MainECGViewer'
import { useSingleStudy } from '../../../hooks/api/useSingleStudy'
import { usePodDays } from '../../../hooks/api/usePodDays'

function ECGViewerFlow() {
    const { studyId } = useParams<{ studyId: string }>()
    const { study, loading: studyLoading, error: studyError } = useSingleStudy(studyId)
    const { days: availableDays, loading: daysLoading, error: daysError } = usePodDays(study?.pod_id ?? '')
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [selectedHour, setSelectedHour] = useState<number | null>(null)
    const [subwindow, setSubwindow] = useState<{ start: string, end: string } | null>(null)
    const [viewerOpen, setViewerOpen] = useState(false)

    const loading = studyLoading || daysLoading
    const error = studyError || daysError

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
        )
    }
    if (error || !study?.pod_id) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-red-400">Error loading study details</h3>
                <p className="mt-1 text-sm text-red-300">{error || 'Pod not found'}</p>
            </div>
        )
    }

    // Convert dates to ISO strings for the calendar
    const availableDayStrings = availableDays.map(d => d.toISOString())

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Step 1: Calendar for day selection */}
                <CalendarSelectorPodDays
                    availableDays={availableDayStrings}
                    onSelectDay={(day: Date) => {
                        setSelectedDay(day)
                        setSelectedHour(null)
                        setSubwindow(null)
                        setViewerOpen(false)
                    }}
                    selectedDate={selectedDay}
                />

                <div className="flex-1 space-y-6 text-white">
                    <div className="text-sm text-gray-300">
                        <div>Study ID: {studyId}</div>
                        <div>Pod ID: {study.pod_id}</div>
                    </div>

                    {/* Step 2: Daily aggregator */}
                    {selectedDay && (
                        <ECGAggregator 
                            podId={study.pod_id}
                            timeInterval="daily"
                            initialDate={selectedDay}
                            onTimeRangeSelect={(start, end) => {
                                const hour = new Date(start).getHours()
                                setSelectedHour(hour)
                                setSubwindow(null)
                                setViewerOpen(false)
                            }}
                        />
                    )}

                    {/* Step 3: Hour aggregator => subwindow selection */}
                    {selectedDay && selectedHour !== null && (
                        <HourlyECGAggregator
                            podId={study.pod_id}
                            date={selectedDay}
                            hour={selectedHour}
                            onSubwindowFinal={(startIso, endIso) => {
                                setSubwindow({ start: startIso, end: endIso })
                            }}
                        />
                    )}

                    {/* Step 4: Button to open final wave viewer */}
                    {subwindow && (
                        <div className="flex flex-col gap-2">
                            <div className="text-sm text-blue-300 break-all">
                                Subwindow: {subwindow.start} → {subwindow.end}
                            </div>
                            <button
                                onClick={() => setViewerOpen(true)}
                                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/30
                                           active:scale-95 transition self-start text-sm font-medium"
                            >
                                View ECG
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 5: Show final wave if user clicked */}
            {viewerOpen && subwindow && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
                    <MainECGViewer
                        podId={study.pod_id}
                        timeStart={subwindow.start}
                        timeEnd={subwindow.end}
                        onClose={() => setViewerOpen(false)}
                    />
                </div>
            )}
        </div>
    )
}

export default function ECGViewerPage() {
    const { studyId } = useParams<{ studyId: string }>()
    const navigate = useNavigate()

    if (!studyId) {
        return (
            <div className="text-red-500 text-sm p-4">
                No studyId param provided.
            </div>
        )
    }

    return (
        <div className="text-white space-y-4">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
            >
                <ArrowLeftCircle className="h-5 w-5" />
                <span>Back</span>
            </button>

            <ECGViewerFlow />
        </div>
    )
}
