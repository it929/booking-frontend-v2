// src/components/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import IsaluLogo from '@/components/IsaluLogo';

export default function Footer() {
  const pathname = usePathname();

  // Hide the consumer website footer on internal clinical dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <IsaluLogo variant="full" theme="dark" size="md" />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Providing premier specialist healthcare, patient-centered diagnostic care, and advanced surgical excellence with compassionate service across Lagos, Nigeria.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" /> HEFAMAA & NHIA Accredited Center
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase">Patient Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-teal-400 transition-colors">Book Specialist Consultation</Link>
              </li>
              <li>
                <Link href="/hmo" className="hover:text-teal-400 transition-colors">Check Available HMO Partners</Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-teal-400 transition-colors">Find a Doctor / Consultant</Link>
              </li>
              <li>
                <Link href="/check-status" className="hover:text-teal-400 transition-colors">Track Ticket & Appointment Status</Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-teal-400 transition-colors">Clinic Schedule & Duty Days</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Key Departments */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase">Specialty Clinics</h4>
            <ul className="space-y-2 text-xs">
              <li>Obstetrics & Gynaecology (7 Days/Week)</li>
              <li>Cardiology & Cardiac Screening</li>
              <li>Pediatrics & Neonatal Care</li>
              <li>Orthopedics & Joint Replacement</li>
              <li>General & Minimal Access Surgery</li>
              <li>Endocrinology & Diabetes Clinic</li>
            </ul>
          </div>

          {/* Col 4: Contact Information */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase">Emergency & Location</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>No. 46, Ijaiye Road, Ogba, Ikeja, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Emergency: +234 800 47258 2273</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>info@isaluhospitals.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-teal-300">
                <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                <span>24 Hours Daily (Everyday)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Isalu Hospitals. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-teal-400 text-xs">Staff Login</Link>
            <span>•</span>
            <span className="text-xs text-slate-500">Patient Confidentiality & GDPR/NDPR Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
