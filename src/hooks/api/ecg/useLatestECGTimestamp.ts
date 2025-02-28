import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { useStudyDetails } from '../study/useStudyDetails';

export function useLatestECGTimestamp(studyId: string | null) {
    // Use the study details hook which now uses get_studies_with_pod_times
    const { data: studyDetails, isLoading, error } = useStudyDetails(studyId);

    return useQuery({
        queryKey: ['latest-ecg-timestamp', studyId],
        queryFn: async () => {
            if (!studyId) return null;

            try {
                // If we have study details with latest_time, use it
                if (studyDetails && studyDetails.latest_time) {
                    return studyDetails.latest_time;
                }
                
                // If we don't have the data, log a warning
                if (!isLoading && !error) {
                    logger.warn('Study found but no latest_time available', { studyId });
                }
                
                return null;
            } catch (err) {
                logger.error('Failed to fetch latest ECG timestamp', { error: err, studyId });
                throw err;
            }
        },
        enabled: !!studyId && !isLoading,
        staleTime: 60000, // Consider data fresh for 1 minute
    });
} 