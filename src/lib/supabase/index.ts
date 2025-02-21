/**
 * Supabase client configuration with proper typing
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

// Create and export the typed client
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