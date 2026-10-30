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
  const empId = String(emp.employee_id || emp.id || 'EMP-001').trim();
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
  customLogo = '',
  customMdSignature = '',
  className = ''
}) {
  const emp = employee || {};
  const empId = String(emp.employee_id || emp.id || 'EMP-001').trim();
  const empNameKannada = emp.name || emp.name_kannada || 'ಉದ್ಯೋಗಿ ಹೆಸರು';
  const empNameEnglish = emp.name_english || emp.name || '';
  const designation = emp.designation || 'ಸಿಬ್ಬಂದಿ (Staff)';
  const department = emp.department || 'ಆಡಳಿತ ವಿಭಾಗ (Administration)';
  const bloodGroup = emp.blood_group || 'O+';
  const mobile = emp.mobile || emp.mobile_no || '—';
  const joiningDate = emp.joining_date || '—';
  const aadhaarNo = emp.aadhaar_no || emp.aadhaar_card_no || '—';
  const emergencyContact = emp.emergency_contact || '—';
  const address = emp.address || 'ಮರಗೂರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ಆವರಣ, ಚಡಚಣ';
  const epfUan = emp.epf_uan_no || 'UAN-100293847500';

  const kannadaFontStyle = {
    fontFamily: "'Noto Sans Kannada', 'Tunga', 'Kaveri', 'Segoe UI', Arial, sans-serif"
  };

  const effectiveLogo = customLogo || getCompanyLogo();
  const effectiveMdSig = customMdSignature || './id_assets/md_signature_transparent.png';

  return (
    <div className={`inline-block select-none ${className}`}>
      {/* Outer Card Dimensions: Standard CR80 ID Card standard 372px x 232px (85.6mm x 54mm @ 110 DPI) */}
      <div className="w-[372px] h-[232px] rounded-xl overflow-hidden shadow-xl border-2 border-slate-700 bg-white relative flex flex-col justify-between font-sans print:shadow-none print:border-slate-500">
        {!showBack ? (
          /* ==================== FRONT VIEW ==================== */
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
              </div>
            </div>

            {/* Bottom Signature Bar */}
            <div className="shrink-0 px-3 pb-1 pt-0.5 flex items-end justify-between border-t border-slate-300 bg-white/70" style={kannadaFontStyle}>
              {/* Employee Signature */}
              <div className="text-center w-28">
                <div className="h-5 flex items-center justify-center">
                  {emp.signature_url ? (
                    <img src={emp.signature_url} alt="Staff Sig" className="max-h-5 max-w-[90px] object-contain" />
                  ) : (
                    <div className="font-serif italic text-[8.5px] text-slate-600 tracking-wider">
                      {empNameEnglish.split(' ').map(n => n.charAt(0)).join(' ')}
                    </div>
                  )}
                </div>
                <div className="text-[8px] font-black text-slate-950 border-t border-slate-400 pt-0.5 leading-none">
                  ಉದ್ಯೋಗಿಯ ಸಹಿ
                </div>
              </div>

              {/* Authorized MD / GM Signature */}
              <div className="text-center w-32">
                <div className="h-5 flex items-center justify-center">
                  <img
                    src={effectiveMdSig}
                    alt="MD Signature"
                    className="max-h-5 max-w-[95px] object-contain mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-[8px] font-black text-slate-950 border-t border-slate-400 pt-0.5 leading-none">
                  ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==================== BACK VIEW ==================== */
          <div className="w-full h-full p-2 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]" style={kannadaFontStyle}>
            {/* Header in Kannada & English */}
            <div className="border-b-2 border-emerald-700 pb-0.5 text-center shrink-0">
              <h3 className="font-black text-[10.5px] text-emerald-950 leading-tight">
                ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
              </h3>
              <p className="text-[7.2px] font-bold text-slate-600">
                Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
              </p>
            </div>

            {/* Middle Section: Extended Staff Details + Ultra-Large Sensitive Attendance QR Code */}
            <div className="flex items-stretch gap-2 my-auto py-0.5">
              {/* Left Side: Extended Details & Factory Instructions */}
              <div className={`flex-1 flex flex-col justify-between ${showQrCode ? 'pr-1.5 border-r border-slate-300' : ''}`}>
                {/* Details Grid */}
                <div className="space-y-0.5 text-[8px] leading-tight pb-1 border-b border-slate-200">
                  <div>• ಆಧಾರ್ ಸಂಖ್ಯೆ: <strong className="font-mono text-slate-900">{aadhaarNo}</strong></div>
                  <div>• ಇಪಿಎಫ್ / ಯುಎಎನ್: <strong className="font-mono text-slate-900">{epfUan}</strong></div>
                  <div>• ತುರ್ತು ಸಂಪರ್ಕ: <strong className="text-emerald-950">{emergencyContact}</strong></div>
                  <div>• ವಿಳಾಸ: <span className="text-slate-800 line-clamp-1">{address}</span></div>
                  <div>• ಮಾನ್ಯತೆ: <strong className="text-emerald-800">ಸೇವೆಯಲ್ಲಿರುವವರೆಗೆ (Till in Service)</strong></div>
                </div>

                {/* 3 Statutory Factory Safety Rules */}
                <div className="text-[7px] text-slate-700 space-y-0.5 pt-1">
                  <div className="font-bold text-slate-900 text-[7.5px]">ಮುಖ್ಯ ಸೂಚನೆಗಳು:</div>
                  <div>1. ಕಾರ್ಖಾನೆ ಆವರಣದಲ್ಲಿ & ಕರ್ತವ್ಯದ ಸಮಯದಲ್ಲಿ ಈ ಕಾರ್ಡ್ ಕಡ್ಡಾಯ.</div>
                  <div>2. ಗೇಟ್‌ನಲ್ಲಿ ಹಾಜರಾತಿಗಾಗಿ ಬಲಭಾಗದ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.</div>
                  <div>3. ಈ ಕಾರ್ಡ್ ಕಳೆದುಹೋದರೆ ತಕ್ಷಣ ಆಡಳಿತ ಕಚೇರಿಗೆ ವರದಿ ಮಾಡಿ.</div>
                </div>
              </div>

              {/* Right Side: ULTRA-LARGE 96px PROMINENT STAFF ATTENDANCE QR CODE */}
              {showQrCode && (
                <div className="w-[122px] shrink-0 flex flex-col items-center justify-between p-1 bg-white rounded-xl border-2 border-emerald-900 shadow-xl">
                  {/* Top QR Label */}
                  <div className="text-[8.5px] font-black text-emerald-950 uppercase tracking-tight text-center leading-none pt-0.5">
                    ಹಾಜರಾತಿ QR
                  </div>

                  {/* ULTRA LARGE 96px HIGH-RESOLUTION PURE BLACK & WHITE QR CODE */}
                  <div className="my-0.5 p-0.5 bg-white flex items-center justify-center">
                    <StaffAttendanceQR employee={emp} size={96} />
                  </div>

                  {/* Bottom Staff Details */}
                  <div className="text-center leading-tight pb-0.5">
                    <div className="text-[9px] font-mono font-black text-emerald-950">
                      #{empId}
                    </div>
                    <div className="text-[6.5px] font-bold text-slate-600 uppercase tracking-wider">
                      Staff Attendance
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Barcode & Signatures */}
            <div className="pt-1 border-t border-slate-300 flex items-center justify-between text-[8px] shrink-0">
              {/* Simulated Barcode */}
              <div className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono font-bold text-[7.5px] text-slate-900 tracking-widest text-center">
                |||||| || ||| {empId} |||| |||
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900 text-[8px]">ಆಡಳಿತ ಮಂಡಳಿ ಪರವಾಗಿ</div>
                <div className="text-[7.5px] text-emerald-800 font-semibold">ಆಡಳಿತಾಧಿಕಾರಿಗಳು / Personnel Manager</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
