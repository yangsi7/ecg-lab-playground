import { supabase } from '@/hooks/api/core/supabase';
import type { QueryParams, QueryResponse } from '@/types/utils';
import { QueryError, SupabaseError } from './errors';
import type { Database } from '@/types/database.types';

type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/**
 * Generic query function for Supabase tables with proper typing
 */
export async function queryTable<T extends keyof Database['public']['Tables']>(
  table: T,
  params: QueryParams = {}
): Promise<QueryResponse<TableRow<T>>> {
  const startTime = performance.now();
  
  try {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact' });

    // Apply pagination
    if (params.page && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      query = query.range(start, start + params.pageSize - 1);
    }

    // Apply filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([field, value]) => {
        if (value) query = query.ilike(field, `%${value}%`);
      });
    }

    // Apply sorting
    if (params.sortBy) {
      query = query.order(params.sortBy, {
        ascending: params.sortDirection === 'asc'
      });
    }

    const { data, error, count } = await query;

    if (error) throw new SupabaseError(error.message, error.code, error.details);

    return {
      data: data as TableRow<T>[],
      error: null,
      count: count ?? 0,
      metadata: {
        executionTime: performance.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    return {
      data: [],
      error: error instanceof SupabaseError ? error : new QueryError(
        'Failed to query table',
        error instanceof Error ? error : undefined
      ),
      count: 0,
      metadata: {
        executionTime: performance.now() - startTime,
      },
    };
  }
}

/**
 * Utility to handle RPC function calls with proper error handling
 */
export async function callRPC<T extends keyof Database['public']['Functions']>(
  functionName: T,
  params?: Database['public']['Functions'][T]['Args'],
  options?: {
    component?: string;
    context?: Record<string, unknown>;
  }
): Promise<Database['public']['Functions'][T]['Returns']> {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data;
}

/**
 * Utility to format error messages for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof SupabaseError) {
    return `Database error: ${error.message}`;
  }
  if (error instanceof QueryError) {
    return `Query failed: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Type guard for non-null values
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value != null;
} 