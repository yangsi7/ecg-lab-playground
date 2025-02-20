/**
 * Supabase client configuration and type exports
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import {
  SupabaseError,
  RPCError,
  type TypedSupabaseClient,
  type QueryParams,
  type QueryResponse,
  type PostgrestResponse,
  type RPCFunctionName,
  type RPCFunctionArgs,
  type RPCFunctionReturns,
  type RPCCallInfo,
  type DiagnosticOptions,
  type TableRow
} from '../../types/utils';

// Environment variables with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new SupabaseError('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new SupabaseError('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Rate limiting configuration
const RPC_RATE_LIMIT = {
  maxAttempts: 3,
  timeWindow: 1000, // 1 second
  backoffFactor: 2,
};

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

// Global diagnostic state with TypeScript safety
declare global {
  interface Window {
    __rpcDiagnostics?: {
      lastCall?: {
        component?: string;
        context?: unknown;
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
    const callId = Math.random().toString(36).substring(7);
    const startTime = performance.now();

    // Track the call
    const callInfo: RPCCallInfo = {
      id: callId,
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
        throw new RPCError(error.message, error.code, error.details, params);
      }

      // Update call info for success
      callInfo.status = 'success';
      callInfo.executionTime = performance.now() - startTime;
      trackRPCCall(callInfo);

      return data;
    } catch (error) {
      // Update call info for error
      callInfo.status = 'error';
      callInfo.error = error instanceof Error ? error : new Error(String(error));
      callInfo.executionTime = performance.now() - startTime;
      trackRPCCall(callInfo);

      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is not the last attempt, wait before retrying
      if (attempt < config.maxAttempts) {
        const delay = config.timeWindow * Math.pow(config.backoffFactor, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      attempt++;
    }
  }

  throw lastError ?? new RPCError(
    `Failed to call RPC function after ${config.maxAttempts} attempts`,
    'RETRY_FAILED',
    undefined,
    { functionName, params }
  );
}

/**
 * Generic query function for Supabase tables with proper typing and performance tracking
 */
export async function queryTable<T extends keyof Database['public']['Tables']>(
  table: T,
  params: QueryParams = {}
): Promise<QueryResponse<TableRow<T>>> {
  const startTime = performance.now();
  const { start, end, filters, sortBy, sortDirection = 'asc' } = params;
  
  try {
    const query = supabase
      .from(table)
      .select('*', { count: 'exact' });

    if (typeof start === 'number' && typeof end === 'number') {
      query.range(start, end);
    }

    if (filters) {
      for (const [field, value] of Object.entries(filters)) {
        if (value) {
          query.ilike(field as string, `%${value}%`);
        }
      }
    }

    if (sortBy) {
      query.order(sortBy as string, { ascending: sortDirection === 'asc' });
    }

    const response = await query;

    if (response.error) {
      throw new SupabaseError(response.error.message, response.error.code, response.error.details);
    }

    // Use type assertion to handle the response data
    const rows = (response.data ?? []) as unknown as TableRow<T>[];

    return {
      data: rows,
      error: null,
      count: response.count ?? 0,
      metadata: {
        executionTime: performance.now() - startTime,
        cached: false,
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
