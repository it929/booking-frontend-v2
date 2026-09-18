// src/app/book/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingWizard from '@/components/BookingWizard';
import { ShieldCheck, Clock, Calendar, CheckCircle2 } from 'lucide-react';

function BookingContent() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctor_id') || searchParams.get('doc_id') || undefined;
  const deptId = searchParams.get('dept') || searchParams.get('dept_id') || undefined;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 space-y-1.5 sm:space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200">
          Online Appointment Portal
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Book Specialist Medical Consultation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto">
          Reserve your specialist consultation slot online with real-time clinic capacity.
        </p>
      </div>

      <BookingWizard initialDoctorId={doctorId} initialDeptId={deptId} />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Private & HMO Covered</p>
            <p className="text-slate-500 mt-0.5">We accept private self-pay alongside 8+ premier HMO health maintenance providers.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
          <Clock className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Zero Waiting Lines</p>
            <p className="text-slate-500 mt-0.5">Your slot guarantees prioritized front-desk intake and consultation queueing.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Instant Verification</p>
            <p className="text-slate-500 mt-0.5">Digital appointment ticket issued immediately with unique reference tracking code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingFallback() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-in fade-in duration-300">
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-4 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
        Connecting to Isalu EHR Clinical Roster...
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Loading Specialist Booking Portal</h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
        Please wait a moment while we retrieve real-time specialist schedules and consulting duty rosters.
      </p>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingContent />
    </Suspense>
  );
}
