// src/app/check-status/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Check,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import { printElement } from '@/lib/printUtils';
import { downloadTicketPdf, shareTicketToWhatsApp } from '@/lib/pdfUtils';
import RescheduleModal from '@/components/RescheduleModal';
import IsaluLogo from '@/components/IsaluLogo';

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.574 1.815.88 2.791.88 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.393 8.303c-.149.421-.736.78-1.02.83-.284.05-.62.062-1.895-.469-1.629-.678-2.678-2.339-2.759-2.449-.081-.11-.655-.873-.655-1.664 0-.791.413-1.18.561-1.341.149-.161.326-.201.435-.201.109 0 .218.001.312.006.101.005.237-.038.37.283.149.362.508 1.239.552 1.33.044.091.074.198.015.318-.059.12-.089.198-.178.301-.089.103-.187.23-.267.31-.089.088-.182.184-.078.362.103.178.461.761.99 1.232.682.608 1.258.796 1.436.885.178.089.282.078.386-.041.104-.119.444-.517.563-.695.118-.178.237-.149.397-.089.16.06 1.011.477 1.185.564.174.087.291.13.333.201.042.071.042.411-.107.832z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2 22l4.982-1.309C8.423 21.536 10.147 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.67 0-3.235-.487-4.558-1.325l-.326-.208-2.969.779.792-2.894-.225-.357A8.14 8.14 0 0 1 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.512 0 8.182 3.67 8.182 8.182 0 4.512-3.67 8.182-8.182 8.182z" />
    </svg>
  );
}

function CheckStatusContent() {
  const searchParams = useSearchParams();
  const urlRef = searchParams.get('ref');
  const urlDownload = searchParams.get('download');
  const [refCode, setRefCode] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  useEffect(() => {
    if (urlRef && !booking && !loading) {
      const code = urlRef.trim().toUpperCase();
      setRefCode(code);
      setLoading(true);
      setError(null);
      lookupBooking(code)
        .then((result) => {
          setBooking(result);
          if (urlDownload === 'pdf') {
            downloadTicketPdf(result, `Isalu-Appointment-${result.reference_code}.pdf`);
            setPdfMessage('Official PDF ticket voucher downloaded!');
            setTimeout(() => setPdfMessage(null), 5000);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Could not find appointment with this code.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [urlRef, urlDownload]);

  const handleWhatsAppPdf = async () => {
    if (!booking) return;
    try {
      setPdfLoading(true);
      const res = await shareTicketToWhatsApp(
        booking,
        'printable-ticket',
        () => getDoctorInitialName(booking.doctor || booking.doctor_name)
      );
      if (res.downloaded) {
        setPdfMessage('Official PDF slip downloaded! In WhatsApp, click 📎 Attach ➔ Document to send it, or send the direct link.');
        setTimeout(() => setPdfMessage(null), 8000);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!booking) return;
    try {
      setPdfLoading(true);
      await downloadTicketPdf(booking, `Isalu-Appointment-${booking.reference_code}.pdf`);
      setPdfMessage('Official PDF ticket voucher downloaded successfully!');
      setTimeout(() => setPdfMessage(null), 5000);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0082cd] bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200 shadow-2xs">
          <CalendarClock className="w-3.5 h-3.5 text-[#0082cd]" />
          <span>Patient Portal & Verification</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Track Ticket & Reschedule Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Enter your unique Appointment Reference Code (e.g. <strong className="text-slate-900 font-mono">ISL-10294</strong>) to track your clinical booking status, download your verification slip, or reschedule your consultation.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Reference Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ISL-10294"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0082cd]/20 focus:border-[#0082cd] font-mono font-bold bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans"
            />
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-800">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
            <input
              type="tel"
              placeholder="e.g. 0803 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082cd]/20 focus:border-[#0082cd] bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#0082cd] to-[#006bac] hover:from-[#0073b6] hover:to-[#005a91] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0082cd]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-slide-up">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {pdfMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-slide-up shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pdfMessage}</span>
        </div>
      )}

      {booking && (
        <div className="space-y-6 animate-scale-pop">
          <div id="printable-ticket" className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
            {/* Ticket Header with Logo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-slate-200 pb-5">
              <div className="space-y-1">
                <IsaluLogo variant="full" size="md" />
                <p className="text-[11px] text-slate-500 font-medium">
                  No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • Emergency: +234 706 3911 672
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Ticket Reference</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#0082cd] tracking-tight">{booking.reference_code}</span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    booking.status === 'Checked In'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : booking.status === 'Confirmed'
                      ? 'bg-sky-100 text-[#006bac] border border-sky-200'
                      : booking.status === 'Completed'
                      ? 'bg-slate-100 text-slate-800 border border-slate-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  Status: {booking.status}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Patient Name</span>
                <p className="font-black text-slate-900 text-sm">{booking.patient_name}</p>
                <p className="text-xs text-slate-500 font-medium">{booking.patient_phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Specialist Consultant</span>
                <p className="font-black text-slate-900 text-sm">{getDoctorInitialName(booking.doctor || booking.doctor_name)}</p>
                <p className="text-xs text-[#0082cd] font-bold">{booking.doctor_specialty || booking.department?.name || 'Specialist Consultation'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Consultation Schedule</span>
                <p className="font-black text-slate-900 text-sm">{booking.date || booking.appointment_date}</p>
                <p className="text-xs text-slate-600 font-mono font-bold">{booking.time || booking.appointment_time}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Billing Channel</span>
                <p className="font-bold text-slate-800 text-sm">{booking.payment_type}</p>
                <p className="text-xs text-slate-500">
                  Settlement: <strong className="text-emerald-700 font-bold">{booking.payment_status || 'Verified at Desk'}</strong>
                </p>
              </div>

              {booking.payment_type.includes('HMO') && (
                <div className="space-y-1 sm:col-span-2 bg-sky-50/80 p-3 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">HMO Health Provider Details</span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 text-xs">{booking.hmo_name || 'HMO Provider'}</p>
                    {booking.hmo_policy_code && (
                      <span className="font-mono text-xs font-bold text-sky-900 bg-white px-2 py-0.5 rounded border border-sky-200">
                        Enrollee ID: {booking.hmo_policy_code}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reschedule Note if present */}
            {booking.reason && booking.reason.includes('Rescheduled') && (
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2.5">
                <CalendarClock className="w-4 h-4 text-[#0082cd] shrink-0" />
                <span><strong>Schedule Record:</strong> {booking.reason}</span>
              </div>
            )}

            {/* Barcode & Notice */}
            <div className="pt-2 text-center space-y-1.5 border-t border-slate-100">
              <div className="inline-block p-2 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-center gap-1.5 tracking-widest font-mono text-lg font-black text-slate-800">
                  ||| | |||| | || ||| || ||| ||||
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  Scan at Outpatient Triage Reception Desk
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Please present this voucher upon arrival 15 minutes before your shift window.
              </p>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {booking.is_active && !['Completed', 'Cancelled', 'Rejected', 'Deleted', 'Checked In', 'In Consultation'].includes(booking.status) ? (
                  <button
                    type="button"
                    onClick={() => setIsRescheduleOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#006bac] font-bold border border-sky-200 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <CalendarClock className="w-4 h-4 text-[#0082cd]" />
                    <span>Reschedule Consultation</span>
                  </button>
                ) : (
                  <span>Need changes or support? Emergency Dispatch: +234 706 3911 672</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-[#006bac] font-bold border border-sky-200 transition-colors cursor-pointer shadow-2xs"
                  title="Download official PDF ticket voucher"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#0082cd]" />
                  <span>PDF Slip</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppPdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Share official PDF ticket via WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                  <span className="text-[9px] uppercase font-black tracking-wider bg-white/25 px-1 py-0.5 rounded text-white shadow-2xs">
                    PDF
                  </span>
                </button>

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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedTicket ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => printElement('printable-ticket', 'Appointment Status - Isalu Hospitals')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
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

export default function CheckStatusPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-500 font-medium animate-pulse">Loading appointment verification portal...</div>}>
      <CheckStatusContent />
    </Suspense>
  );
}
