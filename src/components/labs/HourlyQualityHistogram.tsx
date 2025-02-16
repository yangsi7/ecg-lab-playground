/**
 * HolterHistogram24h.tsx
 * 
 * Takes an array of 24 data points, each with total_minutes & quality_minutes & any interruption flags.
 * Renders a stacked/filled bar chart. 
 * On click => calls onHourSelect(hour).
 */

import React from 'react';

interface HourData {
  hour: number; // 0..23
  total_minutes: number;
  quality_minutes: number;
  hasInterruption: boolean;
}

interface HolterHistogram24hProps {
  data: HourData[];
  onHourSelect?: (hour: number) => void;
}

export function HolterHistogram24h({ data, onHourSelect }: HolterHistogram24hProps) {
  // For each hour, we might do a fixed 24-segment <div> or <canvas>:
  return (
    <div className="flex gap-1 w-full overflow-x-auto">
      {data.map((d, idx) => {
        const total = d.total_minutes || 0;
        const quality = d.quality_minutes || 0;
        const qPerc = total > 0 ? (quality/ total) : 0;
        const barHeight = 120; // example
        const qualityHeight = barHeight * qPerc;

        const handleClick = () => onHourSelect?.(d.hour);

        return (
          <div key={d.hour} className="flex flex-col items-center">
            <div 
              className="relative w-4 border border-white/20 bg-gray-600 hover:bg-gray-500 cursor-pointer" 
              style={{ height: barHeight }}
              onClick={handleClick}
              title={`Hour ${d.hour}\nTotal=${total} Quality=${quality}`}
            >
              {/* Quality fill */}
              <div 
                className="absolute bottom-0 left-0 w-full bg-green-400"
                style={{ height: `${qualityHeight}px`}}
              />
              {d.hasInterruption && (
                <div 
                  className="absolute top-0 left-0 w-full h-full outline outline-2 outline-red-500 pointer-events-none" 
                />
              )}
            </div>
            <div className="text-xs text-gray-300 mt-1">{d.hour}h</div>
          </div>
        );
      })}
    </div>
  );
}
