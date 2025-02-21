/**
 * Domain-specific wrappers for ECG operations
 * Includes runtime validation and type safety
 */
import { useSupabaseQuery, useSupabaseRPC } from '@/hooks/api/useSupabase'
import { toECGData } from '@/types/domain/ecg'
import type { ECGData, ECGSampleRow, ECGQueryOptions, AggregatedLeadData } from '@/types/domain/ecg'
import { isECGData } from '@/types/domain/ecg'
import { logger } from '@/lib/logger'

/**
 * Hook for querying ECG data with domain-specific validation
 */
export function useECGData(options: ECGQueryOptions) {
  const { podId, timeStart, timeEnd, maxPoints } = options

  return useSupabaseRPC('downsample_ecg', {
    p_pod_id: podId,
    p_time_start: timeStart,
    p_time_end: timeEnd,
    p_factor: maxPoints || 1000,
  })
}

/**
 * Hook for querying aggregated lead data
 */
export function useAggregatedLeadData(
  podId: string,
  timeStart: string,
  timeEnd: string,
  bucketSeconds: number = 3600 // default 1 hour
) {
  return useSupabaseRPC('aggregate_leads', {
    p_pod_id: podId,
    p_time_start: timeStart,
    p_time_end: timeEnd,
    p_bucket_seconds: bucketSeconds,
  })
}

/**
 * Hook for getting pod data availability
 */
export function usePodDays(podId: string) {
  return useSupabaseRPC('get_pod_days', {
    p_pod_id: podId,
  })
}

/**
 * Hook for getting pod earliest/latest timestamps
 */
export function usePodTimeRange(podId: string) {
  return useSupabaseRPC('get_pod_earliest_latest', {
    p_pod_id: podId,
  })
}

/**
 * Utility function to validate ECG data
 */
function validateECGData(data: unknown): data is ECGData {
  try {
    if (!isECGData(data)) {
      throw new Error('Invalid ECG data format')
    }
    return true
  } catch (error) {
    logger.error('ECG data validation failed', { error, data })
    return false
  }
}

/**
 * Utility function to transform raw ECG samples to domain type
 */
export function transformECGSamples(samples: ECGSampleRow[]): ECGData[] {
  return samples
    .map(sample => {
      try {
        return toECGData(sample)
      } catch (error) {
        logger.error('Failed to transform ECG sample', { error, sample })
        return null
      }
    })
    .filter((data): data is ECGData => data !== null && validateECGData(data))
} 