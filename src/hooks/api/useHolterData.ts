import { useQuery } from '@tanstack/react-query';
import { useTableStore } from '../store/tableStore';
import { queryTable } from '../lib/supabase';
import { toHolterStudy } from '../types/domain/holter';
import type { HolterStudy } from '../types/domain/holter';
import type { StudyRow } from '../lib/supabase';
import type { SupabaseRow } from '../types/utils';

interface UseHolterDataResult {
  studies: HolterStudy[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  isRefreshing: boolean;
}

export const useHolterData = (): UseHolterDataResult => {
  const { 
    currentPage, 
    pageSize, 
    sortField, 
    sortDirection, 
    quickFilter, 
    advancedFilter 
  } = useTableStore();

  const { data, isLoading, isRefetching, error } = useQuery({
    queryKey: ['holterData', { 
      page: currentPage, 
      pageSize, 
      sortField, 
      sortDirection, 
      quickFilter, 
      advancedFilter 
    }],
    queryFn: async () => {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;

      // Query studies with clinic names using a join
      const result = await queryTable('study', {
        start,
        end,
        sortBy: sortField,
        sortDirection: sortDirection as 'asc' | 'desc',
      });

      if (result.error) {
        throw result.error;
      }

      // Transform database rows to domain types
      const studies = (result.data || []).map((row: StudyRow) => 
        toHolterStudy({ ...row, clinic_name: 'TODO: Join with clinics table' })
      );

      // Apply filters on the client side for now
      // TODO: Move filtering to the database query
      let filteredStudies = studies;
      
      if (quickFilter) {
        switch (quickFilter) {
          case 'bad-quality':
            filteredStudies = filteredStudies.filter(study => study.qualityFraction < 0.5);
            break;
          case 'needs-intervention':
            filteredStudies = filteredStudies.filter(study => study.totalHours < 20);
            break;
          case 'under-target':
            filteredStudies = filteredStudies.filter(study => study.totalHours < 10);
            break;
        }
      }

      return {
        data: filteredStudies,
        count: result.count
      };
    }
  });

  return {
    studies: data?.data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error : null,
    totalCount: data?.count ?? 0,
    isRefreshing: isRefetching
  };
};
