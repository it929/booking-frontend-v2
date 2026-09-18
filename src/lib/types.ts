// src/lib/types.ts

export interface ClinicScheduleItem {
  day: string;
  shift_time: string;
  capacity?: number;
  doctors_count?: number;
}

export interface Department {
  id: number;
  code: string;
  dept_id?: string;
  name: string;
  description?: string;
  icon_name: string;
  location: string;
  doctor_count?: number;
  clinic_schedules?: ClinicScheduleItem[];
  operating_days?: string[];
  operating_hours?: string;
  doctors?: Doctor[];
  status: boolean;
}

export interface DoctorSchedule {
  id: number;
  code: string;
  sched_id?: string;
  doctor_id: number;
  doctor_name?: string;
  specialty?: string;
  day_of_week?: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  duty_days?: string[] | string;
  recurrence_type?: string;
  recurrence_weeks?: number[];
  shift_time?: string;
  formatted_shift?: string;
  capacity: number;
  slot_duration_minutes?: number;
  generated_slots?: string[];
  total_weekly_capacity?: number;
  status: boolean;
}

export interface Doctor {
  id: number;
  code: string;
  doc_id?: string;
  department_id?: number;
  department?: Department;
  name: string;
  full_name?: string;
  surname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
  acronym?: string;
  specialty?: string;
  qualification?: string | null;
  qualifications?: string | null;
  bio?: string;
  image_url?: string;
  accepted_patient_types?: string[];
  accepts_private?: boolean;
  accepts_hmo?: boolean;
  billing_category_label?: string;
  consultation_fee: number;
  status: boolean;
  available_days?: string[];
  shift_time?: string;
  formatted_shift?: string;
  time_slots?: string[];
  daily_capacity?: number;
  schedules?: DoctorSchedule[];
  next_schedule?: DoctorNextSchedule | null;
  fully_booked_dates?: string[];
  closed_dates?: string[];
}

export interface DoctorNextSchedule {
  date: string;
  formatted_date: string;
  day_of_week: string;
  capacity: number;
  booked_count: number;
  remaining_slots: number;
  is_fully_booked: boolean;
  shift_time?: string;
}

export interface HmoCompany {
  id: number;
  code: string;
  hmo_id?: string;
  name: string;
  policy_code?: string;
  email: string;
  phone: string;
  contact_person: string;
  status: boolean;
}

export type PatientBillingCategory = 'All' | 'Private' | 'HMO';

export interface Patient {
  id: number;
  mrn: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  hmo_company_id?: number;
  hmo_policy_code?: string;
  patient_type?: 'Private' | 'HMO';
  is_hmo?: boolean;
  is_private?: boolean;
  hmo_name?: string;
}

export interface BookingStatusLog {
  id: number;
  booking_id: number;
  user_id?: number;
  from_status: string;
  to_status: string;
  note?: string;
  created_at: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  cashier_user_id?: number;
  invoice_number: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at?: string;
  notes?: string;
}

export type BookingStatus =
  | 'Confirmed'
  | 'Payment Approved'
  | 'HMO Approved'
  | 'Checked In'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Deleted'
  | string;

export type BillingType =
  | 'Private Self-Pay'
  | 'HMO Insurance'
  | 'Corporate'
  | string;

export type HmoAuthStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Declined'
  | 'Rerouted to Cashdesk'
  | string;

export type PaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Covered by HMO'
  | 'Waived'
  | 'Refunded'
  | string;

export interface Booking {
  id: number;
  reference_code: string;
  ref_code?: string;
  patient_id?: number;
  patient?: Patient;
  doctor_id: number;
  doctor?: Doctor;
  doctor_name?: string;
  doctor_specialty?: string;
  department_id?: number;
  department?: Department;
  hmo_company_id?: number;
  hmo_company?: HmoCompany;
  hmo_name?: string;
  appointment_date: string;
  date?: string;
  appointment_time: string;
  time?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  reason?: string;
  payment_type: BillingType;
  billing_classification?: string;
  hmo_policy_code?: string;
  hmo_auth_code?: string;
  hmo_status: HmoAuthStatus | null;
  referral_doc_name?: string;
  referral_doc_data?: string;
  referral_doc_text?: string;
  payment_status: PaymentStatus;
  payment_method: string;
  invoice_ref?: string;
  status: BookingStatus;
  is_active: boolean;
  delete_reason?: string;
  checked_in_at?: string;
  completed_at?: string;
  created_at: string;
  status_logs?: BookingStatusLog[];
  payments?: Payment[];
  patient_type?: 'Private' | 'HMO';
  is_hmo?: boolean;
  is_private?: boolean;
}

// Canonical patient category helpers
export function isHmoBooking(b: Partial<Booking> | null | undefined): boolean {
  if (!b) return false;
  if (b.patient_type === 'HMO' || b.is_hmo === true) return true;
  if (b.hmo_company_id != null) return true;
  return Boolean(b.payment_type && /hmo/i.test(b.payment_type));
}

export function isPrivateBooking(b: Partial<Booking> | null | undefined): boolean {
  return !isHmoBooking(b);
}

export function getPatientCategory(b: Partial<Booking> | null | undefined): 'Private' | 'HMO' {
  return isHmoBooking(b) ? 'HMO' : 'Private';
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  primary_desk: string;
  allowed_desks?: string[];
  assigned_modules?: string[];
  is_system_role: boolean;
  status: boolean;
}

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  desk: string;
  role: string;
  role_id?: number;
  role_data?: Role;
  allowed_desks?: string[];
  assigned_modules?: string[];
  is_superuser?: boolean;
  is_staff?: boolean;
  status?: boolean;
}

export interface AnalyticsSummary {
  total_bookings: number;
  today_bookings: number;
  checked_in_today: number;
  pending_hmo_approvals: number;
  pending_cashdesk_invoices: number;
  total_revenue: number;
  today_revenue: number;
  departments_breakdown: { name: string; count: number }[];
  patient_type_breakdown: { hmo: number; self_pay: number };
  timestamp: string;
}

export interface AvailabilityResult {
  doctor_id: number;
  doctor_code: string;
  doctor_name: string;
  date: string;
  day_of_week: string;
  on_duty: boolean;
  daily_capacity: number;
  booked_count: number;
  remaining_slots: number;
  is_available: boolean;
  is_fully_booked?: boolean;
  is_booking_closed?: boolean;
  closed_reason?: string;
  formatted_shift?: string;
  time_slots: string[];
  slots?: string[];
  room: string;
}

/**
 * Computes doctor's initials from their name.
 * e.g., "Olaoye Afeez BabaTunde" -> "OAB"
 * "Dr. Olaoye Afeez BabaTunde" -> "OAB"
 */
export function getDoctorInitials(docOrName?: Doctor | string | null): string {
  if (!docOrName) return 'DOC';

  let rawName = '';
  if (typeof docOrName === 'string') {
    rawName = docOrName;
  } else {
    // If the doctor has an explicit acronym configured, prioritize it ONLY if it is a valid initials acronym
    // (1-5 alphabetical characters, no spaces, no title like Dr./Mr./Miss, and not a full name)
    if (docOrName.acronym && docOrName.acronym.trim()) {
      const candidate = docOrName.acronym.trim();
      const titlePrefixRegex = /^(dr|doctor|prof|mr|mrs|ms|miss)\.?/i;
      const isCleanInitials = 
        !/\s/.test(candidate) && 
        !titlePrefixRegex.test(candidate) && 
        candidate.length >= 1 && 
        candidate.length <= 5 && 
        /^[a-zA-Z]+$/.test(candidate);

      if (isCleanInitials) {
        return candidate.toUpperCase();
      }
    }

    // If the doctor has surname, middlename, or lastname fields, use them directly (excluding any salutations)
    const titleRegex = /^(dr|doctor|prof|professor|mr|mrs|ms|miss|nurse|pharm)\.?$/i;
    if (docOrName.surname || docOrName.middlename || docOrName.lastname) {
      const parts = [docOrName.surname, docOrName.middlename, docOrName.lastname]
        .filter(Boolean)
        .map((p) => String(p).trim())
        .filter((p) => p.length > 0 && /[a-zA-Z]/.test(p) && !titleRegex.test(p));

      if (parts.length > 0) {
        return parts
          .map((part) => {
            const match = part.match(/[a-zA-Z]/);
            return match ? match[0].toUpperCase() : '';
          })
          .join('');
      }
    }
    rawName = docOrName.full_name || docOrName.name || '';
  }

  // Strip common titles (e.g. Dr., Prof., Doctor, Mr., Mrs., Miss, etc.)
  const cleanName = rawName
    .replace(/\b(dr|doctor|prof|professor|mr|mrs|ms|miss|nurse|pharm)\.?\b/gi, '')
    .trim();

  const parts = cleanName
    .split(/[\s\-_.]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && /[a-zA-Z]/.test(p));

  if (parts.length === 0) {
    const rawParts = rawName
      .split(/[\s\-_.]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && /[a-zA-Z]/.test(p));

    if (rawParts.length > 0) {
      return rawParts
        .map((part) => {
          const match = part.match(/[a-zA-Z]/);
          return match ? match[0].toUpperCase() : '';
        })
        .join('');
    }
    return 'DOC';
  }

  // Exactly 1 initial letter per name part:
  // - 1 name: Akeredolu -> "A" (shows "Dr. A")
  // - 2 names: Akeredolu Abass -> "AA" (shows "Dr. AA")
  // - 3 names: Akeredolu Abass Kola -> "AAK" (shows "Dr. AAK")
  return parts
    .map((part) => {
      const match = part.match(/[a-zA-Z]/);
      return match ? match[0].toUpperCase() : '';
    })
    .join('');
}

/**
 * Formats a doctor's initial name with "Dr." prefix for patient-facing booking views.
 * e.g., "Olaoye Afeez BabaTunde" -> "Dr. OAB"
 * "Dr. Adeolu" -> "Dr. A"
 */
export function getDoctorInitialName(docOrName?: Doctor | string | null): string {
  const inits = getDoctorInitials(docOrName);
  const cleanInits = inits.replace(/^DR\.?\s*/i, '').trim();
  return `Dr. ${cleanInits || 'DOC'}`;
}


/**
 * Splits a doctor's full name and title into surname, middlename, and lastname according to hospital rules:
 * - 3 names (e.g. "Olaoye Afeez Babatunde" or "Dr. Olaoye Afeez Babatunde"):
 *     surname: "Olaoye", middlename: "Afeez", lastname: "Babatunde"
 * - 2 names (e.g. "Olaoye Afeez"):
 *     surname: "Olaoye", middlename: "Afeez", lastname: null
 * - 1 name (e.g. "Olaoye"):
 *     surname: "Olaoye", middlename: null, lastname: null
 */
export function splitDoctorFullName(fullName?: string | null): {
  surname: string | null;
  middlename: string | null;
  lastname: string | null;
} {
  if (!fullName) {
    return { surname: null, middlename: null, lastname: null };
  }

  const clean = fullName
    .replace(/\b(dr|doctor|prof|professor|mr|mrs|ms|nurse|pharm)\.?\b/gi, '')
    .trim();

  let parts = clean
    .split(/[\s\-_.]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && /[a-zA-Z]/.test(p));

  if (parts.length === 0) {
    parts = fullName
      .split(/[\s\-_.]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && /[a-zA-Z]/.test(p));
  }

  if (parts.length === 0) {
    return { surname: null, middlename: null, lastname: null };
  }
  if (parts.length === 1) {
    return { surname: parts[0], middlename: null, lastname: null };
  }
  if (parts.length === 2) {
    return { surname: parts[0], middlename: parts[1], lastname: null };
  }
  return {
    surname: parts[0],
    middlename: parts[1],
    lastname: parts.slice(2).join(' '),
  };
}

/**
 * Formats a doctor's name ensuring the "Dr." prefix is present.
 * e.g., "Olaoye Afeez Babatunde" -> "Dr. Olaoye Afeez Babatunde"
 * "Dr. Olaoye Afeez Babatunde" -> "Dr. Olaoye Afeez Babatunde"
 */
export function formatDoctorName(docOrName?: Doctor | string | null): string {
  if (!docOrName) return 'Dr.';
  let name = '';
  if (typeof docOrName === 'string') {
    name = docOrName.trim();
  } else {
    name = (docOrName.full_name || docOrName.name || '').trim();
    if (!name && (docOrName.surname || docOrName.middlename || docOrName.lastname)) {
      name = [docOrName.surname, docOrName.middlename, docOrName.lastname].filter(Boolean).join(' ');
    }
  }
  if (!name) return 'Dr.';

  // If already starts with Dr. or Dr (case-insensitive)
  if (/^dr\.?\s*/i.test(name)) {
    return name.replace(/^dr\.?\s*/i, 'Dr. ');
  }
  // If starts with Mr./Mrs./Miss/Ms. replace with Dr.
  if (/^(mr|mrs|miss|ms)\.?\s+/i.test(name)) {
    return name.replace(/^(mr|mrs|miss|ms)\.?\s+/i, 'Dr. ');
  }
  return `Dr. ${name}`;
}

/**
 * Categorizes a doctor's accepted patient billing types into readable badge data.
 * - Both selected: "HMO & Private"
 * - Private only: "Private Only"
 * - HMO only: "HMO Only"
 */
export function getDoctorBillingCategory(
  doctorOrTypes?: Doctor | string[] | null,
  paramPrivate?: boolean,
  paramHmo?: boolean
): {
  label: string;
  badgeClass: string;
  hasPrivate: boolean;
  hasHmo: boolean;
} {
  let hasPrivate = true;
  let hasHmo = true;

  if (doctorOrTypes && typeof doctorOrTypes === 'object' && !Array.isArray(doctorOrTypes)) {
    const doc = doctorOrTypes as Doctor;
    if (doc.accepts_private !== undefined || doc.accepts_hmo !== undefined) {
      hasPrivate = doc.accepts_private !== undefined ? Boolean(doc.accepts_private) : true;
      hasHmo = doc.accepts_hmo !== undefined ? Boolean(doc.accepts_hmo) : true;
    } else if (doc.accepted_patient_types && doc.accepted_patient_types.length > 0) {
      hasPrivate = doc.accepted_patient_types.some((t) => /private|self-pay/i.test(t));
      hasHmo = doc.accepted_patient_types.some((t) => /hmo/i.test(t));
    }
  } else if (Array.isArray(doctorOrTypes)) {
    if (paramPrivate !== undefined || paramHmo !== undefined) {
      hasPrivate = paramPrivate !== undefined ? Boolean(paramPrivate) : true;
      hasHmo = paramHmo !== undefined ? Boolean(paramHmo) : true;
    } else if (doctorOrTypes.length > 0) {
      hasPrivate = doctorOrTypes.some((t) => /private|self-pay/i.test(t));
      hasHmo = doctorOrTypes.some((t) => /hmo/i.test(t));
    }
  } else if (paramPrivate !== undefined || paramHmo !== undefined) {
    hasPrivate = paramPrivate !== undefined ? Boolean(paramPrivate) : true;
    hasHmo = paramHmo !== undefined ? Boolean(paramHmo) : true;
  }

  // Safety fallback: if neither evaluated to true, default to both
  if (!hasPrivate && !hasHmo) {
    hasPrivate = true;
    hasHmo = true;
  }

  if (hasPrivate && hasHmo) {
    return {
      label: 'HMO & Private',
      badgeClass: 'text-teal-800 bg-teal-50 border border-teal-200',
      hasPrivate: true,
      hasHmo: true,
    };
  }

  if (hasHmo) {
    return {
      label: 'HMO Only',
      badgeClass: 'text-blue-800 bg-blue-50 border border-blue-200',
      hasPrivate: false,
      hasHmo: true,
    };
  }

  return {
    label: 'Private Only',
    badgeClass: 'text-amber-800 bg-amber-50 border border-amber-200',
    hasPrivate: true,
    hasHmo: false,
  };
}

export function getDoctorShiftTime(doc?: Doctor | null, targetDay?: string): string {
  if (!doc) return '08:00 AM – 02:00 PM';

  // 1. If targetDay is specified, match schedule for that day first
  if (targetDay && doc.schedules && doc.schedules.length > 0) {
    const targetLower = targetDay.toLowerCase().trim();
    const match = doc.schedules.find((s) => {
      if (!s.status) return false;
      const sDay = (s.day_of_week || '').toLowerCase();
      return targetLower.includes(sDay) || sDay.includes(targetLower);
    });
    if (match) {
      if (match.shift_time) return match.shift_time;
      if (match.formatted_shift) return match.formatted_shift;
    }
  }

  // 2. From doctor active schedules: if multiple days have distinct shifts, format cleanly
  if (doc.schedules && doc.schedules.length > 0) {
    const active = doc.schedules.filter((s) => s.status);
    const shiftsByDay: Array<{ day: string; shift: string }> = [];
    active.forEach((s) => {
      const shift = s.shift_time || s.formatted_shift;
      if (shift && s.day_of_week) {
        shiftsByDay.push({ day: s.day_of_week, shift });
      }
    });

    const uniqueShifts = Array.from(new Set(shiftsByDay.map((item) => item.shift)));
    if (uniqueShifts.length === 1) {
      return uniqueShifts[0];
    }
    if (uniqueShifts.length > 1) {
      return shiftsByDay.map((item) => `${item.day}: ${item.shift}`).join(' | ');
    }

    const firstActive = active[0] || doc.schedules[0];
    if (firstActive?.shift_time) return firstActive.shift_time;
    if (firstActive?.formatted_shift) return firstActive.formatted_shift;
  }

  // 3. From doctor direct shift_time / formatted_shift
  if (doc.shift_time) return doc.shift_time;
  if (doc.formatted_shift) return doc.formatted_shift;

  // 4. Fallback from discrete booking time_slots: span from first slot start to last slot end
  if (doc.time_slots && doc.time_slots.length > 0) {
    const first = doc.time_slots[0];
    const last = doc.time_slots[doc.time_slots.length - 1];
    const firstStart = first.split(/[-–—]/)[0]?.trim();
    const lastEnd = last.split(/[-–—]/)[1]?.trim();
    if (firstStart && lastEnd && firstStart !== lastEnd) {
      return `${firstStart} – ${lastEnd}`;
    }
    return first;
  }

  return '08:00 AM – 02:00 PM';
}




