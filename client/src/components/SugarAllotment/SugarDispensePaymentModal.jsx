import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import {
  PackageCheck,
  Search,
  Camera,
  Upload,
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  History,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ApiService, getShareholderSharesCount } from '../../services/api';
import { getCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import {
  buildA4ReceiptsHtml,
  openPrintDialog,
  getReceiptQRDataUrl,
  COOP_HANDSHAKE_BASE64,
  getAbsoluteAssetUrl
} from './sugarReceiptPrint';

/**
 * Cleanly extract Shareholder number from:
 * 1. URL: ...?attn=236
 * 2. Prefix: BSSKN-236, SN-236, SHARE-236, #236
 * 3. JSON string: {"share_no": 236}
 * 4. Plain number: 236
 */
export function extractShareNoFromInput(raw) {
  if (!raw) return '';
  let text = String(raw).trim();

  // 1. URL search parameter
  try {
    if (text.includes('?')) {
      const urlObj = new URL(text.startsWith('http') ? text : `https://dummy.com/${text}`);
      const param = urlObj.searchParams.get('attn') || urlObj.searchParams.get('share_no') || urlObj.searchParams.get('id');
      if (param) return param.trim().replace(/\D/g, '');
    }
  } catch (e) {}

  // 2. Direct JSON
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text);
      if (obj.share_no) return String(obj.share_no).trim().replace(/\D/g, '');
      if (obj.id) return String(obj.id).trim().replace(/\D/g, '');
    } catch (e) {}
  }

  // 3. Prefix matching: BSSKN-236, SN-236, SHARE-236, #236
  const match = text.match(/(?:BSSKN|ATTN|SHARE|MEMBER|SN)[:\-\s#]*(\d+)/i);
  if (match) {
    return match[1].trim();
  }

  // 4. Fallback: extract digits
  return text.replace(/\D/g, '');
}

/**
 * Audio feedback using Web Audio API (zero external assets)
 */
function playChime(type = 'success') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Pleasant high-pitch double beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Warning low tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
}

export default function SugarDispensePaymentModal({
  isOpen,
  onClose,
  initialShareholder = null,
  allShareholders = [],
  settings = {},
  showToast = () => {},
  currentUser = null,
  onAllotmentSaved = () => {}
}) {
  if (!isOpen) return null;

  // Tabs: 'dispense' | 'today_register'
  const [activeTab, setActiveTab] = useState('dispense');

  // Input & Scanner States
  const [scanInput, setScanInput] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Selected Shareholder for Dispensing
  const [selectedShareholder, setSelectedShareholder] = useState(null);
  const [allotmentHistory, setAllotmentHistory] = useState([]);
  const [isAlreadyAllotted, setIsAlreadyAllotted] = useState(false);
  const [existingAllotmentRecord, setExistingAllotmentRecord] = useState(null);

  // Form Fields
  const [allottedKg, setAllottedKg] = useState(25);
  const [ratePerKg, setRatePerKg] = useState(20);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'UPI' | 'Bank' | 'Free'
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // 'Paid' | 'Pending'
  const [receiptNo, setReceiptNo] = useState('');
  const [weighmanName, setWeighmanName] = useState(currentUser?.name || currentUser?.username || 'Avinash Ghiradimath');
  const [counterNo, setCounterNo] = useState('ಕೌಂಟರ್ 1');
  const [remarks, setRemarks] = useState('ಸ್ವತಃ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ');
  const [isSaving, setIsSaving] = useState(false);

  // Success Dialog State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState(null);

  // Today's Live Allotments Register
  const [todayAllotments, setTodayAllotments] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);

  // Scanner Refs
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Computed Total Amount
  const totalAmount = useMemo(() => {
    const kg = parseFloat(allottedKg) || 0;
    const rate = parseFloat(ratePerKg) || 0;
    return Math.round(kg * rate);
  }, [allottedKg, ratePerKg]);

  // Bags calculation
  const bagsCount = useMemo(() => {
    const kg = parseFloat(allottedKg) || 0;
    if (kg <= 0) return 0;
    if (kg % 50 === 0) return `${kg / 50} ಚೀಲ (50 Kg)`;
    if (kg % 25 === 0) return `${kg / 25} ಚೀಲ (25 Kg)`;
    return `${kg} Kg`;
  }, [allottedKg]);

  // Load All Allotments on mount & refresh
  const loadAllotments = async () => {
    setTodayLoading(true);
    try {
      const res = await ApiService.getSugarAllotments({ page: 1, limit: 1000 });
      if (res && res.data && Array.isArray(res.data)) {
        setTodayAllotments(res.data);
      }
    } catch (e) {
      console.warn('Failed to load sugar allotments:', e);
    } finally {
      setTodayLoading(false);
    }
  };

  useEffect(() => {
    loadAllotments();
  }, []);

  // Today's Statistics
  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    const todays = todayAllotments.filter(a => {
      if (!a.allotment_date) return false;
      return a.allotment_date === todayStr || (a.created_at && a.created_at.startsWith(new Date().toISOString().split('T')[0]));
    });

    const totalKg = todays.reduce((acc, curr) => acc + (Number(curr.issued_quantity_kg || curr.sugar_quantity_kg) || 0), 0);
    const totalCash = todays.filter(a => (a.payment_mode || '').toLowerCase() === 'cash')
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const totalUpi = todays.filter(a => (a.payment_mode || '').toLowerCase() === 'upi')
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    return {
      count: todays.length,
      totalKg,
      totalCash,
      totalUpi,
      todays
    };
  }, [todayAllotments]);

  // Initial shareholder handling
  useEffect(() => {
    if (initialShareholder) {
      handleSelectShareholder(initialShareholder, 'ಆರಂಭಿಕ ಆಯ್ಕೆ');
    }
  }, [initialShareholder]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && !cameraOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, cameraOpen]);

  // Select shareholder and prepare dispensing form
  const handleSelectShareholder = (sh, source = 'ಮ್ಯಾನುವಲ್') => {
    if (!sh) return;
    setSelectedShareholder(sh);
    setShowSuccessDialog(false);

    // Calculate shares & eligible sugar
    const shares = getShareholderSharesCount(sh);
    const kgPerShare = settings.kg_per_share || 25;
    const rate = settings.sugar_rate_per_kg || 20;
    const eligibleKg = Math.max(1, shares) * kgPerShare;

    setAllottedKg(eligibleKg);
    setRatePerKg(rate);
    setPaymentMode('Cash');
    setPaymentStatus('Paid');

    // Generate statutory receipt number: Place/YearCode/Seq
    const place = (sh.place || sh.village_name || 'Margur').trim();
    const yearCode = settings.receipt_year_code || '202627';
    const nextSeq = todayAllotments.length + 1;
    setReceiptNo(`${place}/${yearCode}/${String(nextSeq).padStart(4, '0')}`);

    // Check if this shareholder has already received sugar for current season
    const seasonYear = settings.season_year || settings.receipt_year || '2026-27';
    const sNo = String(sh.share_no || sh.share_number || sh.id || '').replace(/\D/g, '');
    const history = todayAllotments.filter(a => {
      const matchNo = String(a.share_number || a.share_no || '').replace(/\D/g, '');
      return matchNo === sNo && (a.season_year === seasonYear || !a.season_year);
    });

    setAllotmentHistory(history);
    if (history.length > 0) {
      setIsAlreadyAllotted(true);
      setExistingAllotmentRecord(history[0]);
      playChime('warning');
      showToast(`⚠️ ಎಚ್ಚರಿಕೆ: ಶೇರುದಾರ #${sNo} ಅವರಿಗೆ ಈಗಾಗಲೇ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ!`, 'warning');
    } else {
      setIsAlreadyAllotted(false);
      setExistingAllotmentRecord(null);
      playChime('success');
      showToast(`✅ ಶೇರುದಾರ #${sNo} (${sh.shareholder_name || sh.name}) ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ.`, 'success');
    }
  };

  // Process raw scanned code (Receipt QR, ID Card QR, Barcode, Manual Input)
  const handleProcessCode = (rawCode, source = 'ಸ್ಕ್ಯಾನರ್') => {
    const cleanNo = extractShareNoFromInput(rawCode);
    if (!cleanNo) {
      playChime('warning');
      showToast('⚠️ ಅಮಾನ್ಯ ಶೇರು ಸಂಖ್ಯೆ / QR ಕೋಡ್! ದಯವಿಟ್ಟು ಸರಿಯಾದ ಕೋಡ್ ಬಳಸಿ.', 'error');
      return;
    }

    // Find shareholder in database
    const matched = allShareholders.find(s => {
      const sNo = String(s.share_no || s.share_number || s.id || '').replace(/\D/g, '');
      return sNo === cleanNo;
    });

    if (matched) {
      setScanInput('');
      handleSelectShareholder(matched, source);
    } else {
      playChime('warning');
      showToast(`⚠️ ಶೇರು ಸಂಖ್ಯೆ #${cleanNo} ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ.`, 'error');
    }
  };

  // Camera QR Scanner Lifecycle using Html5Qrcode
  useEffect(() => {
    let isCancelled = false;

    if (cameraOpen) {
      setCameraError('');
      setIsCameraActive(false);

      const startScanner = async () => {
        try {
          let devices = [];
          try {
            devices = await Html5Qrcode.getCameras();
            if (!isCancelled && devices && devices.length > 0) {
              setAvailableCameras(devices);
            }
          } catch (camErr) {
            console.warn('Cameras enumeration failed:', camErr);
          }

          if (isCancelled) return;

          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          let cameraTarget;
          if (selectedCameraId) {
            cameraTarget = selectedCameraId;
          } else if (devices && devices.length > 0) {
            const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
            cameraTarget = backCam ? backCam.id : devices[0].id;
          } else {
            cameraTarget = isMobile ? { facingMode: 'environment' } : { facingMode: 'user' };
          }

          const readerElem = document.getElementById('sugar-camera-reader');
          if (!readerElem) return;
          try { readerElem.innerHTML = ''; } catch (e) {}

          const scanner = new Html5Qrcode('sugar-camera-reader', {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39
            ],
            verbose: false
          });
          html5QrCodeRef.current = scanner;

          await scanner.start(
            cameraTarget,
            {
              fps: 15,
              qrbox: { width: 240, height: 240 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              if (decodedText) {
                handleProcessCode(decodedText, '📷 QR ಕ್ಯಾಮರಾ ಸ್ಕ್ಯಾನರ್');
                // Temporarily pause camera or close after successful scan
                setCameraOpen(false);
              }
            },
            () => {}
          );

          if (!isCancelled) {
            setIsCameraActive(true);
          }
        } catch (err) {
          console.error('Camera start error:', err);
          if (!isCancelled) {
            setCameraError('ಕ್ಯಾಮರಾ ಆರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಕ್ಯಾಮರಾ ಅನುಮತಿ (Permission) ನೀಡಿ.');
            setIsCameraActive(false);
          }
        }
      };

      startScanner();

      return () => {
        isCancelled = true;
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              html5QrCodeRef.current.stop().then(() => {
                try { html5QrCodeRef.current?.clear(); } catch (e) {}
              }).catch(() => {});
            } else {
              try { html5QrCodeRef.current?.clear(); } catch (e) {}
            }
          } catch (e) {}
          html5QrCodeRef.current = null;
        }
        setIsCameraActive(false);
      };
    } else {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              try { html5QrCodeRef.current?.clear(); } catch (e) {}
            }).catch(() => {});
          } else {
            try { html5QrCodeRef.current?.clear(); } catch (e) {}
          }
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
    }
  }, [cameraOpen, selectedCameraId]);

  // Image File QR Scanner
  const handleImageFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('ಫೋಟೋದಿಂದ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...', 'info');
      const tempScanner = new Html5Qrcode('temp-sugar-file-scanner');
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      if (decodedText) {
        handleProcessCode(decodedText, '📁 ಫೋಟೋ ಸ್ಕ್ಯಾನರ್');
      }
    } catch (err) {
      playChime('warning');
      showToast('⚠️ ಫೋಟೋದಲ್ಲಿ ಯಾವುದೇ QR ಕೋಡ್ ಪತ್ತೆಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ಬಳಸಿ.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Sugar Allotment & Record Payment
  const handleSaveAllotment = async () => {
    if (!selectedShareholder) {
      showToast('⚠️ ದಯವಿಟ್ಟು ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ!', 'error');
      return;
    }

    const kg = parseFloat(allottedKg);
    if (isNaN(kg) || kg <= 0) {
      showToast('⚠️ ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಸಕ್ಕರೆ ಪ್ರಮಾಣ (Kg) ನಮೂದಿಸಿ!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const sh = selectedShareholder;
      const shares = getShareholderSharesCount(sh);
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB'); // DD/MM/YYYY
      const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const record = {
        allotment_id: `SA-${Date.now()}`,
        shareholder_id: sh.id || sh.shareholder_id,
        share_number: sh.share_no || sh.share_number || sh.id,
        shareholder_name: sh.shareholder_name || sh.name,
        village_name: (sh.place || sh.village_name || 'ಮರಗೂರ').trim(),
        category: (sh.schedule_cast || sh.category || 'ಅ - ವರ್ಗ').trim(),
        shares_count: shares,
        season_year: settings.season_year || settings.receipt_year || '2026-27',
        sugar_quantity_kg: kg,
        issued_quantity_kg: kg,
        rate_per_kg: parseFloat(ratePerKg) || 20,
        total_amount: totalAmount,
        payment_mode: paymentMode, // 'Cash' | 'UPI' | 'Bank' | 'Free'
        payment_status: paymentStatus, // 'Paid' | 'Pending'
        receipt_no: receiptNo,
        counter_no: counterNo,
        weighman_name: weighmanName,
        issued_by: currentUser?.name || currentUser?.username || 'Avinash Ghiradimath (Admin)',
        allotment_date: dateStr,
        allotment_time: timeStr,
        created_at: new Date().toISOString(),
        remarks: remarks || 'ಸ್ವತಃ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ'
      };

      const res = await ApiService.addSugarAllotment(record);
      if (res && res.success) {
        playChime('success');
        setLastSavedRecord(record);
        setShowSuccessDialog(true);
        showToast(`🎉 #${record.share_number} (${record.shareholder_name}) ಅವರಿಗೆ ${record.issued_quantity_kg} Kg ಸಕ್ಕರೆ ವಿತರಿಸಿ ಪಾವತಿ ದಾಖಲಿಸಲಾಗಿದೆ!`, 'success');

        // Refresh lists
        loadAllotments();
        onAllotmentSaved(record);
      } else {
        throw new Error(res?.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Allotment save error:', err);
      playChime('warning');
      showToast('ಸಕ್ಕರೆ ವಿತರಣೆ ದಾಖಲಿಸುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Print Official A4 Receipt for the Allotted Shareholder
  const handlePrintDeliveryReceipt = async (recordToPrint) => {
    const rec = recordToPrint || lastSavedRecord;
    if (!rec) return;

    try {
      showToast('A4 ರಶೀದಿ ಮುದ್ರಣ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...', 'info');
      const sNo = String(rec.share_number || rec.share_no);
      const qrUrl = await getReceiptQRDataUrl(sNo);
      const qrMap = new Map();
      qrMap.set(sNo, qrUrl);

      // Construct shareholder object matching receipt printer requirements
      const shObj = {
        id: rec.shareholder_id || sNo,
        share_no: sNo,
        shareholder_name: rec.shareholder_name,
        name: rec.shareholder_name,
        place: rec.village_name,
        village_name: rec.village_name,
        schedule_cast: rec.category,
        category: rec.category,
        number_of_shares: rec.shares_count || (rec.sugar_quantity_kg ? Math.round(rec.sugar_quantity_kg / 25) : 1),
        shares: rec.shares_count || (rec.sugar_quantity_kg ? Math.round(rec.sugar_quantity_kg / 25) : 1)
      };

      const receiptSettings = {
        ...settings,
        receipt_date: rec.allotment_date || new Date().toLocaleDateString('en-GB'),
        sugar_rate_per_kg: rec.rate_per_kg || 20,
        kg_per_share: settings.kg_per_share || 25,
        season_year: rec.season_year || '2026-27'
      };

      // By default: 2 shareholders side-by-side on A4 page (duplicated in Row 2 so A4 sheet is 100% filled!)
      const html = buildA4ReceiptsHtml([shObj], receiptSettings, qrMap, `A4_Sugar_Receipt_${sNo}`, {
        layout: 'grid',
        fillSecondWithDuplicate: true
      });

      openPrintDialog(html);
    } catch (err) {
      console.error('Receipt print error:', err);
      showToast('ರಶೀದಿ ಮುದ್ರಣದಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.', 'error');
    }
  };

  // Next Shareholder (Fast Queue Processing)
  const handleNextShareholder = () => {
    setSelectedShareholder(null);
    setScanInput('');
    setIsAlreadyAllotted(false);
    setExistingAllotmentRecord(null);
    setShowSuccessDialog(false);
    setLastSavedRecord(null);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  // Export Today's Allotment Register to Excel (.xlsx)
  const handleExportTodayExcel = () => {
    const list = todayStats.todays;
    if (!list || list.length === 0) {
      showToast('⚠️ ರಫ್ತು ಮಾಡಲು ಇಂದಿನ ಯಾವುದೇ ವಿತರಣಾ ದಾಖಲೆಗಳಿಲ್ಲ!', 'warning');
      return;
    }

    try {
      const rows = list.map((a, idx) => ({
        'ಕ್ರಮ ಸಂಖ್ಯೆ': idx + 1,
        'ಶೇರು ಸಂಖ್ಯೆ': a.share_number || a.share_no || '—',
        'ಶೇರುದಾರರ ಹೆಸರು': a.shareholder_name || '—',
        'ಗ್ರಾಮ / ಸ್ಥಳ': a.village_name || '—',
        'ವರ್ಗ': a.category || '—',
        'ಒಟ್ಟು ಶೇರುಗಳು': a.shares_count || 1,
        'ವಿತರಿಸಿದ ಸಕ್ಕರೆ (Kg)': a.issued_quantity_kg || a.sugar_quantity_kg || 0,
        'ದರ (ರೂ/Kg)': a.rate_per_kg || 20,
        'ಒಟ್ಟು ಮೊತ್ತ (ರೂ)': a.total_amount || 0,
        'ಪಾವತಿ ವಿಧಾನ': a.payment_mode || 'Cash',
        'ಪಾವತಿ ಸ್ಥಿತಿ': a.payment_status || 'Paid',
        'ರಶೀದಿ ಸಂಖ್ಯೆ': a.receipt_no || '—',
        'ಕೌಂಟರ್': a.counter_no || 'ಕೌಂಟರ್ 1',
        'ತೂಕಗಾರರು / ವಿತರಕರು': a.weighman_name || a.issued_by || '—',
        'ವಿತರಣಾ ದಿನಾಂಕ': a.allotment_date || '—',
        'ಸಮಯ': a.allotment_time || '—',
        'ಷರಾ': a.remarks || '—'
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sugar_Allotment_Register');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `BSSKN_Sugar_Allotment_Register_${dateStr}.xlsx`);
      showToast(`📊 ಯಶಸ್ವಿಯಾಗಿ ${rows.length} ದಾಖಲೆಗಳು ಎಕ್ಸೆಲ್‌ಗೆ ರಫ್ತಾಗಿವೆ!`, 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('ಎಕ್ಸೆಲ್ ರಫ್ತಿನಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Hidden File Scanner Container */}
      <div id="temp-sugar-file-scanner" style={{ display: 'none' }} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileScan}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-slate-100 font-['Anek_Kannada',sans-serif]">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="px-4 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/40 shrink-0">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide text-white">
                  ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ಪಾವತಿ ಕೌಂಟರ್ (Sugar Allotment & Payment)
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  ಸೀಸನ್: {settings.season_year || settings.receipt_year || '2026-27'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ • ರಶೀದಿ / ID ಕಾರ್ಡ್ ಸ್ಕ್ಯಾನ್ ಅಥವಾ ಷೇರು ನಂ ಮೂಲಕ ವಿತರಿಸಿ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('dispense')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dispense'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>ವಿತರಣೆ & ಪಾವತಿ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('today_register')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'today_register'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>ಇಂದಿನ ವಹಿ ({todayStats.count})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="ಮುಚ್ಚಿ (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY */}
        {/* ========================================================================= */}
        <div className="overflow-y-auto flex-1 p-3.5 sm:p-5 space-y-4 bg-slate-950/60">
          {activeTab === 'dispense' ? (
            <>
              {/* 1. TOP QUICK SEARCH & MULTI-SOURCE SCANNER BAR */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Manual / USB Gun Input Box */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && scanInput.trim()) {
                          handleProcessCode(scanInput.trim(), '⌨️ ಮ್ಯಾನುವಲ್ ಎಂಟ್ರಿ');
                        }
                      }}
                      placeholder="ಶೇರು ನಂ (#236) ನಮೂದಿಸಿ ಅಥವಾ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ (Press Enter)..."
                      className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all shadow-inner font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => scanInput.trim() && handleProcessCode(scanInput.trim(), '⌨️ ಮ್ಯಾನುವಲ್ ಎಂಟ್ರಿ')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      ಹುಡುಕಿ
                    </button>
                  </div>

                  {/* Camera Scanner Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setCameraError('');
                      setCameraOpen(!cameraOpen);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 ${
                      cameraOpen
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{cameraOpen ? 'ಕ್ಯಾಮರಾ ನಿಲ್ಲಿಸಿ' : '📷 QR ಕ್ಯಾಮರಾ ಸ್ಕ್ಯಾನ್'}</span>
                  </button>

                  {/* Photo Upload Scanner Trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm shrink-0"
                    title="ಫೋಟೋ ಗ್ಯಾಲರಿಯಿಂದ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>ಚಿತ್ರದಿಂದ ಸ್ಕ್ಯಾನ್</span>
                  </button>
                </div>

                {/* Camera Viewfinder Container */}
                {cameraOpen && (
                  <div className="bg-slate-950 p-3 rounded-2xl border-2 border-emerald-500/60 shadow-2xl flex flex-col items-center gap-2 animate-fadeIn">
                    <div className="flex items-center justify-between w-full max-w-sm px-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>QR ಕೋಡ್ ಕ್ಯಾಮರಾ ಮುಂದೆ ಹಿಡಿಯಿರಿ</span>
                      </div>
                      {availableCameras.length > 1 && (
                        <select
                          value={selectedCameraId}
                          onChange={(e) => setSelectedCameraId(e.target.value)}
                          className="bg-slate-900 text-slate-200 text-[11px] border border-slate-700 rounded-lg px-2 py-1 outline-none"
                        >
                          {availableCameras.map(cam => (
                            <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id}`}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="w-full max-w-sm h-64 bg-black rounded-xl overflow-hidden relative border border-slate-800 shadow-inner flex items-center justify-center">
                      <div id="sugar-camera-reader" className="w-full h-full" />
                      {!isCameraActive && !cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs bg-black/80">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                          <span>ಕ್ಯಾಮರಾ ಆರಂಭವಾಗುತ್ತಿದೆ...</span>
                        </div>
                      )}
                      {cameraError && (
                        <div className="absolute inset-0 p-4 flex flex-col items-center justify-center gap-2 text-center text-rose-400 text-xs bg-black/90">
                          <AlertTriangle className="w-8 h-8 text-rose-500" />
                          <span>{cameraError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SHAREHOLDER IDENTIFIED CARD & DISPENSING FORM */}
              {selectedShareholder ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Shareholder Profile & History (5 Cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    {/* Shareholder Profile Badge */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white text-base shadow-md">
                            #{selectedShareholder.share_no || selectedShareholder.share_number || selectedShareholder.id}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">
                              {selectedShareholder.shareholder_name || selectedShareholder.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>{selectedShareholder.place || selectedShareholder.village_name || 'ಮರಗೂರ'}</span>
                              <span>•</span>
                              <span className="text-amber-300 font-bold">{selectedShareholder.schedule_cast || selectedShareholder.category || 'ಅ - ವರ್ಗ'}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold bg-blue-900/60 text-blue-200 border border-blue-500/40 px-2 py-0.5 rounded-full">
                          {getShareholderSharesCount(selectedShareholder)} ಶೇರು
                        </span>
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">ಅರ್ಹ ಸಕ್ಕರೆ ಕೋಟಾ:</span>
                          <strong className="text-orange-400 text-sm font-black">
                            {getShareholderSharesCount(selectedShareholder) * (settings.kg_per_share || 25)} Kg
                          </strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">ಶಾಸನಬದ್ಧ ದರ:</span>
                          <strong className="text-emerald-400 text-sm font-black">
                            ರೂ. {settings.sugar_rate_per_kg || 20} / Kg
                          </strong>
                        </div>
                      </div>

                      {/* DUPLICATION WARNING BANNER */}
                      {isAlreadyAllotted && existingAllotmentRecord ? (
                        <div className="bg-rose-950/70 border-2 border-rose-600/70 p-3 rounded-xl text-rose-200 text-xs space-y-1.5 shadow-lg">
                          <div className="flex items-center gap-2 font-black text-rose-300 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>ಗಮನಿಸಿ: ಈ ಶೇರುದಾರರಿಗೆ ಈಗಾಗಲೇ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ!</span>
                          </div>
                          <div className="text-[11px] text-rose-200/90 pl-6 leading-relaxed">
                            <div>• ದಿನಾಂಕ: <strong>{existingAllotmentRecord.allotment_date || '—'}</strong> ({existingAllotmentRecord.allotment_time || ''})</div>
                            <div>• ವಿತರಿಸಿದ ಪ್ರಮಾಣ: <strong>{existingAllotmentRecord.issued_quantity_kg || existingAllotmentRecord.sugar_quantity_kg} Kg</strong> (ರೂ. {existingAllotmentRecord.total_amount || 0})</div>
                            <div>• ರಶೀದಿ ನಂ: <strong>{existingAllotmentRecord.receipt_no || '—'}</strong></div>
                            <div>• ವಿತರಕರು: <strong>{existingAllotmentRecord.issued_by || existingAllotmentRecord.weighman_name || '—'}</strong></div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePrintDeliveryReceipt(existingAllotmentRecord)}
                            className="mt-2 w-full py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>ಹಿಂದಿನ ರಶೀದಿ ಮರು-ಮುದ್ರಿಸಿ (Reprint Slip)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-950/60 border border-emerald-600/50 p-2.5 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold">
                            ಸಕ್ಕರೆ ವಿತರಣೆಗೆ ಸಿದ್ಧವಾಗಿದೆ (ಅರ್ಹ ಕೋಟಾ ಲಭ್ಯವಿದೆ)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dispensing & Payment Form (7 Cols) */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs sm:text-sm font-black text-white">
                          ವಿತರಣಾ ತೂಕ & ಪಾವತಿ ವಿವರಗಳು (Dispensing & Payment)
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ವೋಚರ್: <strong className="text-amber-300 font-bold">{receiptNo}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* 1. Sugar Quantity (KG) */}
                      <div>
                        <label className="block text-[11px] text-slate-300 font-bold mb-1">
                          ವಿತರಿಸಬೇಕಾದ ಸಕ್ಕರೆ ಪ್ರಮಾಣ (Kg):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={allottedKg}
                            onChange={(e) => setAllottedKg(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-black text-white outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            {bagsCount}
                          </span>
                        </div>
                      </div>

                      {/* 2. Sugar Rate (Rs/KG) */}
                      <div>
                        <label className="block text-[11px] text-slate-300 font-bold mb-1">
                          ಪ್ರತಿ ಕೆ.ಜಿ ದರ (ರೂ):
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={ratePerKg}
                          onChange={(e) => setRatePerKg(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-black text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Total Amount Big Banner */}
                    <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between shadow-inner">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-300 block">
                          ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ (Total Payable):
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {allottedKg} Kg × ರೂ. {ratePerKg}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-emerald-400">
                          <span className="text-sm">ರೂ.</span> {totalAmount.toLocaleString('en-IN')} <span className="text-sm">/-</span>
                        </span>
                      </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div>
                      <label className="block text-[11px] text-slate-300 font-bold mb-1.5">
                        ಪಾವತಿ ವಿಧಾನ (Payment Mode):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setPaymentMode('Cash')}
                          className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            paymentMode === 'Cash'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>ನಗದು (Cash)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMode('UPI')}
                          className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            paymentMode === 'UPI'
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>ಯುಪಿಐ (UPI)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMode('Bank')}
                          className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            paymentMode === 'Bank'
                              ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>ಕಟಾವಣೆ (Cane)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMode('Free')}
                          className={`py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            paymentMode === 'Free'
                              ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>ಉಚಿತ / ರಿಯಾಯಿತಿ</span>
                        </button>
                      </div>
                    </div>

                    {/* Operational Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10.5px] text-slate-400 font-bold mb-1">ಕೌಂಟರ್:</label>
                        <input
                          type="text"
                          value={counterNo}
                          onChange={(e) => setCounterNo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-slate-400 font-bold mb-1">ತೂಕಗಾರರು / ವಿತರಕರು:</label>
                        <input
                          type="text"
                          value={weighmanName}
                          onChange={(e) => setWeighmanName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-slate-400 font-bold mb-1">ಷರಾ / ಟಿಪ್ಪಣಿ:</label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleNextShareholder}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        ತೆರವುಗೊಳಿಸಿ (Clear)
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleSaveAllotment}
                          className={`px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50 ${
                            isAlreadyAllotted ? 'ring-2 ring-rose-500/80' : ''
                          }`}
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>{isSaving ? 'ದಾಖಲಾಗುತ್ತಿದೆ...' : (isAlreadyAllotted ? 'ಮತ್ತೊಮ್ಮೆ ವಿತರಿಸಿ & ಉಳಿಸಿ' : 'ಸಕ್ಕರೆ ವಿತರಿಸಿ & ಪಾವತಿ ದಾಖಲಿಸಿ')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* No shareholder selected state */
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3 bg-slate-950/40">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                    <PackageCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">ಯಾವುದೇ ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿಲ್ಲ</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      ಮೇಲಿನ ಹುಡುಕಾಟ ಬಾಕ್ಸ್‌ನಲ್ಲಿ <strong>ಶೇರು ಸಂಖ್ಯೆ (#236)</strong> ನಮೂದಿಸಿ, ಅಥವಾ <strong>📷 QR ಕ್ಯಾಮರಾ ಸ್ಕ್ಯಾನರ್</strong> ಮೂಲಕ ರಶೀದಿ/ID ಕಾರ್ಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. POST-ALLOTMENT SUCCESS BANNER MODAL */}
              {showSuccessDialog && lastSavedRecord && (
                <div className="bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-2 border-emerald-500 p-4 rounded-2xl shadow-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          ಯಶಸ್ವಿಯಾಗಿ ಸಕ್ಕರೆ ವಿತರಿಸಿ ಪಾವತಿ ದಾಖಲಿಸಲಾಗಿದೆ!
                        </h4>
                        <p className="text-xs text-emerald-200">
                          ಶೇರು ನಂ: <strong>#{lastSavedRecord.share_number}</strong> • {lastSavedRecord.shareholder_name} • {lastSavedRecord.issued_quantity_kg} Kg • ರೂ. {lastSavedRecord.total_amount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrintDeliveryReceipt(lastSavedRecord)}
                        className="px-4 py-2 bg-[#00823b] hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>ವಿತರಣಾ ರಶೀದಿ ಮುದ್ರಿಸಿ (Print A4)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextShareholder}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <span>ಮುಂದಿನ ಶೇರುದಾರ</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ========================================================================= */
            /* TAB 2: TODAY'S ALLOTMENT REGISTER & STATS */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Stats Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-bold">ಇಂದು ವಿತರಿಸಿದ ಸಕ್ಕರೆ:</span>
                  <strong className="text-orange-400 text-xl font-black">{todayStats.totalKg.toLocaleString()} Kg</strong>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-bold">ಒಟ್ಟು ಶೇರುದಾರರು:</span>
                  <strong className="text-purple-400 text-xl font-black">{todayStats.count.toLocaleString()} ಸದಸ್ಯರು</strong>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-bold">ನಗದು ಸಂಗ್ರಹ (Cash):</span>
                  <strong className="text-emerald-400 text-xl font-black">ರೂ. {todayStats.totalCash.toLocaleString()}</strong>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="text-[11px] text-slate-400 block font-bold">ಯುಪಿಐ ಸಂಗ್ರಹ (UPI):</span>
                  <strong className="text-blue-400 text-xl font-black">ರೂ. {todayStats.totalUpi.toLocaleString()}</strong>
                </div>
              </div>

              {/* Table Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>ಇಂದಿನ ಸಕ್ಕರೆ ವಿತರಣಾ ವಹಿ (Today's Distribution Log)</span>
                </h4>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportTodayExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್ (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadAllotments}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                    title="ಮರುಲೋಡ್ (Refresh)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Today's Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                  <thead className="bg-slate-950 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ಕ್ರ.ಸಂ.</th>
                      <th className="py-2.5 px-3">ಶೇರ್ ಸಂಖ್ಯೆ</th>
                      <th className="py-2.5 px-3">ಶೇರುದಾರರ ಹೆಸರು</th>
                      <th className="py-2.5 px-3">ಗ್ರಾಮ / ಸ್ಥಳ</th>
                      <th className="py-2.5 px-3 text-center">ಪ್ರಮಾಣ (Kg)</th>
                      <th className="py-2.5 px-3 text-center">ಮೊತ್ತ (ರೂ)</th>
                      <th className="py-2.5 px-3 text-center">ವಿಧಾನ</th>
                      <th className="py-2.5 px-3">ರಶೀದಿ ನಂ</th>
                      <th className="py-2.5 px-3">ಸಮಯ</th>
                      <th className="py-2.5 px-3 text-center">ಕ್ರಿಯೆ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {todayStats.todays.length > 0 ? (
                      todayStats.todays.map((rec, idx) => (
                        <tr key={rec.allotment_id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-300">
                            #{rec.share_number || rec.share_no}
                          </td>
                          <td className="py-2 px-3 font-bold text-white">
                            {rec.shareholder_name}
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {rec.village_name}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-orange-400">
                            {rec.issued_quantity_kg || rec.sugar_quantity_kg} Kg
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-400">
                            ರೂ. {rec.total_amount?.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
                              {rec.payment_mode || 'Cash'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-300">
                            {rec.receipt_no || '—'}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {rec.allotment_time || '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handlePrintDeliveryReceipt(rec)}
                              className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded text-[10.5px] transition-all cursor-pointer shadow-xs"
                              title="ರಶೀದಿ ಮುದ್ರಿಸಿ (Print Receipt)"
                            >
                              ಮುದ್ರಿಸಿ
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="p-8 text-center text-slate-500">
                          ಇಂದು ಯಾವುದೇ ಸಕ್ಕರೆ ವಿತರಣಾ ದಾಖಲೆಗಳಿಲ್ಲ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ವಿತರಣಾ ಕೌಂಟರ್ ಸಕ್ರಿಯವಾಗಿದೆ • ಆಪರೇಟರ್: <strong>{currentUser?.name || currentUser?.username || 'Avinash Ghiradimath'}</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
