import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { logger } from '../../lib/logger'

/**
 * AggregatedLeadData:
 *   Represents aggregator row from 'aggregate_leads' RPC.
 */
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

export type TimeInterval = 'hourly' | 'daily';

export interface ECGAggregateFilter {
    quality_threshold?: number;
    lead_on_threshold?: number;
    time_range?: {
        start: string;
        end: string;
    };
}

interface UseECGAggregatesProps {
    podId: string | null
    startTime: string
    endTime: string
    bucketSize: number
    filter?: ECGAggregateFilter
    enabled?: boolean
}

/**
 * useECGAggregates
 * - Enhanced version that combines all ECG aggregation functionality
 * - Uses react-query for better caching and state management
 * - Supports filtering and quality thresholds
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

    const { data, isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!podId) return []

            const { data: aggData, error: rpcError } = await supabase.rpc('aggregate_leads', {
                p_pod_id: podId,
                p_time_start: startTime,
                p_time_end: endTime,
                p_bucket_seconds: bucketSize
            })

            if (rpcError) throw new Error(rpcError.message)
            if (!Array.isArray(aggData)) {
                throw new Error('aggregate_leads did not return an array.')
            }

            logger.info(`useECGAggregates: aggregator got ${aggData.length} slices`, {
                bucketSize, range: [startTime, endTime]
            })

            // Apply filters if provided
            let filteredData = aggData as AggregatedLeadData[]
            
            const qualityThreshold = filter?.quality_threshold
            if (typeof qualityThreshold === 'number') {
                filteredData = filteredData.filter(d => {
                    const avgQuality = ((d.quality_1_percent || 0) + 
                                      (d.quality_2_percent || 0) + 
                                      (d.quality_3_percent || 0)) / 3
                    return avgQuality >= qualityThreshold
                })
            }

            const leadOnThreshold = filter?.lead_on_threshold
            if (typeof leadOnThreshold === 'number') {
                filteredData = filteredData.filter(d => {
                    const avgLeadOn = ((d.lead_on_p_1 || 0) + 
                                     (d.lead_on_p_2 || 0) + 
                                     (d.lead_on_p_3 || 0)) / 3
                    return avgLeadOn >= leadOnThreshold
                })
            }

            return filteredData
        },
        enabled: enabled && !!podId && !!startTime && !!endTime,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    })

    return { 
        data: data || [], 
        loading, 
        error: error instanceof Error ? error.message : null 
    }
}
