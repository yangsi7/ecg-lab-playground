/**
 * STUDY HOOKS FACTORY
 * 
 * This file provides a unified approach for all study-related data fetching.
 * It addresses issues with type safety, error handling, and consistent pagination
 * patterns across different study data access methods.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/types/supabase';
import { logger } from '@/lib/logger';

// Type imports - these would need to be properly defined in your domain types
import type { HolterStudy } from '@/types/domain/holter';
import type { StudiesWithTimesRow, StudyListRow } from '@/types/domain/study';

// Define potential status values for type safety
// This should match the definition in your domain model
type HolterStatus = 'active' | 'error' | 'interrupted' | 'completed' | 'unknown';

// Partial HolterStudy for our internal transformations
// This accommodates the type mismatches by being a looser definition for mapping
interface HolterStudyMapped extends Omit<HolterStudy, 'status'> {
  status: HolterStatus;
}

// Base filter interface that all study queries can use
export interface StudyQueryFilter {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  // Common filter fields
  clinicId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Response interface for all study queries
export interface StudyQueryResponse<T> {
  data: T[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
  // For pagination
  page: number;
  pageSize: number;
  hasMore: boolean;
  // For refetching
  refetch: () => Promise<any>;
}

// Define type for RPC return data to help with transformation
interface RPCStudyData {
  study_id: string;
  clinic_id?: string;
  clinic_name?: string;
  pod_id?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  earliest_time?: string;
  latest_time?: string;
  total_hours?: number;
  quality_hours?: number;
  total_count?: number;
  status?: string;
  patient_id?: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields
  study_type?: string;
  pod_status?: string;
  user_id?: string;
  duration?: number;
  aggregated_quality_minutes?: number;
  aggregated_total_minutes?: number;
  // Additional holter-specific fields
  days_remaining?: number;
  interruptions?: number;
  quality_variance?: number;
  created_by?: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Factory function to create consistent study hooks
 * This ensures all study-related hooks follow the same pattern and error handling
 */
export function createStudyHook<T>(
  hookName: string,
  rpcFunctionName: string, // We'll type-assert this when calling the RPC
  mapResultToType: (data: RPCStudyData[]) => T[], 
  { 
    staleTime = 30000, 
    cacheTime = 5 * 60 * 1000,
    refetchOnWindowFocus = false
  } = {}
) {
  // Return a hook function that consumers can use
  return function useStudyData(filters: StudyQueryFilter = {}): StudyQueryResponse<T> {
    const {
      search = '',
      page = 0,
      pageSize = 25,
      sortBy,
      sortDirection = 'asc',
      clinicId,
      status,
      startDate,
      endDate
    } = filters;

    // Calculate pagination parameters
    const offset = page * pageSize;
    
    const queryKey = [hookName, search, page, pageSize, sortBy, sortDirection, clinicId, status, startDate, endDate];
    
    const { 
      data, 
      error, 
      isLoading,
      refetch
    } = useQuery({
      queryKey,
      queryFn: async () => {
        try {
          logger.debug(`Fetching ${hookName} data`, {
            rpcFunction: rpcFunctionName,
            filters
          });
          
          // Build RPC parameters - only include defined values
          const rpcParams: Record<string, any> = {
            p_offset: offset,
            p_limit: pageSize
          };
          
          // Add optional parameters only if they're defined
          if (search) rpcParams.p_search = search;
          if (clinicId) rpcParams.p_clinic_id = clinicId;
          if (status) rpcParams.p_status = status;
          if (startDate) rpcParams.p_start_date = startDate;
          if (endDate) rpcParams.p_end_date = endDate;
          
          // Type-safe RPC call - using type assertion for the function name
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            rpcFunctionName as any, // Type assertion since we can't list all RPCs
            rpcParams
          );
          
          // Handle errors
          if (rpcError) {
            logger.error(`RPC ${rpcFunctionName} failed`, { error: rpcError });
            throw new Error(`Failed to fetch ${hookName} data: ${rpcError.message}`);
          }
          
          // Handle missing data
          if (!rpcData) {
            logger.warn(`No data returned from ${rpcFunctionName}`);
            return { 
              rows: [],
              totalCount: 0
            };
          }
          
          // Ensure data is always an array, even if the RPC returns a single object or null
          let dataArray: RPCStudyData[] = [];
          if (Array.isArray(rpcData)) {
            dataArray = rpcData;
          } else if (rpcData !== null && typeof rpcData === 'object') {
            // Handle single object response
            dataArray = [rpcData as RPCStudyData];
          }
          
          // Extract total count from the response if available
          // Many RPCs return total_count in each row
          let totalCount = 0;
          if (dataArray.length > 0 && 'total_count' in dataArray[0]) {
            totalCount = Number(dataArray[0].total_count || 0);
          } else {
            // If no total_count, use the length as a fallback
            totalCount = dataArray.length;
          }
          
          // Apply client-side sorting if needed
          let processedData = Array.isArray(dataArray) ? [...dataArray] : [];
          
          if (sortBy && processedData.length > 0 && sortBy in processedData[0]) {
            processedData.sort((a, b) => {
              const aValue = a[sortBy as keyof typeof a];
              const bValue = b[sortBy as keyof typeof b];
              
              // Handle null/undefined values - always sort to the end
              if (aValue === null || aValue === undefined) return 1;
              if (bValue === null || bValue === undefined) return -1;
              
              // Handle different types appropriately
              if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
              }
              
              // Handle date strings in ISO format
              if (typeof aValue === 'string' && typeof bValue === 'string') {
                // Try to detect if these are date strings
                const aDate = aValue.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(aValue) : null;
                const bDate = bValue.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(bValue) : null;
                
                if (aDate && bDate && !isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                  return sortDirection === 'asc' 
                    ? aDate.getTime() - bDate.getTime() 
                    : bDate.getTime() - aDate.getTime();
                }
              }
              
              // Default string comparison (handles mixed non-numeric types)
              const aStr = String(aValue).toLowerCase();
              const bStr = String(bValue).toLowerCase();
              const comparison = aStr.localeCompare(bStr);
              return sortDirection === 'asc' ? comparison : -comparison;
            });
          }
          
          // Transform data using the provided mapper function
          const typedData = mapResultToType(processedData as RPCStudyData[]);
          
          logger.debug('Transformed study data', {
            input: processedData,
            output: typedData,
            totalCount
          });
          
          return {
            rows: typedData,
            totalCount
          };
        } catch (err) {
          // Comprehensive error handling
          logger.error(`Error in ${hookName}`, {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
          });
          
          throw err; // Re-throw for React Query to handle
        }
      },
      staleTime,
      gcTime: cacheTime,
      refetchOnWindowFocus
    });
    
    // Process the results - handle undefined/null data safely
    const processedData = data?.rows || [];
    const totalCount = data?.totalCount || 0;
    
    return {
      data: processedData,
      totalCount,
      loading: isLoading,
      error: error as Error | null,
      page,
      pageSize,
      hasMore: totalCount > (page + 1) * pageSize,
      refetch
    };
  };
}

/**
 * STANDARD HOOK IMPLEMENTATIONS
 * These use the factory to create consistent hooks for different study data needs
 */

/**
 * Hook for general studies with earliest/latest times
 * Uses get_study_list_with_earliest_latest RPC
 */
export const useStudiesWithTimes = createStudyHook<StudiesWithTimesRow>(
  'studiesWithTimes',
  'get_study_list_with_earliest_latest',
  (data: RPCStudyData[]) => {
    // Ensure we're working with an array
    if (!Array.isArray(data)) return [];
    
    // Transform the data to match StudiesWithTimesRow
    const transformedData = data.map(row => {
      const transformed = {
        study_id: row.study_id,
        clinic_id: row.clinic_id || '',
        clinic_name: row.clinic_name || '',
        pod_id: row.pod_id || '',
        pod_status: row.pod_status || row.status || 'unknown',
        user_id: row.user_id || '',
        study_type: row.study_type || 'holter',
        start_timestamp: row.start_timestamp || '',
        end_timestamp: row.end_timestamp || '',
        expected_end_timestamp: row.expected_end_timestamp || row.end_timestamp || '',
        earliest_time: row.earliest_time || '',
        latest_time: row.latest_time || '',
        duration: row.duration || row.total_hours || 0,
        total_hours: row.total_hours || 0,
        quality_hours: row.quality_hours || 0,
        total_count: row.total_count || 0,
        aggregated_quality_minutes: row.aggregated_quality_minutes || 0,
        aggregated_total_minutes: row.aggregated_total_minutes || 0,
        created_by: row.created_by || '',
        status: row.status || 'unknown',
        patient_id: row.patient_id || '',
        created_at: row.created_at || '',
        updated_at: row.updated_at || ''
      };

      // Add debug logging
      logger.debug('Data transformation', {
        input: row,
        output: transformed,
        missingFields: Object.keys(row).filter(k => !Object.prototype.hasOwnProperty.call(transformed, k))
      });

      return transformed as unknown as StudiesWithTimesRow;
    });

    return transformedData;
  },
  { 
    staleTime: 30000, 
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  }
);

/**
 * Helper function to convert string status to valid HolterStatus
 */
function toHolterStatus(status: string | undefined): HolterStatus {
  if (!status) return 'unknown';
  
  // Validate that the status is one of the allowed values
  switch(status) {
    case 'active':
    case 'error':
    case 'interrupted':
    case 'completed':
      return status;
    default:
      return 'unknown';
  }
}

/**
 * Hook specifically for Holter studies
 * Uses get_studies_with_pod_times or similar RPC
 */
export const useHolterStudies = createStudyHook<HolterStudy>(
  'holterStudies',
  'get_studies_with_pod_times', // Ensure this RPC exists
  (data: RPCStudyData[]) => {
    // Ensure we're working with an array
    if (!Array.isArray(data)) return [];
    
    // Transform raw data to HolterStudy objects
    // Using type assertion for simplicity after setting all required fields
    return data.map(row => {
      // Create the transformed object with all required fields
      const result = {
        // Essential fields from the row with defaults
        study_id: row.study_id,
        pod_id: row.pod_id || '',
        clinic_id: row.clinic_id || '',
        clinic_name: row.clinic_name || '',
        // Use toHolterStatus to ensure correct status value
        status: toHolterStatus(row.status),
        patient_id: row.patient_id || '',
        created_at: row.created_at || '',
        updated_at: row.updated_at || '',
        start_timestamp: row.start_timestamp || '',
        end_timestamp: row.end_timestamp || '',
        earliest_time: row.earliest_time || '',
        latest_time: row.latest_time || '',
        
        // Study-specific fields
        study_type: 'holter',
        duration: row.total_hours || 0,
        totalQualityHours: row.quality_hours || 0,
        expected_end_timestamp: row.end_timestamp || '',
        
        // Other required fields
        created_by: row.created_by || '',
        user_id: row.user_id || '',
        
        // Calculated metrics
        totalHours: row.total_hours || 0,
        qualityHours: row.quality_hours || 0,
        aggregated_quality_minutes: row.aggregated_quality_minutes || 0,
        aggregated_total_minutes: row.aggregated_total_minutes || 0,
        qualityFraction: row.quality_hours && row.total_hours 
          ? row.quality_hours / row.total_hours 
          : 0,
        daysRemaining: row.days_remaining || 0,
        interruptions: row.interruptions || 0,
        qualityVariance: row.quality_variance || 0
      };
      
      // Use type assertion to make TypeScript happy
      return result as unknown as HolterStudy;
    });
  }
);

// Export a single study details hook 
export function useStudyDetails(studyId: string | null) {
  return useQuery({
    queryKey: ['studyDetails', studyId],
    queryFn: async () => {
      if (!studyId) return null;
      
      try {
        const { data, error } = await supabase.rpc(
          'get_study_details_with_earliest_latest' as any,
          {
            p_study_id: studyId
          }
        );
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return null;
        }
        
        // Return the first row as the study details
        return data[0];
      } catch (err) {
        logger.error('Failed to fetch study details', { 
          studyId, 
          error: err instanceof Error ? err.message : String(err) 
        });
        throw err;
      }
    },
    enabled: !!studyId,
    staleTime: 60000 // 1 minute
  });
} 