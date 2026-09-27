// src/components/BookingWizard.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Users,
  X,
  Edit3,
  Share2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import SpecialistDatePicker from '@/components/SpecialistDatePicker';
import IsaluLogo from '@/components/IsaluLogo';
import { printElement } from '@/lib/printUtils';

interface BookingWizardProps {
  initialDoctorId?: string | number;
  initialDeptId?: string | number;
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.574 1.815.88 2.791.88 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.393 8.303c-.149.421-.736.78-1.02.83-.284.05-.62.062-1.895-.469-1.629-.678-2.678-2.339-2.759-2.449-.081-.11-.655-.873-.655-1.664 0-.791.413-1.18.561-1.341.149-.161.326-.201.435-.201.109 0 .218.001.312.006.101.005.237-.038.37.283.149.362.508 1.239.552 1.33.044.091.074.198.015.318-.059.12-.089.198-.178.301-.089.103-.187.23-.267.31-.089.088-.182.184-.078.362.103.178.461.761.99 1.232.682.608 1.258.796 1.436.885.178.089.282.078.386-.041.104-.119.444-.517.563-.695.118-.178.237-.149.397-.089.16.06 1.011.477 1.185.564.174.087.291.13.333.201.042.071.042.411-.107.832z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2 22l4.982-1.309C8.423 21.536 10.147 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.67 0-3.235-.487-4.558-1.325l-.326-.208-2.969.779.792-2.894-.225-.357A8.14 8.14 0 0 1 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.512 0 8.182 3.67 8.182 8.182 0 4.512-3.67 8.182-8.182 8.182z" />
    </svg>
  );
}

function getClinicIcon(nameOrIcon?: string) {
  const lower = (nameOrIcon || '').toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return <HeartPulse className="w-5 h-5 text-rose-600 transition-colors" />;
  if (lower.includes('paed') || lower.includes('ped') || lower.includes('child') || lower.includes('baby')) return <Baby className="w-5 h-5 text-amber-600 transition-colors" />;
  if (lower.includes('eye') || lower.includes('ophthal')) return <Eye className="w-5 h-5 text-indigo-600 transition-colors" />;
  if (lower.includes('ortho') || lower.includes('bone')) return <Bone className="w-5 h-5 text-emerald-600 transition-colors" />;
  if (lower.includes('neuro') || lower.includes('brain') || lower.includes('psych')) return <Brain className="w-5 h-5 text-purple-600 transition-colors" />;
  if (lower.includes('dent') || lower.includes('smile')) return <Smile className="w-5 h-5 text-[#0085D0] transition-colors" />;
  if (lower.includes('surg')) return <Activity className="w-5 h-5 text-[#006bac] transition-colors" />;
  if (lower.includes('general') || lower.includes('family')) return <Stethoscope className="w-5 h-5 text-[#0085D0] transition-colors" />;
  return <Building2 className="w-5 h-5 text-[#0085D0] transition-colors" />;
}

export default function BookingWizard({ initialDoctorId, initialDeptId }: BookingWizardProps) {
  // Data collections
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hmos, setHmos] = useState<HmoCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Clinic directory search & category filter
  const [searchClinic, setSearchClinic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // ---------------- MODAL FLOW STATES ----------------
  // Modal is opened when a patient clicks on any clinic card
  // Modal Steps: 1: Patient Info & Billing | 2: Select Doctor | 3: Calendar & Direct Book | 4: Official Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4>(1);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  // Selected Clinic
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  // Patient Intake & Billing Category
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [reason, setReason] = useState('');
  const [paymentType, setPaymentType] = useState<'Private Self-Pay' | 'HMO Insurance'>('Private Self-Pay');
  const [selectedHmoId, setSelectedHmoId] = useState<string>('');
  const [hmoPolicyCode, setHmoPolicyCode] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Doctor filtering ('PRIVATE' | 'HMO')
  const [billingFilter, setBillingFilter] = useState<'PRIVATE' | 'HMO'>('PRIVATE');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Calendar & Slot selection
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Confirmed Booking Ticket
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateRef, setDuplicateRef] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and close on ESC key when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  // Scroll to top inside modal when modalStep changes
  useEffect(() => {
    setErrorMessage(null);
    setDuplicateRef(null);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [modalStep]);

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
          if (matchDoc.accepts_private) {
            setBillingFilter('PRIVATE');
            setPaymentType('Private Self-Pay');
          } else if (matchDoc.accepts_hmo) {
            setBillingFilter('HMO');
            setPaymentType('HMO Insurance');
          }
          setIsModalOpen(true);
          setModalStep(patientName.trim() ? 3 : 1);
          return;
        }
      }

      if (initialDeptId && sortedDepts.length > 0 && selectedDeptId === null) {
        const matchDept = sortedDepts.find(
          (d) => String(d.id) === String(initialDeptId) || d.code === String(initialDeptId)
        );
        if (matchDept) {
          setSelectedDeptId(matchDept.id);
          setIsModalOpen(true);
          setModalStep(1);
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
    const pollTimer = setInterval(() => {
      loadData(true);
    }, 10000);

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
  }, []);

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
        capacity: Number(doc.daily_capacity) || 15,
      });
    }

    return result;
  };

  // Helper: Parse time string (e.g. "02:00 PM", "2:00 PM", "14:00", "14:00:00") into minutes from midnight (0..1439)
  const parseTimeToMinutes = (timeStr?: string | null): number | null => {
    if (!timeStr) return null;
    const clean = timeStr.trim();
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3]?.toUpperCase();

    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };

  // Helper: Extract the latest shift end time in minutes from a range like "02:00 PM - 04:00 PM, 12:00 PM - 02:00 PM"
  const getLatestShiftEndMinutes = (shiftStr?: string | null): number | null => {
    if (!shiftStr) return null;
    const subShifts = shiftStr.split(/[,|]/);
    let latestEnd: number | null = null;

    subShifts.forEach((s) => {
      const parts = s.split(/[-–—]/);
      const endStr = parts.length >= 2 ? parts[parts.length - 1].trim() : s.trim();
      const endMin = parseTimeToMinutes(endStr);
      if (endMin !== null) {
        if (latestEnd === null || endMin > latestEnd) {
          latestEnd = endMin;
        }
      }
    });

    return latestEnd;
  };

  // Helper: Determine real-time today operating status for a clinic
  const getClinicTodayStatus = (
    dept: Department,
    schedules: ClinicScheduleItem[]
  ): {
    isScheduledToday: boolean;
    isOpenToday: boolean;
    isFullyBookedToday: boolean;
    isShiftEndedToday: boolean;
  } => {
    const now = new Date();
    const todayDayShort = now.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Sat"
    const todayYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayDay = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${todayYear}-${todayMonth}-${todayDay}`;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Find all doctors belonging to this clinic
    const clinicDocs = doctors.filter(
      (d) => d.department_id === dept.id || (d.department && d.department.id === dept.id)
    );

    // Check if clinic schedules list includes today
    const scheduleForToday = schedules.find((s) =>
      s.day.toLowerCase().includes(todayDayShort.toLowerCase())
    );

    // Check which doctors are scheduled on duty today
    const docsOnDutyToday = clinicDocs.filter((doc) => {
      if (!doc.status) return false;

      if (doc.schedules && doc.schedules.length > 0) {
        const hasSched = doc.schedules.some((s) => {
          if (!s.status) return false;
          const d = (s.day_of_week || '').toLowerCase();
          return d.includes(todayDayShort.toLowerCase()) || todayDayShort.toLowerCase().includes(d);
        });
        if (hasSched) return true;
      }

      if (doc.available_days && doc.available_days.length > 0) {
        const todayLower = todayDayShort.toLowerCase();
        const hasAvail = doc.available_days.some((day) => {
          const d = day.toLowerCase();
          if (d.includes('mon') && d.includes('fri') && !['sat', 'sun'].includes(todayLower)) return true;
          if (d.includes('mon') && d.includes('sat') && !['sun'].includes(todayLower)) return true;
          if (d.includes('everyday') || d.includes('daily')) return true;
          return d.includes(todayLower) || todayLower.includes(d);
        });
        if (hasAvail) return true;
      }

      return false;
    });

    const isScheduledToday = docsOnDutyToday.length > 0 || Boolean(scheduleForToday);

    if (!isScheduledToday) {
      return {
        isScheduledToday: false,
        isOpenToday: false,
        isFullyBookedToday: false,
        isShiftEndedToday: false,
      };
    }

    // Check if the clinic schedule's shift end time has already elapsed
    let clinicScheduleEnded = false;
    if (scheduleForToday?.shift_time) {
      const endMin = getLatestShiftEndMinutes(scheduleForToday.shift_time);
      if (endMin !== null && nowMinutes >= endMin) {
        clinicScheduleEnded = true;
      }
    }

    if (docsOnDutyToday.length === 0 && clinicScheduleEnded) {
      return {
        isScheduledToday: true,
        isOpenToday: false,
        isFullyBookedToday: false,
        isShiftEndedToday: true,
      };
    }

    let availableDocsCount = 0;
    let fullyBookedDocsCount = 0;
    let shiftEndedDocsCount = 0;

    docsOnDutyToday.forEach((doc) => {
      // 1. Is doctor fully booked today?
      const isDocFullyBooked = Boolean(doc.fully_booked_dates && doc.fully_booked_dates.includes(todayDateStr));
      if (isDocFullyBooked) {
        fullyBookedDocsCount++;
        return;
      }

      // 2. Is doctor closed for today in backend?
      const isDocClosed = Boolean(doc.closed_dates && doc.closed_dates.includes(todayDateStr));
      if (isDocClosed) {
        shiftEndedDocsCount++;
        return;
      }

      // 3. Check doctor's shift time for today
      const shifts: string[] = [];
      if (doc.schedules && doc.schedules.length > 0) {
        doc.schedules.forEach((s) => {
          if (!s.status) return;
          const d = (s.day_of_week || '').toLowerCase();
          if (d.includes(todayDayShort.toLowerCase()) || todayDayShort.toLowerCase().includes(d)) {
            if (s.end_time) shifts.push(s.end_time);
            else if (s.shift_time || s.formatted_shift) shifts.push(s.shift_time || s.formatted_shift || '');
          }
        });
      }

      if (shifts.length === 0 && (doc.shift_time || doc.formatted_shift)) {
        shifts.push(doc.shift_time || doc.formatted_shift || '');
      }

      if (shifts.length > 0) {
        let latestEnd: number | null = null;
        shifts.forEach((sh) => {
          const endMin = getLatestShiftEndMinutes(sh);
          if (endMin !== null && (latestEnd === null || endMin > latestEnd)) {
            latestEnd = endMin;
          }
        });

        if (latestEnd !== null && nowMinutes >= latestEnd) {
          shiftEndedDocsCount++;
          return;
        }
      } else if (clinicScheduleEnded) {
        shiftEndedDocsCount++;
        return;
      }

      // Doctor is on duty, has capacity, and shift has not ended
      availableDocsCount++;
    });

    const isOpenToday = availableDocsCount > 0 && !clinicScheduleEnded;
    const isFullyBookedToday = !isOpenToday && fullyBookedDocsCount > 0 && (fullyBookedDocsCount >= shiftEndedDocsCount);
    const isShiftEndedToday = !isOpenToday;

    return {
      isScheduledToday: true,
      isOpenToday,
      isFullyBookedToday,
      isShiftEndedToday,
    };
  };

  // RESET ALL BOOKING & INTAKE STATE
  const resetFormState = (keepDeptId = false) => {
    if (!keepDeptId) setSelectedDeptId(null);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedSlot('');
    setAvailability(null);
    setCreatedBooking(null);
    setErrorMessage(null);
    setDuplicateRef(null);
    setModalError(null);
    setPatientName('');
    setPatientPhone('');
    setPatientEmail('');
    setReason('');
    setPaymentType('Private Self-Pay');
    setBillingFilter('PRIVATE');
    setSelectedHmoId('');
    setHmoPolicyCode('');
    setModalStep(1);
  };

  // OPEN MODAL: When a patient clicks on a clinic card
  const handleClinicCardClick = (dept: Department) => {
    resetFormState(true);
    setSelectedDeptId(dept.id);
    setIsModalOpen(true);
  };

  // CLOSE MODAL & CLEANUP
  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (createdBooking) {
      resetFormState();
    } else {
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedSlot('');
      setAvailability(null);
      setErrorMessage(null);
      setDuplicateRef(null);
    }
  };

  // RESET AND BOOK ANOTHER
  const handleBookAnother = () => {
    const currentDeptId = selectedDeptId;
    resetFormState(true);
    setSelectedDeptId(currentDeptId);
  };

  // INTAKE MODAL SUBMISSION (Step 1 -> Step 2)
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!patientName.trim()) {
      setModalError('Please enter the patient full name.');
      return;
    }
    if (!patientPhone.trim()) {
      setModalError('Please enter a valid patient phone number.');
      return;
    }

    if (paymentType === 'HMO Insurance') {
      if (!selectedHmoId) {
        setModalError('Please select your HMO health insurance provider.');
        return;
      }
      if (!hmoPolicyCode.trim()) {
        setModalError('Please enter your HMO Policy / Enrollee ID.');
        return;
      }
      setBillingFilter('HMO');
    } else {
      setBillingFilter('PRIVATE');
    }

    setModalStep(2); // Advance to Doctor selection inside the modal
  };

  // SUBMIT BOOKING (Step 3 -> Step 4)
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setErrorMessage('Doctor, Date, and Time Slot are required.');
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      setErrorMessage('Patient name and phone number are required.');
      setModalStep(1);
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
      setModalStep(4); // Advance to confirmed ticket voucher inside modal
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

  // Filtered clinics for main directory with category support
  const filteredClinics = departments.filter((dept) => {
    // Quick Category match
    if (selectedCategory !== 'ALL') {
      const name = (dept.name || '').toLowerCase();
      if (selectedCategory === 'WOMEN' && !(name.includes('gyn') || name.includes('obs') || name.includes('matern') || name.includes('women'))) return false;
      if (selectedCategory === 'CHILD' && !(name.includes('paed') || name.includes('ped') || name.includes('child') || name.includes('neonat'))) return false;
      if (selectedCategory === 'CARDIO' && !(name.includes('cardio') || name.includes('heart'))) return false;
      if (selectedCategory === 'SURGERY' && !(name.includes('surg') || name.includes('ortho') || name.includes('bone') || name.includes('theatre'))) return false;
      if (selectedCategory === 'EYE_DENTAL' && !(name.includes('eye') || name.includes('ophthal') || name.includes('dent') || name.includes('oral'))) return false;
      if (selectedCategory === 'INTERNAL' && !(name.includes('internal') || name.includes('family') || name.includes('general') || name.includes('physician') || name.includes('diabet') || name.includes('endocrin'))) return false;
    }

    if (!searchClinic) return true;
    const q = searchClinic.toLowerCase();
    return (
      (dept.name && dept.name.toLowerCase().includes(q)) ||
      (dept.description && dept.description.toLowerCase().includes(q)) ||
      (dept.location && dept.location.toLowerCase().includes(q))
    );
  });

  // Selected clinic object for modal
  const currentClinic = departments.find((d) => d.id === selectedDeptId);

  // Doctors in current clinic
  const clinicDoctors = doctors.filter(
    (doc) => doc.department_id === selectedDeptId || (doc.department && doc.department.id === selectedDeptId)
  );

  // Doctor counts based on billing permissions
  const hmoDoctorsCount = clinicDoctors.filter((d) => d.accepts_hmo).length;
  const privateDoctorsCount = clinicDoctors.filter((d) => d.accepts_private).length;

  // Filtered doctors: Strictly display doctors who attend to the selected category (Private vs HMO)
  const filteredClinicDoctors = clinicDoctors.filter((doc) => {
    if (billingFilter === 'HMO') return Boolean(doc.accepts_hmo);
    return Boolean(doc.accepts_private);
  });

  // Resolve selected HMO name for summaries
  const selectedHmoName = hmos.find(
    (h) => String(h.id) === String(selectedHmoId) || h.code === selectedHmoId
  )?.name;

  // Build WhatsApp share URL
  const getWhatsAppShareUrl = (booking: Booking) => {
    const docName = getDoctorInitialName(createdBooking?.doctor_name || selectedDoctor);
    const clinicName = createdBooking?.doctor_specialty || createdBooking?.department?.name || currentClinic?.name || 'Specialist Consultation';
    const dateStr = booking.date || booking.appointment_date || selectedDate;
    const timeStr = booking.time || booking.appointment_time || selectedSlot;
    const paymentLabel = booking.payment_type === 'HMO Insurance' && (booking.hmo_name || selectedHmoName)
      ? `HMO Insurance (${booking.hmo_name || selectedHmoName})`
      : booking.payment_type;

    const message = `🏥 *ISALU HOSPITALS APPOINTMENT CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Ticket Reference:* ${booking.reference_code}
👤 *Patient Name:* ${booking.patient_name}
🏢 *Specialty Clinic:* ${clinicName}
🩺 *Consultant:* ${docName}
📅 *Date:* ${dateStr}
⏰ *Shift Window:* ${timeStr}
💳 *Billing:* ${paymentLabel}
${booking.hmo_policy_code ? `🆔 *HMO Policy ID:* ${booking.hmo_policy_code}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Address:* No. 46, Ijaiye Road, Ogba, Ikeja, Lagos
ℹ️ Please arrive 15 minutes prior to clinic commencement for vital triage.
🔗 Check/Track Slip: ${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(booking.reference_code)}`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // Build Email mailto URL
  const getEmailShareUrl = (booking: Booking) => {
    const docName = getDoctorInitialName(createdBooking?.doctor_name || selectedDoctor);
    const clinicName = createdBooking?.doctor_specialty || createdBooking?.department?.name || currentClinic?.name || 'Specialist Consultation';
    const dateStr = booking.date || booking.appointment_date || selectedDate;
    const timeStr = booking.time || booking.appointment_time || selectedSlot;
    const paymentLabel = booking.payment_type === 'HMO Insurance' && (booking.hmo_name || selectedHmoName)
      ? `HMO Insurance (${booking.hmo_name || selectedHmoName})`
      : booking.payment_type;

    const subject = `Isalu Hospitals Consultation Ticket - ${booking.reference_code}`;
    const body = `Dear ${booking.patient_name},

Your specialist medical appointment at Isalu Hospitals is confirmed.

APPOINTMENT SUMMARY:
• Ticket Reference: ${booking.reference_code}
• Patient: ${booking.patient_name}
• Specialty Clinic: ${clinicName}
• Consulting Specialist: ${docName}
• Consultation Date: ${dateStr}
• Shift Window: ${timeStr}
• Billing Channel: ${paymentLabel}
${booking.hmo_policy_code ? `• HMO Policy ID: ${booking.hmo_policy_code}\n` : ''}
HOSPITAL LOCATION & CONTACT:
Isalu Hospitals, No. 46, Ijaiye Road, Ogba, Ikeja, Lagos
Contact: +234 800 47258 2273

Please arrive 15 minutes before your consultation window for nursing triage clearance.

Verify / Track Appointment:
${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(booking.reference_code)}
`;

    return `mailto:${encodeURIComponent(booking.patient_email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Handle Share / Copy
  const handleShareOrCopy = async (booking: Booking) => {
    const docName = getDoctorInitialName(createdBooking?.doctor_name || selectedDoctor);
    const clinicName = createdBooking?.doctor_specialty || createdBooking?.department?.name || currentClinic?.name || 'Specialist Consultation';
    const dateStr = booking.date || booking.appointment_date || selectedDate;
    const timeStr = booking.time || booking.appointment_time || selectedSlot;
    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(booking.reference_code)}`;

    const shareText = `Isalu Hospitals Consultation Ticket: ${booking.reference_code}\nPatient: ${booking.patient_name}\nClinic: ${clinicName}\nDoctor: ${docName}\nDate: ${dateStr} (${timeStr})\nVerify: ${verifyUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Isalu Hospitals Ticket - ${booking.reference_code}`,
          text: shareText,
          url: verifyUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedTicket(true);
        setTimeout(() => setCopiedTicket(false), 3000);
      } catch {
        // clipboard fallback
      }
    }
  };

  return (
    <div className="w-full mx-auto">
      {/* ---------------- MAIN PAGE: CLINIC DIRECTORY ---------------- */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#f0f9ff] text-[#0085D0] border border-[#bae6fd] mb-2 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#00A3FF]" />
              <span>Outpatient Specialty Units</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Select Specialty Clinic Unit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Click on any clinical unit to view consulting specialists, operating shifts, and book your appointment.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-[#0085D0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clinics (e.g. Cardiology, Eye, Dental)..."
              value={searchClinic}
              onChange={(e) => setSearchClinic(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0085D0]/20 focus:border-[#0085D0] transition-all font-medium placeholder:text-slate-400 shadow-2xs"
            />
            {searchClinic && (
              <button
                onClick={() => setSearchClinic('')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {[
            { id: 'ALL', label: 'All Specialty Units' },
            { id: 'WOMEN', label: 'Maternal & O&G' },
            { id: 'CHILD', label: 'Paediatrics' },
            { id: 'CARDIO', label: 'Cardiology' },
            { id: 'SURGERY', label: 'Surgery & Ortho' },
            { id: 'EYE_DENTAL', label: 'Dental & Eye' },
            { id: 'INTERNAL', label: 'Internal Medicine' },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0082cd] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 py-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/70 animate-pulse space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-slate-200" />
                  <div className="w-20 h-5 rounded-full bg-slate-200" />
                </div>
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-3.5 bg-slate-200 rounded w-full" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2.5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-xs sm:text-sm">No clinics found matching &ldquo;{searchClinic}&rdquo;</p>
            <button
              onClick={() => setSearchClinic('')}
              className="text-xs text-[#0085D0] font-bold hover:underline"
            >
              View All Available Clinics
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {filteredClinics.map((dept) => {
              const schedules = getClinicSchedules(dept);
              const docCount = doctors.filter(
                (d) => d.department_id === dept.id || (d.department && d.department.id === dept.id)
              ).length;
              const clinicStatus = getClinicTodayStatus(dept, schedules);

              return (
                <div
                  key={dept.id}
                  onClick={() => handleClinicCardClick(dept)}
                  className="group p-5 sm:p-7 rounded-3xl border-2 border-slate-200/90 hover:border-[#0085D0] border-l-[6px] border-l-[#0085D0] bg-white hover:shadow-2xl hover:shadow-[#0085D0]/15 hover:ring-4 hover:ring-[#0085D0]/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
                >
                  {/* Top brand gradient highlight that enhances on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0085D0] via-[#00A3FF] to-[#005B9C] opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300" />

                  <div className="space-y-4">
                    {/* Header with icon, title, location, and doctor count badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] border border-[#bae6fd] flex items-center justify-center text-[#0085D0] group-hover:bg-gradient-to-br group-hover:from-[#0085D0] group-hover:to-[#005B9C] group-hover:text-white group-hover:border-transparent group-hover:shadow-md group-hover:shadow-[#0085D0]/25 transition-all duration-300 shrink-0">
                          {getClinicIcon(dept.icon_name || dept.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl sm:text-lg font-black text-slate-900 group-hover:text-[#0085D0] transition-colors tracking-tight truncate leading-snug">
                            {dept.name}
                          </h3>
                          <p className="text-sm sm:text-xs font-semibold text-slate-500 group-hover:text-slate-600 transition-colors truncate mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#0085D0]/80 shrink-0" />
                            <span>{dept.location || 'Outpatient Clinical Unit'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {clinicStatus.isOpenToday && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span>Open Today</span>
                          </span>
                        )}
                        <span className="text-sm sm:text-xs font-black text-[#006bac] bg-[#f0f9ff] px-3.5 py-1.5 sm:px-3 sm:py-1 rounded-full border border-[#bae6fd] shrink-0 flex items-center gap-1.5 shadow-2xs group-hover:border-[#7dd3fc] group-hover:bg-[#e0f2fe] transition-colors">
                          <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#0085D0]" />
                          <span>{docCount} {docCount === 1 ? 'Doctor' : 'Doctors'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-base sm:text-sm text-slate-600 font-normal line-clamp-2 leading-relaxed">
                      {dept.description || 'Specialized clinical outpatient unit providing comprehensive medical examinations, diagnostic consultations, and follow-ups.'}
                    </p>

                    {/* Clinic Operating Days & Shift Time List */}
                    <div className="pt-3.5 sm:pt-3 border-t border-slate-100 space-y-2.5 sm:space-y-2">
                      <div className="flex items-center justify-between text-sm sm:text-xs font-black uppercase tracking-wider text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#0085D0]" />
                          <span>CLINIC DAYS & SHIFTS:</span>
                        </span>
                      </div>

                      {schedules.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {schedules.map((item, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1.5 bg-slate-50 group-hover:bg-[#f0f9ff] border border-slate-200/90 group-hover:border-[#bae6fd] px-3.5 py-2 sm:px-2.5 sm:py-1 rounded-xl text-sm sm:text-xs text-slate-700 transition-colors shadow-2xs"
                            >
                              <span className="font-black text-slate-900 text-sm sm:text-xs">{item.day}:</span>
                              <span className="font-mono font-bold text-[#006bac] text-sm sm:text-xs">{item.shift_time}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-base sm:text-xs text-slate-400 italic">
                          Consultation days arranged on specialist schedules.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-base sm:text-sm font-black text-[#0085D0] group-hover:text-[#006bac] transition-colors flex items-center gap-1.5">
                      <span>Book Specialist Consultation</span>
                    </span>
                    <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-[#f0f9ff] text-[#0085D0] border border-[#bae6fd] group-hover:bg-gradient-to-r group-hover:from-[#0085D0] group-hover:to-[#005B9C] group-hover:text-white group-hover:border-transparent flex items-center justify-center shadow-xs transition-all duration-300 group-hover:translate-x-1">
                      <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- ALL-IN-ONE BOOKING MODAL (PORTALED TO ROOT BODY) ---------------- */}
      {isModalOpen && currentClinic && mounted && createPortal(
        <div
          onClick={handleCloseModal}
          className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-3xl shadow-2xl border border-slate-100 w-full overflow-hidden my-auto max-h-[85vh] transition-all duration-300 flex flex-col animate-scale-pop ${
              modalStep === 3 ? 'max-w-3xl' : modalStep === 4 ? 'max-w-md' : 'max-w-xl'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#053b61] to-[#005488] text-white relative shrink-0 border-b border-white/10">
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer backdrop-blur-xs active:scale-95 z-10"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 4 Segmented Progress Bars (as shown in reference design) */}
              <div className="grid grid-cols-4 gap-2 mb-2.5 pr-8">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    modalStep >= 1
                      ? 'bg-[#38bdf8] shadow-sm shadow-[#38bdf8]/50'
                      : 'bg-white/20'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    modalStep >= 2
                      ? 'bg-[#38bdf8] shadow-sm shadow-[#38bdf8]/50'
                      : 'bg-white/20'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    modalStep >= 3
                      ? 'bg-[#38bdf8] shadow-sm shadow-[#38bdf8]/50'
                      : 'bg-white/20'
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    modalStep >= 4
                      ? 'bg-[#38bdf8] shadow-sm shadow-[#38bdf8]/50'
                      : 'bg-white/20'
                  }`}
                />
              </div>

              {/* Clinic Badge & Step Counter */}
              <div className="flex items-center gap-2 mb-1.5 pr-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-sky-200 border border-white/20 text-[11px] font-bold shadow-2xs truncate">
                  {getClinicIcon(currentClinic.icon_name || currentClinic.name)}
                  <span>{currentClinic.name} Clinic</span>
                </span>
                <span className="text-[10px] text-sky-200/90 font-bold bg-white/10 px-2 py-0.5 rounded-full">
                  Step {modalStep} of 4
                </span>
              </div>

              {/* Step Title & Subtitle */}
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {modalStep === 1 && 'Patient Particulars & Billing Category'}
                {modalStep === 2 && `Choose Consulting Specialist in ${currentClinic.name}`}
                {modalStep === 3 && 'Consultation Schedule & Confirm Booking'}
                {modalStep === 4 && 'Appointment Confirmed & Ticket Voucher'}
              </h3>
              <p className="text-[11px] sm:text-xs text-sky-100/80 mt-0.5 max-w-xl leading-relaxed">
                {modalStep === 1 && 'Provide patient information and select Private Self-Pay or HMO to filter qualified specialists.'}
                {modalStep === 2 && `Showing verified doctors attending to ${billingFilter === 'HMO' ? 'HMO Insurance' : 'Private Self-Pay'} consultations.`}
                {modalStep === 3 && 'Pick an active consultation day on the calendar to book your appointment.'}
                {modalStep === 4 && 'Your appointment has been reserved. You can download, print, or share your official slip.'}
              </p>

              {/* Connected Stepper with Visual Milestones */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-white/15">
                {[
                  { step: 1, label: 'Patient Info', icon: User },
                  { step: 2, label: 'Select Doctor', icon: Stethoscope },
                  { step: 3, label: 'Date & Slot', icon: Calendar },
                  { step: 4, label: 'Ticket Voucher', icon: CheckCircle2 },
                ].map((s, idx, arr) => {
                  const isCompleted = modalStep > s.step;
                  const isCurrent = modalStep === s.step;
                  return (
                    <React.Fragment key={s.step}>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                            isCompleted
                              ? 'bg-emerald-400 text-slate-950 shadow-sm font-extrabold'
                              : isCurrent
                              ? 'bg-[#38bdf8] text-slate-950 ring-2 ring-white/50 font-black shadow-md'
                              : 'bg-white/15 text-slate-400 font-bold'
                          }`}
                        >
                          {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.step}
                        </div>
                        <span
                          className={`hidden sm:inline text-[11px] font-bold transition-colors ${
                            isCurrent
                              ? 'text-white font-extrabold'
                              : isCompleted
                              ? 'text-sky-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 rounded-full transition-colors ${
                            modalStep > s.step ? 'bg-emerald-400/90' : 'bg-white/20'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Modal Body with Scrollable Area */}
            <div ref={modalScrollRef} className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {errorMessage && (
                <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-slide-up">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900">Appointment Notice</p>
                    <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
                    {duplicateRef && (
                      <div className="mt-2 pt-1.5 border-t border-rose-200/80">
                        <a
                          href={`/check-status?ref=${encodeURIComponent(duplicateRef)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Existing Appointment Voucher ({duplicateRef})
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- MODAL STEP 1: PATIENT PARTICULARS & BILLING SELECTION ---------------- */}
              {modalStep === 1 && (
                <form onSubmit={handleIntakeSubmit} className="space-y-4">
                  {modalError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-slide-up">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-semibold">{modalError}</span>
                    </div>
                  )}

                  {/* Billing Category Selector (Matching Reference Screenshot) */}
                  <div className="space-y-2.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1">
                      Select Patient Billing Category <span className="text-rose-500 font-bold">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Private Self-Pay */}
                      <div
                        onClick={() => setPaymentType('Private Self-Pay')}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                          paymentType === 'Private Self-Pay'
                            ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              paymentType === 'Private Self-Pay'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                          </div>

                          {paymentType === 'Private Self-Pay' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white shadow-2xs">
                              Selected
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Private Self-Pay</h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Proceed to select doctor and book your appointment
                          </p>
                        </div>
                      </div>

                      {/* HMO Health Insurance */}
                      <div
                        onClick={() => setPaymentType('HMO Insurance')}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                          paymentType === 'HMO Insurance'
                            ? 'border-[#0082cd] bg-sky-50/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              paymentType === 'HMO Insurance'
                                ? 'bg-[#0082cd] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </div>

                          {paymentType === 'HMO Insurance' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0082cd] text-white shadow-2xs">
                              Selected
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">HMO Insurance</h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Proceed to select doctor and book your appointment
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conditional HMO fields */}
                  {paymentType === 'HMO Insurance' && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 border border-sky-200 shadow-2xs space-y-3 animate-scale-pop">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#006bac]">
                        <Building2 className="w-4 h-4 text-[#0082cd]" />
                        <span>HMO Health Insurance Details</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800">
                            Select HMO Provider <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                              value={selectedHmoId}
                              onChange={(e) => setSelectedHmoId(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-sky-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#0082cd]/15 focus:border-[#0082cd] font-semibold transition-all"
                            >
                              <option value="">Choose HMO Company...</option>
                              {hmos.map((h) => (
                                <option key={h.id} value={h.id}>
                                  {h.name} ({h.policy_code || h.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800">
                            HMO Enrollee / Policy ID <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="e.g. HYG-1029485"
                              value={hmoPolicyCode}
                              onChange={(e) => setHmoPolicyCode(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-sky-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-4 focus:ring-[#0082cd]/15 focus:border-[#0082cd] font-mono font-bold transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        * Please bring your active HMO corporate ID card and a valid photo ID along for verification on your appointment date.
                      </p>
                    </div>
                  )}

                  {/* Patient Demographic Form Fields */}
                  <div className="space-y-3 pt-1">
                    {/* Patient Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1">
                        Patient Full Name <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Adewale Babatunde"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-[#0082cd] transition-all placeholder:text-slate-400 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Phone Number & Email Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1">
                          Phone Number <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 0803 123 4567"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-[#0082cd] transition-all placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-bold text-slate-800">
                          Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="patient@gmail.com"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-[#0082cd] transition-all placeholder:text-slate-400 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reason for Visit / Symptoms */}
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-800">
                        Reason for Visit / Symptoms <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Regular medical follow-up, Eye check, Joint ache..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-[#0082cd] transition-all placeholder:text-slate-400 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="group flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0082cd] via-[#006bac] to-[#005488] hover:from-[#0073b6] hover:to-[#004875] text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg shadow-[#0082cd]/25 transition-all active:scale-98 cursor-pointer"
                    >
                      <span>Proceed to Select Doctor</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- MODAL STEP 2: SELECT DOCTOR (FILTERED BY BILLING) ---------------- */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  {/* Patient Summary Header Pill */}
                  <div className="bg-gradient-to-r from-sky-50/90 via-white to-sky-50/50 border border-sky-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#0082cd] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 truncate">
                          {patientName} <span className="font-normal text-slate-500">({patientPhone})</span>
                        </p>
                        <p className="text-[11px] text-slate-600 truncate flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${paymentType === 'HMO Insurance' ? 'bg-[#0082cd]' : 'bg-emerald-500'}`} />
                          <span className="font-bold text-slate-800">
                            {paymentType === 'HMO Insurance'
                              ? `HMO Insurance (${selectedHmoName || 'Provider'} - ${hmoPolicyCode})`
                              : 'Private Self-Pay'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="text-xs font-bold text-[#006bac] hover:text-[#005488] px-3 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 shrink-0 cursor-pointer shadow-2xs transition-colors"
                    >
                      Edit Info
                    </button>
                  </div>

                  {/* Guidance notice */}
                  <div className="text-[11px] text-slate-600 px-1 font-medium flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${billingFilter === 'HMO' ? 'bg-[#0082cd]' : 'bg-emerald-500'}`} />
                      <span>
                        {billingFilter === 'HMO'
                          ? `Specialists in ${currentClinic.name} attending to HMO Insurance patients.`
                          : `Specialists in ${currentClinic.name} attending to Private Self-Pay patients.`}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {filteredClinicDoctors.length} {filteredClinicDoctors.length === 1 ? 'Specialist' : 'Specialists'}
                    </span>
                  </div>

                  {/* Doctors List */}
                  {filteredClinicDoctors.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 p-6 rounded-2xl border-2 border-dashed border-slate-200 space-y-3 bg-slate-50/50">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 text-sm">
                        No specialists currently attend to {billingFilter === 'HMO' ? 'HMO Insurance' : 'Private Self-Pay'} in {currentClinic.name}.
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalStep(1)}
                        className="inline-flex items-center gap-1 text-xs text-[#0082cd] font-bold hover:underline cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Billing Category</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredClinicDoctors.map((doc) => {
                        const dutyDaysWithCap = getDutyDaysWithCap(doc);
                        const billing = getDoctorBillingCategory(doc);
                        const shiftTime = getDoctorShiftTime(doc);

                        return (
                          <div
                            key={doc.id}
                            className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 bg-white hover:border-[#0082cd] hover:shadow-md hover:shadow-[#0082cd]/10 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="space-y-2 min-w-0">
                              <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0082cd] to-[#005488] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-[#0082cd]/20">
                                  {getDoctorInitials(doc)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate group-hover:text-[#0082cd] transition-colors">
                                      {getDoctorInitialName(doc)}
                                    </h4>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${billing.badgeClass}`}>
                                      {billing.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#006bac] font-medium truncate mt-0.5">
                                    {doc.qualification || doc.qualifications || doc.specialty || 'Specialist Consultant'}
                                  </p>
                                </div>
                              </div>

                              {/* Consultation Days & Shift */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                                <span className="inline-flex items-center gap-1 font-semibold text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80">
                                  <Calendar className="w-3.5 h-3.5 text-[#0082cd]" />
                                  <span>{dutyDaysWithCap.map((d) => d.day).join(', ')}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{shiftTime}</span>
                                </span>
                              </div>
                            </div>

                            {/* Select Doctor Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setSelectedDate('');
                                setSelectedSlot('');
                                setAvailability(null);
                                setModalStep(3); // Proceed to Calendar step inside modal
                              }}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0082cd] to-[#005488] hover:from-[#0073b6] hover:to-[#004875] text-white font-extrabold text-xs shadow-md shadow-[#0082cd]/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                            >
                              <span>Select & View Calendar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Back button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Patient Details</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- MODAL STEP 3: CALENDAR & DIRECT ONE-CLICK BOOKING ---------------- */}
              {modalStep === 3 && selectedDoctor && (
                <div className="space-y-4">
                  {/* Doctor Profile Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-sky-50/50 border border-sky-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0082cd] to-[#005488] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {getDoctorInitials(selectedDoctor)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {getDoctorInitialName(selectedDoctor)}
                        </h4>
                        <p className="text-[11px] text-[#006bac] font-medium mt-0.5">
                          {currentClinic.name} • {getDoctorShiftTime(selectedDoctor)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="text-xs font-bold text-[#0082cd] hover:underline shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      Change Doctor
                    </button>
                  </div>

                  {/* Calendar & Shift Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Left Column: Interactive Month Calendar */}
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          Select Consultation Date
                        </label>
                        <span className="text-[11px] text-[#0082cd] font-semibold">
                          Highlighted dates are active duty days
                        </span>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
                        <SpecialistDatePicker
                          selectedDate={selectedDate}
                          onSelectDate={(dateStr: string) => {
                            setSelectedDate(dateStr);
                            setSelectedSlot('');
                          }}
                          availableDays={selectedDoctor.available_days || []}
                          doctorName={getDoctorInitialName(selectedDoctor)}
                          fullyBookedDates={selectedDoctor.fully_booked_dates || []}
                          closedDates={(() => {
                            const baseClosed = selectedDoctor.closed_dates || [];
                            const now = new Date();
                            const todayDayShort = now.toLocaleDateString('en-US', { weekday: 'short' });
                            const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            const nowMin = now.getHours() * 60 + now.getMinutes();

                            // Check if today's shift has already ended for this doctor
                            const shifts: string[] = [];
                            if (selectedDoctor.schedules && selectedDoctor.schedules.length > 0) {
                              selectedDoctor.schedules.forEach((s) => {
                                if (!s.status) return;
                                const d = (s.day_of_week || '').toLowerCase();
                                if (d.includes(todayDayShort.toLowerCase()) || todayDayShort.toLowerCase().includes(d)) {
                                  if (s.end_time) shifts.push(s.end_time);
                                  else if (s.shift_time || s.formatted_shift) shifts.push(s.shift_time || s.formatted_shift || '');
                                }
                              });
                            }
                            if (shifts.length === 0 && (selectedDoctor.shift_time || selectedDoctor.formatted_shift)) {
                              shifts.push(selectedDoctor.shift_time || selectedDoctor.formatted_shift || '');
                            }

                            if (shifts.length > 0) {
                              let latestEnd: number | null = null;
                              shifts.forEach((sh) => {
                                const endMin = getLatestShiftEndMinutes(sh);
                                if (endMin !== null && (latestEnd === null || endMin > latestEnd)) latestEnd = endMin;
                              });
                              if (latestEnd !== null && nowMin >= latestEnd) {
                                if (!baseClosed.includes(todayDateStr)) {
                                  return [...baseClosed, todayDateStr];
                                }
                              }
                            }
                            return baseClosed;
                          })()}
                        />
                      </div>
                    </div>

                    {/* Right Column: Slot Availability & Booking Submit */}
                    <div className="md:col-span-5 flex flex-col justify-between space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-2">
                          Consultation Shift & Daily Capacity
                        </label>

                        {checkingAvailability ? (
                          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-slate-500 text-xs animate-pulse">
                            <Clock className="w-4 h-4 animate-spin text-[#0082cd]" />
                            <span>Checking specialist capacity...</span>
                          </div>
                        ) : selectedDate ? (
                          availability && availability.is_booking_closed ? (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                              <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                                Booking Closed for Today
                              </span>
                              <p className="text-xs text-amber-900">
                                {availability.closed_reason || "Online bookings close 10 minutes before clinic commencement. Please choose another date."}
                              </p>
                            </div>
                          ) : availability && (availability.is_fully_booked || availability.remaining_slots <= 0) ? (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
                              <AlertCircle className="w-5 h-5 text-rose-600 mx-auto" />
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-black uppercase">
                                Fully Booked
                              </span>
                              <p className="text-xs text-rose-900">
                                All {availability.daily_capacity} consultation slots reserved for {selectedDate}.
                              </p>
                            </div>
                          ) : availability && availability.is_available ? (
                            <div className="space-y-2.5">
                              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-sky-50/30 border border-sky-200/90 space-y-2.5 shadow-2xs">
                                <div className="flex items-center justify-between text-xs text-[#006bac] font-bold">
                                  <span>Selected Date:</span>
                                  <span className="bg-white px-2.5 py-0.5 rounded-md border border-sky-200 font-mono text-slate-900">
                                    {selectedDate}
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <Clock className="w-4 h-4 text-[#0082cd] shrink-0 self-center" />
                                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                                    {availability.formatted_shift || selectedSlot || '08:00 AM – 02:00 PM'}
                                  </h4>
                                </div>
                                <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-xs">
                                  <span className="text-slate-600 font-medium">Daily Capacity:</span>
                                  <span className="font-extrabold text-[#006bac] bg-white px-2.5 py-0.5 rounded-md border border-sky-200 text-[11px]">
                                    {availability.booked_count ?? (availability.daily_capacity - availability.remaining_slots)} of {availability.daily_capacity} Booked ({availability.remaining_slots} slots left)
                                  </span>
                                </div>
                              </div>

                              {/* Patient Summary Confirmation Box */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                                    <User className="w-3.5 h-3.5 text-[#0082cd]" />
                                    <span>Patient Particulars:</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setModalStep(1)}
                                    className="text-[10px] font-bold text-[#0082cd] hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-700">
                                  <strong className="text-slate-900">{patientName}</strong> • {patientPhone}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  Billing:{' '}
                                  <span className="font-semibold text-slate-800">
                                    {paymentType === 'HMO Insurance'
                                      ? `HMO (${selectedHmoName || 'Provider'})`
                                      : 'Private Self-Pay'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                              <AlertCircle className="w-4 h-4 text-amber-600 mx-auto" />
                              <p className="font-bold text-amber-900 text-xs">Specialist Not on Duty</p>
                              <p className="text-[11px] text-amber-800">
                                Please choose one of the highlighted active duty dates on the calendar.
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400 space-y-1.5">
                            <Calendar className="w-5 h-5 text-slate-300 mx-auto" />
                            <p className="font-medium text-slate-600">Select an active date on the calendar.</p>
                            <p className="text-[11px]">Shift time & quota will display here.</p>
                          </div>
                        )}
                      </div>

                      {/* Direct Booking Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setModalStep(2)}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                          Change Doctor
                        </button>

                        <button
                          type="button"
                          disabled={
                            !selectedDate ||
                            !selectedSlot ||
                            !availability?.is_available ||
                            availability?.is_fully_booked ||
                            availability?.is_booking_closed ||
                            availability?.remaining_slots <= 0 ||
                            submitting
                          }
                          onClick={handleBookingSubmit}
                          className={`inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            selectedDate &&
                            selectedSlot &&
                            availability?.is_available &&
                            !availability?.is_fully_booked &&
                            !availability?.is_booking_closed &&
                            availability?.remaining_slots > 0 &&
                            !submitting
                              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md shadow-emerald-600/25 active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {submitting ? (
                            <>
                              <Clock className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Reserving Slot...</span>
                            </>
                          ) : (
                            <>
                              <span>Book & Generate Ticket</span>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- MODAL STEP 4: TICKET VOUCHER & MULTI-CHANNEL SHARING ---------------- */}
              {modalStep === 4 && createdBooking && (
                <div className="space-y-4">
                  {/* Printable Ticket Voucher Card */}
                  <div
                    id="printable-ticket"
                    className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden text-left p-5 sm:p-6 space-y-4 shadow-sm"
                  >
                    {/* Header */}
                    <div className="text-center pb-3.5 border-b border-dashed border-slate-200">
                      <div className="flex justify-center mb-2">
                        <IsaluLogo variant="full" size="md" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • Tel: +234 800 47258 2273
                      </p>
                      <span className="inline-block mt-2 px-3.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                        Appointment Confirmed
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Ticket Reference</span>
                        <span className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-wide">
                          {createdBooking.reference_code}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Clinical Status</span>
                        <span className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                          {createdBooking.status || 'Confirmed'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Date & Shift</span>
                        <span className="font-medium text-slate-700 text-[11px]">
                          {createdBooking.date || createdBooking.appointment_date} at {createdBooking.time || createdBooking.appointment_time}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Payment Channel</span>
                        <span className="font-medium text-slate-700 text-[11px]">
                          {createdBooking.payment_type}
                          {createdBooking.hmo_name && createdBooking.hmo_name !== 'N/A' && ` (${createdBooking.hmo_name})`}
                        </span>
                      </div>
                    </div>

                    {/* Details List */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 text-[11px]">Patient Name:</span>
                        <span className="font-bold text-slate-900 text-[11px]">{createdBooking.patient_name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 text-[11px]">Phone Contact:</span>
                        <span className="font-mono font-medium text-slate-700 text-[11px]">{createdBooking.patient_phone}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 text-[11px]">Consultant:</span>
                        <span className="font-bold text-slate-900 text-[11px]">
                          {getDoctorInitialName(createdBooking.doctor_name || selectedDoctor)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 text-[11px]">Clinic Unit:</span>
                        <span className="font-semibold text-[#006bac] text-[11px]">
                          {createdBooking.doctor_specialty || createdBooking.department?.name || currentClinic.name}
                        </span>
                      </div>
                      {createdBooking.hmo_policy_code && (
                        <div className="flex justify-between py-1.5 border-b border-slate-100 bg-sky-50/70 px-2.5 rounded-lg">
                          <span className="text-[#005488] font-bold text-[11px]">HMO Policy ID:</span>
                          <span className="font-mono font-black text-[#006bac] text-[11px]">{createdBooking.hmo_policy_code}</span>
                        </div>
                      )}
                    </div>

                    {/* Barcode & Notice */}
                    <div className="pt-1 text-center space-y-1.5">
                      <div className="inline-block p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-center gap-1 tracking-widest font-mono text-base font-black text-slate-800">
                          ||| | |||| | || ||| || ||| ||||
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                          Scan at Outpatient Triage Desk
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Please arrive 15 minutes before your consultation window for nursing triage (BP, Weight, Pulse).
                      </p>
                    </div>
                  </div>

                  {/* Multi-channel Actions Bar */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                      <span>Print or Share Voucher:</span>
                      {copiedTicket && (
                        <span className="text-emerald-600 flex items-center gap-1 text-[11px] animate-slide-up">
                          <Check className="w-3.5 h-3.5" /> Details copied!
                        </span>
                      )}
                    </div>

                    {/* 3 Main Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => printElement('printable-ticket')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-sky-400" />
                        <span>Print Slip</span>
                      </button>

                      <a
                        href={getWhatsAppShareUrl(createdBooking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={getEmailShareUrl(createdBooking)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0082cd] hover:bg-[#0073b6] text-white font-bold text-xs shadow-md shadow-[#0082cd]/20 transition-all active:scale-95 cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email Slip</span>
                      </a>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleShareOrCopy(createdBooking)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {copiedTicket ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{copiedTicket ? 'Copied to Clipboard' : 'Copy Ticket Details'}</span>
                      </button>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleBookAnother}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[#0082cd] hover:bg-sky-50 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Book Another</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            resetFormState();
                            setIsModalOpen(false);
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
