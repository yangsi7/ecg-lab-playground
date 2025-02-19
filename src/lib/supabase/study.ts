import { supabase } from './client';
import type { Database } from '../../types/database.types';

export type StudyRow = Database['public']['Tables']['study']['Row'];

/**
 * Fetch a single study by ID
 */
export async function fetchStudyById(studyId: string): Promise<StudyRow | null> {
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .eq('study_id', studyId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Fetch studies for a clinic
 */
export async function fetchClinicStudies(clinicId: string): Promise<StudyRow[]> {
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Fetch all studies
 */
export async function fetchStudies(): Promise<StudyRow[]> {
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
} 