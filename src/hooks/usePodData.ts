import { useQuery } from '@tanstack/react-query';
import { PodData, getPodData } from '../lib/supabase';
import useTableStore from '../store/tableStore';

export const usePodData = () => {
  const { page, pageSize, filters, sortBy, sortDirection } = useTableStore();

  const queryKey = ['podData', { page, pageSize, filters, sortBy, sortDirection }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const start = page * pageSize;
      const end = start + pageSize - 1;
      const { data, error, count } = await getPodData(start, end, filters, sortBy, sortDirection);

      if (error) {
        throw error;
      }
      return { data, count };
    },
    keepPreviousData: true,
  });
};
