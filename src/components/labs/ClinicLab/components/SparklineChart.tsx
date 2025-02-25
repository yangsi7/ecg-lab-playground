/**
 * src/components/clinics/charts/SparklineChart.tsx
 * 
 * A simple sparkline chart component for visualizing trends
 * Implemented using SVG for better performance and customization
 */

import { useMemo } from 'react';

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
  fillOpacity = 0.2
}: SparklineProps<T>) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ height, width }}
      >
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  // Calculate min and max values for scaling
  const yValues = data.map(item => Number(item[yKey]));
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const padding = 10;

  // Create points for the sparkline
  const points = useMemo(() => {
    const result = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      
      // Scale y value to fit within the chart height
      const normalizedY = maxY === minY 
        ? height / 2 
        : ((Number(item[yKey]) - minY) / (maxY - minY)) * (height - 2 * padding);
      
      // Invert y coordinate (SVG y-axis goes from top to bottom)
      const y = height - normalizedY - padding;
      
      return { x, y, value: Number(item[yKey]) };
    });
    
    return result;
  }, [data, xKey, yKey, width, height, minY, maxY, padding]);

  // Create the SVG path
  const linePath = useMemo(() => {
    return points.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
  }, [points]);

  // Create the area fill path
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    return `${linePath} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`;
  }, [linePath, points, height, padding]);

  // Format date labels for x-axis (simplified)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        {/* Area fill */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity={fillOpacity}
        />
        
        {/* Line */}
        <path
          d={linePath}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Data points */}
        {showPoints && points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={color}
          />
        ))}
      </svg>
      
      {/* X-axis labels (simplified) */}
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
        {data.length > 0 && (
          <>
            <span>{formatDate(String(data[0][xKey]))}</span>
            {data.length > 2 && (
              <span>{formatDate(String(data[Math.floor(data.length / 2)][xKey]))}</span>
            )}
            <span>{formatDate(String(data[data.length - 1][xKey]))}</span>
          </>
        )}
      </div>
      
      {/* Y-axis labels (min/max) */}
      <div className="absolute top-2 right-2 text-xs font-medium">
        {maxY.toLocaleString()}
      </div>
      <div className="absolute bottom-6 right-2 text-xs text-gray-500">
        {minY.toLocaleString()}
      </div>
    </div>
  );
} 