import { useState, useCallback } from 'react';
import { useECGAggregates, type TimeInterval } from './useECGAggregates';

export interface UseECGAggregatorViewParams {
  podId: string;
  timeInterval: TimeInterval;
  initialDate?: Date;
  pageSize?: number;
}

export interface UseECGAggregatorViewResult {
  currentDate: Date;
  page: number;
  filter: {
    quality_threshold: number;
    lead_on_threshold: number;
    time_range: {
      start: string;
      end: string;
    };
  };
  aggregates: any; // Replace with proper type from useECGAggregates
  count: number;
  loading: boolean;
  error: any; // Replace with proper type from useECGAggregates
  totalPages: number;
  handleQualityThresholdChange: (threshold: number) => void;
  handleLeadOnThresholdChange: (threshold: number) => void;
  setPage: (page: number) => void;
}

export function useECGAggregatorView({
  podId,
  timeInterval,
  initialDate = new Date(),
  pageSize = 60
}: UseECGAggregatorViewParams): UseECGAggregatorViewResult {
  const [currentDate] = useState(initialDate);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    quality_threshold: 0,
    lead_on_threshold: 0,
    time_range: {
      start: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        timeInterval === 'hourly' ? currentDate.getHours() : 0,
        0,
        0
      ).toISOString(),
      end: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        timeInterval === 'hourly' ? currentDate.getHours() + 1 : 23,
        59,
        59
      ).toISOString(),
    },
  });

  const offset = (page - 1) * pageSize;

  const { data: aggregates, count, loading, error } = useECGAggregates({
    podId,
    startTime: filter.time_range.start,
    endTime: filter.time_range.end,
    bucketSize: timeInterval === 'hourly' ? 60 : 3600, // 1 minute or 1 hour
    filter,
    offset,
    limit: pageSize
  });

  const handleQualityThresholdChange = useCallback((threshold: number) => {
    setFilter(prev => ({
      ...prev,
      quality_threshold: threshold,
    }));
  }, []);

  const handleLeadOnThresholdChange = useCallback((threshold: number) => {
    setFilter(prev => ({
      ...prev,
      lead_on_threshold: threshold,
    }));
  }, []);

  const totalPages = Math.ceil(count / pageSize);

  return {
    currentDate,
    page,
    filter,
    aggregates,
    count,
    loading,
    error,
    totalPages,
    handleQualityThresholdChange,
    handleLeadOnThresholdChange,
    setPage
  };
} 