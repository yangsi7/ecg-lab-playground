// src/hooks/usePodEarliestLatest.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/types/supabase';
import { logger } from '@/lib/logger';
import type { PodEarliestLatest } from '@/types/domain/pod'

/**
 * Queries get_pod_earliest_latest(p_pod_id) from Supabase
 */
export function usePodEarliestLatest(podId: string): PodEarliestLatest {
    const [earliest_time, setEarliest] = useState<Date | null>(null);
    const [latest_time, setLatest] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!podId) {
            setLoading(false);
            setEarliest(null);
            setLatest(null);
            return;
        }

        (async () => {
            setLoading(true);
            setError(null);
            logger.debug('Fetching earliest/latest times for pod', { podId });
            const { data, error: rpcError } = await supabase.rpc('get_pod_earliest_latest', {
                p_pod_id: podId
            });
            if (rpcError) {
                logger.error('RPC get_pod_earliest_latest failed', { error: rpcError.message });
                setError(rpcError.message);
                setEarliest(null);
                setLatest(null);
            } else if (data && data.length === 1) {
                const row = data[0];
                setEarliest(row.earliest_time ? new Date(row.earliest_time) : null);
                setLatest(row.latest_time ? new Date(row.latest_time) : null);
            } else {
                // no data
                setEarliest(null);
                setLatest(null);
            }
            setLoading(false);
        })();
    }, [podId]);

    return { earliest_time, latest_time, loading, error };
}
