import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart,
    Filter,
    Download,
    AlertTriangle,
    Save,
    Star,
    MoreHorizontal,
} from 'lucide-react'
import { useHolterData } from '../../../hooks/api/useHolterData';
import { DataGrid, Column } from '../../../components/shared/DataGrid';
import { QuickFilters } from './components/QuickFilters';
import { AdvancedFilter } from './components/AdvancedFilter';
import { useHolterFilter } from '../../../hooks/store/useHolterFilter';
import type { HolterStudy } from '../../../types/domain/holter';

const QUICK_FILTERS = [
    { id: 'bad-quality', label: 'Bad Quality (&lt;0.5)', icon: AlertTriangle },
    { id: 'needs-intervention', label: 'Needs Intervention (&lt;20h)', icon: AlertTriangle },
    { id: 'under-target', label: 'Under Target (&lt;10h)', icon: AlertTriangle }
] as const

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

// Token suggestions for the advanced filter
const TOKEN_SUGGESTIONS = [
    'daysRemaining',
    'qualityFraction',
    'totalHours',
    'interruptions',
    'qualityVariance'
] as const

export default function HolterLab() {
    const [quickFilter, setQuickFilter] = useState<typeof QUICK_FILTERS[number]['id']>()
    const [advancedFilter, setAdvancedFilter] = useState('')
    const [filterError, setFilterError] = useState<string | null>(null)
    const [showFields, setShowFields] = useState(false)
    const [pageSize, setPageSize] = useState(25)

    // We'll store presets in localStorage
    const [savedPresets, setSavedPresets] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('holterFilterPresets')
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    const { studies = [], loading, error, totalCount = 0, isRefreshing } = useHolterData();

    const columns = useMemo<Column<HolterStudy>[]>(() => [
        { 
            key: 'study_id',
            header: 'Study ID',
            sortable: true 
        },
        { 
            key: 'clinic_name',
            header: 'Clinic',
            sortable: true 
        },
        { 
            key: 'duration',
            header: 'Duration',
            sortable: true,
            render: (value: string | number) => `${Number(value)} days`
        },
        { 
            key: 'daysRemaining',
            header: 'Days Rem',
            sortable: true,
            render: (value: string | number) => `${Number(value)}`
        },
        { 
            key: 'totalQualityHours',
            header: 'Q Hours',
            sortable: true,
            render: (value: string | number) => Number(value).toFixed(1)
        },
        { 
            key: 'qualityFraction',
            header: 'Q %',
            sortable: true,
            render: (value: string | number) => `${(Number(value) * 100).toFixed(1)}%`
        },
        { 
            key: 'totalHours',
            header: 'Total Hrs',
            sortable: true,
            render: (value: string | number) => Number(value).toFixed(1)
        },
        { 
            key: 'interruptions',
            header: 'Interrupts',
            sortable: true,
            render: (value: string | number) => `${Number(value)}`
        },
        { 
            key: 'qualityVariance',
            header: 'Variance',
            sortable: true,
            render: (value: string | number) => Number(value).toFixed(3)
        },
        { 
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value: string | number) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${String(value) === 'critical' ? 'bg-red-500/20 text-red-400' :
                        String(value) === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        String(value) === 'good' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'}`}
                >
                    {String(value)}
                </span>
            )
        }
    ], [])

    const handleSavePreset = () => {
        if (!advancedFilter.trim() || filterError) return
        const newPresets = [...savedPresets, advancedFilter]
        setSavedPresets(newPresets)
        localStorage.setItem('holterFilterPresets', JSON.stringify(newPresets))
    }

    const handleSelectPreset = (preset: string) => {
        setAdvancedFilter(preset)
    }

    const handleFilterError = (error: Error) => {
        setFilterError(error.message)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 text-blue-400">
                    <svg className="h-full w-full" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
                        />
                    </svg>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-red-400">Error loading Holter data</h3>
                <p className="mt-1 text-sm text-red-300">{error.message}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Heart className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-white">Holter Studies</h1>
                </div>
                <button
                    onClick={() => {}}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                >
                    <Download className="h-4 w-4" />
                    Export Data
                </button>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
                {QUICK_FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setQuickFilter(cur => (cur === filter.id ? undefined : filter.id))}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                            transition-all duration-200
                            ${quickFilter === filter.id
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
                            }
                        `}
                    >
                        <filter.icon className="h-4 w-4" />
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Advanced Filter Box */}
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-3 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-300" />
                        <h2 className="text-sm text-gray-300 font-medium">Advanced Filter</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFields(!showFields)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleSavePreset}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition"
                        >
                            <Save className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    value={advancedFilter}
                    onChange={(e) => setAdvancedFilter(e.target.value)}
                    placeholder="Enter filter expression (e.g., qualityFraction &gt; 0.8)"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />

                {filterError && (
                    <div className="text-sm text-red-400 mt-1">
                        {filterError}
                    </div>
                )}

                {showFields && (
                    <div className="rounded-md bg-white/5 p-3 border border-white/10 space-y-2">
                        <div className="text-xs text-gray-200 italic">
                            Available fields: {TOKEN_SUGGESTIONS.join(', ')}
                        </div>
                        {savedPresets.length > 0 && (
                            <div className="mt-2 space-x-1">
                                {savedPresets.map((preset, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectPreset(preset)}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                    >
                                        <Star className="h-3 w-3" />
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DataGrid */}
            <DataGrid
                data={studies}
                columns={columns}
                pageSize={pageSize}
                filterExpression={advancedFilter}
                onFilterError={handleFilterError}
                className="bg-white/5 rounded-xl border border-white/10"
            />

            {/* Page Size Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-white/10 border border-white/10 rounded-lg text-white text-sm px-2 py-1"
                    >
                        {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-400">entries</span>
                </div>
            </div>
        </div>
    )
}
