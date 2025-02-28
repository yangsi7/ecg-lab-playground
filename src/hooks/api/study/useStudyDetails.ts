import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import type { Database } from '@/types/database.types';
import { logger } from '@/lib/logger';

type StudyDetailsWithTimes = Database['public']['Functions']['get_studies_with_pod_times']['Returns'][0];

export function useStudyDetails(studyId: string | null) {
    return useQuery({
        queryKey: ['studyDetails', studyId],
        queryFn: async () => {
            if (!studyId) return null;
            
            try {
                const { data, error } = await supabase.rpc('get_studies_with_pod_times');
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    return null;
                }
                
                const study = data.find(s => s.study_id === studyId);
                
                if (!study) {
                    return null;
                }
                
                return study;
            } catch (err) {
                logger.error('Failed to fetch study details', { 
                    studyId, 
                    error: err instanceof Error ? err.message : String(err) 
                });
                throw err;
            }
        },
        enabled: !!studyId,
        staleTime: 60000,
        gcTime: 5 * 60 * 1000,
    });
} 