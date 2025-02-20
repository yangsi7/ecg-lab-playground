/**
 * Type utilities and helper types for working with database and domain types
 * 
 * This file provides utility types for:
 * 1. Accessing database types (Tables, Inserts, Updates)
 * 2. Working with RPC functions
 * 3. Type transformations and validations
 * 4. Common type operations (NonNullRequired, Optional, etc.)
 */

import type { Database } from './database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper type to extract Row types from Database tables
 * @example
 * // Get the type of a study row
 * type StudyRow = TableRow<'study'>;
 * // Returns Database['public']['Tables']['study']['Row']
 */
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract Insert types from Database tables
 * @example
 * // Get the insert type for a study
 * type StudyInsert = TableInsert<'study'>;
 * // Returns Database['public']['Tables']['study']['Insert']
 */
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract Update types from Database tables
 * @example
 * // Get the update type for a study
 * type StudyUpdate = TableUpdate<'study'>;
 * // Returns Database['public']['Tables']['study']['Update']
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * Helper type to extract RPC function return types
 * @example
 * // Get the return type of the get_clinic_overview RPC function
 * type ClinicOverview = RPCResponse<'get_clinic_overview'>;
 */
export type RPCResponse<
  T extends keyof Database['public']['Functions']
> = Database['public']['Functions'][T]['Returns'];

/**
 * Helper type to extract RPC function argument types
 * @example
 * // Get the argument type for the get_clinic_overview RPC function
 * type ClinicOverviewArgs = RPCArgs<'get_clinic_overview'>;
 */
export type RPCArgs<
  T extends keyof Database['public']['Functions']
> = Database['public']['Functions'][T]['Args'];

/**
 * Helper to convert database types to domain types with nullable fields
 * @example
 * // Make all fields in a type nullable
 * type NullableStudy = WithNullable<Study>;
 */
export type WithNullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Helper to make all properties in a type required and non-null
 * 
 * Unlike TypeScript's built-in Required<T> which only makes properties required,
 * this type also ensures all properties are non-null by applying NonNullable<T>
 * to each property.
 * 
 * @example
 * // Make all fields in a type required and non-null
 * type NonNullStudy = NonNullRequired<Study>;
 * 
 * // Difference from TypeScript's Required<T>:
 * type BuiltInRequired = Required<{ name?: string | null }>;     // { name: string | null }
 * type CustomNonNull = NonNullRequired<{ name?: string | null }> // { name: string }
 */
export type NonNullRequired<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Helper to make all properties in a type optional
 * @example
 * // Make all fields in a type optional
 * type OptionalStudy = Optional<Study>;
 */
export type Optional<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Helper to pick specific properties from a type and make them required and non-null
 * 
 * Similar to NonNullRequired<T>, but only applies to specific properties.
 * This ensures the selected properties are both required and non-null.
 * 
 * @example
 * // Pick id and name from Study and make them required and non-null
 * type StudyIdentifier = NonNullRequiredPick<Study, 'id' | 'name'>;
 * 
 * // Difference from TypeScript's Pick + Required:
 * type BuiltInPick = Required<Pick<{ id?: string | null }, 'id'>>;     // { id: string | null }
 * type CustomPick = NonNullRequiredPick<{ id?: string | null }, 'id'>; // { id: string }
 */
export type NonNullRequiredPick<T, K extends keyof T> = NonNullRequired<Pick<T, K>>;

/**
 * Helper to create a type guard function type
 * @example
 * // Create a type guard for Study
 * const isStudy: TypeGuard<Study> = (value): value is Study => { ... };
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Helper to create a transformation function type
 * @example
 * // Create a transform function from StudyRow to Study
 * const toStudy: Transform<StudyRow, Study> = (row) => { ... };
 */
export type Transform<T, U> = (input: T) => U;

/**
 * Error type for failed transformations
 * @example
 * throw new TransformError('Invalid study data', { study_id: 'missing' });
 */
export class TransformError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = 'TransformError';
  }
}

/**
 * Type utility to get the row type for a given table
 */
export type SupabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/**
 * Type utility to get the insert type for a given table
 */
export type SupabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

/**
 * Type utility to get the update type for a given table
 */
export type SupabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Query Types
export interface QueryParams {
  page?: number;
  pageSize?: number;
  start?: number;
  end?: number;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: string;
}

export interface QueryResponse<T> {
  data: T[];
  count: number;
  error: Error | null;
  metadata?: {
    executionTime?: number;
    cached?: boolean;
  };
}

// Supabase Query Types
export type PostgrestResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
  count?: number | null;
  status: number;
  statusText: string;
};

// Base error types
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

// Strongly typed client
export type TypedSupabaseClient = SupabaseClient<Database>;

// RPC Types
export type DatabaseFunctions = Database['public']['Functions'];
export type RPCFunctionName = keyof DatabaseFunctions;
export type RPCFunctionArgs<T extends RPCFunctionName> = DatabaseFunctions[T]['Args'];
export type RPCFunctionReturns<T extends RPCFunctionName> = DatabaseFunctions[T]['Returns'];

// Diagnostic Types
export interface RPCCallInfo {
  id: string;
  functionName: string;
  component?: string;
  args?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  status: 'pending' | 'success' | 'error';
  error?: Error;
  context?: unknown;
  params?: unknown;
  attempt?: number;
  executionTime?: number;
}

export interface DiagnosticOptions {
  includeTimings?: boolean;
  includeErrors?: boolean;
  maxEntries?: number;
  component?: string;
  context?: Record<string, unknown>;
  retryConfig?: {
    maxAttempts?: number;
    timeWindow?: number;
    backoffFactor?: number;
  };
}

export interface DatabaseStatsRPC {
  stat_type: string;
  rolname: string | null;
  query: string | null;
  calls: bigint | null;
  total_time: number | null;
  min_time: number | null;
  max_time: number | null;
  mean_time: number | null;
  avg_rows: number | null;
  prop_total_time: string | null;
  hit_rate: number | null;
}

// Common table row types
export type StudyRow = TableRow<'study'>;
export type StudyReadingRow = TableRow<'study_readings'>;
export type PodRow = TableRow<'pod'>;
export type ClinicRow = TableRow<'clinics'>;
export type ECGSampleRow = TableRow<'ecg_sample'>;
export type EdgeFunctionStatsRow = TableRow<'edge_function_stats'>;
export type RPCCallInfoRow = TableRow<'rpc_call_info'>;
export type DatasetRow = TableRow<'datasets'>;

// Database Stats types
export const StatTypes = {
  QUERY_COUNT: 'query_count',
  CACHE_HIT_RATE: 'cache_hit_rates',
  TABLE_HIT_RATE: 'table_hit_rate',
  AVG_QUERY_TIME: 'avg_query_time',
  ERROR_RATE: 'error_rate',
  ACTIVE_CONNECTIONS: 'active_connections',
  MOST_TIME_CONSUMING: 'most_time_consuming_queries',
  CUMULATIVE_EXECUTION_TIME: 'cumulative_total_execution_time'
} as const;

export type StatType = typeof StatTypes[keyof typeof StatTypes];

export interface DatabaseStats {
  stat_type: string;
  rolname: string;
  query: string;
  calls: number;
  total_time: number;
  min_time: number;
  max_time: number;
  mean_time: number;
  avg_rows: number;
  prop_total_time: string;
  hit_rate: number;
}

export interface EdgeFunctionStats {
  function_name: string;
  total_invocations: number;
  success_rate: number;
  average_duration_ms: number;
  memory_usage: number;
  cpu_time: string; // interval type from Postgres
  peak_concurrent_executions: number;
  last_invocation: string; // timestamp with time zone
}

export interface ActiveComponent {
  id: string;
  name: string;
  mountedAt: Date;
  lastUpdated: Date;
  updateCount: number;
}

// Re-export Database type for convenience
export type { Database };

// Type Guards - Pure boolean returns, no throws
export function isEdgeFunctionStats(value: unknown): value is EdgeFunctionStats {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<EdgeFunctionStats>;
  
  return (
    typeof v.function_name === 'string' &&
    typeof v.total_invocations === 'number' &&
    typeof v.success_rate === 'number' &&
    typeof v.average_duration_ms === 'number' &&
    typeof v.memory_usage === 'number' &&
    typeof v.cpu_time === 'string' &&
    typeof v.peak_concurrent_executions === 'number' &&
    typeof v.last_invocation === 'string'
  );
}

export function isDatabaseStatsRPC(value: unknown): value is DatabaseStatsRPC {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DatabaseStatsRPC>;
  
  return (
    typeof v.stat_type === 'string' &&
    (v.rolname === null || typeof v.rolname === 'string') &&
    (v.query === null || typeof v.query === 'string') &&
    (v.calls === null || typeof v.calls === 'bigint') &&
    (v.total_time === null || typeof v.total_time === 'number') &&
    (v.mean_time === null || typeof v.mean_time === 'number') &&
    (v.avg_rows === null || typeof v.avg_rows === 'number') &&
    (v.prop_total_time === null || typeof v.prop_total_time === 'string') &&
    (v.hit_rate === null || typeof v.hit_rate === 'number')
  );
}

// Assertion functions - Throw on invalid data
export function assertEdgeFunctionStats(value: unknown): asserts value is EdgeFunctionStats {
  if (!isEdgeFunctionStats(value)) {
    throw new TransformError('Invalid EdgeFunctionStats data', {
      value: JSON.stringify(value)
    });
  }
}

export function assertDatabaseStatsRPC(value: unknown): asserts value is DatabaseStatsRPC {
  if (!isDatabaseStatsRPC(value)) {
    throw new TransformError('Invalid DatabaseStatsRPC data', {
      value: JSON.stringify(value)
    });
  }
}

// Type Guards for Table Row Types
export function isStudyRow(value: unknown): value is StudyRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StudyRow>;
  
  return (
    typeof v.study_id === 'string' &&
    (v.clinic_id === null || typeof v.clinic_id === 'string') &&
    (v.pod_id === null || typeof v.pod_id === 'string') &&
    (v.study_type === null || typeof v.study_type === 'string')
  );
}

export function isClinicRow(value: unknown): value is ClinicRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ClinicRow>;
  
  return (
    typeof v.id === 'string' &&
    (v.name === null || typeof v.name === 'string')
  );
}

export function isPodRow(value: unknown): value is PodRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<PodRow>;
  
  return (
    typeof v.id === 'string' &&
    (v.assigned_study_id === null || typeof v.assigned_study_id === 'string') &&
    (v.assigned_user_id === null || typeof v.assigned_user_id === 'string') &&
    (v.status === null || typeof v.status === 'string')
  );
}

export function isDatasetRow(value: unknown): value is DatasetRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DatasetRow>;
  
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    (v.created_at === null || typeof v.created_at === 'string') &&
    (v.status === null || typeof v.status === 'string')
  );
} 