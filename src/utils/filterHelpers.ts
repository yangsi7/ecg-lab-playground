import { evaluateExpression } from './ExpressionParser';
import type { HolterStudy } from '../types/domain/holter';

export type QuickFilterId = 'bad-quality' | 'needs-intervention' | 'under-target';

export interface FilterPreset {
  id: string;
  name: string;
  expression: string;
}

export const QUICK_FILTERS = [
  { 
    id: 'bad-quality' as const, 
    label: 'Bad Quality (&lt;0.5)', 
    expression: 'qualityFraction < 0.5' 
  },
  { 
    id: 'needs-intervention' as const, 
    label: 'Needs Intervention (&lt;20h)', 
    expression: 'totalHours < 20' 
  },
  { 
    id: 'under-target' as const, 
    label: 'Under Target (&lt;10h)', 
    expression: 'totalHours < 10' 
  }
] as const;

export const TOKEN_SUGGESTIONS = [
  'daysRemaining',
  'qualityFraction',
  'totalHours',
  'interruptions',
  'qualityVariance'
] as const;

export const applyQuickFilter = (data: HolterStudy[], filterId: QuickFilterId): HolterStudy[] => {
  const filterConfig = QUICK_FILTERS.find(f => f.id === filterId);
  if (!filterConfig) return data;
  
  return data.filter(study => {
    try {
      return evaluateExpression(filterConfig.expression, study);
    } catch (error) {
      console.error('Error applying quick filter:', error);
      return false;
    }
  });
};

export const applyAdvancedFilter = (data: HolterStudy[], expression: string): HolterStudy[] => {
  if (!expression.trim()) return data;
  
  return data.filter(study => {
    try {
      return evaluateExpression(expression, study);
    } catch (error) {
      console.error('Error applying advanced filter:', error);
      return false;
    }
  });
};

const PRESET_STORAGE_KEY = 'holterFilterPresets';

export const loadFilterPresets = (): FilterPreset[] => {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveFilterPreset = (preset: FilterPreset): void => {
  try {
    const presets = loadFilterPresets();
    const newPresets = [...presets, preset];
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(newPresets));
  } catch (error) {
    console.error('Error saving filter preset:', error);
  }
};

export const deleteFilterPreset = (presetId: string): void => {
  try {
    const presets = loadFilterPresets();
    const newPresets = presets.filter(p => p.id !== presetId);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(newPresets));
  } catch (error) {
    console.error('Error deleting filter preset:', error);
  }
}; 