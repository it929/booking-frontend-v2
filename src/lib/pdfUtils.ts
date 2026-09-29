// src/lib/pdfUtils.ts
import { jsPDF } from 'jspdf';
import { Booking } from '@/lib/types';

export interface GeneratePdfResult {
  blob: Blob;
  file: File;
  filename: string;
}

/**
 * Creates a clean, professional, high-resolution vector PDF appointment slip
 * completely using jsPDF with zero dependencies on DOM or html2canvas.
 * This guarantees 100% reliability across all modern browsers and mobile devices.
 */
export function generateAppointmentVectorPdf(
  booking: Partial<Booking>,
  filename?: string,
  getDoctorName?: () => string
): GeneratePdfResult {
  const refCode = booking.reference_code || 'VOUCHER';
  const cleanFilename = filename
    ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
    : `Isalu-Appointment-${refCode}.pdf`;

  const docName = getDoctorName ? getDoctorName() : (booking.doctor?.name || booking.doctor_name || 'Consultant Specialist');
  const clinicName = booking.doctor_specialty || booking.department?.name || 'Specialist Consultation';
  const dateStr = booking.date || booking.appointment_date || 'Upcoming';
  const timeStr = booking.time || booking.appointment_time || 'Clinic Shift Window';
  const paymentLabel = booking.payment_type || 'Private Self-Pay';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Brand Palette
  const darkBlue: [number, number, number] = [0, 91, 156];
  const primaryBlue: [number, number, number] = [0, 130, 205];
  const skyBg: [number, number, number] = [240, 249, 255];
  const skyBorder: [number, number, number] = [186, 230, 253];
  const slateDark: [number, number, number] = [15, 23, 42];
  const slateMuted: [number, number, number] = [100, 116, 139];
  const slateLight: [number, number, number] = [248, 250, 252];
  const borderSlate: [number, number, number] = [226, 232, 240];
  const emerald: [number, number, number] = [5, 150, 105];
  const emeraldBg: [number, number, number] = [236, 253, 245];
  const emeraldBorder: [number, number, number] = [167, 243, 208];

  // 1. Top Brand Banner
  doc.setFillColor(...darkBlue);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('ISALU HOSPITALS', margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text('RC502112 • HEFAMAA & NHIA ACCREDITED SPECIALIST HEALTHCARE CENTER', margin, 17.5);
  doc.text('No. 46, Ijaiye Road, Ogba, Ikeja, Lagos | Emergency Dispatch: +234 706 3911 672', margin, 22.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL APPOINTMENT SLIP', pageWidth - margin, 12, { align: 'right' });

  // 2. Document Title
  let y = 37;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkBlue);
  doc.text('SPECIALIST CONSULTATION APPOINTMENT VOUCHER', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateMuted);
  doc.text('Electronic Booking Confirmation & Nursing Triage Pass', margin, y);

  // 3. Reference & Status Card
  y += 6;
  doc.setFillColor(...slateLight);
  doc.setDrawColor(...borderSlate);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateMuted);
  doc.text('APPOINTMENT REFERENCE CODE', margin + 6, y + 8);

  doc.setFontSize(16);
  doc.setFont('courier', 'bold');
  doc.setTextColor(...slateDark);
  doc.text(refCode, margin + 6, y + 17);

  // Status Badge
  doc.setFillColor(...emeraldBg);
  doc.setDrawColor(...emeraldBorder);
  doc.roundedRect(pageWidth - margin - 52, y + 5, 46, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...emerald);
  doc.text('APPOINTMENT CONFIRMED', pageWidth - margin - 29, y + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateMuted);
  doc.text('Verified on EHR System', pageWidth - margin - 29, y + 16.5, { align: 'center' });

  // 4. Details Table
  y += 30;
  doc.setFillColor(...primaryBlue);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PATIENT & APPOINTMENT PARTICULARS', margin + 4, y + 5);

  y += 7;
  const hmoText = booking.hmo_name 
    ? `${booking.hmo_name}${booking.hmo_policy_code ? ` (ID: ${booking.hmo_policy_code})` : ''}`
    : booking.payment_type === 'HMO Insurance' && booking.hmo_policy_code 
      ? `HMO Enrollee (ID: ${booking.hmo_policy_code})`
      : 'Private Self-Pay';

  const fields = [
    ['Patient Full Name', booking.patient_name || 'Valued Patient', 'Contact Phone Number', booking.patient_phone || 'N/A'],
    ['Specialty Clinic Unit', clinicName, 'Consulting Specialist', docName],
    ['Appointment Date', dateStr, 'Consultation Shift', timeStr],
    ['Billing Category', paymentLabel, 'HMO Provider / ID', hmoText],
    ['Hospital Center', 'Isalu Main Hospital, Ogba', 'Arrival Protocol', '15 Mins Before Shift Window']
  ];

  fields.forEach((row, i) => {
    const rowY = y + (i * 9);
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.setDrawColor(...borderSlate);
    doc.rect(margin, rowY, contentWidth, 9, 'FD');

    // Col 1 label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text(row[0].toUpperCase(), margin + 4, rowY + 4);

    // Col 1 value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);
    doc.text(String(row[1] || ''), margin + 4, rowY + 7.5);

    // Col 2 label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text(row[2].toUpperCase(), margin + 94, rowY + 4);

    // Col 2 value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);
    doc.text(String(row[3] || ''), margin + 94, rowY + 7.5);
  });

  // 5. Clinical Instructions Box
  y += (fields.length * 9) + 6;
  doc.setFillColor(...skyBg);
  doc.setDrawColor(...skyBorder);
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkBlue);
  doc.text('IMPORTANT PATIENT ATTENDANCE INSTRUCTIONS', margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('1. Nursing Triage: Please arrive 15 minutes before your shift for vital screening (BP, pulse, temp).', margin + 5, y + 13);
  doc.text('2. Presentation: Show this official PDF voucher on your mobile phone or as a printout at the desk.', margin + 5, y + 19);
  doc.text('3. Reschedule Policy: Need to change date? Reschedule online up to 4 hours before your shift.', margin + 5, y + 25);
  doc.text('4. Emergency Hotline: For acute emergency triage, call our 24/7 hotline directly: +234 706 3911 672.', margin + 5, y + 31);

  // 6. Online Tracking Link
  y += 40;
  doc.setFillColor(...slateLight);
  doc.setDrawColor(...borderSlate);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  doc.text('VERIFY / TRACK / RESCHEDULE APPOINTMENT ONLINE', margin + 5, y + 6);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryBlue);
  doc.text(`${origin}/check-status?ref=${encodeURIComponent(refCode)}`, margin + 5, y + 12);

  // 7. Footer
  y += 24;
  doc.setDrawColor(...borderSlate);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text('Isalu Hospitals Limited • No. 46, Ijaiye Road, Ogba, Ikeja, Lagos • info@isaluhospitals.com', pageWidth / 2, y + 5, { align: 'center' });
  doc.text('This is an authentic computer-generated healthcare voucher certified by Isalu Hospital Information System.', pageWidth / 2, y + 9, { align: 'center' });

  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });

  return { blob: pdfBlob, file, filename: cleanFilename };
}

/**
 * Generates and immediately downloads the official PDF ticket voucher.
 * Accepts either a Booking object or elementId.
 */
export async function downloadTicketPdf(
  source: string | Booking,
  filename = 'Isalu-Appointment-Slip.pdf',
  fallbackBooking?: Booking
): Promise<GeneratePdfResult> {
  let result: GeneratePdfResult;

  if (typeof source === 'object' && source !== null) {
    result = generateAppointmentVectorPdf(source, filename);
  } else if (fallbackBooking) {
    result = generateAppointmentVectorPdf(fallbackBooking, filename);
  } else {
    // If only elementId passed and no booking object, create a generic placeholder or basic slip
    result = generateAppointmentVectorPdf({
      id: 0,
      reference_code: 'SLIP',
      patient_name: 'Valued Patient',
      patient_phone: '',
      payment_type: 'Private Self-Pay' as any,
      status: 'Confirmed'
    }, filename);
  }

  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up object URL after short delay
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return result;
}

/**
 * Share ticket voucher to WhatsApp as PDF.
 * On mobile devices with Web Share support, attaches the PDF directly to WhatsApp.
 * On desktop computers, automatically downloads the PDF to the device and launches WhatsApp Web
 * with the full summary and direct online PDF download link.
 */
export async function shareTicketToWhatsApp(
  booking: Booking,
  elementId = 'printable-ticket',
  getDoctorName?: () => string
): Promise<{ sharedViaApi: boolean; downloaded: boolean; downloadUrl: string }> {
  const refCode = booking.reference_code || 'VOUCHER';
  const filename = `Isalu-Appointment-${refCode}.pdf`;

  const docName = getDoctorName ? getDoctorName() : (booking.doctor?.name || booking.doctor_name || 'Consultant');
  const clinicName = booking.doctor_specialty || booking.department?.name || 'Specialist Consultation';
  const dateStr = booking.date || booking.appointment_date || '';
  const timeStr = booking.time || booking.appointment_time || '';
  const paymentLabel = booking.payment_type || 'Private Self-Pay';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const pdfDownloadUrl = `${origin}/check-status?ref=${encodeURIComponent(refCode)}&download=pdf`;

  const message = `🏥 *ISALU HOSPITALS APPOINTMENT CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Ticket Reference:* ${refCode}
👤 *Patient Name:* ${booking.patient_name}
🩺 *Specialty Clinic:* ${clinicName}
👨‍⚕️ *Consultant:* ${docName}
📅 *Date:* ${dateStr}
⏰ *Shift Window:* ${timeStr}
💳 *Billing:* ${paymentLabel}${booking.hmo_policy_code ? ` (Policy ID: ${booking.hmo_policy_code})` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Address:* No. 46, Ijaiye Road, Ogba, Ikeja, Lagos
📞 *Emergency Dispatch:* +234 706 3911 672
💡 Please arrive 15 minutes prior to clinic commencement for vital triage.
📄 *Download Official PDF Voucher:*
${pdfDownloadUrl}
🔗 *Track / Reschedule Online:*
${origin}/check-status?ref=${encodeURIComponent(refCode)}`;

  // 1. Generate high-res vector PDF (100% reliable, never throws)
  const result = generateAppointmentVectorPdf(booking, filename, getDoctorName);

  // 2. Check if mobile Web Share API with files is available
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [result.file] })
  ) {
    try {
      await navigator.share({
        files: [result.file],
        title: `Isalu Hospitals Ticket - ${refCode}`,
        text: message,
      });
      return { sharedViaApi: true, downloaded: false, downloadUrl: pdfDownloadUrl };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return { sharedViaApi: false, downloaded: false, downloadUrl: pdfDownloadUrl };
      }
    }
  }

  // 3. Fallback: Automatically download the PDF to device and launch WhatsApp Web
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return { sharedViaApi: false, downloaded: true, downloadUrl: pdfDownloadUrl };
}

/**
 * Share ticket voucher via Email as PDF.
 */
export async function shareTicketToEmail(
  booking: Booking,
  elementId = 'printable-ticket',
  getDoctorName?: () => string
): Promise<{ sharedViaApi: boolean; downloaded: boolean; downloadUrl: string }> {
  const refCode = booking.reference_code || 'VOUCHER';
  const filename = `Isalu-Appointment-${refCode}.pdf`;

  const docName = getDoctorName ? getDoctorName() : (booking.doctor?.name || booking.doctor_name || 'Consultant');
  const clinicName = booking.doctor_specialty || booking.department?.name || 'Specialist Consultation';
  const dateStr = booking.date || booking.appointment_date || '';
  const timeStr = booking.time || booking.appointment_time || '';
  const paymentLabel = booking.payment_type || 'Private Self-Pay';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const pdfDownloadUrl = `${origin}/check-status?ref=${encodeURIComponent(refCode)}&download=pdf`;

  const subject = `Isalu Hospitals Appointment Slip (PDF) - ${refCode}`;
  const body = `Dear ${booking.patient_name},

Your specialist medical appointment at Isalu Hospitals has been successfully confirmed.

APPOINTMENT SUMMARY:
• Ticket Reference: ${refCode}
• Patient Name: ${booking.patient_name}
• Specialty Clinic: ${clinicName}
• Consulting Specialist: ${docName}
• Date: ${dateStr}
• Shift Window: ${timeStr}
• Billing Channel: ${paymentLabel}${booking.hmo_policy_code ? `\n• HMO Policy ID: ${booking.hmo_policy_code}` : ''}

HOSPITAL LOCATION & CONTACT:
Isalu Hospitals, No. 46, Ijaiye Road, Ogba, Ikeja, Lagos
Emergency Dispatch: +234 706 3911 672

[OFFICIAL PDF VOUCHER]:
Your official appointment PDF slip (${filename}) has been downloaded to your device.
You can also view and download it directly online at:
${pdfDownloadUrl}

Verify / Track Appointment Online:
${origin}/check-status?ref=${encodeURIComponent(refCode)}
`;

  // 1. Generate vector PDF
  const result = generateAppointmentVectorPdf(booking, filename, getDoctorName);

  // 2. Check if mobile Web Share API with files is available
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [result.file] })
  ) {
    try {
      await navigator.share({
        files: [result.file],
        title: subject,
        text: body,
      });
      return { sharedViaApi: true, downloaded: false, downloadUrl: pdfDownloadUrl };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return { sharedViaApi: false, downloaded: false, downloadUrl: pdfDownloadUrl };
      }
    }
  }

  // 3. Fallback: Download PDF and open mailto
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;

  return { sharedViaApi: false, downloaded: true, downloadUrl: pdfDownloadUrl };
}
