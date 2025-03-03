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
                // If we have study details with latest_ecg_data, use it
                if (studyDetails && studyDetails.latest_ecg_data) {
                    return studyDetails.latest_ecg_data;
                }
                
                // If we don't have the data, log a warning
                if (!isLoading && !error) {
                    logger.warn('Study found but no latest_ecg_data available', { studyId });
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
