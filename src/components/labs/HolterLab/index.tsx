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
import { useHolterFilters } from './hooks/useHolterFilters';
import { useHolterStudies } from '@/hooks/api/study/useHolterStudies';
import { DataGrid, type Column } from '@/components/shared/DataGrid';
import { QuickFilters, type QuickFilter } from './components/QuickFilters';
import { AdvancedFilter } from './components/AdvancedFilter';
import { useDataGrid } from '@/hooks/useDataGrid';
import type { HolterStudy } from '@/types/domain/holter';
import { logger } from '@/lib/logger';

const QUICK_FILTERS: QuickFilter[] = [
    { id: 'all', label: 'All', description: 'Show all studies' },
    { id: 'recent', label: 'Recent', description: 'Studies from last 7 days' },
    { id: 'low-quality', label: 'Low Quality', description: 'Quality < 80%' },
    { id: 'high-quality', label: 'High Quality', description: 'Quality > 80%' }
] as const;

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

    const {
        studies,
        isLoading,
        error: fetchError,
        totalCount
    } = useHolterStudies();

    const filteredStudies = useMemo(() => {
        try {
            logger.info('Filtering studies...');
            const filtered = filterStudies(studies);
            logger.info(`Filtered to ${filtered.length} studies`);
            return filtered;
        } catch (err) {
            const errorObj = err instanceof Error ? {
                message: err.message,
                name: err.name,
                stack: err.stack
            } : { message: String(err) };
            
            logger.error('Error filtering studies:', errorObj);
            return [];
        }
    }, [studies, filterStudies]);

    // Format error message
    const errorMessage = fetchError ? 
        (typeof fetchError === 'string' ? fetchError : 'An unknown error occurred') 
        : null;

    // Define columns for the DataGrid
    const columns: Column<HolterStudy>[] = [
        {
            key: 'study_id',
            header: 'Study ID',
            sortable: true,
            render: (value) => (
                <Link 
                    to={`/holter/${value}`}
                    className="text-blue-400 hover:text-blue-300"
                >
                    {value}
                </Link>
            )
        },
        {
            key: 'qualityFraction',
            header: 'Quality',
            sortable: true,
            render: (value) => `${(Number(value) * 100).toFixed(1)}%`
        },
        {
            key: 'totalHours',
            header: 'Total Hours',
            sortable: true,
            render: (value) => Number(value).toFixed(1)
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value) => (
                <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${value === 'critical' ? 'bg-red-500/20 text-red-300' :
                      value === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                      value === 'good' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'}
                `}>
                    {value}
                </span>
            )
        }
    ];

    if (isLoading) {
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
                    <h1 className="text-2xl font-semibold text-white">Holter Lab</h1>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white"
                    >
                        {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
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
                filters={QUICK_FILTERS}
                activeFilter={quickFilter}
                onFilterChange={setQuickFilter}
            />

            {/* Advanced Filter */}
            <AdvancedFilter
                expression={advancedFilter}
                onExpressionChange={setAdvancedFilter}
                className="mt-4"
            />

            {/* Data Grid */}
            <DataGrid
                data={filteredStudies}
                columns={columns}
                loading={isLoading}
                error={errorMessage}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                hasMore={(totalCount ?? 0) > page * pageSize}
                onPageChange={onPageChange}
                onSort={onSortChange}
                onFilterChange={onFilterChange}
                onFilterError={onFilterError}
                filterExpression={filterConfig.expression}
                quickFilter={filterConfig.quickFilter}
                defaultSortKey={sortConfig.key === null ? undefined : sortConfig.key}
            />
        </div>
    )
}
