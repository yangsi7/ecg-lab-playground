import { useCallback } from 'react';
import { supabase } from '@/hooks/api/supabase';
import { useQuery } from '@tanstack/react-query';
import type { PostgrestError } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { RPCError } from '../../../types/utils';
import type { Database } from '../../../types/database.types';
import type { RPCFunctionName, RPCFunctionArgs, RPCFunctionReturns, RPCCallInfo, DiagnosticOptions } from '../../../types/utils';

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
        duration: 0 // Initialize with 0, will be updated after execution
      };
      trackRPCCall(callInfo);

      try {
        const { data, error } = await supabase.rpc(functionName, params);

        if (error) {
          throw new RPCError(error.message, functionName);
        }

        // Update call info for success
        callInfo.status = 'success';
        callInfo.executionTime = performance.now() - startTime;
        callInfo.duration = callInfo.executionTime;
        trackRPCCall(callInfo);

        return data;
      } catch (error) {
        // Update call info for error
        callInfo.status = 'error';
        callInfo.error = error instanceof Error ? error : new Error(String(error));
        callInfo.executionTime = performance.now() - startTime;
        callInfo.duration = callInfo.executionTime;
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

    throw new RPCError(
      `Failed to call RPC function after ${config.maxAttempts} attempts`,
      functionName
    );
  }, []);

  return { callRPC };
} 