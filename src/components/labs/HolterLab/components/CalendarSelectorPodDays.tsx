import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarSelectorPodDaysProps {
    availableDays: string[];
    selectedDate: Date | null;
    onSelectDay: (day: Date) => void;
}

export function CalendarSelectorPodDays({ 
    availableDays, 
    selectedDate, 
    onSelectDay 
}: CalendarSelectorPodDaysProps) {
    const availableDatesSet = new Set(availableDays.map(d => d.split('T')[0]));

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

                {availableDays.map(dateStr => {
                    const date = new Date(dateStr);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isAvailable = availableDatesSet.has(dateStr.split('T')[0]);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onSelectDay(date)}
                            disabled={!isAvailable}
                            className={`
                                p-2 text-sm rounded-lg transition-colors
                                ${isSelected 
                                    ? 'bg-blue-500 text-white' 
                                    : isAvailable 
                                        ? 'bg-white/10 text-white hover:bg-white/20' 
                                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
} 