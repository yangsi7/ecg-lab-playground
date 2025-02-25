/**
 * src/components/shared/DataGrid.tsx
 * 
 * A flexible data grid component for displaying tabular data with sorting and pagination
 */

import React, { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface SortConfig<T = any> {
  key: keyof T | null;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  quickFilter?: string;
  columnFilters?: Array<{
    field: string;
    condition: {
      operator: string;
      value: any;
      value2?: any;
    }
  }>;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function DataGrid<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  sortKey,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  pagination,
  className = '',
}: DataGridProps<T>) {
  // Render sort indicator
  const renderSortIndicator = (columnKey: string) => {
    if (sortKey !== columnKey) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Handle header click for sorting
  const handleHeaderClick = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    onSort(column.key);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null;
    
    const { currentPage, totalPages, onPageChange } = pagination;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={`px-3 py-1 rounded text-sm ${
              currentPage <= 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={`px-3 py-1 rounded text-sm ${
              currentPage >= totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Render table content
  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-6 py-8 text-center">
            <div className="flex justify-center">
              <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-6 py-8 text-center text-red-500">
            Error: {error}
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return data.map((row) => (
      <tr
        key={keyExtractor(row)}
        className={`border-b border-gray-200 hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
        onClick={() => onRowClick && onRowClick(row)}
      >
        {columns.map((column) => (
          <td key={column.key} className={`px-6 py-4 ${column.className || ''}`}>
            {column.render(row)}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.className || ''}`}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {renderSortIndicator(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderTableContent()}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}
