// src/app/hmo/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Clock, 
  FileText, 
  BadgeHelp,
  Sparkles,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { HmoCompany } from '@/lib/types';
import { getHmoCompanies } from '@/lib/api';

export default function CheckHmoPage() {
  const [hmos, setHmos] = useState<HmoCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHmos() {
      try {
        setLoading(true);
        const data = await getHmoCompanies();
        setHmos(data || []);
      } catch (err) {
        console.error('Failed to load HMO partners:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHmos();
  }, []);

  const filteredHmos = hmos.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (h.name && h.name.toLowerCase().includes(q)) ||
      (h.code && h.code.toLowerCase().includes(q)) ||
      (h.policy_code && h.policy_code.toLowerCase().includes(q)) ||
      (h.email && h.email.toLowerCase().includes(q)) ||
      (h.phone && h.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-12 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-14 sm:py-20 border-b border-slate-800">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Accredited Health Maintenance Network
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Check Available HMOs at <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Isalu Hospitals</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Verify your health insurance provider before your visit. Isalu Hospitals partners with premier HMO networks for seamless outpatient specialist consultations, diagnostics, and admissions.
          </p>

          {/* Search Input */}
          <div className="pt-3 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by HMO name or code (e.g. Hygeia, Reliance, AXA Mansard)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/10 border border-slate-700 text-sm text-white placeholder-slate-400 focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-white absolute right-4 top-1/2 -translate-y-1/2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-xl font-black text-slate-900">{hmos.length}+</p>
            <p className="text-xs text-slate-500 mt-0.5">Accredited HMOs</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-xl font-black text-teal-700">100%</p>
            <p className="text-xs text-slate-500 mt-0.5">Direct Billing Desk</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-xl font-black text-blue-700">21+</p>
            <p className="text-xs text-slate-500 mt-0.5">Covered Specialties</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <p className="text-xl font-black text-emerald-700">24/7</p>
            <p className="text-xs text-slate-500 mt-0.5">Emergency Triage</p>
          </div>
        </div>

        {/* HMO Directory List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Accredited HMO Insurance Companies
              </h2>
              <p className="text-xs text-slate-500">
                Enrollees under the following approved providers receive direct care without cash upfront for covered benefits.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {filteredHmos.length} Available
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 animate-pulse space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredHmos.length === 0 ? (
            <div className="text-center py-16 p-6 rounded-3xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                No HMO provider found matching &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                If your HMO is not listed, our 24/7 Helpdesk can confirm secondary network coverage or out-of-pocket reimbursement eligibility.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-teal-600 hover:underline"
              >
                View All Available HMO Providers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredHmos.map((hmo) => (
                <div
                  key={hmo.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-500/60 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header with name and accreditation badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">
                            {hmo.name}
                          </h3>
                          <p className="text-[11px] font-mono text-slate-400">
                            Code: {hmo.policy_code || hmo.code || `HMO-${hmo.id}`}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Active Partner
                      </span>
                    </div>

                    {/* Coverage Highlights */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included Hospital Benefits
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200/80 font-medium">
                          ✓ Specialist Care
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200/80 font-medium">
                          ✓ Laboratory & Scans
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200/80 font-medium">
                          ✓ Prescriptions
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200/80 font-medium">
                          ✓ Emergency Triage
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="text-xs text-slate-500 space-y-1">
                      {hmo.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{hmo.phone}</span>
                        </div>
                      )}
                      {hmo.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{hmo.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Action */}
                  <Link
                    href="/"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Book Specialist Consultation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Instructions Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4">
          <div className="flex items-center gap-2.5 text-teal-400">
            <BadgeHelp className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">
              How to Access Medical Care Using Your HMO Card
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">
                1
              </span>
              <p className="font-bold text-white">Confirm Your HMO</p>
              <p className="text-slate-400 leading-relaxed">
                Check the list above to verify that your health maintenance organization is active at Isalu Hospitals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <p className="font-bold text-white">Book Your Slot</p>
              <p className="text-slate-400 leading-relaxed">
                Use our online appointment portal to pick your specialist doctor and consultation duty time slot.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <p className="font-bold text-white">Present ID at Triage</p>
              <p className="text-slate-400 leading-relaxed">
                Arrive with your physical HMO ID card or corporate enrollee code for instant verification at our front desk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
