import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import type { StudiesWithTimesRow } from '@/types/domain/study';
import { QueryResponse, QueryMetadata } from '@/types/utils';
import { SupabaseError } from '../core/errors';
import { logger } from '@/lib/logger';

/**
 * Direct API call to bypass the type mismatch in Supabase client
 * 
 * This is a workaround for the error:
 * "Returned type timestamp with time zone does not match expected type timestamp without time zone in column 15"
 */
async function fetchStudiesWithPodTimes(): Promise<StudiesWithTimesRow[]> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Prepare headers for the API call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
    
    // Only add Authorization header if we have a valid session with access token
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Make direct API call to avoid type mismatch
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_studies_with_pod_times`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching studies with pod times', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Utility function for sorting studies that handles mixed data types
export function applySorting<T extends Record<string, any>>(
    data: T[],
    sortBy: keyof T,
    sortDirection: 'asc' | 'desc' = 'asc'
): T[] {
    if (!data.length || !sortBy) return data;
    
    return [...data].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        // Handle null/undefined values - always sort to the end
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        // Handle different types appropriately
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle date strings in ISO format
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            // Try to detect if these are date strings
            const aDate = aValue.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(aValue) : null;
            const bDate = bValue.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(bValue) : null;
            
            if (aDate && bDate && !isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                return sortDirection === 'asc' 
                    ? aDate.getTime() - bDate.getTime() 
                    : bDate.getTime() - aDate.getTime();
            }
        }
        
        // Default string comparison for anything else
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
    });
}

interface FilterOptions {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: keyof StudiesWithTimesRow;
    sortDirection?: 'asc' | 'desc';
}

interface UseStudiesWithTimesResult {
    data: StudiesWithTimesRow[];
    totalCount: number;
    loading: boolean;
    error: Error | null;
    hasMore: boolean;
}

/**
 * Hook to fetch studies with time data, supporting pagination, filtering and sorting
 * Uses direct API call to avoid timestamp type mismatch issues
 */
export function useStudiesWithTimes({ 
    search, 
    page = 0, 
    pageSize = 25,
    sortBy = 'study_id',
    sortDirection = 'asc'
}: FilterOptions): UseStudiesWithTimesResult {
    const queryKey = ['studiesWithTimes', { search, page, pageSize, sortBy, sortDirection }];

    const query = useQuery<StudiesWithTimesRow[], Error>({
        queryKey,
        queryFn: async () => {
            try {
                // Use direct API call instead of supabase.rpc to bypass type mismatch
                const data = await fetchStudiesWithPodTimes();

                // Add debug logging for the pagination parameters
                logger.debug('Using get_studies_with_pod_times with pagination parameters:', {
                    page,
                    pageSize,
                    sortBy,
                    sortDirection
                });

                if (!data) {
                    return [];
                }

                // Sort the data client-side using our utility function
                const sorted = applySorting(data, sortBy, sortDirection);

                // Log the transformation for debugging
                logger.debug('Data transformation', {
                    original: data.length,
                    sorted: sorted.length,
                    sortBy,
                    sortDirection
                });

                return sorted;
            } catch (err) {
                // Log error and rethrow
                logger.error('Error fetching studies with times:', {
                    message: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined
                });
                throw err;
            }
        },
        staleTime: 5000, // Consider data fresh for 5 seconds
        refetchOnWindowFocus: false
    });

    // Apply client-side pagination manually
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = query.data ? query.data.slice(startIndex, endIndex) : [];
    const totalCount = query.data?.length || 0;

    return {
        data: paginatedData,
        totalCount,
        loading: query.isLoading,
        error: query.error,
        hasMore: totalCount > (page + 1) * pageSize
    };
}
