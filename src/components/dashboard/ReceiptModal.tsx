// src/components/dashboard/ReceiptModal.tsx
'use client';

import React, { useEffect } from 'react';
import { Booking, formatDoctorName, isHmoBooking } from '@/lib/types';
import { Printer, X, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import IsaluLogo from '@/components/IsaluLogo';
import { printElement } from '@/lib/printUtils';

interface ReceiptModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export default function ReceiptModal({ booking, onClose }: ReceiptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!booking) return null;

  const isCompleted = booking.status === 'Completed';

  const handlePrint = () => {
    printElement(
      'printable-receipt',
      isCompleted
        ? `Isalu Hospitals - Consultation Summary Slip (${booking.reference_code})`
        : `Isalu Hospitals - Appointment Intake Slip (${booking.reference_code})`
    );
  };

  const formatTimestamp = (val?: string | null) => {
    if (!val) return null;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      return val;
    } catch {
      return val;
    }
  };

  const isHmo = isHmoBooking(booking);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
      >
        {/* Fixed Header */}
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCompleted ? 'bg-emerald-500' : 'bg-teal-500'
              }`}
            />
            <h3 id="receipt-modal-title" className="font-bold text-sm text-slate-900">
              {isCompleted
                ? 'Official Consultation Slip & Record'
                : 'Official Appointment & Intake Slip'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Printable Receipt Body */}
        <div
          id="printable-receipt"
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-4"
        >
          {/* Hospital Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <div className="flex justify-center mb-2">
              <IsaluLogo variant="full" size="md" />
            </div>
            <p className="text-[11px] text-slate-500">
              No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • Tel: +234 800 47258 2273
            </p>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Consultation Completed & Archived
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-teal-600" /> Clinic Intake Verified
              </span>
            )}
          </div>

          {/* Reference & Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 text-xs bg-slate-50/90 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                Reference Code
              </span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {booking.reference_code}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                {isCompleted ? 'Archive Ref' : 'Intake Ref'}
              </span>
              <span className="font-mono font-bold text-teal-700 text-sm">
                {booking.invoice_ref ||
                  (isCompleted ? `ARC-${booking.reference_code}` : `ISL-${booking.reference_code}`)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                Date & Time
              </span>
              <span className="font-medium text-slate-700">
                {booking.date || booking.appointment_date} at {booking.time || booking.appointment_time}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                Settlement
              </span>
              <span className="font-medium text-slate-700 truncate block">
                {booking.payment_method || (isHmo ? 'HMO Authorization' : 'Desk Settlement')}
              </span>
            </div>
          </div>

          {/* Patient & Specialist Particulars */}
          <div className="space-y-1 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-900">{booking.patient_name}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Contact Phone:</span>
              <span className="font-mono font-medium text-slate-700">{booking.patient_phone}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Attending Specialist:</span>
              <span className="font-semibold text-slate-900">
                {formatDoctorName(booking.doctor_name)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Clinic / Department:</span>
              <span className="font-medium text-teal-700">
                {booking.doctor?.department?.name ||
                  booking.doctor_specialty ||
                  'General Consultation'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Billing Category:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                {isHmo ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline" /> HMO Insurance
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 inline" /> Private Self-Pay
                  </>
                )}
              </span>
            </div>
            {(booking.hmo_name || booking.hmo_company?.name) && (
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">HMO Provider:</span>
                <span className="font-semibold text-teal-800">
                  {booking.hmo_name || booking.hmo_company?.name}
                </span>
              </div>
            )}
            {booking.hmo_policy_code && (
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Policy / Enrollee ID:</span>
                <span className="font-mono text-slate-800">{booking.hmo_policy_code}</span>
              </div>
            )}
            {booking.hmo_auth_code && (
              <div className="flex justify-between py-1.5 bg-teal-50/60 px-2 rounded-lg my-0.5">
                <span className="text-teal-800 font-semibold">HMO Auth Code:</span>
                <span className="font-mono font-bold text-teal-900">{booking.hmo_auth_code}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Status:</span>
              <span
                className={`font-semibold ${
                  isCompleted ? 'text-emerald-700 font-bold' : 'text-slate-900'
                }`}
              >
                {booking.status}
              </span>
            </div>
            {isCompleted && booking.completed_at && (
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Concluded At:</span>
                <span className="font-medium text-slate-700">
                  {formatTimestamp(booking.completed_at)}
                </span>
              </div>
            )}
          </div>

          {/* Status Box */}
          {isCompleted ? (
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Consultation Concluded
                </span>
                <span className="text-[11px] text-emerald-700">
                  Clinical session concluded & archived
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> Completed
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-900 block">
                  Clinic Intake Status
                </span>
                <span className="text-[11px] text-teal-700">
                  Internal Hospital Settlement & Clearance
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" /> Cleared for Queue
              </div>
            </div>
          )}

          {/* Stamp / Footer Note */}
          <div className="pt-1 text-center text-[10px] text-slate-400 space-y-0.5">
            <p>
              {isCompleted
                ? 'Official outpatient consultation summary record • Medical Records Archive'
                : 'Computer generated appointment voucher. Present this slip for clinical desk triage.'}
            </p>
            <p>Isalu Hospitals • Electronic Health Records & Clinical Services</p>
          </div>
        </div>

        {/* Fixed Action Buttons Footer */}
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isCompleted ? 'Print Consultation Slip' : 'Print Intake Slip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
