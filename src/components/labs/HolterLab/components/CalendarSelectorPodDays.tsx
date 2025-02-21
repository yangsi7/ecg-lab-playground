/**
 * @deprecated Use CalendarSelector directly with variant='pod'
 */
import React from 'react';
import { CalendarSelector } from '@/components/shared/CalendarSelector';
import type { CalendarSelectorProps } from '@/components/shared/CalendarSelector';

interface CalendarSelectorPodDaysProps {
  availableDays: string[];
  onSelectDay: (day: Date) => void;
  selectedDate?: Date;
  className?: string;
}

export function CalendarSelectorPodDays({
  availableDays,
  onSelectDay,
  selectedDate,
  className,
}: CalendarSelectorPodDaysProps) {
  return (
    <CalendarSelector
      variant="pod"
      availableDays={availableDays}
      onSelectDay={onSelectDay}
      selectedDate={selectedDate}
      className={className}
      title="Select Recording Date"
    />
  );
} 