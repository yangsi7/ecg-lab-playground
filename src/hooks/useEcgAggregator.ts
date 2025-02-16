import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ECGData } from '../types'; // Assuming ECGData interface is defined

interface EcgAggregatorOptions {
  timeInterval: 'hourly' | 'daily';
  bucketSize: number;
  page: number;
  pageSize: number;
  columns: string[];
  filters: { [key: string]: any };
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

const fetchEcgAggregatedData = async (options: EcgAggregatorOptions) => {
  const {
    timeInterval,
    bucketSize,
    page,
    pageSize,
    columns,
    filters,
    sortBy,
    sortDirection,
  } = options;

  // Construct query - adjust table and function name as needed
  let query = supabase
    .rpc('get_aggregated_ecg_data', { // Replace with your actual RPC function name
      time_interval: timeInterval,
      bucket_size: bucketSize,
      page_num: page,
      page_size: pageSize,
      selected_columns: columns,
      filter_params: filters,
      sort_by: sortBy,
      sort_direction: sortDirection,
    })
    .returns<ECGData[]>(); // Adjust return type

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
};

const useEcgAggregator = (options: EcgAggregatorOptions) => {
  const queryKey = ['ecgAggregatedData', options];

  return useQuery({
    queryKey,
    queryFn: () => fetchEcgAggregatedData(options),
    keepPreviousData: true, // Keep data from previous query while loading new data
  });
};

export default useEcgAggregator;
