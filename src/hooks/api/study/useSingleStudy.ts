import { useState, useEffect, useCallback } from 'react';
import { callRPC } from '../core/utils';
import type { UseQueryResult } from '../core/types';
import { QueryError } from '../core/errors';
import type { Database } from '../../../types/database.types';

type StudyDetails = Database['public']['Functions']['get_study_details_with_earliest_latest']['Returns'][number];

export type UseSingleStudyResult = UseQueryResult<StudyDetails>;

export function useSingleStudy(studyId?: string): UseSingleStudyResult {
  const [data, setData] = useState<StudyDetails | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudy = useCallback(async () => {
    if (!studyId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const studies = await callRPC('get_study_details_with_earliest_latest', {
        p_study_id: studyId
      });

      if (!studies || studies.length === 0) {
        setData(null);
        setError(new QueryError(`Study ${studyId} not found`));
      } else {
        setData(studies[0]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new QueryError('Failed to fetch study details'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchStudy();
  }, [fetchStudy]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchStudy
  };
} 