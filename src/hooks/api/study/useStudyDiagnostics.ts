import { useState, useEffect, useCallback } from 'react';
import { callRPC } from '../../core/utils';
import type { UseQueryResult } from '../../core/types';
import { QueryError } from '../../core/errors';
import type { Database } from '../../../types/database.types';

type StudyDiagnostics = Database['public']['Functions']['get_study_diagnostics']['Returns'][number];

export type UseStudyDiagnosticsResult = UseQueryResult<StudyDiagnostics>;

export function useStudyDiagnostics(studyId?: string): UseStudyDiagnosticsResult {
  const [data, setData] = useState<StudyDiagnostics | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiagnostics = useCallback(async () => {
    if (!studyId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const diagnostics = await callRPC('get_study_diagnostics', {
        p_study_id: studyId
      });

      if (!diagnostics || diagnostics.length === 0) {
        setData(null);
        setError(new QueryError(`No diagnostics found for study ${studyId}`));
      } else {
        setData(diagnostics[0]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new QueryError('Failed to fetch study diagnostics'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchDiagnostics
  };
} 