import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { supabase } from './supabase'
import { logger } from '@/lib/logger'

type Tables = Database['public']['Tables']
type TableName = keyof Tables
type RPCFunctions = Database['public']['Functions']
type RPCName = keyof RPCFunctions

type QueryParams<T extends TableName> = {
  page?: number
  pageSize?: number
  filters?: Partial<Record<keyof Tables[T]['Row'], unknown>>
  sortBy?: keyof Tables[T]['Row']
  sortDirection?: 'asc' | 'desc'
  enabled?: boolean
}

/**
 * Hook for querying a Supabase table with filtering, sorting and pagination
 */
export function useSupabaseQuery<T extends TableName>(
  tableName: T,
  params: QueryParams<T> = {}
) {
  const {
    page = 1,
    pageSize = 10,
    filters,
    sortBy,
    sortDirection = 'asc',
    enabled = true,
  } = params

  return useQuery<Tables[T]['Row'][], PostgrestError>({
    queryKey: ['table', tableName, params],
    queryFn: async () => {
      logger.debug('Querying table', { tableName, params })

      // Type-safe query builder
      let query = supabase.from(tableName).select('*') as any

      // Apply pagination
      if (page && pageSize) {
        const start = (page - 1) * pageSize
        query = query.range(start, start + pageSize - 1)
      }

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Apply sorting
      if (sortBy) {
        query = query.order(sortBy as string, {
          ascending: sortDirection === 'asc',
        })
      }

      const { data, error } = await query as PostgrestSingleResponse<Tables[T]['Row'][]>

      if (error) {
        logger.error('Query failed', { tableName, error })
        throw error
      }

      return data || []
    },
    enabled,
  })
}

/**
 * Hook for calling a Supabase RPC function
 */
export function useSupabaseRPC<T extends RPCName>(
  functionName: T,
  params?: RPCFunctions[T]['Args']
) {
  return useMutation<RPCFunctions[T]['Returns'], PostgrestError, RPCFunctions[T]['Args']>({
    mutationFn: async (args) => {
      logger.debug('Calling RPC function', { functionName, args })
      const { data, error } = await supabase.rpc(functionName, args || params || {})
      
      if (error) {
        logger.error('RPC call failed', { functionName, error })
        throw error
      }

      return data as RPCFunctions[T]['Returns']
    }
  })
}

/**
 * Hook for inserting a row into a Supabase table
 */
export function useSupabaseInsert<T extends TableName>() {
  const queryClient = useQueryClient()

  return useMutation<Tables[T]['Row'], PostgrestError, { table: T; data: Tables[T]['Insert'] }>({
    mutationFn: async ({ table, data }) => {
      logger.debug('Inserting row', { table, data })
      const { data: result, error } = await (supabase
        .from(table)
        .insert(data)
        .select()
        .single() as any) as PostgrestSingleResponse<Tables[T]['Row']>

      if (error) {
        logger.error('Insert failed', { table, error })
        throw error
      }

      return result as Tables[T]['Row']
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    }
  })
}

/**
 * Hook for updating a row in a Supabase table
 */
export function useSupabaseUpdate<T extends TableName>() {
  const queryClient = useQueryClient()

  return useMutation<Tables[T]['Row'], PostgrestError, { table: T; id: string | number; data: Tables[T]['Update'] }>({
    mutationFn: async ({ table, id, data }) => {
      logger.debug('Updating row', { table, id, data })
      const { data: result, error } = await (supabase
        .from(table)
        .update(data)
        .eq('id', String(id))
        .select()
        .single() as any) as PostgrestSingleResponse<Tables[T]['Row']>

      if (error) {
        logger.error('Update failed', { table, error })
        throw error
      }

      return result as Tables[T]['Row']
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    }
  })
}

/**
 * Hook for deleting a row from a Supabase table
 */
export function useSupabaseDelete<T extends TableName>() {
  const queryClient = useQueryClient()

  return useMutation<void, PostgrestError, { table: T; id: string | number }>({
    mutationFn: async ({ table, id }) => {
      logger.debug('Deleting row', { table, id })
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', String(id))

      if (error) {
        logger.error('Delete failed', { table, error })
        throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    }
  })
}

// Export types
export type { 
  TableName,
  Tables,
  RPCName,
  RPCFunctions,
  QueryParams
} 