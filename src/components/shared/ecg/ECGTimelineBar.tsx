// src/components/labs/ECGTimelineBar.tsx

import { useRef, useEffect, useState, useMemo } from 'react';
import { AggregatedLeadData } from '../../hooks/useECGAggregates';
import { useDebouncedCallback } from '../../hooks/useDebounce';

/**
 * A simple colormap function from 0..100 => color string
 * We'll define a range from red (low) to green (high).
 */
function colorMap(quality: number): string {
    // Bound the quality to 0..100
    const q = Math.max(0, Math.min(quality, 100));
    // Simple approach: red at 0, orange ~ 40, yellow ~60, green ~80
    // We'll define some breakpoints:
    if (q < 20) return '#ef4444';   // red
    if (q < 40) return '#f97316';   // orange
    if (q < 60) return '#f59e0b';   // amber
    if (q < 80) return '#eab308';   // yellow
    return '#4ade80';               // green
}

interface ECGTimelineBarProps {
    data: AggregatedLeadData[];
    width?: number;
    height?: number;
    onSelectRange?: (startIdx: number, endIdx: number) => void;
    selectedRange?: [number, number] | null;
}

export function ECGTimelineBar({
    data,
    width = 600,
    height = 30,
    onSelectRange,
    selectedRange
}: ECGTimelineBarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);

    const debouncedSelect = useDebouncedCallback((s: number, e: number) => {
        onSelectRange?.(s, e);
    }, 150);

    // Precompute the average quality for each aggregator slice
    const aggregatorValues = useMemo(() => {
        return data.map((chunk) => {
            const q1 = chunk.quality_1_percent ?? 0;
            const q2 = chunk.quality_2_percent ?? 0;
            const q3 = chunk.quality_3_percent ?? 0;
            // average 0..maybe >100 if data is weird, but typically 0..100
            return (q1 + q2 + q3) / 3;
        });
    }, [data]);

    // We'll define a color array based on aggregatorValues
    const barColors = useMemo(() => {
        return aggregatorValues.map(q => colorMap(q));
    }, [aggregatorValues]);

    const drawBar = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        if (!data.length) {
            ctx.fillStyle = '#999';
            ctx.fillText('No aggregator data', 10, height / 2);
            return;
        }

        // Draw aggregator segments
        data.forEach((_, idx) => {
            const x = (idx / data.length) * width;
            const segWidth = width / data.length;
            ctx.fillStyle = barColors[idx];
            ctx.fillRect(x, 0, segWidth, height);
        });

        // selected range highlight
        if (selectedRange) {
            const [s, e] = selectedRange;
            const startX = (s / data.length) * width;
            const endX = (e / data.length) * width;
            ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            ctx.fillRect(startX, 0, endX - startX, height);
        }

        // drag highlight
        if (dragStart !== null && dragEnd !== null) {
            const x1 = Math.min(dragStart, dragEnd);
            const x2 = Math.max(dragStart, dragEnd);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            ctx.fillRect(x1, 0, x2 - x1, height);
        }
    };

    // Re-draw whenever dependencies change
    useEffect(() => {
        drawBar();
    }, [data, barColors, dragStart, dragEnd, selectedRange, width, height]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        setDragStart(x);
        setDragEnd(x);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragStart === null) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        setDragEnd(x);
    };

    const handleMouseUpOrLeave = () => {
        if (dragStart !== null && dragEnd !== null) {
            const s = Math.min(dragStart, dragEnd);
            const e = Math.max(dragStart, dragEnd);
            const startIdx = Math.floor((s / width) * data.length);
            const endIdx = Math.floor((e / width) * data.length);
            debouncedSelect(startIdx, endIdx);
        }
        setDragStart(null);
        setDragEnd(null);
    };

    return (
        <div className="relative" style={{ width, height }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ background: '#111', cursor: 'crosshair' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
            />
        </div>
    );
}
