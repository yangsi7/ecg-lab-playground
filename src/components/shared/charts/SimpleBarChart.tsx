import { useRef, useEffect } from 'react';

export interface ChartData {
    [key: string]: string | number | null | undefined;
    week_start?: string | null;
    month_start?: string | null;
    average_quality?: number;
    open_studies?: number;
}

interface SimpleBarChartProps {
    data: ChartData[];
    xKey: string;
    yKey: string;
    label: string;
    color?: string;
    width?: number;
    height?: number;
}

export function SimpleBarChart({
    data,
    xKey,
    yKey,
    label,
    color = '#4ade80',
    width = 600,
    height = 120
}: SimpleBarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        const values = data.map(d => Number(d[yKey]) || 0);
        if (!values.length) {
            ctx.fillStyle = '#aaa';
            ctx.fillText('No data', 10, height / 2);
            return;
        }

        const maxVal = Math.max(...values);
        const barWidth = width / data.length;
        const padding = 5;

        data.forEach((item, idx) => {
            const val = Number(item[yKey]) || 0;
            const barHeight = maxVal > 0 ? (val / maxVal) * (height - padding) : 0;
            const xPos = idx * barWidth;
            const yPos = height - barHeight;
            ctx.fillStyle = color;
            ctx.fillRect(xPos, yPos, barWidth - 1, barHeight);
        });
    }, [data, xKey, yKey, color, width, height]);

    return (
        <div className="bg-white/10 p-4 rounded-md border border-white/20 w-full max-w-xl">
            <div className="text-sm text-white mb-2">{label}</div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-auto"
            />
            {!data.length && (
                <p className="text-xs text-gray-400 mt-1">No {label} data found.</p>
            )}
        </div>
    );
} 