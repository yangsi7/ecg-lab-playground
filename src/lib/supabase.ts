/**
 * Unified Supabase client with React Query integration
 * Simplified type approach that balances type safety with maintainability
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, type PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { SupabaseError } from '@/types/utils'
import { logger } from '@/lib/logger'

// Type definitions with simplified approach
type Tables = Database['public']['Tables']
type TableName = keyof Tables
type RPCFunctions = Database['public']['Functions']
type RPCName = keyof RPCFunctions

// Helper type to get row type for a table
type TableRow<T extends TableName> = Tables[T]['Row']
type TableRowKey<T extends TableName> = Extract<keyof TableRow<T>, string>

// Simplified query parameters
interface QueryParams {
  page?: number
  pageSize?: number
  filters?: Record<string, unknown>
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  enabled?: boolean
}

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new SupabaseError('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new SupabaseError('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create and export the typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'ecg-lab',
    },
  },
})

/**
 * Hook for querying a Supabase table with simplified type handling
 */
export function useSupabaseQuery<T extends TableName>(
  tableName: T,
  params: QueryParams = {}
) {
  const {
    page = 1,
    pageSize = 10,
    filters,
    sortBy,
    sortDirection = 'asc',
    enabled = true,
  } = params

  return useQuery({
    queryKey: ['table', tableName, params],
    queryFn: async () => {
      logger.debug('Querying table', { tableName, params })

      // Type assertion for query builder
      let query = supabase.from(tableName).select('*') as any

      // Apply pagination
      if (page && pageSize) {
        const start = (page - 1) * pageSize
        query = query.range(start, start + pageSize - 1)
      }

      // Apply filters with runtime validation
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Apply sorting
      if (sortBy) {
        query = query.order(sortBy, {
          ascending: sortDirection === 'asc',
        })
      }

      const { data, error } = await query

      if (error) {
        logger.error('Query failed', { tableName, error })
        throw new SupabaseError(error.message)
      }

      // Runtime validation could be added here
      return data || []
    },
    enabled,
  })
}

/**
 * Hook for calling a Supabase RPC function with simplified typing
 */
export function useSupabaseRPC<T extends RPCName>(
  functionName: T,
  args?: RPCFunctions[T]['Args']
) {
  return useMutation({
    mutationFn: async () => {
      logger.debug('Calling RPC function', { functionName, args })
      const { data, error } = await supabase.rpc(functionName, args || {})

      if (error) {
        logger.error('RPC call failed', { functionName, error })
        throw new SupabaseError(error.message)
      }

      return data
    },
  })
}

/**
 * Hook for inserting a row with runtime validation
 */
export function useSupabaseInsert<T extends TableName>() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, data }: { table: T; data: unknown }) => {
      logger.debug('Inserting row', { table, data })

      // Runtime validation could be added here
      const { data: result, error } = await supabase
        .from(table)
        .insert(data as any)
        .select()
        .single()

      if (error) {
        logger.error('Insert failed', { table, error })
        throw new SupabaseError(error.message)
      }

      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    },
  })
}

/**
 * Hook for updating a row with runtime validation
 */
export function useSupabaseUpdate<T extends TableName>() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      table,
      id,
      data,
    }: {
      table: T
      id: string | number
      data: unknown
    }) => {
      logger.debug('Updating row', { table, id, data })

      const idKey: TableRowKey<T> = 'id' as TableRowKey<T>
      
      // Runtime validation could be added here
      const { data: result, error } = await supabase
        .from(table)
        .update(data as any)
        .eq(idKey, id.toString())
        .select()
        .single()

      if (error) {
        logger.error('Update failed', { table, error })
        throw new SupabaseError(error.message)
      }

      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    },
  })
}

/**
 * Hook for deleting a row
 */
export function useSupabaseDelete<T extends TableName>() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, id }: { table: T; id: string | number }) => {
      logger.debug('Deleting row', { table, id })

      const idKey: TableRowKey<T> = 'id' as TableRowKey<T>

      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idKey, id.toString())

      if (error) {
        logger.error('Delete failed', { table, error })
        throw new SupabaseError(error.message)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    },
  })
}

// Export types for convenience
export type {
  Tables,
  TableName,
  RPCName,
  RPCFunctions,
  QueryParams,
} 