import React, { useMemo } from 'react';
import { useECGAggregates } from '../../../hooks/api/useECGAggregates';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyECGAggregatorProps {
    podId: string;
    date: Date;
    hour: number;
    onSubwindowFinal: (startIso: string, endIso: string) => void;
}

export function HourlyECGAggregator({ podId, date, hour, onSubwindowFinal }: HourlyECGAggregatorProps) {
    // Calculate start and end of the hour
    const startTime = useMemo(() => {
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        return start.toISOString();
    }, [date, hour]);

    const endTime = useMemo(() => {
        const end = new Date(date);
        end.setHours(hour, 59, 59, 999);
        return end.toISOString();
    }, [date, hour]);

    // Fetch minute-by-minute aggregates for the hour
    const { data: aggregates, loading } = useECGAggregates({
        podId,
        startTime,
        endTime,
        bucketSize: 60, // 1-minute buckets
    });

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent" />
            </div>
        );
    }

    const chartData = aggregates.map(point => ({
        minute: new Date(point.time_bucket).getMinutes(),
        quality: ((point.quality_1_percent || 0) + 
                 (point.quality_2_percent || 0) + 
                 (point.quality_3_percent || 0)) / 3,
        leadOn: ((point.lead_on_p_1 || 0) + 
                (point.lead_on_p_2 || 0) + 
                (point.lead_on_p_3 || 0)) / 3
    }));

    const handleBarClick = (data: any) => {
        const clickedMinute = data.minute;
        const subwindowStart = new Date(date);
        subwindowStart.setHours(hour, clickedMinute, 0, 0);
        
        const subwindowEnd = new Date(date);
        subwindowEnd.setHours(hour, clickedMinute + 1, 0, 0);

        onSubwindowFinal(
            subwindowStart.toISOString(),
            subwindowEnd.toISOString()
        );
    };

    return (
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-medium text-white">Hour {hour}:00 Quality Overview</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis 
                            dataKey="minute"
                            stroke="#9CA3AF"
                            tickFormatter={(minute) => `${minute}m`}
                        />
                        <YAxis 
                            stroke="#9CA3AF"
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem'
                            }}
                            labelStyle={{ color: '#E5E7EB' }}
                            formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                        />
                        <Bar
                            dataKey="quality"
                            fill="#3B82F6"
                            opacity={0.8}
                            onClick={handleBarClick}
                            className="cursor-pointer hover:opacity-100"
                        />
                        <Bar
                            dataKey="leadOn"
                            fill="#10B981"
                            opacity={0.8}
                            onClick={handleBarClick}
                            className="cursor-pointer hover:opacity-100"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-400">
                Click on a bar to view detailed ECG for that minute
            </p>
        </div>
    );
} 