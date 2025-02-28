/**
 * Hook for tracking ECG queries for diagnostic purposes
 */
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export interface ECGQuery {
  podId: string;
  startTime: string;
  endTime: string;
  points: number;
  duration: number;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
}

// Create a module-level store to persist across component renders
const queryStore: {
  queries: ECGQuery[];
  listeners: Array<(queries: ECGQuery[]) => void>;
} = {
  queries: [],
  listeners: [],
};

// Maximum number of queries to keep in history
const MAX_QUERY_HISTORY = 20;

/**
 * Tracks ECG queries for diagnostic purposes
 * 
 * This hook provides a way to track and analyze ECG queries across the application.
 * It maintains a global store of query data that persists across component renders.
 */
export function useECGQueryTracker() {
  const [queries, setQueries] = useState<ECGQuery[]>(queryStore.queries);

  // Register and unregister listener for store updates
  useEffect(() => {
    const listener = (updatedQueries: ECGQuery[]) => {
      setQueries([...updatedQueries]);
    };
    
    queryStore.listeners.push(listener);
    
    return () => {
      queryStore.listeners = queryStore.listeners.filter(l => l !== listener);
    };
  }, []);

  // Add a new query to the store
  const addQuery = useCallback((query: ECGQuery) => {
    // Add to the beginning of the array so most recent is first
    queryStore.queries = [query, ...queryStore.queries].slice(0, MAX_QUERY_HISTORY);
    
    // Notify all listeners
    queryStore.listeners.forEach(listener => listener(queryStore.queries));
  }, []);

  // Clear all queries
  const clearQueries = useCallback(() => {
    queryStore.queries = [];
    queryStore.listeners.forEach(listener => listener(queryStore.queries));
  }, []);

  // Calculate statistics
  const stats = {
    totalQueries: queries.length,
    successCount: queries.filter(q => q.status === 'success').length,
    errorCount: queries.filter(q => q.status === 'error').length,
    averageDuration: queries.length 
      ? queries.reduce((sum, q) => sum + q.duration, 0) / queries.length 
      : 0,
    averagePoints: queries.length 
      ? queries.reduce((sum, q) => sum + q.points, 0) / queries.length 
      : 0,
  };

  return {
    queries,
    addQuery,
    clearQueries,
    stats
  };
}

// Export a standalone function that can be used outside of React components
export function trackECGQuery(query: ECGQuery) {
  queryStore.queries = [query, ...queryStore.queries].slice(0, MAX_QUERY_HISTORY);
  queryStore.listeners.forEach(listener => listener(queryStore.queries));
} 