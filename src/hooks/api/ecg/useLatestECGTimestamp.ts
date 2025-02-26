import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/database.types';

export function useLatestECGTimestamp(studyId: string | null) {
    return useQuery({
        queryKey: ['latest-ecg-timestamp', studyId],
        queryFn: async () => {
            if (!studyId) return null;

            try {
                const { data, error } = await supabase
                    .rpc('get_study_details_with_earliest_latest', {
                        p_study_id: studyId
                    });

                if (error) throw error;
                return data?.[0]?.latest_time ?? null;
            } catch (err) {
                logger.error('Failed to fetch latest ECG timestamp', { error: err, studyId });
                throw err;
            }
        },
        enabled: !!studyId,
        staleTime: 60000, // Consider data fresh for 1 minute
    });
} 