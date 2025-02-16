import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface StudiesWithTimesRow {
    study_id: string;
    pod_id: string | null;
    earliest_time: string | null;
    latest_time: string | null;
    total_count: number;
}

interface FilterOptions {
    search?: string;
    page?: number;
    pageSize?: number;
}

export function useStudiesWithTimes({ search, page = 0, pageSize = 25 }: FilterOptions) {

    const queryKey = ['studiesWithTimes', { search, page, pageSize }];

    return useQuery({
        queryKey,
        queryFn: async () => {
            const offset = page * pageSize;
            const limit = pageSize;

            const { data: rpcData, error: rpcErr } = await supabase
                .rpc('get_study_list_with_earliest_latest', {
                    p_search: search || null,
                    p_offset: offset,
                    p_limit: limit
                });

            if (rpcErr) {
                throw new Error(rpcErr.message);
            }
            if (!rpcData) {
                return { data: [], totalCount: 0 };
            }

            const typed = rpcData as StudiesWithTimesRow[];
            let totalCount = 0;
            if (typed.length > 0) {
                totalCount = Number(typed[0].total_count || 0);
            }

            return { data: typed, totalCount };
        },
        keepPreviousData: true,
    });
}
