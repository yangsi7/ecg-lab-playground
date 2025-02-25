/**
 * Central type utilities for database and domain types
 * Single source of truth for all database-related type utilities
 */

import type { Database } from './database.types';

// Database type utilities
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables
export type RPCFunctions = Database['public']['Functions']
export type RPCName = keyof RPCFunctions

/**
 * Helper type to extract Row types from Database tables
 */
export type TableRow<T extends TableName> = Tables[T]['Row']

/**
 * Helper type to extract Insert types from Database tables
 */
export type TableInsert<T extends TableName> = Tables[T]['Insert']

/**
 * Helper type to extract Update types from Database tables
 */
export type TableUpdate<T extends TableName> = Tables[T]['Update']

/**
 * Helper type to make all properties of T non-nullable
 */
export type NonNullRequired<T> = {
    [K in keyof T]-?: NonNullable<T[K]>
}

// Query and Response types
export interface QueryParams {
    page?: number
    pageSize?: number
    filters?: Record<string, unknown>
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
    enabled?: boolean
}

export interface QueryMetadata {
    executionTime: number
    cached: boolean
}

export interface QueryResponse<T> {
    data: T[]
    error: Error | null
    count: number
    metadata: QueryMetadata
}

export interface RPCOptions {
    retry?: boolean
    retryCount?: number
    retryDelay?: number
    component?: string
    context?: Record<string, unknown>
}

// Error types
export class SupabaseError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SupabaseError'
    }
}

export class RPCError extends Error {
    constructor(message: string, public functionName: string) {
        super(message)
        this.name = 'RPCError'
    }
}

// Type guard utilities
export type TypeGuard<T> = (value: unknown) => value is T

// Transform utilities
export type Transform<T, U> = (value: T) => U

// Diagnostic types
export interface EdgeFunctionStats {
    function_name: string;
    total_invocations: number;
    average_duration_ms: number;
    last_invocation: string;
    success_rate: number;
    error_count: number;
}

export interface DatabaseStatsRPC {
    table_name: string;
    row_count: number;
    last_vacuum: string;
    size_bytes: number;
    index_size_bytes: number;
    cache_hit_ratio: number;
    query_id: string;
}

export interface RPCMetrics {
    function_name: string;
    total_calls: number;
    average_duration_ms: number;
    error_rate: number;
    cache_hit_ratio: number;
}

export interface SystemMetrics {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_latency_ms: number;
    active_connections: number;
}

// Type guards for diagnostic types
export const isEdgeFunctionStats = (data: unknown): data is EdgeFunctionStats => {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.function_name === 'string' &&
        typeof d.total_invocations === 'number' &&
        typeof d.average_duration_ms === 'number' &&
        typeof d.last_invocation === 'string' &&
        typeof d.success_rate === 'number' &&
        typeof d.error_count === 'number'
    );
};

export const isDatabaseStatsRPC = (data: unknown): data is DatabaseStatsRPC => {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.table_name === 'string' &&
        typeof d.row_count === 'number' &&
        typeof d.last_vacuum === 'string' &&
        typeof d.size_bytes === 'number' &&
        typeof d.index_size_bytes === 'number' &&
        typeof d.cache_hit_ratio === 'number' &&
        typeof d.query_id === 'string'
    );
};

export const isRPCMetrics = (data: unknown): data is RPCMetrics => {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.function_name === 'string' &&
        typeof d.total_calls === 'number' &&
        typeof d.average_duration_ms === 'number' &&
        typeof d.error_rate === 'number' &&
        typeof d.cache_hit_ratio === 'number'
    );
};

export const isSystemMetrics = (data: unknown): data is SystemMetrics => {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.cpu_usage === 'number' &&
        typeof d.memory_usage === 'number' &&
        typeof d.disk_usage === 'number' &&
        typeof d.network_latency_ms === 'number' &&
        typeof d.active_connections === 'number'
    );
};

// Re-export Database type as the single source of truth
export type { Database } 