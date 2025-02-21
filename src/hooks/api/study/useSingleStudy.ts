import { useQuery } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '../supabase';
import { logger } from '@/lib/logger';
import type { Study } from '@/types/domain/study';

interface StudyDetailsResponse {
    study_id: string;
    pod_id: string;
    clinic_id: string;
    start_timestamp: string;
    end_timestamp: string;
    earliest_time: string;
    latest_time: string;
    total_count: number;
}

export function useSingleStudy(studyId: string | null) {
    return useQuery<StudyDetailsResponse>({
        queryKey: ['study', studyId],
        queryFn: async () => {
            if (!studyId) throw new Error('Study ID is required');

            logger.debug('Fetching study details', { studyId });

            const { data, error } = await supabase.rpc(
                'get_study_details_with_earliest_latest',
                { p_study_id: studyId }
            );

            if (error) {
                logger.error('Failed to fetch study details', { error });
                throw handleSupabaseError(error);
            }

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Study not found');
            }

            return data[0] as StudyDetailsResponse;
        },
        enabled: !!studyId,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    });
} 