import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database.types'

// Types from the database schema
type AggregateLeadsArgs = {
    p_pod_id: string
    p_time_start: string
    p_time_end: string
    p_bucket_seconds: number
}

// Domain types
export interface AggregatedLeadData {
    time_bucket: string
    lead_on_p_1?: number
    lead_on_p_2?: number
    lead_on_p_3?: number
    lead_on_n_1?: number
    lead_on_n_2?: number
    lead_on_n_3?: number
    quality_1_percent?: number
    quality_2_percent?: number
    quality_3_percent?: number
}

export interface ECGAggregateFilter {
    quality_threshold?: number
    lead_on_threshold?: number
    time_range?: {
        start: string
        end: string
    }
}

interface UseECGAggregatesProps {
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
    const queryKey = ['ecg-aggregates', podId, startTime, endTime, bucketSize, filter]

    return useQuery<AggregateResponse>({
        queryKey,
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
                throw new Error(error.message)
            }

            if (!Array.isArray(data)) {
                throw new Error('aggregate_leads did not return an array')
            }

            let filteredData = data as AggregatedLeadData[]

            // Apply filters if provided
            if (filter) {
                // Quality threshold filter
                if (typeof filter.quality_threshold === 'number') {
                    filteredData = filteredData.filter(d => {
                        const avgQuality = (
                            (d.quality_1_percent ?? 0) +
                            (d.quality_2_percent ?? 0) +
                            (d.quality_3_percent ?? 0)
                        ) / 3
                        return avgQuality >= filter.quality_threshold!
                    })
                }

                // Lead-on threshold filter
                if (typeof filter.lead_on_threshold === 'number') {
                    filteredData = filteredData.filter(d => {
                        const avgLeadOn = (
                            (d.lead_on_p_1 ?? 0) +
                            (d.lead_on_p_2 ?? 0) +
                            (d.lead_on_p_3 ?? 0)
                        ) / 3
                        return avgLeadOn >= filter.lead_on_threshold!
                    })
                }

                // Time range filter
                if (filter.time_range?.start && filter.time_range?.end) {
                    filteredData = filteredData.filter(d => {
                        const time = new Date(d.time_bucket).getTime()
                        return time >= new Date(filter.time_range!.start).getTime() && 
                               time <= new Date(filter.time_range!.end).getTime()
                    })
                }
            }

            return {
                data: filteredData,
                count: filteredData.length
            }
        },
        enabled: enabled && !!podId && !!startTime && !!endTime,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    })
}
