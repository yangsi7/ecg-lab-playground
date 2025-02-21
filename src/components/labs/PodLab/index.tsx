import { useMemo } from 'react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { useQuery } from '@tanstack/react-query';
import { useDataGrid } from '../../../hooks/useDataGrid';
import { supabase } from '@/hooks/api/supabase';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/logger';

type PodRow = Database['public']['Tables']['pod']['Row'];

export default function PodLab() {
    const { page, pageSize, sortConfig, filterConfig } = useDataGrid<PodRow>();

    const { data, isLoading, error } = useQuery<{ data: PodRow[], count: number }>({
        queryKey: ['pods', { page, pageSize, sortConfig, filterConfig }],
        queryFn: async () => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;

            let query = supabase
                .from('pod')
                .select('*', { count: 'exact' })
                .range(start, end);

            if (sortConfig.key) {
                query = query.order(sortConfig.key as string, {
                    ascending: sortConfig.direction === 'asc'
                });
            }

            if (filterConfig.quickFilter) {
                query = query.or(`id.ilike.%${filterConfig.quickFilter}%,study_id.ilike.%${filterConfig.quickFilter}%`);
            }

            const { data, error, count } = await query;

            if (error) {
                logger.error('Failed to fetch pods', { error });
                throw error;
            }

            return { data: data as PodRow[], count: count ?? 0 };
        }
    });

    const columns = useMemo<Column<PodRow>[]>(() => [
        {
            key: 'id',
            header: 'Pod ID',
            sortable: true,
            filterable: true
        },
        {
            key: 'study_id',
            header: 'Study ID',
            sortable: true,
            filterable: true
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            filterable: true
        },
        {
            key: 'created_at',
            header: 'Created',
            sortable: true,
            render: (value) => value ? new Date(value as string).toLocaleString() : '-'
        }
    ], []);

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
                totalCount={data?.count ?? 0}
                hasMore={(data?.count ?? 0) > page * pageSize}
                
                // Server-side operations
                paginationMode="server"
                filterMode="server"
                sortMode="server"
                
                // Current state
                quickFilter={filterConfig.quickFilter}
                filterExpression={filterConfig.expression}
                sortConfig={sortConfig}
            />
        </div>
    );
} 