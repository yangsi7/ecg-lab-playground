import { useCallback } from 'react';
import { supabase } from '@/types/supabase';
import { RPCError } from './errors';
import type { Database } from '@/types/database.types';

// Define types based on Database type
type RPCFunctionName = keyof Database['public']['Functions'];
type RPCFunctionArgs<T extends RPCFunctionName> = Database['public']['Functions'][T]['Args'];
type RPCFunctionReturns<T extends RPCFunctionName> = Database['public']['Functions'][T]['Returns'];

// Types for diagnostics
type DiagnosticOptions = {
  component?: string;
  context?: unknown;
  retryConfig?: {
    maxAttempts?: number;
    timeWindow?: number;
    backoffFactor?: number;
  };
};

type RPCCallInfo = {
  id: string;
  functionName: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  params?: unknown;
  component?: string;
  context?: unknown;
  attempt: number;
  executionTime?: number;
  duration: number;
  error?: Error;
};

// Rate limiting configuration
const RPC_RATE_LIMIT = {
  maxAttempts: 3,
  timeWindow: 1000, // 1 second
  backoffFactor: 2,
};

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

export function useRPC() {
  const callRPC = useCallback(async <T extends RPCFunctionName>(
    functionName: T,
    params?: RPCFunctionArgs<T>,
    diagnosticOptions?: DiagnosticOptions
  ): Promise<RPCFunctionReturns<T>> => {
    const config = {
      maxAttempts: diagnosticOptions?.retryConfig?.maxAttempts ?? RPC_RATE_LIMIT.maxAttempts,
      timeWindow: diagnosticOptions?.retryConfig?.timeWindow ?? RPC_RATE_LIMIT.timeWindow,
      backoffFactor: diagnosticOptions?.retryConfig?.backoffFactor ?? RPC_RATE_LIMIT.backoffFactor,
    };

    let attempt = 1;

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
        duration: 0 // Initialize with 0, will be updated after execution
      };
      trackRPCCall(callInfo);

      try {
        const { data, error } = await supabase.rpc(functionName, params);

        if (error) {
          // Enhanced error message for HTTP errors
          if (error.code === '500') {
            throw new RPCError(`Server error (500) when calling ${functionName}: ${error.message}. This could be due to missing data, database issues, or problems with the RPC function itself.`, functionName);
          } else if (error.code) {
            throw new RPCError(`${error.message} (Code: ${error.code})`, functionName);
          } else {
            throw new RPCError(error.message, functionName);
          }
        }

        // Update call info for success
        callInfo.status = 'success';
        callInfo.executionTime = performance.now() - startTime;
        callInfo.duration = callInfo.executionTime;
        trackRPCCall(callInfo);

        return data;
      } catch (error) {
        // Enhance error logging with params
        console.error(`RPC call to ${functionName} failed:`, error, { 
          params,
          attempt,
          context: diagnosticOptions?.context
        });
        
        // Update call info for error
        callInfo.status = 'error';
        callInfo.error = error instanceof Error ? error : new Error(String(error));
        callInfo.executionTime = performance.now() - startTime;
        callInfo.duration = callInfo.executionTime;
        trackRPCCall(callInfo);

        // If this is not the last attempt, wait before retrying
        if (attempt < config.maxAttempts) {
          const delay = config.timeWindow * Math.pow(config.backoffFactor, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        attempt++;
      }
    }

    throw new RPCError(
      `Failed to call RPC function after ${config.maxAttempts} attempts`,
      functionName
    );
  }, []);

  return { callRPC };
} 