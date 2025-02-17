/**
 * CalendarSelectorPodDays.tsx
 * 
 * Exporting default. 
 * We'll rename the function to match the default export usage.
 */
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarSelectorPodDaysProps {
    availableDays: string[];
    onSelectDay: (day: Date) => void;
    selectedDate: Date | null;
}

function sameDay(a: Date, b: Date) {
    return a.getUTCFullYear() === b.getUTCFullYear() &&
           a.getUTCMonth() === b.getUTCMonth() &&
           a.getUTCDate() === b.getUTCDate();
}

export default function CalendarSelectorPodDays({ 
    availableDays, 
    onSelectDay,
    selectedDate
}: CalendarSelectorPodDaysProps) {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [viewMonth, setViewMonth] = useState<Date>(() => new Date());
    const availableDatesSet = new Set(availableDays.map(d => d.split('T')[0]));

    // On mount / whenever availableDays changes
    useEffect(() => {
        if (availableDays.length) {
            const latest = new Date(availableDays[availableDays.length - 1].split('T')[0]);
            setCurrentDate(latest);
            setViewMonth(new Date(latest.getFullYear(), latest.getMonth(), 1));
            onSelectDay(latest);
        } else {
            setCurrentDate(null);
        }
    }, [availableDays]);

    const handleSelect = (day: Date) => {
        setCurrentDate(day);
        onSelectDay(day);
    };

    // Build the 6-week grid
    const startOfView = new Date(viewMonth);
    const dayOfWeek = startOfView.getDay();
    startOfView.setDate(startOfView.getDate() - dayOfWeek);

    const daysInView: Date[] = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(startOfView);
        d.setDate(startOfView.getDate() + i);
        daysInView.push(d);
    }

    function isAvailable(day: Date) {
        return availableDatesSet.has(day.toDateString().split('T')[0]);
    }

    return (
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-medium text-white">Select Date</h3>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm text-gray-400 py-1">
                        {day}
                    </div>
                ))}

                {daysInView.map((dateItem, idx) => {
                    const inThisMonth = (dateItem.getMonth() === viewMonth.getMonth());
                    const isSelected = selectedDate?.toDateString() === dateItem.toDateString();
                    const available = isAvailable(dateItem);
                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(dateItem)}
                            disabled={!available}
                            className={`
                                p-2 text-sm rounded-lg transition-colors
                                ${inThisMonth ? 'text-white' : 'text-gray-500 opacity-70'}
                                ${!available ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}
                                ${isSelected ? 'bg-blue-500 text-white' : ''}
                            `}
                        >
                            {dateItem.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
