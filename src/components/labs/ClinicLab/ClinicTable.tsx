import { useMemo } from 'react';
import { Building2, Plus, Download, Activity, Info } from 'lucide-react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useDataGrid } from '@/hooks/api/filters/useDataGrid';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { useClinicAnalytics } from '@/hooks/api';
import type { ClinicQualityBreakdown } from '@/types/domain/clinic';

export default function ClinicTable() {
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
    } = useDataGrid<ClinicQualityBreakdown>();

    // Fetch overview for all clinics
    const { data: analytics } = useClinicAnalytics(null);

    // Fetch clinics data with proper typing
    const { data, isLoading, error } = useQuery({
        queryKey: ['clinics', page, pageSize, sortConfig.key, sortConfig.direction, filterConfig.quickFilter],
        queryFn: async () => {
            try {
                // Get all clinics with quality breakdown - explicitly pass null clinic_id
                // Explicitly pass undefined when no clinic_id is needed
                const { data, error } = await supabase.rpc('get_clinic_quality_breakdown');
                
                if (error) {
                    logger.error('Failed to fetch clinics', { error });
                    throw error;
                }

                let filteredData = data as ClinicQualityBreakdown[];
                const totalCount = filteredData.length;
                logger.info('Initial clinics count from RPC', { totalCount });

                // Apply search filter if any
                if (filterConfig.quickFilter?.length) {
                    filteredData = filteredData.filter(clinic => 
                        clinic.clinic_name?.toLowerCase().includes(filterConfig.quickFilter!.toLowerCase())
                    );
                }
                logger.info('After filtering, clinics count', { count: filteredData.length });

                // Apply sorting if specified
                if (sortConfig.key) {
                    filteredData.sort((a, b) => {
                        const aVal = a[sortConfig.key as keyof ClinicQualityBreakdown];
                        const bVal = b[sortConfig.key as keyof ClinicQualityBreakdown];
                        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
                        
                        if (typeof aVal === 'number' && typeof bVal === 'number') {
                            return (aVal - bVal) * multiplier;
                        }
                        return String(aVal).localeCompare(String(bVal)) * multiplier;
                    });
                } else {
                    // Default sorting by name
                    filteredData.sort((a, b) => 
                        (a.clinic_name || '').localeCompare(b.clinic_name || '')
                    );
                }

                // Apply pagination
                const from = page * pageSize;
                const to = Math.min(from + pageSize, filteredData.length);
                const paginatedData = filteredData.slice(from, to);

                logger.info('Fetched clinics:', { count: paginatedData.length, totalCount });

                return {
                    data: paginatedData,
                    totalCount: filteredData.length
                };
            } catch (err) {
                logger.error('Failed to fetch clinics', { error: err });
                throw err;
            }
        },
        staleTime: 5000, // Consider data fresh for 5 seconds
        placeholderData: (previousData) => previousData // Keep previous data while fetching
    });

    // Handle data export
    const handleExport = async () => {
        try {
            const { data: exportData, error: exportError } = await supabase
                .rpc('get_clinic_quality_breakdown', {
                });

            if (exportError) throw exportError;
            if (!exportData) return;

            // Convert to CSV
            const headers = columns.map(col => col.header).join(',');
            const rows = exportData.map(row => 
                columns.map(col => {
                    const value = row[col.key as keyof ClinicQualityBreakdown];
                    return value ? String(value).replace(/,/g, '') : '';
                }).join(',')
            ).join('\n');

            const csv = `${headers}\n${rows}`;
            
            // Download file
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clinics-export-${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Export failed', { error: err });
        }
    };

    const columns = useMemo<Column<ClinicQualityBreakdown>[]>(() => [
        {
            key: 'clinic_id',
            header: 'ID',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown, row: ClinicQualityBreakdown) => (
                <button
                    onClick={() => navigate(`/clinic/${row.clinic_id}`)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                    title="Click to view clinic details"
                >
                    {value as string}
                </button>
            )
        },
        {
            key: 'clinic_name',
            header: 'Name',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{value as string || 'Unnamed Clinic'}</span>
                </div>
            )
        },
        {
            key: 'total_studies',
            header: 'Total Studies',
            sortable: true,
            filterable: true,
            filterType: 'number'
        },
        {
            key: 'open_studies',
            header: 'Active Studies',
            sortable: true,
            filterable: true,
            filterType: 'number'
        },
        {
            key: 'average_quality',
            header: 'Avg Quality',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (value: unknown) => {
                const quality = Number(value) || 0;
                const color = quality >= 0.7 ? 'text-green-400' :
                             quality >= 0.5 ? 'text-yellow-400' :
                             quality >= 0.3 ? 'text-orange-400' :
                             'text-red-400';
                return (
                    <span className={color}>
                        {(quality * 100).toFixed(1)}%
                    </span>
                );
            }
        },
        {
            key: 'good_count',
            header: 'Good',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (value: unknown) => (
                <span className="text-green-400">{String(value)}</span>
            )
        },
        {
            key: 'soso_count',
            header: 'Average',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (value: unknown) => (
                <span className="text-yellow-400">{String(value)}</span>
            )
        },
        {
            key: 'bad_count',
            header: 'Poor',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (value: unknown) => (
                <span className="text-orange-400">{String(value)}</span>
            )
        },
        {
            key: 'critical_count',
            header: 'Critical',
            sortable: true,
            filterable: true,
            filterType: 'number',
            render: (value: unknown) => (
                <span className="text-red-400">{String(value)}</span>
            )
        }
    ], [navigate]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-blue-400" />
                    <h1 className="text-2xl font-semibold text-white">Clinics</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Analytics Link */}
                    <button
                        onClick={() => navigate('/clinic/analytics')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                    >
                        <Activity className="h-4 w-4" />
                        View Analytics
                    </button>

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

                    {/* Add Clinic Button */}
                    <button
                        onClick={() => navigate('/clinic/new')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Add Clinic
                    </button>
                </div>
            </div>

            {/* Overview Stats Section */}
            {analytics?.overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Total Studies</h3>
                            <Info className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-3xl text-white">{analytics.overview.total_studies}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Active Studies</h3>
                            <Activity className="h-5 w-5 text-green-400" />
                        </div>
                        <p className="text-3xl text-white">{analytics.overview.active_studies}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">Average Quality Hours</h3>
                            <Building2 className="h-5 w-5 text-yellow-400" />
                        </div>
                        <p className="text-3xl text-white">
                            {analytics.overview.average_quality_hours.toFixed(1)}
                        </p>
                    </div>
                </div>
            )}

            {/* Data Grid */}
            <DataGrid
                data={data?.data ?? []}
                columns={columns}
                loading={isLoading}
                error={error?.message}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                hasMore={(data?.totalCount ?? 0) > (page + 1) * pageSize}
                totalCount={data?.totalCount}
                
                // Use client-side operations since we have all data
                paginationMode="client"
                filterMode="client"
                sortMode="client"
                
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
