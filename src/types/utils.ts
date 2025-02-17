/**
 * Type utilities and helper types for working with database and domain types
 * 
 * This file provides utility types for:
 * 1. Accessing database types (Tables, Inserts, Updates)
 * 2. Working with RPC functions
 * 3. Type transformations and validations
 * 4. Common type operations (Required, Optional, etc.)
 */

import type { Database } from '../supabase/types/database.types';

/**
 * Helper type to extract Row types from Database tables
 * @example
 * // Get the type of a study row
 * type StudyRow = TableRow<'study'>;
 * // Returns Database['public']['Tables']['study']['Row']
 */
export type TableRow<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Row'];

/**
 * Helper type to extract Insert types from Database tables
 * @example
 * // Get the insert type for a study
 * type StudyInsert = TableInsert<'study'>;
 * // Returns Database['public']['Tables']['study']['Insert']
 */
export type TableInsert<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to extract Update types from Database tables
 * @example
 * // Get the update type for a study
 * type StudyUpdate = TableUpdate<'study'>;
 * // Returns Database['public']['Tables']['study']['Update']
 */
export type TableUpdate<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Update'];

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
 * @example
 * // Make all fields in a type required and non-null
 * type RequiredStudy = Required<Study>;
 */
export type Required<T> = {
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
 * Helper to pick specific properties from a type and make them required
 * @example
 * // Pick id and name from Study and make them required
 * type StudyIdentifier = RequiredPick<Study, 'id' | 'name'>;
 */
export type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>>;

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
export type Transform<From, To> = (value: From) => To;

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

/**
 * Query parameters for table operations
 */
export interface QueryParams {
  start?: number;
  end?: number;
  filters?: Record<string, string>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Query response type
 */
export interface QueryResponse<T> {
  data: T[];
  error: Error | null;
  count: number;
} 