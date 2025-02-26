import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import type { StudiesWithTimesRow } from '@/types/domain/study';
import { QueryResponse, QueryMetadata } from '@/types/utils';
import { SupabaseError } from '../core/errors';
import { logger } from '@/lib/logger';

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

/**
 * Hook to fetch studies with time data, supporting pagination, filtering and sorting
 */
export function useStudiesWithTimes({ 
    search, 
    page = 0, 
    pageSize = 25,
    sortBy = 'study_id',
    sortDirection = 'asc'
}: FilterOptions) {
    const queryKey = ['studiesWithTimes', { search, page, pageSize, sortBy, sortDirection }];

    return useQuery({
        queryKey,
        queryFn: async (): Promise<QueryResponse<StudiesWithTimesRow[]>> => {
            try {
                const offset = page * pageSize;
                const limit = pageSize;

                // Ensure all parameters are properly typed and passed
                const { data: rpcData, error: rpcErr } = await supabase
                    .rpc('get_study_list_with_earliest_latest', {
                        p_search: search || undefined,
                        p_offset: offset,
                        p_limit: limit
                    });

                if (rpcErr) {
                    console.error('RPC Error:', rpcErr);
                    throw new SupabaseError(`Failed to fetch studies with times: ${rpcErr.message}`);
                }

                // Add debug logging for the pagination parameters
                console.debug('Pagination parameters:', {
                    offset,
                    limit,
                    sortBy,
                    sortDirection
                });

                if (!rpcData) {
                    const metadata: QueryMetadata = {
                        executionTime: 0,
                        cached: false
                    };
                    
                    return { 
                        data: [], 
                        error: null,
                        count: 0,
                        metadata
                    };
                }

                // Type the data properly
                const typed = rpcData as unknown as StudiesWithTimesRow[];
                
                // Sort the data client-side using our utility function
                const sorted = applySorting(typed, sortBy, sortDirection);

                // Log the transformation for debugging
                logger.debug('Data transformation', {
                    original: typed.length,
                    sorted: sorted.length,
                    sortBy,
                    sortDirection
                });

                // Extract total count from the first row if available
                let totalCount = 0;
                if (typed.length > 0 && 'total_count' in typed[0]) {
                    totalCount = Number(typed[0].total_count || 0);
                }

                const metadata: QueryMetadata = {
                    executionTime: 0, // We don't have timing info
                    cached: false     // Not cached
                };

                return { 
                    data: [sorted], // Wrap in array to match expected type
                    error: null,
                    count: totalCount,
                    metadata
                };
            } catch (err) {
                const metadata: QueryMetadata = {
                    executionTime: 0,
                    cached: false
                };
                
                // Return error response instead of throwing
                if (!(err instanceof SupabaseError)) {
                    const supabaseError = new SupabaseError(`Failed to fetch studies with times: ${(err as Error).message}`);
                    return {
                        data: [],
                        error: supabaseError,
                        count: 0,
                        metadata
                    };
                }
                
                return {
                    data: [],
                    error: err as Error,
                    count: 0,
                    metadata
                };
            }
        },
        staleTime: 5000, // Consider data fresh for 5 seconds
        refetchOnWindowFocus: false
    });
}
