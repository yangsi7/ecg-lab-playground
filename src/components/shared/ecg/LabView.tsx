import { useLabData } from '../../../hooks/api/useLabData'
import { useTableStore } from '../../../hooks/store/tableStore'
import { LoadingSpinner } from '../LoadingSpinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ClinicRow, PodRow, StudyRow } from '../../../lib/supabase/client'

interface PaginationProps {
  onPageChange: (page: number) => void
  hasMore: boolean
  currentPage?: number
}

function Pagination({ onPageChange, hasMore, currentPage = 1 }: PaginationProps) {
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <span className="text-sm text-gray-400">Page {currentPage}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
        className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

interface LabViewProps {
  labType: 'holter' | 'pod' | 'clinic'
  columns: Array<{key: string, label: string}>
}

type LabDataRow = StudyRow | PodRow | ClinicRow

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return JSON.stringify(value)
}

export function LabView({ labType, columns }: LabViewProps) {
  const { data, isLoading, isError } = useLabData(labType)
  const { currentPage, setPage, setSort, setQuickFilter } = useTableStore()

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div className="text-red-500">Error loading data</div>

  return (
    <div className="space-y-4">
      <input 
        type="text"
        placeholder="Filter records..."
        onChange={(e) => setQuickFilter(e.target.value)}
        className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500"
      />
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => setSort(key, 'asc')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data?.data.map((row: LabDataRow, idx) => (
              <tr key={idx} className="hover:bg-white/5">
                {columns.map(({ key }) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatValue(row[key as keyof LabDataRow])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Pagination 
        onPageChange={setPage}
        hasMore={data?.data.length === 20}
        currentPage={currentPage}
      />
    </div>
  )
}
