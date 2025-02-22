import React, { createContext, useContext, useState, useCallback } from 'react';

interface TimeRange {
    start: string;
    end: string;
}

interface TimeRangeContextType {
    selectedDay: Date;
    timeRange: TimeRange | null;
    selectedPreset: number;
    setSelectedDay: (date: Date) => void;
    setTimeRange: (range: TimeRange | null) => void;
    setSelectedPreset: (minutes: number) => void;
    updateTimeRangeForDay: (date: Date) => void;
}

const TimeRangeContext = createContext<TimeRangeContextType | null>(null);

interface TimeRangeProviderProps {
    children: React.ReactNode;
    initialPreset?: number;
}

function formatTimeRange(date: Date, minutes: number): TimeRange {
    const start = new Date(date);
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}

export function TimeRangeProvider({ children, initialPreset = 15 }: TimeRangeProviderProps) {
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
    const [selectedPreset, setSelectedPreset] = useState(initialPreset);

    const updateTimeRangeForDay = useCallback((date: Date) => {
        if (timeRange) {
            // Maintain the same time window length when changing days
            const currentStart = new Date(timeRange.start);
            const currentEnd = new Date(timeRange.end);
            const duration = currentEnd.getTime() - currentStart.getTime();
            const minutes = duration / (60 * 1000);
            setTimeRange(formatTimeRange(date, minutes));
        } else {
            // If no time range exists, create one with the current preset
            setTimeRange(formatTimeRange(date, selectedPreset));
        }
    }, [timeRange, selectedPreset]);

    return (
        <TimeRangeContext.Provider
            value={{
                selectedDay,
                timeRange,
                selectedPreset,
                setSelectedDay,
                setTimeRange,
                setSelectedPreset,
                updateTimeRangeForDay
            }}
        >
            {children}
        </TimeRangeContext.Provider>
    );
}

export function useTimeRange() {
    const context = useContext(TimeRangeContext);
    if (!context) {
        throw new Error('useTimeRange must be used within a TimeRangeProvider');
    }
    return context;
} 