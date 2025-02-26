import { useQuery } from '@tanstack/react-query';
import { supabase,handleSupabaseError } from '@/types/supabase'
import { logger } from '@/lib/logger';

interface PodDayResponse {
    day_value: string;
}

export function usePodDays(podId: string | null) {
    return useQuery<Date[]>({
        queryKey: ['pod-days', podId],
        queryFn: async () => {
            if (!podId) return [];

            logger.debug('Fetching pod days', { podId });

            const { data, error } = await supabase.rpc(
                'get_pod_days',
                { p_pod_id: podId }
            );

            if (error) {
                logger.error('Failed to fetch pod days', { error });
                throw handleSupabaseError(error);
            }

            if (!Array.isArray(data)) {
                throw new Error('get_pod_days did not return an array');
            }

            // Convert string dates to Date objects
            return (data as PodDayResponse[])
                .map(row => new Date(row.day_value))
                .sort((a, b) => a.getTime() - b.getTime());
        },
        enabled: !!podId,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    });
} 