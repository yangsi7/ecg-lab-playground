/**
 * Supabase client configuration and type exports
 * Single source of truth for Supabase initialization
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { SupabaseError } from '@/types/utils';
import { logger } from '@/lib/logger';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new SupabaseError('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new SupabaseError('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create client with proper types and interceptors
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
    db: {
      schema: 'public',
    },
  }
);

// Log initialization
logger.debug('Supabase client initialized', {
  url: supabaseUrl,
  schema: 'public',
});

// Export types
export type { Database };
export type SupabaseClient = typeof supabase;

// Re-export common hooks
export { useQuery, useMutation } from '@tanstack/react-query';

// Common error handling
export function handleSupabaseError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('An unknown error occurred');
} 