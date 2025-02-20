/**
 * Basic Supabase client configuration
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { SupabaseError } from '../../types/utils';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new SupabaseError('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new SupabaseError('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create and export the basic client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-application-name': 'ecg-lab',
      },
    },
  }
);

// Export the Supabase client and common types
export {
  type Database,
  type QueryParams,
  type QueryResponse,
  type StudyRow,
  type StudyReadingRow,
  type ClinicRow,
  type ECGSampleRow,
  queryTable
} from './client';

// Export pod-related functions
export {
  queryPods,
  getPodDays,
  getPodEarliestLatest,
  type PodRow,
  type PodListParams,
} from './pod';

// Export ECG-related functions
export {
  fetchECGSamples,
  fetchLatestECGSample,
} from './ecg';

// Export clinic-related functions
export {
  fetchClinics,
  fetchClinicById,
} from './clinic';

// Export study-related functions
export {
  fetchStudyById,
  fetchClinicStudies,
  fetchStudies
} from './study'; 