import { getCompanyLogo, useCompanyLogo, useHandshakeLogo } from '../../services/organizationService';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, ChevronRight, Layers, UserCheck, ArrowRightLeft } from 'lucide-react';

// Classic Cooperative Handshake Icon (Two Clasped Hands with Suit Sleeves)
export function CooperativeHandshakeIcon({ className = "w-20 h-12" }) {
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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p14'
  const logoSrc = useCompanyLogo();

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
    <div className="border-[2px] border-black mb-2.5">
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
        <div>ಜಿಲ್ಲಾ|| ವಿಜಯಪುರ</div>
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
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        {/* Top Header Row with Transfer Badge */}
        <div className="flex justify-between items-center mb-1">
          <div className="bg-yellow-400 border border-green-700 px-3 py-0.5 text-xs font-bold text-black shadow-sm">
            Transfer- 01
          </div>
          <div className="text-xs font-bold">
            ದಿನಾಂಕ: {receiptDate || applicationDate}
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
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        {/* Double Border Heading Box */}
        <div className="border-[2px] border-black p-1 text-center my-2">
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
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        {/* Top Date */}
        <div className="flex justify-end text-xs font-bold text-black mb-2">
          <div>ದಿನಾಂಕ: {applicationDate}</div>
        </div>

        {/* Double Box Header */}
        <div className="border-[2px] border-black p-1 text-center my-2">
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
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="flex justify-end text-xs font-bold text-black mb-1">
          <div>ದಿನಾಂಕ : {applicationDate}</div>
        </div>

        {/* Top Header Box */}
        <div className="border-[2px] border-amber-600 rounded-lg p-1 bg-amber-500/15 text-center text-sm font-bold my-1.5">
          -:: ಕಾರ್ಖಾನೆಯ ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ ::-
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

  // =========================================================================
  // PAGE 6: ID Card & Dual Specimen Signatures (Cane Development Officer Endorsement)
  // =========================================================================
  const renderPage6 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Top Header Row with Highlight Badges */}
        <div className="flex justify-between items-center mb-2">
          <div className="border border-black bg-lime-300 px-3 py-0.5 text-xs font-bold font-mono text-black">
            From ID No: {transferorAadhaar || shareNo}
          </div>
          <div className="border border-black bg-lime-300 px-3 py-0.5 text-xs font-bold font-mono text-black">
            Transfer - {transferId}
          </div>
        </div>

        {/* Top Grid: Account No, Signatures and Photo */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="text-xs font-bold">
              ಕಾರ್ಖಾನೆಯ “<strong>{cleanCategory}</strong>” / “ಡ” ವರ್ಗದ ಶೇರು ಸದಸ್ಯರ ಖಾತೆ ನಂ: <span className="font-mono underline underline-offset-4 font-bold text-sm">#{shareNo}</span>
            </div>

            {/* Specimen Signature 1 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold whitespace-nowrap">ಸದಸ್ಯರ ಮಾದರಿ ಸಹಿ 1)</span>
              <div className="border-[1.5px] border-black rounded-sm h-16 w-72 bg-white flex items-end justify-center pb-1 text-[10px] text-slate-400">
                (ಮಾದರಿ ಸಹಿ - 1)
              </div>
            </div>

            {/* Specimen Signature 2 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold whitespace-nowrap pl-14">2)</span>
              <div className="border-[1.5px] border-black rounded-sm h-16 w-72 bg-white flex items-end justify-center pb-1 text-[10px] text-slate-400">
                (ಮಾದರಿ ಸಹಿ - 2)
              </div>
            </div>
          </div>

          {/* Right: Transferee Photo Frame */}
          <div className="border-[2px] border-black rounded-2xl w-32 h-40 flex flex-col items-center justify-center overflow-hidden bg-slate-50 text-center p-1 shadow-sm shrink-0">
            {transfereePhoto ? (
              <img src={transfereePhoto} alt="Transferee" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                <div className="w-10 h-10 rounded-full border border-dashed border-slate-400 flex items-center justify-center mb-1 text-slate-500 font-bold">
                  Photo
                </div>
                <span className="text-[9.5px] font-bold text-slate-600 leading-tight">
                  ಭಾವಚಿತ್ರ ಅಂಟಿಸಿ<br />(Passport Photo)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resolution & Certificate Issue Endorsement */}
        <div className="text-[12px] leading-[1.85] text-justify text-black mt-6 px-1">
          <p className="indent-6">
            ಶ್ರೀ <strong className="underline underline-offset-2">{transfereeName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transfereePlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transfereeDistrict}</strong> ಇವರ ಅರ್ಜಿ ಮೇಲಿರುವ ಸಹಿ ಹಾಗೂ ಮಾದರಿಯ ಸಹಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ದಿನಾಂಕ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptDate || applicationDate}</span> ರಂದು ಜರುಗಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptNo || '816'}</span> ರನ್ವಯ ಸದರಿಯವರ ನಾಮಿನಲ್ ಸದಸ್ಯತ್ವಕ್ಕೆ ಅನುಮತಿಸಿದ್ದು, ಹಾಗೂ ದಿನಾಂಕ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptDate || applicationDate}</span> ರಂದು ಜರುಗಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptNo || '816'}</span> ರ ಪ್ರಕಾರ ವರ್ಗಾವಣೆ ಮಾಡಲು ನಿರ್ಣಯಿಸಿದ್ದರನ್ವಯ, ಸದರಿಯವರಿಗೆ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್(Certificate) ಹಾಗೂ ಗುರುತಿನ ಕಾರ್ಡ(ID card) ವಿತರಿಸಲಾಗಿದೆ.
          </p>
        </div>

        {/* Bottom Signatures */}
        <div className="flex justify-between items-end pt-16 px-2 text-xs font-bold text-black">
          <div>
            ದಿನಾಂಕ: <span className="font-mono">{receiptDate || applicationDate}</span>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-black pt-1">ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">6</div>
    </div>
  );

  // =========================================================================
  // PAGE 7: No Dues Request Letter to Managing Director & Cane Accountant Clearance
  // =========================================================================
  const renderPage7 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Recipient Header */}
        <div className="text-xs leading-relaxed font-bold mb-3">
          <div>ಗೆ,</div>
          <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
          <div>ಮರಗೂರ, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ</div>
        </div>

        {/* Subject */}
        <div className="text-xs font-bold mb-2">ಮಾನ್ಯರೇ,</div>
        <div className="text-xs font-bold text-center my-3 underline decoration-black underline-offset-4 tracking-wide">
          ವಿಷಯ:- “ನನ್ನ ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಬಾಕಿ ಇದ್ದ ಬಗ್ಗೆ ವಿವರ ನೀಡುವ ಕುರಿತು.”
        </div>

        {/* Body Paragraphs */}
        <div className="text-[12px] leading-[1.85] text-justify space-y-3 mb-6">
          <p className="indent-6">
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು ಶ್ರೀ <strong className="underline underline-offset-2">{transferorName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transferorPlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transferorDistrict}</strong> ಈ ಮೂಲಕ ತಮ್ಮಲ್ಲಿ ವಿನಂತಿಸಿಕೊಳ್ಳುವುದೇನೆಂದರೆ-
          </p>
          <p className="indent-6">
            ನಾನು ತಮ್ಮ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong className="font-mono font-bold underline underline-offset-2">#{shareNo}</strong> ಇರುತ್ತದೆ. ಈಗ ನನ್ನ ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ಸದರ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಯಾವುದೇ ಒತ್ತಾಯವಿಲ್ಲದೇ ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡಲು ಅರ್ಜಿ ಸಲ್ಲಿಸಿರುತ್ತೇನೆ.
          </p>
          <p className="indent-6">
            ಕಾರಣ, ತಮ್ಮ ಸಂಸ್ಥೆ ಹಾಗು ಇತರೇ ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ನನ್ನಿಂದ ಯಾವುದೇ ತರಹದ ಬಾಕಿ ಇದ್ದ ಬಗ್ಗೆ ವಿವರ ನೀಡಬೇಕೆಂದು ಮೆ:ರವರಲ್ಲಿ ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
          </p>
        </div>

        {/* Closing & Signature */}
        <div className="flex justify-between items-start text-xs pt-2 mb-6">
          <div>ವಂದನೆಗಳೊಂದಿಗೆ,</div>
          <div className="text-center font-bold space-y-6">
            <div>ತಮ್ಮ ವಿಶ್ವಾಸಿ,</div>
            <div>
              ( <span className="underline underline-offset-2">{transferorName}</span> )<br />
              <span className="text-[11px] font-normal">ಮೂಲ ಶೇರುದಾರರ ಸಹಿ</span>
            </div>
          </div>
        </div>

        {/* Dotted Divider */}
        <div className="border-t border-dashed border-black my-4"></div>

        {/* Section 1: Cane Accountant Dues Report */}
        <div className="space-y-4 pt-1">
          <div className="text-xs font-bold">1) ಕಬ್ಬು ಲೇಖಪಾಲರ ವರದಿ :</div>
          <div className="text-xs leading-loose pl-4">
            ಸದರಿಯವರಿಂದ ಬಾಕಿ ರೂ. <strong className="font-mono underline underline-offset-4 px-3">0.00 (ಬಾಕಿ ಇರುವುದಿಲ್ಲ - Nil)</strong> ಗಳಷ್ಟು ಇರುತ್ತದೆ / ಇರುವುದಿಲ್ಲ.
          </div>
          <div className="flex justify-end pt-8 text-xs font-bold">
            <div className="text-center w-36 border-t border-black pt-1">ಕಬ್ಬು ಲೇಖಪಾಲರು</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">7</div>
    </div>
  );

  // =========================================================================
  // PAGE 8: Member Identity Card Application Form & Govt ID Checklist
  // =========================================================================
  const renderPage8 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Title Box */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-1.5 shadow-sm">
          <div className="border border-black py-1 px-4 font-bold text-xs tracking-wide text-black inline-block">
            -:: ಸದಸ್ಯರು ಗುರುತಿನ ಚೀಟಿ ಪಡೆಯಲು ತುಂಬುವ ಅರ್ಜಿ ನಮೂನೆ ::-
          </div>
        </div>

        {/* Member Details Table */}
        <table className="w-full border-[1.5px] border-black text-[11px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-8 p-1.5 border-r border-black font-bold text-center">1</td>
              <td className="w-44 p-1.5 border-r border-black font-bold">ಸದಸ್ಯತ್ವ ‘{cleanCategory}’ ವರ್ಗ</td>
              <td className="p-1.5 font-bold font-mono">ಶೇರು ಖಾತೆ ನಂ: #{shareNo}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center">2</td>
              <td className="p-1.5 border-r border-black font-bold">ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು :</td>
              <td className="p-1.5 font-bold">ಶ್ರೀ/ಶ್ರೀಮತಿ {transfereeName}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center align-top">3</td>
              <td className="p-1.5 border-r border-black font-bold align-top">ಖಾಯಂ ವಿಳಾಸ :</td>
              <td className="p-1.5 space-y-1">
                <div className="flex justify-between">
                  <span>ಮುಕ್ಕಾಂ :- <strong>{transfereePlace}</strong></span>
                  <span>ಪೋಷ್ಟ :- <strong>{transfereePlace}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>ತಾಲೂಕು :- <strong>{transfereeTaluk}</strong></span>
                  <span>ತಾಲೂಕು :- <strong>{transfereeTaluk}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>ಜಿಲ್ಲೆ :- <strong>{transfereeDistrict}</strong></span>
                  <span>ಜಿಲ್ಲೆ :- <strong>{transfereeDistrict}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>ಮೊಬೈಲ್ ನಂಬರ:- <strong className="font-mono">{transfereeMobile || '—'}</strong></span>
                  <span>ಮೊಬೈಲ್ ನಂಬರ:- <strong className="font-mono">{transfereeMobile || '—'}</strong></span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center">4</td>
              <td className="p-1.5 border-r border-black font-bold">ಲಿಂಗ :</td>
              <td className="p-1.5 flex justify-between items-center">
                <span><strong>ಗಂಡು</strong> / ಹೆಣ್ಣು</span>
                <span>ಜನ್ಮ ದಿನಾಂಕ : <span className="font-mono">___/___/____</span></span>
                <span>ವಯಸ್ಸು : <span className="font-mono">____</span></span>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center">5</td>
              <td className="p-1.5 border-r border-black font-bold">ಗುರುತಿನ ಚೀಟಿ ಮಾಡಲು ಕಾರಣ:</td>
              <td className="p-1.5 font-bold">ಶೇರ ವರ್ಗಾವಣೆ ಇರುವದು.</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-black font-bold text-center">6</td>
              <td className="p-1.5 border-r border-black font-bold">ಮೂಲ ಶೇರ ಸರ್ಟಿಫಿಕೇಟ ಪ್ರತಿ:</td>
              <td className="p-1.5">ಮೂಲ ಶೇರ ಸರ್ಟಿಫಿಕೇಟ ಝರಾಕ್ಸ್ ಪ್ರತಿ ಕಡ್ಡಾಯವಾಗಿ ಲಗತ್ತಿಸುವದು.</td>
            </tr>
          </tbody>
        </table>

        {/* Documents Subtitle */}
        <div className="text-[11px] font-bold text-center my-1.5 leading-snug">
          ಸದಸ್ಯರು ತಮ್ಮ ಹೆಸರಿನ ಹಾಗು ವಿಳಾಸಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಫೋಟೋ ಸಹಿತ ಇರುವ ಈ ಕೆಳಕಾಣಿಸಿದ ಸರ್ಕಾರಿ ಗುರುತಿನ ದಾಖಲೆಗಳ ಪೈಕಿ ಒಂದನ್ನಾದರೂ ಪೂರೈಸತಕ್ಕದ್ದು.
        </div>

        {/* Govt ID Documents Table */}
        <table className="w-full border-[1.5px] border-black text-[10px] text-center mb-2 font-sans">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100">
              <th className="p-1 border-r border-black w-10">ಅ. ನಂ.</th>
              <th className="p-1 border-r border-black">ಲಗತ್ತಿಸುವ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳ ವಿವರ</th>
              <th className="p-1 border-r border-black w-28">ಕಾರ್ಡ ಸಂಖ್ಯೆ</th>
              <th className="p-1 border-r border-black">ದಾಖಲೆ ವಿತರಿಸಿದ ಅಧಿಕಾರಿ ವಿವರ</th>
              <th className="p-1 w-24">ಮತಕ್ಷೇತ್ರದ ಸ್ಥಳ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">1)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಚುನಾವಣಾಧಿಕಾರಿಗಳ ಗುರುತಿನ ಚೀಟಿ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Electrol Registration Officer</td>
              <td className="p-1">{transfereeTaluk}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">2)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಆಧಾರ್ ಕಾರ್ಡ</td>
              <td className="p-1 border-r border-black font-mono font-bold">{transfereeAadhaar || '—'}</td>
              <td className="p-1 border-r border-black">Govt. of Inida</td>
              <td className="p-1">Govt. of Inida</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">3)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಪಡಿತರ ಚೀಟಿ (ರೇಶನ್ ಕಾರ್ಡ)</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Food & Civil Supplies Dept.</td>
              <td className="p-1">{transfereeTaluk}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">4)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆಯ ಪ್ಯಾನ್ ಕಾರ್ಡ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Income Tax Department</td>
              <td className="p-1">—</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">5)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಪಾಸ್‌ಪೋರ್ಟ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Ministry of External Affairs</td>
              <td className="p-1">—</td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-bold">6)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ವಾಹನ ಚಾಲನಾ ಪರವಾನಿಗೆ ಪತ್ರ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">RTO Office</td>
              <td className="p-1">{transfereeDistrict}</td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div className="text-[11px] font-bold my-1.5 text-center">
          ಮೇಲ್ಕಾಣಿಸಿದ ಮಾಹಿತಿಗಳು ಹಾಗು ದಾಖಲೆಗಳು ಸತ್ಯ ಮತ್ತು ನೈಜವಾಗಿವೆ ಎಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
        </div>

        {/* Footer Line */}
        <div className="flex justify-between items-end text-xs pt-3 pb-2 font-bold">
          <div>
            <div>ಸ್ಥಳ :- {transfereePlace}</div>
            <div>ದಿನಾಂಕ: {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black pt-1">ಸದಸ್ಯರ ಸಹಿ</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-[9.5px] space-y-0.5 border-t border-black pt-1 leading-snug">
          <div><strong>ಸೂಚನೆ:-</strong> 1) ಹೆಸರು ಮತ್ತು ವಿಳಾಸದ ಸಮಂಜಸ ದಾಖಲೆಗಳ ಝರಾಕ್ಸ್ ಪ್ರತಿಗಳನ್ನು ಹಾಜರಪಡಿಸಬೇಕು.</div>
          <div>2) ಸದಸ್ಯರು ಹೆಬ್ಬೆಟ್ಟಿನ ಸಹಿ ಇದ್ದವರಿಗೆ ಕಾರ್ಖಾನೆಯ ಒಬ್ಬ ಸದಸ್ಯರಿಂದ ದೃಢೀಕರಣ ಪಡೆಯತಕ್ಕದ್ದು, ಅವರ ಹೆಸರು ಖಾತೆ ನಮೂದಿಸತಕ್ಕದ್ದು.</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">8</div>
    </div>
  );

  // =========================================================================
  // PAGE 9: Office Order to Field Assistant for Spot Inquiry (ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಆದೇಶ)
  // =========================================================================
  const renderPage9 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Reference Number & Date Row */}
        <div className="flex justify-between items-center text-[11px] font-bold mb-3">
          <span>
            ನಂ:ಸಂ.ದಿ.ಸ.ಕ.ನಿ/ಶೇರು ವರ್ಗಾವಣೆ/ಕುಟುಂಬ ಸದಸ್ಯರ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ/ <strong className="font-mono">{receiptNo || '816'}</strong> /2020-21
          </span>
          <span>
            ದಿನಾಂಕ:- <strong className="font-mono">{receiptDate || applicationDate}</strong>
          </span>
        </div>

        {/* Box Title */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-2 shadow-sm">
          <div className="border border-black py-1 px-8 font-bold text-xs tracking-wide text-black inline-block">
            -:: ಕಛೇರಿ ಟಿಪ್ಪಣೆ ::-
          </div>
        </div>

        {/* Body Paragraph 1 */}
        <div className="text-[12px] leading-[1.85] text-justify space-y-4 mb-8">
          <p className="indent-6">
            ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ಶ್ರೀ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು <strong>{noOfShares}</strong> ಮೂಲ ಶೇರನ್ನು ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong className="font-mono">#{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ತಮ್ಮ ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ತಮ್ಮ ಶೇರನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿ, ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಖಾಯಂ ರಹವಾಸಿಯಾದ ಹಾಗು ಕಬ್ಬು ಬೆಳೆಗಾರರಾದ <strong>ಶ್ರೀ {transfereeName}</strong> ಸಾ: <strong>{transfereePlace}</strong> ತಾಲೂಕ: <strong>{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transfereeDistrict}</strong> ಇವರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ತಮ್ಮ ಅರ್ಜಿ ದಿನಾಂಕ: <strong className="font-mono">{applicationDate}</strong> ರನ್ವಯ ವಿನಂತಿಸಿಕೊಂಡಿರುತ್ತಾರೆ.
          </p>
          <p className="indent-6">
            ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು(ಕೊಡುವವರು) <strong>ಶ್ರೀ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು ಸಲ್ಲಿಸಿದ ಅರ್ಜಿ ಹಾಗು ಕಾಗದ ಪತ್ರಗಳೊಂದಿಗೆ ಸ್ವಗ್ರಾಮಕ್ಕೆ ಖುದ್ದಾಗಿ ಹೋಗಿ ಕೂಲಂಕೋಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಶೇರು ವರ್ಗಾವಣೆಗೆ(ಮಾರಾಟ) ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಸಂಪೂರ್ಣ ಒಪ್ಪಿಗೆ ಇರುವ ಬಗ್ಗೆ ಸಹಿ ಹಾಗು ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ) ಪಡೆದುಕೊಂಡು ಸಾಕ್ಷಿದಾರರ ಸಮಕ್ಷಮ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಮಾಡಿ, ತಮ್ಮ ವರದಿಯನ್ನು ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ ರವರ ಶರಾಡೊಂದಿಗೆ ಶೇರ ವಿಭಾಗಕ್ಕೆ ಪೂರೈಸಲು ಈ ಮೂಲಕ ಆದೇಶಿಸಲಾಗಿದೆ.
          </p>
        </div>

        {/* MD Signature */}
        <div className="flex justify-end pt-6 mb-8 text-xs font-bold">
          <div className="text-center w-40 border-t border-black pt-1">
            ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು
          </div>
        </div>

        {/* Field Assistant Dispatch Block */}
        <div className="text-xs leading-relaxed font-bold border-t border-slate-300 pt-3">
          <div>ಗೆ,</div>
          <div>ಶ್ರೀ ___________________________</div>
          <div>ಕ್ಷೇತ್ರ ಸಹಾಯಕರು</div>
          <div>___________________________ ಗ್ರಾಮಗಳು</div>
          <div className="pt-1 font-semibold text-[11px] text-slate-700">
            ತಮ್ಮ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿಯೊಂದಿಗೆ ಸಲ್ಲಿಸುವದು.
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">9</div>
    </div>
  );

  // =========================================================================
  // PAGE 10: SCHEDULE-‘A’ Form of Agreement by Producer Member
  // =========================================================================
  const renderPage10 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-serif box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Schedule Box Title */}
        <div className="border-[2px] border-black p-0.5 text-center bg-white my-2 w-max mx-auto shadow-sm">
          <div className="border border-black py-1 px-8 font-bold text-sm tracking-wider text-black">
            SCHEDULE-‘A’
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center font-bold text-[11px] leading-snug px-4 mb-3 font-sans">
          Form of agreement to be executed by a producer member of Co-operative sugar Factory for retention and non alienation and charging of lands owned by him in the area of operation of the factory.
        </div>

        {/* Opening Agreement Paragraphs */}
        <div className="text-[10.5px] leading-[1.65] text-justify space-y-2 mb-3 font-sans">
          <p className="indent-6">
            And agreement made on this <strong className="underline underline-offset-2">{receiptDate || applicationDate}</strong> day between Shri/ Smt:- <strong className="underline underline-offset-2">{transfereeName}</strong> At:- <strong className="underline underline-offset-2">{transfereePlace}</strong> (here in after called the producer member which expression shall be deemed to include his/ her executors and assings) of the one part and The Bhimashankar Sahakari Sakkare Karkhane Niyamit, Maragur Taluk Chadachan Dist:- Vijayapur a Co-operative Society registered under section 7(1) of the Karnataka Co-operative Societies Act 1959 & having its Registered office at Maragur Taluk Chadachan Dist:- Vijayapur (herein after called the factory with expression shall include its assigns) on the other part.
          </p>
          <p className="indent-6">
            Where as the producer member is the owner of the land described in the schedule here to attached where as he/she is a member of the factory & the factory has allotted him/her <strong className="underline underline-offset-2">{noOfShares}</strong> ‘{cleanCategory}’ Class shares of the face value of Rs.2000/- each and where as the said producer member has agreed to be governed by the bye-laws of the factory.
          </p>
        </div>

        {/* Numbered Terms and Conditions */}
        <div className="text-[10px] leading-[1.6] space-y-1.5 mb-3 font-sans">
          <div className="font-bold">Now this agreement witness the are follows :-</div>
          <p>
            <strong>1.</strong> The producer member shall & will during the subsistence of this agreement at his own cost charges & expenses keep and maintain the said land in cultivable condition and shall supply sugar cane grown by him/ her to the factory in the manner prescribed in the bye-law No.6(A)
          </p>
          <p>
            <strong>2.</strong> That the producer member during the subsistence of this agreement shall and will retain his/ her own name & tital shall & will not alienate or create any charge or interest in the said lands specified below except such charges or interest in favour of any Co-operative society or of Government which he/ she may have created thereafter for securing finances for purpose of cultivation or improvements of the said land Neither shall be / she alienate the said lands in any other manner.
          </p>
          <p>
            <strong>3.</strong> That the provided for in the Bye laws of the factory the producer member in the even of his/ her committing any breach in due observance of this agreement at any time during the subsistence of this agreement will be liable to.
          </p>
          <div className="pl-4 space-y-0.5">
            <div><strong>a)</strong> Immediate cessation of all his/ her rights an previleges as the member including more specifically the rights or previlege of tendering to the factory sugar cane grown by him/ her.</div>
            <div><strong>b)</strong> Forfeiture of share held by him/ her in the society.</div>
            <div><strong>c)</strong> Expulsion from membership of the society and</div>
            <div><strong>d)</strong> Payment of penalty as may be decided by the Board.</div>
          </div>
        </div>

        {/* Execution Witness Block */}
        <div className="text-[10px] leading-relaxed text-justify mb-4 font-sans">
          In Witness where of the producer member has set his/ her hand and the common seal of the factory has been here to affixed and two members of the Board of Directors and the Managing Director of the factory have herewith set hands on the date aforementioned.
        </div>

        {/* Execution Signatures */}
        <div className="flex justify-between items-end pt-4 text-xs font-bold font-sans">
          <div className="text-center w-36 border-t border-black pt-1">Board of Directors</div>
          <div className="text-center w-40 border-t border-black pt-1">Managing Director</div>
          <div className="text-center w-40 border-t border-black pt-1">Producer Member Signature</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">10</div>
    </div>
  );

  // =========================================================================
  // PAGE 11: ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು (ಶೇರು ಮಾರಾಟಗಾರರ ಅಧಿಕೃತ ಅರ್ಜಿ)
  // =========================================================================
  const renderPage11 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Top Header Row with Photo Frame */}
        <div className="flex justify-between items-start mb-2">
          {/* Title Box */}
          <div className="flex-1 text-center pr-2">
            <div className="border-[2px] border-black p-0.5 text-center bg-white my-1 inline-block shadow-sm">
              <div className="border border-black py-0.5 px-6 font-bold text-sm tracking-wide text-black leading-tight">
                <div>ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು</div>
                <div className="text-xs font-semibold">ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ವರ್ಗಾವಣೆ ಮಾಡುವ ಅರ್ಜಿ</div>
              </div>
            </div>
          </div>

          {/* Transferor Photo Frame */}
          <div className="border-[1.5px] border-black w-24 h-30 flex flex-col items-center justify-center p-1 text-center bg-slate-50 shrink-0">
            {transferorPhoto ? (
              <img src={transferorPhoto} alt="Transferor" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-[10px] font-bold text-slate-600 leading-tight">
                ಶೇರು ಮಾರಾಟಗಾರರ<br />ಫೋಟೋ ಅಂಟಿಸುವುದು
              </div>
            )}
          </div>
        </div>

        {/* Recipient & Mobile */}
        <div className="flex justify-between items-end text-xs font-bold mb-2">
          <div className="leading-relaxed">
            <div>ಗೆ,</div>
            <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
            <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
            <div>ಮರಗೂರ, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ</div>
          </div>
          <div className="font-mono">
            ಮೊಬೈಲ್ ನಂ: <span className="font-bold underline underline-offset-2">{transferorMobile || '____________________'}</span>
          </div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="text-xs font-bold pl-6 mb-1.5">
          ವಿಷಯ : - “{cleanCategory}” ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ವರ್ಗಾವಣೆ ಮಾಡುವ ಕುರಿತು.
        </div>
        <div className="text-xs leading-relaxed pl-6 mb-2">
          ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು ಶ್ರೀ/ಶ್ರೀಮತಿ <strong className="underline underline-offset-2">{transferorName}</strong><br />
          ಸಾ|| <strong className="underline underline-offset-2">{transferorPlace}</strong> ತಾ|| <strong className="underline underline-offset-2">{transferorTaluk}</strong> ಜಿ|| <strong className="underline underline-offset-2">{transferorDistrict}</strong> ಈ ಮೂಲಕ ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಬರೆದುಕೊಡುವ ವಿನಂತಿ ಅರ್ಜಿ ಏನೆಂದರೆ –
        </div>
        <div className="text-xs font-bold pl-6 mb-2">
          ತಮ್ಮ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ನಾನು “{cleanCategory}” ವರ್ಗದ ಶೇರು ಹೊಂದಿದ್ದು, ಶೇರು ವಿವರ ಈ ಕೆಳಗಿನಂತಿರುತ್ತದೆ.
        </div>

        {/* Transferor Share Table */}
        <table className="w-full border-[1.5px] border-black text-[11px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂಬರ : <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1.5 border-r border-black font-semibold">ಮೂಲ ಶೇರು ಸಂಖ್ಯೆ : <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1.5 font-semibold">ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-black font-semibold">ಶೇರು ಕ್ರಮಾಂಕ : <span className="font-mono">—</span></td>
              <td className="p-1.5 border-r border-black font-semibold" colSpan={2}>ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ನಂಬರ : <span className="font-mono">—</span></td>
            </tr>
          </tbody>
        </table>

        {/* Body Paragraph */}
        <p className="text-[11px] leading-[1.7] text-justify indent-6 mb-2">
          ಮೇಲ್ಕಂಡ ಕಾರ್ಖಾನೆಯ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ನನ್ನ ಕೌಟುಂಬಿಕ (ಪ್ರಪಂಚದ) ಅಡಚಣೆ ಸಲುವಾಗಿ, ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿದ್ದು, ಈ ವಿಷಯವನ್ನು ಕುಟುಂಬದ ಸದಸ್ಯರ ಗಮನಕ್ಕೆ ತಂದು ಎಲ್ಲರೂ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿದ್ದರಿಂದ, ಈ ಕೆಳಕಾಣಿಸಿದ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಕಬ್ಬು ಬೆಳೆಗಾರ ರೈತರಿಗೆ ನನ್ನ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಪ್ರಾರ್ಥಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* Transferee Section Heading */}
        <div className="text-xs font-bold text-center my-1 underline underline-offset-2">
          ಶೇರು ತೆಗೆದುಕೊಳ್ಳುವವರ ವಿವರ
        </div>

        {/* Transferee Table */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-2 font-sans">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-center">
              <th className="p-1 border-r border-black w-10">ಅ.ನಂ.</th>
              <th className="p-1 border-r border-black w-36">ವಿವರಣೆ</th>
              <th className="p-1 text-center">ಮಾಹಿತಿ ವಿವರಗಳು</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">1</td>
              <td className="p-1 border-r border-black font-semibold">ಕಬ್ಬು ಬೆಳೆಗಾರರ ಪೂರ್ಣ ಹೆಸರು</td>
              <td className="p-1 font-bold">ಶ್ರೀ/ಶ್ರೀಮತಿ : {transfereeName}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">2</td>
              <td className="p-1 border-r border-black font-semibold">ಖಾಯಂ ವಿಳಾಸ</td>
              <td className="p-1">ಗ್ರಾಮ: <strong>{transfereePlace}</strong> | ತಾಲೂಕ : <strong>{transfereeTaluk}</strong> | ಜಿಲ್ಲೆ: <strong>{transfereeDistrict}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1 border-r border-black font-semibold">ಆಧಾರ ನಂಬರ</td>
              <td className="p-1 font-mono"><strong>{transfereeAadhaar || '—'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; ಮೊಬೈಲ್ ನಂಬರ: <strong>{transfereeMobile || '—'}</strong></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold align-top">4</td>
              <td className="p-1 border-r border-black font-semibold align-top">ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನು ಕ್ಷೇತ್ರದ ವಿವರ</td>
              <td className="p-1 space-y-1">
                <div className="flex justify-between">
                  <span>ಸರ್ವೇ ನಂಬರ : <strong>—</strong></span>
                  <span>ಹಿಸ್ಸಾ: <strong>—</strong></span>
                  <span>ಹೋಬಳಿ : <strong>{transfereeTaluk}</strong></span>
                  <span>ಗ್ರಾಮ : <strong>{transfereePlace}</strong></span>
                  <span>ಕ್ಷೇತ್ರ : <strong>—</strong></span>
                </div>
                <div className="border-t border-slate-300 pt-0.5">
                  ಜಮೀನಿಗೆ ನೀರಾವರಿ ಮೂಲ ವಿವರ : <strong>ಕೊಳವೆ ಬಾವಿ / ಬಾವಿ / ಕೆನಾಲ್ / ನದಿ ನೀರು</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <p className="text-[10px] leading-relaxed text-justify mb-2">
          ಕಾರ್ಖಾನೆಯ ಕಾಲಕಾಲಕ್ಕೆ ನೀಡುವ ಸೂಚನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು, ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 23ರನ್ವಯ ಮತ್ತು ಕಾರ್ಖಾನೆಯ ಉಪ ನಿಯಮ 19(7)ರ ಪ್ರಕಾರ ನನ್ನ ಶೇರು ಸದಸ್ಯತ್ವ ಕಡಿಮೆ ಮಾಡಿ ಮೇಲ್ಕಾಣಿಸಿದ ಖರೀದಿದಾರರಿಗೆ ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* Signatures */}
        <div className="flex justify-between items-end text-xs font-bold pt-1 mb-2">
          <div>
            <div>ಸ್ಥಳ : {transferorPlace}</div>
            <div>ದಿನಾಂಕ : {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-black pt-1">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸಹಿ</div>
          </div>
        </div>

        {/* Attachments List */}
        <div className="text-[9.5px] border-t border-black pt-1 space-y-0.5 leading-snug">
          <div><strong>ಲಗತ್ತಿಸುವ ದಾಖಲೆಗಳು:</strong></div>
          <div>1. ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಾಗೂ ಗುರುತಿನ ಪತ್ರದ ನಕಲು ಪ್ರತಿ</div>
          <div>2. ಶೇರು ಕೊಡುವವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಹಾಗೂ ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ, ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ</div>
          <div>3. ಶೇರು ಕೊಡುವವರ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರ, ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆಯ ಪತ್ರ</div>
          <div>4. ರಹವಾಸಿ ಪತ್ರ:- ಆಧಾರ ಕಾರ್ಡ ಝರಾಕ್ಸ್ ಪ್ರತಿಗೆ ಅಟೆಸ್ಟೆಡ್ ಮಾಡಿಸಿ ಲಗತ್ತಿಸುವದು.</div>
          <div className="pt-0.5"><strong>ಸೂಚನೆ: -</strong> ಶೇರು ವರ್ಗಾವಣೆಗಾಗಿ ಕಾರ್ಖಾನೆಯಿಂದ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಸದಸ್ಯತ್ವಕ್ಕೆ ಅನುಮತಿ ಪಡೆದ ನಂತರ, ನಿಯಮಾನುಸಾರ</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-1">11</div>
    </div>
  );

  // =========================================================================
  // PAGE 12: ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು (ಖರೀದಿದಾರರ ಅಧಿಕೃತ ಅರ್ಜಿ)
  // =========================================================================
  const renderPage12 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Top Header Row with Photo Frame */}
        <div className="flex justify-between items-start mb-2">
          {/* Title Box */}
          <div className="flex-1 text-center pr-2">
            <div className="border-[2px] border-black p-0.5 text-center bg-white my-1 inline-block shadow-sm">
              <div className="border border-black py-0.5 px-6 font-bold text-sm tracking-wide text-black leading-tight">
                <div>ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು</div>
                <div className="text-xs font-semibold">ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಮಾಡಿಕೊಳ್ಳುವ ಅರ್ಜಿ</div>
              </div>
            </div>
          </div>

          {/* Transferee Photo Frame */}
          <div className="border-[1.5px] border-black w-24 h-30 flex flex-col items-center justify-center p-1 text-center bg-slate-50 shrink-0">
            {transfereePhoto ? (
              <img src={transfereePhoto} alt="Transferee" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-[10px] font-bold text-slate-600 leading-tight">
                ಶೇರು ಖರೀದಿಸುವವರ<br />ಫೋಟೋ ಅಂಟಿಸುವುದು
              </div>
            )}
          </div>
        </div>

        {/* Recipient & Mobile */}
        <div className="flex justify-between items-end text-xs font-bold mb-2">
          <div className="leading-relaxed">
            <div>ಗೆ,</div>
            <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
            <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
            <div>ಮರಗೂರ, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ</div>
          </div>
          <div className="font-mono">
            ಮೊಬೈಲ್ ನಂ: <span className="font-bold underline underline-offset-2">{transfereeMobile || '____________________'}</span>
          </div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="text-xs font-bold pl-6 mb-1.5">
          ವಿಷಯ : - “{cleanCategory}” ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವ ಕುರಿತು.
        </div>
        <div className="text-xs leading-relaxed pl-6 mb-2">
          ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು ಶ್ರೀ/ಶ್ರೀಮತಿ <strong className="underline underline-offset-2">{transfereeName}</strong><br />
          ಸಾ|| <strong className="underline underline-offset-2">{transfereePlace}</strong> ತಾ|| <strong className="underline underline-offset-2">{transfereeTaluk}</strong> ಜಿ|| <strong className="underline underline-offset-2">{transfereeDistrict}</strong> ಈ ಮೂಲಕ ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಬರೆದುಕೊಡುವ ವಿನಂತಿ ಅರ್ಜಿ ಏನೆಂದರೆ – ನಾನು ತಮ್ಮ ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬರುವ ಈ ಕೆಳಕಾಣಿಸಿದ ಗ್ರಾಮದಲ್ಲಿ ಕಬ್ಬು ಬೆಳೆಯುವ ನೀರಾವರಿ ಕ್ಷೇತ್ರದ ಜಮೀನು ಹೊಂದಿದ್ದು, ಹಾಗು ಖಾಯಂ ರಹವಾಸಿಯಾಗಿರುತ್ತೇನೆ.
        </div>

        {/* Land & Nominal Fee Table */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black w-8 text-center font-bold">1</td>
              <td className="p-1 border-r border-black w-24 font-bold">ಗ್ರಾಮ :</td>
              <td className="p-1" colSpan={4}>ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನು ಕ್ಷೇತ್ರದ ವಿವರ | ಗ್ರಾಮ : <strong>{transfereePlace}</strong> | ತಾಲೂಕ: <strong>{transfereeTaluk}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold align-top">2</td>
              <td className="p-1 border-r border-black font-bold align-top">ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನು ಕ್ಷೇತ್ರದ ವಿವರ</td>
              <td className="p-1 space-y-1" colSpan={4}>
                <div className="flex justify-between">
                  <span>ಸರ್ವೇ ನಂಬರ : <strong>—</strong></span>
                  <span>ಹಿಸ್ಸಾ: <strong>—</strong></span>
                  <span>ಹೋಬಳಿ : <strong>{transfereeTaluk}</strong></span>
                  <span>ಗ್ರಾಮ: <strong>{transfereePlace}</strong></span>
                  <span>ಕ್ಷೇತ್ರ : <strong>—</strong></span>
                </div>
                <div className="border-t border-slate-300 pt-0.5">
                  ಜಮೀನಿಗೆ ನೀರಾವರಿ ಮೂಲ ವಿವರ : <strong>ಕೊಳವೆ ಬಾವಿ / ಬಾವಿ / ಕೆನಾಲ್ / ನದಿ ನೀರು</strong>
                </div>
              </td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1 border-r border-black font-bold">ನಾಮಿನಲ್ ಮೆಂಬರ್ ಫೀ</td>
              <td className="p-1" colSpan={4}>ರೂ. 500/- ಭರಣಾ ಮಾಡಿದ ರಶೀದಿ ನಂಬರ್ : <strong className="font-mono">#{receiptNo || '816'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; ದಿನಾಂಕ : <strong className="font-mono">{receiptDate || applicationDate}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* Body Paragraph */}
        <p className="text-[11px] leading-[1.7] text-justify indent-6 mb-2">
          ಮೇಲ್ಕಾಣಿಸಿದ ವಿವರದ ಪ್ರಕಾರ ನಾನು ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಕಬ್ಬು ಬೆಳೆಗಾರನಾಗಿದ್ದು, ಕಾರ್ಖಾನೆಯ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಪಡೆಯಲು ಇಚ್ಛಿಸಿ, ಈ ಕೆಳಕಾಣಿಸಿದ ಕಾರ್ಖಾನೆಯ ಶೇರು ಹೊಂದಿದ ಸದಸ್ಯರು ತಮ್ಮ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರ ಒಪ್ಪಿಗೆ ಪಡೆದುಕೊಂಡು ತಮ್ಮ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ನನಗೆ ವರ್ಗಾವಣೆಗೆ ಮಾಡಲು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ರುಜು ಮಾಡಿ ಒಪ್ಪಿಗೆ ನೀಡಿದ್ದರನ್ವಯ, ಸದರ ಶೇರನ್ನು ನನ್ನ ಹೆಸರಿಗೆ ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ಪ್ರಾರ್ಥಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* From Whom Purchased Table */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black bg-slate-100">
              <td className="p-1 border-r border-black font-bold" colSpan={3}>
                ಶ್ರೀ/ಶ್ರೀಮತಿ : <span className="text-black">{transferorName}</span>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black w-44 font-semibold">ಶೇರು ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ</td>
              <td className="p-1" colSpan={2}>ಗ್ರಾಮ: <strong>{transferorPlace}</strong> | ತಾಲೂಕ : <strong>{transferorTaluk}</strong> | ಜಿಲ್ಲೆ: <strong>{transferorDistrict}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">ಆಧಾರ ನಂಬರ</td>
              <td className="p-1 font-mono" colSpan={2}><strong>{transferorAadhaar || '—'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; ಮೊಬೈಲ್ ನಂಬರ: <strong>{transferorMobile || '—'}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂಬರ : <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1 border-r border-black font-semibold">ಮೂಲ ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
              <td className="p-1 font-semibold">ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಕ್ರಮಾಂಕ : <span className="font-mono">—</span></td>
              <td className="p-1 font-semibold" colSpan={2}>ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ನಂಬರ : <span className="font-mono">—</span></td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <p className="text-[10px] leading-relaxed text-justify mb-2">
          ಕಾರ್ಖಾನೆಯ ಕಾಲಕಾಲಕ್ಕೆ ನೀಡುವ ಸೂಚನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು, ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 23ರನ್ವಯ ಮತ್ತು ಕಾರ್ಖಾನೆಯ ಉಪ ನಿಯಮ 19(7)ರ ಪ್ರಕಾರ ಮೇಲ್ಕಂಡ ಶೇರುದಾರರ ಹೆಸರನ್ನು ಕಡಿಮೆಗೊಳಿಸಿ, ಸದರಿಯವರ ಸದಸ್ಯತ್ವವನ್ನು ನನಗೆ ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* Signatures */}
        <div className="flex justify-between items-end text-xs font-bold pt-1 mb-2">
          <div>
            <div>ಸ್ಥಳ : {transfereePlace}</div>
            <div>ದಿನಾಂಕ : {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-52 border-t border-black pt-1">ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ಸಹಿ</div>
          </div>
        </div>

        {/* Attachments List */}
        <div className="text-[9.5px] border-t border-black pt-1 space-y-0.5 leading-snug">
          <div><strong>ಲಗತ್ತಿಸುವ ದಾಖಲೆಗಳು:</strong></div>
          <div>1. ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಾಗೂ ಗುರುತಿನ ಪತ್ರದ ನಕಲು ಪ್ರತಿ</div>
          <div>2. ಕಾರ್ಖಾನೆಯಲ್ಲಿ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಫೀ ರೂ. 500/- ಭರಣಾ ಮಾಡಿರುವ ರಶೀದಿ ಮೂಲ ಪ್ರತಿ</div>
          <div>3. ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದಲ್ಲಿ ಕನಿಷ್ಠ ಒಂದು ಎಕರೆ ನೀರಾವರಿ ಇರುವ ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನಿನ ಉತಾರೆ ಲಗತ್ತಿಸುವುದು</div>
          <div>4. ರಹವಾಸಿ ಪತ್ರ:- ಆಧಾರ ಕಾರ್ಡ ಝರಾಕ್ಸ್ ಪ್ರತಿಗೆ ಅಟೆಸ್ಟೆಡ್ ಮಾಡಿಸಿ ಲಗತ್ತಿಸುವದು.</div>
          <div className="pt-0.5"><strong>ಸೂಚನೆ: -</strong> ಶೇರು ವರ್ಗಾವಣೆಗಾಗಿ ಕಾರ್ಖಾನೆಯಿಂದ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಸದಸ್ಯತ್ವಕ್ಕೆ ಅನುಮತಿ ಪಡೆದ ನಂತರ, ನಿಯಮಾನುಸಾರ ಕಾರ್ಖಾನೆಯವರು ಸೂಚಿಸುವ ಎಲ್ಲ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಪೂರೈಸುವದು.</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-1">12</div>
    </div>
  );

  // =========================================================================
  // PAGE 13: ಸದಸ್ಯತ್ವ ವರ್ಗಾವಣೆ ಮಾಡುವ ಶೇರುದಾರರ ಕುಟುಂಬದ ಸದಸ್ಯರ ಪೂರ್ಣ ವಿವರ (Consent Table)
  // =========================================================================
  const renderPage13 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Title Box */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-1 shadow-sm">
          <div className="border border-black py-1 px-4 font-bold text-xs tracking-wide text-black inline-block">
            -:: ಸದಸ್ಯತ್ವ ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡುವ ಶೇರುದಾರರ ಕುಟುಂಬದ ಸದಸ್ಯರ ಪೂರ್ಣ ವಿವರ ::-
          </div>
        </div>

        {/* Date Row */}
        <div className="flex justify-end text-xs font-bold mb-2">
          <div>ದಿನಾಂಕ:- <span className="font-mono">{receiptDate || applicationDate}</span></div>
        </div>

        {/* Recipient */}
        <div className="text-xs leading-relaxed font-bold mb-2">
          <div>ಗೆ,</div>
          <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು,</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ,</div>
          <div>ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ</div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="border border-black rounded-lg p-2 my-2 text-center text-xs font-bold bg-slate-50">
          ವಿಷಯ:- “ಕಾರ್ಖಾನೆಯ ಶೇರು ವರ್ಗಾವಣೆಗೆ ಕುಟುಂಬ ಸದಸ್ಯರು ಒಪ್ಪಿಗೆ ನೀಡಿರುವ ಕುರಿತು.”
        </div>

        {/* Declaration */}
        <p className="text-[11.5px] leading-[1.75] text-justify mb-2">
          ನಾನು ಶ್ರೀ <strong className="underline underline-offset-2">{transferorName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transferorPlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transferorDistrict}</strong> ತಮ್ಮ ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ ಇದರಲ್ಲಿ ಈ ಕೆಳಗಿನಂತೆ “{cleanCategory}”/“ಡ” ವರ್ಗದ ಒಂದು ಶೇರನ್ನು ಹೊಂದಿರುತ್ತೇನೆ.
        </p>

        {/* Share Mini Table */}
        <table className="w-full border-[1.5px] border-black text-[11px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂಬರ: <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1 border-r border-black font-semibold">ಮೂಲ ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
              <td className="p-1 font-semibold">NRD ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong>Nil</strong></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-semibold">ಶೇರುಕ್ರಮಾಂಕ : <span className="font-mono">—</span></td>
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ನಂಬರ: <span className="font-mono">—</span></td>
              <td className="p-1 font-semibold">===================</td>
            </tr>
          </tbody>
        </table>

        {/* Purpose */}
        <p className="text-[11px] leading-[1.75] text-justify mb-3">
          ಮೇಲ್ಕಂಡ ಶೇರನ್ನು ಕೌಟುಂಬಿಕ(ಪ್ರಾಪಂಚಿಕ) ಅಡಚಣೆ ಸಲುವಾಗಿ ಶ್ರೀ <strong className="underline underline-offset-2">{transfereeName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transfereePlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transfereeDistrict}</strong> ಇವರ ಹೆಸರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿದ್ದು, ಈ ಬಗ್ಗೆ ಪಂಚರ(ಹಿರಿಯರ) ಸಮಕ್ಷಮದಲ್ಲಿ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಕೂಡಿಕೊಂಡು ಸಮಾಲೋಚಿಸಿ, ಕಾರ್ಖಾನೆಯ ಅಧಿಕಾರಿಗಳು ಸ್ಥಾನಿಕ ಚೌಕಾಸಿಗೆ ಬಂದಾಗ ಶೇರು ವರ್ಗಾವಣೆಗೆ ರುಜು ಮಾಡುವುದಕ್ಕೆ ಒಪ್ಪಿಕೊಂಡಿರುತ್ತಾರೆ.
        </p>

        {/* Family Members Consent Table (8 rows) */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-3 font-sans">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-center">
              <th className="p-1.5 border-r border-black w-12">ಅ.ನಂ.</th>
              <th className="p-1.5 border-r border-black">ಕುಟುಂಬ ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು</th>
              <th className="p-1.5 border-r border-black w-24">ಸಂಬಂಧ</th>
              <th className="p-1.5 border-r border-black w-20">ವಯಸ್ಸು</th>
              <th className="p-1.5 w-28">ಉದ್ಯೋಗ</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <tr key={num} className="border-b border-black h-7">
                <td className="p-1 border-r border-black text-center font-bold">{num})</td>
                <td className="p-1 border-r border-black"></td>
                <td className="p-1 border-r border-black text-center"></td>
                <td className="p-1 border-r border-black text-center"></td>
                <td className="p-1 text-center"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Count Declaration */}
        <p className="text-[11px] leading-relaxed mb-4">
          ಮೇಲ್ಕಾಣಿಸಿದ ಪ್ರಕಾರ ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ಹೆಂಡತಿ / ಗಂಡ ಹಾಗು ಮಕ್ಕಳು ಒಳಗೊಂಡು ಒಟ್ಟು:- <strong className="font-mono underline underline-offset-2 px-2">4</strong> ಜನ ಜೀವಂತ ಸದಸ್ಯರು (ವಾರಸುದಾರರು) ಇರುತ್ತಾರೆ ಅಂತಾ ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
        </p>

        {/* Footer Signatures */}
        <div className="flex justify-between items-end text-xs font-bold pt-6">
          <div>
            <div>ಸ್ಥಳ : {transferorPlace}</div>
            <div>ದಿನಾಂಕ: {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-black pt-1">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸಹಿ</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">13</div>
    </div>
  );

  // =========================================================================
  // PAGE 14: Legal Opinion (ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ & ಪರಿಶೀಲನಾ ಪಟ್ಟಿ)
  // =========================================================================
  const renderPage14 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {renderHeaderBox()}

        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-1.5">
          <div className="font-bold text-xs">
            ಸಲ್ಲಿಸಲಾಗಿದೆ :-
          </div>
          <div className="border-[2px] border-black p-0.5">
            <div className="border border-black px-6 py-0.5 font-bold font-serif text-sm">
              Legal opinion
            </div>
          </div>
          <div className="text-xs font-bold">
            ದಿನಾಂಕ: <span className="font-mono">{receiptDate || applicationDate}</span>
          </div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="text-[11.5px] font-bold text-center my-2 leading-relaxed">
          ವಿಷಯ:- ಕಾರ್ಖಾನೆಯ ಶೇರು ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡುವುದಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು ಹಾಗೂ ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಕಾನೂನು ಸಲಹೆ ನೀಡುವ ಕುರಿತು
        </div>

        {/* Introduction */}
        <p className="text-[11px] leading-[1.7] text-justify indent-6 mb-2">
          ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ಶ್ರೀ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು <strong>{noOfShares}</strong> ಶೇರ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong className="font-mono">#{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ತಮ್ಮ ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ತಮ್ಮ ಶೇರನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿ, ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಕಬ್ಬು ಬೆಳೆಗಾರ ರೈತರಾದ <strong>ಶ್ರೀ {transfereeName}</strong> ಸಾ: <strong>{transfereePlace}</strong> ತಾಲೂಕ: <strong>{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transfereeDistrict}</strong> ಇವರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ವಿನಂತಿಸಿಕೊಂಡಿದ್ದರನ್ವಯ, ಶೇರು ತೆಗೆದುಕೊಳ್ಳುವವರು ಈಗಾಗಲೇ ದಿನಾಂಕ: <strong className="font-mono">{receiptDate || applicationDate}</strong> ರಂದು ಜರುಗಿದ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ: <strong className="font-mono">{receiptNo || '816'}</strong> ರನ್ವಯ ನಾಮಿನಲ್ ಸದಸ್ಯತ್ವವನ್ನು ಪಡೆದಿರುವರು. ಆದಕಾರಣ, ಸದರಿ ರೈತರುಗಳು ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ಈ ಕೆಳಕಂಡ ದಾಖಲಾತಿಗಳನ್ನು ಪೂರೈಸಿರುತ್ತಾರೆ.
        </p>

        {/* Comparative 8-Row Checklist Table */}
        <table className="w-full border-[1.5px] border-black text-[9.5px] mb-2 font-sans">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-center">
              <th className="p-1 border-r border-black w-8">ಅ ಸಂ.</th>
              <th className="p-1 border-r border-black w-1/2">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ದಾಖಲಾತಿಗಳು</th>
              <th className="p-1 border-r border-black w-8">ಅ ಸಂ.</th>
              <th className="p-1">ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ದಾಖಲಾತಿಗಳು</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">1</td>
              <td className="p-1 border-r border-black">ದಿನಾಂಕ : <span className="font-mono">{applicationDate}</span> ರನ್ವಯ ಶೇರು ವರ್ಗಾವಣೆ ವಿನಂತಿ ಅರ್ಜಿ</td>
              <td className="p-1 border-r border-black text-center font-bold">1</td>
              <td className="p-1">ದಿನಾಂಕ : <span className="font-mono">{applicationDate}</span> ರನ್ವಯ ಶೇರು ಖರೀದಿಯ ವಿನಂತಿ ಅರ್ಜಿ</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">2</td>
              <td className="p-1 border-r border-black">ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ & ಗುರುತಿನ ಪತ್ರ (ID Card)</td>
              <td className="p-1 border-r border-black text-center font-bold">2</td>
              <td className="p-1">ರಶೀದಿ ಸಂಖ್ಯೆ : #{receiptNo || '816'} ದಿನಾಂಕ : {receiptDate} ರನ್ವಯ ಶೇರು ಫೀ & ಪ್ರವೇಶ ಫೀ ಹಾಗೂ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಫೀ ಸೇರಿ ಒಟ್ಟು ರೂ. {fees}/- ಭರಣಾ ಮಾಡಿದ ಮೂಲ ಪ್ರತಿ (Fee Receipt)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1 border-r border-black">ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ (No Dues Certificate)</td>
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1">ರೂ. 500/- ಬಾಂಡ ಮೇಲೆ ನಷ್ಟ ಭರಣಾ ಮುಚ್ಚಳಿಕೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ. : — ದಿನಾಂಕ : {receiptDate} (Indemnity Bond)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">4</td>
              <td className="p-1 border-r border-black">ರೂ. 500/- ಬಾಂಡ ಮೇಲೆ ಒಪ್ಪಿಗೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ.: — ದಿನಾಂಕ : {receiptDate} (Personal Kabuli letter)</td>
              <td className="p-1 border-r border-black text-center font-bold">4</td>
              <td className="p-1">ರಹವಾಸಿ :- ಆಧಾರ್ ಗುರುತಿನ ಪತ್ರ ಸಂಖ್ಯೆ : <span className="font-mono">{transfereeAadhaar || '—'}</span></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">5</td>
              <td className="p-1 border-r border-black">ರೂ. 100/- ಬಾಂಡ ಮೇಲೆ ಅಫಿಟಿವಿಟ್ ಒಪ್ಪಿಗೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ.: — ದಿನಾಂಕ : {receiptDate}</td>
              <td className="p-1 border-r border-black text-center font-bold">5</td>
              <td className="p-1">ಶೆಡ್ಯೂಲ್ ‘ಎ’ ಫಾರ್ಮ</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">6</td>
              <td className="p-1 border-r border-black">ರೂ. 100/- ಬಾಂಡ ಮೇಲೆ ಪದ್ಧತಿಯ ಒಪ್ಪಿಗೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ.: — ದಿನಾಂಕ : {receiptDate}</td>
              <td className="p-1 border-r border-black text-center font-bold">6</td>
              <td className="p-1">ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದಲ್ಲಿ ಕಬ್ಬು ಬೆಳೆಯುವ ನೀರಾವರಿ ಕ್ಷೇತ್ರದ ಜಮೀನಿನ ಉತಾರೆ.</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">7</td>
              <td className="p-1 border-r border-black">ರಹವಾಸಿ :- ಆಧಾರ್ ಗುರುತಿನ ಪತ್ರ ಸಂಖ್ಯೆ : <span className="font-mono">{transferorAadhaar || '—'}</span></td>
              <td className="p-1 border-r border-black text-center font-bold">7</td>
              <td className="p-1">ಹೊಸ ಶೇರು ಖಾತೆ ಸಂಖ್ಯೆ : <span className="font-mono">#{shareNo}</span></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold">8</td>
              <td className="p-1 border-r border-black">ಕಾರ್ಖಾನೆಯ ಕ್ಷೇತ್ರ ಸಿಬ್ಬಂದಿಯ (FA) ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ</td>
              <td className="p-1 border-r border-black text-center font-bold"></td>
              <td className="p-1"></td>
            </tr>
          </tbody>
        </table>

        {/* Submission Paragraph */}
        <p className="text-[10.5px] leading-relaxed text-justify mb-2">
          ಮೇಲ್ಕಾಣಿಸಿದ ವಿವರದ ಪ್ರಕಾರ ಶೇರು ವರ್ಗಾವಣೆ (ಮಾರಾಟ) ಮಾಡುವವರು ಹಾಗೂ ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಸಲ್ಲಿಸಿರುವ ದಾಖಲಾತಿಗಳನ್ನು ಇದರೊಂದಿಗೆ ಲಗತ್ತಿಸಲಾಗಿದ್ದು, ಸದರ ಕಾಗದಪತ್ರಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲನೆ ಮಾಡಿ, ವರದಿ ನೀಡಲು ತಮ್ಮಲ್ಲಿ ಈ ಮೂಲಕ ವಿನಂತಿಸಲಾಗಿದೆ.
        </p>

        {/* Office Signatures */}
        <div className="flex justify-between items-center text-xs font-bold pt-1 mb-2">
          <div>ಗುಮಾಸ್ತರು</div>
          <div>ಶೇರು ಇನ್-ಚಾರ್ಜ</div>
        </div>

        {/* Divider */}
        <div className="border-t border-black my-1"></div>

        {/* Section 2: Legal Advisor Report */}
        <div className="pt-1 text-xs">
          <div className="flex justify-between items-center font-bold mb-1">
            <span>2) ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ:-</span>
            <span>ದಿನಾಂಕ : <span className="font-mono">{receiptDate || applicationDate}</span></span>
          </div>
          <p className="text-[11px] leading-relaxed text-justify mb-4">
            ಮೇಲ್ಕಂಡ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು ಹಾಗೂ ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳು ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 23ರ ಪ್ರಕಾರ ನಿಯಮಾನುಸಾರ ಪರಿಶೀಲಿಸಲಾಗಿ ಸರಿ ಇರುತ್ತವೆ.
          </p>
          <div className="flex justify-end text-xs font-bold text-center">
            <div>
              (ಶ್ರೀ ಸುನೀಲ್ ಕುಲಕರ್ಣಿ)<br />
              <span className="text-[10px] font-normal">ವಕೀಲರು ಹಾಗೂ ಕಾನೂನು ಸಲಹೆಗಾರರು, ಇಂಡಿ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-1">14</div>
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
                  <span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 14-Page Complete Bundle)</span>
                  {isNewSubmission && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Newly Submitted)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ಕಾನೂನುಬದ್ಧ 14 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)
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
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 14 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
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
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 14 ಪುಟಗಳು (All 14 Pages)
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
            <button
              type="button"
              onClick={() => setActiveTab('p6')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p6' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 6: ID ಕಾರ್ಡ್ & ಸಹಿ ಪರಿಶೀಲನೆ (CDO)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p7')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p7' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 7: ಬಾಕಿ ರಹಿತ ವರದಿ ಅರ್ಜಿ (No Dues)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p8')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p8' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 8: ಗುರುತಿನ ಚೀಟಿ ಅರ್ಜಿ (ID Form)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p9')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p9' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 9: ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಕಛೇರಿ ಆದೇಶ (Office Order)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p10')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p10' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 10: Schedule ‘A’ (Agreement)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p11')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p11' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 11: ಶೇರು ಮಾರಾಟಗಾರರ ವರ್ಗಾವಣೆ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p12')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p12' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 12: ಶೇರು ಖರೀದಿದಾರರ ವರ್ಗಾವಣೆ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p13')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p13' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 13: ಕುಟುಂಬ ಸದಸ್ಯರ ಒಪ್ಪಿಗೆ ಪಟ್ಟಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p14')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p14' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 14: Legal Opinion (ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ)
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
                {renderPage6()}
                {renderPage7()}
                {renderPage8()}
                {renderPage9()}
                {renderPage10()}
                {renderPage11()}
                {renderPage12()}
                {renderPage13()}
                {renderPage14()}
              </div>
            ) : activeTab === 'p1' ? (
              <div className="w-full max-w-[790px]">{renderPage1()}</div>
            ) : activeTab === 'p2' ? (
              <div className="w-full max-w-[790px]">{renderPage2()}</div>
            ) : activeTab === 'p3' ? (
              <div className="w-full max-w-[790px]">{renderPage3()}</div>
            ) : activeTab === 'p4' ? (
              <div className="w-full max-w-[790px]">{renderPage4()}</div>
            ) : activeTab === 'p5' ? (
              <div className="w-full max-w-[790px]">{renderPage5()}</div>
            ) : activeTab === 'p6' ? (
              <div className="w-full max-w-[790px]">{renderPage6()}</div>
            ) : activeTab === 'p7' ? (
              <div className="w-full max-w-[790px]">{renderPage7()}</div>
            ) : activeTab === 'p8' ? (
              <div className="w-full max-w-[790px]">{renderPage8()}</div>
            ) : activeTab === 'p9' ? (
              <div className="w-full max-w-[790px]">{renderPage9()}</div>
            ) : activeTab === 'p10' ? (
              <div className="w-full max-w-[790px]">{renderPage10()}</div>
            ) : activeTab === 'p11' ? (
              <div className="w-full max-w-[790px]">{renderPage11()}</div>
            ) : activeTab === 'p12' ? (
              <div className="w-full max-w-[790px]">{renderPage12()}</div>
            ) : activeTab === 'p13' ? (
              <div className="w-full max-w-[790px]">{renderPage13()}</div>
            ) : (
              <div className="w-full max-w-[790px]">{renderPage14()}</div>
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
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 14 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
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
              {renderPage6()}
              {renderPage7()}
              {renderPage8()}
              {renderPage9()}
              {renderPage10()}
              {renderPage11()}
              {renderPage12()}
              {renderPage13()}
              {renderPage14()}
            </>
          ) : activeTab === 'p1' ? (
            renderPage1()
          ) : activeTab === 'p2' ? (
            renderPage2()
          ) : activeTab === 'p3' ? (
            renderPage3()
          ) : activeTab === 'p4' ? (
            renderPage4()
          ) : activeTab === 'p5' ? (
            renderPage5()
          ) : activeTab === 'p6' ? (
            renderPage6()
          ) : activeTab === 'p7' ? (
            renderPage7()
          ) : activeTab === 'p8' ? (
            renderPage8()
          ) : activeTab === 'p9' ? (
            renderPage9()
          ) : activeTab === 'p10' ? (
            renderPage10()
          ) : activeTab === 'p11' ? (
            renderPage11()
          ) : activeTab === 'p12' ? (
            renderPage12()
          ) : activeTab === 'p13' ? (
            renderPage13()
          ) : (
            renderPage14()
          )}
        </div>,
        document.body
      )}
    </>
  );
}
