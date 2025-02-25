import { useCallback } from 'react';
import { supabase } from '@/hooks/api/core/supabase';
import type { Database } from '../../../types/database.types';
import type { QueryParams, QueryResponse, TableRow } from '@/types/utils';

export function useTableQuery() {
  const queryTable = useCallback(async <T extends keyof Database['public']['Tables']>(
    table: T,
    params: QueryParams = {}
  ): Promise<QueryResponse<TableRow<T>>> => {
    const startTime = performance.now();
    const { start, end, filters, sortBy, sortDirection = 'asc' } = params;
    
    try {
      const query = supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (typeof start === 'number' && typeof end === 'number') {
        query.range(start, end);
      }

      if (filters) {
        for (const [field, value] of Object.entries(filters)) {
          if (value) {
            query.ilike(field as string, `%${value}%`);
          }
        }
      }

      if (sortBy) {
        query.order(sortBy as string, { ascending: sortDirection === 'asc' });
      }

      const response = await query;

      if (response.error) {
        throw new SupabaseError(response.error.message);
      }

      // Use type assertion to handle the response data
      const rows = (response.data ?? []) as unknown as TableRow<T>[];

      return {
        data: rows,
        error: null,
        count: response.count ?? 0,
        metadata: {
          executionTime: performance.now() - startTime,
          cached: false,
        },
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof SupabaseError ? error : new SupabaseError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        ),
        count: 0,
        metadata: {
          executionTime: performance.now() - startTime,
        },
      };
    }
  }, []);

  return { queryTable };
} 