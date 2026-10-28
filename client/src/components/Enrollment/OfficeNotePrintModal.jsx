import { getCompanyLogo } from '../../services/organizationService';
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Download, FileText, CheckCircle2, Receipt } from 'lucide-react';

// Number to Kannada words helper
export function convertAmountToKannadaWords(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n === 0) return 'ಶೂನ್ಯ ರೂಪಾಯಿಗಳು ಮಾತ್ರ';

  // Exact sugar cooperative mappings for common enrollment values
  const exactMap = {
    2000: 'ಎರಡು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    4000: 'ನಾಲ್ಕು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    5000: 'ಐದು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    6000: 'ಆರು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    8000: 'ಎಂಟು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    10000: 'ಹತ್ತು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    20000: 'ಇಪ್ಪತ್ತು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    24000: 'ಇಪ್ಪತ್ತನಾಲು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    24570: 'ಇಪ್ಪತ್ತನಾಲ್ಕು ಸಾವಿರದ ಐನೂರ ಎಪ್ಪತ್ತು ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    25000: 'ಇಪ್ಪತ್ತೈದು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    25570: 'ಇಪ್ಪತ್ತೈದು ಸಾವಿರದ ಐನೂರ ಎಪ್ಪತ್ತು ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    48000: 'ನಲವತ್ತೆಂಟು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    50000: 'ಐವತ್ತು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    72000: 'ಎಪ್ಪತ್ತೆರಡು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    96000: 'ತೊಂಬತ್ತಾರು ಸಾವಿರ ರೂಪಾಯಿಗಳು ಮಾತ್ರ',
    100000: 'ಒಂದು ಲಕ್ಷ ರೂಪಾಯಿಗಳು ಮಾತ್ರ'
  };

  if (exactMap[n]) return exactMap[n];

  const units = ['', 'ಒಂದು', 'ಎರಡು', 'ಮೂರು', 'ನಾಲ್ಕು', 'ಐದು', 'ಆರು', 'ಏಳು', 'ಎಂಟು', 'ಒಂಬತ್ತು'];
  const teens = ['ಹತ್ತು', 'ಹನ್ನೊಂದು', 'ಹನ್ನೆರಡು', 'ಹದಿಮೂರು', 'ಹದಿನಾಲ್ಕು', 'ಹದಿನೈದು', 'ಹದಿನಾರು', 'ಹದಿನೇಳು', 'ಹದಿನೆಂಟು', 'ಹತ್ತೊಂಬತ್ತು'];
  const tens = ['', '', 'ಇಪ್ಪತ್ತು', 'ಮೂವತ್ತು', 'ನಲವತ್ತು', 'ಐವತ್ತು', 'ಅರವತ್ತು', 'ಎಪ್ಪತ್ತು', 'ಎಂಬತ್ತು', 'ತೊಂಬತ್ತು'];

  const convertBelow1000 = (val) => {
    let str = '';
    const h = Math.floor(val / 100);
    const r = val % 100;
    if (h > 0) {
      const hMap = ['', 'ನೂರು', 'ಇನ್ನೂರು', 'ಮುನ್ನೂರು', 'ನಾನ್ನೂರು', 'ಐನೂರು', 'ಆರುನೂರು', 'ಏಳುನೂರು', 'ಎಂಟುನೂರು', 'ಒಂಬೈನೂರು'];
      str += (hMap[h] || `${units[h]} ನೂರು`) + ' ';
    }
    if (r > 0) {
      if (r < 10) str += units[r];
      else if (r < 20) str += teens[r - 10];
      else {
        const t = Math.floor(r / 10);
        const u = r % 10;
        if (u === 0) str += tens[t];
        else str += tens[t].replace(/ು$/, '್ತ') + units[u];
      }
    }
    return str.trim();
  };

  let result = '';
  const lakh = Math.floor(n / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  if (lakh > 0) result += convertBelow1000(lakh) + ' ಲಕ್ಷ ';
  if (thousand > 0) result += convertBelow1000(thousand) + ' ಸಾವಿರ ';
  if (rest > 0) result += convertBelow1000(rest);

  return (result.trim() + ' ರೂಪಾಯಿಗಳು ಮಾತ್ರ').replace(/\s+/g, ' ');
}

// Date formatter DD/MM/YYYY
export function formatKannadaDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  const clean = String(dateStr).trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return clean;
}

// Classic Cooperative Handshake Icon (Two Clasped Hands with Suit Sleeves)
export function CooperativeHandshakeIcon({ className = "w-24 h-14" }) {
  return (
    <svg viewBox="0 0 140 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left Suit Sleeve (Black) */}
      <polygon points="4,12 30,20 30,54 4,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      {/* Left Shirt Cuff (White) */}
      <polygon points="30,20 36,22 36,52 30,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      
      {/* Right Suit Sleeve (Black) */}
      <polygon points="136,12 110,20 110,54 136,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      {/* Right Shirt Cuff (White) */}
      <polygon points="110,20 104,22 104,52 110,54" fill="#fff" stroke="#000" strokeWidth="1.5" />

      {/* Left Hand Base & Thumb */}
      <path d="M 36 26 C 46 21, 56 25, 64 31 C 68 34, 70 39, 68 43 C 65 47, 58 49, 50 49 C 42 49, 36 47, 36 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      {/* Right Hand Wrapping Over */}
      <path d="M 104 25 C 94 20, 84 23, 76 28 C 70 32, 67 38, 70 43 C 74 48, 84 49, 92 48 C 100 47, 104 47, 104 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      
      {/* Clasping Fingers Details */}
      <path d="M 74 33 C 79 35, 82 40, 81 44" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 68 36 C 73 38, 76 43, 75 46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 62 39 C 67 41, 70 45, 69 48" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 56 42 C 61 44, 64 47, 63 49" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      {/* Thumb contour */}
      <path d="M 40 28 C 50 24, 60 29, 66 34" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function OfficeNotePrintModal({ isOpen, onClose, enrollment, isNewSubmission = false }) {
  const [logoError, setLogoError] = useState(false);
  const [activeFormat, setActiveFormat] = useState('note'); // 'note' | 'receipt'

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('office-note-printing');
    }
    return () => {
      document.body.classList.remove('office-note-printing');
    };
  }, [isOpen]);

  if (!isOpen || !enrollment) return null;

  // Resolve values
  const dateStr = formatKannadaDate(enrollment.date || enrollment.reg_date || new Date());
  const fullNameRaw = (enrollment.full_name || enrollment.shareholder_name || enrollment.name || '').trim();
  const applicantName = fullNameRaw.startsWith('ಶ್ರೀ') || fullNameRaw.startsWith('ಶ್ರೀಮತಿ')
    ? fullNameRaw
    : `ಶ್ರೀ ${fullNameRaw}`;

  const place = (enrollment.place || enrollment.village_name || 'ಚಣೆಗಾಂವ').trim();
  const taluk = (enrollment.taluk || 'ಚಡಚಣ').trim();
  const dist = (enrollment.dist || enrollment.district || 'ವಿಜಯಪೂರ').trim();

  // Category: e.g. "ಡ ವರ್ಗ" or "ಅ ವರ್ಗ" or "ಬ ವರ್ಗ"
  let category = (enrollment.category || enrollment.schedule_cast || 'ಡ ವರ್ಗ').trim();
  if (!category.includes('ವರ್ಗ')) category = `${category} ವರ್ಗ`;

  const isClassB = category.includes('ಬ');
  const faceValue = isClassB ? '5000' : '2000';
  const faceValueWords = isClassB ? 'ಐದು ಸಾವಿರ' : 'ಎರಡು ಸಾವಿರ';

  const noShares = parseInt(enrollment.no_shares || enrollment.number_of_shares) || 1;
  const shareAmount = parseFloat(enrollment.share_amount) || (noShares * (isClassB ? 25000 : 24000));
  const admissionFee = parseFloat(enrollment.admission_fee) || 570;
  const totalAmount = parseFloat(enrollment.total_amount) || (shareAmount + admissionFee);

  const shareAmountFormatted = Number(shareAmount).toLocaleString('en-IN');
  const shareAmountInWords = convertAmountToKannadaWords(shareAmount);

  const handlePrint = () => {
    document.body.classList.add('office-note-printing');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const logoSrc = getCompanyLogo();

  return (
    <>
      {/* Print Specific CSS to guarantee exact A4 Border, Margins, and Crisp Text */}
      <style>{`
        @media screen {
          .office-note-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body.office-note-printing > #root {
            display: none !important;
            visibility: hidden !important;
          }
          body.office-note-printing .shareholder-record-print-portal,
          body.office-note-printing .id-card-profile-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
          body.office-note-printing {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.office-note-printing > .office-note-print-portal,
          body.office-note-printing .office-note-print-portal {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Anek Kannada', 'Noto Sans Kannada', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.office-note-printing .office-note-print-portal .office-note-a4-sheet {
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 270mm !important;
            padding: 16px 20px 24px 20px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Screen Modal Dialog */}
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Top Action Bar */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-400 font-bold shadow">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>ಕಛೇರಿ ಟಿಪ್ಪಣಿ ಮುದ್ರಣ (Official Office Note Sheet Print)</span>
                  {isNewSubmission && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Newly Enrolled)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ಶೇರುದಾರರ ವಿವರಗಳನ್ನೊಳಗೊಂಡ ಅಧಿಕೃತ ಆಡಳಿತ ಕಛೇರಿ ಟಿಪ್ಪಣಿ ಪತ್ರ (A4 Format)
                </p>
              </div>
            </div>

            {/* Format Toggle & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-semibold mr-1">
                <button
                  type="button"
                  onClick={() => setActiveFormat('note')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeFormat === 'note'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ಕಛೇರಿ ಟಿಪ್ಪಣಿ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormat('receipt')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeFormat === 'receipt'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>ಪ್ರವೇಶ ರಶೀದಿ</span>
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                title="ಮುದ್ರಿಸಿ (Print Document)"
              >
                <Printer className="w-4 h-4" />
                <span>ಮುದ್ರಿಸಿ (Print)</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                title="ಮುಕ್ತಾಯ (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Preview Area (Scrollable with exact A4 sheet centered) */}
          <div className="p-4 sm:p-6 bg-slate-950/50 overflow-y-auto flex justify-center">
            
            {activeFormat === 'note' ? (
              /* ========================================================================= */
              /* FORMAT 1: ಕಛೇರಿ ಟಿಪ್ಪಣಿ (Exact Match with Uploaded Image)                  */
              /* ========================================================================= */
              <div className="office-note-a4-sheet bg-white text-black border-[2.5px] border-black w-full max-w-[790px] min-h-[1050px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-sizing-border">
                
                <div>
                  {/* 1. Header Box with Double-Section Border */}
                  <div className="border-[2px] border-black mb-4">
                    {/* Top Area: Logo, Title, Handshake */}
                    <div className="flex items-center justify-between p-2 pb-1.5">
                      {/* Left: Factory Emblem / Logo */}
                      <div className="w-24 flex items-center justify-center shrink-0">
                        {!logoError ? (
                          <img
                            src={logoSrc}
                            alt="B.S.S.K.N Logo"
                            onError={() => setLogoError(true)}
                            className="h-[74px] w-auto object-contain"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full border border-black flex flex-col items-center justify-center text-[9px] font-bold text-center leading-tight">
                            <span>BSSKN</span>
                            <span>ಮರಗೂರ</span>
                          </div>
                        )}
                      </div>

                      {/* Center: Official Title */}
                      <div className="flex-1 text-center px-1">
                        <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-black leading-tight">
                          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
                        </h1>
                        <h2 className="text-[11px] sm:text-[12px] font-bold tracking-wider text-black uppercase font-sans mt-0.5">
                          SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
                        </h2>
                        <div className="mt-1">
                          <span className="text-2xl sm:text-[26px] font-black text-black tracking-wide inline-block border-b-2 border-black pb-0.5">
                            ಕಛೇರಿ ಟಿಪ್ಪಣಿ
                          </span>
                        </div>
                      </div>

                      {/* Right: Handshake Emblem */}
                      <div className="w-24 flex items-center justify-center shrink-0">
                        <CooperativeHandshakeIcon className="w-20 h-12" />
                      </div>
                    </div>

                    {/* Bottom Line of Header Box */}
                    <div className="border-t-[2px] border-black flex items-center justify-between px-4 py-1 text-sm font-bold bg-white">
                      <span>ತಾಲೂಕಾ || ಚಡಚಣ</span>
                      <span>ಜಿಲ್ಲಾ || ವಿಜಯಪೂರ</span>
                    </div>
                  </div>

                  {/* 2. Submission & Date Line */}
                  <div className="flex items-center justify-between text-base font-bold mb-5 px-1">
                    <span>ಸಲ್ಲಿಸಲಾಗಿದೆ.)</span>
                    <span>ದಿನಾಂಕ:-{dateStr}</span>
                  </div>

                  {/* 3. Main Official Body Paragraph */}
                  <div className="text-[15.5px] leading-[2.2] text-justify font-normal px-2 text-black">
                    <p className="indent-12">
                      ನಮ್ಮ ಕಾರ್ಖಾನೆಯ ಆರ್ಥಿಕ ಸಧೃಡತೆಗೋಸ್ಕರ ಶೇರು ಮೌಲ್ಯ ಮತ್ತು ಶೇರು ಆಕರಣೆ ಮತ್ತು ಇತರ ಮೌಲ್ಯಗಳಿಂದ ಸ್ವಂತ ಬಂಡವಾಳ ವೃದ್ಧಿಸುವ ಸಲುವಾಗಿ ನಮ್ಮ ಕಾರ್ಖಾನೆಯ ಸನ್ 2020/21ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಸರ್ವ ಸಾಧಾರಣ ಸಭೆಯಲ್ಲಿ ಸುಧೀರ್ಘವಾಗಿ ಚರ್ಚಿಸಿ ಸದಸ್ಯರ ಶೇರು ವಂತಿಕೆಯನ್ನು ಪ್ರತಿ ಶೇರು ರೂಪಾಯಿ {faceValue}/- {faceValueWords} ಮುಖ ಬೆಲೆಯ, <span className="font-bold underline">ರೂ.{shareAmountFormatted}/-</span> ಹಾಗೂ ಸದಸ್ಯತ್ವ ಪ್ರವೇಶ ಶುಲ್ಕ <span className="font-bold underline">ರೂ {admissionFee}/-</span> ಹೀಗಾಗಿ <span className="font-bold underline">{noShares}</span> ಶೇರುಗಳ ಮೊತ್ತ <span className="font-bold underline">ರೂ. {shareAmountFormatted}/- ({shareAmountInWords})</span> ಗಳನ್ನು ಕಾರ್ಯ ವ್ಯಾಪ್ತಿಯ ಸದಸ್ಯರಿಂದ ಸದಸ್ಯ ವಂತಿಕೆಯನ್ನು ಶೇರು ಸಂಗ್ರಹಣೆ ಮಾಡಲು ಸನ್ 2020-21 ನೇ ಸಾಲಿನ ದಿನಾಂಕ 24/12/2021 ಸಭೆಯಲ್ಲಿ ಠರಾವು ನಂ.10(1) ನಿರ್ಣಯಿಸಲಾಗುತ್ತದೆ. ಅದರನ್ವಯ <strong className="font-bold underline">{applicantName} ಸಾ|| {place} ತಾ||{taluk} ಜಿ||{dist}</strong> ನಮ್ಮ ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬರುತ್ತಿದ್ದು ಕಾರ್ಖಾನೆಯ <strong className="font-bold underline">"{category}"</strong>ದ ಸದಸ್ಯನಾಗಲು ವಿನಂತಿಸಿರುತ್ತಾರೆ.ಹಾಗೂ ನಗದು ಹಣ ಭರಣಾ ಮಾಡಿರುತ್ತಾರೆ. ಹೀಗಾಗಿ ಮೆ|| ರವರು ಅನುಮೋದಿಸಬಹುದು.
                    </p>
                  </div>

                  {/* 4. Department Sign-Off */}
                  <div className="text-right pr-8 my-8">
                    <span className="text-base font-bold text-black inline-block">
                      ಶೇರು ವಿಭಾಗ
                    </span>
                  </div>
                </div>

                {/* 5. Official Approval Hierarchy Signature Flow */}
                <div className="pl-4 pb-2 space-y-8 text-[15.5px] font-bold text-black">
                  <div className="flex items-center justify-between">
                    <span>1. ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>2. ಅಧೀಕ್ಷಕರು</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>3. ಲೆಕ್ಕಪತ್ರ ವಿಭಾಗ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>4. ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>5. ಮಾನ್ಯ ಅಧ್ಯಕ್ಷರು</span>
                  </div>
                </div>

              </div>
            ) : (
              /* ========================================================================= */
              /* FORMAT 2: ಪ್ರವೇಶ ರಶೀದಿ (Official Admission Receipt Slip)                  */
              /* ========================================================================= */
              <div className="office-note-a4-sheet bg-white text-black border-[2px] border-black w-full max-w-[790px] min-h-[900px] p-6 sm:p-8 flex flex-col justify-between shadow-2xl font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-sizing-border space-y-4">
                
                {/* Header */}
                <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-wide">
                    ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
                  </h2>
                  <p className="text-[11px] text-slate-700 font-medium">
                    ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
                  </p>
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]">
                    ಹೊಸ ಶೇರುದಾರರ ಪ್ರವೇಶ ರಶೀದಿ ಮತ್ತು ಠರಾವು ನಮೂನೆ (New Shareholder Admission Receipt)
                  </div>
                </div>

                {/* Receipt Info Row */}
                <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-400 pb-2">
                  <div>
                    <span className="text-slate-600">ನೋಂದಣಿ ಸಂಖ್ಯೆ (Enrollment ID): </span>
                    <span className="font-mono font-bold text-slate-900">{enrollment.enrollment_id || `ENR-${enrollment.id}`}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">ರಶೀದಿ ನಂ (Receipt No): </span>
                    <span className="font-mono font-bold text-slate-900">{enrollment.receipt_no || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">ದಿನಾಂಕ (Date): </span>
                    <span className="font-bold text-slate-900">{dateStr}</span>
                  </div>
                </div>

                {/* Member Details */}
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-300">
                  <div className="col-span-2 space-y-1.5">
                    <div>
                      <span className="text-slate-500">ಶೇರುದಾರರ ಹೆಸರು: </span>
                      <span className="font-bold text-sm text-slate-900">{applicantName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">ಸ್ಥಳ / ಗ್ರಾಮ: </span>
                      <span className="font-semibold text-slate-900">{place}</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-slate-500">ತಾಲೂಕು: </span>
                        <span className="font-semibold text-slate-900">{taluk}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">ಜಿಲ್ಲೆ: </span>
                        <span className="font-semibold text-slate-900">{dist}</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo box */}
                  <div className="flex justify-end">
                    <div className="w-24 h-28 border border-slate-400 rounded bg-slate-50 flex items-center justify-center overflow-hidden text-[10px] text-slate-400">
                      {enrollment.photo ? (
                        <img src={enrollment.photo} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <span>ಭಾವಚಿತ್ರ</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shares & Statutory Fees Table */}
                <table className="w-full border border-slate-400 text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-400 font-bold">
                    <tr>
                      <th className="p-2 border-r border-slate-400">ವಿವರ (Particulars)</th>
                      <th className="p-2 border-r border-slate-400 text-center">ಶೇರುಗಳ ಸಂಖ್ಯೆ</th>
                      <th className="p-2 border-r border-slate-400 text-center">ವರ್ಗ</th>
                      <th className="p-2 text-right">ಮೊತ್ತ (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr>
                      <td className="p-2 border-r border-slate-400 font-medium">ಶೇರು ಬಂಡವಾಳ ಠೇವಣಿ (Share Capital Amount)</td>
                      <td className="p-2 border-r border-slate-400 text-center font-bold">{noShares}</td>
                      <td className="p-2 border-r border-slate-400 text-center">{category}</td>
                      <td className="p-2 text-right font-mono font-bold">₹ {shareAmountFormatted}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-slate-400 font-medium">ಶೇರು ಪ್ರವೇಶ ಶುಲ್ಕ (Admission Fee)</td>
                      <td className="p-2 border-r border-slate-400 text-center font-bold">{noShares}</td>
                      <td className="p-2 border-r border-slate-400 text-center">—</td>
                      <td className="p-2 text-right font-mono font-bold">₹ {Number(admissionFee).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold text-sm">
                      <td colSpan="3" className="p-2 border-r border-slate-400 text-right">ಒಟ್ಟು ಪಾವತಿಸಿದ ಮೊತ್ತ (Total Amount Received):</td>
                      <td className="p-2 text-right text-emerald-800 font-mono">₹ {Number(totalAmount).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="pt-8 flex justify-between items-end text-center text-xs">
                  <div className="space-y-1">
                    <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                      ಶೇರುದಾರರ ಸಹಿ / ಹೆಬ್ಬೆಟ್ಟು
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                      ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                      ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              ನೋಂದಣಿ ID: <strong className="text-emerald-400 font-mono">{enrollment.enrollment_id || `ENR-${enrollment.id}`}</strong>
              {enrollment.receipt_no ? ` • ರಶೀದಿ: #${enrollment.receipt_no}` : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>ಮುದ್ರಿಸಿ (Print)</span>
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
              >
                ಮುಕ್ತಾಯ (Close)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Standalone Print Portal (Portaled directly to document.body outside #root) */}
      {typeof document !== 'undefined' && createPortal(
        <div className="office-note-print-portal">
        {activeFormat === 'note' ? (
          <div className="office-note-a4-sheet bg-white text-black border-[2.5px] border-black w-full min-h-[277mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-sizing-border">
            <div>
              {/* Header Box */}
              <div className="border-[2px] border-black mb-4">
                <div className="flex items-center justify-between p-2 pb-1.5">
                  <div className="w-24 flex items-center justify-center shrink-0">
                    <img
                      src={logoSrc}
                      alt="B.S.S.K.N Logo"
                      className="h-[74px] w-auto object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-1">
                    <h1 className="text-[22px] font-bold tracking-tight text-black leading-tight">
                      ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
                    </h1>
                    <h2 className="text-[12px] font-bold tracking-wider text-black uppercase font-sans mt-0.5">
                      SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
                    </h2>
                    <div className="mt-1">
                      <span className="text-[26px] font-black text-black tracking-wide inline-block border-b-2 border-black pb-0.5">
                        ಕಛೇರಿ ಟಿಪ್ಪಣಿ
                      </span>
                    </div>
                  </div>
                  <div className="w-24 flex items-center justify-center shrink-0">
                    <CooperativeHandshakeIcon className="w-20 h-12" />
                  </div>
                </div>
                <div className="border-t-[2px] border-black flex items-center justify-between px-4 py-1 text-sm font-bold bg-white">
                  <span>ತಾಲೂಕಾ || ಚಡಚಣ</span>
                  <span>ಜಿಲ್ಲಾ || ವಿಜಯಪೂರ</span>
                </div>
              </div>

              {/* Submission & Date */}
              <div className="flex items-center justify-between text-base font-bold mb-5 px-1">
                <span>ಸಲ್ಲಿಸಲಾಗಿದೆ.)</span>
                <span>ದಿನಾಂಕ:-{dateStr}</span>
              </div>

              {/* Main Paragraph */}
              <div className="text-[15.5px] leading-[2.2] text-justify font-normal px-2 text-black">
                <p className="indent-12">
                  ನಮ್ಮ ಕಾರ್ಖಾನೆಯ ಆರ್ಥಿಕ ಸಧೃಡತೆಗೋಸ್ಕರ ಶೇರು ಮೌಲ್ಯ ಮತ್ತು ಶೇರು ಆಕರಣೆ ಮತ್ತು ಇತರ ಮೌಲ್ಯಗಳಿಂದ ಸ್ವಂತ ಬಂಡವಾಳ ವೃದ್ಧಿಸುವ ಸಲುವಾಗಿ ನಮ್ಮ ಕಾರ್ಖಾನೆಯ ಸನ್ 2020/21ನೇ ಸಾಲಿನ ವಾರ್ಷಿಕ ಸರ್ವ ಸಾಧಾರಣ ಸಭೆಯಲ್ಲಿ ಸುಧೀರ್ಘವಾಗಿ ಚರ್ಚಿಸಿ ಸದಸ್ಯರ ಶೇರು ವಂತಿಕೆಯನ್ನು ಪ್ರತಿ ಶೇರು ರೂಪಾಯಿ {faceValue}/- {faceValueWords} ಮುಖ ಬೆಲೆಯ, <span className="font-bold underline">ರೂ.{shareAmountFormatted}/-</span> ಹಾಗೂ ಸದಸ್ಯತ್ವ ಪ್ರವೇಶ ಶುಲ್ಕ <span className="font-bold underline">ರೂ {admissionFee}/-</span> ಹೀಗಾಗಿ <span className="font-bold underline">{noShares}</span> ಶೇರುಗಳ ಮೊತ್ತ <span className="font-bold underline">ರೂ. {shareAmountFormatted}/- ({shareAmountInWords})</span> ಗಳನ್ನು ಕಾರ್ಯ ವ್ಯಾಪ್ತಿಯ ಸದಸ್ಯರಿಂದ ಸದಸ್ಯ ವಂತಿಕೆಯನ್ನು ಶೇರು ಸಂಗ್ರಹಣೆ ಮಾಡಲು ಸನ್ 2020-21 ನೇ ಸಾಲಿನ ದಿನಾಂಕ 24/12/2021 ಸಭೆಯಲ್ಲಿ ಠರಾವು ನಂ.10(1) ನಿರ್ಣಯಿಸಲಾಗುತ್ತದೆ. ಅದರನ್ವಯ <strong className="font-bold underline">{applicantName} ಸಾ|| {place} ತಾ||{taluk} ಜಿ||{dist}</strong> ನಮ್ಮ ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬರುತ್ತಿದ್ದು ಕಾರ್ಖಾನೆಯ <strong className="font-bold underline">"{category}"</strong>ದ ಸದಸ್ಯನಾಗಲು ವಿನಂತಿಸಿರುತ್ತಾರೆ.ಹಾಗೂ ನಗದು ಹಣ ಭರಣಾ ಮಾಡಿರುತ್ತಾರೆ. ಹೀಗಾಗಿ ಮೆ|| ರವರು ಅನುಮೋದಿಸಬಹುದು.
                </p>
              </div>

              {/* Department */}
              <div className="text-right pr-8 my-8">
                <span className="text-base font-bold text-black inline-block">
                  ಶೇರು ವಿಭಾಗ
                </span>
              </div>
            </div>

            {/* 5 Hierarchical Authorities for Official Signatures */}
            <div className="pl-4 pb-2 space-y-8 text-[15.5px] font-bold text-black">
              <div className="flex items-center justify-between">
                <span>1. ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. ಅಧೀಕ್ಷಕರು</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. ಲೆಕ್ಕಪತ್ರ ವಿಭಾಗ</span>
              </div>
              <div className="flex items-center justify-between">
                <span>4. ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</span>
              </div>
              <div className="flex items-center justify-between">
                <span>5. ಮಾನ್ಯ ಅಧ್ಯಕ್ಷರು</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="office-note-a4-sheet bg-white text-black border-[2px] border-black w-full min-h-[277mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-sizing-border space-y-4">
            <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-wide">
                ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
              </h2>
              <p className="text-[11px] text-slate-700 font-medium">
                ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
              </p>
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]">
                ಹೊಸ ಶೇರುದಾರರ ಪ್ರವೇಶ ರಶೀದಿ ಮತ್ತು ಠರಾವು ನಮೂನೆ (New Shareholder Admission Receipt)
              </div>
            </div>

            <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-400 pb-2">
              <div>
                <span className="text-slate-600">ನೋಂದಣಿ ಸಂಖ್ಯೆ (Enrollment ID): </span>
                <span className="font-mono font-bold text-slate-900">{enrollment.enrollment_id || `ENR-${enrollment.id}`}</span>
              </div>
              <div>
                <span className="text-slate-600">ರಶೀದಿ ನಂ (Receipt No): </span>
                <span className="font-mono font-bold text-slate-900">{enrollment.receipt_no || '—'}</span>
              </div>
              <div>
                <span className="text-slate-600">ದಿನಾಂಕ (Date): </span>
                <span className="font-bold text-slate-900">{dateStr}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-300">
              <div className="col-span-2 space-y-1.5">
                <div>
                  <span className="text-slate-500">ಶೇರುದಾರರ ಹೆಸರು: </span>
                  <span className="font-bold text-sm text-slate-900">{applicantName}</span>
                </div>
                <div>
                  <span className="text-slate-500">ಸ್ಥಳ / ಗ್ರಾಮ: </span>
                  <span className="font-semibold text-slate-900">{place}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-slate-500">ತಾಲೂಕು: </span>
                    <span className="font-semibold text-slate-900">{taluk}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ಜಿಲ್ಲೆ: </span>
                    <span className="font-semibold text-slate-900">{dist}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-24 h-28 border border-slate-400 rounded bg-slate-50 flex items-center justify-center overflow-hidden text-[10px] text-slate-400">
                  {enrollment.photo ? (
                    <img src={enrollment.photo} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span>ಭಾವಚಿತ್ರ</span>
                  )}
                </div>
              </div>
            </div>

            <table className="w-full border border-slate-400 text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-400 font-bold">
                <tr>
                  <th className="p-2 border-r border-slate-400">ವಿವರ (Particulars)</th>
                  <th className="p-2 border-r border-slate-400 text-center">ಶೇರುಗಳ ಸಂಖ್ಯೆ</th>
                  <th className="p-2 border-r border-slate-400 text-center">ವರ್ಗ</th>
                  <th className="p-2 text-right">ಮೊತ್ತ (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="p-2 border-r border-slate-400 font-medium">ಶೇರು ಬಂಡವಾಳ ಠೇವಣಿ (Share Capital Amount)</td>
                  <td className="p-2 border-r border-slate-400 text-center font-bold">{noShares}</td>
                  <td className="p-2 border-r border-slate-400 text-center">{category}</td>
                  <td className="p-2 text-right font-mono font-bold">₹ {shareAmountFormatted}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 font-medium">ಶೇರು ಪ್ರವೇಶ ಶುಲ್ಕ (Admission Fee)</td>
                  <td className="p-2 border-r border-slate-400 text-center font-bold">{noShares}</td>
                  <td className="p-2 border-r border-slate-400 text-center">—</td>
                  <td className="p-2 text-right font-mono font-bold">₹ {Number(admissionFee).toLocaleString()}</td>
                </tr>
                <tr className="bg-slate-100 font-bold text-sm">
                  <td colSpan="3" className="p-2 border-r border-slate-400 text-right">ಒಟ್ಟು ಪಾವತಿಸಿದ ಮೊತ್ತ (Total Amount Received):</td>
                  <td className="p-2 text-right text-emerald-800 font-mono">₹ {Number(totalAmount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="pt-8 flex justify-between items-end text-center text-xs">
              <div className="space-y-1">
                <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                  ಶೇರುದಾರರ ಸಹಿ / ಹೆಬ್ಬೆಟ್ಟು
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                  ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                  ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>,
        document.body
      )}
    </>
  );
}
