import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';

export type PodRow = Database['public']['Tables']['pod']['Row'];

/**
 * Fetch all pods
 */
export async function fetchPods(): Promise<PodRow[]> {
  const { data, error } = await supabase
    .from('pod')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Fetch a single pod by ID
 */
export async function fetchPodById(podId: string): Promise<PodRow | null> {
  const { data, error } = await supabase
    .from('pod')
    .select('*')
    .eq('id', podId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
} 