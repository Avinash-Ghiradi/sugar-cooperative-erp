import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, CheckSquare, Square, Layers, Filter, CheckCircle2, FileText, ChevronDown } from 'lucide-react';
import { useCompanyLogo, useHandshakeLogo, DEFAULT_LOGO_PATH, DEFAULT_HANDSHAKE_PATH } from '../../services/organizationService';
import { downloadEnrollmentDocx } from '../../services/enrollmentDocxService';
import { downloadVarasaDocx } from '../../services/varasaDocxService';
import { downloadVargavaneDocx } from '../../services/vargavaneDocxService';

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

// Date formatter
function formatDocDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  const clean = String(dateStr).trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return clean;
}

export default function RegisterListPrintModal({
  isOpen,
  onClose,
  type = 'enrollment', // 'enrollment' | 'varasa' | 'vargavane'
  allRecords = [],
  selectedIds = new Set(),
  initialScope = 'filtered', // 'filtered' | 'selected'
  filterSummary = {},
  onClearSelection
}) {
  const [scope, setScope] = useState(initialScope);
  const [orientation, setOrientation] = useState('landscape');
  const [logoError, setLogoError] = useState(false);
  const companyLogo = useCompanyLogo();
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const handleDownloadDocx = async () => {
    try {
      setIsDownloadingDocx(true);
      let season = '2025 – 26';
      try {
        const saved = localStorage.getItem('sugar_erp_org_settings');
        if (saved) {
          const org = JSON.parse(saved);
          if (org.crushing_season) season = org.crushing_season.replace(/-/g, ' – ');
        }
      } catch (e) {}

      if (type === 'varasa') {
        await downloadVarasaDocx({
          records: recordsToPrint,
          season
        });
      } else if (type === 'vargavane') {
        await downloadVargavaneDocx({
          records: recordsToPrint,
          season
        });
      } else {
        await downloadEnrollmentDocx({
          records: recordsToPrint,
          season
        });
      }
    } catch (err) {
      alert('Word document export failed: ' + err.message);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Default scope to 'selected' if records were selected, otherwise 'filtered'
      if (initialScope === 'selected' && selectedIds.size > 0) {
        setScope('selected');
      } else if (selectedIds.size > 0 && selectedIds.size < allRecords.length) {
        setScope('selected');
      } else {
        setScope('filtered');
      }
    }
  }, [isOpen, initialScope, selectedIds.size, allRecords.length]);

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('register-list-printing');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('register-list-printing');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!isOpen) return null;

  // Filter records based on scope
  const recordsToPrint = scope === 'selected' && selectedIds.size > 0
    ? allRecords.filter(r => selectedIds.has(r.id || r.transfer_id || r.enrollment_id))
    : allRecords;

  // Department and Register Header Title configuration
  let registerTitleKn = '';
  let registerSubtitleEn = '';
  if (type === 'enrollment') {
    registerTitleKn = 'ಶೇರು ವಿಭಾಗ - ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)';
    registerSubtitleEn = 'NEW SHAREHOLDER STATUTORY ENROLLMENT REGISTER';
  } else if (type === 'varasa') {
    registerTitleKn = 'ಶೇರು ವಿಭಾಗ - ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ ವಹಿ (Varasa Register)';
    registerSubtitleEn = 'LEGAL-HEIR (VARASA) SHARE TRANSFER REGISTER';
  } else {
    registerTitleKn = 'ಶೇರು ವಿಭಾಗ - ಶೇರು ವರ್ಗಾವಣೆ ವಹಿ (Share Transfer Register)';
    registerSubtitleEn = 'STATUTORY SHARE TRANSFER (VARGAVANE) REGISTER';
  }

  // Calculate totals
  let totalShares = 0;
  let totalShareCapital = 0;
  let totalAdmissionFees = 0;
  let totalCollection = 0;

  recordsToPrint.forEach(r => {
    const shares = parseInt(r.number_of_shares || r.no_of_shares || r.shares, 10) || 1;
    totalShares += shares;

    if (type === 'enrollment') {
      const shareAmt = parseFloat(r.share_amount) || (shares * 24000);
      const admFee = parseFloat(r.admission_fee) || (shares * 570);
      const totAmt = parseFloat(r.total_amount) || (shareAmt + admFee);
      totalShareCapital += shareAmt;
      totalAdmissionFees += admFee;
      totalCollection += totAmt;
    } else {
      const fee = parseFloat(r.fees !== undefined ? r.fees : r.fee) || 570;
      totalAdmissionFees += fee;
      totalCollection += fee;
    }
  });

  const handlePrint = () => {
    document.body.classList.add('register-list-printing');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Reusable Statutory Header Box (Image 1 Format)
  const renderStatutoryHeader = () => (
    <div className="border-[2.5px] border-black mb-3 bg-white text-black font-kannada">
      {/* Upper Main Section */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Factory Emblem */}
        <div className="w-28 flex items-center justify-center shrink-0">
          <img
            src={companyLogo}
            alt="B.S.S.K.N Logo"
            className="h-[78px] sm:h-[84px] w-auto object-contain"
            onError={(e) => {
              if (!logoError) {
                setLogoError(true);
                e.target.src = DEFAULT_LOGO_PATH;
              }
            }}
          />
        </div>

        {/* Center: Title Hierarchy & Underline (Matching exact statutory header) */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-[25px] sm:text-[27px] font-bold tracking-tight text-black leading-snug">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
          </h1>
          <h2 className="text-[11.5px] font-bold tracking-[0.18em] text-black uppercase font-sans mt-0.5">
            SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
          </h2>
          <div className="mt-1.5 w-full flex flex-col items-center">
            <h3 className="text-[21px] sm:text-[23px] font-black text-black tracking-normal leading-snug">
              {registerTitleKn}
            </h3>
            {/* Solid Horizontal Line spanning across the center text block */}
            <div className="w-full border-b-[2.5px] border-black mt-2"></div>
          </div>
        </div>

        {/* Right: Cooperative Handshake Emblem */}
        <div className="w-28 flex items-center justify-center shrink-0">
          <CooperativeHandshakeIcon className="w-24 h-16 sm:w-28 sm:h-18" />
        </div>
      </div>

      {/* Lower Sub-bar: Taluk / District */}
      <div className="border-t-[2.5px] border-black flex items-center justify-between px-6 py-1 bg-white text-black font-bold">
        <div className="text-[14px] font-bold text-black">ತಾಲೂಕು|| ಚಡಚಣ</div>
        <div className="text-[12px] font-mono font-bold tracking-[0.25em] text-black text-center uppercase">{registerSubtitleEn}</div>
        <div className="text-[14px] font-bold text-black">ಜಿಲ್ಲಾ|| ವಿಜಯಪುರ</div>
      </div>
    </div>
  );

  // Filter & Meta Summary Banner
  const renderMetaBanner = () => {
    const activeFilters = [];
    if (filterSummary.category && filterSummary.category !== 'All') activeFilters.push(`ವರ್ಗ: ${filterSummary.category}`);
    if (filterSummary.status && filterSummary.status !== 'All') activeFilters.push(`ಸ್ಥಿತಿ: ${filterSummary.status}`);
    if (filterSummary.taluk && filterSummary.taluk !== 'All') activeFilters.push(`ತಾಲೂಕು: ${filterSummary.taluk}`);
    if (filterSummary.search) activeFilters.push(`ಹುಡುಕಾಟ: "${filterSummary.search}"`);

    return (
      <div className="border border-black bg-slate-50 p-2 px-3 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-black font-medium">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <strong>ವ್ಯಾಪ್ತಿ (Scope):</strong>{' '}
            <span className="font-bold underline">
              {scope === 'selected' ? `ಆಯ್ದ ಸದಸ್ಯರ ಪಟ್ಟಿ (${recordsToPrint.length} ಜನ)` : `ಶೋಧಿತ ಎಲ್ಲಾ ದಾಖಲೆಗಳು (${recordsToPrint.length} ಜನ)`}
            </span>
          </div>
          {activeFilters.length > 0 && (
            <div className="text-slate-700">
              <strong>ಅನ್ವಯಿಸಿದ ಫಿಲ್ಟರ್‌ಗಳು:</strong> {activeFilters.join(' • ')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-right">
          <div><strong>ದಿನಾಂಕ:</strong> {formatDocDate()}</div>
          <div><strong>ಒಟ್ಟು ದಾಖಲೆಗಳು:</strong> <span className="font-bold text-black font-mono">{recordsToPrint.length}</span></div>
          <div><strong>ಒಟ್ಟು ಶೇರುಗಳು:</strong> <span className="font-bold text-black font-mono">{totalShares}</span></div>
          {type === 'enrollment' ? (
            <div><strong>ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ:</strong> <span className="font-bold text-black font-mono">₹ {totalCollection.toLocaleString()}</span></div>
          ) : (
            <div><strong>ಒಟ್ಟು ಶುಲ್ಕ:</strong> <span className="font-bold text-black font-mono">₹ {totalCollection.toLocaleString()}</span></div>
          )}
        </div>
      </div>
    );
  };

  // 1. Enrollment Table (15 Columns)
  const renderEnrollmentTable = () => (
    <table className="w-full border-collapse border border-black text-black text-[11px]">
      <thead>
        <tr className="bg-slate-200 border-b-2 border-black font-bold text-center">
          <th className="border border-black p-1.5 w-8">ಕ್ರ.ಸಂ.</th>
          <th className="border border-black p-1.5 w-20">ದಿನಾಂಕ</th>
          <th className="border border-black p-1.5 text-left">ಶೇರುದಾರರ ಹೆಸರು (Shareholder Name)</th>
          <th className="border border-black p-1.5">ಸ್ಥಳ (Place)</th>
          <th className="border border-black p-1.5">ತಾಲೂಕು</th>
          <th className="border border-black p-1.5 text-right w-20">ಶೇರು ಮೊತ್ತ</th>
          <th className="border border-black p-1.5 text-right w-16">ಪ್ರವೇಶ ಶುಲ್ಕ</th>
          <th className="border border-black p-1.5 text-right w-20">ಒಟ್ಟು ಮೊತ್ತ</th>
          <th className="border border-black p-1.5 text-center w-16">ರಶೀದಿ ನಂ</th>
          <th className="border border-black p-1.5 text-center w-14">ಶೇರು ಪ್ರಮಾಣ</th>
          <th className="border border-black p-1.5 text-center w-16">ವರ್ಗ</th>
          <th className="border border-black p-1.5 text-center w-20">ಠರಾವು ದಿನಾಂಕ</th>
          <th className="border border-black p-1.5 text-center w-16">ಠರಾವು ನಂ</th>
          <th className="border border-black p-1.5 text-center w-20">ಶೇರು ಸಂಖ್ಯೆ</th>
          <th className="border border-black p-1.5 text-center w-20">ಸ್ಥಿತಿ</th>
        </tr>
      </thead>
      <tbody>
        {recordsToPrint.length === 0 ? (
          <tr>
            <td colSpan="15" className="border border-black p-8 text-center text-slate-500 font-bold">
              ಯಾವುದೇ ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ
            </td>
          </tr>
        ) : (
          recordsToPrint.map((item, idx) => {
            const shares = parseInt(item.number_of_shares, 10) || 1;
            const shareAmt = parseFloat(item.share_amount) || (shares * 24000);
            const admFee = parseFloat(item.admission_fee) || (shares * 570);
            const totAmt = parseFloat(item.total_amount) || (shareAmt + admFee);
            const statusText = item.approval_status || item.status || 'Application';

            return (
              <tr key={item.id || idx} className="border-b border-black/80 hover:bg-slate-50">
                <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-1 text-center font-mono">{item.date || '—'}</td>
                <td className="border border-black p-1 px-1.5 font-bold text-left">{item.full_name || '—'}</td>
                <td className="border border-black p-1 text-center">{item.place || '—'}</td>
                <td className="border border-black p-1 text-center">{item.taluk || '—'}</td>
                <td className="border border-black p-1 text-right font-mono">{shareAmt.toLocaleString()}</td>
                <td className="border border-black p-1 text-right font-mono">{admFee.toLocaleString()}</td>
                <td className="border border-black p-1 text-right font-mono font-bold">{totAmt.toLocaleString()}</td>
                <td className="border border-black p-1 text-center font-mono">{item.receipt_no || '—'}</td>
                <td className="border border-black p-1 text-center font-mono font-bold">{shares}</td>
                <td className="border border-black p-1 text-center font-semibold">{item.category || 'ಅ ವರ್ಗ'}</td>
                <td className="border border-black p-1 text-center font-mono">{item.tharava_date || '—'}</td>
                <td className="border border-black p-1 text-center font-mono">{item.tharava_no || '—'}</td>
                <td className="border border-black p-1 text-center font-mono font-bold">{item.share_no || '—'}</td>
                <td className="border border-black p-1 text-center text-[10px] font-bold">
                  {statusText.includes('Approved') || statusText.includes('ಮಂಜೂರು') ? 'ಮಂಜೂರಾಗಿದೆ' : 'ಅರ್ಜಿ'}
                </td>
              </tr>
            );
          })
        )}
        {/* Grand Total Row */}
        {recordsToPrint.length > 0 && (
          <tr className="bg-slate-200 border-t-2 border-black font-bold text-black">
            <td colSpan="5" className="border border-black p-1.5 text-center font-bold">
              ಒಟ್ಟು ಮೊತ್ತ (GRAND TOTAL) - {recordsToPrint.length} ಸದಸ್ಯರು
            </td>
            <td className="border border-black p-1.5 text-right font-mono font-bold">₹ {totalShareCapital.toLocaleString()}</td>
            <td className="border border-black p-1.5 text-right font-mono font-bold">₹ {totalAdmissionFees.toLocaleString()}</td>
            <td className="border border-black p-1.5 text-right font-mono font-bold">₹ {totalCollection.toLocaleString()}</td>
            <td className="border border-black p-1.5 text-center"></td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">{totalShares}</td>
            <td colSpan="5" className="border border-black p-1.5"></td>
          </tr>
        )}
      </tbody>
    </table>
  );

  // 2. Varasa Table
  const renderVarasaTable = () => (
    <table className="w-full border-collapse border border-black text-black text-[11px]">
      <thead>
        <tr className="bg-slate-200 border-b-2 border-black font-bold text-center">
          <th className="border border-black p-1.5 w-8">ಕ್ರ.ಸಂ.</th>
          <th className="border border-black p-1.5 text-left">1. ವಾರಸುದಾರರ ಹೆಸರು (Varasa Heir)</th>
          <th className="border border-black p-1.5">ಸ್ಥಳ & ತಾಲೂಕು</th>
          <th className="border border-black p-1.5">ಸಂಬಂಧ & ವಯಸ್ಸು</th>
          <th className="border border-black p-1.5 text-center">ಮೊಬೈಲ್ & ಆಧಾರ್</th>
          <th className="border border-black p-1.5 text-left">2. ಮೂಲ ಶೇರುದಾರರು (Deceased)</th>
          <th className="border border-black p-1.5 text-center">ನಿಧನ ದಿನಾಂಕ</th>
          <th className="border border-black p-1.5 text-center">ಶೇರು ನಂ</th>
          <th className="border border-black p-1.5 text-center">ಶೇರು / ವರ್ಗ</th>
          <th className="border border-black p-1.5 text-center">ರಶೀದಿ & ಶುಲ್ಕ</th>
          <th className="border border-black p-1.5 text-center">ಠರಾವು ವಿವರ</th>
          <th className="border border-black p-1.5 text-center w-20">ಸ್ಥಿತಿ</th>
        </tr>
      </thead>
      <tbody>
        {recordsToPrint.length === 0 ? (
          <tr>
            <td colSpan="12" className="border border-black p-8 text-center text-slate-500 font-bold">
              ಯಾವುದೇ ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ
            </td>
          </tr>
        ) : (
          recordsToPrint.map((item, idx) => {
            const shares = parseInt(item.no_of_shares || item.shares, 10) || 1;
            const fee = parseFloat(item.fees !== undefined ? item.fees : item.fee) || 570;
            const heirName = item.varasa_member || item.heir_name || '—';
            const shName = item.shareholder_name || item.existing_shareholder_name || '—';

            return (
              <tr key={item.id || item.transfer_id || idx} className="border-b border-black/80 hover:bg-slate-50">
                <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-1 px-1.5 font-bold text-left">
                  <div>{heirName}</div>
                  <span className="text-[9.5px] font-mono text-slate-600">{item.transfer_id}</span>
                </td>
                <td className="border border-black p-1 text-center">
                  <div>{item.heir_place || '—'}</div>
                  <div className="text-[10px] text-slate-600">{item.heir_taluk || 'ಚಡಚಣ'}</div>
                </td>
                <td className="border border-black p-1 text-center">
                  <div>{item.heir_relationship || item.relationship || 'ಸ್ವಂತ'}</div>
                  <div className="text-[10px] text-slate-600">{item.heir_age ? `${item.heir_age} ವರ್ಷ` : ''}</div>
                </td>
                <td className="border border-black p-1 text-center font-mono text-[10px]">
                  <div>{item.heir_mobile || item.mobile || '—'}</div>
                  <div className="text-slate-600">{item.heir_aadhaar || '—'}</div>
                </td>
                <td className="border border-black p-1 px-1.5 font-medium text-left">
                  <div>{shName}</div>
                  <span className="text-[9.5px] text-slate-600">{item.shareholder_place || ''}</span>
                </td>
                <td className="border border-black p-1 text-center font-mono text-[10px]">{item.date_of_death || '—'}</td>
                <td className="border border-black p-1 text-center font-mono font-bold">{item.share_no || item.existing_share_number || '—'}</td>
                <td className="border border-black p-1 text-center">
                  <div className="font-mono font-bold">{shares}</div>
                  <div className="text-[10px]">{item.category || 'ಅ - ವರ್ಗ'}</div>
                </td>
                <td className="border border-black p-1 text-center">
                  <div className="font-mono">#{item.receipt_no || '—'}</div>
                  <div className="font-mono font-bold text-[10px]">₹{fee}</div>
                </td>
                <td className="border border-black p-1 text-center text-[10px] font-mono">
                  {item.tharava_no ? `ಠರಾವು: ${item.tharava_no}` : '—'}
                  {item.tharava_date ? ` (${item.tharava_date})` : ''}
                </td>
                <td className="border border-black p-1 text-center text-[10px] font-bold">
                  {item.status || 'Approved'}
                </td>
              </tr>
            );
          })
        )}
        {recordsToPrint.length > 0 && (
          <tr className="bg-slate-200 border-t-2 border-black font-bold text-black">
            <td colSpan="8" className="border border-black p-1.5 text-center font-bold">
              ಒಟ್ಟು (GRAND TOTAL) - {recordsToPrint.length} ವಾರಸುದಾರರು
            </td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">{totalShares}</td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">₹ {totalCollection.toLocaleString()}</td>
            <td colSpan="2" className="border border-black p-1.5"></td>
          </tr>
        )}
      </tbody>
    </table>
  );

  // 3. Vargavane Table
  const renderVargavaneTable = () => (
    <table className="w-full border-collapse border border-black text-black text-[11px]">
      <thead>
        <tr className="bg-slate-200 border-b-2 border-black font-bold text-center">
          <th className="border border-black p-1.5 w-8">ಕ್ರ.ಸಂ.</th>
          <th className="border border-black p-1.5 text-left">1. ಮೂಲ ಶೇರುದಾರರು (Transferor)</th>
          <th className="border border-black p-1.5">ಮೂಲ ಸ್ಥಳ & ತಾಲೂಕು</th>
          <th className="border border-black p-1.5 text-left">2. ವರ್ಗಾವಣೆದಾರರು (Transferee)</th>
          <th className="border border-black p-1.5">ವರ್ಗಾವಣೆದಾರರ ಸ್ಥಳ</th>
          <th className="border border-black p-1.5">ಸಂಬಂಧ</th>
          <th className="border border-black p-1.5 text-center">ಶೇರು ನಂ</th>
          <th className="border border-black p-1.5 text-center">ಶೇರು / ವರ್ಗ</th>
          <th className="border border-black p-1.5 text-center">ರಶೀದಿ & ಶುಲ್ಕ</th>
          <th className="border border-black p-1.5 text-center">ಠರಾವು ವಿವರ</th>
          <th className="border border-black p-1.5 text-center w-20">ಸ್ಥಿತಿ</th>
        </tr>
      </thead>
      <tbody>
        {recordsToPrint.length === 0 ? (
          <tr>
            <td colSpan="11" className="border border-black p-8 text-center text-slate-500 font-bold">
              ಯಾವುದೇ ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ
            </td>
          </tr>
        ) : (
          recordsToPrint.map((item, idx) => {
            const shares = parseInt(item.no_of_shares || item.shares, 10) || 1;
            const fee = parseFloat(item.fees !== undefined ? item.fees : item.fee) || 570;
            const transferorName = item.transferor_name || item.shareholder_name || '—';
            const transfereeName = item.transferee_name || item.heir_name || '—';

            return (
              <tr key={item.id || item.transfer_id || idx} className="border-b border-black/80 hover:bg-slate-50">
                <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                <td className="border border-black p-1 px-1.5 font-bold text-left">
                  <div>{transferorName}</div>
                  <span className="text-[9.5px] font-mono text-slate-600">{item.transfer_id}</span>
                </td>
                <td className="border border-black p-1 text-center">
                  <div>{item.transferor_place || '—'}</div>
                  <div className="text-[10px] text-slate-600">{item.transferor_taluk || 'ಚಡಚಣ'}</div>
                </td>
                <td className="border border-black p-1 px-1.5 font-bold text-left">
                  <div>{transfereeName}</div>
                  <div className="text-[10px] text-slate-600 font-mono">{item.transferee_mobile || item.mobile || ''}</div>
                </td>
                <td className="border border-black p-1 text-center">
                  <div>{item.transferee_place || '—'}</div>
                  <div className="text-[10px] text-slate-600">{item.transferee_taluk || 'ಚಡಚಣ'}</div>
                </td>
                <td className="border border-black p-1 text-center">
                  {item.transferee_relationship || item.relationship || 'ಸ್ವಂತ'}
                </td>
                <td className="border border-black p-1 text-center font-mono font-bold">{item.share_no || item.existing_share_number || '—'}</td>
                <td className="border border-black p-1 text-center">
                  <div className="font-mono font-bold">{shares}</div>
                  <div className="text-[10px]">{item.category || 'ಅ - ವರ್ಗ'}</div>
                </td>
                <td className="border border-black p-1 text-center">
                  <div className="font-mono">#{item.receipt_no || '—'}</div>
                  <div className="font-mono font-bold text-[10px]">₹{fee}</div>
                </td>
                <td className="border border-black p-1 text-center text-[10px] font-mono">
                  {item.tharava_no ? `ಠರಾವು: ${item.tharava_no}` : '—'}
                  {item.tharava_date ? ` (${item.tharava_date})` : ''}
                </td>
                <td className="border border-black p-1 text-center text-[10px] font-bold">
                  {item.status || 'Approved'}
                </td>
              </tr>
            );
          })
        )}
        {recordsToPrint.length > 0 && (
          <tr className="bg-slate-200 border-t-2 border-black font-bold text-black">
            <td colSpan="7" className="border border-black p-1.5 text-center font-bold">
              ಒಟ್ಟು (GRAND TOTAL) - {recordsToPrint.length} ವರ್ಗಾವಣೆಗಳು
            </td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">{totalShares}</td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">₹ {totalCollection.toLocaleString()}</td>
            <td colSpan="2" className="border border-black p-1.5"></td>
          </tr>
        )}
      </tbody>
    </table>
  );

  // Signatures Footer Block
  const renderSignaturesBlock = () => (
    <div className="mt-8 pt-4 border-t-2 border-black flex justify-between items-end text-black text-xs font-bold text-center px-4">
      <div className="w-36">
        <div className="h-10"></div>
        <div className="border-t border-black pt-1">ತಯಾರಿಸಿದವರು<br /><span className="text-[10px] font-normal text-slate-700">(Prepared by / Clerk)</span></div>
      </div>
      <div className="w-36">
        <div className="h-10"></div>
        <div className="border-t border-black pt-1">ಶೇರು ಶಾಖಾಧಿಕಾರಿ<br /><span className="text-[10px] font-normal text-slate-700">(Share Section Officer)</span></div>
      </div>
      <div className="w-36">
        <div className="h-10"></div>
        <div className="border-t border-black pt-1">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ<br /><span className="text-[10px] font-normal text-slate-700">(Chief Accounts Officer)</span></div>
      </div>
      <div className="w-44">
        <div className="h-10"></div>
        <div className="border-t border-black pt-1">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು<br /><span className="text-[10px] font-normal text-slate-700">(Managing Director)</span></div>
      </div>
    </div>
  );

  const documentContent = (
    <div className="bg-white text-black p-6 font-kannada font-sans w-full min-h-[100%] box-border">
      {renderStatutoryHeader()}
      {renderMetaBanner()}
      {type === 'enrollment' && renderEnrollmentTable()}
      {type === 'varasa' && renderVarasaTable()}
      {type === 'vargavane' && renderVargavaneTable()}
      {renderSignaturesBlock()}
    </div>
  );

  return (
    <>
      {/* 1. On-Screen Interactive Preview Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn no-print">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header Controls Bar */}
          <div className="p-4 px-6 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{registerTitleKn}</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ಹೆಡರ್, ದ್ವಿ-ಲಾಂಛನ ಹಾಗೂ 4 ಹಂತದ ಅಧಿಕೃತ ಸಹಿ ವಿವರಗಳೊಂದಿಗೆ ಮುದ್ರಣ
                </p>
              </div>
            </div>

            {/* Scope & Orientation Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Scope selector */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
                    scope === 'filtered'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ಶೋಧಿತ ಎಲ್ಲಾ ({allRecords.length})</span>
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setScope('selected')}
                  className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1.5 cursor-pointer ${
                    selectedIds.size === 0
                      ? 'opacity-40 cursor-not-allowed text-slate-600'
                      : scope === 'selected'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={selectedIds.size === 0 ? 'ಯಾವುದೇ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿಲ್ಲ' : 'ಆಯ್ದ ಸದಸ್ಯರ ಮುದ್ರಣ'}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>ಆಯ್ದ ಸದಸ್ಯರು ({selectedIds.size})</span>
                </button>
              </div>

              {/* Orientation selector */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                    orientation === 'landscape' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                  title="A4 ಅಡ್ಡ ಪಟ್ಟಿ (Landscape - 15 ಕಾಲಂಗಳಿಗೆ ಶಿಫಾರಸು)"
                >
                  Landscape (ಅಡ್ಡ)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                    orientation === 'portrait' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                  title="A4 ಉದ್ದ ಪಟ್ಟಿ (Portrait)"
                >
                  Portrait (ಉದ್ದ)
                </button>
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>ಮುದ್ರಿಸಿ (Print {recordsToPrint.length})</span>
              </button>

              {(type === 'enrollment' || type === 'varasa' || type === 'vargavane') && (
                <button
                  type="button"
                  disabled={isDownloadingDocx}
                  onClick={handleDownloadDocx}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950 transition-all cursor-pointer"
                  title={type === 'vargavane' ? "ವರ್ಗಾವಣೆ ಯಾದಿ Word (.docx) ಫೈಲ್ ಡೌನ್‌ಲೋಡ್" : type === 'varasa' ? "ವಾರಸಾ ಯಾದಿ Word (.docx) ಫೈಲ್ ಡೌನ್‌ಲೋಡ್" : "ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ Word (.docx) ಫೈಲ್ ಡೌನ್‌ಲೋಡ್"}
                >
                  <FileText className="w-4 h-4" />
                  <span>{isDownloadingDocx ? 'ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : 'Word (.docx)'}</span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                title="ಮುಚ್ಚಿ (Close)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body Preview Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/70 flex justify-center">
            <div className={`bg-white text-black shadow-2xl rounded-lg overflow-hidden border border-slate-300 w-full ${orientation === 'landscape' ? 'max-w-[1250px]' : 'max-w-[850px]'}`}>
              {documentContent}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Standalone Print Portal for window.print() */}
      {typeof document !== 'undefined' && createPortal(
        <div className="register-list-print-portal">
          <style>{`
            @page {
              size: A4 ${orientation};
              margin: 8mm 6mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .register-list-print-portal {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
            }
          `}</style>
          {documentContent}
        </div>,
        document.body
      )}
    </>
  );
}
