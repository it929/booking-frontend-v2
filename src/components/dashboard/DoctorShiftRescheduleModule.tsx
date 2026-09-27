// src/components/dashboard/DoctorShiftRescheduleModule.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Send,
  Check,
  Copy,
  ArrowRight,
  CalendarClock,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronDown,
  UserCheck,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { getBookings, getDoctors, getDepartments, bulkRescheduleDoctorSession } from '@/lib/api';
import { Booking, Doctor, Department, StaffUser, getDoctorInitialName, formatDoctorName, isHmoBooking, isPrivateBooking } from '@/lib/types';
import { printElement } from '@/lib/printUtils';
import IsaluLogo from '@/components/IsaluLogo';

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.574 1.815.88 2.791.88 3.181 0 5.767-2.586 5.767-5.766.001-3.18-2.585-5.766-5.767-5.766zm3.393 8.303c-.149.421-.736.78-1.02.83-.284.05-.62.062-1.895-.469-1.629-.678-2.678-2.339-2.759-2.449-.081-.11-.655-.873-.655-1.664 0-.791.413-1.18.561-1.341.149-.161.326-.201.435-.201.109 0 .218.001.312.006.101.005.237-.038.37.283.149.362.508 1.239.552 1.33.044.091.074.198.015.318-.059.12-.089.198-.178.301-.089.103-.187.23-.267.31-.089.088-.182.184-.078.362.103.178.461.761.99 1.232.682.608 1.258.796 1.436.885.178.089.282.078.386-.041.104-.119.444-.517.563-.695.118-.178.237-.149.397-.089.16.06 1.011.477 1.185.564.174.087.291.13.333.201.042.071.042.411-.107.832z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.176L2 22l4.982-1.309C8.423 21.536 10.147 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.67 0-3.235-.487-4.558-1.325l-.326-.208-2.969.779.792-2.894-.225-.357A8.14 8.14 0 0 1 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.512 0 8.182 3.67 8.182 8.182 0 4.512-3.67 8.182-8.182 8.182z" />
    </svg>
  );
}

type ContactStatus = 'Pending' | 'Called' | 'WhatsApp Sent' | 'Confirmed';

interface DoctorShiftRescheduleModuleProps {
  currentUser?: StaffUser | null;
  departments?: Department[];
  doctors?: Doctor[];
  onRefreshDashboard?: () => void;
}

export default function DoctorShiftRescheduleModule({
  currentUser,
  departments: propDepartments,
  doctors: propDoctors,
  onRefreshDashboard,
}: DoctorShiftRescheduleModuleProps) {
  // Today's date string YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Doctors & reference data
  const [doctors, setDoctors] = useState<Doctor[]>(propDoctors || []);
  const [departments, setDepartments] = useState<Department[]>(propDepartments || []);

  // Step 1: Selection states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [sourceDate, setSourceDate] = useState<string>(todayDateStr);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [sourceBookings, setSourceBookings] = useState<Booking[]>([]);

  // Step 2: Selected patients for migration
  const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);

  // Step 3: Target date & reschedule config
  const [targetDate, setTargetDate] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('Emergency Surgical Theatre Call');
  const [customReasonNote, setCustomReasonNote] = useState<string>('');
  const [keepSameTime, setKeepSameTime] = useState<boolean>(true);
  const [customNewTime, setCustomNewTime] = useState<string>('');

  // Processing state
  const [processingShift, setProcessingShift] = useState<boolean>(false);
  const [shiftSuccessMessage, setShiftSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [migratedBookings, setMigratedBookings] = useState<Booking[]>([]);

  // Notification contact status tracker: key = booking_id
  const [contactLog, setContactLog] = useState<Record<number, ContactStatus>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load doctors if not passed
  useEffect(() => {
    if (!propDoctors || propDoctors.length === 0) {
      getDoctors(undefined, true).then((docs) => setDoctors(docs || [])).catch(() => {});
    }
    if (!propDepartments || propDepartments.length === 0) {
      getDepartments().then((deps) => setDepartments(deps || [])).catch(() => {});
    }
  }, [propDoctors, propDepartments]);

  // Find currently selected doctor object
  const selectedDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return doctors.find((d) => String(d.id) === selectedDoctorId || d.code === selectedDoctorId) || null;
  }, [selectedDoctorId, doctors]);

  // Fetch bookings for the chosen doctor & source date
  const loadDoctorSessionBookings = useCallback(async () => {
    if (!selectedDoctorId || !sourceDate) return;
    try {
      setLoadingBookings(true);
      setErrorMessage(null);
      setShiftSuccessMessage(null);

      const data = await getBookings({
        doctor_id: selectedDoctorId,
        date: sourceDate,
      });

      // Filter active non-terminal bookings
      const active = (data || []).filter(
        (b) => b.is_active && b.status !== 'Completed' && b.status !== 'Cancelled'
      );
      setSourceBookings(active);
      setSelectedBookingIds(active.map((b) => b.id));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to query patient consultations for this date.');
      setSourceBookings([]);
      setSelectedBookingIds([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedDoctorId, sourceDate]);

  useEffect(() => {
    if (selectedDoctorId && sourceDate) {
      loadDoctorSessionBookings();
    } else {
      setSourceBookings([]);
      setSelectedBookingIds([]);
    }
  }, [selectedDoctorId, sourceDate, loadDoctorSessionBookings]);

  // Toggle patient selection
  const handleToggleSelectBooking = (id: number) => {
    setSelectedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookingIds.length === sourceBookings.length) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(sourceBookings.map((b) => b.id));
    }
  };

  // Helper for WhatsApp Notice generation
  const generateWhatsAppNotice = (bk: Booking, docName: string, clinicName: string, newDate: string, oldDate: string) => {
    const timeSlot = bk.time || bk.appointment_time || 'Regular Clinic Window';
    const reasonText = customReasonNote.trim() ? `${reasonCategory} (${customReasonNote.trim()})` : reasonCategory;

    const message = `*ISALU HOSPITALS - IMPORTANT CLINICAL RESCHEDULE NOTICE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dear *${bk.patient_name}*,

Please be informed that your upcoming specialist consultation with *${docName}* (${clinicName}) has been shifted due to:
*${reasonText}*.

🎟️ *Ticket Reference:* ${bk.reference_code}
❌ *Previous Date:* ${oldDate}
✅ *NEW APPOINTMENT DATE:* ${newDate}
⏰ *Consultation Window:* ${timeSlot}
🏥 *Location:* Isalu Hospitals, No. 46, Ijaiye Road, Ogba, Ikeja, Lagos
📞 *Reception Desk:* +234 800 47258 2273

🔗 *View Updated Slip Online:*
${typeof window !== 'undefined' ? window.location.origin : ''}/check-status?ref=${encodeURIComponent(bk.reference_code)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We sincerely apologize for any inconvenience caused to your personal schedule. Please reply to this message or call our help desk if you need further adjustments.`;

    const phoneDigits = (bk.patient_phone || '').replace(/\+/g, '').replace(/\s+/g, '');
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  };

  // Generate SMS text for clipboard
  const getSmsText = (bk: Booking, docName: string, newDate: string) => {
    return `ISALU HOSPITALS NOTICE: Dear ${bk.patient_name}, your consultation with ${docName} is rescheduled to ${newDate} at ${bk.time || bk.appointment_time}. Ticket: ${bk.reference_code}. Helpdesk: 0800472582273.`;
  };

  // Update contact status
  const updateContactStatus = (bookingId: number, status: ContactStatus) => {
    setContactLog((prev) => ({
      ...prev,
      [bookingId]: status,
    }));
  };

  // Copy helper
  const handleCopyText = async (text: string, ref: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedCode(ref);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  // Execute bulk migration
  const handleExecuteBulkShift = async () => {
    if (!selectedDoctorId || !sourceDate || !targetDate) {
      setErrorMessage('Please select doctor, original date, and new target clinic date.');
      return;
    }

    if (sourceDate === targetDate) {
      setErrorMessage('The new target date must be different from the original clinic date.');
      return;
    }

    if (selectedBookingIds.length === 0) {
      setErrorMessage('Please select at least one patient booking to reschedule.');
      return;
    }

    const fullReason = customReasonNote.trim()
      ? `${reasonCategory}: ${customReasonNote.trim()}`
      : reasonCategory;

    try {
      setProcessingShift(true);
      setErrorMessage(null);
      setShiftSuccessMessage(null);

      const res = await bulkRescheduleDoctorSession({
        doctor_id: selectedDoctorId,
        source_date: sourceDate,
        target_date: targetDate,
        reason: fullReason,
        booking_ids: selectedBookingIds,
        keep_same_time: keepSameTime,
        new_time: customNewTime || undefined,
      });

      setShiftSuccessMessage(res.message);
      setMigratedBookings(res.updated_bookings || []);

      // Initialize contact status
      const initialLogs: Record<number, ContactStatus> = {};
      (res.updated_bookings || []).forEach((b) => {
        initialLogs[b.id] = 'Pending';
      });
      setContactLog(initialLogs);

      // Refresh list
      loadDoctorSessionBookings();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to shift specialist clinic session.');
    } finally {
      setProcessingShift(false);
    }
  };

  // Metrics
  const activeBookingsToDisplay = migratedBookings.length > 0 ? migratedBookings : sourceBookings;
  const contactedCount = Object.values(contactLog).filter((s) => s === 'Confirmed' || s === 'Called' || s === 'WhatsApp Sent').length;
  const confirmedCount = Object.values(contactLog).filter((s) => s === 'Confirmed').length;

  return (
    <div className="space-y-6">
      {/* ---------------- MODULE HEADER ---------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-teal-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-wider mb-2">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Specialist Call-In & Date Shift Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Specialist Clinic Shift & Patient Notification Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              When a consultant or specialist doctor cannot attend their scheduled clinic date, shift all booked patient appointments to their new available date in one atomic action and immediately dispatch WhatsApp & telephone notifications.
            </p>
          </div>

          {activeBookingsToDisplay.length > 0 && (
            <button
              type="button"
              onClick={() =>
                printElement(
                  'printable-doctor-shift-manifest',
                  `Isalu Hospitals - Emergency Clinic Reschedule Manifest (${selectedDoctor?.name || 'Specialist'})`,
                  { fullWidth: true, landscape: true, margin: '6mm 8mm' }
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Print Handover Briefing</span>
            </button>
          )}
        </div>

        {/* Notifications and Alerts */}
        {shiftSuccessMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="font-semibold">{shiftSuccessMessage} Scroll down to dispatch patient notices.</div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="font-semibold">{errorMessage}</div>
          </div>
        )}
      </div>

      {/* ---------------- 3-STEP SETUP GRID ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Step 1: Doctor & Original Date */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
              1
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Select Specialist & Postponed Date
            </h2>
          </div>

          {/* Doctor Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Consulting Specialist Doctor:
            </label>
            <div className="relative">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none appearance-none cursor-pointer"
              >
                <option value="">-- Choose Specialist Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDoctorName(d.name || d.full_name || 'Consultant')}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
            {selectedDoctor && (
              <p className="text-[10px] text-teal-700 font-bold mt-1">
                Specialty: {selectedDoctor.specialty || selectedDoctor.department?.name || 'Consultant'} • Suite: {selectedDoctor.department?.location || 'Consulting Suite'}
              </p>
            )}
          </div>

          {/* Source Date Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Affected Clinic Date (Postponed Session):
            </label>
            <input
              type="date"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none cursor-pointer"
            />
          </div>

          {/* Session Overview Stats */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Patients Booked on Date:</span>
            <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
              {loadingBookings ? 'Checking...' : `${sourceBookings.length} Patients`}
            </span>
          </div>
        </div>

        {/* Step 2: New Target Date & Shift Parameters */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
              2
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Choose New Clinic Date & Time
            </h2>
          </div>

          {/* Target Date Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              New Target Consultation Date:
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={todayDateStr}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none cursor-pointer"
            />
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400">Quick:</span>
            {[1, 2, 3, 7].map((days) => {
              const d = new Date();
              d.setDate(d.getDate() + days);
              const dateStr = d.toISOString().split('T')[0];
              const label = days === 1 ? 'Tomorrow' : `+${days}d`;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTargetDate(dateStr)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    targetDate === dateStr
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Time Slot Option */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Shift Window Handling:
            </label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  checked={keepSameTime}
                  onChange={() => setKeepSameTime(true)}
                  className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Keep each patient&apos;s original shift time</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  checked={!keepSameTime}
                  onChange={() => setKeepSameTime(false)}
                  className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Set specific new consultation window</span>
              </label>
            </div>
            {!keepSameTime && (
              <input
                type="text"
                value={customNewTime}
                onChange={(e) => setCustomNewTime(e.target.value)}
                placeholder="e.g. 09:00 AM - 01:00 PM"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 mt-1"
              />
            )}
          </div>
        </div>

        {/* Step 3: Reason & Confirmation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
              3
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Reason & Bulk Execution
            </h2>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Official Postponement Reason:
            </label>
            <div className="relative">
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none appearance-none cursor-pointer"
              >
                <option value="Emergency Surgical Theatre Call">Emergency Surgical Theatre Call</option>
                <option value="Doctor Emergency Clinical Leave">Doctor Emergency Clinical Leave</option>
                <option value="Specialist Academic / Conference Travel">Specialist Academic / Conference Travel</option>
                <option value="Doctor Unavoidable Travel Delay">Doctor Unavoidable Travel Delay</option>
                <option value="Clinic Session Rescheduled by Specialist">Clinic Session Rescheduled by Specialist</option>
                <option value="Hospital Clinical Directive">Hospital Clinical Directive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Additional Details / Remarks (Optional):
            </label>
            <input
              type="text"
              value={customReasonNote}
              onChange={(e) => setCustomReasonNote(e.target.value)}
              placeholder="e.g. Dr called at 8:30am, shifted to Wed morning"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleExecuteBulkShift}
              disabled={
                processingShift ||
                sourceBookings.length === 0 ||
                selectedBookingIds.length === 0 ||
                !targetDate ||
                sourceDate === targetDate
              }
              className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs shadow-md shadow-teal-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {processingShift ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Session Migration...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    Shift {selectedBookingIds.length} Appointment{selectedBookingIds.length !== 1 ? 's' : ''} to {targetDate || 'New Date'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- STEP 4: PATIENT NOTIFICATION & COMMUNICATION BOARD ---------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Board Topbar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {migratedBookings.length > 0 ? 'Patient Communication & Notification Dispatch Desk' : 'Affected Patients on Postponed Date'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                {activeBookingsToDisplay.length} Patient{activeBookingsToDisplay.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {migratedBookings.length > 0
                ? 'Directly dispatch personalized WhatsApp notices, place telephone calls, and track acknowledgment status.'
                : 'Preview patients scheduled with this consultant. Select patients to include in the date shift.'}
            </p>
          </div>

          {/* Contact Verification Summary Progress */}
          {activeBookingsToDisplay.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shrink-0 shadow-2xs">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Notification Progress
                </span>
                <span className="text-xs font-black text-slate-800">
                  {contactedCount} of {activeBookingsToDisplay.length} Contacted ({confirmedCount} Confirmed)
                </span>
              </div>
              <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${activeBookingsToDisplay.length > 0 ? (contactedCount / activeBookingsToDisplay.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={sourceBookings.length > 0 && selectedBookingIds.length === sourceBookings.length}
                    onChange={handleSelectAll}
                    className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    title="Select all patients"
                  />
                </th>
                <th className="px-4 py-3.5">Ticket Ref</th>
                <th className="px-4 py-3.5">Patient Details</th>
                <th className="px-4 py-3.5">Phone & Contact</th>
                <th className="px-4 py-3.5">Shift Window</th>
                <th className="px-4 py-3.5">Billing</th>
                <th className="px-4 py-3.5">Contact Status</th>
                <th className="px-4 py-3.5 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeBookingsToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">
                      {selectedDoctorId
                        ? `No active bookings found for this specialist on ${sourceDate}`
                        : 'Select a specialist doctor above to preview affected patients.'}
                    </p>
                    <p className="text-[11px] mt-1">
                      Consultation appointments already completed or cancelled will not be affected.
                    </p>
                  </td>
                </tr>
              ) : (
                activeBookingsToDisplay.map((bk) => {
                  const isSelected = selectedBookingIds.includes(bk.id);
                  const docName = formatDoctorName(bk.doctor_name || selectedDoctor?.name || 'Consultant Specialist');
                  const clinicName = bk.doctor_specialty || bk.department?.name || selectedDoctor?.specialty || 'OPD Clinic';
                  const newDateStr: string = targetDate || (bk.appointment_date ? bk.appointment_date.slice(0, 10) : '') || bk.date || sourceDate || '';
                  const currentStatus = contactLog[bk.id] || 'Pending';

                  const whatsappUrl = generateWhatsAppNotice(
                    bk,
                    docName,
                    clinicName,
                    newDateStr,
                    sourceDate
                  );
                  const smsText = getSmsText(bk, docName, newDateStr);

                  return (
                    <tr
                      key={bk.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-teal-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectBooking(bk.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {bk.reference_code}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{bk.patient_name}</div>
                        <div className="text-[11px] text-slate-500">{bk.patient_email || 'No email registered'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${bk.patient_phone}`}
                            className="font-mono font-bold text-slate-900 hover:text-teal-700 inline-flex items-center gap-1 underline decoration-slate-300"
                            title="Direct call"
                          >
                            <Phone className="w-3 h-3 text-teal-600" />
                            <span>{bk.patient_phone}</span>
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">{bk.time || bk.appointment_time}</div>
                        <div className="text-[10px] text-slate-400">
                          {bk.appointment_date ? bk.appointment_date.slice(0, 10) : sourceDate}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isHmoBooking(bk) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                            <ShieldCheck className="w-3 h-3 text-sky-600" />
                            <span>{bk.hmo_name || 'HMO Enrollee'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <CreditCard className="w-3 h-3 text-emerald-600" />
                            <span>Private Self-Pay</span>
                          </span>
                        )}
                      </td>

                      {/* Contact Status Tracker Pill */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="relative inline-flex items-center">
                          <select
                            value={currentStatus}
                            onChange={(e) => updateContactStatus(bk.id, e.target.value as ContactStatus)}
                            className={`pl-2.5 pr-6 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer appearance-none ${
                              currentStatus === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : currentStatus === 'WhatsApp Sent'
                                ? 'bg-teal-100 text-teal-900 border-teal-300'
                                : currentStatus === 'Called'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Called">📞 Called & Informed</option>
                            <option value="WhatsApp Sent">💬 WhatsApp Sent</option>
                            <option value="Confirmed">✅ Patient Confirmed</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-2 pointer-events-none text-slate-500" />
                        </div>
                      </td>

                      {/* 1-Click WhatsApp & Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 1-Click WhatsApp Button */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => updateContactStatus(bk.id, 'WhatsApp Sent')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-transform active:scale-95 cursor-pointer"
                            title="Send personalized reschedule letter via WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Copy SMS Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyText(smsText, bk.reference_code)}
                            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Copy SMS notification text"
                          >
                            {copiedCode === bk.reference_code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Call Button */}
                          <a
                            href={`tel:${bk.patient_phone}`}
                            onClick={() => updateContactStatus(bk.id, 'Called')}
                            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Place telephone call"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- PRINTABLE BRIEFING MANIFEST (FOR CLINICAL HANDOVER) ---------------- */}
      <div id="printable-doctor-shift-manifest" className="hidden p-6 bg-white text-slate-900 space-y-4">
        {/* Hospital Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1.5">
          <div className="flex justify-center mb-2">
            <IsaluLogo variant="full" size="lg" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[11px] tracking-widest uppercase">
            Specialist Clinic Postponement & Emergency Reschedule Manifest
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
            Clinical Handover & Patient Notification Record
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • Tel: +234 800 47258 2273 • Emergency Desk: +234 1 295 6789
          </p>
          <div className="pt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold border-t border-slate-200 text-slate-700 text-left">
            <div>Consulting Specialist: <strong className="text-slate-900 block">{formatDoctorName(selectedDoctor?.name || 'Consultant')}</strong></div>
            <div>Original Clinic Date: <strong className="text-rose-700 block line-through">{sourceDate}</strong></div>
            <div>NEW Clinic Target Date: <strong className="text-emerald-700 block">{targetDate || 'Rescheduled'}</strong></div>
            <div>Postponement Reason: <strong className="text-slate-900 block">{reasonCategory}</strong></div>
          </div>
        </div>

        {/* Table of Shifted Patients */}
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[10px] tracking-wider">
              <th className="border border-slate-300 p-2 text-center w-8">#</th>
              <th className="border border-slate-300 p-2 whitespace-nowrap">Ticket Ref</th>
              <th className="border border-slate-300 p-2">Patient Full Name</th>
              <th className="border border-slate-300 p-2 whitespace-nowrap">Phone Number</th>
              <th className="border border-slate-300 p-2 whitespace-nowrap">Consultation Time</th>
              <th className="border border-slate-300 p-2">Billing Details</th>
              <th className="border border-slate-300 p-2 text-center whitespace-nowrap">Notification Status</th>
            </tr>
          </thead>
          <tbody>
            {activeBookingsToDisplay.map((bk, i) => (
              <tr key={bk.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                <td className="border border-slate-300 p-2 text-center font-bold font-mono">{i + 1}</td>
                <td className="border border-slate-300 p-2 font-mono font-black">{bk.reference_code}</td>
                <td className="border border-slate-300 p-2 font-bold text-slate-900">{bk.patient_name}</td>
                <td className="border border-slate-300 p-2 font-mono">{bk.patient_phone}</td>
                <td className="border border-slate-300 p-2 font-mono">{bk.time || bk.appointment_time}</td>
                <td className="border border-slate-300 p-2">
                  {isHmoBooking(bk) ? `HMO (${bk.hmo_name || 'Enrollee'})` : 'Private Self-Pay'}
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold text-[10px]">
                  {contactLog[bk.id] || 'Pending Call'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-xs print-footer-signatures">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">Clinic Coordinator / Duty Officer</div>
            <p className="text-[10px] text-slate-500">Roster Migration Authorization</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">Front Desk / Patient Relations</div>
            <p className="text-[10px] text-slate-500">Patient Telephone & Notice Certification</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">Medical Director / Endorsement</div>
            <p className="text-[10px] text-slate-500">Clinical Governance & Schedule Sign-Off</p>
          </div>
        </div>
      </div>
    </div>
  );
}
