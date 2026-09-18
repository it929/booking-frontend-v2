// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStoredUser,
  clearAuthSession,
  getBookings,
  checkInBooking,
  approveHmoBooking,
  payCashdeskBooking,
  rerouteToCashdesk,
  cancelBooking,
  updateBookingStatus,
  getAnalyticsSummary,
  generateAiReport,
  getDoctors,
  getDepartments,
  getHmoCompanies,
  getStaffUsers,
  getRoles,
  deleteDoctor,
  deleteDepartment,
} from '@/lib/api';
import {
  Booking,
  StaffUser,
  AnalyticsSummary,
  Doctor,
  Department,
  HmoCompany,
  Role,
  DoctorSchedule,
  PatientBillingCategory,
  isHmoBooking,
  isPrivateBooking,
  getPatientCategory,
  formatDoctorName,
  getDoctorBillingCategory,
} from '@/lib/types';
import DashboardSidebar, { SubmoduleId } from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import ReceiptModal from '@/components/dashboard/ReceiptModal';
import NewStaffModal from '@/components/dashboard/NewStaffModal';
import EditStaffModal from '@/components/dashboard/EditStaffModal';
import NewBookingModal from '@/components/dashboard/NewBookingModal';
import NewRoleModal from '@/components/dashboard/NewRoleModal';
import EditRoleModal from '@/components/dashboard/EditRoleModal';
import NewDoctorModal from '@/components/dashboard/NewDoctorModal';
import EditDoctorModal, { getDoctorDutyDaysDisplay } from '@/components/dashboard/EditDoctorModal';
import NewDepartmentModal from '@/components/dashboard/NewDepartmentModal';
import EditDepartmentModal from '@/components/dashboard/EditDepartmentModal';
import NewHmoModal from '@/components/dashboard/NewHmoModal';
import EditHmoModal from '@/components/dashboard/EditHmoModal';
import RescheduleModal from '@/components/RescheduleModal';
import IsaluLogo from '@/components/IsaluLogo';
import { printElement } from '@/lib/printUtils';
import {
  UserCheck,
  ShieldCheck,
  CreditCard,
  Tv,
  BarChart3,
  Settings,
  Users,
  Building2,
  Stethoscope,
  Calendar,
  CalendarClock,
  Sparkles,
  Receipt,
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  ChevronDown,
  Filter,
  DollarSign,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  Hospital,
  Maximize2,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Award,
  Lock,
  Trash2,
  Pencil,
} from 'lucide-react';

function getStaffInitials(name: string): string {
  if (!name) return 'S';
  const clean = name.replace(/^(Dr\.|Mrs\.|Mr\.|Miss|Ms\.|Prof\.|Dr|Mrs|Mr|Miss|Ms|Prof)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] || name[0]).toUpperCase();
}

function formatBookingDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const trimmed = dateStr.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  // Role Permissions
  const isMonitor = useMemo(() => {
    if (!currentUser) return false;
    const r = (currentUser.role || '').toLowerCase();
    const d = (currentUser.desk || '').toLowerCase();
    return r.includes('monitor') || d.includes('monitor');
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const r = (currentUser.role || '').toLowerCase();
    const d = (currentUser.desk || '').toLowerCase();
    return (
      currentUser.is_superuser === true ||
      r.includes('admin') ||
      r.includes('super') ||
      d.includes('admin') ||
      d.includes('all')
    );
  }, [currentUser]);

  const canCompleteVisits = isMonitor || isAdmin;

  // Active Submodule
  const [activeSubmodule, setActiveSubmodule] = useState<SubmoduleId>('triage-queue');

  // Sidebar Layout State
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Global Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('All');
  const [selectedHmoProvider, setSelectedHmoProvider] = useState<string>('All');
  const [patientCategoryFilter, setPatientCategoryFilter] = useState<PatientBillingCategory>('All');
  const [queueFilter, setQueueFilter] = useState<'Active' | 'All'>('Active');
  const [completedDateFilter, setCompletedDateFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');

  // Data Store
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hmoCompanies, setHmoCompanies] = useState<HmoCompany[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);

  // Featured / Quick-access Clinics for Filter Bar
  const featuredClinics = useMemo(() => {
    const defaults = ['Cardiology', 'Paediatrics / Child Health', 'Neurology'];
    const bookedClinics = bookings
      .map((b) => b.department?.name || b.doctor_specialty || b.doctor?.department?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set([...defaults, ...bookedClinics]));
  }, [bookings]);

  // Featured / Quick-access HMO Providers
  const featuredHmoProviders = useMemo(() => {
    const defaults = ['Hygeia HMO', 'Reliance HMO', 'AXA Mansard Health'];
    const bookedHmos = bookings
      .filter(isHmoBooking)
      .map((b) => b.hmo_name || b.hmo_company?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set([...defaults, ...bookedHmos]));
  }, [bookings]);

  // HMO matching helper
  const matchesHmoProvider = (b: Booking, targetHmo: string): boolean => {
    if (targetHmo === 'All') return true;
    const target = targetHmo.toLowerCase().trim();
    const name = (b.hmo_name || b.hmo_company?.name || '').toLowerCase();
    const code = (b.hmo_company?.code || b.hmo_policy_code || '').toLowerCase();

    const cleanTarget = target.replace(' hmo', '').replace(' health', '').trim();
    const cleanName = name.replace(' hmo', '').replace(' health', '').trim();

    return (
      name.includes(cleanTarget) ||
      cleanName.includes(cleanTarget) ||
      code.includes(cleanTarget)
    );
  };

  // AI & Reports
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Alerts
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals
  const [selectedBookingForHmo, setSelectedBookingForHmo] = useState<Booking | null>(null);
  const [bookingToReroute, setBookingToReroute] = useState<Booking | null>(null);
  const [authCodeInput, setAuthCodeInput] = useState('');

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('POS / Card');
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<Booking | null>(null);

  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<StaffUser | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRoleToEdit, setSelectedRoleToEdit] = useState<Role | null>(null);
  const [isNewDoctorOpen, setIsNewDoctorOpen] = useState(false);
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [selectedDoctorToEdit, setSelectedDoctorToEdit] = useState<Doctor | null>(null);
  const [isNewDeptOpen, setIsNewDeptOpen] = useState(false);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [selectedDeptToEdit, setSelectedDeptToEdit] = useState<Department | null>(null);
  const [isNewHmoOpen, setIsNewHmoOpen] = useState(false);
  const [isEditHmoOpen, setIsEditHmoOpen] = useState(false);
  const [selectedHmoToEdit, setSelectedHmoToEdit] = useState<HmoCompany | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<{ id: number; name: string; code?: string } | null>(null);
  const [isDeletingDept, setIsDeletingDept] = useState(false);
  const [specialistSearch, setSpecialistSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [hmoSearch, setHmoSearch] = useState('');
  const [hmoApprovalStatusFilter, setHmoApprovalStatusFilter] = useState<'All' | 'Pending' | 'Approved'>('All');
  const [financeStatusFilter, setFinanceStatusFilter] = useState<'All' | 'Pending' | 'Cleared'>('All');
  const [tvFullScreen, setTvFullScreen] = useState(false);

  // Auto-dismiss success alert after 30 seconds
  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => {
      setActionSuccess(null);
    }, 30000);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  // Auth & Initial load
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    // Pick sensible initial landing screen based on role's assigned_modules from database
    const assigned = user.assigned_modules || user.role_data?.assigned_modules;
    if (assigned && Array.isArray(assigned) && assigned.length > 0) {
      if (assigned.includes('finance-billing') && !assigned.includes('clinical-triage') && !assigned.includes('hmo-insurance')) {
        setActiveSubmodule('finance-invoices');
      } else if (assigned.includes('hmo-insurance') && !assigned.includes('clinical-triage')) {
        setActiveSubmodule('hmo-approvals');
      } else if (assigned.includes('executive-intelligence') && !assigned.includes('clinical-triage')) {
        setActiveSubmodule('analytics-kpis');
      } else if (assigned.includes('clinical-triage')) {
        const isMon = (user.role || '').toLowerCase().includes('monitor') || (user.desk || '').toLowerCase().includes('monitor');
        setActiveSubmodule(isMon ? 'triage-tv' : 'triage-queue');
      } else if (assigned.includes('finance-billing')) {
        setActiveSubmodule('finance-invoices');
      } else {
        setActiveSubmodule('triage-queue');
      }
    } else {
      // Fallback based on staff role & desk
      const roleLower = (user.role || '').toLowerCase();
      const deskLower = (user.desk || '').toLowerCase();

      if (
        roleLower.includes('cash') ||
        deskLower.includes('cash') ||
        roleLower.includes('billing') ||
        deskLower.includes('billing')
      ) {
        setActiveSubmodule('finance-invoices');
      } else if (roleLower.includes('hmo') || deskLower.includes('hmo')) {
        setActiveSubmodule('hmo-approvals');
      } else if (roleLower.includes('monitor') || deskLower.includes('monitor')) {
        setActiveSubmodule('triage-tv');
      } else if (roleLower.includes('analytics') || deskLower.includes('analytics')) {
        setActiveSubmodule('analytics-kpis');
      } else {
        setActiveSubmodule('triage-queue');
      }
    }

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 20000);
    return () => clearInterval(interval);
  }, []);

  // Guard against accessing unauthorized submodules based on role assigned_modules
  useEffect(() => {
    if (!currentUser) return;
    const roleLower = (currentUser.role || '').toLowerCase();
    const deskLower = (currentUser.desk || '').toLowerCase();
    const isSuper =
      currentUser.is_superuser === true ||
      roleLower.includes('admin') ||
      roleLower.includes('super') ||
      deskLower.includes('admin') ||
      deskLower.includes('all');

    if (isSuper) return;

    const assigned = currentUser.assigned_modules || currentUser.role_data?.assigned_modules;

    // Submodule to Module map
    const submoduleModuleMap: Record<string, string> = {
      'triage-queue': 'clinical-triage',
      'triage-completed': 'clinical-triage',
      'triage-tv': 'clinical-triage',
      'triage-walkin': 'clinical-triage',
      'hmo-approvals': 'hmo-insurance',
      'hmo-partners': 'hmo-insurance',
      'hmo-reroutes': 'hmo-insurance',
      'finance-invoices': 'finance-billing',
      'finance-receipts': 'finance-billing',
      'finance-summary': 'finance-billing',
      'registry-specialists': 'clinic-registry',
      'registry-departments': 'clinic-registry',
      'admin-staff': 'administration',
      'admin-roles': 'administration',
      'analytics-kpis': 'executive-intelligence',
      'analytics-ai': 'executive-intelligence',
      'settings-hospital': 'hospital-settings',
    };

    if (assigned && Array.isArray(assigned) && assigned.length > 0) {
      const currentModule = submoduleModuleMap[activeSubmodule];
      if (currentModule && !assigned.includes(currentModule)) {
        // Redirect to first allowed submodule
        if (assigned.includes('finance-billing')) {
          setActiveSubmodule('finance-invoices');
        } else if (assigned.includes('hmo-insurance')) {
          setActiveSubmodule('hmo-approvals');
        } else if (assigned.includes('clinical-triage')) {
          setActiveSubmodule('triage-queue');
        } else if (assigned.includes('executive-intelligence')) {
          setActiveSubmodule('analytics-kpis');
        } else if (assigned.includes('clinic-registry')) {
          setActiveSubmodule('registry-specialists');
        }
      }
      return;
    }

    // Fallback checks
    const isCashdesk =
      roleLower.includes('cash') ||
      deskLower.includes('cash') ||
      roleLower.includes('billing') ||
      deskLower.includes('billing');

    const isHmo =
      roleLower.includes('hmo') ||
      deskLower.includes('hmo');

    const isMonitor =
      roleLower.includes('monitor') ||
      deskLower.includes('monitor');

    const isAnalytics =
      roleLower.includes('analytics') ||
      deskLower.includes('analytics');

    // Restrict Cashdesk strictly to finance submodules
    if (isCashdesk && !activeSubmodule.startsWith('finance-')) {
      setActiveSubmodule('finance-invoices');
      return;
    }

    // Restrict HMO strictly to hmo submodules
    if (isHmo && !isCashdesk && !activeSubmodule.startsWith('hmo-')) {
      setActiveSubmodule('hmo-approvals');
      return;
    }

    // Restrict Monitor to triage submodules
    if (isMonitor && !activeSubmodule.startsWith('triage-')) {
      setActiveSubmodule('triage-tv');
      return;
    }

    // Restrict Analytics to analytics submodules
    if (isAnalytics && !activeSubmodule.startsWith('analytics-')) {
      setActiveSubmodule('analytics-kpis');
      return;
    }

    // Non-admins cannot access admin-* or settings-*
    if (activeSubmodule.startsWith('admin-') || activeSubmodule.startsWith('settings-')) {
      setActiveSubmodule('triage-queue');
      return;
    }
  }, [currentUser, activeSubmodule]);

  const fetchData = async (full = false) => {
    try {
      if (full) setLoadingBookings(true);
      if (full) {
        const [
          bookingsData,
          analyticsData,
          docsData,
          deptsData,
          hmosData,
          staffData,
          rolesData,
        ] = await Promise.all([
          getBookings(),
          getAnalyticsSummary().catch(() => null),
          getDoctors().catch(() => []),
          getDepartments().catch(() => []),
          getHmoCompanies().catch(() => []),
          getStaffUsers().catch(() => []),
          getRoles().catch(() => []),
        ]);

        setBookings(bookingsData);
        if (analyticsData) setAnalytics(analyticsData);
        setDoctors(docsData);
        setDepartments(deptsData);
        setHmoCompanies(hmosData);
        setStaffUsers(staffData);
        setRoles(rolesData);
      } else {
        const [bookingsData, analyticsData] = await Promise.all([
          getBookings(),
          getAnalyticsSummary().catch(() => null),
        ]);
        setBookings(bookingsData);
        if (analyticsData) setAnalytics(analyticsData);
      }
    } catch (err: unknown) {
      if (err instanceof Error && full) {
        setActionError(err.message);
      }
    } finally {
      if (full) setLoadingBookings(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  // Action handlers
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    try {
      setUpdatingStatusId(bookingId);
      setActionError(null);
      await updateBookingStatus(bookingId, newStatus);
      setActionSuccess(`Status updated to "${newStatus}"`);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    try {
      setActionError(null);
      const res = await checkInBooking(bookingId);
      setActionSuccess(`Patient checked in successfully: ${res.booking.patient_name}`);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  const handleCompleteBooking = async (bookingId: number) => {
    try {
      setUpdatingStatusId(bookingId);
      setActionError(null);
      await updateBookingStatus(
        bookingId,
        'Completed',
        'Patient consultation finished; visit marked complete by floor monitor'
      );
      setActionSuccess('Patient consultation marked as Completed successfully.');
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'Completed', completed_at: new Date().toISOString() }
            : b
        )
      );
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete visit');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handlePrintQueue = () => {
    printElement('printable-arrivals-manifest', `Isalu Hospitals - Arrivals Queue (${selectedClinic})`, {
      fullWidth: true,
      landscape: false,
      margin: '8mm 10mm',
    });
  };

  const handlePrintCompletedQueue = () => {
    printElement('printable-completed-manifest', `Isalu Hospitals - Completed Consultations Archive (${selectedClinic})`, {
      fullWidth: true,
      landscape: false,
      margin: '8mm 10mm',
    });
  };

  const handleApproveHmo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForHmo || !authCodeInput) return;
    try {
      setActionError(null);
      await approveHmoBooking(selectedBookingForHmo.id, authCodeInput);
      setActionSuccess(
        `Pre-Auth code granted for ${selectedBookingForHmo.patient_name} (${authCodeInput})`
      );
      setSelectedBookingForHmo(null);
      setAuthCodeInput('');
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'HMO approval failed');
    }
  };

  const handleConfirmRerouteToCashdesk = async () => {
    if (!bookingToReroute) return;
    try {
      setActionError(null);
      await rerouteToCashdesk(bookingToReroute.id);
      setActionSuccess(`Booking for ${bookingToReroute.patient_name} sent to Cashdesk for payment.`);
      setBookingToReroute(null);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to reroute booking to Cashdesk');
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;
    try {
      setActionError(null);
      await payCashdeskBooking(selectedBookingForPayment.id, {
        payment_method: paymentMethod,
      });
      setActionSuccess(`Patient "${selectedBookingForPayment.patient_name}" cleared for payment successfully.`);
      setSelectedBookingForPayment(null);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Payment clearance failed');
    }
  };

  const handleCancel = async (bookingId: number) => {
    const reason = prompt('Enter reason for cancellation:');
    if (!reason) return;
    try {
      setActionError(null);
      await cancelBooking(bookingId, reason);
      setActionSuccess('Booking cancelled.');
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  const handleGenerateAiReport = async () => {
    try {
      setLoadingAi(true);
      setActionError(null);
      const res = await generateAiReport();
      setAiReport(res.report);
      setActionSuccess('AI Executive Clinic Analysis synthesized successfully.');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'AI Report generation failed');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDeleteDoctor = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the specialist registry?`)) return;
    try {
      await deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      setActionSuccess(`Specialist "${name}" removed from registry.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete specialist';
      setActionError(message);
    }
  };

  const handleInitiateDeleteDepartment = (dept: { id: number; name: string; code?: string }) => {
    setDeptToDelete(dept);
  };

  const confirmDeleteDepartment = async () => {
    if (!deptToDelete) return;
    try {
      setIsDeletingDept(true);
      await deleteDepartment(deptToDelete.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deptToDelete.id));
      setActionSuccess(`Clinical department "${deptToDelete.name}" was deleted successfully.`);
      setDeptToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete department';
      setActionError(message);
    } finally {
      setIsDeletingDept(false);
    }
  };

  // Filtered Bookings memo
  const filteredBookings: Booking[] = useMemo(() => {
    const list = bookings.filter((b: Booking) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q
        ? b.reference_code.toLowerCase().includes(q) ||
          b.patient_name.toLowerCase().includes(q) ||
          b.patient_phone.includes(q) ||
          (b.doctor_name && b.doctor_name.toLowerCase().includes(q)) ||
          (b.hmo_name && b.hmo_name.toLowerCase().includes(q)) ||
          (q === 'hmo' && isHmoBooking(b)) ||
          (q === 'private' && isPrivateBooking(b))
        : true;

      if (!matchesSearch) return false;

      // Module-specific filtering
      if (activeSubmodule === 'triage-queue') {
        // Exclude completed bookings when queueFilter is 'Active' (default)
        if (queueFilter === 'Active' && (b.status === 'Completed' || b.status === 'Cancelled')) {
          return false;
        }

        // Clinic / Department Filter
        if (selectedClinic !== 'All') {
          const sc = selectedClinic.toLowerCase().trim();
          const matchesClinic =
            (b.department?.name && b.department.name.toLowerCase() === sc) ||
            (b.doctor_specialty && b.doctor_specialty.toLowerCase().includes(sc)) ||
            (b.doctor?.specialty && b.doctor.specialty.toLowerCase().includes(sc)) ||
            (b.doctor?.department?.name && b.doctor.department.name.toLowerCase() === sc);

          if (!matchesClinic) return false;
        }

        // HMO Provider Filter
        if (selectedHmoProvider !== 'All') {
          if (!isHmoBooking(b)) return false;
          if (!matchesHmoProvider(b, selectedHmoProvider)) return false;
        }

        // Standardized Patient Category Filter
        if (patientCategoryFilter === 'Private') return isPrivateBooking(b);
        if (patientCategoryFilter === 'HMO') return isHmoBooking(b);
        return true;
      }

      if (activeSubmodule === 'triage-completed') {
        if (b.status !== 'Completed') return false;

        // Clinic / Department Filter
        if (selectedClinic !== 'All') {
          const sc = selectedClinic.toLowerCase().trim();
          const matchesClinic =
            (b.department?.name && b.department.name.toLowerCase() === sc) ||
            (b.doctor_specialty && b.doctor_specialty.toLowerCase().includes(sc)) ||
            (b.doctor?.specialty && b.doctor.specialty.toLowerCase().includes(sc)) ||
            (b.doctor?.department?.name && b.doctor.department.name.toLowerCase() === sc);

          if (!matchesClinic) return false;
        }

        // HMO Provider Filter
        if (selectedHmoProvider !== 'All') {
          if (!isHmoBooking(b)) return false;
          if (!matchesHmoProvider(b, selectedHmoProvider)) return false;
        }

        // Standardized Patient Category Filter
        if (patientCategoryFilter === 'Private') return isPrivateBooking(b);
        if (patientCategoryFilter === 'HMO') return isHmoBooking(b);

        // Date Filter
        if (completedDateFilter !== 'All') {
          const rawDate = b.date || b.appointment_date;
          if (rawDate) {
            const dateStr = rawDate.slice(0, 10);
            const todayStr = new Date().toISOString().slice(0, 10);
            if (completedDateFilter === 'Today') {
              return dateStr === todayStr;
            } else if (completedDateFilter === 'Week') {
              const apptTime = new Date(dateStr).getTime();
              const weekAgoTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
              return apptTime >= weekAgoTime;
            } else if (completedDateFilter === 'Month') {
              const apptTime = new Date(dateStr).getTime();
              const monthAgoTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
              return apptTime >= monthAgoTime;
            }
          }
        }

        return true;
      }

      if (activeSubmodule === 'hmo-approvals') {
        if (!isHmoBooking(b)) return false;
        if (selectedHmoProvider !== 'All' && !matchesHmoProvider(b, selectedHmoProvider)) {
          return false;
        }
        if (hmoApprovalStatusFilter === 'Pending') {
          return b.hmo_status !== 'Approved';
        }
        if (hmoApprovalStatusFilter === 'Approved') {
          return b.hmo_status === 'Approved';
        }
        return true;
      }

      if (activeSubmodule === 'hmo-reroutes') {
        return b.hmo_status?.includes('Rerouted') || b.hmo_status?.includes('Declined');
      }

      if (activeSubmodule === 'finance-invoices') {
        const isEligible = isPrivateBooking(b) || b.hmo_status?.includes('Rerouted') || b.status === 'Payment Approved';
        if (!isEligible) return false;

        const isCleared = b.payment_status === 'Paid' || b.status === 'Payment Approved';
        if (financeStatusFilter === 'Pending') return !isCleared;
        if (financeStatusFilter === 'Cleared') return isCleared;
        return true;
      }

      if (activeSubmodule === 'finance-receipts') {
        return b.payment_status === 'Paid' || b.status === 'Payment Approved';
      }

      return true;
    });

    if (activeSubmodule === 'finance-invoices') {
      return [...list].sort((a, b) => {
        const aCleared = a.payment_status === 'Paid' || a.status === 'Payment Approved';
        const bCleared = b.payment_status === 'Paid' || b.status === 'Payment Approved';
        if (!aCleared && bCleared) return -1;
        if (aCleared && !bCleared) return 1;
        return (b.id || 0) - (a.id || 0);
      });
    }

    return list;
  }, [
    bookings,
    searchQuery,
    activeSubmodule,
    selectedClinic,
    selectedHmoProvider,
    patientCategoryFilter,
    hmoApprovalStatusFilter,
    financeStatusFilter,
    queueFilter,
    completedDateFilter,
  ]);

  // Dynamic Badges
  const badges = useMemo(() => {
    const pendingHmo = bookings.filter(
      (b) => isHmoBooking(b) && b.hmo_status !== 'Approved'
    ).length;
    const waitingTriage = bookings.filter((b) => b.status === 'Checked In').length;
    const pendingBilling = bookings.filter(
      (b) =>
        (isPrivateBooking(b) || b.hmo_status?.includes('Rerouted')) &&
        b.payment_status !== 'Paid'
    ).length;
    const completedCount = bookings.filter((b) => b.status === 'Completed').length;
    return { pendingHmo, waitingTriage, pendingBilling, completedCount };
  }, [bookings]);

  // Module 4 Registry Filtering
  const filteredSpecialists = useMemo(() => {
    return doctors.filter((d) => {
      if (!specialistSearch) return true;
      const q = specialistSearch.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.department?.name && d.department.name.toLowerCase().includes(q))
      );
    });
  }, [doctors, specialistSearch]);

  const filteredDepts = useMemo(() => {
    return departments.filter((dept) => {
      if (!deptSearch) return true;
      const q = deptSearch.toLowerCase().trim();
      return (
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q)
      );
    });
  }, [departments, deptSearch]);

  const filteredStaffUsers = useMemo(() => {
    return staffUsers.filter((u) => {
      if (!staffSearch) return true;
      const q = staffSearch.toLowerCase().trim();
      const roleStr =
        typeof u.role === 'object' && u.role
          ? ((u.role as unknown) as { name?: string }).name || ''
          : String(u.role || '');
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.desk || '').toLowerCase().includes(q) ||
        roleStr.toLowerCase().includes(q)
      );
    });
  }, [staffUsers, staffSearch]);

  const filteredHmoCompanies = useMemo(() => {
    return hmoCompanies.filter((h) => {
      if (!hmoSearch) return true;
      const q = hmoSearch.toLowerCase().trim();
      return (
        h.name.toLowerCase().includes(q) ||
        (h.code || '').toLowerCase().includes(q) ||
        (h.policy_code || '').toLowerCase().includes(q) ||
        (h.contact_person || '').toLowerCase().includes(q) ||
        (h.email || '').toLowerCase().includes(q) ||
        (h.phone || '').toLowerCase().includes(q)
      );
    });
  }, [hmoCompanies, hmoSearch]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row antialiased text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* 1. Sidebar */}
      <DashboardSidebar
        currentUser={currentUser}
        activeSubmodule={activeSubmodule}
        onSelectSubmodule={(id) => {
          setActiveSubmodule(id);
          setActionError(null);
          setActionSuccess(null);
        }}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onLogout={handleLogout}
        badges={badges}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Topbar */}
        <DashboardTopbar
          currentUser={currentUser}
          activeSubmodule={activeSubmodule}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onRefresh={fetchData}
          isRefreshing={loadingBookings}
          onOpenWalkinModal={() => setIsNewBookingOpen(true)}
          onSelectSubmodule={setActiveSubmodule}
          onLogout={handleLogout}
          notifications={{
            pendingHmoCount: badges.pendingHmo,
            waitingTriageCount: badges.waitingTriage,
            pendingBillingCount: badges.pendingBilling,
          }}
        />

        {/* Global Banner Notifications */}
        <div className="px-4 sm:px-8 pt-4">
          {actionSuccess && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-wrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
                <span className="text-[10px] text-emerald-700/80 font-medium bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Disappears in 30s
                </span>
              </div>
              <button
                onClick={() => setActionSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 ml-2"
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {actionError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                onClick={() => setActionError(null)}
                className="text-rose-700 hover:text-rose-900 text-xs font-bold px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Submodule Workspace */}
        <main className="flex-1 px-4 sm:px-8 pb-12 pt-2">
          {/* =========================================================================
              MODULE 1: TRIAGE & QUEUE
          ========================================================================= */}
          {activeSubmodule === 'triage-queue' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Patient Arrivals & Check-in Queue
                  </h1>
                  <p className="text-xs text-slate-500">
                    Filter arrivals by clinic (Cardiology, Paediatrics, Neurology, etc.) and patient billing type. Monitor and Admins complete visits after consultation.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  {/* Active Queue vs All Arrivals Toggle */}
                  <div className="inline-flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQueueFilter('Active')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        queueFilter === 'Active'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Only show active arrivals waiting for consultation"
                    >
                      Active Queue ({bookings.filter((b) => b.status !== 'Completed' && b.status !== 'Cancelled').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueFilter('All')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        queueFilter === 'All'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Show all bookings including completed visits"
                    >
                      All ({bookings.length})
                    </button>
                  </div>

                  {/* Completed Bookings Direct Link Button */}
                  <button
                    type="button"
                    onClick={() => setActiveSubmodule('triage-completed')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="View completed consultations"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed ({badges.completedCount ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintQueue}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Print current arrivals queue manifest"
                  >
                    <Printer className="w-4 h-4 text-teal-600" />
                    <span>Print Queue Manifest</span>
                  </button>
                  <button
                    onClick={() => setIsNewBookingOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> New Walk-in Intake
                  </button>
                </div>
              </div>

              {/* Dual Filter Bars: Clinic Selector Tabs + Billing Category Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                {/* Clinic / Specialty Quick Filter Tabs + Dropdown */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-0.5 flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedClinic('All')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      selectedClinic === 'All'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>All Clinics</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        selectedClinic === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {queueFilter === 'Active'
                        ? bookings.filter((b) => b.status !== 'Completed' && b.status !== 'Cancelled').length
                        : bookings.length}
                    </span>
                  </button>

                  {featuredClinics.map((clinicName) => {
                    const count = bookings.filter((b) => {
                      if (queueFilter === 'Active' && (b.status === 'Completed' || b.status === 'Cancelled')) {
                        return false;
                      }
                      const sc = clinicName.toLowerCase().trim();
                      return (
                        (b.department?.name && b.department.name.toLowerCase() === sc) ||
                        (b.doctor_specialty && b.doctor_specialty.toLowerCase().includes(sc)) ||
                        (b.doctor?.specialty && b.doctor.specialty.toLowerCase().includes(sc)) ||
                        (b.doctor?.department?.name && b.doctor.department.name.toLowerCase() === sc)
                      );
                    }).length;

                    const isSelected = selectedClinic.toLowerCase() === clinicName.toLowerCase();

                    return (
                      <button
                        key={clinicName}
                        onClick={() => setSelectedClinic(isSelected ? 'All' : clinicName)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Stethoscope
                          className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-teal-600'}`}
                        />
                        <span>{clinicName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                            isSelected ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Dropdown for All Hospital Departments */}
                  <div className="relative inline-flex items-center shrink-0">
                    <select
                      value={selectedClinic}
                      onChange={(e) => setSelectedClinic(e.target.value)}
                      className={`pl-3 pr-7 py-1.5 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer appearance-none transition-all ${
                        selectedClinic !== 'All' &&
                        !featuredClinics.map((f) => f.toLowerCase()).includes(selectedClinic.toLowerCase())
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                      title="Select any hospital clinic or specialty"
                    >
                      <option value="All" className="bg-white text-slate-900 font-semibold">
                        More Clinics... ({departments.length})
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name} className="bg-white text-slate-900 font-semibold">
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className={`w-3 h-3 absolute right-2 pointer-events-none ${
                        selectedClinic !== 'All' &&
                        !featuredClinics.map((f) => f.toLowerCase()).includes(selectedClinic.toLowerCase())
                          ? 'text-white'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Standardized Patient Billing Category Filter (Private vs HMO) + HMO Type Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl shrink-0 self-start lg:self-auto flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => {
                      setPatientCategoryFilter('All');
                      setSelectedHmoProvider('All');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      patientCategoryFilter === 'All' && selectedHmoProvider === 'All'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => {
                      setPatientCategoryFilter('Private');
                      setSelectedHmoProvider('All');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      patientCategoryFilter === 'Private'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Private ({bookings.filter(isPrivateBooking).length})
                  </button>
                  <button
                    onClick={() => {
                      setPatientCategoryFilter('HMO');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      patientCategoryFilter === 'HMO'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    HMO ({bookings.filter(isHmoBooking).length})
                  </button>

                  {/* HMO Provider Dropdown */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedHmoProvider}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedHmoProvider(val);
                        if (val !== 'All') {
                          setPatientCategoryFilter('HMO');
                        }
                      }}
                      className={`pl-2.5 pr-6 py-1 rounded-lg text-xs font-bold border transition-all appearance-none cursor-pointer ${
                        selectedHmoProvider !== 'All'
                          ? 'bg-teal-900 text-white border-teal-800 shadow-xs'
                          : 'bg-white/80 text-slate-700 border-slate-300 hover:bg-white'
                      }`}
                      title="Filter by specific HMO (Hygeia, Reliance, AXA Mansard, etc.)"
                    >
                      <option value="All" className="bg-white text-slate-900 font-semibold">
                        Filter HMO ({hmoCompanies.length})...
                      </option>
                      {hmoCompanies.map((hmo) => {
                        const count = bookings.filter((b) => isHmoBooking(b) && matchesHmoProvider(b, hmo.name)).length;
                        return (
                          <option key={hmo.id} value={hmo.name} className="bg-white text-slate-900 font-semibold">
                            {hmo.name} {count > 0 ? `(${count})` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      className={`w-3 h-3 absolute right-1.5 pointer-events-none ${
                        selectedHmoProvider !== 'All' ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated HMO Providers Quick-Filter Bar (Hygeia, Reliance, AXA Mansard, etc.) */}
              {(patientCategoryFilter === 'HMO' || selectedHmoProvider !== 'All') && (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-teal-50/70 border border-teal-200/80 overflow-x-auto scrollbar-thin">
                  <span className="text-[11px] font-black text-teal-900 uppercase tracking-wider flex items-center gap-1 shrink-0 pl-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" /> HMO Provider:
                  </span>

                  <button
                    onClick={() => setSelectedHmoProvider('All')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedHmoProvider === 'All'
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    All HMOs ({bookings.filter(isHmoBooking).length})
                  </button>

                  {hmoCompanies.map((hmo) => {
                    const isSelected = selectedHmoProvider.toLowerCase() === hmo.name.toLowerCase();
                    const count = bookings.filter((b) => isHmoBooking(b) && matchesHmoProvider(b, hmo.name)).length;

                    return (
                      <button
                        key={hmo.id}
                        onClick={() => setSelectedHmoProvider(isSelected ? 'All' : hmo.name)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                        }`}
                      >
                        <span>{hmo.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                            isSelected ? 'bg-teal-900 text-white' : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {selectedHmoProvider !== 'All' && (
                    <button
                      onClick={() => setSelectedHmoProvider('All')}
                      className="text-xs font-bold text-teal-800 hover:text-teal-950 px-2 py-1 rounded-lg hover:bg-teal-100 whitespace-nowrap"
                    >
                      ✕ Clear HMO
                    </button>
                  )}
                </div>
              )}

              {/* Queue Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Ticket Ref</th>
                        <th className="px-5 py-4">Patient Details</th>
                        <th className="px-5 py-4">Specialist & Department</th>
                        <th className="px-5 py-4">Time Slot</th>
                        <th className="px-5 py-4">Payment / HMO</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">
                          {canCompleteVisits ? 'Desk Action' : 'Reception Routing'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                            <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-semibold text-slate-600">
                              {selectedHmoProvider !== 'All' && selectedClinic !== 'All'
                                ? `No appointments found for ${selectedHmoProvider} in ${selectedClinic}`
                                : selectedHmoProvider !== 'All'
                                ? `No appointments found for ${selectedHmoProvider}`
                                : selectedClinic !== 'All'
                                ? `No appointments found in ${selectedClinic}`
                                : 'No appointments found'}
                            </p>
                            <p className="text-[11px] mt-1 space-x-2">
                              {selectedHmoProvider !== 'All' && (
                                <button
                                  onClick={() => setSelectedHmoProvider('All')}
                                  className="text-teal-600 hover:text-teal-800 font-bold underline"
                                >
                                  View all HMOs
                                </button>
                              )}
                              {selectedClinic !== 'All' && (
                                <button
                                  onClick={() => setSelectedClinic('All')}
                                  className="text-teal-600 hover:text-teal-800 font-bold underline"
                                >
                                  View all clinics
                                </button>
                              )}
                              {selectedHmoProvider === 'All' && selectedClinic === 'All' && (
                                'Check search filter or register a walk-in intake.'
                              )}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setReceiptBooking(b)}
                                className="font-mono font-black text-teal-800 hover:text-teal-600 text-sm hover:underline cursor-pointer text-left transition-colors flex items-center gap-1 group"
                                title="Click to view & print appointment slip"
                              >
                                <span>{b.reference_code}</span>
                                <Printer className="w-3 h-3 text-slate-300 group-hover:text-teal-600 transition-colors opacity-0 group-hover:opacity-100" />
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">{b.patient_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{b.patient_phone}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{formatDoctorName(b.doctor_name)}</div>
                              <div className="text-[11px] text-teal-600 font-medium">
                                {b.doctor_specialty || b.doctor?.department?.name || 'General Medicine'}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{formatBookingDate(b.date || b.appointment_date)}</div>
                              <div className="text-[11px] text-slate-500">{b.time || b.appointment_time}</div>
                            </td>
                            <td className="px-5 py-4">
                              {isHmoBooking(b) ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black uppercase tracking-wider">
                                    <ShieldCheck className="w-3 h-3 text-teal-600" /> HMO Insurance
                                  </span>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {b.hmo_name || b.hmo_company?.name || 'HMO Enrollee'}
                                  </div>
                                  {b.hmo_policy_code && (
                                    <div className="text-[10px] font-mono text-slate-500">
                                      ID: {b.hmo_policy_code}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                                    <CreditCard className="w-3 h-3 text-slate-500" /> Private Self-Pay
                                  </span>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {b.payment_status === 'Paid' ? (
                                      <span className="text-emerald-700 font-bold">Settled ({b.payment_method || 'POS'})</span>
                                    ) : (
                                      <span className="text-amber-700 font-semibold">Pending Billing</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  b.status === 'Payment Approved'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : b.status === 'HMO Approved'
                                    ? 'bg-teal-100 text-teal-900 border-teal-300'
                                    : b.status === 'Checked In'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : b.status === 'Confirmed'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : b.status === 'Consulting'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : b.status === 'Completed'
                                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                                    : b.status === 'Cancelled'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    b.status === 'Payment Approved'
                                      ? 'bg-emerald-600'
                                      : b.status === 'HMO Approved'
                                      ? 'bg-teal-600'
                                      : b.status === 'Checked In'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : b.status === 'Confirmed'
                                      ? 'bg-blue-500'
                                      : b.status === 'Consulting'
                                      ? 'bg-purple-500 animate-pulse'
                                      : b.status === 'Completed'
                                      ? 'bg-slate-400'
                                      : b.status === 'Cancelled'
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500'
                                  }`}
                                />
                                {b.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {(() => {
                                const isHmo = isHmoBooking(b) && !b.hmo_status?.includes('Rerouted');
                                const isCleared = isHmo
                                  ? (b.hmo_status === 'Approved' || b.status === 'HMO Approved')
                                  : (b.payment_status === 'Paid' || b.status === 'Payment Approved');

                                return canCompleteVisits ? (
                                  <div className="inline-flex items-center justify-end gap-2">
                                    {b.is_active && !['Completed', 'Cancelled', 'Rejected', 'Deleted', 'Checked In'].includes(b.status) && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedBookingForReschedule(b)}
                                        title="Reschedule Appointment"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <CalendarClock className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Reschedule</span>
                                      </button>
                                    )}
                                    {b.status === 'Completed' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Consultation Completed</span>
                                      </span>
                                    ) : b.status === 'Cancelled' ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                                        Cancelled
                                      </span>
                                    ) : isCleared ? (
                                      <button
                                        onClick={() => handleCompleteBooking(b.id)}
                                        disabled={updatingStatusId === b.id}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                        title="Mark consultation complete after patient sees doctor"
                                      >
                                        {updatingStatusId === b.id ? (
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        )}
                                        <span>Complete</span>
                                      </button>
                                    ) : (
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                          {isHmo ? 'Awaiting HMO Approval' : 'Awaiting Payment Clearance'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Frontdesk / Reception Routing Directions */
                                  <div className="inline-flex items-center justify-end gap-2">
                                    {b.is_active && !['Completed', 'Cancelled', 'Rejected', 'Deleted', 'Checked In'].includes(b.status) && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedBookingForReschedule(b)}
                                        title="Reschedule Appointment"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-slate-600 hover:text-teal-700 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <CalendarClock className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Reschedule</span>
                                      </button>
                                    )}
                                    {b.status === 'Completed' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Consulted
                                      </span>
                                    ) : isCleared ? (
                                      <span
                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs border ${
                                          isHmo
                                            ? 'text-teal-800 bg-teal-50 border-teal-200'
                                            : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                        }`}
                                      >
                                        <Stethoscope
                                          className={`w-3.5 h-3.5 ${
                                            isHmo ? 'text-teal-600' : 'text-emerald-600'
                                          }`}
                                        />
                                        {isHmo ? 'HMO Cleared • Direct to Doctor' : 'Cleared • Direct to Doctor'}
                                      </span>
                                    ) : isHmo ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl shadow-2xs">
                                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                        Direct to HMO Approver
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs">
                                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                                        Direct to Cashdesk
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hidden Printable Manifest for arrivals queue (optimized for Portrait A4) */}
              <div
                id="printable-arrivals-manifest"
                style={{ display: 'none' }}
                className="space-y-4 text-slate-900 bg-white"
              >
                {/* Hospital Letterhead Header */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IsaluLogo variant="full" size="md" />
                      <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                          Patient Arrivals & Check-in Queue Manifest
                        </h2>
                        <p className="text-[10.5px] text-slate-600">
                          Isalu Hospitals • Frontdesk Triage & Clinical Services Management
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                      <div>
                        Printed:{' '}
                        <strong className="text-slate-900">
                          {new Date().toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div>
                        Time:{' '}
                        <strong className="text-slate-900">
                          {new Date().toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Filter Metadata Pill Bar */}
                  <div className="mt-3 flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] text-slate-700">
                    <div>
                      Clinic: <strong className="text-slate-900">{selectedClinic}</strong>
                    </div>
                    <div>
                      Category:{' '}
                      <strong className="text-slate-900">
                        {patientCategoryFilter === 'All' ? 'All Billing Types' : patientCategoryFilter}
                      </strong>
                    </div>
                    {selectedHmoProvider !== 'All' && (
                      <div>
                        HMO Provider: <strong className="text-slate-900">{selectedHmoProvider}</strong>
                      </div>
                    )}
                    <div>
                      Active Queue Total:{' '}
                      <strong className="text-teal-900 font-black">{filteredBookings.length} Patients</strong>
                    </div>
                  </div>
                </div>

                {/* Portrait Table */}
                <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[9px] tracking-wider border-b border-slate-300">
                      <th className="p-1.5 border-r border-slate-300 text-center w-6">#</th>
                      <th className="p-1.5 border-r border-slate-300 w-20">Ticket Ref</th>
                      <th className="p-1.5 border-r border-slate-300">Patient Details</th>
                      <th className="p-1.5 border-r border-slate-300">Specialist Consultant</th>
                      <th className="p-1.5 border-r border-slate-300 w-24">Slot / Time</th>
                      <th className="p-1.5 border-r border-slate-300 w-32">Payment / HMO</th>
                      <th className="p-1.5 w-24">Queue Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No patients currently in queue for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b, idx) => (
                        <tr
                          key={b.id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                        >
                          <td className="p-1.5 border-r border-slate-300 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-black text-slate-900">
                            {b.reference_code}
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-bold text-slate-900 text-[10.5px]">
                              {b.patient_name}
                            </div>
                            <div className="text-[9px] text-slate-600 font-mono">
                              {b.patient_phone}
                            </div>
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-bold text-slate-900">
                              {formatDoctorName(b.doctor_name)}
                            </div>
                            <div className="text-[9px] text-teal-800 font-semibold">
                              {b.doctor_specialty ||
                                b.doctor?.department?.name ||
                                'General Consultation'}
                            </div>
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">
                              {b.time || b.appointment_time}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {formatBookingDate(b.date || b.appointment_date)}
                            </div>
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-bold text-slate-900">
                              {isHmoBooking(b) ? 'HMO Insurance' : 'Private Self-Pay'}
                            </div>
                            {isHmoBooking(b) ? (
                              <div className="text-[9px] text-slate-600">
                                {b.hmo_name || b.hmo_company?.name}
                                {b.hmo_auth_code ? ` • Auth: ${b.hmo_auth_code}` : ''}
                              </div>
                            ) : (
                              <div className="text-[9px] text-slate-600">
                                {b.payment_status === 'Paid' ? (
                                  <span className="text-emerald-800 font-bold">Settled</span>
                                ) : (
                                  <span className="text-amber-800 font-semibold">Pending</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-1.5 font-bold text-[9.5px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                b.status === 'Payment Approved' || b.status === 'HMO Approved'
                                  ? 'bg-emerald-50 text-emerald-900'
                                  : b.status === 'Checked In'
                                  ? 'bg-teal-50 text-teal-900'
                                  : b.status === 'Completed'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-amber-50 text-amber-900'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Sign-off & Audit Trail Footer */}
                <div className="pt-3 flex items-center justify-between text-[9.5px] text-slate-500 border-t border-slate-300">
                  <div>
                    <span>Isalu Hospitals • Electronic Healthcare Intake Records</span>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">
                      Confidential Patient Healthcare Manifest • For Internal Hospital Clearance Only
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="border-b border-slate-400 w-48 inline-block mb-1"></div>
                    <div>Triage Nurse / Desk Officer Signature</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE: COMPLETED BOOKINGS & CONSULTATIONS ARCHIVE
          ========================================================================= */}
          {activeSubmodule === 'triage-completed' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    </span>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      Completed Consultations Archive
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Historical archive of all outpatient consultations concluded across hospital specialist clinics.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveSubmodule('triage-queue')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>Back to Arrivals Queue</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCompletedQueue}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Print completed consultations manifest"
                  >
                    <Printer className="w-4 h-4 text-teal-600" />
                    <span>Print Completed Manifest</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Completed</div>
                    <div className="text-xl font-black text-slate-900">
                      {bookings.filter((b) => b.status === 'Completed').length}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Today</div>
                    <div className="text-xl font-black text-slate-900">
                      {(() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        return bookings.filter(
                          (b) =>
                            b.status === 'Completed' &&
                            ((b.date && b.date.startsWith(todayStr)) ||
                              (b.appointment_date && b.appointment_date.startsWith(todayStr)) ||
                              (b.completed_at && b.completed_at.startsWith(todayStr)))
                        ).length;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">HMO Consultations</div>
                    <div className="text-xl font-black text-slate-900">
                      {bookings.filter((b) => b.status === 'Completed' && isHmoBooking(b)).length}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Private Consultations</div>
                    <div className="text-xl font-black text-slate-900">
                      {bookings.filter((b) => b.status === 'Completed' && isPrivateBooking(b)).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Bars: Clinic Selector Tabs + Billing Selector + Date Filter */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                {/* Clinic Quick Filter Tabs + Dropdown */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-0.5 flex-1 min-w-0">
                  <button
                    onClick={() => setSelectedClinic('All')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      selectedClinic === 'All'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>All Clinics</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        selectedClinic === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {bookings.filter((b) => b.status === 'Completed').length}
                    </span>
                  </button>

                  {featuredClinics.map((clinicName) => {
                    const count = bookings.filter((b) => {
                      if (b.status !== 'Completed') return false;
                      const sc = clinicName.toLowerCase().trim();
                      return (
                        (b.department?.name && b.department.name.toLowerCase() === sc) ||
                        (b.doctor_specialty && b.doctor_specialty.toLowerCase().includes(sc)) ||
                        (b.doctor?.specialty && b.doctor.specialty.toLowerCase().includes(sc)) ||
                        (b.doctor?.department?.name && b.doctor.department.name.toLowerCase() === sc)
                      );
                    }).length;

                    const isSelected = selectedClinic.toLowerCase() === clinicName.toLowerCase();

                    return (
                      <button
                        key={clinicName}
                        onClick={() => setSelectedClinic(isSelected ? 'All' : clinicName)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Stethoscope
                          className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-teal-600'}`}
                        />
                        <span>{clinicName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                            isSelected ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Dropdown for All Hospital Departments */}
                  <div className="relative inline-flex items-center shrink-0">
                    <select
                      value={selectedClinic}
                      onChange={(e) => setSelectedClinic(e.target.value)}
                      className={`pl-3 pr-7 py-1.5 rounded-xl text-xs font-bold border shadow-2xs cursor-pointer appearance-none transition-all ${
                        selectedClinic !== 'All' &&
                        !featuredClinics.map((f) => f.toLowerCase()).includes(selectedClinic.toLowerCase())
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <option value="All" className="bg-white text-slate-900 font-semibold">
                        More Clinics... ({departments.length})
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name} className="bg-white text-slate-900 font-semibold">
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className={`w-3 h-3 absolute right-2 pointer-events-none ${
                        selectedClinic !== 'All' &&
                        !featuredClinics.map((f) => f.toLowerCase()).includes(selectedClinic.toLowerCase())
                          ? 'text-white'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Patient Category & Date Filter Tabs */}
                <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto flex-wrap">
                  {/* Date Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                    {(['All', 'Today', 'Week', 'Month'] as const).map((filterOpt) => (
                      <button
                        key={filterOpt}
                        onClick={() => setCompletedDateFilter(filterOpt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          completedDateFilter === filterOpt
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {filterOpt === 'All' ? 'All Time' : filterOpt === 'Week' ? 'Past 7 Days' : filterOpt === 'Month' ? 'Past 30 Days' : 'Today'}
                      </button>
                    ))}
                  </div>

                  {/* Patient Category Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                    <button
                      onClick={() => {
                        setPatientCategoryFilter('All');
                        setSelectedHmoProvider('All');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        patientCategoryFilter === 'All' && selectedHmoProvider === 'All'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Types
                    </button>
                    <button
                      onClick={() => {
                        setPatientCategoryFilter('Private');
                        setSelectedHmoProvider('All');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        patientCategoryFilter === 'Private'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Private
                    </button>
                    <button
                      onClick={() => setPatientCategoryFilter('HMO')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        patientCategoryFilter === 'HMO'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      HMO
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3.5">Ref Code</th>
                        <th className="px-5 py-3.5">Patient Details</th>
                        <th className="px-5 py-3.5">Attending Specialist</th>
                        <th className="px-5 py-3.5">Consultation Date</th>
                        <th className="px-5 py-3.5">Billing & Payer</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <div className="max-w-sm mx-auto space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <h3 className="font-bold text-slate-800 text-sm">No completed bookings found</h3>
                              <p className="text-xs text-slate-500">
                                {searchQuery || selectedClinic !== 'All' || patientCategoryFilter !== 'All'
                                  ? 'No completed consultations match your current search or clinic filters.'
                                  : 'Completed patient consultations will be archived here once marked finished in the Arrivals Queue.'}
                              </p>
                              <button
                                onClick={() => setActiveSubmodule('triage-queue')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                              >
                                View Arrivals & Check-in Queue
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setReceiptBooking(b)}
                                className="font-mono font-black text-teal-800 hover:text-teal-600 text-sm hover:underline cursor-pointer text-left transition-colors flex items-center gap-1 group"
                                title="Click to view & print appointment slip"
                              >
                                <span>{b.reference_code}</span>
                                <Printer className="w-3 h-3 text-slate-300 group-hover:text-teal-600 transition-colors opacity-0 group-hover:opacity-100" />
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">{b.patient_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{b.patient_phone}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{formatDoctorName(b.doctor_name)}</div>
                              <div className="text-[11px] text-teal-600 font-medium">
                                {b.doctor_specialty || b.doctor?.department?.name || 'General Medicine'}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{formatBookingDate(b.date || b.appointment_date)}</div>
                              <div className="text-[11px] text-slate-500">{b.time || b.appointment_time}</div>
                            </td>
                            <td className="px-5 py-4">
                              {isHmoBooking(b) ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black uppercase tracking-wider">
                                    <ShieldCheck className="w-3 h-3 text-teal-600" /> HMO Insurance
                                  </span>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {b.hmo_name || b.hmo_company?.name || 'HMO Enrollee'}
                                  </div>
                                  {b.hmo_policy_code && (
                                    <div className="text-[10px] font-mono text-slate-500">
                                      ID: {b.hmo_policy_code}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                                    <CreditCard className="w-3 h-3 text-slate-500" /> Private Self-Pay
                                  </span>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {b.payment_status === 'Paid' ? (
                                      <span className="text-emerald-700 font-bold">Settled ({b.payment_method || 'POS'})</span>
                                    ) : (
                                      <span className="text-slate-600">Settled</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-800 border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Completed</span>
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setReceiptBooking(b)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title="View & Print consultation slip / receipt"
                              >
                                <Printer className="w-3.5 h-3.5 text-teal-600" />
                                <span>View Slip</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printable Completed Manifest */}
              <div
                id="printable-completed-manifest"
                style={{ display: 'none' }}
                className="space-y-4 text-slate-900 bg-white"
              >
                {/* Hospital Letterhead Header */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IsaluLogo variant="full" size="md" />
                      <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                          Completed Patient Consultations Manifest
                        </h2>
                        <p className="text-[10.5px] text-slate-600">
                          Isalu Hospitals • Clinical Services & Outpatient Records Archive
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                      <div>
                        Printed:{' '}
                        <strong className="text-slate-900">
                          {new Date().toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div>
                        Time:{' '}
                        <strong className="text-slate-900">
                          {new Date().toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Filter Metadata */}
                  <div className="mt-3 flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] text-slate-700">
                    <div>
                      Clinic: <strong className="text-slate-900">{selectedClinic}</strong>
                    </div>
                    <div>
                      Category:{' '}
                      <strong className="text-slate-900">
                        {patientCategoryFilter === 'All' ? 'All Billing Types' : patientCategoryFilter}
                      </strong>
                    </div>
                    <div>
                      Total Completed Concluded:{' '}
                      <strong className="text-slate-900 font-mono text-emerald-800">
                        {filteredBookings.length}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Manifest Table */}
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-300 font-bold text-slate-800 uppercase">
                      <th className="p-1.5 border-r border-slate-300 w-8">#</th>
                      <th className="p-1.5 border-r border-slate-300">Ref Code</th>
                      <th className="p-1.5 border-r border-slate-300">Patient Full Name</th>
                      <th className="p-1.5 border-r border-slate-300">Attending Specialist</th>
                      <th className="p-1.5 border-r border-slate-300">Consult Date & Time</th>
                      <th className="p-1.5 border-r border-slate-300">Billing Type</th>
                      <th className="p-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                          No completed consultations in this report range.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b, idx) => (
                        <tr key={b.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-slate-900">
                            {b.reference_code}
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-bold text-slate-900">{b.patient_name}</div>
                            <div className="text-[9px] text-slate-600 font-mono">{b.patient_phone}</div>
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-bold text-slate-900">{formatDoctorName(b.doctor_name)}</div>
                            <div className="text-[9px] text-teal-800 font-semibold">
                              {b.doctor_specialty || b.doctor?.department?.name || 'General Consultation'}
                            </div>
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">{formatBookingDate(b.date || b.appointment_date)}</div>
                            <div className="text-[9px] text-slate-500">{b.time || b.appointment_time}</div>
                          </td>
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="font-bold text-slate-900">
                              {isHmoBooking(b) ? 'HMO Insurance' : 'Private Self-Pay'}
                            </div>
                            {isHmoBooking(b) && (b.hmo_name || b.hmo_company?.name) && (
                              <div className="text-[9px] text-slate-600">
                                {b.hmo_name || b.hmo_company?.name}
                              </div>
                            )}
                          </td>
                          <td className="p-1.5 font-bold text-[9.5px]">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Sign-off Footer */}
                <div className="pt-3 flex items-center justify-between text-[9.5px] text-slate-500 border-t border-slate-300">
                  <div>
                    <span>Isalu Hospitals • Electronic Healthcare Intake Records Archive</span>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">
                      Confidential Patient Healthcare Manifest • For Internal Hospital Clearance Only
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="border-b border-slate-400 w-48 inline-block mb-1"></div>
                    <div>Medical Records / Clinic Lead Signature</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submodule: Waiting Room TV Board */}
          {activeSubmodule === 'triage-tv' && (
            <div
              className={`rounded-3xl bg-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-slate-800 space-y-8 ${
                tvFullScreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <div className="flex items-center gap-4">
                  <IsaluLogo variant="full" theme="dark" size="lg" />
                  <div className="hidden sm:block border-l border-slate-800 pl-4">
                    <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
                      Consultation Waiting Room TV
                    </span>
                    <h2 className="text-xl font-black text-white">Live Patient Queuing Display</h2>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span className="text-sm font-mono font-bold text-teal-300">
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 justify-end mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> TV Feed Active
                    </span>
                  </div>
                  <button
                    onClick={() => setTvFullScreen(!tvFullScreen)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title={tvFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ready / Checked In */}
                <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" /> Ready for Consultation (Checked In)
                    </h3>
                    <span className="text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded-md">
                      {bookings.filter((b) => b.status === 'Checked In').length} Waiting
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {bookings.filter((b) => b.status === 'Checked In').length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No patients currently waiting in triage queue.
                      </div>
                    ) : (
                      bookings
                        .filter((b) => b.status === 'Checked In')
                        .map((b) => (
                          <div
                            key={b.id}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xl font-black text-teal-300 font-mono tracking-wider">
                                {b.reference_code}
                              </span>
                              <p className="text-sm font-bold text-white mt-0.5">{b.patient_name}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-300 font-medium block">{formatDoctorName(b.doctor_name)}</span>
                              <span className="text-xs font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded-md border border-teal-800/50 mt-1 inline-block">
                                {b.doctor_specialty || 'General'}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Arriving Soon */}
                <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Confirmed / Arriving Today
                    </h3>
                    <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                      {bookings.filter((b) => b.status === 'Confirmed').length} Scheduled
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {bookings.filter((b) => b.status === 'Confirmed').length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No additional scheduled appointments today.
                      </div>
                    ) : (
                      bookings
                        .filter((b) => b.status === 'Confirmed')
                        .slice(0, 10)
                        .map((b) => (
                          <div
                            key={b.id}
                            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-300 font-mono">{b.reference_code}</span>
                              <p className="text-slate-400 mt-0.5">{b.patient_name}</p>
                            </div>
                            <div className="text-right text-slate-400">
                              <span className="font-semibold text-slate-300">{b.time || b.appointment_time}</span>
                              <span className="text-[10px] block text-slate-500">{formatDoctorName(b.doctor_name)}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submodule: Walk-in Form Trigger */}
          {activeSubmodule === 'triage-walkin' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs max-w-2xl mx-auto text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
                <Plus className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Immediate Walk-in Patient Registration</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Rapidly register unscheduled outpatient arrivals directly into the hospital triage queue and generate an instant consultation ticket.
              </p>
              <button
                onClick={() => setIsNewBookingOpen(true)}
                className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
              >
                Open Walk-in Intake Dialog
              </button>
            </div>
          )}

          {/* =========================================================================
              MODULE 2: INSURANCE & HMO DESK
          ========================================================================= */}
          {activeSubmodule === 'hmo-approvals' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    HMO Pre-Authorization & Insurance Clearance
                  </h1>
                  <p className="text-xs text-slate-500">
                    Verify HMO enrollee eligibility, validate policy numbers, enter pre-auth approval codes, or reroute to cashdesk.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl shrink-0">
                    <button
                      onClick={() => setHmoApprovalStatusFilter('All')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        hmoApprovalStatusFilter === 'All'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({bookings.filter(isHmoBooking).length})
                    </button>
                    <button
                      onClick={() => setHmoApprovalStatusFilter('Pending')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        hmoApprovalStatusFilter === 'Pending'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      Pending ({badges.pendingHmo})
                    </button>
                    <button
                      onClick={() => setHmoApprovalStatusFilter('Approved')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        hmoApprovalStatusFilter === 'Approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Approved ({bookings.filter((b) => isHmoBooking(b) && b.hmo_status === 'Approved').length})
                    </button>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>{badges.pendingHmo} Awaiting Verification</span>
                  </div>
                </div>
              </div>

              {/* HMO Provider Filter Quick-Chips Bar */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
                <button
                  onClick={() => setSelectedHmoProvider('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedHmoProvider === 'All'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  All HMOs ({bookings.filter(isHmoBooking).length})
                </button>
                {hmoCompanies.map((hmo) => {
                  const count = bookings.filter(
                    (b) => isHmoBooking(b) && matchesHmoProvider(b, hmo.name)
                  ).length;
                  const isSelected = selectedHmoProvider.toLowerCase() === hmo.name.toLowerCase();
                  return (
                    <button
                      key={hmo.id}
                      onClick={() => setSelectedHmoProvider(isSelected ? 'All' : hmo.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{hmo.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                          isSelected ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Ticket Ref</th>
                        <th className="px-5 py-4">Patient Name</th>
                        <th className="px-5 py-4">HMO Provider</th>
                        <th className="px-5 py-4">Policy Code</th>
                        <th className="px-5 py-4">Pre-Auth Status</th>
                        <th className="px-5 py-4 text-right">Desk Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                            <p className="font-semibold text-slate-700">No HMO Insurance Records Found</p>
                            <p className="text-[11px] mt-1 text-slate-400">
                              {hmoApprovalStatusFilter === 'Pending'
                                ? 'No insurance enrollees currently pending pre-authorization.'
                                : 'Try changing the HMO provider filter or search terms.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="px-5 py-4 font-mono font-bold text-slate-900">{b.reference_code}</td>
                            <td className="px-5 py-4 font-bold text-slate-900">{b.patient_name}</td>
                            <td className="px-5 py-4 text-teal-700 font-bold">{b.hmo_name || 'HMO Company'}</td>
                            <td className="px-5 py-4 font-mono text-slate-600 font-semibold">
                              {b.hmo_policy_code || '—'}
                            </td>
                            <td className="px-5 py-4">
                              {b.hmo_status === 'Approved' ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Approved
                                  </span>
                                  {b.hmo_auth_code && (
                                    <div className="text-[10px] font-mono font-bold text-emerald-700 whitespace-nowrap">
                                      Auth: {b.hmo_auth_code}
                                    </div>
                                  )}
                                </div>
                              ) : b.hmo_status?.includes('Declined') || b.hmo_status?.includes('Rerouted') ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs whitespace-nowrap">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  Declined / Rerouted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Pending Pre-Auth
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {b.hmo_status === 'Approved' ? (
                                <div className="inline-flex items-center justify-end gap-2">
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cleared
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForHmo(b);
                                      setAuthCodeInput(b.hmo_auth_code || '');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
                                    title="Edit Pre-Authorization Code"
                                  >
                                    Edit Code
                                  </button>
                                </div>
                              ) : b.hmo_status?.includes('Declined') || b.hmo_status?.includes('Rerouted') ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                                  At Cashdesk
                                </span>
                              ) : (
                                <div className="inline-flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedBookingForHmo(b);
                                      setAuthCodeInput(b.hmo_auth_code || '');
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                                  >
                                    Authorize Code
                                  </button>
                                  <button
                                    onClick={() => setBookingToReroute(b)}
                                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all"
                                  >
                                    Decline / Cashdesk
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Submodule: HMO Partners Directory */}
          {activeSubmodule === 'hmo-partners' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Accredited HMO Providers Directory ({filteredHmoCompanies.length})
                  </h1>
                  <p className="text-xs text-slate-500">
                    Comprehensive listing of authorized health management organizations, billing codes, and contact focal points.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search HMO providers..."
                      value={hmoSearch}
                      onChange={(e) => setHmoSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 shadow-xs"
                    />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setIsNewHmoOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add HMO Provider
                    </button>
                  )}
                </div>
              </div>

              {filteredHmoCompanies.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No HMO providers match your search.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search query or accredit a new HMO provider above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredHmoCompanies.map((h) => (
                    <div
                      key={h.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[11px] font-bold">
                            {h.policy_code || h.code}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${h.status !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}
                              title={h.status !== false ? 'Active Accredited Partner' : 'Inactive Partner'}
                            ></span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedHmoToEdit(h);
                                  setIsEditHmoOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                title="Edit HMO Provider"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{h.name}</h3>
                          <p className="text-[11px] text-slate-500">Contact: {h.contact_person}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{h.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-mono">{h.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submodule: HMO Reroutes */}
          {activeSubmodule === 'hmo-reroutes' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  HMO Ineligibility & Cashdesk Reroute Audit
                </h1>
                <p className="text-xs text-slate-500">
                  Patients whose insurance pre-authorization was declined, expired, or rerouted to private cashier settlement.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Ticket Ref</th>
                        <th className="px-5 py-4">Patient Name</th>
                        <th className="px-5 py-4">Original HMO</th>
                        <th className="px-5 py-4">Payment Status</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                            No rerouted HMO appointments on record.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="px-5 py-4 font-mono font-bold text-slate-900">{b.reference_code}</td>
                            <td className="px-5 py-4 font-bold text-slate-900">{b.patient_name}</td>
                            <td className="px-5 py-4 text-rose-700 font-semibold">{b.hmo_name || 'HMO'}</td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  b.payment_status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {b.payment_status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold text-rose-600">
                              Rerouted to Cashdesk
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 3: FINANCE & CASHDESK
          ========================================================================= */}
          {activeSubmodule === 'finance-invoices' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Consultation Billing & POS Settlement
                  </h1>
                  <p className="text-xs text-slate-500">
                    Process and track outpatient consultation payment clearances.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{badges.pendingBilling} Pending Clearance</span>
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFinanceStatusFilter('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    financeStatusFilter === 'All'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Consultations ({bookings.filter((b) => isPrivateBooking(b) || b.hmo_status?.includes('Rerouted')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceStatusFilter('Pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    financeStatusFilter === 'Pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Pending ({badges.pendingBilling})
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceStatusFilter('Cleared')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    financeStatusFilter === 'Cleared'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Cleared ({bookings.filter((b) => (isPrivateBooking(b) || b.hmo_status?.includes('Rerouted')) && (b.payment_status === 'Paid' || b.status === 'Payment Approved')).length})
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Ticket Ref</th>
                        <th className="px-5 py-4">Patient Name</th>
                        <th className="px-5 py-4">Specialist</th>
                        <th className="px-5 py-4">Booking Status</th>
                        <th className="px-5 py-4">Payment Status</th>
                        <th className="px-5 py-4 text-right">Cashier Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                            <CreditCard className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                            <p className="font-semibold text-slate-700">
                              {financeStatusFilter === 'Pending' ? 'No Pending Clearances' : 'No Consultations Found'}
                            </p>
                            <p className="text-[11px]">
                              {financeStatusFilter === 'Pending'
                                ? 'All private consultations have been cleared for payment.'
                                : 'No patient records match the selected filter.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => {
                          const isCleared = b.payment_status === 'Paid' || b.status === 'Payment Approved';
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-4 font-mono font-bold text-slate-900">{b.reference_code}</td>
                              <td className="px-5 py-4 font-bold text-slate-900">{b.patient_name}</td>
                              <td className="px-5 py-4">
                                <div className="font-semibold text-slate-900">{formatDoctorName(b.doctor_name)}</div>
                                <div className="text-[11px] text-teal-600">{b.doctor_specialty}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    b.status === 'Payment Approved'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : b.status === 'HMO Approved'
                                      ? 'bg-teal-100 text-teal-900 border-teal-300'
                                      : b.status === 'Checked In'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : b.status === 'Confirmed'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : b.status === 'Consulting'
                                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                                      : b.status === 'Completed'
                                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                                      : b.status === 'Cancelled'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      b.status === 'Payment Approved' || b.status === 'Completed' || b.status === 'Checked In'
                                        ? 'bg-emerald-500'
                                        : b.status === 'Cancelled'
                                        ? 'bg-rose-500'
                                        : 'bg-amber-500'
                                    }`}
                                  />
                                  {b.status || 'Pending'}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {isCleared ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Cleared / Paid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    {b.payment_status || 'Pending'}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {isCleared ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Payment Cleared
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setSelectedBookingForPayment(b)}
                                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                                  >
                                    Clear for Payment
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Submodule: Payment History & Receipts */}
          {activeSubmodule === 'finance-receipts' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Issued Receipts & Cleared Transactions
                </h1>
                <p className="text-xs text-slate-500">
                  Search, review, and print official hospital payment vouchers and audit receipts.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Invoice Reference</th>
                        <th className="px-5 py-4">Ticket Ref</th>
                        <th className="px-5 py-4">Patient Name</th>
                        <th className="px-5 py-4">Amount Cleared</th>
                        <th className="px-5 py-4">Channel</th>
                        <th className="px-5 py-4 text-right">Receipt Voucher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                            No settled payments found matching filter.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="px-5 py-4 font-mono font-bold text-teal-800">
                              {b.invoice_ref || `INV-${b.reference_code}`}
                            </td>
                            <td className="px-5 py-4 font-mono font-semibold text-slate-700">{b.reference_code}</td>
                            <td className="px-5 py-4 font-bold text-slate-900">{b.patient_name}</td>
                            <td className="px-5 py-4 font-black text-emerald-700">
                              ₦{Number(b.doctor?.consultation_fee || 15000).toLocaleString()}
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-600">{b.payment_method || 'POS / Card'}</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => setReceiptBooking(b)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                              >
                                <Printer className="w-3.5 h-3.5 text-teal-600" />
                                View Voucher
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Submodule: Revenue Summary */}
          {activeSubmodule === 'finance-summary' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Hospital Revenue & Collections Breakdown
                </h1>
                <p className="text-xs text-slate-500">
                  Fiscal metrics, consultation fee velocity, and department revenue contribution.
                </p>
              </div>

              {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg shadow-teal-600/20 space-y-2">
                    <span className="text-xs uppercase font-bold text-teal-200">Total Cleared Revenue</span>
                    <div className="text-3xl font-black font-mono">
                      ₦{Number(analytics.total_revenue).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-teal-100">Cumulative collected outpatient fees</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-xs uppercase font-bold text-slate-400">Today&apos;s Collections</span>
                    <div className="text-3xl font-black text-slate-900 font-mono">
                      ₦{Number(analytics.today_revenue).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold">Settled at cashdesk today</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-xs uppercase font-bold text-slate-400">Insurance vs Self-Pay</span>
                    <div className="flex items-center gap-4 pt-1">
                      <div>
                        <span className="text-xl font-black text-slate-900">
                          {analytics.patient_type_breakdown?.hmo || 0}
                        </span>
                        <p className="text-[11px] text-slate-500">HMO Enrollees</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div>
                        <span className="text-xl font-black text-slate-900">
                          {analytics.patient_type_breakdown?.self_pay || 0}
                        </span>
                        <p className="text-[11px] text-slate-500">Self-Pay (Private)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 4: CLINIC REGISTRY
          ========================================================================= */}
          {activeSubmodule === 'registry-specialists' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Medical Specialists & Consultants ({filteredSpecialists.length})
                  </h1>
                  <p className="text-xs text-slate-500">
                    Roster of registered medical officers, clinical departments, and operational capacity.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search specialist or specialty..."
                      value={specialistSearch}
                      onChange={(e) => setSpecialistSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 shadow-xs"
                    />
                  </div>
                  <button
                    onClick={() => setIsNewDoctorOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Specialist
                  </button>
                </div>
              </div>

              {filteredSpecialists.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No medical specialists match your search.</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting keywords or add a new specialist above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSpecialists.map((d) => (
                    <div
                      key={d.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-bold flex items-center justify-center text-sm shrink-0">
                              {d.name.replace('Dr.', '').trim().slice(0, 2).toUpperCase() || 'DR'}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 text-sm truncate">{formatDoctorName(d)}</h3>
                              <p className="text-teal-600 font-semibold text-xs truncate">
                                {d.specialty || d.department?.name || 'Medical Officer'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoctorToEdit(d);
                              setIsEditDoctorOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-xs font-semibold border border-slate-200 hover:border-teal-200 transition-colors shrink-0"
                            title="Edit Specialist"
                          >
                            <Pencil className="w-3.5 h-3.5 text-teal-600" />
                            <span>Edit</span>
                          </button>
                        </div>

                        {d.department && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>{d.department.name}</span>
                          </div>
                        )}

                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Operational Status</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Roster
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Patient Quota</span>
                            <span className="font-bold text-slate-800">{d.daily_capacity || 15} Patients</span>
                          </div>
                        </div>

                        {(() => {
                          const dutyDaysList = getDoctorDutyDaysDisplay(d);
                          if (!dutyDaysList || dutyDaysList.length === 0) return null;
                          return (
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Duty Days</span>
                              <div className="flex flex-wrap gap-1">
                                {dutyDaysList.map((day) => (
                                  <span
                                    key={day}
                                    className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/70 text-[11px] font-bold"
                                  >
                                    {day}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium">
                          {d.department?.name || 'Specialist Outpatient'}
                        </span>
                        {(() => {
                          const billing = getDoctorBillingCategory(d);
                          return (
                            <span className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${billing.badgeClass}`}>
                              {billing.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submodule: Clinical Departments */}
          {activeSubmodule === 'registry-departments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Clinical Departments & Specialist Units ({filteredDepts.length})
                  </h1>
                  <p className="text-xs text-slate-500">
                    Hospital clinical divisions, active consultation units, and resident medical staff allocation.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search departments..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 shadow-xs"
                    />
                  </div>
                  <button
                    onClick={() => setIsNewDeptOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Department
                  </button>
                </div>
              </div>

              {filteredDepts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No clinical departments match your search.</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting search or add a department above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDepts.map((dept) => {
                    const specialistCount = doctors.filter((d) => d.department_id === dept.id).length;
                    return (
                      <div
                        key={dept.id}
                        className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {dept.code}
                              </span>
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setSelectedDeptToEdit(dept);
                                      setIsEditDeptOpen(true);
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                    title="Edit Department"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleInitiateDeleteDepartment(dept)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete Department"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="text-slate-400 font-medium">Attending Medical Officers:</span>
                          <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                            {specialistCount} {specialistCount === 1 ? 'Specialist' : 'Specialists'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 5: STAFF & ADMINISTRATION
          ========================================================================= */}
          {activeSubmodule === 'admin-staff' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Hospital Staff Accounts Directory ({filteredStaffUsers.length})
                  </h1>
                  <p className="text-xs text-slate-500">
                    Manage certified hospital personnel across reception, insurance, cashier, medical, and administrative units.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search staff accounts..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 shadow-xs"
                    />
                  </div>
                  <button
                    onClick={() => setIsNewStaffOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add New Staff Member
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-4 px-6 min-w-[220px]">Staff Member</th>
                        <th className="py-4 px-6 min-w-[200px]">Email</th>
                        <th className="py-4 px-6 min-w-[160px]">Assigned Desk</th>
                        <th className="py-4 px-6 min-w-[170px]">System Role</th>
                        <th className="py-4 px-6 min-w-[120px]">Account Status</th>
                        {isAdmin && <th className="py-4 px-6 text-right min-w-[90px]">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStaffUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 px-6 text-center text-slate-400">
                            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-semibold text-slate-600">No staff accounts found.</p>
                            <p className="text-[11px] mt-1 text-slate-400">
                              Try adjusting your search query or register a new staff member.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredStaffUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/90 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                  {getStaffInitials(u.name)}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 text-xs block whitespace-nowrap">
                                    {u.name}
                                  </span>
                                  {u.phone && (
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      {u.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-600 text-xs whitespace-nowrap">
                              {u.email}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-800 text-xs whitespace-nowrap block capitalize">
                                {u.desk || 'General Desk'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 whitespace-nowrap shadow-2xs">
                                {typeof u.role === 'object' && u.role ? (u.role as any).name : (u.role || 'Staff')}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                                  u.status !== false
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    u.status !== false ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                ></span>
                                {u.status !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setSelectedStaffToEdit(u);
                                    setIsEditStaffOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 font-bold text-xs border border-slate-200 hover:border-teal-300 shadow-2xs transition-all active:scale-95"
                                  title="Edit Staff Member"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                                  <span>Edit</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Submodule: Roles & Permissions */}
          {activeSubmodule === 'admin-roles' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Desk Roles & Access Control Matrices ({roles.length > 0 ? roles.length : 5})
                  </h1>
                  <p className="text-xs text-slate-500">
                    Define operational desk privileges, assign allowed workstations, and govern role access.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewRoleOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New Role
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(roles.length > 0
                  ? roles
                  : ([
                      {
                        id: 1,
                        name: 'Hospital Administrator',
                        slug: 'super-admin',
                        primary_desk: 'admin',
                        description:
                          'Full administrative governance, staff creation, clinic config, and executive intelligence access.',
                        allowed_desks: ['admin', 'helpdesk', 'hmo', 'cashdesk', 'doctor'],
                        assigned_modules: ['clinical-triage', 'hmo-insurance', 'finance-billing', 'clinic-registry', 'administration', 'executive-intelligence', 'hospital-settings'],
                        is_system_role: true,
                        status: true,
                      },
                      {
                        id: 2,
                        name: 'Helpdesk Officer',
                        slug: 'helpdesk-officer',
                        primary_desk: 'helpdesk',
                        description:
                          'Front-desk patient intake, ticket reference barcode lookup, and clinical triage check-in.',
                        allowed_desks: ['helpdesk'],
                        assigned_modules: ['clinical-triage', 'clinic-registry'],
                        is_system_role: true,
                        status: true,
                      },
                      {
                        id: 3,
                        name: 'HMO Clearance Officer',
                        slug: 'hmo-officer',
                        primary_desk: 'hmo',
                        description:
                          'Insurance pre-authorizations, policy verification, approval codes, and cashdesk rerouting.',
                        allowed_desks: ['hmo'],
                        assigned_modules: ['hmo-insurance'],
                        is_system_role: true,
                        status: true,
                      },
                      {
                        id: 4,
                        name: 'Cashier / Billing Teller',
                        slug: 'cashdesk-officer',
                        primary_desk: 'cashdesk',
                        description:
                          'Consultation fee settlement, POS card transactions, and receipt voucher issuance.',
                        allowed_desks: ['cashdesk'],
                        assigned_modules: ['finance-billing'],
                        is_system_role: true,
                        status: true,
                      },
                      {
                        id: 5,
                        name: 'Consulting Doctor',
                        slug: 'consulting-doctor',
                        primary_desk: 'doctor',
                        description:
                          'Patient consultation records, queue attendance, and electronic health notes.',
                        allowed_desks: ['doctor'],
                        assigned_modules: ['clinical-triage', 'clinic-registry'],
                        is_system_role: true,
                        status: true,
                      },
                    ] as Role[])
                ).map((r: Role) => (
                  <div
                    key={r.id || r.name}
                    onClick={() => {
                      setSelectedRoleToEdit(r);
                      setIsEditRoleOpen(true);
                    }}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-500 shadow-2xs hover:shadow-md hover:bg-slate-50/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                    title={`Click to edit ${r.name}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100/80 group-hover:bg-teal-600 group-hover:text-white text-teal-700 flex items-center justify-center transition-all shrink-0 shadow-2xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-slate-900 text-sm tracking-tight group-hover:text-teal-700 transition-colors truncate">
                        {r.name}
                      </h3>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-teal-100/70 text-slate-400 group-hover:text-teal-700 transition-colors shrink-0" title="Configure Role">
                      <Pencil className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              MODULE 6: EXECUTIVE AI INTELLIGENCE
          ========================================================================= */}
          {activeSubmodule === 'analytics-kpis' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Executive Operational KPIs & Clinical Volume
                  </h1>
                  <p className="text-xs text-slate-500">
                    Real-time operational indicators, throughput, queue volume, and patient intake distribution.
                  </p>
                </div>
              </div>

              {analytics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Bookings</span>
                    <div className="text-3xl font-black text-slate-900">{analytics.total_bookings}</div>
                    <p className="text-[11px] text-teal-600 font-semibold">
                      {analytics.today_bookings} scheduled for today
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">Checked In Patients</span>
                    <div className="text-3xl font-black text-emerald-600">{analytics.checked_in_today}</div>
                    <p className="text-[11px] text-slate-500">Currently in triage / consulting</p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">Pending HMO Clearances</span>
                    <div className="text-3xl font-black text-amber-600">{analytics.pending_hmo_approvals}</div>
                    <p className="text-[11px] text-slate-500">Awaiting insurance pre-auth codes</p>
                  </div>
                </div>
              )}

              {analytics?.departments_breakdown && analytics.departments_breakdown.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Department Consultation Volume</h3>
                  <div className="space-y-3">
                    {analytics.departments_breakdown.map((dept) => (
                      <div key={dept.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">{dept.name}</span>
                          <span className="text-teal-700">{dept.count} consultations</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(10, (dept.count / (analytics.total_bookings || 1)) * 100)
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submodule: AI Operational Synthesis */}
          {activeSubmodule === 'analytics-ai' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    AI Clinical Operational Synthesis
                  </h1>
                  <p className="text-xs text-slate-500">
                    Harness generative AI to analyze clinic wait times, identify throughput bottlenecks, and recommend staffing optimizations.
                  </p>
                </div>

                <button
                  onClick={handleGenerateAiReport}
                  disabled={loadingAi}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingAi ? 'Synthesizing Analysis...' : 'Generate New AI Synthesis'}
                </button>
              </div>

              {aiReport ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-sm border-b border-slate-100 pb-3">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span>Isalu Hospitals • Executive Clinical Intelligence Briefing</span>
                  </div>
                  <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-700">
                    {aiReport}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs text-center space-y-3 max-w-md mx-auto">
                  <Sparkles className="w-10 h-10 text-teal-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-sm">No Report Generated Yet</h3>
                  <p className="text-xs text-slate-500">
                    Click the button above to generate a comprehensive AI operational report based on real-time booking, HMO, and cashier data.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              MODULE 7: HOSPITAL SETTINGS & PROFILE
          ========================================================================= */}
          {activeSubmodule === 'settings-hospital' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Hospital Facility Profile & Operations
                </h1>
                <p className="text-xs text-slate-500">
                  Accreditation credentials, facility locations, emergency contacts, and active portal environment details.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <Hospital className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-sm text-slate-900">Headquarters & Facility Info</h3>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Institution:</span>
                      <span className="font-bold text-slate-900">Isalu Hospitals Limited</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Physical Address:</span>
                      <span className="font-medium text-slate-800">No. 46, Ijaiye Road, Ogba, Ikeja, Lagos</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Emergency Desk:</span>
                      <span className="font-mono font-bold text-teal-700">+234 800 47258 2273</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Accreditations:</span>
                      <span className="font-semibold text-emerald-700">HEFAMAA / NHIA Certified</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Operating Hours:</span>
                      <span className="font-medium text-slate-800">24 Hours / 7 Days a Week</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-sm text-slate-900">System & Session Telemetry</h3>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Authenticated Staff:</span>
                      <span className="font-bold text-slate-900">{currentUser.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Assigned Desk:</span>
                      <span className="font-mono text-teal-800 font-bold capitalize">{currentUser.desk}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">System Role:</span>
                      <span className="font-semibold text-slate-800">{currentUser.role}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Portal Version:</span>
                      <span className="font-mono text-slate-700">v2.4.0 Enterprise</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Backend API Status:</span>
                      <span className="font-bold text-emerald-600">Online & Synchronized</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS & DIALOGS
      ========================================================================= */}
      {/* 1. HMO Authorization Modal */}
      {selectedBookingForHmo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Grant HMO Authorization</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Patient: <strong className="text-slate-800">{selectedBookingForHmo.patient_name}</strong> •{' '}
                {selectedBookingForHmo.hmo_name} ({selectedBookingForHmo.hmo_policy_code})
              </p>
            </div>

            <form onSubmit={handleApproveHmo} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Official Pre-Auth Approval Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AUTH-HYG-98421"
                  value={authCodeInput}
                  onChange={(e) => setAuthCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm uppercase tracking-wider font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForHmo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-sm shadow-teal-600/20"
                >
                  Confirm & Clear Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1b. HMO Decline & Reroute to Cashdesk Confirmation Modal */}
      {bookingToReroute && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 border-b border-slate-100 pb-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Send Booking to Cashdesk?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm declining HMO clearance and rerouting for cashdesk payment.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <strong className="text-slate-900">{bookingToReroute.patient_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket Ref:</span>
                <span className="font-mono font-bold text-teal-700">{bookingToReroute.reference_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialist:</span>
                <span className="text-slate-800 font-semibold">{formatDoctorName(bookingToReroute.doctor_name)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">HMO Provider:</span>
                <span className="text-slate-800 font-medium">
                  {bookingToReroute.hmo_name || bookingToReroute.hmo_company?.name || 'HMO Insurance'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              Do you want to send this booking to Cashdesk for payment? The patient will be converted to private self-pay billing and routed to the cashier settlement queue.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingToReroute(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRerouteToCashdesk}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm shadow-amber-600/20 transition-all active:scale-95"
              >
                Yes, Send to Cashdesk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cashdesk Payment Settlement Modal */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Clear Patient for Payment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Patient: <strong className="text-slate-800">{selectedBookingForPayment.patient_name}</strong> •{' '}
                Ticket: <span className="font-mono text-teal-700">{selectedBookingForPayment.reference_code}</span>
              </p>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px] leading-relaxed">
                Confirming will clear this patient’s payment status and authorize them for clinical consultation queueing.
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Clearance Instrument</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                >
                  <option value="POS / Card">POS Terminal / Debit Card</option>
                  <option value="Cash">Cash at Teller</option>
                  <option value="Direct Bank Transfer">Direct Bank Transfer / USSD</option>
                  <option value="Direct Cashdesk Clearance">Direct Cashdesk Clearance</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPayment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-sm shadow-teal-600/20"
                >
                  Confirm & Clear Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Official Printable Receipt Modal */}
      <ReceiptModal booking={receiptBooking} onClose={() => setReceiptBooking(null)} />

      {/* 4. New Staff Account Creation Modal */}
      <NewStaffModal
        isOpen={isNewStaffOpen}
        onClose={() => setIsNewStaffOpen(false)}
        roles={roles}
        onStaffCreated={(newStaff) => {
          const roleName =
            typeof newStaff.role === 'object' && newStaff.role
              ? ((newStaff.role as unknown) as { name?: string }).name || 'Staff'
              : String(newStaff.role || 'Staff');
          const normalizedStaff: StaffUser = {
            ...newStaff,
            role: roleName,
          };
          setStaffUsers((prev) => [...prev, normalizedStaff]);
          setActionSuccess(`Staff account created for ${normalizedStaff.name} (${roleName})`);
        }}
      />

      {/* 4b. Edit Staff Account Modal */}
      <EditStaffModal
        isOpen={isEditStaffOpen}
        onClose={() => {
          setIsEditStaffOpen(false);
          setSelectedStaffToEdit(null);
        }}
        staff={selectedStaffToEdit}
        roles={roles}
        onStaffUpdated={(updated) => {
          const roleName =
            typeof updated.role === 'object' && updated.role
              ? ((updated.role as unknown) as { name?: string }).name || 'Staff'
              : String(updated.role || 'Staff');
          const normalizedStaff: StaffUser = {
            ...updated,
            role: roleName,
          };
          setStaffUsers((prev) =>
            prev.map((s) => (s.id === normalizedStaff.id ? normalizedStaff : s))
          );
          setActionSuccess(`Staff account "${normalizedStaff.name}" updated successfully.`);
        }}
      />

      {/* 5. Fast Walk-in Patient Intake Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        doctors={doctors}
        hmoCompanies={hmoCompanies}
        onBookingCreated={(newBooking) => {
          setActionSuccess(
            `Walk-in patient checked in successfully. Ticket: ${newBooking.reference_code}`
          );
          fetchData();
        }}
      />

      {/* 6. Add New Role Modal */}
      <NewRoleModal
        isOpen={isNewRoleOpen}
        onClose={() => setIsNewRoleOpen(false)}
        onRoleCreated={(newRole) => {
          setRoles((prev) => [...prev, newRole]);
          setActionSuccess(`Role "${newRole.name}" created and registered successfully.`);
        }}
      />

      {/* 7. New Specialist Modal */}
      <NewDoctorModal
        isOpen={isNewDoctorOpen}
        onClose={() => setIsNewDoctorOpen(false)}
        departments={departments}
        onDoctorCreated={(newDoc) => {
          setDoctors((prev) => [...prev, newDoc]);
          setActionSuccess(`Specialist "${formatDoctorName(newDoc)}" added to clinical registry.`);
        }}
      />

      {/* 7b. Edit Specialist Modal */}
      <EditDoctorModal
        isOpen={isEditDoctorOpen}
        onClose={() => {
          setIsEditDoctorOpen(false);
          setSelectedDoctorToEdit(null);
        }}
        doctor={selectedDoctorToEdit}
        departments={departments}
        onDoctorUpdated={(updated) => {
          setDoctors((prev) =>
            prev.map((doc) => (doc.id === updated.id ? updated : doc))
          );
          setActionSuccess(`Specialist "${formatDoctorName(updated)}" updated successfully.`);
        }}
      />

      {/* 8. New Department Modal */}
      <NewDepartmentModal
        isOpen={isNewDeptOpen}
        onClose={() => setIsNewDeptOpen(false)}
        onDepartmentCreated={(newDept) => {
          setDepartments((prev) => [...prev, newDept]);
          setActionSuccess(`Clinical department "${newDept.name}" created successfully.`);
        }}
      />

      {/* 8b. Delete Department Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Clinical Department
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete the clinical department{' '}
                  <span className="font-semibold text-slate-800">
                    &quot;{deptToDelete.name}&quot;
                  </span>
                  {deptToDelete.code ? (
                    <>
                      {' '}
                      (
                      <span className="font-mono text-xs font-bold text-slate-600">
                        {deptToDelete.code}
                      </span>
                      )
                    </>
                  ) : null}
                  ?
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-normal">
                This action is permanent and cannot be undone. Specialists and duty schedules assigned to this unit may also be affected.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => !isDeletingDept && setDeptToDelete(null)}
                disabled={isDeletingDept}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDepartment}
                disabled={isDeletingDept}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingDept ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Department</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8c. Edit Department Modal */}
      <EditDepartmentModal
        isOpen={isEditDeptOpen}
        onClose={() => {
          setIsEditDeptOpen(false);
          setSelectedDeptToEdit(null);
        }}
        department={selectedDeptToEdit}
        onDepartmentUpdated={(updated) => {
          setDepartments((prev) =>
            prev.map((d) => (d.id === updated.id ? updated : d))
          );
          setActionSuccess(`Clinical department "${updated.name}" updated successfully.`);
        }}
      />

      {/* 8d. New HMO Provider Modal */}
      <NewHmoModal
        isOpen={isNewHmoOpen}
        onClose={() => setIsNewHmoOpen(false)}
        onHmoCreated={(newHmo) => {
          setHmoCompanies((prev) => [...prev, newHmo]);
          setActionSuccess(`HMO provider "${newHmo.name}" accredited successfully.`);
        }}
      />

      {/* 8e. Edit HMO Provider Modal */}
      <EditHmoModal
        isOpen={isEditHmoOpen}
        onClose={() => {
          setIsEditHmoOpen(false);
          setSelectedHmoToEdit(null);
        }}
        hmo={selectedHmoToEdit}
        onHmoUpdated={(updated) => {
          setHmoCompanies((prev) =>
            prev.map((h) => (h.id === updated.id ? updated : h))
          );
          setActionSuccess(`HMO provider "${updated.name}" updated successfully.`);
        }}
      />

      {/* 8f. Edit Role & Module Privileges Modal */}
      <EditRoleModal
        isOpen={isEditRoleOpen}
        onClose={() => {
          setIsEditRoleOpen(false);
          setSelectedRoleToEdit(null);
        }}
        role={selectedRoleToEdit}
        onRoleUpdated={(updated) => {
          setRoles((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          // Also update currentUser in state and session storage if current user has this role!
          if (currentUser && currentUser.role_id === updated.id) {
            const updatedUser = {
              ...currentUser,
              assigned_modules: updated.assigned_modules,
              role_data: updated,
            };
            setCurrentUser(updatedUser);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('isalu_staff_user', JSON.stringify(updatedUser));
            }
          }
          setActionSuccess(`Role "${updated.name}" permissions and module assignments updated.`);
        }}
      />

      {/* 8g. Staff Reschedule Consultation Modal */}
      <RescheduleModal
        booking={selectedBookingForReschedule}
        isOpen={Boolean(selectedBookingForReschedule)}
        onClose={() => setSelectedBookingForReschedule(null)}
        onRescheduled={(updated) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          );
          setActionSuccess(
            `Appointment for ${updated.patient_name} (${updated.reference_code}) successfully rescheduled to ${updated.date || updated.appointment_date} at ${updated.time || updated.appointment_time}.`
          );
        }}
      />
    </div>
  );
}
