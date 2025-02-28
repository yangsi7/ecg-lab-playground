import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { useRPC } from '@/hooks/api/core';

interface PodDayResponse {
    day_value: string;
}

export function usePodDays(podId: string | null) {
    const { callRPC } = useRPC();
    
    return useQuery<Date[]>({
        queryKey: ['pod-days', podId],
        queryFn: async () => {
            if (!podId) {
                logger.debug('Pod ID is null, skipping pod days fetch');
                return [];
            }

            logger.debug('Fetching pod days', { podId });

            try {
                const data = await callRPC(
                    'get_pod_days',
                    { p_pod_id: podId },
                    { 
                        component: 'usePodDays', 
                        context: { podId }
                    }
                );

                if (!data) {
                    logger.warn('get_pod_days returned null/undefined', { podId });
                    return []; 
                }

                if (!Array.isArray(data)) {
                    logger.warn('get_pod_days did not return an array', { podId, dataType: typeof data });
                    return [];
                }

                if (data.length === 0) {
                    logger.info('No recording days found for pod', { podId });
                    return [];
                }

                // Convert string dates to Date objects
                return (data as PodDayResponse[])
                    .map(row => {
                        try {
                            return new Date(row.day_value);
                        } catch (e) {
                            logger.warn('Failed to parse date', { value: row.day_value, error: e });
                            return null;
                        }
                    })
                    .filter((date): date is Date => date !== null)
                    .sort((a, b) => a.getTime() - b.getTime());
            } catch (error) {
                // Enhanced error logging
                logger.error('Failed to fetch pod days', { 
                    error, 
                    podId,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorName: error instanceof Error ? error.name : 'Unknown',
                    errorStack: error instanceof Error ? error.stack : undefined
                });
                
                // Return empty array instead of throwing
                return [];
            }
        },
        enabled: !!podId,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
        retry: 1 // Limit retries to prevent repeated 500 errors
    });
} 