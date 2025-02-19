import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { logger } from '../../lib/logger'
import { callRPC } from '../../lib/supabase/client'

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

interface AggregateLeadsParams {
    p_pod_id: string;
    p_time_start: string;
    p_time_end: string;
    p_bucket_seconds: number;
    p_offset: number;
    p_limit: number;
}

interface RPCResponse<T> {
    data: T;
    error: null | { message: string };
}

interface AggregateLeadsResult {
    data: AggregatedLeadData[];
    count: number;
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
    offset?: number
    limit?: number
}

interface AggregateResponse {
    data: AggregatedLeadData[];
    count: number;
}

/**
 * useECGAggregates
 * - Enhanced version that combines all ECG aggregation functionality
 * - Uses react-query for better caching and state management
 * - Supports filtering, quality thresholds, and pagination
 * - Returns both data and total count for pagination UI
 */
export function useECGAggregates({ 
    podId, 
    startTime, 
    endTime, 
    bucketSize,
    filter,
    enabled = true,
    offset = 0,
    limit = 100
}: UseECGAggregatesProps) {
    const queryKey = ['ecg-aggregates', podId, startTime, endTime, bucketSize, filter, offset, limit]

    const { data, isLoading: loading, error } = useQuery<AggregateResponse>({
        queryKey,
        queryFn: async () => {
            if (!podId) return { data: [], count: 0 }

            const rpcOptions = {
                component: 'useECGAggregates',
                context: {
                    podId,
                    timeRange: [startTime, endTime],
                    bucketSize,
                    offset,
                    limit
                }
            };

            const params: AggregateLeadsParams = {
                p_pod_id: podId,
                p_time_start: startTime,
                p_time_end: endTime,
                p_bucket_seconds: bucketSize,
                p_offset: offset,
                p_limit: limit
            };

            const result = await callRPC('aggregate_leads', params, rpcOptions);
            const data = (result as unknown) as { 
                data: AggregateLeadsResult; 
                error: null | { message: string } 
            };
            
            if (data.error) throw new Error(data.error.message);
            if (!Array.isArray(data.data?.data)) {
                throw new Error('aggregate_leads did not return an array.');
            }

            logger.info(`useECGAggregates: aggregator got ${data.data.data.length} slices`, {
                bucketSize, range: [startTime, endTime], offset, limit
            });

            // Apply filters if provided
            let filteredData = data.data.data;
            
            const qualityThreshold = filter?.quality_threshold;
            if (typeof qualityThreshold === 'number') {
                filteredData = filteredData.filter((d: AggregatedLeadData) => {
                    const avgQuality = ((d.quality_1_percent || 0) + 
                                      (d.quality_2_percent || 0) + 
                                      (d.quality_3_percent || 0)) / 3;
                    return avgQuality >= qualityThreshold;
                });
            }

            const leadOnThreshold = filter?.lead_on_threshold;
            if (typeof leadOnThreshold === 'number') {
                filteredData = filteredData.filter((d: AggregatedLeadData) => {
                    const avgLeadOn = ((d.lead_on_p_1 || 0) + 
                                     (d.lead_on_p_2 || 0) + 
                                     (d.lead_on_p_3 || 0)) / 3;
                    return avgLeadOn >= leadOnThreshold;
                });
            }

            return {
                data: filteredData,
                count: data.data.count ?? filteredData.length
            };
        },
        enabled: enabled && !!podId && !!startTime && !!endTime,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
    });

    return { 
        data: data?.data || [], 
        count: data?.count || 0,
        loading, 
        error: error instanceof Error ? error.message : null 
    };
}
