/**
 * Domain types for ECG data
 * These types extend or transform the database types with business logic
 */

import type { Database } from '../database.types';
import type { TypeGuard, Transform } from '../utils';

// Raw database type from generated types
export type ECGSampleRow = Database['public']['Tables']['ecg_sample']['Row'];

/**
 * ECG data types for visualization and analysis.
 */

export interface ECGData {
  // Timing
  sample_time: string;

  // Channel data
  downsampled_channel_1: number;
  downsampled_channel_2: number;
  downsampled_channel_3: number;

  // Lead status
  lead_on_p_1: boolean;
  lead_on_p_2: boolean;
  lead_on_p_3: boolean;
  lead_on_n_1: boolean;
  lead_on_n_2: boolean;
  lead_on_n_3: boolean;

  // Quality indicators
  quality_1: boolean;
  quality_2: boolean;
  quality_3: boolean;
}

export interface ECGMetrics {
  signal_quality: {
    noise_levels: {
      channel_1: number;
      channel_2: number;
      channel_3: number;
    };
    quality_scores: {
      channel_1: number;
      channel_2: number;
      channel_3: number;
    };
  };
  connection_stats: {
    total_samples: number;
    missing_samples: number;
    connection_drops: number;
    sampling_frequency: number;
  };
}

/**
 * Query options for fetching ECG data
 */
export interface ECGQueryOptions {
  // Required fields
  podId: string;
  timeStart: string;
  timeEnd: string;

  // Optional parameters
  maxPoints?: number;
}

/**
 * Time interval for ECG data aggregation
 */
export type TimeInterval = 'hourly' | 'daily';

/**
 * Filter options for ECG aggregates
 */
export interface ECGAggregateFilter {
  quality_threshold?: number;
  lead_on_threshold?: number;
  time_range?: {
    start: string;
    end: string;
  };
}

/**
 * Aggregated lead data from RPC function
 */
export interface AggregatedLeadData {
  time_bucket: string;
  lead_on_p_1?: number;
  lead_on_p_2?: number;
  lead_on_p_3?: number;
  lead_on_n_1?: number;
  lead_on_n_2?: number;
  lead_on_n_3?: number;
  quality_1_percent?: number;
  quality_2_percent?: number;
  quality_3_percent?: number;
}

/**
 * Type guard to check if a value is ECGData
 */
export const isECGData: TypeGuard<ECGData> = (value): value is ECGData => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sample_time' in value &&
    'downsampled_channel_1' in value &&
    'quality_1' in value
  );
};

/**
 * Transform database row to domain type
 */
export const toECGData: Transform<ECGSampleRow, ECGData> = (row) => {
  return {
    sample_time: row.time ?? '',
    downsampled_channel_1: row.channel_1 ?? 0,
    downsampled_channel_2: row.channel_2 ?? 0,
    downsampled_channel_3: row.channel_3 ?? 0,
    lead_on_p_1: row.lead_on_p_1 ?? false,
    lead_on_p_2: row.lead_on_p_2 ?? false,
    lead_on_p_3: row.lead_on_p_3 ?? false,
    lead_on_n_1: row.lead_on_n_1 ?? false,
    lead_on_n_2: row.lead_on_n_2 ?? false,
    lead_on_n_3: row.lead_on_n_3 ?? false,
    quality_1: row.quality_1 ?? false,
    quality_2: row.quality_2 ?? false,
    quality_3: row.quality_3 ?? false,
  };
}; 