/**
 * Common filter types used across the application
 */

export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date';

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  description?: string;
}

export interface FilterPreset {
  name: string;
  expression: string;
  description?: string;
}

export interface FilterConfig<T = unknown> {
  fields: FilterField[];
  presets?: FilterPreset[];
  examples?: string[];
}

export type FilterOperator = 
  | '=' 
  | '!=' 
  | '>' 
  | '<' 
  | '>=' 
  | '<=' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith';

export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | Date;
}

export interface FilterState<T> {
  quickFilter: string;
  expression: FilterExpression | null;
  error: string | null;
  setQuickFilter: (filter: string) => void;
  setExpression: (expression: FilterExpression | null) => void;
  setError: (error: string | null) => void;
  applyFilter: (items: T[]) => T[];
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterableField {
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  options?: string[]; // For enum types
  description?: string;
} 