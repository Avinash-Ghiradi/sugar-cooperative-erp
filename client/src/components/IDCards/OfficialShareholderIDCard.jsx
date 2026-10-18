import React, { useState, useEffect } from 'react';
import { getMemberTypeByCategory } from '../../services/api';

const STORAGE_KEY_ID_SETTINGS = 'sugar_erp_id_card_custom_settings_v1';

// Default Card Customization Settings
export function getCustomIdCardSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ID_SETTINGS);
    return raw ? JSON.parse(raw) : {
      customLogo: '',
      customBackground: '',
      customMdSignature: '',
      hideHeader: false,
      showSugarcaneWatermark: true,
      backgroundOpacity: 1
    };
  } catch (e) {
    return {
      customLogo: '',
      customBackground: '',
      customMdSignature: '',
      hideHeader: false,
      showSugarcaneWatermark: true,
      backgroundOpacity: 1
    };
  }
}

export function saveCustomIdCardSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_ID_SETTINGS, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('id_card_settings_updated'));
    }
  } catch (e) {}
}

export function resetCustomIdCardSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY_ID_SETTINGS);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('id_card_settings_updated'));
    }
  } catch (e) {}
}

// Client-side helper to compress and optimize uploaded logo image
export function compressLogoImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Client-side helper to make MD signature transparent (removes white paper background)
export function makeSignatureTransparent(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;
        // Make light / white background pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 210 && g > 210 && b > 210) {
            data[i + 3] = 0; // Transparent
          } else if (r > 180 && g > 180 && b > 180) {
            const brightness = (r + g + b) / 3;
            data[i + 3] = Math.max(0, 255 - (brightness - 180) * 8);
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Client-side helper to compress and optimize uploaded background image
export function compressBackgroundImage(file, maxWidth = 1200, maxHeight = 800, quality = 0.9) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Extract class letter from schedule_cast (e.g. 'ಅ - ವರ್ಗ' -> 'ಅ', 'ಡ - ವರ್ಗ' -> 'ಡ', 'ಬ - ವರ್ಗ' -> 'ಬ')
export function getClassLetter(sc) {
  if (!sc) return 'ಅ';
  const str = String(sc).trim();
  // Check Kannada characters first
  if (str.includes('ಡ')) return 'ಡ';
  if (str.includes('ಬ')) return 'ಬ';
  if (str.includes('ಕ')) return 'ಕ';
  if (str.includes('ಅ')) return 'ಅ';

  // Check English / Latin Class designations with word boundary
  if (/\b(class\s*d|category\s*d|d\s*class)\b/i.test(str) || /^[-\s]*d[-\s]*$/i.test(str)) return 'ಡ';
  if (/\b(class\s*b|category\s*b|b\s*class)\b/i.test(str) || /^[-\s]*b[-\s]*$/i.test(str)) return 'ಬ';
  if (/\b(class\s*c|category\s*c|c\s*class)\b/i.test(str) || /^[-\s]*c[-\s]*$/i.test(str)) return 'ಕ';
  if (/\b(class\s*a|category\s*a|a\s*class)\b/i.test(str) || /^[-\s]*a[-\s]*$/i.test(str)) return 'ಅ';

  return str.charAt(0) || 'ಅ';
}

// Re-export getMemberTypeByCategory
export { getMemberTypeByCategory };

// Crisp Vector Cooperative Rubber Stamp (Official Seal)
export function OfficialSocietySeal({ className = "w-20 h-20" }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={{ filter: 'drop-shadow(0 1px 1px rgba(88,28,135,0.25))' }}>
      <defs>
        {/* Top curved path for factory name */}
        <path id="topArcPath" d="M 24,100 A 76,76 0 1,1 176,100" fill="none" />
        {/* Bottom curved path for location */}
        <path id="bottomArcPath" d="M 176,100 A 76,76 0 0,1 24,100" fill="none" />
      </defs>

      {/* Outer dual concentric stamped rings */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="#581c87" strokeWidth="2.5" opacity="0.85" />
      <circle cx="100" cy="100" r="91" fill="none" stroke="#581c87" strokeWidth="1.2" strokeDasharray="5,2" opacity="0.75" />
      <circle cx="100" cy="100" r="63" fill="none" stroke="#581c87" strokeWidth="1.8" opacity="0.85" />

      {/* Top Arc Text: Factory Name */}
      <text fill="#581c87" fontSize="13" fontWeight="900" opacity="0.9" letterSpacing="0.3" style={{ fontFamily: "'Anek Kannada', 'Aneka Kannada', sans-serif" }}>
        <textPath href="#topArcPath" startOffset="50%" textAnchor="middle">
          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
        </textPath>
      </text>

      {/* Star ornaments */}
      <text x="21" y="104" fill="#581c87" fontSize="13" fontWeight="bold" opacity="0.9">★</text>
      <text x="169" y="104" fill="#581c87" fontSize="13" fontWeight="bold" opacity="0.9">★</text>

      {/* Bottom Arc Text: Chadachan • Vijayapura */}
      <text fill="#581c87" fontSize="11" fontWeight="800" opacity="0.88" letterSpacing="1" style={{ fontFamily: "'Anek Kannada', 'Aneka Kannada', sans-serif" }}>
        <textPath href="#bottomArcPath" startOffset="50%" textAnchor="middle">
          ತಾ|| ಚಡಚಣ • ಜಿ|| ವಿಜಯಪುರ
        </textPath>
      </text>

      {/* Center Box / Text: ಮರಗೂರ */}
      <rect x="50" y="83" width="100" height="34" rx="4" fill="none" stroke="#581c87" strokeWidth="1.2" strokeDasharray="3,1" opacity="0.7" />
      <text x="100" y="107" fill="#581c87" fontSize="20" fontWeight="900" textAnchor="middle" letterSpacing="2.5" opacity="0.95" style={{ fontFamily: "'Anek Kannada', 'Aneka Kannada', sans-serif" }}>
        ಮರಗೂರ
      </text>
    </svg>
  );
}

// Authentic Sugarcane Stalk & Leaves Watermark Vector
export function SugarcaneWatermark({ className = "w-10 h-44" }) {
  return (
    <svg viewBox="0 0 80 320" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sugarcane Stalk 1 */}
      <path d="M 22,320 L 22,250 M 22,246 L 22,180 M 22,176 L 22,110 M 22,106 L 22,40" stroke="#15803d" strokeWidth="4.5" strokeLinecap="round" opacity="0.6" />
      {/* Cane nodes (rings) */}
      <ellipse cx="22" cy="248" rx="4.5" ry="2" fill="#166534" opacity="0.7" />
      <ellipse cx="22" cy="178" rx="4.5" ry="2" fill="#166534" opacity="0.7" />
      <ellipse cx="22" cy="108" rx="4.5" ry="2" fill="#166534" opacity="0.7" />

      {/* Sugarcane Stalk 2 (thinner background stalk) */}
      <path d="M 38,320 L 38,220 M 38,216 L 38,130 M 38,126 L 38,60" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="38" cy="218" rx="3.5" ry="1.5" fill="#15803d" opacity="0.5" />
      <ellipse cx="38" cy="128" rx="3.5" ry="1.5" fill="#15803d" opacity="0.5" />

      {/* Graceful Arching Cane Leaves */}
      <path d="M 22,180 Q 8,130 5,70 Q 3,30 2,5 Q 12,35 18,90 Q 22,130 22,176" fill="#16a34a" opacity="0.4" />
      <path d="M 22,110 Q 35,70 50,40 Q 65,15 75,2 Q 62,25 45,65 Q 26,100 22,106" fill="#22c55e" opacity="0.45" />
      <path d="M 22,248 Q 42,200 55,160 Q 68,120 72,90 Q 60,130 45,180 Q 28,220 22,246" fill="#15803d" opacity="0.35" />
      <path d="M 22,40 Q 20,20 18,2 Q 26,15 28,35 Z" fill="#4ade80" opacity="0.5" />
    </svg>
  );
}

export default function OfficialShareholderIDCard({
  shareholder,
  side = 'Front',
  showSeal = true,
  scale = 1,
  customLogo,
  customBackground,
  customMdSignature,
  hideHeader,
  showSugarcaneWatermark,
  onFlip
}) {
  const [globalSettings, setGlobalSettings] = useState(getCustomIdCardSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setGlobalSettings(getCustomIdCardSettings());
    };
    window.addEventListener('id_card_settings_updated', handleUpdate);
    return () => window.removeEventListener('id_card_settings_updated', handleUpdate);
  }, []);

  const sh = shareholder || {};
  const classLetter = getClassLetter(sh.schedule_cast);
  const sharesCount = sh.number_of_shares || 1;
  const shareNo = sh.share_no || sh.share_number || '3335';
  const memberName = sh.shareholder_name || sh.name || 'ಸದಸ್ಯರ ಹೆಸರು';
  const placeName = sh.place || sh.village_name || 'ಅಥರ್ಗಾ';
  const talukName = sh.taluk || 'ಇಂಡಿ';
  const districtName = sh.district || 'ವಿಜಯಪುರ';

  // Effective settings prioritizing props over persisted settings
  const effectiveLogo = customLogo !== undefined ? customLogo : globalSettings.customLogo;
  const effectiveBg = customBackground !== undefined ? customBackground : globalSettings.customBackground;
  const effectiveMdSig = customMdSignature !== undefined ? customMdSignature : globalSettings.customMdSignature;
  const effectiveHideHeader = hideHeader !== undefined ? hideHeader : globalSettings.hideHeader;
  const effectiveShowWatermark = showSugarcaneWatermark !== undefined ? showSugarcaneWatermark : globalSettings.showSugarcaneWatermark;
  const bgOpacity = globalSettings.backgroundOpacity !== undefined ? globalSettings.backgroundOpacity : 1;

  // Google Font 'Anek Kannada' / 'Aneka Kannada' applied uniformly
  const kannadaFontStyle = {
    fontFamily: "'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif"
  };

  return (
    <div
      className="relative select-none transition-all duration-300 id-card-container-outer"
      style={{
        width: `${372 * scale}px`,
        height: `${238 * scale}px`,
        transformOrigin: 'top left',
        ...kannadaFontStyle
      }}
    >
      {/* Outer Card with Double Green Borders matching official plastic ID card */}
      <div className="w-full h-full bg-white rounded-xl border-2 border-[#166534] p-[2px] shadow-2xl relative flex flex-col overflow-hidden text-slate-900 id-card-container">
        {/* Inner Border */}
        <div className="w-full h-full border border-[#16a34a]/70 rounded-[8px] flex flex-col justify-between overflow-hidden relative bg-gradient-to-br from-[#f2fcf4] via-[#f7fee7]/80 to-[#edfbf1]">

          {/* FRONT VIEW */}
          {side === 'Front' ? (
            <>
              {/* Custom Uploaded Background for Front Page (if provided) */}
              {effectiveBg && (
                <img
                  src={effectiveBg}
                  alt="Custom ID Background"
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                  style={{ opacity: bgOpacity }}
                />
              )}

              {/* Sugarcane stalks watermark on left (rendered if enabled and no full cover background, or if toggled on) */}
              {effectiveShowWatermark && (
                <div className="absolute left-0 bottom-0 pointer-events-none z-0">
                  <SugarcaneWatermark className="w-8 h-36" />
                </div>
              )}

              {/* 1. TOP HEADER BAR (Can be toggled off if background already has printed header) */}
              {!effectiveHideHeader ? (
                <>
                  <div className="shrink-0 relative z-10 bg-gradient-to-r from-[#0d6b2c] via-[#15803d] to-[#0a5c24] text-white px-2.5 py-1 flex items-center gap-2 border-b border-[#166534] shadow-sm">
                    {/* Factory Logo on left (Custom uploaded or official default) */}
                    <div className="w-[42px] h-[42px] shrink-0 flex items-center justify-center p-0.5 bg-white/10 rounded-full border border-white/20">
                      <img
                        src={effectiveLogo || '/id_assets/bsskn_logo.png'}
                        alt="BSSKN Logo"
                        className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-8 h-8 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] items-center justify-center">
                        BSSKN
                      </div>
                    </div>

                    {/* Society Official Name & Address in Google Anek Kannada */}
                    <div className="flex-1 text-center pr-1" style={kannadaFontStyle}>
                      <h2 className="font-black text-[13px] leading-tight tracking-normal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.,
                      </h2>
                      <p className="font-extrabold text-[10px] leading-tight text-white mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                        ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ.
                      </p>
                    </div>
                  </div>

                  {/* Header double-line accent */}
                  <div className="shrink-0 h-[1.5px] bg-gradient-to-r from-emerald-600 via-lime-400 to-emerald-600 border-b border-[#166534]"></div>
                </>
              ) : (
                /* Spacer when header is pre-printed on the custom background */
                <div className="h-11 w-full shrink-0 relative z-10"></div>
              )}

              {/* MIDDLE CONTENT: Sub-Header + Details & Photo */}
              <div className="flex-1 min-h-0 flex flex-col justify-between px-2.5 pt-0.5 pb-0.5 relative z-10" style={kannadaFontStyle}>
                {/* 2. SUB-HEADER: ID Card No & Center Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[7.5px] font-bold text-slate-800 tracking-tight font-mono">
                    ID Card N: 2025-26/02/{shareNo}
                  </span>

                  {/* Center Badge: ಗುರುತಿನ ಚೀಟಿ */}
                  <div className="text-center mr-6">
                    <div className="bg-[#e8f5e9]/95 border border-[#2e7d32] rounded px-2.5 py-0.5 shadow-sm inline-block">
                      <span className="font-black text-[10.5px] text-[#14532d] leading-none tracking-wider">
                        ಗುರುತಿನ ಚೀಟಿ
                      </span>
                    </div>
                    {/* Decorative wavy underline */}
                    <div className="w-14 h-1 mx-auto mt-[-1px] text-[#2e7d32] overflow-hidden">
                      <svg viewBox="0 0 60 4" className="w-full h-full" fill="none">
                        <path d="M0 2 Q 5 0, 10 2 T 20 2 T 30 2 T 40 2 T 50 2 T 60 2" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </div>
                  </div>

                  <div className="w-6"></div>
                </div>

                {/* 3. CARD BODY: Member Info (Left) + Photo & Seal (Right) */}
                <div className="flex items-center justify-between gap-1.5 my-auto">
                  {/* Left: Shareholder Information with Perfect 3-Column Alignment in Google Anek Kannada */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-1.5 gap-y-0.5 text-slate-950">
                      {/* Line 1: ಶೇರು ನಂ */}
                      <span className="font-extrabold text-[11px] text-slate-900 whitespace-nowrap">
                        ಶೇರು ನಂ
                      </span>
                      <span className="font-extrabold text-[11px] text-slate-900">:</span>
                      <span className="font-black text-[11.5px] text-slate-950 truncate">
                        {shareNo} <span className="text-[10px] font-bold text-slate-700">(“{classLetter}” – {sharesCount})</span>
                      </span>

                      {/* Line 2: ಸದಸ್ಯರ ಹೆಸರು */}
                      <span className="font-extrabold text-[11px] text-slate-900 whitespace-nowrap">
                        ಸದಸ್ಯರ ಹೆಸರು
                      </span>
                      <span className="font-extrabold text-[11px] text-slate-900">:</span>
                      <span className="font-black text-[11.5px] text-slate-950 truncate" title={memberName}>
                        {memberName}
                      </span>

                      {/* Line 3: ಸ್ಥಳ */}
                      <span className="font-extrabold text-[11px] text-slate-900 whitespace-nowrap">
                        ಸ್ಥಳ
                      </span>
                      <span className="font-extrabold text-[11px] text-slate-900">:</span>
                      <span className="font-extrabold text-[11px] text-slate-950 truncate">
                        ಸಾ॥ {placeName}
                      </span>

                      {/* Line 4: ತಾಲ್ಲೂಕು & ಜಿಲ್ಲೆ (Indented directly under village name in column 3) */}
                      <span></span>
                      <span></span>
                      <span className="font-extrabold text-[10px] text-slate-900 leading-tight">
                        ತಾ॥ {talukName} ಜಿ॥ {districtName}
                      </span>
                    </div>
                  </div>

                  {/* Right: Shareholder Photo & Overlapping Official Seal */}
                  <div className="relative shrink-0 mr-0.5">
                    {/* Photo Frame */}
                    <div className="w-[68px] h-[82px] border-2 border-black bg-slate-100 rounded-sm overflow-hidden shadow-sm flex items-center justify-center">
                      {sh.photo_url ? (
                        <img
                          src={sh.photo_url}
                          alt={memberName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 p-1 text-center">
                          <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                          <span className="text-[7px] font-bold text-slate-600 mt-0.5 uppercase" style={kannadaFontStyle}>ಭಾವಚಿತ್ರ</span>
                        </div>
                      )}
                    </div>

                    {/* Overlapping Purple Official Cooperative Stamp (Seal) */}
                    {showSeal && (
                      <div
                        className="absolute -left-6 -bottom-3.5 w-[64px] h-[64px] pointer-events-none select-none z-20"
                        style={{ transform: 'rotate(-10deg)' }}
                      >
                        <OfficialSocietySeal className="w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. BOTTOM ROW: Signatures (Fixed with shrink-0, always 100% visible) */}
              <div className="relative z-10 shrink-0 px-3 pb-1 pt-0.5 flex items-end justify-between border-t border-slate-300/80 bg-white/40" style={kannadaFontStyle}>
                {/* Left: Member Signature */}
                <div className="text-center w-28">
                  <div className="h-5 flex items-center justify-center">
                    {sh.signature_url ? (
                      <img
                        src={sh.signature_url}
                        alt="Member Signature"
                        className="max-h-5 max-w-[90px] object-contain"
                      />
                    ) : sh.thumb_url ? (
                      <img
                        src={sh.thumb_url}
                        alt="Member Thumb"
                        className="max-h-5 max-w-[36px] object-contain"
                      />
                    ) : (
                      <div className="px-1.5 py-0.2 bg-amber-50/70 border border-amber-200/50 rounded font-serif italic text-[9px] text-slate-700 tracking-wider">
                        {memberName.split(' ').map(n => n.charAt(0)).join(' ')}
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] font-black text-slate-950 mt-0.5 border-t border-slate-400 pt-0.5 leading-none">
                    ಸದಸ್ಯರ ಸಹಿ
                  </div>
                </div>

                {/* Right: Managing Director Signature (Custom uploaded or official default) */}
                <div className="text-center w-32">
                  <div className="h-5 flex items-center justify-center">
                    {effectiveMdSig ? (
                      <img
                        src={effectiveMdSig}
                        alt="MD Signature"
                        className="max-h-5 max-w-[85px] object-contain mx-auto"
                      />
                    ) : (
                      <img
                        src="/id_assets/md_signature_transparent.png"
                        alt="MD Signature"
                        className="max-h-5 max-w-[85px] object-contain mx-auto"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    )}
                    <span className="hidden font-serif italic text-emerald-700 font-bold text-xs">
                      MD Signature
                    </span>
                  </div>
                  <div className="text-[9px] font-black text-slate-950 mt-0.5 border-t border-slate-400 pt-0.5 leading-none">
                    ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* BACK VIEW */
            <div className="w-full h-full p-2.5 flex flex-col justify-between text-slate-900 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]" style={kannadaFontStyle}>
              {/* Header in Kannada & English */}
              <div className="border-b-2 border-emerald-700 pb-1 text-center">
                <h3 className="font-black text-[11.5px] text-emerald-900 leading-tight">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
                </h3>
                <p className="text-[8px] font-bold text-slate-600 mt-0.5">
                  Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
                </p>
              </div>

              {/* Statutory Member Details Grid */}
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[8.8px] py-1 border-b border-slate-300">
                <div>• ಪುಸ್ತಕ ಸಂ (Book): <strong className="font-mono text-emerald-900">{sh.book_no || 'B.No: 1'}</strong></div>
                <div>• ಸದಸ್ಯರ ಪ್ರಕಾರ (Member Type): <strong className="text-emerald-900">{getMemberTypeByCategory(sh.schedule_cast, sh.member_type)}</strong></div>
                <div>• ವರ್ಗ (Class): <strong className="text-emerald-800">{sh.schedule_cast || 'ಅ - ವರ್ಗ'}</strong></div>
                <div>• ಷೇರುಗಳ ಸಂಖ್ಯೆ: <strong className="font-mono text-slate-900">{sharesCount}</strong></div>
                <div>• ನೋಂದಣಿ ದಿನಾಂಕ: <span className="font-mono">{sh.reg_date || sh.registration_date || '—'}</span></div>
                <div>• ಮಂಡಳಿ ಠರಾವು: <span className="font-mono">{sh.tharava_no || 'TR-01/1982'}</span></div>
                <div>• ಸದಸ್ಯರ ಆಧಾರ್: <span className="font-mono">{sh.aadhaar_card_no || sh.aadhaar_ref || '—'}</span></div>
                <div>• ಮೊಬೈಲ್: <span className="font-mono">{sh.mobile_no || sh.mobile || '—'}</span></div>
              </div>

              {/* Statutory Rules / ಸೂಚನೆಗಳು */}
              <div className="text-[7.6px] text-slate-700 space-y-0.5 py-0.5">
                <div className="font-bold text-slate-900 text-[8.2px]">ಮುಖ್ಯ ಸೂಚನೆಗಳು:</div>
                <div>1. ವಾರ್ಷಿಕ ಮಹಾಸಭೆ, ಕಾರ್ಖಾನೆ ಚುಣಾವಣೆ ಮತ್ತು ಕಾರ್ಖಾನೆಯ ಸಭೆಗಳಿಗೆ ಹಾಜರಾಗಲು ಈ ಚೀಟಿ ಕಡ್ಡಾಯವಾಗಿದೆ.</div>
                <div>2. ಕಬ್ಬು ಪೂರೈಕೆ, ತೂಕದ ಬಿಲ್ಲು ಪಾವತಿ ಮತ್ತು ಸಕ್ಕರೆ ಕೋಟಾ ಪಡೆಯಲು ಹಾಜರುಪಡಿಸತಕ್ಕದ್ದು.</div>
                <div>3. ಈ ಚೀಟಿ ಕಳೆದುಹೋದಲ್ಲಿ ತಕ್ಷಣವೇ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಕಚೇರಿಗೆ ತಿಳಿಸತಕ್ಕದ್ದು.</div>
              </div>

              {/* Footer with Barcode & Signatures */}
              <div className="pt-1 border-t border-slate-300 flex items-center justify-between text-[8px]">
                {/* Simulated Barcode */}
                <div className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono font-bold text-[7.5px] text-slate-900 tracking-widest text-center">
                  |||||| || ||| {shareNo} |||| |||
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900 text-[8px]">ಆಡಳಿತ ಮಂಡಳಿ ಪರವಾಗಿ</div>
                  <div className="text-[7.5px] text-emerald-800 font-semibold">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
