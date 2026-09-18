// src/components/dashboard/NewBookingModal.tsx
'use client';

import React, { useState } from 'react';
import { createBooking } from '@/lib/api';
import { Booking, Doctor, HmoCompany, formatDoctorName } from '@/lib/types';
import { X, UserPlus, Calendar, AlertCircle } from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  hmoCompanies: HmoCompany[];
  onBookingCreated: (booking: Booking) => void;
}

export default function NewBookingModal({
  isOpen,
  onClose,
  doctors,
  hmoCompanies,
  onBookingCreated,
}: NewBookingModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [doctorId, setDoctorId] = useState<number | string>(doctors[0]?.id || '');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00 AM');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [paymentType, setPaymentType] = useState('Self-Pay (Private)');
  const [hmoId, setHmoId] = useState<number | string>(hmoCompanies[0]?.id || '');
  const [hmoPolicyCode, setHmoPolicyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedHmo = hmoCompanies.find((h) => String(h.id) === String(hmoId));
      const res = await createBooking({
        doctor_id: doctorId || (doctors[0]?.id as number),
        date,
        time,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail || undefined,
        reason: reason || 'Walk-in Consultation',
        payment_type: paymentType,
        hmo_id: paymentType.includes('HMO') ? hmoId : undefined,
        hmo_name: paymentType.includes('HMO') ? selectedHmo?.name : undefined,
        hmo_policy_code: paymentType.includes('HMO') ? hmoPolicyCode : undefined,
      });

      onBookingCreated(res);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to record walk-in booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Walk-in Patient Intake</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Babatunde Lawal"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="080 1234 5678"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="babatunde@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Attending Specialist / Clinic</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatDoctorName(d)} — {d.specialty || d.department?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Appointment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Time Slot</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
              >
                <option value="08:30 AM">08:30 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Category</label>
            <div className="grid grid-cols-2 gap-2">
              {['Self-Pay (Private)', 'HMO / Health Insurance'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPaymentType(type)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    paymentType === type
                      ? 'border-teal-600 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {paymentType.includes('HMO') && (
            <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
              <div>
                <label className="font-bold text-teal-900 block mb-1">HMO Provider</label>
                <select
                  value={hmoId}
                  onChange={(e) => setHmoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-teal-200 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-xs font-medium"
                >
                  {hmoCompanies.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.policy_code || h.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-teal-900 block mb-1">Enrollee Policy Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HYG-1029384-A"
                  value={hmoPolicyCode}
                  onChange={(e) => setHmoPolicyCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-teal-200 focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Chief Complaint / Reason (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Routine consultation, recurring fever, prescription refill..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              {loading ? 'Registering Intake...' : 'Check In to Clinic Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
