/**
 * Unified calendar selector component that supports both basic and pod-specific use cases
 */
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export interface CalendarSelectorProps {
  // Core functionality
  availableDays?: string[] | Date[];
  onSelectDay: (day: Date) => void;
  selectedDate?: Date | null;
  
  // Styling and behavior options
  className?: string;
  showUnavailableDays?: boolean;
  variant?: 'default' | 'pod';  // 'pod' adds the pod-specific styling
  title?: string;  // Custom title for the calendar
}

export function CalendarSelector({ 
  availableDays = [],
  onSelectDay,
  selectedDate = null,
  className = '',
  showUnavailableDays = false,
  variant = 'default',
  title = 'Select Date'
}: CalendarSelectorProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(selectedDate);
  const [viewMonth, setViewMonth] = useState<Date>(() => selectedDate || new Date());
  
  // Convert all available days to Date objects and create a Set of date strings for comparison
  const availableDatesSet = new Set(
    availableDays.map(d => 
      typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0]
    )
  );

  useEffect(() => {
    if (availableDays.length && !currentDate) {
      // Default to latest available day
      const latest = availableDays[availableDays.length - 1];
      const latestDate = typeof latest === 'string' ? new Date(latest.split('T')[0]) : latest;
      setCurrentDate(latestDate);
      setViewMonth(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));
      onSelectDay(latestDate);
    }
  }, [availableDays, currentDate, onSelectDay]);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const handleSelect = (day: Date) => {
    if (!isAvailable(day) && !showUnavailableDays) return;
    setCurrentDate(day);
    onSelectDay(day);
  };

  const handlePrevMonth = () => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
    if (!availableDays.length) return true;
    return availableDatesSet.has(day.toISOString().split('T')[0]);
  }

  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Determine container classes based on variant
  const containerClasses = variant === 'pod' 
    ? 'bg-white/5 rounded-xl p-4 space-y-4'
    : '';

  return (
    <div className={`w-full max-w-md ${containerClasses} ${className}`}>
      {variant === 'pod' && (
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {daysInView.map((day, i) => {
          const isSelected = currentDate && isSameDay(day, currentDate);
          const isDayAvailable = isAvailable(day);
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();

          return (
            <button
              key={i}
              onClick={() => handleSelect(day)}
              disabled={!showUnavailableDays && !isDayAvailable}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-colors
                ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}
                ${isSelected ? 'bg-blue-500 text-white' : ''}
                ${!isSelected && isDayAvailable && isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                ${!isDayAvailable && !showUnavailableDays ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
} 