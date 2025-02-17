import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { Database } from '../../types/database.types';

type AggregateLeadsResult = Database['public']['Functions']['aggregate_leads']['Returns'][0];

export type TimeInterval = 'hourly' | 'daily';

export interface ECGAggregateFilter {
  quality_threshold?: number;
  lead_on_threshold?: number;
  time_range?: {
    start: string;
    end: string;
  };
}

export interface ECGAggregateSort {
  field: keyof AggregateLeadsResult;
  direction: 'asc' | 'desc';
}

export interface UseECGAggregatorOptions {
  podId: string;
  timeInterval: TimeInterval;
  bucketSeconds: number;
  page?: number;
  pageSize?: number;
  filter?: ECGAggregateFilter;
  sort?: ECGAggregateSort;
}

export interface ECGAggregateResponse {
  data: AggregateLeadsResult[];
  count: number;
}

const fetchECGAggregates = async ({
  podId,
  timeInterval,
  bucketSeconds,
  page = 1,
  pageSize = 25,
  filter,
  sort,
}: UseECGAggregatorOptions): Promise<ECGAggregateResponse> => {
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .rpc('aggregate_leads', {
      p_pod_id: podId,
      p_time_start: filter?.time_range?.start ?? '',
      p_time_end: filter?.time_range?.end ?? '',
      p_bucket_seconds: bucketSeconds
    });

  if (error) {
    throw new Error(`Failed to fetch ECG aggregates: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || 0,
  };
};

export function useECGAggregator(options?: UseECGAggregatorOptions) {
  const aggregateLeads = async (
    podId: string,
    timeStart: string,
    timeEnd: string,
    bucketSeconds: number
  ): Promise<AggregateLeadsResult[]> => {
    try {
      const { data, error } = await supabase.rpc('aggregate_leads', {
        p_pod_id: podId,
        p_time_start: timeStart,
        p_time_end: timeEnd,
        p_bucket_seconds: bucketSeconds,
      });

      if (error) {
        logger.error('Error aggregating leads:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in useECGAggregator:', error);
      throw error;
    }
  };

  // If options are provided, return the query hook functionality
  if (options) {
    const queryKey = ['ecgAggregates', options];
    const query = useQuery({
      queryKey,
      queryFn: () => fetchECGAggregates(options),
      placeholderData: (previousData) => previousData,
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
      staleTime: 30000, // Consider data fresh for 30 seconds
    });

    return {
      ...query,
      aggregateLeads,
    };
  }

  // If no options, return just the aggregateLeads function
  return {
    aggregateLeads,
  };
}
