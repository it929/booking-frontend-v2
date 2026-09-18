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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
          Medical Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Specialist Doctors & Consultants
        </h1>
        <p className="text-sm text-slate-500">
          Isalu Hospitals features certified specialist consultants covering 25 comprehensive medical disciplines.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by doctor name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={() => {
              setSelectedDeptId(null);
              setSearch('');
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shrink-0"
          >
            Reset Filters
          </button>
        </div>

        {/* Department Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedDeptId(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDeptId === null
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Specialties ({doctors.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDeptId(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDeptId === d.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading specialist directory...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">No specialists found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or resetting department filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:border-teal-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-teal-500/20">
                    {getDoctorInitials(doc)}
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {doc.department?.name || 'Consultant'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-4">{getDoctorInitialName(doc)}</h3>
                <p className="text-xs font-semibold text-teal-600 mt-0.5">
                  {doc.specialty || doc.department?.name || 'Specialist Consultant'}
                </p>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-2">
                  {doc.bio || 'Senior Clinical Consultant specializing in high quality clinical care at Isalu Hospitals.'}
                </p>

                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> Duty Days:
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {getDutyDaysWithCap(doc).map((item, dIdx) => (
                        <span key={dIdx} className="inline-flex items-center gap-1">
                          <span className="font-semibold text-slate-800">{item.day}</span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200"
                            title={`Daily Clinic Capacity: ${item.capacity} patients`}
                          >
                            Cap: {item.capacity}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift Time:
                    </span>
                    <span className="font-medium text-slate-700">
                      {getDoctorShiftTime(doc)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Patient Types:
                    </span>
                    {(() => {
                      const billing = getDoctorBillingCategory(doc);
                      return (
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${billing.badgeClass}`}>
                          {billing.label}
                        </span>
                      );
                    })()}
                  </div>
                  {doc.next_schedule && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <Calendar className="w-3.5 h-3.5 text-teal-600" /> Next Clinic:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{doc.next_schedule.formatted_date}</span>
                        {doc.next_schedule.is_fully_booked ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                            Full ({doc.next_schedule.booked_count}/{doc.next_schedule.capacity})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {doc.next_schedule.booked_count}/{doc.next_schedule.capacity} Booked
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                  Active Consulting Roster
                </span>
                <Link
                  href={`/?doctor_id=${doc.id}`}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Book Appointment <ArrowRight className="w-3.5 h-3.5" />
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
