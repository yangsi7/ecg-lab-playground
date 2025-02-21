/**
 * @deprecated Use Histogram component directly with variant='24h'
 */
import React from 'react';
import { Histogram, type HistogramDataPoint } from '@/components/shared/Histogram';

interface HolterHistogram24hProps {
  data: HistogramDataPoint[];
  loading?: boolean;
  selectedHour?: number;
  onHourSelect?: (hour: number) => void;
  className?: string;
}

export function HolterHistogram24h({
  data,
  loading,
  selectedHour,
  onHourSelect,
  className,
}: HolterHistogram24hProps) {
  return (
    <Histogram
      variant="24h"
      data={data}
      loading={loading}
      selectedHour={selectedHour}
      onHourSelect={onHourSelect}
      className={className}
      title="24-Hour Quality Overview"
      showQuality
    />
  );
} 