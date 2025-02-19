import { AlertTriangle } from 'lucide-react';
import type { QuickFilterId } from '../hooks/useHolterFilters';

export interface QuickFilter {
  id: QuickFilterId;
  label: string;
  description: string;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: QuickFilterId | undefined;
  onFilterChange: (id: QuickFilterId | undefined) => void;
  className?: string;
}

export function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
  className = ''
}: QuickFiltersProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(activeFilter === filter.id ? undefined : filter.id)}
          title={filter.description}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${activeFilter === filter.id
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-transparent'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
} 