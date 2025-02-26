import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/types/index';
import { useRPC } from '@/hooks/api/core';

type StudyDiagnostics = Database['public']['Functions']['get_study_diagnostics']['Returns'][number];

export type UseStudyDiagnosticsResult = {
  data: StudyDiagnostics | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useStudyDiagnostics(studyId?: string, options?: { enabled?: boolean }): UseStudyDiagnosticsResult {
  // Get the callRPC function from useRPC
  const { callRPC } = useRPC();

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

      try {
        const data = await callRPC('get_study_diagnostics', {
          p_study_id: studyId
        }, {
          component: 'useStudyDiagnostics',
          context: { studyId }
        });

        if (!data || data.length === 0) {
          throw new Error(`No diagnostics found for study ${studyId}`);
        }

        return data[0] as StudyDiagnostics;
      } catch (error) {
        console.error('Error fetching study diagnostics:', error);
        throw error;
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!studyId
  });

  return {
    data: data || null,
    error: error instanceof Error ? error : null,
    isLoading,
    isError,
    refetch
  };
} 