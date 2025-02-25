/**
 * Hook for fetching aggregated ECG data
 * Provides time-bucketed lead data with quality metrics
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { logger } from '@/lib/logger';
import type { AggregatedLeadData, ECGAggregateFilter } from '@/types/domain/ecg';
import type { Database } from '@/types/database.types';

export type TimeInterval = 'hourly' | 'daily';

interface UseECGAggregatesParams {
    podId: string | null;
    startTime: string;
    endTime: string;
    bucketSize: number;
    filter?: ECGAggregateFilter;
    enabled?: boolean;
}

interface AggregateResponse {
    data: AggregatedLeadData[];
    count: number;
}

type AggregateLeadsArgs = Database['public']['Functions']['aggregate_leads']['Args'];

export function useECGAggregates({ 
    podId, 
    startTime, 
    endTime, 
    bucketSize,
    filter,
    enabled = true
}: UseECGAggregatesParams) {
    return useQuery<AggregateResponse>({
        queryKey: ['ecg-aggregates', podId, startTime, endTime, bucketSize, filter],
        queryFn: async () => {
            if (!podId) return { data: [], count: 0 };

            logger.debug('Fetching ECG aggregates', {
                podId,
                timeStart: startTime,
                timeEnd: endTime,
                bucketSize
            });

            const params: AggregateLeadsArgs = {
                p_pod_id: podId,
                p_time_start: startTime,
                p_time_end: endTime,
                p_bucket_seconds: bucketSize
            };

            const { data, error } = await supabase.rpc('aggregate_leads', params);

            if (error) {
                logger.error('Failed to fetch ECG aggregates', { error });
                throw new Error(error.message);
            }

            if (!Array.isArray(data)) {
                throw new Error('aggregate_leads did not return an array');
            }

            let filteredData = data as AggregatedLeadData[];

            // Apply filters if needed
            if (filter) {
                // Quality threshold filter
                const qualityThreshold = filter.quality_threshold;
                if (typeof qualityThreshold === 'number') {
                    filteredData = filteredData.filter(d => {
                        const avgQuality = (
                            (d.quality_1_percent ?? 0) +
                            (d.quality_2_percent ?? 0) +
                            (d.quality_3_percent ?? 0)
                        ) / 3;
                        return avgQuality >= qualityThreshold;
                    });
                }

                // Lead-on threshold filter
                const leadOnThreshold = filter.lead_on_threshold;
                if (typeof leadOnThreshold === 'number') {
                    filteredData = filteredData.filter(d => {
                        const avgLeadOn = (
                            (d.lead_on_p_1 ? 1 : 0) +
                            (d.lead_on_p_2 ? 1 : 0) +
                            (d.lead_on_p_3 ? 1 : 0) +
                            (d.lead_on_n_1 ? 1 : 0) +
                            (d.lead_on_n_2 ? 1 : 0) +
                            (d.lead_on_n_3 ? 1 : 0)
                        ) / 6;
                        return avgLeadOn >= leadOnThreshold;
                    });
                }

                // Time range filter
                const timeRange = filter.time_range;
                if (timeRange?.start && timeRange?.end) {
                    filteredData = filteredData.filter(d => {
                        const time = new Date(d.time_bucket).getTime();
                        return time >= new Date(timeRange.start).getTime() && 
                               time <= new Date(timeRange.end).getTime();
                    });
                }
            }

            return {
                data: filteredData,
                count: filteredData.length
            };
        },
        enabled: enabled && !!podId && !!startTime && !!endTime,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    });
} 