import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getCompanyLogo } from '../../services/organizationService';
import { OfficialSocietySeal } from './OfficialShareholderIDCard';
import { Heart, Phone, Shield, User, Briefcase, Calendar, Award } from 'lucide-react';

const staffQrDataUrlCache = new Map();

export function getStaffQRPayload(emp) {
  const empId = String(emp?.employee_id || emp?.id || '').trim();
  // Clean, high-speed, compact URL format for phone cameras, handheld 2D scanners, and attendance app
  return `https://avinash-ghiradi.github.io/sugar-cooperative-erp/?emp_attn=${encodeURIComponent(empId)}`;
}

export function StaffAttendanceQR({ employee, size = 96, className = '' }) {
  const emp = employee || {};
  const empId = String(emp.employee_id || emp.id || '').trim();
  const cacheKey = `staff_${empId}_${size}`;
  const [dataUrl, setDataUrl] = useState(() => staffQrDataUrlCache.get(cacheKey) || '');

  useEffect(() => {
    if (!empId) return;
    if (staffQrDataUrlCache.has(cacheKey)) {
      setDataUrl(staffQrDataUrlCache.get(cacheKey));
      return;
    }
    const payload = getStaffQRPayload(emp);
    QRCode.toDataURL(payload, {
      margin: 1, // Standard mandatory quiet zone for instant finder pattern recognition
      width: Math.max(256, size * 4), // High-DPI crisp rendering
      errorCorrectionLevel: 'M', // 15% error recovery
      color: {
        dark: '#000000', // Pure optical black for maximum 21:1 contrast
        light: '#ffffff'
      }
    }).then(url => {
      staffQrDataUrlCache.set(cacheKey, url);
      setDataUrl(url);
    }).catch(err => {
      console.warn('Staff QR code gen error:', err);
    });
  }, [empId, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className="bg-emerald-50/80 rounded border border-emerald-300 flex items-center justify-center text-[7px] text-emerald-800 font-bold"
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`Staff Attendance QR - ${empId}`}
      className={`object-contain block ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export default function OfficialStaffIDCard({
  employee,
  showBack = false,
  showSeal = true,
  showQrCode = true,
  orientation = 'portrait', // 'portrait' (ಲಂಬ - 54x85.6mm) or 'landscape' (ಅಡ್ಡ - 85.6x54mm)
  customLogo = '',
  customMdSignature = '',
  className = ''
}) {
  const emp = employee || {};
  const empId = String(emp.employee_id || emp.id || '—').trim();
  const empNameKannada = emp.name || emp.name_kannada || '—';
  const empNameEnglish = emp.name_english || '';
  const designation = emp.designation || '—';
  const department = emp.department || '—';
  const bloodGroup = emp.blood_group || '';
  const mobile = emp.mobile || emp.mobile_no || '—';
  const joiningDate = emp.joining_date || '—';
  const aadhaarNo = emp.aadhaar_no || emp.aadhaar_card_no || '—';
  const emergencyContact = emp.emergency_contact || '—';
  const address = emp.address || '—';
  const epfUan = emp.epf_uan_no || '—';

  const kannadaFontStyle = {
    fontFamily: "'Noto Sans Kannada', 'Tunga', 'Kaveri', 'Segoe UI', Arial, sans-serif"
  };

  const effectiveLogo = customLogo || getCompanyLogo();
  const effectiveMdSig = customMdSignature || './id_assets/md_signature_transparent.png';

  const isPortrait = orientation === 'portrait';

  // =========================================================================
  // 1. PORTRAIT ORIENTATION (ಲಂಬ - 232px x 372px / 54mm x 85.6mm)
  // =========================================================================
  if (isPortrait) {
    return (
      <div className={`inline-block select-none ${className}`}>
        <div className="w-[232px] h-[372px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-white relative flex flex-col justify-between font-sans print:shadow-none print:border-slate-500">
          {!showBack ? (
            /* ----- PORTRAIT FRONT VIEW ----- */
            <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900">
              {/* Top Corporate Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white p-2.5 flex flex-col items-center justify-center border-b-2 border-amber-500 shrink-0 text-center relative shadow-sm">
                <div className="w-9 h-9 rounded-full bg-white p-0.5 shrink-0 flex items-center justify-center shadow-md mb-1">
                  <img
                    src={effectiveLogo}
                    alt="Factory Logo"
                    className="w-full h-full object-contain rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <span className="hidden w-full h-full rounded-full bg-emerald-800 text-white font-black text-[9px] items-center justify-center">
                    BSSK
                  </span>
                </div>
                <div style={kannadaFontStyle} className="space-y-0.5">
                  <h2 className="text-[9.5px] font-black tracking-tight leading-tight text-amber-300 drop-shadow-sm">
                    ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
                  </h2>
                  <p className="text-[7px] font-medium text-slate-200">
                    ಮರಗೂರ - 586204, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ
                  </p>
                  <div className="inline-block bg-amber-500 text-slate-950 font-black text-[6.5px] px-2 py-0.2 rounded-full tracking-wider uppercase mt-0.5">
                    ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿ • STAFF ID
                  </div>
                </div>
              </div>

              {/* Middle Section: Photo & Employee Profile */}
              <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 relative">
                {/* Photo Frame with Seal */}
                <div className="relative shrink-0 flex flex-col items-center mt-0.5">
                  <div className="w-[78px] h-[94px] rounded-lg border-2 border-emerald-800 overflow-hidden bg-slate-100 shadow-md relative flex items-center justify-center">
                    {emp.photo_url ? (
                      <img
                        src={emp.photo_url}
                        alt={empNameKannada}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500">
                        <User className="w-8 h-8 text-slate-400" />
                        <span className="text-[7px] font-bold mt-1 text-slate-600">PHOTO</span>
                      </div>
                    )}

                    {/* Official Seal Watermark */}
                    {showSeal && (
                      <div
                        className="absolute -left-5 -bottom-3 w-[56px] h-[56px] pointer-events-none select-none z-20 opacity-90"
                        style={{ transform: 'rotate(-10deg)' }}
                      >
                        <OfficialSocietySeal className="w-full h-full" />
                      </div>
                    )}
                  </div>
                  <span className="text-[6.5px] text-slate-500 font-medium mt-0.5">ಉದ್ಯೋಗಿ ಸಹಿ / Signature</span>
                </div>

                {/* Emp ID Badge */}
                <div className="mt-1">
                  <span className="bg-emerald-950 text-amber-300 text-[8.5px] font-black font-mono px-2 py-0.5 rounded-full border border-amber-400 shadow-sm inline-block">
                    {empId}
                  </span>
                </div>

                {/* Names */}
                <div className="text-center mt-0.5 w-full px-1" style={kannadaFontStyle}>
                  <div className="font-black text-[12.5px] text-slate-950 leading-tight truncate">
                    {empNameKannada}
                  </div>
                  {empNameEnglish && (
                    <div className="text-[8px] font-bold text-slate-600 font-sans tracking-wide truncate uppercase">
                      {empNameEnglish}
                    </div>
                  )}
                </div>

                {/* Designation & Department */}
                <div className="mt-0.5 text-center w-full px-1" style={kannadaFontStyle}>
                  <div className="inline-block bg-emerald-100/90 text-emerald-950 font-black text-[8.5px] px-2 py-0.5 rounded border border-emerald-300 max-w-full truncate">
                    {designation}
                  </div>
                  <div className="text-[7.5px] font-bold text-slate-700 mt-0.5 truncate">
                    {department}
                  </div>
                </div>

                {/* Compact Details Box */}
                <div className="w-full bg-slate-100/80 border border-slate-200 rounded-lg p-1.5 mt-1 text-[7.5px] text-slate-700 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>ರಕ್ತದ ಗುಂಪು:</span>
                    <strong className="text-rose-700 font-black font-mono">{bloodGroup || '—'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ಮೊಬೈಲ್:</span>
                    <strong className="font-mono text-slate-900">{mobile}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ಸೇರ್ಪಡೆ:</span>
                    <strong className="font-mono text-slate-900">{joiningDate}</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Footer with MD Signature */}
              <div className="px-3 py-1.5 border-t border-slate-200 bg-white/90 flex items-center justify-between text-[7px] text-slate-600">
                <div className="text-left font-bold text-emerald-900">
                  ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಪತ್ರ
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src={effectiveMdSig}
                    alt="MD Sign"
                    className="h-4 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="font-bold text-slate-900">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)</span>
                </div>
              </div>

              {/* Bottom Decorative Band */}
              <div className="h-1 bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-900"></div>
            </div>
          ) : (
            /* ----- PORTRAIT BACK VIEW ----- */
            <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900 p-2.5">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-1" style={kannadaFontStyle}>
                <h3 className="text-[9px] font-black text-slate-900 leading-tight">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
                </h3>
                <p className="text-[7px] text-slate-500 font-medium">
                  ಮರಗೂರ - 586204, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ
                </p>
                <div className="text-[7px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                  ಸಿಬ್ಬಂದಿ ಶಾಸನಬದ್ಧ ದಾಖಲೆ & ಹಾಜರಾತಿ
                </div>
              </div>

              {/* Prime Central Attendance QR Code */}
              <div className="my-auto flex flex-col items-center justify-center">
                {showQrCode && (
                  <div className="bg-white p-1 rounded-xl border-2 border-emerald-600 shadow-md">
                    <StaffAttendanceQR employee={emp} size={104} />
                  </div>
                )}
                <div className="mt-1 text-center" style={kannadaFontStyle}>
                  <div className="text-[8.5px] font-black text-emerald-950 flex items-center justify-center gap-1">
                    <span>📱 ಹಾಜರಾತಿ QR ಕೋಡ್</span>
                  </div>
                  <p className="text-[6.8px] text-slate-500">
                    ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ತ್ವರಿತ ಹಾಜರಾತಿ ದಾಖಲಿಸಿ
                  </p>
                </div>
              </div>

              {/* Extended Details Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[7.5px] text-slate-800 space-y-0.5" style={kannadaFontStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ಆಧಾರ್:</span>
                  <strong className="font-mono text-slate-900">{aadhaarNo}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ಇಪಿಎಫ್ / UAN:</span>
                  <strong className="font-mono text-slate-900">{epfUan}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ತುರ್ತು ಸಂಪರ್ಕ:</span>
                  <strong className="font-mono text-slate-900">{emergencyContact}</strong>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-500 shrink-0">ವಿಳಾಸ:</span>
                  <span className="font-medium text-slate-800 text-right truncate">{address}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-0.5">
                  <span className="text-slate-500">ಮಾನ್ಯತೆ:</span>
                  <strong className="text-emerald-800 font-bold">ಸೇವೆಯಲ್ಲಿರುವವರೆಗೆ</strong>
                </div>
              </div>

              {/* Statutory Rules & Barcode */}
              <div className="border-t border-slate-200 pt-1 text-center space-y-0.5">
                <p className="text-[6.5px] text-slate-500">
                  • ಕಾರ್ಖಾನೆಯ ಆವರಣದಲ್ಲಿ ಗುರುತಿನ ಚೀಟಿ ಧರಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ.
                </p>
                <div className="text-[8px] font-mono tracking-widest text-slate-700 font-bold">
                  ||||| ||| {empId} |||||
                </div>
                <div className="text-[7px] text-slate-600 font-bold pt-0.5">
                  ಸಿಬ್ಬಂದಿ ನಿರ್ವಾಹಕರು (Personnel Manager)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LANDSCAPE ORIENTATION (ಅಡ್ಡ - 372px x 232px / 85.6mm x 54mm)
  // =========================================================================
  return (
    <div className={`inline-block select-none ${className}`}>
      {/* Outer Card Dimensions: Standard CR80 ID Card standard 372px x 232px (85.6mm x 54mm @ 110 DPI) */}
      <div className="w-[372px] h-[232px] rounded-xl overflow-hidden shadow-xl border-2 border-slate-700 bg-white relative flex flex-col justify-between font-sans print:shadow-none print:border-slate-500">
        {!showBack ? (
          /* ==================== LANDSCAPE FRONT VIEW ==================== */
          <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900">
            {/* Top Corporate Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-2.5 py-1.5 flex items-center gap-2 border-b-2 border-amber-500 shrink-0">
              {/* Factory Logo */}
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shrink-0 flex items-center justify-center shadow-md">
                <img
                  src={effectiveLogo}
                  alt="Factory Logo"
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <span className="hidden w-full h-full rounded-full bg-emerald-800 text-white font-black text-xs items-center justify-center">
                  BSSK
                </span>
              </div>

              {/* Title & Organization Name */}
              <div className="flex-1 min-w-0" style={kannadaFontStyle}>
                <h2 className="text-[10px] font-black tracking-tight leading-tight text-amber-300 drop-shadow-sm truncate">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ
                </h2>
                <p className="text-[6.8px] font-bold text-slate-200 tracking-wider truncate uppercase">
                  Shree Bheemashankar Co-operative Sugar Factory Ltd., Margur
                </p>
                <div className="inline-block bg-amber-500 text-slate-950 font-black text-[6.5px] px-1.5 py-0.2 rounded-sm tracking-widest uppercase mt-0.5">
                  ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿ • OFFICIAL STAFF IDENTITY CARD
                </div>
              </div>
            </div>

            {/* Middle Section: Member Details (Left) + Employee Photo (Right) */}
            <div className="flex items-center justify-between px-3 py-1 flex-1 gap-2 relative">
              {/* Left Column: Details */}
              <div className="flex-1 min-w-0 space-y-0.5 text-slate-900" style={kannadaFontStyle}>
                {/* Emp ID Badge */}
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-950 text-amber-300 text-[8px] font-black font-mono px-2 py-0.5 rounded border border-amber-400 shadow-sm inline-block">
                    {empId}
                  </span>
                  {/* Blood Group Tag */}
                  {bloodGroup && (
                    <span className="bg-rose-50 text-rose-700 border border-rose-300 text-[7.5px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <span className="text-rose-600 font-bold">🩸</span> {bloodGroup}
                    </span>
                  )}
                  <span className="text-[7.5px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    {emp.status || 'Active'}
                  </span>
                </div>

                {/* Employee Name */}
                <div className="leading-tight pt-0.5">
                  <div className="font-black text-[12px] text-slate-950 truncate">
                    {empNameKannada}
                  </div>
                  {empNameEnglish && (
                    <div className="text-[8px] font-bold text-slate-600 font-sans tracking-wide truncate">
                      {empNameEnglish}
                    </div>
                  )}
                </div>

                {/* Designation & Department */}
                <div className="pt-0.5 space-y-0.5 text-[8.2px]">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">ಹುದ್ದೆ:</span>
                    <strong className="text-emerald-950 font-black bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 truncate">
                      {designation}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">ವಿಭಾಗ:</span>
                    <strong className="text-slate-800 font-bold truncate">
                      {department}
                    </strong>
                  </div>
                </div>

                {/* Joining Date & Mobile */}
                <div className="grid grid-cols-2 gap-x-2 text-[7.8px] text-slate-700 pt-0.5 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500">ಸೇರ್ಪಡೆ: </span>
                    <strong className="font-mono text-slate-900">{joiningDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ಮೊಬೈಲ್: </span>
                    <strong className="font-mono text-slate-900">{mobile}</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Photo Frame with Seal Watermark */}
              <div className="relative shrink-0 flex flex-col items-center">
                <div className="w-[74px] h-[92px] rounded-lg border-2 border-emerald-800 overflow-hidden bg-slate-100 shadow-md relative flex items-center justify-center">
                  {emp.photo_url ? (
                    <img
                      src={emp.photo_url}
                      alt={empNameKannada}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500">
                      <User className="w-8 h-8 text-slate-400" />
                      <span className="text-[7px] font-bold mt-1 text-slate-600">PHOTO</span>
                    </div>
                  )}

                  {/* Society Seal Overlay */}
                  {showSeal && (
                    <div
                      className="absolute -left-6 -bottom-4 w-[64px] h-[64px] pointer-events-none select-none z-20 opacity-90"
                      style={{ transform: 'rotate(-10deg)' }}
                    >
                      <OfficialSocietySeal className="w-full h-full" />
                    </div>
                  )}
                </div>

                {/* Employee Signature Under Photo */}
                <div className="w-full text-center mt-0.5">
                  <span className="text-[6.5px] font-bold text-slate-500 tracking-wider">
                    ಉದ್ಯೋಗಿ ಸಹಿ / Signature
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer: Signatures & Address */}
            <div className="bg-slate-100/90 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[7px] text-slate-600">
              <div className="flex items-center gap-1.5" style={kannadaFontStyle}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>ಮರಗೂರ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ - 586204</span>
              </div>

              {/* Managing Director Signature */}
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-end">
                  <img
                    src={effectiveMdSig}
                    alt="MD Sign"
                    className="h-4 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="text-[6.8px] font-black text-slate-800 leading-tight">
                    ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Gold Line at very bottom */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600"></div>
          </div>
        ) : (
          /* ==================== LANDSCAPE BACK VIEW ==================== */
          <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900 p-2.5">
            {/* Back Header */}
            <div className="border-b border-slate-200 pb-1 flex items-center justify-between" style={kannadaFontStyle}>
              <div>
                <h3 className="text-[9.5px] font-black text-slate-900 leading-tight">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
                </h3>
                <p className="text-[6.8px] text-slate-500 font-medium">
                  ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ (ಕರ್ನಾಟಕ) • ದೂರವಾಣಿ: 08422-295000
                </p>
              </div>
              <div className="text-[7.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                ಸಿಬ್ಬಂದಿ ಶಾಸನಬದ್ಧ ದಾಖಲೆ
              </div>
            </div>

            {/* Back Main Body: Left (Details & Rules) + Right (Dedicated Large Attendance QR Code) */}
            <div className="flex items-center justify-between gap-3 flex-1 py-1">
              {/* Left Column: Details Grid & Guidelines */}
              <div className="flex-1 space-y-1 text-[7.8px] text-slate-800" style={kannadaFontStyle}>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500">ಆಧಾರ್: </span>
                    <strong className="font-mono text-slate-900">{aadhaarNo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ಇಪಿಎಫ್ / UAN: </span>
                    <strong className="font-mono text-slate-900">{epfUan}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ತುರ್ತು ಸಂಪರ್ಕ: </span>
                    <strong className="font-mono text-slate-900">{emergencyContact}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ಮಾನ್ಯತೆ: </span>
                    <strong className="text-emerald-800">ಸೇವೆಯಲ್ಲಿರುವವರೆಗೆ</strong>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500">ವಿಳಾಸ: </span>
                    <span>{address}</span>
                  </div>
                </div>

                {/* Factory Safety Rules */}
                <div className="text-[6.8px] text-slate-600 space-y-0.5 pt-0.5">
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>ಕಾರ್ಖಾನೆ ಆವರಣದಲ್ಲಿ ಸದಾ ಗುರುತಿನ ಚೀಟಿ ಧರಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>ಭದ್ರತಾ ಸಿಬ್ಬಂದಿಗೆ ತಪಾಸಣೆ ಸಮಯದಲ್ಲಿ ಈ ಕಾರ್ಡ್ ತೋರಿಸಬೇಕು.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>ಕಾರ್ಡ್ ಕಳೆದುಹೋದರೆ ತಕ್ಷಣ ಆಡಳಿತ ಕಚೇರಿಗೆ ಮಾಹಿತಿ ನೀಡಬೇಕು.</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Prominent Large 96px Attendance QR Code */}
              <div className="shrink-0 flex flex-col items-center justify-center pl-2 border-l border-slate-200">
                {showQrCode && (
                  <div className="bg-white p-1 rounded-xl border-2 border-emerald-600 shadow-md">
                    <StaffAttendanceQR employee={emp} size={96} />
                  </div>
                )}
                <div className="mt-1 text-center" style={kannadaFontStyle}>
                  <div className="text-[8px] font-black text-emerald-950 flex items-center justify-center gap-0.5">
                    <span>📱 ಹಾಜರಾತಿ QR ಕೋಡ್</span>
                  </div>
                  <span className="text-[6.5px] text-slate-500 font-medium">
                    (Attendance QR Code)
                  </span>
                </div>
              </div>
            </div>

            {/* Back Footer: Barcode & Authorization */}
            <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[7px] text-slate-600">
              <div className="flex items-center gap-1.5 font-mono text-[8px] text-slate-700 font-bold">
                <span>||||| ||| {empId} |||||</span>
              </div>
              <div className="text-right font-bold text-slate-800" style={kannadaFontStyle}>
                ಸಿಬ್ಬಂದಿ ನಿರ್ವಾಹಕರು (Personnel Manager)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
