import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import type { Database } from '@/types/database.types';

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

// Define StudyWithTimes type locally
interface StudyWithTimes {
  study: {
    study_id: string;
    clinic_id: string;
    pod_id: string;
    user_id: string | null;
    aggregated_quality_minutes: number | null;
    aggregated_total_minutes: number | null;
    duration: number | null;
    end_timestamp: string | null;
    expected_end_timestamp: string | null;
    start_timestamp: string | null;
    study_type: string | null;
    updated_at: string | null;
    created_at: string | null;
    created_by: string | null;
  };
  earliestTime: Date | null;
  latestTime: Date | null;
}

export type UseStudyListResult = {
  data: StudyWithTimes[] | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  totalCount: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function useStudyList(params: UseStudyListParams = {}): UseStudyListResult {
  const {
    data,
    error,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['studies', params],
    queryFn: async () => {
      try {
        // Fetch studies with times using RPC
        const { data: studies, error } = await supabase.rpc('get_studies_with_pod_times');
        
        if (error) throw error;
        if (!studies) return { data: [], totalCount: 0 };

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
        const totalCount = filteredStudies.length;

        // Apply pagination
        const start = params.page && params.pageSize 
          ? (params.page - 1) * params.pageSize 
          : 0;
        const end = start !== undefined && params.pageSize 
          ? start + params.pageSize - 1 
          : filteredStudies.length - 1;
        
        filteredStudies = filteredStudies.slice(start, end + 1);

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

        return { data: studiesWithTimes, totalCount };
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to fetch studies');
      }
    }
  });

  const result = data || { data: [], totalCount: 0 };
  const totalCount = result.totalCount;
  const pageCount = params.pageSize ? Math.ceil(totalCount / params.pageSize) : 1;
  const currentPage = params.page || 1;

  return {
    data: result.data,
    error,
    isLoading,
    isError,
    refetch,
    totalCount,
    pageCount,
    hasNextPage: currentPage < pageCount,
    hasPreviousPage: currentPage > 1
  };
} 