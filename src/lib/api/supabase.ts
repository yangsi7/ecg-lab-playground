/**
 * Unified Supabase API layer with React Query integration
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { SupabaseError } from '@/types/utils'
import { logger } from '@/lib/logger'

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new SupabaseError('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new SupabaseError('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create and export the Supabase client
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

// Type definitions
type Tables = Database['public']['Tables']
type TableName = keyof Tables
type RPCFunctions = Database['public']['Functions']
type RPCName = keyof RPCFunctions

// Query parameters and response types
interface QueryParams {
  start?: number
  end?: number
  filters?: Record<string, unknown>
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  enabled?: boolean
}

interface QueryMetadata {
  executionTime: number
  cached: boolean
}

interface QueryResponse<T> {
  data: T[]
  error: Error | null
  count: number
  metadata: QueryMetadata
}

interface RPCOptions {
  retry?: boolean
  retryCount?: number
  retryDelay?: number
  component?: string
  context?: Record<string, unknown>
}

// Core API functions
async function queryTable<T extends TableName>(
  tableName: T,
  params: QueryParams = {}
): Promise<QueryResponse<any>> {
  const startTime = performance.now()
  const { start, end, filters, sortBy, sortDirection = 'asc' } = params

  try {
    logger.debug('Querying table', { tableName, params })

    let query = supabase.from(tableName).select('*', { count: 'exact' })

    if (typeof start === 'number' && typeof end === 'number') {
      query = query.range(start, end)
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // @ts-ignore - Supabase types are too strict here
          query = query.eq(key, value)
        }
      })
    }

    if (sortBy) {
      // @ts-ignore - Supabase types are too strict here
      query = query.order(sortBy, { ascending: sortDirection === 'asc' })
    }

    const { data, error, count } = await query

    if (error) {
      throw new SupabaseError(error.message)
    }

    return {
      data: data || [],
      error: null,
      count: count ?? 0,
      metadata: {
        executionTime: performance.now() - startTime,
        cached: false,
      },
    }
  } catch (error) {
    logger.error('Query failed', { tableName, error })
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
      count: 0,
      metadata: {
        executionTime: performance.now() - startTime,
        cached: false,
      },
    }
  }
}

async function callRPC<T extends RPCName>(
  functionName: T,
  args?: RPCFunctions[T]['Args'],
  options: RPCOptions = {}
): Promise<RPCFunctions[T]['Returns']> {
  const { retry = true, retryCount = 3, retryDelay = 1000, component, context } = options
  let attempts = 0
  let lastError: Error | null = null

  while (attempts < retryCount) {
    try {
      logger.debug('Calling RPC function', { functionName, args, attempt: attempts + 1, component, context })
      const { data, error } = await supabase.rpc(functionName, args || {})

      if (error) {
        throw new SupabaseError(error.message)
      }

      logger.debug('RPC call successful', { functionName, data })
      return data as RPCFunctions[T]['Returns']
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      attempts++

      logger.warn('RPC call failed', {
        functionName,
        error: lastError,
        attempt: attempts,
        willRetry: attempts < retryCount && retry,
      })

      if (attempts < retryCount && retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
      } else {
        break
      }
    }
  }

  throw lastError ?? new Error('RPC call failed after retries')
}

// React Query hooks
export function useSupabaseQuery<T extends TableName>(
  tableName: T,
  params: QueryParams = {}
) {
  const { enabled = true, ...queryParams } = params

  return useQuery<any[], PostgrestError>({
    queryKey: ['table', tableName, queryParams],
    queryFn: async () => {
      const response = await queryTable(tableName, queryParams)
      if (response.error) throw response.error
      return response.data
    },
    enabled,
  })
}

export function useSupabaseRPC<T extends RPCName>(
  functionName: T,
  args?: RPCFunctions[T]['Args'],
  options: RPCOptions = {}
) {
  return useMutation<RPCFunctions[T]['Returns'], PostgrestError>({
    mutationFn: async () => callRPC(functionName, args, options),
  })
}

// Type-safe mutation hooks
export function useSupabaseInsert<T extends TableName>() {
  return useMutation<any, PostgrestError, { table: T; data: any }>({
    mutationFn: async ({ table, data }) => {
      logger.debug('Inserting row', { table, data })
      const { data: result, error } = await supabase
        .from(table)
        // @ts-ignore - Supabase types are too strict here
        .insert(data)
        .select()
        .single()

      if (error) throw new SupabaseError(error.message)
      return result
    },
  })
}

export function useSupabaseUpdate<T extends TableName>() {
  return useMutation<any, PostgrestError, { table: T; id: string | number; data: any }>({
    mutationFn: async ({ table, id, data }) => {
      logger.debug('Updating row', { table, id, data })
      const { data: result, error } = await supabase
        .from(table)
        // @ts-ignore - Supabase types are too strict here
        .update(data)
        // @ts-ignore - Supabase types are too strict here
        .eq('id', id)
        .select()
        .single()

      if (error) throw new SupabaseError(error.message)
      return result
    },
  })
}

export function useSupabaseDelete<T extends TableName>() {
  return useMutation<void, PostgrestError, { table: T; id: string | number }>({
    mutationFn: async ({ table, id }) => {
      logger.debug('Deleting row', { table, id })
      const { error } = await supabase
        .from(table)
        .delete()
        // @ts-ignore - Supabase types are too strict here
        .eq('id', id)

      if (error) throw new SupabaseError(error.message)
    },
  })
}

// Export types
export type {
  TableName,
  RPCName,
  RPCFunctions,
  QueryParams,
  QueryResponse,
  RPCOptions,
} 