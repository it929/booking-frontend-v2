// src/components/RescheduleModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Booking, Doctor, AvailabilityResult, getDoctorInitialName } from '@/lib/types';
import { checkDoctorAvailability, getDoctor, rescheduleBooking } from '@/lib/api';
import SpecialistDatePicker from '@/components/SpecialistDatePicker';
import IsaluLogo from '@/components/IsaluLogo';
import { printElement } from '@/lib/printUtils';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Printer
} from 'lucide-react';

interface RescheduleModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onRescheduled: (updatedBooking: Booking) => void;
}

const COMMON_REASONS = [
  'Work / Official Conflict',
  'Travel / Out of Town',
  'Health / Symptoms Changed',
  'Family Emergency',
  'Doctor Consultation Advice',
];

export default function RescheduleModal({
  booking,
  isOpen,
  onClose,
  onRescheduled,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(booking?.doctor || null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [rescheduledBooking, setRescheduledBooking] = useState<Booking | null>(null);

  // Today string for min date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Track previous open state and booking ID to only reset on initial open or different booking
  const prevIsOpenRef = useRef(false);
  const prevBookingIdRef = useRef<number | null>(null);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const bookingChanged = booking?.id !== prevBookingIdRef.current;

    if (isOpen && booking && (justOpened || bookingChanged)) {
      setSelectedDate('');
      setReason('');
      setAvailability(null);
      setError(null);
      setRescheduledBooking(null);
      if (booking.doctor) {
        setDoctor(booking.doctor);
      }
    }

    prevIsOpenRef.current = isOpen;
    prevBookingIdRef.current = booking?.id ?? null;
  }, [isOpen, booking?.id]);

  // Fetch full doctor info to ensure up-to-date active schedule duty days
  useEffect(() => {
    if (!isOpen || !booking?.doctor_id) return;

    let isMounted = true;
    setLoadingDoctor(true);

    getDoctor(booking.doctor_id)
      .then((doc) => {
        if (isMounted && doc) {
          setDoctor(doc);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch doctor schedule details for reschedule modal:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDoctor(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, booking?.doctor_id]);

  // Check availability when a new date is selected
  useEffect(() => {
    if (!booking?.doctor_id || !selectedDate) {
      setAvailability(null);
      return;
    }

    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setCheckingAvailability(true);
        setError(null);
        const res = await checkDoctorAvailability(booking.doctor_id, selectedDate);
        if (isMounted) {
          setAvailability(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Could not verify doctor availability for this date.');
          }
          setAvailability(null);
        }
      } finally {
        if (isMounted) setCheckingAvailability(false);
      }
    };

    fetchAvailability();
    return () => {
      isMounted = false;
    };
  }, [booking?.doctor_id, selectedDate]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    if (!rescheduledBooking) return;
    printElement(
      'printable-reschedule-ticket',
      `Isalu Hospitals - Rescheduled Appointment Ticket (${rescheduledBooking.reference_code})`
    );
  };

  const handleClose = () => {
    setRescheduledBooking(null);
    onClose();
  };

  const currentDateDisplay = booking.date || booking.appointment_date || 'Current Date';
  const currentTimeDisplay = booking.time || booking.appointment_time || 'Current Time';
  const currentBookingDate = (booking.date || booking.appointment_date || '').split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Please select a new appointment date.');
      return;
    }
    if (currentBookingDate && selectedDate === currentBookingDate) {
      setError('You cannot reschedule to your current appointment date. Please choose a different date.');
      return;
    }
    if (!availability?.is_available || availability.remaining_slots <= 0) {
      setError('Doctor is not available or clinic capacity is reached on the chosen date.');
      return;
    }

    const scheduledTime =
      availability?.formatted_shift ||
      doctor?.formatted_shift ||
      doctor?.shift_time ||
      booking.appointment_time ||
      booking.time ||
      'Standard Consultation';

    try {
      setSubmitting(true);
      setError(null);
      const res = await rescheduleBooking(booking.id, {
        date: selectedDate,
        time: scheduledTime,
        reason: reason.trim() || undefined,
      });

      setRescheduledBooking(res.booking);
      onRescheduled(res.booking);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reschedule appointment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const availableDays = doctor?.available_days || booking?.doctor?.available_days || [];
  const fullyBookedDates = doctor?.fully_booked_dates || booking?.doctor?.fully_booked_dates || [];
  const closedDates = doctor?.closed_dates || booking?.doctor?.closed_dates || [];
  const doctorInitialName = getDoctorInitialName(doctor || booking.doctor || booking.doctor_name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg sm:max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                rescheduledBooking
                  ? 'bg-emerald-100/80 border border-emerald-200 text-emerald-700'
                  : 'bg-teal-100/70 border border-teal-200 text-teal-700'
              }`}
            >
              {rescheduledBooking ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <CalendarClock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                {rescheduledBooking ? 'Consultation Rescheduled' : 'Reschedule Consultation'}
              </h2>
              <p className="text-xs text-slate-500">
                Ticket: <strong className="font-mono text-slate-800">{booking.reference_code}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: Printable Voucher on Success OR Reschedule Form */}
        {rescheduledBooking ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Success Notification Alert */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully rescheduled to{' '}
                    <strong className="text-emerald-950 font-bold">
                      {rescheduledBooking.date || rescheduledBooking.appointment_date}
                    </strong>{' '}
                    at{' '}
                    <strong className="text-emerald-950 font-bold">
                      {rescheduledBooking.time || rescheduledBooking.appointment_time}
                    </strong>
                    .
                  </span>
                </div>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                  Confirmed
                </span>
              </div>

              {/* Printable Official Voucher Card */}
              <div
                id="printable-reschedule-ticket"
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
                      {rescheduledBooking.reference_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Clinical Status</span>
                    <span className="font-mono font-bold text-teal-700 text-sm">
                      {rescheduledBooking.status || 'Confirmed'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Date & Time</span>
                    <span className="font-medium text-slate-700">
                      {rescheduledBooking.date || rescheduledBooking.appointment_date} at {rescheduledBooking.time || rescheduledBooking.appointment_time}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Channel</span>
                    <span className="font-medium text-slate-700">
                      {rescheduledBooking.payment_type || booking.payment_type || 'Private Self-Pay'}
                      {(rescheduledBooking.hmo_name || booking.hmo_name) && (rescheduledBooking.hmo_name || booking.hmo_name) !== 'N/A' && ` (${rescheduledBooking.hmo_name || booking.hmo_name})`}
                    </span>
                  </div>
                </div>

                {/* Patient & Specialist Particulars */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Patient Full Name:</span>
                    <span className="font-bold text-slate-900">{rescheduledBooking.patient_name || booking.patient_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Phone Contact:</span>
                    <span className="font-mono font-medium text-slate-700">{rescheduledBooking.patient_phone || booking.patient_phone}</span>
                  </div>
                  {(rescheduledBooking.patient_email || booking.patient_email) && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Email Address:</span>
                      <span className="text-slate-700 font-medium">{rescheduledBooking.patient_email || booking.patient_email}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Consulting Specialist:</span>
                    <span className="font-semibold text-slate-900 tracking-wide">
                      {getDoctorInitialName(doctor || rescheduledBooking.doctor || rescheduledBooking.doctor_name || booking.doctor || booking.doctor_name)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Specialty Clinic Unit:</span>
                    <span className="font-medium text-teal-700">
                      {rescheduledBooking.doctor_specialty || rescheduledBooking.department?.name || doctor?.specialty || booking.doctor_specialty || booking.department?.name || 'Specialist Consultation'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Billing Category:</span>
                    <span className="font-bold text-slate-900">{rescheduledBooking.payment_type || booking.payment_type || 'Private Self-Pay'}</span>
                  </div>
                  {(rescheduledBooking.hmo_policy_code || (rescheduledBooking as any).hmo_number || booking.hmo_policy_code || (booking as any).hmo_number) && (
                    <div className="flex justify-between py-2 border-b border-slate-100 bg-teal-50/60 px-2 rounded-lg">
                      <span className="text-teal-800 font-semibold">HMO Enrollee ID:</span>
                      <span className="font-mono font-bold text-teal-900">
                        {rescheduledBooking.hmo_policy_code || (rescheduledBooking as any).hmo_number || booking.hmo_policy_code || (booking as any).hmo_number}
                      </span>
                    </div>
                  )}
                </div>

                {/* Intake & Clinic Clearance Status Box */}
                <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-900 block">Clinic Intake Status</span>
                    <span className="text-[11px] text-teal-700">
                      {(rescheduledBooking.payment_type || booking.payment_type) === 'HMO Insurance'
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
            </div>

            {/* Action Bar */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-teal-400" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        ) : (
          /* Scrollable Form Body */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-left flex-1">
          
          {/* Current Booking Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Confirmed Schedule
            </span>
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>{doctorInitialName}</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-5">
                  {booking.doctor_specialty || booking.department?.name || doctor?.specialty || 'Specialty Clinic'}
                </p>
              </div>

              <div className="text-right space-y-0.5 shrink-0">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{currentDateDisplay}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {currentTimeDisplay}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <span>Patient: <strong className="text-slate-800">{booking.patient_name}</strong></span>
              <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                {booking.payment_type}
              </span>
            </div>
          </div>

          {/* Section 1: Choose New Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>1. Select New Date</span>
                <span className="text-red-500">*</span>
              </label>
              {checkingAvailability && (
                <span className="text-[11px] text-teal-600 font-normal flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verifying capacity...
                </span>
              )}
            </div>

            {loadingDoctor && availableDays.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                <span>Loading specialist duty schedule...</span>
              </div>
            ) : (
              <SpecialistDatePicker
                availableDays={availableDays}
                selectedDate={selectedDate}
                onSelectDate={(dateStr: string) => {
                  setSelectedDate(dateStr);
                }}
                doctorName={doctorInitialName}
                fullyBookedDates={fullyBookedDates}
                closedDates={closedDates}
                currentAppointmentDate={currentBookingDate}
              />
            )}

            {!loadingDoctor && availableDays.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  No active clinic duty schedules were found for this consultant. Please contact clinic reception.
                </p>
              </div>
            )}

            {/* Doctor On-Duty & Capacity Feedback */}
            {selectedDate && availability && !checkingAvailability && (
              <div className="mt-2">
                {availability.is_booking_closed ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Booking Closed for Today
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        Cut-off Reached
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium">
                      {availability.closed_reason || "Online bookings close 10 minutes prior to clinic commencement. Please select a future date."}
                    </p>
                  </div>
                ) : availability.is_available && availability.remaining_slots > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Doctor On Duty ({availability.day_of_week})
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {availability.remaining_slots} slots open
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Clinic Shift: <strong className="text-emerald-900">{availability.formatted_shift}</strong> • Daily Capacity: {availability.daily_capacity} patients</span>
                    </p>
                  </div>
                ) : availability.on_duty && availability.remaining_slots <= 0 ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Fully Booked for {selectedDate}</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        All {availability.daily_capacity} slots are taken. Please pick another date.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Doctor Not On Duty ({availability.day_of_week})</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        The consultant is not scheduled for outpatient clinics on {availability.day_of_week}s. Please choose another day.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Reason for Reschedule */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              2. Reason for Rescheduling <span className="text-slate-400 font-normal">(Optional)</span>
            </label>

            {/* Quick Reason Pills */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    reason === r
                      ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Provide any additional details or notes for the clinic records..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Keep Current Schedule
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedDate ||
                selectedDate === currentBookingDate ||
                !availability?.is_available ||
                availability?.is_booking_closed ||
                availability?.remaining_slots <= 0
              }
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rescheduling...</span>
                </>
              ) : (
                <>
                  <span>Confirm Reschedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
