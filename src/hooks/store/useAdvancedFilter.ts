import { useState, useCallback } from 'react';
import type { FilterState, FilterExpression } from '../../types/filter';

export function useAdvancedFilter<T>(
  defaultQuickFilter = '',
  filterFn?: (items: T[], filter: string, expression: FilterExpression | null) => T[]
): FilterState<T> {
  const [quickFilter, setQuickFilter] = useState(defaultQuickFilter);
  const [expression, setExpression] = useState<FilterExpression | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyFilter = useCallback((items: T[]): T[] => {
    if (filterFn) {
      return filterFn(items, quickFilter, expression);
    }

    // Default filtering behavior if no filterFn provided
    if (!quickFilter && !expression) return items;

    return items.filter(item => {
      // Quick filter implementation
      if (quickFilter) {
        const searchStr = quickFilter.toLowerCase();
        return Object.values(item as Record<string, unknown>).some(
          value => String(value).toLowerCase().includes(searchStr)
        );
      }

      // Advanced filter implementation
      if (expression) {
        const evaluateExpression = (expr: FilterExpression): boolean => {
          const value = (item as Record<string, unknown>)[expr.field];
          
          switch (expr.operator) {
            case '=':
              return value === expr.value;
            case '!=':
              return value !== expr.value;
            case '>':
              return Number(value) > Number(expr.value);
            case '<':
              return Number(value) < Number(expr.value);
            case '>=':
              return Number(value) >= Number(expr.value);
            case '<=':
              return Number(value) <= Number(expr.value);
            case 'contains':
              return String(value).toLowerCase().includes(String(expr.value).toLowerCase());
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(expr.value).toLowerCase());
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(expr.value).toLowerCase());
            default:
              return false;
          }
        };

        if (expression.expressions && expression.combinator) {
          return expression.expressions.reduce((acc, expr) => {
            const result = evaluateExpression(expr);
            return expression.combinator === 'AND' ? acc && result : acc || result;
          }, expression.combinator === 'AND');
        }

        return evaluateExpression(expression);
      }

      return true;
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