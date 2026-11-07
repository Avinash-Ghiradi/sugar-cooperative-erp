import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { createPortal } from 'react-dom';
import { Printer, X, Download, FileText, CheckCircle2, ChevronDown, CheckSquare, Sparkles } from 'lucide-react';
import { useCompanyLogo, useHandshakeLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import { useLanguage } from '../../context/LanguageContext';
import { AVAILABLE_REPORT_COLUMNS } from './ShareholderReports';

// Classic Cooperative Handshake SVG Icon fallback
function CooperativeHandshakeIcon({ className = "w-20 h-12" }) {
  const handshakeLogo = useHandshakeLogo();
  const [imgError, setImgError] = useState(false);

  if (handshakeLogo && !imgError) {
    return (
      <img
        src={handshakeLogo}
        alt="Cooperative Handshake"
        className={`${className} object-contain filter drop-shadow-sm`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 140 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="4,12 30,20 30,54 4,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      <polygon points="30,20 36,22 36,52 30,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <polygon points="136,12 110,20 110,54 136,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      <polygon points="110,20 104,22 104,52 110,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 36 26 C 46 21, 56 25, 64 31 C 68 34, 70 39, 68 43 C 65 47, 58 49, 50 49 C 42 49, 36 47, 36 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 104 25 C 94 20, 84 23, 76 28 C 70 32, 67 38, 70 43 C 74 48, 84 49, 92 48 C 100 47, 104 47, 104 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 74 33 C 79 35, 82 40, 81 44" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 68 36 C 73 38, 76 43, 75 46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 62 39 C 67 41, 70 45, 69 48" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 56 42 C 61 44, 64 47, 63 49" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 40 28 C 50 24, 60 29, 66 34" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ShareholderReportPrintModal({
  isOpen,
  onClose,
  reportMode = 'placewise',
  kpis = {},
  filters = {},
  filteredShareholders = [],
  placewiseData = [],
  categorywiseData = [],
  circlewiseData = [],
  shareswiseData = [],
  amountwiseData = [],
  selectedColumns = [],
  getColValue = () => ''
}) {
  const [orientation, setOrientation] = useState('landscape');
  const [logoError, setLogoError] = useState(false);
  const companyLogo = useCompanyLogo();
  const { isEnglish, formatPlace, formatCircle } = useLanguage();

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('shareholder-report-printing');
      const s = document.getElementById('report-page-orientation-style');
      if (s) s.remove();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('shareholder-report-printing');
      const s = document.getElementById('report-page-orientation-style');
      if (s) s.remove();
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!isOpen) return null;

  // Report Titles & Metadata
  const getReportMeta = () => {
    switch (reportMode) {
      case 'placewise':
        return {
          titleKn: 'ಅಧಿಕೃತ ಗ್ರಾಮವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ',
          titleEn: 'OFFICIAL PLACE-WISE SHAREHOLDERS SUMMARY REPORT',
          subHeader: 'ಸ್ಥಳವಾರು ಶೇರು ಬಂಡವಾಳ ಹಾಗೂ ಸದಸ್ಯತ್ವ ಸಮಗ್ರ ವರದಿ',
          totalLabel: `${placewiseData.length} ಗ್ರಾಮಗಳು / ಸ್ಥಳಗಳು`
        };
      case 'categorywise':
        return {
          titleKn: 'ಅಧಿಕೃತ ವರ್ಗವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ',
          titleEn: 'OFFICIAL CATEGORY-WISE SHAREHOLDERS SUMMARY REPORT',
          subHeader: 'ಅ / ಬ / ಕ / ಡ ವರ್ಗವಾರು ಶೇರು ಹಂಚಿಕೆ ಹಾಗೂ ಸದಸ್ಯತ್ವ ವರದಿ',
          totalLabel: `${categorywiseData.length} ವರ್ಗಗಳು`
        };
      case 'circlewise':
        return {
          titleKn: 'ಅಧಿಕೃತ ವಲಯವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ',
          titleEn: 'OFFICIAL CIRCLE-WISE SHAREHOLDERS SUMMARY REPORT',
          subHeader: 'ವಲಯವಾರು ಶೇರು ಬಂಡವಾಳ, ಗ್ರಾಮಗಳು ಹಾಗೂ ಸದಸ್ಯತ್ವ ವರದಿ',
          totalLabel: `${circlewiseData.length} ವಲಯಗಳು`
        };
      case 'shareswise':
        return {
          titleKn: 'ಅಧಿಕೃತ ಶೇರುವಾರು ವಿತರಣೆ ಸಾರಾಂಶ ವರದಿ',
          titleEn: 'OFFICIAL SHARES-WISE DISTRIBUTION SUMMARY REPORT',
          subHeader: 'ಶೇರು ಪ್ರಮಾಣವಾರು ಹಂಚಿಕೆ ಹಾಗೂ ಶೇರು ಬಂಡವಾಳ ವರದಿ',
          totalLabel: `${shareswiseData.length} ಶೇರು ವಿಭಾಗಗಳು`
        };
      case 'amountwise':
        return {
          titleKn: 'ಅಧಿಕೃತ ನಗದು ಮೊತ್ತವಾರು ಶೇರುದಾರರ ಸಾರಾಂಶ ವರದಿ',
          titleEn: 'OFFICIAL CASH AMOUNT-WISE SHAREHOLDERS SUMMARY REPORT',
          subHeader: 'ಶೇರು ಜಮಾ ನಗದು ಮೊತ್ತವಾರು ವಿಂಗಡಣೆ ವರದಿ',
          totalLabel: `${amountwiseData.length} ನಗದು ವಿಭಾಗಗಳು`
        };
      case 'detailed':
      default:
        return {
          titleKn: 'ಹೊಸ ಶೇರುದಾರರ ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)',
          titleEn: 'NEW SHAREHOLDER STATUTORY ENROLLMENT REGISTER (OFFICIAL 15 COLUMNS)',
          subHeader: 'ಶೇರುದಾರರ ಶಾಸನಬದ್ಧ ನೋಂದಣಿ ಹಾಗೂ ಠರಾವು ವಿವರಗಳ ಅಧಿಕೃತ ವಹಿ',
          totalLabel: `${filteredShareholders.length} ಶೇರುದಾರರು`
        };
    }
  };

  const meta = getReportMeta();
  const todayStr = new Date().toLocaleDateString('en-GB');

  // Trigger professional print with portal
  const handlePrint = () => {
    document.body.classList.add('shareholder-report-printing');
    try {
      ApiService.logPrintAction({
        documentType: `ವರದಿ ಮುದ್ರಣ (${reportTitle || 'Report'})`,
        recordId: `${totalRows} ಸದಸ್ಯರು`,
        description: `ಶೇರುದಾರ ವರದಿ ಮುದ್ರಣ: "${reportTitle || 'ವರದಿ'}" ವರದಿಯನ್ನು ಮುದ್ರಿಸಲಾಗಿದೆ (ಒಟ್ಟು ${totalRows} ಸದಸ್ಯರ ದಾಖಲೆಗಳು).`
      });
    } catch (e) {}
    const existingStyle = document.getElementById('report-page-orientation-style');
    if (existingStyle) existingStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'report-page-orientation-style';
    styleEl.innerHTML = `@page { size: ${orientation}; margin: 6mm 8mm; }`;
    document.head.appendChild(styleEl);

    // Call window.print() after DOM update
    setTimeout(() => {
      window.print();
      const cleanup = () => {
        document.body.classList.remove('shareholder-report-printing');
        const s = document.getElementById('report-page-orientation-style');
        if (s) s.remove();
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      // Fallback timeout cleanup
      setTimeout(cleanup, 2000);
    }, 150);
  };

  // Render Printable Document Content
  const renderDocumentContent = () => {
    return (
      <div className="bg-white text-black p-4 sm:p-6 font-kannada space-y-3 leading-tight select-none">
        {/* 1. Official Border Box Header (Matching Official Image) */}
        <div className="border-[2.5px] border-black bg-white text-black">
          {/* Upper Section: Logo - Title - Emblem */}
          <div className="flex items-center justify-between px-4 py-2 border-b-[2px] border-black">
            {/* Left: BSSKN Factory Emblem */}
            <div className="w-24 sm:w-28 flex items-center justify-center shrink-0">
              <img
                src={companyLogo}
                alt="BSSKN Logo"
                className="h-[75px] sm:h-[82px] w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            </div>

            {/* Center: Dual Kannada & English Title */}
            <div className="flex-1 text-center px-2 space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black font-kannada">
                ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
              </h1>
              <p className="text-[11px] sm:text-xs font-extrabold tracking-wide uppercase text-black font-sans">
                SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
              </p>
              <h2 className="text-sm sm:text-base font-black text-black pt-0.5 font-kannada">
                ಶೇರು ವಿಭಾಗ - {meta.titleKn}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-gray-800 font-sans">
                {meta.titleEn}
              </p>
            </div>

            {/* Right: Cooperative Handshake Emblem */}
            <div className="w-24 sm:w-28 flex items-center justify-center shrink-0">
              <CooperativeHandshakeIcon className="h-12 w-auto object-contain" />
            </div>
          </div>

          {/* Subheader: Taluk & District */}
          <div className="flex items-center justify-between px-6 py-1.5 bg-gray-50 text-xs font-bold border-b border-black">
            <span className="font-kannada">ತಾಲೂಕು|| ಇಂಡಿ / ಚಡಚಣ</span>
            <span className="text-[10px] text-gray-700 tracking-wider font-sans uppercase">
              COOPERATIVE STATUTORY AUDIT REPORT
            </span>
            <span className="font-kannada">ಜಿಲ್ಲಾ|| ವಿಜಯಪುರ</span>
          </div>

          {/* Scope & Totals Summary Bar */}
          <div className="px-4 py-2 bg-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold border-t border-black">
            <div>
              <span>ವ್ಯಾಪ್ತಿ (Scope): </span>
              <strong className="font-extrabold underline decoration-black">
                ಶೋಧಿತ ಎಲ್ಲಾ ದಾಖಲೆಗಳು ({meta.totalLabel})
              </strong>
            </div>
            <div>ದಿನಾಂಕ: <span className="font-mono">{todayStr}</span></div>
            <div>ಒಟ್ಟು ದಾಖಲೆಗಳು: <span className="font-mono font-extrabold">{kpis.totalCount?.toLocaleString('en-IN') || 0}</span></div>
            <div>ಒಟ್ಟು ಶೇರುಗಳು: <span className="font-mono font-extrabold">{kpis.totalShares?.toLocaleString('en-IN') || 0}</span></div>
            <div>
              ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: <span className="font-mono font-extrabold text-sm">₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </div>

        {/* Active Filters Summary (If any applied) */}
        {Object.values(filters).some(Boolean) && (
          <div className="text-[11px] bg-gray-50 border border-gray-400 p-1.5 rounded flex flex-wrap items-center gap-2">
            <strong>ಅನ್ವಯಿಸಲಾದ ಫಿಲ್ಟರ್‌ಗಳು:</strong>
            {filters.search && <span>ಕೀವರ್ಡ್: "{filters.search}"</span>}
            {filters.place && <span>ಗ್ರಾಮ: {filters.place}</span>}
            {filters.circle && <span>ವಲಯ: {filters.circle}</span>}
            {filters.category && <span>ವರ್ಗ: {filters.category}</span>}
            {filters.sharesBracket && <span>ಶೇರುಗಳು: {filters.sharesBracket}</span>}
            {filters.ownership && <span>ಮಾಲೀಕತ್ವ: {filters.ownership}</span>}
            {filters.status && <span>ಸ್ಥಿತಿ: {filters.status}</span>}
            {filters.cashAmount && <span>ನಗದು: ₹{Number(filters.cashAmount).toLocaleString('en-IN')}</span>}
          </div>
        )}

        {/* 2. DATA TABLE - ALL MATCHING RECORDS */}
        <div className="overflow-x-auto">
          {/* A. PLACEWISE REPORT TABLE */}
          {reportMode === 'placewise' && (
            <table className="w-full text-xs border-collapse border-[1.5px] border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-extrabold text-[11px]">
                  <th className="border border-black p-1.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="border border-black p-1.5 text-left">ಸ್ಥಳ / ಗ್ರಾಮದ ಹೆಸರು (Place / Village)</th>
                  <th className="border border-black p-1.5 text-left">ವಲಯ (Circle)</th>
                  <th className="border border-black p-1.5 text-center w-24">ತಾಲೂಕು</th>
                  <th className="border border-black p-1.5 text-right w-24">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                  <th className="border border-black p-1.5 text-right w-24">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                  <th className="border border-black p-1.5 text-right w-32">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹ (Capital)</th>
                  <th className="border border-black p-1.5 text-right w-20">ಸದಸ್ಯರ %</th>
                  <th className="border border-black p-1.5 text-right w-20">ಶೇರು ಬಂಡವಾಳ %</th>
                </tr>
              </thead>
              <tbody>
                {placewiseData.map((row, idx) => (
                  <tr key={idx} className="border-b border-black hover:bg-gray-50 break-inside-avoid">
                    <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1 font-bold">{formatPlace(row.place)}</td>
                    <td className="border border-black p-1">{formatCircle(row.circle)}</td>
                    <td className="border border-black p-1 text-center">{row.taluk || 'ಇಂಡಿ'}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.count.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.totalShares.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">₹ {row.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono">{row.memberPct}%</td>
                    <td className="border border-black p-1 text-right font-mono">{row.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 text-black font-black text-xs border-t-[2px] border-black">
                  <td colSpan={4} className="border border-black p-2 text-right uppercase">
                    ಒಟ್ಟು (TOTAL):
                  </td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalCount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalShares?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* B. CATEGORYWISE REPORT TABLE */}
          {reportMode === 'categorywise' && (
            <table className="w-full text-xs border-collapse border-[1.5px] border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-extrabold text-[11px]">
                  <th className="border border-black p-1.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="border border-black p-1.5 text-left">ವರ್ಗ / ವಿಭಾಗ (Category / Class)</th>
                  <th className="border border-black p-1.5 text-left">ಸದಸ್ಯತ್ವ ವಿವರಣೆ (Description)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                  <th className="border border-black p-1.5 text-right w-36">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹</th>
                  <th className="border border-black p-1.5 text-right w-24">ಸದಸ್ಯರ (%)</th>
                  <th className="border border-black p-1.5 text-right w-24">ಶೇರುಗಳ (%)</th>
                </tr>
              </thead>
              <tbody>
                {categorywiseData.map((row, idx) => (
                  <tr key={idx} className="border-b border-black hover:bg-gray-50 break-inside-avoid">
                    <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1 font-bold text-sm">{row.category}</td>
                    <td className="border border-black p-1">{row.memberType}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.count.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.totalShares.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">₹ {row.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono">{row.memberPct}%</td>
                    <td className="border border-black p-1 text-right font-mono">{row.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 text-black font-black text-xs border-t-[2px] border-black">
                  <td colSpan={3} className="border border-black p-2 text-right uppercase">
                    ಒಟ್ಟು (TOTAL):
                  </td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalCount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalShares?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* C. CIRCLEWISE REPORT TABLE */}
          {reportMode === 'circlewise' && (
            <table className="w-full text-xs border-collapse border-[1.5px] border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-extrabold text-[11px]">
                  <th className="border border-black p-1.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="border border-black p-1.5 text-left">ವಲಯದ ಹೆಸರು (Circle Name)</th>
                  <th className="border border-black p-1.5 text-center w-24">ತಾಲೂಕು (Taluk)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಒಳಪಟ್ಟ ಗ್ರಾಮಗಳು (Villages)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                  <th className="border border-black p-1.5 text-right w-36">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹</th>
                  <th className="border border-black p-1.5 text-right w-24">ಸದಸ್ಯರ (%)</th>
                  <th className="border border-black p-1.5 text-right w-24">ಶೇರುಗಳ (%)</th>
                </tr>
              </thead>
              <tbody>
                {circlewiseData.map((row, idx) => (
                  <tr key={idx} className="border-b border-black hover:bg-gray-50 break-inside-avoid">
                    <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1 font-bold text-sm">{formatCircle(row.circle)}</td>
                    <td className="border border-black p-1 text-center">{row.taluk || 'ಇಂಡಿ'}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.placesCount}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.count.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.totalShares.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">₹ {row.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono">{row.memberPct}%</td>
                    <td className="border border-black p-1 text-right font-mono">{row.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 text-black font-black text-xs border-t-[2px] border-black">
                  <td colSpan={4} className="border border-black p-2 text-right uppercase">
                    ಒಟ್ಟು (TOTAL):
                  </td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalCount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalShares?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* D. SHARES-WISE REPORT TABLE */}
          {reportMode === 'shareswise' && (
            <table className="w-full text-xs border-collapse border-[1.5px] border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-extrabold text-[11px]">
                  <th className="border border-black p-1.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="border border-black p-1.5 text-left">ಶೇರುಗಳ ಪ್ರಮಾಣ (Share Bracket)</th>
                  <th className="border border-black p-1.5 text-left">ವಿವರಣೆ (Description)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                  <th className="border border-black p-1.5 text-right w-36">ಶೇರು ಬಂಡವಾಳ ಮೊತ್ತ ₹</th>
                  <th className="border border-black p-1.5 text-right w-24">ಸದಸ್ಯರ (%)</th>
                  <th className="border border-black p-1.5 text-right w-24">ಶೇರುಗಳ (%)</th>
                </tr>
              </thead>
              <tbody>
                {shareswiseData.map((row, idx) => (
                  <tr key={idx} className="border-b border-black hover:bg-gray-50 break-inside-avoid">
                    <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1 font-bold text-sm">{row.label}</td>
                    <td className="border border-black p-1">{row.desc}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.count.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">{row.totalShares.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono font-bold">₹ {row.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="border border-black p-1 text-right font-mono">{row.memberPct}%</td>
                    <td className="border border-black p-1 text-right font-mono">{row.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 text-black font-black text-xs border-t-[2px] border-black">
                  <td colSpan={3} className="border border-black p-2 text-right uppercase">
                    ಒಟ್ಟು (TOTAL):
                  </td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalCount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalShares?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* E. AMOUNT-WISE REPORT TABLE */}
          {reportMode === 'amountwise' && (
            <table className="w-full text-xs border-collapse border-[1.5px] border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-extrabold text-[11px]">
                  <th className="border border-black p-1.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="border border-black p-1.5 text-left">ನಗದು ಮೊತ್ತ ಶ್ರೇಣಿ (Cash Amount)</th>
                  <th className="border border-black p-1.5 text-left">ವಿವರಣೆ (Description)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಸದಸ್ಯರ ಸಂಖ್ಯೆ (Members)</th>
                  <th className="border border-black p-1.5 text-right w-28">ಒಟ್ಟು ಶೇರುಗಳು (Shares)</th>
                  <th className="border border-black p-1.5 text-right w-36">ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ ₹</th>
                  <th className="border border-black p-1.5 text-right w-24">ಸದಸ್ಯರ (%)</th>
                  <th className="border border-black p-1.5 text-right w-24">ಶೇರುಗಳ (%)</th>
                </tr>
              </thead>
              <tbody>
                {amountwiseData.map((row, idx) => {
                  const desc = row.amount === 2000 ? '1 ಶೇರು (ಸಾಮಾನ್ಯ ಮುಖಬೆಲೆ)' :
                    row.amount === 1000 ? '1 ನೇ ಕಂತು ಪಾವತಿ (₹1,000)' :
                    row.amount === 4000 ? '2 ಶೇರುಗಳು (₹4,000)' :
                    row.amount === 6000 ? '3 ಶೇರುಗಳು (₹6,000)' :
                    row.amount === 8000 ? '4 ಶೇರುಗಳು (₹8,000)' :
                    row.amount === 10000 ? '5 ಶೇರುಗಳು (₹10,000)' :
                    row.amount >= 12000 ? `${Math.round(row.amount / 2000)} ಶೇರುಗಳು (ಗರಿಷ್ಠ ಬಂಡವಾಳ)` :
                    'ವಿಶೇಷ ಮೊತ್ತ / ಮುಂಗಡ';

                  return (
                    <tr key={idx} className="border-b border-black hover:bg-gray-50 break-inside-avoid">
                      <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black p-1 font-bold text-sm font-mono">₹ {row.amount.toLocaleString('en-IN')}</td>
                      <td className="border border-black p-1">{desc}</td>
                      <td className="border border-black p-1 text-right font-mono font-bold">{row.count.toLocaleString('en-IN')}</td>
                      <td className="border border-black p-1 text-right font-mono font-bold">{row.totalShares.toLocaleString('en-IN')}</td>
                      <td className="border border-black p-1 text-right font-mono font-bold">₹ {row.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="border border-black p-1 text-right font-mono">{row.memberPct}%</td>
                      <td className="border border-black p-1 text-right font-mono">{row.sharePct}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 text-black font-black text-xs border-t-[2px] border-black">
                  <td colSpan={3} className="border border-black p-2 text-right uppercase">
                    ಒಟ್ಟು (TOTAL):
                  </td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalCount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">{kpis.totalShares?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                  <td className="border border-black p-2 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* F. DETAILED / 15-COLUMN STATUTORY ENROLLMENT REGISTER TABLE */}
          {reportMode === 'detailed' && (
            <table className="w-full text-xs border-collapse border-[1.5px] border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-black text-[10px] sm:text-[11px] leading-tight">
                  {AVAILABLE_REPORT_COLUMNS.filter(c => selectedColumns.includes(c.id)).map(col => (
                    <th
                      key={col.id}
                      className="border border-black p-1 text-center font-extrabold uppercase whitespace-nowrap"
                    >
                      {col.labelKn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredShareholders.map((s, idx) => (
                  <tr key={s.id || idx} className="border-b border-black hover:bg-gray-50 break-inside-avoid">
                    {AVAILABLE_REPORT_COLUMNS.filter(c => selectedColumns.includes(c.id)).map(col => {
                      const val = getColValue(s, col.id, idx + 1);
                      const isMoney = ['share_amount', 'admission_fee', 'total_amount'].includes(col.id);
                      const isBold = ['shareholder_name', 'share_no'].includes(col.id);
                      return (
                        <td
                          key={col.id}
                          className={`border border-black p-1 text-[11px] ${
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                          } ${isBold ? 'font-bold' : ''} ${isMoney ? 'font-mono' : ''}`}
                        >
                          {isMoney && val !== '—' ? `₹ ${val}` : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 text-black font-black text-xs border-t-[2px] border-black">
                  <td colSpan={2} className="border border-black p-1.5 text-right uppercase">
                    ಒಟ್ಟು (TOTAL):
                  </td>
                  <td className="border border-black p-1.5 text-left font-bold">
                    {filteredShareholders.length} ಶೇರುದಾರರು
                  </td>
                  <td colSpan={Math.max(1, AVAILABLE_REPORT_COLUMNS.filter(c => selectedColumns.includes(c.id)).length - 3)} className="border border-black p-1.5 text-right font-mono font-black text-sm">
                    ಒಟ್ಟು ಶೇರುಗಳು: {kpis.totalShares?.toLocaleString('en-IN') || 0} | ಒಟ್ಟು ಬಂಡವಾಳ: ₹ {kpis.totalAmount?.toLocaleString('en-IN') || 0}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 3. Official Cooperative 4-Signatures Footer (Matching Statutory Norms) */}
        <div className="pt-8 pb-2 border-t-[1.5px] border-black grid grid-cols-4 gap-4 text-center text-xs font-bold font-kannada break-inside-avoid">
          <div className="space-y-6">
            <div className="h-6"></div>
            <div className="border-t border-dotted border-black pt-1">
              <div>ತಯಾರಕರು (ಕಂಪ್ಯೂಟರ್ ಆಪರೇಟರ್)</div>
              <div className="text-[10px] text-gray-700 font-sans uppercase">PREPARED BY (OPERATOR)</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6"></div>
            <div className="border-t border-dotted border-black pt-1">
              <div>ಪರಿಶೀಲಕರು (ಅಧೀಕ್ಷಕರು)</div>
              <div className="text-[10px] text-gray-700 font-sans uppercase">CHECKED BY (SUPERINTENDENT)</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6"></div>
            <div className="border-t border-dotted border-black pt-1">
              <div>ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ</div>
              <div className="text-[10px] text-gray-700 font-sans uppercase">CHIEF ACCOUNTANT</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-6"></div>
            <div className="border-t border-dotted border-black pt-1">
              <div>ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
              <div className="text-[10px] text-gray-700 font-sans uppercase">MANAGING DIRECTOR</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. SCREEN PREVIEW MODAL DIALOG (NOT PRINTED) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md no-print select-none animate-in fade-in duration-200">
        <div className="relative w-full max-w-6xl max-h-[94vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                  <span>ಅಧಿಕೃತ ವರದಿ ಮುದ್ರಣ (Official Cooperative Report Print)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {meta.totalLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {meta.titleKn} - ಶಾಸನಬದ್ಧ ಮುದ್ರಣ ಪೂರ್ವವೀಕ್ಷಣೆ (Statutory Print Preview)
                </p>
              </div>
            </div>

            {/* Print Controls */}
            <div className="flex items-center gap-2">
              {/* Orientation Switcher */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ಅಡ್ಡ (Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ಉದ್ದ (Portrait)
                </button>
              </div>

              {/* Main Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>ಮುದ್ರಿಸಿ (Print Report)</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Document Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
            <div className="max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-slate-700 bg-white">
              {renderDocumentContent()}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>
              💡 <strong>ಮುದ್ರಣ ಸಲಹೆ:</strong> ಬ್ರೌಸರ್ ಪ್ರಿಂಟ್ ಡೈಲಾಗ್‌ನಲ್ಲಿ <em>"Headers and footers"</em> ಆಫ್ ಮಾಡಿ, ಮತ್ತು <em>"Background graphics"</em> ಆನ್ ಮಾಡಿ.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer font-semibold"
            >
              ಮುಚ್ಚಿ (Close)
            </button>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED PRINT PORTAL (RENDERED DIRECTLY ON BODY DURING PRINTING) */}
      {createPortal(
        <div className="shareholder-report-print-portal">
          {renderDocumentContent()}
        </div>,
        document.body
      )}
    </>
  );
}
