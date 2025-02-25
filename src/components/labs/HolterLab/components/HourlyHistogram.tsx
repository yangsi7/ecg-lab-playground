/**
 * HourlyHistogram.tsx
 * Renders a 24-hour histogram with total_minutes + quality_minutes for each hour.
 * 
 * Usage:
 *   <HourlyHistogram 
 *     date={someDate} 
 *     studyId="..."
 *     onHourClick={(hour)=>{...}} 
 *   />
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/hooks/api/core/supabase';
import type { HolterStudy } from '@/types/domain/holter';

interface HourlyHistogramProps {
    date: Date;
    studyId: string;
    onHourClick?: (hour: number) => void;
}

interface HourData {
    hour: number;
    total_minutes: number;
    quality_minutes: number;
    hasInterruption: boolean;
}

export default function HourlyHistogram({ date, studyId, onHourClick }: HourlyHistogramProps) {
    const [data, setData] = useState<HourData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let canceled = false;
        const fetchHourlyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Call the RPC to get pre-aggregated hourly metrics for the entire study
                const { data: metricRows, error: rpcErr } = await supabase
                    .rpc('get_study_hourly_metrics', { p_study_id: studyId });

                if (rpcErr) {
                    throw new Error(rpcErr.message);
                }
                if (!Array.isArray(metricRows)) {
                    throw new Error('No data returned from get_study_hourly_metrics');
                }

                // Initialize 24-hour slots
                const hours: HourData[] = Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    total_minutes: 0,
                    quality_minutes: 0,
                    hasInterruption: false
                }));

                // Populate from RPC results
                metricRows.forEach((row) => {
                    const h = row.hour_of_day;
                    // Safety check in case hour_of_day is out of 0..23 range
                    if (h >= 0 && h < 24) {
                        hours[h].total_minutes += row.total_minutes;
                        hours[h].quality_minutes += row.quality_minutes;
                    }
                });

                // Optional: If you still want to filter by a specific date, you can do it here
                // with a local approach, e.g., ignoring rows that are not within 'date'.

                if (!canceled) {
                    setData(hours);
                }
            } catch (err: any) {
                if (!canceled) {
                    setError(err.message || 'Failed to load hourly data');
                }
            } finally {
                if (!canceled) {
                    setLoading(false);
                }
            }
        };
        fetchHourlyData();
        return () => { canceled = true; };
    }, [date, studyId]);

    if (loading) {
        return <div className="text-sm text-gray-300">Loading 24-hour histogram...</div>;
    }
    if (error) {
        return <div className="text-sm text-red-400">{error}</div>;
    }

    return (
        <div className="flex gap-2">
            {data.map((d) => {
                const total = d.total_minutes;
                const quality = d.quality_minutes;
                const ratio = total > 0 ? (quality / total) : 0;
                const barHeight = 100; // base pixel for 100% total

                const handleClick = () => onHourClick?.(d.hour);

                return (
                    <div key={d.hour} className="flex flex-col items-center w-4">
                        <div
                            className="relative w-full bg-gray-600 border border-white/10 cursor-pointer hover:bg-gray-500"
                            style={{ height: `${barHeight}px` }}
                            onClick={handleClick}
                            title={`Hour ${d.hour}: total=${total}, quality=${quality}`}
                        >
                            {/* quality overlay */}
                            <div
                                className="absolute bottom-0 left-0 bg-green-400"
                                style={{ 
                                    width: '100%', 
                                    height: `${barHeight * ratio}px` 
                                }}
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
