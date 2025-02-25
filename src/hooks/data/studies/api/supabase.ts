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

// Log environment status
logger.info('Supabase initialization', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  nodeEnv: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase environment variables', {
    url: supabaseUrl ? '[SET]' : '[MISSING]',
    anonKey: supabaseAnonKey ? '[SET]' : '[MISSING]'
  });
  
  // In development, throw an error with helpful message
  if (import.meta.env.DEV) {
    throw new SupabaseError(
      'Missing Supabase environment variables. Please check:\n' +
      '1. .env file exists in project root\n' +
      '2. Variables are properly formatted (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)\n' +
      '3. Environment variables are loaded (try restarting the dev server)\n'
    );
  }
}

// Create client with proper types and interceptors
export const supabase = createClient<Database>(
  supabaseUrl ?? '',  // Fallback to empty string in production
  supabaseAnonKey ?? '',  // Fallback to empty string in production
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