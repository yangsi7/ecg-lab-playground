/**
 * Unified histogram component that supports both 24-hour and hourly visualizations
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Loader2 } from 'lucide-react';

export interface HistogramDataPoint {
  hour: number;
  value: number;
  quality?: number;
  label?: string;
}

interface HistogramProps {
  // Core data
  data: HistogramDataPoint[];
  loading?: boolean;
  
  // Interaction
  selectedHour?: number;
  onHourSelect?: (hour: number) => void;
  
  // Customization
  variant?: '24h' | 'hourly';
  title?: string;
  height?: number;
  barColor?: string;
  showQuality?: boolean;
  className?: string;
}

export function Histogram({
  data,
  loading = false,
  selectedHour,
  onHourSelect,
  variant = '24h',
  title = '',
  height = 300,
  barColor = '#3B82F6', // blue-500
  showQuality = false,
  className = '',
}: HistogramProps) {
  // Transform data for display
  const chartData = data.map(point => ({
    ...point,
    label: variant === '24h' 
      ? `${String(point.hour).padStart(2, '0')}:00`
      : point.label || `${String(point.hour).padStart(2, '0')}:00`,
    fillColor: selectedHour === point.hour ? '#60A5FA' : barColor, // blue-400 for selected
  }));

  const handleBarClick = (data: any) => {
    if (onHourSelect && typeof data.hour === 'number') {
      onHourSelect(data.hour);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium">{data.label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Value: {data.value.toFixed(2)}
        </p>
        {showQuality && typeof data.quality === 'number' && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quality: {(data.quality * 100).toFixed(1)}%
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#374151"
              opacity={0.2}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9CA3AF' }}
              tickLine={{ stroke: '#4B5563' }}
              axisLine={{ stroke: '#4B5563' }}
            />
            <YAxis
              tick={{ fill: '#9CA3AF' }}
              tickLine={{ stroke: '#4B5563' }}
              axisLine={{ stroke: '#4B5563' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={barColor}
              onClick={handleBarClick}
              cursor={onHourSelect ? 'pointer' : 'default'}
              fillOpacity={showQuality ? 0.8 : 1}
            >
              {chartData.map((entry, index) => (
                <rect
                  key={`bar-${index}`}
                  fill={entry.fillColor}
                  className="transition-colors duration-200"
                />
              ))}
            </Bar>
            {showQuality && (
              <Bar
                dataKey="quality"
                fill="#10B981" // emerald-500
                opacity={0.3}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 