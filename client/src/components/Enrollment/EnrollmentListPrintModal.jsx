import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ApiService } from '../../services/api';
import { useCompanyLogo, useHandshakeLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import {
  Printer, X, Filter, CheckCircle2, Users, FileText, ChevronDown,
  Coins, Receipt, Building2, MapPin, CheckSquare, Square, Download
} from 'lucide-react';

// Format Kannada / Statutory Date
function formatKannadaDate(dateStr) {
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

// Cooperative Handshake Emblem Icon Component
function CooperativeHandshakeIcon({ className = "w-20 h-11" }) {
  const handshakeLogo = useHandshakeLogo();
  const [imgError, setImgError] = useState(false);

  if (handshakeLogo && !imgError) {
    return (
      <img
        src={handshakeLogo}
        alt="Cooperative Handshake Emblem"
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

export default function EnrollmentListPrintModal({
  isOpen,
  onClose,
  selectedIds = new Set(),
  currentPageEnrollments = [],
  searchTerm = '',
  categoryFilter = 'All',
  statusFilter = 'All',
  initialScope = 'selected'
}) {
  const companyLogo = useCompanyLogo();

  // Print Scope: 'selected' | 'filtered' | 'page' | 'all'
  const [scope, setScope] = useState(() => {
    if (selectedIds && selectedIds.size > 0) return 'selected';
    return initialScope || 'filtered';
  });

  const [orientation, setOrientation] = useState('landscape'); // landscape is optimal for 15 columns
  const [includeSignatureCol, setIncludeSignatureCol] = useState(true);
  const [allFilteredRecords, setAllFilteredRecords] = useState([]);
  const [allSystemRecords, setAllSystemRecords] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch full records when needed
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchFullData = async () => {
      setLoadingData(true);
      try {
        // Fetch all filtered records matching search, category, status (no pagination slice)
        const filteredRes = await ApiService.getEnrollments({
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
          page: 1,
          limit: 99999
        });
        if (isMounted && filteredRes?.success) {
          setAllFilteredRecords(filteredRes.data || []);
        }

        // Fetch all total system records for 'all' scope
        const allRes = await ApiService.getEnrollments({
          search: '',
          category: 'All',
          status: 'All',
          page: 1,
          limit: 99999
        });
        if (isMounted && allRes?.success) {
          setAllSystemRecords(allRes.data || []);
        }
      } catch (err) {
        console.warn('Failed to fetch full enrollments for list print:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchFullData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, searchTerm, categoryFilter, statusFilter]);

  // Adjust scope if selectedIds changed
  useEffect(() => {
    if (selectedIds && selectedIds.size > 0) {
      setScope('selected');
    } else if (scope === 'selected') {
      setScope('filtered');
    }
  }, [selectedIds]);

  // Determine active list of records to print
  const printableRecords = useMemo(() => {
    if (scope === 'selected') {
      // Find from allSystemRecords or allFilteredRecords or currentPage
      const source = allSystemRecords.length > 0 ? allSystemRecords : (allFilteredRecords.length > 0 ? allFilteredRecords : currentPageEnrollments);
      return source.filter(r => selectedIds.has(r.id));
    }
    if (scope === 'filtered') {
      return allFilteredRecords.length > 0 ? allFilteredRecords : currentPageEnrollments;
    }
    if (scope === 'page') {
      return currentPageEnrollments;
    }
    if (scope === 'all') {
      return allSystemRecords.length > 0 ? allSystemRecords : allFilteredRecords;
    }
    return currentPageEnrollments;
  }, [scope, selectedIds, allFilteredRecords, allSystemRecords, currentPageEnrollments]);

  // Totals calculations
  const totals = useMemo(() => {
    let shares = 0;
    let capital = 0;
    let admission = 0;
    let totalAmt = 0;

    printableRecords.forEach(r => {
      const s = parseInt(r.no_shares, 10) || 1;
      const c = parseFloat(r.share_amount) || 0;
      const a = parseFloat(r.admission_fee) || 0;
      const t = parseFloat(r.total_amount) || (c + a);

      shares += s;
      capital += c;
      admission += a;
      totalAmt += t;
    });

    return { shares, capital, admission, totalAmt };
  }, [printableRecords]);

  // Print Action
  const handlePrint = () => {
    document.body.classList.add('enrollment-list-printing');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('enrollment-list-printing');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('enrollment-list-printing');
    };
  }, []);

  if (!isOpen) return null;

  const todayStr = formatKannadaDate(new Date());

  // Render the Official Statutory Header Box
  const renderStatutoryHeader = () => (
    <div className="border-[2px] border-black bg-white mb-2 w-full box-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white">
        {/* Left: Factory Emblem */}
        <div className="w-20 flex items-center justify-center shrink-0">
          <img
            src={companyLogo}
            alt="B.S.S.K.N Logo"
            className="h-[62px] w-auto object-contain"
            onError={(e) => {
              e.target.src = DEFAULT_LOGO_PATH;
            }}
          />
        </div>

        {/* Center: Official Title */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-[19px] font-extrabold tracking-tight text-black leading-tight">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
          </h1>
          <h2 className="text-[10.5px] font-bold tracking-wider text-black uppercase font-sans mt-0.5">
            SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
          </h2>
          <div className="mt-0.5">
            <span className="text-[16px] font-black text-black tracking-wide inline-block">
              ಶೇರು ವಿಭಾಗ – ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ರಿಜಿಸ್ಟರ್ (15 ಕಾಲಂ ವಹಿ)
            </span>
          </div>
        </div>

        {/* Right: Handshake Emblem */}
        <div className="w-20 flex items-center justify-center shrink-0">
          <CooperativeHandshakeIcon className="w-18 h-10" />
        </div>
      </div>

      {/* Sub-bar: Taluk / District */}
      <div className="border-t-[1.5px] border-black flex justify-between px-4 py-0.5 text-[11px] font-bold bg-white text-black">
        <div>ತಾಲೂಕು|| ಚಡಚಣ</div>
        <div>ಜಿಲ್ಲಾ|| ವಿಜಯಪುರ</div>
      </div>
    </div>
  );

  // Render the Print Sheet Content (Shared between on-screen preview & print portal)
  const renderRegisterContent = () => (
    <div className="enrollment-list-sheet bg-white text-black w-full min-h-full p-4 font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative flex flex-col justify-between">
      <div>
        {renderStatutoryHeader()}

        {/* Filter and Summary Strip */}
        <div className="border border-black bg-slate-50 p-2 mb-2 text-[11px] text-black">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/40 pb-1.5 mb-1.5">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-bold">ಮುದ್ರಿತ ದಿನಾಂಕ:</span> {todayStr}
              </div>
              <div>
                <span className="font-bold">ವರ್ಗ (Category):</span>{' '}
                <span className="font-semibold">{categoryFilter === 'All' ? 'ಎಲ್ಲಾ ವರ್ಗಗಳು (All)' : categoryFilter}</span>
              </div>
              <div>
                <span className="font-bold">ಸ್ಥಿತಿ (Status):</span>{' '}
                <span className="font-semibold">{statusFilter === 'All' ? 'ಎಲ್ಲಾ' : statusFilter === 'Approved' ? 'ಠರಾವು ಮಂಜೂರು' : statusFilter}</span>
              </div>
              {searchTerm && (
                <div>
                  <span className="font-bold">ಶೋಧನೆ (Search):</span> "{searchTerm}"
                </div>
              )}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded bg-black text-white font-mono font-bold text-[10px]">
                {scope === 'selected' ? `ಆಯ್ದ ಶೇರುದಾರರು (${printableRecords.length})` : scope === 'filtered' ? `ಶೋಧಿತ ಪಟ್ಟಿ (${printableRecords.length})` : `ನೋಂದಣಿ ಪಟ್ಟಿ (${printableRecords.length})`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <div>
              <span className="text-slate-600 block text-[9.5px]">ಒಟ್ಟು ಶೇರುದಾರರು:</span>
              <strong className="text-black font-mono text-[12px]">{printableRecords.length} ಸದಸ್ಯರು</strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[9.5px]">ಒಟ್ಟು ಶೇರು ಪ್ರಮಾಣ:</span>
              <strong className="text-black font-mono text-[12px]">{totals.shares} ಶೇರುಗಳು</strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[9.5px]">ಶೇರು ಬಂಡವಾಳ (₹):</span>
              <strong className="text-black font-mono text-[12px]">₹ {totals.capital.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[9.5px]">ಪ್ರವೇಶ ಶುಲ್ಕ (₹):</span>
              <strong className="text-black font-mono text-[12px]">₹ {totals.admission.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[9.5px]">ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ (₹):</span>
              <strong className="text-black font-mono text-[12.5px] font-black">₹ {totals.totalAmt.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* 15-Column Statutory Register Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-[10px] border border-black text-black">
            <thead>
              <tr className="bg-slate-200 text-black font-extrabold border-b-[1.5px] border-black text-center">
                <th className="border border-black px-1.5 py-1.5 w-7">ಕ್ರ.ಸಂ</th>
                <th className="border border-black px-1.5 py-1.5 w-16">ದಿನಾಂಕ</th>
                <th className="border border-black px-2 py-1.5 text-left min-w-[130px]">ಶೇರುದಾರರ ಪೂರ್ಣ ಹೆಸರು</th>
                <th className="border border-black px-1.5 py-1.5 text-left w-18">ಸ್ಥಳ / ಗ್ರಾಮ</th>
                <th className="border border-black px-1.5 py-1.5 text-left w-14">ತಾಲೂಕು</th>
                <th className="border border-black px-1.5 py-1.5 text-left w-14">ಜಿಲ್ಲೆ</th>
                <th className="border border-black px-1.5 py-1.5 text-right w-18">ಶೇರು ಮೊತ್ತ</th>
                <th className="border border-black px-1.5 py-1.5 text-right w-14">ಪ್ರವೇಶ ಶುಲ್ಕ</th>
                <th className="border border-black px-1.5 py-1.5 text-right w-18 bg-slate-300/80">ಒಟ್ಟು ಮೊತ್ತ</th>
                <th className="border border-black px-1.5 py-1.5 w-14">ರಶೀದಿ ನಂ</th>
                <th className="border border-black px-1.5 py-1.5 w-10">ಶೇರು</th>
                <th className="border border-black px-1.5 py-1.5 w-12">ವರ್ಗ</th>
                <th className="border border-black px-1.5 py-1.5 w-16">ಠರಾವು ದಿನಾಂಕ</th>
                <th className="border border-black px-1.5 py-1.5 w-12">ಠರಾವು ನಂ</th>
                <th className="border border-black px-1.5 py-1.5 w-14">ಶೇರು ನಂ</th>
                {includeSignatureCol && (
                  <th className="border border-black px-2 py-1.5 w-20">ಸದಸ್ಯರ ಸಹಿ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {printableRecords.length === 0 ? (
                <tr>
                  <td colSpan={includeSignatureCol ? 16 : 15} className="border border-black py-8 text-center text-slate-500 font-bold">
                    ಮುದ್ರಿಸಲು ಯಾವುದೇ ಶೇರುದಾರರ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.
                  </td>
                </tr>
              ) : (
                printableRecords.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-black/70">
                    {/* 1. Sl No */}
                    <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                      {item.sl_no || (idx + 1)}
                    </td>
                    {/* 2. Date */}
                    <td className="border border-black px-1 py-1 text-center font-mono whitespace-nowrap">
                      {formatKannadaDate(item.date)}
                    </td>
                    {/* 3. Full Name */}
                    <td className="border border-black px-2 py-1 font-bold text-[10.5px]">
                      {item.full_name}
                    </td>
                    {/* 4. Place */}
                    <td className="border border-black px-1.5 py-1">
                      {item.place || '—'}
                    </td>
                    {/* 5. Taluk */}
                    <td className="border border-black px-1 py-1">
                      {item.taluk || '—'}
                    </td>
                    {/* 6. Dist */}
                    <td className="border border-black px-1 py-1">
                      {item.dist || '—'}
                    </td>
                    {/* 7. Share amount */}
                    <td className="border border-black px-1.5 py-1 text-right font-mono font-semibold">
                      {Number(item.share_amount || 0).toLocaleString('en-IN')}
                    </td>
                    {/* 8. Admission Fee */}
                    <td className="border border-black px-1.5 py-1 text-right font-mono font-semibold">
                      {Number(item.admission_fee || 0).toLocaleString('en-IN')}
                    </td>
                    {/* 9. Total Amount */}
                    <td className="border border-black px-1.5 py-1 text-right font-mono font-black bg-slate-100">
                      {Number(item.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    {/* 10. Reciept No */}
                    <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                      {item.receipt_no || '—'}
                    </td>
                    {/* 11. No. Shares */}
                    <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                      {item.no_shares || 1}
                    </td>
                    {/* 12. Category */}
                    <td className="border border-black px-1 py-1 text-center font-semibold text-[9.5px]">
                      {item.category || 'ಅ ವರ್ಗ'}
                    </td>
                    {/* 13. Tharava Date */}
                    <td className="border border-black px-1 py-1 text-center font-mono whitespace-nowrap">
                      {item.tharava_date || '—'}
                    </td>
                    {/* 14. Tharava No */}
                    <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                      {item.tharava_no || '—'}
                    </td>
                    {/* 15. Share No */}
                    <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                      {item.share_no ? `#${item.share_no}` : 'ಬಾಕಿ'}
                    </td>
                    {/* 16. Signature */}
                    {includeSignatureCol && (
                      <td className="border border-black px-1 py-1 text-center"></td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-extrabold border-t-[2px] border-black">
                <td colSpan={6} className="border border-black px-2 py-1.5 text-right font-bold">
                  ಒಟ್ಟು ಮೊತ್ತ (Grand Total):
                </td>
                <td className="border border-black px-1.5 py-1.5 text-right font-mono font-black">
                  ₹ {totals.capital.toLocaleString('en-IN')}
                </td>
                <td className="border border-black px-1.5 py-1.5 text-right font-mono font-black">
                  ₹ {totals.admission.toLocaleString('en-IN')}
                </td>
                <td className="border border-black px-1.5 py-1.5 text-right font-mono font-black bg-slate-300">
                  ₹ {totals.totalAmt.toLocaleString('en-IN')}
                </td>
                <td className="border border-black px-1 py-1.5 text-center font-mono">—</td>
                <td className="border border-black px-1 py-1.5 text-center font-mono font-black">{totals.shares}</td>
                <td colSpan={includeSignatureCol ? 5 : 4} className="border border-black px-2 py-1.5 text-left text-[9.5px] text-slate-700">
                  ಒಟ್ಟು {printableRecords.length} ನೋಂದಾಯಿತ ಸದಸ್ಯರು
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Official Signatures Block */}
      <div className="mt-8 pt-4 border-t border-black/40 grid grid-cols-4 gap-4 text-center text-xs font-bold text-black break-inside-avoid">
        <div className="space-y-6">
          <div className="h-8"></div>
          <div className="border-t border-black/80 pt-1">ತಯಾರಿಸಿದವರು (ಗುಮಾಸ್ತರು)</div>
        </div>
        <div className="space-y-6">
          <div className="h-8"></div>
          <div className="border-t border-black/80 pt-1">ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು / ಅಕೌಂಟೆಂಟ್</div>
        </div>
        <div className="space-y-6">
          <div className="h-8"></div>
          <div className="border-t border-black/80 pt-1">ಪ್ರಧಾನ ವ್ಯವಸ್ಥಾಪಕರು (GM)</div>
        </div>
        <div className="space-y-6">
          <div className="h-8"></div>
          <div className="border-t border-black/80 pt-1">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Print Specific CSS */}
      <style>{`
        @media screen {
          .enrollment-list-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
        }
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 6mm 8mm;
          }
          body.enrollment-list-printing > #root {
            display: none !important;
            visibility: hidden !important;
          }
          body.enrollment-list-printing .id-card-profile-print-portal,
          body.enrollment-list-printing .office-note-print-portal,
          body.enrollment-list-printing .varasa-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
          body.enrollment-list-printing {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.enrollment-list-printing > .enrollment-list-print-portal,
          body.enrollment-list-printing .enrollment-list-print-portal {
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
          body.enrollment-list-printing .enrollment-list-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 4px !important;
            box-sizing: border-box !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
        }
      `}</style>

      {/* Screen Interactive Preview Modal Dialog */}
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          
          {/* Top Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-600/60 flex items-center justify-center text-blue-400 font-bold shadow">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ಪಟ್ಟಿ ಮುದ್ರಣ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
                    {printableRecords.length} ದಾಖಲೆಗಳು
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  ಶಾಸನಬದ್ಧ ಹೆಡರ್, ದ್ವಿ-ಲಾಂಛನ ಹಾಗೂ 15 ಕಾಲಂಗಳೊಂದಿಗೆ ಅಧಿಕೃತ ರಿಜಿಸ್ಟರ್ ಮುದ್ರಣ
                </p>
              </div>
            </div>

            {/* Print Scope Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setScope('selected')}
                  className={`px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                    scope === 'selected'
                      ? 'bg-emerald-600 text-white shadow'
                      : selectedIds.size === 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={selectedIds.size === 0 ? 'ಯಾವುದೇ ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ' : 'ಆಯ್ದ ಶೇರುದಾರರನ್ನು ಮಾತ್ರ ಮುದ್ರಿಸಿ'}
                >
                  ಆಯ್ದವರು ({selectedIds.size})
                </button>

                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                    scope === 'filtered'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="ಪ್ರಸ್ತುತ ಶೋಧಿತ ಪಟ್ಟಿಯನ್ನು ಮುದ್ರಿಸಿ"
                >
                  ಶೋಧಿತ ಪಟ್ಟಿ ({allFilteredRecords.length || currentPageEnrollments.length})
                </button>

                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                    scope === 'all'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="ಎಲ್ಲಾ ನೋಂದಾಯಿತ ದಾಖಲೆಗಳನ್ನು ಮುದ್ರಿಸಿ"
                >
                  ಎಲ್ಲಾ ದಾಖಲೆಗಳು
                </button>
              </div>

              {/* Orientation Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    orientation === 'landscape' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  ಲ್ಯಾಂಡ್‌ಸ್ಕೇಪ್ (ಅಗಲ)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                    orientation === 'portrait' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  ಪೋರ್ಟ್ರೇಟ್
                </button>
              </div>

              {/* Signature Column Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-slate-300 px-2 py-1 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatureCol}
                  onChange={(e) => setIncludeSignatureCol(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>ಸಹಿ ಕಾಲಂ</span>
              </label>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>ಮುದ್ರಿಸಿ (Print Register)</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* On-Screen Scrollable Document Preview Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/60 flex justify-center">
            <div className="w-full max-w-5xl bg-white text-black shadow-2xl rounded-lg p-5 border border-slate-300 overflow-x-auto">
              {loadingData ? (
                <div className="py-20 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...</span>
                </div>
              ) : (
                renderRegisterContent()
              )}
            </div>
          </div>

          {/* Bottom Footer Bar */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span>ಆಯ್ಕೆ ವಿಧಾನ: </span>
              <strong className="text-slate-200">
                {scope === 'selected' ? `ಆಯ್ದ ಶೇರುದಾರರು (${printableRecords.length})` : scope === 'filtered' ? `ಶೋಧಿತ ಪಟ್ಟಿ (${printableRecords.length})` : `ಸಂಪೂರ್ಣ ಪಟ್ಟಿ (${printableRecords.length})`}
              </strong>
              <span className="mx-2">•</span>
              <span>ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: </span>
              <strong className="text-emerald-400 font-mono">₹ {totals.totalAmt.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>ಮುದ್ರಿಸಿ (Print)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                ಮುಚ್ಚಿ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actual Hidden Print Portal mounted directly onto document.body */}
      {createPortal(
        <div className="enrollment-list-print-portal">
          {renderRegisterContent()}
        </div>,
        document.body
      )}
    </>
  );
}
