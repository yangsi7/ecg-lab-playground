import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import type { HolterStudy } from '../../types/domain/holter';
import { useHolterFilters } from '../../components/labs/HolterLab/hooks/useHolterFilters';
import type { Database } from '../../types/database.types';
import { logger } from '../../lib/logger';

type StudyRow = Database['public']['Tables']['study']['Row'];

interface UseHolterStudiesResult {
    studies: HolterStudy[];
    loading: boolean;
    error: string | null;
    totalCount: number;
}

export function useHolterStudies(): UseHolterStudiesResult {
    const {
        quickFilter,
        advancedFilter,
        filterStudies
    } = useHolterFilters();

    const { data, isLoading, error } = useQuery({
        queryKey: ['holter-studies', { quickFilter, advancedFilter }],
        queryFn: async () => {
            try {
                logger.info('Fetching Holter studies...');
                
                const { data: studies, error: dbError } = await supabase
                    .from('study')
                    .select('*')
                    .eq('study_type', 'holter');

                if (dbError) {
                    logger.error('Database error:', { 
                        message: dbError.message, 
                        code: dbError.code,
                        details: dbError.details 
                    });
                    throw new Error(dbError.message);
                }

                if (!studies) {
                    logger.warn('No studies found');
                    return { studies: [], totalCount: 0 };
                }

                logger.info(`Found ${studies.length} Holter studies`);

                // Convert to HolterStudy type and apply filters
                const holterStudies = studies.map((study: StudyRow) => ({
                    ...study,
                    qualityFraction: (study.aggregated_quality_minutes ?? 0) / (study.aggregated_total_minutes ?? 1),
                    totalHours: (study.aggregated_total_minutes ?? 0) / 60
                })) as HolterStudy[];

                const filteredStudies = filterStudies(holterStudies);
                logger.info(`Filtered to ${filteredStudies.length} studies`);

                return {
                    studies: filteredStudies,
                    totalCount: studies.length
                };
            } catch (err) {
                const errorObj = err instanceof Error ? {
                    message: err.message,
                    name: err.name,
                    stack: err.stack
                } : { message: String(err) };
                
                logger.error('Error in useHolterStudies:', errorObj);
                throw err;
            }
        }
    });

    return {
        studies: data?.studies || [],
        loading: isLoading,
        error: error instanceof Error ? error.message : null,
        totalCount: data?.totalCount || 0
    };
} 