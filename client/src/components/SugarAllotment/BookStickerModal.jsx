import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { ApiService } from '../../services/api';
import { getCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import officialCircleData from '../../services/officialCircleData.json';
import {
  Printer, X, Tag, Settings, ChevronLeft, ChevronRight, Eye, Check, Sliders,
  QrCode, Sparkles, RefreshCw, Layers, Building2, MapPin
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
  if (!s) {
    return {
      place: '—',
      fullAddress: '',
      taluk: defaultTaluk || 'ಸಿಂದಗಿ',
      district: defaultDistrict || 'ವಿಜಯಪುರ',
      pincode: defaultPincode || '586 118',
      mobile: '',
      category: '',
      sharesCount: 1
    };
  }

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

  // Detailed address support (house no, lane, street, nagara, or specific address)
  const rawAddr = (s.address || s.full_address || s.residential_address || '').trim();
  const road = (s.road || s.street || s.nagara || '').trim();
  let fullAddress = '';
  if (rawAddr && rawAddr.toLowerCase() !== rawPlace.toLowerCase() && rawAddr.toLowerCase() !== cPlace.toLowerCase()) {
    fullAddress = rawAddr;
  } else if (road && road.toLowerCase() !== rawPlace.toLowerCase() && road.toLowerCase() !== cPlace.toLowerCase()) {
    fullAddress = road;
  }

  const mobile = (s.mobile_no || s.mobile || s.mobile_number || '').trim();
  const category = (s.schedule_cast || s.category || '').trim();
  const sharesCount = s.number_of_shares || s.share_qty || 1;

  return {
    place: rawPlace || cPlace || '—',
    fullAddress: fullAddress,
    taluk: taluk || defaultTaluk || 'ಸಿಂದಗಿ',
    district: district || defaultDistrict || 'ವಿಜಯಪುರ',
    pincode: formatPincode(pin),
    mobile: mobile,
    category: category,
    sharesCount: sharesCount
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

// QR Code In-Memory Cache with high-DPI 300px resolution
const qrCache = new Map();

export async function generateShareholderQRDataUrl(shareNo, payloadType = 'url') {
  const cleanNo = String(shareNo || '0').trim();
  const payload = payloadType === 'plain'
    ? cleanNo
    : `https://avinash-ghiradi.github.io/sugar-cooperative-erp/?attn=${encodeURIComponent(cleanNo)}`;

  const cacheKey = `${payloadType}_${cleanNo}_v4`;
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey);
  }

  try {
    const url = await QRCode.toDataURL(payload, {
      margin: 1,
      width: 300, // High-DPI for razor-sharp large QR code scanning
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

const DEFAULT_FACTORY_NAME = 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ';
const DEFAULT_FACTORY_SUB = 'ತಾ|| ಇಂಡಿ / ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ - 586204';

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
  const [showFactoryName, setShowFactoryName] = useState(true);
  const [factoryName, setFactoryName] = useState(DEFAULT_FACTORY_NAME);
  const [factorySub, setFactorySub] = useState(DEFAULT_FACTORY_SUB);
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

  // Exact statutory sticker sheet specifications (9.8cm width x 5.6cm height, 0.5cm top/bottom margin)
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

  // Pre-generate QR codes for fast scannable attendance in General Board Meeting
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
        fullAddress: addr.fullAddress,
        taluk: addr.taluk,
        district: addr.district,
        pincode: addr.pincode,
        mobile: addr.mobile,
        category: addr.category,
        sharesCount: addr.sharesCount,
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

  // Print execution method matching 9.8cm x 5.6cm, 0.5cm margin, larger QR code, factory name, and Google Anek Kannada font
  const handlePrint = (printSinglePage = false) => {
    try {
      const companyLogoUrl = getCompanyLogo() || DEFAULT_LOGO_PATH;

      // Log print action to audit logs
      ApiService.logPrintAction({
        documentType: 'BOOK_STICKERS_PRINT',
        recordId: `STICKERS-AGM-${totalStickers}`,
        description: `ಕಾರ್ಖಾನೆ ಹೆಸರು, AGM ಕ್ಯೂಆರ್ ಕೋಡ್ & ಅನೆಕ್ ಕನ್ನಡ ಫಾಂಟ್ ಸಹಿತ ${totalStickers} ಶೇರುದಾರರ ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳ ಮುದ್ರಣ (ಅಳತೆ: 9.8cm × 5.6cm, ಮಾರ್ಜಿನ್: 0.5cm)`,
        details: {
          count: totalStickers,
          pages: totalPages,
          factoryName: showFactoryName ? factoryName : 'Hidden',
          hasQrCode: showQrCode,
          font: 'Anek Kannada',
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
  <title>Book Stickers (${factoryName} - ${totalStickers} Shareholders)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
      font-family: 'Anek Kannada', 'Noto Sans Kannada', sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-feature-settings: "kern" 1;
      text-rendering: optimizeLegibility;
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
      border-radius: 8px;
      padding: 4px 8px 4px 8px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      overflow: hidden;
      font-family: 'Anek Kannada', sans-serif;
    }
    .sticker-card.blank {
      border: 1px dashed #d1d5db;
      background: transparent;
    }
    /* Header Section with Factory Name, Logo, and Numbers */
    .sticker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      width: 100%;
      min-height: 27px;
    }
    .sticker-logo-box {
      width: 32px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-shrink: 0;
    }
    .sticker-logo {
      max-width: 32px;
      max-height: 26px;
      object-fit: contain;
    }
    .sticker-factory-info {
      flex: 1;
      min-width: 0;
      text-align: left;
      line-height: 1.15;
    }
    .sticker-factory-name {
      font-size: 10.5px;
      font-weight: 800;
      color: #000000;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }
    .sticker-factory-sub {
      font-size: 8px;
      font-weight: 600;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sticker-numbers {
      text-align: right;
      flex-shrink: 0;
      line-height: 1.15;
    }
    .sticker-srno {
      font-size: 9.5px;
      font-weight: 700;
      color: #000000;
    }
    .sticker-shareno {
      font-size: 13px;
      font-weight: 800;
      color: #000000;
    }
    .sticker-header-divider {
      width: 100%;
      height: 1px;
      background-color: #000000;
      margin: 2px 0 3px 0;
    }
    /* Main Content Area */
    .sticker-main-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      flex: 1;
      min-height: 0;
    }
    .sticker-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5px;
      min-width: 0;
      text-align: left;
    }
    .sticker-name {
      font-size: 13px;
      font-weight: 800;
      color: #000000;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sticker-full-addr {
      font-size: 10.5px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sticker-post {
      font-size: 12px;
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
    .sticker-pin-mobile {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      color: #000000;
      line-height: 1.25;
    }
    .sticker-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5px;
      font-weight: 700;
      color: #334155;
      margin-top: 1px;
    }
    /* BIGGER QR CODE BOX & OPTICAL CONTRAST */
    .sticker-qr-box {
      width: 100px;
      height: 114px;
      border: 1.2px solid #000000;
      border-radius: 6px;
      padding: 2.5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      flex-shrink: 0;
      box-sizing: border-box;
      font-family: 'Anek Kannada', sans-serif;
    }
    .sticker-qr-badge {
      font-size: 8px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      line-height: 1;
      text-align: center;
      letter-spacing: 0.3px;
    }
    .sticker-qr-img {
      width: 88px;
      height: 88px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    .sticker-qr-sub {
      font-size: 9px;
      font-family: monospace, 'Anek Kannada', sans-serif;
      font-weight: 800;
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
                <div class="sticker-header">
                  <div class="sticker-logo-box">
                    ${showLogo ? `<img src="${companyLogoUrl}" class="sticker-logo" alt="Logo" onerror="this.style.display='none'" />` : ''}
                  </div>
                  <div class="sticker-factory-info">
                    ${showFactoryName ? `
                      <div class="sticker-factory-name">${factoryName}</div>
                      <div class="sticker-factory-sub">${factorySub}</div>
                    ` : ''}
                  </div>
                  <div class="sticker-numbers">
                    <div class="sticker-srno">${srNoText}</div>
                    <div class="sticker-shareno">Share No.: ${item.shareNo}</div>
                  </div>
                </div>
                <div class="sticker-header-divider"></div>

                <div class="sticker-main-content">
                  <div class="sticker-details">
                    <div class="sticker-name">${item.name}</div>
                    ${item.fullAddress ? `<div class="sticker-full-addr">ವಿಳಾಸ: ${item.fullAddress}</div>` : ''}
                    <div class="sticker-post">ಪೋಸ್ಟ್: ${item.place}</div>
                    <div class="sticker-taluk-dist">
                      <span>ತಾಲೂಕ್: ${item.taluk}</span>
                      <span style="margin-right: 2px;">ಜಿಲ್ಲಾ: ${item.district}</span>
                    </div>
                    <div class="sticker-pin-mobile">
                      <span>ಪಿನ್-ಕೋಡ್: ${item.pincode}</span>
                      ${item.mobile ? `<span style="font-family: monospace;">ಮೊ: ${item.mobile}</span>` : ''}
                    </div>
                    ${item.category ? `<div class="sticker-badge-row"><span>ವರ್ಗ: ${item.category}</span> • <span>ಶೇರು: ${item.sharesCount}</span></div>` : ''}
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

        // Ensure Google Font Anek Kannada is fully ready before triggering print dialog
        if (printWindow.document.fonts && printWindow.document.fonts.ready) {
          printWindow.document.fonts.ready.then(() => {
            setTimeout(() => {
              try { printWindow.print(); } catch (e) { console.error('print error:', e); }
            }, 300);
          });
        } else {
          setTimeout(() => {
            try { printWindow.print(); } catch (e) { console.error('print error:', e); }
          }, 800);
        }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      style={{ fontFamily: "'Anek Kannada', 'Noto Sans Kannada', sans-serif" }}
    >
      <div className="relative w-full max-w-6xl h-[95vh] max-h-[960px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">

        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು (Book Stickers Printing)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  9.8cm × 5.6cm • 0.5cm ಮಾರ್ಜಿನ್
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Anek Kannada
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ಕಾರ್ಖಾನೆ ಹೆಸರು, ಪೂರ್ಣ ವಿಳಾಸ & ಸಾಮಾನ್ಯ ಸಭೆ (AGM) ಹಾಜರಾತಿ QR ಕೋಡ್ ಸಹಿತ ಸ್ವಯಂ-ಅಂಟಿಕೊಳ್ಳುವ ಸ್ಟಿಕ್ಕರ್‌ಗಳು
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showSettingsDrawer
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title="ಸ್ಟಿಕ್ಕರ್ ಮತ್ತು ವಿಳಾಸ ಸೆಟ್ಟಿಂಗ್ಸ್"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">ಸೆಟ್ಟಿಂಗ್ಸ್</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="ಮುಚ್ಚಿ (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Drawer (Collapsible) */}
        {showSettingsDrawer && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs space-y-3.5 shrink-0 animate-fadeIn">
            {/* Row 1: Factory Name & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>ಕಾರ್ಖಾನೆ ಹೆಸರು (Factory Name on Sticker)</span>
                </label>
                <input
                  type="text"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  placeholder="ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ಉಪ ವಿಳಾಸ / ತಾಲೂಕು (Factory Sub-address)</span>
                </label>
                <input
                  type="text"
                  value={factorySub}
                  onChange={(e) => setFactorySub(e.target.value)}
                  placeholder="ತಾ|| ಇಂಡಿ / ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ - 586204"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Row 2: Location and Prefix Controls */}
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
                  ಜಿಲ್ಲೆ (District)
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
                  ಡೀಫಾಲ್ಟ್ ಪಿನ್-ಕೋಡ್ (Pincode)
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

            {/* Row 3: Controls & Toggles */}
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
                    checked={showFactoryName}
                    onChange={(e) => setShowFactoryName(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span>ಕಾರ್ಖಾನೆ ಹೆಸರು</span>
                </label>
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
                    <span>ದೊಡ್ಡ AGM QR ಕೋಡ್</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Statutory Dimension Pill */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">
                ✓ ಕಾರ್ಖಾನೆ ಹೆಸರು ಸೇರ್ಪಡೆ • Google Anek Kannada • ಅಳತೆ: 9.8cm × 5.6cm • ಮಾರ್ಜಿನ್: 0.5cm • ಪೂರ್ಣ ವಿಳಾಸ ಬೆಂಬಲ
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

        {/* Modal Sub-Header: Pagination & Status */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
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

        {/* Live A4 Sticker Sheet Preview Container with Google Anek Kannada Font */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50 flex justify-center">
          <div
            className="w-full max-w-4xl bg-white text-black rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-300 select-none"
            style={{ fontFamily: "'Anek Kannada', 'Noto Sans Kannada', sans-serif" }}
          >
            {/* The 2 x 5 Grid Container (Matching 9.8cm x 5.6cm layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentPageItems.map((slot, idx) => {
                if (slot.isBlank || !slot.data) {
                  return (
                    <div
                      key={`blank-${idx}`}
                      className="h-38 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-mono"
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
                    className="min-h-38 rounded-xl border border-black p-2.5 sm:p-3 bg-white flex flex-col justify-between shadow-xs transition-transform hover:scale-101"
                    style={{ fontFamily: "'Anek Kannada', sans-serif" }}
                  >
                    {/* Top Header: Logo on Left, Factory Name in Center, Sr.No & Share No on Right */}
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-black">
                      <div className="w-8 h-7 flex items-center justify-start shrink-0">
                        {showLogo && (
                          <img
                            src={companyLogoUrl}
                            alt="Logo"
                            className="max-h-7 max-w-8 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left leading-tight">
                        {showFactoryName && (
                          <>
                            <div className="text-[11px] font-extrabold text-black truncate tracking-tight">
                              {factoryName}
                            </div>
                            <div className="text-[8.5px] font-semibold text-slate-700 truncate">
                              {factorySub}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-black leading-tight">
                          {srNoDisplay}
                        </div>
                        <div className="text-[13px] font-black text-black leading-tight">
                          Share No.: {item.shareNo}
                        </div>
                      </div>
                    </div>

                    {/* Middle Details + Larger Right-side QR Code */}
                    <div className="flex items-center justify-between gap-2 mt-1 flex-1">
                      <div className="space-y-0.5 flex-1 min-w-0 pr-1 text-left">
                        <div className="text-xs sm:text-[13px] font-extrabold text-black leading-snug truncate">
                          {item.name}
                        </div>
                        {item.fullAddress && (
                          <div className="text-[11px] font-semibold text-slate-800 leading-tight truncate">
                            ವಿಳಾಸ: {item.fullAddress}
                          </div>
                        )}
                        <div className="text-[12px] font-semibold text-black leading-tight">
                          ಪೋಸ್ಟ್: {item.place}
                        </div>
                        <div className="flex items-center justify-between text-[11.5px] font-semibold text-black leading-tight">
                          <span>ತಾಲೂಕ್: {item.taluk}</span>
                          <span className="mr-1">ಜಿಲ್ಲಾ: {item.district}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-black leading-tight">
                          <span>ಪಿನ್-ಕೋಡ್: {item.pincode}</span>
                          {item.mobile && (
                            <span className="font-mono text-[10.5px]">ಮೊ: {item.mobile}</span>
                          )}
                        </div>
                        {item.category && (
                          <div className="text-[9.5px] font-bold text-slate-700">
                            ವರ್ಗ: {item.category} • ಶೇರು: {item.sharesCount}
                          </div>
                        )}
                      </div>

                      {/* BIGGER Shareholder General Board Meeting QR Code */}
                      {showQrCode && (
                        <div className="w-22 sm:w-24 h-26 sm:h-28 border-1.5 border-black rounded-lg p-1 flex flex-col items-center justify-between bg-white shrink-0 shadow-xs">
                          <span className="text-[8px] font-extrabold text-black uppercase leading-none tracking-tight">
                            ಸಾಮಾನ್ಯ ಸಭೆ
                          </span>
                          {qrUrl ? (
                            <img src={qrUrl} alt="AGM QR" className="w-18 sm:w-20 h-18 sm:h-20 object-contain" />
                          ) : (
                            <div className="w-18 sm:w-20 h-18 sm:h-20 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                              QR...
                            </div>
                          )}
                          <span className="text-[8.5px] font-mono font-bold text-black leading-none">
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
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ಕಾರ್ಖಾನೆ ಹೆಸರು ಸಹಿತ A4 ಸ್ಟಿಕ್ಕರ್ ಶೀಟ್ (ಅಗಲ 9.8cm × ಎತ್ತರ 5.6cm, ಮಾರ್ಜಿನ್ 0.5cm, Anek Kannada ಫಾಂಟ್).</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => handlePrint(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              title="ಕೇವಲ ಪ್ರಸ್ತುತ ಪುಟವನ್ನು ಮಾತ್ರ ಮುದ್ರಿಸಿ"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>ಪ್ರಸ್ತುತ ಪುಟ ಮುದ್ರಿಸಿ ({currentPage})</span>
            </button>

            <button
              onClick={() => handlePrint(false)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              title="ಎಲ್ಲಾ ಶೇರುದಾರರ ಸ್ಟಿಕ್ಕರ್‌ಗಳನ್ನು ಮುದ್ರಿಸಿ"
            >
              <Printer className="w-4 h-4" />
              <span>ಎಲ್ಲಾ ಸ್ಟಿಕ್ಕರ್‌ಗಳು ಮುದ್ರಿಸಿ ({totalStickers} ಶೇರುದಾರರು)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
