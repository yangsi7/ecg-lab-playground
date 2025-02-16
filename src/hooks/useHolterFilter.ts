import { useState, useCallback, useMemo } from 'react';
import type { HolterStudy } from '../types/holter';
import { 
  type QuickFilterId, 
  type FilterPreset,
  applyQuickFilter,
  applyAdvancedFilter,
  loadFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
} from '../utils/filterHelpers';
import { validateExpression } from '../utils/ExpressionParser';

interface UseHolterFilterResult {
  // Filter states
  quickFilter: QuickFilterId | undefined;
  advancedFilter: string;
  filterError: string | null;
  showFields: boolean;
  presets: FilterPreset[];
  
  // Filter actions
  setQuickFilter: (id: QuickFilterId | undefined) => void;
  setAdvancedFilter: (expression: string) => void;
  toggleFields: () => void;
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
  
  // Filter application
  applyFilters: (data: HolterStudy[]) => HolterStudy[];
}

export const useHolterFilter = (): UseHolterFilterResult => {
  // Filter states
  const [quickFilter, setQuickFilter] = useState<QuickFilterId>();
  const [advancedFilter, setAdvancedFilter] = useState('');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [showFields, setShowFields] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>(() => loadFilterPresets());

  // Validate and set advanced filter
  const handleAdvancedFilterChange = useCallback((expression: string) => {
    setAdvancedFilter(expression);
    if (expression.trim()) {
      try {
        if (!validateExpression(expression)) {
          setFilterError('Invalid filter syntax');
        } else {
          setFilterError(null);
        }
      } catch (error) {
        setFilterError(error instanceof Error ? error.message : 'Invalid filter');
      }
    } else {
      setFilterError(null);
    }
  }, []);

  // Toggle fields visibility
  const toggleFields = useCallback(() => {
    setShowFields(prev => !prev);
  }, []);

  // Save new preset
  const savePreset = useCallback((name: string) => {
    if (!advancedFilter.trim() || filterError) return;
    
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      expression: advancedFilter,
    };
    
    saveFilterPreset(newPreset);
    setPresets(prev => [...prev, newPreset]);
  }, [advancedFilter, filterError]);

  // Delete preset
  const deletePreset = useCallback((id: string) => {
    deleteFilterPreset(id);
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  // Apply all active filters to data
  const applyFilters = useCallback((data: HolterStudy[]): HolterStudy[] => {
    let filteredData = [...data];
    
    // Apply quick filter first
    if (quickFilter) {
      filteredData = applyQuickFilter(filteredData, quickFilter);
    }
    
    // Then apply advanced filter if present and valid
    if (advancedFilter.trim() && !filterError) {
      filteredData = applyAdvancedFilter(filteredData, advancedFilter);
    }
    
    return filteredData;
  }, [quickFilter, advancedFilter, filterError]);

  return {
    // States
    quickFilter,
    advancedFilter,
    filterError,
    showFields,
    presets,
    
    // Actions
    setQuickFilter,
    setAdvancedFilter: handleAdvancedFilterChange,
    toggleFields,
    savePreset,
    deletePreset,
    
    // Filter application
    applyFilters,
  };
}; 