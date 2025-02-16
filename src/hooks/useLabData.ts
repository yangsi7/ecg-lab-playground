import { useQuery } from '@tanstack/react-query'
import { useTableStore } from '../store/tableStore'

export function useLabData(labType: 'holter' | 'pod' | 'clinic') {
  const { page, pageSize, sortKey, sortDir, filter } = useTableStore()
  
  return useQuery({
    queryKey: [labType, { page, pageSize, sortKey, sortDir, filter }],
    queryFn: async () => {
      const query = supabase
        .from(`${labType}_records`)
        .select('*', { count: 'exact' })
        
      if (sortKey) {
        query.order(sortKey, { ascending: sortDir === 'asc' })
      }
      
      if (filter) {
        query.ilike('study_id', `%${filter}%`)
      }
      
      const start = (page - 1) * pageSize
      query.range(start, start + pageSize - 1)
      
      const { data, error, count } = await query
      if (error) throw error
      return { data, count }
    },
    keepPreviousData: true
  })
}
