// src/components/BookingWizard.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Department,
  Doctor,
  HmoCompany,
  AvailabilityResult,
  Booking,
  ClinicScheduleItem,
  getDoctorInitials,
  getDoctorInitialName,
  getDoctorBillingCategory,
  getDoctorShiftTime
} from '@/lib/types';
import {
  getDepartments,
  getDoctors,
  getHmoCompanies,
  checkDoctorAvailability,
  createBooking,
  ApiError
} from '@/lib/api';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building2,
  Printer,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Search,
  RotateCcw,
  Filter,
  HeartPulse,
  Baby,
  Eye,
  Activity,
  Bone,
  Brain,
  Smile,
  ChevronRight,
  MapPin,
  Users
} from 'lucide-react';
import SpecialistDatePicker from '@/components/SpecialistDatePicker';
import IsaluLogo from '@/components/IsaluLogo';
import { printElement } from '@/lib/printUtils';

interface BookingWizardProps {
  initialDoctorId?: string | number;
  initialDeptId?: string | number;
}

function getClinicIcon(nameOrIcon?: string) {
  const lower = (nameOrIcon || '').toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return <HeartPulse className="w-5 h-5 text-rose-600" />;
  if (lower.includes('paed') || lower.includes('ped') || lower.includes('child') || lower.includes('baby')) return <Baby className="w-5 h-5 text-amber-600" />;
  if (lower.includes('eye') || lower.includes('ophthal')) return <Eye className="w-5 h-5 text-indigo-600" />;
  if (lower.includes('ortho') || lower.includes('bone')) return <Bone className="w-5 h-5 text-emerald-600" />;
  if (lower.includes('neuro') || lower.includes('brain') || lower.includes('psych')) return <Brain className="w-5 h-5 text-purple-600" />;
  if (lower.includes('dent') || lower.includes('smile')) return <Smile className="w-5 h-5 text-sky-600" />;
  if (lower.includes('surg')) return <Activity className="w-5 h-5 text-teal-600" />;
  if (lower.includes('general') || lower.includes('family')) return <Stethoscope className="w-5 h-5 text-teal-600" />;
  return <Building2 className="w-5 h-5 text-teal-600" />;
}

export default function BookingWizard({ initialDoctorId, initialDeptId }: BookingWizardProps) {
  // Wizard steps: 1: Clinics | 2: Specialists | 3: Date & Time | 4: Patient Details | 5: Ticket
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const wizardRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);

  // Smoothly scroll to the top of the wizard whenever step transitions occur
  useEffect(() => {
    setErrorMessage(null);
    setDuplicateRef(null);

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (wizardRef.current) {
        const yOffset = -90; // Offset for sticky navbar
        const y = wizardRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [step]);

  // Data collections
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hmos, setHmos] = useState<HmoCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Step 1: Clinics search & selection
  const [searchClinic, setSearchClinic] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  // Step 2: Clinic Specialists & Billing filter
  const [billingFilter, setBillingFilter] = useState<'BOTH' | 'HMO' | 'PRIVATE'>('BOTH');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Step 3: Date & Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Step 4: Patient details & payment
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [paymentType, setPaymentType] = useState<'Private Self-Pay' | 'HMO Insurance'>('Private Self-Pay');
  const [selectedHmoId, setSelectedHmoId] = useState<string>('');
  const [hmoPolicyCode, setHmoPolicyCode] = useState('');

  // Step 5: Confirmed Booking Ticket
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateRef, setDuplicateRef] = useState<string | null>(null);

  // Load departments, doctors, and HMO companies
  const loadData = async (silent = false) => {
    try {
      if (!silent && doctors.length === 0) {
        setLoading(true);
      }
      const [deptsData, docsData] = await Promise.all([
        getDepartments().catch(() => []),
        getDoctors(undefined, silent).catch(() => []),
      ]);

      const sortedDepts = [...(deptsData || [])].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      );
      setDepartments(sortedDepts);
      setDoctors(docsData || []);

      // Load HMO companies in background
      getHmoCompanies()
        .then((hmosData) => setHmos(hmosData || []))
        .catch(() => setHmos([]));

      // Handle deep-links via initialDoctorId or initialDeptId
      if (initialDoctorId && docsData && docsData.length > 0 && !selectedDoctor) {
        const matchDoc = docsData.find(
          (d) => String(d.id) === String(initialDoctorId) || d.code === String(initialDoctorId)
        );
        if (matchDoc) {
          setSelectedDoctor(matchDoc);
          if (matchDoc.department_id) setSelectedDeptId(matchDoc.department_id);
          setStep(3); // Jump straight to date picker for this doctor
          return;
        }
      }

      if (initialDeptId && sortedDepts.length > 0 && selectedDeptId === null) {
        const matchDept = sortedDepts.find(
          (d) => String(d.id) === String(initialDeptId) || d.code === String(initialDeptId)
        );
        if (matchDept) {
          setSelectedDeptId(matchDept.id);
          setStep(2); // Jump straight to specialist list for this clinic
          return;
        }
      }
    } catch (err: unknown) {
      if (!silent) {
        console.error('Failed to load initial data:', err);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [initialDoctorId, initialDeptId]);

  // Real-time clinic quota & availability synchronization
  useEffect(() => {
    // When the user is on Step 1 (Clinics) or Step 2 (Specialists), keep quotas synchronized in real time
    if (step === 1 || step === 2) {
      loadData(true);

      // Auto-refresh every 10 seconds silently
      const pollTimer = setInterval(() => {
        loadData(true);
      }, 10000);

      // Instant revalidation when tab regains focus or becomes visible
      const handleVisibilityOrFocus = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          loadData(true);
        }
      };

      window.addEventListener('focus', handleVisibilityOrFocus);
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);

      return () => {
        clearInterval(pollTimer);
        window.removeEventListener('focus', handleVisibilityOrFocus);
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      };
    }
  }, [step]);

  // Synchronize payment type when selected doctor has billing restrictions (HMO Only vs Private Only)
  useEffect(() => {
    if (selectedDoctor) {
      const billing = getDoctorBillingCategory(selectedDoctor);
      if (!billing.hasPrivate && billing.hasHmo) {
        setPaymentType('HMO Insurance');
      } else if (billing.hasPrivate && !billing.hasHmo) {
        setPaymentType('Private Self-Pay');
      }
    }
  }, [selectedDoctor]);

  // When date or selected doctor changes in Step 3, query availability
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      async function checkSlot() {
        try {
          setCheckingAvailability(true);
          setErrorMessage(null);
          const res = await checkDoctorAvailability(selectedDoctor!.id, selectedDate);
          setAvailability(res);
          let clinicTime = res.formatted_shift;
          if (!clinicTime && res.time_slots && res.time_slots.length > 0) {
            const first = res.time_slots[0];
            const last = res.time_slots[res.time_slots.length - 1];
            const firstStart = first.split(/[-–—]/)[0]?.trim();
            const lastEnd = last.split(/[-–—]/)[1]?.trim();
            clinicTime = (firstStart && lastEnd && firstStart !== lastEnd) ? `${firstStart} – ${lastEnd}` : first;
          }
          if (!clinicTime) {
            const targetDay = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' });
            clinicTime = getDoctorShiftTime(selectedDoctor, targetDay);
          }
          setSelectedSlot(clinicTime);
        } catch (err: unknown) {
          console.error(err);
          setAvailability(null);
        } finally {
          setCheckingAvailability(false);
        }
      }
      checkSlot();
    }
  }, [selectedDoctor, selectedDate]);

  // Helper: Aggregate clinic schedules (days and shift times) across doctors in a department
  const getClinicSchedules = (dept: Department): ClinicScheduleItem[] => {
    if (dept.clinic_schedules && dept.clinic_schedules.length > 0) {
      return dept.clinic_schedules;
    }

    const deptDocs = doctors.filter(
      (d) => d.department_id === dept.id || (d.department && d.department.id === dept.id)
    );

    const dayMap: Record<string, { day: string; shift_times: string[]; capacity: number; doctors_count: number }> = {};

    deptDocs.forEach((doc) => {
      if (doc.schedules && doc.schedules.length > 0) {
        doc.schedules.forEach((s) => {
          const day = s.day_of_week;
          if (!day) return;
          const shiftTime = s.shift_time || s.formatted_shift || '08:00 AM – 02:00 PM';
          const cap = Number(s.capacity) || Number(doc.daily_capacity) || 15;
          if (!dayMap[day]) {
            dayMap[day] = { day, shift_times: [shiftTime], capacity: cap, doctors_count: 1 };
          } else {
            if (!dayMap[day].shift_times.includes(shiftTime)) {
              dayMap[day].shift_times.push(shiftTime);
            }
            dayMap[day].capacity = (dayMap[day].capacity || 0) + cap;
            dayMap[day].doctors_count = (dayMap[day].doctors_count || 0) + 1;
          }
        });
      } else if (doc.available_days && doc.available_days.length > 0) {
        doc.available_days.forEach((day) => {
          const shiftTime = getDoctorShiftTime(doc, day);
          const cap = Number(doc.daily_capacity) || 15;
          if (!dayMap[day]) {
            dayMap[day] = { day, shift_times: [shiftTime], capacity: cap, doctors_count: 1 };
          } else {
            if (!dayMap[day].shift_times.includes(shiftTime)) {
              dayMap[day].shift_times.push(shiftTime);
            }
            dayMap[day].capacity = (dayMap[day].capacity || 0) + cap;
            dayMap[day].doctors_count = (dayMap[day].doctors_count || 0) + 1;
          }
        });
      }
    });

    const weekOrder: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    const items: ClinicScheduleItem[] = Object.values(dayMap).map((item) => ({
      day: item.day,
      shift_time: item.shift_times.join(', '),
      capacity: item.capacity,
      doctors_count: item.doctors_count,
    }));
    items.sort((a, b) => {
      const getOrder = (day: string) => {
        for (const [k, idx] of Object.entries(weekOrder)) {
          if (day.toLowerCase().includes(k.toLowerCase())) return idx;
        }
        return 99;
      };
      return getOrder(a.day) - getOrder(b.day);
    });

    return items;
  };

  // Helper: Get duty days with capacity for doctor
  const getDutyDaysWithCap = (doc: Doctor): Array<{ day: string; capacity: number }> => {
    const result: Array<{ day: string; capacity: number }> = [];

    if (doc.schedules && doc.schedules.length > 0) {
      doc.schedules.forEach((s) => {
        const cap = Number(s.capacity) || Number(doc.daily_capacity) || 15;
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
            capacity: Number(doc.daily_capacity) || 15,
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
        // If a plain day like "Sat" has a corresponding "1st & 3rd Sat", drop the plain "Sat"
        const dayLower = item.day.toLowerCase();
        return !ordinalDays.some(ord => ord.day.toLowerCase().includes(dayLower));
      });
    }

    if (result.length === 0) {
      result.push({
        day: 'Mon – Fri',
        capacity: Number(doc.daily_capacity) || 15,
      });
    }

    return result;
  };

  // Submit appointment booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setErrorMessage('Doctor, Date, and Time Slot are required.');
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      setErrorMessage('Please provide your full name and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const hmoObj = hmos.find((h) => String(h.id) === String(selectedHmoId) || h.code === selectedHmoId);

      const payload = {
        doctor_id: selectedDoctor.id,
        date: selectedDate,
        time: selectedSlot,
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        patient_email: patientEmail.trim() || undefined,
        reason: reason.trim() || 'General Specialist Consultation',
        payment_type: paymentType,
        hmo_id: paymentType === 'HMO Insurance' ? hmoObj?.id : undefined,
        hmo_name: paymentType === 'HMO Insurance' ? hmoObj?.name : undefined,
        hmo_policy_code: paymentType === 'HMO Insurance' ? hmoPolicyCode.trim() : undefined,
      };

      const booking = await createBooking(payload);
      setCreatedBooking(booking);
      loadData(true);
      setStep(5); // Step 5: Official Ticket Voucher
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        if (err.status === 409 && err.data?.existing_reference) {
          setDuplicateRef(err.data.existing_reference);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered clinics for Step 1
  const filteredClinics = departments.filter((dept) => {
    if (!searchClinic) return true;
    const q = searchClinic.toLowerCase();
    return (
      (dept.name && dept.name.toLowerCase().includes(q)) ||
      (dept.description && dept.description.toLowerCase().includes(q)) ||
      (dept.location && dept.location.toLowerCase().includes(q))
    );
  });

  // Selected clinic object for Step 2+
  const currentClinic = departments.find((d) => d.id === selectedDeptId);

  // Doctors in current clinic
  const clinicDoctors = doctors.filter(
    (doc) => doc.department_id === selectedDeptId || (doc.department && doc.department.id === selectedDeptId)
  );

  // Billing counts for toggles in Step 2
  const hmoDoctorsCount = clinicDoctors.filter((d) => d.accepts_hmo).length;
  const privateDoctorsCount = clinicDoctors.filter((d) => d.accepts_private).length;
  const bothDoctorsCount = clinicDoctors.filter((d) => Boolean(d.accepts_hmo) && Boolean(d.accepts_private)).length;

  // Filtered doctors based on user's HMO / Private toggle
  // Default ('BOTH'): show specialists that can see both categories (with fallback if 0)
  // When toggled to 'HMO': show specialists that can see HMO
  // When toggled to 'PRIVATE': show specialists that can see Private
  const filteredClinicDoctors = clinicDoctors.filter((doc) => {
    if (billingFilter === 'HMO') return Boolean(doc.accepts_hmo);
    if (billingFilter === 'PRIVATE') return Boolean(doc.accepts_private);
    // Default: 'BOTH'
    if (bothDoctorsCount > 0) {
      return Boolean(doc.accepts_hmo) && Boolean(doc.accepts_private);
    }
    return true; // Graceful fallback if no doctor in clinic accepts both
  });

  return (
    <div
      ref={wizardRef}
      className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-300 w-full mx-auto scroll-mt-24 ${step === 4 ? 'max-w-2xl' : step === 5 ? 'max-w-xl' : 'max-w-4xl'
        }`}
    >

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8">
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-900">Appointment Notice</p>
              <p className="text-xs sm:text-sm text-rose-700 mt-1 leading-relaxed">{errorMessage}</p>
              {duplicateRef && (
                <div className="mt-3 pt-3 border-t border-rose-200/80 flex flex-wrap items-center gap-2.5">
                  <a
                    href={`/check-status?ref=${encodeURIComponent(duplicateRef)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Existing Appointment Voucher ({duplicateRef})
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- STAGE 1: ALL CLINICS DIRECTORY ---------------- */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Select Specialty Clinic Unit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a clinical unit to view active operating days, shift hours, and consulting specialists.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search clinics (e.g. Eye, Dental, Cardio)..."
                  value={searchClinic}
                  onChange={(e) => setSearchClinic(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                {searchClinic && (
                  <button
                    onClick={() => setSearchClinic('')}
                    className="text-xs text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 py-4">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/70 animate-pulse space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-slate-200" />
                      <div className="w-16 h-4 rounded-md bg-slate-200" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-8 bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-xs sm:text-sm">No clinics found matching &ldquo;{searchClinic}&rdquo;</p>
                <button
                  onClick={() => setSearchClinic('')}
                  className="text-xs text-teal-600 font-bold hover:underline"
                >
                  View All Available Clinics
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredClinics.map((dept) => {
                  const schedules = getClinicSchedules(dept);
                  const docCount = doctors.filter(
                    (d) => d.department_id === dept.id || (d.department && d.department.id === dept.id)
                  ).length;

                  return (
                    <div
                      key={dept.id}
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        setBillingFilter('BOTH');
                        setStep(2);
                      }}
                      className="group p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-500/60 hover:shadow-md hover:shadow-teal-900/5 transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
                    >
                      <div className="space-y-2.5">
                        {/* Header with icon and doctor count pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
                              {getClinicIcon(dept.icon_name || dept.name)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                                {dept.name}
                              </h3>
                              <p className="text-[11px] text-slate-400 truncate">
                                {dept.location || 'Outpatient Clinical Unit'}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-200/60 shrink-0 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-teal-600" />
                            {docCount} {docCount === 1 ? 'Doc' : 'Docs'}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {dept.description || 'Specialized clinical outpatient unit providing comprehensive medical examinations and follow-ups.'}
                        </p>

                        {/* Clinic Operating Days & Shift Time List */}
                        <div className="pt-2 border-t border-slate-100/90 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-teal-600" /> Clinic Days & Shifts:
                            </span>
                          </div>

                          {schedules.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {schedules.map((item, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md text-[11px] text-slate-700"
                                >
                                  <span className="font-bold text-slate-900 text-[10px]">{item.day}:</span>
                                  <span className="font-mono text-slate-600 text-[10px]">{item.shift_time}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Consultation days arranged on specialist schedules.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-teal-700 group-hover:text-teal-800 transition-colors">
                          View Specialists & Book
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all">
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- STAGE 2: SPECIALISTS IN CHOSEN CLINIC ---------------- */}
        {step === 2 && currentClinic && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Breadcrumb Navigation & Clinic Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-xl border border-teal-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to All Clinics
              </button>

              <span className="text-xs text-slate-500">
                Step 2 of 4 • Specialist Selection
              </span>
            </div>

            {/* Selected Clinic Header Card */}
            <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-slate-900/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                  {getClinicIcon(currentClinic.icon_name || currentClinic.name)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {currentClinic.name} Clinic
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentClinic.description || 'Specialized outpatient medical consultation'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {getClinicSchedules(currentClinic).map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-teal-300 text-[11px] font-bold">
                    {s.day}: {s.shift_time}
                  </span>
                ))}
              </div>
            </div>

            {/* Billing Filter Toggle Tabs (Requested by User) */}
            <div className="bg-gradient-to-r from-slate-50 to-teal-50/40 p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      Filter by Patient Billing Category
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Toggle HMO or Private to filter. By default, specialists accepting both categories are shown.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {billingFilter !== 'BOTH' && (
                    <button
                      type="button"
                      onClick={() => setBillingFilter('BOTH')}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-full border border-teal-200 transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    Showing {filteredClinicDoctors.length} {filteredClinicDoctors.length === 1 ? 'Doctor' : 'Doctors'}
                  </span>
                </div>
              </div>

              {/* 2-Way Toggle: HMO vs Private (All Specialists removed) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/80 p-1.5 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setBillingFilter((prev) => (prev === 'HMO' ? 'BOTH' : 'HMO'))}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${billingFilter === 'HMO'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20'
                      : 'bg-transparent text-slate-700 hover:bg-slate-100/80'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${billingFilter === 'HMO' ? 'text-white' : 'text-blue-600'}`} />
                    <span>HMO Insurance</span>
                    {billingFilter === 'HMO' && (
                      <span className="text-[10px] bg-blue-500/80 text-white px-1.5 py-0.5 rounded font-medium">Active</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${billingFilter === 'HMO'
                        ? 'bg-blue-700/80 text-white'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                  >
                    {hmoDoctorsCount} Doctors
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingFilter((prev) => (prev === 'PRIVATE' ? 'BOTH' : 'PRIVATE'))}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${billingFilter === 'PRIVATE'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                      : 'bg-transparent text-slate-700 hover:bg-slate-100/80'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-4 h-4 ${billingFilter === 'PRIVATE' ? 'text-white' : 'text-emerald-600'}`} />
                    <span>Private Self-Pay</span>
                    {billingFilter === 'PRIVATE' && (
                      <span className="text-[10px] bg-emerald-500/80 text-white px-1.5 py-0.5 rounded font-medium">Active</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${billingFilter === 'PRIVATE'
                        ? 'bg-emerald-700/80 text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                  >
                    {privateDoctorsCount} Doctors
                  </span>
                </button>
              </div>

              {/* Informative Guidance Banner */}
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 px-1 font-medium">
                {billingFilter === 'BOTH' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                    <span>
                      Showing specialists accepting <strong>Both HMO & Private</strong> categories by default ({bothDoctorsCount > 0 ? bothDoctorsCount : filteredClinicDoctors.length} doctors). Click HMO or Private above to filter.
                    </span>
                  </>
                )}
                {billingFilter === 'HMO' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>
                      Showing specialists authorized to examine <strong>HMO Health Insurance</strong> patients in this clinic.
                    </span>
                  </>
                )}
                {billingFilter === 'PRIVATE' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      Showing specialists accepting <strong>Private Self-Pay & Out-of-Pocket</strong> consultations in this clinic.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Specialists Grid */}
            {filteredClinicDoctors.length === 0 ? (
              <div className="py-14 text-center text-slate-500 p-8 rounded-3xl border border-dashed border-slate-200 space-y-3 bg-slate-50/50">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">
                  No specialists in {currentClinic.name} currently match the {billingFilter === 'HMO' ? 'HMO Insurance' : 'Private Self-Pay'} category.
                </p>
                <p className="text-xs text-slate-400">
                  Toggle off the selection to return to the default view.
                </p>
                <button
                  type="button"
                  onClick={() => setBillingFilter('BOTH')}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Show Both Categories Default
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClinicDoctors.map((doc) => {
                  const dutyDaysWithCap = getDutyDaysWithCap(doc);
                  const billing = getDoctorBillingCategory(doc);
                  const shiftTime = getDoctorShiftTime(doc);

                  return (
                    <div
                      key={doc.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-3">
                        {/* Doctor Avatar, Privacy Name & Billing Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
                              {getDoctorInitials(doc)}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-base tracking-wide">
                                {getDoctorInitialName(doc)}
                              </h4>
                              <p className="text-xs font-semibold text-teal-700">
                                {doc.qualification || doc.qualifications || doc.specialty || 'Specialist Consultant'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${billing.badgeClass}`}>
                            {billing.label}
                          </span>
                        </div>

                        {/* Consultation Days & Capacity */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <Calendar className="w-3 h-3 text-teal-600" />
                            <span>Consultation Days & Daily Capacity:</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {dutyDaysWithCap.map((item, dIdx) => (
                              <span key={dIdx} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs">
                                <span>{item.day}</span>
                                <span className="text-[10px] text-teal-700 font-black">
                                  ({item.capacity} max)
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Next Clinic Schedule & Live Booking Quota */}
                        {doc.next_schedule && (
                          <div className={`p-3 rounded-2xl border transition-all ${doc.next_schedule.is_fully_booked
                              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : 'bg-teal-50/60 border-teal-200/80 text-teal-950'
                            }`}>
                            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <Calendar className={`w-3.5 h-3.5 ${doc.next_schedule.is_fully_booked ? 'text-rose-600' : 'text-teal-600'}`} />
                                <span>Next Clinic Date:</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-black ${doc.next_schedule.is_fully_booked
                                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                  : 'bg-white border border-teal-200 text-teal-900 shadow-sm'
                                }`}>
                                {doc.next_schedule.formatted_date}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Clinic Quota:
                              </span>
                              {doc.next_schedule.is_fully_booked ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                  Fully Booked ({doc.next_schedule.booked_count}/{doc.next_schedule.capacity})
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-700">
                                  <span className="font-black text-teal-700">{doc.next_schedule.booked_count}</span> of <span className="font-black">{doc.next_schedule.capacity}</span> Booked
                                  <span className="text-teal-700 font-semibold"> ({doc.next_schedule.remaining_slots} slots left)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Shift Times */}
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Official Shift:
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {shiftTime}
                          </span>
                        </div>
                      </div>

                      {/* Select & Book Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setSelectedDate('');
                          setSelectedSlot('');
                          setAvailability(null);
                          // Seamlessly pre-select payment type based on current filter and doctor capability
                          if (billingFilter === 'HMO' && doc.accepts_hmo) {
                            setPaymentType('HMO Insurance');
                          } else if (billingFilter === 'PRIVATE' && doc.accepts_private) {
                            setPaymentType('Private Self-Pay');
                          }
                          setStep(3); // Proceed to monthly calendar
                        }}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Book Appointment with {getDoctorInitialName(doc)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- STAGE 3: DOCTOR MONTH CALENDAR & SLOT SELECTION ---------------- */}
        {step === 3 && selectedDoctor && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-xl border border-teal-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Specialists
              </button>

              <span className="text-xs text-slate-500">
                Step 3 of 4 • Select Date & Shift Slot
              </span>
            </div>

            {/* Specialist Profile Summary Chip */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  {getDoctorInitials(selectedDoctor)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {getDoctorInitialName(selectedDoctor)}
                  </h3>
                  <p className="text-xs text-teal-800 font-medium">
                    {currentClinic?.name || selectedDoctor.specialty || 'Specialist Consultant'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const billing = getDoctorBillingCategory(selectedDoctor);
                  return (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${billing.badgeClass}`}>
                      {billing.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-teal-200 font-medium">
                  {getDoctorShiftTime(selectedDoctor)}
                </span>
              </div>
            </div>

            {/* Calendar & Shift Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Interactive Month Calendar */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Select Consultation Date
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold">
                    Highlighted dates are active duty days
                  </span>
                </div>

                <div className="bg-slate-50/60 p-4 rounded-3xl border border-slate-200">
                  <SpecialistDatePicker
                    selectedDate={selectedDate}
                    onSelectDate={(dateStr: string) => {
                      setSelectedDate(dateStr);
                      setSelectedSlot('');
                    }}
                    availableDays={selectedDoctor.available_days || []}
                    doctorName={getDoctorInitialName(selectedDoctor)}
                    fullyBookedDates={selectedDoctor.fully_booked_dates || []}
                    closedDates={selectedDoctor.closed_dates || []}
                  />
                </div>
              </div>

              {/* Right Column: Slot Availability & Capacity */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-3">
                    Consultation Shift & Daily Capacity
                  </label>

                  {checkingAvailability ? (
                    <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-slate-500 text-xs animate-pulse">
                      <Clock className="w-4 h-4 animate-spin text-teal-600" />
                      <span>Checking specialist clinic capacity...</span>
                    </div>
                  ) : selectedDate ? (
                    availability && availability.is_booking_closed ? (
                      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                          Booking Closed for Today
                        </div>
                        <p className="text-sm font-extrabold text-amber-950">
                          Consultations for today's clinic are no longer accepting bookings.
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed max-w-xs mx-auto">
                          {availability.closed_reason || "Online bookings for this specialist close 10 minutes prior to clinic start time. Please choose another active duty day on the calendar."}
                        </p>
                      </div>
                    ) : availability && (availability.is_fully_booked || availability.remaining_slots <= 0) ? (
                      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-2.5">
                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-1">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                          Fully Booked
                        </div>
                        <p className="text-sm font-extrabold text-rose-950">
                          All {availability.daily_capacity} consultation slots reserved for {selectedDate}.
                        </p>
                        <p className="text-[11px] text-rose-700 leading-relaxed max-w-xs mx-auto">
                          To ensure quality clinical attention, this specialist has reached the maximum patient quota for this day. Please pick another active duty day on the calendar.
                        </p>
                      </div>
                    ) : availability && availability.is_available ? (
                      <div className="space-y-4">
                        <div className="p-5 rounded-3xl bg-teal-50 border border-teal-200/80 space-y-3">
                          <div className="flex items-center justify-between text-xs text-teal-800 font-bold">
                            <span>Selected Consultation Date:</span>
                            <span className="bg-white px-2 py-0.5 rounded-md border border-teal-200 font-mono">
                              {selectedDate}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <Clock className="w-5 h-5 text-teal-600 shrink-0 self-center" />
                            <h4 className="text-xl font-black text-teal-950 tracking-tight">
                              {availability.formatted_shift || selectedSlot || '08:00 AM – 02:00 PM'}
                            </h4>
                          </div>

                          <div className="pt-3 border-t border-teal-200/70 flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Daily Capacity:</span>
                            <span className="font-bold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                              {availability.booked_count ?? (availability.daily_capacity - availability.remaining_slots)} of {availability.daily_capacity} Booked ({availability.remaining_slots} slots remaining)
                            </span>
                          </div>
                        </div>

                        {/* Clinic Attendance Notice */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <AlertCircle className="w-4 h-4 text-teal-600" />
                            <span>Clinic Intake Guidance</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            Patients are consulted in order of arrival and triage clearance during the specialist clinic hours ({availability.formatted_shift || selectedSlot}).
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-2">
                        <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                        <p className="font-bold text-amber-900 text-xs">Specialist Not on Duty</p>
                        <p className="text-[11px] text-amber-800">
                          Please choose one of the highlighted active dates on the calendar.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-2">
                      <Calendar className="w-6 h-6 text-slate-300 mx-auto" />
                      <p className="font-medium text-slate-600">Select an active duty day from the calendar.</p>
                      <p className="text-[11px]">The official shift times and real-time patient capacity will display here.</p>
                    </div>
                  )}
                </div>

                {/* Next Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                  >
                    Change Specialist
                  </button>

                  <button
                    type="button"
                    disabled={!selectedDate || !selectedSlot || !availability?.is_available || availability?.is_fully_booked || availability?.is_booking_closed || availability?.remaining_slots <= 0}
                    onClick={() => setStep(4)}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedDate && selectedSlot && availability?.is_available && !availability?.is_fully_booked && !availability?.is_booking_closed && availability?.remaining_slots > 0
                        ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    <span>Proceed to Patient Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STAGE 4: PATIENT INTAKE & PAYMENT ---------------- */}
        {step === 4 && selectedDoctor && (
          <form onSubmit={handleBookingSubmit} className="space-y-6 animate-in fade-in duration-200">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-xl border border-teal-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Calendar
              </button>

              <span className="text-xs text-slate-500">
                Step 4 of 4 • Patient Details & Payment
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Patient Particulars & Payment Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide the patient intake details and select payment method to generate your confirmed consultation ticket.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Patient Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adewale Babatunde"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0803 123 4567"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="patient@gmail.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Payment Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Billing / Payment Category</label>
                {(() => {
                  const docBilling = getDoctorBillingCategory(selectedDoctor);
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={!docBilling.hasPrivate}
                        onClick={() => setPaymentType('Private Self-Pay')}
                        title={!docBilling.hasPrivate ? 'Doctor does not accept Private Self-Pay patients' : undefined}
                        className={`py-2.5 px-2.5 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-bold border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${!docBilling.hasPrivate
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : paymentType === 'Private Self-Pay'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 shrink-0" /> Private Self-Pay
                      </button>
                      <button
                        type="button"
                        disabled={!docBilling.hasHmo}
                        onClick={() => setPaymentType('HMO Insurance')}
                        title={!docBilling.hasHmo ? 'Doctor does not accept HMO Insurance patients' : undefined}
                        className={`py-2.5 px-2.5 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-bold border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${!docBilling.hasHmo
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : paymentType === 'HMO Insurance'
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> HMO Insurance
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Conditional HMO fields */}
              {paymentType === 'HMO Insurance' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Select HMO Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedHmoId}
                      onChange={(e) => setSelectedHmoId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="">Select HMO Provider...</option>
                      {hmos.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.policy_code || h.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      HMO Enrollee / Policy ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HYG-1092837"
                      value={hmoPolicyCode}
                      onChange={(e) => setHmoPolicyCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Booking Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800">Booking Summary: </span>
                <strong className="text-slate-900">{getDoctorInitialName(selectedDoctor)}</strong> ({currentClinic?.name || selectedDoctor.specialty}) • {selectedDate} at {selectedSlot} • {paymentType}
              </div>
              <div className="text-teal-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Intake Confirmed
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Back to Calendar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Generating Booking...' : 'Confirm & Generate Ticket'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ---------------- STAGE 5: OFFICIAL APPOINTMENT VOUCHER TICKET ---------------- */}
        {step === 5 && createdBooking && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Printable Official Voucher Card */}
            <div
              id="printable-ticket"
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-left p-6 sm:p-8 space-y-6"
            >
              {/* Hospital Watermark & Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <div className="flex justify-center mb-3">
                  <IsaluLogo variant="full" size="lg" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • Tel: +234 800 47258 2273
                </p>
                <span className="inline-block mt-2.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  Appointment Booked & Confirmed
                </span>
              </div>

              {/* Reference & Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ticket Reference</span>
                  <span className="font-mono font-black text-slate-900 text-sm tracking-wide">
                    {createdBooking.reference_code}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Clinical Status</span>
                  <span className="font-mono font-bold text-teal-700 text-sm">
                    {createdBooking.status || 'Confirmed'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Date & Time</span>
                  <span className="font-medium text-slate-700">
                    {createdBooking.date || createdBooking.appointment_date} at {createdBooking.time || createdBooking.appointment_time}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Channel</span>
                  <span className="font-medium text-slate-700">
                    {createdBooking.payment_type}
                    {createdBooking.hmo_name && createdBooking.hmo_name !== 'N/A' && ` (${createdBooking.hmo_name})`}
                  </span>
                </div>
              </div>

              {/* Patient & Specialist Particulars */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Patient Full Name:</span>
                  <span className="font-bold text-slate-900">{createdBooking.patient_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Phone Contact:</span>
                  <span className="font-mono font-medium text-slate-700">{createdBooking.patient_phone}</span>
                </div>
                {createdBooking.patient_email && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="text-slate-700 font-medium">{createdBooking.patient_email}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Consulting Specialist:</span>
                  <span className="font-semibold text-slate-900 tracking-wide">
                    {getDoctorInitialName(createdBooking.doctor_name || selectedDoctor)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Specialty Clinic Unit:</span>
                  <span className="font-medium text-teal-700">
                    {createdBooking.doctor_specialty || createdBooking.department?.name || currentClinic?.name || 'Specialist Consultation'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Billing Category:</span>
                  <span className="font-bold text-slate-900">{createdBooking.payment_type}</span>
                </div>
                {createdBooking.hmo_policy_code && (
                  <div className="flex justify-between py-2 border-b border-slate-100 bg-teal-50/60 px-2 rounded-lg">
                    <span className="text-teal-800 font-semibold">HMO Enrollee ID:</span>
                    <span className="font-mono font-bold text-teal-900">{createdBooking.hmo_policy_code}</span>
                  </div>
                )}
              </div>

              {/* Intake & Clinic Clearance Status Box */}
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-900 block">Clinic Intake Status</span>
                  <span className="text-[11px] text-teal-700">
                    {createdBooking.payment_type === 'HMO Insurance'
                      ? 'Pre-authorized for HMO Outpatient Desk Clearance'
                      : 'Hospital Registration Validated • Consultation Queue Allocated'}
                  </span>
                </div>
                <span className="font-bold text-teal-800 text-xs bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                  Cleared
                </span>
              </div>

              {/* Barcode & Queue Instructions */}
              <div className="pt-2 text-center space-y-2">
                <div className="inline-block p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-center gap-1 tracking-widest font-mono text-xl font-black text-slate-800">
                    ||| | |||| | || ||| || ||| ||||
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    Scan at Outpatient Triage & Reception Desk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Please arrive at least 15 minutes before your consultation window for nursing triage assessment (BP, Weight, Pulse).
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedDeptId(null);
                  setSelectedDoctor(null);
                  setSelectedDate('');
                  setSelectedSlot('');
                  setCreatedBooking(null);
                  setPatientName('');
                  setPatientPhone('');
                  setPatientEmail('');
                  setReason('');
                  setHmoPolicyCode('');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Book Another Consultation
              </button>

              <button
                type="button"
                onClick={() => printElement('printable-ticket')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-teal-400" /> Print Official Slip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
