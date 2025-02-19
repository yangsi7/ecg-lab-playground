// src/hooks/useSingleStudy.ts
import { useQuery } from '@tanstack/react-query';
import { supabase, type StudyRow } from '../../lib/supabase';

interface StudyResult {
    study: StudyRow | null;
    loading: boolean;
    error: string | null;
}

export function useSingleStudy(studyId?: string): StudyResult {
    const { data, isLoading, error } = useQuery({
        queryKey: ['study', studyId],
        queryFn: async () => {
            if (!studyId) return null;

            const { data, error } = await supabase
                .from('study')
                .select('*')
                .eq('study_id', studyId)
                .single();

            if (error) throw error;
            return data as StudyRow;
        },
        enabled: !!studyId
    });

    return {
        study: data ?? null,
        loading: isLoading,
        error: error instanceof Error ? error.message : null
    };
}
