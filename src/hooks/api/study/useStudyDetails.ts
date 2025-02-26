import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../types/supabase';
import type { Database } from '@/types/database.types';

type StudyDetailsWithTimes = Database['public']['Functions']['get_study_details_with_earliest_latest']['Returns'][0];

export function useStudyDetails(studyId: string) {
    return useQuery({
        queryKey: ['study', studyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_study_details_with_earliest_latest', {
                    p_study_id: studyId
                });

            if (error) throw error;
            if (!data || !data[0]) throw new Error('Study not found');

            return data[0] as StudyDetailsWithTimes;
        },
        enabled: !!studyId
    });
} 