import { Link } from 'react-router-dom'
import { useClinicTableStats } from '@/hooks/api/clinic/useClinicData'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table'
import { ClinicTableStat } from '@/types/database.types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const columns: ColumnDef<ClinicTableStat>[] = [
  {
    accessorKey: 'clinic_name',
    header: 'Clinic',
    cell: ({ row }) => (
      <Link
        to={`/labs/clinic/${row.original.clinic_id}`}
        className="text-primary hover:text-primary/80 font-medium transition-colors"
      >
        {row.original.clinic_name}
      </Link>
    )
  },
  {
    accessorKey: 'total_studies',
    header: 'Studies',
    cell: ({ row }) => (
      <div className="flex gap-2 items-center">
        <span className="text-foreground/80">{row.original.total_studies}</span>
        <span className="text-muted-foreground text-sm">
          ({row.original.open_studies} open)
        </span>
      </div>
    )
  },
  {
    accessorKey: 'average_quality',
    header: 'Quality',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className={cn(
          'h-3 w-3 rounded-full',
          row.original.average_quality > 0.6 ? 'bg-green-400/90' :
          row.original.average_quality > 0.4 ? 'bg-amber-400/90' : 'bg-red-400/90'
        )} />
        <span className="font-medium">
          {(row.original.average_quality * 100).toFixed(1)}%
        </span>
      </div>
    )
  },
  {
    accessorKey: 'critical_count',
    header: 'Alerts',
    cell: ({ row }) => (
      <div className={cn(
        'px-2 py-1 rounded-full text-sm w-fit',
        row.original.critical_count > 0 
          ? 'bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : 'bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      )}>
        {row.original.critical_count} critical
      </div>
    )
  }
]

export default function ClinicList(): JSX.Element {
  const { data, isLoading, error } = useClinicTableStats()
  
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (error) return <div className="text-destructive">Error loading clinics</div>

  return (
    <div className="rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-[80%]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}