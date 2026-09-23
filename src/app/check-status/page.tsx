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
  CalendarClock,
  Mail,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { printElement } from '@/lib/printUtils';
import RescheduleModal from '@/components/RescheduleModal';

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.574 1.815.88 2.791.88 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.393 8.303c-.149.421-.736.78-1.02.83-.284.05-.62.062-1.895-.469-1.629-.678-2.678-2.339-2.759-2.449-.081-.11-.655-.873-.655-1.664 0-.791.413-1.18.561-1.341.149-.161.326-.201.435-.201.109 0 .218.001.312.006.101.005.237-.038.37.283.149.362.508 1.239.552 1.33.044.091.074.198.015.318-.059.12-.089.198-.178.301-.089.103-.187.23-.267.31-.089.088-.182.184-.078.362.103.178.461.761.99 1.232.682.608 1.258.796 1.436.885.178.089.282.078.386-.041.104-.119.444-.517.563-.695.118-.178.237-.149.397-.089.16.06 1.011.477 1.185.564.174.087.291.13.333.201.042.071.042.411-.107.832z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2 22l4.982-1.309C8.423 21.536 10.147 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.67 0-3.235-.487-4.558-1.325l-.326-.208-2.969.779.792-2.894-.225-.357A8.14 8.14 0 0 1 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.512 0 8.182 3.67 8.182 8.182 0 4.512-3.67 8.182-8.182 8.182z" />
    </svg>
  );
}

export default function CheckStatusPage() {
  const [refCode, setRefCode] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);

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

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`*ISALU HOSPITALS - APPOINTMENT TICKET*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎟️ *Ticket Reference:* ${booking.reference_code}\n👤 *Patient:* ${booking.patient_name}\n🏥 *Clinic:* ${booking.doctor_specialty || booking.department?.name || 'Specialist Consultation'}\n👨‍⚕️ *Specialist:* ${getDoctorInitialName(booking.doctor || booking.doctor_name)}\n📅 *Date & Time:* ${booking.date || booking.appointment_date} at ${booking.time || booking.appointment_time}\n💳 *Billing:* ${booking.payment_type}${booking.hmo_policy_code ? ` (Policy ID: ${booking.hmo_policy_code})` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📍 Address: No. 46, Ijaiye Road, Ogba, Ikeja, Lagos\n🔗 Track: ${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(booking.reference_code)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    const shareText = `Isalu Hospitals Appointment: ${booking.reference_code}\nPatient: ${booking.patient_name}\nDate: ${booking.date || booking.appointment_date} (${booking.time || booking.appointment_time})\nTrack: ${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(booking.reference_code)}`;
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      await navigator.clipboard.writeText(shareText);
                      setCopiedTicket(true);
                      setTimeout(() => setCopiedTicket(false), 3000);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
                >
                  {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedTicket ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => printElement('printable-ticket', 'Appointment Status - Isalu Hospitals')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  <span>Print Slip</span>
                </button>
              </div>
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
