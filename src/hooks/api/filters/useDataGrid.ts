import { useState, useCallback, useRef } from 'react';
import type { SortConfig, FilterConfig, FilterCondition, ColumnFilter } from '@/components/shared/DataGrid';

interface UseDataGridConfig<T> {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSort?: SortConfig<T>;
  defaultFilter?: FilterConfig;
  onStateChange?: (state: UseDataGridState<T>) => void;
  maxFilterHistory?: number;
}

export interface UseDataGridState<T> {
  page: number;
  pageSize: number;
  sortConfig: SortConfig<T>;
  filterConfig: FilterConfig;
}

interface FilterHistoryEntry {
  filterConfig: FilterConfig;
  timestamp: number;
}

export function useDataGrid<T>({
  defaultPage = 1,
  defaultPageSize = 25,
  defaultSort = { key: null, direction: 'asc' },
  defaultFilter = { quickFilter: '', expression: '', columnFilters: [] },
  onStateChange,
  maxFilterHistory = 10
}: UseDataGridConfig<T> = {}) {
  // State
  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(defaultSort);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(defaultFilter);
  
  // Filter history
  const [filterHistory, setFilterHistory] = useState<FilterHistoryEntry[]>([
    { filterConfig: defaultFilter, timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Validation
  const validateFilterCondition = useCallback((condition: FilterCondition): Error | null => {
    const { operator, value, value2 } = condition;

    // Validate operator
    if (!['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'between'].includes(operator)) {
      return new Error(`Invalid operator: ${operator}`);
    }

    // Validate values based on operator
    if (operator === 'between') {
      if (value2 === undefined) {
        return new Error('Second value is required for "between" operator');
      }
      if (typeof value !== typeof value2) {
        return new Error('Both values must be of the same type for "between" operator');
      }
    }

    // Validate numeric operators
    if (['gt', 'lt', 'gte', 'lte'].includes(operator)) {
      if (typeof value !== 'number') {
        return new Error(`Operator "${operator}" requires numeric values`);
      }
    }

    return null;
  }, []);

  const validateColumnFilter = useCallback((filter: ColumnFilter): Error | null => {
    if (!filter.field) {
      return new Error('Filter field is required');
    }

    return validateFilterCondition(filter.condition);
  }, [validateFilterCondition]);

  // Add to history
  const addToHistory = useCallback((newFilter: FilterConfig) => {
    setFilterHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        filterConfig: newFilter,
        timestamp: Date.now()
      });
      
      // Keep only the last maxFilterHistory entries
      if (newHistory.length > maxFilterHistory) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxFilterHistory - 1));
  }, [historyIndex, maxFilterHistory]);

  // Enhanced filter change handler
  const handleFilterChange = useCallback((newFilterConfig: FilterConfig) => {
    // Validate column filters
    if (newFilterConfig.columnFilters) {
      for (const filter of newFilterConfig.columnFilters) {
        const error = validateColumnFilter(filter);
        if (error) {
          console.error('Filter validation error:', error);
          return;
        }
      }
    }

    setFilterConfig(newFilterConfig);
    addToHistory(newFilterConfig);
    setPage(1); // Reset to first page when filter changes
    
    onStateChange?.({
      page: 1,
      pageSize,
      sortConfig,
      filterConfig: newFilterConfig
    });
  }, [pageSize, sortConfig, onStateChange, validateColumnFilter, addToHistory]);

  // History navigation
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < filterHistory.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const historicFilter = filterHistory[newIndex].filterConfig;
    setFilterConfig(historicFilter);
    
    onStateChange?.({
      page,
      pageSize,
      sortConfig,
      filterConfig: historicFilter
    });
  }, [canUndo, historyIndex, filterHistory, page, pageSize, sortConfig, onStateChange]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    const historicFilter = filterHistory[newIndex].filterConfig;
    setFilterConfig(historicFilter);
    
    onStateChange?.({
      page,
      pageSize,
      sortConfig,
      filterConfig: historicFilter
    });
  }, [canRedo, historyIndex, filterHistory, page, pageSize, sortConfig, onStateChange]);

  // Callbacks
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    onStateChange?.({
      page: newPage,
      pageSize,
      sortConfig,
      filterConfig
    });
  }, [pageSize, sortConfig, filterConfig, onStateChange]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    onStateChange?.({
      page: 1,
      pageSize: newPageSize,
      sortConfig,
      filterConfig
    });
  }, [sortConfig, filterConfig, onStateChange]);

  const handleSortChange = useCallback((newSortConfig: SortConfig<T>) => {
    setSortConfig(newSortConfig);
    onStateChange?.({
      page,
      pageSize,
      sortConfig: newSortConfig,
      filterConfig
    });
  }, [page, pageSize, filterConfig, onStateChange]);

  const handleFilterError = useCallback((error: Error) => {
    console.error('Filter Error:', error);
  }, []);

  return {
    // State
    page,
    pageSize,
    sortConfig,
    filterConfig,

    // Handlers
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onSortChange: handleSortChange,
    onFilterChange: handleFilterChange,
    onFilterError: handleFilterError,

    // Filter history
    canUndo,
    canRedo,
    undo,
    redo,
    filterHistory,

    // Reset helpers
    resetPage: () => handlePageChange(1),
    resetSort: () => handleSortChange(defaultSort),
    resetFilters: () => handleFilterChange(defaultFilter),
    resetAll: () => {
      handlePageChange(1);
      handlePageSizeChange(defaultPageSize);
      handleSortChange(defaultSort);
      handleFilterChange(defaultFilter);
    }
  };
} 