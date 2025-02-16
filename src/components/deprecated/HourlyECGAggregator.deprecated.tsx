/**
 * FILE: src/components/labs/HourlyECGAggregator.tsx
 * Production aggregator for minute-level subwindow selection.
 * Slices 60 minutes, color-coded by leadOn/quality. If user drags 
 * across a subset, calls onSubwindowFinal with the final [start..end].
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface AggregatedLeadData {
    timeBucket: string;
    leadOnP1?: number;
    leadOnN1?: number;
    leadOnP2?: number;
    leadOnN2?: number;
    leadOnP3?: number;
    leadOnN3?: number;
    quality1Percent?: number;
    quality2Percent?: number;
    quality3Percent?: number;
}

interface HourlyECGAggregatorProps {
    podId: string;
    date: Date;
    hour: number;
    onSubwindowFinal: (startIso: string, endIso: string) => void;
}

function colorMap(quality: number) {
    if (quality < 20) return '#ef4444';
    if (quality < 40) return '#f97316';
    if (quality < 60) return '#f59e0b';
    if (quality < 80) return '#eab308';
    return '#4ade80';
}

function alphaFromLeadOn(leadOnFactor: number) {
    // min alpha = 0.3
    const alpha = 0.3 + 0.7 * leadOnFactor;
    return Math.min(1, Math.max(0.3, alpha));
}

export function HourlyECGAggregator({
    podId,
    date,
    hour,
    onSubwindowFinal
}: HourlyECGAggregatorProps) {
    const [data, setData] = useState<AggregatedLeadData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);

    const hourStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0));
    const hourEnd = new Date(hourStart.getTime() + 3599999);

    useEffect(() => {
        let canceled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: aggData, error: rpcErr } = await supabase.rpc('aggregate_leads', {
                    p_pod_id: podId,
                    p_time_start: hourStart.toISOString(),
                    p_time_end: hourEnd.toISOString(),
                    p_bucket_seconds: 60
                });

                if (canceled) return;
                if (rpcErr) {
                    throw new Error(rpcErr.message);
                }
                if (!Array.isArray(aggData)) {
                    throw new Error('Invalid aggregator data');
                }
                setData(aggData);
            } catch (err: any) {
                if (!canceled) {
                    setError(err.message || 'Failed to fetch aggregator');
                    setData([]);
                }
            } finally {
                if (!canceled) {
                    setLoading(false);
                }
            }
        })();
        return () => { canceled = true; };
    }, [podId, date, hour]);

    function finalizeDrag() {
        if (dragStart !== null && dragEnd !== null) {
            const s = Math.min(dragStart, dragEnd);
            const e = Math.max(dragStart, dragEnd);
            const baseMs = hourStart.getTime();
            const startMs = baseMs + s * 60000;
            const endMs = baseMs + (e + 1) * 60000;
            onSubwindowFinal(new Date(startMs).toISOString(), new Date(endMs).toISOString());
        }
        setDragStart(null);
        setDragEnd(null);
    }

    useEffect(() => {
        function mouseUpHandler() { finalizeDrag(); }
        window.addEventListener('mouseup', mouseUpHandler);
        return () => {
            window.removeEventListener('mouseup', mouseUpHandler);
        };
    }, [dragStart, dragEnd]);

    if (loading) {
        return <div className="text-sm text-gray-400">Loading aggregator...</div>;
    }
    if (error) {
        return <div className="text-sm text-red-400">{error}</div>;
    }

    // 60 slices
    const minuteArray: AggregatedLeadData[] = Array.from({ length: 60 }, () => ({
        timeBucket: '',
        leadOnP1: 0, leadOnN1: 0,
        leadOnP2: 0, leadOnN2: 0,
        leadOnP3: 0, leadOnN3: 0,
        quality1Percent: 0,
        quality2Percent: 0,
        quality3Percent: 0
    }));

    data.forEach(row => {
        const m = new Date(row.timeBucket).getUTCMinutes();
        minuteArray[m] = row;
    });

    return (
        <div className="space-y-1 bg-white/10 p-3 rounded-md border border-white/20">
            <div className="text-xs text-gray-300">
                Hour {hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
            </div>
            <div className="flex gap-1 p-1 border border-white/10 bg-white/5 rounded-md min-w-[640px] overflow-hidden">
                {minuteArray.map((minSlice, idx) => {
                    const q1 = minSlice.quality1Percent ?? 0;
                    const q2 = minSlice.quality2Percent ?? 0;
                    const q3 = minSlice.quality3Percent ?? 0;
                    const avgQuality = (q1 + q2 + q3) / 3;

                    const l1 = ((minSlice.leadOnP1 ?? 0) + (minSlice.leadOnN1 ?? 0)) / 2;
                    const l2 = ((minSlice.leadOnP2 ?? 0) + (minSlice.leadOnN2 ?? 0)) / 2;
                    const l3 = ((minSlice.leadOnP3 ?? 0) + (minSlice.leadOnN3 ?? 0)) / 2;
                    const avgLeadOn = (l1 + l2 + l3) / 3;

                    const color = colorMap(avgQuality);
                    let alpha = alphaFromLeadOn(avgLeadOn);

                    const isMissing = minSlice.timeBucket === '';
                    if (isMissing) alpha = 0.2;

                    const selected = dragStart !== null && dragEnd !== null &&
                        idx >= Math.min(dragStart, dragEnd) && idx <= Math.max(dragStart, dragEnd);

                    return (
                        <div
                            key={idx}
                            className={`
                                flex-1 h-6 sm:h-8 rounded-sm relative cursor-pointer
                                transition-transform
                                ${selected ? 'scale-105 ring ring-blue-400' : 'hover:scale-[1.15]'}
                            `}
                            style={{ backgroundColor: color, opacity: alpha }}
                            title={`Minute ${idx}, ~${avgQuality.toFixed(1)}% Q, leadOn ~${(avgLeadOn * 100).toFixed(1)}%`}
                            onMouseDown={() => {
                                setDragStart(idx);
                                setDragEnd(idx);
                            }}
                            onMouseEnter={() => {
                                if (dragStart !== null) {
                                    setDragEnd(idx);
                                }
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
