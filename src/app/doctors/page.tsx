// src/app/doctors/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Department, 
  Doctor, 
  getDoctorBillingCategory,
  getDoctorInitialName,
  getDoctorInitials,
  getDoctorShiftTime
} from '@/lib/types';
import { getDepartments, getDoctors } from '@/lib/api';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Search, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

function DoctorsContent() {
  const searchParams = useSearchParams();
  const initialDept = searchParams.get('dept');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(
    initialDept ? Number(initialDept) : null
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData(silent = false) {
      try {
        if (!silent) setLoading(true);
        const [deptsData, docsData] = await Promise.all([
          getDepartments(), 
          getDoctors(undefined, silent)
        ]);
        setDepartments(deptsData);
        setDoctors(docsData);
      } catch (err) {
        console.error('Error fetching doctors data:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    }
    loadData(false);

    // Silently refresh doctor clinic schedules and quotas in background every 12 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 12000);

    // Revalidate live quotas when the user returns or switches tabs
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const getDepartmentName = (doc: Doctor): string => {
    if (doc.department?.name) return doc.department.name;
    if (doc.department_id) {
      const found = departments.find((d) => d.id === doc.department_id);
      if (found?.name) return found.name;
    }
    return doc.specialty || 'Clinical Services';
  };

  const getDutyDaysWithCap = (doc: Doctor): Array<{ day: string; capacity: number }> => {
    const result: Array<{ day: string; capacity: number }> = [];

    if (doc.schedules && doc.schedules.length > 0) {
      doc.schedules.forEach((s) => {
        const cap = Number(s.capacity) || Number(doc.daily_capacity) || 20;
        const days: string[] = [];
        if (Array.isArray(s.duty_days) && s.duty_days.length > 0) {
          s.duty_days.forEach((d) => {
            if (d && !days.includes(d)) days.push(d);
          });
        } else if (typeof s.duty_days === 'string' && s.duty_days) {
          s.duty_days.split(',').forEach((d) => {
            const trimmed = d.trim();
            if (trimmed && !days.includes(trimmed)) days.push(trimmed);
          });
        } else if (s.day_of_week) {
          days.push(s.day_of_week);
        }

        days.forEach((dayName) => {
          const existing = result.find((item) => item.day.toLowerCase() === dayName.toLowerCase());
          if (!existing) {
            result.push({ day: dayName, capacity: cap });
          } else if (cap > existing.capacity) {
            existing.capacity = cap;
          }
        });
      });
    }

    if (doc.available_days && doc.available_days.length > 0) {
      doc.available_days.forEach((d) => {
        const existing = result.find((item) => item.day.toLowerCase() === d.toLowerCase());
        if (!existing) {
          result.push({
            day: d,
            capacity: Number(doc.daily_capacity) || Number(doc.schedules?.[0]?.capacity) || 20,
          });
        }
      });
    }

    // If an ordinal day exists (e.g. "1st & 3rd Sat"), remove redundant plain base day (e.g. "Sat")
    const hasOrdinal = (name: string) => /1st|2nd|3rd|4th|5th/i.test(name);
    const ordinalDays = result.filter(item => hasOrdinal(item.day));
    if (ordinalDays.length > 0) {
      return result.filter(item => {
        if (hasOrdinal(item.day)) return true;
        const dayLower = item.day.toLowerCase();
        return !ordinalDays.some(ord => ord.day.toLowerCase().includes(dayLower));
      });
    }

    if (result.length === 0) {
      result.push({
        day: 'Mon – Fri',
        capacity: Number(doc.daily_capacity) || Number(doc.schedules?.[0]?.capacity) || 20,
      });
    }

    return result;
  };

  const filteredDoctors = [...doctors]
    .filter((doc) => {
      const matchesDept = selectedDeptId ? doc.department_id === selectedDeptId : true;
      const initialName = getDoctorInitialName(doc).toLowerCase();
      const initials = getDoctorInitials(doc).toLowerCase();
      const matchesSearch = search
        ? doc.name.toLowerCase().includes(search.toLowerCase()) ||
          (doc.full_name && doc.full_name.toLowerCase().includes(search.toLowerCase())) ||
          initialName.includes(search.toLowerCase()) ||
          initials.includes(search.toLowerCase()) ||
          (doc.specialty && doc.specialty.toLowerCase().includes(search.toLowerCase())) ||
          (doc.qualification && doc.qualification.toLowerCase().includes(search.toLowerCase())) ||
          getDepartmentName(doc).toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesDept && matchesSearch;
    })
    .sort((a, b) => {
      const deptA = getDepartmentName(a).trim();
      const deptB = getDepartmentName(b).trim();
      const deptCompare = deptA.localeCompare(deptB, undefined, { sensitivity: 'base' });
      if (deptCompare !== 0) return deptCompare;

      const nameA = getDoctorInitialName(a).trim();
      const nameB = getDoctorInitialName(b).trim();
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0082cd] bg-sky-50 px-3.5 py-1 rounded-full border border-sky-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#0082cd]" />
          <span>Consulting Medical Directory</span>
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Specialist Doctors & Medical Consultants
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Isalu Hospitals features accredited specialist medical consultants covering 25 comprehensive clinical disciplines with real-time shift scheduling and quota allocation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#0082cd] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by doctor name or specialty (e.g. Cardiologist, O&G, Paediatrics)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0082cd]/20 focus:border-[#0082cd] bg-slate-50/50 focus:bg-white transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => {
              setSelectedDeptId(null);
              setSearch('');
            }}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shrink-0 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Department Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedDeptId(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
              selectedDeptId === null
                ? 'bg-[#0082cd] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            All Specialties ({doctors.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDeptId(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                selectedDeptId === d.id
                  ? 'bg-[#0082cd] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 animate-pulse">Loading specialist directory...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-black text-slate-800 text-base">No specialists found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or resetting department filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover-card-lift flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Subtle top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0082cd] to-[#005B9C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0082cd] to-[#38bdf8] text-white font-black text-base flex items-center justify-center shadow-md shadow-[#0082cd]/25 shrink-0">
                    {getDoctorInitials(doc)}
                  </div>
                  <span className="text-xs font-bold text-[#006bac] bg-sky-50 px-3 py-1 rounded-full border border-sky-200 truncate max-w-[170px] text-right">
                    {doc.department?.name || 'Consultant'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0082cd] transition-colors">{getDoctorInitialName(doc)}</h3>
                  <p className="text-xs font-bold text-[#0082cd] mt-0.5">
                    {doc.specialty || doc.department?.name || 'Specialist Consultant'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {doc.bio || 'Senior Clinical Consultant specializing in high quality clinical care at Isalu Hospitals.'}
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#0082cd]" /> Duty Days:
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {getDutyDaysWithCap(doc).map((item, dIdx) => (
                        <span key={dIdx} className="inline-flex items-center gap-1">
                          <span className="font-bold text-slate-800 text-[11px]">{item.day}</span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-sky-50 text-[#006bac] border border-sky-200"
                            title={`Daily Clinic Capacity: ${item.capacity} patients`}
                          >
                            Cap: {item.capacity}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#0082cd]" /> Shift Time:
                    </span>
                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                      {getDoctorShiftTime(doc)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0082cd]" /> Billing Channels:
                    </span>
                    {(() => {
                      const billing = getDoctorBillingCategory(doc);
                      return (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${billing.badgeClass}`}>
                          {billing.label}
                        </span>
                      );
                    })()}
                  </div>

                  {doc.next_schedule && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70">
                      <span className="text-slate-600 flex items-center gap-1.5 text-xs font-semibold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Next Clinic:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-[11px]">{doc.next_schedule.formatted_date}</span>
                        {doc.next_schedule.is_fully_booked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            Full
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {doc.next_schedule.booked_count}/{doc.next_schedule.capacity} Booked
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  Duty Days Available
                </span>
                <Link
                  href={`/?doctor_id=${doc.id}&dept=${doc.department_id || ''}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0082cd] to-[#006bac] hover:from-[#0073b6] hover:to-[#005a91] text-white text-xs font-bold shadow-sm shadow-[#0082cd]/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading directory...</div>}>
      <DoctorsContent />
    </Suspense>
  );
}
