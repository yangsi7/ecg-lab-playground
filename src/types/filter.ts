/**
 * Shared types for advanced filtering functionality
 */

export type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';

export interface FilterField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description: string;
}

export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterPreset {
  id: string;
  name: string;
  expression: string;
}

export interface FilterConfig<T> {
  fields: FilterField[];
  parseExpression: (expression: string) => FilterExpression | null;
  placeholder?: string;
  example?: string;
  presets?: FilterPreset[];
}

export interface FilterState<T> {
  quickFilter: string;
  expression: FilterExpression | null;
  error: string | null;
  setQuickFilter: (value: string) => void;
  setExpression: (value: string) => void;
  setError: (value: string | null) => void;
  applyFilter: (items: T[]) => T[];
}

export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date';

export interface FilterPreset {
  name: string;
  expression: string;
  description?: string;
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