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
import { supabase } from '@/types/supabase';
import type { HolterStudy } from '@/types/domain/holter';
import { PostgrestError } from '@supabase/supabase-js';

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

interface StudyReading {
    timestamp: string;
    total_minutes: number | null;
    quality_minutes: number | null;
    status: string | null;
}

interface StudyHourlyMetric {
    hour_of_day: number;
    reading_count: number;
    total_minutes: number;
    quality_minutes: number;
}

export default function HourlyHistogram({ date, studyId, onHourClick }: HourlyHistogramProps) {
    const [data, setData] = useState<HourData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isShowingDateSpecificData, setIsShowingDateSpecificData] = useState(true);

    useEffect(() => {
        let canceled = false;
        const fetchHourlyData = async () => {
            try {
                setLoading(true);
                setError(null);
                setIsShowingDateSpecificData(true);

                // Create date boundaries for filtering - ensure UTC consistency
                const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
                const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

                // Initialize 24-hour slots
                const hours: HourData[] = Array.from({ length: 24 }, (_, i) => ({
                    hour: i,
                    total_minutes: 0,
                    quality_minutes: 0,
                    hasInterruption: false
                }));

                // Approach 1: Try to fetch data directly from study_readings for the specific date
                const { data: readingsData, error: readingsError } = await supabase
                    .from('study_readings')
                    .select('timestamp, total_minutes, quality_minutes, status')
                    .eq('study_id', studyId)
                    .gte('timestamp', dayStart.toISOString())
                    .lte('timestamp', dayEnd.toISOString());

                if (readingsError) {
                    console.warn('Failed to fetch study_readings:', readingsError.message);
                    
                    // Instead of falling back to aggregated data, we'll show an error
                    // This prevents misleading users with data from the entire study
                    if (!canceled) {
                        setError(`Unable to load data for ${date.toLocaleDateString()}: ${readingsError.message}`);
                    }
                } else if (readingsData && Array.isArray(readingsData) && readingsData.length > 0) {
                    // Successfully fetched date-specific readings
                    readingsData.forEach((row: StudyReading) => {
                        // Calculate hour from timestamp since hour_of_day is not in the table
                        const rowTimestamp = new Date(row.timestamp);
                        // Use UTC hour to ensure consistency with database time
                        const hourOfDay = rowTimestamp.getUTCHours();
                        
                        if (hourOfDay >= 0 && hourOfDay < 24) {
                            hours[hourOfDay].total_minutes += row.total_minutes || 0;
                            hours[hourOfDay].quality_minutes += row.quality_minutes || 0;
                            
                            // Check if any reading has an 'interrupted' status
                            if (row.status && row.status.toLowerCase() === 'interrupted') {
                                hours[hourOfDay].hasInterruption = true;
                            }
                        }
                    });
                    
                    if (!canceled) {
                        setData(hours);
                    }
                } else {
                    // No readings found for this specific date
                    console.info(`No readings found for date: ${date.toLocaleDateString()}`);
                    
                    // We need to try a different approach - fetch all study_readings and filter by date
                    const { data: allReadingsData, error: allReadingsError } = await supabase
                        .from('study_readings')
                        .select('timestamp, total_minutes, quality_minutes, status')
                        .eq('study_id', studyId);
                        
                    if (allReadingsError) {
                        if (!canceled) {
                            setError(`Failed to load data: ${allReadingsError.message}`);
                        }
                    } else if (allReadingsData && Array.isArray(allReadingsData) && allReadingsData.length > 0) {
                        // Filter readings for the specific date
                        const dateSpecificReadings = allReadingsData.filter((row: StudyReading) => {
                            const rowDate = new Date(row.timestamp);
                            return rowDate >= dayStart && rowDate <= dayEnd;
                        });
                        
                        if (dateSpecificReadings.length > 0) {
                            // Process the filtered readings
                            dateSpecificReadings.forEach((row: StudyReading) => {
                                const rowTimestamp = new Date(row.timestamp);
                                const hourOfDay = rowTimestamp.getUTCHours();
                                
                                if (hourOfDay >= 0 && hourOfDay < 24) {
                                    hours[hourOfDay].total_minutes += row.total_minutes || 0;
                                    hours[hourOfDay].quality_minutes += row.quality_minutes || 0;
                                    
                                    if (row.status && row.status.toLowerCase() === 'interrupted') {
                                        hours[hourOfDay].hasInterruption = true;
                                    }
                                }
                            });
                            
                            if (!canceled) {
                                setData(hours);
                            }
                        } else {
                            // If we still don't have data for the specific date, try the RPC as a last resort
                            // but we'll clearly mark it as aggregated data
                            const { data: metricRows, error: rpcErr } = await supabase
                                .rpc('get_study_hourly_metrics', { p_study_id: studyId });

                            if (rpcErr) {
                                if (!canceled) {
                                    setError(`No data available for ${date.toLocaleDateString()} and failed to load aggregated data: ${rpcErr.message}`);
                                }
                            } else if (!Array.isArray(metricRows) || metricRows.length === 0) {
                                if (!canceled) {
                                    setError(`No data available for ${date.toLocaleDateString()} and no aggregated data found`);
                                }
                            } else {
                                // We have aggregated data, but we'll mark it as not date-specific
                                metricRows.forEach((row: StudyHourlyMetric) => {
                                    const h = row.hour_of_day;
                                    // Safety check in case hour_of_day is out of 0..23 range
                                    if (h >= 0 && h < 24) {
                                        hours[h].total_minutes += row.total_minutes;
                                        hours[h].quality_minutes += row.quality_minutes;
                                    }
                                });
                                
                                if (!canceled) {
                                    setIsShowingDateSpecificData(false);
                                    setData(hours);
                                }
                            }
                        }
                    } else {
                        // No readings found at all for this study
                        if (!canceled) {
                            setError(`No data available for ${date.toLocaleDateString()}`);
                        }
                    }
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

    // Add a message if no data is available for this date
    const hasData = data.some(hour => hour.total_minutes > 0);
    if (!hasData) {
        return <div className="text-sm text-gray-400">No data available for {date.toLocaleDateString()}</div>;
    }

    return (
        <div className="flex flex-col">
            {!isShowingDateSpecificData && (
                <div className="text-xs text-amber-400 mb-2 p-1 bg-amber-900/30 rounded border border-amber-700/50">
                    Note: Showing aggregated data from the entire study period. No specific data available for {date.toLocaleDateString()}.
                </div>
            )}
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
                                className={`relative w-full border border-white/10 cursor-pointer hover:bg-gray-500 ${isShowingDateSpecificData ? 'bg-gray-600' : 'bg-gray-700'}`}
                                style={{ height: `${barHeight}px` }}
                                onClick={handleClick}
                                title={`Hour ${d.hour}: total=${total}, quality=${quality}${!isShowingDateSpecificData ? ' (aggregated from entire study)' : ''}`}
                            >
                                {/* quality overlay */}
                                <div
                                    className={`absolute bottom-0 left-0 ${isShowingDateSpecificData ? 'bg-green-400' : 'bg-green-600'}`}
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
        </div>
    );
}
