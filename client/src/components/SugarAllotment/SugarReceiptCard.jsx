import React from 'react';
import { getShareholderSharesCount } from '../../services/api';
import { getCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import { COOP_HANDSHAKE_BASE64, getAbsoluteAssetUrl } from './sugarReceiptPrint';

/**
 * SugarReceiptCard
 * Exact React representation of the Statutory Sugar Allotment Receipt Card
 * Supports both:
 *  - 'stacked': Full-width landscape card (Top or Bottom of A4 sheet with 38px signature space & big fonts)
 *  - 'sideBySide': Portrait card (Office or Member Copy side-by-side)
 */
export default function SugarReceiptCard({
  shareholder,
  seq = 1,
  isOfficeCopy = true,
  settings = {},
  qrUrl = '',
  layout = 'stacked'
}) {
  if (!shareholder) return null;

  const isOffice = !!isOfficeCopy;
  const copyLabel = isOffice ? '🏢 ಕಛೇರಿ ಪ್ರತಿ (Office Copy)' : '👤 ಶೇರುದಾರರ ಪ್ರತಿ (Member Copy)';
  const copyBadgeClass = isOffice
    ? 'bg-gradient-to-r from-blue-900 to-blue-600 text-white border-blue-400'
    : 'bg-gradient-to-r from-emerald-900 to-emerald-600 text-white border-emerald-400';

  const shareNo = shareholder.share_no || shareholder.share_number || shareholder.id || '—';
  const name = shareholder.shareholder_name || shareholder.name || '—';
  const place = (shareholder.place || shareholder.village_name || 'ಮರಗೂರ').trim();
  const category = (shareholder.schedule_cast || shareholder.category || 'ಅ - ವರ್ಗ').trim();

  const shares = getShareholderSharesCount(shareholder);
  const kg = shares * (settings.kg_per_share || 25);
  const rate = settings.sugar_rate_per_kg || 20;
  const amt = kg * rate;
  const formattedAmt = amt.toLocaleString('en-IN');

  const yearCode = settings.receipt_year_code || '202627';
  const receiptNo = `${place}/${yearCode}/${String(seq).padStart(4, '0')}`;
  const seasonYear = settings.season_year || settings.receipt_year || '2026-27';

  const today = new Date();
  const receiptDate = settings.receipt_date || `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  // Logos
  const companyLogo = getAbsoluteAssetUrl(getCompanyLogo()) || getAbsoluteAssetUrl(DEFAULT_LOGO_PATH);
  const handshakeLogo = COOP_HANDSHAKE_BASE64;
  const sealLogo = getAbsoluteAssetUrl('./id_assets/society_seal.png');

  // =========================================================================
  // LAYOUT 1: STACKED FULL-WIDTH CARD (Recommended - 100% Page Utilization)
  // =========================================================================
  if (layout === 'stacked') {
    return (
      <div className="border-2 border-[#c2410c] rounded-xl bg-white text-slate-900 shadow-md flex flex-col overflow-hidden w-full select-none text-[11px] justify-between relative font-['Anek_Kannada',sans-serif]">
        {/* Background Security Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 opacity-[0.045] pointer-events-none z-0">
          <img src={sealLogo} alt="Seal" className="w-full h-auto grayscale" onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        {/* Header with Dual Logos */}
        <div className="bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 text-white py-1.5 px-3 flex items-center justify-between gap-2 border-b-2 border-amber-600 relative z-10">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 shadow-sm border border-yellow-200">
            <img src={companyLogo} alt="BSSKN" className="w-full h-full object-contain" onError={(e) => { e.target.src = './id_assets/bsskn_logo.png'; }} />
          </div>

          <div className="flex-1 text-center leading-tight">
            <div className="font-black text-[14px] leading-tight text-white drop-shadow-sm">
              ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ
            </div>
            <div className="text-[9.5px] font-medium text-amber-100 leading-tight mt-0.5">
              ಮರಗೂರ - 586 204, ತಾ|| ಇಂಡಿ, ಜಿ|| ವಿಜಯಪುರ (ಕರ್ನಾಟಕ)
            </div>
            <div className="text-[8px] font-extrabold text-white bg-black/20 inline-block px-2.5 py-0.2 rounded-full mt-0.5 border border-white/30">
              ಸಕ್ಕರೆ ವಿತರಣಾ ವಿಭಾಗ • ಸೀಸನ್: {seasonYear}
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 shadow-sm border border-yellow-200">
            <img src={handshakeLogo} alt="Sahakari" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Sub-Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 text-white flex justify-between items-center px-3 py-1 relative z-10 border-b border-emerald-600">
          <span className="font-extrabold text-[11.5px] tracking-wide flex items-center gap-1.5">
            <span className="text-yellow-300 text-[9px]">✦</span>
            <span>ಸಕ್ಕರೆ ವಿತರಣಾ ಅಧಿಕೃತ ರಶೀದಿ</span>
          </span>
          <span className={`text-[9px] font-extrabold px-3 py-0.5 rounded-full tracking-wide border shadow-xs ${copyBadgeClass}`}>
            {copyLabel}
          </span>
        </div>

        {/* Metadata Strip */}
        <div className="px-3 py-1 bg-slate-50 border-b border-slate-200 text-[10.5px] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-bold">ರಶೀದಿ ಸಂಖ್ಯೆ :</span>
            <strong className="font-mono text-[11px] text-emerald-800 font-black">{receiptNo}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-bold">ದಿನಾಂಕ :</span>
            <strong className="text-[10.5px] text-slate-800 font-black">{receiptDate}</strong>
          </div>
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-2.5 py-0.5 rounded-md flex items-center gap-2">
            <span className="text-blue-100 font-bold text-[9.5px]">ಶೇರು ಸಂಖ್ಯೆ:</span>
            <strong className="font-mono text-[12.5px] font-black text-amber-300">{shareNo}</strong>
            <span className="bg-white/20 border border-white/40 px-2 py-0.2 rounded-full text-[8.5px] font-extrabold">
              ವರ್ಗ: {category}
            </span>
          </div>
        </div>

        {/* Body Grid: Left Details (63%), Right Calculations & QR (37%) */}
        <div className="p-3 flex justify-between items-center gap-4 flex-1 relative z-10">
          <div className="w-[63%] space-y-1">
            <div className="flex items-baseline border-b border-dashed border-slate-200 pb-0.8 text-[11px]">
              <span className="w-24 font-bold text-slate-700 shrink-0">ಸದಸ್ಯರ ಹೆಸರು</span>
              <span className="mx-1 font-bold text-slate-400">:</span>
              <span className="font-black text-slate-950 truncate text-[13px]">{name}</span>
            </div>
            <div className="flex items-baseline border-b border-dashed border-slate-200 pb-0.8 text-[11px]">
              <span className="w-24 font-bold text-slate-700 shrink-0">ವಿಳಾಸ / ಗ್ರಾಮ</span>
              <span className="mx-1 font-bold text-slate-400">:</span>
              <span className="font-bold text-slate-800 truncate">{place}</span>
            </div>
            <div className="flex items-baseline border-b border-dashed border-slate-200 pb-0.8 text-[11px]">
              <span className="w-24 font-bold text-slate-700 shrink-0">ಶೇರು ವರ್ಗ</span>
              <span className="mx-1 font-bold text-slate-400">:</span>
              <span className="font-bold text-slate-800 truncate">{category}</span>
            </div>
            <div className="flex items-baseline border-b border-dashed border-slate-200 pb-0.8 text-[11px]">
              <span className="w-24 font-bold text-slate-700 shrink-0">ಒಟ್ಟು ಶೇರುಗಳು</span>
              <span className="mx-1 font-bold text-slate-400">:</span>
              <span className="font-black text-slate-900">{shares} (ಶೇರುಗಳು)</span>
            </div>
            <div className="flex items-baseline text-[11px]">
              <span className="w-24 font-bold text-slate-700 shrink-0">ಪ್ರತಿ ಕೆ.ಜಿ ದರ</span>
              <span className="mx-1 font-bold text-slate-400">:</span>
              <span className="font-bold text-slate-800">ರೂ. {rate} /- (ಪ್ರತಿ ಕಿ.ಗ್ರಾಂ)</span>
            </div>
          </div>

          <div className="w-[37%] flex items-center justify-between gap-2.5">
            <div className="flex-1 space-y-1">
              <div className="bg-gradient-to-r from-orange-700 to-orange-500 text-white flex justify-between items-center px-2.5 py-1 rounded-md text-[10.5px] font-extrabold shadow-xs">
                <span>ಅರ್ಹ ಸಕ್ಕರೆ :</span>
                <span className="font-black text-[13.5px]">{kg} <span className="text-[9.5px] font-bold">ಕಿ.ಗ್ರಾಂ</span></span>
              </div>
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white flex justify-between items-center px-2.5 py-1 rounded-md text-[10.5px] font-extrabold shadow-xs">
                <span>ಪಾವತಿ ಮೊತ್ತ :</span>
                <span className="font-black text-[13.5px]">ರೂ. {formattedAmt} <span className="text-[9.5px] font-bold">/-</span></span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center shrink-0">
              <div className="bg-white border border-slate-300 rounded-md p-1 shadow-xs">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR" className="w-14 h-14 object-contain" />
                ) : (
                  <div className="w-14 h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[9px]">
                    QR
                  </div>
                )}
              </div>
              <span className="text-[6.5px] font-extrabold text-slate-600 mt-0.5 leading-tight">
                ದೃಢೀಕರಣಕ್ಕೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ
              </span>
            </div>
          </div>
        </div>

        {/* Signatures with Ample 35px Open Space to Sign */}
        <div className="flex justify-between items-end px-4 pt-1 pb-2 text-[8.5px] font-black text-slate-800 border-t border-slate-100 relative z-10 text-center">
          <div className="w-[30%]">
            <div className="h-9"></div> {/* Dedicated open physical space to sign! */}
            <div className="border-t border-dotted border-slate-400 mb-1" />
            <div>ಶೇರುದಾರರ / ಸ್ವೀಕೃತಿದಾರರ ಸಹಿ ಅಥವಾ ಹೆಬ್ಬೆರಳು</div>
          </div>
          <div className="w-[30%]">
            <div className="h-9"></div>
            <div className="border-t border-dotted border-slate-400 mb-1" />
            <div>ತೂಕಗಾರರ ಸಹಿ</div>
          </div>
          <div className="w-[30%]">
            <div className="h-9"></div>
            <div className="border-t border-dotted border-slate-400 mb-1" />
            <div>ಸಕ್ಕರೆ ವಿತರಕರ / ಲೆಕ್ಕಾಧಿಕಾರಿಗಳ ಸಹಿ & ಮೊಹರು</div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LAYOUT 2: SIDE-BY-SIDE CARD (Compact A4 Half - 2 Shareholders per A4 Sheet)
  // =========================================================================
  return (
    <div className="border-[1.8px] border-[#c2410c] rounded-xl bg-white text-slate-900 shadow-md flex flex-col overflow-hidden w-full select-none text-[11px] h-full justify-between relative font-['Anek_Kannada',sans-serif]">
      {/* Background Security Seal Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 opacity-[0.045] pointer-events-none z-0">
        <img src={sealLogo} alt="Seal Watermark" className="w-full h-auto grayscale" onError={(e) => { e.target.style.display = 'none'; }} />
      </div>

      {/* 1. Header (Deep Saffron Gradient + Dual Logos) */}
      <div className="bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 text-white py-1 px-2.5 flex items-center justify-between gap-1.5 border-b-2 border-amber-600 relative z-10">
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 shadow-sm border border-yellow-200">
          <img src={companyLogo} alt="BSSKN" className="w-full h-full object-contain" onError={(e) => { e.target.src = './id_assets/bsskn_logo.png'; }} />
        </div>
        <div className="flex-1 text-center leading-tight">
          <div className="font-black text-[13.5px] leading-tight text-white drop-shadow-sm">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ
          </div>
          <div className="text-[9.5px] font-semibold text-amber-100 leading-tight mt-0.5">
            ಮರಗೂರ - 586 204, ತಾ|| ಇಂಡಿ, ಜಿ|| ವಿಜಯಪುರ (ಕರ್ನಾಟಕ)
          </div>
          <div className="text-[8px] font-extrabold text-white bg-black/20 inline-block px-2.5 py-0.2 rounded-full mt-0.5 border border-white/30">
            ಸಕ್ಕರೆ ವಿತರಣಾ ವಿಭಾಗ • ಸೀಸನ್: {seasonYear}
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 shadow-sm border border-yellow-200">
          <img src={handshakeLogo} alt="Sahakari" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* 2. Sub-Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 text-white flex justify-between items-center px-3 py-1 relative z-10 border-b border-emerald-600">
        <span className="font-extrabold text-[11px] tracking-wide flex items-center gap-1">
          <span className="text-yellow-300 text-[8.5px]">✦</span>
          <span>ಸಕ್ಕರೆ ವಿತರಣಾ ಅಧಿಕೃತ ರಶೀದಿ</span>
        </span>
        <span className={`text-[8.5px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide border shadow-xs ${copyBadgeClass}`}>
          {copyLabel}
        </span>
      </div>

      {/* 3. Receipt No & Date Row */}
      <div className="px-3 py-0.8 bg-slate-50 border-b border-slate-200 text-[10.5px] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-bold">ರಶೀದಿ ಸಂ:</span>
          <strong className="font-mono text-[11px] text-emerald-800 font-black">{receiptNo}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-bold">ದಿನಾಂಕ:</span>
          <strong className="text-[10.5px] text-slate-800 font-black">{receiptDate}</strong>
        </div>
      </div>

      {/* 4. Share No Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 text-white font-bold text-[11px] px-3 py-1 mx-1.5 my-0.8 rounded flex items-center justify-between shadow-xs relative z-10">
        <div className="flex items-baseline gap-1.5">
          <span className="text-blue-100 font-bold text-[10px]">ಶೇರು ಸಂಖ್ಯೆ:</span>
          <strong className="font-mono text-[13.5px] font-black text-amber-300 tracking-wider">{shareNo}</strong>
        </div>
        <div className="bg-white/20 border border-white/40 px-2.5 py-0.2 rounded-full text-[9px] font-extrabold">
          ವರ್ಗ: {category}
        </div>
      </div>

      {/* 5. Body: Details + QR */}
      <div className="px-2.5 py-1.5 flex justify-between items-center gap-2 flex-1 relative z-10">
        <div className="w-[69%] flex flex-col justify-center space-y-1">
          <div className="flex items-baseline border-b border-dashed border-slate-300 pb-0.8 text-[10.5px]">
            <span className="w-20 font-bold text-slate-700 shrink-0">ಸದಸ್ಯರ ಹೆಸರು</span>
            <span className="mx-0.5 font-bold text-slate-500">:</span>
            <span className="font-black text-slate-950 truncate text-[12.5px]">{name}</span>
          </div>
          <div className="flex items-baseline border-b border-dashed border-slate-300 pb-0.8 text-[10.5px]">
            <span className="w-20 font-bold text-slate-700 shrink-0">ವಿಳಾಸ / ಗ್ರಾಮ</span>
            <span className="mx-0.5 font-bold text-slate-500">:</span>
            <span className="font-bold text-slate-800 truncate">{place}</span>
          </div>
          <div className="flex items-baseline border-b border-dashed border-slate-300 pb-0.8 text-[10.5px]">
            <span className="w-20 font-bold text-slate-700 shrink-0">ಶೇರು ವರ್ಗ</span>
            <span className="mx-0.5 font-bold text-slate-500">:</span>
            <span className="font-bold text-slate-800 truncate">{category}</span>
          </div>
          <div className="flex items-baseline border-b border-dashed border-slate-300 pb-0.8 text-[10.5px]">
            <span className="w-20 font-bold text-slate-700 shrink-0">ಒಟ್ಟು ಶೇರುಗಳು</span>
            <span className="mx-0.5 font-bold text-slate-500">:</span>
            <span className="font-black text-slate-900">{shares} (ಶೇರುಗಳು)</span>
          </div>
          <div className="flex items-baseline text-[10.5px]">
            <span className="w-20 font-bold text-slate-700 shrink-0">ಪ್ರತಿ ಕೆ.ಜಿ ದರ</span>
            <span className="mx-0.5 font-bold text-slate-500">:</span>
            <span className="font-bold text-slate-800">ರೂ. {rate} /- (ಪ್ರತಿ ಕಿ.ಗ್ರಾಂ)</span>
          </div>
        </div>

        {/* QR Box */}
        <div className="w-[29%] flex flex-col items-center justify-center text-center">
          <div className="bg-white border border-slate-300 rounded-md p-1 shadow-xs">
            {qrUrl ? (
              <img src={qrUrl} alt="QR" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[9px]">
                QR
              </div>
            )}
          </div>
          <span className="text-[7px] font-extrabold text-slate-600 mt-0.8 leading-tight tracking-tight">
            ದೃಢೀಕರಣಕ್ಕಾಗಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ
          </span>
        </div>
      </div>

      {/* 6. Calculations */}
      <div className="px-2.5 space-y-1 pb-1 relative z-10">
        <div className="bg-gradient-to-r from-orange-700 to-orange-500 text-white flex justify-between items-center px-3 py-1 rounded text-[10.5px] font-extrabold shadow-xs">
          <span>ಒಟ್ಟು ಅರ್ಹ ಸಕ್ಕರೆ :</span>
          <span className="font-black text-[13px]">{kg} <span className="text-[9px] font-bold">ಕಿ.ಗ್ರಾಂ</span></span>
        </div>
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white flex justify-between items-center px-3 py-1 rounded text-[10.5px] font-extrabold shadow-xs">
          <span>ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ :</span>
          <span className="font-black text-[13px]">ರೂ. {formattedAmt} <span className="text-[9px] font-bold">/-</span></span>
        </div>
      </div>

      {/* 7. Signatures with 38px Dedicated Physical Signing Space */}
      <div className="flex justify-between items-end px-3 pt-1 pb-1.5 text-[8px] font-black text-slate-800 border-t border-slate-100 relative z-10 text-center">
        <div className="w-[31%]">
          <div className="h-9"></div> {/* 36px dedicated space! */}
          <div className="border-t-2 border-dotted border-slate-400 mb-1" />
          <div>ಶೇರುದಾರರ ಸಹಿ / ಹೆಬ್ಬೆರಳು</div>
        </div>
        <div className="w-[31%]">
          <div className="h-9"></div>
          <div className="border-t-2 border-dotted border-slate-400 mb-1" />
          <div>ತೂಕಗಾರರ ಸಹಿ</div>
        </div>
        <div className="w-[31%]">
          <div className="h-9"></div>
          <div className="border-t-2 border-dotted border-slate-400 mb-1" />
          <div>ಸಕ್ಕರೆ ವಿತರಕರ ಸಹಿ & ಮೊಹರು</div>
        </div>
      </div>
    </div>
  );
}
