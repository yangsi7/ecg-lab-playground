import { useState } from 'react';
import { useStudiesWithTimes } from '../hooks/api';
import { DataGrid } from '../components/shared/DataGrid';
import type { StudiesWithTimesRow } from '../types/domain/study';
import type { Column } from '../components/shared/DataGrid';

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

    if (error) {
        return <div>Error loading data: {error.message}</div>;
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const columns: Column<StudiesWithTimesRow>[] = [
        {
            key: 'study_id',
            header: 'Study ID',
            sortable: true
        },
        {
            key: 'pod_id',
            header: 'Pod ID',
            sortable: true
        },
        {
            key: 'start_timestamp',
            header: 'Start Time',
            sortable: true
        },
        {
            key: 'end_timestamp',
            header: 'End Time',
            sortable: true
        },
        {
            key: 'earliest_time',
            header: 'Earliest Time',
            sortable: true
        },
        {
            key: 'latest_time',
            header: 'Latest Time',
            sortable: true
        }
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Data Lab</h1>
            <DataGrid
                columns={columns}
                data={data?.data || []}
                defaultSortKey={sortBy}
                pageSize={pageSize}
            />
        </div>
    );
} 