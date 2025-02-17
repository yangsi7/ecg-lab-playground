import React, { useMemo } from 'react';
import { DataGrid, type Column } from '../../components/shared/DataGrid';
import { useQuery } from '@tanstack/react-query';
import { fetchPods } from '../../supabase/rpc/pod';
import type { PodRow } from '../../supabase/rpc/pod';

const PodLab: React.FC = () => {
  const { data: pods = [] } = useQuery<PodRow[]>({
    queryKey: ['pods'],
    queryFn: fetchPods,
  });

  const columns = useMemo<Column<PodRow>[]>(() => [
    { field: 'id', header: 'Pod ID', sortable: true },
    { field: 'status', header: 'Status', sortable: true },
    { field: 'assigned_study_id', header: 'Study ID', sortable: true },
    { field: 'time_since_first_use', header: 'Time Since First Use', sortable: true },
  ], []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pod Lab</h1>
      <DataGrid
        data={pods}
        columns={columns}
        pageSize={10}
      />
    </div>
  );
};

export default PodLab; 