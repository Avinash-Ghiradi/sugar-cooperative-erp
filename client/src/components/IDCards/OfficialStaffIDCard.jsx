import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getCompanyLogo } from '../../services/organizationService';
import { OfficialSocietySeal } from './OfficialShareholderIDCard';
import { CloudDbService } from '../../services/cloudDb';
import { Heart, Phone, Shield, User, Briefcase, Calendar, Award } from 'lucide-react';

const staffQrDataUrlCache = new Map();

export const STORAGE_KEY_STAFF_ID_SETTINGS = 'sugar_erp_staff_id_card_settings';

export function getStaffQRPayload(emp) {
  const empId = String(emp?.employee_id || emp?.id || '').trim();
  // Clean, high-speed, compact URL format for phone cameras, handheld 2D scanners, and attendance app
  return `https://avinash-ghiradi.github.io/sugar-cooperative-erp/?emp_attn=${encodeURIComponent(empId)}`;
}

// ---------------------------------------------------------------------------
// Staff ID Card Customization Settings & Cloud Database Synchronization
// ---------------------------------------------------------------------------
export function getStaffIdCardSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_ID_SETTINGS);
    return raw ? JSON.parse(raw) : {
      customLogo: '',
      customFrontBackground: '',
      customBackBackground: '',
      customMdSignature: '',
      backgroundOpacity: 1
    };
  } catch (e) {
    return {
      customLogo: '',
      customFrontBackground: '',
      customBackBackground: '',
      customMdSignature: '',
      backgroundOpacity: 1
    };
  }
}

export function saveStaffIdCardSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_ID_SETTINGS, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('staff_id_card_settings_updated', { detail: settings }));
    }
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  // Sync to Supabase Cloud DB for global synchronization across all factory browsers/devices
  try {
    CloudDbService.saveCollectionItem('staff_id_card_settings', 'active_settings', {
      ...settings,
      updated_at: new Date().toISOString()
    }).catch(err => console.warn('Cloud save staff_id_card_settings failed:', err));
  } catch (err) {}
}

export function resetStaffIdCardSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY_STAFF_ID_SETTINGS);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('staff_id_card_settings_updated', { detail: null }));
    }
  } catch (e) {}

  try {
    CloudDbService.deleteCollectionItem('staff_id_card_settings', 'active_settings')
      .catch(err => console.warn('Cloud delete staff_id_card_settings failed:', err));
  } catch (err) {}
}

export async function syncStaffIdCardSettingsFromCloud() {
  try {
    const cloudRecords = await CloudDbService.getCollection('staff_id_card_settings');
    const cloudConfig = cloudRecords && cloudRecords.length > 0 ? cloudRecords[0] : null;
    if (cloudConfig) {
      const cleanSettings = {
        customLogo: cloudConfig.customLogo || '',
        customFrontBackground: cloudConfig.customFrontBackground || '',
        customBackBackground: cloudConfig.customBackBackground || '',
        customMdSignature: cloudConfig.customMdSignature || '',
        backgroundOpacity: cloudConfig.backgroundOpacity !== undefined ? Number(cloudConfig.backgroundOpacity) : 1
      };
      localStorage.setItem(STORAGE_KEY_STAFF_ID_SETTINGS, JSON.stringify(cleanSettings));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('staff_id_card_settings_updated', { detail: cleanSettings }));
      }
      return cleanSettings;
    }
  } catch (err) {
    console.warn('syncStaffIdCardSettingsFromCloud error:', err);
  }
  return getStaffIdCardSettings();
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
  customLogo,
  customMdSignature,
  customFrontBackground,
  customBackBackground,
  backgroundOpacity,
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

  // Global settings state with real-time broadcast listener
  const [globalSettings, setGlobalSettings] = useState(getStaffIdCardSettings);

  useEffect(() => {
    const handleSettingsUpdated = (e) => {
      setGlobalSettings(e.detail || getStaffIdCardSettings());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('staff_id_card_settings_updated', handleSettingsUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('staff_id_card_settings_updated', handleSettingsUpdated);
      }
    };
  }, []);

  const kannadaFontStyle = {
    fontFamily: "'Noto Sans Kannada', 'Tunga', 'Kaveri', 'Segoe UI', Arial, sans-serif"
  };

  const effectiveLogo = (customLogo !== undefined && customLogo !== '') ? customLogo : (globalSettings.customLogo || getCompanyLogo());
  const effectiveMdSig = (customMdSignature !== undefined && customMdSignature !== '') ? customMdSignature : (globalSettings.customMdSignature || './id_assets/md_signature_transparent.png');
  const effectiveFrontBg = (customFrontBackground !== undefined) ? customFrontBackground : (globalSettings.customFrontBackground || '');
  const effectiveBackBg = (customBackBackground !== undefined) ? customBackBackground : (globalSettings.customBackBackground || '');
  const effectiveBgOpacity = (backgroundOpacity !== undefined) ? Number(backgroundOpacity) : (globalSettings.backgroundOpacity !== undefined ? Number(globalSettings.backgroundOpacity) : 1);

  const isPortrait = orientation === 'portrait';

  // =========================================================================
  // 1. PORTRAIT ORIENTATION (ಲಂಬ - 238px x 372px / 54mm x 85.6mm)
  // =========================================================================
  if (isPortrait) {
    return (
      <div className={`inline-block select-none ${className}`}>
        <div className="w-[238px] h-[372px] print:w-[54mm] print:h-[85.6mm] rounded-xl print:rounded-none overflow-hidden shadow-2xl border-2 border-slate-700 print:border-0 bg-white relative flex flex-col justify-between font-sans print:shadow-none box-sizing: border-box">
          {!showBack ? (
            /* ----- PORTRAIT FRONT VIEW ----- */
            <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900 overflow-hidden">
              {/* Custom Uploaded Background for Front Page (if provided) */}
              {effectiveFrontBg && (
                <img
                  src={effectiveFrontBg}
                  alt="Staff Front Background"
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                  style={{ opacity: effectiveBgOpacity }}
                />
              )}

              {/* Top Corporate Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-white px-2 py-1 flex flex-col items-center justify-center border-b-2 border-amber-500 shrink-0 text-center relative z-10 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-white p-0.5 shrink-0 flex items-center justify-center shadow-md mb-0.5">
                  <img
                    src={effectiveLogo}
                    alt="Factory Logo"
                    className="w-full h-full object-contain rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <span className="hidden w-full h-full rounded-full bg-emerald-800 text-white font-black text-[8px] items-center justify-center">
                    BSSK
                  </span>
                </div>
                <div style={kannadaFontStyle} className="space-y-0.2">
                  <h2 className="text-[9.2px] font-black tracking-tight leading-tight text-amber-300 drop-shadow-sm">
                    ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
                  </h2>
                  <p className="text-[6.5px] font-medium text-slate-200 leading-none">
                    ಮರಗೂರ - 586204, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ
                  </p>
                  <div className="inline-block bg-amber-500 text-slate-950 font-black text-[6px] px-1.5 py-0.2 rounded-full tracking-wider uppercase mt-0.5">
                    ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿ • STAFF ID
                  </div>
                </div>
              </div>

              {/* Middle Section: Photo & Profile Details */}
              <div className="flex-1 flex flex-col items-center justify-center px-2 py-0.5 relative z-10 min-h-0">
                {/* Photo Frame with Seal */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-[68px] h-[84px] rounded-lg border-2 border-emerald-800 overflow-hidden bg-slate-100 shadow-md relative flex items-center justify-center">
                    {emp.photo_url ? (
                      <img
                        src={emp.photo_url}
                        alt={empNameKannada}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500">
                        <User className="w-7 h-7 text-slate-400" />
                        <span className="text-[6.5px] font-bold mt-0.5 text-slate-600">PHOTO</span>
                      </div>
                    )}

                    {/* Official Seal Watermark */}
                    {showSeal && (
                      <div
                        className="absolute -left-5 -bottom-3 w-[52px] h-[52px] pointer-events-none select-none z-20 opacity-90"
                        style={{ transform: 'rotate(-10deg)' }}
                      >
                        <OfficialSocietySeal className="w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Emp ID Badge & Blood Group Tag on SAME line */}
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="bg-emerald-950 text-amber-300 text-[8.5px] font-black font-mono px-2 py-0.5 rounded-full border border-amber-400 shadow-sm inline-block">
                    {empId}
                  </span>
                  {bloodGroup && (
                    <span className="bg-rose-50 text-rose-700 border border-rose-300 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                      <span>🩸</span> {bloodGroup}
                    </span>
                  )}
                </div>

                {/* Names */}
                <div className="text-center mt-0.5 w-full px-1" style={kannadaFontStyle}>
                  <div className="font-black text-[12px] text-slate-950 leading-tight truncate">
                    {empNameKannada}
                  </div>
                  {empNameEnglish && (
                    <div className="text-[7.8px] font-bold text-slate-600 font-sans tracking-wide truncate uppercase mt-0.5">
                      {empNameEnglish}
                    </div>
                  )}
                </div>

                {/* Designation & Department */}
                <div className="mt-0.5 text-center w-full px-1" style={kannadaFontStyle}>
                  <div className="inline-block bg-emerald-100/90 text-emerald-950 font-black text-[8.2px] px-2 py-0.5 rounded border border-emerald-300 max-w-full truncate shadow-xs">
                    {designation}
                  </div>
                  {department && department !== '—' && (
                    <div className="text-[7.2px] font-bold text-slate-700 mt-0.5 truncate">
                      {department}
                    </div>
                  )}
                </div>

                {/* Compact Mobile & Joining Date line */}
                {(mobile !== '—' || joiningDate !== '—') && (
                  <div className="flex items-center justify-center gap-2 text-[7px] text-slate-600 font-mono mt-0.5 border-t border-slate-200/80 pt-0.5 w-full bg-white/70 rounded">
                    {mobile !== '—' && <span>📞 {mobile}</span>}
                    {mobile !== '—' && joiningDate !== '—' && <span className="text-slate-400">•</span>}
                    {joiningDate !== '—' && <span>ಸೇರ್ಪಡೆ: {joiningDate}</span>}
                  </div>
                )}
              </div>

              {/* Bottom Signatures Section - PROMINENT, LARGE & FULLY VISIBLE */}
              <div className="px-2.5 py-1 border-t border-slate-300/80 bg-white/95 relative z-10 flex items-end justify-between text-[7px] text-slate-700 shrink-0">
                {/* Left: Employee Sign */}
                <div className="flex flex-col items-center">
                  <div className="h-5 flex items-end justify-center">
                    <span className="font-serif italic text-slate-700 text-[8.5px] border-b border-slate-400 px-1.5 pb-0.5">
                      {empNameEnglish ? empNameEnglish.split(' ')[0] : 'Sign'}
                    </span>
                  </div>
                  <span className="text-[6.2px] font-bold text-slate-600 mt-0.5">ಉದ್ಯೋಗಿ ಸಹಿ</span>
                </div>

                {/* Right: Managing Director Sign (CLEAR & PROMINENT) */}
                <div className="flex flex-col items-center">
                  <div className="h-6 flex items-end justify-center">
                    <img
                      src={effectiveMdSig}
                      alt="MD Signature"
                      className="h-6 max-h-6 object-contain block drop-shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="w-20 border-t border-slate-400 my-0.2"></div>
                  <span className="text-[6.8px] font-black text-slate-900 leading-tight">
                    ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)
                  </span>
                </div>
              </div>

              {/* Bottom Decorative Band */}
              <div className="h-1 bg-gradient-to-r from-emerald-900 via-amber-400 to-emerald-900 shrink-0 relative z-10"></div>
            </div>
          ) : (
            /* ----- PORTRAIT BACK VIEW ----- */
            <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900 p-2 overflow-hidden">
              {/* Custom Uploaded Background for Back Page (if provided) */}
              {effectiveBackBg && (
                <img
                  src={effectiveBackBg}
                  alt="Staff Back Background"
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                  style={{ opacity: effectiveBgOpacity }}
                />
              )}

              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-0.5 relative z-10 bg-white/70 rounded p-1 shrink-0" style={kannadaFontStyle}>
                <h3 className="text-[9px] font-black text-slate-900 leading-tight">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
                </h3>
                <p className="text-[6.5px] text-slate-500 font-medium">
                  ಮರಗೂರ - 586204, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ
                </p>
                <div className="text-[6.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                  ಸಿಬ್ಬಂದಿ ಶಾಸನಬದ್ಧ ದಾಖಲೆ & ಹಾಜರಾತಿ
                </div>
              </div>

              {/* Prime Central Attendance QR Code */}
              <div className="my-auto flex flex-col items-center justify-center relative z-10 py-1">
                {showQrCode && (
                  <div className="bg-white p-1 rounded-xl border-2 border-emerald-600 shadow-md">
                    <StaffAttendanceQR employee={emp} size={92} />
                  </div>
                )}
                <div className="mt-0.5 text-center bg-white/80 px-2 py-0.5 rounded shadow-xs" style={kannadaFontStyle}>
                  <div className="text-[7.8px] font-black text-emerald-950 flex items-center justify-center gap-1">
                    <span>📱 ಹಾಜರಾತಿ QR ಕೋಡ್</span>
                  </div>
                  <p className="text-[6.2px] text-slate-500">
                    ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ತ್ವರಿತ ಹಾಜರಾತಿ ದಾಖಲಿಸಿ
                  </p>
                </div>
              </div>

              {/* Complete Extended Details Grid on Back */}
              <div className="bg-slate-50/90 backdrop-blur-xs border border-slate-200 rounded-lg p-1.5 text-[7px] text-slate-800 space-y-0.5 relative z-10 shadow-xs" style={kannadaFontStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ರಕ್ತದ ಗುಂಪು:</span>
                  <strong className="text-rose-700 font-mono font-black">{bloodGroup || '—'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ:</span>
                  <strong className="font-mono text-slate-900">{mobile}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ಸೇರ್ಪಡೆ ದಿನಾಂಕ:</span>
                  <strong className="font-mono text-slate-900">{joiningDate}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ಆಧಾರ್ ಕಾರ್ಡ್:</span>
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
              <div className="border-t border-slate-200 pt-0.5 text-center space-y-0.5 relative z-10 bg-white/70 rounded shrink-0">
                <p className="text-[6px] text-slate-500">
                  • ಕಾರ್ಖಾನೆಯ ಆವರಣದಲ್ಲಿ ಗುರುತಿನ ಚೀಟಿ ಧರಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ.
                </p>
                <div className="text-[7.2px] font-mono tracking-widest text-slate-700 font-bold">
                  ||||| ||| {empId} |||||
                </div>
                <div className="text-[6.5px] text-slate-600 font-bold">
                  ಸಿಬ್ಬಂದಿ ನಿರ್ವಾಹಕರು (Personnel Manager)
                </div>
              </div>

              {/* Bottom Decorative Band */}
              <div className="h-1 bg-gradient-to-r from-emerald-900 via-amber-400 to-emerald-900 shrink-0 relative z-10"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LANDSCAPE ORIENTATION (ಅಡ್ಡ - 372px x 238px / 85.6mm x 54mm)
  // =========================================================================
  return (
    <div className={`inline-block select-none ${className}`}>
      {/* Outer Card Dimensions: Standard CR80 ID Card standard 372px x 238px (85.6mm x 54mm @ 112 DPI) */}
      <div className="w-[372px] h-[238px] print:w-[85.6mm] print:h-[54mm] rounded-xl print:rounded-none overflow-hidden shadow-xl border-2 border-slate-700 print:border-0 bg-white relative flex flex-col justify-between font-sans print:shadow-none box-sizing: border-box">
        {!showBack ? (
          /* ==================== LANDSCAPE FRONT VIEW ==================== */
          <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900 overflow-hidden">
            {/* Custom Uploaded Background for Front Page (if provided) */}
            {effectiveFrontBg && (
              <img
                src={effectiveFrontBg}
                alt="Staff Front Background"
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                style={{ opacity: effectiveBgOpacity }}
              />
            )}

            {/* Top Corporate Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-2.5 py-1 flex items-center gap-2 border-b-2 border-amber-500 shrink-0 relative z-10">
              {/* Factory Logo */}
              <div className="w-9 h-9 rounded-full bg-white p-0.5 shrink-0 flex items-center justify-center shadow-md">
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
                <h2 className="text-[9.5px] font-black tracking-tight leading-tight text-amber-300 drop-shadow-sm truncate">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ
                </h2>
                <p className="text-[6.5px] font-bold text-slate-200 tracking-wider truncate uppercase">
                  Shree Bheemashankar Co-operative Sugar Factory Ltd., Margur
                </p>
                <div className="inline-block bg-amber-500 text-slate-950 font-black text-[6.2px] px-1.5 py-0.2 rounded-sm tracking-widest uppercase mt-0.5">
                  ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿ • OFFICIAL STAFF IDENTITY CARD
                </div>
              </div>
            </div>

            {/* Middle Section: Member Details (Left) + Employee Photo (Right) */}
            <div className="flex items-center justify-between px-2.5 py-0.5 flex-1 gap-2 relative z-10 min-h-0">
              {/* Left Column: Details */}
              <div className="flex-1 min-w-0 space-y-0.5 text-slate-900" style={kannadaFontStyle}>
                {/* Emp ID Badge */}
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-950 text-amber-300 text-[8px] font-black font-mono px-2 py-0.5 rounded border border-amber-400 shadow-sm inline-block">
                    {empId}
                  </span>
                  {bloodGroup && (
                    <span className="bg-rose-50 text-rose-700 border border-rose-300 text-[7.5px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <span className="text-rose-600 font-bold">🩸</span> {bloodGroup}
                    </span>
                  )}
                  <span className="text-[7.2px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    {emp.status || 'Active'}
                  </span>
                </div>

                {/* Employee Name */}
                <div className="leading-tight pt-0.5">
                  <div className="font-black text-[11.5px] text-slate-950 truncate">
                    {empNameKannada}
                  </div>
                  {empNameEnglish && (
                    <div className="text-[7.8px] font-bold text-slate-600 font-sans tracking-wide truncate">
                      {empNameEnglish}
                    </div>
                  )}
                </div>

                {/* Designation & Department */}
                <div className="pt-0.5 space-y-0.5 text-[8px]">
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
                <div className="grid grid-cols-2 gap-x-2 text-[7.2px] text-slate-700 pt-0.5 border-t border-slate-200 bg-white/70 rounded px-1">
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
                <div className="w-[68px] h-[84px] rounded-lg border-2 border-emerald-800 overflow-hidden bg-slate-100 shadow-md relative flex items-center justify-center">
                  {emp.photo_url ? (
                    <img
                      src={emp.photo_url}
                      alt={empNameKannada}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500">
                      <User className="w-7 h-7 text-slate-400" />
                      <span className="text-[6.5px] font-bold mt-0.5 text-slate-600">PHOTO</span>
                    </div>
                  )}

                  {/* Society Seal Overlay */}
                  {showSeal && (
                    <div
                      className="absolute -left-5 -bottom-3 w-[56px] h-[56px] pointer-events-none select-none z-20 opacity-90"
                      style={{ transform: 'rotate(-10deg)' }}
                    >
                      <OfficialSocietySeal className="w-full h-full" />
                    </div>
                  )}
                </div>

                {/* Employee Signature Under Photo */}
                <div className="w-full text-center mt-0.5">
                  <span className="text-[6.2px] font-bold text-slate-500 tracking-wider">
                    ಉದ್ಯೋಗಿ ಸಹಿ / Signature
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer: Signatures & Address - PROMINENT, CLEAR & COMPLETE */}
            <div className="bg-slate-100/95 border-t border-slate-200 px-2.5 py-0.5 relative z-10 flex items-center justify-between text-[7px] text-slate-600 shrink-0">
              <div className="flex items-center gap-1" style={kannadaFontStyle}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="text-[6.8px]">ಮರಗೂರ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ - 586204</span>
              </div>

              {/* Managing Director Signature */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex flex-col items-end justify-center">
                  <div className="h-6 flex items-end justify-end">
                    <img
                      src={effectiveMdSig}
                      alt="MD Sign"
                      className="h-6 max-h-6 object-contain block drop-shadow-xs"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="w-22 border-t border-slate-300 my-0.2"></div>
                  <span className="text-[7px] font-black text-slate-900 leading-tight block">
                    ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Gold Line at very bottom */}
            <div className="h-1 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600 shrink-0 relative z-10"></div>
          </div>
        ) : (
          /* ==================== LANDSCAPE BACK VIEW ==================== */
          <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] text-slate-900 p-2 overflow-hidden">
            {/* Custom Uploaded Background for Back Page (if provided) */}
            {effectiveBackBg && (
              <img
                src={effectiveBackBg}
                alt="Staff Back Background"
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                style={{ opacity: effectiveBgOpacity }}
              />
            )}

            {/* Back Header */}
            <div className="border-b border-slate-200 pb-0.5 flex items-center justify-between relative z-10 bg-white/70 rounded px-1.5 py-0.5 shrink-0" style={kannadaFontStyle}>
              <div>
                <h3 className="text-[9px] font-black text-slate-900 leading-tight">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
                </h3>
                <p className="text-[6.5px] text-slate-500 font-medium">
                  ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ (ಕರ್ನಾಟಕ) • ದೂರವಾಣಿ: 08422-295000
                </p>
              </div>
              <div className="text-[7px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                ಸಿಬ್ಬಂದಿ ಶಾಸನಬದ್ಧ ದಾಖಲೆ
              </div>
            </div>

            {/* Back Main Body: Left (Details & Rules) + Right (Dedicated Large Attendance QR Code) */}
            <div className="flex items-center justify-between gap-2.5 flex-1 py-0.5 relative z-10 min-h-0">
              {/* Left Column: Details Grid & Guidelines */}
              <div className="flex-1 space-y-1 text-[7.5px] text-slate-800 min-w-0" style={kannadaFontStyle}>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 bg-slate-50/90 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200 shadow-xs">
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
                <div className="text-[6.5px] text-slate-600 space-y-0.5 pt-0.5 bg-white/70 rounded p-1">
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>ಈ ಗುರುತಿನ ಚೀಟಿಯು ಕಾರ್ಖಾನೆಯ ಆಸ್ತಿಯಾಗಿದೆ, ಕಡ್ಡಾಯವಾಗಿ ಧರಿಸಿ.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>ಕಳೆದುಹೋದರೆ ಕೂಡಲೇ ಸಿಬ್ಬಂದಿ ಕಚೇರಿಗೆ ಮಾಹಿತಿ ನೀಡಿ.</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Attendance QR Code & Officer Sign */}
              <div className="shrink-0 flex flex-col items-center justify-center pl-2 border-l border-slate-200">
                {showQrCode && (
                  <div className="bg-white p-1 rounded-xl border-2 border-emerald-600 shadow-md">
                    <StaffAttendanceQR employee={emp} size={82} />
                  </div>
                )}
                <div className="mt-0.5 text-center bg-white/80 px-1 py-0.5 rounded shadow-xs" style={kannadaFontStyle}>
                  <div className="text-[7.2px] font-black text-emerald-950 flex items-center justify-center gap-0.5">
                    <span>📱 ಹಾಜರಾತಿ QR</span>
                  </div>
                  <div className="text-[6.5px] font-mono tracking-wider text-slate-700 font-bold mt-0.2">
                    ||||| {empId} |||||
                  </div>
                  <div className="text-[6.2px] text-slate-600 font-bold mt-0.2">
                    ಸಿಬ್ಬಂದಿ ನಿರ್ವಾಹಕರು
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Gold Line at very bottom */}
            <div className="h-1 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600 shrink-0 relative z-10"></div>
          </div>
        )}
      </div>
    </div>
  );
}
