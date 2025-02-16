import { useLabData } from '../../hooks/useLabData'
import { useTableStore } from '../../store/tableStore'
import { LoadingSpinner } from '../shared/LoadingSpinner'

interface LabViewProps {
  labType: 'holter' | 'pod' | 'clinic'
  columns: Array<{key: string, label: string}>
}

export function LabView({ labType, columns }: LabViewProps) {
  const { data, isLoading, isError } = useLabData(labType)
  const { setPage, setSort, setFilter } = useTableStore()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div className="text-red-500">Error loading data</div>

  return (
    <div className="space-y-4">
      <input 
        type="text"
        placeholder="Filter records..."
        onChange={(e) => setFilter(e.target.value)}
        className="w-full p-2 border rounded"
      />
      
      <table className="min-w-full">
        {/* Table implementation */}
      </table>
      
      <Pagination 
        onPageChange={setPage}
        hasMore={data?.data.length === 20}
      />
    </div>
  )
}
