import { supabase } from './client';
import type { QueryParams, QueryResponse } from './client';
import type { TableRow } from '@/types/utils';

// Use the TableRow utility type from utils
type ClinicRow = TableRow<'clinics'>;

export async function fetchClinics(params: QueryParams<'clinics'> = {}): Promise<QueryResponse<ClinicRow>> {
  let query = supabase
    .from('clinics')
    .select('*', { count: 'exact' });

  if (params.filters) {
    for (const [field, value] of Object.entries(params.filters)) {
      if (value) {
        query = query.ilike(field, `%${value}%`);
      }
    }
  }

  if (params.sortBy) {
    query = query.order(params.sortBy, { ascending: params.sortDirection === 'asc' });
  }

  const { data, error, count } = await query;

  return {
    data: data ?? [],
    error: error ? new Error(error.message) : null,
    count: count ?? 0,
  };
}

/**
 * Fetch a single clinic by ID
 */
export async function fetchClinicById(clinicId: string): Promise<ClinicRow | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
} 