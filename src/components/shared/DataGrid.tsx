import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  label?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: keyof T;
  pageSize?: number;
  filterExpression?: string;
  onFilterError?: (error: Error) => void;
  className?: string;
  loading?: boolean;
  error?: string | null;
  page?: number;
  onPageChange?: (page: number) => void;
  hasMore?: boolean;
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  defaultSortKey,
  pageSize = 25,
  filterExpression,
  onFilterError,
  className = '',
  loading,
  error,
  page = 1,
  onPageChange,
  hasMore
}: DataGridProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({
    key: defaultSortKey || null,
    direction: 'asc',
  });

  const handleSort = (key: keyof T) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
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
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-red-400">Error loading data</h3>
        <p className="mt-1 text-sm text-red-300">{error}</p>
      </div>
    );
  }

  return (
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
                      {column.header}
                      {sortConfig.key === column.key && (
                        sortConfig.direction === 'asc'
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedData.map((item, index) => (
              <tr key={index} className="hover:bg-white/5 transition-all duration-200 ease-in-out">
                {columns.map((column) => (
                  <td key={column.key as string} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {column.render ? column.render(item[column.key], item) : item[column.key] !== null && item[column.key] !== undefined ? String(item[column.key]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-400">Page {page}</span>
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
  );
}
