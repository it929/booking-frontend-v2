// src/app/check-status/page.tsx
'use client';

import React, { useState } from 'react';
import { lookupBooking } from '@/lib/api';
import { Booking, formatDoctorName, getDoctorInitialName } from '@/lib/types';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  CreditCard, 
  ShieldCheck, 
  PhoneCall,
  CalendarClock
} from 'lucide-react';
import Link from 'next/link';
import { printElement } from '@/lib/printUtils';
import RescheduleModal from '@/components/RescheduleModal';

export default function CheckStatusPage() {
  const [refCode, setRefCode] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCode.trim()) {
      setError('Please enter your Reference Code (e.g. ISL-10294)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setBooking(null);
      const result = await lookupBooking(refCode.trim(), phone.trim() || undefined);
      setBooking(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Could not find appointment. Please verify the code and phone number.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
          Reschedule Appointment
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Reschedule Your Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your reference code to view your booking details and reschedule your appointment date or time.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-md shadow-slate-200/40 mb-6">
        <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Reference Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ISL-90214"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
            />
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? 'Searching...' : <><Search className="w-4 h-4" /> Find Booking</>}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {booking && (
        <div className="space-y-6">

          <div id="printable-ticket" className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ticket Number</span>
                <h2 className="text-3xl font-black text-slate-900 tracking-wide mt-0.5">{booking.reference_code}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    booking.status === 'Checked In'
                      ? 'bg-emerald-100 text-emerald-800'
                      : booking.status === 'Confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'Completed'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Status: {booking.status}
                </span>
              </div>
            </div>



            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Patient Name</span>
                <p className="font-bold text-slate-900 text-sm">{booking.patient_name}</p>
                <p className="text-xs text-slate-500">{booking.patient_phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Specialist Consultant</span>
                <p className="font-bold text-slate-900 text-sm">{getDoctorInitialName(booking.doctor || booking.doctor_name)}</p>
                <p className="text-xs text-teal-600 font-medium">{booking.doctor_specialty}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Scheduled Time</span>
                <p className="font-bold text-slate-900 text-sm">{booking.date || booking.appointment_date}</p>
                <p className="text-xs text-slate-600">{booking.time || booking.appointment_time}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Payment Category</span>
                <p className="font-semibold text-slate-800 text-sm">{booking.payment_type}</p>
                <p className="text-xs text-slate-500">Status: <strong className="text-slate-800">{booking.payment_status}</strong></p>
              </div>

              {booking.payment_type.includes('HMO') && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">HMO Authorization</span>
                  <p className="font-semibold text-slate-800 text-sm">{booking.hmo_name || 'HMO Provider'}</p>
                  <p className="text-xs text-teal-700">
                    Pre-Auth Status: <strong>{booking.hmo_status}</strong>
                    {booking.hmo_auth_code && ` (${booking.hmo_auth_code})`}
                  </p>
                </div>
              )}

              {booking.invoice_ref && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Billing Invoice</span>
                  <p className="font-bold text-slate-900 text-sm">{booking.invoice_ref}</p>
                  <p className="text-xs text-emerald-600 font-medium">Receipt Settled</p>
                </div>
              )}
            </div>

            {/* Reschedule Note if present */}
            {booking.reason && booking.reason.includes('Rescheduled') && (
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-teal-700 shrink-0" />
                <span><strong>Schedule Record:</strong> {booking.reason}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {booking.is_active && !['Completed', 'Cancelled', 'Rejected', 'Deleted', 'Checked In', 'In Consultation'].includes(booking.status) ? (
                  <button
                    type="button"
                    onClick={() => setIsRescheduleOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4 text-teal-700" />
                    <span>Reschedule Consultation</span>
                  </button>
                ) : (
                  <span>Need changes or support? Contact +234 800 47258 2273</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => printElement('printable-ticket', 'Appointment Status - Isalu Hospitals')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Details
              </button>
            </div>
          </div>

          <RescheduleModal
            booking={booking}
            isOpen={isRescheduleOpen}
            onClose={() => setIsRescheduleOpen(false)}
            onRescheduled={(updated) => {
              setBooking(updated);
            }}
          />
        </div>
      )}
    </div>
  );
}
