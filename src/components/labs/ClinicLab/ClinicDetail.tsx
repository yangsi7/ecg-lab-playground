/**
 * src/components/labs/ClinicDetail.tsx
 *
 * This is a new page to show a single clinic's stats in more depth,
 * accessible via route "/clinic/:clinicId".
 *
 * We'll reuse the "useClinicAnalytics" hook with the given clinicId,
 * then display the same or expanded charts/time-series specifically for that clinic.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useClinicAnalytics } from '../../hooks/useClinicAnalytics'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

// We'll reuse the same "SimpleBarChart" for demonstration
function SimpleBarChart({
    data,
    xKey,
    yKey,
    label,
    color = '#4ade80',
    width = 600,
    height = 120
}: {
    data: any[]
    xKey: string
    yKey: string
    label: string
    color?: string
    width?: number
    height?: number
}) {
    return (
        <div className="bg-white/10 p-4 rounded-md border border-white/20 w-full max-w-xl">
            <div className="text-sm text-white mb-2">{label}</div>
            <canvas
                width={width}
                height={height}
                className="w-full h-auto"
                ref={(canvas) => {
                    if (!canvas) return
                    const ctx = canvas.getContext('2d')
                    if (!ctx) return

                    ctx.clearRect(0, 0, width, height)

                    const values = data.map(d => d[yKey] as number)
                    if (!values.length) {
                        ctx.fillStyle = '#aaa'
                        ctx.fillText('No data', 10, height / 2)
                        return
                    }

                    const maxVal = Math.max(...values)
                    const barWidth = width / data.length
                    const padding = 5

                    data.forEach((item, idx) => {
                        const val = item[yKey]
                        const barHeight = maxVal > 0 ? (val / maxVal) * (height - padding) : 0
                        const xPos = idx * barWidth
                        const yPos = height - barHeight
                        ctx.fillStyle = color
                        ctx.fillRect(xPos, yPos, barWidth - 1, barHeight)
                    })
                }}
            />
            {!data.length && (
                <p className="text-xs text-gray-400 mt-1">No {label} data found.</p>
            )}
        </div>
    )
}

export default function ClinicDetail() {
    const { clinicId } = useParams<{ clinicId: string }>()
    const navigate = useNavigate()
    const {
        loading,
        error,
        overview,
        weeklyQuality,
        monthlyQuality,
        weeklyStudies,
        monthlyStudies
    } = useClinicAnalytics(clinicId)

    // If no clinicId, we might redirect or show an error
    useEffect(() => {
        if (!clinicId) {
            navigate('/clinic') // or some fallback
        }
    }, [clinicId])

    if (!clinicId) {
        return <div className="text-red-400 text-sm p-4">No clinic ID provided.</div>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
        )
    }
    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-red-400">Error loading clinic details</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/10 rounded hover:bg-white/20 transition"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-300" />
                </button>
                <h1 className="text-xl font-semibold text-white">Clinic Detail: {clinicId}</h1>
            </div>

            {/* Overview */}
            {overview && (
                <div className="flex items-center gap-6 bg-white/10 p-4 rounded-xl border border-white/10">
                    <div className="text-sm text-gray-300">
                        <p>Active Studies: <span className="text-white">{overview.active_studies}</span></p>
                        <p>Total Studies: <span className="text-white">{overview.total_studies}</span></p>
                        <p>Avg Quality Hours: <span className="text-white">{overview.average_quality_hours.toFixed(1)}</span></p>
                        <p>Alerts: <span className="text-white">{overview.recent_alerts.length}</span></p>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-6">
                {/* Weekly Quality */}
                {weeklyQuality && weeklyQuality.length > 0 && (
                    <SimpleBarChart
                        data={weeklyQuality}
                        xKey="week_start"
                        yKey="average_quality"
                        label="Weekly Avg Quality"
                        color="#f59e0b"
                    />
                )}

                {/* Monthly Quality */}
                {monthlyQuality && monthlyQuality.length > 0 && (
                    <SimpleBarChart
                        data={monthlyQuality}
                        xKey="month_start"
                        yKey="average_quality"
                        label="Monthly Avg Quality"
                        color="#84cc16"
                    />
                )}

                {/* Weekly Studies */}
                {weeklyStudies && weeklyStudies.length > 0 && (
                    <SimpleBarChart
                        data={weeklyStudies}
                        xKey="week_start"
                        yKey="open_studies"
                        label="Weekly Open Studies"
                        color="#3b82f6"
                    />
                )}

                {/* Monthly Studies */}
                {monthlyStudies && monthlyStudies.length > 0 && (
                    <SimpleBarChart
                        data={monthlyStudies}
                        xKey="month_start"
                        yKey="open_studies"
                        label="Monthly Open Studies"
                        color="#22d3ee"
                    />
                )}
            </div>
        </div>
    )
}
