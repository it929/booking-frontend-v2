// src/components/dashboard/DashboardSidebar.tsx
'use client';

import React, { useState } from 'react';
import { StaffUser } from '@/lib/types';
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
  Sparkles,
  Receipt,
  FileCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  PlusCircle,
  Clock,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Hospital,
  CheckCircle2
} from 'lucide-react';
import IsaluLogo from '@/components/IsaluLogo';

export type SubmoduleId =
  | 'triage-queue'
  | 'triage-completed'
  | 'triage-tv'
  | 'triage-walkin'
  | 'hmo-approvals'
  | 'hmo-partners'
  | 'hmo-reroutes'
  | 'finance-invoices'
  | 'finance-receipts'
  | 'finance-summary'
  | 'registry-specialists'
  | 'registry-departments'
  | 'admin-staff'
  | 'admin-roles'
  | 'analytics-kpis'
  | 'analytics-ai'
  | 'settings-hospital';

interface NavModule {
  id: string;
  title: string;
  icon: React.ElementType;
  allowedRoles?: string[];
  badge?: number;
  submodules: {
    id: SubmoduleId;
    title: string;
    icon: React.ElementType;
    allowedRoles?: string[];
    badge?: number;
  }[];
}

interface DashboardSidebarProps {
  currentUser: StaffUser;
  activeSubmodule: SubmoduleId;
  onSelectSubmodule: (id: SubmoduleId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  badges: {
    pendingHmo?: number;
    waitingTriage?: number;
    pendingBilling?: number;
    completedCount?: number;
  };
}

export default function DashboardSidebar({
  currentUser,
  activeSubmodule,
  onSelectSubmodule,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  badges,
}: DashboardSidebarProps) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    'clinical-triage': true,
    'hmo-insurance': true,
    'finance-billing': true,
    'clinic-registry': false,
    'administration': false,
    'executive-intelligence': true,
    'hospital-settings': false,
  });

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const navModules: NavModule[] = [
    {
      id: 'clinical-triage',
      title: 'Triage & Queue',
      icon: UserCheck,
      allowedRoles: ['helpdesk', 'doctor', 'monitor', 'reception', 'clinic'],
      badge: badges.waitingTriage,
      submodules: [
        { id: 'triage-queue', title: 'Arrivals & Check-in', icon: UserCheck, badge: badges.waitingTriage },
        { id: 'triage-completed', title: 'Completed Bookings', icon: CheckCircle2, badge: badges.completedCount },
        { id: 'triage-tv', title: 'Waiting Room TV Board', icon: Tv },
        { id: 'triage-walkin', title: 'Walk-in Intake Form', icon: PlusCircle, allowedRoles: ['helpdesk', 'doctor', 'reception', 'admin'] },
      ],
    },
    {
      id: 'hmo-insurance',
      title: 'HMO & Insurers',
      icon: ShieldCheck,
      allowedRoles: ['hmo', 'insurance'],
      badge: badges.pendingHmo,
      submodules: [
        { id: 'hmo-approvals', title: 'Pre-Auth Clearances', icon: FileCheck, badge: badges.pendingHmo },
        { id: 'hmo-partners', title: 'HMO Providers & Codes', icon: ShieldCheck },
        { id: 'hmo-reroutes', title: 'Declined / Rerouted', icon: ShieldAlert },
      ],
    },
    {
      id: 'finance-billing',
      title: 'Finance & Cashdesk',
      icon: CreditCard,
      allowedRoles: ['cashdesk', 'cashier', 'billing', 'finance'],
      badge: badges.pendingBilling,
      submodules: [
        { id: 'finance-invoices', title: 'Invoices & POS Settlement', icon: CreditCard, badge: badges.pendingBilling },
        { id: 'finance-receipts', title: 'Issued Receipts History', icon: Receipt },
        { id: 'finance-summary', title: 'Revenue Breakdown', icon: BarChart3 },
      ],
    },
    {
      id: 'clinic-registry',
      title: 'Clinical Registry',
      icon: Building2,
      allowedRoles: ['helpdesk', 'doctor', 'reception', 'clinic'],
      submodules: [
        { id: 'registry-specialists', title: 'Specialists Roster', icon: Stethoscope },
        { id: 'registry-departments', title: 'Clinical Departments', icon: Building2 },
      ],
    },
    {
      id: 'administration',
      title: 'Staff & Security',
      icon: Users,
      allowedRoles: ['admin'],
      submodules: [
        { id: 'admin-staff', title: 'Staff Accounts Directory', icon: Users },
        { id: 'admin-roles', title: 'Desk Roles & Access', icon: Settings },
      ],
    },
    {
      id: 'executive-intelligence',
      title: 'Executive AI Insights',
      icon: Sparkles,
      allowedRoles: ['admin', 'analytics'],
      submodules: [
        { id: 'analytics-kpis', title: 'Throughput & Volume', icon: BarChart3 },
        { id: 'analytics-ai', title: 'AI Operational Synthesis', icon: Sparkles },
      ],
    },
    {
      id: 'hospital-settings',
      title: 'Facility Settings',
      icon: Settings,
      allowedRoles: ['admin'],
      submodules: [
        { id: 'settings-hospital', title: 'Hospital Profile & Info', icon: Hospital },
      ],
    },
  ];

  // Role-driven sidebar module filtering from database roles table
  const userDesk = (currentUser.desk || '').toLowerCase();
  const userRole = (currentUser.role || '').toLowerCase();
  const isAdmin =
    currentUser.is_superuser === true ||
    userRole.includes('admin') ||
    userRole.includes('super') ||
    userDesk.includes('admin') ||
    userDesk.includes('all');

  const userAssignedModules =
    currentUser.assigned_modules ||
    currentUser.role_data?.assigned_modules;

  const checkModuleAccess = (modId: string, allowedRoles?: string[]) => {
    if (isAdmin) return true;

    // 1. Primary check: Exact module assignment from database roles table
    if (userAssignedModules && Array.isArray(userAssignedModules) && userAssignedModules.length > 0) {
      return userAssignedModules.includes(modId);
    }

    // 2. Fallback check: Role and desk matching
    if (!allowedRoles || allowedRoles.length === 0) return false;

    return allowedRoles.some(
      (target) =>
        userDesk.includes(target) ||
        userRole.includes(target) ||
        (currentUser.allowed_desks &&
          currentUser.allowed_desks.some((d) => d.toLowerCase().includes(target)))
    );
  };

  const checkSubmoduleAccess = (subAllowedRoles?: string[]) => {
    if (isAdmin) return true;
    if (!subAllowedRoles || subAllowedRoles.length === 0) return true;

    return subAllowedRoles.some(
      (target) =>
        userDesk.includes(target) ||
        userRole.includes(target) ||
        (currentUser.allowed_desks &&
          currentUser.allowed_desks.some((d) => d.toLowerCase().includes(target)))
    );
  };

  const visibleNavModules = navModules
    .filter((mod) => checkModuleAccess(mod.id, mod.allowedRoles))
    .map((mod) => ({
      ...mod,
      submodules: mod.submodules.filter((sub) => checkSubmoduleAccess(sub.allowedRoles)),
    }))
    .filter((mod) => mod.submodules.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80">
        <div className="flex items-center gap-3 overflow-hidden">
          {isCollapsed ? (
            <IsaluLogo variant="icon" size="sm" />
          ) : (
            <IsaluLogo variant="full" theme="dark" size="sm" />
          )}
        </div>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Current Staff Card */}
      {!isCollapsed ? (
        <div className="p-3 mx-3 my-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/30 text-teal-300 font-bold flex items-center justify-center text-sm">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded-md bg-teal-950 border border-teal-800/60 text-[10px] font-semibold text-teal-300 capitalize">
                  {currentUser.role || 'Staff'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  • {currentUser.desk || 'General Desk'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 flex justify-center border-b border-slate-800/80">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-500/30 text-teal-300 font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>
        </div>
      )}

      {/* Navigation Modules */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {visibleNavModules.map((module) => {
          const ModuleIcon = module.icon;
          const isOpen = openModules[module.id] ?? false;
          const hasActiveSub = module.submodules.some((s) => s.id === activeSubmodule);

          if (isCollapsed) {
            return (
              <div key={module.id} className="relative group">
                <button
                  onClick={() => {
                    onSelectSubmodule(module.submodules[0].id);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-center transition-all ${
                    hasActiveSub
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title={module.title}
                >
                  <ModuleIcon className="w-5 h-5" />
                  {module.badge && module.badge > 0 ? (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400"></span>
                  ) : null}
                </button>
              </div>
            );
          }

          return (
            <div key={module.id} className="rounded-xl overflow-hidden">
              {/* Module Header Button */}
              <button
                onClick={() => toggleModule(module.id)}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all ${
                  hasActiveSub
                    ? 'text-white bg-slate-900/90 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ModuleIcon
                    className={`w-4 h-4 shrink-0 ${
                      hasActiveSub ? 'text-teal-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate tracking-wide">{module.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {module.badge && module.badge > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {module.badge}
                    </span>
                  ) : null}
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Submodules list */}
              {isOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-slate-800/80 space-y-1 py-0.5">
                  {module.submodules.map((sub) => {
                    const SubIcon = sub.icon;
                    const isActive = activeSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onSelectSubmodule(sub.id);
                          onCloseMobile();
                        }}
                        className={`w-full px-3 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold shadow-sm shadow-teal-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{sub.title}</span>
                        </div>

                        {sub.badge && sub.badge > 0 ? (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-teal-300'
                            }`}
                          >
                            {sub.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" /> 24/7 Hotline
            </span>
            <span className="font-mono text-slate-300 font-semibold">Ext. 200</span>
          </div>
        )}

        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-900/40 transition-colors ${
            isCollapsed ? 'p-2' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out Portal</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
