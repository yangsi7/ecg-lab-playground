import { useState, useCallback, useMemo } from 'react';
import type { AggregatedLeadData } from '../../../types/domain/ecg';
import { useDebounce } from '../filters/useDebounce';

export interface UseECGTimelineParams {
  data: AggregatedLeadData[];
  width: number;
  onSelectRange?: (startIdx: number, endIdx: number) => void;
  selectedRange?: [number, number] | null;
}

export interface UseECGTimelineResult {
  dragStart: number | null;
  dragEnd: number | null;
  aggregatorValues: number[];
  barColors: string[];
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUpOrLeave: () => void;
}

function colorMap(quality: number): string {
  // Bound the quality to 0..100
  const q = Math.max(0, Math.min(quality, 100));
  // Simple approach: red at 0, orange ~ 40, yellow ~60, green ~80
  if (q < 20) return '#ef4444';   // red
  if (q < 40) return '#f97316';   // orange
  if (q < 60) return '#f59e0b';   // amber
  if (q < 80) return '#eab308';   // yellow
  return '#4ade80';               // green
}

export function useECGTimeline({
  data,
  width,
  onSelectRange,
  selectedRange
}: UseECGTimelineParams): UseECGTimelineResult {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const debouncedSelect = useDebounce((s: number, e: number) => {
    onSelectRange?.(s, e);
  }, 150);

  // Precompute the average quality for each aggregator slice
  const aggregatorValues = useMemo(() => {
    return data.map((chunk) => {
      const q1 = chunk.quality_1_percent ?? 0;
      const q2 = chunk.quality_2_percent ?? 0;
      const q3 = chunk.quality_3_percent ?? 0;
      return (q1 + q2 + q3) / 3;
    });
  }, [data]);

  // Define a color array based on aggregatorValues
  const barColors = useMemo(() => {
    return aggregatorValues.map(q => colorMap(q));
  }, [aggregatorValues]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragStart(x);
    setDragEnd(x);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragStart === null) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragEnd(x);
  }, [dragStart]);

  const handleMouseUpOrLeave = useCallback(() => {
    if (dragStart !== null && dragEnd !== null) {
      const s = Math.min(dragStart, dragEnd);
      const e = Math.max(dragStart, dragEnd);
      const startIdx = Math.floor((s / width) * data.length);
      const endIdx = Math.floor((e / width) * data.length);
      debouncedSelect(startIdx, endIdx);
    }
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, width, data.length, debouncedSelect]);

  return {
    dragStart,
    dragEnd,
    aggregatorValues,
    barColors,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave
  };
} 