import React, { useState } from 'react';
import { Database, Download, Heart, Clock, Calendar, User, Building2, Activity, Search } from 'lucide-react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useStudiesWithTimes } from '@/hooks/api/study/useStudyHooks';
import type { StudiesWithTimesRow, StudyListRow } from '@/types/domain/study';
import { formatDate, formatDuration, formatPercentage } from '@/lib/utils/formatters';
import { supabase } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';

type DataGridColumn = Column<StudiesWithTimesRow> | {
    key: string;
    header: string;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'number' | 'select' | 'date';
    render: (value: unknown, row: StudiesWithTimesRow) => React.ReactNode;
};

export default function DataLab() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    
    // Use our new robust hook with proper error handling and pagination
    const { 
        data: studies, 
        totalCount,
        loading, 
        error,
        hasMore 
    } = useStudiesWithTimes({
        page,
        pageSize,
        search: search.length > 2 ? search : undefined, // Only search with 3+ chars
    });

    // Define columns for the data grid
    const columns: Column<StudiesWithTimesRow>[] = [
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
            key: 'study_status',
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
            key: 'study_start',
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
            key: 'study_completed',
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
            key: 'duration_so_far',
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
            key: 'quality_fraction',
            header: 'Quality',
            sortable: true,
            render: (value: unknown, row: StudiesWithTimesRow) => {
                const quality = value as number;
                const percentage = quality !== null ? `${Math.round(quality * 100)}%` : 'N/A';
                
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-blue-500 rounded-full h-2" 
                                style={{ width: percentage !== 'N/A' ? percentage : '0%' }}
                            />
                        </div>
                        <span className="text-sm text-gray-300">{percentage}</span>
                    </div>
                );
            }
        },
        {
            key: 'earliest_ecg_data',
            header: 'First Data',
            sortable: true,
            render: (value: unknown) => value ? new Date(value as string).toLocaleString() : 'N/A'
        },
        {
            key: 'latest_ecg_data',
            header: 'Last Data',
            sortable: true,
            render: (value: unknown) => value ? new Date(value as string).toLocaleString() : 'N/A'
        },
        {
            key: 'actions' as any,
            header: 'Actions',
            render: (_, row: StudiesWithTimesRow) => {
                const canViewECG = row.pod_id && row.earliest_ecg_data && row.latest_ecg_data;
                
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
    ];

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0); // Reset to first page when search changes
    };

    // Handle data export
    const handleExport = async () => {
        try {
            // Fetch all data for export using get_studies_with_pod_times
            const { data: exportData, error: rpcErr } = await supabase
                .rpc('get_studies_with_pod_times');

            if (rpcErr) {
                console.error('Export RPC Error:', rpcErr);
                logger.error('Export failed', { error: rpcErr.message, details: rpcErr });
                return;
            }
            
            if (!exportData || exportData.length === 0) {
                console.warn('No data to export - there are no studies matching your criteria');
                return;
            }

            // Apply search filter on the client side if needed
            let filteredData = exportData;
            if (search && search.length > 2) {
                const searchLower = search.toLowerCase();
                filteredData = exportData.filter(row => 
                    String(row.study_id).toLowerCase().includes(searchLower) ||
                    String(row.pod_id).toLowerCase().includes(searchLower) ||
                    (row.clinic_name && String(row.clinic_name).toLowerCase().includes(searchLower)) ||
                    (row.user_id && String(row.user_id).toLowerCase().includes(searchLower)) ||
                    (row.study_type && String(row.study_type).toLowerCase().includes(searchLower))
                );
            }

            // Only export the first 1000 records to avoid performance issues
            const limitedData = filteredData.slice(0, 1000);
            
            // Convert data to CSV
            const headers = columns.map(col => col.header).join(',');
            const rows = limitedData.map((row: StudiesWithTimesRow) => 
                columns.map(col => {
                    const key = col.key;
                    if (key.toString() === 'actions') return '';
                    
                    // Use type assertion to access row properties safely
                    const value = row[key as keyof typeof row];
                    if (key === 'study_start' || key === 'study_completed' || 
                        key === 'earliest_ecg_data' || key === 'latest_ecg_data') {
                        return value ? `"${new Date(value as string).toLocaleString()}"` : '';
                    }
                    
                    if (key === 'duration_so_far') {
                        return value ? formatDuration(value as number) : '';
                    }
                    
                    if (key === 'quality_fraction') {
                        return value !== null ? `${Math.round((value as number) * 100)}%` : '';
                    }
                    
                    return `"${value || ''}"`;
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
                        onChange={(e) => setPageSize(Number(e.target.value))}
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

            {/* Search Input */}
            <div className="flex justify-between items-center">
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search studies..."
                        className="pl-10 pr-4 py-2 bg-gray-800 rounded-md border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white w-64"
                    />
                    <svg 
                        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
            </div>

            {/* Data Grid */}
            {error ? (
                <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
                    <h3 className="font-semibold mb-2">Error loading data</h3>
                    <p className="text-sm">{error.message}</p>
                </div>
            ) : (
                <DataGrid
                    data={studies}
                    columns={columns as any}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    totalCount={totalCount}
                    hasMore={hasMore}
                    paginationMode="server"
                    quickFilter={search}
                />
            )}
            
            <div className="text-sm text-gray-400">
                {totalCount} total studies found
            </div>
        </div>
    );
}
