// src/components/dashboard/EditStaffModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { updateStaffUser, getRoles } from '@/lib/api';
import { StaffUser, Role } from '@/lib/types';
import {
  X,
  Pencil,
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

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser | null;
  roles?: Role[];
  onStaffUpdated: (updatedStaff: StaffUser) => void;
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

export default function EditStaffModal({
  isOpen,
  onClose,
  staff,
  roles: initialRoles,
  onStaffUpdated,
}: EditStaffModalProps) {
  const [dbRoles, setDbRoles] = useState<Role[]>(initialRoles || []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>('');
  const [status, setStatus] = useState(true);
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

  // Populate form fields when staff or isOpen changes
  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setEmail(staff.email || '');
      setPhone(staff.phone || '');
      setPassword('');
      setStatus(staff.status !== false);
      setError(null);

      if (staff.role_id) {
        setSelectedRoleId(staff.role_id);
      } else if (staff.role && dbRoles.length > 0) {
        const matched = dbRoles.find(
          (r) =>
            r.name.toLowerCase() === staff.role.toLowerCase() ||
            r.slug.toLowerCase() === staff.role.toLowerCase()
        );
        if (matched) {
          setSelectedRoleId(matched.id);
        }
      }
    }
  }, [staff, isOpen, dbRoles]);

  if (!isOpen || !staff) return null;

  const activeRoleObj = dbRoles.find((r) => String(r.id) === String(selectedRoleId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the staff member name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter an official email.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: Partial<StaffUser> & { password?: string } = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role: activeRoleObj?.name || (typeof staff.role === 'string' ? staff.role : undefined),
        role_id: activeRoleObj?.id ? Number(activeRoleObj.id) : undefined,
        desk: activeRoleObj?.primary_desk || staff.desk || 'helpdesk',
        status,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const updated = await updateStaffUser(staff.id, payload);
      onStaffUpdated(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update staff member.');
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Edit Hospital Staff Account</span>
                <Pencil className="w-3 h-3 text-slate-400" />
              </h3>
              <p className="text-[11px] text-slate-500">
                Update account details, access role, or workstation desk
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
          {/* 2-Column Grid for Details */}
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

            {/* Password Update (Optional) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Reset Password <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Leave blank to keep current"
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

          {/* Account Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Account Status</span>
              <span className="text-[11px] text-slate-500">
                Allow user to log in and access system workstations
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
