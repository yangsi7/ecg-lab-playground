/**
 * src/components/labs/ClinicLab.tsx
 *
 * A robust page to display clinic-level stats (for all or a specific clinic).
 * - More polished design, plus sorting/filtering on the "status breakdown" table.
 * - Row click navigates to a "ClinicDetail" page for deeper analysis.
 */

import { useState, useRef, useEffect } from 'react'
import { useClinicAnalytics } from '../../../hooks/api/useClinicAnalytics'
import { AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ChartData {
    [key: string]: string | number | null | undefined;
}

interface SimpleBarChartProps {
    data: ChartData[];
    xKey: string;
    yKey: string;
    label: string;
    color?: string;
    width?: number;
    height?: number;
}

interface StatusBreakdownRow {
    clinic_id: string | null;
    clinic_name: string | null;
    total_studies: number;
    open_studies: number;
    intervene_count: number;
    monitor_count: number;
    on_target_count: number;
    near_completion_count: number;
    needs_extension_count: number;
}

interface QualityBreakdownRow {
    clinic_id: string | null;
    clinic_name: string | null;
    total_studies: number;
    open_studies: number;
    average_quality: number;
    good_count: number;
    soso_count: number;
    bad_count: number;
    critical_count: number;
}

interface ChartDataPoint extends ChartData {
    week_start?: string | null;
    month_start?: string | null;
    average_quality?: number;
    open_studies?: number;
}

function SimpleBarChart({
    data,
    xKey,
    yKey,
    label,
    color = '#4ade80',
    width = 600,
    height = 120
}: SimpleBarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        const values = data.map(d => Number(d[yKey]) || 0);
        if (!values.length) {
            ctx.fillStyle = '#aaa';
            ctx.fillText('No data', 10, height / 2);
            return;
        }

        const maxVal = Math.max(...values);
        const barWidth = width / data.length;
        const padding = 5;

        data.forEach((item, idx) => {
            const val = Number(item[yKey]) || 0;
            const barHeight = maxVal > 0 ? (val / maxVal) * (height - padding) : 0;
            const xPos = idx * barWidth;
            const yPos = height - barHeight;
            ctx.fillStyle = color;
            ctx.fillRect(xPos, yPos, barWidth - 1, barHeight);
        });
    }, [data, xKey, yKey, color, width, height]);

    return (
        <div className="bg-white/10 p-4 rounded-md border border-white/20 w-full max-w-xl">
            <div className="text-sm text-white mb-2">{label}</div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-auto"
            />
            {!data.length && (
                <p className="text-xs text-gray-400 mt-1">No {label} data found.</p>
            )}
        </div>
    )
}

export default function ClinicLab() {
    const [clinicId, setClinicId] = useState<string | undefined>(undefined)
    const navigate = useNavigate()

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
    } = useClinicAnalytics(clinicId)

    // We'll keep track of sorting for "statusBreakdown"
    const [sortKey, setSortKey] = useState<keyof StatusBreakdownRow | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    // handle sorting
    const sortedStatusData = (() => {
        if (!statusBreakdown) return []
        if (!sortKey) return statusBreakdown
        const arrayCopy = [...statusBreakdown]
        arrayCopy.sort((a, b) => {
            const av = a[sortKey] ?? 0
            const bv = b[sortKey] ?? 0
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })
        return arrayCopy
    })()

    const handleSort = (key: keyof StatusBreakdownRow) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    function handleRowClick(row: StatusBreakdownRow | QualityBreakdownRow) {
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
                    onChange={(e) => setClinicId(e.target.value || undefined)}
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
            {!loading && !error && overview && (
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
                                            onClick={() => handleSort(col.key as any)}
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
                                {sortedStatusData.map((row: StatusBreakdownRow, idx: number) => (
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
            {!loading && !error && qualityBreakdown && qualityBreakdown.length > 0 && (
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
                                    <th className="px-3 py-2 text-left">So-so</th>
                                    <th className="px-3 py-2 text-left">Bad</th>
                                    <th className="px-3 py-2 text-left">Critical</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qualityBreakdown.map((row: QualityBreakdownRow, idx: number) => (
                                    <tr
                                        key={`${row.clinic_id}-${idx}`}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => handleRowClick(row)}
                                    >
                                        <td className="px-3 py-2">{row.clinic_name ?? 'All Clinics'}</td>
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

            {/* WEEKLY/MONTHLY QUALITY charts */}
            <div className="flex flex-wrap gap-4">
                {!loading && !error && weeklyQuality?.length > 0 && (
                    <SimpleBarChart
                        data={weeklyQuality.map(q => ({ ...q } as ChartDataPoint))}
                        xKey="week_start"
                        yKey="average_quality"
                        label="Weekly Average Quality"
                        color="#f59e0b"
                    />
                )}
                {!loading && !error && monthlyQuality?.length > 0 && (
                    <SimpleBarChart
                        data={monthlyQuality.map(q => ({ ...q } as ChartDataPoint))}
                        xKey="month_start"
                        yKey="average_quality"
                        label="Monthly Average Quality"
                        color="#84cc16"
                    />
                )}
            </div>

            {/* WEEKLY/MONTHLY STUDIES charts */}
            <div className="flex flex-wrap gap-4">
                {!loading && !error && weeklyStudies?.length > 0 && (
                    <SimpleBarChart
                        data={weeklyStudies.map(s => ({ ...s } as ChartDataPoint))}
                        xKey="week_start"
                        yKey="open_studies"
                        label="Weekly Open Studies"
                        color="#3b82f6"
                    />
                )}
                {!loading && !error && monthlyStudies?.length > 0 && (
                    <SimpleBarChart
                        data={monthlyStudies.map(s => ({ ...s } as ChartDataPoint))}
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
