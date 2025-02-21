/**
 * Domain-specific wrappers for study operations
 * Includes runtime validation and type safety
 */
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '@/lib/supabase'
import { toStudy } from '@/types/domain/study'
import type { Study, StudyRow } from '@/types/domain/study'
import { isStudy } from '@/types/domain/study'
import { logger } from '@/lib/logger'

interface StudyQueryParams {
  clinicId?: string
  podId?: string
  page?: number
  pageSize?: number
  sortBy?: keyof StudyRow
  sortDirection?: 'asc' | 'desc'
}

/**
 * Hook for querying studies with domain-specific validation
 */
export function useStudies(params: StudyQueryParams = {}) {
  const { clinicId, podId, ...queryParams } = params

  const filters: Record<string, unknown> = {}
  if (clinicId) filters.clinic_id = clinicId
  if (podId) filters.pod_id = podId

  return useSupabaseQuery('study', {
    ...queryParams,
    filters,
  })
}

/**
 * Hook for inserting a study with runtime validation
 */
export function useStudyInsert() {
  const insert = useSupabaseInsert<'study'>()

  return {
    ...insert,
    mutateAsync: async (study: Partial<Study>) => {
      try {
        // Runtime validation
        if (!study.study_id) {
          throw new Error('study_id is required')
        }

        // Transform to database format
        const dbStudy: Partial<StudyRow> = {
          study_id: study.study_id,
          clinic_id: study.clinic_id,
          pod_id: study.pod_id,
          duration: study.duration_days ? study.duration_days * 24 * 60 : undefined,
          start_timestamp: study.start_timestamp,
          end_timestamp: study.end_timestamp,
          expected_end_timestamp: study.expected_end_timestamp,
          study_type: study.study_type,
          user_id: study.user_id,
          created_by: study.created_by,
        }

        const result = await insert.mutateAsync({
          table: 'study',
          data: dbStudy,
        })

        // Transform result back to domain type
        return toStudy(result as StudyRow)
      } catch (error) {
        logger.error('Failed to insert study', { error, study })
        throw error
      }
    }
  }
}

/**
 * Hook for updating a study with runtime validation
 */
export function useStudyUpdate() {
  const update = useSupabaseUpdate<'study'>()

  return {
    ...update,
    mutateAsync: async ({ id, data }: { id: string; data: Partial<Study> }) => {
      try {
        // Transform to database format
        const dbStudy: Partial<StudyRow> = {
          duration: data.duration_days ? data.duration_days * 24 * 60 : undefined,
          start_timestamp: data.start_timestamp,
          end_timestamp: data.end_timestamp,
          expected_end_timestamp: data.expected_end_timestamp,
          study_type: data.study_type,
          user_id: data.user_id,
        }

        const result = await update.mutateAsync({
          table: 'study',
          id,
          data: dbStudy,
        })

        // Transform result back to domain type
        return toStudy(result as StudyRow)
      } catch (error) {
        logger.error('Failed to update study', { error, id, data })
        throw error
      }
    }
  }
}

/**
 * Hook for deleting a study
 */
export function useStudyDelete() {
  const deleteStudy = useSupabaseDelete<'study'>()

  return {
    ...deleteStudy,
    mutateAsync: async (id: string) => {
      try {
        await deleteStudy.mutateAsync({
          table: 'study',
          id,
        })
      } catch (error) {
        logger.error('Failed to delete study', { error, id })
        throw error
      }
    }
  }
} 