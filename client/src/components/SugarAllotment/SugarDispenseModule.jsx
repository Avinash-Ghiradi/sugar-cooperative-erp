import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ArrowRight,
  ChevronRight,
  Layers,
  Scale,
  Award,
  BookOpen,
  Filter,
  Check,
  Eye
} from 'lucide-react';
import { ApiService, getShareholderSharesCount } from '../../services/api';
import { useCompanyLogo, getCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(165, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
}

const COUNTER_OPTIONS = [
  'ಕೌಂಟರ್ 1 (ಮುಖ್ಯ ಪ್ರವೇಶದ್ವಾರ - Gate 1)',
  'ಕೌಂಟರ್ 2 (ಸಕ್ಕರೆ ಗೋದಾಮು - Godown 1)',
  'ಕೌಂಟರ್ 3 (ವಿಶೇಷ ಕೌಂಟರ್ - Special)',
  'ಮೊಬೈಲ್ ಕೌಂಟರ್ 1 (Mobile Terminal 1)',
  'ಕಚೇರಿ ಕೌಂಟರ್ (Office Terminal)'
];

export default function SugarDispenseModule() {
  const { user, showToast } = useAuth();
  const { isEnglish } = useLanguage();
  const companyLogo = useCompanyLogo();

  // Active Tab: 'dispense' | 'today_register' | 'all_register'
  const [activeTab, setActiveTab] = useState('dispense');

  // Shareholders & Settings Data
  const [allShareholders, setAllShareholders] = useState([]);
  const [loadingShareholders, setLoadingShareholders] = useState(true);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sugar_allotment_custom_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      org_name: 'Shree Bheemashankar Sahakari Sakkare Karkhane Ni., Margur',
      kg_per_share: 25,
      sugar_rate_per_kg: 20,
      receipt_year_code: '202627'
    };
  });

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
  const [weighmanName, setWeighmanName] = useState(user?.name || user?.username || 'Avinash Ghiradimath');
  const [counterNo, setCounterNo] = useState(COUNTER_OPTIONS[0]);
  const [remarks, setRemarks] = useState('ಸ್ವತಃ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ');
  const [isSaving, setIsSaving] = useState(false);

  // Success Dialog State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState(null);

  // Registers State
  const [allAllotments, setAllAllotments] = useState([]);
  const [loadingAllotments, setLoadingAllotments] = useState(false);
  const [registerSearch, setRegisterSearch] = useState('');

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
    if (kg <= 0) return '0 ಬ್ಯಾಗ್';
    const fiftyKgBags = Math.floor(kg / 50);
    const remainder = kg % 50;
    if (fiftyKgBags > 0 && remainder > 0) {
      return `${fiftyKgBags} ಬ್ಯಾಗ್ (50 ಕೆಜಿ) + ${remainder} ಕೆಜಿ ಬಿಡಿ`;
    } else if (fiftyKgBags > 0) {
      return `${fiftyKgBags} ಬ್ಯಾಗ್ (50 ಕೆಜಿ)`;
    } else {
      return `${remainder} ಕೆಜಿ ಬಿಡಿ`;
    }
  }, [allottedKg]);

  // Load all shareholders on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoadingShareholders(true);
        const res = await ApiService.getShareholders({ page: 1, limit: 25000 });
        if (isMounted && res && res.data) {
          setAllShareholders(res.data);
        }
      } catch (err) {
        console.warn('Error loading shareholders:', err);
      } finally {
        if (isMounted) setLoadingShareholders(false);
      }
    }
    loadData();
    loadAllotments();
    return () => { isMounted = false; };
  }, []);

  // Load allotments history
  const loadAllotments = async () => {
    try {
      setLoadingAllotments(true);
      const res = await ApiService.getSugarAllotments();
      if (res && res.data) {
        setAllAllotments(res.data);
      }
    } catch (err) {
      console.warn('Error loading allotments:', err);
    } finally {
      setLoadingAllotments(false);
    }
  };

  // Today's Filtered Allotments
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  const todayAllotments = useMemo(() => {
    return allAllotments.filter(a => {
      const recDate = String(a.allotment_date || a.date || a.created_at || '');
      return recDate.includes(todayStr) || recDate.startsWith(todayStr.split('/').reverse().join('-'));
    });
  }, [allAllotments, todayStr]);

  // Today's Statistics
  const todayStats = useMemo(() => {
    const totalMembers = todayAllotments.length;
    const totalKg = todayAllotments.reduce((sum, a) => sum + (parseFloat(a.sugar_allotted_kg || a.allotted_kg || a.quantity_kg) || 0), 0);
    const totalCash = todayAllotments
      .filter(a => String(a.payment_mode || a.mode || '').toLowerCase().includes('cash') || String(a.payment_mode || '').includes('ನಗದು'))
      .reduce((sum, a) => sum + (parseFloat(a.total_amount || a.amount) || 0), 0);
    const totalUpi = todayAllotments
      .filter(a => String(a.payment_mode || a.mode || '').toLowerCase().includes('upi') || String(a.payment_mode || '').includes('ಆನ್‌ಲೈನ್'))
      .reduce((sum, a) => sum + (parseFloat(a.total_amount || a.amount) || 0), 0);

    return {
      totalMembers,
      totalKg,
      totalQuintals: (totalKg / 100).toFixed(2),
      totalCash,
      totalUpi,
      totalCollection: totalCash + totalUpi
    };
  }, [todayAllotments]);

  // Overall Season Statistics
  const seasonStats = useMemo(() => {
    const seasonList = allAllotments.filter(a => String(a.season || a.crushing_season || '2026-27').includes('2026'));
    const totalMembers = seasonList.length;
    const totalKg = seasonList.reduce((sum, a) => sum + (parseFloat(a.sugar_allotted_kg || a.allotted_kg || a.quantity_kg) || 0), 0);
    const totalAmt = seasonList.reduce((sum, a) => sum + (parseFloat(a.total_amount || a.amount) || 0), 0);
    return {
      totalMembers,
      totalKg,
      totalQuintals: (totalKg / 100).toFixed(2),
      totalAmt
    };
  }, [allAllotments]);

  // Set default values when shareholder is selected
  const handleSelectShareholder = useCallback((holder) => {
    if (!holder) {
      setSelectedShareholder(null);
      setIsAlreadyAllotted(false);
      setExistingAllotmentRecord(null);
      return;
    }

    setSelectedShareholder(holder);

    // Compute active shares
    const sharesCount = getShareholderSharesCount(holder);
    const kgPerShare = parseFloat(settings?.kg_per_share) || 25;
    const calculatedKg = Math.max(1, sharesCount) * kgPerShare;
    setAllottedKg(calculatedKg);

    const defaultRate = parseFloat(settings?.sugar_rate_per_kg) || 20;
    setRatePerKg(defaultRate);

    // Generate receipt serial
    const yearCode = settings?.receipt_year_code || '202627';
    const randSeq = String(Math.floor(1000 + Math.random() * 9000));
    setReceiptNo(`ಸವಿ/${yearCode}/${holder.share_no || holder.id}`);

    // Check duplicate allotment
    const holderShareNo = String(holder.share_no || '').trim();
    const holderId = String(holder.id || '').trim();

    const existing = allAllotments.find(a => {
      const aShareNo = String(a.share_no || a.shareholder_number || '').trim();
      const aId = String(a.shareholder_id || '').trim();
      const matchHolder = (holderShareNo && aShareNo === holderShareNo) || (holderId && aId === holderId);
      const matchSeason = String(a.season || a.crushing_season || '2026-27').includes('2026');
      return matchHolder && matchSeason;
    });

    if (existing) {
      setIsAlreadyAllotted(true);
      setExistingAllotmentRecord(existing);
      playChime('warning');
      showToast(`ಎಚ್ಚರಿಕೆ: ಶೇರುದಾರ #${holder.share_no} ರವರಿಗೆ ಈಗಾಗಲೇ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ!`, 'warning');
    } else {
      setIsAlreadyAllotted(false);
      setExistingAllotmentRecord(null);
      playChime('success');
      showToast(`ಶೇರುದಾರ #${holder.share_no} (${holder.name || holder.full_name}) ಲೋಡ್ ಆಗಿದೆ!`, 'success');
    }
  }, [allAllotments, settings, showToast]);

  // Search Shareholder from manual entry or scan
  const handleSearch = useCallback((rawQuery) => {
    const cleanNo = extractShareNoFromInput(rawQuery || scanInput);
    if (!cleanNo) {
      showToast('ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಷೇರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', 'warning');
      return;
    }

    const found = allShareholders.find(s => {
      const sNo = String(s.share_no || '').trim();
      const sId = String(s.id || '').trim();
      return sNo === cleanNo || sId === cleanNo;
    });

    if (found) {
      handleSelectShareholder(found);
      setScanInput(cleanNo);
    } else {
      playChime('warning');
      showToast(`ಷೇರು ಸಂಖ್ಯೆ #${cleanNo} ನ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ!`, 'error');
    }
  }, [allShareholders, handleSelectShareholder, scanInput, showToast]);

  // Camera QR Scanner Lifecycle
  useEffect(() => {
    if (!cameraOpen) {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
          setIsCameraActive(false);
        }).catch(() => {
          setIsCameraActive(false);
        });
      }
      return;
    }

    let isMounted = true;
    const scannerId = 'sugar-dispense-fullpage-scanner';

    async function initCamera() {
      try {
        setCameraError('');
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          let targetCam = devices[0].id;
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('rear'));
          if (backCam) targetCam = backCam.id;
          setSelectedCameraId(targetCam);

          const scanner = new Html5Qrcode(scannerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13
            ],
            verbose: false
          });
          html5QrCodeRef.current = scanner;

          await scanner.start(
            targetCam,
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              if (decodedText) {
                setCameraOpen(false);
                setScanInput(decodedText);
                handleSearch(decodedText);
              }
            },
            () => {}
          );
          setIsCameraActive(true);
        } else {
          setCameraError('ಯಾವುದೇ ಕ್ಯಾಮೆರಾ ಕಂಡುಬಂದಿಲ್ಲ (No camera device detected)');
        }
      } catch (err) {
        console.warn('Camera error:', err);
        setCameraError('ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಲಭ್ಯವಿಲ್ಲ: ' + (err.message || err));
      }
    }

    const timer = setTimeout(initCamera, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
          try { html5QrCodeRef.current.clear(); } catch (e) {}
          setIsCameraActive(false);
        });
      }
    };
  }, [cameraOpen, handleSearch]);

  // Switch camera device
  const handleSwitchCamera = async (newCamId) => {
    setSelectedCameraId(newCamId);
    if (html5QrCodeRef.current && isCameraActive) {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.start(
        newCamId,
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          setCameraOpen(false);
          setScanInput(decodedText);
          handleSearch(decodedText);
        },
        () => {}
      );
    }
  };

  // Handle Photo / File QR Upload Scan
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const tempScanner = new Html5Qrcode('temp-sugar-file-scanner-page', { verbose: false });
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      if (decodedText) {
        setScanInput(decodedText);
        handleSearch(decodedText);
      }
    } catch (err) {
      playChime('warning');
      showToast('ಫೋಟೋದಲ್ಲಿ QR ಕೋಡ್ ಕಂಡುಬಂದಿಲ್ಲ (QR not detected in image)', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Submit & Save Sugar Allotment & Payment
  const handleConfirmAllotment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedShareholder) {
      showToast('ದಯವಿಟ್ಟು ಮೊದಲು ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ', 'warning');
      return;
    }

    if (isAlreadyAllotted) {
      const confirmDup = window.confirm(
        `ಎಚ್ಚರಿಕೆ: ಶೇರುದಾರ #${selectedShareholder.share_no} ರವರಿಗೆ ಈಗಾಗಲೇ ಪ್ರಸಕ್ತ ಸಾಲಿನ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ!\n\nಖಂಡಿತವಾಗಿಯೂ ಮತ್ತೊಮ್ಮೆ ಹೆಚ್ಚುವರಿ ಸಕ್ಕರೆ ವಿತರಿಸಲು ಬಯಸುವಿರಾ?`
      );
      if (!confirmDup) return;
    }

    setIsSaving(true);
    try {
      const record = {
        share_no: selectedShareholder.share_no,
        shareholder_id: selectedShareholder.id,
        shareholder_name: selectedShareholder.name || selectedShareholder.full_name,
        village: selectedShareholder.village || selectedShareholder.place,
        taluk: selectedShareholder.taluk || '',
        category: selectedShareholder.category || 'ಅ - ವರ್ಗ',
        active_shares: getShareholderSharesCount(selectedShareholder),
        sugar_allotted_kg: parseFloat(allottedKg) || 25,
        rate_per_kg: parseFloat(ratePerKg) || 20,
        total_amount: totalAmount,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        receipt_no: receiptNo,
        weighman_name: weighmanName,
        counter_no: counterNo,
        remarks: remarks,
        season: '2026-27',
        allotment_date: new Date().toLocaleDateString('en-GB'),
        created_at: new Date().toISOString()
      };

      const res = await ApiService.addSugarAllotment(record);
      if (res && res.success) {
        playChime('success');
        setLastSavedRecord({ ...record, id: res.id || Date.now() });
        setShowSuccessDialog(true);
        showToast(`ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ₹${totalAmount} ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!`, 'success');
        loadAllotments();
      } else {
        throw new Error(res?.message || 'Failed to save');
      }
    } catch (err) {
      playChime('warning');
      showToast('ದಾಖಲಿಸಲು ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Print Official A4 Side-by-Side 2/Page Receipt
  const handlePrintReceipt = async (recordToPrint = lastSavedRecord || selectedShareholder) => {
    if (!recordToPrint) return;

    try {
      const holder = selectedShareholder || {
        share_no: recordToPrint.share_no,
        name: recordToPrint.shareholder_name,
        village: recordToPrint.village,
        category: recordToPrint.category,
        no_of_shares: recordToPrint.active_shares
      };

      const primaryQrDataUrl = await getReceiptQRDataUrl(holder.share_no);
      const factoryLogoUrl = companyLogo || DEFAULT_LOGO_PATH;

      const html = buildA4ReceiptsHtml({
        firstHolder: holder,
        secondHolder: holder,
        firstQrDataUrl: primaryQrDataUrl,
        secondQrDataUrl: primaryQrDataUrl,
        receiptYear: settings?.receipt_year_code || '202627',
        ratePerKg: recordToPrint.rate_per_kg || ratePerKg,
        kgPerShare: settings?.kg_per_share || 25,
        secondMode: 'duplicate',
        factoryLogoUrl,
        handshakeLogoUrl: COOP_HANDSHAKE_BASE64,
        includeZeroShares: false
      });

      openPrintDialog(html, `A4_Sugar_Receipt_${holder.share_no}`);
    } catch (err) {
      showToast('ರಶೀದಿ ಮುದ್ರಣದಲ್ಲಿ ದೋಷ: ' + err.message, 'error');
    }
  };

  // Reset to next shareholder in queue
  const handleNextShareholder = () => {
    setSelectedShareholder(null);
    setIsAlreadyAllotted(false);
    setExistingAllotmentRecord(null);
    setScanInput('');
    setShowSuccessDialog(false);
    setLastSavedRecord(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Export Today's or Season's Register to Excel
  const handleExportExcel = (dataToExport, fileName) => {
    if (!dataToExport || dataToExport.length === 0) {
      showToast('ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ', 'warning');
      return;
    }

    const rows = dataToExport.map((item, idx) => ({
      'ಕ್ರಮ ಸಂಖ್ಯೆ (Sl No)': idx + 1,
      'ದಿನಾಂಕ (Date)': item.allotment_date || item.date || '',
      'ರಶೀದಿ ಸಂಖ್ಯೆ (Receipt No)': item.receipt_no || '',
      'ಷೇರು ಸಂಖ್ಯೆ (Share No)': item.share_no || '',
      'ಶೇರುದಾರರ ಹೆಸರು (Shareholder Name)': item.shareholder_name || item.name || '',
      'ಗ್ರಾಮ (Village)': item.village || '',
      'ವರ್ಗ (Category)': item.category || 'ಅ - ವರ್ಗ',
      'ಷೇರುಗಳ ಪ್ರಮಾಣ (Shares)': item.active_shares || 1,
      'ವಿತರಿಸಿದ ಸಕ್ಕರೆ (Kg)': item.sugar_allotted_kg || item.allotted_kg || 25,
      'ದರ (Rate Rs/Kg)': item.rate_per_kg || 20,
      'ಒಟ್ಟು ಮೊತ್ತ (Total Amount Rs)': item.total_amount || 500,
      'ಪಾವತಿ ವಿಧಾನ (Payment Mode)': item.payment_mode || 'Cash',
      'ಪಾವತಿ ಸ್ಥಿತಿ (Payment Status)': item.payment_status || 'Paid',
      'ತೂಕಗಾರರ ಹೆಸರು (Weighman)': item.weighman_name || '',
      'ಕೌಂಟರ್ (Counter)': item.counter_no || '',
      'ಷರಾ (Remarks)': item.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ಸಕ್ಕರೆ ವಿತರಣಾ ವಹಿ');
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ಎಕ್ಸೆಲ್ ವಹಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!', 'success');
  };

  // Filtered Register Records
  const filteredAllAllotments = useMemo(() => {
    if (!registerSearch.trim()) return allAllotments;
    const q = registerSearch.trim().toLowerCase();
    return allAllotments.filter(a => {
      const name = String(a.shareholder_name || a.name || '').toLowerCase();
      const shareNo = String(a.share_no || '');
      const rcpt = String(a.receipt_no || '').toLowerCase();
      const village = String(a.village || '').toLowerCase();
      const counter = String(a.counter_no || '').toLowerCase();
      return name.includes(q) || shareNo.includes(q) || rcpt.includes(q) || village.includes(q) || counter.includes(q);
    });
  }, [allAllotments, registerSearch]);

  return (
    <div className="space-y-4 pb-12 animate-fadeIn font-kannada">
      {/* Hidden dummy div for image file scanner */}
      <div id="temp-sugar-file-scanner-page" style={{ display: 'none' }} />

      {/* TOP HEADER & BREADCRUMB */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ಸಕ್ಕರೆ ವಿತರಣೆ & ಪಾವತಿ ಕೌಂಟರ್
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-950 border border-emerald-700 text-emerald-400">
                ಹಂಗಾಮು 2026-27
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ</span>
              <span>•</span>
              <span className="text-slate-300">ರಶೀದಿ / ID ಸ್ಕ್ಯಾನರ್, ಸ್ವಯಂ ಲೆಕ್ಕಾಚಾರ & ನೇರ A4 ಮುದ್ರಣ</span>
            </p>
          </div>
        </div>

        {/* Counter Selection & User Badge */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-300 font-bold">{todayStr}</span>
          </div>

          <select
            value={counterNo}
            onChange={(e) => setCounterNo(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500"
          >
            {COUNTER_OPTIONS.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadAllotments}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="ರಿಫ್ರೆಶ್"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loadingAllotments ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOP LIVE KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today Allotted Members */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>ಇಂದು ವಿತರಿಸಲಾದ ಶೇರುದಾರರು</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {todayStats.totalMembers} <span className="text-xs font-normal text-slate-400">ಜನ</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Today Sugar Kg */}
        <div className="bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>ಇಂದು ವಿತರಿಸಿದ ಸಕ್ಕರೆ</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              {todayStats.totalKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">ಕೆಜಿ</span>
            </div>
            <div className="text-[10px] text-teal-300 font-mono mt-0.5">
              ({todayStats.totalQuintals} ಕ್ವಿಂಟಾಲ್)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Today Cash Collection */}
        <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              <span>ನಗದು ಸಂಗ್ರಹ (Cash)</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              ₹ {todayStats.totalCash.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Today UPI Collection */}
        <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / ಆನ್‌ಲೈನ್ ಸಂಗ್ರಹ</span>
            </div>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              ₹ {todayStats.totalUpi.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MODULE NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('dispense')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-2xl transition-all cursor-pointer ${
            activeTab === 'dispense'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-l border-r border-emerald-500/50 border-b-transparent shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ಪಾವತಿ (Dispense Terminal)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('today_register')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-2xl transition-all cursor-pointer ${
            activeTab === 'today_register'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-l border-r border-emerald-500/50 border-b-transparent shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ಇಂದಿನ ವಿತರಣಾ ವಹಿ ({todayAllotments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all_register')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-2xl transition-all cursor-pointer ${
            activeTab === 'all_register'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-l border-r border-emerald-500/50 border-b-transparent shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>ಸೀಸನ್ ಒಟ್ಟು ವಹಿ ({allAllotments.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DISPENSE & PAYMENT TERMINAL */}
      {/* ========================================================================= */}
      {activeTab === 'dispense' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT 7 COLUMNS: SEARCH, SCANNER & SHAREHOLDER CARD */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Scan Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>ಶೇರುದಾರರ ರಶೀದಿ / ID ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಷೇರು ನಂ ನಮೂದಿಸಿ</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  (ಹ್ಯಾಂಡ್‌ಹೆಲ್ಡ್ USB ಗನ್ ಸಪೋರ್ಟ್ ಇದೆ)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(scanInput);
                      }
                    }}
                    placeholder="ಷೇರು ನಂ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ (ಉದಾ: 236)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 font-mono shadow-inner pr-10"
                    autoFocus
                  />
                  {scanInput && (
                    <button
                      type="button"
                      onClick={() => setScanInput('')}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSearch(scanInput)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>ಹುಡುಕಿ</span>
                </button>
              </div>

              {/* Camera & File Upload Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setCameraOpen(!cameraOpen)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    cameraOpen
                      ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>{cameraOpen ? 'ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ (Close Camera)' : 'ಕ್ಯಾಮೆರಾ QR ಸ್ಕ್ಯಾನರ್ (Live Camera)'}</span>
                </button>

                <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>ಫೋಟೋ / ಇಮೇಜ್ ಸ್ಕ್ಯಾನ್</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* CAMERA VIEWPORT */}
              {cameraOpen && (
                <div className="p-3 bg-slate-950 border border-slate-700 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>ಕ್ಯಾಮೆರಾದ ಮುಂದೆ ರಶೀದಿ ಅಥವಾ ID QR ಕೋಡ್ ಹಿಡಿಯಿರಿ</span>
                    </span>
                    {availableCameras.length > 1 && (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => handleSwitchCamera(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-[11px]"
                      >
                        {availableCameras.map(c => (
                          <option key={c.id} value={c.id}>{c.label || `Camera ${c.id}`}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="relative overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center border border-slate-800">
                    <div id="sugar-dispense-fullpage-scanner" className="w-full h-full" />
                  </div>

                  {cameraError && (
                    <div className="p-2 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                      {cameraError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SHAREHOLDER PROFILE DETAILS CARD */}
            {selectedShareholder ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-md border border-emerald-400/30">
                      {selectedShareholder.share_no || '#'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400">
                          ಷೇರು ನಂ #{selectedShareholder.share_no}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {selectedShareholder.category || 'ಅ - ವರ್ಗ'}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">
                        {selectedShareholder.name || selectedShareholder.full_name}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {selectedShareholder.father_name ? `ತಂದೆ: ${selectedShareholder.father_name} • ` : ''}
                        {selectedShareholder.village || selectedShareholder.place || '-'}
                        {selectedShareholder.taluk ? `, ${selectedShareholder.taluk}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectShareholder(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    title="ತೆರವುಗೊಳಿಸಿ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* DUPLICATE ALLOTMENT ALERT */}
                {isAlreadyAllotted && existingAllotmentRecord && (
                  <div className="p-4 bg-amber-950/70 border-2 border-amber-500/80 rounded-2xl text-amber-200 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                      <span>ಎಚ್ಚರಿಕೆ: ಪ್ರಸಕ್ತ ಸಾಲಿನಲ್ಲಿ (`2026-27`) ಈಗಾಗಲೇ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ!</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-amber-100">
                      <div>ರಶೀದಿ: <strong>{existingAllotmentRecord.receipt_no || '-'}</strong></div>
                      <div>ದಿನಾಂಕ: <strong>{existingAllotmentRecord.allotment_date || '-'}</strong></div>
                      <div>ಪ್ರಮಾಣ: <strong>{existingAllotmentRecord.sugar_allotted_kg || 25} ಕೆಜಿ</strong></div>
                      <div>ಮೊತ್ತ: <strong>₹{existingAllotmentRecord.total_amount || 500}</strong></div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-amber-300">ತೂಕಗಾರರು: {existingAllotmentRecord.weighman_name || 'ಕೌಂಟರ್'}</span>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(existingAllotmentRecord)}
                        className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>ಹಿಂದಿನ ರಶೀದಿ ಮರುಮುದ್ರಿಸಿ</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MEMBER STATS SUMMARY TILES */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">ಒಟ್ಟು ಷೇರುಗಳು</span>
                    <strong className="text-base text-emerald-400 font-mono">
                      {getShareholderSharesCount(selectedShareholder)} ಷೇರು
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">ಅರ್ಹ ಸಕ್ಕರೆ ಕೋಟಾ</span>
                    <strong className="text-base text-teal-300 font-mono">
                      {allottedKg} ಕಿ.ಗ್ರಾಂ
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ</span>
                    <strong className="text-base text-amber-300 font-mono">
                      ₹ {totalAmount.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-300">
                  ಯಾವುದೇ ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿಲ್ಲ
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  ಮೇಲಿನ ಸರ್ಚ್ ಬಾಕ್ಸ್‌ನಲ್ಲಿ ಷೇರು ನಂಬರ್ ನಮೂದಿಸಿ `ಹುಡುಕಿ` ಒತ್ತಿರಿ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಬಳಸಿ ರಶೀದಿ / ID ಕಾರ್ಡ್ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT 5 COLUMNS: DISPENSE & PAYMENT FORM */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>ವಿತರಣೆ ಮತ್ತು ಪಾವತಿ ವಿವರಗಳು (Payment)</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {bagsCount}
                </span>
              </div>

              <form onSubmit={handleConfirmAllotment} className="space-y-4">
                {/* Quantity & Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ಸಕ್ಕರೆ ಪ್ರಮಾಣ (ಕಿ.ಗ್ರಾಂ)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={allottedKg}
                      onChange={(e) => setAllottedKg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ಪ್ರತಿ ಕೆಜಿ ದರ (ರೂ.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={ratePerKg}
                      onChange={(e) => setRatePerKg(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Total Payable Box */}
                <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-slate-950 to-teal-950/80 border border-emerald-600/50 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಗ್ರಹಿಸಬೇಕಾದ ಮೊತ್ತ (Grand Total):</span>
                    <span className="text-[10px] text-slate-500">{allottedKg} ಕೆಜಿ × ₹{ratePerKg}/ಕೆಜಿ</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-300 font-mono">
                    ₹ {totalAmount.toLocaleString()}
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    ಪಾವತಿ ವಿಧಾನ (Payment Mode)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Cash', label: '💵 ನಗದು (Cash)' },
                      { id: 'UPI', label: '📱 UPI / QR' },
                      { id: 'Bank', label: '🏦 ಬ್ಯಾಂಕ್ ಕಡಿತ' },
                      { id: 'Free', label: '🎁 ಉಚಿತ / ರಿಯಾಯಿತಿ' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                          paymentMode === mode.id
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Status & Receipt Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ಪಾವತಿ ಸ್ಥಿತಿ
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="Paid">ಪಾವತಿಸಲಾಗಿದೆ (Paid)</option>
                      <option value="Pending">ಬಾಕಿ (Pending)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ರಶೀದಿ ನಂಬರ್ (Voucher No)
                    </label>
                    <input
                      type="text"
                      value={receiptNo}
                      onChange={(e) => setReceiptNo(e.target.value)}
                      placeholder="ಸವಿ/202627/001"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Weighman Name & Remarks */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ತೂಕಗಾರರ ಹೆಸರು (Weighman)
                    </label>
                    <input
                      type="text"
                      value={weighmanName}
                      onChange={(e) => setWeighmanName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ಷರಾ (Remarks)
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Confirm & Save Button */}
                <button
                  type="submit"
                  disabled={!selectedShareholder || isSaving}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !selectedShareholder || isSaving
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : isAlreadyAllotted
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/50'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
                  }`}
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>
                    {isSaving
                      ? 'ದಾಖಲಾಗುತ್ತಿದೆ...'
                      : isAlreadyAllotted
                      ? 'ಹೆಚ್ಚುವರಿ ಸಕ್ಕರೆ ವಿತರಣೆ & ಪಾವತಿ ದೃಢೀಕರಿಸಿ'
                      : `ವಿತರಣೆ & ₹${totalAmount} ಪಾವತಿ ದೃಢೀಕರಿಸಿ`}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TODAY'S LIVE DELIVERY REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'today_register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <span>ಇಂದಿನ ಸಕ್ಕರೆ ವಿತರಣಾ ಮತ್ತು ನಗದು ವಹಿ ({todayStr})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ಕೌಂಟರ್‌ನಲ್ಲಿ ಇಂದು ವಿತರಿಸಲಾದ ಎಲ್ಲಾ ದಾಖಲೆಗಳು
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleExportExcel(todayAllotments, `Today_Sugar_Delivery_${todayStr.replace(/\//g, '-')}`)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>ಇಂದಿನ ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್ (.xlsx)</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#608b34] text-white font-bold text-[11px] border-b border-[#4d7228]">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="px-3 py-2.5">ರಶೀದಿ ನಂ</th>
                  <th className="px-3 py-2.5 text-center">ಷೇರು ನಂ</th>
                  <th className="px-3 py-2.5">ಶೇರುದಾರರ ಹೆಸರು</th>
                  <th className="px-3 py-2.5">ಸ್ಥಳ / ಗ್ರಾಮ</th>
                  <th className="px-3 py-2.5 text-center">ಸಕ್ಕರೆ (ಕೆಜಿ)</th>
                  <th className="px-3 py-2.5 text-right">ಮೊತ್ತ (ರೂ.)</th>
                  <th className="px-3 py-2.5 text-center">ವಿಧಾನ</th>
                  <th className="px-3 py-2.5 text-center">ಸ್ಥಿತಿ</th>
                  <th className="px-3 py-2.5">ತೂಕಗಾರರು</th>
                  <th className="px-3 py-2.5 text-center">ಕ್ರಿಯೆಗಳು</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {todayAllotments.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-8 text-center text-slate-500 font-bold">
                      ಇಂದು ಇನ್ನೂ ಯಾವುದೇ ಸಕ್ಕರೆ ವಿತರಣೆ ದಾಖಲಾಗಿಲ್ಲ.
                    </td>
                  </tr>
                ) : (
                  todayAllotments.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400 font-bold">{item.receipt_no || '-'}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-white">#{item.share_no}</td>
                      <td className="px-3 py-2 font-bold text-white">{item.shareholder_name || item.name}</td>
                      <td className="px-3 py-2 text-slate-400">{item.village || '-'}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-teal-300">
                        {item.sugar_allotted_kg || item.allotted_kg} ಕೆಜಿ
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-300">
                        ₹ {parseFloat(item.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                          {item.payment_mode || 'Cash'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-400">
                          {item.payment_status || 'Paid'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">{item.weighman_name || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(item)}
                          className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          title="ರಶೀದಿ ಮುದ್ರಿಸಿ"
                        >
                          <Printer className="w-3 h-3" />
                          <span>ರಶೀದಿ</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SEASON MASTER REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'all_register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>ಪ್ರಸಕ್ತ ಸಾಲಿನ ಒಟ್ಟು ಸಕ್ಕರೆ ವಿತರಣಾ ಮಾಸ್ಟರ್ ವಹಿ (Season 2026-27)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ಒಟ್ಟು {allAllotments.length} ಸದಸ್ಯರಿಗೆ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ • ಒಟ್ಟು ಸಂಗ್ರಹ: ₹{seasonStats.totalAmt.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={registerSearch}
                  onChange={(e) => setRegisterSearch(e.target.value)}
                  placeholder="ಹೆಸರು, ಷೇರು ನಂ, ರಶೀದಿ ಹುಡುಕಿ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleExportExcel(filteredAllAllotments, 'Season_Sugar_Delivery_Register_2026-27')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>ಎಕ್ಸೆಲ್ ರಫ್ತು (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#608b34] text-white font-bold text-[11px] border-b border-[#4d7228]">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">ಕ್ರ.ಸಂ.</th>
                  <th className="px-3 py-2.5">ದಿನಾಂಕ</th>
                  <th className="px-3 py-2.5">ರಶೀದಿ ನಂ</th>
                  <th className="px-3 py-2.5 text-center">ಷೇರು ನಂ</th>
                  <th className="px-3 py-2.5">ಶೇರುದಾರರ ಹೆಸರು</th>
                  <th className="px-3 py-2.5">ಸ್ಥಳ / ಗ್ರಾಮ</th>
                  <th className="px-3 py-2.5 text-center">ಸಕ್ಕರೆ (ಕೆಜಿ)</th>
                  <th className="px-3 py-2.5 text-right">ಮೊತ್ತ (ರೂ.)</th>
                  <th className="px-3 py-2.5 text-center">ವಿಧಾನ</th>
                  <th className="px-3 py-2.5">ಕೌಂಟರ್</th>
                  <th className="px-3 py-2.5 text-center">ಕ್ರಿಯೆಗಳು</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredAllAllotments.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-8 text-center text-slate-500 font-bold">
                      ಯಾವುದೇ ವಿತರಣಾ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
                    </td>
                  </tr>
                ) : (
                  filteredAllAllotments.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 text-slate-400">{item.allotment_date || item.date || '-'}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400 font-bold">{item.receipt_no || '-'}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-white">#{item.share_no}</td>
                      <td className="px-3 py-2 font-bold text-white">{item.shareholder_name || item.name}</td>
                      <td className="px-3 py-2 text-slate-400">{item.village || '-'}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-teal-300">
                        {item.sugar_allotted_kg || item.allotted_kg} ಕೆಜಿ
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-300">
                        ₹ {parseFloat(item.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                          {item.payment_mode || 'Cash'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">{item.counter_no || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(item)}
                          className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          title="ರಶೀದಿ ಮುದ್ರಿಸಿ"
                        >
                          <Printer className="w-3 h-3" />
                          <span>ರಶೀದಿ</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POST-ALLOTMENT SUCCESS DIALOG */}
      {showSuccessDialog && lastSavedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ಶೇರುದಾರ #{lastSavedRecord.share_no} ({lastSavedRecord.shareholder_name}) ರವರಿಗೆ {lastSavedRecord.sugar_allotted_kg} ಕೆಜಿ ಸಕ್ಕರೆ ವಿತರಿಸಿ ₹{lastSavedRecord.total_amount} ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">ರಶೀದಿ ಸಂಖ್ಯೆ:</span>
                <span className="text-emerald-400 font-bold">{lastSavedRecord.receipt_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ಪಾವತಿ ವಿಧಾನ:</span>
                <span>{lastSavedRecord.payment_mode} ({lastSavedRecord.payment_status})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ಕೌಂಟರ್ / ತೂಕಗಾರ:</span>
                <span>{lastSavedRecord.weighman_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintReceipt(lastSavedRecord)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>A4 ರಶೀದಿ ಮುದ್ರಿಸಿ (Print 2/Page)</span>
              </button>

              <button
                type="button"
                onClick={handleNextShareholder}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>ಮುಂದಿನವರು</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
