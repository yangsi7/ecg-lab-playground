import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ECGAggregateData {
  time_bucket: string;
  lead_on_p_1: number;
  lead_on_n_1: number;
  lead_on_p_2: number;
  lead_on_n_2: number;
  lead_on_p_3: number;
  lead_on_n_3: number;
  quality_1_percent: number;
  quality_2_percent: number;
  quality_3_percent: number;
}

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
  field: keyof ECGAggregateData;
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
  data: ECGAggregateData[];
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
      p_time_start: filter?.time_range?.start,
      p_time_end: filter?.time_range?.end,
      p_bucket_seconds: bucketSeconds,
      p_quality_threshold: filter?.quality_threshold,
      p_lead_on_threshold: filter?.lead_on_threshold,
      p_limit: pageSize,
      p_offset: offset,
      p_sort_field: sort?.field,
      p_sort_direction: sort?.direction,
    })
    .returns<ECGAggregateData[]>();

  if (error) {
    throw new Error(`Failed to fetch ECG aggregates: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || 0,
  };
};

export const useEcgAggregator = (options: UseECGAggregatorOptions) => {
  const queryKey = ['ecgAggregates', options];

  return useQuery({
    queryKey,
    queryFn: () => fetchECGAggregates(options),
    placeholderData: (previousData) => previousData,
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
