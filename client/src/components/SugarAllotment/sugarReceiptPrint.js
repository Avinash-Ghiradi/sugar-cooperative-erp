/**
 * sugarReceiptPrint.js
 * Official Statutory Sugar Distribution Receipt (A4 Portrait - 2 Shareholders / 4 Receipts per Page)
 * Left: ಕಛೇರಿ ಪ್ರತಿ (Office Copy) [Blue Badge]
 * Right: ಶೇರುದಾರರ ಪ್ರತಿ (Shareholder Copy) [Green Badge]
 * Features:
 *  - Official Factory Logo (Left) + National Sahakari Handshake Emblem (Right)
 *  - Full Google Anek Kannada Typography
 *  - High-DPI QR Verification with Verification Link
 *  - Security Seal Background Watermark
 *  - Statutory Receipt No, Current Date, Member Category & Share Quantity
 *  - Dual Executive Calculation Banners (Eligible Sugar + Payable Amount)
 *  - Tri-Signature Official Block (Member, Weighman, Issuer)
 *  - Precision Scissor Cut Line Guides (Horizontal & Vertical)
 */
import QRCode from 'qrcode';
import { getCompanyLogo, getHandshakeLogo, DEFAULT_LOGO_PATH, DEFAULT_HANDSHAKE_PATH } from '../../services/organizationService';

// In-memory cache for QR codes
const qrCache = new Map();

// High-reliability embedded Base64 for the National Cooperative Handshake Logo
export const COOP_HANDSHAKE_BASE64 = 'data:image/png;base64,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';

/**
 * Helper to resolve absolute or data URI for assets to ensure 100% reliable print rendering
 */
export function getAbsoluteAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  try {
    return new URL(path, window.location.href).href;
  } catch (e) {
    return path;
  }
}

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
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
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
 * Render single receipt card HTML (Professional Statutory Format with Google Anek Kannada & Dual Logos)
 */
export function renderSingleCardHtml(s, seq, isOfficeCopy, settings = {}, qrUrl = '', logos = {}) {
  const isOffice = !!isOfficeCopy;
  const copyLabel = isOffice ? '🏢 ಕಛೇರಿ ಪ್ರತಿ (Office Copy)' : '👤 ಶೇರುದಾರರ ಪ್ರತಿ (Member Copy)';
  const copyBadgeClass = isOffice ? 'rc-copy-office' : 'rc-copy-member';

  const shareNo = s.share_no || s.share_number || s.id || '—';
  const name = s.shareholder_name || s.name || '—';
  const place = (s.place || s.village_name || 'ಮರಗೂರ').trim();
  const category = (s.schedule_cast || s.category || 'ಅ - ವರ್ಗ').trim();

  // Calculation
  const sharesCount = s.number_of_shares || s.shares || s.shares_count || (s.share_qty ? parseInt(s.share_qty, 10) : 1);
  const kgPerShare = settings.kg_per_share || 25;
  const ratePerKg = settings.sugar_rate_per_kg || 20;
  const eligibleKg = sharesCount * kgPerShare;
  const payableAmt = eligibleKg * ratePerKg;
  const formattedAmt = payableAmt.toLocaleString('en-IN');

  const yearCode = settings.receipt_year_code || '202627';
  const receiptNo = `${place}/${yearCode}/${String(seq || 1).padStart(4, '0')}`;
  const seasonYear = settings.season_year || settings.receipt_year || '2026-27';

  const today = new Date();
  const receiptDate = settings.receipt_date || `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  // Logos resolution
  const companyLogo = logos.companyLogo || getAbsoluteAssetUrl(getCompanyLogo()) || getAbsoluteAssetUrl(DEFAULT_LOGO_PATH);
  const handshakeLogo = logos.handshakeLogo || COOP_HANDSHAKE_BASE64;
  const sealLogo = logos.sealLogo || getAbsoluteAssetUrl('./id_assets/society_seal.png');

  return `
    <div class="receipt-card">
      <!-- Background Security Seal Watermark -->
      <div class="rc-watermark">
        <img src="${sealLogo}" alt="Seal" onerror="this.style.display='none'" />
      </div>

      <!-- 1. Executive Header (Deep Saffron Gradient + Dual Logos) -->
      <div class="rc-header">
        <div class="rc-logo-box rc-logo-left">
          <img src="${companyLogo}" alt="BSSKN Logo" class="rc-logo-img" onerror="this.src='./id_assets/bsskn_logo.png'" />
        </div>
        <div class="rc-header-text">
          <div class="rc-title">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ</div>
          <div class="rc-subtitle">ಮರಗೂರ - 586 204, ತಾ|| ಇಂಡಿ, ಜಿ|| ವಿಜಯಪುರ (ಕರ್ನಾಟಕ)</div>
          <div class="rc-subdept">ಸಕ್ಕರೆ ವಿತರಣಾ ವಿಭಾಗ • ಸೀಸನ್: ${seasonYear}</div>
        </div>
        <div class="rc-logo-box rc-logo-right">
          <img src="${handshakeLogo}" alt="Sahakari Logo" class="rc-logo-img" />
        </div>
      </div>

      <!-- 2. Sub-Banner (Cooperative Emerald Green + Copy Badge) -->
      <div class="rc-subbanner">
        <div class="rc-subbanner-title">
          <span class="rc-subbanner-bullet">✦</span>
          <span>ಸಕ್ಕರೆ ವಿತರಣಾ ಅಧಿಕೃತ ರಶೀದಿ</span>
        </div>
        <div class="rc-copy-badge ${copyBadgeClass}">
          ${copyLabel}
        </div>
      </div>

      <!-- 3. Receipt No & Date Row (Clear Metadata Strip) -->
      <div class="rc-meta-strip">
        <div class="rc-meta-item">
          <span class="rc-meta-lbl">ರಶೀದಿ ಸಂ:</span>
          <strong class="rc-meta-val font-mono">${receiptNo}</strong>
        </div>
        <div class="rc-meta-item rc-meta-date">
          <span class="rc-meta-lbl">ದಿನಾಂಕ:</span>
          <strong class="rc-meta-val">${receiptDate}</strong>
        </div>
      </div>

      <!-- 4. Share Number Banner (Royal Cobalt Blue with Category Tag) -->
      <div class="rc-shareno-banner">
        <div class="rc-share-left">
          <span class="rc-share-lbl">ಶೇರು ಸಂಖ್ಯೆ:</span>
          <span class="rc-share-num font-mono">${shareNo}</span>
        </div>
        <div class="rc-category-tag">
          <span>ವರ್ಗ: ${category}</span>
        </div>
      </div>

      <!-- 5. Body: Member Details & High-DPI QR Verification Box -->
      <div class="rc-body">
        <div class="rc-details">
          <div class="rc-row">
            <span class="rc-lbl">ಸದಸ್ಯರ ಹೆಸರು</span>
            <span class="rc-sep">:</span>
            <span class="rc-val rc-val-bold">${name}</span>
          </div>
          <div class="rc-row">
            <span class="rc-lbl">ವಿಳಾಸ / ಗ್ರಾಮ</span>
            <span class="rc-sep">:</span>
            <span class="rc-val">${place}</span>
          </div>
          <div class="rc-row">
            <span class="rc-lbl">ಶೇರು ವರ್ಗ</span>
            <span class="rc-sep">:</span>
            <span class="rc-val">${category}</span>
          </div>
          <div class="rc-row">
            <span class="rc-lbl">ಒಟ್ಟು ಶೇರುಗಳು</span>
            <span class="rc-sep">:</span>
            <span class="rc-val font-bold">${sharesCount}</span>
          </div>
          <div class="rc-row">
            <span class="rc-lbl">ಪ್ರತಿ ಕೆ.ಜಿ ದರ</span>
            <span class="rc-sep">:</span>
            <span class="rc-val">ರೂ. ${ratePerKg} /- (ಪ್ರತಿ ಕಿ.ಗ್ರಾಂ)</span>
          </div>
        </div>

        <div class="rc-qr-box">
          <div class="rc-qr-frame">
            ${qrUrl ? `<img class="rc-qr-img" src="${qrUrl}" alt="QR" />` : '<div class="rc-qr-placeholder">QR</div>'}
          </div>
          <div class="rc-qr-caption">ದೃಢೀಕರಣಕ್ಕಾಗಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ</div>
        </div>
      </div>

      <!-- 6. Calculation Banners (Dual Executive Summary Cards) -->
      <div class="rc-calc-grid">
        <div class="rc-calc-card rc-calc-sugar">
          <div class="rc-calc-lbl">ಒಟ್ಟು ಅರ್ಹ ಸಕ್ಕರೆ :</div>
          <div class="rc-calc-val">
            <strong>${eligibleKg}</strong> <span class="rc-calc-unit">ಕಿ.ಗ್ರಾಂ</span>
          </div>
        </div>
        <div class="rc-calc-card rc-calc-amt">
          <div class="rc-calc-lbl">ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ :</div>
          <div class="rc-calc-val">
            <span class="rc-currency">ರೂ.</span> <strong>${formattedAmt}</strong> <span class="rc-calc-unit">/-</span>
          </div>
        </div>
      </div>

      <!-- 7. Official Statutory Tri-Signatures -->
      <div class="rc-signatures">
        <div class="rc-sig-item">
          <div class="rc-sig-line"></div>
          <div class="rc-sig-lbl">ಶೇರುದಾರರ / ಸ್ವೀಕೃತಿದಾರರ ಸಹಿ</div>
        </div>
        <div class="rc-sig-item">
          <div class="rc-sig-line"></div>
          <div class="rc-sig-lbl">ತೂಕಗಾರರ ಸಹಿ</div>
        </div>
        <div class="rc-sig-item">
          <div class="rc-sig-line"></div>
          <div class="rc-sig-lbl">ಸಕ್ಕರೆ ವಿತರಕರ ಸಹಿ</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single row (1 Shareholder -> Office Copy + Vertical Cut Line + Shareholder Copy)
 */
export function renderShareholderRowHtml(s, seq, settings = {}, qrMap = new Map(), logos = {}) {
  const sNo = String(s.share_no || s.share_number || s.id);
  const qrUrl = qrMap.get(sNo) || '';

  return `
    <div class="shareholder-row">
      ${renderSingleCardHtml(s, seq, true, settings, qrUrl, logos)}
      <div class="vertical-cut-line">
        <div class="scissor-icon">✂</div>
        <div class="cut-hint">ಕತ್ತರಿಸಿ</div>
      </div>
      ${renderSingleCardHtml(s, seq, false, settings, qrUrl, logos)}
    </div>
  `;
}

/**
 * Build the full A4 HTML document containing all pages
 */
export function buildA4ReceiptsHtml(shareholdersList, settings = {}, qrMap = new Map(), docTitle = 'ಸಕ್ಕರೆ ವಿತರಣಾ ರಶೀದಿಗಳು (A4 Sugar Receipts)', options = {}) {
  let pagesHtml = '';
  const total = shareholdersList.length;

  // Resolve logos for all pages
  const logos = {
    companyLogo: options.companyLogo || getAbsoluteAssetUrl(getCompanyLogo()) || getAbsoluteAssetUrl(DEFAULT_LOGO_PATH),
    handshakeLogo: options.handshakeLogo || COOP_HANDSHAKE_BASE64,
    sealLogo: options.sealLogo || getAbsoluteAssetUrl('./id_assets/society_seal.png')
  };

  for (let i = 0; i < total; i += 2) {
    const s1 = shareholdersList[i];
    const s2 = i + 1 < total ? shareholdersList[i + 1] : null;

    pagesHtml += `
      <div class="a4-page">
        ${renderShareholderRowHtml(s1, i + 1, settings, qrMap, logos)}
        
        <div class="horizontal-cut-line">
          <div class="scissor-icon">✂</div>
          <span class="horizontal-cut-text">ಇಲ್ಲಿ ಕತ್ತರಿಸಿ (Cut Here)</span>
        </div>

        ${s2 ? renderShareholderRowHtml(s2, i + 2, settings, qrMap, logos) : `
          <div class="shareholder-row single-paper-reuse-notice">
            <div class="paper-reuse-box">
              <div class="paper-reuse-badge">📄 ಕಾಗದ ಮರುಬಳಕೆ ಸೂಚನೆ (Paper Reuse Notice)</div>
              <div class="paper-reuse-text">
                ಮೇಲಿನ ರಶೀದಿಯನ್ನು ಕತ್ತರಿಸಿ ಪಡೆದ ನಂತರ, ಉಳಿದ ಈ ಅರ್ಧ ಹಾಳೆಯನ್ನು ಮುಂದಿನ ಶೇರುದಾರರ ರಶೀದಿ ಮುದ್ರಣಕ್ಕೆ ಮರುಬಳಕೆ ಮಾಡಬಹುದು.
              </div>
            </div>
          </div>
        `}
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
  <link href="https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@300;400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 4.5mm 5.5mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Anek Kannada', 'Aneka Kannada', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Anek Kannada', 'Aneka Kannada', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
      margin: 6mm auto;
      background: #ffffff;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      position: relative;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.09);
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

    /* Single Paper Reuse Notice */
    .single-paper-reuse-notice {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafaf9;
      border: 1.5px dashed #cbd5e1;
      border-radius: 8px;
    }
    .paper-reuse-box {
      text-align: center;
      max-width: 140mm;
      padding: 12px;
      color: #64748b;
    }
    .paper-reuse-badge {
      display: inline-block;
      font-weight: 800;
      font-size: 11px;
      color: #475569;
      background: #e2e8f0;
      padding: 3px 12px;
      border-radius: 9999px;
      margin-bottom: 6px;
    }
    .paper-reuse-text {
      font-size: 9.5px;
      font-weight: 600;
      line-height: 1.4;
      color: #94a3b8;
    }

    /* ========================================================================= */
    /* RECEIPT CARD ARCHITECTURE */
    /* ========================================================================= */
    .receipt-card {
      width: 95.8mm;
      height: 100%;
      border: 1.8px solid #c2410c;
      border-radius: 8px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
    }

    /* Security Watermark */
    .rc-watermark {
      position: absolute;
      top: 54%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 58mm;
      opacity: 0.045;
      pointer-events: none;
      z-index: 0;
    }
    .rc-watermark img {
      width: 100%;
      height: auto;
      filter: grayscale(100%);
    }

    /* Cut Lines with Scissors */
    .vertical-cut-line {
      width: 6.4mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .vertical-cut-line::before {
      content: '';
      position: absolute;
      top: 3mm;
      bottom: 3mm;
      left: 50%;
      border-left: 1.2px dashed #94a3b8;
      transform: translateX(-50%);
    }
    .vertical-cut-line .scissor-icon {
      background: #ffffff;
      color: #475569;
      font-size: 12px;
      z-index: 2;
      padding: 2px 0;
      transform: rotate(90deg);
    }
    .vertical-cut-line .cut-hint {
      background: #ffffff;
      color: #94a3b8;
      font-size: 7px;
      font-weight: 800;
      z-index: 2;
      writing-mode: vertical-rl;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .horizontal-cut-line {
      width: 100%;
      height: 5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .horizontal-cut-line::before {
      content: '';
      position: absolute;
      left: 3mm;
      right: 3mm;
      top: 50%;
      border-top: 1.2px dashed #94a3b8;
      transform: translateY(-50%);
    }
    .horizontal-cut-line .scissor-icon {
      background: #ffffff;
      color: #475569;
      font-size: 11px;
      z-index: 2;
      padding: 0 4px;
    }
    .horizontal-cut-text {
      background: #ffffff;
      color: #64748b;
      font-size: 7.5px;
      font-weight: 800;
      z-index: 2;
      padding: 0 6px;
      letter-spacing: 0.5px;
    }

    /* 1. Header with Dual Logos */
    .rc-header {
      background: linear-gradient(135deg, #b91c1c 0%, #c2410c 35%, #ea580c 80%, #f97316 100%);
      color: #ffffff;
      padding: 3.5px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      border-bottom: 2px solid #ca8a04;
      position: relative;
      z-index: 1;
    }
    .rc-logo-box {
      width: 33px;
      height: 33px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.28);
      padding: 1.5px;
      border: 1.2px solid #fef08a;
    }
    .rc-logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .rc-header-text {
      flex: 1;
      text-align: center;
      line-height: 1.15;
    }
    .rc-title {
      font-size: 12.8px;
      font-weight: 900;
      letter-spacing: -0.15px;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }
    .rc-subtitle {
      font-size: 9px;
      font-weight: 600;
      color: #fef3c7;
      margin-top: 0.5px;
      text-shadow: 0 1px 1px rgba(0,0,0,0.3);
    }
    .rc-subdept {
      font-size: 8px;
      font-weight: 800;
      color: #ffffff;
      background: rgba(0,0,0,0.22);
      display: inline-block;
      padding: 0.5px 7px;
      border-radius: 9999px;
      margin-top: 1px;
      border: 0.5px solid rgba(255,255,255,0.3);
    }

    /* 2. Sub-Banner & Copy Badge */
    .rc-subbanner {
      background: linear-gradient(90deg, #064e3b 0%, #065f46 60%, #047857 100%);
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5px 8px;
      border-bottom: 1.2px solid #047857;
      position: relative;
      z-index: 1;
    }
    .rc-subbanner-title {
      font-size: 10.8px;
      font-weight: 800;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .rc-subbanner-bullet {
      color: #fde047;
      font-size: 9px;
    }
    .rc-copy-badge {
      font-size: 8.5px;
      font-weight: 800;
      padding: 1.5px 8px;
      border-radius: 9999px;
      line-height: 1.2;
      border: 1px solid rgba(255,255,255,0.4);
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
    }
    .rc-copy-office {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
    }
    .rc-copy-member {
      background: linear-gradient(135deg, #14532d 0%, #16a34a 100%);
      color: #ffffff;
    }

    /* 3. Metadata Strip (Receipt No & Date) */
    .rc-meta-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 8px 2.5px 8px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9.8px;
      position: relative;
      z-index: 1;
    }
    .rc-meta-item {
      display: flex;
      align-items: baseline;
      gap: 3px;
    }
    .rc-meta-lbl {
      color: #475569;
      font-weight: 700;
    }
    .rc-meta-val {
      color: #065f46;
      font-weight: 800;
    }
    .rc-meta-date .rc-meta-val {
      color: #1e293b;
    }

    /* 4. Share Number Banner (Royal Cobalt Ribbon) */
    .rc-shareno-banner {
      background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%);
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 8px;
      margin: 2px 5px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(30, 58, 138, 0.25);
      position: relative;
      z-index: 1;
    }
    .rc-share-left {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .rc-share-lbl {
      font-size: 10.5px;
      font-weight: 700;
      opacity: 0.95;
    }
    .rc-share-num {
      font-size: 12.5px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #fef08a;
    }
    .rc-category-tag {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.4);
      padding: 1px 7px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 800;
      color: #ffffff;
    }

    /* 5. Body: Details + QR */
    .rc-body {
      padding: 3px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      flex: 1;
      position: relative;
      z-index: 1;
    }
    .rc-details {
      width: 69%;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      height: 100%;
    }
    .rc-row {
      display: flex;
      align-items: baseline;
      border-bottom: 1px dashed #cbd5e1;
      padding: 2.2px 0;
      font-size: 9.8px;
      line-height: 1.25;
    }
    .rc-row:last-child {
      border-bottom: none;
    }
    .rc-lbl {
      width: 68px;
      flex-shrink: 0;
      color: #334155;
      font-weight: 700;
    }
    .rc-sep {
      margin: 0 4px;
      color: #64748b;
      font-weight: bold;
    }
    .rc-val {
      font-weight: 700;
      color: #0f172a;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rc-val-bold {
      font-weight: 900;
      font-size: 10.5px;
      color: #0f172a;
    }
    .rc-qr-box {
      width: 29%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .rc-qr-frame {
      background: #ffffff;
      border: 1.2px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .rc-qr-img {
      width: 66px;
      height: 66px;
      object-fit: contain;
      display: block;
    }
    .rc-qr-placeholder {
      width: 66px;
      height: 66px;
      border: 1px dashed #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 10px;
    }
    .rc-qr-caption {
      font-size: 7px;
      font-weight: 800;
      color: #475569;
      margin-top: 2px;
      line-height: 1.1;
    }

    /* 6. Calculation Banners (Orange & Green) */
    .rc-calc-grid {
      padding: 2px 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      position: relative;
      z-index: 1;
    }
    .rc-calc-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3.5px 10px;
      border-radius: 5px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.12);
    }
    .rc-calc-sugar {
      background: linear-gradient(90deg, #c2410c 0%, #ea580c 100%);
      color: #ffffff;
    }
    .rc-calc-amt {
      background: linear-gradient(90deg, #065f46 0%, #047857 100%);
      color: #ffffff;
    }
    .rc-calc-lbl {
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.1px;
    }
    .rc-calc-val {
      font-size: 12.5px;
      font-weight: 900;
    }
    .rc-calc-val strong {
      font-family: 'Anek Kannada', 'Segoe UI', monospace;
    }
    .rc-calc-unit {
      font-size: 9.5px;
      font-weight: 700;
      opacity: 0.95;
    }
    .rc-currency {
      font-size: 11px;
      font-weight: 800;
    }

    /* 7. Signatures Block */
    .rc-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 9px 8px 5px 8px;
      position: relative;
      z-index: 1;
    }
    .rc-sig-item {
      text-align: center;
      width: 31%;
    }
    .rc-sig-line {
      border-top: 1px dotted #64748b;
      margin-bottom: 2.5px;
    }
    .rc-sig-lbl {
      font-size: 8px;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.15;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

/**
 * Open print window and trigger print dialog with safe readiness delay
 */
export function openPrintDialog(html) {
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();

    // Trigger print safely after font and logo assets have loaded
    const triggerPrint = () => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        console.error('Print trigger failed:', e);
      }
    };

    if (win.document.readyState === 'complete') {
      setTimeout(triggerPrint, 500);
    } else {
      win.onload = () => setTimeout(triggerPrint, 500);
      setTimeout(triggerPrint, 1200);
    }
  } else {
    alert('ದಯವಿಟ್ಟು ಪಾಪ್-ಅಪ್ ವಿಂಡೋವನ್ನು ಅನುಮತಿಸಿ (Please allow popups to print).');
  }
}
