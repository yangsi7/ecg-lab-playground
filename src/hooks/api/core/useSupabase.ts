import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { supabase } from '../../../types/supabase'
import { logger } from '@/lib/logger'

type Tables = Database['public']['Tables']
type TableName = keyof Tables
type RPCFunctions = Database['public']['Functions']
type RPCName = keyof RPCFunctions

// Create a type-safe record of all query executions for diagnostics
export interface QueryExecution {
  tableName: string;
  operation: 'query' | 'insert' | 'update' | 'delete' | 'rpc';
  params?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
  result?: unknown;
  [key: string]: unknown; // Adding index signature for flexibility
}

// Global query log
const queryLog: QueryExecution[] = [];

// Add query to log
const logQuery = (execution: QueryExecution) => {
  queryLog.unshift(execution);
  // Keep only last 50 queries
  if (queryLog.length > 50) {
    queryLog.pop();
  }
  logger.debug('Database operation executed', execution as Record<string, unknown>);
};

// Export the query log for DiagnosticsPanel to use
export const getQueryLog = () => [...queryLog];

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
      const startTime = performance.now();

      // Type-safe query builder
      let query = supabase.from(tableName).select('*')

      // Apply pagination
      if (page && pageSize) {
        const start = (page - 1) * pageSize
        query = query.range(start, start + pageSize - 1)
      }

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Cast to string to avoid type errors
            query = query.eq(key as any, value)
          }
        })
      }

      // Apply sorting
      if (sortBy) {
        query = query.order(sortBy as string, {
          ascending: sortDirection === 'asc',
        })
      }

      try {
        const { data, error } = await query as PostgrestSingleResponse<Tables[T]['Row'][]>
        
        const endTime = performance.now();
        
        // Log the query execution
        logQuery({
          tableName: tableName as string,
          operation: 'query',
          params: {
            page,
            pageSize,
            filters: filters as Record<string, unknown>,
            sortBy: sortBy as string,
            sortDirection
          },
          timestamp: new Date(),
          duration: endTime - startTime,
          success: !error,
          error: error?.message,
          result: { count: data?.length }
        });

        if (error) {
          logger.error('Query failed', { tableName, error })
          throw error
        }

        return data || []
      } catch (error) {
        const pgError = error as PostgrestError;
        logger.error('Query failed with exception', { tableName, error: pgError })
        
        logQuery({
          tableName: tableName as string,
          operation: 'query',
          params: params as Record<string, unknown>,
          timestamp: new Date(),
          duration: performance.now() - startTime,
          success: false,
          error: pgError.message
        });
        
        throw pgError
      }
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
      const startTime = performance.now();
      logger.debug('Calling RPC function', { functionName, args })
      
      try {
        const { data, error } = await supabase.rpc(functionName, args || params || {})
        
        const endTime = performance.now();
        
        // Helper function to get data size
        const getDataSize = (data: unknown) => {
          if (!data) return 'null';
          if (typeof data !== 'object') return typeof data;
          return Array.isArray(data) ? data.length : Object.keys(data).length;
        };
        
        // Log the RPC execution
        logQuery({
          tableName: functionName as string,
          operation: 'rpc',
          params: args || params || {},
          timestamp: new Date(),
          duration: endTime - startTime,
          success: !error,
          error: error?.message,
          result: { dataSize: getDataSize(data) }
        });

        if (error) {
          logger.error('RPC call failed', { functionName, error })
          throw error
        }

        return data as RPCFunctions[T]['Returns']
      } catch (error) {
        const pgError = error as PostgrestError;
        
        logQuery({
          tableName: functionName as string,
          operation: 'rpc',
          params: args || params || {},
          timestamp: new Date(),
          duration: performance.now() - startTime,
          success: false,
          error: pgError.message
        });
        
        throw pgError
      }
    }
  })
}

/**
 * Hook for inserting, updating, or deleting from Supabase table
 * Using a type-safe approach with TableName type
 */
export function useSupabaseMutation<T>() {
  const queryClient = useQueryClient()

  // Insert mutation
  const insert = useMutation<T, PostgrestError, { table: TableName; data: Record<string, any> }>({
    mutationFn: async ({ table, data }) => {
      const startTime = performance.now();
      logger.debug('Inserting row', { table, data })
      
      try {
        // Cast to any to bypass type checking for now due to complex types
        const { data: result, error } = await (supabase
          .from(table as string)
          .insert(data as any)
          .select()
          .single() as any);

        const endTime = performance.now();
        
        logQuery({
          tableName: table as string,
          operation: 'insert',
          params: { data },
          timestamp: new Date(),
          duration: endTime - startTime,
          success: !error,
          error: error?.message,
          result: { success: !error }
        });

        if (error) {
          logger.error('Insert failed', { table, error })
          throw error
        }

        return result as T
      } catch (error) {
        const pgError = error as PostgrestError;
        
        logQuery({
          tableName: table as string,
          operation: 'insert',
          params: { data },
          timestamp: new Date(),
          duration: performance.now() - startTime,
          success: false,
          error: pgError.message
        });
        
        throw pgError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    }
  })

  // Update mutation
  const update = useMutation<T, PostgrestError, { table: TableName; id: string; data: Record<string, any> }>({
    mutationFn: async ({ table, id, data }) => {
      const startTime = performance.now();
      logger.debug('Updating row', { table, id, data })
      
      try {
        // Cast to any to bypass type checking for now due to complex types
        const { data: result, error } = await (supabase
          .from(table as string)
          .update(data as any)
          .eq('id', id)
          .select()
          .single() as any);

        const endTime = performance.now();
        
        logQuery({
          tableName: table as string,
          operation: 'update',
          params: { id, data },
          timestamp: new Date(),
          duration: endTime - startTime,
          success: !error,
          error: error?.message,
          result: { success: !error }
        });

        if (error) {
          logger.error('Update failed', { table, error })
          throw error
        }

        return result as T
      } catch (error) {
        const pgError = error as PostgrestError;
        
        logQuery({
          tableName: table as string,
          operation: 'update',
          params: { id, data },
          timestamp: new Date(),
          duration: performance.now() - startTime,
          success: false,
          error: pgError.message
        });
        
        throw pgError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    }
  })

  // Delete mutation
  const remove = useMutation<void, PostgrestError, { table: TableName; id: string }>({
    mutationFn: async ({ table, id }) => {
      const startTime = performance.now();
      logger.debug('Deleting row', { table, id })
      
      try {
        // Cast to any to bypass type checking for now due to complex types
        const { error } = await (supabase
          .from(table as string)
          .delete()
          .eq('id', id) as any);

        const endTime = performance.now();
        
        logQuery({
          tableName: table as string,
          operation: 'delete',
          params: { id },
          timestamp: new Date(),
          duration: endTime - startTime,
          success: !error,
          error: error?.message,
          result: { success: !error }
        });

        if (error) {
          logger.error('Delete failed', { table, error })
          throw error
        }
      } catch (error) {
        const pgError = error as PostgrestError;
        
        logQuery({
          tableName: table as string,
          operation: 'delete',
          params: { id },
          timestamp: new Date(),
          duration: performance.now() - startTime,
          success: false,
          error: pgError.message
        });
        
        throw pgError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['table', variables.table] })
    }
  })

  return { insert, update, remove }
}

// For backward compatibility with existing code
export const useSupabaseInsert = () => {
  const { insert } = useSupabaseMutation()
  return insert
}

export const useSupabaseUpdate = () => {
  const { update } = useSupabaseMutation()
  return update
}

export const useSupabaseDelete = () => {
  const { remove } = useSupabaseMutation()
  return remove
}

// Export types
export type { 
  TableName,
  Tables,
  RPCName,
  RPCFunctions,
  QueryParams,
  QueryExecution
} 