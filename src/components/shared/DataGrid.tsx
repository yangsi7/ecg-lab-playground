import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'datetime' | 'time' | 'array';
  filterOptions?: { label: string; value: string | number | boolean }[];
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export type FilterOperator = 
  | 'equals' 
  | 'notEquals'
  | 'contains' 
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'gt' 
  | 'lt' 
  | 'gte' 
  | 'lte' 
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'isEmpty'
  | 'isNotEmpty';

export interface FilterCondition {
  operator: FilterOperator;
  value: string | number | boolean | (string | number)[];
  value2?: string | number; // For 'between' operator
}

export interface ColumnFilter {
  field: string;
  condition: FilterCondition;
}

export interface FilterConfig {
  expression?: string;
  quickFilter?: string;
  columnFilters?: ColumnFilter[];
}

export type PaginationMode = 'client' | 'server';
export type FilterMode = 'client' | 'server';
export type SortMode = 'client' | 'server';

export interface DataGridProps<T> {
  // Data & Display
  data: T[];
  columns: Column<T>[];
  className?: string;
  
  // Mode Configuration
  paginationMode?: PaginationMode;
  filterMode?: FilterMode;
  sortMode?: SortMode;
  
  // Sorting
  defaultSortKey?: keyof T;
  onSort?: (config: SortConfig<T>) => void;
  
  // Filtering
  filterExpression?: string;
  quickFilter?: string;
  onFilterChange?: (config: FilterConfig) => void;
  onFilterError?: (error: Error) => void;
  
  // Pagination
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  hasMore?: boolean;
  totalCount?: number;
  
  // Loading & Error States
  loading?: boolean;
  error?: string | null;
}

export function DataGrid<T extends Record<string, any>>({
  // Data & Display
  data,
  columns,
  className = '',
  
  // Mode Configuration
  paginationMode = 'client',
  filterMode = 'client',
  sortMode = 'client',
  
  // Sorting
  defaultSortKey,
  onSort,
  
  // Filtering
  filterExpression,
  quickFilter,
  onFilterChange,
  onFilterError,
  
  // Pagination
  page = 1,
  pageSize = 25,
  onPageChange,
  hasMore,
  totalCount,
  
  // Loading & Error States
  loading,
  error
}: DataGridProps<T>) {
  // Internal state for client-side operations
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: defaultSortKey || null,
    direction: 'asc',
  });
  
  const [internalFilter, setInternalFilter] = useState<FilterConfig>({
    expression: filterExpression,
    quickFilter
  });

  // Add state for column filters
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  // Handle sorting
  const handleSort = (key: keyof T) => {
    const newConfig: SortConfig<T> = {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    };
    
    setSortConfig(newConfig);
    if (sortMode === 'server' && onSort) {
      onSort(newConfig);
    }
  };

  // Handle filtering
  const handleFilterChange = (newFilter: Partial<FilterConfig>) => {
    const updatedFilter = { ...internalFilter, ...newFilter };
    setInternalFilter(updatedFilter);
    if (filterMode === 'server' && onFilterChange) {
      onFilterChange(updatedFilter);
    }
  };

  // Handle column filter change
  const handleColumnFilterChange = (field: string, condition: FilterCondition) => {
    const newFilters = columnFilters.filter(f => f.field !== field);
    newFilters.push({ field, condition });
    setColumnFilters(newFilters);
    
    if (filterMode === 'server' && onFilterChange) {
      onFilterChange({
        ...internalFilter,
        columnFilters: newFilters
      });
    }
  };

  // Process data for client-side operations
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply client-side filtering if enabled
    if (filterMode === 'client') {
      if (internalFilter.quickFilter) {
        result = result.filter(item => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(internalFilter.quickFilter!.toLowerCase())
          )
        );
      }

      if (internalFilter.expression) {
        try {
          // This is where we'd use the expression parser
          // TODO: Implement expression parsing for client-side filtering
        } catch (err) {
          if (onFilterError && err instanceof Error) {
            onFilterError(err);
          }
        }
      }

      // Apply column filters
      if (columnFilters.length > 0) {
        result = result.filter(item => 
          columnFilters.every(filter => {
            const value = item[filter.field];
            const { operator, value: filterValue, value2 } = filter.condition;
            
            switch (operator) {
              case 'equals':
                return value === filterValue;
              case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
              case 'gt':
                return Number(value) > Number(filterValue);
              case 'lt':
                return Number(value) < Number(filterValue);
              case 'gte':
                return Number(value) >= Number(filterValue);
              case 'lte':
                return Number(value) <= Number(filterValue);
              case 'between':
                return Number(value) >= Number(filterValue) && Number(value) <= Number(value2);
              default:
                return true;
            }
          })
        );
      }
    }

    // Apply client-side sorting if enabled
    if (sortMode === 'client' && sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === null) return 0;
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
          const aStr = String(aValue);
          const bStr = String(bValue);
          return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        }
      });
    }

    // Apply client-side pagination if enabled
    if (paginationMode === 'client') {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      result = result.slice(start, end);
    }

    return result;
  }, [data, sortConfig, internalFilter, columnFilters, sortMode, filterMode, paginationMode, page, pageSize]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-red-400">Error loading data</h3>
        <p className="mt-1 text-sm text-red-300">{error}</p>
      </div>
    );
  }

  // Add new helper function for getting available operators by filter type
  function getOperatorsByFilterType(filterType: Column<any>['filterType']): FilterOperator[] {
    switch (filterType) {
      case 'text':
        return ['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'endsWith', 'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'];
      case 'number':
        return ['equals', 'notEquals', 'gt', 'lt', 'gte', 'lte', 'between', 'isNull', 'isNotNull'];
      case 'select':
        return ['equals', 'notEquals', 'in', 'notIn', 'isNull', 'isNotNull'];
      case 'boolean':
        return ['equals', 'isNull', 'isNotNull'];
      case 'date':
      case 'datetime':
      case 'time':
        return ['equals', 'notEquals', 'gt', 'lt', 'gte', 'lte', 'between', 'isNull', 'isNotNull'];
      case 'array':
        return ['contains', 'notContains', 'isEmpty', 'isNotEmpty'];
      default:
        return ['equals', 'notEquals', 'contains', 'notContains'];
    }
  }

  // Add new helper function for operator labels
  function getOperatorLabel(operator: FilterOperator): string {
    const labels: Record<FilterOperator, string> = {
      equals: 'Equals',
      notEquals: 'Not Equals',
      contains: 'Contains',
      notContains: 'Does Not Contain',
      startsWith: 'Starts With',
      endsWith: 'Ends With',
      gt: 'Greater Than',
      lt: 'Less Than',
      gte: 'Greater Than or Equal',
      lte: 'Less Than or Equal',
      between: 'Between',
      in: 'In',
      notIn: 'Not In',
      isNull: 'Is Null',
      isNotNull: 'Is Not Null',
      isEmpty: 'Is Empty',
      isNotEmpty: 'Is Not Empty'
    };
    return labels[operator];
  }

  // Update the filter UI component
  function FilterUI<T>({
    column,
    onFilterChange,
    currentFilter
  }: {
    column: Column<T>;
    onFilterChange: (filter: ColumnFilter) => void;
    currentFilter?: ColumnFilter;
  }) {
    const [operator, setOperator] = useState<FilterOperator>(
      currentFilter?.condition.operator ?? 'equals'
    );
    const [value, setValue] = useState<string | number | boolean>(
      currentFilter?.condition.value ?? ''
    );
    const [value2, setValue2] = useState<string | number | undefined>(
      currentFilter?.condition.value2
    );

    const operators = getOperatorsByFilterType(column.filterType);

    const handleApplyFilter = () => {
      if (!operator) return;

      // Skip value for certain operators
      const skipValueOperators: FilterOperator[] = ['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'];
      if (skipValueOperators.includes(operator) || value !== '') {
        onFilterChange({
          field: String(column.key),
          condition: {
            operator,
            value: operator === 'in' || operator === 'notIn' 
              ? (value as string).split(',').map(v => 
                  column.filterType === 'number' ? Number(v.trim()) : v.trim()
                )
              : value,
            ...(operator === 'between' && value2 !== undefined && { value2 })
          }
        });
      }
    };

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span>{column.header}</span>
          <button
            onClick={handleApplyFilter}
            className="p-1 rounded-md transition text-gray-400 hover:text-white hover:bg-white/10"
          >
            <Filter className="h-3 w-3" />
          </button>
        </div>
        {/* Filter UI based on column.filterType */}
        {/* ... */}
      </div>
    );
  }

  // Column header with filter UI
  const renderColumnHeader = (column: Column<T>) => {
    if (!column.filterable) {
      return column.header;
    }

    const isFilterActive = columnFilters.some(f => f.field === column.key);
    const currentFilter = columnFilters.find(f => f.field === column.key);

    return (
      <div className="flex items-center justify-between gap-2">
        <span>{column.header}</span>
        <button
          onClick={() => setActiveFilterColumn(activeFilterColumn === column.key ? null : String(column.key))}
          className={`p-1 rounded-md transition ${
            isFilterActive ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Filter className="h-3 w-3" />
        </button>
        {activeFilterColumn === column.key && (
          <div className="absolute top-full mt-2 right-0 bg-gray-800 rounded-lg border border-white/10 shadow-lg z-10">
            <FilterUI
              column={column}
              onFilterChange={handleColumnFilterChange}
              currentFilter={currentFilter}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Filter Input */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={internalFilter.quickFilter || ''}
          onChange={(e) => handleFilterChange({ quickFilter: e.target.value })}
          placeholder="Quick filter..."
          className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white w-full"
        />
      </div>

      {/* Advanced Filter Input */}
      {filterExpression !== undefined && (
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={internalFilter.expression || ''}
            onChange={(e) => handleFilterChange({ expression: e.target.value })}
            placeholder="Advanced filter expression..."
            className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white w-full font-mono text-sm"
          />
        </div>
      )}

      {/* Active Filters Display */}
      {columnFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {columnFilters.map(filter => (
            <div
              key={filter.field}
              className="flex items-center gap-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
            >
              <span>{columns.find(c => c.key === filter.field)?.header}: {filter.condition.operator} {filter.condition.value}</span>
              <button
                onClick={() => handleColumnFilterChange(filter.field, filter.condition)}
                className="p-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Data Grid */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((column) => (
                  <th
                    key={column.key as string}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase"
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-white transition"
                      >
                        {renderColumnHeader(column)}
                        {sortConfig.key === column.key && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </button>
                    ) : (
                      renderColumnHeader(column)
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedData.map((item, index) => (
                <tr key={index} className="hover:bg-white/5 transition-all duration-200 ease-in-out">
                  {columns.map((column) => (
                    <td key={column.key as string} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {column.render 
                        ? column.render(item[column.key], item)
                        : item[column.key] !== null && item[column.key] !== undefined 
                          ? String(item[column.key]) 
                          : '-'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {onPageChange && (
          <div className="flex justify-between items-center p-4 border-t border-white/10">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <div className="text-sm text-gray-400">
              <span>Page {page}</span>
              {totalCount !== undefined && (
                <span> of {Math.ceil(totalCount / pageSize)}</span>
              )}
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
