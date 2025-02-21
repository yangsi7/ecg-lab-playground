import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface ChartData {
    [key: string]: string | number | null | undefined
    value: number // Only 'value' is required
}

export interface SimpleBarChartProps {
    data: ChartData[]
    xKey: string
    yKey: string
    label: string
    color?: string
    width?: number
    height?: number
}

export function SimpleBarChart({
    data,
    xKey,
    yKey,
    label,
    color = '#3b82f6',
    width = 400,
    height = 300
}: SimpleBarChartProps) {
    // Memoize the data to prevent unnecessary re-renders
    const chartData = useMemo(() => data, [data])

    return (
        <div className="bg-white/10 border border-white/10 rounded-xl p-4">
            <h3 className="text-lg text-white font-semibold mb-3">{label}</h3>
            <div style={{ width, height }}>
                <ResponsiveContainer>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey={xKey}
                            stroke="#9ca3af"
                            fontSize={12}
                            tickFormatter={(value) => {
                                if (typeof value === 'string' && value.includes('T')) {
                                    // Handle ISO date strings
                                    return new Date(value).toLocaleDateString()
                                }
                                return value
                            }}
                        />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                color: '#fff'
                            }}
                        />
                        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
} 