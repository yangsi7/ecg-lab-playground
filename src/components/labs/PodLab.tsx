import { useState, useMemo } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { RefreshCw, AlertTriangle } from 'lucide-react';
    import { usePodData } from '../../hooks/usePodData';
    import { DataGrid } from '../table/DataGrid';

    export default function PodLab() {
      const navigate = useNavigate();
      const [currentPage, setCurrentPage] = useState(0);
      const [pageSize, setPageSize] = useState(25);
      const [sortConfig] = useState({ key: 'pod_id', direction: 'asc' });

      const { pods = [], loading, error, totalCount, isRefreshing } = usePodData({
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
        page: currentPage,
        pageSize,
      });

      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const pageRows = pods.slice(startIndex, endIndex);

      const columns = useMemo(
        () => [
          { key: 'pod_id', header: 'Pod ID', sortable: true },
          { key: 'status', header: 'Status', sortable: true },
          { key: 'serial_number', header: 'Serial Number', sortable: true },
          { key: 'location', header: 'Location', sortable: true },
          { key: 'last_sync_time', header: 'Last Sync', sortable: true },
          { key: 'battery_level', header: 'Battery', sortable: true },
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
            <h3 className="text-sm font-medium text-red-400">Error loading Pod data</h3>
            <p className="mt-1 text-sm text-red-300">{error}</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">Pod Lab</h1>
          </div>
          <DataGrid data={pods} columns={columns} defaultSortKey="pod_id" />
        </div>
      );
    }
