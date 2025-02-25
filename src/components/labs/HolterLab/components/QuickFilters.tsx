import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { QuickFilterId } from '../../../../hooks/api/study/useHolterFilters';

export interface QuickFilter {
  id: 'all' | 'recent' | 'low-quality' | 'high-quality';
  label: string;
  description: string;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: QuickFilter['id'];
  onFilterChange: (id: QuickFilter['id']) => void;
  className?: string;
}

export function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
  className = ''
}: QuickFiltersProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${activeFilter === filter.id
              ? 'bg-blue-500/20 text-blue-300'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }
          `}
          title={filter.description}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
} 