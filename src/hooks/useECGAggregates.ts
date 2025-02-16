import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

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

interface UseECGAggregatesProps {
    podId: string | null
    startTime: string
    endTime: string
    bucketSize: number
}

/**
 * useECGAggregates
 * - Calls 'aggregate_leads' Supabase RPC to get aggregator bars.
 */
export function useECGAggregates({ podId, startTime, endTime, bucketSize }: UseECGAggregatesProps) {
    const [data, setData] = useState<AggregatedLeadData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAggregates = useCallback(async () => {
        if (!podId) {
            setData([])
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
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

            setData(aggData)
        } catch (err: any) {
            logger.error('useECGAggregates: aggregator fetch error', err)
            setError(err.message || 'Failed to fetch aggregator data')
            setData([])
        } finally {
            setLoading(false)
        }
    }, [podId, startTime, endTime, bucketSize])

    useEffect(() => {
        fetchAggregates()
    }, [fetchAggregates])

    return { data, loading, error }
}
