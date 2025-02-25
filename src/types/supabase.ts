/**
 * Central type definitions for Supabase
 * Re-exports and utility types for working with the database
 */
import type {
  Database,
  Tables,
  TableName,
  TableRow,
  TableInsert,
  TableUpdate,
  RPCFunctions,
  RPCName,
  QueryParams,
  QueryMetadata,
  QueryResponse,
  RPCOptions
} from './utils';

// Re-export common types
export type {
  Database,
  Tables,
  TableName,
  TableRow,
  TableInsert,
  TableUpdate,
  RPCFunctions,
  RPCName,
  QueryParams,
  QueryMetadata,
  QueryResponse,
  RPCOptions
};

// Additional RPC types
export type RPCArgs<T extends RPCName> = RPCFunctions[T]['Args'];
export type RPCReturns<T extends RPCName> = RPCFunctions[T]['Returns'];

// Type assertions
export function assertTableRow<T extends TableName>(
  tableName: T,
  data: unknown
): asserts data is TableRow<T> {
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid table row data for table ${tableName}`);
  }
}

export function assertRPCResult<T extends RPCName>(
  functionName: T,
  data: unknown
): asserts data is RPCReturns<T> {
  if (data === undefined || data === null) {
    throw new Error(`Invalid RPC result for function ${functionName}`);
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