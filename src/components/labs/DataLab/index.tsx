import React, { useMemo } from 'react';
import { Database, Filter, Download, Undo, Redo } from 'lucide-react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useDataGrid } from '../../../hooks/useDataGrid';
import { useDatasets } from '../../../hooks/api/useDatasets';
import { supabase } from '../../../lib/supabase/client';
import type { DataSet } from '../../../types/domain/dataset';

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
        onFilterError,
        canUndo,
        canRedo,
        undo,
        redo,
        resetFilters
    } = useDataGrid<DataSet>();

    // Fetch data using the hook
    const { data, isLoading, error } = useDatasets({
        page,
        pageSize,
        sortConfig,
        filterConfig
    });

    // Handle data export
    const handleExport = async () => {
        try {
            // Fetch all data for export (no pagination)
            const { data: exportData } = await supabase
                .from('datasets')
                .select('*')
                .order(sortConfig.key as string, {
                    ascending: sortConfig.direction === 'asc'
                });

            if (!exportData) return;

            // Convert data to CSV
            const headers = columns.map(col => col.header).join(',');
            const rows = exportData.map((row: DataSet) => 
                columns.map(col => {
                    const value = row[col.key];
                    // Handle special rendering for size and status
                    if (col.key === 'size') {
                        return `${(Number(value) / 1024 / 1024).toFixed(2)}`;
                    }
                    return String(value).replace(/,/g, '');
                }).join(',')
            ).join('\n');

            const csv = `${headers}\n${rows}`;
            
            // Create and download file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `datasets-export-${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            // TODO: Show error toast
        }
    };

    const columns = useMemo<Column<DataSet>[]>(() => [
        {
            key: 'id',
            header: 'Dataset ID',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            filterable: true,
            filterType: 'select',
            filterOptions: [
                { label: 'ECG', value: 'ecg' },
                { label: 'Activity', value: 'activity' },
                { label: 'Sleep', value: 'sleep' }
            ]
        },
        {
            key: 'size',
            header: 'Size',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (value) => `${(Number(value) / 1024 / 1024).toFixed(2)} MB`
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'select',
            filterOptions: [
                { label: 'Processing', value: 'processing' },
                { label: 'Ready', value: 'ready' },
                { label: 'Error', value: 'error' }
            ],
            render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${String(value) === 'error' ? 'bg-red-500/20 text-red-400' :
                    String(value) === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'}`}
                >
                    {String(value)}
                </span>
            )
        }
    ], []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-white">Datasets</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Filter History Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className={`p-2 rounded-lg ${
                                canUndo ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/40'
                            }`}
                        >
                            <Undo className="h-4 w-4" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className={`p-2 rounded-lg ${
                                canRedo ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/40'
                            }`}
                        >
                            <Redo className="h-4 w-4" />
                        </button>
                    </div>

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
                hasMore={(data?.count ?? 0) > page * pageSize}
                totalCount={data?.count}
                
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
