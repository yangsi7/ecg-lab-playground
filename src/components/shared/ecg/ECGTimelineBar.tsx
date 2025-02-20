// src/components/labs/ECGTimelineBar.tsx

import { useRef, useEffect } from 'react';
import type { AggregatedLeadData } from '../../../types/domain/ecg';
import { useECGTimeline } from '../../../hooks/api/ecg';

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
    const {
        dragStart,
        dragEnd,
        aggregatorValues,
        barColors,
        handleMouseDown,
        handleMouseMove,
        handleMouseUpOrLeave
    } = useECGTimeline({
        data,
        width,
        onSelectRange,
        selectedRange
    });

    // Draw the timeline
    useEffect(() => {
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
    }, [data, barColors, dragStart, dragEnd, selectedRange, width, height]);

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
