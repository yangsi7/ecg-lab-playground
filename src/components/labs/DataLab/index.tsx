import { useState, useMemo } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { useStudiesWithTimes } from '../../../hooks/api';
import { DataGrid, type Column } from '../../../components/shared/DataGrid';
import type { StudiesWithTimesRow } from '../../../types/domain/study';

export default function DataLab() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<keyof StudiesWithTimesRow>('study_id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const { data, isLoading, error } = useStudiesWithTimes({
        search,
        page,
        pageSize,
        sortBy,
        sortDirection
    });

    const studies = data?.data ?? [];
    const totalCount = data?.totalCount ?? 0;

    const columns = useMemo<Column<StudiesWithTimesRow>[]>(() => [
        { key: 'study_id', header: 'Study ID', sortable: true },
        { key: 'pod_id', header: 'Pod ID', sortable: true },
        { key: 'start_timestamp', header: 'Start Time', sortable: true },
        { key: 'end_timestamp', header: 'End Time', sortable: true },
        { key: 'earliest_time', header: 'Earliest Time', sortable: true },
        { key: 'latest_time', header: 'Latest Time', sortable: true }
    ], []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
                <h3 className="text-sm font-medium text-red-400">Error loading study data</h3>
                <p className="mt-1 text-sm text-red-300">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">Data Lab</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search studies..."
                            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg text-white px-3 py-2"
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                    </select>
                </div>
            </div>

            <DataGrid 
                data={studies} 
                columns={columns}
                defaultSortKey={sortBy}
                pageSize={pageSize}
                filterExpression={search}
            />

            <div className="flex justify-between items-center text-sm text-gray-400">
                <div>
                    Showing {studies.length} of {totalCount} studies
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 bg-white/5 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span>Page {page + 1}</span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={studies.length < pageSize}
                        className="px-3 py-1 bg-white/5 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
