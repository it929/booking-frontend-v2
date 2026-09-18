// src/lib/api.ts

import {
  AnalyticsSummary,
  AvailabilityResult,
  Booking,
  Department,
  Doctor,
  DoctorSchedule,
  HmoCompany,
  Role,
  StaffUser,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000/api';

const TOKEN_KEY = 'isalu_staff_token';
const USER_KEY = 'isalu_staff_user';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: StaffUser): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  // Clean up any stale localStorage tokens so old sessions never leak across windows or browsers
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export function getStoredUser(): StaffUser | null {
  if (typeof window === 'undefined') return null;
  // Check sessionStorage first for strict session isolation
  const raw = sessionStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  // Clear any old, stale localStorage ghost sessions left over from previous tests
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
  return null;
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.detail || data?.error || data?.message || `HTTP ${res.status} Error`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('An unexpected network error occurred');
  }
}

const memoryCache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data as T;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`isalu_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.expiry > Date.now()) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function setCached(key: string, data: unknown, ttlMs = 60000): void {
  const entry = { data, expiry: Date.now() + ttlMs };
  memoryCache.set(key, entry);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`isalu_cache_${key}`, JSON.stringify(entry));
    } catch {
      // ignore
    }
  }
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('isalu_cache_')) sessionStorage.removeItem(k);
        });
      } catch {}
    }
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith(`isalu_cache_${prefix}`)) sessionStorage.removeItem(k);
        });
      } catch {}
    }
  }
}

// ---------------- Public & Clinic Data ----------------
export async function getDepartments(): Promise<Department[]> {
  const cached = getCached<Department[]>('departments');
  if (cached) return cached;
  const data = await request<Department[]>('/departments');
  setCached('departments', data, 60000);
  return data;
}

export async function getDoctors(
  params?: { department_id?: number; search?: string },
  forceFresh = false
): Promise<Doctor[]> {
  const query = new URLSearchParams();
  if (params?.department_id) query.append('department_id', String(params.department_id));
  if (params?.search) query.append('search', params.search);
  const qs = query.toString();
  const cacheKey = `doctors:${qs}`;
  if (!forceFresh) {
    const cached = getCached<Doctor[]>(cacheKey);
    if (cached) return cached;
  }
  const data = await request<Doctor[]>(`/doctors${qs ? `?${qs}` : ''}`);
  setCached(cacheKey, data, 10000);
  return data;
}

export async function getDoctor(id: number | string): Promise<Doctor> {
  return request<Doctor>(`/doctors/${id}`);
}

export async function createDoctor(payload: Partial<Doctor> & {
  duty_days?: string[];
  day_configs?: Array<{ day: string; base_day?: string; start_time?: string; end_time?: string; shift_time?: string; capacity?: number; recurrence_type?: string | null; recurrence_weeks?: number[] | null }>;
  shift_time?: string;
  capacity?: number;
}): Promise<Doctor> {
  invalidateCache('doctors');
  return request<Doctor>('/doctors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDoctor(id: number | string, payload: Partial<Doctor> & {
  duty_days?: string[];
  day_configs?: Array<{ day: string; base_day?: string; start_time?: string; end_time?: string; shift_time?: string; capacity?: number; recurrence_type?: string | null; recurrence_weeks?: number[] | null }>;
  shift_time?: string;
  capacity?: number;
}): Promise<Doctor> {
  invalidateCache('doctors');
  return request<Doctor>(`/doctors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDoctor(id: number | string): Promise<{ message: string }> {
  invalidateCache('doctors');
  return request<{ message: string }>(`/doctors/${id}`, {
    method: 'DELETE',
  });
}

export async function createDepartment(payload: Partial<Department>): Promise<Department> {
  return request<Department>('/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDepartment(id: number | string, payload: Partial<Department>): Promise<Department> {
  return request<Department>(`/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDepartment(id: number | string): Promise<{ message: string }> {
  return request<{ message: string }>(`/departments/${id}`, {
    method: 'DELETE',
  });
}

export async function getSchedules(): Promise<DoctorSchedule[]> {
  return request<DoctorSchedule[]>('/schedules');
}

export async function createSchedule(payload: {
  doctor_id: number | string;
  day_of_week?: string;
  duty_days?: string[];
  shift_time?: string;
  start_time?: string;
  end_time?: string;
  capacity?: number;
  slot_duration_minutes?: number;
  status?: boolean;
}): Promise<DoctorSchedule> {
  return request<DoctorSchedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSchedule(id: number | string, payload: Partial<DoctorSchedule>): Promise<DoctorSchedule> {
  return request<DoctorSchedule>(`/schedules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSchedule(id: number | string): Promise<{ message: string }> {
  return request<{ message: string }>(`/schedules/${id}`, {
    method: 'DELETE',
  });
}

export async function getHmoCompanies(): Promise<HmoCompany[]> {
  return request<HmoCompany[]>('/hmo-companies');
}

export async function createHmoCompany(payload: Partial<HmoCompany>): Promise<HmoCompany> {
  return request<HmoCompany>('/hmo-companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHmoCompany(id: number | string, payload: Partial<HmoCompany>): Promise<HmoCompany> {
  return request<HmoCompany>(`/hmo-companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteHmoCompany(id: number | string): Promise<{ message: string }> {
  return request<{ message: string }>(`/hmo-companies/${id}`, {
    method: 'DELETE',
  });
}

// ---------------- Bookings Flow ----------------
export async function createBooking(payload: {
  doctor_id: number | string;
  date: string;
  time: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  reason?: string;
  payment_type: string;
  hmo_id?: number | string;
  hmo_name?: string;
  hmo_policy_code?: string;
  referral_doc_name?: string;
  referral_doc_data?: string;
}): Promise<Booking> {
  const res = await request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  invalidateCache('doctors');
  return res;
}

export async function lookupBooking(refCode: string, phone?: string): Promise<Booking> {
  const query = new URLSearchParams({ ref_code: refCode });
  if (phone) query.append('phone', phone);
  return request<Booking>(`/bookings/lookup?${query.toString()}`);
}

export async function checkDoctorAvailability(doctorId: number | string, date: string): Promise<AvailabilityResult> {
  return request<AvailabilityResult>(`/bookings/availability?doctor_id=${doctorId}&date=${date}`);
}

export async function getBookings(filters?: {
  date?: string;
  status?: string;
  payment_status?: string;
  payment_type?: string;
  patient_type?: 'Private' | 'HMO' | string;
  hmo_status?: string;
  search?: string;
}): Promise<Booking[]> {
  const query = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
  }
  const qs = query.toString();
  return request<Booking[]>(`/bookings${qs ? `?${qs}` : ''}`);
}

export async function checkInBooking(id: number | string): Promise<{ message: string; booking: Booking }> {
  return request<{ message: string; booking: Booking }>(`/bookings/${id}/check-in`, {
    method: 'PATCH',
  });
}

export async function approveHmoBooking(
  id: number | string,
  authCode: string
): Promise<{ message: string; booking: Booking }> {
  return request<{ message: string; booking: Booking }>(`/bookings/${id}/approve-hmo`, {
    method: 'PATCH',
    body: JSON.stringify({ auth_code: authCode }),
  });
}

export async function payCashdeskBooking(
  id: number | string,
  payload?: { amount?: number; payment_method?: string }
): Promise<{ message: string; invoice_ref: string; booking: Booking }> {
  return request<{ message: string; invoice_ref: string; booking: Booking }>(`/bookings/${id}/pay-cashdesk`, {
    method: 'PATCH',
    body: JSON.stringify(payload || {}),
  });
}

export async function rerouteToCashdesk(id: number | string): Promise<{ message: string; booking: Booking }> {
  return request<{ message: string; booking: Booking }>(`/bookings/${id}/reroute-to-cashdesk`, {
    method: 'PATCH',
  });
}

export async function rescheduleBooking(
  id: number | string,
  payload: {
    date: string;
    time: string;
    reason?: string;
  }
): Promise<{ message: string; booking: Booking }> {
  const res = await request<{ message: string; booking: Booking }>(`/bookings/${id}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  invalidateCache('doctors');
  return res;
}

export async function cancelBooking(id: number | string, reason?: string): Promise<{ message: string }> {
  const res = await request<{ message: string }>(`/bookings/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
  invalidateCache('doctors');
  return res;
}

export async function updateBookingStatus(
  id: number | string,
  status: string,
  note?: string
): Promise<{ message: string; booking: Booking }> {
  const res = await request<{ message: string; booking: Booking }>(`/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
  invalidateCache('doctors');
  return res;
}

// ---------------- Staff Auth ----------------
export async function loginStaff(credentials: {
  email: string;
  password: string;
}): Promise<{ token: string; user: StaffUser }> {
  const res = await request<{ token: string; user: StaffUser }>('/auth/staff-login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setAuthSession(res.token, res.user);
  return res;
}

export async function getStaffProfile(): Promise<{ user: StaffUser }> {
  return request<{ user: StaffUser }>('/auth/me');
}

// ---------------- Analytics & Intelligence ----------------
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>('/analytics/summary');
}

export async function generateAiReport(): Promise<{ report: string; title: string; generated_at: string }> {
  return request<{ report: string; title: string; generated_at: string }>('/analytics/ai-report', {
    method: 'POST',
  });
}

// ---------------- Staff & Admin Management ----------------
export async function getRoles(): Promise<Role[]> {
  return request<Role[]>('/roles');
}

export async function createRole(role: {
  name: string;
  slug?: string;
  description?: string;
  primary_desk: string;
  allowed_desks?: string[];
  assigned_modules?: string[];
  status?: boolean;
}): Promise<Role> {
  return request<Role>('/roles', {
    method: 'POST',
    body: JSON.stringify(role),
  });
}

export async function updateRole(
  id: number | string,
  role: {
    name?: string;
    slug?: string;
    description?: string;
    primary_desk?: string;
    allowed_desks?: string[];
    assigned_modules?: string[];
    status?: boolean;
  }
): Promise<Role> {
  return request<Role>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(role),
  });
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  return request<StaffUser[]>('/users');
}

export async function createStaffUser(user: Partial<StaffUser> & { password: string }): Promise<StaffUser> {
  return request<StaffUser>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateStaffUser(
  id: number | string,
  user: Partial<StaffUser> & { password?: string }
): Promise<StaffUser> {
  return request<StaffUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(user),
  });
}

export async function getAppSettings(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>('/settings');
}

export async function saveAppSetting(key: string, value: unknown): Promise<unknown> {
  return request('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}
