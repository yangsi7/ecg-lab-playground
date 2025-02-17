// Export the Supabase client and common types
export {
  supabase,
  type Database,
  type QueryParams,
  type QueryResponse,
  queryTable
} from './client';

// Export RPC functions
export {
  fetchStudyById,
  fetchClinicStudies,
  fetchStudies
} from './study';

export {
  fetchClinics,
  fetchClinicById
} from './clinic';

export {
  fetchECGSamples,
  fetchLatestECGSample
} from './ecg';

export {
  fetchPods,
  fetchPodById
} from './pod'; 