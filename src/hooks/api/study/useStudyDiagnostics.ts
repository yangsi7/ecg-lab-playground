import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import type { Database } from '@/types/database.types';

type StudyDiagnostics = Database['public']['Functions']['get_study_diagnostics']['Returns'][number];

export type UseStudyDiagnosticsResult = {
  data: StudyDiagnostics | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useStudyDiagnostics(studyId?: string): UseStudyDiagnosticsResult {
  const {
    data,
    error,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['studyDiagnostics', studyId],
    queryFn: async () => {
      if (!studyId) {
        return null;
      }

      const { data, error } = await supabase.rpc('get_study_diagnostics', {
        p_study_id: studyId
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(`No diagnostics found for study ${studyId}`);
      }

      return data[0] as StudyDiagnostics;
    },
    enabled: !!studyId
  });

  return {
    data: data || null,
    error: error instanceof Error ? error : null,
    isLoading,
    isError,
    refetch
  };
} 