import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClinicTableStats } from '@/hooks/api/clinic/useClinicData'
import type { ClinicTableFilter } from '@/hooks/api/clinic/useClinicData'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { type ClinicStatsRow } from '@/types/domain/clinic'
import { cn } from '@/lib/utils'
import { Search, SlidersHorizontal } from 'lucide-react'

// Simple UI component implementations
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`}></div>
);

// Simple UI components instead of importing from the component library
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`px-3 py-2 rounded-md border ${props.className || ''}`} />
);

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'default' | 'outline' | 'ghost',
  size?: 'default' | 'sm' | 'lg' | 'icon' 
}) => (
  <button 
    {...props} 
    className={`px-4 py-2 rounded-md ${
      variant === 'outline' ? 'border border-gray-300' : 
      variant === 'ghost' ? 'bg-transparent hover:bg-gray-100' : 
      'bg-primary text-white'
    } ${
      size === 'sm' ? 'text-sm px-3 py-1' :
      size === 'lg' ? 'text-lg px-6 py-3' :
      size === 'icon' ? 'p-2 aspect-square' : ''
    } ${className || ''}`}
  >
    {children}
  </button>
);

// Simplified Card components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`border rounded-lg ${className || ''}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 ${className || ''}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-xl font-semibold ${className || ''}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 ${className || ''}`}>{children}</div>
);

// Simplified Badge
const Badge = ({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode, 
  variant?: 'default' | 'secondary', 
  className?: string 
}) => (
  <span className={`px-2 py-1 text-xs rounded-full ${
    variant === 'secondary' ? 'bg-gray-100' : 'bg-primary/10 text-primary'
  } ${className || ''}`}>
    {children}
  </span>
);

// Simplified Select components
const Select = ({ children, value, onValueChange }: { 
  children: React.ReactNode, 
  value?: string, 
  onValueChange: (value: string) => void 
}) => (
  <div className="relative">
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)} 
      className="w-full border rounded-md px-3 py-2"
    >
      {children}
    </select>
  </div>
);

const SelectTrigger = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={className || ''}>{children}</div>
);

const SelectValue = ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>;

const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SelectItem = ({ children, value }: { children: React.ReactNode, value: string }) => (
  <option value={value}>{children}</option>
);

// Simplified Slider
const Slider = ({ 
  min, 
  max, 
  step, 
  defaultValue, 
  value, 
  onValueChange,
  className = ''
}: { 
  min: number, 
  max: number, 
  step: number, 
  defaultValue?: number[], 
  value: number[], 
  onValueChange: (value: number[]) => void,
  className?: string
}) => (
  <div className={`py-2 ${className || ''}`}>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value[0]} 
      onChange={(e) => onValueChange([parseFloat(e.target.value), value[1]])}
      className="w-full"
    />
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value[1]} 
      onChange={(e) => onValueChange([value[0], parseFloat(e.target.value)])}
      className="w-full mt-2"
    />
  </div>
);

const columns: ColumnDef<ClinicStatsRow>[] = [
  {
    accessorKey: 'clinic_name',
    header: 'Clinic',
    cell: ({ row }) => (
      <Link 
        to={`/labs/clinic/${row.original.clinic_id}`} 
        className="font-medium hover:underline"
      >
        {row.getValue('clinic_name')}
      </Link>
    ),
  },
  {
    accessorKey: 'totalActiveStudies',
    header: 'Total Studies',
    cell: ({ row }) => row.getValue('totalActiveStudies'),
  },
  {
    accessorKey: 'onTargetCount',
    header: 'On Target',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue('onTargetCount')}
      </Badge>
    ),
  },
  {
    accessorKey: 'monitorCount',
    header: 'Monitor',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue('monitorCount')}
      </Badge>
    ),
  },
  {
    accessorKey: 'interveneCount',
    header: 'Intervene',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue('interveneCount')}
      </Badge>
    ),
  },
  {
    accessorKey: 'averageQuality',
    header: 'Avg. Quality',
    cell: ({ row }) => {
      const quality = row.getValue('averageQuality') as number
      return (
        <div className="flex items-center">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
            <div 
              className={cn(
                "h-full",
                quality >= 80 ? "bg-green-500" : 
                quality >= 60 ? "bg-yellow-500" : 
                "bg-red-500"
              )}
              style={{ width: `${quality}%` }}
            />
          </div>
          <span>{quality.toFixed(1)}%</span>
        </div>
      )
    },
  },
]

export default function ClinicList(): JSX.Element {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'averageQuality', desc: true }
  ])
  
  const [filters, setFilters] = useState<ClinicTableFilter>({
    search: '',
    status: 'all',
    qualityRange: [0, 100]
  })
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  const { data, isLoading, error } = useClinicTableStats(filters)
  
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleStatusChange = (value: string) => {
    const status = value as 'all' | 'on_target' | 'monitor' | 'intervene'
    setFilters(prev => ({ ...prev, status }))
  }

  const handleQualityRangeChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, qualityRange: value }))
  }

  const qualityMin = filters.qualityRange?.[0] ?? 0
  const qualityMax = filters.qualityRange?.[1] ?? 100

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Clinics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Basic Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search clinics..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(showAdvancedFilters && "bg-gray-100")}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="text-sm mb-1 block">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="on_target">On Target</SelectItem>
                      <SelectItem value="monitor">Monitor</SelectItem>
                      <SelectItem value="intervene">Intervene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm mb-1 block">Quality Range ({qualityMin}% - {qualityMax}%)</label>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={filters.qualityRange ?? [0, 100]}
                    onValueChange={handleQualityRangeChange}
                  />
                </div>
              </div>
            )}
            
            {/* Table */}
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-gray-50">
                      {headerGroup.headers.map((header) => (
                        <th 
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-medium text-gray-600"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                "flex items-center",
                                header.column.getCanSort() && "cursor-pointer select-none"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-5 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td 
                        colSpan={columns.length} 
                        className="px-4 py-6 text-center text-red-500"
                      >
                        Error loading clinic data
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={columns.length} 
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No clinics found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr 
                        key={row.id} 
                        className="border-b hover:bg-gray-50"
                      >
                        {row.getVisibleCells().map((cell) => (
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
        </CardContent>
      </Card>
    </div>
  )
}