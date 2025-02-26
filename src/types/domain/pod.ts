/**
 * Domain types for pods
 */
import type { Database } from '@/types/database.types';

// Raw database type from generated types
export type PodRow = Database['public']['Tables']['pod']['Row'];

// Query parameters for pod list
export interface PodListParams {
  page?: number;
  pageSize?: number;
  sortBy?: keyof PodRow;
  sortDirection?: 'asc' | 'desc';
  filter?: string;
}

// Response from get_pod_days RPC - using the actual RPC return type
export type PodDayResponse = Database['public']['Functions']['get_pod_days']['Returns'][number];

// Response from get_pod_earliest_latest RPC - using the actual RPC return type
export type PodEarliestLatest = Database['public']['Functions']['get_pod_earliest_latest']['Returns'][number]; 