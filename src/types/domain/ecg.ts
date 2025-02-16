/**
 * Domain types for ECG data
 * These types extend or transform the database types with business logic
 */

import type { Database } from '../database.types';
import type { TableRow, TypeGuard, Transform } from '../utils';

// Raw database type
type ECGSampleRow = TableRow<'ecg_sample'>;

/**
 * Domain-specific ECG data type with computed fields
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