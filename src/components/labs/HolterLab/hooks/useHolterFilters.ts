import { useState, useCallback } from 'react';
import { evaluateExpression } from '../../../../lib/utils/ExpressionParser';
import type { HolterStudy } from '../../../../types/domain/holter';

export type QuickFilterId = 'all' | 'recent' | 'low-quality' | 'high-quality';

interface UseHolterFiltersResult {
  quickFilter: QuickFilterId | undefined;
  advancedFilter: string;
  setQuickFilter: (id: QuickFilterId | undefined) => void;
  setAdvancedFilter: (expression: string) => void;
  filterStudies: (studies: HolterStudy[]) => HolterStudy[];
}

const QUICK_FILTER_EXPRESSIONS: Record<QuickFilterId, string> = {
  'all': '',
  'recent': 'created_at > now() - interval "7 days"',
  'low-quality': 'qualityFraction < 0.8',
  'high-quality': 'qualityFraction >= 0.8'
};

export function useHolterFilters(): UseHolterFiltersResult {
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>();
  const [advancedFilter, setAdvancedFilter] = useState('');

  const filterStudies = useCallback((studies: HolterStudy[]): HolterStudy[] => {
    // If no filters are active or 'all' is selected, return all studies
    if ((!quickFilter && !advancedFilter.trim()) || quickFilter === 'all') {
      return studies;
    }

    // Combine quick filter and advanced filter expressions
    const expressions: string[] = [];
    if (quickFilter && QUICK_FILTER_EXPRESSIONS[quickFilter]) {
      expressions.push(QUICK_FILTER_EXPRESSIONS[quickFilter]);
    }
    if (advancedFilter.trim()) {
      expressions.push(advancedFilter);
    }

    // Apply all filter expressions (AND logic)
    return studies.filter(study => 
      expressions.every(expr => evaluateExpression(expr, study))
    );
  }, [quickFilter, advancedFilter]);

  return {
    quickFilter,
    advancedFilter,
    setQuickFilter,
    setAdvancedFilter,
    filterStudies
  };
} 