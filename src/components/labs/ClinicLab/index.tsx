/**
 * src/components/labs/ClinicLab.tsx
 *
 * A robust page to display clinic-level stats (for all or a specific clinic).
 * - More polished design, plus sorting/filtering on the "status breakdown" table.
 * - Row click navigates to a "ClinicDetail" page for deeper analysis.
 */

import { useState } from 'react'
import { useClinicAnalytics } from '@/hooks/api/clinic/useClinicAnalytics';
import { AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SimpleBarChart } from '../../shared/charts/SimpleBarChart'
import type { 
    ClinicStatusBreakdown, 
    ClinicQualityBreakdown
} from '@/types/domain/clinic';

interface ChartData {
    [key: string]: string | number | null | undefined;
}

export default function ClinicLab() {
    const [clinicId, setClinicId] = useState<string | null>(null)
    const navigate = useNavigate()

    const {
        data: analytics,
        isLoading: loading,
        error
    } = useClinicAnalytics(clinicId)

    // We'll keep track of sorting for "statusBreakdown"
    const [sortKey, setSortKey] = useState<keyof ClinicStatusBreakdown | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    // handle sorting
    const sortedStatusData = (() => {
        if (!analytics?.statusBreakdown) return []
        if (!sortKey) return analytics.statusBreakdown
        const arrayCopy = [...analytics.statusBreakdown]
        arrayCopy.sort((a, b) => {
            const av = a[sortKey] ?? 0
            const bv = b[sortKey] ?? 0
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })
        return arrayCopy
    })()

    const handleSort = (key: keyof ClinicStatusBreakdown) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    function handleRowClick(row: ClinicStatusBreakdown | ClinicQualityBreakdown) {
        if (row.clinic_id) {
            navigate(`/clinic/${row.clinic_id}`);
        }
    }

    return (
        <div className="space-y-6">
            {/* Clinic ID input */}
            <div className="flex items-center gap-3 mb-4">
                <label htmlFor="clinic_id" className="text-sm text-gray-400">
                    Clinic ID (optional):
                </label>
                <input
                    id="clinic_id"
                    type="text"
                    placeholder="e.g. d4f7d9f2-..."
                    value={clinicId || ''}
                    onChange={(e) => setClinicId(e.target.value || null)}
                    className="bg-white/10 border border-white/20 rounded-md px-3 py-1 text-white text-sm 
                               focus:outline-none focus:border-blue-400 transition w-72"
                />
            </div>

            {/* Loading/Error */}
            {loading && (
                <div className="text-center text-gray-400 py-8">
                    Loading clinic stats...
                </div>
            )}
            {error && (
                <div className="text-center text-red-400 py-4">
                    Error: {error}
                </div>
            )}

            {/* Overview cards */}
            {!loading && !error && analytics?.overview && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white/10 backdrop-blur-xl overflow-hidden rounded-xl border border-white/10 transition hover:scale-[1.01] hover:shadow-lg">
                        <div className="p-5 flex items-center">
                            <Activity className="h-6 w-6 text-blue-400" />
                            <div className="ml-4">
                                <p className="text-sm text-gray-300">Active Studies</p>
                                <p className="text-xl text-white font-semibold">
                                    {analytics.overview.active_studies}
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
                                    {analytics.overview.total_studies}
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
                                    {analytics.overview.average_quality_hours.toFixed(1)}
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
                                    {analytics.overview.recent_alerts?.length ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Breakdown */}
            {!loading && !error && sortedStatusData && sortedStatusData.length > 0 && (
                <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                    <h3 className="text-lg text-white font-semibold mb-3">Status Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-300">
                            <thead className="border-b border-white/20">
                                <tr>
                                    {[
                                        { key: 'clinic_name', label: 'Clinic' },
                                        { key: 'total_studies', label: 'Total' },
                                        { key: 'open_studies', label: 'Open' },
                                        { key: 'intervene_count', label: 'Intervene' },
                                        { key: 'monitor_count', label: 'Monitor' },
                                        { key: 'on_target_count', label: 'On Target' },
                                        { key: 'near_completion_count', label: '24h Completion' },
                                        { key: 'needs_extension_count', label: 'Needs Ext' }
                                    ].map(col => (
                                        <th
                                            key={col.key}
                                            className="px-3 py-2 text-left cursor-pointer hover:bg-white/5"
                                            onClick={() => handleSort(col.key as keyof ClinicStatusBreakdown)}
                                        >
                                            {col.label}
                                            {sortKey === col.key && (
                                                <span className="ml-1 text-xs">
                                                    {sortDir === 'asc' ? '▲' : '▼'}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStatusData.map((row, idx) => (
                                    <tr
                                        key={`${row.clinic_id}-${idx}`}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => handleRowClick(row)}
                                    >
                                        <td className="px-3 py-2">
                                            {row.clinic_name ?? 'All Clinics'}
                                        </td>
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
            {!loading && !error && analytics?.qualityBreakdown && analytics.qualityBreakdown.length > 0 && (
                <div className="bg-white/10 border border-white/10 rounded-xl p-4 mt-6">
                    <h3 className="text-lg text-white font-semibold mb-3">Quality Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-300">
                            <thead className="border-b border-white/20">
                                <tr>
                                    <th className="px-3 py-2 text-left">Clinic</th>
                                    <th className="px-3 py-2 text-left">Total</th>
                                    <th className="px-3 py-2 text-left">Open</th>
                                    <th className="px-3 py-2 text-left">Avg Quality</th>
                                    <th className="px-3 py-2 text-left">Good</th>
                                    <th className="px-3 py-2 text-left">Average</th>
                                    <th className="px-3 py-2 text-left">Poor</th>
                                    <th className="px-3 py-2 text-left">Critical</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.qualityBreakdown.map((row, idx) => (
                                    <tr
                                        key={`${row.clinic_id}-${idx}`}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => handleRowClick(row)}
                                    >
                                        <td className="px-3 py-2">
                                            {row.clinic_name ?? 'All Clinics'}
                                        </td>
                                        <td className="px-3 py-2">{row.total_studies}</td>
                                        <td className="px-3 py-2">{row.open_studies}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                row.average_quality > 0.7 ? 'bg-green-100 text-green-800' : 
                                                row.average_quality > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {(row.average_quality * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-green-400">{row.good_count}</td>
                                        <td className="px-3 py-2 text-yellow-400">{row.soso_count}</td>
                                        <td className="px-3 py-2 text-orange-400">{row.bad_count}</td>
                                        <td className="px-3 py-2 text-red-400">{row.critical_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Weekly/Monthly Quality Charts */}
            {!loading && !error && analytics?.weeklyQuality && analytics.weeklyQuality.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                        <h3 className="text-lg text-white font-semibold mb-3">Weekly Quality</h3>
                        <SimpleBarChart
                            data={analytics.weeklyQuality.map(q => {
                                return {
                                    name: q.week_start ? new Date(q.week_start).toLocaleDateString() : 'Unknown',
                                    value: parseFloat((q.average_quality * 100).toFixed(1))
                                };
                            })}
                            xKey="name"
                            yKey="value"
                            label="Weekly Quality Percentage"
                            color="#4ade80"
                            height={250}
                        />
                    </div>

                    <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                        <h3 className="text-lg text-white font-semibold mb-3">Monthly Quality</h3>
                        <SimpleBarChart
                            data={analytics.monthlyQuality.map(q => {
                                return {
                                    name: q.month_start ? new Date(q.month_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Unknown',
                                    value: parseFloat((q.average_quality * 100).toFixed(1))
                                };
                            })}
                            xKey="name"
                            yKey="value"
                            label="Monthly Quality Percentage" 
                            color="#facc15"
                            height={250}
                        />
                    </div>
                </div>
            )}

            {/* Weekly/Monthly Studies Charts */}
            {!loading && !error && analytics?.weeklyStudies && analytics.weeklyStudies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                        <h3 className="text-lg text-white font-semibold mb-3">Weekly Active Studies</h3>
                        <SimpleBarChart
                            data={analytics.weeklyStudies.map(s => {
                                return {
                                    name: s.week_start ? new Date(s.week_start).toLocaleDateString() : 'Unknown',
                                    value: s.open_studies
                                };
                            })}
                            xKey="name"
                            yKey="value"
                            label="Weekly Active Studies"
                            color="#60a5fa"
                            height={250}
                        />
                    </div>

                    <div className="bg-white/10 border border-white/10 rounded-xl p-4">
                        <h3 className="text-lg text-white font-semibold mb-3">Monthly Active Studies</h3>
                        <SimpleBarChart
                            data={analytics.monthlyStudies.map(s => {
                                return {
                                    name: s.month_start ? new Date(s.month_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Unknown',
                                    value: s.open_studies
                                };
                            })}
                            xKey="name"
                            yKey="value"
                            label="Monthly Active Studies"
                            color="#60a5fa"
                            height={250}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
