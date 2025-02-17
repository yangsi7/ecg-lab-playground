import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import type { StudiesWithTimesRow } from '../../types/domain/study';

interface FilterOptions {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: keyof StudiesWithTimesRow;
    sortDirection?: 'asc' | 'desc';
}

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
        queryFn: async () => {
            const offset = page * pageSize;
            const limit = pageSize;

            const { data: rpcData, error: rpcErr } = await supabase
                .rpc('get_study_list_with_earliest_latest', {
                    p_search: search || undefined,
                    p_offset: offset,
                    p_limit: limit
                });

            if (rpcErr) {
                throw new Error(rpcErr.message);
            }
            if (!rpcData) {
                return { data: [], totalCount: 0 };
            }

            // Sort the data client-side since the RPC doesn't support sorting
            const typed = rpcData as unknown as StudiesWithTimesRow[];
            const sorted = [...typed].sort((a, b) => {
                const aValue = a[sortBy];
                const bValue = b[sortBy];
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                const comparison = String(aValue).localeCompare(String(bValue));
                return sortDirection === 'asc' ? comparison : -comparison;
            });

            let totalCount = 0;
            if (typed.length > 0 && 'total_count' in typed[0]) {
                totalCount = Number(typed[0].total_count || 0);
            }

            return { data: sorted, totalCount };
        },
        staleTime: 5000, // Consider data fresh for 5 seconds
        refetchOnWindowFocus: false
    });
}
