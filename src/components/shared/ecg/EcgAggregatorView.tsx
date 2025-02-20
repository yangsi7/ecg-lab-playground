import { Heart, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useECGAggregatorView } from '../../../hooks/api/ecg';
import type { TimeInterval } from '../../../hooks/api/ecg';

interface EcgAggregatorViewProps {
  podId: string;
  timeInterval: TimeInterval;
  initialDate?: Date;
  onTimeRangeSelect?: (start: string, end: string) => void;
  className?: string;
  pageSize?: number;
}

export function EcgAggregatorView({
  podId,
  timeInterval,
  initialDate = new Date(),
  onTimeRangeSelect,
  className = '',
  pageSize = 60 // Default to showing 1 hour worth of minute buckets
}: EcgAggregatorViewProps) {
  const {
    currentDate,
    page,
    filter,
    aggregates,
    count,
    loading,
    error,
    totalPages,
    handleQualityThresholdChange,
    handleLeadOnThresholdChange,
    setPage
  } = useECGAggregatorView({
    podId,
    timeInterval,
    initialDate,
    pageSize
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 text-blue-400">
          <svg className="h-full w-full" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-red-400">Error loading ECG data</h3>
        <p className="mt-1 text-sm text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-semibold text-white">
            ECG Data ({timeInterval === 'hourly' ? 'Hourly' : 'Daily'} View)
          </h1>
        </div>
        <button
          onClick={() => {/* TODO: Implement export */}}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filters:</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Quality:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filter.quality_threshold}
            onChange={(e) => handleQualityThresholdChange(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-400">{filter.quality_threshold}%</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Lead On:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filter.lead_on_threshold}
            onChange={(e) => handleLeadOnThresholdChange(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-400">{filter.lead_on_threshold}%</span>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        {/* TODO: Implement data grid */}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <div className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </div>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 