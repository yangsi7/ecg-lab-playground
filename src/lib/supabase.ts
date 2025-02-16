// Add getPodData function

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types'; // Replace with your actual path

export type HolterData = Database['public']['Tables']['holter_data']['Row']; // Example type
export type PodData = Database['public']['Tables']['pods']['Row']; // Example type.  ADJUST AS NEEDED

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface GetHolterDataParams {
    start: number;
    end: number;
    filters?: Record<string, string | undefined>;
    sortBy?: string | null;
    sortDirection?: 'asc' | 'desc';
}

export const getHolterData = async (
  start: number,
  end: number,
  filters: Record<string, string | undefined> = {},
  sortBy: string | null = null,
  sortDirection: 'asc' | 'desc' = 'asc'
) => {
    let query = supabase
        .from('holter_data')
        .select('*', { count: 'exact' })
        .range(start, end);

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
        if (value) {
            query = query.ilike(field, `%${value}%`);
        }
    }

    if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' });
    }


    const { data, error, count } = await query;

    return { data, error, count: count ?? 0 };
};

export const getPodData = async (
  start: number,
  end: number,
  filters: Record<string, string | undefined> = {},
  sortBy: string | null = null,
  sortDirection: 'asc' | 'desc' = 'asc'
) => {
    let query = supabase
        .from('pods') //  ADJUST TABLE NAME AS NEEDED
        .select('*', { count: 'exact' })
        .range(start, end);

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
        if (value) {
            query = query.ilike(field, `%${value}%`);
        }
    }

    if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' });
    }

    const { data, error, count } = await query;
    return { data, error, count: count ?? 0 };
};
