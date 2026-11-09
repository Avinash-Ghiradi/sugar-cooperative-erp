import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { ApiService } from '../../services/api';
import { getCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import officialCircleData from '../../services/officialCircleData.json';
import {
  Printer, X, Tag, Settings, ChevronLeft, ChevronRight, Eye, Check, Sliders,
  QrCode, Sparkles, RefreshCw, Layers
} from 'lucide-react';

// Format Pincode with space: "586118" -> "586 118"
export function formatPincode(pin) {
  if (!pin) return '';
  const digits = String(pin).replace(/\D/g, '');
  if (digits.length === 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return String(pin).trim();
}

// Clean Place Name helper
export function cleanPlace(p) {
  if (!p || typeof p !== 'string') return '';
  let str = p.trim().replace(/\([^)]*\)/g, '').trim();
  if (str.includes(',')) {
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (!/^[\d\/\-\#\s]+$/.test(part) && !/ಹತ್ತಿರ|ಬಳಿ|ಎದುರು|ಹತ್ತರ|ಸಮೀಪ|near|opp/i.test(part)) {
        str = part;
        break;
      }
    }
  }
  return str.replace(/^[\d\/\-\#\,\s]+/, '').trim();
}

// Intelligent Address and Taluk Resolver matching official records
export function resolveShareholderAddress(s, defaultTaluk = '', defaultDistrict = 'ವಿಜಯಪುರ', defaultPincode = '') {
  const rawPlace = (s.place || s.village_name || '').trim();
  const cPlace = cleanPlace(rawPlace) || rawPlace;

  // Search officialCircleData
  const match = Array.isArray(officialCircleData)
    ? officialCircleData.find(c => {
        const cAddr = (c.address || '').trim().toLowerCase();
        return cAddr === cPlace.toLowerCase() || cAddr === rawPlace.toLowerCase();
      })
    : null;

  // Determine Taluk
  let taluk = s.taluk || (match && match.taluk) || '';
  if (!taluk) {
    if (cPlace === 'ಅಸ್ಕಿ') taluk = 'ಸಿಂದಗಿ';
    else if (['ಅಗರಖೇಡ', 'ಅಂಜುಟಿಗಿ', 'ಬಬಲೇಶ್ವರ', 'ಲಚ್ಯಾಣ', 'ಮಾರಗೂರ', 'ಹಿಟ್ನಳ್ಳಿ', 'ರೋಡಗಿ'].includes(cPlace)) taluk = 'ಇಂಡಿ';
    else if (['ಅಗಸನಾಳ', 'ಜೇವೂರ', 'ಚಡಚಣ', 'ಹಾವಿನಾಳ', 'ಉಮರಾಣಿ'].includes(cPlace)) taluk = 'ಚಡಚಣ';
    else if (['ಬಚನಾಳ', 'ಕುಂಬಾರಹಳ್ಳಿ', 'ಮಲಘಾಣ', 'ಆಲಮೇಲ', 'ದೇವಣಗಾಂವ'].includes(cPlace)) taluk = 'ಸಿಂದಗಿ';
    else taluk = defaultTaluk || 'ಸಿಂದಗಿ';
  }

  // Determine District
  const district = s.district || (match && match.district) || defaultDistrict || 'ವಿಜಯಪುರ';

  // Determine Pincode
  let pin = s.pincode || s.pin_code || (match && match.pincode) || '';
  if (!pin) {
    if (cPlace === 'ಅಸ್ಕಿ' || taluk === 'ಸಿಂದಗಿ') pin = '586118';
    else if (taluk === 'ಚಡಚಣ') pin = '586204';
    else if (taluk === 'ಇಂಡಿ') pin = '586209';
    else pin = defaultPincode || '586118';
  }

  return {
    place: rawPlace || cPlace || '—',
    taluk: taluk || defaultTaluk || 'ಸಿಂದಗಿ',
    district: district || defaultDistrict || 'ವಿಜಯಪುರ',
    pincode: formatPincode(pin)
  };
}

// Format Name with prefix
export function formatNameWithPrefix(name, prefix = 'ಶ್ರೀ/ಶ್ರೀಮತಿ') {
  if (!name) return '—';
  const clean = name.trim();
  if (clean.startsWith('ಶ್ರೀ/ಶ್ರೀಮತಿ') || clean.startsWith('/ಶ್ರೀಮತಿ') || clean.startsWith('ಶ್ರೀ') || clean.startsWith('ಶ್ರೀಮತಿ') || clean.startsWith('ಡಾ||') || clean.startsWith('ಡಾ|')) {
    return clean;
  }
  return prefix ? `${prefix} ${clean}` : clean;
}

// QR Code In-Memory Cache
const qrCache = new Map();

export async function generateShareholderQRDataUrl(shareNo, payloadType = 'url') {
  const cleanNo = String(shareNo || '0').trim();
  const payload = payloadType === 'plain'
    ? cleanNo
    : `https://avinash-ghiradi.github.io/sugar-cooperative-erp/?attn=${encodeURIComponent(cleanNo)}`;

  const cacheKey = `${payloadType}_${cleanNo}`;
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey);
  }

  try {
    const url = await QRCode.toDataURL(payload, {
      margin: 1,
      width: 160,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    qrCache.set(cacheKey, url);
    return url;
  } catch (err) {
    console.warn('QR code gen error:', err);
    return '';
  }
}

export default function BookStickerModal({
  isOpen,
  onClose,
  shareholders = [],
  user = null,
  filterDescription = ''
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [startPosition, setStartPosition] = useState(1); // 1 to 10
  const [showLogo, setShowLogo] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true); // Mandatory QR for General Board Meeting
  const [qrPayloadType, setQrPayloadType] = useState('url'); // 'url' (Scans to Attendance) or 'plain' (Raw Share No)
  const [srNoMode, setSrNoMode] = useState('sequential'); // 'sequential', 'original', 'blank'
  const [namePrefix, setNamePrefix] = useState('ಶ್ರೀ/ಶ್ರೀಮತಿ');
  const [defaultTaluk, setDefaultTaluk] = useState('');
  const [defaultDistrict, setDefaultDistrict] = useState('ವಿಜಯಪುರ');
  const [defaultPincode, setDefaultPincode] = useState('');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [qrCodeMap, setQrCodeMap] = useState(new Map());
  const [qrLoading, setQrLoading] = useState(false);

  // Exact statutory sticker sheet specifications
  const STICKER_WIDTH = '9.8cm';
  const STICKER_HEIGHT = '5.6cm';
  const PAGE_TOP_BOTTOM_MARGIN = '0.5cm';
  const stickersPerPage = 10; // Exactly 2 columns x 5 rows

  // Auto-detect dominant place and taluk from filtered list
  useEffect(() => {
    if (Array.isArray(shareholders) && shareholders.length > 0) {
      const firstPlace = cleanPlace(shareholders[0].place || shareholders[0].village_name || '');
      if (firstPlace === 'ಅಸ್ಕಿ') {
        setDefaultTaluk('ಸಿಂದಗಿ');
        setDefaultPincode('586 118');
      } else {
        const addr = resolveShareholderAddress(shareholders[0]);
        if (addr.taluk) setDefaultTaluk(addr.taluk);
        if (addr.pincode) setDefaultPincode(addr.pincode);
      }
    }
  }, [shareholders]);

  // Pre-generate QR codes for scannable attendance in General Board Meeting
  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !Array.isArray(shareholders) || shareholders.length === 0) return;

    async function generateAllQRs() {
      setQrLoading(true);
      const newMap = new Map();

      // Process in batches of 25 for 0ms UI lag
      const batchSize = 25;
      for (let i = 0; i < shareholders.length; i += batchSize) {
        if (!isMounted) return;
        const slice = shareholders.slice(i, i + batchSize);
        await Promise.all(
          slice.map(async (s) => {
            const shareNo = s.share_no || s.share_number || '';
            if (shareNo) {
              const url = await generateShareholderQRDataUrl(shareNo, qrPayloadType);
              newMap.set(String(shareNo), url);
            }
          })
        );
      }

      if (isMounted) {
        setQrCodeMap(new Map(newMap));
        setQrLoading(false);
      }
    }

    generateAllQRs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, shareholders, qrPayloadType]);

  // Total pages calculation
  const totalStickers = shareholders.length;
  const emptyOffset = Math.max(0, startPosition - 1);
  const totalSlots = totalStickers + emptyOffset;
  const totalPages = Math.max(1, Math.ceil(totalSlots / stickersPerPage));

  // Resolved sticker items
  const stickerData = useMemo(() => {
    return shareholders.map((s, idx) => {
      const shareNo = s.share_no || s.share_number || '';
      const name = s.shareholder_name || s.name || '';
      const addr = resolveShareholderAddress(s, defaultTaluk, defaultDistrict, defaultPincode);
      const qrDataUrl = qrCodeMap.get(String(shareNo)) || '';

      return {
        id: s.id || `sh-${idx}`,
        originalIndex: idx + 1,
        shareNo,
        name: formatNameWithPrefix(name, namePrefix),
        place: addr.place,
        taluk: addr.taluk,
        district: addr.district,
        pincode: addr.pincode,
        qrDataUrl
      };
    });
  }, [shareholders, defaultTaluk, defaultDistrict, defaultPincode, namePrefix, qrCodeMap]);

  // Current page items
  const currentPageItems = useMemo(() => {
    const pageSlots = [];
    const startIndex = (currentPage - 1) * stickersPerPage;

    for (let slot = 0; slot < stickersPerPage; slot++) {
      const globalSlotIndex = startIndex + slot;
      if (currentPage === 1 && slot < emptyOffset) {
        pageSlots.push({ isBlank: true, slotNo: slot + 1 });
      } else {
        const itemIndex = globalSlotIndex - emptyOffset;
        if (itemIndex >= 0 && itemIndex < stickerData.length) {
          pageSlots.push({
            isBlank: false,
            slotNo: slot + 1,
            data: stickerData[itemIndex],
            sequentialNo: itemIndex + 1
          });
        }
      }
    }
    return pageSlots;
  }, [currentPage, stickersPerPage, emptyOffset, stickerData]);

  if (!isOpen) return null;

  // Print execution method matching 9.8cm x 5.6cm and 0.5cm top/bottom margin
  const handlePrint = (printSinglePage = false) => {
    try {
      const companyLogoUrl = getCompanyLogo() || DEFAULT_LOGO_PATH;

      // Log print action to audit logs
      ApiService.logPrintAction({
        documentType: 'BOOK_STICKERS_PRINT',
        recordId: `STICKERS-AGM-${totalStickers}`,
        description: `ಸಾಮಾನ್ಯ ಸಭೆ (AGM) ಸ್ಕ್ಯಾನಿಂಗ್ ಕ್ಯೂಆರ್ ಕೋಡ್ ಸಹಿತ ${totalStickers} ಶೇರುದಾರರ ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳ ಮುದ್ರಣ (ಅಳತೆ: 9.8cm × 5.6cm, ಮಾರ್ಜಿನ್: 0.5cm)`,
        details: {
          count: totalStickers,
          pages: totalPages,
          hasQrCode: showQrCode,
          dimensions: '9.8cm x 5.6cm',
          margins: '0.5cm',
          filterDescription
        },
        operator: user?.name || 'Admin'
      }).catch(err => console.warn('Audit log warning:', err));

      const pagesToPrint = printSinglePage ? [currentPage] : Array.from({ length: totalPages }, (_, i) => i + 1);

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Book Stickers with AGM QR Code - ${totalStickers} Shareholders</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin-top: ${PAGE_TOP_BOTTOM_MARGIN};
      margin-bottom: ${PAGE_TOP_BOTTOM_MARGIN};
      margin-left: 0.6cm;
      margin-right: 0.6cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Noto Sans Kannada', 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
    }
    .sticker-page {
      width: 100%;
      height: 28.7cm;
      max-height: 28.7cm;
      display: grid;
      grid-template-columns: ${STICKER_WIDTH} ${STICKER_WIDTH};
      grid-template-rows: repeat(5, ${STICKER_HEIGHT});
      column-gap: 0.2cm;
      row-gap: 0.175cm;
      justify-content: center;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
    }
    .sticker-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .sticker-card {
      width: ${STICKER_WIDTH};
      height: ${STICKER_HEIGHT};
      max-width: ${STICKER_WIDTH};
      max-height: ${STICKER_HEIGHT};
      border: 1.2px solid #000000;
      border-radius: 9px;
      padding: 6px 10px 5px 10px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      overflow: hidden;
    }
    .sticker-card.blank {
      border: 1px dashed #d1d5db;
      background: transparent;
    }
    .sticker-top-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      height: 34px;
    }
    .sticker-logo-box {
      width: 44px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .sticker-logo {
      max-width: 44px;
      max-height: 34px;
      object-fit: contain;
    }
    .sticker-numbers {
      text-align: right;
      font-family: 'Noto Sans Kannada', Arial, sans-serif;
    }
    .sticker-srno {
      font-size: 11px;
      font-weight: 600;
      line-height: 1.2;
      color: #000000;
    }
    .sticker-shareno {
      font-size: 13.5px;
      font-weight: 700;
      line-height: 1.3;
      color: #000000;
    }
    .sticker-main-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-top: 1px;
      flex: 1;
    }
    .sticker-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5px;
      min-width: 0;
    }
    .sticker-name {
      font-size: 12.5px;
      font-weight: 700;
      color: #000000;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sticker-post {
      font-size: 11.5px;
      font-weight: 600;
      color: #000000;
      line-height: 1.25;
    }
    .sticker-taluk-dist {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 600;
      color: #000000;
      line-height: 1.25;
    }
    .sticker-pin {
      font-size: 11px;
      font-weight: 600;
      color: #000000;
      line-height: 1.25;
    }
    .sticker-qr-box {
      width: 78px;
      height: 90px;
      border: 1px solid #000000;
      border-radius: 6px;
      padding: 2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      shrink: 0;
      box-sizing: border-box;
    }
    .sticker-qr-badge {
      font-size: 7.5px;
      font-weight: 700;
      color: #000000;
      text-transform: uppercase;
      line-height: 1;
      text-align: center;
    }
    .sticker-qr-img {
      width: 66px;
      height: 66px;
      object-fit: contain;
    }
    .sticker-qr-sub {
      font-size: 8px;
      font-family: monospace;
      font-weight: 700;
      color: #000000;
      line-height: 1;
      text-align: center;
    }
  </style>
</head>
<body>`;

      pagesToPrint.forEach(pg => {
        html += `<div class="sticker-page">`;
        const startSlot = (pg - 1) * stickersPerPage;

        for (let slot = 0; slot < stickersPerPage; slot++) {
          const globalSlotIndex = startSlot + slot;
          if (pg === 1 && slot < emptyOffset) {
            html += `<div class="sticker-card blank"></div>`;
          } else {
            const itemIdx = globalSlotIndex - emptyOffset;
            if (itemIdx >= 0 && itemIdx < stickerData.length) {
              const item = stickerData[itemIdx];
              let srNoText = '';
              if (srNoMode === 'sequential') {
                srNoText = `Sr.No.: ${itemIdx + 1}`;
              } else if (srNoMode === 'original') {
                srNoText = `Sr.No.: ${item.originalIndex}`;
              } else {
                srNoText = `Sr.No.:`;
              }

              const qrUrl = item.qrDataUrl || qrCodeMap.get(String(item.shareNo)) || '';

              html += `
              <div class="sticker-card">
                <div class="sticker-top-row">
                  <div class="sticker-logo-box">
                    ${showLogo ? `<img src="${companyLogoUrl}" class="sticker-logo" alt="Logo" onerror="this.style.display='none'" />` : ''}
                  </div>
                  <div class="sticker-numbers">
                    <div class="sticker-srno">${srNoText}</div>
                    <div class="sticker-shareno">Share No.: ${item.shareNo}</div>
                  </div>
                </div>

                <div class="sticker-main-content">
                  <div class="sticker-details">
                    <div class="sticker-name">${item.name}</div>
                    <div class="sticker-post">ಪೋಸ್ಟ್: ${item.place}</div>
                    <div class="sticker-taluk-dist">
                      <span>ತಾಲೂಕ್: ${item.taluk}</span>
                      <span style="margin-right: 4px;">ಜಿಲ್ಲಾ: ${item.district}</span>
                    </div>
                    <div class="sticker-pin">ಪಿನ್-ಕೋಡ್: ${item.pincode}</div>
                  </div>

                  ${showQrCode && qrUrl ? `
                  <div class="sticker-qr-box">
                    <div class="sticker-qr-badge">ಸಾಮಾನ್ಯ ಸಭೆ</div>
                    <img src="${qrUrl}" class="sticker-qr-img" alt="QR" />
                    <div class="sticker-qr-sub">#${item.shareNo}</div>
                  </div>` : ''}
                </div>
              </div>`;
            } else {
              html += `<div class="sticker-card blank"></div>`;
            }
          }
        }
        html += `</div>`;
      });

      html += `</body></html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow && !printWindow.closed && typeof printWindow.closed !== 'undefined') {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (e) {
            console.error('printWindow.print error:', e);
          }
        }, 500);
      } else {
        alert('ಪಾಪ್-ಅಪ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ (Pop-up blocked). ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಪಾಪ್-ಅಪ್ ಅನುಮತಿಸಿ.');
      }
    } catch (err) {
      console.error('Printing stickers failed:', err);
      alert('ಸ್ಟಿಕ್ಕರ್‌ಗಳ ಮುದ್ರಣದಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ: ' + err.message);
    }
  };

  const companyLogoUrl = getCompanyLogo() || DEFAULT_LOGO_PATH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು ಮುದ್ರಣ (Book Stickers with AGM QR Code)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  ಅಳತೆ: 9.8cm × 5.6cm • ಮಾರ್ಜಿನ್: 0.5cm
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  {totalStickers} ಶೇರುದಾರರು ({totalPages} A4 ಹಾಳೆಗಳು)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {filterDescription || 'ಸಾಮಾನ್ಯ ಸಭೆ (AGM) ಸ್ಕ್ಯಾನಿಂಗ್ ಕ್ಯೂಆರ್ ಕೋಡ್ ಸಹಿತ ಪಾಸ್‌ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು (2 ಕಾಲಂ × 5 ಸಾಲು = 10 ಸ್ಟಿಕ್ಕರ್‌ಗಳು)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showSettingsDrawer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="ಸ್ಟಿಕ್ಕರ್ ಸೆಟ್ಟಿಂಗ್ಸ್, ಕ್ಯೂಆರ್ ಕೋಡ್ & ವಿಳಾಸ ಬದಲಾವಣೆ"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">ಸೆಟ್ಟಿಂಗ್ಸ್</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              title="ಮುಚ್ಚಿ (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Settings Drawer */}
        {showSettingsDrawer && (
          <div className="p-4 bg-slate-950/95 border-b border-slate-800 text-xs space-y-3 shrink-0 animate-fadeIn">
            {/* Top Row: Address Defaults */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  ಡೀಫಾಲ್ಟ್ ತಾಲೂಕು (Taluk)
                </label>
                <input
                  type="text"
                  value={defaultTaluk}
                  onChange={(e) => setDefaultTaluk(e.target.value)}
                  placeholder="ಸಿಂದಗಿ / ಇಂಡಿ / ಚಡಚಣ"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  ಡೀಫಾಲ್ಟ್ ಜಿಲ್ಲೆ (District)
                </label>
                <input
                  type="text"
                  value={defaultDistrict}
                  onChange={(e) => setDefaultDistrict(e.target.value)}
                  placeholder="ವಿಜಯಪುರ"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  ಡೀಫಾಲ್ಟ್ ಪಿನ್ ಕೋಡ್ (PIN Code)
                </label>
                <input
                  type="text"
                  value={defaultPincode}
                  onChange={(e) => setDefaultPincode(e.target.value)}
                  placeholder="586 118"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  ಹೆಸರಿನ ಪೂರ್ವಪ್ರತ್ಯಯ (Prefix)
                </label>
                <input
                  type="text"
                  value={namePrefix}
                  onChange={(e) => setNamePrefix(e.target.value)}
                  placeholder="ಶ್ರೀ/ಶ್ರೀಮತಿ"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Bottom Row: Controls & Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  ಕ್ರಮ ಸಂಖ್ಯೆ (Sr.No.)
                </label>
                <select
                  value={srNoMode}
                  onChange={(e) => setSrNoMode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 outline-none"
                >
                  <option value="sequential">ನಿರಂತರ ಸಂಖ್ಯೆ (1, 2, 3...)</option>
                  <option value="original">ಮೂಲ ಸಾಲು ಸಂಖ್ಯೆ</option>
                  <option value="blank">ಖಾಲಿ (Sr.No.:)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  ಶೀಟ್‌ನಲ್ಲಿ ಆರಂಭ ಸ್ಥಾನ (Start Slot)
                </label>
                <select
                  value={startPosition}
                  onChange={(e) => setStartPosition(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>ಸ್ಥಾನ {n} ರಿಂದ ಆರಂಭಿಸಿ</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span className="flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>ಸಾಮಾನ್ಯ ಸಭೆ QR ಕೋಡ್</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>ಕಾರ್ಖಾನೆ ಲೋಗೋ</span>
                </label>
              </div>
            </div>

            {/* Statutory Dimension Pill */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">
                ✓ ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ಅಳತೆ: ಅಗಲ 9.8cm × ಎತ್ತರ 5.6cm • ಮೇಲಿನ ಮತ್ತು ಕೆಳಗಿನ ಮಾರ್ಜಿನ್ 0.5cm (2 ಕಾಲಂ × 5 ಸಾಲು = 10 ಲೇಬಲ್‌ಗಳು)
              </span>
              {qrLoading && (
                <span className="text-amber-400 flex items-center gap-1.5 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  ಕ್ಯೂಆರ್ ಕೋಡ್ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pagination & Controls Bar */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-200">
              ಪುಟ {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            ತೋರಿಸಲಾಗುತ್ತಿದೆ: {((currentPage - 1) * stickersPerPage) + 1} ರಿಂದ {Math.min(currentPage * stickersPerPage, totalStickers)} (ಒಟ್ಟು {totalStickers} ಶೇರುದಾರರು)
          </div>
        </div>

        {/* Live A4 Sticker Sheet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50 flex justify-center">
          <div className="w-full max-w-4xl bg-white text-black rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-300 select-none">
            {/* The 2 x 5 Grid Container (Matching 9.8cm x 5.6cm layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentPageItems.map((slot, idx) => {
                if (slot.isBlank || !slot.data) {
                  return (
                    <div
                      key={`blank-${idx}`}
                      className="h-34 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-mono"
                    >
                      [ಖಾಲಿ ಸ್ಥಾನ {slot.slotNo}]
                    </div>
                  );
                }

                const item = slot.data;
                let srNoDisplay = '';
                if (srNoMode === 'sequential') {
                  srNoDisplay = `Sr.No.: ${slot.sequentialNo}`;
                } else if (srNoMode === 'original') {
                  srNoDisplay = `Sr.No.: ${item.originalIndex}`;
                } else {
                  srNoDisplay = 'Sr.No.:';
                }

                const qrUrl = item.qrDataUrl || qrCodeMap.get(String(item.shareNo)) || '';

                return (
                  <div
                    key={item.id}
                    className="h-34 rounded-xl border border-black p-2.5 sm:p-3 bg-white flex flex-col justify-between shadow-xs transition-transform hover:scale-101"
                  >
                    {/* Top Row: Logo on Left, Sr.No & Share No on Right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-8 flex items-center justify-start shrink-0">
                        {showLogo && (
                          <img
                            src={companyLogoUrl}
                            alt="Logo"
                            className="max-h-8 max-w-10 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="text-right font-sans">
                        <div className="text-[11px] font-semibold text-black leading-tight">
                          {srNoDisplay}
                        </div>
                        <div className="text-[13px] font-black text-black leading-tight">
                          Share No.: {item.shareNo}
                        </div>
                      </div>
                    </div>

                    {/* Middle Details + Right-side QR Code */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-xs sm:text-[12.5px] font-bold text-black leading-snug truncate">
                          {item.name}
                        </div>
                        <div className="text-[11.5px] font-semibold text-black leading-tight">
                          ಪೋಸ್ಟ್: {item.place}
                        </div>
                        <div className="flex items-center justify-between text-[11.5px] font-semibold text-black leading-tight">
                          <span>ತಾಲೂಕ್: {item.taluk}</span>
                          <span className="mr-1">ಜಿಲ್ಲಾ: {item.district}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-black leading-tight">
                          ಪಿನ್-ಕೋಡ್: {item.pincode}
                        </div>
                      </div>

                      {/* Shareholder General Board Meeting QR Code */}
                      {showQrCode && (
                        <div className="w-18 h-20 border border-black rounded-lg p-1 flex flex-col items-center justify-between bg-white shrink-0">
                          <span className="text-[7.5px] font-black text-black uppercase leading-none">
                            ಸಾಮಾನ್ಯ ಸಭೆ
                          </span>
                          {qrUrl ? (
                            <img src={qrUrl} alt="AGM QR" className="w-14 h-14 object-contain" />
                          ) : (
                            <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                              QR...
                            </div>
                          )}
                          <span className="text-[8px] font-mono font-bold text-black leading-none">
                            #{item.shareNo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            A4 ಅಳತೆಯ ಸ್ವಯಂ-ಅಂಟಿಕೊಳ್ಳುವ ಸ್ಟಿಕ್ಕರ್ ಶೀಟ್ (ಅಗಲ 9.8cm × ಎತ್ತರ 5.6cm, ಮಾರ್ಜಿನ್ 0.5cm) ಮುದ್ರಿಸಲು ಸಿದ್ಧವಾಗಿದೆ.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              ರದ್ದು (Close)
            </button>

            {totalPages > 1 && (
              <button
                type="button"
                onClick={() => handlePrint(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="ಕೇವಲ ಪ್ರಸ್ತುತ ಪುಟವನ್ನು ಮಾತ್ರ ಮುದ್ರಿಸಿ"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>ಪುಟ {currentPage} ಮಾತ್ರ ಮುದ್ರಿಸಿ</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handlePrint(false)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-amber-950/50"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>ಎಲ್ಲಾ {totalStickers} ಸ್ಟಿಕ್ಕರ್‌ಗಳನ್ನು ಮುದ್ರಿಸಿ (Print All)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
