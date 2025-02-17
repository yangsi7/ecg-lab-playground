import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AggregatedLeadData } from '../../../../hooks/api/useECGAggregates';

interface HolterHistogram24hProps {
    data: AggregatedLeadData[];
    loading: boolean;
    selectedHour: number | null;
    onHourSelect: (hour: number) => void;
}

export function HolterHistogram24h({ data, loading, selectedHour, onHourSelect }: HolterHistogram24hProps) {
    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent" />
            </div>
        );
    }

    const chartData = data.map(point => ({
        hour: new Date(point.time_bucket).getHours(),
        quality: ((point.quality_1_percent || 0) + 
                 (point.quality_2_percent || 0) + 
                 (point.quality_3_percent || 0)) / 3,
        leadOn: ((point.lead_on_p_1 || 0) + 
                (point.lead_on_p_2 || 0) + 
                (point.lead_on_p_3 || 0)) / 3
    }));

    return (
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-medium text-white">24-Hour Quality Overview</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis 
                            dataKey="hour"
                            stroke="#9CA3AF"
                            tickFormatter={(hour) => `${hour}:00`}
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
                            onClick={(data) => onHourSelect(data.hour)}
                            className="cursor-pointer hover:opacity-100"
                        />
                        <Bar
                            dataKey="leadOn"
                            fill="#10B981"
                            opacity={0.8}
                            onClick={(data) => onHourSelect(data.hour)}
                            className="cursor-pointer hover:opacity-100"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
} 