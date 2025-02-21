import React, { useMemo } from 'react';
import { Database, Download, Heart, Clock, Calendar, User, Building2, Activity } from 'lucide-react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useDataGrid } from '@/hooks/useDataGrid';
import { useStudiesWithTimes } from '@/hooks/api/useStudiesWithTimes';
import { supabase } from '@/hooks/api/supabase';
import type { StudiesWithTimesRow, StudyListRow } from '@/types/domain/study';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';

type DataGridColumn = Column<StudiesWithTimesRow> | {
    key: string;
    header: string;
    render: (value: unknown, row: StudiesWithTimesRow) => React.ReactNode;
};

function formatDuration(minutes: number): string {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const remainingMinutes = minutes % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    }
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
}

function formatQuality(quality: number, total: number): string {
    if (!total) return '0%';
    const percentage = (quality / total) * 100;
    return `${percentage.toFixed(1)}%`;
}

export default function DataLab() {
    const navigate = useNavigate();
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
            const rows = exportData.map((row: StudyListRow) => 
                columns.map(col => {
                    const value = row[col.key as keyof StudyListRow];
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

    const columns = useMemo<DataGridColumn[]>(() => [
        {
            key: 'study_id',
            header: 'Study ID',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown, row: StudiesWithTimesRow) => (
                <button
                    onClick={() => navigate(`/ecg/${row.study_id}`)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                    title="Click to view study details"
                >
                    {value as string}
                </button>
            )
        },
        {
            key: 'clinic_name',
            header: 'Clinic',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{value as string}</span>
                </div>
            )
        },
        {
            key: 'pod_id',
            header: 'Pod ID',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'user_id',
            header: 'User ID',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{value as string}</span>
                </div>
            )
        },
        {
            key: 'study_type',
            header: 'Type',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span>{value as string}</span>
                </div>
            )
        },
        {
            key: 'pod_status',
            header: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown) => {
                const status = value as string;
                const colors = {
                    active: 'text-green-400 bg-green-400/10',
                    completed: 'text-blue-400 bg-blue-400/10',
                    error: 'text-red-400 bg-red-400/10',
                    default: 'text-gray-400 bg-gray-400/10'
                };
                const colorClass = colors[status as keyof typeof colors] || colors.default;
                
                return (
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            key: 'start_timestamp',
            header: 'Start Time',
            sortable: true,
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{value ? new Date(value as string).toLocaleString() : 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'end_timestamp',
            header: 'End Time',
            sortable: true,
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{value ? new Date(value as string).toLocaleString() : 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'duration',
            header: 'Duration',
            sortable: true,
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{value ? formatDuration(value as number) : 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'aggregated_quality_minutes',
            header: 'Quality',
            sortable: true,
            render: (value: unknown, row: StudiesWithTimesRow) => {
                const quality = value as number;
                const total = row.aggregated_total_minutes;
                const percentage = formatQuality(quality, total);
                
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-blue-500 rounded-full h-2" 
                                style={{ width: percentage }}
                            />
                        </div>
                        <span className="text-sm text-gray-300">{percentage}</span>
                    </div>
                );
            }
        },
        {
            key: 'earliest_time',
            header: 'First Data',
            sortable: true,
            render: (value: unknown) => value ? new Date(value as string).toLocaleString() : 'N/A'
        },
        {
            key: 'latest_time',
            header: 'Last Data',
            sortable: true,
            render: (value: unknown) => value ? new Date(value as string).toLocaleString() : 'N/A'
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, row: StudiesWithTimesRow) => {
                const canViewECG = row.pod_id && row.earliest_time && row.latest_time;
                
                return (
                    <div className="flex justify-end">
                        <button
                            onClick={() => navigate(`/ecg/${row.study_id}`)}
                            disabled={!canViewECG}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                canViewECG
                                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'
                                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                            }`}
                            title={canViewECG ? 'View ECG data' : 'No ECG data available'}
                        >
                            <Heart className="h-4 w-4" />
                            View ECG
                        </button>
                    </div>
                );
            }
        }
    ], [navigate]);

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
                columns={columns as Column<StudiesWithTimesRow>[]}
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
