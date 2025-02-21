/**
 * Hook for advanced filtering functionality
 */
import { useState, useCallback } from 'react';
import { validateExpression, evaluateExpression } from '@/lib/utils/ExpressionParser';
import type { FilterExpression, FilterConfig, FilterState } from '@/types/filter';

const STORAGE_KEY = 'filterPresets';

export function useAdvancedFilter<T>(
  config: FilterConfig<T>,
  defaultQuickFilter = '',
  filterFn?: (items: T[], filter: string, expression: FilterExpression | null) => T[]
): FilterState<T> {
  const [quickFilter, setQuickFilter] = useState(defaultQuickFilter);
  const [expression, setExpressionValue] = useState<FilterExpression | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setExpression = useCallback((value: string) => {
    try {
      const parsedExpression = value ? validateExpression(value, config.fields) : null;
      setExpressionValue(parsedExpression);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid expression');
      setExpressionValue(null);
    }
  }, [config.fields]);

  const applyFilter = useCallback((items: T[]): T[] => {
    if (filterFn) {
      return filterFn(items, quickFilter, expression);
    }

    // Default filtering behavior if no filterFn provided
    return items.filter(item => {
      // Quick filter implementation
      const matchesQuickFilter = !quickFilter || Object.values(item as Record<string, unknown>).some(
        value => String(value).toLowerCase().includes(quickFilter.toLowerCase())
      );

      // Advanced filter implementation
      const matchesExpression = !expression || evaluateExpression(item, expression);

      return matchesQuickFilter && matchesExpression;
    });
  }, [quickFilter, expression, filterFn]);

  return {
    quickFilter,
    expression,
    error,
    setQuickFilter,
    setExpression,
    setError,
    applyFilter
  };
} 