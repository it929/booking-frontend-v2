// src/app/page.tsx
'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BookingWizard from '@/components/BookingWizard';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Stethoscope, 
  Calendar, 
  PhoneCall, 
  FileText, 
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
      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-200/60">
        {/* Subtle decorative background aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-gradient-to-tr from-[#38bdf8]/15 via-[#0082cd]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Live Triage Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#bae6fd] text-[#006bac] shadow-xs text-xs font-bold animate-slide-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Outpatient Triage & Instant Slot Allocation</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> HEFAMAA Certified
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] animate-slide-up">
              Specialist Medical Care, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#0082cd] via-[#006bac] to-[#053b61] bg-clip-text text-transparent">
                Reserved in Real-Time
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed animate-slide-up">
              Connect directly with board-certified consultants across 25+ specialized outpatient departments. Guaranteed priority front-desk intake for Private Self-Pay and HMO enrollees.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
              <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <p className="text-lg sm:text-xl font-black text-[#0082cd]">25+</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clinical Units</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <p className="text-lg sm:text-xl font-black text-emerald-600">0 Mins</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Queue Bypass</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <p className="text-lg sm:text-xl font-black text-[#006bac]">8+ HMOs</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Direct Coverage</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <p className="text-lg sm:text-xl font-black text-amber-600">24/7</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Care</p>
              </div>
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

      {/* ---------------- TRUST & PATIENT PRIVILEGES ---------------- */}
      <section className="bg-slate-900 text-white py-14 sm:py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> High Standard Clinical Experience
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Designed for Patient Comfort, Privacy, and Timely Care.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                At Isalu Hospitals, our digital booking system coordinates directly with our Electronic Health Record (EHR) and nursing triage, ensuring that consulting doctors have real-time visibility into incoming patients without overcrowding.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-white">Controlled Clinic Capacity</h4>
                    <p className="text-xs text-slate-400">Strict caps per doctor per shift avoid waiting fatigue and guarantee thorough consultation time.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-white">Full HMO Support & Pre-Authorization</h4>
                    <p className="text-xs text-slate-400">Dedicated desk officers expedite primary and secondary health provider approvals.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-white">24/7 Reschedule Flexibility</h4>
                    <p className="text-xs text-slate-400">Easily swap your appointment date anytime without calling or visiting in person.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h3 className="text-base font-black text-white">Already Have an Appointment?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Track ticket details or adjust clinic date in seconds.</p>
                </div>
                <Calendar className="w-8 h-8 text-sky-400" />
              </div>

              <div className="space-y-3">
                <Link
                  href="/check-status"
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#0082cd] to-[#006bac] hover:from-[#0073b6] hover:to-[#005a91] text-white font-bold text-xs shadow-md transition-all active:scale-98"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Track Existing Reference Code
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/doctors"
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-slate-700/70 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> Browse Specialist Consultants Directory
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/hmo"
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-slate-700/70 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Check Accredited HMO Providers
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <PhoneCall className="w-3.5 h-3.5" /> Emergency: +234 800 47258 2273
                </span>
                <span>Open 24/7 Daily</span>
              </div>
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
