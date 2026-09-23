import { redirect } from 'next/navigation';

export default function TodayClinicRedirectPage() {
  redirect('/dashboard?submodule=today-clinics');
}
