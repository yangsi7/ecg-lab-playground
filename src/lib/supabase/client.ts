/**
 * Supabase client configuration and type exports
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl?.startsWith('https://')) {
  throw new Error('Invalid Supabase URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anonymous key');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Re-export database types
export type { Database } from '../../types/database.types';

// Common database row types
export type StudyRow = Database['public']['Tables']['study']['Row'];
export type StudyReadingRow = Database['public']['Tables']['study_readings']['Row'];
export type ClinicRow = Database['public']['Tables']['clinics']['Row'];
export type PodRow = Database['public']['Tables']['pod']['Row'];
export type ECGSampleRow = Database['public']['Tables']['ecg_sample']['Row'];

// Common query parameters
export interface QueryParams {
  start?: number;
  end?: number;
  filters?: Record<string, string | undefined>;
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc';
}

// Common query response
export interface QueryResponse<T> {
  data: T[] | null;
  error: Error | null;
  count: number;
}

/**
 * Generic query function for Supabase tables
 */
export async function queryTable<T extends keyof Database['public']['Tables']>(
  table: T,
  { start, end, filters, sortBy, sortDirection = 'asc' }: QueryParams = {}
): Promise<QueryResponse<Database['public']['Tables'][T]['Row']>> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' });

  if (typeof start === 'number' && typeof end === 'number') {
    query = query.range(start, end);
  }

  if (filters) {
    for (const [field, value] of Object.entries(filters)) {
      if (value) {
        query = query.ilike(field, `%${value}%`);
      }
    }
  }

  if (sortBy) {
    query = query.order(sortBy, { ascending: sortDirection === 'asc' });
  }

  const { data, error, count } = await query;

  return {
    data: (data as unknown as Database['public']['Tables'][T]['Row'][]) ?? [],
    error: error ? new Error(error.message) : null,
    count: count ?? 0,
  };
}
