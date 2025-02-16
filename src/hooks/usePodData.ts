import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SupabaseRow } from '../types/utils';
import { useTableStore } from '../store/tableStore';

export type PodData = SupabaseRow<'pod'>;

export async function getPodData(studyId: string): Promise<PodData[]> {
  const { data, error } = await supabase
    .from('pod')
    .select('*')
    .eq('study_id', studyId)
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export const usePodData = () => {
  const { currentPage, pageSize, sortField, sortDirection, quickFilter } = useTableStore();

  return useQuery({
    queryKey: ['pod', { page: currentPage, pageSize, filter: quickFilter, sortBy: sortField, sortDirection }],
    queryFn: async () => {
      const start = currentPage * pageSize;
      const end = start + pageSize - 1;
      let query = supabase
        .from('pod')
        .select('*', { count: 'exact' })
        .range(start, end);

      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      } else {
        query = query.order('timestamp', { ascending: true });
      }

      if (quickFilter) {
        query = query.ilike('id', `%${quickFilter}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { data: data ?? [], count: count ?? 0 };
    }
  });
};
