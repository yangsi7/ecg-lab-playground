import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { QUICK_FILTERS, type QuickFilterId } from '../../../utils/filterHelpers';

interface QuickFiltersProps {
  activeFilter?: QuickFilterId;
  onFilterChange: (id: QuickFilterId | undefined) => void;
}

export function QuickFilters({ activeFilter, onFilterChange }: QuickFiltersProps) {
  return (
    <div className="flex gap-2">
      {QUICK_FILTERS.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(activeFilter === filter.id ? undefined : filter.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${activeFilter === filter.id
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
            }
          `}
        >
          <AlertTriangle className="h-4 w-4" />
          {filter.label}
        </button>
      ))}
    </div>
  );
} 