import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { evaluateExpression, validateExpression } from '../../utils/ExpressionParser';

export type Column<T> = {
  field: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

export type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
};

type DataGridProps<T extends Record<string, any>> = {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  filterExpression?: string;
  onFilterError?: (error: Error) => void;
  className?: string;
};

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  filterExpression,
  onFilterError,
  className = '',
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Handle filtering
  const filteredData = useMemo(() => {
    if (!filterExpression?.trim()) return sortedData;

    try {
      if (!validateExpression(filterExpression)) {
        throw new Error('Invalid filter syntax');
      }

      return sortedData.filter(row => {
        try {
          return evaluateExpression(filterExpression, row);
        } catch (error) {
          if (error instanceof Error) {
            onFilterError?.(error);
          }
          return false;
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        onFilterError?.(error);
      }
      return sortedData;
    }
  }, [sortedData, filterExpression]);

  // Handle pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (field: keyof T) => {
    const column = columns.find(col => col.field === field);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.field !== field) {
        return { field: field as string, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { field: field as string, direction: 'desc' };
      }
      return null;
    });
  };

  const getSortIcon = (field: keyof T) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-500" /> : 
      <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column.field as string}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
                onClick={() => handleSort(column.field)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.field)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map(column => (
                <td
                  key={column.field as string}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render
                    ? column.render(row[column.field], row)
                    : row[column.field]?.toString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between w-full">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 