import { useState, useEffect, useCallback } from 'react';
import { queryTable, callRPC } from '../../core/utils';
import type { UseQueryResult, StudyWithTimes } from '../../core/types';
import { QueryError } from '../../core/errors';
import type { Database } from '../../../types/database.types';

type StudyWithPodTimes = Database['public']['Functions']['get_studies_with_pod_times']['Returns'][number];

export type UseStudyListParams = {
  clinicId?: string;
  status?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof StudyWithPodTimes;
  sortDirection?: 'asc' | 'desc';
};

export type UseStudyListResult = UseQueryResult<StudyWithTimes[]> & {
  totalCount: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function useStudyList(params: UseStudyListParams = {}): UseStudyListResult {
  const [data, setData] = useState<StudyWithTimes[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchStudies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate pagination
      const start = params.page && params.pageSize 
        ? (params.page - 1) * params.pageSize 
        : undefined;
      const end = start !== undefined && params.pageSize 
        ? start + params.pageSize - 1 
        : undefined;

      // Fetch studies with times using RPC
      const studies = await callRPC('get_studies_with_pod_times');

      // Apply filtering
      let filteredStudies = [...studies];
      if (params.clinicId) {
        filteredStudies = filteredStudies.filter(s => s.clinic_id === params.clinicId);
      }
      if (params.status) {
        filteredStudies = filteredStudies.filter(s => s.pod_status === params.status);
      }
      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase();
        filteredStudies = filteredStudies.filter(s => 
          s.study_id.toLowerCase().includes(query) ||
          s.clinic_name.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (params.sortBy) {
        filteredStudies.sort((a, b) => {
          const aVal = a[params.sortBy!];
          const bVal = b[params.sortBy!];
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const comparison = String(aVal).localeCompare(String(bVal));
          return params.sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      // Store total count before pagination
      setTotalCount(filteredStudies.length);

      // Apply pagination
      if (start !== undefined && end !== undefined) {
        filteredStudies = filteredStudies.slice(start, end + 1);
      }

      // Transform the data
      const studiesWithTimes: StudyWithTimes[] = filteredStudies.map(study => ({
        study: {
          study_id: study.study_id,
          clinic_id: study.clinic_id,
          pod_id: study.pod_id,
          user_id: study.user_id,
          aggregated_quality_minutes: study.aggregated_quality_minutes,
          aggregated_total_minutes: study.aggregated_total_minutes,
          duration: study.duration,
          end_timestamp: study.end_timestamp,
          expected_end_timestamp: study.expected_end_timestamp,
          start_timestamp: study.start_timestamp,
          study_type: study.study_type,
          updated_at: study.updated_at,
          created_at: study.created_at,
          created_by: study.created_by
        },
        earliestTime: study.earliest_time ? new Date(study.earliest_time) : null,
        latestTime: study.latest_time ? new Date(study.latest_time) : null
      }));

      setData(studiesWithTimes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new QueryError('Failed to fetch studies'));
      setData(null);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.clinicId,
    params.status,
    params.searchQuery,
    params.page,
    params.pageSize,
    params.sortBy,
    params.sortDirection
  ]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const pageCount = params.pageSize ? Math.ceil(totalCount / params.pageSize) : 1;
  const currentPage = params.page || 1;

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetchStudies,
    totalCount,
    pageCount,
    hasNextPage: currentPage < pageCount,
    hasPreviousPage: currentPage > 1
  };
} 