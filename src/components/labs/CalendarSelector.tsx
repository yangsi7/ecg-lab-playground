/**
 * CalendarSelectorPodDays.tsx
 * 
 * Phase 2 improvement: 
 *  - Default to the latest day with data if availableDays is non-empty.
 *  - Unavailable day more grayed out, plus a tooltip or disabled styling.
 *  - Subtle transitions, MD3 style, "blurs", plus shape tokens (slightly rounded).
 */

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarSelectorPodDaysProps {
  availableDays: Date[]         // array of valid days
  onSelectDay: (day: Date) => void
  // rename for clarity, i.e. "defaultSelectedDay" if needed
}

function sameDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() &&
         a.getUTCMonth() === b.getUTCMonth() &&
         a.getUTCDate() === b.getUTCDate()
}

/**
 * A responsive monthly calendar. 
 * Sizing approach: 7 columns x up to 6 rows => ~42 squares.
 * If no availableDays, no highlight. If day not in availableDays => grayed out + disabled.
 */
export default function CalendarSelectorPodDays({
  availableDays,
  onSelectDay
}: CalendarSelectorPodDaysProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    return new Date()
  })

  // On mount or whenever availableDays changes, default to the *latest day* if it exists
  useEffect(() => {
    if (availableDays.length) {
      const latest = availableDays[availableDays.length - 1]
      setCurrentDate(latest)
      setViewMonth(new Date(latest.getFullYear(), latest.getMonth(), 1))
      onSelectDay(latest)
    } else {
      setCurrentDate(null)
    }
  }, [availableDays])

  const handleSelect = (day: Date) => {
    setCurrentDate(day)
    onSelectDay(day)
  }

  // Build the 6-week grid
  const startOfView = new Date(viewMonth)
  const dayOfWeek = startOfView.getDay() // 0..6 (Sun..Sat)
  startOfView.setDate(startOfView.getDate() - dayOfWeek)

  const daysInView: Date[] = []
  for (let i=0; i<42; i++) {
    const d = new Date(startOfView)
    d.setDate(startOfView.getDate() + i)
    daysInView.push(d)
  }

  function isAvailable(day: Date) {
    return availableDays.some(d => sameDay(d, day))
  }

  return (
    <div className="bg-white/10 p-4 rounded-xl border border-white/10 w-full max-w-md space-y-3 
                    shadow-md backdrop-blur-sm transition-colors">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const prev = new Date(viewMonth)
            prev.setMonth(prev.getMonth() - 1)
            setViewMonth(prev)
          }}
          className="p-2 rounded-md hover:bg-white/20 active:scale-95 transition"
        >
          <ChevronLeft className="h-5 w-5 text-sky-300" />
        </button>
        <span className="text-white text-base font-medium">
          {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => {
            const next = new Date(viewMonth)
            next.setMonth(next.getMonth() + 1)
            setViewMonth(next)
          }}
          className="p-2 rounded-md hover:bg-white/20 active:scale-95 transition"
        >
          <ChevronRight className="h-5 w-5 text-sky-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-1 auto-rows-[3rem] 
                   sm:auto-rows-[2.75rem] text-center text-sm"
      >
        {daysInView.map((dateItem, idx) => {
          const inThisMonth = (dateItem.getMonth() === viewMonth.getMonth())
          const isSelected = currentDate && sameDay(currentDate, dateItem)
          const available = isAvailable(dateItem)
          return (
            <button
              key={idx}
              disabled={!available}
              onClick={() => handleSelect(dateItem)}
              className={`
                flex items-center justify-center rounded-md transition-colors 
                ${inThisMonth ? 'text-white' : 'text-gray-500 opacity-70'}
                ${!available ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}
                ${isSelected ? 'bg-sky-500 text-white hover:bg-sky-600' : ''}
              `}
              title={
                !available 
                  ? 'No data for this day' 
                  : `Select ${dateItem.toDateString()}`
              }
            >
              {dateItem.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
