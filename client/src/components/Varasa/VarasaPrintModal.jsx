import { getCompanyLogo, useCompanyLogo, useHandshakeLogo } from '../../services/organizationService';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, ChevronRight, Layers, UserCheck, Users } from 'lucide-react';

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

export default function VarasaPrintModal({ isOpen, onClose, varasaData, isNewSubmission = false }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p12'
  const logoSrc = useCompanyLogo();

  // Dynamic Persons Count (default from data or 4)
  const initialCount = parseInt(varasaData?.family_count || varasaData?.heir_count) || 4;
  const [personsCount, setPersonsCount] = useState(initialCount);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('varasa-printing');
    }
    return () => {
      document.body.classList.remove('varasa-printing');
    };
  }, [isOpen]);

  if (!isOpen || !varasaData) return null;

  // Resolve values
  const v = varasaData;
  const heirNameRaw = (v.varasa_member || v.heir_name || '').trim();
  const heirName = heirNameRaw.startsWith('ಶ್ರೀ') || heirNameRaw.startsWith('ಶ್ರೀಮತಿ')
    ? heirNameRaw
    : `ಶ್ರೀ ${heirNameRaw}`;

  const shareholderNameRaw = (v.shareholder_name || v.existing_shareholder_name || '').trim();
  const shareholderName = shareholderNameRaw.replace(/^(ಶ್ರೀ|ಶ್ರೀಮತಿ|ದಿ\.|ದಿವಂಗತ\.)\s*/, '');

  const shareNo = String(v.share_no || v.existing_share_number || '10006').trim();
  
  let rawCategory = (v.category || 'ಅ').trim();
  let cleanCategory = rawCategory.replace(/[\-–]\s*ವರ್ಗ/, '').trim();
  if (!cleanCategory) cleanCategory = 'ಅ';

  const isClassB = cleanCategory.includes('ಬ');
  const faceValue = isClassB ? '5000' : '2000';

  const noOfShares = parseInt(v.no_of_shares || v.existing_shares) || 1;
  const dod = v.dod ? formatDocDate(v.dod) : '05/11/2021';
  const applicationDate = v.application_date || formatDocDate(v.created_at || new Date());
  const receiptDate = v.receipt_date || '05-Nov-22';
  const receiptNo = v.receipt_no || v.transfer_id || '816';
  const fees = v.fees !== undefined ? v.fees : 570;

  const heirPlace = (v.heir_place || v.place || 'ಲಖ್ಯಾಣ').trim();
  const heirTaluk = (v.heir_taluk || v.taluk || 'ಇಂಡಿ').trim();
  const heirDistrict = (v.heir_district || v.district || 'ವಿಜಯಪುರ').trim();

  const shareholderPlace = (v.shareholder_place || heirPlace || 'ಲಖ್ಯಾಣ').trim();
  const shareholderTaluk = (v.shareholder_taluk || heirTaluk || 'ಇಂಡಿ').trim();
  const shareholderDistrict = (v.shareholder_district || heirDistrict || 'ವಿಜಯಪುರ').trim();

  const heirMobile = v.heir_mobile || v.mobile || '9901441920';
  const heirAadhaar = v.heir_aadhaar || v.aadhaar || '';
  const shareholderAadhaar = v.shareholder_aadhaar || '';
  const relationship = (v.heir_relationship || 'ಮಗ').trim();

  // Photos for both persons
  const photo = v.heir_photo || v.photo || null;
  const shareholderPhoto = v.shareholder_photo || v.existing_shareholder_photo || (v.existing_shareholder && v.existing_shareholder.photo) || null;

  // Dynamic Row Indices for Page 8 & Page 9
  const page8Count = Math.min(personsCount, 4);
  const page8Indices = Array.from({ length: page8Count }, (_, i) => i + 1);
  const page9Count = Math.max(0, personsCount - 4);
  const page9Indices = page9Count > 0 ? Array.from({ length: page9Count }, (_, i) => i + 5) : [];

  const handlePrint = () => {
    document.body.classList.add('varasa-printing');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Reusable Header Box for all pages
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

      {/* Sub Bar: Taluk & District */}
      <div className="border-t-[2px] border-black flex items-center justify-between px-4 py-0.5 text-xs font-bold bg-white">
        <span>ತಾಲೂಕಾ|| ಚಡಚಣ</span>
        <span>ಜಿಲ್ಲಾ|| ವಿಜಯಪೂರ</span>
      </div>
    </div>
  );

  // =========================================================================
  // PAGE 1: ಶೇರು ವಾರಸಾ ಅರ್ಜಿ – 1
  // =========================================================================
  const renderPage1 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <h2 className="text-center text-[18px] font-bold underline mb-3 text-black">
          ಶೇರು ವಾರಸಾ ಅರ್ಜಿ – 1
        </h2>

        {/* Addressee & Contact */}
        <div className="flex justify-between items-start text-xs font-semibold mb-2">
          <div className="space-y-0.5 text-black">
            <div>ಗೆ,</div>
            <div>ಮಾನ್ಯ ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
            <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
            <div>ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪೂರ</div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-bold text-black">
              ಮೊಬೈಲ್ ನಂ: <span className="underline font-mono text-[13px]">{heirMobile}</span>
            </div>
            <div className="text-[11px] text-slate-800 font-mono">
              (Rcpt No: {receiptNo}-{receiptDate})
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-black mb-2">
          ಮಾನ್ಯರೇ,
        </div>

        <div className="text-[13px] leading-relaxed text-black mb-3">
          <p>
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ನಾನು <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ಈ ಮೂಲಕ ತಮ್ಮಲ್ಲಿ ಬರೆದುಕೊಡುವ ಒಪ್ಪಿಗೆ ಪತ್ರದ ಅರ್ಜಿ ಏನೆಂದರೆ-
          </p>
        </div>

        {/* Main Body Paragraph */}
        <div className="text-[12.8px] leading-[1.9] text-justify font-normal text-black mb-4">
          <p className="indent-8">
            ನನ್ನ ತಂದೆಯಾದ ದಿವಂಗತ. <strong>{shareholderName} ಸಾ: {shareholderPlace} ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಇವರು “<strong>{cleanCategory}</strong>” ವರ್ಗದಲ್ಲಿ <strong>{noOfShares}</strong> ಶೇರು ಹೊಂದಿದ್ದು, ಶೇರು ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ:<strong>{dod}</strong> ರಂದು ಮೃತರಾದ ಪ್ರಯುಕ್ತ, ಮೃತರ ವಾರಸುದಾರರೆಲ್ಲರೂ ಒಟ್ಟಾಗಿ ಸೇರಿ, ಪಂಚರ(ಹಿರಿಯರ) ಸಮಕ್ಷಮದಲ್ಲಿ ಚರ್ಚಿಸಲಾಗಿ, ನನ್ನ ಹೆಸರಿಗೆ ಶೇರು ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವುದಕ್ಕೆ ಎಲ್ಲರೂ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿರುತ್ತಾರೆ. ಮೃತರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಮುಂಗಡ ಬಾಕಿ ಇದ್ದಲ್ಲಿ ಅದಕ್ಕೆ ನಾನು ಜವಾಬ್ದಾರಿಯಾಗಿದ್ದು, ಅದನ್ನು ಕಾರ್ಖಾನೆಗೆ ಮರುಪಾವತಿಸಲು ಸಿದ್ದನಿರುತ್ತೇನೆ. ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ದಾಖಲಾತಿಗಳನ್ನು ಇದರೊಂದಿಗೆ ಲಗತ್ತಿಸಿದ್ದು, ನಾನು ಪೂರೈಸಿದ ಮಾಹಿತಿಗಳು ಹಾಗು ದಾಖಲೆಗಳು ಸತ್ಯ ಮತ್ತು ನೈಜವಾಗಿದ್ದು, ಒಂದು ವೇಳೆ ದಾಖಲಾತಿಗಳು ಕಾನೂನು ಬಾಹಿರವೆಂದು ಕಂಡು ಬಂದಲ್ಲಿ ನನ್ನ ಮೇಲೆ ಯಾವುದೇ ರೀತಿ ಕ್ರಮವಿಡಲು ಕಾರ್ಖಾನೆಗೆ ಸಂಪೂರ್ಣ ಅಧಿಕಾರವಿರುತ್ತದೆ. ಕಾರ್ಖಾನೆಯ ಕಾಲಕಾಲಕ್ಕೆ ನೀಡುವ ಸೂಚನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು, ನಾನು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಮೃತರ ಹೆಸರನ್ನು ಕಡಿಮೆ ಮಾಡಿ ನನ್ನ ಹೆಸರಿಗೆ ಶೇರು ವಾರಸಾ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
          </p>
        </div>

        {/* Location, Date & Signature */}
        <div className="flex justify-between items-end text-xs font-bold my-4">
          <div className="space-y-1">
            <div>ಸ್ಥಳ:- ಮರಗೂರ</div>
            <div>ದಿನಾಂಕ:- {applicationDate}</div>
          </div>
          <div className="text-center space-y-1">
            <div className="font-bold">ಶೇರು ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಸಹಿ</div>
            <div className="w-56 border-t border-black pt-1"></div>
          </div>
        </div>

        {/* Attached Documents Checklist */}
        <div className="border-t border-black pt-2 space-y-1 text-[11.5px] leading-relaxed text-black">
          <div className="font-bold underline text-[12px] mb-1">ಲಗತ್ತಿಸಿದ ದಾಖಲೆಗಳು:</div>
          <div className="pl-2 space-y-1">
            <div>1) ಮರಣ ಉತ್ತರ ದೃಢೀಕರಿಸಿದ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ</div>
            <div>2) ಉತ್ತರ ಜೀವಿತ ಪ್ರಮಾಣ ಪತ್ರ ದೃಢೀಕರಿಸಿದ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ</div>
            <div>3) ಮೃತರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಹಾಗು ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ ಲಗತ್ತಿಸುವದು</div>
            <div>4) ಕಾರ್ಖಾನೆಯ ಮೂಲ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್(Share Certificate) ಹಾಗು ಗುರುತಿನ ಪತ್ರ(ID Card) ಲಗತ್ತಿಸುವದು.</div>
            <div>5) ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರಿನಲ್ಲಿ ರೂ.100/-ಬಾಂಡ ಮೇಲೆ ಒಪ್ಪಿಗೆ ಪತ್ರ ಲಗತ್ತಿಸುವದು.</div>
            <div>6) ರಹವಾಸಿ ಪತ್ರ;-ಚುನಾವಣೆ ಗುರುತಿನ ಚೀಟಿ/ಆಧಾರ ಕಾರ್ಡ ಯಾವುದಾದರು ಒಂದನ್ನು ದೃಢೀಕರಿಸಿದ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ ಲಗತ್ತಿಸುವದು.</div>
            <div>7) ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯ ವಾರಸಾ ಫೀ- ಒಟ್ಟು ರೂ. {fees}/- ಗಳನ್ನು ಭರಣಾ ಮಾಡಿದ ರಶೀದಿ ನಂ:<strong>{receiptNo}</strong> ದಿನಾಂಕ:-<strong>{receiptDate}</strong> ಇದರ ಮೂಲ ಪ್ರತಿ ಲಗತ್ತಿಸುವದು.</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">1</div>
    </div>
  );

  // =========================================================================
  // PAGE 2: Share Varasha Transation Details (With Photo paste for BOTH persons)
  // =========================================================================
  const renderPage2 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-2">
          ದಿನಾಂಕ: {applicationDate}
        </div>

        {/* Double Border Highlighted Title */}
        <div className="flex justify-center my-1.5">
          <div className="border-[2px] border-black p-0.5 bg-white inline-block">
            <div className="border border-black px-6 py-1 bg-amber-50 text-center">
              <span className="text-[16px] font-bold text-black font-serif tracking-wide">
                -:: Share Varasha Transation Details ::-
              </span>
            </div>
          </div>
        </div>

        {/* Table 1: From / To Comparison */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2.5">
          <tbody>
            <tr className="border-b border-black font-semibold bg-slate-50">
              <td className="w-1/2 p-1.5 border-r border-black font-bold">From,</td>
              <td className="w-1/2 p-1.5 font-bold">To,</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold">“{cleanCategory}” Class Share</td>
              <td className="p-1.5 font-bold">“{cleanCategory}” Class Share</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold">Old L.F. No : {shareNo}</td>
              <td className="p-1.5 font-bold">New L.F. No : {shareNo}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black">Old Certificate No.: {v.old_certificate_no || '—'}</td>
              <td className="p-1.5">New Certificate No.: {v.new_certificate_no || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold">Total No of Shares : {noOfShares}</td>
              <td className="p-1.5 font-bold">Total No of Shares : {noOfShares}</td>
            </tr>
            <tr className="font-bold bg-slate-100">
              <td className="p-1.5 border-r border-black text-center text-[12px]">ಮೃತ ಶೇರು ಸದಸ್ಯರು</td>
              <td className="p-1.5 text-center text-[12px]">ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರು</td>
            </tr>
          </tbody>
        </table>

        {/* Table 2: Name & Address Details with Photo Paste Options for BOTH persons */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2.5">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100 text-center">
              <th className="w-1/2 p-1.5 border-r border-black">ಮೃತ ಶೇರು ಸದಸ್ಯರ ಹೆಸರು & ವಿಳಾಸ</th>
              <th className="w-1/2 p-1.5">ಶೇರು ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Deceased Member with Photo Box */}
              <td className="p-2 border-r border-black align-top">
                <div className="flex gap-2 justify-between items-start">
                  <div className="space-y-1 text-[12px] flex-1">
                    <div className="font-bold">ದಿ. {shareholderName}</div>
                    <div>ಸಾ :- {shareholderPlace}</div>
                    <div>ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲೆ: {shareholderDistrict}</div>
                    <div>ಆಧಾರ್ ಸಂಖ್ಯೆ:- {shareholderAadhaar || '—'}</div>
                    <div>ಮೊಬೈಲ್ ನಂ:- —</div>
                  </div>
                  {/* Photo Box for Deceased Shareholder */}
                  <div className="w-[76px] h-[96px] border border-black rounded flex flex-col items-center justify-center p-0.5 bg-slate-50 shrink-0 text-center overflow-hidden">
                    {shareholderPhoto ? (
                      <img src={shareholderPhoto} alt="Deceased Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[9px] font-bold text-black space-y-0.5 leading-tight">
                        <div>ಮೃತ ಸದಸ್ಯರ</div>
                        <div>ಭಾವಚಿತ್ರ</div>
                        <div>ಲಗತ್ತಿಸುವದು</div>
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Legal Heir with Photo Box */}
              <td className="p-2 align-top">
                <div className="flex gap-2 justify-between items-start">
                  <div className="space-y-1 text-[12px] flex-1">
                    <div className="font-bold">{heirName}</div>
                    <div>ಸಾ :- {heirPlace}</div>
                    <div>ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲೆ: {heirDistrict}</div>
                    <div>ಆಧಾರ್ ಸಂಖ್ಯೆ:- {heirAadhaar || '—'}</div>
                    <div>ಮೊಬೈಲ್ ನಂ:- <strong className="font-bold font-mono">{heirMobile}</strong></div>
                  </div>
                  {/* Photo Box for Legal Heir */}
                  <div className="w-[76px] h-[96px] border border-black rounded flex flex-col items-center justify-center p-0.5 bg-slate-50 shrink-0 text-center overflow-hidden">
                    {photo ? (
                      <img src={photo} alt="Heir Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[9px] font-bold text-black space-y-0.5 leading-tight">
                        <div>ವಾರಸುದಾರರ</div>
                        <div>ಭಾವಚಿತ್ರ</div>
                        <div>ಲಗತ್ತಿಸುವದು</div>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Table 3: Particulars, Specimen Signatures, Thumb Impression */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-3">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100 text-center">
              <th className="w-[45%] p-1.5 border-r border-black">ಮೃತ ಶೇರು ಸದಸ್ಯರ ಪೂರ್ಣ ವಿವರ</th>
              <th className="w-[30%] p-1.5 border-r border-black">ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಮಾದರಿ ಸಹಿ</th>
              <th className="w-[25%] p-1.5">ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2.5 border-r border-black align-top text-[11.8px] leading-relaxed text-justify">
                ಮೇಲ್ಕಂಡ ಶೇರು ಸದಸ್ಯರು ದಿನಾಂಕ:-<strong className="underline font-mono">{dod}</strong> ರಂದು ಮೃತರಾಗಿರುವ ಪ್ರಯುಕ್ತ, ಸದಸ್ಯರ ಮರಣ ಉತ್ತರ ಹಾಗು ಉತ್ತರ ಜೀವಿತ ಪ್ರಮಾಣ ಪತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಎಲ್ಲ ನೇರ ವಾರಸುದಾರರು ತಮ್ಮ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿದ್ದರಿಂದ, ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಮೃತರ ಹೆಸರನ್ನು ಕಡಿಮೆಗೊಳಿಸಿ, ಮೃತರ <strong>{relationship}</strong> ನಿಗೆ ಶೇರು ಸದಸ್ಯತ್ವ ವಾರಸಾ ಮಾಡಲಾಗಿರುತ್ತದೆ.
              </td>
              <td className="p-2.5 border-r border-black align-top space-y-10">
                <div className="font-bold">1)</div>
                <div className="font-bold pt-4">2)</div>
              </td>
              <td className="p-2 align-middle text-center">
                <div className="w-20 h-24 border border-dashed border-black mx-auto rounded flex items-center justify-center text-[10px] text-slate-400">
                  ಹೆಬ್ಬೆಟ್ಟು
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Board Resolution Text */}
        <div className="text-[12px] leading-relaxed text-justify text-black mb-6">
          <p>
            ಮೇಲ್ಕಂಡ ಮೃತ ಶೇರು ಸದಸ್ಯರ ನೇರ ವಾರಸುದಾರರು ಸದಸ್ಯತ್ವ ವಾರಸಾ ಮಾಡಲು ವಿನಂತಿಸಿದ್ದರನ್ವಯ, ದಿನಾಂಕ:-<strong>{applicationDate}</strong> ರಂದು ಜರುಗಿದ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ:- ________ (ಅ) ರಲ್ಲಿ ವಾರಸಾ ಮಾಡಲು ತೀರ್ಮಾನಿಸಲಾಗಿದ್ದರನ್ವಯ, ಬಯೋಮೆಟ್ರಿಕ್ ಪದ್ಧತಿಯಲ್ಲಿ ವಾರಸಾ ಮಾಡಲಾಗಿರುತ್ತದೆ.
          </p>
        </div>

        {/* Verification Sign-off */}
        <div className="flex justify-end pr-4 text-xs font-bold text-black">
          <div>ಪರಿಶೀಲನೆ ಮಾಡಿದವರ ಸಹಿ</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">2</div>
    </div>
  );

  // =========================================================================
  // PAGE 3: ಶೇರು ವಾರಸಾ ಫೀ ಭರಣಾ ಮಾಡುವ ಕುರಿತು
  // =========================================================================
  const renderPage3 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-2">
          ದಿನಾಂಕ:- {applicationDate}
        </div>

        {/* Addressee */}
        <div className="text-xs font-semibold space-y-0.5 text-black mb-3">
          <div>ಗೆ,</div>
          <div>ಮಾನ್ಯ ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
          <div>ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪೂರ</div>
        </div>

        <div className="text-xs font-bold text-black mb-1">
          ಮಾನ್ಯರೇ,
        </div>

        {/* Subject */}
        <div className="text-center font-bold text-[14px] text-black my-2.5 underline">
          ವಿಷಯ:- ಶೇರು ವಾರಸಾ ಮಾಡಲು ರೂ. {fees}/-ಫೀ ಭರಣಾ ಮಾಡುವ ಕುರಿತು
        </div>

        {/* Body Paragraphs */}
        <div className="text-[13px] leading-[2.0] text-justify space-y-3 text-black">
          <p>
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ಈ ಮೂಲಕ ತಮ್ಮಲ್ಲಿ ಬರೆಕೊಂಡ ವಿನಂತಿ ಅರ್ಜಿ ಏನೆಂದರೆ-
          </p>
          <p className="indent-8">
            ನನ್ನ ತಂದೆ ಯಾದ ದಿವಂಗತ. <strong>{shareholderName} ಸಾ: {shareholderPlace} ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಇವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ‘<strong>{cleanCategory}</strong>’ ಗಣದ ಶೇರು ಹೊಂದಿದ್ದು, ಶೇರು ಖಾತೆ ನಂ:-<strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ:-<strong>{dod}</strong> ರಂದು ಮೃತರಾಗಿದ್ದು, ಕಾರಣ. ಮೃತರ ಶೇರನ್ನು ನನ್ನ ಹೆಸರಿಗೆ ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳಬೇಕಾಗಿರುತ್ತದೆ.
          </p>
          <p className="indent-8">
            ಆದಕಾರಣ, ದಯಾಳುಗಳಾದ ತಾವು ದಯವಿಟ್ಟು ಮೆ:ರವರು ನನಗೆ ಶೇರು ವಾರಸಾ ಮಾಡುವ ಸಲುವಾಗಿ ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಶೇರ ವಾರಸಾ ಫೀ ರೂ.500/- ಮತ್ತು ಪ್ರವೇಶ ಫೀ ರೂ.70/- ಸೇರಿ ಒಟ್ಟು ರೂ.570/- (ರೂಪಾಯಿ ಐದುನೂರು ಎಪ್ಪತ್ತು ಮಾತ್ರ) ಗಳನ್ನು ಭರಣಾ ಮಾಡಿಸಿಕೊಂಡು ಶೇರು ವಾರಸಾ ಮಾಡಬೇಕೆಂದು ತಮ್ಮಲ್ಲಿ ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
          </p>
        </div>

        {/* Sign-off */}
        <div className="flex justify-between items-end text-xs font-bold my-5">
          <div className="space-y-1">
            <div>ಸ್ಥಳ:- ಮರಗೂರ.</div>
            <div>ದಿನಾಂಕ:-{applicationDate}</div>
          </div>
          <div className="text-center space-y-1">
            <div>ವಂದನೆಗಳೊಂದಿಗೆ,</div>
            <div className="pt-2">ಅರ್ಜಿದಾರರ ಸಹಿ</div>
            <div className="w-48 border-t border-black pt-1"></div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-[1.5px] border-black my-4"></div>

        {/* Submission / Cashier Note */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-black">
            <div>ಸಲ್ಲಿಸಲಾಗಿದೆ:-</div>
            <div>ದಿನಾಂಕ:-{applicationDate}</div>
          </div>
          <div className="text-[12.8px] leading-relaxed text-justify text-black indent-6">
            ಸದರಿಯವರು ಮೃತರ ಶೇರು ವಾರಸಾ ಮಾಡುವ ಸಲುವಾಗಿ ಒಟ್ಟು ರೂ.570/- (ರೂಪಾಯಿ ಐದುನೂರು ಎಪ್ಪತ್ತು ಮಾತ್ರ) ಗಳನ್ನು ಕಾರ್ಖಾನೆಯ ರಶೀದಿ ಸಂಖ್ಯೆ: <strong>{receiptNo}</strong> ದಿನಾಂಕ:- <strong>{receiptDate}</strong> ರನ್ವಯ ಫೀ ಭರಣಾ ಮಾಡಿರುತ್ತಾರೆ. ಕಾರಣ, ಮುಂದಿನ ಕ್ರಮಕ್ಕಾಗಿ ಮೆ:ರವರಲ್ಲಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.
          </div>
          <div className="flex justify-end pt-5 pr-4 text-xs font-bold text-black">
            <div>ಕ್ಯಾಶಿಯರ್ ಸಹಿ</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">3</div>
    </div>
  );

  // =========================================================================
  // PAGE 4: ಕಛೇರಿ ಟಿಪ್ಪಣಿ (NOC Report from Cane & R&D Dept)
  // =========================================================================
  const renderPage4 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-2">
          ದಿನಾಂಕ:-{applicationDate}
        </div>

        {/* Centered Double Border Title */}
        <div className="flex justify-center my-3">
          <div className="border-[2px] border-black p-0.5 bg-white inline-block">
            <div className="border border-black px-8 py-1 bg-white text-center">
              <span className="text-[17px] font-bold text-black tracking-wide">
                -:: ಕಛೇರಿ ಟಿಪ್ಪಣಿ::-
              </span>
            </div>
          </div>
        </div>

        {/* Office Note Paragraph */}
        <div className="text-[13.5px] leading-[2.1] text-justify text-black mb-3">
          <p className="indent-8">
            ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದ ಸದಸ್ಯರಾದ ದಿವಂಗತ. <strong>{shareholderName} ಸಾ: {shareholderPlace} ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ:- <strong>{dod}</strong> ರಂದು ಮೃತರಾದ ಪ್ರಯುಕ್ತ, ಮೃತರ ನೇರ ಸಂಬಂಧಿಕರು ಶೇರು ವಾರಸಾ ಮಾಡಲು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದು, ಮೃತರ ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಕಾರ್ಖಾನೆಗೆ ಬರಬೇಕಾಗಿದ್ದ ಬಾಕಿ ವಗೈರೆ ಇದ್ದ ಬಗ್ಗೆ ತಿಳಿಸಲು ಕೋರಿದೆ.
          </p>
        </div>

        <div className="text-right pr-4 mb-4">
          <span className="text-sm font-bold text-black">ಶೇರು ವಿಭಾಗ</span>
        </div>

        <div className="border-t border-black my-4"></div>

        {/* 1) Cane Development Report */}
        <div className="space-y-4 mb-6">
          <div className="font-bold text-[13.5px] text-black">
            1) ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ವರದಿ :
          </div>
          <div className="pl-6 text-[13px] text-black">
            ಸದರಿಯವರಿಂದ ಬಾಕಿ ರೂ. __________________ ಗಳಷ್ಟು ಇರುತ್ತದೆ / ಇರುವುದಿಲ್ಲ.
          </div>
          <div className="text-right pr-6 font-bold text-[13px] pt-3 text-black">
            ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ
          </div>
        </div>

        <div className="border-t border-black my-4"></div>

        {/* 2) R&D Report */}
        <div className="space-y-4 mb-6">
          <div className="font-bold text-[13.5px] text-black">
            2) ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಹಾಗು ಸಂಶೋಧನೆ ವಿಭಾಗದ (R&D) ವರದಿ :
          </div>
          <div className="pl-6 text-[13px] text-black">
            ಸದರಿಯವರಿಂದ ಕಬ್ಬಿನ ಬೀಜ/ರಸಗೊಬ್ಬರ/ ಇತ್ಯಾದಿ ಬಾಕಿ ರೂ. _________________ ಗಳಷ್ಟು ಇರುತ್ತದೆ / ಇರುವುದಿಲ್ಲ.
          </div>
          <div className="text-right pr-6 font-bold text-[13px] pt-3 text-black">
            R&D ವಿಭಾಗ
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">4</div>
    </div>
  );

  // =========================================================================
  // PAGE 5: ಸದಸ್ಯರ ಫೋಟೋ & ಮಾದರಿ ಸಹಿ & ಪ್ರಮಾಣಪತ್ರ ವಿತರಣೆ
  // =========================================================================
  const renderPage5 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-3">
          ದಿನಾಂಕ:-{applicationDate}
        </div>

        {/* Account Info and Photo Box */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-[14px] font-bold text-black pt-2">
            ಕಾರ್ಖಾನೆಯ “<strong>{cleanCategory}</strong>” ವರ್ಗದ ಶೇರು ಸದಸ್ಯರ ಖಾತೆ ನಂ: <span className="font-mono text-base underline">{shareNo}</span>
          </div>

          <div className="w-28 h-36 border-[1.5px] border-black flex flex-col items-center justify-center p-1 text-center bg-slate-50 shrink-0">
            {photo ? (
              <img src={photo} alt="Member Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-xs font-bold text-black space-y-1">
                <div>ಸದಸ್ಯರ ಫೋಟೋ</div>
                <div>ಲಗತ್ತಿಸುವದು</div>
              </div>
            )}
          </div>
        </div>

        {/* Specimen Signature Boxes */}
        <div className="space-y-4 my-8 pl-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm text-black shrink-0">
              ಸದಸ್ಯರ ಮಾದರಿ ಸಹಿ 1)
            </span>
            <div className="w-72 h-16 rounded-2xl border-[1.5px] border-black bg-white"></div>
          </div>
          <div className="flex items-center gap-4 pl-[118px]">
            <span className="font-bold text-sm text-black shrink-0">
              2)
            </span>
            <div className="w-72 h-16 rounded-2xl border-[1.5px] border-black bg-white"></div>
          </div>
        </div>

        {/* Resolution Statement */}
        <div className="text-[13.5px] leading-[2.1] text-justify text-black my-6">
          <p>
            <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ಇವರ ಅರ್ಜಿ ಮೇಲಿರುವ ಸಹಿ ಹಾಗೂ ಮಾದರಿಯ ಸಹಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ದಿನಾಂಕ:- ____/____/2022 ರಂದು ಜರುಗಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ: _______ (ಅ)ರನ್ವಯ ಸದರಿಯವರಿಗೆ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ (Certificate) ಹಾಗು ಗುರುತಿನ ಕಾರ್ಡ(ID card) ವಿತರಿಸಲಾಗಿದೆ.
          </p>
        </div>

        {/* Officer Signature */}
        <div className="flex justify-end pr-6 pt-10 text-xs font-bold text-black">
          <div>ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ ಸಹಿ</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">5</div>
    </div>
  );

  // =========================================================================
  // PAGE 6: ಸದಸ್ಯರು ಗುರುತಿನ ಚೀಟಿ ಪಡೆಯಲು ತುಂಬುವ ಅರ್ಜಿ ನಮೂನೆ (With Photo paste box)
  // =========================================================================
  const renderPage6 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-1.5">
          ದಿನಾಂಕ:-{applicationDate}
        </div>

        {/* Centered Title */}
        <div className="flex justify-center my-1.5">
          <div className="border-[2px] border-black p-0.5 bg-white inline-block">
            <div className="border border-black px-6 py-1 bg-white text-center">
              <span className="text-[15px] font-bold text-black tracking-wide">
                -:: ಸದಸ್ಯರು ಗುರುತಿನ ಚೀಟಿ ಪಡೆಯಲು ತುಂಬುವ ಅರ್ಜಿ ನಮೂನೆ ::-
              </span>
            </div>
          </div>
        </div>

        {/* Table 1: Member Particulars with Dedicated Photo Paste Option */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-8 p-1.5 border-r border-black text-center font-bold">1</td>
              <td className="w-44 p-1.5 border-r border-black font-semibold">ಸದಸ್ಯತ್ವ “{cleanCategory}”ವರ್ಗ</td>
              <td className="w-24 p-1.5 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂ:</td>
              <td className="p-1.5 border-r border-black font-bold font-mono text-[14px]">{shareNo}</td>
              {/* Photo Paste Box spanning 3 rows */}
              <td rowSpan={3} className="w-28 p-1 text-center align-middle bg-slate-50">
                <div className="w-[84px] h-[104px] border border-black mx-auto rounded flex flex-col items-center justify-center p-0.5 bg-white text-center overflow-hidden">
                  {photo ? (
                    <img src={photo} alt="Member Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[9px] font-bold text-black space-y-0.5 leading-tight">
                      <div>ಸದಸ್ಯರ</div>
                      <div>ಭಾವಚಿತ್ರ</div>
                      <div>ಲಗತ್ತಿಸುವದು</div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black text-center font-bold">2</td>
              <td className="p-1.5 border-r border-black font-semibold">ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು :</td>
              <td colSpan="2" className="p-1.5 border-r border-black font-bold text-[13px]">{heirName}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black text-center font-bold align-top">3</td>
              <td className="p-1.5 border-r border-black font-semibold align-top">ಖಾಯಂ ವಿಳಾಸ :</td>
              <td colSpan="2" className="p-1.5 border-r border-black space-y-0.5">
                <div>ಮುಕ್ಕಾಂ :- <strong>{heirPlace}</strong> & ಪೋಷ್ಟ :- </div>
                <div>PIN CODE:- </div>
                <div>ತಾಲೂಕ: <strong>{heirTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{heirDistrict}</strong></div>
                <div>ಮೊಬೈಲ್ ನಂಬರ: <strong className="font-mono">{heirMobile}</strong></div>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black text-center font-bold">4</td>
              <td className="p-1.5 border-r border-black font-semibold">ಲಿಂಗ : <strong className="underline">ಗಂಡು/ಹೆಣ್ಣು</strong></td>
              <td colSpan="2" className="p-1.5 border-r border-black">ಜನ್ಮ ದಿನಾಂಕ : _____ / _____ / _________</td>
              <td className="p-1.5">ವಯಸ್ಸು : _________</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black text-center font-bold">5</td>
              <td className="p-1.5 border-r border-black font-semibold">ಗುರುತಿನ ಚೀಟಿ ಮಾಡಲು ಕಾರಣ:</td>
              <td colSpan="3" className="p-1.5 font-bold">ಶೇರ ವಾರಸಾ ಇರುವದು.</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-black text-center font-bold">6</td>
              <td colSpan="4" className="p-1.5 font-bold">ಮೂಲ ಶೇರ ಸರ್ಟಿಫಿಕೇಟ ಝರಾಕ್ಸ್ ಪ್ರತಿ ಕಡ್ಡಾಯವಾಗಿ ಲಗತ್ತಿಸುವದು.</td>
            </tr>
          </tbody>
        </table>

        {/* Section Instruction */}
        <div className="border border-black p-1 text-[11px] font-bold text-center bg-slate-50 mb-2">
          ಸದಸ್ಯರು ತಮ್ಮ ಹೆಸರಿನ ಹಾಗು ವಿಳಾಸಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಫೋಟೋ ಸಹಿತ ಇರುವ ಈ ಕೆಳಕಾಣಿಸಿದ ಸರ್ಕಾರಿ ಗುರುತಿನ ದಾಖಲೆಗಳ ಪೈಕಿ ಒಂದನ್ನಾದರೂ ಪೂರೈಸತಕ್ಕದ್ದು.
        </div>

        {/* Table 2: Govt Photo ID Proofs */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100 text-center">
              <th className="w-10 p-1 border-r border-black">ಅ. ಸಂ.</th>
              <th className="p-1 border-r border-black">ಲಗತ್ತಿಸುವ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳ ವಿವರ</th>
              <th className="w-40 p-1 border-r border-black">ಕಾರ್ಡ ಸಂಖ್ಯೆ</th>
              <th className="w-44 p-1 border-r border-black">ದಾಖಲೆ ವಿತರಿಸಿದ ಅಧಿಕಾರಿ ವಿವರ</th>
              <th className="w-28 p-1">ಮತಕ್ಷೇತ್ರದ ಸ್ಥಳ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">1)</td>
              <td className="p-1 border-r border-black">ಚುನಾವಣಾಧಿಕಾರಿಗಳ ಗುರುತಿನ ಚೀಟಿ</td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1 border-r border-black text-center font-serif text-[11px]">Electoral Register Officer</td>
              <td className="p-1"></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">2)</td>
              <td className="p-1 border-r border-black font-semibold">ಆಧಾರ ಕಾರ್ಡ</td>
              <td className="p-1 border-r border-black text-center font-mono font-bold">{heirAadhaar || '_____ / _____ / _____'}</td>
              <td className="p-1 border-r border-black text-center font-serif text-[11px]">Govt. of India</td>
              <td className="p-1 text-center font-serif text-[11px]">Govt. of India</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">3)</td>
              <td className="p-1 border-r border-black">ಪಡಿತರ ಚೀಟಿ (ರೇಶನ್ ಕಾರ್ಡ)</td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1"></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">4)</td>
              <td className="p-1 border-r border-black">ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆಯ ಪ್ಯಾನ್ ಕಾರ್ಡ</td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1"></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">5)</td>
              <td className="p-1 border-r border-black">ಪಾಸ್‌ಪೋರ್ಟ</td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1"></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold">6)</td>
              <td className="p-1 border-r border-black">ವಾಹನ ಚಾಲನಾ ಪರವಾನಿಗೆ ಪತ್ರ</td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1 border-r border-black"></td>
              <td className="p-1"></td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div className="text-[11.5px] text-justify text-black mb-3">
          ಮೇಲ್ಕಾಣಿಸಿದ ಮಾಹಿತಿಗಳು ಹಾಗು ದಾಖಲೆಗಳು ಸತ್ಯ ಮತ್ತು ನೈಜವಾಗಿವೆ ಎಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
        </div>

        {/* Location, Date & Signature */}
        <div className="flex justify-between items-end text-xs font-bold mb-3">
          <div className="space-y-0.5">
            <div>ಸ್ಥಳ:- ಮರಗೂರ.</div>
            <div>ದಿನಾಂಕ: {applicationDate}</div>
          </div>
          <div className="text-center">
            <div>ಸದಸ್ಯರ ಸಹಿ</div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-black pt-2 text-[11px] leading-relaxed text-black">
          <div className="font-bold underline mb-1">ಸೂಚನೆ:-</div>
          <div className="pl-4 space-y-1">
            <div>1) ಹೆಸರು ಮತ್ತು ವಿಳಾಸದ ಸಮಂಜಸ ದಾಖಲೆಗಳ ಝರಾಕ್ಸ್ ಪ್ರತಿಗಳನ್ನು ಹಾಜರಪಡಿಸಬೇಕು.</div>
            <div>2) ಸದಸ್ಯರು ಹೆಬ್ಬೆಟ್ಟಿನ ಸಹಿ ಇದ್ದವರಿಗೆ ಕಾರ್ಖಾನೆಯ ಒಬ್ಬ ಸದಸ್ಯರಿಂದ ದೃಢೀಕರಣ ಪಡೆಯತಕ್ಕದ್ದು. ಅವರ ಹೆಸರು ಖಾತೆ ನಮೂದಿಸತಕ್ಕದ್ದು.</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">6</div>
    </div>
  );

  // =========================================================================
  // PAGE 7: ಕಾರ್ಖಾನೆಯ ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ
  // =========================================================================
  const renderPage7 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-2">
          ದಿನಾಂಕ:-{applicationDate}
        </div>

        {/* Orange/Gold Header Pill Box */}
        <div className="flex justify-center my-2">
          <div className="border-[2px] border-amber-600 rounded-xl px-8 py-1.5 bg-amber-500/15 text-center">
            <span className="text-[16px] font-bold text-black tracking-wide">
              -:: ಕಾರ್ಖಾನೆಯ ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ ::-
            </span>
          </div>
        </div>

        {/* Subject */}
        <div className="my-3 text-[13px] leading-relaxed text-black">
          <div className="font-bold">
            ವಿಷಯ :- “ಮೃತ ಶೇರುದಾರರ ಕುಟುಂಬ ಸದಸ್ಯರಿಗೆ ವಾರಸಾ ಮಾಡುವುದಕ್ಕಾಗಿ ಅರ್ಜಿಗೆ ಲಗತ್ತಿಸಿದ ಎಲ್ಲ ದಾಖಲಾತಿಗಳನ್ನು ಪುನಃ ಪರಿಶೀಲನೆ ಮಾಡಿ ಶಿಫಾರಸ್ಸು ಮಾಡಿರುವ ಕುರಿತು”
          </div>
        </div>

        {/* Paragraph 1 */}
        <div className="text-[12.8px] leading-[2.0] text-justify text-black mb-4">
          <p className="indent-8">
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ಕಾರ್ಖಾನೆಯ “<strong>{cleanCategory}</strong>” ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ದಿವಂಗತ. {shareholderName} ತಾಲೂಕ: {shareholderPlace} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಇವರು ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ: <strong>{dod}</strong> ರಂದು ಮೃತರಾದ ಪ್ರಯುಕ್ತ, ಮೃತ ಸದಸ್ಯರ <strong>{relationship}</strong> ನಾದ <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ರವರು ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ಈ ಕೆಳಕಂಡ ದಾಖಲಾತಿಗಳೊಂದಿಗೆ ಶೇರು ವಾರಸಾ ಮಾಡಲು ತಮ್ಮ ಅರ್ಜಿ ದಿನಾಂಕ: <strong>{applicationDate}</strong> ರಲ್ಲಿ ವಿನಂತಿಸಿಕೊಂಡಿದ್ದರನ್ವಯ, ಕಾರ್ಯಾಲಯ ಆದೇಶ ದಿನಾಂಕ: _____ / _____ /2022 ರ ಪ್ರಕಾರ ಕ್ಷೇತ್ರ ಸಹಾಯಕರಾದ ಶ್ರೀ _____________________ ಇವರು ದಿನಾಂಕ: _____ / _____ /2022 ರಂದು ಖುದ್ದಾಗಿ ಮೃತರ ಗ್ರಾಮಕ್ಕೆ ಖುದ್ದಾಗಿ ಹೋಗಿ ಪಂಚರ ಸಮಕ್ಷಮದಲ್ಲಿ ಹಾಗು ಗ್ರಾಮದ ಪ್ರಮುಖರ ಜೊತೆಗೆ ಕೂಲಂಕೂಷವಾಗಿ ವಿಚಾರಣೆ ಮಾಡಿ ಮೃತರ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಸಂಪೂರ್ಣ ಒಪ್ಪಿಗೆ ಇರುವ ಬಗ್ಗೆ ಸಹಿ ಹಾಗು ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ) ತೆಗೆದುಕೊಂಡು ಸಾಕ್ಷಿದಾರರ ಸಮಕ್ಷಮ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಮಾಡಿದ ವರದಿಯನ್ನು ಉಪ ಪ್ರಧಾನ ವ್ಯವಸ್ಥಾಪಕರು(ಕಬ್ಬು) ರವರ ಶರಾದೊಂದಿಗೆ ದಿನಾಂಕ: _____ / _____ /2022 ರನ್ವಯ ತಮ್ಮ ಚೌಕಾಸಿ ವರದಿ ನೀಡಿರುತ್ತಾರೆ.
          </p>
        </div>

        {/* Paragraph 2 */}
        <div className="text-[12.8px] leading-[2.0] text-justify text-black mb-8">
          <p className="indent-8">
            ಮೃತರ ಶೇರು ವಾರಸಾ ಮಾಡಲು ವಿನಂತಿ ಅರ್ಜಿಗೆ ಲಗತ್ತಿಸಿದ ಎಲ್ಲ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಕಾರ್ಖಾನೆಯ ಉಪ ನಿಯಮ 19(6) ಹಾಗೂ ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 24ರ ಪ್ರಕಾರ ಸರಿ ಇರುತ್ತವೆ ಅಂತಾ ಕಾರ್ಖಾನೆಯ ಕಾನೂನು ಸಲಹೆಗಾರರು ದಿನಾಂಕ: _____ / _____ /2022 ರನ್ವಯ ತಮ್ಮ ವರದಿ ನೀಡಿರುತ್ತಾರೆ. ಈ ಕೆಳಕಾಣಿಸಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿಯ ನಿರ್ದೇಶಕರಾದ ನಾವು ಖುದ್ದಾಗಿ ಕಛೇರಿಯಲ್ಲಿ ಪುನಃ ಮತ್ತೊಮ್ಮೆ ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲನೆ ಮಾಡಲಾಗಿ ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಸರಿ ಇರುತ್ತವೆ. ಆದಕಾರಣ, ಸದರ ಮೂಲ ಶೇರ ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ರಲ್ಲಿರುವ ಮೃತರ ಹೆಸರನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ಮೃತರ ವಾರಸುದಾರರಿಗೆ ವಾರಸಾ ಮಾಡಿ ಹೊಸದಾಗಿ ಶೇರ ಖಾತೆ ನಂಬರ ಕೊಡುವ ವಿಷಯ ಕುರಿತು ಕಾರ್ಖಾನೆಯ ಮುಂಬರುವ ಆಡಳಿತ ಮಂಡಳಿಯ ಸಭೆಯಲ್ಲಿ ಮಂಡಿಸಲು ಶಿಫಾರಸ್ಸು ಮಾಡಲಾಗಿರುತ್ತದೆ.
          </p>
        </div>

        {/* Signatures of Directors */}
        <div className="flex justify-between items-end px-12 pt-16 text-sm font-bold text-black">
          <div className="text-center space-y-1">
            <div className="w-36 border-t border-black pt-1">ನಿರ್ದೇಶಕರು</div>
          </div>
          <div className="text-center space-y-1">
            <div className="w-36 border-t border-black pt-1">ನಿರ್ದೇಶಕರು</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">7</div>
    </div>
  );

  // =========================================================================
  // PAGE 8: ಕ್ಷೇತ್ರ ಸಹಾಯಕರ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ (ಪುಟ 1 - Dynamic Rows 1 to page8Count with increased row height for passport photos)
  // =========================================================================
  const renderPage8 = () => {
    // Dynamic row height and photo box sizing to comfortably stick passport photos
    const rowHeightClass = page8Count <= 1
      ? 'h-[48mm]'
      : page8Count === 2
        ? 'h-[42mm]'
        : page8Count === 3
          ? 'h-[36mm]'
          : 'h-[31mm]';

    const photoBoxClass = page8Count <= 2
      ? 'w-[30mm] h-[38mm]'
      : page8Count === 3
        ? 'w-[28mm] h-[34mm]'
        : 'w-[26mm] h-[29mm]';

    return (
      <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
        <div>
          {renderHeaderBox()}

          {/* Top Header Row */}
          <div className="flex justify-between items-center text-xs font-bold text-black mb-1">
            <div>ಸಲ್ಲಿಸಲಾಗಿದೆ:-</div>
            <div className="border-[2px] border-amber-600 rounded-lg px-6 py-1 bg-amber-500/15 text-center text-sm font-bold">
              -:: ಕ್ಷೇತ್ರ ಸಹಾಯಕರ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ ::-
            </div>
            <div>{applicationDate}</div>
          </div>

          <div className="my-1.5 text-xs font-bold text-black">
            ವಿಷಯ:-“ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆ ಬಗ್ಗೆ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಮಾಡಿದ ವರದಿ ಕುರಿತು”
          </div>

          <div className="text-xs font-bold text-black mb-1">
            ಮಾನ್ಯರೇ,
          </div>

          {/* Body Paragraph */}
          <div className="text-[11.5px] leading-[1.65] text-justify text-black mb-2.5">
            <p className="indent-6">
              ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, <strong>ದಿವಂಗತ. {shareholderName} ಸಾ: {shareholderPlace} ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಇವರು ಕಾರ್ಖಾನೆಯಲ್ಲಿ ‘<strong>{cleanCategory}</strong>’ ಗಣದ ಶೇರು ಹೊಂದಿದ್ದು, ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ: <strong>{dod}</strong> ರಂದು ಮೃತರಾದ ಪ್ರಯುಕ್ತ, ಮೃತ ಸದಸ್ಯರ ವಾರಸುದಾರರು ಸದಸ್ಯತ್ವ ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳಲು ವಿನಂತಿಸಿಕೊಂಡಿದ್ದರನ್ವಯ, ಕಾರ್ಖಾನೆಯ ಆದೇಶ ದಿನಾಂಕ: _____ / _____ /2022 ರ ಪ್ರಕಾರ ಮೃತ ಸದಸ್ಯರ ವಾರಸುದಾರರ ಸಂಪೂರ್ಣ ಒಪ್ಪಿಗೆ ಇರುವ ಬಗ್ಗೆ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಮಾಡಿ ವರದಿ ಸಲ್ಲಿಸಲು ನಿರ್ದೇಶನ ನೀಡಲಾಗಿರುತ್ತದೆ. ಅದರನ್ವಯ, ಸದರಿಯವರ ಸ್ವಗ್ರಾಮಕ್ಕೆ ದಿನಾಂಕ: _____ / _____ /2022 ರಂದು ನಾನೇ ಸ್ವತಃ ಖುದ್ದಾಗಿ ಹೋಗಿ ಈ ಕೆಳಕಾಣಿಸಿದ ಪಂಚರ ಸಮಕ್ಷಮದಲ್ಲಿ ಹಾಗು ಗ್ರಾಮದ ಪ್ರಮುಖರ ಜೊತೆಗೆ ಕೂಲಂಕೂಷವಾಗಿ ವಿಚಾರಣೆ ಮಾಡಲಾಗಿ ಮೃತ ಸದಸ್ಯರಿಗೆ ಉತ್ತರ ಜೀವಿತ ಪ್ರಮಾಣ ಪತ್ರದಲ್ಲಿ ನಮೂದಿಸಿದ ಸದಸ್ಯರು ಮಾತ್ರ ನೇರ ವಾರಸುದಾರರಾಗಿರುತ್ತಾರೆ, ಇವರನ್ನು ಹೊರತು ಪಡಿಸಿ ಬೇರೆ ಯಾರೂ ನೇರ ವಾರಸುದಾರರು ಇರುವುದಿಲ್ಲ. ಆದುದರಿಂದ, ಮೃತ ಸದಸ್ಯರ <strong>{relationship}</strong> ನಾದ <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ಇವರ ಹೆಸರಿಗೆ ಮರಣೋತ್ತರ ನಿಧಿ ಮಂಜೂರಿಗಾಗಿ ಹಾಗು ಸದಸ್ಯತ್ವ ವಾರಸಾ ಮಾಡುವುದಕ್ಕೆ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಸಹಿ ಮತ್ತು ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ) ನೀಡಿ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿರುತ್ತಾರೆ. ಒಂದು ವೇಳೆ ಇದರಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಲೋಪದೋಷವಾಗಿದ್ದಲ್ಲಿ ಅದಕ್ಕೆ ನಾನೇ ಸಂಪೂರ್ಣ ಜವಾಬ್ದಾರಿಯಾಗಿರುತ್ತೇನೆ ಅಂತಾ ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
            </p>
          </div>

          {/* Dynamic Table of Legal Heirs / Family Consent (Rows 1 to page8Count) */}
          <table className="w-full border-[1.5px] border-black text-xs text-left">
            <thead>
              <tr className="border-b border-black font-bold bg-slate-100 text-center">
                <th className="w-8 p-1.5 border-r border-black">ಅ. ಸಂ.</th>
                <th className="p-1.5 border-r border-black">ವಾರಸುದಾರರ ಹೆಸರು</th>
                <th className="w-24 p-1.5 border-r border-black">ಮೃತರಿಗೆ ಸಂಬಂಧ</th>
                <th className="w-28 p-1.5 border-r border-black">ಭಾವ ಚಿತ್ರ</th>
                <th className="w-24 p-1.5 border-r border-black">ಸಹಿ</th>
                <th className="w-28 p-1.5">ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ)</th>
              </tr>
            </thead>
            <tbody>
              {page8Indices.map(idx => (
                <tr key={idx} className={`border-b border-black ${rowHeightClass}`}>
                  <td className="p-1 border-r border-black text-center font-bold align-top pt-2.5">{idx})</td>
                  <td className="p-2 border-r border-black space-y-1 text-[11px] align-middle">
                    {idx === 1 ? (
                      <>
                        <div>ಶ್ರೀ/ಶ್ರೀಮತಿ: <strong className="font-bold underline text-[12px]">{heirName}</strong></div>
                        <div>ವಯಸ್ಸು :- <strong>{v.heir_age || '_____'}</strong></div>
                        <div>ಸಾ:- <strong>{heirPlace}</strong></div>
                        <div>ಆಧಾರ್ ನಂ:- <strong className="font-mono">{heirAadhaar || '___________________'}</strong></div>
                        <div>ಮೊಬೈಲ್ ನಂ:- <strong className="font-mono">{heirMobile || '_________________'}</strong></div>
                      </>
                    ) : (
                      <>
                        <div>ಶ್ರೀ/ಶ್ರೀಮತಿ: ___________________</div>
                        <div>ವಯಸ್ಸು :- _________</div>
                        <div>ಸಾ:- _________________________</div>
                        <div>ಆಧಾರ್ ನಂ:- ___________________</div>
                        <div>ಮೊಬೈಲ್ ನಂ:- _________________</div>
                      </>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-black text-center align-middle font-bold text-xs">
                    {idx === 1 ? relationship : ''}
                  </td>
                  <td className="p-1 border-r border-black text-center align-middle">
                    {idx === 1 && photo ? (
                      <img src={photo} alt="Photo" className={`${photoBoxClass} object-cover mx-auto rounded border border-black shadow-sm`} />
                    ) : (
                      <div className={`${photoBoxClass} border-[1.5px] border-dashed border-slate-600 mx-auto rounded flex flex-col items-center justify-center text-slate-500 bg-slate-50/60 p-1`}>
                        <span className="text-[10px] font-bold">ಭಾವಚಿತ್ರ</span>
                        <span className="text-[7.5px] text-slate-400 mt-0.5 whitespace-nowrap">Passport Photo</span>
                      </div>
                    )}
                  </td>
                  <td className="p-1.5 border-r border-black text-center align-bottom pb-2">
                    <div className="text-[10px] text-slate-400">ಸಹಿ (Sign)</div>
                  </td>
                  <td className="p-1 text-center align-middle">
                    <div className={`${photoBoxClass} border border-dashed border-slate-400 mx-auto rounded flex flex-col items-center justify-center text-slate-400 p-1`}>
                      <span className="text-[10px] font-bold">ಥಂಬ್</span>
                      <span className="text-[7.5px] text-slate-400 mt-0.5 whitespace-nowrap">(Left Thumb)</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-right text-xs font-bold text-black pt-1">8</div>
      </div>
    );
  };

  // =========================================================================
  // PAGE 9: ಕ್ಷೇತ್ರ ಸಹಾಯಕರ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ (ಪುಟ 2 - Continuation & Witnesses)
  // =========================================================================
  const renderPage9 = () => {
    const page9RowHeightClass = page9Indices.length <= 3 ? 'h-[32mm]' : 'h-[26mm]';
    const page9PhotoBoxClass = page9Indices.length <= 3 ? 'w-[26mm] h-[30mm]' : 'w-[24mm] h-[24mm]';

    return (
      <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
        <div>
          {renderHeaderBox()}

          {/* Continuation Table Rows (If personsCount > 4, render rows 5 to personsCount) */}
          {page9Indices.length > 0 ? (
            <table className="w-full border-[1.5px] border-black text-xs text-left mb-3">
              <thead>
                <tr className="border-b border-black font-bold bg-slate-100 text-center">
                  <th className="w-8 p-1.5 border-r border-black">ಅ. ಸಂ.</th>
                  <th className="p-1.5 border-r border-black">ವಾರಸುದಾರರ ಹೆಸರು</th>
                  <th className="w-24 p-1.5 border-r border-black">ಮೃತರಿಗೆ ಸಂಬಂಧ</th>
                  <th className="w-28 p-1.5 border-r border-black">ಭಾವ ಚಿತ್ರ</th>
                  <th className="w-24 p-1.5 border-r border-black">ಸಹಿ</th>
                  <th className="w-28 p-1.5">ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ)</th>
                </tr>
              </thead>
              <tbody>
                {page9Indices.map(idx => (
                  <tr key={idx} className={`border-b border-black ${page9RowHeightClass}`}>
                    <td className="w-8 p-1 border-r border-black text-center font-bold align-top pt-2.5">{idx})</td>
                    <td className="p-1.5 border-r border-black space-y-1 text-[11px] align-middle">
                      <div>ಶ್ರೀ/ಶ್ರೀಮತಿ: ___________________</div>
                      <div>ವಯಸ್ಸು :- _________</div>
                      <div>ಸಾ:- _________________________</div>
                      <div>ಆಧಾರ್ ನಂ:- ___________________</div>
                      <div>ಮೊಬೈಲ್ ನಂ:- _________________</div>
                    </td>
                    <td className="w-24 p-1.5 border-r border-black"></td>
                    <td className="w-28 p-1 border-r border-black text-center align-middle">
                      <div className={`${page9PhotoBoxClass} border-[1.5px] border-dashed border-slate-600 mx-auto rounded flex flex-col items-center justify-center text-slate-500 bg-slate-50/60 p-1`}>
                        <span className="text-[10px] font-bold">ಭಾವಚಿತ್ರ</span>
                        <span className="text-[7.5px] text-slate-400 whitespace-nowrap">Passport Photo</span>
                      </div>
                    </td>
                    <td className="w-24 p-1.5 border-r border-black text-center align-bottom pb-2">
                      <div className="text-[10px] text-slate-400">ಸಹಿ (Sign)</div>
                    </td>
                    <td className="w-28 p-1 text-center align-middle">
                      <div className={`${page9PhotoBoxClass} border border-dashed border-slate-400 mx-auto rounded flex flex-col items-center justify-center text-slate-400 p-1`}>
                        <span className="text-[10px] font-bold">ಥಂಬ್</span>
                        <span className="text-[7.5px] text-slate-400 whitespace-nowrap">(Left Thumb)</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="border border-black p-2 text-center text-xs font-bold bg-slate-50 mb-3">
              ಕುಟುಂಬದ ವಾರಸುದಾರರ ಪೂರ್ಣ ವಿವರಗಳನ್ನು ಪುಟ 8 ರಲ್ಲಿ ನಮೂದಿಸಲಾಗಿದೆ (ಒಟ್ಟು ವಾರಸುದಾರರು: {personsCount}).
            </div>
          )}

          {/* Witnesses Table */}
          <table className="w-full border-[1.5px] border-black text-xs text-left mb-3">
            <thead>
              <tr className="border-b border-black font-bold bg-slate-100">
                <th className="w-12 p-1 border-r border-black text-center">ಅ.ಸಂ.</th>
                <th className="p-1 border-r border-black">ಸಾಕ್ಷಿದಾರರ ಹೆಸರು (ಶೇರು ಸದಸ್ಯರು ಮಾತ್ರ)</th>
                <th className="w-32 p-1 border-r border-black text-center">ಸಹಿ</th>
                <th className="w-48 p-1">ಶೇರು ಖಾತೆ ನಂ. & ಮೊಬೈಲ್ ನಂ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="p-1.5 border-r border-black text-center font-bold">1)</td>
                <td className="p-1.5 border-r border-black"></td>
                <td className="p-1.5 border-r border-black"></td>
                <td className="p-1.5 space-y-1 text-[11px]">
                  <div>Share ID No:-</div>
                  <div>Mobile No:-</div>
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border-r border-black text-center font-bold">2)</td>
                <td className="p-1.5 border-r border-black"></td>
                <td className="p-1.5 border-r border-black"></td>
                <td className="p-1.5 space-y-1 text-[11px]">
                  <div>Share ID No:-</div>
                  <div>Mobile No:-</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Submission Endorsement */}
          <div className="text-[12px] leading-relaxed text-justify text-black mb-2">
            <p>
              ಕಾರಣ, ಮೃತ ಸದಸ್ಯರ <strong>{relationship}</strong> ಯಾದ <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ಇವರ ಹೆಸರಿಗೆ ಶೇರು ಸದಸ್ಯತ್ವ ವಾರಸಾ ಮಾಡುವ ಕುರಿತು ಮುಂದಿನ ಕ್ರಮಕ್ಕಾಗಿ ಮೆ:ರವರಲ್ಲಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.
            </p>
            <p className="text-center font-bold my-2">
              “ನಮ್ಮ ಸಮಕ್ಷಮದಲ್ಲಿ ರುಜು ಮಾಡಿ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿರುತ್ತಾರೆ.”
            </p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end px-10 pt-10 text-xs font-bold text-black">
            <div className="text-center">
              <div className="w-36 border-t border-black pt-1">ಕ್ಷೇತ್ರ ಸಹಾಯಕರು</div>
            </div>
            <div className="text-center">
              <div className="w-36 border-t border-black pt-1">ಸಿ.ಡಿ.ಓ</div>
            </div>
          </div>
        </div>

        <div className="text-right text-xs font-bold text-black pt-2">9</div>
      </div>
    );
  };

  // =========================================================================
  // PAGE 10: Legal opinion (ಕಾನೂನು ಸಲಹೆ)
  // =========================================================================
  const renderPage10 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        {/* Top Header Row */}
        <div className="flex justify-between items-center text-xs font-bold text-black mb-2">
          <div>ಸಲ್ಲಿಸಲಾಗಿದೆ :-</div>
          <div className="border-[2px] border-black p-0.5 bg-white inline-block">
            <div className="border border-black px-6 py-0.5 bg-white font-serif font-bold text-sm tracking-wide">
              Legal opinion
            </div>
          </div>
          <div>ದಿನಾಂಕ:-{applicationDate}</div>
        </div>

        <div className="text-xs font-bold text-black mb-1">
          ಮಾನ್ಯರೇ,
        </div>

        {/* Subject */}
        <div className="text-center font-bold text-[12.5px] text-black my-2">
          ವಿಷಯ:-“ಕಾರ್ಖಾನೆಯ ಮೃತ ಸದಸ್ಯರ ಶೇರನ್ನು ನೇರ ವಾರಸುದಾರರಿಗೆ ವಾರಸಾ ಮಾಡುವ ಸಲುವಾಗಿ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಕಾನೂನು ಸಲಹೆ ನೀಡುವ ಕುರಿತು”
        </div>

        {/* Body Paragraph */}
        <div className="text-[12.5px] leading-relaxed text-justify text-black mb-2.5">
          <p className="indent-6">
            ಕಾರ್ಖಾನೆಯ “<strong>{cleanCategory}</strong>” ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ದಿವಂಗತ. {shareholderName} ಸಾ: {shareholderPlace} ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಇವರು ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ: <strong>{dod}</strong> ರಂದು ಮೃತರಾದ ಪ್ರಯುಕ್ತ, ಮೃತ ಸದಸ್ಯರ <strong>{relationship}</strong> ನಾದ <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ರವರು ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ಈ ಕೆಳಕಂಡ ದಾಖಲಾತಿಗಳೊಂದಿಗೆ ಶೇರು ವಾರಸಾ ಮಾಡಲು ತಮ್ಮ ಅರ್ಜಿ ದಿನಾಂಕ: <strong>{applicationDate}</strong> ರಲ್ಲಿ ವಿನಂತಿಸಿಕೊಂಡಿರುತ್ತಾರೆ.
          </p>
        </div>

        {/* Document Checklist Box */}
        <div className="border-[1.5px] border-black p-2.5 my-2 text-[11.5px] leading-relaxed text-black">
          <div className="text-center font-bold underline mb-1.5 text-xs">-:: ದಾಖಲಾತಿಗಳ ವಿವರ ::-</div>
          <div className="space-y-1">
            <div>1) ದಿನಾಂಕ: <strong>{applicationDate}</strong> ರನ್ವಯ ವಾರಸುದಾರರು ಸಲ್ಲಿಸಿದ ವಿನಂತಿ ಅರ್ಜಿ. (Application)</div>
            <div>2) ರಶೀದಿ ಸಂಖ್ಯೆ: <strong>{receiptNo}</strong> ದಿನಾಂಕ:<strong>{receiptDate}</strong> ರನ್ವಯ ಶೇರು ವಾರಸಾ ಫೀ & ಪ್ರವೇಶ ಫೀ ರೂ:<strong>{fees}</strong>/- ಭರಣಾ ಮಾಡಿದ ಮೂಲ ಪ್ರತಿ.</div>
            <div>3) ಮರಣ ಉತ್ತರ ದೃಢೀಕರಣ(ಅಟೆಸ್ಟೆಡ್) ಪ್ರತಿ. (Death Certificate)</div>
            <div>4) ಉತ್ತರ ಜೀವಿತ ಪ್ರಮಾಣ ಪತ್ರ ದೃಢೀಕರಣ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ. (Succession Certificate- Obtain a Legal Heir Certificate)</div>
            <div>5) ಮೃತರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಹಾಗು ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ <strong>ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ</strong> (No Dues Certificate)</div>
            <div>6) ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ (Share Certificate) & ಗುರುತಿನ ಪತ್ರ (ID Card)</div>
            <div>7) ರೂ:100/- ಬಾಂಡ ಮೇಲೆ ಕುಟುಂಬ ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆ ಪತ್ರ</div>
            <div>8) ರಹವಾಸಿ :- ಆಧಾರ ಕಾರ್ಡ ಸಂಖ್ಯೆ: <strong className="font-mono">{heirAadhaar || '___________________'}</strong></div>
            <div>9) ಕಾರ್ಖಾನೆಯ ಕ್ಷೇತ್ರ ಸಿಬ್ಬಂಧಿಯ(FA) ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ.</div>
          </div>
        </div>

        <div className="text-[12px] leading-relaxed text-justify text-black my-2">
          ಕಾರಣ, ಮೃತ ಸದಸ್ಯರ ನೇರ ವಾರಸುದಾರರು ಪೂರೈಸಿದ ಮೇಲ್ಕಾಣಿಸಿದ ದಾಖಲಾತಿಗಳನ್ನು ಇದರೊಂದಿಗೆ ಲಗತ್ತಿಸಲಾಗಿದ್ದು, ಸದರ ಕಾಗದಪತ್ರಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲನೆ ಮಾಡಿ, ವರದಿ ನೀಡಲು ತಮ್ಮಲ್ಲಿ ಈ ಮೂಲಕ ವಿನಂತಿಸಲಾಗಿದೆ.
        </div>

        {/* Signatures of Clerks */}
        <div className="flex justify-between items-end px-4 my-2 text-xs font-bold text-black">
          <div>ಗುಮಾಸ್ತ</div>
          <div>ಶೇರ ಇನ್‌ಚಾರ್ಜ</div>
        </div>

        <div className="border-t border-black my-2"></div>

        {/* Section 2: Advocate Legal Opinion */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-black">
            <div>2) ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ :-</div>
            <div>ದಿನಾಂಕ: {applicationDate}</div>
          </div>

          <div className="text-[12px] leading-[1.9] text-justify text-black indent-6">
            ಮೃತ ಸದಸ್ಯರ <strong>{relationship}</strong>ನಾದ <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ಇವರು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳು ಕಾರ್ಖಾನೆಯ ಉಪ ನಿಯಮ 19(6) ಹಾಗೂ ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 24ರ ಪ್ರಕಾರ ನಿಯಮಾನುಸಾರ ಪರಿಶೀಲಿಸಲಾಗಿ ಸರಿ ಇರುತ್ತವೆ.
          </div>

          <div className="flex justify-end pt-5 pr-4 text-xs font-bold text-black text-center">
            <div>
              <div>(ಶ್ರೀ ಸುನಿಲ್ ಕುಲಕರ್ಣಿ)</div>
              <div className="font-normal text-[11px]">ವಕೀಲರು ಹಾಗೂ ಕಾನೂನು ಸಲಹೆಗಾರರು, ಇಂಡಿ</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">10</div>
    </div>
  );

  // =========================================================================
  // PAGE 11: SCHEDULE-‘A’ (Producer Member Agreement for land retention)
  // =========================================================================
  const renderPage11 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Times_New_Roman',serif] box-border relative">
      <div>
        {renderHeaderBox()}

        <div className="text-xs font-bold text-black mb-2 font-sans">
          ದಿನಾಂಕ: -{applicationDate}
        </div>

        {/* Centered Schedule Box */}
        <div className="flex justify-center my-2">
          <div className="border-[2px] border-black p-0.5 bg-white inline-block">
            <div className="border border-black px-10 py-1 bg-white text-center">
              <span className="text-[16px] font-bold text-black tracking-widest font-serif">
                SCHEDULE-‘A’
              </span>
            </div>
          </div>
        </div>

        {/* Heading Statement */}
        <div className="text-center font-bold text-[12.5px] leading-snug text-black my-3 px-2">
          Form of agreement to be executed by a producer member of Co-operative sugar Factory for retention and non alienation and charging of lands owned by him in the area of operation of the factory.
        </div>

        {/* Recital 1 */}
        <div className="text-[12px] leading-[1.8] text-justify text-black mb-3">
          <p className="indent-6">
            And agreement made on this <strong>{applicationDate}</strong> date between <strong>Shri/ Smt:- <span className="font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] underline font-bold">{heirNameRaw}</span> Place:<span className="font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] underline font-bold">{heirPlace}</span> Taluk:<span className="font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] underline font-bold">{heirTaluk}</span> Dist:<span className="font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] underline font-bold">{heirDistrict}</span></strong> (here in after called the producer member which expression shall be deemed to include his/ her executors and assings) of the one part and <strong>The Bhimashankar Sahakari Sakkare Karkhane Niyamit. Maragur Taluk Chadachan Dist:- Vijayapur</strong> a Co-operative Society registered under section 7(1) of the Karnataka Co-operative Societies Act 1959 & having its Registered office at Maragur Taluk Chadachan Dist:- Vijayapur (herein after called the factory with expression shall include its assigns) on the other part.
          </p>
        </div>

        {/* Recital 2 */}
        <div className="text-[12px] leading-[1.8] text-justify text-black mb-3">
          <p className="indent-6">
            Where as the producer member is the owner of the land described in the schedule here to attached where as he/she is a member of the factory & the factory has allotted him/her Share No: <strong className="underline font-mono">{shareNo}</strong> ‘<strong>{cleanCategory}</strong>’ Class “<strong className="underline font-mono">{noOfShares}</strong>” shares of the face value of Rs.{faceValue}/- each and where as the said producer member has agreed to be governed by the bye-laws of the factory.
          </p>
        </div>

        {/* Agreement Clauses */}
        <div className="text-[11.8px] leading-[1.75] text-justify text-black space-y-2 mb-4">
          <div className="font-bold">Now this agreement witness the are follows :-</div>
          <div className="pl-4 space-y-2">
            <div>
              1. The producer member shall & will during the subsistence of this agreement at his own cost charges & expenses keep and maintain the said land in cultivable condition and shall supply sugar cane grown by him/ her to the factory in the manner prescribed in the bye-law No.6(A)
            </div>
            <div>
              2. That the producer member during the subsistence of this agreement shall and will retain his/ her own name & tital shall & will not alienate or create any charge or interest in the said lands specified below except such charges or interest in favour of any Co-operative society or of Government which he/ she may have created thereafter for securing finances for purpose of cultivation or improvements of the said land Neither shall be / she alienate the said lands in any other manner.
            </div>
            <div>
              3. That the provided for in the Bye laws of the factory the producer member in the even of his/ her committing any breach in due observance of this agreement at any time during the subsistence of this agreement will be liable to.
              <div className="pl-4 pt-1 space-y-1">
                <div>a) Immediate cessation of all his/ her rights an previleges as the member including more specifically the rights or previlege of tendering to the factory sugar cane grown by him/ her.</div>
                <div>b) Forfeiture of share held by him/ her in the society.</div>
                <div>c) Expulsion from membership of the society and</div>
                <div>d) Payment of penalty as may be decided by the Board.</div>
              </div>
            </div>
          </div>
        </div>

        {/* In witness whereof */}
        <div className="text-[11.5px] leading-relaxed text-justify text-black mb-6">
          In Witness where of the producer member has set his/ her hand and the common seal of the factory has been here to affixed and two members of the Board of Directors and the Managing Director of the factory have herewith set hands on the date aforementioned.
        </div>

        {/* Farmer Signature */}
        <div className="flex justify-end pr-10 pt-4 text-xs font-bold text-black">
          <div className="text-center space-y-1">
            <div className="font-bold text-sm">Farmer Signature</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2 font-sans">11</div>
    </div>
  );

  // =========================================================================
  // PAGE 12: ಆಡಳಿತ ಮಂಡಳಿಯ ಸಭೆಯಲ್ಲಿ ಮಂಡಿಸಲು ಅನುಮತಿ (Final Board Placement Note)
  // =========================================================================
  const renderPage12 = () => (
    <div className="varasa-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative">
      <div>
        {renderHeaderBox()}

        {/* Header Bar */}
        <div className="flex justify-between items-center text-xs font-bold text-black mb-2">
          <div>ಸಲ್ಲಿಸಲಾಗಿದೆ :-</div>
          <div>ದಿನಾಂಕ: {applicationDate}</div>
        </div>

        <div className="text-xs font-bold text-black mb-1">
          ಮಾನ್ಯರೇ,
        </div>

        {/* Subject */}
        <div className="text-center font-bold text-[12.5px] text-black my-2">
          ವಿಷಯ:-“ ಕಾರ್ಖಾನೆಯ ಮೃತ ಸದಸ್ಯರ ಶೇರನ್ನು ನೇರ ವಾರಸುದಾರರಿಗೆ ವಾರಸಾ ಮಾಡುವ ಸಲುವಾಗಿ ಮುಂಬರುವ ಆಡಳಿತ ಮಂಡಳಿಯ ಸಭೆಯಲ್ಲಿ ಮಂಡಿಸಲು ಅನುಮತಿ ನೀಡುವ ಕುರಿತು”
        </div>

        {/* Body Paragraph */}
        <div className="text-[12.5px] leading-relaxed text-justify text-black mb-2.5">
          <p className="indent-6">
            ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ದಿವಂಗತ. {shareholderName} ಸಾ: {shareholderPlace} ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲಾ: {shareholderDistrict}</strong> ಇವರು ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ: <strong>{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ದಿನಾಂಕ: <strong>{dod}</strong> ರಂದು ಮೃತರಾದ ಪ್ರಯುಕ್ತ, ಮೃತ ಸದಸ್ಯರ <strong>{relationship}</strong> ನಾದ <strong>{heirName} ಸಾ: {heirPlace} ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲಾ: {heirDistrict}</strong> ರವರು ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ಈ ಕೆಳಕಂಡ ದಾಖಲಾತಿಗಳೊಂದಿಗೆ ಶೇರು ವಾರಸಾ ಮಾಡಲು ತಮ್ಮ ಅರ್ಜಿ ದಿನಾಂಕ: <strong>{applicationDate}</strong> ರಲ್ಲಿ ವಿನಂತಿಸಿಕೊಂಡಿರುತ್ತಾರೆ.
          </p>
        </div>

        {/* Received Documents Box (11 items) */}
        <div className="border-[1.5px] border-black p-2.5 my-2 text-[11.2px] leading-relaxed text-black">
          <div className="text-center font-bold underline mb-1.5 text-xs">-:: ಪಡೆದ ದಾಖಲಾತಿಗಳ ವಿವರ ::-</div>
          <div className="space-y-0.5">
            <div>1) ಶೇರು ವಾರಸಾ ಸಲುವಾಗಿ ವಾರಸುದಾರರು ಸಲ್ಲಿಸಿದ ವಿನಂತಿ ಅರ್ಜಿ. (Application)</div>
            <div>2) ವಾರಸಾ ಸಲುವಾಗಿ ಶೇರು ಫೀ & ಪ್ರವೇಶ ಫೀ ರೂ:<strong>{fees}</strong>/-ಭರಣಾ ಮಾಡಿದ ಮೂಲ ಪ್ರತಿ. (Fee Receipt)</div>
            <div>3) ಮರಣ ಉತ್ತರ ದೃಢೀಕರಣ(ಅಟೆಸ್ಟೆಡ್) ಪ್ರತಿ. (Death Certificate)</div>
            <div>4) ಉತ್ತರ ಜೀವಿತ ಪ್ರಮಾಣ ಪತ್ರ ದೃಢೀಕರಣ(ಅಟೆಸ್ಟೆಡ್) ನಕಲು ಪ್ರತಿ. (Succession Certificate- Obtain a Legal Heir Certificate)</div>
            <div>5) ಮೃತರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಹಾಗು ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ <strong>ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ</strong> (No Dues Certificate)</div>
            <div>6) ಕಾರ್ಖಾನೆಯ ಶೇರು ಹೊಂದಿದ ಬಗ್ಗೆ ಸರ್ಟಿಫಿಕೇಟ / ಗುರುತಿನ ಪತ್ರ/ಇತರೇ ದಾಖಲಾತಿಗಳು</div>
            <div>7) ವಾರಸಾ ಮಾಡುವುದಕ್ಕಾಗಿ ರೂ:100/-ಬಾಂಡ ಮೇಲೆ ಮೃತರ ಕುಟುಂಬದ ಎಲ್ಲ ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆ ಪತ್ರ (All Family)</div>
            <div>8) ಕುಟುಂಬದ ಎಲ್ಲ ವಾರಸುದಾರರ ಆಧಾರ ಕಾರ್ಡ ದೃಢೀಕೃತ(ಅಟೆಸ್ಟೆಡ್) ಪ್ರತಿ.</div>
            <div>9) ಕಾರ್ಖಾನೆಯ ಕ್ಷೇತ್ರ ಸಿಬ್ಬಂಧಿಯ(FA) ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ.</div>
            <div>10) ಕಾರ್ಖಾನೆಯ ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ.</div>
            <div>11) ಕಾರ್ಖಾನೆಯ ಇಬ್ಬರು ನಿರ್ದೇಶಕರಿಂದ ವಾರಸಾ ಸಲುವಾಗಿ ಅರ್ಜಿಗೆ ಲಗತ್ತಿಸಿದ ಎಲ್ಲ ದಾಖಲಾತಿಗಳನ್ನು ಪರಿಶೀಲನೆ ಮಾಡಿ ಶಿಫಾರಸ್ಸು ಮಾಡಿರುವ ಪತ್ರ</div>
          </div>
        </div>

        {/* Submission Note */}
        <div className="text-[12px] leading-relaxed text-justify text-black my-2">
          ಮೇಲ್ಕಾಣಿಸಿದ ಕಾರ್ಖಾನೆಯ ಮೃತ ಸದಸ್ಯರ ವಾರಸುದಾರರು ಪೂರೈಸಿದ ಎಲ್ಲ ದಾಖಲಾತಿಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಸರಿ ಇರುವ ಬಗ್ಗೆ ಕಾರ್ಖಾನೆಯ ಕಾನೂನು ಸಲಹೆಗಾರರು ದಿನಾಂಕ: _____ / _____ /2022 ರನ್ವಯ ವರದಿ ನೀಡಿದ್ದು, ಕಾರಣ, ಸದರ ಶೇರನ್ನು ವಾರಸಾ ಮಾಡಲು ಕಾರ್ಖಾನೆಯ ಮುಂಬರುವ ಆಡಳಿತ ಮಂಡಳಿಯ ಸಭೆಯಲ್ಲಿ ಮಂಡಿಸಲು ಅನುಮತಿಗಾಗಿ ಹಾಗೂ ಮುಂದಿನ ಕ್ರಮಕ್ಕಾಗಿ ಮೆ:ರವರಲ್ಲಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.
        </div>

        {/* Approved Stamp / Text */}
        <div className="text-right pr-8 my-2">
          <span className="font-bold text-sm text-black">“ಅನುಮೋದಿಸಿದೆ”</span>
        </div>

        {/* 4-Tier Signatures Hierarchy */}
        <div className="flex justify-between items-end px-2 pt-10 text-xs font-bold text-black text-center">
          <div className="space-y-1">
            <div className="w-24 border-t border-black pt-1">ಗುಮಾಸ್ತ</div>
          </div>
          <div className="space-y-1">
            <div className="w-28 border-t border-black pt-1">ಶೇರ ಇನ್‌ಚಾರ್ಜ</div>
          </div>
          <div className="space-y-1">
            <div className="w-28 border-t border-black pt-1">ಕಛೇರಿ ಅಧೀಕ್ಷಕರು</div>
          </div>
          <div className="space-y-1">
            <div className="w-32 border-t border-black pt-1">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">12</div>
    </div>
  );

  return (
    <>
      {/* Print Specific CSS to guarantee exact 12 A4 pages without blank pages */}
      <style>{`
        @media screen {
          .varasa-print-portal {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body.varasa-printing > #root {
            display: none !important;
            visibility: hidden !important;
          }
          body.varasa-printing .shareholder-record-print-portal,
          body.varasa-printing .id-card-profile-print-portal,
          body.varasa-printing .office-note-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
          body.varasa-printing {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.varasa-printing > .varasa-print-portal,
          body.varasa-printing .varasa-print-portal {
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
          body.varasa-printing .varasa-a4-page {
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
          body.varasa-printing .varasa-a4-page:last-child {
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Screen Modal Dialog */}
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
                  <span>ಶೇರು ವಾರಸಾ ದಾಖಲಾತಿ ಕಡತ (Varasa 12-Page Complete Bundle)</span>
                  {isNewSubmission && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Newly Submitted)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ಕಾನೂನುಬದ್ಧ 12 ಪುಟಗಳ ಅಧಿಕೃತ ವಾರಸುದಾರರ ದಾಖಲಾತಿ ಪತ್ರಗಳು (A4 Format)
                </p>
              </div>
            </div>

            {/* Action Buttons & Dynamic Persons Count Selector */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Dynamic Family Members / Persons Counter */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs shadow-inner">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-300 font-semibold whitespace-nowrap">ವಾರಸುದಾರರ ಸಂಖ್ಯೆ:</span>
                <button
                  type="button"
                  onClick={() => setPersonsCount(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold flex items-center justify-center cursor-pointer transition-all"
                  title="Decrease person rows"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-emerald-400 font-mono text-sm">
                  {personsCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPersonsCount(prev => Math.min(15, prev + 1))}
                  className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold flex items-center justify-center cursor-pointer transition-all"
                  title="Increase person rows"
                >
                  +
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                title="ಮುದ್ರಿಸಿ (Print Document)"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 12 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
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

          {/* Page Tabs (Scrollable across 12 pages) */}
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
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 12 ಪುಟಗಳು (All 12 Pages)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p1')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p1' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 1: ವಾರಸಾ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p2')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p2' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 2: ಟ್ರಾನ್ಸಾಕ್ಷನ್ (Photos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p3')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p3' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 3: ಫೀ ಭರಣಾ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p4')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p4' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 4: ಕಛೇರಿ ಟಿಪ್ಪಣಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p5')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p5' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 5: ಫೋಟೋ & ಸಹಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p6')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p6' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 6: ID ಕಾರ್ಡ್ ಅರ್ಜಿ (Photo)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p7')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p7' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 7: ನಿರ್ದೇಶಕರ ಪತ್ರ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p8')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p8' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 8: ಕ್ಷೇತ್ರ ಚೌಕಾಸಿ ({page8Count} ಸಾಲು)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p9')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p9' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 9: ಕ್ಷೇತ್ರ ಚೌಕಾಸಿ (ಮುಂದುವರಿಕೆ & ಸಾಕ್ಷಿ)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p10')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p10' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 10: Legal Opinion
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p11')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p11' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 11: Schedule ‘A’
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p12')}
              className={`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p12' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 12: ಆಡಳಿತ ಮಂಡಳಿ ಅನುಮೋದನೆ
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
            ) : (
              <div className="w-full max-w-[790px]">{renderPage12()}</div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              ವರ್ಗಾವಣೆ ID: <strong className="text-purple-400 font-mono">{v.transfer_id || `VAR-${v.id}`}</strong>
              {' • ಶೇರು ನಂ: '}
              <strong className="text-emerald-400 font-mono">#{shareNo}</strong>
              {v.receipt_no ? ` • ರಶೀದಿ: #${v.receipt_no}` : ''}
              {' • ವಾರಸುದಾರರು: '}
              <strong className="text-amber-400 font-mono">{personsCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 12 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
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
        <div className="varasa-print-portal">
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
          ) : (
            renderPage12()
          )}
        </div>,
        document.body
      )}
    </>
  );
}
