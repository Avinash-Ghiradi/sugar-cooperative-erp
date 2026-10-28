import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, ChevronRight, Layers, UserCheck } from 'lucide-react';

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

// Full English/Kannada mixed date like "28 October 2026"
function formatLongDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return String(dateStr);
}

export default function VarasaPrintModal({ isOpen, onClose, varasaData, isNewSubmission = false }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1', 'p2', 'p3', 'p4', 'p5'
  const logoSrc = './id_assets/bsskn_logo.png';

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
  const photo = v.heir_photo || v.photo || null;

  const handlePrint = () => {
    document.body.classList.add('varasa-printing');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Reusable Header Box for all 5 pages
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
  // PAGE 1: ಶೇರು ವಾರಸಾ ಅರ್ಜಿ - 1
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
  // PAGE 2: Share Varasha Transation Details
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

        {/* Table 2: Name & Address Details */}
        <table className="w-full border-[1.5px] border-black text-xs text-left mb-2.5">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100 text-center">
              <th className="w-1/2 p-1.5 border-r border-black">ಮೃತ ಶೇರು ಸದಸ್ಯರ ಹೆಸರು & ವಿಳಾಸ</th>
              <th className="w-1/2 p-1.5">ಶೇರು ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border-r border-black align-top space-y-1 text-[12px]">
                <div className="font-bold">ದಿ. {shareholderName}</div>
                <div>ಸಾ :- {shareholderPlace}</div>
                <div>ತಾಲೂಕ: {shareholderTaluk} ಜಿಲ್ಲೆ: {shareholderDistrict}</div>
                <div>ಆಧಾರ್ ಸಂಖ್ಯೆ:- {shareholderAadhaar || '—'}</div>
                <div>ಮೊಬೈಲ್ ನಂ:- —</div>
              </td>
              <td className="p-2 align-top space-y-1 text-[12px]">
                <div className="font-bold">{heirName}</div>
                <div>ಸಾ :- {heirPlace}</div>
                <div>ತಾಲೂಕ: {heirTaluk} ಜಿಲ್ಲೆ: {heirDistrict}</div>
                <div>ಆಧಾರ್ ಸಂಖ್ಯೆ:- {heirAadhaar || '—'}</div>
                <div>ಮೊಬೈಲ್ ನಂ:- <strong className="font-bold font-mono">{heirMobile}</strong></div>
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

  return (
    <>
      {/* Print Specific CSS to guarantee exact 5 A4 pages without blank pages */}
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
                  <span>ಶೇರು ವಾರಸಾ ಅರ್ಜಿ ಮುದ್ರಣ (Varasa Application Bundle)</span>
                  {isNewSubmission && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Newly Submitted)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ಅಧಿಕೃತ 5 ಪುಟಗಳ ವಾರಸುದಾರರ ದಾಖಲಾತಿ ಪತ್ರಗಳು (A4 Format)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                title="ಮುದ್ರಿಸಿ (Print Document)"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 5 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
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
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-1.5 text-xs font-semibold overflow-x-auto">
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
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p1'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 1: ವಾರಸಾ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p2')}
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p2'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 2: ಟ್ರಾನ್ಸಾಕ್ಷನ್ ವಿವರ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p3')}
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p3'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 3: ಫೀ ಭರಣಾ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p4')}
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p4'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 4: ಕಛೇರಿ ಟಿಪ್ಪಣಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p5')}
              className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'p5'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ಪುಟ 5: ಫೋಟೋ & ಮಾದರಿ ಸಹಿ
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
              ವರ್ಗಾವಣೆ ID: <strong className="text-purple-400 font-mono">{v.transfer_id || `VAR-${v.id}`}</strong>
              {' • ಶೇರು ನಂ: '}
              <strong className="text-emerald-400 font-mono">#{shareNo}</strong>
              {v.receipt_no ? ` • ರಶೀದಿ: #${v.receipt_no}` : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 5 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
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
