import { useQuery } from '@tanstack/react-query';
import { HolterData, getHolterData } from '../lib/supabase';
import useTableStore from '../store/tableStore';

export const useHolterData = () => {
  const { page, pageSize, filters, sortBy, sortDirection } = useTableStore();

  const queryKey = ['holterData', { page, pageSize, filters, sortBy, sortDirection }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const start = page * pageSize;
      const end = start + pageSize - 1;
      const { data, error, count } = await getHolterData(start, end, filters, sortBy, sortDirection);

      if (error) {
        throw error;
      }
      return {data, count};
    },
    keepPreviousData: true,
  });
};

export type HolterStudy = {
  id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: string;
};
