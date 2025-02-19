import { useState, useCallback } from 'react';
import { evaluateExpression } from '../components/AdvancedFilter/ExpressionParser';
import type { HolterStudy } from '../../../../types/domain/holter';

export type QuickFilterId = 'bad-quality' | 'needs-intervention' | 'under-target';

interface UseHolterFiltersResult {
  quickFilter: QuickFilterId | undefined;
  advancedFilter: string;
  setQuickFilter: (id: QuickFilterId | undefined) => void;
  setAdvancedFilter: (expression: string) => void;
  filterStudies: (studies: HolterStudy[]) => HolterStudy[];
}

const QUICK_FILTER_EXPRESSIONS: Record<QuickFilterId, string> = {
  'bad-quality': 'qualityFraction < 0.5',
  'needs-intervention': 'totalHours < 20',
  'under-target': 'totalHours < 10'
};

export function useHolterFilters(): UseHolterFiltersResult {
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>();
  const [advancedFilter, setAdvancedFilter] = useState('');

  const filterStudies = useCallback((studies: HolterStudy[]): HolterStudy[] => {
    // If no filters are active, return all studies
    if (!quickFilter && !advancedFilter.trim()) {
      return studies;
    }

    // Combine quick filter and advanced filter expressions
    const expressions: string[] = [];
    if (quickFilter) {
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