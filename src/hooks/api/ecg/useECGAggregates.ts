import { useQuery } from '@tanstack/react-query'
import { supabase, handleSupabaseError } from '@/types/supabase';

import { logger } from '@/lib/logger'
import type { AggregatedLeadData, ECGAggregateFilter } from '@/types/domain/ecg'

// Types from the database schema
interface AggregateLeadsArgs {
    p_pod_id: string
    p_time_start: string
    p_time_end: string
    p_bucket_seconds: number
}

// Domain types
export interface UseECGAggregatesProps {
    podId: string | null
    startTime: string
    endTime: string
    bucketSize: number
    filter?: ECGAggregateFilter
    enabled?: boolean
}

interface AggregateResponse {
    data: AggregatedLeadData[]
    count: number
}

/**
 * useECGAggregates
 * - Enhanced version that combines all ECG aggregation functionality
 * - Uses react-query for better caching and state management
 * - Supports filtering and quality thresholds
 * - Returns both data and total count
 */
export function useECGAggregates({ 
    podId, 
    startTime, 
    endTime, 
    bucketSize,
    filter,
    enabled = true
}: UseECGAggregatesProps) {
    return useQuery<AggregateResponse>({
        queryKey: ['ecg-aggregates', podId, startTime, endTime, bucketSize, filter],
        queryFn: async () => {
            if (!podId) return { data: [], count: 0 }

            logger.debug('Fetching ECG aggregates', {
                podId,
                timeRange: [startTime, endTime],
                bucketSize
            })

            const params: AggregateLeadsArgs = {
                p_pod_id: podId,
                p_time_start: startTime,
                p_time_end: endTime,
                p_bucket_seconds: bucketSize
            }

            const { data, error } = await supabase.rpc('aggregate_leads', params)

            if (error) {
                logger.error('Failed to fetch ECG aggregates', { error })
                throw handleSupabaseError(error)
            }

            if (!Array.isArray(data)) {
                throw new Error('aggregate_leads did not return an array')
            }

            // Store the total count before filtering
            const totalCount = data.length;
            let filteredData = data as AggregatedLeadData[]
            
            // Apply filters if needed
            if (filter) {
                if (filter.quality_threshold) {
                    filteredData = filteredData.filter(row => 
                        ((row.quality_1_percent ?? 0) + 
                         (row.quality_2_percent ?? 0) + 
                         (row.quality_3_percent ?? 0)) / 3 >= filter.quality_threshold!
                    )
                }
                if (filter.lead_on_threshold) {
                    filteredData = filteredData.filter(row =>
                        ((row.lead_on_p_1 ?? 0) + 
                         (row.lead_on_p_2 ?? 0) + 
                         (row.lead_on_p_3 ?? 0)) / 3 >= filter.lead_on_threshold!
                    )
                }
            }

            return {
                data: filteredData,
                count: totalCount
            }
        },
        enabled: enabled && !!podId && !!startTime && !!endTime,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    })
}
