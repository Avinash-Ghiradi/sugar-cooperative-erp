import React from 'react';
import { getShareholderSharesCount } from '../../services/api';

/**
 * SugarReceiptCard
 * Exact React representation of the Statutory Sugar Allotment Receipt Card
 * Matching official layout in media_1794224123638_936a8535.jpg
 */
export default function SugarReceiptCard({
  shareholder,
  seq = 1,
  isOfficeCopy = true,
  settings = {},
  qrUrl = ''
}) {
  if (!shareholder) return null;

  const copyLabel = isOfficeCopy ? 'ಕಛೇರಿ ಪ್ರತಿ' : 'ಶೇರುದಾರರ ಪ್ರತಿ';
  const copyBadgeBg = isOfficeCopy ? '#2563eb' : '#15803d';

  const shareNo = shareholder.share_no || shareholder.share_number || shareholder.id || '—';
  const name = shareholder.shareholder_name || shareholder.name || '—';
  const place = (shareholder.place || shareholder.village_name || 'ಮರಗೂರ').trim();
  const category = (shareholder.schedule_cast || shareholder.category || 'ದ - ವರ್ಗ').trim();

  const shares = getShareholderSharesCount(shareholder);
  const kg = shares * (settings.kg_per_share || 25);
  const rate = settings.sugar_rate_per_kg || 20;
  const amt = kg * rate;
  const formattedAmt = amt.toLocaleString('en-IN');
  const receiptNo = `${place}/${settings.receipt_year_code || '202627'}${String(seq).padStart(4, '0')}`;

  return (
    <div className="border-[1.8px] border-[#ea580c] rounded-lg bg-white text-slate-900 shadow-md flex flex-col overflow-hidden w-full select-none text-[10px] h-full justify-between">
      {/* 1. Header (Orange) */}
      <div className="bg-[#ea580c] text-white text-center py-1.5 px-2">
        <div className="font-extrabold text-[12px] leading-tight tracking-tight">
          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
        </div>
        <div className="text-[9px] font-medium opacity-95 leading-tight mt-0.5">
          ಮರಗೂರ 586 204 ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ
        </div>
      </div>

      {/* 2. Sub-Banner (Green) */}
      <div className="bg-[#047857] text-white flex justify-between items-center px-2 py-1">
        <span className="font-bold text-[10.5px] tracking-wide">ಸಕ್ಕರೆ ವಿತರಣಾ ರಶೀದಿ</span>
        <span
          className="text-[8.5px] font-bold px-2 py-0.5 rounded-full text-white tracking-wide"
          style={{ backgroundColor: copyBadgeBg }}
        >
          {copyLabel}
        </span>
      </div>

      {/* 3. Receipt No */}
      <div className="px-2 pt-1 pb-0.5 text-[#047857] font-semibold text-[10px] flex items-center">
        <span>ರಶೀದಿ ಸಂಖ್ಯೆ</span>
        <span className="mx-1">:</span>
        <strong className="font-bold font-mono text-[10.5px] text-[#047857]">{receiptNo}</strong>
      </div>

      {/* 4. Share No Banner (Deep Blue Pill) */}
      <div className="bg-[#1d4ed8] text-white font-bold text-[10.5px] px-2 py-1 mx-2 rounded flex items-center shadow-xs">
        <span>ಶೇರು ಸಂಖ್ಯೆ</span>
        <span className="mx-1">:</span>
        <strong className="font-mono text-[11px] tracking-wider">{shareNo}</strong>
      </div>

      {/* 5. Body: Details + QR */}
      <div className="p-2 flex justify-between items-center gap-2 flex-1">
        <div className="w-[68%] flex flex-col justify-around space-y-1">
          <div className="flex border-b border-dotted border-slate-300 pb-0.5 text-[9.5px]">
            <span className="w-18 font-semibold text-slate-700 flex-shrink-0">ಸದಸ್ಯರ ಹೆಸರು</span>
            <span className="mr-1">:</span>
            <span className="font-extrabold text-slate-950 truncate">{name}</span>
          </div>
          <div className="flex border-b border-dotted border-slate-300 pb-0.5 text-[9.5px]">
            <span className="w-18 font-semibold text-slate-700 flex-shrink-0">ವಿಳಾಸ</span>
            <span className="mr-1">:</span>
            <span className="font-semibold text-slate-800 truncate">{place}</span>
          </div>
          <div className="flex border-b border-dotted border-slate-300 pb-0.5 text-[9.5px]">
            <span className="w-18 font-semibold text-slate-700 flex-shrink-0">ಶೇರು ವರ್ಗ</span>
            <span className="mr-1">:</span>
            <span className="font-semibold text-slate-800 truncate">{category}</span>
          </div>
          <div className="flex border-b border-dotted border-slate-300 pb-0.5 text-[9.5px]">
            <span className="w-18 font-semibold text-slate-700 flex-shrink-0">ಒಟ್ಟು ಶೇರುಗಳು</span>
            <span className="mr-1">:</span>
            <span className="font-bold text-slate-900">{shares}</span>
          </div>
          <div className="flex text-[9.5px]">
            <span className="w-18 font-semibold text-slate-700 flex-shrink-0">ಪ್ರತಿ ಕೆ.ಜಿ ದರ</span>
            <span className="mr-1">:</span>
            <span className="font-semibold text-slate-800">ರೂ. {rate} /ಕೆ.ಜಿ</span>
          </div>
        </div>

        {/* QR Box */}
        <div className="w-[30%] flex flex-col items-center justify-center text-center">
          {qrUrl ? (
            <img src={qrUrl} alt="QR" className="w-16 h-16 object-contain shadow-xs border border-slate-100" />
          ) : (
            <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[9px]">
              QR
            </div>
          )}
          <span className="text-[6.5px] font-bold text-slate-500 mt-1 leading-none tracking-tight">
            ಪರಿಶೀಲನೆಗಾಗಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ
          </span>
        </div>
      </div>

      {/* 6. Calculations (Orange & Green Banners) */}
      <div className="px-2 space-y-1 pb-1">
        <div className="bg-[#ea580c] text-white flex justify-between items-center px-2.5 py-1 rounded text-[10px] font-bold shadow-xs">
          <span>ಅರ್ಹ ಸಕ್ಕರೆ</span>
          <span className="font-extrabold text-[11.5px]">{kg} ಕೆ.ಜಿ</span>
        </div>
        <div className="bg-[#047857] text-white flex justify-between items-center px-2.5 py-1 rounded text-[10px] font-bold shadow-xs">
          <span>ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ</span>
          <span className="font-extrabold text-[11.5px]">ರೂ. {formattedAmt}</span>
        </div>
      </div>

      {/* 7. Signatures */}
      <div className="flex justify-between items-center px-3 py-1.5 text-[9px] font-bold text-slate-800 border-t border-slate-100">
        <div>ಸದಸ್ಯರ ಸಹಿ</div>
        <div>ವಿತರಣಾಧಿಕಾರಿಗಳ ಸಹಿ</div>
      </div>
    </div>
  );
}
