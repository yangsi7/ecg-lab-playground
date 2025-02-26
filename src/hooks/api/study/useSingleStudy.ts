// src/hooks/useSingleStudy.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import { logger } from '@/lib/logger';

// Import study types from domain models
import type { Study } from '@/types/domain/study';

interface StudyResult {
    study: Study | null;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to fetch a single study by its ID
 * @param studyId - The UUID of the study to fetch
 * @returns Object containing the study data, loading state, and error if any
 */
export function useSingleStudy(studyId?: string): StudyResult {
    const { data, isLoading, error } = useQuery({
        queryKey: ['study', studyId],
        queryFn: async () => {
            if (!studyId) return null;

            try {
                logger.debug('Fetching single study', { studyId });
                
                const { data, error } = await supabase
                    .from('study')
                    .select('*')
                    .eq('study_id', studyId)
                    .single();

                if (error) {
                    logger.error('Error fetching single study', { 
                        studyId, 
                        error: error.message 
                    });
                    throw error;
                }
                
                return data as Study;
            } catch (err) {
                logger.error('Failed to fetch study', { 
                    studyId, 
                    error: err instanceof Error ? err.message : String(err) 
                });
                throw err;
            }
        },
        enabled: !!studyId,
        staleTime: 60000 // Consider data fresh for 1 minute
    });

    return {
        study: data ?? null,
        loading: isLoading,
        error: error instanceof Error ? error.message : null
    };
}
