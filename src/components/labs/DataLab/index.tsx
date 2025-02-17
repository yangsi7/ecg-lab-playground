import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStudiesWithTimes } from '../../hooks/api';
import { DataGrid, type Column } from '../../components/shared/DataGrid';
import type { StudiesWithTimesRow } from '../../types/domain/study';

export default function DataLab() {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortConfig] = useState({ key: 'study_id' as keyof StudiesWithTimesRow, direction: 'asc' as const });

  const { data, isLoading, error } = useStudiesWithTimes({
    page: currentPage,
    pageSize,
    sortBy: sortConfig.key,
    sortDirection: sortConfig.direction
  });

  const studies = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const columns = useMemo<Column<StudiesWithTimesRow>[]>(
    () => [
      { key: 'study_id', header: 'Study ID', sortable: true },
      { key: 'clinic_name', header: 'Clinic Name', sortable: true },
      { key: 'patient_id', header: 'Patient ID', sortable: true },
      { key: 'start_time', header: 'Start Time', sortable: true },
      { key: 'end_time', header: 'End Time', sortable: true },
    ],
    []
  );

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
      </div>
      <DataGrid 
        data={studies} 
        columns={columns} 
        defaultSortKey="study_id" 
      />
    </div>
  );
}
