import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, ChevronRight, Layers, UserCheck, ArrowRightLeft } from 'lucide-react';

// Classic Cooperative Handshake Icon (Two Clasped Hands with Suit Sleeves)
export function CooperativeHandshakeIcon({ className = "w-20 h-12" }) {
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

export default function VargavanePrintModal({ isOpen, onClose, vargavaneData, isNewSubmission = false }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p10'
  const logoSrc = './id_assets/bsskn_logo.png';

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('vargavane-printing');
    } else {
      document.body.classList.remove('vargavane-printing');
    }
    return () => {
      document.body.classList.remove('vargavane-printing');
    };
  }, [isOpen]);

  if (!isOpen || !vargavaneData) return null;

  const v = vargavaneData;

  // Transferor Details (ಮೂಲ ಶೇರುದಾರರು)
  const transferorName = v.transferor_name || v.shareholder_name || '';
  const transferorPlace = v.transferor_place || v.shareholder_place || '';
  const transferorTaluk = v.transferor_taluk || v.shareholder_taluk || 'ಇಂಡಿ';
  const transferorDistrict = v.transferor_district || v.shareholder_district || 'ವಿಜಯಪುರ';
  const transferorAadhaar = v.transferor_aadhaar || v.shareholder_aadhaar || '';
  const transferorMobile = v.transferor_mobile || v.shareholder_mobile || '';
  const transferorPhoto = v.transferor_photo || v.shareholder_photo || null;

  // Transferee Details (ವರ್ಗಾವಣೆ ಮಾಡಿಸಿಕೊಳ್ಳುವವರು)
  const transfereeName = v.transferee_name || v.heir_name || '';
  const transfereePlace = v.transferee_place || v.heir_place || '';
  const transfereeTaluk = v.transferee_taluk || v.heir_taluk || 'ಇಂಡಿ';
  const transfereeDistrict = v.transferee_district || v.heir_district || 'ವಿಜಯಪುರ';
  const transfereeRelationship = (v.transferee_relationship || v.heir_relationship || 'ಮಗ').trim();
  const transfereeAadhaar = v.transferee_aadhaar || v.heir_aadhaar || '';
  const transfereeMobile = v.transferee_mobile || v.heir_mobile || '';
  const transfereePhoto = v.transferee_photo || v.heir_photo || null;

  // Share & Transaction Info
  const shareNo = String(v.share_no || v.existing_share_number || '').replace(/^#/, '');
  const transferId = v.transfer_id || 'TR-2026-001';
  const category = v.category || 'ಅ - ವರ್ಗ';
  const cleanCategory = category.replace(/^[ಅಆಇಈಉಊಎಏಐಒಓಔಕ-ಹ]\s*-\s*/, '').trim() || category;
  const noOfShares = parseInt(v.no_of_shares) || 1;
  const fees = v.fees !== undefined ? v.fees : 570;
  const receiptNo = v.receipt_no || '';
  const receiptDate = formatDocDate(v.receipt_date);
  const applicationDate = formatDocDate(v.application_date || v.date);

  const handlePrint = () => {
    document.body.classList.add('vargavane-printing');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Reusable Statutory Header Box
  const renderHeaderBox = () => (
    <div className="border-[2px] border-black mb-3">
      <div className="flex items-center justify-between p-2 pb-1 bg-white">
        {/* Left: Factory Emblem */}
        <div className="w-20 flex items-center justify-center shrink-0">
          <img
            src={logoSrc}
            alt="B.S.S.K.N Logo"
            className="h-[68px] w-auto object-contain"
          />
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center px-1">
          <h1 className="text-[20px] font-bold tracking-tight text-black leading-tight">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
          </h1>
          <h2 className="text-[11px] font-bold tracking-wider text-black uppercase font-sans mt-0.5">
            SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
          </h2>
          <div className="mt-0.5">
            <span className="text-[22px] font-black text-black tracking-wide inline-block">
              ಶೇರು ವಿಭಾಗ
            </span>
          </div>
        </div>

        {/* Right: Handshake Emblem */}
        <div className="w-20 flex items-center justify-center shrink-0">
          <CooperativeHandshakeIcon className="w-18 h-11" />
        </div>
      </div>

      {/* Sub-bar: Taluk / District line */}
      <div className="border-t-[1.5px] border-black flex justify-between px-3 py-0.5 text-xs font-bold bg-white text-black">
        <div>ತಾಲೂಕು|| ಚಡಚಣ</div>
        <div>ಜಿಲ್ಲಾ|| ವಿಜಯಪೂರ</div>
      </div>
    </div>
  );

  // =========================================================================
  // PAGE 1: ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ - 1
  // =========================================================================
  const renderPage1 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        {/* Title */}
        <div className="text-center my-2">
          <h2 className="text-base font-black underline tracking-wide inline-block">
            ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ – 1
          </h2>
        </div>

        {/* Mobile & Receipt Header */}
        <div className="flex justify-end text-xs font-bold text-black mb-2">
          <div className="text-right space-y-0.5">
            <div>
              ಮೊಬೈಲ್ ನಂ: <span className="font-mono underline">{transfereeMobile || '9632668636'}</span>
            </div>
            <div className="text-[11px] font-medium font-sans">
              (Rcpt No: {receiptNo ? `${receiptNo}-${receiptDate}` : '591-01/06/2024'})
            </div>
          </div>
        </div>

        {/* Recipient Address */}
        <div className="text-xs leading-relaxed text-black mb-2 space-y-0.5">
          <div>ಗೆ,</div>
          <div className="font-bold">ಮಾನ್ಯ ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
          <div>ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪೂರ</div>
        </div>

        <div className="text-xs font-bold text-black mb-1">
          ಮಾನ್ಯರೇ,
        </div>

        {/* Body Text */}
        <div className="text-[12px] leading-[1.85] text-justify text-black mb-3">
          <p className="indent-6">
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ನಾನು <strong>ಶ್ರೀ. {transfereeName}</strong> ಸಾ: <strong>{transfereePlace}</strong> ತಾಲೂಕ: <strong>{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transfereeDistrict}</strong> ಈ ಮೂಲಕ ತಮ್ಮಲ್ಲಿ ಬರೆದುಕೊಡುವ ಒಪ್ಪಿಗೆ ಪತ್ರದ ಅರ್ಜಿ ಏನೆಂದರೆ-
          </p>
          <p className="indent-6 mt-1.5">
            ನನ್ನ <strong>{transfereeRelationship}</strong> ಯವರಾದ <strong>ಶ್ರೀ/ಶ್ರೀಮತಿ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದಲ್ಲಿ <strong>{noOfShares}</strong> ಶೇರು ಹೊಂದಿದ್ದು, ಶೇರು ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರ ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಹಾಗೂ ಪಂಚರ(ಹಿರಿಯರ) ಸಮಕ್ಷಮದಲ್ಲಿ ಚರ್ಚಿಸಲಾಗಿ, ನನ್ನ ಹೆಸರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವುದಕ್ಕೆ ಎಲ್ಲರೂ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿರುತ್ತಾರೆ. ಸದರಿಯವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಮುಂಗಡ ಬಾಕಿ ಇದ್ದಲ್ಲಿ ಅದಕ್ಕೆ ನಾನು ಜವಾಬ್ದಾರಿಯಾಗಿದ್ದು, ಅದನ್ನು ಕಾರ್ಖಾನೆಗೆ ಮರುಪಾವತಿಸಲು ಸಿದ್ಧನಿರುತ್ತೇನೆ. ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ದಾಖಲಾತಿಗಳನ್ನು ಇದರೊಂದಿಗೆ ಲಗತ್ತಿಸಿದ್ದು, ನಾನು ಪೂರೈಸಿದ ಮಾಹಿತಿಗಳು ಹಾಗು ದಾಖಲೆಗಳು ಸತ್ಯ ಮತ್ತು ನೈಜವಾಗಿದ್ದು, ಒಂದು ವೇಳೆ ದಾಖಲಾತಿಗಳು ಕಾನೂನು ಬಾಹಿರವೆಂದು ಕಂಡು ಬಂದಲ್ಲಿ ನನ್ನ ಮೇಲೆ ಯಾವುದೇ ರೀತಿ ಕ್ರಮವಿಡಲು ಕಾರ್ಖಾನೆಗೆ ಸಂಪೂರ್ಣ ಅಧಿಕಾರವಿರುತ್ತದೆ. ಕಾರ್ಖಾನೆಯ ಕಾಲಕಾಲಕ್ಕೆ ನೀಡುವ ಸೂಚನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು, ನಾನು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಕೂಲಂಕುಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಸದರಿಯವರ ಹೆಸರನ್ನು ಕಡಿಮೆ ಮಾಡಿ ನನ್ನ ಹೆಸರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
          </p>
        </div>

        {/* Date and Applicant Signature */}
        <div className="flex justify-between items-end my-3 text-xs">
          <div className="space-y-1">
            <div>ಸ್ಥಳ:- ಮರಗೂರ</div>
            <div>ದಿನಾಂಕ:- <span className="font-mono">{applicationDate}</span></div>
          </div>
          <div className="text-center">
            <div className="font-bold mb-8">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಸಹಿ</div>
            <div className="w-48 border-b border-black mx-auto"></div>
          </div>
        </div>

        {/* Attached Documents Checklist */}
        <div className="mt-4 pt-2 border-t border-black text-[11px] leading-relaxed text-black">
          <div className="font-bold underline mb-1">ಲಗತ್ತಿಸಿದ ದಾಖಲೆಗಳು:</div>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>ಸದರಿಯವರ ದೃಢೀಕರಿಸಿದ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ</li>
            <li>ಸದರಿಯವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಹಾಗು ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ <u>ಬೇ ಬಾಕಿ</u> ಪ್ರಮಾಣ ಪತ್ರ ಲಗತ್ತಿಸುವದು</li>
            <li>ಕಾರ್ಖಾನೆಯ ಮೂಲ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ(Share Certificate) ಹಾಗು ಗುರುತಿನ ಪತ್ರ(ID Card) ಲಗತ್ತಿಸುವದು.</li>
            <li>ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರಿನಲ್ಲಿ ರೂ.100/-ಬಾಂಡ ಮೇಲೆ ಒಪ್ಪಿಗೆ ಪತ್ರ ಲಗತ್ತಿಸುವದು.</li>
            <li>ರಹವಾಸಿ ಪತ್ರ:-ಚುನಾವಣೆ ಗುರುತಿನ ಚೀಟಿ/ಆಧಾರ್ ಕಾರ್ಡ ಯಾವುದಾದರು ಒಂದನ್ನು ದೃಢೀಕರಿಸಿದ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ ಲಗತ್ತಿಸುವದು.</li>
            <li>
              ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯ ವರ್ಗಾವಣೆ ಫೀ- ಒಟ್ಟು ರೂ. <strong>{fees}/-</strong> ಗಳನ್ನು ಭರಣಾ ಮಾಡಿದ ರಶೀದಿ ನಂ: <strong>{receiptNo || '_____'}</strong> ದಿನಾಂಕ:- <strong>{receiptDate}</strong> ಇದರ ಮೂಲ ಪ್ರತಿ ಲಗತ್ತಿಸುವದು.
            </li>
          </ol>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">1</div>
    </div>
  );

  // =========================================================================
  // PAGE 2: Share Transfer Transations Details (Transfer- 01)
  // =========================================================================
  const renderPage2 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {/* Top Header Row with Transfer Badge */}
        <div className="flex justify-between items-start mb-1">
          <div className="text-xs font-bold">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ
          </div>
          <div className="bg-yellow-400 border border-green-700 px-3 py-0.5 text-xs font-bold text-black shadow-sm">
            Transfer- 01
          </div>
        </div>

        {/* Central Box Heading */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-2 shadow-sm">
          <div className="border border-black py-1 px-4 bg-yellow-100/60 inline-block font-sans font-bold text-base tracking-wide text-black">
            Share Transfer Transations Details
          </div>
        </div>

        {/* Date Row */}
        <div className="flex justify-end text-xs font-bold mb-2">
          <div>ದಿನಾಂಕ: {receiptDate || applicationDate}</div>
        </div>

        {/* Table 1: From / To Matrix */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2.5 font-sans">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100 text-center">
              <th className="w-1/2 p-1.5 border-r border-black font-serif text-sm">From,</th>
              <th className="w-1/2 p-1.5 font-serif text-sm">To,</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black space-y-1 text-xs">
                <div className="font-bold text-center underline mb-1">‘{cleanCategory}’ Class Share</div>
                <div className="flex justify-between"><span>Old L.F. No</span><span className="font-bold font-mono">#{shareNo}</span></div>
                <div className="flex justify-between"><span>Member I.D. No</span><span className="font-bold font-mono">#{shareNo}</span></div>
                <div className="flex justify-between"><span>Old Certificate No.</span><span>—</span></div>
                <div className="flex justify-between"><span>Total No of Shares</span><span className="font-bold">{noOfShares}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-300">
                  <span className="font-['Anek_Kannada']">ವರ್ಗಾವಣೆ ಮಾಡುವವರು</span>
                  <span>NRD Shares : <strong>Nil</strong></span>
                </div>
              </td>
              <td className="p-2 space-y-1 text-xs">
                <div className="font-bold text-center underline mb-1">‘{cleanCategory}’ Class Share</div>
                <div className="flex justify-between"><span>New L.F. No</span><span className="font-bold font-mono">#{shareNo}</span></div>
                <div className="flex justify-between"><span>Member I.D. No</span><span>—</span></div>
                <div className="flex justify-between"><span>New Certificate No.</span><span>—</span></div>
                <div className="flex justify-between"><span>Total No of Shares</span><span className="font-bold">{noOfShares}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-300">
                  <span className="font-['Anek_Kannada']">ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು</span>
                  <span>NRD Shares : <strong>Nil</strong></span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Central Badge: Share Transaction No */}
        <div className="text-center my-2">
          <div className="border-[2px] border-sky-600 rounded-xl px-6 py-1 bg-sky-50 inline-block font-sans font-bold text-sm text-sky-950 shadow-inner">
            Share Transaction No:- <strong className="font-mono text-base text-sky-800">{transferId}</strong>
          </div>
        </div>

        {/* Table 2: Names, Addresses & Photos */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2.5">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100 text-center">
              <th className="w-1/2 p-1.5 border-r border-black">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಹೆಸರು & ವಿಳಾಸ</th>
              <th className="w-1/2 p-1.5">ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Transferor Column */}
              <td className="p-2 border-r border-black align-top">
                <div className="flex gap-2 justify-between items-start">
                  <div className="space-y-1 text-[12px] flex-1">
                    <div className="font-bold">ಶ್ರೀ/ಶ್ರೀಮತಿ: {transferorName}</div>
                    <div>ಸಾ :- {transferorPlace}</div>
                    <div>ತಾಲೂಕ: {transferorTaluk} ಜಿಲ್ಲೆ: {transferorDistrict}</div>
                    <div>ಆಧಾರ್ ಸಂಖ್ಯೆ:- {transferorAadhaar || '—'}</div>
                    <div>ಮೊಬೈಲ್ ನಂ:- {transferorMobile || '—'}</div>
                  </div>
                  {/* Photo Paste Box */}
                  <div className="w-[72px] h-[88px] border-[1.5px] border-dashed border-black rounded flex flex-col items-center justify-center text-[9px] text-slate-500 bg-slate-50 p-1 shrink-0 text-center">
                    {transferorPhoto ? (
                      <img src={transferorPhoto} alt="Transferor" className="w-full h-full object-cover rounded" />
                    ) : (
                      <>
                        <span className="font-bold">ಭಾವಚಿತ್ರ</span>
                        <span className="text-[7.5px] text-slate-400 mt-0.5">ಲಗತ್ತಿಸುವದು</span>
                      </>
                    )}
                  </div>
                </div>
              </td>

              {/* Transferee Column */}
              <td className="p-2 align-top">
                <div className="flex gap-2 justify-between items-start">
                  <div className="space-y-1 text-[12px] flex-1">
                    <div className="font-bold">ಶ್ರೀ. {transfereeName}</div>
                    <div>ಸಾ :- {transfereePlace}</div>
                    <div>ತಾಲೂಕ: {transfereeTaluk} ಜಿಲ್ಲೆ: {transfereeDistrict}</div>
                    <div>ಆಧಾರ್ ಸಂಖ್ಯೆ:- {transfereeAadhaar || '—'}</div>
                    <div>ಮೊಬೈಲ್ ನಂ:- {transfereeMobile || '—'}</div>
                  </div>
                  {/* Photo Paste Box */}
                  <div className="w-[72px] h-[88px] border-[1.5px] border-dashed border-black rounded flex flex-col items-center justify-center text-[9px] text-slate-500 bg-slate-50 p-1 shrink-0 text-center">
                    {transfereePhoto ? (
                      <img src={transfereePhoto} alt="Transferee" className="w-full h-full object-cover rounded" />
                    ) : (
                      <>
                        <span className="font-bold">ಭಾವಚಿತ್ರ</span>
                        <span className="text-[7.5px] text-slate-400 mt-0.5">ಲಗತ್ತಿಸುವದು</span>
                      </>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Specimen Signatures */}
        <div className="border-[1.5px] border-black p-2 mb-2 bg-white">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Transferor Signatures */}
            <div>
              <div className="font-bold underline text-center mb-1">
                ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವ ಸದಸ್ಯರ ಮಾದರಿ ಸಹಿ
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-11 border border-black rounded"></div>
                <div className="w-full h-11 border border-black rounded"></div>
              </div>
            </div>

            {/* Transferee Signatures */}
            <div>
              <div className="font-bold underline text-center mb-1">
                ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ಮಾದರಿ ಸಹಿ
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-11 border border-black rounded"></div>
                <div className="w-full h-11 border border-black rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumb Impressions */}
        <div className="border-[1.5px] border-black p-2 mb-2 bg-white">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Transferor Thumbs */}
            <div>
              <div className="font-bold underline text-center mb-1">
                ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಸಹಿ
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-11 border border-black rounded"></div>
                <div className="w-full h-11 border border-black rounded"></div>
              </div>
            </div>

            {/* Transferee Thumbs */}
            <div>
              <div className="font-bold underline text-center mb-1">
                ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಸಹಿ
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-11 border border-black rounded"></div>
                <div className="w-full h-11 border border-black rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Board Resolution Yellow Box */}
        <div className="border border-black p-2 bg-yellow-200/90 text-black text-[11px] leading-relaxed mb-2 font-medium">
          ಮೇಲ್ಕಂಡ ಶೇರು ಕೊಡುವವರು ಹಾಗು ತೆಗೆದುಕೊಳ್ಳುವವರು ವರ್ಗಾವಣೆಗಾಗಿ ವಿನಂತಿಸಿದ್ದರನ್ವಯ, ದಿನಾಂಕ:- _____ / _____ /2021 ರಂದು ಜರುಗಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ: _____ (B) ರಲ್ಲಿ ಶೇರು ವರ್ಗಾವಣೆಗೆ ಅನುಮತಿಸಿದ್ದರಿಂದ, ಈ ದಿವಸ ದಿನಾಂಕ:- _____ / _____ /2021 ರಂದು ವರ್ಗಾವಣೆ ಮಾಡಲಾಗಿರುತ್ತದೆ.
        </div>

        {/* Footer verification */}
        <div className="flex justify-between items-center text-xs pt-1">
          <div>ದಿನಾಂಕ: <span className="font-mono">{applicationDate}</span></div>
          <div className="text-right font-bold">ಪರಿಶೀಲನೆ ಮಾಡಿದವರ ಸಹಿ</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">2</div>
    </div>
  );

  // =========================================================================
  // PAGE 3: ಕಾರ್ಖಾನೆಯ ನಾಮಿನಲ್ ಮೆಂಬರ ಮಾಡಿಕೊಳ್ಳಲು ವಿನಂತಿ ಅರ್ಜಿ
  // =========================================================================
  const renderPage3 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        <div className="text-center font-bold text-sm mb-2 border-b border-black pb-1">
          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ
        </div>

        {/* Double Border Heading Box */}
        <div className="border-[2px] border-black p-1 text-center my-3">
          <div className="border border-black py-1.5 px-4 font-bold text-sm tracking-wide bg-slate-50">
            -:: ಕಾರ್ಖಾನೆಯ ನಾಮಿನಲ್ ಮೆಂಬರ ಮಾಡಿಕೊಳ್ಳಲು ವಿನಂತಿ ಅರ್ಜಿ ::-
          </div>
        </div>

        {/* Recipient Address */}
        <div className="text-xs leading-relaxed text-black my-3 space-y-0.5">
          <div>ಗೆ,</div>
          <div className="font-bold">ಮೆ: ವ್ಯವಸ್ಥಾಪಕರ ನಿರ್ದೇಶಕರು</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
          <div>ಮರಗೂರ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪೂರ</div>
        </div>

        <div className="text-xs font-bold text-black mb-1">
          ಮಾನ್ಯರೇ,
        </div>

        {/* Body Text */}
        <div className="text-[12px] leading-[1.85] text-justify text-black mb-4">
          <p className="indent-6">
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು <strong>ಶ್ರೀ/ಶ್ರೀಮತಿ {transfereeName}</strong> ಸಾ॥ <strong>{transfereePlace}</strong> ತಾ॥ <strong>{transfereeTaluk}</strong> ಜಿ॥ <strong>{transfereeDistrict}</strong> ಈ ಮೂಲಕ ತಮ್ಮಲ್ಲಿ ಬರೆಕೊಂಡ ವಿನಂತಿ ಅರ್ಜಿ ಏನೆಂದರೆ-
          </p>
          <p className="indent-6 mt-2">
            ನಾನು ತಮ್ಮ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ‘ಅ’/ ‘ಡ’ ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ಪಡೆದುಕೊಳ್ಳಲು ಇಚ್ಛಿಸಿದ್ದು, ಸದಸ್ಯನಾಗುವ ಪೂರ್ವದಲ್ಲಿ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಆಗುವದು ಅವಶ್ಯಕವಾಗಿದ್ದರನ್ವಯ, ಕಾರ್ಖಾನೆಯ ಪೋಟಿ ನಿಯಮಗಳ ಪ್ರಕಾರ ನನ್ನ ಹೆಸರಿನಲ್ಲಿ ರೂ. <strong>{fees}/- (ರೂಪಾಯಿ ಐದು ನೂರಡಾ ಎಪ್ಪತ್ತು ಮಾತ್ರ)</strong> ಗಳನ್ನು ರಶೀದಿ ಸಂಖ್ಯೆ:- <strong>{receiptNo || '_____'}</strong> ದಿನಾಂಕ:- <strong>{receiptDate}</strong> ರಂದು ಭರಣಾ ಮಾಡಿರುತ್ತೇನೆ.
          </p>
          <p className="indent-6 mt-2">
            ತಮ್ಮ ಕಾರ್ಖಾನೆಯ ಪೋಟಿ ನಿಯಮಗಳನ್ನು ನಾನು ಸ್ವತ: ಓದಿ / ಓದಿಸಿ ಸಂಪೂರ್ಣವಾಗಿ ತಿಳಿದುಕೊಂಡಿರುತ್ತೇನೆ. ಅವುಗಳನ್ನು ನಾನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ. ನನಗೆ ಕಾರ್ಖಾನೆಯ ಸದಸ್ಯತ್ವ ನೀಡಿದಲ್ಲಿ ನಾನು ಕಾರ್ಖಾನೆಯ ಪೋಟಿ ನಿಯಮದಂತೆ ನಡೆಯಲು ಒಪ್ಪುತ್ತೇನೆ. ಅದೇ ಪ್ರಕಾರ ಪೋಟಿ ನಿಯಮದಂತೆ ಅವಶ್ಯಕವಿರುವ ಕರಾರು ವ ನಿಬಂಧನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು ಹಾಗು ಜವಾಬ್ದಾರ ಹೊಣೆಗಾರನಿರುವೆನು ಅಂತಾ ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end my-6 text-xs">
          <div>
            <div className="font-bold underline mb-1">ಸಾಕ್ಷಿದಾರರ ಸಹಿ</div>
            <div>1) _____________________</div>
          </div>
          <div className="text-center">
            <div className="font-bold mb-8">ಅರ್ಜಿದಾರರ ಸಹಿ</div>
            <div className="w-40 border-b border-black"></div>
          </div>
        </div>

        {/* Submission / Cashier Verification Box */}
        <div className="border-[1.5px] border-black p-3 my-4 bg-slate-50 text-xs">
          <div className="flex justify-between items-center font-bold mb-2">
            <div>ಸಲ್ಲಿಸಲಾಗಿದೆ:-</div>
            <div>ದಿನಾಂಕ:- <span className="font-mono">{receiptDate}</span></div>
          </div>
          <p className="leading-relaxed text-justify text-[11.5px]">
            ಸದರಿಯವರು ನಾಮಮಾತ್ರ ನಾಮಿನಲ್ ಮೆಂಬರನಾಗುವ ಸಲುವಾಗಿ ರೂ. <strong>{fees}/- (ರೂಪಾಯಿ ಐದು ನೂರಡಾ ಎಪ್ಪತ್ತು ಮಾತ್ರ)</strong> ಗಳನ್ನು ಕಾರ್ಖಾನೆಯ ರಶೀದಿ ಸಂಖ್ಯೆ: <strong>{receiptNo || '_____'}</strong> ದಿನಾಂಕ:- <strong>{receiptDate}</strong> ರನ್ವಯ ಫೀ ಭರಣಾ ಮಾಡಿರುತ್ತಾರೆ. ಕಾರಣ, ಮುಂದಿನ ಕ್ರಮಕ್ಕಾಗಿ ಮೆ:ರವರಲ್ಲಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.
          </p>
        </div>

        {/* Bottom Officer Signatures */}
        <div className="flex justify-between items-end text-xs font-bold text-black pt-8 px-2">
          <div className="text-center">ಕ್ಯಾಶಿಯರ್</div>
          <div className="text-center">ಸಿ.ಡಿ.ಓ</div>
          <div className="text-center">ಕಛೇರಿ ಅಧೀಕ್ಷಕರು</div>
          <div className="text-center">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">3</div>
    </div>
  );

  // =========================================================================
  // PAGE 4: ಕಛೇರಿ ಟಿಪ್ಪಣೆ (ಕಬ್ಬು ಲೇಖಪಾಲರ ವರದಿ)
  // =========================================================================
  const renderPage4 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {/* Top Date */}
        <div className="flex justify-end text-xs font-bold text-black mb-3">
          <div>ದಿನಾಂಕ: {applicationDate}</div>
        </div>

        {/* Double Box Header */}
        <div className="border-[2px] border-black p-1 text-center my-3">
          <div className="border border-black py-1.5 px-6 font-bold text-sm tracking-wide bg-slate-50">
            -:: ಕಛೇರಿ ಟಿಪ್ಪಣೆ::-
          </div>
        </div>

        {/* Office Note Paragraph */}
        <div className="text-[12.5px] leading-[2] text-justify text-black my-4">
          <p className="indent-6">
            ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ಶ್ರೀ/ಶ್ರೀಮತಿ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ತಮ್ಮ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಯಾವುದೇ ಒತ್ತಾಯವಿಲ್ಲದೇ ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡಲು ದಿನಾಂಕ: <strong>{applicationDate}</strong> ರನ್ವಯ ವಿನಂತಿಸಿಕೊಂಡಿದ್ದು, ಸದರಿಯವರ ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಕಾರ್ಖಾನೆಗೆ ಬರಬೇಕಾಗಿದ್ದ ಬಾಕಿ ವಗೈರೆ ಇದ್ದ ಬಗ್ಗೆ ತಿಳಿಸಲು ಕೋರಿದೆ.
          </p>
        </div>

        {/* Section Sign */}
        <div className="text-right text-xs font-bold text-black my-6 pr-6">
          <div>ಶೇರ ವಿಭಾಗ</div>
        </div>

        {/* Separator Line */}
        <div className="border-b-[1.5px] border-dashed border-black my-6"></div>

        {/* Cane Accountant Report Box */}
        <div className="space-y-4 my-4">
          <div className="text-xs font-bold text-black underline">
            ಕಬ್ಬು ಲೇಖಪಾಲರ ವರದಿ :
          </div>
          <div className="text-[12px] leading-relaxed text-black pl-2">
            ಸದರಿಯವರಿಂದ ಬಾಕಿ ರೂ. _____________________________ ಗಳಷ್ಟು ಇರುತ್ತದೆ / ಇರುವುದಿಲ್ಲ.
          </div>
        </div>

        {/* Cane Accountant Signature */}
        <div className="text-right text-xs font-bold text-black pt-16 pr-6">
          <div>ಕಬ್ಬು ಲೇಖಪಾಲರ</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">4</div>
    </div>
  );

  // =========================================================================
  // PAGE 5: ಕಾರ್ಖಾನೆಯ ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ
  // =========================================================================
  const renderPage5 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {/* Top Header Box */}
        <div className="border-[2px] border-amber-600 rounded-lg p-1.5 bg-amber-500/15 text-center text-sm font-bold my-2">
          -:: ಕಾರ್ಖಾನೆಯ ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ ::-
        </div>

        <div className="flex justify-end text-xs font-bold text-black mb-3">
          <div>ದಿನಾಂಕ : {applicationDate}</div>
        </div>

        {/* Subject Box */}
        <div className="border border-purple-900 rounded-2xl p-2.5 my-3 text-center text-xs font-bold bg-purple-50/50 leading-relaxed">
          ವಿಷಯ:- “ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು ಹಾಗು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಶೇರು ವರ್ಗಾವಣೆಯ ಅರ್ಜಿಗೆ ಲಗತ್ತಿಸಿದ ಎಲ್ಲ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಪುನ: ಪರಿಶೀಲನೆ ಮಾಡಿ ಶಿಫಾರಸ್ಸು ಮಾಡಿರುವ ಕುರಿತು”
        </div>

        {/* Body Paragraph 1 */}
        <div className="text-[11.5px] leading-[1.75] text-justify text-black mb-3">
          <p className="indent-6">
            ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ಶ್ರೀ/ಶ್ರೀಮತಿ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು <strong>{noOfShares}</strong> ಶೇರ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ಈ ಶೇರನ್ನು ತಮ್ಮ <strong>{transfereeRelationship}</strong> ಗೆ ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿ, ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಕಬ್ಬು ಬೆಳೆಗಾರ ರೈತರಾದ <strong>ಶ್ರೀ {transfereeName}</strong> ಸಾ: <strong>{transfereePlace}</strong> ತಾಲೂಕ: <strong>{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transfereeDistrict}</strong> ಇವರಿಗೆ (ಹೊಸ ಶೇರ ಖಾತೆ ನಂ:- <strong>{shareNo}</strong> ಇದ್ದು,) ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ವಿನಂತಿಸಿಕೊಂಡಿದ್ದರನ್ವಯ, ಕಾರ್ಯಾಲಯ ಆದೇಶ ದಿನಾಂಕ: _____ / _____ /2021 ರ ಪ್ರಕಾರ ಕ್ಷೇತ್ರ ಸಹಾಯಕರಾದ ಶ್ರೀ _____________________ ಇವರು ದಿನಾಂಕ: _____ / _____ /2021 ರಂದು ಖುದ್ದಾಗಿ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸ್ವ-ಗ್ರಾಮಕ್ಕೆ ಖುದ್ದಾಗಿ ಹೋಗಿ ಪಂಚರ ಸಮಕ್ಷಮದಲ್ಲಿ ಹಾಗು ಗ್ರಾಮದ ಪ್ರಮುಖರ ಜೊತೆಗೆ ಕೂಲಂಕೂಷವಾಗಿ ವಿಚಾರಣೆ ಮಾಡಿ, ಅವರ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಸಂಪೂರ್ಣ ಒಪ್ಪಿಗೆ ಇರುವ ಬಗ್ಗೆ ಸಹಿ ಹಾಗು ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ) ತೆಗೆದುಕೊಂಡು ಸಾಕ್ಷಿದಾರರ ಸಮಕ್ಷಮ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಮಾಡಿದ ವರದಿಯನ್ನು ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ ರವರ ಶರಾದೊಂದಿಗೆ ದಿನಾಂಕ: _____ / _____ /2021 ರನ್ವಯ ತಮ್ಮ ಚೌಕಾಸಿ ವರದಿ ನೀಡಿರುತ್ತಾರೆ.
          </p>
        </div>

        {/* Body Paragraph 2 */}
        <div className="text-[11.5px] leading-[1.75] text-justify text-black mb-4">
          <p className="indent-6">
            ದಿನಾಂಕ: _____ / _____ /2021 ರಂದು ಜರುಗಿದ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ನಿರ್ಣಯದ ಪ್ರಕಾರ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ಅನುಮತಿ ನೀಡಿದ್ದರನ್ವಯ, ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು ಹಾಗು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಹಾಗು ಇಬ್ಬರು ಕಾರ್ಖಾನೆಯ ಶೇರು ಸದಸ್ಯರು(ಪಂಚರು) ಖುದ್ದಾಗಿ ಕಾರ್ಖಾನೆಯ ಮುಖ್ಯ ಕಛೇರಿಯಲ್ಲಿ ಹಾಜರಾಗಿ ದಿನಾಂಕ: _____ / _____ /2021 ರಂದು ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ವರ್ಗಾವಣೆ ಮಾಡಲಾಗಿರುತ್ತದೆ. ಈ ಶೇರು ವರ್ಗಾವಣೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಕಾರ್ಖಾನೆಯ ನಿಯಮ ಹಾಗು ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ <strong>1959 ಕಲಂ 23ರ</strong> ಪ್ರಕಾರ ನಿಯಮಾನುಸಾರ ಸರಿ ಇರುತ್ತವೆ ಅಂತಾ ಕಾರ್ಖಾನೆಯ ಕಾನೂನು ಸಲಹೆಗಾರರು ದಿನಾಂಕ: _____ / _____ /2021 ರನ್ವಯ ತಮ್ಮ ವರದಿ ನೀಡಿರುತ್ತಾರೆ. ಈ ಕೆಳಕಾಣಿಸಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿಯ ನಿರ್ದೇಶಕರಾದ ನಾವುಗಳು ಖುದ್ದಾಗಿ ಕಛೇರಿಯಲ್ಲಿ ಪುನ: ಮತ್ತೊಮ್ಮೆ ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲನೆ ಮಾಡಲಾಗಿ ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಿರುವುದು ಸರಿ ಇರುತ್ತವೆ. ಆದಕಾರಣ, ಮೂಲ ಶೇರ ಖಾತೆ ನಂ:- <strong>{shareNo}</strong> ಇದನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ಹೊಸ ಶೇರ ಖಾತೆ ನಂ:- <strong>{shareNo}</strong> ಇದಕ್ಕೆ ವರ್ಗಾವಣೆ ಮಾಡಿರುವುದರಿಂದ ಧೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾರ್ಖಾನೆಯ ಮುಂಬರುವ ಆಡಳಿತ ಮಂಡಳಿಯ ಸಭೆಯಲ್ಲಿ ಮಂಡಿಸಲು ಶಿಫಾರಸ್ಸು ಮಾಡಲಾಗಿರುತ್ತದೆ.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex justify-around items-end pt-12 pb-4 text-xs font-bold text-black">
          <div className="text-center">
            <div className="w-36 border-t border-black pt-1">ನಿರ್ದೇಶಕರು</div>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black pt-1">ನಿರ್ದೇಶಕರು</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">5</div>
    </div>
  );

    return (
    <>
      {/* Dynamic Screen/Print Style Injector */}
      <style>{`
        @media screen {
          .vargavane-print-portal {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body.vargavane-printing > #root {
            display: none !important;
            visibility: hidden !important;
          }
          body.vargavane-printing .shareholder-record-print-portal,
          body.vargavane-printing .id-card-profile-print-portal,
          body.vargavane-printing .office-note-print-portal,
          body.vargavane-printing .varasa-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
          body.vargavane-printing {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.vargavane-printing > .vargavane-print-portal,
          body.vargavane-printing .vargavane-print-portal {
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
          body.vargavane-printing .vargavane-a4-page {
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 272mm !important;
            height: 272mm !important;
            padding: 16px 20px 20px 20px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          body.vargavane-printing .vargavane-a4-page:last-child {
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Screen Modal Dialog (Exactly like Varasa 12-Page Complete Bundle) */}
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-600/60 flex items-center justify-center text-purple-400 font-bold shadow">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 10-Page Complete Bundle)</span>
                  {isNewSubmission && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Newly Submitted)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ಕಾನೂನುಬದ್ಧ 10 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                title="ಮುದ್ರಿಸಿ (Print Document)"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 10 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
                </span>
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

          {/* Page Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-1.5 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 5 ಪುಟಗಳು (All 5 Pages)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p1')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p1' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 1: ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ – 1
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p2')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p2' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 2: ಟ್ರಾನ್ಸಾಕ್ಷನ್ ವಿವರ (Transfer- 01 Photos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p3')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p3' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 3: ನಾಮಿನಲ್ ಮೆಂಬರ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p4')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p4' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 4: ಕಛೇರಿ ಟಿಪ್ಪಣೆ & ಕಬ್ಬು ಲೇಖಪಾಲರು
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p5')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p5' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 5: ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ
            </button>
          </div>

          {/* Modal Preview Area */}
          <div className="p-4 sm:p-6 bg-slate-950/50 overflow-y-auto flex flex-col items-center gap-6">
            {activeTab === 'all' ? (
              <div className="space-y-6 w-full max-w-[790px]">
                {renderPage1()}
                {renderPage2()}
                {renderPage3()}
                {renderPage4()}
                {renderPage5()}
              </div>
            ) : activeTab === 'p1' ? (
              <div className="w-full max-w-[790px]">{renderPage1()}</div>
            ) : activeTab === 'p2' ? (
              <div className="w-full max-w-[790px]">{renderPage2()}</div>
            ) : activeTab === 'p3' ? (
              <div className="w-full max-w-[790px]">{renderPage3()}</div>
            ) : activeTab === 'p4' ? (
              <div className="w-full max-w-[790px]">{renderPage4()}</div>
            ) : (
              <div className="w-full max-w-[790px]">{renderPage5()}</div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              ವರ್ಗಾವಣೆ ID: <strong className="text-purple-400 font-mono">{transferId}</strong>
              {' • ಶೇರು ನಂ: '}
              <strong className="text-emerald-400 font-mono">#{shareNo}</strong>
              {receiptNo ? ` • ರಶೀದಿ: #${receiptNo}` : ''}
              {' • ವರ್ಗಾವಣೆ ಶುಲ್ಕ: '}
              <strong className="text-amber-400 font-mono">₹{fees}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 10 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
                </span>
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
        <div className="vargavane-print-portal">
          {activeTab === 'all' ? (
            <>
              {renderPage1()}
              {renderPage2()}
              {renderPage3()}
              {renderPage4()}
              {renderPage5()}
            </>
          ) : activeTab === 'p1' ? (
            renderPage1()
          ) : activeTab === 'p2' ? (
            renderPage2()
          ) : activeTab === 'p3' ? (
            renderPage3()
          ) : activeTab === 'p4' ? (
            renderPage4()
          ) : (
            renderPage5()
          )}
        </div>,
        document.body
      )}
    </>
  );
}
