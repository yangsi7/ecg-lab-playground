// src/hooks/useDataQueries.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/hooks/api/core/supabase';
import { logger } from '@/lib/logger';
import { useDebounce } from './useDebounce';

interface DataFilters {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}

export function useDataQueries(filters: DataFilters = {}) {
    const isMounted = useRef(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studies, setStudies] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const debouncedSearch = useDebounce(filters.search, 300);
    const prevKeyRef = useRef<string>();

    const fetchData = useCallback(async () => {
        const key = JSON.stringify({ ...filters, search: debouncedSearch });
        if (key === prevKeyRef.current) return;
        prevKeyRef.current = key;

        try {
            setIsRefreshing(true);
            if (!studies.length) setLoading(true);

            const start = (filters.page || 0) * (filters.pageSize || 25);
            const end = start + (filters.pageSize || 25) - 1;

            let query = supabase
                .from('study')
                .select(`
                    *, 
                    clinics!inner ( name ), 
                    pod!inner ( status )
                `, { count: 'exact' });

            // optional search
            if (debouncedSearch) {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(debouncedSearch);
                if (isUUID) {
                    query = query.or(`study_id.eq.${debouncedSearch},pod_id.eq.${debouncedSearch}`);
                } else {
                    query = query.ilike('clinics.name', `%${debouncedSearch}%`);
                }
            }

            // optional date filters
            if (filters.startDate) {
                query = query.gte('start_timestamp', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('end_timestamp', filters.endDate);
            }

            // pagination
            query = query.range(start, end);

            const { data, error: qErr, count } = await query;
            if (qErr) {
                logger.error('DB error in useDataQueries', { error: qErr.message });
                throw new Error(qErr.message);
            }

            setStudies(data || []);
            setTotalCount(count || 0);
            setError(null);
        } catch (err: any) {
            logger.error('Data fetch error', { error: err.message });
            setError('Failed to load data');
            if (isMounted.current) {
                setStudies([]);
                setTotalCount(0);
            }
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [filters, debouncedSearch, studies.length]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { studies, loading, error, totalCount, isRefreshing };
}
