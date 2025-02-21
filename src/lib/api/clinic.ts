/**
 * Domain-specific wrappers for clinic operations
 * Includes runtime validation and type safety
 */
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '@/lib/supabase'
import { toClinic } from '@/types/domain/clinic'
import type { Clinic, ClinicRow } from '@/types/domain/clinic'
import { isClinic } from '@/types/domain/clinic'
import { logger } from '@/lib/logger'

interface ClinicQueryParams {
  page?: number
  pageSize?: number
  sortBy?: keyof ClinicRow
  sortDirection?: 'asc' | 'desc'
}

/**
 * Hook for querying clinics with domain-specific validation
 */
export function useClinics(params: ClinicQueryParams = {}) {
  return useSupabaseQuery('clinics', params)
}

/**
 * Hook for inserting a clinic with runtime validation
 */
export function useClinicInsert() {
  const insert = useSupabaseInsert<'clinics'>()

  return {
    ...insert,
    mutateAsync: async (clinic: Partial<Clinic>) => {
      try {
        // Runtime validation
        if (!clinic.name) {
          throw new Error('Clinic name is required')
        }

        // Transform to database format
        const dbClinic: Partial<ClinicRow> = {
          name: clinic.name,
        }

        const result = await insert.mutateAsync({
          table: 'clinics',
          data: dbClinic,
        })

        // Transform result back to domain type
        return toClinic(result as ClinicRow)
      } catch (error) {
        logger.error('Failed to insert clinic', { error, clinic })
        throw error
      }
    }
  }
}

/**
 * Hook for updating a clinic with runtime validation
 */
export function useClinicUpdate() {
  const update = useSupabaseUpdate<'clinics'>()

  return {
    ...update,
    mutateAsync: async ({ id, data }: { id: string; data: Partial<Clinic> }) => {
      try {
        // Runtime validation
        if (data.name === '') {
          throw new Error('Clinic name cannot be empty')
        }

        // Transform to database format
        const dbClinic: Partial<ClinicRow> = {
          name: data.name,
        }

        const result = await update.mutateAsync({
          table: 'clinics',
          id,
          data: dbClinic,
        })

        // Transform result back to domain type
        return toClinic(result as ClinicRow)
      } catch (error) {
        logger.error('Failed to update clinic', { error, id, data })
        throw error
      }
    }
  }
}

/**
 * Hook for deleting a clinic
 */
export function useClinicDelete() {
  const deleteClinic = useSupabaseDelete<'clinics'>()

  return {
    ...deleteClinic,
    mutateAsync: async (id: string) => {
      try {
        await deleteClinic.mutateAsync({
          table: 'clinics',
          id,
        })
      } catch (error) {
        logger.error('Failed to delete clinic', { error, id })
        throw error
      }
    }
  }
} 