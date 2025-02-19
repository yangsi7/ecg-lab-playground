import { useState, useCallback } from 'react';
import { validateExpression, ParseError } from './ExpressionParser';

export interface FilterPreset {
  id: string;
  name: string;
  expression: string;
}

export interface UseAdvancedFilterResult {
  expression: string;
  error: string | null;
  presets: FilterPreset[];
  setExpression: (value: string) => void;
  savePreset: (name: string) => void;
  selectPreset: (preset: FilterPreset) => void;
  deletePreset: (id: string) => void;
}

const STORAGE_KEY = 'holterFilterPresets';

export function useAdvancedFilter(): UseAdvancedFilterResult {
  const [expression, setExpressionInternal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const setExpression = useCallback((value: string) => {
    setExpressionInternal(value);
    try {
      validateExpression(value);
      setError(null);
    } catch (err) {
      setError(err instanceof ParseError ? err.message : 'Invalid expression');
    }
  }, []);

  const savePreset = useCallback((name: string) => {
    if (!expression.trim() || error) return;
    
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      expression
    };
    
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets));
  }, [expression, error, presets]);

  const selectPreset = useCallback((preset: FilterPreset) => {
    setExpression(preset.expression);
  }, [setExpression]);

  const deletePreset = useCallback((id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets));
  }, [presets]);

  return {
    expression,
    error,
    presets,
    setExpression,
    savePreset,
    selectPreset,
    deletePreset
  };
} 