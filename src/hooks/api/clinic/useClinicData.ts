import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import type { Clinic } from '@/types/domain/clinic';
import { toClinic } from '@/types/domain/clinic';
import type { SortConfig, FilterConfig } from '@/components/shared/DataGrid';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface UseClinicDataOptions {
  page: number;
  pageSize: number;
  sortConfig: SortConfig<Clinic>;
  filterConfig: FilterConfig;
  enabled?: boolean;
  withRealtime?: boolean;
}

interface ClinicDataResponse {
  data: Clinic[];
  count: number;
}

/**
 * Hook for querying clinic data with filtering, sorting, pagination and optional real-time updates
 */
export function useClinicData({
  page,
  pageSize,
  sortConfig,
  filterConfig,
  enabled = true,
  withRealtime = false
}: UseClinicDataOptions) {
  const queryClient = useQueryClient();
  const offset = (page - 1) * pageSize;

  // Set up the main query
  const query = useQuery<ClinicDataResponse>({
    queryKey: ['clinics', { page, pageSize, sortConfig, filterConfig }],
    queryFn: async () => {
      let query = supabase
        .from('clinics')
        .select('*', { count: 'exact' });

      // Apply sorting
      if (sortConfig.key) {
        query = query.order(sortConfig.key as string, {
          ascending: sortConfig.direction === 'asc'
        });
      }

      // Apply filtering
      if (filterConfig.quickFilter) {
        query = query.or(`name.ilike.%${filterConfig.quickFilter}%,id.ilike.%${filterConfig.quickFilter}%`);
      }

      if (filterConfig.columnFilters?.length) {
        filterConfig.columnFilters.forEach(filter => {
          const { field, condition } = filter;
          const { operator, value, value2 } = condition;

          switch (operator) {
            case 'equals':
              query = query.eq(field, value);
              break;
            case 'contains':
              query = query.ilike(field, `%${value}%`);
              break;
            case 'gt':
              query = query.gt(field, value);
              break;
            case 'lt':
              query = query.lt(field, value);
              break;
            case 'gte':
              query = query.gte(field, value);
              break;
            case 'lte':
              query = query.lte(field, value);
              break;
            case 'between':
              if (value2 !== undefined) {
                query = query.gte(field, value).lte(field, value2);
              }
              break;
            case 'isTrue':
              query = query.eq(field, true);
              break;
            case 'isFalse':
              query = query.eq(field, false);
              break;
          }
        });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform database rows to domain types
      const clinics = (data || []).map(row => toClinic(row));

      return {
        data: clinics,
        count: count ?? 0
      };
    },
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  });

  // Set up real-time subscription if enabled
  useEffect(() => {
    if (!withRealtime) return;

    // Create a real-time subscription channel
    const channel = supabase
      .channel('clinics-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'clinics' }, 
          () => {
            // When any change happens, invalidate the query cache
            logger.debug('Real-time update received for clinics table');
            queryClient.invalidateQueries({ queryKey: ['clinics'] });
          })
      .subscribe();

    // Clean up the subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [withRealtime, queryClient]);

  // Create a mutation for updating the VIP status
  const updateVipStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { data, error } = await supabase
        .rpc('update_clinic_vip_status', { 
          p_clinic_id: id, 
          p_vip_status: status 
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    }
  });

  return {
    ...query,
    updateVipStatus
  };
} 