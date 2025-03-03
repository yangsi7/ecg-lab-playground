/**
 * src/components/clinics/charts/SparklineChart.tsx
 *
 * A simple sparkline chart component for visualizing trends
 * Implemented using SVG for better performance and customization
 */

import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

interface SparklineProps<T> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  height?: number;
  width?: number;
  color?: string;
  strokeWidth?: number;
  showPoints?: boolean;
  fillOpacity?: number;
}

export default function SparklineChart<T>({
  data,
  xKey,
  yKey,
  height = 100,
  width = 400,
  color = '#3b82f6',
  strokeWidth = 2,
  showPoints = true,
  fillOpacity = 0.2,
}: SparklineProps<T>) {
  // Calculate min and max values for scaling
  const yValues = data && data.length ? data.map((item) => Number(item[yKey])) : [0];
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const padding = 10;

  // Generate sparkline points
  const points = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((item, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      // Scale y value
      const normalizedY =
        maxY === minY
          ? height / 2
          : ((Number(item[yKey]) - minY) / (maxY - minY)) * (height - 2 * padding);
      // Invert y for SVG
      const y = height - normalizedY - padding;
      return { x, y, value: Number(item[yKey]) };
    });
  }, [data, yKey, width, height, minY, maxY, padding]);

  // Create the line path for the sparkline
  const linePath = useMemo(() => {
    if (!points.length) return '';
    return points
      .map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
      .join(' ');
  }, [points]);

  // Create area fill
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${height - padding} L ${first.x} ${
      height - padding
    } Z`;
  }, [linePath, points, height, padding]);

  // Simple date label formatting
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Fallback for empty data
  if (!data || data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 rounded p-4"
      >
        <div className="text-center space-y-3">
          <div className="bg-blue-500/20 rounded-full inline-flex p-2">
            <AlertCircle className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-white">No Data Available</h3>
          <p className="text-gray-400 text-sm">Awaiting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        {/* Area */}
        <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
        {/* Line */}
        <path d={linePath} stroke={color} strokeWidth={strokeWidth} fill="none" />
        {/* Points */}
        {showPoints &&
          points.map((point, idx) => (
            <circle key={idx} cx={point.x} cy={point.y} r={3} fill={color} />
          ))}
      </svg>

      {/* X-axis (start, mid, end) */}
      <div className="absolute left-0 right-0 flex justify-between text-xs text-gray-500 px-2 bottom-0">
        <span>{formatDate(String(data[0][xKey]))}</span>
        {data.length > 2 ? (
          <span>{formatDate(String(data[Math.floor(data.length / 2)][xKey]))}</span>
        ) : null}
        <span>{formatDate(String(data[data.length - 1][xKey]))}</span>
      </div>

      {/* Y-axis (max, min) */}
      <div className="absolute top-1 right-2 text-xs font-medium text-white">
        {maxY.toLocaleString()}
      </div>
      <div className="absolute bottom-5 right-2 text-xs text-gray-400">
        {minY.toLocaleString()}
      </div>
    </div>
  );
}