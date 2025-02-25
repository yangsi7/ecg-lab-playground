import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import type { DataSet } from '@/types/domain/dataset';
import type { SortConfig, FilterConfig } from '../../../components/shared/DataGrid';

interface UseDatasetOptions {
  page: number;
  pageSize: number;
  sortConfig: SortConfig<DataSet>;
  filterConfig: FilterConfig;
  enabled?: boolean;
}

interface DatasetResponse {
  data: DataSet[];
  count: number;
}

export function useDatasets({
  page,
  pageSize,
  sortConfig,
  filterConfig,
  enabled = true
}: UseDatasetOptions) {
  const offset = (page - 1) * pageSize;

  return useQuery<DatasetResponse>({
    queryKey: ['datasets', { page, pageSize, sortConfig, filterConfig }],
    queryFn: async () => {
      let query = supabase
        .from('datasets')
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
          }
        });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as DataSet[],
        count: count ?? 0
      };
    },
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  });
} 