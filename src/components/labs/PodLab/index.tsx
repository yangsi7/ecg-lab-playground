import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useDataGrid } from '@/hooks/useDataGrid';
import { supabase } from '@/hooks/api/supabase';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/logger';

type PodRow = Database['public']['Tables']['pod']['Row'];

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

export default function PodLab() {
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
    } = useDataGrid<PodRow>();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery<{ data: PodRow[], count: number }>({
        queryKey: ['pods', page, pageSize, sortConfig.key, sortConfig.direction, filterConfig.quickFilter],
        queryFn: async () => {
            try {
                const query = supabase
                    .from('pod')
                    .select('*', { count: 'exact' });

                // Apply search filter if any
                if (filterConfig.quickFilter?.length) {
                    query.or(`id.ilike.%${filterConfig.quickFilter}%,status.ilike.%${filterConfig.quickFilter}%`);
                }

                // Apply sorting if specified
                if (sortConfig.key) {
                    query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
                }

                // Apply pagination
                const from = page * pageSize;
                const to = from + pageSize - 1;
                query.range(from, to);

                const { data, error: queryError, count } = await query;

                if (queryError) throw queryError;
                return { data: data || [], count: count || 0 };
            } catch (err) {
                logger.error('Failed to fetch pods', { error: err });
                throw err;
            }
        }
    });

    const columns = useMemo<Column<PodRow>[]>(() => [
        {
            key: 'id',
            header: 'Pod ID',
            sortable: true,
            filterable: true,
            filterType: 'text',
            render: (value: unknown, row: PodRow) => (
                <button
                    onClick={() => navigate(`/pod/${row.id}`)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                    title="Click to view pod details"
                >
                    {value as string}
                </button>
            )
        },
        {
            key: 'assigned_study_id',
            header: 'Study',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'assigned_user_id',
            header: 'User',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterable: true,
            filterType: 'text'
        },
        {
            key: 'time_since_first_use',
            header: 'Time Since First Use',
            sortable: true,
            render: (value: unknown) => {
                if (!value) return 'Never used';
                const minutes = value as number;
                return formatDuration(minutes);
            }
        }
    ], [navigate]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-white">Pod Inventory</h1>
            <DataGrid
                data={data?.data ?? []}
                columns={columns}
                loading={isLoading}
                error={error?.message}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                hasMore={(data?.count ?? 0) > page * pageSize}
                totalCount={data?.count ?? 0}
                
                // Use client-side operations
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