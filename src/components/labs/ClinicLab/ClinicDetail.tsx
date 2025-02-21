/**
 * src/components/labs/ClinicLab/ClinicDetail.tsx
 *
 * This is a new page to show a single clinic's stats in more depth,
 * accessible via route "/clinic/:clinicId".
 *
 * We'll reuse the "useClinicAnalytics" hook with the given clinicId,
 * then display the same or expanded charts/time-series specifically for that clinic.
 */

import { useParams } from 'react-router-dom'
import { useClinicAnalytics } from '../../../hooks/api/useClinicAnalytics'
import { AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react'
import { SimpleBarChart, type ChartData } from '../../shared/charts/SimpleBarChart'

export default function ClinicDetail() {
    const { clinicId } = useParams<{ clinicId: string }>()
    const {
        loading,
        error,
        overview,
        statusBreakdown,
        qualityBreakdown,
        weeklyQuality,
        monthlyQuality,
        weeklyStudies,
        monthlyStudies
    } = useClinicAnalytics(clinicId ?? null)

    // Transform data for charts
    const weeklyQualityData: ChartData[] = weeklyQuality.map(wq => ({
        week_start: wq.week_start,
        average_quality: wq.average_quality,
        value: wq.average_quality // Required by ChartData
    }))

    const monthlyQualityData: ChartData[] = monthlyQuality.map(mq => ({
        month_start: mq.month_start,
        average_quality: mq.average_quality,
        value: mq.average_quality // Required by ChartData
    }))

    const weeklyStudiesData: ChartData[] = weeklyStudies.map(ws => ({
        week_start: ws.week_start,
        open_studies: ws.open_studies,
        value: ws.open_studies // Required by ChartData
    }))

    const monthlyStudiesData: ChartData[] = monthlyStudies.map(ms => ({
        month_start: ms.month_start,
        open_studies: ms.open_studies,
        value: ms.open_studies // Required by ChartData
    }))

    if (loading) {
        return (
            <div className="text-center text-gray-400 py-8">
                Loading clinic details...
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center text-red-400 py-4">
                Error: {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Overview cards */}
            {overview && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white/10 backdrop-blur-xl overflow-hidden rounded-xl border border-white/10 transition hover:scale-[1.01] hover:shadow-lg">
                        <div className="p-5 flex items-center">
                            <Activity className="h-6 w-6 text-blue-400" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-300">Active Studies</p>
                                <p className="text-xl text-white font-semibold">
                                    {overview.active_studies}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl overflow-hidden rounded-xl border border-white/10 transition hover:scale-[1.01] hover:shadow-lg">
                        <div className="p-5 flex items-center">
                            <TrendingUp className="h-6 w-6 text-emerald-400" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-300">Total Studies</p>
                                <p className="text-xl text-white font-semibold">
                                    {overview.total_studies}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl overflow-hidden rounded-xl border border-white/10 transition hover:scale-[1.01] hover:shadow-lg">
                        <div className="p-5 flex items-center">
                            <Clock className="h-6 w-6 text-blue-400" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-300">Avg. Quality Hours</p>
                                <p className="text-xl text-white font-semibold">
                                    {overview.average_quality_hours.toFixed(1)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl overflow-hidden rounded-xl border border-white/10 transition hover:scale-[1.01] hover:shadow-lg">
                        <div className="p-5 flex items-center">
                            <AlertTriangle className="h-6 w-6 text-yellow-400" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-300">Recent Alerts</p>
                                <p className="text-xl text-white font-semibold">
                                    {overview.recent_alerts?.length ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quality Trends */}
            <div className="flex flex-wrap gap-4">
                {weeklyQualityData.length > 0 && (
                    <SimpleBarChart
                        data={weeklyQualityData}
                        xKey="week_start"
                        yKey="value"
                        label="Weekly Average Quality"
                        color="#f59e0b"
                    />
                )}
                {monthlyQualityData.length > 0 && (
                    <SimpleBarChart
                        data={monthlyQualityData}
                        xKey="month_start"
                        yKey="value"
                        label="Monthly Average Quality"
                        color="#84cc16"
                    />
                )}
            </div>

            {/* Study Trends */}
            <div className="flex flex-wrap gap-4">
                {weeklyStudiesData.length > 0 && (
                    <SimpleBarChart
                        data={weeklyStudiesData}
                        xKey="week_start"
                        yKey="value"
                        label="Weekly Open Studies"
                        color="#3b82f6"
                    />
                )}
                {monthlyStudiesData.length > 0 && (
                    <SimpleBarChart
                        data={monthlyStudiesData}
                        xKey="month_start"
                        yKey="value"
                        label="Monthly Open Studies"
                        color="#22d3ee"
                    />
                )}
            </div>

            {/* Status Breakdown */}
            {statusBreakdown && statusBreakdown.length > 0 && (
                <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                    <h3 className="text-lg text-white font-semibold mb-3">Status Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-300">
                            <thead className="border-b border-white/20">
                                <tr>
                                    <th className="px-3 py-2 text-left">Total</th>
                                    <th className="px-3 py-2 text-left">Open</th>
                                    <th className="px-3 py-2 text-left">Intervene</th>
                                    <th className="px-3 py-2 text-left">Monitor</th>
                                    <th className="px-3 py-2 text-left">On Target</th>
                                    <th className="px-3 py-2 text-left">24h Completion</th>
                                    <th className="px-3 py-2 text-left">Needs Ext</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statusBreakdown.map((row, idx) => (
                                    <tr key={idx} className="border-b border-white/5">
                                        <td className="px-3 py-2">{row.total_studies}</td>
                                        <td className="px-3 py-2">{row.open_studies}</td>
                                        <td className="px-3 py-2">{row.intervene_count}</td>
                                        <td className="px-3 py-2">{row.monitor_count}</td>
                                        <td className="px-3 py-2">{row.on_target_count}</td>
                                        <td className="px-3 py-2">{row.near_completion_count}</td>
                                        <td className="px-3 py-2">{row.needs_extension_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quality Breakdown */}
            {qualityBreakdown && qualityBreakdown.length > 0 && (
                <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                    <h3 className="text-lg text-white font-semibold mb-3">Quality Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-300">
                            <thead className="border-b border-white/20">
                                <tr>
                                    <th className="px-3 py-2 text-left">Total</th>
                                    <th className="px-3 py-2 text-left">Open</th>
                                    <th className="px-3 py-2 text-left">Avg Quality</th>
                                    <th className="px-3 py-2 text-left">Good</th>
                                    <th className="px-3 py-2 text-left">So-so</th>
                                    <th className="px-3 py-2 text-left">Bad</th>
                                    <th className="px-3 py-2 text-left">Critical</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qualityBreakdown.map((row, idx) => (
                                    <tr key={idx} className="border-b border-white/5">
                                        <td className="px-3 py-2">{row.total_studies}</td>
                                        <td className="px-3 py-2">{row.open_studies}</td>
                                        <td className="px-3 py-2">{(row.average_quality * 100).toFixed(1)}%</td>
                                        <td className="px-3 py-2">{row.good_count}</td>
                                        <td className="px-3 py-2">{row.soso_count}</td>
                                        <td className="px-3 py-2">{row.bad_count}</td>
                                        <td className="px-3 py-2">{row.critical_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
