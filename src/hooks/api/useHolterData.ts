import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toHolterStudy } from '../../types/domain/holter';
import type { HolterStudy } from '../../types/domain/holter';
import type { StudyRow } from '../../lib/supabase/client';

interface UseHolterDataResult {
  studies: HolterStudy[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  isRefreshing: boolean;
}

export const useHolterData = (): UseHolterDataResult => {
  const { data, isLoading, isRefetching, error } = useQuery({
    queryKey: ['holterData'],
    queryFn: async () => {
      const { data, error: queryError, count } = await supabase
        .from('study')
        .select('*, clinics(name)', { count: 'exact' });

      if (queryError) throw queryError;

      const studies = (data || []).map((row: StudyRow & { clinics: { name: string } }) => 
        toHolterStudy({ 
          ...row, 
          clinic_name: row.clinics?.name ?? 'Unknown Clinic' 
        })
      );

      return {
        data: studies,
        count: count ?? 0
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
