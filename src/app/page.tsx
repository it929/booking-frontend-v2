// src/app/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingWizard from '@/components/BookingWizard';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        <div className="h-96 bg-slate-100 rounded-3xl mt-8" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<BookingFallback />}>
      <BookingContent />
    </Suspense>
  );
}
