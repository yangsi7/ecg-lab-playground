import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase'
import { logger } from '@/lib/logger';
import type { HolterStudy } from '@/types/domain/holter';
import { toHolterStudy, calculateHolterStatus } from '@/types/domain/holter';
import { useHolterFilters } from '@/hooks/api/study/useHolterFilters';
import type { StudiesWithTimesRow } from '@/types/domain/study';

/**
 * Direct API call to bypass the type mismatch in Supabase client
 * 
 * This is a workaround for the error:
 * "Returned type timestamp with time zone does not match expected type timestamp without time zone in column 15"
 */
async function fetchStudiesWithPodTimes(): Promise<StudiesWithTimesRow[]> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Make direct API call to avoid type mismatch
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_studies_with_pod_times`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching studies with pod times', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

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
                // Use the direct API call function instead of Supabase client
                const data = await fetchStudiesWithPodTimes();

                if (!data) {
                    return [];
                }

                // Transform raw data to HolterStudy type
                const studies = data.map((row: StudiesWithTimesRow) => toHolterStudy({
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