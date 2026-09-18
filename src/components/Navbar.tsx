// src/components/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Heart, 
  Calendar, 
  Search, 
  User, 
  PhoneCall, 
  Clock, 
  ShieldAlert,
  Menu,
  X,
  Stethoscope,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { getStoredUser, clearAuthSession } from '@/lib/api';
import { StaffUser } from '@/lib/types';
import IsaluLogo from '@/components/IsaluLogo';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    // Sync stored user safely without cascading render
    const timer = setTimeout(() => {
      setStaffUser(getStoredUser());
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    setStaffUser(null);
    window.location.href = '/login';
  };

  // Hide the consumer public website navbar on internal dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  const navLinks = [
    { name: 'Book Appointment', href: '/' },
    { name: 'Available HMOs', href: '/hmo' },
    { name: 'Doctors & Specialists', href: '/doctors' },
    { name: 'Check Ticket Status', href: '/check-status' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Clock className="w-3.5 h-3.5" /> 24/7 Emergency & ICU Available
            </span>
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-slate-400" /> Emergency: +234 800 47258 2273
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>No. 46, Ijaiye Road, Ogba, Ikeja, Lagos</span>
            <span className="text-slate-600">•</span>
            <span className="text-teal-400 font-semibold">Isalu Hospitals</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center group py-2">
            <IsaluLogo variant="full" size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-teal-700 bg-teal-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/check-status"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm hover:shadow-md shadow-teal-600/20 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Reschedule Appointment
            </Link>

            {staffUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">{staffUser.name}</span>
                  <span className="text-[10px] text-teal-600 font-semibold">{staffUser.role}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  title={`Sign out (${staffUser.email})`}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                Staff Portal
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/check-status"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm"
            >
              Reschedule Appointment
            </Link>
            {staffUser ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm"
              >
                Open Staff Dashboard ({staffUser.name})
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm"
              >
                Staff Portal Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
