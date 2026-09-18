// src/components/dashboard/DashboardTopbar.tsx
'use client';

import React, { useState } from 'react';
import { StaffUser } from '@/lib/types';
import { SubmoduleId } from './DashboardSidebar';
import {
  Menu,
  Search,
  RefreshCw,
  Plus,
  Tv,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  UserCheck,
  LogOut,
  X
} from 'lucide-react';

interface DashboardTopbarProps {
  currentUser: StaffUser;
  activeSubmodule: SubmoduleId;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileSidebar: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenWalkinModal: () => void;
  onSelectSubmodule: (id: SubmoduleId) => void;
  onLogout: () => void;
  notifications: {
    pendingHmoCount: number;
    waitingTriageCount: number;
    pendingBillingCount: number;
  };
}

const submoduleBreadcrumbMap: Record<SubmoduleId, { module: string; sub: string }> = {
  'triage-queue': { module: 'Triage & Clinical Queue', sub: 'Arrivals & Check-in' },
  'triage-completed': { module: 'Triage & Clinical Queue', sub: 'Completed Consultations' },
  'triage-tv': { module: 'Triage & Clinical Queue', sub: 'Waiting Room TV Board' },
  'triage-walkin': { module: 'Triage & Clinical Queue', sub: 'Walk-in Intake Form' },
  'hmo-approvals': { module: 'Insurance & HMO Desk', sub: 'Pre-Auth Clearances' },
  'hmo-partners': { module: 'Insurance & HMO Desk', sub: 'HMO Providers & Codes' },
  'hmo-reroutes': { module: 'Insurance & HMO Desk', sub: 'Declined / Rerouted' },
  'finance-invoices': { module: 'Finance & Cashdesk', sub: 'Invoices & POS Settlement' },
  'finance-receipts': { module: 'Finance & Cashdesk', sub: 'Issued Receipts History' },
  'finance-summary': { module: 'Finance & Cashdesk', sub: 'Revenue Breakdown' },
  'registry-specialists': { module: 'Clinical Registry', sub: 'Specialists Roster' },
  'registry-departments': { module: 'Clinical Registry', sub: 'Clinical Departments' },
  'admin-staff': { module: 'Staff Administration', sub: 'User Accounts Directory' },
  'admin-roles': { module: 'Staff Administration', sub: 'Desk Roles & Access' },
  'analytics-kpis': { module: 'Executive AI Intelligence', sub: 'Clinical Volume & KPIs' },
  'analytics-ai': { module: 'Executive AI Intelligence', sub: 'AI Operational Synthesis' },
  'settings-hospital': { module: 'Hospital Profile', sub: 'Facilities & Operating Info' },
};

export default function DashboardTopbar({
  currentUser,
  activeSubmodule,
  searchQuery,
  onSearchChange,
  onOpenMobileSidebar,
  onRefresh,
  isRefreshing,
  onOpenWalkinModal,
  onSelectSubmodule,
  onLogout,
  notifications,
}: DashboardTopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const breadcrumb = submoduleBreadcrumbMap[activeSubmodule] || {
    module: 'Clinical Desk',
    sub: 'Dashboard',
  };

  const userDesk = (currentUser?.desk || '').toLowerCase();
  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdmin =
    currentUser?.is_superuser === true ||
    userRole.includes('admin') ||
    userRole.includes('super') ||
    userDesk.includes('admin') ||
    userDesk.includes('all');

  const canAccessTriage =
    isAdmin ||
    userDesk.includes('helpdesk') ||
    userDesk.includes('monitor') ||
    userDesk.includes('reception') ||
    userRole.includes('helpdesk') ||
    userRole.includes('monitor') ||
    userRole.includes('doctor') ||
    (currentUser?.allowed_desks &&
      currentUser.allowed_desks.some((d) => {
        const dl = d.toLowerCase();
        return dl.includes('helpdesk') || dl.includes('monitor') || dl.includes('checked_in_patients');
      }));

  const canAccessHmo =
    isAdmin ||
    userDesk.includes('hmo') ||
    userRole.includes('hmo') ||
    (currentUser?.allowed_desks &&
      currentUser.allowed_desks.some((d) => d.toLowerCase().includes('hmo')));

  const canAccessBilling =
    isAdmin ||
    userDesk.includes('cash') ||
    userDesk.includes('billing') ||
    userRole.includes('cash') ||
    userRole.includes('billing') ||
    (currentUser?.allowed_desks &&
      currentUser.allowed_desks.some((d) => {
        const dl = d.toLowerCase();
        return dl.includes('cash') || dl.includes('billing');
      }));

  const canCreateIntake =
    isAdmin ||
    userDesk.includes('helpdesk') ||
    userRole.includes('helpdesk') ||
    (currentUser?.allowed_desks &&
      currentUser.allowed_desks.some((d) => d.toLowerCase().includes('helpdesk')));

  const pendingHmoCount = canAccessHmo ? (notifications.pendingHmoCount || 0) : 0;
  const waitingTriageCount = canAccessTriage ? (notifications.waitingTriageCount || 0) : 0;
  const pendingBillingCount = canAccessBilling ? (notifications.pendingBillingCount || 0) : 0;

  const totalAlerts = pendingHmoCount + waitingTriageCount + pendingBillingCount;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
            <span className="text-teal-700 font-semibold">{breadcrumb.module}</span>
            <span>/</span>
            <span className="text-slate-700 font-bold truncate">{breadcrumb.sub}</span>
          </div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient, ticket ref (e.g. ISL-), phone, or specialist..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live sync pill & refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          title="Refresh Data Now"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
          <span className="hidden xl:inline">Live Synced</span>
        </button>

        {/* Quick TV Board launcher (Triage / Monitor / Admin) */}
        {canAccessTriage && (
          <button
            onClick={() => onSelectSubmodule('triage-tv')}
            className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold"
            title="Open Waiting Room TV"
          >
            <Tv className="w-4 h-4 text-teal-600" />
            <span className="hidden xl:inline">TV Board</span>
          </button>
        )}

        {/* Quick New Booking Button (Helpdesk / Intake / Admin) */}
        {canCreateIntake && (
          <button
            onClick={onOpenWalkinModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Intake</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserDropdownOpen(false);
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            title="Desk Alerts & Notifications"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Notification Popover */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Hospital Desk Alerts</span>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  {totalAlerts} active
                </span>
              </div>

              <div className="p-2 space-y-1 text-xs">
                {pendingHmoCount > 0 && (
                  <button
                    onClick={() => {
                      onSelectSubmodule('hmo-approvals');
                      setNotificationsOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-amber-50/80 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {pendingHmoCount} HMO Approval{pendingHmoCount > 1 ? 's' : ''} Pending
                      </p>
                      <p className="text-[11px] text-slate-500">Enrollees awaiting Pre-Auth codes</p>
                    </div>
                  </button>
                )}

                {waitingTriageCount > 0 && (
                  <button
                    onClick={() => {
                      onSelectSubmodule('triage-queue');
                      setNotificationsOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-teal-50/80 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {waitingTriageCount} Patient{waitingTriageCount > 1 ? 's' : ''} in Consultation Queue
                      </p>
                      <p className="text-[11px] text-slate-500">Checked in and ready for doctor</p>
                    </div>
                  </button>
                )}

                {pendingBillingCount > 0 && (
                  <button
                    onClick={() => {
                      onSelectSubmodule('finance-invoices');
                      setNotificationsOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-50/80 text-left flex items-start gap-2.5 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {pendingBillingCount} Unpaid Private Invoice{pendingBillingCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-[11px] text-slate-500">Consultation fees awaiting cashier</p>
                    </div>
                  </button>
                )}

                {totalAlerts === 0 && (
                  <div className="py-6 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-700">All Queues Cleared</p>
                    <p className="text-[11px]">No urgent pending actions.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-teal-600 font-semibold block uppercase">
                {currentUser.role || 'Staff'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </button>

          {/* User Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-700 capitalize">
                  Desk: {currentUser.desk || 'General'}
                </div>
              </div>

              <div className="p-1 space-y-0.5 text-xs">
                <button
                  onClick={() => {
                    onSelectSubmodule('settings-hospital');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Facility Info
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
