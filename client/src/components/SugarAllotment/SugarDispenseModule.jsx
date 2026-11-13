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
  Eye,
  Settings,
  Users,
  Trash2,
  RotateCcw,
  ShieldAlert,
  KeyRound,
  EyeOff,
  Lock
} from 'lucide-react';
import { CloudDbService } from '../../services/cloudDb';
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
 * 1. URL: ...?attn=236 or ...?share_no=#126
 * 2. System Prefix: BSSKN-236, BSSKN-#126, SN: 236 (preserves symbols like # or ಬ-$)
 * 3. JSON string: {"share_no": "#126"}
 * 4. Exact Share Number (e.g. #126, 126, ಬ-$1)
 */
export function extractShareNoFromInput(raw) {
  if (raw === undefined || raw === null) return '';
  let text = String(raw).trim();
  if (!text) return '';

  // 1. URL search parameter
  try {
    if (text.includes('?')) {
      const urlObj = new URL(text.startsWith('http') ? text : `https://dummy.com/${text}`);
      const param = urlObj.searchParams.get('attn') || urlObj.searchParams.get('share_no') || urlObj.searchParams.get('id');
      if (param) return param.trim();
    }
  } catch (e) {}

  // 2. Direct JSON
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const obj = JSON.parse(text);
      if (obj.share_no !== undefined && obj.share_no !== null) return String(obj.share_no).trim();
      if (obj.id !== undefined && obj.id !== null) return String(obj.id).trim();
    } catch (e) {}
  }

  // 3. System prefix removal (e.g. BSSKN-126, BSSKN-#126, SN: 126, SHARE-#126, MEMBER-126)
  // Strips system prefix, but strictly PRESERVES category symbols like # or ಬ-$!
  const prefixMatch = text.match(/^(?:BSSKN|ATTN|SHARE|MEMBER|SN)[:\-\s]+(.*)$/i);
  if (prefixMatch && prefixMatch[1]) {
    text = prefixMatch[1].trim();
  }

  return text;
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

// Dynamic counter name bound to logged-in user

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
      kg_per_share: 30,
      sugar_rate_per_kg: 30,
      receipt_year_code: '202627'
    };
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  // Input & Scanner States
  const [scanInput, setScanInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraRetry, setCameraRetry] = useState(0);

  // Selected Shareholder for Dispensing
  const [selectedShareholder, setSelectedShareholder] = useState(null);
  const [allotmentHistory, setAllotmentHistory] = useState([]);
  const [isAlreadyAllotted, setIsAlreadyAllotted] = useState(false);
  const [existingAllotmentRecord, setExistingAllotmentRecord] = useState(null);

  // Form Fields (Initialized from saved settings, default: 30 kg @ ₹30/kg)
  const [allottedKg, setAllottedKg] = useState(() => {
    try {
      const saved = localStorage.getItem('sugar_allotment_custom_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.kg_per_share !== undefined) return parseFloat(parsed.kg_per_share) || 30;
      }
    } catch (e) {}
    return 30;
  });
  const [ratePerKg, setRatePerKg] = useState(() => {
    try {
      const saved = localStorage.getItem('sugar_allotment_custom_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sugar_rate_per_kg !== undefined) return parseFloat(parsed.sugar_rate_per_kg) || 30;
      }
    } catch (e) {}
    return 30;
  });
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'UPI' | 'Bank' | 'Free'
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // 'Paid' | 'Pending'
  const [receiptNo, setReceiptNo] = useState('');
  // User identification & Admin filter states
  const currentUserDisplayName = useMemo(() => {
    return user?.name || user?.username || 'Avinash Ghiradimath';
  }, [user]);

  const isAdmin = useMemo(() => {
    return user?.role === 'Admin' || user?.username?.toLowerCase() === 'admin';
  }, [user]);

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [employeesList, setEmployeesList] = useState([]);

  const [weighmanName, setWeighmanName] = useState(user?.name || user?.username || 'Avinash Ghiradimath');
  const [counterNo, setCounterNo] = useState(`ಕೌಂಟರ್: ${user?.name || user?.username || 'Avinash Ghiradimath'}`);
  const [remarks, setRemarks] = useState('ಸ್ವತಃ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ');
  const [isSaving, setIsSaving] = useState(false);

  // Keep weighmanName and counterNo synced with logged in user
  useEffect(() => {
    const name = user?.name || user?.username || 'Avinash Ghiradimath';
    setWeighmanName(name);
    setCounterNo(`ಕೌಂಟರ್: ${name}`);
  }, [user]);

  // Success Dialog State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState(null);

  // Registers State
  const [allAllotments, setAllAllotments] = useState([]);
  const [loadingAllotments, setLoadingAllotments] = useState(false);
  const [registerSearch, setRegisterSearch] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Reset Security Modal State
  const REQUIRED_RESET_CODE = 'RESET12071990';
  const [showResetSecurityModal, setShowResetSecurityModal] = useState(false);
  const [resetTargetSeason, setResetTargetSeason] = useState('ALL');
  const [resetSecurityCodeInput, setResetSecurityCodeInput] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [resetErrorMessage, setResetErrorMessage] = useState('');

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

  // Sync settings dynamically from Cloud and Event Listeners
  useEffect(() => {
    const applyNewSettings = (newSet) => {
      if (!newSet) return;
      setSettings(prev => ({ ...prev, ...newSet }));
      setTempSettings(prev => ({ ...prev, ...newSet }));

      setSelectedShareholder(current => {
        if (!current) {
          if (newSet.kg_per_share !== undefined) setAllottedKg(parseFloat(newSet.kg_per_share) || 30);
          if (newSet.sugar_rate_per_kg !== undefined) setRatePerKg(parseFloat(newSet.sugar_rate_per_kg) || 30);
        } else {
          const shares = getShareholderSharesCount(current);
          const kg = Math.max(1, shares) * (parseFloat(newSet.kg_per_share) || 30);
          setAllottedKg(kg);
          if (newSet.sugar_rate_per_kg !== undefined) setRatePerKg(parseFloat(newSet.sugar_rate_per_kg) || 30);
        }
        return current;
      });
    };

    // 1. Fetch latest settings from Supabase Cloud
    const fetchCloudSettings = async () => {
      try {
        if (CloudDbService.isEnabled()) {
          const list = await CloudDbService.getCollection('system_settings');
          if (Array.isArray(list)) {
            const cloudSet = list.find(x => x.record_id === 'sugar_allotment_custom_settings' || x.id === 'sugar_allotment_custom_settings');
            if (cloudSet) {
              localStorage.setItem('sugar_allotment_custom_settings', JSON.stringify(cloudSet));
              applyNewSettings(cloudSet);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading cloud settings in dispense terminal:', err);
      }
    };
    fetchCloudSettings();

    // 2. Listen to custom event and storage event across tabs and components
    const handleSettingsEvent = (e) => {
      try {
        const data = e?.detail || JSON.parse(localStorage.getItem('sugar_allotment_custom_settings') || '{}');
        applyNewSettings(data);
      } catch (err) {}
    };

    window.addEventListener('sugar_settings_updated', handleSettingsEvent);
    window.addEventListener('storage', handleSettingsEvent);
    return () => {
      window.removeEventListener('sugar_settings_updated', handleSettingsEvent);
      window.removeEventListener('storage', handleSettingsEvent);
    };
  }, []);

  // Save Settings directly from Dispense Terminal
  const handleSaveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('sugar_allotment_custom_settings', JSON.stringify(tempSettings));
    window.dispatchEvent(new CustomEvent('sugar_settings_updated', { detail: tempSettings }));
    if (CloudDbService.isEnabled()) {
      CloudDbService.saveCollectionItem('system_settings', 'sugar_allotment_custom_settings', tempSettings).catch(() => {});
    }
    if (!selectedShareholder) {
      setAllottedKg(parseFloat(tempSettings.kg_per_share) || 30);
      setRatePerKg(parseFloat(tempSettings.sugar_rate_per_kg) || 30);
    } else {
      const shares = getShareholderSharesCount(selectedShareholder);
      setAllottedKg(Math.max(1, shares) * (parseFloat(tempSettings.kg_per_share) || 30));
      setRatePerKg(parseFloat(tempSettings.sugar_rate_per_kg) || 30);
    }
    setShowSettingsModal(false);
    showToast('ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸಂರಚನೆ ಉಳಿಸಲಾಗಿದೆ (Settings updated)!');
  };

  // Available seasons detected from database and standard seasons
  const availableSeasons = useMemo(() => {
    const seasonsSet = new Set();
    seasonsSet.add('2026-27');
    for (const a of allAllotments) {
      const s = String(a.season || a.crushing_season || '').trim();
      if (s) seasonsSet.add(s);
    }
    ['2025-26', '2024-25', '2023-24'].forEach(s => seasonsSet.add(s));
    return Array.from(seasonsSet).sort().reverse();
  }, [allAllotments]);

  const getSeasonRecordsCount = useCallback((season) => {
    if (season === 'ALL') return allAllotments.length;
    return allAllotments.filter(a => {
      const s = String(a.season || a.crushing_season || '2026-27').trim();
      return s === season || (season.includes(s) && s.length >= 4);
    }).length;
  }, [allAllotments]);

  // Open Reset Security Modal
  const handleOpenResetModal = (initialSeason = 'ALL') => {
    setResetTargetSeason(initialSeason);
    setResetSecurityCodeInput('');
    setShowSecretCode(false);
    setResetErrorMessage('');
    setShowResetSecurityModal(true);
  };

  // Execute Reset with Code Authentication & Season Filtering
  const handleExecuteReset = async () => {
    setResetErrorMessage('');
    const inputCode = (resetSecurityCodeInput || '').trim().toUpperCase();
    if (inputCode !== REQUIRED_RESET_CODE) {
      setResetErrorMessage('ತಪ್ಪಾದ ಭದ್ರತಾ ಕೋಡ್! ದಯವಿಟ್ಟು ಸರಿಯಾದ ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ (Incorrect Secret Code).');
      playChime('warning');
      return;
    }

    setIsResetting(true);
    try {
      await ApiService.resetAllSugarAllotments(resetTargetSeason);
      if (resetTargetSeason === 'ALL') {
        setAllAllotments([]);
        setSelectedShareholder(null);
        setIsAlreadyAllotted(false);
        setExistingAllotmentRecord(null);
        setLastSavedRecord(null);
        setScanInput('');
        setShowSuccessDialog(false);
      } else {
        setAllAllotments(prev => prev.filter(a => {
          const s = String(a.season || a.crushing_season || '2026-27').trim();
          return !(s === resetTargetSeason || (resetTargetSeason.includes(s) && s.length >= 4));
        }));
      }

      setShowResetSecurityModal(false);
      setShowSettingsModal(false);
      setResetSecurityCodeInput('');
      playChime('success');
      showToast(
        resetTargetSeason === 'ALL'
          ? 'ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ಪಾವತಿ ಕೌಂಟರ್‌ನ ಎಲ್ಲಾ ಸೀಸನ್‌ಗಳ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಲಾಗಿದೆ (All entries erased)!'
          : `ಸೀಸನ್ ${resetTargetSeason} ರ ದಾಖಲೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ (Season ${resetTargetSeason} erased)!`,
        'success'
      );
      loadAllotments();
    } catch (err) {
      console.error('Reset allotments error:', err);
      setResetErrorMessage('ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ: ' + err.message);
      showToast('ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ: ' + err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Load employees list on mount for Admin filtering
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await ApiService.getEmployees();
        if (res && Array.isArray(res.data)) {
          setEmployeesList(res.data);
        }
      } catch (err) {
        console.warn('Error fetching employees in SugarDispenseModule:', err);
      }
    }
    fetchEmployees();
  }, []);

  // Compute list of available employees/operators for Admin filter
  const availableEmployees = useMemo(() => {
    const map = new Map();
    // Current user first
    const curName = (user?.name || user?.username || '').trim();
    if (curName) {
      map.set(curName, {
        name: curName,
        role: user?.role || 'Admin',
        employee_id: user?.employee_id || ''
      });
    }
    // From employee master
    (employeesList || []).forEach(emp => {
      const name = (emp.name || emp.username || '').trim();
      if (name && !map.has(name)) {
        map.set(name, {
          name,
          role: emp.role || 'Employee',
          employee_id: emp.employee_id || ''
        });
      }
    });
    // From existing transaction records
    (allAllotments || []).forEach(a => {
      const wName = (a.weighman_name || a.created_by || a.operator_name || '').trim();
      if (wName && !map.has(wName)) {
        map.set(wName, {
          name: wName,
          role: 'Operator',
          employee_id: ''
        });
      }
    });
    return Array.from(map.values());
  }, [employeesList, allAllotments, user]);

  // Load all shareholders on mount (prioritize full indexedDB / raw cache of 17,000+ members)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoadingShareholders(true);
        let data = [];
        try {
          if (ApiService.getAllShareholdersRaw) {
            const raw = await ApiService.getAllShareholdersRaw();
            if (Array.isArray(raw) && raw.length > 0) {
              data = raw;
            }
          }
        } catch (rawErr) {
          console.warn('Raw shareholders load fallback:', rawErr);
        }

        if (data.length === 0) {
          const res = await ApiService.getShareholders({ page: 1, limit: 1000 });
          if (res && res.data) data = res.data;
        }

        if (isMounted && data.length > 0) {
          setAllShareholders(data);
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

  // Fast Map lookup for shareholder details by share_no and id
  const shareholderLookupMap = useMemo(() => {
    const map = new Map();
    for (const sh of allShareholders) {
      const sNo = String(sh.share_no || sh.share_number || '').trim().replace(/^#/, '');
      if (sNo) map.set(sNo, sh);
      if (sh.id) map.set(String(sh.id), sh);
      if (sh.shareholder_id) map.set(String(sh.shareholder_id), sh);
    }
    return map;
  }, [allShareholders]);

  // Load allotments history from Cloud & Local
  const loadAllotments = useCallback(async () => {
    try {
      setLoadingAllotments(true);
      const res = await ApiService.getSugarAllotments();
      if (res && Array.isArray(res.data)) {
        setAllAllotments(res.data);
      }
    } catch (err) {
      console.warn('Error loading allotments:', err);
    } finally {
      setLoadingAllotments(false);
    }
  }, []);

  // Format and enrich allotment record with accurate shareholder name & village
  const formatAllotmentRecord = useCallback((a) => {
    const cleanNo = String(a.share_no || a.share_number || '').trim().replace(/^#/, '');
    const matchedHolder = cleanNo ? shareholderLookupMap.get(cleanNo) : null;
    const holderName = (a.shareholder_name && a.shareholder_name !== 'Shareholder' && a.shareholder_name !== 'Member')
      ? a.shareholder_name
      : (matchedHolder?.shareholder_name || matchedHolder?.name || a.shareholder_name || 'Member');
    const holderVillage = (a.village && a.village !== 'Gaon')
      ? a.village
      : (matchedHolder?.place || matchedHolder?.village || a.village_name || '-');
    const kg = parseFloat(a.sugar_allotted_kg || a.sugar_quantity_kg || a.issued_quantity_kg || a.allotted_kg || a.quantity_kg) || 25;
    const rate = parseFloat(a.rate_per_kg) || 20;
    const amount = parseFloat(a.total_amount || a.amount) || (kg * rate);

    return {
      ...a,
      share_no: cleanNo || a.share_no || a.share_number,
      shareholder_name: holderName,
      village: holderVillage,
      sugar_allotted_kg: kg,
      total_amount: amount,
      payment_mode: a.payment_mode || 'Cash',
      payment_status: a.payment_status || 'Paid'
    };
  }, [shareholderLookupMap]);

  // All Allotments Enriched with names
  const allAllotmentsEnriched = useMemo(() => {
    return allAllotments.map(formatAllotmentRecord);
  }, [allAllotments, formatAllotmentRecord]);

  // Today's String & Matching
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  const isRecordToday = useCallback((a) => {
    if (!a) return false;
    const now = new Date();
    const todayD = now.getDate();
    const todayM = now.getMonth();
    const todayY = now.getFullYear();

    const dStr = String(a.allotment_date || a.date || '');
    if (dStr.includes(`${String(todayD).padStart(2, '0')}/${String(todayM + 1).padStart(2, '0')}/${todayY}`)) return true;
    if (dStr.includes(`${todayY}-${String(todayM + 1).padStart(2, '0')}-${String(todayD).padStart(2, '0')}`)) return true;

    if (a.created_at) {
      const cDate = new Date(a.created_at);
      if (!isNaN(cDate.getTime())) {
        if (cDate.getDate() === todayD && cDate.getMonth() === todayM && cDate.getFullYear() === todayY) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Employee-filtered allotments:
  // Non-admin sees ONLY their own payments/allotments
  // Admin sees all payments, or filters by chosen employee
  const employeeFilteredAllotments = useMemo(() => {
    if (!isAdmin) {
      const myName = (user?.name || user?.username || '').trim().toLowerCase();
      const myEmpId = String(user?.employee_id || '').trim();
      return allAllotmentsEnriched.filter(a => {
        const wName = String(a.weighman_name || a.created_by || a.operator_name || '').trim().toLowerCase();
        const aCounter = String(a.counter_no || '').toLowerCase();
        const aEmpId = String(a.employee_id || '').trim();

        return (myName && (wName.includes(myName) || myName.includes(wName) || aCounter.includes(myName))) ||
               (myEmpId && aEmpId === myEmpId);
      });
    }

    if (selectedEmployeeFilter === 'all') {
      return allAllotmentsEnriched;
    }

    const target = selectedEmployeeFilter.trim().toLowerCase();
    return allAllotmentsEnriched.filter(a => {
      const wName = String(a.weighman_name || a.created_by || a.operator_name || '').trim().toLowerCase();
      const aCounter = String(a.counter_no || '').toLowerCase();
      return wName.includes(target) || target.includes(wName) || aCounter.includes(target);
    });
  }, [allAllotmentsEnriched, isAdmin, selectedEmployeeFilter, user]);

  const todayAllotments = useMemo(() => {
    return employeeFilteredAllotments.filter(isRecordToday);
  }, [employeeFilteredAllotments, isRecordToday]);

  // Today's Statistics
  const todayStats = useMemo(() => {
    const totalMembers = todayAllotments.length;
    const totalKg = todayAllotments.reduce((sum, a) => sum + (parseFloat(a.sugar_allotted_kg) || 0), 0);
    const totalCash = todayAllotments
      .filter(a => {
        const m = String(a.payment_mode || '').toLowerCase();
        return m.includes('cash') || m.includes('ನಗದು');
      })
      .reduce((sum, a) => sum + (parseFloat(a.total_amount) || 0), 0);
    const totalUpi = todayAllotments
      .filter(a => {
        const m = String(a.payment_mode || '').toLowerCase();
        return m.includes('upi') || m.includes('qr') || m.includes('online') || m.includes('ಆನ್‌ಲೈನ್') || m.includes('ಆನ್ಲೈನ್');
      })
      .reduce((sum, a) => sum + (parseFloat(a.total_amount) || 0), 0);

    return {
      totalMembers,
      totalKg,
      totalQuintals: (totalKg / 100).toFixed(2),
      totalCash,
      totalUpi,
      totalCollection: totalCash + totalUpi
    };
  }, [todayAllotments]);

  // Overall Season Statistics (Respects employee filter)
  const seasonStats = useMemo(() => {
    const seasonList = employeeFilteredAllotments.filter(a => String(a.season || a.crushing_season || '2026-27').includes('2026'));
    const totalMembers = seasonList.length;
    const totalKg = seasonList.reduce((sum, a) => sum + (parseFloat(a.sugar_allotted_kg) || 0), 0);
    const totalAmt = seasonList.reduce((sum, a) => sum + (parseFloat(a.total_amount) || 0), 0);
    return {
      totalMembers,
      totalKg,
      totalQuintals: (totalKg / 100).toFixed(2),
      totalAmt
    };
  }, [employeeFilteredAllotments]);

  // Set default values when shareholder is selected
  const handleSelectShareholder = useCallback((holder) => {
    const activeKgPerShare = parseFloat(settings?.kg_per_share) || 30;
    const activeSugarRate = parseFloat(settings?.sugar_rate_per_kg) || 30;

    if (!holder) {
      setSelectedShareholder(null);
      setIsAlreadyAllotted(false);
      setExistingAllotmentRecord(null);
      setAllottedKg(activeKgPerShare);
      setRatePerKg(activeSugarRate);
      return;
    }

    setSelectedShareholder(holder);

    // Compute active shares
    const sharesCount = getShareholderSharesCount(holder);
    const calculatedKg = Math.max(1, sharesCount) * activeKgPerShare;
    setAllottedKg(calculatedKg);
    setRatePerKg(activeSugarRate);

    // Generate receipt serial
    const yearCode = settings?.receipt_year_code || '202627';
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

    const holderDisplayName = holder.shareholder_name || holder.name || holder.full_name || 'Member';

    if (existing) {
      setIsAlreadyAllotted(true);
      setExistingAllotmentRecord(existing);
      playChime('warning');
      showToast(`ಎಚ್ಚರಿಕೆ: ಶೇರುದಾರ #${holder.share_no} ರವರಿಗೆ ಈಗಾಗಲೇ ಸಕ್ಕರೆ ವಿತರಿಸಲಾಗಿದೆ!`, 'warning');
    } else {
      setIsAlreadyAllotted(false);
      setExistingAllotmentRecord(null);
      playChime('success');
      showToast(`ಶೇರುದಾರ #${holder.share_no} (${holderDisplayName}) ಲೋಡ್ ಆಗಿದೆ!`, 'success');
    }
  }, [allAllotments, settings, showToast]);

  // Search Shareholder from manual entry or scan (Exact match preserving category symbols like # or ಬ-$)
  const handleSearch = useCallback(async (rawQuery) => {
    const cleanNo = extractShareNoFromInput(rawQuery || scanInput);
    if (!cleanNo) {
      showToast('ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಷೇರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', 'warning');
      return;
    }

    setIsSearching(true);
    const target = cleanNo.trim();
    const targetLower = target.toLowerCase();
    const hasSymbol = /^[^0-9]/.test(target); // e.g. starts with # or ಬ-

    // Exact match helper (strictly preserves #, ಬ-$, etc.)
    const isExactShareNoMatch = (s) => {
      const sNo = String(s.share_no || s.share_number || '').trim().toLowerCase();
      return sNo === targetLower;
    };

    // 1. In-memory check:
    // Priority A: EXACT match on share_no (e.g. '#126' === '#126', '126' === '126')
    let found = allShareholders.find(isExactShareNoMatch);

    // Priority B: If no symbol in search query (user typed plain digits like 126), check sl_no or id
    if (!found && !hasSymbol) {
      found = allShareholders.find(s => {
        const sSl = String(s.sl_no || '').trim();
        const sId = String(s.id || s.entity_id || '').trim();
        return sSl === target || sId === target;
      });
    }

    // 2. Direct Cloud/API query fallback (Guarantees all 17,085 shareholders across all books are found!)
    if (!found) {
      try {
        const searchRes = await ApiService.getShareholders({ search: target, limit: 15 });
        if (searchRes && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
          // Priority A: Exact match on share_no
          found = searchRes.data.find(isExactShareNoMatch);

          // Priority B: If query is plain digits, match sl_no
          if (!found && !hasSymbol) {
            found = searchRes.data.find(s => {
              const sSl = String(s.sl_no || '').trim();
              return sSl === target;
            });
          }

          // Fallback to first result ONLY IF query has no symbol
          if (!found && !hasSymbol) {
            found = searchRes.data[0];
          }

          if (found) {
            setAllShareholders(prev => {
              if (prev.some(p => p.id === found.id || p.share_no === found.share_no)) return prev;
              return [found, ...prev];
            });
          }
        }
      } catch (err) {
        console.warn('Backend search error for shareholder:', err);
      }
    }

    setIsSearching(false);

    if (found) {
      handleSelectShareholder(found);
      setScanInput(target);
    } else {
      playChime('warning');
      showToast(`ಷೇರು ಸಂಖ್ಯೆ ${target} ನ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ!`, 'error');
    }
  }, [allShareholders, handleSelectShareholder, scanInput, showToast]);

  // Safely stop and clear camera scanner
  const stopCameraSafely = useCallback(async () => {
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {});
        }
      } catch (e) {}
      try {
        scanner.clear();
      } catch (e) {}
    }
    setIsCameraActive(false);
  }, []);

  // Handle successful QR scan
  const handleScanSuccess = useCallback(async (decodedText) => {
    if (!decodedText) return;
    await stopCameraSafely();
    setCameraOpen(false);
    const cleanNo = extractShareNoFromInput(decodedText);
    if (cleanNo) {
      setScanInput(cleanNo);
      handleSearch(cleanNo);
    }
  }, [stopCameraSafely, handleSearch]);

  // Toggle Camera
  const handleToggleCamera = useCallback(async () => {
    if (cameraOpen) {
      await stopCameraSafely();
      setCameraOpen(false);
    } else {
      setCameraError('');
      setCameraOpen(true);
    }
  }, [cameraOpen, stopCameraSafely]);

  // Switch camera device
  const handleSwitchCamera = useCallback(async (newCamId) => {
    setSelectedCameraId(newCamId);
    await stopCameraSafely();
    setCameraRetry(c => c + 1);
  }, [stopCameraSafely]);

  // Close camera if user switches tabs
  useEffect(() => {
    if (activeTab !== 'dispense' && cameraOpen) {
      stopCameraSafely();
      setCameraOpen(false);
    }
  }, [activeTab, cameraOpen, stopCameraSafely]);

  // Camera QR Scanner Lifecycle using Html5Qrcode
  useEffect(() => {
    let isCancelled = false;
    let localScanner = null;

    if (!cameraOpen) {
      if (html5QrCodeRef.current) {
        const sc = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        try {
          if (sc.isScanning) {
            sc.stop().then(() => {
              try { sc.clear(); } catch (e) {}
            }).catch(() => {});
          } else {
            try { sc.clear(); } catch (e) {}
          }
        } catch (e) {}
      }
      setIsCameraActive(false);
      return;
    }

    setCameraError('');
    setIsCameraActive(false);

    async function initCamera() {
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

        const scannerElem = document.getElementById('sugar-dispense-fullpage-scanner');
        if (!scannerElem) {
          if (!isCancelled) setCameraError('ಕ್ಯಾಮೆರಾ ವಿಂಡೋ ಸಿದ್ಧವಾಗಿಲ್ಲ, ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.');
          return;
        }
        try { scannerElem.innerHTML = ''; } catch (e) {}

        const scanner = new Html5Qrcode('sugar-dispense-fullpage-scanner', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13
          ],
          verbose: false
        });

        html5QrCodeRef.current = scanner;
        localScanner = scanner;

        await scanner.start(
          cameraTarget,
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (decodedText && !isCancelled) {
              handleScanSuccess(decodedText);
            }
          },
          () => {}
        );

        if (!isCancelled) {
          setIsCameraActive(true);
          setCameraError('');
        }
      } catch (err) {
        console.warn('Camera start error:', err);
        if (!isCancelled) {
          const errStr = String(err?.message || err || '');
          if (errStr.includes('Permission') || errStr.includes('NotAllowedError')) {
            setCameraError('ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ (Camera permission required).');
          } else {
            setCameraError(`ಕ್ಯಾಮೆರಾ ಆರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ${errStr}`);
          }
          setIsCameraActive(false);
        }
      }
    }

    const timer = setTimeout(initCamera, 80);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (localScanner) {
        try {
          if (localScanner.isScanning) {
            localScanner.stop().then(() => {
              try { localScanner.clear(); } catch (e) {}
            }).catch(() => {});
          } else {
            try { localScanner.clear(); } catch (e) {}
          }
        } catch (e) {}
      }
      if (html5QrCodeRef.current === localScanner) {
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
    };
  }, [cameraOpen, selectedCameraId, cameraRetry, handleScanSuccess]);

  // Handle Photo / File QR Upload Scan
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const tempScanner = new Html5Qrcode('temp-sugar-file-scanner-page', { verbose: false });
      const decodedText = await tempScanner.scanFile(file, true);
      try { tempScanner.clear(); } catch (e) {}
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
        shareholder_name: selectedShareholder.shareholder_name || selectedShareholder.name || selectedShareholder.full_name || 'Member',
        village: selectedShareholder.place || selectedShareholder.village || selectedShareholder.village_name || '',
        taluk: selectedShareholder.taluk || '',
        category: selectedShareholder.schedule_cast || selectedShareholder.category || 'ಅ - ವರ್ಗ',
        active_shares: getShareholderSharesCount(selectedShareholder),
        sugar_allotted_kg: parseFloat(allottedKg) || (parseFloat(settings?.kg_per_share) || 30),
        rate_per_kg: parseFloat(ratePerKg) || (parseFloat(settings?.sugar_rate_per_kg) || 30),
        total_amount: totalAmount,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        receipt_no: receiptNo,
        weighman_name: weighmanName || currentUserDisplayName,
        counter_no: `ಕೌಂಟರ್: ${weighmanName || currentUserDisplayName}`,
        created_by: user?.username || currentUserDisplayName,
        employee_id: user?.employee_id || '',
        remarks: remarks,
        season: '2026-27',
        allotment_date: new Date().toLocaleDateString('en-GB'),
        created_at: new Date().toISOString()
      };

      const res = await ApiService.addSugarAllotment(record);
      if (res && res.success) {
        playChime('success');
        const savedRec = { ...record, id: res.id || res.allotment_id || Date.now() };
        setLastSavedRecord(savedRec);
        setShowSuccessDialog(true);
        showToast(`ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ₹${totalAmount} ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!`, 'success');
        
        // Instant UI update
        setAllAllotments(prev => {
          const filtered = prev.filter(p => (p.record_id || p.allotment_id || p.receipt_no) !== (savedRec.record_id || savedRec.allotment_id || savedRec.receipt_no));
          return [savedRec, ...filtered];
        });
        
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
      const sNoRaw = recordToPrint?.share_no || selectedShareholder?.share_no || '';
      const cleanShareNo = String(sNoRaw).replace(/^#/, '').trim();

      const holder = {
        ...selectedShareholder,
        ...recordToPrint,
        share_no: cleanShareNo || String(sNoRaw),
        shareholder_name: recordToPrint?.shareholder_name || selectedShareholder?.shareholder_name || selectedShareholder?.name || selectedShareholder?.full_name || 'Member',
        name: recordToPrint?.shareholder_name || selectedShareholder?.shareholder_name || selectedShareholder?.name || selectedShareholder?.full_name || 'Member',
        village: recordToPrint?.village || selectedShareholder?.place || selectedShareholder?.village || selectedShareholder?.village_name || '',
        place: recordToPrint?.village || selectedShareholder?.place || selectedShareholder?.village || selectedShareholder?.village_name || '',
        category: recordToPrint?.category || selectedShareholder?.category || selectedShareholder?.schedule_cast || 'ಅ - ವರ್ಗ',
        active_shares: recordToPrint?.active_shares || (selectedShareholder ? getShareholderSharesCount(selectedShareholder) : 1),
        number_of_shares: recordToPrint?.active_shares || (selectedShareholder ? getShareholderSharesCount(selectedShareholder) : 1),
        no_of_shares: recordToPrint?.active_shares || (selectedShareholder ? getShareholderSharesCount(selectedShareholder) : 1),
        sugar_allotted_kg: recordToPrint?.sugar_allotted_kg || allottedKg || (parseFloat(settings?.kg_per_share) || 30),
        rate_per_kg: recordToPrint?.rate_per_kg || ratePerKg || (parseFloat(settings?.sugar_rate_per_kg) || 30),
        total_amount: recordToPrint?.total_amount != null ? recordToPrint.total_amount : totalAmount,
        receipt_no: recordToPrint?.receipt_no || receiptNo,
        payment_mode: recordToPrint?.payment_mode || paymentMode,
        payment_status: recordToPrint?.payment_status || paymentStatus,
        weighman_name: recordToPrint?.weighman_name || weighmanName || currentUserDisplayName,
        season: recordToPrint?.season || '2026-27',
        allotment_date: recordToPrint?.allotment_date || new Date().toLocaleDateString('en-GB')
      };

      const primaryQrDataUrl = await getReceiptQRDataUrl(holder.share_no);
      const qrMap = new Map();
      qrMap.set(String(holder.share_no), primaryQrDataUrl);
      if (sNoRaw && String(sNoRaw) !== String(holder.share_no)) {
        qrMap.set(String(sNoRaw), primaryQrDataUrl);
      }

      const factoryLogoUrl = companyLogo || DEFAULT_LOGO_PATH;
      const printSettings = {
        ...settings,
        receipt_year_code: holder.receipt_no ? (holder.receipt_no.split('/')[1] || settings?.receipt_year_code || '202627') : (settings?.receipt_year_code || '202627'),
        sugar_rate_per_kg: holder.rate_per_kg,
        kg_per_share: settings?.kg_per_share || 30,
        season_year: holder.season || settings?.season_year || '2026-27'
      };

      const docTitle = `A4_Sugar_Receipt_${holder.share_no}`;

      const html = buildA4ReceiptsHtml(
        [holder],
        printSettings,
        qrMap,
        docTitle,
        {
          layout: 'grid',
          fillSecondWithDuplicate: true,
          companyLogo: factoryLogoUrl,
          handshakeLogo: COOP_HANDSHAKE_BASE64
        }
      );

      openPrintDialog(html);
    } catch (err) {
      console.error('Receipt print error:', err);
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
    setAllottedKg(parseFloat(settings?.kg_per_share) || 30);
    setRatePerKg(parseFloat(settings?.sugar_rate_per_kg) || 30);
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

  // Filtered Register Records (Respects employee filter)
  const filteredAllAllotments = useMemo(() => {
    const base = employeeFilteredAllotments;
    if (!registerSearch.trim()) return base;
    const q = registerSearch.trim().toLowerCase();
    return base.filter(a => {
      const name = String(a.shareholder_name || a.name || '').toLowerCase();
      const shareNo = String(a.share_no || '');
      const rcpt = String(a.receipt_no || '').toLowerCase();
      const village = String(a.village || '').toLowerCase();
      const counter = String(a.counter_no || '').toLowerCase();
      const weighman = String(a.weighman_name || '').toLowerCase();
      return name.includes(q) || shareNo.includes(q) || rcpt.includes(q) || village.includes(q) || counter.includes(q) || weighman.includes(q);
    });
  }, [employeeFilteredAllotments, registerSearch]);

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

          {/* Counter Name & Employee Filter */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-emerald-600/70 rounded-xl px-2.5 py-1 text-xs shadow-inner">
              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-400 whitespace-nowrap">ಕೌಂಟರ್ / ಸಿಬ್ಬಂದಿ:</span>
              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="bg-slate-900 text-emerald-300 font-bold text-xs rounded-lg px-2 py-1 outline-none border border-slate-700 focus:border-emerald-500 cursor-pointer max-w-[210px]"
                title="ಸಿಬ್ಬಂದಿವಾರು ಪಾವತಿ ವಿವರಗಳ ಫಿಲ್ಟರ್ (Admin Employee Filter)"
              >
                <option value="all">🌐 ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ (All Employees)</option>
                {availableEmployees.map((emp, i) => (
                  <option key={i} value={emp.name}>
                    👤 {emp.name} {emp.role ? `(${emp.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-600/80 rounded-xl px-3 py-1.5 text-xs text-emerald-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">ಕೌಂಟರ್:</span>
              <span className="font-bold text-emerald-300">{currentUserDisplayName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-semibold">
                {user?.role || 'Operator'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setTempSettings(settings);
              setShowSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-sm"
            title="ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸಂರಚನೆ (Settings)"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>ಸೆಟ್ಟಿಂಗ್ಸ್</span>
          </button>

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

      {/* Counter Owner & Active Filter Notification Banner */}
      {isAdmin && selectedEmployeeFilter !== 'all' ? (
        <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-600/70 rounded-2xl px-4 py-2.5 text-xs text-emerald-200 animate-fadeIn shadow-md">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              ಫಿಲ್ಟರ್: <strong>{selectedEmployeeFilter}</strong> ರವರ ಕೌಂಟರ್ ಪಾವತಿ ಮತ್ತು ವಿತರಣಾ ವಿವರಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತಿದೆ.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedEmployeeFilter('all')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            ✕ ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ (Show All)
          </button>
        </div>
      ) : !isAdmin ? (
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl px-4 py-2 text-xs text-emerald-300">
          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            ಲಾಗಿನ್ ಆಗಿರುವ ಕೌಂಟರ್: <strong>{currentUserDisplayName}</strong> ({user?.role || 'Operator'}) — ನಿಮ್ಮ ಕೌಂಟರ್‌ನ ಪಾವತಿ ಮತ್ತು ಸಂಗ್ರಹ ವಿವರಗಳು ಮಾತ್ರ ಕೆಳಗೆ ಕಾಣಿಸುತ್ತಿವೆ.
          </span>
        </div>
      ) : null}

      {/* TOP LIVE KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today Allotted Members */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>ಇಂದು ವಿತರಿಸಲಾದ ಶೇರುದಾರರು</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {todayStats.totalMembers} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ಜನ</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Today Sugar Kg */}
        <div className="bg-white dark:bg-slate-900 border border-teal-500/30 dark:border-teal-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>ಇಂದು ವಿತರಿಸಿದ ಸಕ್ಕರೆ</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {todayStats.totalKg.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ಕೆಜಿ</span>
            </div>
            <div className="text-[10px] text-teal-600 dark:text-teal-300 font-mono mt-0.5 font-bold">
              ({todayStats.totalQuintals} ಕ್ವಿಂಟಾಲ್)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-600/20 border border-teal-300 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Today Cash Collection */}
        <div className="bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              <span>ನಗದು ಸಂಗ್ರಹ (Cash)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₹ {todayStats.totalCash.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-600/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Today UPI Collection */}
        <div className="bg-white dark:bg-slate-900 border border-blue-500/30 dark:border-blue-800/50 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / ಆನ್‌ಲೈನ್ ಸಂಗ್ರಹ</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₹ {todayStats.totalUpi.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
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
          <span>ಸೀಸನ್ ಒಟ್ಟು ವಹಿ ({allAllotmentsEnriched.length})</span>
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
                  disabled={isSearching}
                  onClick={() => handleSearch(scanInput)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isSearching ? 'ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'ಹುಡುಕಿ'}</span>
                </button>
              </div>

              {/* Camera & File Upload Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleToggleCamera}
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

              {/* CAMERA VIEWPORT - Kept in DOM with display toggle to ensure stable HTML5Qrcode lifecycle */}
              <div
                className="p-3 bg-slate-950 border border-slate-700 rounded-2xl space-y-2 animate-fadeIn"
                style={{ display: cameraOpen ? 'block' : 'none' }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>ಕ್ಯಾಮೆರಾದ ಮುಂದೆ ರಶೀದಿ ಅಥವಾ ID QR ಕೋಡ್ ಹಿಡಿಯಿರಿ</span>
                  </span>
                  <div className="flex items-center gap-2">
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
                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      title="ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center border border-slate-800">
                  <div id="sugar-dispense-fullpage-scanner" className="w-full h-full [&>video]:w-full [&>video]:max-h-[320px] [&>video]:object-contain" />
                </div>

                {cameraError && (
                  <div className="p-2 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
                    <span>{cameraError}</span>
                    <button
                      type="button"
                      onClick={() => setCameraRetry(c => c + 1)}
                      className="px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-white rounded text-[11px] cursor-pointer"
                    >
                      ಮರುಪ್ರಯತ್ನಿಸಿ
                    </button>
                  </div>
                )}
              </div>
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
                          {selectedShareholder.schedule_cast || selectedShareholder.category || 'ಅ - ವರ್ಗ'}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">
                        {selectedShareholder.shareholder_name || selectedShareholder.name || selectedShareholder.full_name}
                      </h2>
                      <p className="text-xs text-slate-400">
                        {selectedShareholder.father_name ? `ತಂದೆ: ${selectedShareholder.father_name} • ` : ''}
                        {selectedShareholder.place || selectedShareholder.village || selectedShareholder.village_name || '-'}
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

              <button
                type="button"
                onClick={() => handleOpenResetModal('2026-27')}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                title="ಸೀಸನ್ ದಾಖಲೆಗಳ ರೀಸೆಟ್ (Code Protected)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>ರೀಸೆಟ್ (Reset)</span>
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

      {/* QUICK SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಸಂರಚನೆ (Sugar Settings)</h3>
                  <p className="text-[11px] text-slate-400">ದರ & ಹಂಚಿಕೆ ಪ್ರಮಾಣ ಸಂರಚಿಸಿ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1.5">
                  ಪ್ರತಿ ಶೇರ್‌ಗೆ ಕೆಜಿ (Kg Per Share)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tempSettings.kg_per_share}
                  onChange={(e) => setTempSettings({ ...tempSettings, kg_per_share: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none focus:border-emerald-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1.5">
                  ಸಕ್ಕರೆ ದರ (Rs / ಕೆಜಿ) (Sugar Rate)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tempSettings.sugar_rate_per_kg}
                  onChange={(e) => setTempSettings({ ...tempSettings, sugar_rate_per_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-400 outline-none focus:border-emerald-500 font-bold text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold text-xs mb-1.5">
                  ರಶೀದಿ ವರ್ಷ ಕೋಡ್ (Receipt Year Code)
                </label>
                <input
                  type="text"
                  value={tempSettings.receipt_year_code}
                  onChange={(e) => setTempSettings({ ...tempSettings, receipt_year_code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">ಅಂದಾಜು ಒಟ್ಟು (1 ಶೇರ್‌ಗೆ):</span>
                <span className="font-bold text-emerald-300 font-mono text-sm">
                  {tempSettings.kg_per_share} ಕೆಜಿ × ₹{tempSettings.sugar_rate_per_kg} = ₹{(parseFloat(tempSettings.kg_per_share) || 0) * (parseFloat(tempSettings.sugar_rate_per_kg) || 0)}
                </span>
              </div>

              {/* DANGER ZONE: Complete Reset of All Counter Entries */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>ಕೌಂಟರ್ ನಮೂದುಗಳ ರೀಸೆಟ್ (Security Code Reset)</span>
                  </label>
                  {allAllotments.length > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                      {allAllotments.length} ದಾಖಲೆಗಳು
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ಸೀಸನ್‌ವಾರು ಅಥವಾ ಎಲ್ಲಾ ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ನಗದು/UPI ಪಾವತಿ ದಾಖಲೆಗಳನ್ನು ಭದ್ರತಾ ಕೋಡ್ ಮೂಲಕ ಸುರಕ್ಷಿತವಾಗಿ ರೀಸೆಟ್ ಮಾಡುತ್ತದೆ.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenResetModal('ALL')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-950/90 to-rose-900/90 hover:from-rose-900 hover:to-rose-800 text-rose-200 hover:text-white border border-rose-700/80 hover:border-rose-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>ಕೌಂಟರ್ ದಾಖಲೆಗಳ ರೀಸೆಟ್ (Security Code Reset)</span>
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                ಉಳಿಸಿ (Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET SECURITY AUTHORIZATION MODAL */}
      {showResetSecurityModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-rose-950/60 animate-scaleUp">
            {/* Header */}
            <div className="p-5 border-b border-rose-900/40 flex items-center justify-between bg-gradient-to-r from-rose-950/90 via-slate-950 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-rose-100 text-sm sm:text-base flex items-center gap-2">
                    <span>ಕೌಂಟರ್ ದಾಖಲೆಗಳ ರೀಸೆಟ್ ಅಧಿಕಾರೀಕರಣ</span>
                  </h3>
                  <p className="text-[11px] text-rose-300/80 font-mono">Protected Counter Reset • Code Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetSecurityModal(false);
                  setResetSecurityCodeInput('');
                  setResetErrorMessage('');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Warning Notice */}
              <div className="p-3.5 bg-rose-950/50 border border-rose-700/60 rounded-2xl flex items-start gap-3 text-xs text-rose-200 leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-300 font-bold mb-0.5">ಎಚ್ಚರಿಕೆ (Warning):</strong>
                  ಆಯ್ದ ಸೀಸನ್‌ನ ಸಕ್ಕರೆ ವಿತರಣೆ ಮತ್ತು ನಗದು/UPI ಪಾವತಿ ದಾಖಲೆಗಳನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲಾಗುತ್ತದೆ. ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂಪಡೆಯಲಾಗುವುದಿಲ್ಲ (Cannot be undone).
                </div>
              </div>

              {/* 1. Season Selection */}
              <div>
                <label className="block text-slate-200 font-bold text-xs mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1. ರೀಸೆಟ್ ಮಾಡಬೇಕಾದ ಸೀಸನ್ ಆಯ್ಕೆಮಾಡಿ (Select Season)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ಒಟ್ಟು {allAllotments.length} ದಾಖಲೆಗಳು
                  </span>
                </label>
                <select
                  value={resetTargetSeason}
                  onChange={(e) => setResetTargetSeason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-bold text-xs outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="ALL">
                    ⚡ ಎಲ್ಲಾ ಸೀಸನ್‌ಗಳು (All Seasons - Complete Wipe) — [{allAllotments.length} ದಾಖಲೆಗಳು]
                  </option>
                  {availableSeasons.map((s) => {
                    const count = getSeasonRecordsCount(s);
                    return (
                      <option key={s} value={s}>
                        📅 ಸೀಸನ್ {s} — [{count} ದಾಖಲೆಗಳು]
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                  {resetTargetSeason === 'ALL'
                    ? `ಇಡೀ ಕೌಂಟರ್‌ನ ಎಲ್ಲಾ (${allAllotments.length}) ದಾಖಲೆಗಳು ಅಳಿಸಿ ಶೂನ್ಯವಾಗುತ್ತವೆ.`
                    : `ಕೇವಲ ಸೀಸನ್ ${resetTargetSeason} ರ (${getSeasonRecordsCount(resetTargetSeason)}) ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ಅಳಿಸಲಾಗುತ್ತದೆ. ಉಳಿದ ಸೀಸನ್‌ಗಳ ದಾಖಲೆಗಳು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ.`}
                </p>
              </div>

              {/* 2. Security Code Requirement */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. ನಿರ್ವಾಹಕ ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ (Enter Admin Secret Code)</span>
                  </label>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>ರಹಸ್ಯ ಕೋಡ್ ರಕ್ಷಿತ</span>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showSecretCode ? 'text' : 'password'}
                    autoFocus
                    value={resetSecurityCodeInput}
                    onChange={(e) => {
                      setResetSecurityCodeInput(e.target.value.toUpperCase());
                      setResetErrorMessage('');
                    }}
                    placeholder="ರಹಸ್ಯ ಭದ್ರತಾ ಕೋಡ್ ನಮೂದಿಸಿ..."
                    className={`w-full bg-slate-950 border ${
                      resetSecurityCodeInput.trim().toUpperCase() === REQUIRED_RESET_CODE
                        ? 'border-emerald-500 text-emerald-400'
                        : resetErrorMessage
                        ? 'border-rose-500 text-rose-300'
                        : 'border-slate-700 text-slate-100'
                    } rounded-xl pl-3.5 pr-10 py-3 font-mono font-bold text-sm tracking-wider outline-none focus:border-rose-500 transition-colors`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowSecretCode(prev => !prev)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    title={showSecretCode ? 'ಕೋಡ್ ಮರೆಮಾಡಿ (Hide code)' : 'ಕೋಡ್ ವೀಕ್ಷಿಸಿ (Show code)'}
                  >
                    {showSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Validation Feedback */}
                {resetSecurityCodeInput.trim().toUpperCase() === REQUIRED_RESET_CODE ? (
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1.5 pl-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>ರಹಸ್ಯ ಭದ್ರತಾ ಕೋಡ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ ✓ (Code Validated)</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                    ರೀಸೆಟ್ ಮಾಡಲು ನಿರ್ವಾಹಕ ರಹಸ್ಯ ಭದ್ರತಾ ಕೋಡ್ ನಮೂದಿಸಿ (Enter secret authorization code).
                  </p>
                )}

                {resetErrorMessage && (
                  <div className="p-2.5 mt-2 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{resetErrorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetSecurityModal(false);
                  setResetSecurityCodeInput('');
                  setResetErrorMessage('');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ (Cancel)
              </button>

              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting || resetSecurityCodeInput.trim().toUpperCase() !== REQUIRED_RESET_CODE}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                  resetSecurityCodeInput.trim().toUpperCase() === REQUIRED_RESET_CODE
                    ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/60'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                <span>
                  {isResetting
                    ? 'ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಲಾಗುತ್ತಿದೆ...'
                    : resetTargetSeason === 'ALL'
                    ? 'ಎಲ್ಲಾ ಸೀಸನ್‌ಗಳ ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಿ (Complete Reset)'
                    : `ಸೀಸನ್ ${resetTargetSeason} ದಾಖಲೆಗಳನ್ನು ಅಳಿಸಿ (Reset Season)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
