import { useMemo } from 'react';
import { DataGrid, type Column } from '../../shared/DataGrid';
import { queryPods, type PodRow } from '../../../lib/supabase/pod';
import { useQuery } from '@tanstack/react-query';
import { useDataGrid } from '../../../hooks/useDataGrid';

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

    // Query with all parameters
    const { data, isLoading, error } = useQuery({
        queryKey: ['pods', { page, pageSize, sortConfig, filterConfig }],
        queryFn: () => queryPods({ 
            page, 
            pageSize, 
            sortBy: sortConfig.key as keyof PodRow | undefined, 
            sortDirection: sortConfig.direction,
            filter: filterConfig.quickFilter
        })
    });

    const columns = useMemo<Column<PodRow>[]>(() => [
        { 
            key: 'id', 
            header: 'Pod ID', 
            sortable: true,
            filterable: true
        },
        { 
            key: 'assigned_study_id', 
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
            key: 'time_since_first_use', 
            header: 'Time Since First Use', 
            sortable: true,
            render: (value) => typeof value === 'number' ? `${value} days` : '-'
        }
    ], []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-white">Pod Management</h1>
            
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
            </div>

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