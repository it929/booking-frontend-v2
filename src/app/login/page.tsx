// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff, getStoredUser, clearAuthSession } from '@/lib/api';
import { StaffUser } from '@/lib/types';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, UserCheck, LogOut } from 'lucide-react';
import IsaluLogo from '@/components/IsaluLogo';

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await loginStaff({ email, password });
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    clearAuthSession();
    setCurrentUser(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full space-y-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <IsaluLogo variant="full" size="md" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Clinical Staff Portal</h2>
          <p className="text-[11px] text-slate-500">
            Secure administrative access for Isalu Hospitals officers & specialists.
          </p>
        </div>

        {currentUser && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600" /> Current Session
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-200/70 text-teal-800 text-[10px] font-bold">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-teal-800 leading-tight">
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.email})
            </p>
            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-2xs"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold"
              >
                <LogOut className="w-3 h-3" /> Switch User
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label htmlFor="staff-email" className="text-xs font-semibold text-slate-700">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="staff-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="staff@isaluhospitals.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="staff-password" className="text-xs font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="staff-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 mt-1"
          >
            {loading ? 'Authenticating...' : 'Sign In to Hospital Portal'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
