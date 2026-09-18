// src/components/dashboard/NewScheduleModal.tsx
'use client';

import React, { useState } from 'react';
import { createSchedule } from '@/lib/api';
import { Doctor, DoctorSchedule, formatDoctorName } from '@/lib/types';
import { X, Calendar, Plus, AlertCircle } from 'lucide-react';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onScheduleCreated: (sched: DoctorSchedule) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NewScheduleModal({
  isOpen,
  onClose,
  doctors,
  onScheduleCreated,
}: NewScheduleModalProps) {
  const [doctorId, setDoctorId] = useState<number | string>(doctors[0]?.id || '');
  const [dutyDays, setDutyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [shiftTime, setShiftTime] = useState('08:00 AM – 02:00 PM');
  const [capacity, setCapacity] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setDutyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Please select a medical specialist');
      return;
    }
    if (dutyDays.length === 0) {
      setError('Please select at least one duty day');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        doctor_id: doctorId,
        duty_days: dutyDays,
        shift_time: shiftTime,
        capacity: capacity,
        status: true,
      };

      const newSched = await createSchedule(payload);
      onScheduleCreated(newSched);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create duty schedule');
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
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Add Specialist Duty Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Allocate clinical shifts, days of week, and daily consultation quota
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

            {/* Doctor Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medical Specialist <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs bg-white"
              >
                <option value="" disabled>Select a doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDoctorName(d)} — {d.specialty || d.department?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Time & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shift Consulting Hours
                </label>
                <input
                  type="text"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                  placeholder="e.g. 08:00 AM – 02:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Daily Patient Quota
                </label>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Duty Days Multi-Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Active Consulting Days
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const active = dutyDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
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
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Assigning...' : 'Assign Duty Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
