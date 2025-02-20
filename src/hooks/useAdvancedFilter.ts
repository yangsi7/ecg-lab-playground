import { useState, useCallback, useMemo } from 'react';
import type { FilterExpression, FilterField, FilterConfig } from '../types/filter';
import { parseExpression } from '../lib/utils/ExpressionParser';

export interface UseAdvancedFilterProps<T> {
  defaultQuickFilter?: string;
  config: FilterConfig<T>;
  filterFn?: (item: T, quickFilter: string, expression: FilterExpression | null) => boolean;
}

export interface UseAdvancedFilterResult<T> {
  quickFilter: string;
  expression: FilterExpression | null;
  error: string | null;
  setQuickFilter: (value: string) => void;
  setExpression: (value: string) => void;
  clearFilters: () => void;
  filterItems: (items: T[]) => T[];
}

export function useAdvancedFilter<T extends Record<string, unknown>>({
  defaultQuickFilter = '',
  config,
  filterFn
}: UseAdvancedFilterProps<T>): UseAdvancedFilterResult<T> {
  const [quickFilter, setQuickFilter] = useState(defaultQuickFilter);
  const [expression, setExpressionValue] = useState<FilterExpression | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default filter function if none provided
  const defaultFilterFn = useCallback(
    (item: T, quickFilter: string, expression: FilterExpression | null) => {
      const matchesQuickFilter = quickFilter === '' || 
        Object.values(item).some(
          value => String(value).toLowerCase().includes(quickFilter.toLowerCase())
        );

      if (!expression) return matchesQuickFilter;

      const itemValue = item[expression.field];
      
      switch (expression.operator) {
        case '=':
          return itemValue === expression.value && matchesQuickFilter;
        case '!=':
          return itemValue !== expression.value && matchesQuickFilter;
        case '>':
          return (itemValue as number | Date) > expression.value && matchesQuickFilter;
        case '<':
          return (itemValue as number | Date) < expression.value && matchesQuickFilter;
        case '>=':
          return (itemValue as number | Date) >= expression.value && matchesQuickFilter;
        case '<=':
          return (itemValue as number | Date) <= expression.value && matchesQuickFilter;
        case 'contains':
          return String(itemValue).toLowerCase().includes(String(expression.value).toLowerCase()) && matchesQuickFilter;
        case 'startsWith':
          return String(itemValue).toLowerCase().startsWith(String(expression.value).toLowerCase()) && matchesQuickFilter;
        case 'endsWith':
          return String(itemValue).toLowerCase().endsWith(String(expression.value).toLowerCase()) && matchesQuickFilter;
        default:
          return matchesQuickFilter;
      }
    },
    []
  );

  const setExpression = useCallback(
    (value: string) => {
      try {
        const parsedExpression = value ? parseExpression(value, config.fields) : null;
        setExpressionValue(parsedExpression);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid expression');
        setExpressionValue(null);
      }
    },
    [config.fields]
  );

  const clearFilters = useCallback(() => {
    setQuickFilter('');
    setExpressionValue(null);
    setError(null);
  }, []);

  const filterItems = useCallback(
    (items: T[]) => {
      return items.filter(item => 
        (filterFn || defaultFilterFn)(item, quickFilter, expression)
      );
    },
    [quickFilter, expression, filterFn, defaultFilterFn]
  );

  return {
    quickFilter,
    expression,
    error,
    setQuickFilter,
    setExpression,
    clearFilters,
    filterItems
  };
} 