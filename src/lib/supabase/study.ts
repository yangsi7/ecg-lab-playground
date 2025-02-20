import { supabase } from './client';
import type { Database } from '../../types/database.types';
import { SupabaseError } from '../../types/utils';

export type StudyRow = Database['public']['Tables']['study']['Row'];

/**
 * @deprecated Use hooks/api/study/useStudyList instead
 */
export async function getStudyList() {
  console.warn('Deprecated: Use hooks/api/study/useStudyList instead');
  const { data, error } = await supabase
    .from('study')
    .select('*');

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data;
}

/**
 * @deprecated Use hooks/api/study/useSingleStudy instead
 */
export async function getStudyById(studyId: string) {
  console.warn('Deprecated: Use hooks/api/study/useSingleStudy instead');
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .eq('study_id', studyId)
    .single();

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data;
}

/**
 * @deprecated Use hooks/api/study/useStudyDiagnostics instead
 */
export async function getStudyDiagnostics(studyId: string) {
  console.warn('Deprecated: Use hooks/api/study/useStudyDiagnostics instead');
  const { data, error } = await supabase
    .rpc('get_study_diagnostics', {
      p_study_id: studyId
    });

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data;
}

/**
 * @deprecated Use hooks/api/study/useSingleStudy instead
 */
export async function fetchStudyById(studyId: string): Promise<StudyRow | null> {
  console.warn('Deprecated: Use hooks/api/study/useSingleStudy instead');
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .eq('study_id', studyId)
    .single();

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data;
}

/**
 * @deprecated Use hooks/api/study/useStudyList with clinicId parameter instead
 */
export async function fetchClinicStudies(clinicId: string): Promise<StudyRow[]> {
  console.warn('Deprecated: Use hooks/api/study/useStudyList with clinicId parameter instead');
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data ?? [];
}

/**
 * @deprecated Use hooks/api/study/useStudyList instead
 */
export async function fetchStudies(): Promise<StudyRow[]> {
  console.warn('Deprecated: Use hooks/api/study/useStudyList instead');
  const { data, error } = await supabase
    .from('study')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new SupabaseError(error.message, error.code, error.details);
  }

  return data ?? [];
} 