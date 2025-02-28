import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { ECGData } from '../../../types/domain/ecg';
import { trackECGQuery } from '../diagnostics/useECGQueryTracker';

export interface ECGQueryOptions {
  /**
   * Whether to enable the query. If false, the query will not run.
   * Useful for conditional fetching.
   */
  enabled?: boolean;
  
  /**
   * Maximum downsampling factor. Default is 1 (no downsampling).
   * Higher values will result in fewer data points.
   */
  downsamplingFactor?: number;
  
  /**
   * Maximum number of data points to return. Default is 2000.
   * If the query would return more data points, downsampling will be
   * automatically adjusted.
   */
  maxPoints?: number;
  
  /**
   * Callback when the query fails
   */
  onError?: (error: string) => void;
  
  /**
   * Callback when the query succeeds
   */
  onSuccess?: (data: ECGData[]) => void;
}

interface ECGDataResponse {
  data: ECGData[];
  loading: boolean;
  error: string | null;
  /**
   * Function to manually refetch the data
   */
  refetch: () => Promise<ECGData[]>;
  /**
   * Query metrics
   */
  metrics: {
    pointCount: number;
    queryDuration: number;
    downsamplingFactor: number;
    lastQueryTimestamp: number | null;
  };
}

// Cache for ECG data to avoid redundant requests
type CacheKey = string;
const dataCache = new Map<CacheKey, {
  data: ECGData[];
  timestamp: number;
  ttl: number; // time to live in milliseconds
}>();

// Default TTL: 5 minutes
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

// Get cache key from query parameters
const getCacheKey = (podId: string, timeStart: string, timeEnd: string, factor: number) => {
  return `${podId}:${timeStart}:${timeEnd}:${factor}`;
};

/**
 * Hook to fetch ECG data from Supabase edge function
 * @param podId The ID of the pod
 * @param timeStart ISO timestamp for the start time
 * @param timeEnd ISO timestamp for the end time
 * @param options Additional options for the query
 * @returns ECG data, loading state, error, refetch function, and query metrics
 */
export function useECGData(
  podId: string,
  timeStart: string,
  timeEnd: string,
  options: ECGQueryOptions = {}
): ECGDataResponse {
  const {
    enabled = true,
    downsamplingFactor = 1,
    maxPoints = 2000,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<ECGData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Query metrics
  const [metrics, setMetrics] = useState({
    pointCount: 0,
    queryDuration: 0,
    downsamplingFactor: downsamplingFactor,
    lastQueryTimestamp: null as number | null
  });

  // Keep track of the current request to cancel if needed
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Determine if the inputs are valid
  const isValidInput = podId && timeStart && timeEnd && enabled;

  // Function to fetch ECG data
  const fetchECGData = useCallback(async (force = false): Promise<ECGData[]> => {
    if (!isValidInput) {
      return [];
    }

    // Check cache first if not forcing a refresh
    if (!force) {
      const cacheKey = getCacheKey(podId, timeStart, timeEnd, downsamplingFactor);
      const cachedData = dataCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < cachedData.ttl) {
        // Use cached data
        setData(cachedData.data);
        setLoading(false);
        setError(null);
        
        // Still track the query but mark as from cache
        trackECGQuery({
          podId,
          startTime: timeStart,
          endTime: timeEnd,
          points: cachedData.data.length,
          duration: 0, // 0ms indicates cache hit
          timestamp: Date.now(),
          status: 'success'
        });
        
        return cachedData.data;
      }
    }
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    const startTimestamp = Date.now();
    
    try {
      // Call the edge function
      const response = await supabase.functions.invoke('downsample-ecg', {
        body: {
          pod_id: podId,
          time_start: timeStart,
          time_end: timeEnd,
          factor: downsamplingFactor,
          max_points: maxPoints
        }
      });
      
      // Calculate query duration
      const duration = Date.now() - startTimestamp;
      
      // Handle errors from the edge function
      if (response.error) {
        const errorMessage = getErrorMessage(response.error);
        setError(errorMessage);
        setLoading(false);
        
        // Track failed query
        trackECGQuery({
          podId,
          startTime: timeStart,
          endTime: timeEnd,
          points: 0,
          duration,
          timestamp: Date.now(),
          status: 'error',
          error: errorMessage
        });
        
        if (onError) onError(errorMessage);
        return [];
      }
      
      // Process data
      const ecgData = response.data as ECGData[];
      
      if (!ecgData || !Array.isArray(ecgData)) {
        const errorMessage = "Invalid response format from edge function";
        setError(errorMessage);
        setLoading(false);
        
        // Track failed query
        trackECGQuery({
          podId,
          startTime: timeStart,
          endTime: timeEnd,
          points: 0,
          duration,
          timestamp: Date.now(),
          status: 'error',
          error: errorMessage
        });
        
        if (onError) onError(errorMessage);
        return [];
      }
      
      // Update state with the fetched data
      setData(ecgData);
      setMetrics({
        pointCount: ecgData.length,
        queryDuration: duration,
        downsamplingFactor: downsamplingFactor,
        lastQueryTimestamp: Date.now()
      });
      setLoading(false);
      
      // Track successful query
      trackECGQuery({
        podId,
        startTime: timeStart,
        endTime: timeEnd,
        points: ecgData.length,
        duration,
        timestamp: Date.now(),
        status: 'success'
      });
      
      // Update cache
      const cacheKey = getCacheKey(podId, timeStart, timeEnd, downsamplingFactor);
      dataCache.set(cacheKey, {
        data: ecgData,
        timestamp: Date.now(),
        ttl: DEFAULT_CACHE_TTL
      });
      
      if (onSuccess) onSuccess(ecgData);
      return ecgData;
    } catch (err) {
      // Only set error if this request wasn't canceled
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        
        // Track error
        trackECGQuery({
          podId,
          startTime: timeStart,
          endTime: timeEnd,
          points: 0,
          duration: Date.now() - startTimestamp,
          timestamp: Date.now(),
          status: 'error',
          error: errorMessage
        });
        
        if (onError) onError(errorMessage);
      }
      
      setLoading(false);
      return [];
    }
  }, [podId, timeStart, timeEnd, downsamplingFactor, maxPoints, isValidInput, onError, onSuccess]);
  
  useEffect(() => {
    // Don't fetch if not enabled
    if (!enabled) return;
    
    // Fetch data
    fetchECGData();
    
    // Clean up: cancel in-flight request on unmount or params change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchECGData, enabled]);
  
  // Return the hook result
  return {
    data,
    loading,
    error,
    refetch: () => fetchECGData(true),
    metrics
  };
}

/**
 * Helper to extract a user-friendly error message
 */
function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  // If the error is from the edge function
  if (error.code) {
    switch (error.code) {
      case 'FUNCTION_TIMEOUT':
        return 'Query timed out. Try reducing time range or increasing downsampling.';
      case 'FUNCTION_NOT_FOUND':
        return 'The ECG query function is not deployed. Contact administrator.';
      case 'FUNCTION_EXECUTION_ERROR':
        return `Edge function error: ${error.message || 'unknown execution error'}`;
      case 'FUNCTION_RATE_LIMIT':
        return 'ECG query rate limit exceeded. Try again later.';
      default:
        return error.message || `Edge function error (${error.code})`;
    }
  }
  
  // If error is HTTP status
  if (error.status) {
    switch (error.status) {
      case 401:
        return 'Authentication required. Please login.';
      case 403:
        return 'You don\'t have permission to access this ECG data.';
      case 404:
        return 'No ECG data found for the specified parameters.';
      case 500:
        return 'Server error processing ECG data. Try again later.';
      default:
        return `ECG data error (${error.status}): ${error.message || 'unknown'}`;
    }
  }
  
  // For generic errors
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'ECG query timed out. Try using a smaller time range.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Check your connection and try again.';
    }
    return error.message;
  }
  
  // Fallback
  return typeof error === 'string' ? error : 'Unknown error fetching ECG data';
}
