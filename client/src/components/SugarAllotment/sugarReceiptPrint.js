/**
 * sugarReceiptPrint.js
 * Official Statutory Sugar Distribution Receipt (A4 Portrait - 2 Shareholders / 4 Receipts per Page)
 * Left: ಕಛೇರಿ ಪ್ರತಿ (Office Copy) [Blue Badge]
 * Right: ಶೇರುದಾರರ ಪ್ರತಿ (Shareholder Copy) [Green Badge]
 * Separated by dashed cut lines with scissors ✂️ icon
 */
import QRCode from 'qrcode';

// In-memory cache for QR codes
const qrCache = new Map();

/**
 * Generate high-DPI QR Code Data URL pointing to verified attendance link
 */
export async function getReceiptQRDataUrl(shareNo) {
  const cleanNo = String(shareNo || '0').trim();
  if (qrCache.has(cleanNo)) {
    return qrCache.get(cleanNo);
  }
  try {
    const payload = `https://avinash-ghiradi.github.io/sugar-cooperative-erp/?attn=${encodeURIComponent(cleanNo)}`;
    const url = await QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    qrCache.set(cleanNo, url);
    return url;
  } catch (err) {
    console.warn('QR code gen failed for', shareNo, err);
    return '';
  }
}

/**
 * Batch generate QR codes with progress callback to avoid freezing the UI
 */
export async function prefetchReceiptQRCodes(shareholders, onProgress) {
  const qrMap = new Map();
  const total = shareholders.length;
  const batchSize = 30;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = shareholders.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (s) => {
        const sNo = s.share_no || s.share_number || s.id;
        const qrUrl = await getReceiptQRDataUrl(sNo);
        qrMap.set(String(sNo), qrUrl);
      })
    );

    if (onProgress) {
      const current = Math.min(i + batchSize, total);
      onProgress(Math.round((current / total) * 100), current, total);
    }

    // Give time to event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return qrMap;
}

/**
 * Render single receipt card HTML (matching exact layout from official template)
 */
export function renderSingleCardHtml(s, seq, isOfficeCopy, settings = {}, qrUrl = '') {
  const copyLabel = isOfficeCopy ? 'ಕಛೇರಿ ಪ್ರತಿ' : 'ಶೇರುದಾರರ ಪ್ರತಿ';
  const copyBadgeBg = isOfficeCopy ? '#2563eb' : '#15803d';

  const shareNo = s.share_no || s.share_number || s.id || '—';
  const name = s.shareholder_name || s.name || '—';
  const place = (s.place || s.village_name || 'ಮರಗೂರ').trim();
  const category = (s.schedule_cast || s.category || 'ದ - ವರ್ಗ').trim();

  // Calculation
  const sharesCount = s.number_of_shares || s.shares || s.shares_count || (s.share_qty ? parseInt(s.share_qty, 10) : 1);
  const kgPerShare = settings.kg_per_share || 25;
  const ratePerKg = settings.sugar_rate_per_kg || 20;
  const eligibleKg = sharesCount * kgPerShare;
  const payableAmt = eligibleKg * ratePerKg;
  const formattedAmt = payableAmt.toLocaleString('en-IN');

  const yearCode = settings.receipt_year_code || '202627';
  const receiptNo = `${place}/${yearCode}${String(seq || 1).padStart(4, '0')}`;

  return `
    <div class="receipt-card">
      <!-- 1. Header (Orange) -->
      <div class="rc-header">
        <div class="rc-title">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
        <div class="rc-subtitle">ಮರಗೂರ 586 204 ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ</div>
      </div>

      <!-- 2. Sub-Banner (Green) with Copy Badge -->
      <div class="rc-subbanner">
        <div class="rc-subbanner-title">ಸಕ್ಕರೆ ವಿತರಣಾ ರಶೀದಿ</div>
        <div class="rc-copy-badge" style="background-color: ${copyBadgeBg};">${copyLabel}</div>
      </div>

      <!-- 3. Receipt No Row (Green Text) -->
      <div class="rc-receipt-no">
        <span>ರಶೀದಿ ಸಂಖ್ಯೆ</span>
        <span class="rc-colon">:</span>
        <strong class="rc-receipt-val">${receiptNo}</strong>
      </div>

      <!-- 4. Share Number Banner (Deep Blue Pill) -->
      <div class="rc-shareno-banner">
        <span>ಶೇರು ಸಂಖ್ಯೆ</span>
        <span class="rc-colon">:</span>
        <strong>${shareNo}</strong>
      </div>

      <!-- 5. Body: Details on Left, High-DPI QR on Right -->
      <div class="rc-body">
        <div class="rc-details">
          <div class="rc-row">
            <span class="rc-label">ಸದಸ್ಯರ ಹೆಸರು</span>
            <span class="rc-colon">:</span>
            <span class="rc-val rc-val-bold">${name}</span>
          </div>
          <div class="rc-row">
            <span class="rc-label">ವಿಳಾಸ</span>
            <span class="rc-colon">:</span>
            <span class="rc-val">${place}</span>
          </div>
          <div class="rc-row">
            <span class="rc-label">ಶೇರು ವರ್ಗ</span>
            <span class="rc-colon">:</span>
            <span class="rc-val">${category}</span>
          </div>
          <div class="rc-row">
            <span class="rc-label">ಒಟ್ಟು ಶೇರುಗಳು</span>
            <span class="rc-colon">:</span>
            <span class="rc-val">${sharesCount}</span>
          </div>
          <div class="rc-row">
            <span class="rc-label">ಪ್ರತಿ ಕೆ.ಜಿ ದರ</span>
            <span class="rc-colon">:</span>
            <span class="rc-val">ರೂ. ${ratePerKg} /ಕೆ.ಜಿ</span>
          </div>
        </div>
        <div class="rc-qr-box">
          ${qrUrl ? `<img class="rc-qr-img" src="${qrUrl}" alt="QR" />` : '<div class="rc-qr-placeholder">QR</div>'}
          <div class="rc-qr-caption">ಪರಿಶೀಲನೆಗಾಗಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ</div>
        </div>
      </div>

      <!-- 6. Calculation Banners (Orange & Green) -->
      <div class="rc-calc-box">
        <div class="rc-calc-orange">
          <span>ಅರ್ಹ ಸಕ್ಕರೆ</span>
          <span class="rc-calc-val">${eligibleKg} ಕೆ.ಜಿ</span>
        </div>
        <div class="rc-calc-green">
          <span>ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ</span>
          <span class="rc-calc-val">ರೂ. ${formattedAmt}</span>
        </div>
      </div>

      <!-- 7. Footer Signatures -->
      <div class="rc-signatures">
        <div>ಸದಸ್ಯರ ಸಹಿ</div>
        <div>ವಿತರಣಾಧಿಕಾರಿಗಳ ಸಹಿ</div>
      </div>
    </div>
  `;
}

/**
 * Render a single row (1 Shareholder -> Office Copy + Vertical Cut Line + Shareholder Copy)
 */
export function renderShareholderRowHtml(s, seq, settings = {}, qrMap = new Map()) {
  const sNo = String(s.share_no || s.share_number || s.id);
  const qrUrl = qrMap.get(sNo) || '';

  return `
    <div class="shareholder-row">
      ${renderSingleCardHtml(s, seq, true, settings, qrUrl)}
      <div class="vertical-cut-line">
        <div class="scissor-icon">✂</div>
      </div>
      ${renderSingleCardHtml(s, seq, false, settings, qrUrl)}
    </div>
  `;
}

/**
 * Build the full A4 HTML document containing all pages
 */
export function buildA4ReceiptsHtml(shareholdersList, settings = {}, qrMap = new Map(), docTitle = 'ಸಕ್ಕರೆ ವಿತರಣಾ ರಶೀದಿಗಳು (A4 Receipts)') {
  let pagesHtml = '';
  const total = shareholdersList.length;

  for (let i = 0; i < total; i += 2) {
    const s1 = shareholdersList[i];
    const s2 = i + 1 < total ? shareholdersList[i + 1] : null;

    pagesHtml += `
      <div class="a4-page">
        ${renderShareholderRowHtml(s1, i + 1, settings, qrMap)}
        
        <div class="horizontal-cut-line">
          <div class="scissor-icon">✂</div>
        </div>

        ${s2 ? renderShareholderRowHtml(s2, i + 2, settings, qrMap) : '<div class="shareholder-row shareholder-row-empty"></div>'}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="kn">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm 6mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Noto Sans Kannada', 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .a4-page {
        box-shadow: none !important;
        margin: 0 !important;
      }
    }
    .a4-page {
      width: 198mm;
      height: 287mm;
      margin: 8mm auto;
      background: #ffffff;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      position: relative;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }
    .a4-page:last-child {
      page-break-after: avoid;
    }
    .shareholder-row {
      display: flex;
      width: 100%;
      height: 139mm;
      align-items: stretch;
      justify-content: space-between;
      position: relative;
    }
    .shareholder-row-empty {
      visibility: hidden;
    }
    .receipt-card {
      width: 95.5mm;
      height: 100%;
      border: 1.8px solid #ea580c;
      border-radius: 7px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
    }
    .vertical-cut-line {
      width: 6mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .vertical-cut-line::before {
      content: '';
      position: absolute;
      top: 2mm;
      bottom: 2mm;
      left: 50%;
      border-left: 1.2px dashed #94a3b8;
      transform: translateX(-50%);
    }
    .vertical-cut-line .scissor-icon {
      background: #ffffff;
      color: #64748b;
      font-size: 11px;
      z-index: 2;
      padding: 2px 0;
      transform: rotate(90deg);
    }
    .horizontal-cut-line {
      width: 100%;
      height: 6mm;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .horizontal-cut-line::before {
      content: '';
      position: absolute;
      left: 2mm;
      right: 2mm;
      top: 50%;
      border-top: 1.2px dashed #94a3b8;
      transform: translateY(-50%);
    }
    .horizontal-cut-line .scissor-icon {
      background: #ffffff;
      color: #64748b;
      font-size: 11px;
      z-index: 2;
      padding: 0 4px;
    }

    /* Inner Card Typography & Components */
    .rc-header {
      background: #ea580c;
      color: #ffffff;
      text-align: center;
      padding: 4px 6px 3px 6px;
    }
    .rc-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: -0.2px;
      line-height: 1.2;
    }
    .rc-subtitle {
      font-size: 9.5px;
      font-weight: 500;
      opacity: 0.95;
      margin-top: 1px;
      line-height: 1.2;
    }
    .rc-subbanner {
      background: #047857;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5px 8px;
    }
    .rc-subbanner-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .rc-copy-badge {
      color: #ffffff;
      font-size: 9px;
      font-weight: 700;
      padding: 1.5px 7px;
      border-radius: 9999px;
      line-height: 1.2;
    }
    .rc-receipt-no {
      padding: 3.5px 8px 2px 8px;
      font-size: 10.5px;
      color: #047857;
      font-weight: 500;
      display: flex;
      align-items: baseline;
    }
    .rc-receipt-val {
      font-weight: 700;
      font-family: 'Noto Sans Kannada', 'Segoe UI', monospace;
      margin-left: 4px;
    }
    .rc-shareno-banner {
      background: #1d4ed8;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      margin: 1px 6px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      display: flex;
      align-items: baseline;
    }
    .rc-shareno-banner strong {
      margin-left: 4px;
      font-family: 'Segoe UI', Arial, monospace;
    }
    .rc-body {
      padding: 4px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }
    .rc-details {
      width: 67%;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      height: 100%;
    }
    .rc-row {
      display: flex;
      align-items: baseline;
      border-bottom: 1px dotted #cbd5e1;
      padding: 2px 0;
      font-size: 10px;
      line-height: 1.25;
    }
    .rc-row:last-child {
      border-bottom: none;
    }
    .rc-label {
      width: 72px;
      flex-shrink: 0;
      color: #1e293b;
      font-weight: 600;
    }
    .rc-colon {
      margin: 0 4px;
      color: #64748b;
    }
    .rc-val {
      font-weight: 600;
      color: #0f172a;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rc-val.rc-val-bold {
      font-weight: 800;
      font-size: 10.5px;
    }
    .rc-qr-box {
      width: 30%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .rc-qr-img {
      width: 68px;
      height: 68px;
      object-fit: contain;
      display: block;
    }
    .rc-qr-placeholder {
      width: 68px;
      height: 68px;
      border: 1px dashed #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 10px;
    }
    .rc-qr-caption {
      font-size: 7px;
      font-weight: 700;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.1;
    }
    .rc-calc-box {
      padding: 2px 6px;
    }
    .rc-calc-orange {
      background: #ea580c;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3.5px 10px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 700;
    }
    .rc-calc-green {
      background: #047857;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3.5px 10px;
      border-radius: 4px;
      margin-top: 3.5px;
      font-size: 10.5px;
      font-weight: 700;
    }
    .rc-calc-val {
      font-size: 11.5px;
      font-weight: 800;
    }
    .rc-signatures {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 12px 6px 12px;
      font-size: 9.5px;
      font-weight: 700;
      color: #1e293b;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

/**
 * Open print window and trigger print dialog
 */
export function openPrintDialog(html) {
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  } else {
    alert('ದಯವಿಟ್ಟು ಪಾಪ್-ಅಪ್ ವಿಂಡೋವನ್ನು ಅನುಮತಿಸಿ (Please allow popups to print).');
  }
}
