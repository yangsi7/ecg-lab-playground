/**
 * Utility functions for debugging Supabase API access
 */
import { supabase } from '@/types/supabase';
import { logger } from './logger';
import type { PostgrestError } from '@supabase/supabase-js';

interface DebugOptions {
  /** Whether to log the results to console */
  log?: boolean;
  /** Whether to include request and response headers in logs */
  includeHeaders?: boolean;
  /** Whether to include body data in logs */
  includeData?: boolean;
}

interface RpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: PostgrestError | Error | unknown;
  status?: number;
  statusText?: string;
  duration?: number;
  authenticated?: boolean;
  headers?: Record<string, string>;
}

/**
 * Test direct RPC call with debug output
 */
export async function testRpcCall<T = any>(
  functionName: string, 
  params?: Record<string, any>,
  options: DebugOptions = { log: true }
): Promise<RpcResponse<T>> {
  const startTime = performance.now();
  
  try {
    // Get session info
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error('Session error before RPC call', { error: sessionError });
      return { success: false, error: sessionError };
    }
    
    // Check if we're authenticated
    const isAuthenticated = !!sessionData.session;
    
    if (!isAuthenticated) {
      logger.warn('No authenticated session found');
    } else {
      logger.info('User authenticated', {
        userId: sessionData.session?.user?.id,
        expiresAt: sessionData.session?.expires_at,
      });
    }
    
    // Make the RPC call
    logger.info(`Calling RPC function: ${functionName}`, { 
      params,
      authenticated: isAuthenticated,
    });
    
    // @ts-ignore - debug to get low-level access
    const headers = supabase.rest?.headers || {};
    
    // Actual RPC call - use type assertion to bypass TypeScript checking for RPC function names
    const { data, error, status, statusText } = await (supabase.rpc as any)(functionName, params);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (error) {
      logger.error(`RPC error in ${functionName}`, { 
        error, 
        status, 
        statusText,
        duration: `${duration.toFixed(1)}ms`,
        authenticated: isAuthenticated,
        headers: options.includeHeaders ? headers : undefined
      });
      
      return { 
        success: false, 
        error,
        status,
        statusText,
        duration,
        authenticated: isAuthenticated,
        headers: options.includeHeaders ? headers : undefined
      };
    }
    
    logger.info(`RPC success: ${functionName}`, {
      duration: `${duration.toFixed(1)}ms`,
      recordCount: Array.isArray(data) ? data.length : 'non-array',
      sample: options.includeData ? 
        (Array.isArray(data) ? data.slice(0, 2) : data) : 
        undefined,
      authenticated: isAuthenticated,
      headers: options.includeHeaders ? headers : undefined
    });
    
    return {
      success: true,
      data,
      status,
      statusText,
      duration,
      authenticated: isAuthenticated
    };
  } catch (error) {
    const endTime = performance.now();
    logger.error(`Exception in RPC call to ${functionName}`, {
      error,
      duration: `${(endTime - startTime).toFixed(1)}ms`
    });
    
    return {
      success: false,
      error,
      duration: endTime - startTime
    };
  }
}

/**
 * Helper to check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const { exp } = JSON.parse(jsonPayload);
    const expired = Date.now() >= exp * 1000;
    
    return expired;
  } catch (error) {
    logger.error('Error checking token expiration', { error });
    return true; // Assume expired if we can't parse
  }
}

/**
 * Get detailed authentication state
 */
export async function getAuthState() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { 
        authenticated: false, 
        error: error.message
      };
    }
    
    if (!data.session) {
      return {
        authenticated: false,
        reason: 'No active session'
      };
    }
    
    const token = data.session.access_token;
    const expired = isTokenExpired(token);
    
    return {
      authenticated: !expired,
      user: data.session.user,
      expires: data.session.expires_at,
      expired,
      tokenType: data.session.token_type
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 