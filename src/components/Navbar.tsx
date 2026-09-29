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
  LayoutDashboard,
  Sparkles,
  ArrowUpRight
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
    { name: 'Book Your Appointment', href: '/' },
    { name: 'Available HMOs', href: '/hmo' },
    { name: 'Doctors & Specialists', href: '/doctors' },
    { name: 'Check Ticket Status', href: '/check-status' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top Emergency & Announcement Ribbon */}
      <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 hidden md:block border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              24/7 Emergency, Trauma & ICU Active
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              <PhoneCall className="w-3 h-3 text-[#38bdf8]" />
              Emergency Dispatch: <a href="tel:+2347063911672" className="font-bold text-[#38bdf8] hover:underline">+234 706 3911 672</a>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>No. 46, Ijaiye Road, Ogba, Ikeja, Lagos</span>
            <span className="text-slate-700">•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              HEFAMAA & NHIA Accredited
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo with interactive hover */}
          <Link href="/" className="flex items-center group py-2 transition-transform duration-200 hover:scale-[1.01]">
            <IsaluLogo variant="full" size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative ${isActive
                    ? 'text-[#0082cd] bg-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#0082cd]"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/check-status"
              className="group inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#0082cd] to-[#006bac] hover:from-[#0073b6] hover:to-[#005a91] text-white text-xs font-bold shadow-sm hover:shadow-md shadow-[#0082cd]/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-sky-200 group-hover:rotate-12 transition-transform duration-200" />
              <span>Reschedule / Track Ticket</span>
            </Link>

            {staffUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">{staffUser.name}</span>
                  <span className="text-[10px] text-[#0082cd] font-semibold">{staffUser.role}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#006bac] text-xs font-bold border border-sky-200 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#0082cd]" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  title={`Sign out (${staffUser.email})`}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown with slide-down transition */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-5 pt-4 pb-6 space-y-3 animate-slide-up shadow-xl">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                    ? 'bg-sky-50 text-[#0082cd] font-black'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/check-status"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-[#0082cd] to-[#006bac] text-white font-bold text-xs shadow-md shadow-[#0082cd]/20"
            >
              Reschedule / Track Appointment
            </Link>
            {staffUser && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Open Staff Dashboard ({staffUser.name})
              </Link>
            )}
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            Emergency Dispatch: <a href="tel:+2347063911672" className="text-[#0082cd] font-bold">+234 706 3911 672</a>
          </div>
        </div>
      )}
    </header>
  );
}
