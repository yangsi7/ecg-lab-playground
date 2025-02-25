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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/hooks/api/core/supabase';
import { logger } from '@/lib/logger';
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

                // Example approach: fetch study_readings for that date & group by hour
                // For demonstration only
                const dayStart = new Date(date);
                dayStart.setHours(0,0,0,0);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23,59,59,999);

                const { data: readData, error: readErr } = await supabase
                    .from('study_readings')
                    .select('timestamp, total_minutes, quality_minutes, status')
                    .eq('study_id', studyId)
                    .gte('timestamp', dayStart.toISOString())
                    .lte('timestamp', dayEnd.toISOString())
                    .order('timestamp', { ascending: true });

                if (readErr) throw new Error(readErr.message);
                if (!Array.isArray(readData)) {
                    throw new Error('Invalid data from study_readings');
                }

                // aggregate by hour
                const hours: HourData[] = Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    total_minutes: 0,
                    quality_minutes: 0,
                    hasInterruption: false
                }));

                readData.forEach((r) => {
                    const ts = new Date(r.timestamp).getHours();
                    hours[ts].total_minutes += r.total_minutes || 0;
                    hours[ts].quality_minutes += r.quality_minutes || 0;
                    if (r.status && r.status.toLowerCase() === 'interrupted') {
                        hours[ts].hasInterruption = true;
                    }
                });

                if (!canceled) {
                    setData(hours);
                }
            } catch (err: any) {
                if (!canceled) {
                    setError(err.message || 'Failed to load hourly data');
                }
            } finally {
                if (!canceled) setLoading(false);
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
