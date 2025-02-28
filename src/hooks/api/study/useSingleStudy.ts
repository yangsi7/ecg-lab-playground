// src/hooks/useSingleStudy.ts
import { useStudyDetails } from './useStudyDetails';
import { logger } from '@/lib/logger';
import { Study, StudyDetailsWithTimes } from '@/types/domain/study';

interface StudyResult {
    data: StudyDetailsWithTimes | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook to fetch a single study by its ID using the get_studies_with_pod_times RPC function
 * @param studyId - The UUID of the study to fetch
 * @returns Object containing the study data, loading state, and error if any
 */
export function useSingleStudy(studyId?: string): StudyResult {
    const { data, isLoading, error } = useStudyDetails(studyId || null);
    
    logger.debug('useSingleStudy', { studyId, hasData: !!data });
    
    return {
        data: data || null,
        isLoading,
        error: error as Error | null
    };
}
