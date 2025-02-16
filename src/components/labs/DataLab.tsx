import { useState, useMemo } from 'react';
    import { RefreshCw } from 'lucide-react';
    import { useStudiesWithTimes } from '../../hooks/useStudiesWithTimes';
    import { DataGrid } from '../table/DataGrid';

    export default function DataLab() {
      const [currentPage, setCurrentPage] = useState(0);
      const [pageSize, setPageSize] = useState(25);
      const [sortConfig] = useState({ key: 'study_id', direction: 'asc' });

      const { studies = [], loading, error, totalCount } = useStudiesWithTimes({
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
        page: currentPage,
        pageSize,
      });

      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const pageRows = studies.slice(startIndex, endIndex);

      const columns = useMemo(
        () => [
          { key: 'study_id', header: 'Study ID', sortable: true },
          { key: 'clinic_name', header: 'Clinic Name', sortable: true },
          { key: 'patient_id', header: 'Patient ID', sortable: true },
          { key: 'start_time', header: 'Start Time', sortable: true },
          { key: 'end_time', header: 'End Time', sortable: true },
        ],
        []
      );

      if (loading) {
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
            <p className="mt-1 text-sm text-red-300">{error}</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Data Lab</h1>
          </div>
          <DataGrid data={studies} columns={columns} defaultSortKey="study_id" />
        </div>
      );
    }
