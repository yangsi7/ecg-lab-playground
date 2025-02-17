import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';

export type ECGSampleRow = Database['public']['Tables']['ecg_sample']['Row'];

/**
 * Fetch ECG samples for a pod within a time range
 */
export async function fetchECGSamples(
  podId: string,
  startTime: string,
  endTime: string
): Promise<ECGSampleRow[]> {
  const { data, error } = await supabase
    .from('ecg_sample')
    .select('*')
    .eq('pod_id', podId)
    .gte('time', startTime)
    .lte('time', endTime)
    .order('time', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Fetch the latest ECG sample for a pod
 */
export async function fetchLatestECGSample(podId: string): Promise<ECGSampleRow | null> {
  const { data, error } = await supabase
    .from('ecg_sample')
    .select('*')
    .eq('pod_id', podId)
    .order('time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
} 