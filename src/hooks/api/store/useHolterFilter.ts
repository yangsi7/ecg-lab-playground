/**
 * Hook for managing Holter study filters
 * Provides both quick filters and advanced filtering capabilities
 */
import { create } from 'zustand';
import { logger } from '@/lib/logger';

interface HolterFilterState {
  filters: {
    quality?: number;
    leadOn?: number;
    timeRange?: {
      start: string;
      end: string;
    };
  };
  setFilter: (type: string, value: unknown) => void;
  resetFilters: () => void;
}

export const useHolterFilter = create<HolterFilterState>((set) => ({
  filters: {},
  setFilter: (type, value) => {
    set((state) => {
      const newFilters = { ...state.filters };

      switch (type) {
        case 'quality':
          if (typeof value === 'number') {
            newFilters.quality = value;
          }
          break;
        case 'leadOn':
          if (typeof value === 'number') {
            newFilters.leadOn = value;
          }
          break;
        case 'timeRange':
          if (value && typeof value === 'object') {
            newFilters.timeRange = value as { start: string; end: string };
          }
          break;
        default:
          logger.warn('Unknown filter type:', type);
      }

      return { filters: newFilters };
    });
  },
  resetFilters: () => set({ filters: {} })
})); 