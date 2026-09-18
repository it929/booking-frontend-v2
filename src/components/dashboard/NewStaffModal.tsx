// src/components/dashboard/NewStaffModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createStaffUser, getRoles } from '@/lib/api';
import { StaffUser, Role } from '@/lib/types';
import {
  X,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  ChevronDown,
  Tv,
  Stethoscope,
  CreditCard,
  FileText,
  Users,
  Loader2,
} from 'lucide-react';

interface NewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles?: Role[];
  onStaffCreated: (newStaff: StaffUser) => void;
}

const DESK_LABELS: Record<string, string> = {
  helpdesk: 'Helpdesk & Reception Queue',
  hmo: 'HMO Insurance Clearance Desk',
  cashdesk: 'Cashdesk Billing & Settlements',
  doctor: 'Doctor Consultation Desk',
  admin: 'Hospital Administration & Governance',
  monitor: 'Live Queue & Waiting Room Monitor Desk',
};

function getDeskIcon(desk?: string) {
  switch (desk) {
    case 'monitor':
      return <Tv className="w-3 h-3" />;
    case 'doctor':
      return <Stethoscope className="w-3 h-3" />;
    case 'cashdesk':
      return <CreditCard className="w-3 h-3" />;
    case 'hmo':
      return <FileText className="w-3 h-3" />;
    case 'admin':
      return <ShieldCheck className="w-3 h-3" />;
    default:
      return <Users className="w-3 h-3" />;
  }
}

export default function NewStaffModal({
  isOpen,
  onClose,
  roles: initialRoles,
  onStaffCreated,
}: NewStaffModalProps) {
  const [dbRoles, setDbRoles] = useState<Role[]>(initialRoles || []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync roles if passed or fetch dynamically from database
  useEffect(() => {
    if (initialRoles && initialRoles.length > 0) {
      setDbRoles(initialRoles);
    } else if (isOpen) {
      getRoles()
        .then((res) => {
          if (res && res.length > 0) {
            setDbRoles(res);
          }
        })
        .catch(() => null);
    }
  }, [initialRoles, isOpen]);

  // Set initial selected role when dbRoles load
  useEffect(() => {
    if (dbRoles.length > 0 && !selectedRoleId) {
      const defaultRole = dbRoles.find((r) => r.slug === 'helpdesk-officer') || dbRoles[0];
      if (defaultRole) {
        setSelectedRoleId(defaultRole.id);
      }
    }
  }, [dbRoles, selectedRoleId]);

  if (!isOpen) return null;

  const activeRoleObj = dbRoles.find((r) => String(r.id) === String(selectedRoleId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await createStaffUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        role: activeRoleObj?.name,
        role_id: activeRoleObj?.id ? Number(activeRoleObj.id) : undefined,
        desk: activeRoleObj?.primary_desk || 'helpdesk',
        is_staff: true,
        status: true,
      });
      onStaffCreated(created);
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create staff member.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">Add New Hospital Staff</h3>
              <p className="text-[11px] text-slate-500">
                Workstation & access modules are automatically assigned by role
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 2-Column Grid for Personal & Account Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurse Chioma Adebayo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Official Email */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Official Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. chioma.adebayo@isalu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none text-xs font-mono text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Initial Password */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none text-xs font-mono text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* System Role Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <span>Assigned System Role</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/80">
                {dbRoles.length} roles available
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none font-semibold text-xs text-slate-900 transition-all shadow-2xs appearance-none cursor-pointer"
              >
                {dbRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Automatic Role Access Preview Card */}
          {activeRoleObj && (
            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-teal-50/30 border border-teal-100/80 rounded-2xl space-y-1.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    Assigned Operating Desk
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200 text-[10px] font-bold capitalize flex items-center gap-1.5">
                  {getDeskIcon(activeRoleObj.primary_desk)}
                  <span>{activeRoleObj.primary_desk || 'General'}</span>
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {DESK_LABELS[activeRoleObj.primary_desk || ''] ||
                  (activeRoleObj.primary_desk
                    ? activeRoleObj.primary_desk.charAt(0).toUpperCase() +
                      activeRoleObj.primary_desk.slice(1) +
                      ' Desk'
                    : 'General Workstation')}
              </p>
              {activeRoleObj.description && (
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {activeRoleObj.description}
                </p>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Staff Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
