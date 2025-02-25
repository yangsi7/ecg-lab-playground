/**
 * Hook for tracking ECG queries for diagnostic purposes
 */
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface ECGQueryInfo {
  functionName: string;
  timestamp: string;
  day: string;
  timeRange: {
    start: string;
    end: string;
  };
  timestamps: {
    start: string;
    end: string;
  };
  points: number;
  duration: number;
  podId: string;
}

// Global state to track ECG queries across components
declare global {
  interface Window {
    __ecgQueryTracker?: {
      queries: ECGQueryInfo[];
      addQuery: (query: ECGQueryInfo) => void;
    };
  }
}

// Initialize global tracker
if (typeof window !== 'undefined') {
  window.__ecgQueryTracker = {
    queries: [],
    addQuery: (query: ECGQueryInfo) => {
      window.__ecgQueryTracker!.queries.unshift(query);
      // Keep only the last 10 queries
      window.__ecgQueryTracker!.queries = window.__ecgQueryTracker!.queries.slice(0, 10);
      logger.debug('ECG query tracked', { query });
    }
  };
}

/**
 * Track an ECG query for diagnostics
 */
export function trackECGQuery(query: ECGQueryInfo) {
  if (typeof window !== 'undefined' && window.__ecgQueryTracker) {
    window.__ecgQueryTracker.addQuery(query);
  }
}

/**
 * Hook to access ECG query tracking information
 */
export function useECGQueryTracker() {
  const [queries, setQueries] = useState<ECGQueryInfo[]>([]);

  useEffect(() => {
    // Initial load
    if (typeof window !== 'undefined' && window.__ecgQueryTracker) {
      setQueries([...window.__ecgQueryTracker.queries]);
    }

    // Set up polling to check for new queries
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.__ecgQueryTracker) {
        setQueries([...window.__ecgQueryTracker.queries]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { queries };
} 