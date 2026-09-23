// src/components/dashboard/TodayClinicModule.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Search, 
  RefreshCw, 
  Filter, 
  Check, 
  Copy, 
  RotateCcw, 
  ShieldCheck, 
  CreditCard, 
  Activity, 
  Phone, 
  Mail, 
  LayoutGrid, 
  Layers, 
  FileText, 
  HeartPulse, 
  Baby, 
  Eye, 
  Bone, 
  Brain, 
  Smile,
  CalendarClock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { getBookings, getDepartments, getDoctors, checkInBooking } from '@/lib/api';
import { Booking, Department, Doctor, StaffUser, getDoctorInitialName } from '@/lib/types';
import { printElement } from '@/lib/printUtils';
import IsaluLogo from '@/components/IsaluLogo';
import RescheduleModal from '@/components/RescheduleModal';

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.574 1.815.88 2.791.88 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.393 8.303c-.149.421-.736.78-1.02.83-.284.05-.62.062-1.895-.469-1.629-.678-2.678-2.339-2.759-2.449-.081-.11-.655-.873-.655-1.664 0-.791.413-1.18.561-1.341.149-.161.326-.201.435-.201.109 0 .218.001.312.006.101.005.237-.038.37.283.149.362.508 1.239.552 1.33.044.091.074.198.015.318-.059.12-.089.198-.178.301-.089.103-.187.23-.267.31-.089.088-.182.184-.078.362.103.178.461.761.99 1.232.682.608 1.258.796 1.436.885.178.089.282.078.386-.041.104-.119.444-.517.563-.695.118-.178.237-.149.397-.089.16.06 1.011.477 1.185.564.174.087.291.13.333.201.042.071.042.411-.107.832z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2 22l4.982-1.309C8.423 21.536 10.147 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.67 0-3.235-.487-4.558-1.325l-.326-.208-2.969.779.792-2.894-.225-.357A8.14 8.14 0 0 1 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.512 0 8.182 3.67 8.182 8.182 0 4.512-3.67 8.182-8.182 8.182z" />
    </svg>
  );
}

function getClinicBadgeIcon(name?: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (lower.includes('paed') || lower.includes('ped') || lower.includes('child') || lower.includes('baby')) return <Baby className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  if (lower.includes('eye') || lower.includes('ophthal')) return <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
  if (lower.includes('ortho') || lower.includes('bone')) return <Bone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  if (lower.includes('neuro') || lower.includes('brain') || lower.includes('psych')) return <Brain className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
  if (lower.includes('dent') || lower.includes('smile')) return <Smile className="w-3.5 h-3.5 text-[#0085D0] shrink-0" />;
  if (lower.includes('surg')) return <Activity className="w-3.5 h-3.5 text-[#006bac] shrink-0" />;
  if (lower.includes('general') || lower.includes('family')) return <Stethoscope className="w-3.5 h-3.5 text-[#0085D0] shrink-0" />;
  return <Building2 className="w-3.5 h-3.5 text-[#0085D0] shrink-0" />;
}

interface TodayClinicModuleProps {
  currentUser?: StaffUser | null;
  departments?: Department[];
  doctors?: Doctor[];
  onRefreshDashboard?: () => void;
}

export default function TodayClinicModule({
  currentUser,
  departments: propDepartments,
  doctors: propDoctors,
  onRefreshDashboard,
}: TodayClinicModuleProps) {
  // Today's date string YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // States
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [departments, setDepartments] = useState<Department[]>(propDepartments || []);
  const [doctors, setDoctors] = useState<Doctor[]>(propDoctors || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('ALL');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'ALL' | 'Private Self-Pay' | 'HMO Insurance'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Actions
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [rescheduleTargetBooking, setRescheduleTargetBooking] = useState<Booking | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  // Load Reference Data if not passed from dashboard parent
  useEffect(() => {
    if (!propDepartments || propDepartments.length === 0) {
      getDepartments().then((data) => setDepartments(data || [])).catch(() => {});
    } else {
      setDepartments(propDepartments);
    }
    if (!propDoctors || propDoctors.length === 0) {
      getDoctors(undefined, true).then((data) => setDoctors(data || [])).catch(() => {});
    } else {
      setDoctors(propDoctors);
    }
  }, [propDepartments, propDoctors]);

  // Fetch Bookings for Selected Date
  const fetchBookings = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      setError(null);

      const data = await getBookings({
        date: selectedDate,
      });

      setBookings(data || []);
      setLastSyncedAt(new Date());
    } catch (err: unknown) {
      if (!isSilent) {
        setError(err instanceof Error ? err.message : 'Unable to load bookings for the selected clinic date.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Initial & Date change trigger
  useEffect(() => {
    setLoading(true);
    fetchBookings(false);
  }, [fetchBookings]);

  // Auto-polling effect (every 25 seconds if active)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchBookings]);

  // Handle Check-in Action
  const handleCheckIn = async (bookingId: number) => {
    try {
      setCheckingInId(bookingId);
      const res = await checkInBooking(bookingId);
      
      // Update local state smoothly
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: res.booking?.status || 'Checked In' } : b))
      );
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to check in patient. Please try again.');
    } finally {
      setCheckingInId(null);
    }
  };

  // Copy Ticket reference
  const handleCopyCode = async (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Generate WhatsApp Share URL
  const getWhatsAppShareUrl = (bk: Booking) => {
    const docName = getDoctorInitialName(bk.doctor || bk.doctor_name);
    const clinicName = bk.doctor_specialty || bk.department?.name || 'Specialist Consultation';
    const dateStr = bk.date || bk.appointment_date;
    const timeStr = bk.time || bk.appointment_time;
    const paymentLabel = bk.payment_type === 'HMO Insurance' && bk.hmo_name
      ? `HMO Insurance (${bk.hmo_name})`
      : bk.payment_type;

    const message = `*ISALU HOSPITALS - TODAY'S CONSULTATION TICKET*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎟️ *Ticket Reference:* ${bk.reference_code}
👤 *Patient Name:* ${bk.patient_name}
🏥 *Specialty Clinic:* ${clinicName}
👨‍⚕️ *Consulting Specialist:* ${docName}
📅 *Consultation Date:* ${dateStr}
⏰ *Shift Window:* ${timeStr}
💳 *Billing:* ${paymentLabel}
${bk.hmo_policy_code ? `🆔 *HMO Policy ID:* ${bk.hmo_policy_code}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Address:* No. 46, Ijaiye Road, Ogba, Ikeja, Lagos
ℹ️ Please arrive 15 minutes before your shift window for nursing vital triage.
🔗 Check/Track Slip: ${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(bk.reference_code)}`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // Filtered Bookings Logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Clinic / Department Filter
      if (selectedClinicId !== 'ALL') {
        const deptMatches = String(b.department_id) === selectedClinicId ||
          String(b.department?.id) === selectedClinicId ||
          (b.department?.name && b.department.name.toLowerCase() === selectedClinicId.toLowerCase()) ||
          (b.doctor_specialty && b.doctor_specialty.toLowerCase() === selectedClinicId.toLowerCase());
        if (!deptMatches) return false;
      }

      // Doctor Filter
      if (selectedDoctorId !== 'ALL') {
        const docMatches = String(b.doctor_id) === selectedDoctorId ||
          String(b.doctor?.id) === selectedDoctorId;
        if (!docMatches) return false;
      }

      // Payment Type Filter
      if (selectedPaymentType !== 'ALL') {
        if (selectedPaymentType === 'Private Self-Pay' && b.payment_type !== 'Private Self-Pay') return false;
        if (selectedPaymentType === 'HMO Insurance' && b.payment_type !== 'HMO Insurance') return false;
      }

      // Status Filter
      if (selectedStatus !== 'ALL') {
        if ((b.status || 'Confirmed').toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refMatch = (b.reference_code || '').toLowerCase().includes(q);
        const nameMatch = (b.patient_name || '').toLowerCase().includes(q);
        const phoneMatch = (b.patient_phone || '').toLowerCase().includes(q);
        const emailMatch = (b.patient_email || '').toLowerCase().includes(q);
        const hmoMatch = (b.hmo_policy_code || '').toLowerCase().includes(q) || (b.hmo_name || '').toLowerCase().includes(q);
        const doctorMatch = (b.doctor_name || '').toLowerCase().includes(q) || (b.doctor?.name || '').toLowerCase().includes(q);
        if (!refMatch && !nameMatch && !phoneMatch && !emailMatch && !hmoMatch && !doctorMatch) return false;
      }

      return true;
    });
  }, [bookings, selectedClinicId, selectedDoctorId, selectedPaymentType, selectedStatus, searchQuery]);

  // Metric Computations for Today's Active Roster
  const metrics = useMemo(() => {
    const total = bookings.length;
    const privateCount = bookings.filter((b) => b.payment_type === 'Private Self-Pay').length;
    const hmoCount = bookings.filter((b) => b.payment_type === 'HMO Insurance').length;
    const checkedInCount = bookings.filter((b) => ['Checked In', 'In Consultation', 'Completed'].includes(b.status)).length;
    
    // Unique clinics represented
    const clinicSet = new Set<string>();
    bookings.forEach((b) => {
      const c = b.doctor_specialty || b.department?.name;
      if (c) clinicSet.add(c);
    });

    return {
      total,
      privateCount,
      hmoCount,
      checkedInCount,
      clinicsCount: clinicSet.size,
    };
  }, [bookings]);

  // Formatted date banner string
  const formattedDateTitle = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isSelectedDateToday = selectedDate === todayDateStr;

  return (
    <div className="space-y-6">
      {/* ---------------- TOP HERO BANNER ---------------- */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#005B9C] text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#0085D0]/25 text-[#38BDF8] border border-[#0085D0]/40 shadow-xs">
                <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Outpatient Clinical Queue</span>
              </span>
              {isSelectedDateToday && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Today&apos;s Active Roster</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Today&apos;s Clinic Consultations</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-[#38BDF8]" />
              <span>{formattedDateTitle}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-xs">
                Last synced {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </p>
          </div>

          {/* Quick Actions & Date Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Input */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/90 rounded-2xl p-1 shadow-inner">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold px-2.5 py-1.5 focus:outline-none cursor-pointer"
                title="Filter consultations by specific date"
              />
              {!isSelectedDateToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayDateStr)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#0085D0] hover:bg-[#006bac] text-white rounded-xl transition-colors cursor-pointer"
                >
                  Back to Today
                </button>
              )}
            </div>

            {/* Live Sync Toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title={autoRefresh ? 'Live automatic refresh every 25s enabled' : 'Live polling paused'}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{autoRefresh ? 'Live Sync' : 'Sync Paused'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchBookings(false)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh consultation list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#38BDF8]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Print Manifest Button */}
            <button
              type="button"
              onClick={() => printElement('printable-today-manifest', `Isalu Hospitals - Clinical Manifest (${selectedDate})`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0085D0] hover:bg-[#006bac] text-white text-xs font-black shadow-md shadow-[#0085D0]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>
          </div>
        </div>

        {/* ---------------- STAT METRIC CARDS ---------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          {/* Total */}
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-slate-700/60">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Bookings
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">{metrics.total}</span>
              <span className="text-[11px] text-slate-400">Patients</span>
            </div>
          </div>

          {/* Private */}
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-emerald-900/40">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-400" />
              <span>Private Self-Pay</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{metrics.privateCount}</span>
              <span className="text-[11px] text-emerald-400/80">
                {metrics.total > 0 ? `${Math.round((metrics.privateCount / metrics.total) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* HMO */}
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-blue-900/40">
            <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 uppercase tracking-wider block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>HMO Insurance</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-sky-300">{metrics.hmoCount}</span>
              <span className="text-[11px] text-sky-400/80">
                {metrics.total > 0 ? `${Math.round((metrics.hmoCount / metrics.total) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Checked-In */}
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-teal-900/40">
            <span className="text-[10px] sm:text-[11px] font-bold text-teal-300 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400" />
              <span>Checked In / Queue</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-teal-300">{metrics.checkedInCount}</span>
              <span className="text-[11px] text-teal-400/80">
                {metrics.total > 0 ? `${Math.round((metrics.checkedInCount / metrics.total) * 100)}% arrived` : '0%'}
              </span>
            </div>
          </div>

          {/* Active Clinics */}
          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-slate-700/60">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#38BDF8]" />
              <span>Active Clinics</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">{metrics.clinicsCount}</span>
              <span className="text-[11px] text-slate-400">Specialties</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchBookings(false)}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ---------------- FILTER & SEARCH TOOLBAR ---------------- */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#0085D0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search patient name, phone, ticket reference (e.g. ISL-10294), HMO code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0085D0]/20 focus:border-[#0085D0] transition-all font-medium placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode & Count */}
          <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">
              Showing <strong className="text-slate-900 font-extrabold">{filteredBookings.length}</strong> of {bookings.length}
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#0085D0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#0085D0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Queue Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          {/* Specialty Clinic Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Specialty Clinic:
            </label>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-[#0085D0] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Specialty Clinics</option>
              {departments.map((dept) => (
                <option key={dept.id} value={String(dept.id)}>
                  {dept.name} Clinic
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Consulting Specialist:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-[#0085D0] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Specialists</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={String(doc.id)}>
                  {getDoctorInitialName(doc)} ({doc.department?.name || doc.specialty || 'Specialist'})
                </option>
              ))}
            </select>
          </div>

          {/* Billing Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Billing Category:
            </label>
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-[#0085D0] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Billing (Private & HMO)</option>
              <option value="Private Self-Pay">Private Self-Pay ({metrics.privateCount})</option>
              <option value="HMO Insurance">HMO Insurance ({metrics.hmoCount})</option>
            </select>
          </div>

          {/* Clinical Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
              Clinical Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-[#0085D0] cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Clinical Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ---------------- LOADING STATE ---------------- */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#0085D0] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Loading today&apos;s clinic consultations...</h3>
          <p className="text-xs text-slate-500">Syncing outpatient appointments and specialist clinic schedules.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        /* ---------------- EMPTY STATE ---------------- */
        <div className="p-12 sm:p-16 rounded-3xl bg-white border-2 border-dashed border-slate-200 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#f0f9ff] border border-[#bae6fd] text-[#0085D0] flex items-center justify-center mx-auto shadow-xs">
            <CalendarClock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              {searchQuery || selectedClinicId !== 'ALL' || selectedDoctorId !== 'ALL' || selectedPaymentType !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No Consultations Match Your Filter'
                : `No Consultations Booked for ${formattedDateTitle}`}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedClinicId !== 'ALL' || selectedDoctorId !== 'ALL' || selectedPaymentType !== 'ALL'
                ? 'Try clearing your search query or broadening the selected clinic/doctor filters.'
                : 'Patients can book specialist appointments online anytime from the booking portal.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(searchQuery || selectedClinicId !== 'ALL' || selectedDoctorId !== 'ALL' || selectedPaymentType !== 'ALL' || selectedStatus !== 'ALL') ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClinicId('ALL');
                  setSelectedDoctorId('ALL');
                  setSelectedPaymentType('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            ) : null}

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0085D0] hover:bg-[#006bac] text-white text-xs font-black shadow-md shadow-[#0085D0]/20 transition-all active:scale-95"
            >
              <span>Book New Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* ---------------- CARDS VIEW ---------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((bk, idx) => {
            const docName = getDoctorInitialName(bk.doctor || bk.doctor_name);
            const clinicName = bk.doctor_specialty || bk.department?.name || 'Specialist Consultation';
            const isCheckedIn = ['Checked In', 'In Consultation', 'Completed'].includes(bk.status);

            return (
              <div
                key={bk.id}
                className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#0085D0] border-l-[6px] border-l-[#0085D0] p-5 shadow-sm hover:shadow-xl hover:shadow-[#0085D0]/10 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Top Bar with Queue # and Ticket */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(bk.reference_code)}
                      className="inline-flex items-center gap-1 text-xs font-mono font-black text-slate-800 hover:text-[#0085D0] bg-slate-50 hover:bg-[#f0f9ff] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#bae6fd] transition-colors cursor-pointer"
                      title="Click to copy ticket code"
                    >
                      <span>{bk.reference_code}</span>
                      {copiedCode === bk.reference_code ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                      isCheckedIn
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : bk.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {bk.status || 'Confirmed'}
                  </span>
                </div>

                {/* Patient Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-slate-900 truncate">
                      {bk.patient_name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{bk.patient_phone}</span>
                    {bk.patient_email && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{bk.patient_email}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Clinic & Doctor Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-[11px] shadow-2xs">
                      {getClinicBadgeIcon(clinicName)}
                      <span>{clinicName}</span>
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono font-bold">
                      <Clock className="w-3 h-3 text-[#0085D0]" />
                      <span>{bk.time || bk.appointment_time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-7 h-7 rounded-full bg-[#f0f9ff] text-[#0085D0] border border-[#bae6fd] flex items-center justify-center font-black text-xs shrink-0">
                      {docName.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {docName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Consulting Specialist
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing Channel Badge */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Billing Channel:</span>
                  {bk.payment_type === 'HMO Insurance' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>{bk.hmo_name ? `${bk.hmo_name}` : 'HMO Insurance'}</span>
                      {bk.hmo_policy_code && (
                        <span className="font-mono text-[10px] text-blue-700 font-semibold">({bk.hmo_policy_code})</span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      <span>Private Self-Pay</span>
                    </span>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Check In Action */}
                  {!isCheckedIn ? (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(bk.id)}
                      disabled={checkingInId === bk.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Mark patient as checked in at outpatient triage"
                    >
                      {checkingInId === bk.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Check In</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      <span>In Queue</span>
                    </span>
                  )}

                  {/* WhatsApp, Reschedule & Slip Buttons */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={getWhatsAppShareUrl(bk)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                      title="Share consultation ticket via WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setRescheduleTargetBooking(bk)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      title="Reschedule appointment"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => printElement('printable-today-manifest', `Ticket ${bk.reference_code}`)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
                      title="Print appointment voucher"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ---------------- QUEUE TABLE VIEW ---------------- */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Ticket Ref</th>
                  <th className="py-3 px-4">Patient Particulars</th>
                  <th className="py-3 px-4">Specialty Clinic</th>
                  <th className="py-3 px-4">Specialist Doctor</th>
                  <th className="py-3 px-4">Shift Time</th>
                  <th className="py-3 px-4">Billing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBookings.map((bk, idx) => {
                  const docName = getDoctorInitialName(bk.doctor || bk.doctor_name);
                  const clinicName = bk.doctor_specialty || bk.department?.name || 'Specialist Consultation';
                  const isCheckedIn = ['Checked In', 'In Consultation', 'Completed'].includes(bk.status);

                  return (
                    <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(bk.reference_code)}
                          className="inline-flex items-center gap-1 hover:text-[#0085D0] cursor-pointer"
                          title="Copy code"
                        >
                          <span>{bk.reference_code}</span>
                          {copiedCode === bk.reference_code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900">{bk.patient_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{bk.patient_phone}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800">
                          {getClinicBadgeIcon(clinicName)}
                          <span>{clinicName}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {docName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {bk.time || bk.appointment_time}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {bk.payment_type === 'HMO Insurance' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-black uppercase">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>{bk.hmo_name || 'HMO'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase">
                            <CreditCard className="w-3 h-3 text-emerald-600" />
                            <span>Private</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isCheckedIn
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {bk.status || 'Confirmed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {!isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => handleCheckIn(bk.id)}
                              disabled={checkingInId === bk.id}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                            >
                              {checkingInId === bk.id ? 'Checking In...' : 'Check In'}
                            </button>
                          )}

                          <a
                            href={getWhatsAppShareUrl(bk)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                            title="Share to WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => setRescheduleTargetBooking(bk)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                            title="Reschedule"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- PRINTABLE TODAY MANIFEST (HIDDEN ON SCREEN, USED BY PRINT ELEMENT) ---------------- */}
      <div id="printable-today-manifest" className="hidden p-8 bg-white text-slate-900 space-y-6">
        {/* Hospital Header */}
        <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
          <div className="flex justify-center mb-2">
            <IsaluLogo variant="full" size="lg" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
            Outpatient Consultations Daily Manifest
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • Tel: +234 800 47258 2273 • Emergency Desk: +234 1 295 6789
          </p>
          <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-200">
            <span>Clinic Consultation Date: <strong>{formattedDateTitle}</strong></span>
            <span>Total Patients Booked: <strong>{filteredBookings.length}</strong></span>
            <span>Manifest Printed: <strong>{new Date().toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Manifest Table */}
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[10px]">
              <th className="border border-slate-300 p-2 text-center w-8">#</th>
              <th className="border border-slate-300 p-2">Ticket Ref</th>
              <th className="border border-slate-300 p-2">Patient Full Name</th>
              <th className="border border-slate-300 p-2">Phone Number</th>
              <th className="border border-slate-300 p-2">Specialty Clinic</th>
              <th className="border border-slate-300 p-2">Consultant Doctor</th>
              <th className="border border-slate-300 p-2">Shift Window</th>
              <th className="border border-slate-300 p-2">Billing Details</th>
              <th className="border border-slate-300 p-2 text-center">Status</th>
              <th className="border border-slate-300 p-2 text-center">Triage Checked</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((bk, i) => (
              <tr key={bk.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-2 text-center font-bold font-mono">{i + 1}</td>
                <td className="border border-slate-300 p-2 font-mono font-black">{bk.reference_code}</td>
                <td className="border border-slate-300 p-2 font-bold">{bk.patient_name}</td>
                <td className="border border-slate-300 p-2 font-mono">{bk.patient_phone}</td>
                <td className="border border-slate-300 p-2">{bk.doctor_specialty || bk.department?.name || 'OPD'}</td>
                <td className="border border-slate-300 p-2 font-medium">{getDoctorInitialName(bk.doctor || bk.doctor_name)}</td>
                <td className="border border-slate-300 p-2 font-mono">{bk.time || bk.appointment_time}</td>
                <td className="border border-slate-300 p-2">
                  {bk.payment_type === 'HMO Insurance' 
                    ? `HMO: ${bk.hmo_name || 'Enrollee'} (${bk.hmo_policy_code || 'N/A'})` 
                    : 'Private Self-Pay'}
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold">{bk.status || 'Confirmed'}</td>
                <td className="border border-slate-300 p-2 text-center text-slate-300">[  ]</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Signature */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold">Nursing Triage Supervisor Signature</div>
            <p className="text-[10px] text-slate-500">Triage Assessment & Vital Signs Validation</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold">Clinical Records / Front Desk Officer</div>
            <p className="text-[10px] text-slate-500">Outpatient Queue Clearance & Handover</p>
          </div>
        </div>
      </div>

      {/* ---------------- RESCHEDULE MODAL INTEGRATION ---------------- */}
      {rescheduleTargetBooking && (
        <RescheduleModal
          booking={rescheduleTargetBooking}
          isOpen={Boolean(rescheduleTargetBooking)}
          onClose={() => setRescheduleTargetBooking(null)}
          onRescheduled={(updatedBooking) => {
            setBookings((prev) =>
              prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
            );
            setRescheduleTargetBooking(null);
            if (onRefreshDashboard) onRefreshDashboard();
          }}
        />
      )}
    </div>
  );
}
