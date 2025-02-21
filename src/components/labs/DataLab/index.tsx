import React, { useMemo } from 'react';
import { Database, Download } from 'lucide-react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useDataGrid } from '@/hooks/useDataGrid';
import { useStudiesWithTimes } from '@/hooks/api/useStudiesWithTimes';
import { supabase } from '@/hooks/api/supabase';
import type { StudiesWithTimesRow } from '@/types/domain/study';
import { logger } from '@/lib/logger';

export default function DataLab() {
    const {
        page,
        pageSize,
        sortConfig,
        filterConfig,
        onPageChange,
        onPageSizeChange,
        onSortChange,
        onFilterChange,
        onFilterError
    } = useDataGrid<StudiesWithTimesRow>();

    // Fetch data using the hook
    const { data, isLoading, error } = useStudiesWithTimes({
        search: filterConfig.quickFilter,
        page,
        pageSize,
        sortBy: 'study_id',
        sortDirection: sortConfig.direction
    });

    // Handle data export
    const handleExport = async () => {
        try {
            // Fetch all data for export (no pagination)
            const { data: exportData, error: rpcErr } = await supabase
                .rpc('get_study_list_with_earliest_latest', {
                    p_search: '',
                    p_offset: 0,
                    p_limit: 1000
                });

            if (rpcErr) {
                logger.error('Export failed', { error: rpcErr });
                return;
            }
            if (!exportData) return;

            // Convert data to CSV
            const headers = columns.map(col => col.header).join(',');
            const rows = exportData.map((row: StudiesWithTimesRow) => 
                columns.map(col => {
                    const value = row[col.key as keyof StudiesWithTimesRow];
                    return value ? String(value).replace(/,/g, '') : '';
                }).join(',')
            ).join('\n');

            const csv = `${headers}\n${rows}`;
            
            // Create and download file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `studies-export-${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Export failed', { error: err });
        }
    };

    const columns = useMemo<Column<StudiesWithTimesRow>[]>(() => [
        {
            key: 'study_id',
            header: 'Study ID',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'pod_id',
            header: 'Pod ID',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'earliest_time',
            header: 'Earliest Data',
            sortable: true,
            render: (value) => value ? new Date(value as string).toLocaleString() : 'N/A'
        },
        {
            key: 'latest_time',
            header: 'Latest Data',
            sortable: true,
            render: (value) => value ? new Date(value as string).toLocaleString() : 'N/A'
        }
    ], []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-white">Studies</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Page Size Selector */}
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white"
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                    </select>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                    >
                        <Download className="h-4 w-4" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <DataGrid
                data={data?.data ?? []}
                columns={columns}
                loading={isLoading}
                error={error?.message}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                hasMore={(data?.totalCount ?? 0) > page * pageSize}
                totalCount={data?.totalCount}
                
                // Use server-side operations
                paginationMode="server"
                filterMode="server"
                sortMode="server"
                
                // Callbacks
                onSort={onSortChange}
                onFilterChange={onFilterChange}
                onFilterError={onFilterError}
                
                // Current state
                quickFilter={filterConfig.quickFilter}
                filterExpression={filterConfig.expression}
            />
        </div>
    );
}
