import { useQuery } from '@tanstack/react-query'
import { useTableStore } from '../store/tableStore'
import { supabase } from '../../lib/supabase'
import type { LabType } from '../store/tableStore'

export function useLabData(labType: LabType) {
  const { currentPage, pageSize, sortField, sortDirection, quickFilter } = useTableStore()
  
  const getTableName = (type: LabType) => {
    switch (type) {
      case 'holter':
        return 'study'
      case 'pod':
        return 'pod'
      case 'clinic':
        return 'clinics'
      default:
        throw new Error(`Invalid lab type: ${type}`)
    }
  }

  return useQuery({
    queryKey: [labType, { 
      page: currentPage, 
      pageSize, 
      sortField, 
      sortDirection, 
      filter: quickFilter 
    }],
    queryFn: async () => {
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize - 1

      let query = supabase
        .from(getTableName(labType))
        .select('*', { count: 'exact' })
        .range(start, end)

      if (sortField && sortDirection) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' })
      }

      if (quickFilter) {
        // Add filter logic here based on lab type
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data, count }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
