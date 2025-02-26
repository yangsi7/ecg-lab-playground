/**
 * Hook for tracking all database queries and their performance
 */
import { useState, useEffect } from 'react';
import { getQueryLog, type QueryExecution } from '@/hooks/api/core/useSupabase';

/**
 * Hook to access query logging information
 */
export function useQueryLogger() {
  const [queries, setQueries] = useState<QueryExecution[]>([]);
  const [stats, setStats] = useState({
    totalQueries: 0,
    avgDuration: 0,
    errorRate: 0,
    slowestQuery: null as QueryExecution | null,
    recentErrors: [] as QueryExecution[]
  });

  useEffect(() => {
    // Initial load
    updateQueryData();

    // Set up polling to check for new queries
    const interval = setInterval(updateQueryData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update query data and calculate stats
  const updateQueryData = () => {
    const currentLog = getQueryLog();
    setQueries(currentLog);
    
    if (currentLog.length === 0) return;
    
    // Calculate statistics
    let totalDuration = 0;
    let errorCount = 0;
    let slowest: QueryExecution | null = null;
    const errors: QueryExecution[] = [];
    
    currentLog.forEach(query => {
      totalDuration += query.duration;
      
      if (!query.success) {
        errorCount++;
        errors.push(query);
      }
      
      if (!slowest || (query.duration > slowest.duration)) {
        slowest = query;
      }
    });
    
    setStats({
      totalQueries: currentLog.length,
      avgDuration: totalDuration / currentLog.length,
      errorRate: currentLog.length > 0 ? (errorCount / currentLog.length) * 100 : 0,
      slowestQuery: slowest,
      recentErrors: errors.slice(0, 5)
    });
  };

  return {
    queries,
    stats,
    refresh: updateQueryData
  };
} 