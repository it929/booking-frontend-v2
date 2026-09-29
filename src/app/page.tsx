// src/app/page.tsx
'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BookingWizard from '@/components/BookingWizard';
import {  
  Clock,  
  Sparkles, 
  Stethoscope, 
  Calendar, 
  PhoneCall,  
  Award, 
  HeartHandshake, 
  ChevronDown, 
  ArrowRight,
  Activity,
  Building2,
  Users,
  MapPin
} from 'lucide-react';

function BookingContent() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctor_id') || searchParams.get('doc_id') || undefined;
  const deptId = searchParams.get('dept') || searchParams.get('dept_id') || undefined;

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: 'Do I have to pay online when booking an appointment?',
      a: 'No online payment is mandatory to reserve your consultation slot. For Private Self-Pay, your slot is confirmed instantly, and you can settle consultation charges at the hospital cashier on the day of your visit. For HMO patients, your pre-registration is checked directly against your HMO policy without upfront private charges.'
    },
    {
      q: 'Which HMO providers are accredited at Isalu Hospitals?',
      a: 'We accept leading Health Maintenance Organizations including Hygeia HMO, Reliance HMO, AXA Mansard Health, Leadway Health, Avon HMO, Total Health Trust, Anchor HMO, and many more. You can check the complete list on our HMO Directory page.'
    },
    {
      q: 'Can I reschedule my appointment if my availability changes?',
      a: 'Yes, easily! You can use our "Check / Reschedule Ticket" portal at any time by simply entering your unique Ticket Reference code (e.g. ISL-10294) and selecting an alternative clinic date and consulting shift.'
    },
    {
      q: 'What should I bring along on the day of my consultation?',
      a: 'Please present your Digital Appointment Ticket (on your phone or printed slip) at the hospital reception/triage desk. If you are an HMO enrollee, kindly bring your active HMO corporate ID card and a valid form of identification.'
    }
  ];

  return (
    <div className="w-full">
      {/* ---------------- HERO SECTION: EMERGENCY & APPOINTMENT FLOW ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50/50 pt-6 pb-8 sm:pt-8 sm:pb-10 border-b border-slate-200/60">
        {/* Subtle decorative background aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-gradient-to-tr from-[#38bdf8]/10 via-[#0082cd]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4">
            
            {/* Emergency Dispatch */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-rose-50 border border-rose-200/80 text-rose-950 shadow-xs text-xs sm:text-sm animate-slide-up">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-bold text-slate-700">Emergency Dispatch:</span>
              <a
                href="tel:+2347063911672"
                className="font-black text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5 transition-colors"
                title="Call Emergency Dispatch"
              >
                <PhoneCall className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>+234 706 3911 672</span>
              </a>
              <span className="text-rose-300 hidden sm:inline">•</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full hidden sm:inline">
                24/7 Rapid Response
              </span>
            </div>

            {/* Find a Specialist → View Clinic Schedule → Book Your Appointment */}
            <div className="w-full max-w-3xl pt-1">
              <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-800 tracking-tight flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0082cd] border border-slate-200 hover:border-sky-300 shadow-2xs transition-all group"
                >
                  <Stethoscope className="w-4 h-4 text-[#0082cd] group-hover:scale-110 transition-transform" />
                  <span>Find a Specialist</span>
                </Link>

                <ArrowRight className="w-4 h-4 text-[#0082cd] shrink-0" />

                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0082cd] border border-slate-200 hover:border-sky-300 shadow-2xs transition-all group"
                >
                  <Calendar className="w-4 h-4 text-[#006bac] group-hover:scale-110 transition-transform" />
                  <span>View Clinic Schedule</span>
                </Link>

                <ArrowRight className="w-4 h-4 text-[#0082cd] shrink-0" />

                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0082cd] to-[#006bac] text-white font-extrabold shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Book Your Appointment</span>
                </span>
              </h1>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- MAIN BOOKING PORTAL ---------------- */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 relative pb-16">
        <BookingWizard initialDoctorId={doctorId} initialDeptId={deptId} />
      </section>

      {/* ---------------- HOW IT WORKS (3 SIMPLE STEPS) ---------------- */}
      <section className="bg-white py-14 sm:py-18 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#0082cd] bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200">
              Seamless Patient Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How Online Booking Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Fast, intuitive, and transparent healthcare scheduling designed for patient convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all hover:shadow-lg hover:-translate-y-1 duration-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0082cd] text-white font-black text-lg flex items-center justify-center shadow-md shadow-[#0082cd]/30">
                1
              </div>
              <h3 className="text-lg font-black text-slate-900">Select Specialty & Doctor</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Browse our clinical units (e.g. Cardiology, Paediatrics, O&G) and select your preferred consulting physician based on real-time duty roster schedules.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all hover:shadow-lg hover:-translate-y-1 duration-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#006bac] text-white font-black text-lg flex items-center justify-center shadow-md shadow-[#006bac]/30">
                2
              </div>
              <h3 className="text-lg font-black text-slate-900">Pick Shift & Input Info</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Choose convenient morning or afternoon clinic slots. Provide basic patient demographics and choose between Private Self-Pay or HMO Enrollee verification.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all hover:shadow-lg hover:-translate-y-1 duration-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
                3
              </div>
              <h3 className="text-lg font-black text-slate-900">Get Instant Digital Slip</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your consultation reference ticket is generated instantly with shift instructions, printable slip, and WhatsApp share link for fast-track front-desk check-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FREQUENTLY ASKED QUESTIONS ---------------- */}
      <section className="bg-slate-50 py-14 sm:py-18 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#0082cd] bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200">
              Patient Help Desk
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Have questions about booking, HMO billing, or hospital attendance?
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = faqOpen === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-800 text-xs sm:text-sm hover:text-[#0082cd] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#0082cd]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-slide-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
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
