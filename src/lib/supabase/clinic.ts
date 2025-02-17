import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';

export type ClinicRow = Database['public']['Tables']['clinics']['Row'];

/**
 * Fetch all clinics
 */
export async function fetchClinics(): Promise<ClinicRow[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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