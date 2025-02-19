/**
 * Supabase client configuration and type exports
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

// Custom error types for better error handling
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export class RPCError extends SupabaseError {
  constructor(
    message: string,
    public functionName: string,
    public params?: unknown
  ) {
    super(message);
    this.name = 'RPCError';
  }
}

// Strongly typed client
export type TypedSupabaseClient = SupabaseClient<Database>;

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
  }
);

// Rate limiting configuration
const RPC_RATE_LIMIT = {
  maxAttempts: 3,
  timeWindow: 1000, // 1 second
  backoffFactor: 2,
};

// Common query parameters with proper types
export interface QueryParams<T extends keyof Database['public']['Tables']> {
  start?: number;
  end?: number;
  filters?: Partial<Record<keyof Database['public']['Tables'][T]['Row'], string>>;
  sortBy?: keyof Database['public']['Tables'][T]['Row'];
  sortDirection?: 'asc' | 'desc';
}

// Enhanced query response with proper error typing
export interface QueryResponse<T> {
  data: T[] | null;
  error: SupabaseError | null;
  count: number;
  metadata?: {
    executionTime?: number;
    cached?: boolean;
  };
}

/**
 * Generic query function for Supabase tables with proper typing and performance tracking
 */
export async function queryTable<T extends keyof Database['public']['Tables']>(
  table: T,
  { start, end, filters, sortBy, sortDirection = 'asc' }: QueryParams<T> = {}
): Promise<QueryResponse<Database['public']['Tables'][T]['Row']>> {
  const startTime = performance.now();
  
  try {
    type TableRow = Database['public']['Tables'][T]['Row'];
    let query = supabase
      .from(table)
      .select<'*', TableRow>('*', { count: 'exact' });

    if (typeof start === 'number' && typeof end === 'number') {
      query = query.range(start, end);
    }

    if (filters) {
      for (const [field, value] of Object.entries(filters)) {
        if (value) {
          query = query.ilike(field as string, `%${value}%`);
        }
      }
    }

    if (sortBy) {
      query = query.order(sortBy as string, { ascending: sortDirection === 'asc' });
    }

    const { data, error, count } = await query;

    if (error) throw new SupabaseError(error.message, error.code, error.details);

    return {
      data: data ?? [],
      error: null,
      count: count ?? 0,
      metadata: {
        executionTime: performance.now() - startTime,
        cached: false, // TODO: Implement cache detection
      },
    };
  } catch (error) {
    return {
      data: [],
      error: error instanceof SupabaseError ? error : new SupabaseError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ),
      count: 0,
      metadata: {
        executionTime: performance.now() - startTime,
      },
    };
  }
}

// Enhanced RPC function types
type DatabaseFunctions = Database['public']['Functions'];
export type RPCFunctionName = keyof DatabaseFunctions;
export type RPCFunctionArgs<T extends RPCFunctionName> = DatabaseFunctions[T]['Args'];
export type RPCFunctionReturns<T extends RPCFunctionName> = DatabaseFunctions[T]['Returns'];

// Enhanced diagnostic tracking
interface RPCCallInfo {
  id: string;
  functionName: string;
  status: 'pending' | 'success' | 'error';
  error?: any;
  timestamp: Date;
  params?: any;
  component?: string;
  context?: any;
  executionTime?: number;
  attempt?: number;
}

interface DiagnosticOptions {
  component?: string;
  context?: Record<string, unknown>;
  retryConfig?: {
    maxAttempts?: number;
    timeWindow?: number;
    backoffFactor?: number;
  };
}

// Global diagnostic state with TypeScript safety
declare global {
  interface Window {
    __rpcDiagnostics?: {
      lastCall?: {
        component?: string;
        context?: any;
      };
      calls: RPCCallInfo[];
      stats: {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        averageExecutionTime: number;
      };
    };
  }
}

// Initialize global diagnostic state with stats
if (typeof window !== 'undefined') {
  window.__rpcDiagnostics = {
    calls: [],
    stats: {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageExecutionTime: 0,
    },
  };
}

// Enhanced RPC call tracking with stats
function trackRPCCall(info: RPCCallInfo) {
  if (typeof window !== 'undefined') {
    const diagnostics = window.__rpcDiagnostics!;
    
    // Update calls list
    diagnostics.calls.unshift(info);
    diagnostics.calls = diagnostics.calls.slice(0, 10);
    
    // Update stats
    diagnostics.stats.totalCalls++;
    if (info.status === 'success') {
      diagnostics.stats.successfulCalls++;
    } else if (info.status === 'error') {
      diagnostics.stats.failedCalls++;
    }
    
    if (info.executionTime) {
      const totalTime = diagnostics.stats.averageExecutionTime * (diagnostics.stats.totalCalls - 1);
      diagnostics.stats.averageExecutionTime = (totalTime + info.executionTime) / diagnostics.stats.totalCalls;
    }
    
    // Update last call info
    diagnostics.lastCall = {
      component: info.component,
      context: info.context
    };
  }
}

/**
 * Enhanced type-safe RPC function caller with retry logic and diagnostic tracking
 */
export async function callRPC<T extends RPCFunctionName>(
  functionName: T,
  params?: RPCFunctionArgs<T>,
  diagnosticOptions?: DiagnosticOptions
): Promise<RPCFunctionReturns<T>> {
  const config = {
    maxAttempts: diagnosticOptions?.retryConfig?.maxAttempts ?? RPC_RATE_LIMIT.maxAttempts,
    timeWindow: diagnosticOptions?.retryConfig?.timeWindow ?? RPC_RATE_LIMIT.timeWindow,
    backoffFactor: diagnosticOptions?.retryConfig?.backoffFactor ?? RPC_RATE_LIMIT.backoffFactor,
  };
  
  let attempt = 1;
  let lastError: Error | null = null;
  
  while (attempt <= config.maxAttempts) {
    const startTime = performance.now();
    
    const callInfo: RPCCallInfo = {
      id: crypto.randomUUID(),
      functionName,
      status: 'pending',
      timestamp: new Date(),
      params,
      component: diagnosticOptions?.component,
      context: diagnosticOptions?.context,
      attempt,
    };
    
    trackRPCCall(callInfo);
    
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) {
        throw new RPCError(error.message, functionName, params);
      }
      
      callInfo.status = 'success';
      callInfo.executionTime = performance.now() - startTime;
      trackRPCCall(callInfo);
      
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      callInfo.status = 'error';
      callInfo.error = lastError;
      callInfo.executionTime = performance.now() - startTime;
      trackRPCCall(callInfo);
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = config.timeWindow * Math.pow(config.backoffFactor, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }
  
  throw lastError ?? new Error('Maximum retry attempts reached');
}

/**
 * Enhanced generic single record fetch function with proper typing
 */
export async function fetchRecord<
  T extends keyof Database['public']['Tables'],
  K extends keyof Database['public']['Tables'][T]['Row']
>(
  table: T,
  column: K,
  value: Database['public']['Tables'][T]['Row'][K]
): Promise<{
  data: Database['public']['Tables'][T]['Row'] | null;
  error: SupabaseError | null;
  metadata?: {
    executionTime?: number;
    cached?: boolean;
  };
}> {
  const startTime = performance.now();
  
  try {
    type TableRow = Database['public']['Tables'][T]['Row'];
    const { data, error } = await supabase
      .from(table)
      .select<'*', TableRow>('*')
      .eq(column as string, value as any)
      .single();

    if (error) throw new SupabaseError(error.message, error.code, error.details);

    return {
      data,
      error: null,
      metadata: {
        executionTime: performance.now() - startTime,
        cached: false, // TODO: Implement cache detection
      },
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof SupabaseError ? error : new SupabaseError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ),
      metadata: {
        executionTime: performance.now() - startTime,
      },
    };
  }
}

// Helper types for table operations
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Common table types
export type StudyRow = TableRow<'study'>;
export type StudyReadingRow = TableRow<'study_readings'>;
export type PodRow = TableRow<'pod'>;
export type ClinicRow = TableRow<'clinics'>;
export type ECGSampleRow = TableRow<'ecg_sample'>;
