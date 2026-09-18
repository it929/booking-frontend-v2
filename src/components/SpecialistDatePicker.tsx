// src/components/SpecialistDatePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

interface SpecialistDatePickerProps {
  availableDays: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  selectedDate: string;     // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  doctorName?: string;
  fullyBookedDates?: string[];
  closedDates?: string[];
  currentAppointmentDate?: string; // YYYY-MM-DD to disable current ticket date
  disabledDates?: string[];
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SpecialistDatePicker({
  availableDays,
  selectedDate,
  onSelectDate,
  doctorName,
  fullyBookedDates = [],
  closedDates = [],
  currentAppointmentDate,
  disabledDates = [],
}: SpecialistDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse initial month/year from selectedDate or today
  const initialDate = selectedDate ? new Date(selectedDate) : today;
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Sync calendar when selectedDate is populated
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    }
  }, [selectedDate]);

  const isCurrentOrPastMonth =
    currentYear < today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth <= today.getMonth());

  const prevMonth = () => {
    if (isCurrentOrPastMonth) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Format helper YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Check if a day is enabled
  const isDateDutyDay = (day: number): boolean => {
    const dateObj = new Date(currentYear, currentMonth, day);
    dateObj.setHours(0, 0, 0, 0);

    // Disable past dates
    if (dateObj < today) {
      return false;
    }

    const dayName = WEEKDAY_NAMES[dateObj.getDay()]; // 'Sun', 'Mon', etc.
    const dayShort = dayName.toLowerCase();
    const nth = Math.ceil(day / 7); // 1 = 1st occurrence, 2 = 2nd, 3 = 3rd, 4 = 4th, 5 = 5th

    // Find all rules that match this day of week
    const rulesForThisDay = availableDays.filter((avail) => {
      const raw = String(avail).trim().toLowerCase();
      return raw.includes(dayShort) || raw === dayShort || raw.startsWith(dayShort) || dayShort.startsWith(raw);
    });

    if (rulesForThisDay.length === 0) {
      return false;
    }

    // Check if there are ordinal restrictions for this day (e.g. "1st & 3rd Sat")
    const ordinalRules = rulesForThisDay.filter((avail) => /1st|2nd|3rd|4th|5th/.test(String(avail).toLowerCase()));

    if (ordinalRules.length > 0) {
      // Must satisfy at least one ordinal rule
      return ordinalRules.some((avail) => {
        const raw = String(avail).trim().toLowerCase();
        const allowedNths: number[] = [];
        if (raw.includes('1st')) allowedNths.push(1);
        if (raw.includes('2nd')) allowedNths.push(2);
        if (raw.includes('3rd')) allowedNths.push(3);
        if (raw.includes('4th')) allowedNths.push(4);
        if (raw.includes('5th')) allowedNths.push(5);
        return allowedNths.includes(nth);
      });
    }

    // Standard recurring day of week without ordinal restriction
    return true;
  };

  // Format selected date label
  const getSelectedDateLabel = (): string | null => {
    if (!selectedDate) return null;
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      return selectedDate;
    }
    return selectedDate;
  };

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-4 space-y-3.5">
      {/* Calendar Month Navigation Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-teal-600" />
          <h4 className="font-bold text-slate-900 text-sm">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isCurrentOrPastMonth}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_NAMES.map((w) => {
          const dayShort = w.toLowerCase();
          const isDocDay = availableDays.some((d) => {
            const raw = String(d).trim().toLowerCase();
            return raw.includes(dayShort);
          });
          return (
            <div
              key={w}
              className={`text-[11px] font-bold py-1 ${
                isDocDay ? 'text-teal-700 bg-teal-50/70 rounded-md' : 'text-slate-400'
              }`}
            >
              {w}
            </div>
          );
        })}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {daysGrid.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-9 w-full" />;
          }

          const dateStr = formatDateString(currentYear, currentMonth, day);
          const isDuty = isDateDutyDay(day);
          const isClosed = closedDates.includes(dateStr);
          const isFullyBooked = fullyBookedDates.includes(dateStr) && !isClosed;
          const normalizedCurrentDate = currentAppointmentDate?.split('T')[0];
          const isCurrentBookingDate =
            Boolean(normalizedCurrentDate && dateStr === normalizedCurrentDate) ||
            disabledDates.includes(dateStr);
          const isSelected = selectedDate === dateStr;

          if (!isDuty) {
            return (
              <div
                key={dateStr}
                className="h-9 w-full rounded-xl flex items-center justify-center text-xs text-slate-300 bg-slate-50/40 select-none cursor-not-allowed"
                title="Specialist off-duty"
              >
                {day}
              </div>
            );
          }

          if (isCurrentBookingDate) {
            return (
              <div
                key={dateStr}
                className="h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold text-slate-400 bg-slate-100/90 border border-slate-200 select-none cursor-not-allowed relative"
                title="Current appointment date — Please pick a different date to reschedule"
              >
                <span className="text-slate-400 line-through">{day}</span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter -mt-0.5">
                  Current
                </span>
              </div>
            );
          }

          if (isClosed) {
            return (
              <div
                key={dateStr}
                className="h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold text-amber-600 bg-amber-50/80 border border-amber-200 select-none cursor-not-allowed relative"
                title="Clinic booking closed — Bookings close 10 minutes prior to clinic commencement"
              >
                <span className="text-slate-400 line-through">{day}</span>
                <span className="text-[7px] font-black text-amber-700 uppercase tracking-tighter -mt-0.5">
                  Closed
                </span>
              </div>
            );
          }

          if (isFullyBooked) {
            return (
              <div
                key={dateStr}
                className="h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold text-rose-400 bg-rose-50/70 border border-rose-200 select-none cursor-not-allowed relative"
                title="Fully Booked — Maximum patient consultation quota reached"
              >
                <span className="line-through">{day}</span>
                <span className="text-[8px] font-black text-rose-600 uppercase tracking-tighter -mt-0.5">
                  Full
                </span>
              </div>
            );
          }

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/25 scale-105 z-10'
                  : 'bg-teal-50/60 border border-teal-200/80 text-teal-900 hover:bg-teal-600 hover:text-white hover:scale-102 shadow-2xs'
              }`}
            >
              <span>{day}</span>
              <span
                className={`w-1 h-1 rounded-full -mt-0.5 ${
                  isSelected ? 'bg-white' : 'bg-teal-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Legend & Active Duty Days Tag */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
            <span className="font-semibold">Available</span>
          </div>
          {currentAppointmentDate && (
            <div className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400 inline-block" />
              <span className="font-semibold">Current date</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="font-semibold">Fully booked</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
            <span>Off duty</span>
          </div>
        </div>
        <div className="text-teal-800 font-semibold">
          Active: {availableDays.join(', ')}
        </div>
      </div>

      {/* Selected Date Confirmation Callout */}
      {selectedDate ? (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Selected: {getSelectedDateLabel()}</span>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-center text-xs">
          Click any active duty date highlighted above to proceed.
        </div>
      )}
    </div>
  );
}
