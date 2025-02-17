import { supabase } from './client'
import type { Database } from '../../types/database.types'

export interface PodRow {
    id: string
    assigned_study_id: string | null
    assigned_user_id: string | null
    status: string | null
    time_since_first_use: number | null
}

export interface PodListParams {
    page?: number
    pageSize?: number
    sortBy?: keyof PodRow
    sortDirection?: 'asc' | 'desc'
    filter?: string
}

export async function getPodDays(podId: string): Promise<string[]> {
    const { data, error } = await supabase
        .rpc('get_pod_days', { p_pod_id: podId })

    if (error) throw error
    return (data as { day_value: string }[]).map(d => d.day_value)
}

export async function getPodEarliestLatest(podId: string) {
    const { data, error } = await supabase
        .rpc('get_pod_earliest_latest', { p_pod_id: podId })

    if (error) throw error
    return data?.[0] as { earliest_time: string; latest_time: string }
}

export async function queryPods({
    page = 1,
    pageSize = 20,
    sortBy = 'id',
    sortDirection = 'desc',
    filter
}: PodListParams = {}) {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = supabase
        .from('pod')
        .select('*', { count: 'exact' })
        .range(start, end)

    if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' })
    }

    if (filter) {
        query = query.ilike('id', `%${filter}%`)
    }

    const { data, error, count } = await query
    if (error) throw error

    return {
        data: data as unknown as PodRow[],
        count: count ?? 0
    }
} 