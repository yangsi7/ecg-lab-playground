/**
 * Core API hooks index file
 * Exports utility functions and error types for Supabase interactions
 */

export * from './errors';
export * from '../../../types/supabase';
export * from './utils';

// We're keeping useRPC.ts but not exporting it by default since it has some type issues
// Use the utils.ts callRPC function directly instead
// export * from './useRPC';

// The useSupabase hooks have some type issues, we recommend using hooks/api/[domain] hooks
// or direct supabase calls instead
// export * from './useSupabase';

