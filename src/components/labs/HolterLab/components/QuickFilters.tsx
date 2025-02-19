import { AlertTriangle } from 'lucide-react';
import type { QuickFilterId } from '../hooks/useHolterFilters';

interface QuickFilter {
  id: QuickFilterId;
  label: string;
  icon: typeof AlertTriangle;
}

const QUICK_FILTERS: QuickFilter[] = [
  { id: 'bad-quality', label: 'Bad Quality (<0.5)', icon: AlertTriangle },
  { id: 'needs-intervention', label: 'Needs Intervention (<20h)', icon: AlertTriangle },
  { id: 'under-target', label: 'Under Target (<10h)', icon: AlertTriangle }
];

interface QuickFiltersProps {
  activeFilter: QuickFilterId | undefined;
  onFilterChange: (id: QuickFilterId | undefined) => void;
  className?: string;
}

export function QuickFilters({
  activeFilter,
  onFilterChange,
  className = ''
}: QuickFiltersProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
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
          <filter.icon className="h-4 w-4" />
          {filter.label}
        </button>
      ))}
    </div>
  );
} 