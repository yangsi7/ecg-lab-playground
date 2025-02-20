import type { Database } from './database.types';

// Common Supabase operation types
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// RPC function types
export type RPCFunctionName = keyof Database['public']['Functions'];
export type RPCFunctionArgs<T extends RPCFunctionName> = Database['public']['Functions'][T]['Args'];
export type RPCFunctionReturns<T extends RPCFunctionName> = Database['public']['Functions'][T]['Returns'];

// Query and Response types
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: string;
}

export interface QueryResponse<T> {
  data: T[];
  count: number;
  error: Error | null;
}

export interface RPCCallInfo {
  functionName: string;
  args?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: Error;
}

// Error types
export class SupabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export class RPCError extends SupabaseError {
  constructor(message: string, public functionName: string) {
    super(message);
    this.name = 'RPCError';
  }
}

// Diagnostic types
export interface DiagnosticOptions {
  includeTimings?: boolean;
  includeErrors?: boolean;
  maxEntries?: number;
}

// Stat types (for DiagnosticsPanel)
export const StatTypes = {
  QUERY_COUNT: 'query_count',
  CACHE_HIT_RATE: 'cache_hit_rate',
  AVG_QUERY_TIME: 'avg_query_time',
  ERROR_RATE: 'error_rate',
  ACTIVE_CONNECTIONS: 'active_connections'
} as const;

export type StatType = typeof StatTypes[keyof typeof StatTypes];

export interface DatabaseStat {
  stat_type: StatType;
  hit_rate: number | null;
  timestamp: string;
}

// Re-export database types for convenience
export type { Database }; 