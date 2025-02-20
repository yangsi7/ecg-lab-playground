import React from 'react';
import { Calendar } from 'lucide-react';
import { CalendarSelector } from '../../../shared/CalendarSelector';

/**
 * @deprecated Use CalendarSelector directly with appropriate styling props.
 * Migration guide:
 * Replace:
 *   <CalendarSelectorPodDays>
 * With:
 *   <CalendarSelector className="bg-white/5 rounded-xl p-4 space-y-4">
 */
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
    return (
        <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-medium text-white">Select Date</h3>
            </div>

            <CalendarSelector
                availableDays={availableDays}
                selectedDate={selectedDate}
                onSelectDay={onSelectDay}
                showUnavailableDays={false}
            />
        </div>
    );
} 