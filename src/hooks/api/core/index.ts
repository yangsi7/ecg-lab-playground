/**
 * Core API hooks index file
 * Exports utility functions and error types for Supabase interactions
 */

export * from './errors';
// This causes circular dependency issues, export only specific types needed
// export * from '../../../types/supabase';
export * from './utils';
export * from './useRPC';
export * from './useAuth';

// The useSupabase hooks have some type issues, we recommend using hooks/api/[domain] hooks
// or direct supabase calls instead
// export * from './useSupabase';

