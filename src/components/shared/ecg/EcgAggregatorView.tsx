import { useState, useCallback } from 'react';
import { useECGAggregates, type TimeInterval } from '../../../hooks/api/useECGAggregates';
import { Heart, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface EcgAggregatorViewProps {
  podId: string;
  timeInterval: TimeInterval;
  initialDate?: Date;
  onTimeRangeSelect?: (start: string, end: string) => void;
  className?: string;
  pageSize?: number;
}

const BUCKET_SECONDS: Record<TimeInterval, number> = {
  hourly: 60,    // 1 minute buckets for hourly view
  daily: 3600,   // 1 hour buckets for daily view
};

const colorMap = (quality: number) => {
  if (quality >= 80) return '#22c55e'; // green-500
  if (quality >= 60) return '#eab308'; // yellow-500
  if (quality >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

const alphaFromLeadOn = (leadOnFactor: number) => {
  const alpha = 0.3 + (0.7 * leadOnFactor);
  return Math.min(1, Math.max(0.3, alpha));
};

export function EcgAggregatorView({
  podId,
  timeInterval,
  initialDate = new Date(),
  onTimeRangeSelect,
  className = '',
  pageSize = 60 // Default to showing 1 hour worth of minute buckets
}: EcgAggregatorViewProps) {
  const [currentDate] = useState(initialDate);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    quality_threshold: 0,
    lead_on_threshold: 0,
    time_range: {
      start: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        timeInterval === 'hourly' ? currentDate.getHours() : 0,
        0,
        0
      ).toISOString(),
      end: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        timeInterval === 'hourly' ? currentDate.getHours() + 1 : 23,
        59,
        59
      ).toISOString(),
    },
  });

  const offset = (page - 1) * pageSize;

  const { data: aggregates, count, loading, error } = useECGAggregates({
    podId,
    startTime: filter.time_range.start,
    endTime: filter.time_range.end,
    bucketSize: BUCKET_SECONDS[timeInterval],
    filter,
    offset,
    limit: pageSize
  });

  const handleQualityThresholdChange = useCallback((threshold: number) => {
    setFilter(prev => ({
      ...prev,
      quality_threshold: threshold,
    }));
  }, []);

  const handleLeadOnThresholdChange = useCallback((threshold: number) => {
    setFilter(prev => ({
      ...prev,
      lead_on_threshold: threshold,
    }));
  }, []);

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

  const totalPages = Math.ceil(count / pageSize);

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
      <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-300" />
            <h2 className="text-sm text-gray-300 font-medium">Quality Filters</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Quality Threshold</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filter.quality_threshold}
              onChange={(e) => handleQualityThresholdChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Lead-On Threshold</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filter.lead_on_threshold}
              onChange={(e) => handleLeadOnThresholdChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Data Visualization */}
      <div className="flex gap-1 p-1 border border-white/10 bg-white/5 rounded-md overflow-x-auto">
        {aggregates.map((aggregate) => {
          const qualities = [
            aggregate.quality_1_percent ?? 0,
            aggregate.quality_2_percent ?? 0,
            aggregate.quality_3_percent ?? 0,
          ];
          const avgQuality = qualities.reduce((a, b) => a + b, 0) / 3;

          const leadOns = [
            ((aggregate.lead_on_p_1 ?? 0) + (aggregate.lead_on_n_1 ?? 0)) / 2,
            ((aggregate.lead_on_p_2 ?? 0) + (aggregate.lead_on_n_2 ?? 0)) / 2,
            ((aggregate.lead_on_p_3 ?? 0) + (aggregate.lead_on_n_3 ?? 0)) / 2,
          ];
          const avgLeadOn = leadOns.reduce((a, b) => a + b, 0) / 3;

          const color = colorMap(avgQuality);
          const alpha = alphaFromLeadOn(avgLeadOn);

          return (
            <div
              key={aggregate.time_bucket}
              className="flex-1 h-8 min-w-[20px] transition-transform hover:scale-y-110 cursor-pointer"
              style={{ backgroundColor: color, opacity: alpha }}
              title={`Time: ${new Date(aggregate.time_bucket).toLocaleTimeString()}
Quality: ${avgQuality.toFixed(1)}%
Lead-On: ${(avgLeadOn * 100).toFixed(1)}%`}
              onClick={() => {
                if (onTimeRangeSelect) {
                  const start = new Date(aggregate.time_bucket);
                  const end = new Date(start.getTime() + (BUCKET_SECONDS[timeInterval] * 1000));
                  onTimeRangeSelect(start.toISOString(), end.toISOString());
                }
              }}
            />
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">
          Showing {aggregates.length} of {count} data points
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 