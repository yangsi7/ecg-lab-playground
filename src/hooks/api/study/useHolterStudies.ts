import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase'
import { logger } from '@/lib/logger';
import type { HolterStudy } from '@/types/domain/holter';
import { toHolterStudy, calculateHolterStatus } from '@/types/domain/holter';
import { useHolterFilters } from '@/hooks/api/study/useHolterFilters';
import type { PostgrestError } from '@supabase/supabase-js';

interface UseHolterStudiesResult {
    studies: HolterStudy[];
    isLoading: boolean;
    error: Error | null;
    totalCount: number;
}

export function useHolterStudies() {
    const { quickFilter, advancedFilter, filterStudies } = useHolterFilters();

    const query = useQuery<HolterStudy[], Error>({
        queryKey: ['holter-studies', quickFilter, advancedFilter],
        queryFn: async () => {
            try {
                const { data, error } = await supabase.rpc('get_studies_with_pod_times');

                if (error) {
                    logger.error('Supabase RPC error:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint
                    });
                    throw new Error(error.message);
                }

                if (!data) {
                    return [];
                }

                // Transform raw data to HolterStudy type
                const studies = data.map(row => toHolterStudy({
                    ...row,
                    clinic_name: row.clinic_name ?? ''
                }));

                return filterStudies(studies);

            } catch (error) {
                const err = error instanceof Error ? error : new Error('Unknown error fetching holter studies');
                logger.error('Error in useHolterStudies:', { 
                    message: err.message,
                    name: err.name,
                    stack: err.stack
                });
                throw err;
            }
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        studies: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        totalCount: query.data?.length || 0
    };
} 