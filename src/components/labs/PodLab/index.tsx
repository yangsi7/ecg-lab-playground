import React, { useState, useMemo } from 'react';
import { DataGrid, type Column } from '../../../components/shared/DataGrid';
import { queryPods, type PodRow } from '../../../lib/supabase/pod';
import { useQuery } from '@tanstack/react-query';

export default function PodLab() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [filter, setFilter] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['pods', { page, pageSize, filter }],
        queryFn: () => queryPods({ page, pageSize, filter })
    });

    const columns = useMemo<Column<PodRow>[]>(() => [
        { key: 'pod_id', header: 'Pod ID', sortable: true },
        { key: 'study_id', header: 'Study ID', sortable: true },
        { key: 'status', header: 'Status', sortable: true },
        { key: 'created_at', header: 'Created', sortable: true },
        { key: 'last_data_at', header: 'Last Data', sortable: true },
        { key: 'firmware_version', header: 'Firmware', sortable: true }
    ], []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-white">Pod Management</h1>
            
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter pods..."
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white"
                />
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
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
                onPageChange={setPage}
                hasMore={(data?.count ?? 0) > page * pageSize}
            />
        </div>
    );
} 