// src/components/dashboard/NewDoctorModal.tsx
'use client';

import React, { useState } from 'react';
import { createDoctor } from '@/lib/api';
import { Doctor, Department, splitDoctorFullName, getDoctorBillingCategory } from '@/lib/types';
import { X, UserPlus, Stethoscope, AlertCircle, Clock, CalendarDays } from 'lucide-react';

interface NewDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onDoctorCreated: (doctor: Doctor) => void;
}

const DAYS_OF_WEEK = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

const SHIFT_PRESETS = [
  { label: 'Morning (8am – 2pm)', start: '08:00', end: '14:00' },
  { label: 'Mid-Day (10am – 2pm)', start: '10:00', end: '14:00' },
  { label: 'Afternoon (12pm – 6pm)', start: '12:00', end: '18:00' },
  { label: 'Evening (4pm – 8pm)', start: '16:00', end: '20:00' },
];

export const WEEK_ORDINAL_MAP: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
};

export function formatWeeksString(weeks?: number[]): string {
  if (!weeks || weeks.length === 0 || weeks.length >= 5) return '';
  const sorted = [...weeks].sort((a, b) => a - b);
  const ordinals = sorted.map((w) => WEEK_ORDINAL_MAP[w] || `${w}th`);
  if (ordinals.length === 1) return ordinals[0];
  if (ordinals.length === 2) return `${ordinals[0]} & ${ordinals[1]}`;
  return `${ordinals.slice(0, -1).join(', ')} & ${ordinals[ordinals.length - 1]}`;
}

export function getFormattedDayName(baseDay: string, weeks?: number[]): string {
  if (!weeks || weeks.length === 0 || weeks.length >= 5) return baseDay;
  const prefix = formatWeeksString(weeks);
  return prefix ? `${prefix} ${baseDay}` : baseDay;
}

export function getFormattedDayLabel(baseDay: string, fullDay: string, weeks?: number[]): string {
  if (!weeks || weeks.length === 0 || weeks.length >= 5) return `${fullDay} Shift`;
  const prefix = formatWeeksString(weeks);
  return prefix ? `${prefix} ${fullDay} Shift` : `${fullDay} Shift`;
}

export function getPresetValue(weeks?: number[]): string {
  if (!weeks || weeks.length === 0 || weeks.length >= 5) return 'every';
  const s = [...weeks].sort((a, b) => a - b).join(',');
  if (s === '1,4') return '1st_and_4th';
  if (s === '1,3') return '1st_and_3rd';
  if (s === '2,4') return '2nd_and_4th';
  if (s === '1,2') return '1st_and_2nd';
  if (s === '3,4') return '3rd_and_4th';
  if (s === '1') return '1st_only';
  if (s === '2') return '2nd_only';
  if (s === '3') return '3rd_only';
  if (s === '4') return '4th_only';
  return 'custom';
}

export function getWeeksForPreset(preset: string): number[] {
  switch (preset) {
    case '1st_and_4th': return [1, 4];
    case '1st_and_3rd': return [1, 3];
    case '2nd_and_4th': return [2, 4];
    case '1st_and_2nd': return [1, 2];
    case '3rd_and_4th': return [3, 4];
    case '1st_only': return [1];
    case '2nd_only': return [2];
    case '3rd_only': return [3];
    case '4th_only': return [4];
    case 'every': return [];
    default: return [];
  }
}

interface DaySchedule {
  startTime: string; // HH:mm in 24h format
  endTime: string;   // HH:mm in 24h format
  weeks?: number[];  // e.g. [1, 4] for 1st & 4th of month, [] for every week
}

function formatTime12h(time24: string): string {
  if (!time24) return '08:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  const hDisplay = h < 10 ? `0${h}` : `${h}`;
  return `${hDisplay}:${m} ${ampm}`;
}

function getShiftString(startTime: string, endTime: string): string {
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}

export default function NewDoctorModal({
  isOpen,
  onClose,
  departments,
  onDoctorCreated,
}: NewDoctorModalProps) {
  const [fullName, setFullName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | string>(
    departments[0]?.id || ''
  );
  const [dutyDays, setDutyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>({
    Mon: { startTime: '08:00', endTime: '14:00', weeks: [] },
    Wed: { startTime: '08:00', endTime: '14:00', weeks: [] },
    Fri: { startTime: '08:00', endTime: '14:00', weeks: [] },
  });
  const [dailyCapacity, setDailyCapacity] = useState<number>(15);
  const [acceptsPrivate, setAcceptsPrivate] = useState<boolean>(true);
  const [acceptsHmo, setAcceptsHmo] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setDutyDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        // Initialize day schedule with default or Saturday specific time
        setDaySchedules((prevScheds) => ({
          ...prevScheds,
          [day]: prevScheds[day] || {
            startTime: day === 'Sat' ? '10:00' : '08:00',
            endTime: '14:00',
            weeks: [],
          },
        }));
        return [...prev, day];
      }
    });
  };

  const updateDayTime = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setDaySchedules((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { startTime: '08:00', endTime: '14:00', weeks: [] }),
        [field]: value,
      },
    }));
  };

  const setDayWeeks = (day: string, weeks: number[]) => {
    setDaySchedules((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { startTime: '08:00', endTime: '14:00', weeks: [] }),
        weeks,
      },
    }));
  };

  const toggleDayWeek = (day: string, week: number) => {
    setDaySchedules((prev) => {
      const curWeeks = prev[day]?.weeks || [];
      const newWeeks = curWeeks.includes(week)
        ? curWeeks.filter((w) => w !== week)
        : [...curWeeks, week].sort((a, b) => a - b);
      return {
        ...prev,
        [day]: {
          ...(prev[day] || { startTime: '08:00', endTime: '14:00' }),
          weeks: newWeeks,
        },
      };
    });
  };

  const handlePresetChange = (day: string, preset: string) => {
    if (preset !== 'custom') {
      setDayWeeks(day, getWeeksForPreset(preset));
    }
  };

  const applyPreset = (day: string, start: string, end: string) => {
    setDaySchedules((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || { weeks: [] }), startTime: start, endTime: end },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter the specialist full name');
      return;
    }
    if (dutyDays.length === 0) {
      setError('Please select at least one duty day');
      return;
    }
    if (!acceptsPrivate && !acceptsHmo) {
      setError('Please select at least one accepted billing category (Private Self-Pay or HMO Insurance)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedDept = departments.find(
        (d) => String(d.id) === String(departmentId)
      );

      // Build day configurations for each chosen day
      const dayConfigs = dutyDays.map((dayShort) => {
        const cfg = daySchedules[dayShort] || { startTime: '08:00', endTime: '14:00', weeks: [] };
        const formattedDayName = getFormattedDayName(dayShort, cfg.weeks);
        const presetVal = getPresetValue(cfg.weeks);
        return {
          day: formattedDayName,
          base_day: dayShort,
          start_time: `${cfg.startTime.slice(0, 5)}:00`,
          end_time: `${cfg.endTime.slice(0, 5)}:00`,
          shift_time: getShiftString(cfg.startTime, cfg.endTime),
          capacity: dailyCapacity,
          weeks: cfg.weeks || [],
          recurrence_type: presetVal !== 'every' ? presetVal : 'every',
          recurrence_weeks: (cfg.weeks && cfg.weeks.length > 0 && cfg.weeks.length < 5) ? cfg.weeks : null,
        };
      });

      const formattedDutyDays = dutyDays.map((dayShort) => {
        const cfg = daySchedules[dayShort];
        return getFormattedDayName(dayShort, cfg?.weeks);
      });

      const { surname, middlename, lastname } = splitDoctorFullName(fullName.trim());

      const payload = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        surname: surname || undefined,
        middlename: middlename || undefined,
        lastname: lastname || undefined,
        qualification: null,
        department_id: departmentId ? Number(departmentId) : undefined,
        specialty: selectedDept?.name || 'General Medicine',
        duty_days: formattedDutyDays,
        day_configs: dayConfigs,
        shift_time: dayConfigs[0]?.shift_time || '08:00 AM – 02:00 PM',
        capacity: dailyCapacity,
        accepts_private: acceptsPrivate,
        accepts_hmo: acceptsHmo,
        accepted_patient_types: [
          ...(acceptsPrivate ? ['Private Self-Pay'] : []),
          ...(acceptsHmo ? ['HMO Insurance'] : []),
        ],
        status: true,
      };

      const newDoctor = await createDoctor(payload);
      onDoctorCreated(newDoctor);
      onClose();
      // Reset form
      setFullName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create specialist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header (Fixed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Add Medical Specialist
              </h2>
              <p className="text-xs text-slate-500">
                Register a consultant and configure customized shift hours per duty day
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specialist Full Name & Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Olaoye Afeez Babatunde"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
              />
              {fullName.trim() && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-medium">Auto-parsed:</span>
                  {(() => {
                    const parsed = splitDoctorFullName(fullName);
                    return (
                      <>
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          <span className="text-slate-400">Surname:</span>
                          <strong className="text-teal-700">{parsed.surname || '—'}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          <span className="text-slate-400">Middlename:</span>
                          <strong className="text-teal-700">{parsed.middlename || '—'}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          <span className="text-slate-400">Lastname:</span>
                          <strong className="text-teal-700">{parsed.lastname || '—'}</strong>
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Clinical Department & Daily Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clinical Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daily Booking Quota
                </label>
                <input
                  type="number"
                  min={1}
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Duty Days Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Select Duty Days <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {dutyDays.length} day{dutyDays.length === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map(({ short, full }) => {
                  const active = dutyDays.includes(short);
                  return (
                    <button
                      type="button"
                      key={short}
                      onClick={() => toggleDay(short)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={full}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dedicated Shift Hours Configuration Per Selected Day */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <label className="text-xs font-bold text-slate-800">
                  Shift Hours for Each Selected Day
                </label>
              </div>

              {dutyDays.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please select one or more duty days above to configure clinical hours.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dutyDays.map((dayShort) => {
                    const dayObj = DAYS_OF_WEEK.find((d) => d.short === dayShort);
                    const dayFull = dayObj?.full || dayShort;
                    const currentSched = daySchedules[dayShort] || {
                      startTime: '08:00',
                      endTime: '14:00',
                    };
                    const formattedShift = getShiftString(
                      currentSched.startTime,
                      currentSched.endTime
                    );

                    return (
                      <div
                        key={dayShort}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                      >
                        {/* Day Header with Current Hours Tag */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-6 rounded-lg bg-teal-700 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                              {dayShort}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {getFormattedDayLabel(dayShort, dayFull, currentSched.weeks)}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-mono font-bold">
                            {formattedShift}
                          </span>
                        </div>

                        {/* Recurrence Pattern Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Clinic Recurrence (Which Weeks in Month)
                            </label>
                            {(currentSched.weeks || []).length > 0 ? (
                              <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {formatWeeksString(currentSched.weeks)} {dayShort}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">
                                Every Week
                              </span>
                            )}
                          </div>

                          {/* Quick Presets Dropdown */}
                          <select
                            value={getPresetValue(currentSched.weeks)}
                            onChange={(e) => handlePresetChange(dayShort, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs cursor-pointer"
                          >
                            <option value="every">Every Week (All {dayFull}s)</option>
                            <option value="1st_and_4th">1st &amp; 4th of Month (1st &amp; 4th {dayShort})</option>
                            <option value="1st_and_3rd">1st &amp; 3rd of Month (1st &amp; 3rd {dayShort})</option>
                            <option value="2nd_and_4th">2nd &amp; 4th of Month (2nd &amp; 4th {dayShort})</option>
                            <option value="1st_and_2nd">1st &amp; 2nd of Month (1st &amp; 2nd {dayShort})</option>
                            <option value="3rd_and_4th">3rd &amp; 4th of Month (3rd &amp; 4th {dayShort})</option>
                            <option value="1st_only">1st Week Only (1st {dayShort} of month)</option>
                            <option value="2nd_only">2nd Week Only (2nd {dayShort} of month)</option>
                            <option value="3rd_only">3rd Week Only (3rd {dayShort} of month)</option>
                            <option value="4th_only">4th Week Only (4th {dayShort} of month)</option>
                            <option value="custom">Custom Week Selection...</option>
                          </select>

                          {/* Interactive Week Chips */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-slate-500 font-bold mr-0.5">Weeks:</span>
                            {[1, 2, 3, 4, 5].map((w) => {
                              const isSelected = (currentSched.weeks || []).includes(w);
                              return (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => toggleDayWeek(dayShort, w)}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border ${
                                    isSelected
                                      ? 'bg-teal-700 border-teal-800 text-white shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title={`Toggle ${WEEK_ORDINAL_MAP[w]} ${dayFull}`}
                                >
                                  {WEEK_ORDINAL_MAP[w]}
                                </button>
                              );
                            })}
                            {(currentSched.weeks || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() => setDayWeeks(dayShort, [])}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-auto cursor-pointer"
                              >
                                Clear (Every Week)
                              </button>
                            )}
                          </div>

                          {(currentSched.weeks || []).length > 0 && (
                            <p className="mt-1 text-[10px] text-teal-800 bg-teal-50/80 px-2 py-1 rounded-md border border-teal-200/60 font-medium">
                              ℹ️ Patients will only be able to book the{' '}
                              <strong className="font-bold">
                                {formatWeeksString(currentSched.weeks)} {dayFull}
                              </strong>{' '}
                              of each month on the appointment calendar.
                            </p>
                          )}
                        </div>

                        {/* Start & End Time Inputs */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={currentSched.startTime}
                              onChange={(e) =>
                                updateDayTime(dayShort, 'startTime', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={currentSched.endTime}
                              onChange={(e) =>
                                updateDayTime(dayShort, 'endTime', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Quick Presets for this Day */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">
                            Quick Presets:
                          </span>
                          {SHIFT_PRESETS.map((p) => {
                            const isSelected =
                              currentSched.startTime === p.start &&
                              currentSched.endTime === p.end;
                            return (
                              <button
                                type="button"
                                key={p.label}
                                onClick={() => applyPreset(dayShort, p.start, p.end)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border ${
                                  isSelected
                                    ? 'bg-teal-100 border-teal-300 text-teal-800 font-bold'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accepted Billing Categories */}
            <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800">
                  Accepted Billing Categories <span className="text-red-500">*</span>
                </label>
                {(() => {
                  const billing = getDoctorBillingCategory(null, acceptsPrivate, acceptsHmo);
                  if (!acceptsPrivate && !acceptsHmo) {
                    return (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        None selected
                      </span>
                    );
                  }
                  return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${billing.badgeClass}`}>
                      Card Badge: {billing.label}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptsPrivate((p) => !p)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    acceptsPrivate
                      ? 'bg-teal-600 border-teal-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{acceptsPrivate ? '✓' : '+'}</span>
                  <span>Private Self-Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAcceptsHmo((h) => !h)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    acceptsHmo
                      ? 'bg-teal-600 border-teal-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{acceptsHmo ? '✓' : '+'}</span>
                  <span>HMO Insurance</span>
                </button>
              </div>

              <div className="mt-2 text-[11px] leading-relaxed">
                {acceptsPrivate && acceptsHmo && (
                  <p className="text-teal-800 font-medium">
                    ✓ <strong>Both categories selected:</strong> Specialist will consult both <strong>Private</strong> and <strong>HMO</strong> patients. Doctor card will display <strong className="text-teal-900 bg-teal-100/70 px-1 rounded">HMO & Private</strong>.
                  </p>
                )}
                {acceptsPrivate && !acceptsHmo && (
                  <p className="text-amber-800 font-medium">
                    ✓ <strong>Private Only selected:</strong> Specialist consults <strong>Private patients only</strong>. Doctor card will display <strong className="text-amber-900 bg-amber-100/70 px-1 rounded">Private Only</strong>.
                  </p>
                )}
                {!acceptsPrivate && acceptsHmo && (
                  <p className="text-blue-800 font-medium">
                    ✓ <strong>HMO Only selected:</strong> Specialist consults <strong>HMO patients only</strong>. Doctor card will display <strong className="text-blue-900 bg-blue-100/70 px-1 rounded">HMO Only</strong>.
                  </p>
                )}
                {!acceptsPrivate && !acceptsHmo && (
                  <p className="text-rose-600 font-semibold">
                    ⚠️ Please select at least one accepted billing category.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer (Fixed) */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Register Specialist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
