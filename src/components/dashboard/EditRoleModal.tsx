// src/components/dashboard/EditRoleModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { updateRole } from '@/lib/api';
import { Role } from '@/lib/types';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Save,
  Check,
  UserCheck,
  CreditCard,
  Building2,
  Users,
  Sparkles,
  Hospital,
  Layers,
  Laptop,
  CheckCircle2
} from 'lucide-react';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  onRoleUpdated: (updatedRole: Role) => void;
}

interface ModuleOption {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

const ALL_MODULES: ModuleOption[] = [
  {
    id: 'clinical-triage',
    name: 'Triage & Clinical Queue',
    category: 'Patient Flow',
    description: 'Arrivals, Reference barcode intake, queue triage & Waiting Room TV board',
    icon: UserCheck,
    accent: 'teal',
  },
  {
    id: 'hmo-insurance',
    name: 'HMO & Insurers Desk',
    category: 'Insurance',
    description: 'Pre-authorizations, HMO policy verification, eligibility & rerouting',
    icon: ShieldCheck,
    accent: 'amber',
  },
  {
    id: 'finance-billing',
    name: 'Finance & Cashdesk',
    category: 'Finance',
    description: 'POS payments, consultation invoicing, cash receipts & revenue reports',
    icon: CreditCard,
    accent: 'emerald',
  },
  {
    id: 'clinic-registry',
    name: 'Clinical Registry',
    category: 'Operations',
    description: 'Hospital specialty departments, consulting physicians & clinical rosters',
    icon: Building2,
    accent: 'blue',
  },
  {
    id: 'administration',
    name: 'Staff & Security',
    category: 'Governance',
    description: 'Staff account directory, user credentials, desk roles & privilege matrices',
    icon: Users,
    accent: 'purple',
  },
  {
    id: 'executive-intelligence',
    name: 'Executive AI Insights',
    category: 'Executive',
    description: 'Hospital volume throughput KPIs, wait-time analysis & AI synthesis',
    icon: Sparkles,
    accent: 'indigo',
  },
  {
    id: 'hospital-settings',
    name: 'Facility Settings',
    category: 'Setup',
    description: 'Hospital operating profile, facility contact info & system configurations',
    icon: Hospital,
    accent: 'slate',
  },
];

const AVAILABLE_DESKS = [
  { id: 'helpdesk', label: 'Helpdesk & Reception', icon: UserCheck },
  { id: 'hmo', label: 'HMO Clearance Desk', icon: ShieldCheck },
  { id: 'cashdesk', label: 'Cashdesk & Billing', icon: CreditCard },
  { id: 'doctor', label: 'Clinical Consultation', icon: Building2 },
  { id: 'admin', label: 'Administrator Governance', icon: Users },
];

export default function EditRoleModal({ isOpen, onClose, role, onRoleUpdated }: EditRoleModalProps) {
  const [name, setName] = useState('');
  const [primaryDesk, setPrimaryDesk] = useState('helpdesk');
  const [description, setDescription] = useState('');
  const [allowedDesks, setAllowedDesks] = useState<string[]>([]);
  const [assignedModules, setAssignedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setPrimaryDesk(role.primary_desk || 'helpdesk');
      setDescription(role.description || '');
      setAllowedDesks(role.allowed_desks || [role.primary_desk || 'helpdesk']);

      if (role.assigned_modules && role.assigned_modules.length > 0) {
        setAssignedModules(role.assigned_modules);
      } else if (role.primary_desk === 'cashdesk' || role.slug?.includes('cash')) {
        setAssignedModules(['finance-billing']);
      } else if (role.primary_desk === 'hmo' || role.slug?.includes('hmo')) {
        setAssignedModules(['hmo-insurance']);
      } else if (role.is_system_role && (role.slug === 'super-admin' || role.name.includes('Admin'))) {
        setAssignedModules(ALL_MODULES.map((m) => m.id));
      } else {
        setAssignedModules(['clinical-triage', 'clinic-registry']);
      }
      setError(null);
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const handleToggleDesk = (deskId: string) => {
    setAllowedDesks((prev) =>
      prev.includes(deskId) ? prev.filter((d) => d !== deskId) : [...prev, deskId]
    );
  };

  const handleToggleModule = (modId: string) => {
    setAssignedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const applyPreset = (preset: 'all' | 'clinical' | 'finance' | 'hmo' | 'none') => {
    if (preset === 'all') {
      setAssignedModules(ALL_MODULES.map((m) => m.id));
    } else if (preset === 'clinical') {
      setAssignedModules(['clinical-triage', 'clinic-registry']);
    } else if (preset === 'finance') {
      setAssignedModules(['finance-billing']);
    } else if (preset === 'hmo') {
      setAssignedModules(['hmo-insurance']);
    } else {
      setAssignedModules([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedModules.length === 0) {
      setError('Please assign at least one visible module for this role.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updated = await updateRole(role.id, {
        name,
        primary_desk: primaryDesk,
        description,
        allowed_desks: allowedDesks.length > 0 ? allowedDesks : [primaryDesk],
        assigned_modules: assignedModules,
        status: true,
      });

      onRoleUpdated(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update role permissions.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-teal-50/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Configure Role Permissions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100/70 text-teal-800 border border-teal-200 uppercase tracking-wide">
                  {role.slug}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage which operational modules and workstation desks are visible to staff with this role.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Role Identification & Operating Desk */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  Role Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cashdesk Billing Officer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none text-xs font-bold text-slate-900 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5 text-xs">
                  Primary Operating Desk <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={primaryDesk}
                    onChange={(e) => {
                      setPrimaryDesk(e.target.value);
                      if (!allowedDesks.includes(e.target.value)) {
                        setAllowedDesks((prev) => [...prev, e.target.value]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none text-xs font-bold text-slate-800 shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="cashdesk">Cashdesk & Billing Desk</option>
                    <option value="hmo">HMO & Insurance Clearance Desk</option>
                    <option value="helpdesk">Helpdesk & Front Reception</option>
                    <option value="doctor">Clinical Consultation Room</option>
                    <option value="monitor">Waiting Room TV Monitor Desk</option>
                    <option value="analytics">Queue Analytics & AI Insights</option>
                    <option value="admin">Administrator / Governance</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1 text-xs">
                Role Purpose & Scope Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of duties and responsibilities..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs text-slate-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Section 2: Assigned Visible Modules (Interactive Card Grid) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h3 className="font-black text-slate-900 text-xs tracking-tight">
                  Assigned Navigation Sidebar Modules
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200">
                  {assignedModules.length} of {ALL_MODULES.length} active
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('clinical')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 font-bold text-[10px] transition-colors"
                >
                  Clinical
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('finance')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold text-[10px] transition-colors"
                >
                  Finance
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('hmo')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 font-bold text-[10px] transition-colors"
                >
                  HMO
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-bold text-[10px] transition-colors"
                >
                  All (Admin)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Toggle the modules below. Staff logged in with this role will <strong>strictly only see the highlighted modules</strong> on their dashboard sidebar.
            </p>

            {/* Visual Module Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {ALL_MODULES.map((mod) => {
                const isSelected = assignedModules.includes(mod.id);
                const Icon = mod.icon;

                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all select-none flex items-start gap-3 text-left ${
                      isSelected
                        ? 'border-teal-500 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 shadow-sm shadow-teal-500/10 ring-1 ring-teal-500/30'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                    }`}
                  >
                    {/* Module Icon Container */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Title & Description */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black text-xs ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                          {mod.name}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            isSelected
                              ? 'bg-teal-100/90 text-teal-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {mod.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    {/* Selection Pill Check */}
                    <div
                      className={`absolute right-3.5 top-3.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-2xs scale-100'
                          : 'border border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Allowed Workstation Desks */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-600" />
                <h3 className="font-black text-slate-900 text-xs tracking-tight">
                  Authorized Workstation Desks
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                Workstations this role can sign into
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_DESKS.map((d) => {
                const isChecked = allowedDesks.includes(d.id);
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleToggleDesk(d.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs ${
                      isChecked
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate text-[11px]">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/70 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            {assignedModules.length} module{assignedModules.length === 1 ? '' : 's'} assigned to{' '}
            <span className="font-bold text-slate-800">{name || 'this role'}</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs font-bold transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-teal-600/25 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving Changes...' : 'Save & Apply Role Modules'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
