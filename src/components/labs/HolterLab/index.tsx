import React, { useMemo } from 'react';
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
import { DataGrid, type Column } from '../../../components/shared/DataGrid';
import { QuickFilters } from './components/QuickFilters';
import { AdvancedFilter } from './components/AdvancedFilter/AdvancedFilter';
import { useHolterFilters } from './hooks/useHolterFilters';
import { useDataGrid } from '../../../hooks/useDataGrid';
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
    const {
        page,
        pageSize,
        sortConfig,
        filterConfig,
        onPageChange,
        onPageSizeChange,
        onSortChange,
        onFilterChange,
        onFilterError,
        resetFilters
    } = useDataGrid<HolterStudy>();

    const {
        quickFilter,
        advancedFilter,
        setQuickFilter,
        setAdvancedFilter,
        filterStudies
    } = useHolterFilters();

    const { studies = [], loading, error: fetchError, totalCount = 0, isRefreshing } = useHolterData();

    // Filter studies based on both quick and advanced filters
    const filteredStudies = useMemo(() => 
        filterStudies(studies),
        [studies, filterStudies]
    );

    // Format error message
    const errorMessage = fetchError ? 
        (typeof fetchError === 'string' ? fetchError : 
         fetchError instanceof Error ? fetchError.message : 
         'An unknown error occurred') 
        : null;

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
    ], []);

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

    if (errorMessage) {
        return (
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-red-400">Error loading Holter data</h3>
                <p className="mt-1 text-sm text-red-300">{errorMessage}</p>
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
                <div className="flex items-center gap-4">
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white"
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                    </select>
                    <button
                        onClick={() => {/* TODO: Implement export */}}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                    >
                        <Download className="h-4 w-4" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <QuickFilters
                activeFilter={quickFilter}
                onFilterChange={setQuickFilter}
            />

            {/* Advanced Filter */}
            <AdvancedFilter
                onFilterChange={setAdvancedFilter}
                className="mt-4"
            />

            {/* Data Grid */}
            <DataGrid
                data={filteredStudies}
                columns={columns}
                loading={loading || isRefreshing}
                error={errorMessage}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                hasMore={(totalCount) > page * pageSize}
                totalCount={totalCount}
                
                // Use server-side operations for pagination and sorting
                paginationMode="server"
                sortMode="server"
                
                // But use client-side filtering since we handle it with useHolterFilters
                filterMode="client"
                
                // Callbacks
                onSort={onSortChange}
                onFilterChange={onFilterChange}
                onFilterError={onFilterError}
            />
        </div>
    )
}
