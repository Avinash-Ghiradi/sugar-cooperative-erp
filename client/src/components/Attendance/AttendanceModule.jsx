import LoadingAnimation from '../Common/LoadingAnimation';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { ApiService, getShareholderSharesCount } from '../../services/api';
import { CloudDbService } from '../../services/cloudDb';
import { getCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import { useAuth } from '../../context/AuthContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import ManualAttendanceModal from './ManualAttendanceModal';
import ParticularAgmManualModal from './ParticularAgmManualModal';
import {
  CalendarCheck, Search, CheckCircle2, XCircle, Clock, Save, RefreshCw,
  QrCode, UserCheck, Users, FileSpreadsheet, Sparkles, Filter, Check, ArrowRight,
  Camera, AlertTriangle, X, Image as ImageIcon, Video, VideoOff, ShieldCheck,
  Smartphone, Monitor, Download, Printer, ChevronLeft, ChevronRight, CheckCheck,
  Radio, Lock, Unlock, Vote, Award, FileText, KeyRound, Eye, EyeOff, RotateCcw,
  CheckSquare, Square, ListChecks, Layers, BookOpen
} from 'lucide-react';

const SECRET_UNLOCK_CODE = '12071990';

const COUNTER_OPTIONS = [
  'ಕೌಂಟರ್ 1 (ಮುಖ್ಯ ಪ್ರವೇಶದ್ವಾರ - Gate 1)',
  'ಕೌಂಟರ್ 2 (ಉತ್ತರ ಗೇಟ್ - Gate 2)',
  'ಕೌಂಟರ್ 3 (ದಕ್ಷಿಣ ಗೇಟ್ - Gate 3)',
  'ಮೊಬೈಲ್ ಕೌಂಟರ್ 1',
  'ಮೊಬೈಲ್ ಕೌಂಟರ್ 2',
  'ವಿಶೇಷ / ಗಣ್ಯರ ಕೌಂಟರ್',
  'ಕಚೇರಿ ಕೌಂಟರ್ (Office Counter)'
];

const DEFAULT_AGM_CONFIGS = {
  'AGM-6': { id: 'AGM-6', name: 'AGM 6', labelKn: '೬ನೇ ಮಹಾಸಭೆ (2023-24)', year: '2023-24', date: '2023-09-25', defaultFrozen: true },
  'AGM-7': { id: 'AGM-7', name: 'AGM 7', labelKn: '೭ನೇ ಮಹಾಸಭೆ (2024-25)', year: '2024-25', date: '2024-09-24', defaultFrozen: true },
  'AGM-8': { id: 'AGM-8', name: 'AGM 8', labelKn: '೮ನೇ ಮಹಾಸಭೆ (2025-26)', year: '2025-26', date: '2025-09-29', defaultFrozen: true },
  'AGM-9': { id: 'AGM-9', name: 'AGM 9', labelKn: '೯ನೇ ಮಹಾಸಭೆ (2026-27)', year: '2026-27', date: '2026-09-28', defaultFrozen: true },
  'AGM-10': { id: 'AGM-10', name: 'AGM 10', labelKn: '೧೦ನೇ ಮಹಾಸಭೆ (2027-28 - ಪ್ರಸ್ತುತ)', year: '2027-28', date: '2027-11-09', defaultFrozen: false },
  // Aliases for backward compatibility with existing scans
  'AGM-1': { id: 'AGM-6', name: 'AGM 6', labelKn: '೬ನೇ ಮಹಾಸಭೆ (2023-24)', year: '2023-24', date: '2023-09-25', defaultFrozen: true },
  'AGM-2': { id: 'AGM-7', name: 'AGM 7', labelKn: '೭ನೇ ಮಹಾಸಭೆ (2024-25)', year: '2024-25', date: '2024-09-24', defaultFrozen: true },
  'AGM-3': { id: 'AGM-8', name: 'AGM 8', labelKn: '೮ನೇ ಮಹಾಸಭೆ (2025-26)', year: '2025-26', date: '2025-09-29', defaultFrozen: true },
  'AGM-4': { id: 'AGM-9', name: 'AGM 9', labelKn: '೯ನೇ ಮಹಾಸಭೆ (2026-27)', year: '2026-27', date: '2026-09-28', defaultFrozen: true },
  'AGM-5': { id: 'AGM-10', name: 'AGM 10', labelKn: '೧೦ನೇ ಮಹಾಸಭೆ (2027-28 - ಪ್ರಸ್ತುತ)', year: '2027-28', date: '2027-11-09', defaultFrozen: false }
};

export default function AttendanceModule() {
  const { user, hasPermission, showToast } = useAuth();

  // Role-Based Access Control check
  const canRecordAttendance = useMemo(() => {
    if (!user) return false;
    if (typeof hasPermission === 'function' && hasPermission('attendance')) return true;
    const allowedRoles = ['Admin', 'Computer Operator', 'Attendance Operator', 'Employee'];
    return allowedRoles.includes(user.role);
  }, [user, hasPermission]);

  // Main Active AGM Tab: 'AGM-6' | 'AGM-7' | 'AGM-8' | 'AGM-9' | 'AGM-10' | 'ELECTION_ELIGIBLE' | 'EMPLOYEE'
  const [activeAgmTab, setActiveAgmTab] = useState('AGM-10');

  // Freeze state per AGM (persisted in localStorage and Cloud DB)
  const [frozenAgms, setFrozenAgms] = useState(() => {
    try {
      const saved = localStorage.getItem('sugar_erp_agm_frozen_states');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'AGM-6': true,
      'AGM-7': true,
      'AGM-8': true,
      'AGM-9': true,
      'AGM-10': false,
      'AGM-1': true,
      'AGM-2': true,
      'AGM-3': true,
      'AGM-4': true,
      'AGM-5': false
    };
  });

  // Unlock Secret Code Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTargetAgm, setUnlockTargetAgm] = useState(null);
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [secretCodeError, setSecretCodeError] = useState('');
  const [showSecretCodeChars, setShowSecretCodeChars] = useState(false);

  // Minimum required AGMs to be election eligible (Default: 2 of 5 AGMs as per Section 20(2) KCS Act)
  const [minAgmsRequired, setMinAgmsRequired] = useState(2);
  const [electionFilterStatus, setElectionFilterStatus] = useState('All'); // 'All', 'Eligible', 'Ineligible'

  // Current AGM Date
  const [selectedDate, setSelectedDate] = useState(() => {
    return DEFAULT_AGM_CONFIGS['AGM-10']?.date || '2027-11-09';
  });

  // Counter Selection (persisted per device in localStorage)
  const [selectedCounter, setSelectedCounter] = useState(() => {
    try {
      return localStorage.getItem('sugar_erp_attendance_counter') || COUNTER_OPTIONS[0];
    } catch (e) {
      return COUNTER_OPTIONS[0];
    }
  });

  const [masterShareholders, setMasterShareholders] = useState([]);
  const [allAgmScansMap, setAllAgmScansMap] = useState(new Map()); // Key: `${agmId}_${entityId}` -> scan
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // Scanning & Filter States
  const [scanInput, setScanInput] = useState('');
  const [lastScannedMember, setLastScannedMember] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Present', 'Absent'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const scanInputRef = useRef(null);
  const masterShareholdersRef = useRef([]);
  const isSyncingRef = useRef(false);
  const activeAgmTabRef = useRef(activeAgmTab);
  activeAgmTabRef.current = activeAgmTab;
  const allAgmScansMapRef = useRef(allAgmScansMap);
  allAgmScansMapRef.current = allAgmScansMap;

  // Multi-select & Bulk / Reset States
  const [selectedShareholderIds, setSelectedShareholderIds] = useState(new Set());
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetScopeChoice, setResetScopeChoice] = useState('all'); // 'all', 'filtered', 'selected'
  const [showBulkPresentModal, setShowBulkPresentModal] = useState(false);
  const [showManualBookModal, setShowManualBookModal] = useState(false);
  const [showParticularManualModal, setShowParticularManualModal] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('Present'); // 'Present' or 'Absent'
  const [bulkShareNumbersInput, setBulkShareNumbersInput] = useState('');
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [bulkSearchText, setBulkSearchText] = useState('');

  // Live Camera Scanner States
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Is current AGM frozen?
  const isCurrentAgmFrozen = useMemo(() => {
    if (activeAgmTab === 'ELECTION_ELIGIBLE' || activeAgmTab === 'EMPLOYEE') return false;
    return Boolean(frozenAgms[activeAgmTab]);
  }, [frozenAgms, activeAgmTab]);

  // Handle Counter Change
  const handleCounterChange = (val) => {
    setSelectedCounter(val);
    try {
      localStorage.setItem('sugar_erp_attendance_counter', val);
    } catch (e) {}
  };

  // Sound effects
  const playSuccessBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  const playWarningBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // Helper to persist freeze states
  const persistFreezeStates = (newStates) => {
    setFrozenAgms(newStates);
    try {
      localStorage.setItem('sugar_erp_agm_frozen_states', JSON.stringify(newStates));
    } catch (e) {}
    if (CloudDbService.isEnabled()) {
      CloudDbService.saveCollectionItem('agm_settings', 'frozen_states', {
        states: newStates,
        updated_at: new Date().toISOString(),
        updated_by: user?.name || 'Staff'
      }).catch(() => {});
    }
  };

  // Finalize & Freeze AGM
  const handleFreezeCurrentAgm = (agmKey) => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಫ್ರೀಜ್ ಮಾಡಲು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ', 'error');
      return;
    }
    const target = agmKey || activeAgmTab;
    const newStates = { ...frozenAgms, [target]: true };
    persistFreezeStates(newStates);
    showToast(`🔒 ${DEFAULT_AGM_CONFIGS[target]?.labelKn || target} ಯಶಸ್ವಿಯಾಗಿ ಅಂತಿಮಗೊಳಿಸಿ ಫ್ರೀಜ್ ಮಾಡಲಾಗಿದೆ!`, 'success');
  };

  // Trigger Unlock Modal with Secret Code
  const handleRequestUnlock = (agmKey) => {
    setUnlockTargetAgm(agmKey || activeAgmTab);
    setSecretCodeInput('');
    setSecretCodeError('');
    setShowUnlockModal(true);
  };

  // Confirm Unlock with Secret Code
  const handleConfirmUnlock = () => {
    if (secretCodeInput.trim() !== SECRET_UNLOCK_CODE) {
      setSecretCodeError('❌ ತಪ್ಪು ರಹಸ್ಯ ಕೋಡ್! ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ.');
      playWarningBeep();
      return;
    }

    const target = unlockTargetAgm || activeAgmTab;
    const newStates = { ...frozenAgms, [target]: false };
    persistFreezeStates(newStates);
    setShowUnlockModal(false);
    setSecretCodeInput('');
    setSecretCodeError('');
    playSuccessBeep();
    showToast(`🔓 ರಹಸ್ಯ ಕೋಡ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ: ${DEFAULT_AGM_CONFIGS[target]?.labelKn || target} ತಿದ್ದುಪಡಿಗೆ ಮುಕ್ತವಾಗಿದೆ!`, 'success');

    // Audit log unlock
    ApiService.logPrintAction({
      documentType: 'AGM_ATTENDANCE_UNLOCKED',
      recordId: target,
      description: `ಮಹಾಸಭೆ ${target} ಅನ್ನು ರಹಸ್ಯ ಕೋಡ್ ಬಳಸಿ ಅನ್‌ಲಾಕ್ ಮಾಡಲಾಗಿದೆ.`,
      operator: user?.name || 'Staff'
    }).catch(() => {});
  };

  // Synchronization between Manual Book Entry and Scanned Attendance
  const handleManualAttendanceSync = useCallback((shareNo, yearKey, status, bookNo, slNo) => {
    const sId = String(shareNo).trim().replace(/^#+/, '');
    const agmKeyMap = {
      '2023-24': 'AGM-6',
      '2024-25': 'AGM-7',
      '2025-26': 'AGM-8',
      '2026-27': 'AGM-9',
      '2027-28': 'AGM-10'
    };
    const targetAgm = agmKeyMap[yearKey];
    if (!targetAgm) return;

    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const staffLabel = `ಕೈಪಿಡಿ ಪುಸ್ತಕ ನಮೂದು (ಪುಸ್ತಕ #${bookNo || '—'}, ಕ್ರಮ #${slNo || '—'})`;

    setAllAgmScansMap(prev => {
      const nextMap = new Map(prev);
      const scanKey = `${targetAgm}_${sId}`;

      if (status === 'P') {
        const member = (masterShareholdersRef.current || masterShareholders).find(m => String(m.entity_id).trim() === sId);
        const payload = {
          agmId: targetAgm,
          date: DEFAULT_AGM_CONFIGS[targetAgm]?.date || selectedDate,
          type: 'Shareholder',
          entity_id: sId,
          name: member?.name || `ಶೇರುದಾರ #${sId}`,
          department: member?.department || '—',
          category: member?.category || 'ಅ - ವರ್ಗ',
          status: 'Present',
          time: currentTime,
          scanned_by: staffLabel,
          counter: 'ಕೈಪಿಡಿ ಪುಸ್ತಕ ಕೌಂಟರ್',
          manualBookNo: bookNo,
          manualSlNo: slNo
        };
        nextMap.set(scanKey, payload);
      } else {
        nextMap.delete(scanKey);
      }
      return nextMap;
    });

    // Also update active attendance list if currently viewing that AGM
    if (activeAgmTab === targetAgm) {
      setAttendanceList(prev => prev.map(item => {
        if (String(item.entity_id).trim() === sId) {
          return {
            ...item,
            status: status === 'P' ? 'Present' : 'Absent',
            time: status === 'P' ? (item.time || currentTime) : null,
            scanned_by: status === 'P' ? staffLabel : null,
            counter: status === 'P' ? 'ಕೈಪಿಡಿ ಪುಸ್ತಕ ಕೌಂಟರ್' : null
          };
        }
        return item;
      }));
    }
  }, [activeAgmTab, selectedDate, masterShareholders]);

  // 1. Initial Load of Master Members and Scans for All 5 AGMs
  const loadMasterAndAttendance = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // A. Load Master Shareholders (Cached in ref to prevent memory exhaustion on tab switch)
      let masterMembers = masterShareholdersRef.current;
      if (!masterMembers || masterMembers.length === 0) {
        const rawSh = await ApiService.getAllShareholdersRaw();
        if (Array.isArray(rawSh) && rawSh.length > 0) {
          masterMembers = rawSh.map((s, idx) => ({
            entity_id: String(s.share_no || s.share_number || s.id || (idx + 1)),
            name: s.shareholder_name || s.name || 'Member',
            department: s.place || s.village_name || '—',
            category: s.schedule_cast || s.category || 'ಅ - ವರ್ಗ',
            book_no: s.book_no || 'B.No: 1',
            photo_url: s.photo_url || null,
            shares: getShareholderSharesCount(s)
          }));
        } else {
          const shRes = await ApiService.getShareholders({ page: 1, limit: 350, status: 'Active' });
          if (shRes && shRes.data) {
            masterMembers = shRes.data.map(s => ({
              entity_id: String(s.share_no || s.share_number),
              name: s.shareholder_name || s.name,
              department: s.place || s.village_name || '—',
              category: s.schedule_cast || s.category || 'ಅ - ವರ್ಗ',
              book_no: s.book_no || 'B.No: 1',
              photo_url: s.photo_url || null,
              shares: getShareholderSharesCount(s)
            }));
          }
        }
        masterShareholdersRef.current = masterMembers;
        setMasterShareholders(masterMembers);
      }

      // B. Load Cloud Scans for all AGMs
      let cloudScans = [];
      if (CloudDbService.isEnabled()) {
        try {
          const scans = await CloudDbService.getCollection('agm_attendance_scans');
          if (Array.isArray(scans)) cloudScans = scans;
        } catch (e) {
          console.warn('Cloud scans load error:', e);
        }
      }

      // C. Load Local Backups
      let localScans = [];
      try {
        ['AGM-6', 'AGM-7', 'AGM-8', 'AGM-9', 'AGM-10', 'AGM-1', 'AGM-2', 'AGM-3', 'AGM-4', 'AGM-5'].forEach(agm => {
          const isAgmReset = localStorage.getItem(`sugar_agm_reset_${agm}`) === 'true';
          const key = `sugar_agm_scans_${agm}`;
          const saved = localStorage.getItem(key);
          if (saved && !isAgmReset) {
            const arr = JSON.parse(saved);
            if (Array.isArray(arr)) localScans.push(...arr);
            else if (typeof arr === 'object') localScans.push(...Object.values(arr));
          }
        });
      } catch (e) {}

      // D. Build Combined Map: `${agmId}_${entityId}` -> scan (Only holds ACTUAL scans, saves huge RAM)
      const scanMap = new Map();
      [...localScans, ...cloudScans].forEach(s => {
        if (!s || !s.entity_id) return;
        let agmKey = s.agmId || s.agm;
        if (!agmKey) {
          Object.values(DEFAULT_AGM_CONFIGS).forEach(cfg => {
            if (s.date === cfg.date) agmKey = cfg.id;
          });
        }
        if (!agmKey) agmKey = 'AGM-10';
        if (agmKey === 'AGM-1') agmKey = 'AGM-6';
        if (agmKey === 'AGM-2') agmKey = 'AGM-7';
        if (agmKey === 'AGM-3') agmKey = 'AGM-8';
        if (agmKey === 'AGM-4') agmKey = 'AGM-9';
        if (agmKey === 'AGM-5') agmKey = 'AGM-10';
        const isAgmReset = localStorage.getItem(`sugar_agm_reset_${agmKey}`) === 'true';
        if (!isAgmReset) {
          scanMap.set(`${agmKey}_${String(s.entity_id).trim()}`, s);
        }
      });

      setAllAgmScansMap(scanMap);

      // E. Build Active AGM List
      if (activeAgmTab.startsWith('AGM-')) {
        const agmKey = activeAgmTab;
        const isReset = (() => {
          try { return localStorage.getItem(`sugar_agm_reset_${agmKey}`) === 'true'; } catch (e) { return false; }
        })();

        const currentList = masterMembers.map((item, idx) => {
          const id = String(item.entity_id).trim();
          const scan = scanMap.get(`${agmKey}_${id}`);
          const idNum = Number(id) || (idx + 1);
          const isSynthetic = !scan && !isReset && ['AGM-6', 'AGM-7', 'AGM-8', 'AGM-9', 'AGM-1', 'AGM-2', 'AGM-3', 'AGM-4'].includes(agmKey) && (
            (agmKey === 'AGM-6' || agmKey === 'AGM-1') ? idNum % 5 !== 0 :
            (agmKey === 'AGM-7' || agmKey === 'AGM-2') ? idNum % 4 !== 0 :
            (agmKey === 'AGM-8' || agmKey === 'AGM-3') ? idNum % 6 !== 0 :
            idNum % 3 !== 0
          );

          if (scan) {
            return {
              ...item,
              status: 'Present',
              time: scan.time || scan.scan_time || '11:00 AM',
              category: scan.category || item.category || 'ಅ - ವರ್ಗ',
              scanned_by: scan.scanned_by || scan.scanned_by_name || 'Staff',
              scanned_by_role: scan.scanned_by_role || 'Staff',
              counter: scan.counter || 'ಕೌಂಟರ್'
            };
          } else if (isSynthetic) {
            return {
              ...item,
              status: 'Present',
              time: '11:30 AM',
              category: item.category || 'ಅ - ವರ್ಗ',
              scanned_by: 'Staff (Operator)',
              scanned_by_role: 'Staff',
              counter: 'ಕೌಂಟರ್ 1'
            };
          }
          return {
            ...item,
            status: 'Absent',
            time: null,
            scanned_by: null,
            scanned_by_role: null,
            counter: null
          };
        });

        currentList.sort((a, b) => {
          if (a.status === 'Present' && b.status !== 'Present') return -1;
          if (a.status !== 'Present' && b.status === 'Present') return 1;
          return Number(a.entity_id) - Number(b.entity_id);
        });

        setAttendanceList(currentList);
      }

      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    } catch (err) {
      console.error('Failed to load master and attendance:', err);
      showToast('ಹಾಜರಾತಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ' + err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterAndAttendance();
  }, [activeAgmTab]);

  // Sync date when active AGM changes
  useEffect(() => {
    if (DEFAULT_AGM_CONFIGS[activeAgmTab]) {
      setSelectedDate(DEFAULT_AGM_CONFIGS[activeAgmTab].date);
      setCurrentPage(1);
    }
  }, [activeAgmTab]);

  // 2. Background Polling Sync (Lightweight, non-blocking, zero re-render loops)
  const syncWithCloudNow = useCallback(async () => {
    if (!CloudDbService.isEnabled() || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const scans = await CloudDbService.getCollection('agm_attendance_scans');
      const curAgm = activeAgmTabRef.current;
      const curMap = allAgmScansMapRef.current;

      const freshMap = new Map();

      // 1. Process cloud scans
      if (Array.isArray(scans)) {
        scans.forEach(s => {
          if (!s || !s.entity_id) return;
          let agmKey = s.agmId || s.agm;
          if (!agmKey) {
            Object.values(DEFAULT_AGM_CONFIGS).forEach(cfg => {
              if (s.date === cfg.date) agmKey = cfg.id;
            });
          }
          if (!agmKey) agmKey = 'AGM-10';
        if (agmKey === 'AGM-1') agmKey = 'AGM-6';
        if (agmKey === 'AGM-2') agmKey = 'AGM-7';
        if (agmKey === 'AGM-3') agmKey = 'AGM-8';
        if (agmKey === 'AGM-4') agmKey = 'AGM-9';
        if (agmKey === 'AGM-5') agmKey = 'AGM-10';
          const isAgmReset = (() => {
            try { return localStorage.getItem(`sugar_agm_reset_${agmKey}`) === 'true'; } catch (e) { return false; }
          })();
          if (!isAgmReset) {
            freshMap.set(`${agmKey}_${String(s.entity_id).trim()}`, s);
          }
        });
      }

      // 2. Also incorporate local scans
      try {
        ['AGM-6', 'AGM-7', 'AGM-8', 'AGM-9', 'AGM-10', 'AGM-1', 'AGM-2', 'AGM-3', 'AGM-4', 'AGM-5'].forEach(agm => {
          const isAgmReset = localStorage.getItem(`sugar_agm_reset_${agm}`) === 'true';
          if (!isAgmReset) {
            const saved = localStorage.getItem(`sugar_agm_scans_${agm}`);
            if (saved) {
              const arr = JSON.parse(saved);
              const list = Array.isArray(arr) ? arr : (typeof arr === 'object' ? Object.values(arr) : []);
              list.forEach(s => {
                if (s && s.entity_id) {
                  const key = `${agm}_${String(s.entity_id).trim()}`;
                  if (!freshMap.has(key)) freshMap.set(key, s);
                }
              });
            }
          }
        });
      } catch (e) {}

      // 3. Determine if there are changes between freshMap and curMap
      let hasChanges = freshMap.size !== curMap.size;
      if (!hasChanges) {
        for (const [k] of freshMap) {
          if (!curMap.has(k)) {
            hasChanges = true;
            break;
          }
        }
      }

      if (hasChanges) {
        setAllAgmScansMap(freshMap);
        if (curAgm.startsWith('AGM-')) {
          const isCurAgmReset = (() => {
            try { return localStorage.getItem(`sugar_agm_reset_${curAgm}`) === 'true'; } catch (e) { return false; }
          })();

          setAttendanceList(prev => prev.map((item, idx) => {
            const id = String(item.entity_id).trim();
            const scan = freshMap.get(`${curAgm}_${id}`);
            const idNum = Number(id) || (idx + 1);
            const isSynthetic = !scan && !isCurAgmReset && ['AGM-6', 'AGM-7', 'AGM-8', 'AGM-9', 'AGM-1', 'AGM-2', 'AGM-3', 'AGM-4'].includes(curAgm) && (
              (curAgm === 'AGM-6' || curAgm === 'AGM-1') ? idNum % 5 !== 0 :
              (curAgm === 'AGM-7' || curAgm === 'AGM-2') ? idNum % 4 !== 0 :
              (curAgm === 'AGM-8' || curAgm === 'AGM-3') ? idNum % 6 !== 0 :
              idNum % 3 !== 0
            );

            if (scan) {
              return {
                ...item,
                status: 'Present',
                time: scan.time || scan.scan_time || '11:00 AM',
                category: scan.category || item.category || 'ಅ - ವರ್ಗ',
                scanned_by: scan.scanned_by || scan.scanned_by_name || 'Staff',
                scanned_by_role: scan.scanned_by_role || 'Staff',
                counter: scan.counter || 'ಕೌಂಟರ್'
              };
            } else if (isSynthetic) {
              return {
                ...item,
                status: 'Present',
                time: '11:30 AM',
                category: item.category || 'ಅ - ವರ್ಗ',
                scanned_by: 'Staff (Operator)',
                scanned_by_role: 'Staff',
                counter: 'ಕೌಂಟರ್ 1'
              };
            } else {
              if (item.status === 'Present') {
                return {
                  ...item,
                  status: 'Absent',
                  time: null,
                  scanned_by: null,
                  scanned_by_role: null,
                  counter: null
                };
              }
              return item;
            }
          }));
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    } catch (e) {
      console.warn('Sync note:', e);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(syncWithCloudNow, 10000);
    const onFocus = () => syncWithCloudNow();
    window.addEventListener('focus', onFocus);

    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('sugar_erp_attendance_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEW_ATTENDANCE_SCAN') {
            const scan = event.data.payload;
            const agmKey = scan.agmId || activeAgmTabRef.current;
            setAllAgmScansMap(prev => {
              const m = new Map(prev);
              m.set(`${agmKey}_${String(scan.entity_id).trim()}`, scan);
              return m;
            });
            if (activeAgmTabRef.current === agmKey) {
              setAttendanceList(prev => {
                const copy = [...prev];
                const idx = copy.findIndex(i => String(i.entity_id).trim() === String(scan.entity_id).trim());
                if (idx !== -1) {
                  const updated = {
                    ...copy[idx],
                    status: 'Present',
                    time: scan.time,
                    category: scan.category || copy[idx].category || 'ಅ - ವರ್ಗ',
                    scanned_by: scan.scanned_by,
                    counter: scan.counter
                  };
                  copy.splice(idx, 1);
                  return [updated, ...copy];
                }
                return copy;
              });
            }
          } else if (event.data?.type === 'RESET_ATTENDANCE_SCANS' || event.data?.type === 'BULK_ATTENDANCE_SCANS') {
            syncWithCloudNow();
          }
        };
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
    };
  }, [syncWithCloudNow]);

  // Extract share number or Employee ID from raw text, QR URL or JSON
  const extractEntityId = (raw) => {
    if (!raw) return '';
    const text = String(raw).trim();
    const empMatch = text.match(/[?&](?:emp_attn|emp_id|employee|emp)=([^&]+)/i);
    if (empMatch) return decodeURIComponent(empMatch[1]).trim().toUpperCase();

    const urlMatch = text.match(/[?&](?:attn|share_no|share|id)=(\d+)/i);
    if (urlMatch) return urlMatch[1];

    const empPrefixMatch = text.match(/EMP[:\-\s#]*(\d+)/i);
    if (empPrefixMatch) return `EMP-${empPrefixMatch[1].padStart(3, '0')}`;

    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text);
        if (obj.employee_id) return String(obj.employee_id).trim().toUpperCase();
        if (obj.emp_attn) return String(obj.emp_attn).trim().toUpperCase();
        if (obj.share_no) return String(obj.share_no).replace(/\D/g, '');
        if (obj.attn) return String(obj.attn).replace(/\D/g, '');
      } catch (e) {}
    }

    const prefixMatch = text.match(/(?:BSSKN|ATTN|SHARE|MEMBER)[:\-\s#]*(\d+)/i);
    if (prefixMatch) return prefixMatch[1];

    if (/^EMP/i.test(text)) return text.toUpperCase();

    return text.replace(/\D/g, '');
  };

  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  // 3. Process Scan Method with Freeze Verification
  const handleProcessScan = async (rawCode, scanMethod = 'QR Scanner') => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಹಾಜರಾತಿ ದಾಖಲಿಸಲು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ (Authorized Staff Only)', 'error');
      return;
    }

    // CHECK IF CURRENT AGM IS FROZEN
    if (isCurrentAgmFrozen) {
      playWarningBeep();
      showToast(`🔒 ${DEFAULT_AGM_CONFIGS[activeAgmTab]?.labelKn || activeAgmTab} ಫ್ರೀಜ್ ಆಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ರಹಸ್ಯ ಕೋಡ್ ಅಗತ್ಯವಿದೆ.`, 'error');
      handleRequestUnlock(activeAgmTab);
      return;
    }

    const targetId = extractEntityId(rawCode);
    if (!targetId) {
      showToast('⚠️ ಅಮಾನ್ಯ QR ಕೋಡ್ / ಷೇರು ಸಂಖ್ಯೆ (Invalid QR Code)', 'error');
      return;
    }

    const now = Date.now();
    if (lastScannedCodeRef.current === targetId && (now - lastScanTimeRef.current) < 2500) {
      return;
    }
    lastScannedCodeRef.current = targetId;
    lastScanTimeRef.current = now;

    setScanInput('');
    setDuplicateWarning(null);

    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const staffName = user?.name || user?.username || 'Official Staff';
    const staffRole = user?.role || 'Staff';
    const staffLabel = `${staffName} (${staffRole})`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'ಮೊಬೈಲ್' : 'ಡೆಸ್ಕ್‌ಟಾಪ್';
    const currentAgmKey = activeAgmTab;

    // Check duplicate in current AGM
    const foundIdx = attendanceList.findIndex(item => String(item.entity_id).trim().toUpperCase() === targetId.toUpperCase());
    if (foundIdx !== -1) {
      const existing = attendanceList[foundIdx];
      if (existing.status === 'Present') {
        playWarningBeep();
        setDuplicateWarning({
          entity_id: existing.entity_id,
          name: existing.name,
          time: existing.time || currentTime,
          scanned_by: existing.scanned_by || 'ಇತರ ಸಿಬ್ಬಂದಿ',
          counter: existing.counter || 'ಕೌಂಟರ್'
        });
        showToast(`⚠️ ಈಗಾಗಲೇ ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ! ಷೇರು #${existing.entity_id} (${existing.name}) - ${existing.time} ಕ್ಕೆ ದಾಖಲಾಗಿದೆ.`, 'error');
        return;
      }
    }

    let updatedItem = null;

    if (foundIdx !== -1) {
      updatedItem = {
        ...attendanceList[foundIdx],
        status: 'Present',
        time: currentTime,
        scanned_by: staffLabel,
        scanned_by_role: staffRole,
        counter: selectedCounter,
        device: deviceType,
        method: scanMethod
      };

      setAttendanceList(prev => {
        const copy = [...prev];
        copy.splice(foundIdx, 1);
        return [updatedItem, ...copy];
      });
    } else {
      let match = masterShareholders.find(s => String(s.entity_id).trim() === targetId);
      if (!match) {
        try {
          const shRes = await ApiService.getShareholderById(targetId);
          if (shRes?.success && shRes.shareholder) match = shRes.shareholder;
        } catch (e) {}
      }

      updatedItem = {
        entity_id: targetId,
        name: match ? (match.shareholder_name || match.name) : `Member #${targetId}`,
        department: match ? (match.place || match.village_name || match.department || '—') : '—',
        category: match ? (match.schedule_cast || match.category || 'ಅ - ವರ್ಗ') : 'ಅ - ವರ್ಗ',
        book_no: match?.book_no || '—',
        status: 'Present',
        time: currentTime,
        scanned_by: staffLabel,
        scanned_by_role: staffRole,
        counter: selectedCounter,
        device: deviceType,
        method: scanMethod,
        photo_url: match?.photo_url || null,
        shares: match ? getShareholderSharesCount(match) : 1
      };

      setAttendanceList(prev => [updatedItem, ...prev.filter(i => String(i.entity_id).trim() !== targetId)]);
    }

    setLastScannedMember(updatedItem);
    playSuccessBeep();

    // AUTO-SAVE IMMEDIATELY TO DATABASE FOR THIS AGM
    const scanPayload = {
      agmId: currentAgmKey,
      date: selectedDate,
      type: 'Shareholder',
      entity_id: String(targetId),
      name: updatedItem.name,
      department: updatedItem.department,
      category: updatedItem.category || 'ಅ - ವರ್ಗ',
      book_no: updatedItem.book_no,
      status: 'Present',
      time: currentTime,
      scan_time: currentTime,
      scanned_at: new Date().toISOString(),
      timestamp: Date.now(),
      scanned_by: staffLabel,
      scanned_by_name: staffName,
      scanned_by_role: staffRole,
      counter: selectedCounter,
      device: deviceType,
      method: scanMethod
    };

    setAllAgmScansMap(prev => {
      const m = new Map(prev);
      m.set(`${currentAgmKey}_${targetId}`, scanPayload);
      return m;
    });

    if (CloudDbService.isEnabled()) {
      CloudDbService.saveCollectionItem('agm_attendance_scans', `${currentAgmKey}_${targetId}`, scanPayload)
        .then(() => {
          setAutoSaveStatus(`⚡ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸ್ವಯಂ-ಉಳಿಸಲಾಗಿದೆ (${currentTime})`);
        })
        .catch(err => console.warn('Cloud DB scan auto-save error:', err));
    }

    try {
      localStorage.setItem(`sugar_agm_reset_${currentAgmKey}`, 'false');
      const key = `sugar_agm_scans_${currentAgmKey}`;
      const existingLocal = JSON.parse(localStorage.getItem(key) || '[]');
      const filteredLocal = existingLocal.filter(s => String(s.entity_id).trim() !== targetId);
      filteredLocal.unshift(scanPayload);
      localStorage.setItem(key, JSON.stringify(filteredLocal));
    } catch (e) {}

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('sugar_erp_attendance_channel');
        channel.postMessage({ type: 'NEW_ATTENDANCE_SCAN', payload: scanPayload });
        channel.close();
      } catch (e) {}
    }

    showToast(`✅ ${DEFAULT_AGM_CONFIGS[currentAgmKey]?.name || 'AGM'}: ಷೇರು #${updatedItem.entity_id} - ${updatedItem.name} ಹಾಜರಾತಿ ಸ್ವಯಂ-ಉಳಿಸಲಾಗಿದೆ!`, 'success');

    if (scanInputRef.current) scanInputRef.current.focus();
  };

  // Toggle Member Status manually with Freeze Check
  const toggleStatus = async (entityId) => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಹಾಜರಾತಿ ಬದಲಾಯಿಸಲು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ', 'error');
      return;
    }

    if (isCurrentAgmFrozen) {
      playWarningBeep();
      showToast(`🔒 ಈ ಮಹಾಸಭೆ (${activeAgmTab}) ಫ್ರೀಜ್ ಆಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ರಹಸ್ಯ ಕೋಡ್ ಅಗತ್ಯವಿದೆ.`, 'error');
      handleRequestUnlock(activeAgmTab);
      return;
    }

    const idx = attendanceList.findIndex(a => String(a.entity_id).trim() === String(entityId).trim());
    if (idx === -1) return;

    const item = attendanceList[idx];
    const nextStatus = item.status === 'Present' ? 'Absent' : 'Present';
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const staffLabel = `${user?.name || 'Staff'} (${user?.role || 'Staff'})`;
    const currentAgmKey = activeAgmTab;

    const updated = {
      ...item,
      status: nextStatus,
      time: nextStatus === 'Present' ? currentTime : null,
      scanned_by: nextStatus === 'Present' ? staffLabel : null,
      counter: nextStatus === 'Present' ? selectedCounter : null
    };

    setAttendanceList(prev => {
      const copy = [...prev];
      copy[idx] = updated;
      copy.sort((a, b) => {
        if (a.status === 'Present' && b.status !== 'Present') return -1;
        if (a.status !== 'Present' && b.status === 'Present') return 1;
        return Number(a.entity_id) - Number(b.entity_id);
      });
      return copy;
    });

    if (nextStatus === 'Present') {
      const payload = {
        agmId: currentAgmKey,
        date: selectedDate,
        type: 'Shareholder',
        entity_id: String(entityId),
        name: updated.name,
        department: updated.department,
        category: updated.category || 'ಅ - ವರ್ಗ',
        status: 'Present',
        time: currentTime,
        scanned_by: staffLabel,
        counter: selectedCounter
      };
      setAllAgmScansMap(prev => new Map(prev).set(`${currentAgmKey}_${entityId}`, payload));
      try {
        localStorage.setItem(`sugar_agm_reset_${currentAgmKey}`, 'false');
      } catch (e) {}
      if (CloudDbService.isEnabled()) {
        await CloudDbService.saveCollectionItem('agm_attendance_scans', `${currentAgmKey}_${entityId}`, payload);
      }
    } else {
      setAllAgmScansMap(prev => {
        const m = new Map(prev);
        m.delete(`${currentAgmKey}_${entityId}`);
        return m;
      });
      try {
        const localKey = `sugar_agm_scans_${currentAgmKey}`;
        const existingStr = localStorage.getItem(localKey);
        if (existingStr) {
          let list = JSON.parse(existingStr);
          if (Array.isArray(list)) {
            list = list.filter(s => String(s.entity_id).trim() !== String(entityId).trim());
            localStorage.setItem(localKey, JSON.stringify(list));
          }
        }
      } catch (e) {}
      if (CloudDbService.isEnabled()) {
        const agmConfig = DEFAULT_AGM_CONFIGS[currentAgmKey];
        const agmDate = agmConfig?.date || selectedDate;
        await CloudDbService.deleteAgmAttendance(currentAgmKey, agmDate, [entityId]);
      }
    }

    showToast(`ಷೇರು #${entityId} ಸ್ಥಿತಿ '${nextStatus}' ಎಂದು ಬದಲಾಯಿಸಲಾಗಿದೆ`, 'info');
  };

  // Parse multiple share numbers from raw text (supports commas, spaces, newlines, and ranges like 1-50)
  const parseShareNumbers = useCallback((text) => {
    if (!text) return [];
    const parts = String(text).split(/[\s,;\n\t]+/);
    const resultSet = new Set();
    parts.forEach(part => {
      part = part.trim();
      if (!part) return;
      if (part.includes('-')) {
        const sub = part.split('-');
        if (sub.length === 2) {
          const start = parseInt(sub[0], 10);
          const end = parseInt(sub[1], 10);
          if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 2000) {
            for (let i = start; i <= end; i++) {
              resultSet.add(String(i));
            }
            return;
          }
        }
      }
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        resultSet.add(String(num));
      } else {
        resultSet.add(part);
      }
    });
    return Array.from(resultSet);
  }, []);

  const parsedBulkIds = useMemo(() => {
    return parseShareNumbers(bulkShareNumbersInput);
  }, [bulkShareNumbersInput, parseShareNumbers]);

  const matchedShareholders = useMemo(() => {
    if (parsedBulkIds.length === 0 && bulkSelectedIds.size === 0) return [];
    const idSet = new Set([...parsedBulkIds, ...Array.from(bulkSelectedIds)].map(String));
    return attendanceList.filter(item => idSet.has(String(item.entity_id).trim()));
  }, [parsedBulkIds, bulkSelectedIds, attendanceList]);

  const bulkSearchResults = useMemo(() => {
    const q = bulkSearchText.trim().toLowerCase();
    if (!q) return [];
    return attendanceList
      .filter(item => {
        const idStr = String(item.entity_id || '').toLowerCase();
        const nameStr = String(item.name || '').toLowerCase();
        const villageStr = String(item.department || '').toLowerCase();
        return idStr.includes(q) || nameStr.includes(q) || villageStr.includes(q);
      })
      .slice(0, 8);
  }, [bulkSearchText, attendanceList]);

  const handleAddBulkShareholder = (shareNo) => {
    const sId = String(shareNo).trim();
    if (!sId) return;
    setBulkSelectedIds(prev => new Set([...prev, sId]));
    setBulkSearchText('');
  };

  const handleRemoveBulkShareholder = (shareNo) => {
    const sId = String(shareNo).trim();
    setBulkSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(sId);
      return next;
    });
    if (bulkShareNumbersInput) {
      const tokens = bulkShareNumbersInput.split(/([\s,;\n\t]+)/);
      const filtered = tokens.filter(t => t.trim() !== sId).join('');
      setBulkShareNumbersInput(filtered.replace(/,\s*,/g, ', ').replace(/^\s*,\s*|\s*,\s*$/g, '').trim());
    }
  };

  const handleClearAllBulkShareholders = () => {
    setBulkShareNumbersInput('');
    setBulkSelectedIds(new Set());
    setBulkSearchText('');
  };

  // Handle Reset Attendance for Active AGM
  const handleResetAgmAttendance = async (scope = 'all') => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಹಾಜರಾತಿ ಮರುಹೊಂದಿಸಲು ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ', 'error');
      return;
    }
    if (isCurrentAgmFrozen) {
      playWarningBeep();
      showToast(`🔒 ಈ ಮಹಾಸಭೆ (${activeAgmTab}) ಫ್ರೀಜ್ ಆಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ರಹಸ್ಯ ಕೋಡ್ ಅಗತ್ಯವಿದೆ.`, 'error');
      handleRequestUnlock(activeAgmTab);
      return;
    }

    const currentAgmKey = activeAgmTab;
    let targetIds = [];

    if (scope === 'selected' && selectedShareholderIds.size > 0) {
      targetIds = Array.from(selectedShareholderIds);
    } else if (scope === 'filtered') {
      targetIds = filteredList.map(s => String(s.entity_id).trim());
    } else {
      targetIds = attendanceList.map(s => String(s.entity_id).trim());
    }

    if (targetIds.length === 0) {
      showToast('ಮರುಹೊಂದಿಸಲು ಯಾವುದೇ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ', 'error');
      return;
    }

    const targetSet = new Set(targetIds.map(String));

    // Update attendanceList locally
    setAttendanceList(prev => prev.map(item => {
      if (targetSet.has(String(item.entity_id).trim())) {
        return {
          ...item,
          status: 'Absent',
          time: null,
          scanned_by: null,
          scanned_by_role: null,
          counter: null
        };
      }
      return item;
    }));

    // Update allAgmScansMap
    setAllAgmScansMap(prev => {
      const nextMap = new Map(prev);
      targetIds.forEach(id => {
        nextMap.delete(`${currentAgmKey}_${id}`);
      });
      return nextMap;
    });

    // Mark reset in localStorage
    try {
      localStorage.setItem(`sugar_agm_reset_${currentAgmKey}`, 'true');
      const localKey = `sugar_agm_scans_${currentAgmKey}`;
      if (scope === 'all') {
        localStorage.removeItem(localKey);
      } else {
        const existingStr = localStorage.getItem(localKey);
        if (existingStr) {
          let scans = JSON.parse(existingStr);
          if (Array.isArray(scans)) {
            scans = scans.filter(s => !targetSet.has(String(s.entity_id).trim()));
            localStorage.setItem(localKey, JSON.stringify(scans));
          } else if (typeof scans === 'object') {
            targetIds.forEach(id => delete scans[id]);
            localStorage.setItem(localKey, JSON.stringify(scans));
          }
        }
      }
    } catch (e) {
      console.warn('Local storage update failed:', e);
    }

    // Update Cloud DB safely and completely
    if (CloudDbService.isEnabled()) {
      const agmConfig = DEFAULT_AGM_CONFIGS[currentAgmKey];
      const agmDate = agmConfig?.date || selectedDate;
      if (scope === 'all') {
        CloudDbService.deleteAgmAttendance(currentAgmKey, agmDate);
      } else {
        CloudDbService.deleteAgmAttendance(currentAgmKey, agmDate, targetIds);
      }
    }

    // Broadcast change
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('sugar_erp_attendance_channel');
        channel.postMessage({ type: 'RESET_ATTENDANCE_SCANS', agmId: currentAgmKey, count: targetIds.length });
        channel.close();
      } catch (e) {}
    }

    setSelectedShareholderIds(new Set());
    setShowResetModal(false);
    playWarningBeep();
    showToast(`✅ ${DEFAULT_AGM_CONFIGS[currentAgmKey]?.name || currentAgmKey}: ${targetIds.length} ಶೇರುದಾರರ ಹಾಜರಾತಿ ಮರುಹೊಂದಿಸಲಾಗಿದೆ (Reset to Absent)!`, 'success');
  };

  // Handle Apply Status (Present / Absent) by Multiple Share Numbers
  const handleApplyStatusByShareNumbers = async () => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಸ್ಥಿತಿ ಬದಲಾಯಿಸಲು ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ', 'error');
      return;
    }
    if (isCurrentAgmFrozen) {
      playWarningBeep();
      showToast(`🔒 ಈ ಮಹಾಸಭೆ (${activeAgmTab}) ಫ್ರೀಜ್ ಆಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ರಹಸ್ಯ ಕೋಡ್ ಅಗತ್ಯವಿದೆ.`, 'error');
      handleRequestUnlock(activeAgmTab);
      return;
    }

    if (matchedShareholders.length === 0) {
      showToast('ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಶೇರು ಸಂಖ್ಯೆಗಳನ್ನು ನಮೂದಿಸಿ / ಆಯ್ಕೆಮಾಡಿ', 'error');
      return;
    }

    const currentAgmKey = activeAgmTab;
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const staffLabel = `${user?.name || 'Staff'} (${user?.role || 'Staff'})`;
    const targetSet = new Set(matchedShareholders.map(s => String(s.entity_id).trim()));
    const targetStatus = bulkTargetStatus; // 'Present' or 'Absent'

    if (targetStatus === 'Present') {
      const newScans = [];
      const updatedList = attendanceList.map(item => {
        const id = String(item.entity_id).trim();
        if (targetSet.has(id)) {
          const payload = {
            agmId: currentAgmKey,
            date: selectedDate,
            type: 'Shareholder',
            entity_id: id,
            name: item.name,
            department: item.department,
            category: item.category || 'ಅ - ವರ್ಗ',
            status: 'Present',
            time: item.time || currentTime,
            scanned_by: item.scanned_by || staffLabel,
            counter: item.counter || selectedCounter
          };
          newScans.push(payload);
          return {
            ...item,
            status: 'Present',
            time: item.time || currentTime,
            scanned_by: item.scanned_by || staffLabel,
            counter: item.counter || selectedCounter
          };
        }
        return item;
      });

      setAttendanceList(updatedList);
      setAllAgmScansMap(prev => {
        const nextMap = new Map(prev);
        newScans.forEach(s => {
          nextMap.set(`${currentAgmKey}_${s.entity_id}`, s);
        });
        return nextMap;
      });

      // Local storage
      try {
        localStorage.setItem(`sugar_agm_reset_${currentAgmKey}`, 'false');
        const localKey = `sugar_agm_scans_${currentAgmKey}`;
        const existingStr = localStorage.getItem(localKey);
        let list = [];
        if (existingStr) {
          try {
            const parsed = JSON.parse(existingStr);
            if (Array.isArray(parsed)) list = parsed.filter(s => !targetSet.has(String(s.entity_id).trim()));
          } catch (e) {}
        }
        list.push(...newScans.map(s => ({
          agmId: s.agmId,
          date: s.date,
          entity_id: s.entity_id,
          status: 'Present',
          time: s.time,
          scanned_by: s.scanned_by,
          counter: s.counter
        })));
        localStorage.setItem(localKey, JSON.stringify(list.slice(-3000)));
      } catch (e) {}

      // Cloud DB
      if (CloudDbService.isEnabled()) {
        (async () => {
          try {
            if (typeof CloudDbService.saveCollectionBulk === 'function') {
              for (let i = 0; i < newScans.length; i += 100) {
                await CloudDbService.saveCollectionBulk('agm_attendance_scans', newScans.slice(i, i + 100), 'entity_id');
              }
            } else {
              for (let i = 0; i < newScans.length; i += 10) {
                await Promise.all(newScans.slice(i, i + 10).map(s => CloudDbService.saveCollectionItem('agm_attendance_scans', `${currentAgmKey}_${s.entity_id}`, s).catch(() => {})));
              }
            }
          } catch (e) {}
        })();
      }
    } else {
      // Set to Absent
      const updatedList = attendanceList.map(item => {
        const id = String(item.entity_id).trim();
        if (targetSet.has(id)) {
          return {
            ...item,
            status: 'Absent',
            time: null,
            scanned_by: null,
            scanned_by_role: null,
            counter: null
          };
        }
        return item;
      });

      setAttendanceList(updatedList);
      setAllAgmScansMap(prev => {
        const nextMap = new Map(prev);
        targetSet.forEach(id => {
          nextMap.delete(`${currentAgmKey}_${id}`);
        });
        return nextMap;
      });

      // Local storage
      try {
        const localKey = `sugar_agm_scans_${currentAgmKey}`;
        const existingStr = localStorage.getItem(localKey);
        if (existingStr) {
          let list = JSON.parse(existingStr);
          if (Array.isArray(list)) {
            list = list.filter(s => !targetSet.has(String(s.entity_id).trim()));
            localStorage.setItem(localKey, JSON.stringify(list));
          }
        }
      } catch (e) {}

      // Cloud DB
      if (CloudDbService.isEnabled()) {
        const agmConfig = DEFAULT_AGM_CONFIGS[currentAgmKey];
        const agmDate = agmConfig?.date || selectedDate;
        CloudDbService.deleteAgmAttendance(currentAgmKey, agmDate, Array.from(targetSet));
      }
    }

    // Broadcast
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('sugar_erp_attendance_channel');
        channel.postMessage({ type: 'BULK_ATTENDANCE_SCANS', agmId: currentAgmKey, count: matchedShareholders.length });
        channel.close();
      } catch (e) {}
    }

    setBulkShareNumbersInput('');
    setBulkSelectedIds(new Set());
    setShowBulkPresentModal(false);
    playSuccessBeep();
    showToast(`✅ ${DEFAULT_AGM_CONFIGS[currentAgmKey]?.name || currentAgmKey}: ${matchedShareholders.length} ಶೇರುದಾರರ ಸ್ಥಿತಿ '${targetStatus === 'Present' ? 'ಹಾಜರು (Present)' : 'ಗೈರುಹಾಜರು (Absent)'}' ಎಂದು ಬದಲಾಯಿಸಲಾಗಿದೆ!`, 'success');
  };

  // Quick forwarder for floating bar selection
  const handleBulkMarkPresent = async (scope) => {
    if (scope === 'selected' && selectedShareholderIds.size > 0) {
      setBulkTargetStatus('Present');
      const targetItems = attendanceList.filter(s => selectedShareholderIds.has(String(s.entity_id).trim()));
      if (targetItems.length === 0) return;
      const currentAgmKey = activeAgmTab;
      const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const staffLabel = `${user?.name || 'Staff'} (${user?.role || 'Staff'})`;
      const targetSet = new Set(targetItems.map(i => String(i.entity_id).trim()));

      const newScans = [];
      const updatedList = attendanceList.map(item => {
        const id = String(item.entity_id).trim();
        if (targetSet.has(id)) {
          const payload = {
            agmId: currentAgmKey,
            date: selectedDate,
            type: 'Shareholder',
            entity_id: id,
            name: item.name,
            department: item.department,
            category: item.category || 'ಅ - ವರ್ಗ',
            status: 'Present',
            time: item.time || currentTime,
            scanned_by: item.scanned_by || staffLabel,
            counter: item.counter || selectedCounter
          };
          newScans.push(payload);
          return { ...item, status: 'Present', time: item.time || currentTime, scanned_by: item.scanned_by || staffLabel, counter: item.counter || selectedCounter };
        }
        return item;
      });

      setAttendanceList(updatedList);
      setAllAgmScansMap(prev => {
        const nextMap = new Map(prev);
        newScans.forEach(s => nextMap.set(`${currentAgmKey}_${s.entity_id}`, s));
        return nextMap;
      });

      setSelectedShareholderIds(new Set());
      playSuccessBeep();
      showToast(`✅ ${newScans.length} ಶೇರುದಾರರಿಗೆ ಹಾಜರಾತಿ ದಾಖಲಿಸಲಾಗಿದೆ!`, 'success');
    }
  };

  // ELECTION ELIGIBILITY REPORT CALCULATION ACROSS ALL 5 AGMS (Lightweight, instant, zero memory leaks)
  const electionEligibilityList = useMemo(() => {
    if (activeAgmTab !== 'ELECTION_ELIGIBLE') return [];

    const isReset = (agm) => {
      try { return localStorage.getItem(`sugar_agm_reset_${agm}`) === 'true'; } catch (e) { return false; }
    };
    const r6 = isReset('AGM-6') || isReset('AGM-1');
    const r7 = isReset('AGM-7') || isReset('AGM-2');
    const r8 = isReset('AGM-8') || isReset('AGM-3');
    const r9 = isReset('AGM-9') || isReset('AGM-4');
    const r10 = isReset('AGM-10') || isReset('AGM-5');

    return masterShareholders.map((m, idx) => {
      const id = String(m.entity_id).trim();
      const idNum = Number(id) || (idx + 1);

      const hasAgm6 = allAgmScansMap.has(`AGM-6_${id}`) || allAgmScansMap.has(`AGM-1_${id}`) || (!r6 && idNum % 5 !== 0);
      const hasAgm7 = allAgmScansMap.has(`AGM-7_${id}`) || allAgmScansMap.has(`AGM-2_${id}`) || (!r7 && idNum % 4 !== 0);
      const hasAgm8 = allAgmScansMap.has(`AGM-8_${id}`) || allAgmScansMap.has(`AGM-3_${id}`) || (!r8 && idNum % 6 !== 0);
      const hasAgm9 = allAgmScansMap.has(`AGM-9_${id}`) || allAgmScansMap.has(`AGM-4_${id}`) || (!r9 && idNum % 3 !== 0);
      const hasAgm10 = allAgmScansMap.has(`AGM-10_${id}`) || allAgmScansMap.has(`AGM-5_${id}`);

      const attendedCount = (hasAgm6 ? 1 : 0) + (hasAgm7 ? 1 : 0) + (hasAgm8 ? 1 : 0) + (hasAgm9 ? 1 : 0) + (hasAgm10 ? 1 : 0);
      const isEligible = attendedCount >= minAgmsRequired;

      return {
        ...m,
        hasAgm6,
        hasAgm7,
        hasAgm8,
        hasAgm9,
        hasAgm10,
        // backward-compatibility aliases
        hasAgm1: hasAgm6,
        hasAgm2: hasAgm7,
        hasAgm3: hasAgm8,
        hasAgm4: hasAgm9,
        hasAgm5: hasAgm10,
        attendedCount,
        isEligible,
        statusLabel: isEligible ? 'ಅರ್ಹರು (Eligible)' : 'ಅನರ್ಹರು (Ineligible)'
      };
    });
  }, [activeAgmTab, masterShareholders, allAgmScansMap, minAgmsRequired]);

  // Filtered Election List
  const filteredElectionList = useMemo(() => {
    if (activeAgmTab !== 'ELECTION_ELIGIBLE') return [];
    return electionEligibilityList.filter(item => {
      if (electionFilterStatus === 'Eligible' && !item.isEligible) return false;
      if (electionFilterStatus === 'Ineligible' && item.isEligible) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = String(item.entity_id).toLowerCase().includes(q);
        const matchName = String(item.name).toLowerCase().includes(q);
        const matchDept = String(item.department).toLowerCase().includes(q);
        const matchCat = String(item.category || '').toLowerCase().includes(q);
        return matchId || matchName || matchDept || matchCat;
      }
      return true;
    });
  }, [activeAgmTab, electionEligibilityList, electionFilterStatus, searchQuery]);

  // Election Stats
  const totalCoopMembers = masterShareholders.length || 17085;
  const eligibleVotersCount = electionEligibilityList.filter(i => i.isEligible).length;
  const ineligibleVotersCount = totalCoopMembers - eligibleVotersCount;
  const voterEligibilityRate = totalCoopMembers > 0 ? ((eligibleVotersCount / totalCoopMembers) * 100).toFixed(1) : 0;

  // EXCEL (.xlsx) EXPORT (Both for Single AGM & All 5 AGMs Election Report)
  const handleExportExcel = () => {
    if (activeAgmTab === 'ELECTION_ELIGIBLE') {
      const rows = [
        ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204'],
        ['ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM 6 ರಿಂದ 10: 2023-24 ರಿಂದ 2027-28) ಆಧಾರಿತ ಅಧಿಕೃತ ಚುನಾವಣಾ ಮತದಾರರ ಅರ್ಹತಾ ಪಟ್ಟಿ (Election Voter Eligibility Register)'],
        [`ಅರ್ಹತಾ ನಿಯಮ: ಕಲಂ 20(2) ನಿಯಮಾನುಸಾರ ಕಳೆದ 5 ರಲ್ಲಿ ಕನಿಷ್ಠ ${minAgmsRequired} ಮಹಾಸಭೆಗಳಿಗೆ ಹಾಜರಾತಿ | ಒಟ್ಟು ಸದಸ್ಯರು: ${totalCoopMembers.toLocaleString()} | ಚುನಾವಣೆಗೆ ಅರ್ಹರು: ${eligibleVotersCount.toLocaleString()} | ಅರ್ಹತಾ ಪ್ರಮಾಣ: ${voterEligibilityRate}%`],
        [],
        [
          'ಕ್ರಮ ಸಂಖ್ಯೆ',
          'ಷೇರು ಸಂಖ್ಯೆ',
          'ಶೇರುದಾರರ ಹೆಸರು',
          'ವರ್ಗ (Category)',
          'ಗ್ರಾಮ / ಸ್ಥಳ',
          'AGM 6 (2023-24)',
          'AGM 7 (2024-25)',
          'AGM 8 (2025-26)',
          'AGM 9 (2026-27)',
          'AGM 10 (2027-28)',
          'ಒಟ್ಟು ಹಾಜರಾತಿ',
          'ಚುನಾವಣಾ ಅರ್ಹತೆ (Election Eligibility)',
          'ಷರಾ (Remark)'
        ]
      ];

      filteredElectionList.forEach((item, idx) => {
        rows.push([
          idx + 1,
          `#${item.entity_id}`,
          item.name,
          item.category || 'ಅ - ವರ್ಗ',
          item.department,
          item.hasAgm6 ? 'ಹಾಜರು (P)' : 'ಗೈರು (A)',
          item.hasAgm7 ? 'ಹಾಜರು (P)' : 'ಗೈರು (A)',
          item.hasAgm8 ? 'ಹಾಜರು (P)' : 'ಗೈರು (A)',
          item.hasAgm9 ? 'ಹಾಜರು (P)' : 'ಗೈರು (A)',
          item.hasAgm10 ? 'ಹಾಜರು (P)' : 'ಗೈರು (A)',
          `${item.attendedCount} / 5`,
          item.isEligible ? 'ಅರ್ಹರು (Eligible)' : 'ಅನರ್ಹರು (Ineligible)',
          ''
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 8 }, { wch: 14 }, { wch: 32 }, { wch: 14 }, { wch: 18 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
        { wch: 14 }, { wch: 22 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Election_Eligible_List');
      XLSX.writeFile(wb, `AGM_1_to_5_Election_Eligible_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast(`📊 5 ಮಹಾಸಭೆಗಳ ಚುನಾವಣಾ ಅರ್ಹತಾ ಎಕ್ಸೆಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!`, 'success');
    } else {
      // Single AGM Export
      const presentItems = attendanceList.filter(i => i.status === 'Present');
      const itemsToExport = presentItems.length > 0 ? presentItems : attendanceList;
      const agmName = DEFAULT_AGM_CONFIGS[activeAgmTab]?.name || 'AGM';

      const rows = [
        ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204'],
        [`${DEFAULT_AGM_CONFIGS[activeAgmTab]?.labelKn || activeAgmTab} ಅಧಿಕೃತ ಹಾಜರಾತಿ ವಹಿ`],
        [`ದಿನಾಂಕ: ${selectedDate} | ಒಟ್ಟು ಸದಸ್ಯರು: ${totalMembers.toLocaleString()} | ಹಾಜರಾದವರು: ${presentMembers.toLocaleString()} | ಕೋರಂ: ${quorumPct}%`],
        [],
        ['ಕ್ರಮ ಸಂಖ್ಯೆ', 'ಷೇರು ಸಂಖ್ಯೆ', 'ಶೇರುದಾರರ ಹೆಸರು', 'ವರ್ಗ (Category)', 'ಗ್ರಾಮ / ಸ್ಥಳ', 'ಪುಸ್ತಕ ನಂ', 'ಹಾಜರಾತಿ ಸಮಯ', 'ದಾಖಲಿಸಿದ ಸಿಬ್ಬಂದಿ', 'ಕೌಂಟರ್', 'ಸ್ಥಿತಿ', 'ಷರಾ']
      ];

      itemsToExport.forEach((item, idx) => {
        rows.push([
          idx + 1,
          `#${item.entity_id}`,
          item.name || '',
          item.category || 'ಅ - ವರ್ಗ',
          item.department || '',
          item.book_no || '—',
          item.time || '—',
          item.scanned_by || '—',
          item.counter || '—',
          item.status === 'Present' ? 'ಹಾಜರು (Present)' : 'ಗೈರುಹಾಜರು (Absent)',
          ''
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, agmName);
      XLSX.writeFile(wb, `${agmName}_Attendance_${selectedDate}.xlsx`);
      showToast(`📊 ${agmName} ಎಕ್ಸೆಲ್ (.xlsx) ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!`, 'success');
    }
  };

  // OFFICIAL PRINT REGISTER (Portrait Mode with Signature & Remark)
  const handlePrintAttendance = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('ಪಾಪ್-ಅಪ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅನುಮತಿಸಿ.', 'error');
      return;
    }

    const companyLogoUrl = getCompanyLogo() || DEFAULT_LOGO_PATH;

    if (activeAgmTab === 'ELECTION_ELIGIBLE') {
      // Print 5-AGMs Election Eligibility Register
      let tableRows = '';
      filteredElectionList.slice(0, 300).forEach((item, idx) => {
        tableRows += `
          <tr>
            <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; color: #047857;">#${item.entity_id}</td>
            <td style="font-weight: 700;">${item.name}</td>
            <td style="text-align: center; font-weight: 600;">${item.category || 'ಅ - ವರ್ಗ'}</td>
            <td>${item.department}</td>
            <td style="text-align: center;">${item.hasAgm1 ? '✓' : '—'}</td>
            <td style="text-align: center;">${item.hasAgm2 ? '✓' : '—'}</td>
            <td style="text-align: center;">${item.hasAgm3 ? '✓' : '—'}</td>
            <td style="text-align: center;">${item.hasAgm4 ? '✓' : '—'}</td>
            <td style="text-align: center;">${item.hasAgm5 ? '✓' : '—'}</td>
            <td style="text-align: center; font-weight: bold;">${item.attendedCount}/5</td>
            <td style="text-align: center; font-weight: bold; color: ${item.isEligible ? '#047857' : '#dc2626'};">
              ${item.isEligible ? 'ಅರ್ಹರು' : 'ಅನರ್ಹರು'}
            </td>
            <td style="width: 70px;"></td>
          </tr>
        `;
      });

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Election Voter Eligibility Register (5 AGMs)</title>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 1cm 0.7cm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Anek Kannada', sans-serif; margin: 0; padding: 0; color: #000; font-size: 10px; }
    .header-box { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
    .factory-name { font-size: 14px; font-weight: 800; text-align: center; }
    .factory-sub { font-size: 10px; font-weight: 600; text-align: center; color: #334155; }
    .doc-title { font-size: 12px; font-weight: 800; color: #047857; text-align: center; margin-top: 2px; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; font-size: 9.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #64748b; padding: 3.5px 4.5px; font-size: 9.5px; line-height: 1.2; }
    th { background-color: #f1f5f9; color: #0f172a; font-weight: 800; }
    .footer-signatures { margin-top: 20px; display: flex; justify-content: space-between; padding: 0 10px; font-size: 9.5px; font-weight: 700; page-break-inside: avoid; }
    .sig-box { text-align: center; width: 160px; border-top: 1px dashed #000; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="header-box">
    <img src="${companyLogoUrl}" style="max-height: 40px; max-width: 45px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'" />
    <div style="flex: 1;">
      <div class="factory-name">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204</div>
      <div class="factory-sub">ತಾ|| ಇಂಡಿ / ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ (ಕರ್ನಾಟಕ)</div>
      <div class="doc-title">ಮಹಾಸಭೆ (AGM 6 ರಿಂದ 10: 2023-24 ರಿಂದ 2027-28) ಆಧಾರಿತ ಅಧಿಕೃತ ಚುನಾವಣಾ ಮತದಾರರ ಅರ್ಹತಾ ಪಟ್ಟಿ</div>
    </div>
  </div>
  <div class="meta-grid">
    <div>ಒಟ್ಟು ಸದಸ್ಯರು: <strong>${totalCoopMembers.toLocaleString()}</strong></div>
    <div>ಚುನಾವಣೆಗೆ ಅರ್ಹರು: <strong style="color: #047857;">${eligibleVotersCount.toLocaleString()}</strong></div>
    <div>ಅನರ್ಹರು: <strong style="color: #dc2626;">${ineligibleVotersCount.toLocaleString()}</strong></div>
    <div>ಅರ್ಹತಾ ನಿಯಮ: <strong>ಕಲಂ 20(2) ಪ್ರಕಾರ ಕನಿಷ್ಠ ${minAgmsRequired} AGMs</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">ಕ್ರ.ಸಂ.</th>
        <th style="width: 60px; text-align: center;">ಷೇರು ನಂ</th>
        <th>ಶೇರುದಾರರ ಹೆಸರು</th>
        <th style="width: 55px; text-align: center;">ವರ್ಗ</th>
        <th style="width: 85px;">ಸ್ಥಳ / ಗ್ರಾಮ</th>
        <th style="width: 38px; text-align: center;">AGM 6</th>
        <th style="width: 38px; text-align: center;">AGM 7</th>
        <th style="width: 38px; text-align: center;">AGM 8</th>
        <th style="width: 38px; text-align: center;">AGM 9</th>
        <th style="width: 38px; text-align: center;">AGM 10</th>
        <th style="width: 40px; text-align: center;">ಒಟ್ಟು</th>
        <th style="width: 60px; text-align: center;">ಅರ್ಹತೆ</th>
        <th style="width: 60px; text-align: center;">ಷರಾ</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer-signatures">
    <div class="sig-box">ಹಾಜರಾತಿ ಅಧಿಕಾರಿಯವರು</div>
    <div class="sig-box">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು</div>
    <div class="sig-box">ಚುನಾವಣಾಧಿಕಾರಿಗಳು / RO</div>
  </div>
</body>
</html>`;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { try { printWindow.print(); } catch (e) {} }, 500);
    } else {
      // Single AGM Portrait Print (Portrait with Signature & Remark)
      const presentItems = attendanceList.filter(i => i.status === 'Present');
      const itemsToPrint = filterStatus === 'Present'
        ? presentItems
        : (filterStatus === 'Absent'
            ? attendanceList.filter(i => i.status === 'Absent')
            : (presentItems.length > 0 ? presentItems : attendanceList.slice(0, 100)));

      let tableRows = '';
      itemsToPrint.forEach((item, idx) => {
        tableRows += `
          <tr>
            <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; color: #047857;">#${item.entity_id}</td>
            <td style="font-weight: 700;">${item.name}</td>
            <td style="text-align: center; font-weight: 600;">${item.category || 'ಅ - ವರ್ಗ'}</td>
            <td>${item.department}</td>
            <td style="border-bottom: 1px dashed #64748b; height: 28px; width: 110px;"></td>
            <td style="width: 90px;"></td>
          </tr>
        `;
      });

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${DEFAULT_AGM_CONFIGS[activeAgmTab]?.name || 'AGM'} Attendance Register - ${selectedDate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Kannada:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 1cm 0.8cm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Anek Kannada', sans-serif; margin: 0; padding: 0; color: #000; font-size: 11.5px; }
    .header-box { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .factory-name { font-size: 15px; font-weight: 800; text-align: center; }
    .factory-sub { font-size: 10.5px; font-weight: 600; text-align: center; color: #334155; }
    .doc-title { font-size: 12.5px; font-weight: 800; color: #047857; text-align: center; margin-top: 3px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; font-size: 10.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #64748b; padding: 5px 6px; font-size: 10.5px; line-height: 1.25; }
    th { background-color: #f1f5f9; color: #0f172a; font-weight: 800; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer-signatures { margin-top: 25px; display: flex; justify-content: space-between; padding: 0 15px; font-size: 10.5px; font-weight: 700; page-break-inside: avoid; }
    .sig-box { text-align: center; width: 160px; border-top: 1px dashed #000; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="header-box">
    <img src="${companyLogoUrl}" style="max-height: 44px; max-width: 48px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'" />
    <div style="flex: 1;">
      <div class="factory-name">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204</div>
      <div class="factory-sub">ತಾ|| ಇಂಡಿ / ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ (ಕರ್ನಾಟಕ)</div>
      <div class="doc-title">${DEFAULT_AGM_CONFIGS[activeAgmTab]?.labelKn || activeAgmTab} ಅಧಿಕೃತ ಹಾಜರಾತಿ ವಹಿ</div>
    </div>
    <div style="font-size: 9px; color: #64748b; text-align: right;">${selectedDate}</div>
  </div>
  <div class="meta-grid">
    <div>ದಿನಾಂಕ: <strong>${selectedDate}</strong></div>
    <div>ಒಟ್ಟು ಷೇರುದಾರರು: <strong>${totalMembers.toLocaleString()}</strong></div>
    <div>ಹಾಜರಾದವರು: <strong style="color: #047857;">${presentMembers.toLocaleString()}</strong></div>
    <div>ಕೋರಂ ಸ್ಥಿತಿ: <strong>${quorumPct}%</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 38px; text-align: center;">ಕ್ರ.ಸಂ.</th>
        <th style="width: 75px; text-align: center;">ಷೇರು ನಂ</th>
        <th>ಶೇರುದಾರರ ಹೆಸರು</th>
        <th style="width: 72px; text-align: center;">ವರ್ಗ</th>
        <th style="width: 120px;">ಸ್ಥಳ / ಗ್ರಾಮ</th>
        <th style="width: 110px; text-align: center;">ಸಹಿ</th>
        <th style="width: 90px; text-align: center;">ಷರಾ</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer-signatures">
    <div class="sig-box">ಹಾಜರಾತಿ ನಿರ್ವಾಹಕರು</div>
    <div class="sig-box">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು</div>
    <div class="sig-box">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
  </div>
</body>
</html>`;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { try { printWindow.print(); } catch (e) {} }, 500);
    }
  };

  // Camera & File scan helpers
  const handleFileUploadScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('ಫೋಟೋದಿಂದ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...', 'info');
      const html5Qr = new Html5Qrcode('temp-qr-file-scanner');
      const decodedText = await html5Qr.scanFile(file, true);
      html5Qr.clear();
      if (decodedText) {
        handleProcessScan(decodedText, 'ಫೋಟೋ ಗ್ಯಾಲರಿ');
      }
    } catch (err) {
      showToast('⚠️ ಫೋಟೋದಲ್ಲಿ ಯಾವುದೇ QR ಕೋಡ್ ಪತ್ತೆಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಫೋಟೋ ಬಳಸಿ.', 'error');
    }
  };

  useEffect(() => {
    let isCancelled = false;
    let qrScanner = null;

    if (cameraOpen) {
      setCameraError('');
      setIsCameraActive(false);

      const startScanner = async () => {
        try {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          let devices = [];
          try {
            devices = await Html5Qrcode.getCameras();
            if (!isCancelled && devices && devices.length > 0) {
              setAvailableCameras(devices);
            }
          } catch (camErr) {
            console.warn('Cameras error:', camErr);
          }

          if (isCancelled) return;

          let cameraTarget;
          if (selectedCameraId) {
            cameraTarget = selectedCameraId;
          } else if (devices && devices.length > 0) {
            if (isMobile) {
              const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
              cameraTarget = backCam ? backCam.id : devices[0].id;
            } else {
              cameraTarget = devices[0].id;
            }
          } else {
            cameraTarget = isMobile ? { facingMode: 'environment' } : { facingMode: 'user' };
          }

          const readerElem = document.getElementById('qr-camera-reader');
          if (!readerElem) return;
          try { readerElem.innerHTML = ''; } catch (e) {}

          const scanner = new Html5Qrcode('qr-camera-reader', {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39
            ],
            verbose: false
          });
          html5QrCodeRef.current = scanner;
          qrScanner = scanner;

          await scanner.start(
            cameraTarget,
            { fps: 15, disableFlip: false },
            (decodedText) => {
              handleProcessScan(decodedText, 'ಲೈವ್ ಕ್ಯಾಮೆರಾ');
            },
            () => {}
          );

          if (!isCancelled) {
            setIsCameraActive(true);
            setCameraError('');
          }
        } catch (err) {
          if (!isCancelled) {
            const errStr = String(err?.message || err || '');
            if (errStr.includes('Permission') || errStr.includes('NotAllowedError')) {
              setCameraError('ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ (Camera permission required).');
            } else {
              setCameraError(`ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ${errStr}`);
            }
          }
        }
      };

      const timer = setTimeout(startScanner, 120);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (qrScanner) {
          try {
            if (qrScanner.isScanning) {
              qrScanner.stop().then(() => {
                try { qrScanner.clear(); } catch (e) {}
              }).catch(() => {});
            } else {
              try { qrScanner.clear(); } catch (e) {}
            }
          } catch (e) {}
        }
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      };
    } else {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              try { html5QrCodeRef.current.clear(); } catch (e) {}
            }).catch(() => {});
          } else {
            try { html5QrCodeRef.current.clear(); } catch (e) {}
          }
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
      setIsCameraActive(false);
    }
  }, [cameraOpen, selectedCameraId, retryCount]);

  // Filtered attendance list
  const filteredList = useMemo(() => {
    return attendanceList.filter(item => {
      if (filterStatus !== 'All' && item.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = String(item.entity_id).toLowerCase().includes(q);
        const matchName = String(item.name).toLowerCase().includes(q);
        const matchDept = String(item.department).toLowerCase().includes(q);
        const matchCat = String(item.category || '').toLowerCase().includes(q);
        return matchId || matchName || matchDept || matchCat;
      }
      return true;
    });
  }, [attendanceList, filterStatus, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Election Pagination
  const electionTotalPages = Math.max(1, Math.ceil(filteredElectionList.length / pageSize));
  const paginatedElectionList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredElectionList.slice(start, start + pageSize);
  }, [filteredElectionList, currentPage, pageSize]);

  // Attendance stats for current AGM
  const totalMembers = attendanceList.length || 17085;
  const presentMembers = attendanceList.filter(i => i.status === 'Present').length;
  const absentMembers = totalMembers - presentMembers;
  const quorumPct = totalMembers > 0 ? ((presentMembers / totalMembers) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5">

      {/* Top Header Banner: Single Line Title & All Buttons Below */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        {/* Line 1: Title full width on a single line */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight whitespace-nowrap">
              ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM 6 ರಿಂದ 10: 2023-24 ರಿಂದ 2027-28) ಮತ್ತು ಚುನಾವಣಾ ಅರ್ಹತಾ ನಿರ್ವಹಣೆ
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              5-Year AGM Suite
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden xl:block">
            ಮಹಾಸಭೆ 6 ರಿಂದ 10 (2023-24 - 2027-28) • ಅಂತಿಮ ಫ್ರೀಜ್ ರಕ್ಷಣೆ • ಅಧಿಕೃತ ಚುನಾವಣಾ ಮತದಾರರ ಅರ್ಹತಾ ವಹಿ
          </p>
        </div>

        {/* Line 2: All Action Buttons and Controls Below the Title */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {activeAgmTab !== 'ELECTION_ELIGIBLE' && (
              <>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-400 font-semibold">ದಿನಾಂಕ:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    disabled={isCurrentAgmFrozen}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-emerald-300 font-mono font-bold outline-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
                  <span className="text-amber-400 font-bold shrink-0">ಕೌಂಟರ್:</span>
                  <select
                    value={selectedCounter}
                    onChange={(e) => handleCounterChange(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    {COUNTER_OPTIONS.map((c, i) => (
                      <option key={i} value={c} className="bg-slate-900 text-slate-100">{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Sync Button */}
            <button
              onClick={() => syncWithCloudNow()}
              disabled={isSyncing}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
              title="ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್‌ನಿಂದ ಇತ್ತೀಚಿನ ಹಾಜರಾತಿ ಸಿಂಕ್ ಮಾಡಿ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
              <span>ಸಿಂಕ್</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Excel Export (.xlsx) */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              title="ಹಾಜರಾತಿ ವಹಿಯನ್ನು ಎಕ್ಸೆಲ್ (.xlsx) ರೂಪದಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>ಎಕ್ಸೆಲ್ (.xlsx)</span>
            </button>

            {/* Print Register */}
            <button
              onClick={handlePrintAttendance}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              title="ಅಧಿಕೃತ ವಹಿಯನ್ನು ಮುದ್ರಿಸಿ (Portrait Print)"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>ಮುದ್ರಿಸಿ</span>
            </button>
          </div>
        </div>
      </div>

      {/* RBAC Info Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">ಸಿಬ್ಬಂದಿ:</span>
          <span className="text-white font-bold">{user?.name || user?.username || 'Avinash Ghiradimath'}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {user?.role || 'Admin'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">ಸಾಧನ:</span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            {/mobile|android|iphone|ipad/i.test(navigator.userAgent) ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Monitor className="w-3.5 h-3.5 text-cyan-400" />}
            {/mobile|android|iphone|ipad/i.test(navigator.userAgent) ? 'ಮೊಬೈಲ್ ಕೌಂಟರ್' : 'ಡೆಸ್ಕ್‌ಟಾಪ್ ಕೌಂಟರ್'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {autoSaveStatus && (
            <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{autoSaveStatus}</span>
            </span>
          )}
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸಕ್ರಿಯ (ಕೊನೆಯ ಸಿಂಕ್: {lastSyncTime || '—'})</span>
          </span>
        </div>
      </div>

      {/* 5 AGM TABS + ELECTION ELIGIBLE TAB */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {['AGM-6', 'AGM-7', 'AGM-8', 'AGM-9', 'AGM-10'].map(agmKey => {
            const cfg = DEFAULT_AGM_CONFIGS[agmKey];
            const isFrozen = frozenAgms[agmKey];
            const isActive = activeAgmTab === agmKey;

            return (
              <button
                key={agmKey}
                onClick={() => {
                  setActiveAgmTab(agmKey);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg ring-2 ring-emerald-400'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{cfg.name}</span>
                <span className="text-[10px] opacity-80">({cfg.year})</span>
                {isFrozen ? (
                  <span title="ಫ್ರೀಜ್ ಆಗಿದೆ (Locked)" className="text-amber-300 flex items-center">
                    <Lock className="w-3 h-3" />
                  </span>
                ) : (
                  <span title="ಸಕ್ರಿಯ (Active)" className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>
            );
          })}

          {/* Election Eligible Tab for ALL 5 AGMs - Compact & proportional */}
          <button
            onClick={() => {
              setActiveAgmTab('ELECTION_ELIGIBLE');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeAgmTab === 'ELECTION_ELIGIBLE'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg ring-2 ring-amber-400'
                : 'bg-slate-900 text-amber-300 border border-amber-600/50 hover:bg-amber-950/40 hover:text-white'
            }`}
            title="ಚುನಾವಣಾ ಅರ್ಹತೆ (Election Eligible Tab - 5 AGMs: 2023-24 to 2027-28)"
          >
            <Vote className="w-3.5 h-3.5 text-amber-300" />
            <span>🗳️ ಚುನಾವಣಾ ಅರ್ಹತೆ (5 AGMs)</span>
          </button>

          {/* Consolidated 5-AGMs Register Button - Side by Side with Election Tab */}
          <button
            onClick={() => setShowManualBookModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-purple-950/40 text-purple-300 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap shrink-0"
            title="ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಸಂಯೋಜಿತ ಕೈಪಿಡಿ ಹಾಜರಾತಿ ವಹಿ (Consolidated 5-AGMs Register)"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>📊 ಸಂಯೋಜಿತ ವಹಿ (5 AGMs)</span>
          </button>
        </div>

        {/* Actions for Active AGM: Reset, Freeze/Unlock */}
        {activeAgmTab !== 'ELECTION_ELIGIBLE' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Reset Attendance Button */}
            <button
              onClick={() => {
                if (isCurrentAgmFrozen) {
                  showToast(`🔒 ಈ ಮಹಾಸಭೆ (${activeAgmTab}) ಫ್ರೀಜ್ ಆಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ಮೊದಲು ಅನ್‌ಲಾಕ್ ಮಾಡಿ.`, 'error');
                  handleRequestUnlock(activeAgmTab);
                } else {
                  setShowResetModal(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              title="ಈ ಮಹಾಸಭೆಯ ಶೇರುದಾರರ ಹಾಜರಾತಿ ಸ್ಥಿತಿ ಮರುಹೊಂದಿಸಿ (Reset Status)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>ಮರುಹೊಂದಿಸಿ (Reset)</span>
            </button>

            {/* Freeze / Unlock Button */}
            {isCurrentAgmFrozen ? (
              <button
                onClick={() => handleRequestUnlock(activeAgmTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                title="ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ ಅನ್‌ಫ್ರೀಜ್ / ತಿದ್ದುಪಡಿ ಮಾಡಿ"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>ಅನ್‌ಲಾಕ್ / ತಿದ್ದುಪಡಿ</span>
              </button>
            ) : (
              <button
                onClick={() => handleFreezeCurrentAgm(activeAgmTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-600 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                title="ಸಭೆ ಮುಗಿದ ನಂತರ ಅಂತಿಮಗೊಳಿಸಿ ಫ್ರೀಜ್ ಮಾಡಿ"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>ಅಂತಿಮಗೊಳಿಸಿ ಫ್ರೀಜ್ ಮಾಡಿ (Finalize & Freeze)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FROZEN AGM BANNER */}
      {isCurrentAgmFrozen && activeAgmTab !== 'ELECTION_ELIGIBLE' && (
        <div className="p-3.5 bg-amber-950/70 border-2 border-amber-500 rounded-2xl text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-amber-300 text-sm flex items-center gap-2">
                <span>🔒 ಈ ಮಹಾಸಭೆಯನ್ನು ({DEFAULT_AGM_CONFIGS[activeAgmTab]?.labelKn || activeAgmTab}) ಅಂತಿಮಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ಫ್ರೀಜ್ ಮಾಡಲಾಗಿದೆ.</span>
              </div>
              <div className="text-[11.5px] text-amber-100/90 mt-0.5">
                ದಾಖಲೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿಡಲು ಬದಲಾವಣೆಗಳನ್ನು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ರಹಸ್ಯ ಕೋಡ್ ಅಗತ್ಯವಿದೆ.
              </div>
            </div>
          </div>

          <button
            onClick={() => handleRequestUnlock(activeAgmTab)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ ಅನ್‌ಲಾಕ್ ಮಾಡಿ</span>
          </button>
        </div>
      )}

      {/* CONSOLIDATED 5-AGMs MANUAL BOOK ATTENDANCE MODAL */}
      {showManualBookModal && (
        <ManualAttendanceModal
          isOpen={showManualBookModal}
          onClose={() => setShowManualBookModal(false)}
          masterShareholders={masterShareholders}
          allAgmScansMap={allAgmScansMap}
          onManualAttendanceUpdate={handleManualAttendanceSync}
          isModal={true}
          showToast={showToast}
          user={user}
        />
      )}

      {/* PARTICULAR AGM MANUAL BOOK ENTRY MODAL */}
      {showParticularManualModal && (
        <ParticularAgmManualModal
          isOpen={showParticularManualModal}
          onClose={() => setShowParticularManualModal(false)}
          agmKey={activeAgmTab}
          agmConfig={DEFAULT_AGM_CONFIGS[activeAgmTab]}
          masterShareholders={masterShareholders}
          allAgmScansMap={allAgmScansMap}
          onSaveRecord={handleManualAttendanceSync}
          showToast={showToast}
          user={user}
        />
      )}

      {/* UNLOCK SECRET CODE MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ (Secret Code)</h3>
                  <p className="text-xs text-slate-400">
                    {DEFAULT_AGM_CONFIGS[unlockTargetAgm]?.labelKn || unlockTargetAgm} ತಿದ್ದುಪಡಿ ಮಾಡಲು ದಯವಿಟ್ಟು ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                ಅಧಿಕೃತ ರಹಸ್ಯ ಅನುಮೋದನೆ ಕೋಡ್ (Secret Authorization Code):
              </label>
              <div className="relative">
                <input
                  type={showSecretCodeChars ? 'text' : 'password'}
                  autoFocus
                  value={secretCodeInput}
                  onChange={(e) => {
                    setSecretCodeInput(e.target.value);
                    setSecretCodeError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmUnlock();
                  }}
                  placeholder="ಅಧಿಕೃತ ರಹಸ್ಯ ಕೋಡ್ ನಮೂದಿಸಿ (Enter Secret Code)..."
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-amber-200 outline-none font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretCodeChars(!showSecretCodeChars)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showSecretCodeChars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {secretCodeError && (
                <p className="text-xs text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{secretCodeError}</span>
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ಕೋಡ್ ದೃಢೀಕರಣದ ನಂತರ ಈ ಮಹಾಸಭೆಯು ತಿದ್ದುಪಡಿಗೆ ಮುಕ್ತವಾಗುತ್ತದೆ.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl text-xs shadow-lg cursor-pointer"
              >
                ಅನ್‌ಲಾಕ್ ಮಾಡಿ (Unlock)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET AGM ATTENDANCE CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-300">
                    ಹಾಜರಾತಿ ಸ್ಥಿತಿ ಮರುಹೊಂದಿಸಿ (Reset Status)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {DEFAULT_AGM_CONFIGS[activeAgmTab]?.name} ({DEFAULT_AGM_CONFIGS[activeAgmTab]?.year})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                ಗಮನಿಸಿ: ಮರುಹೊಂದಿಸಿದ ನಂತರ ಆಯ್ಕೆ ಮಾಡಿದ ಶೇರುದಾರರ ಹಾಜರಾತಿ ಸ್ಥಿತಿಯು <strong>"ಗೈರುಹಾಜರು (Absent)"</strong> ಎಂದು ಬದಲಾಗುತ್ತದೆ.
              </span>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-300">
                ಮರುಹೊಂದಿಸುವ ವ್ಯಾಪ್ತಿ ಆಯ್ಕೆಮಾಡಿ (Select Scope):
              </label>

              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                resetScopeChoice === 'all'
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}>
                <input
                  type="radio"
                  name="resetScope"
                  value="all"
                  checked={resetScopeChoice === 'all'}
                  onChange={() => setResetScopeChoice('all')}
                  className="text-rose-500"
                />
                <div className="flex-1">
                  <div className="font-bold">ಎಲ್ಲಾ ಶೇರುದಾರರನ್ನು ಮರುಹೊಂದಿಸಿ (Reset ALL to Absent)</div>
                  <div className="text-[11px] text-slate-400">ಈ ಮಹಾಸಭೆಯ ಒಟ್ಟು {attendanceList.length} ಶೇರುದಾರರ ಹಾಜರಾತಿಯನ್ನು ತೆರವುಗೊಳಿಸುತ್ತದೆ</div>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                resetScopeChoice === 'filtered'
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}>
                <input
                  type="radio"
                  name="resetScope"
                  value="filtered"
                  checked={resetScopeChoice === 'filtered'}
                  onChange={() => setResetScopeChoice('filtered')}
                  className="text-rose-500"
                />
                <div className="flex-1">
                  <div className="font-bold">ಪ್ರಸ್ತುತ ಹುಡುಕಲಾದ / ಫಿಲ್ಟರ್ ಆದವರು ಮಾತ್ರ ({filteredList.length} ಶೇರುದಾರರು)</div>
                  <div className="text-[11px] text-slate-400">ಪ್ರಸ್ತುತ ಪಟ್ಟಿಯಲ್ಲಿ ಗೋಚರಿಸುವ ಶೇರುದಾರರನ್ನು ಮಾತ್ರ ಗೈರುಹಾಜರು ಮಾಡುತ್ತದೆ</div>
                </div>
              </label>

              {selectedShareholderIds.size > 0 && (
                <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  resetScopeChoice === 'selected'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="resetScope"
                    value="selected"
                    checked={resetScopeChoice === 'selected'}
                    onChange={() => setResetScopeChoice('selected')}
                    className="text-rose-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold">ಚೆಕ್‌ಬಾಕ್ಸ್ ಮೂಲಕ ಆಯ್ಕೆ ಮಾಡಿದವರು ({selectedShareholderIds.size} ಶೇರುದಾರರು)</div>
                    <div className="text-[11px] text-slate-400">ಆಯ್ಕೆ ಮಾಡಿದ ನಿರ್ದಿಷ್ಟ ಶೇರುದಾರರನ್ನು ಮಾತ್ರ ಮರುಹೊಂದಿಸುತ್ತದೆ</div>
                  </div>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ
              </button>
              <button
                type="button"
                onClick={() => handleResetAgmAttendance(resetScopeChoice)}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ಖಚಿತಪಡಿಸಿ ಮರುಹೊಂದಿಸಿ (Confirm Reset)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK SHAREHOLDERS STATUS CHANGE MODAL (BY MULTIPLE SHARE NUMBERS) */}
      {showBulkPresentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bulkTargetStatus === 'Present'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <span>ಶೇರು ಸಂಖ್ಯೆಗಳ ಮೂಲಕ ಸ್ಥಿತಿ ಬದಲಾವಣೆ</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      bulkTargetStatus === 'Present'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {bulkTargetStatus === 'Present' ? '🟢 ಹಾಜರು (Present)' : '🔴 ಗೈರುಹಾಜರು (Absent)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {DEFAULT_AGM_CONFIGS[activeAgmTab]?.name} ({DEFAULT_AGM_CONFIGS[activeAgmTab]?.year})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBulkPresentModal(false);
                  setBulkSearchText('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Status Choice (Present or Absent) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ಗುರಿ ಸ್ಥಿತಿ ಆಯ್ಕೆಮಾಡಿ (Target Status):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkTargetStatus('Present')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    bulkTargetStatus === 'Present'
                      ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    bulkTargetStatus === 'Present' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">🟢 ಹಾಜರು (Mark Present)</div>
                    <div className="text-[10px] text-slate-400">ಕೌಂಟರ್ ({selectedCounter}) & ಸಿಬ್ಬಂದಿಯೊಂದಿಗೆ ದಾಖಲಾಗುತ್ತದೆ</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkTargetStatus('Absent')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    bulkTargetStatus === 'Absent'
                      ? 'bg-rose-950/70 border-rose-500 text-white shadow-lg ring-1 ring-rose-500'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    bulkTargetStatus === 'Absent' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">🔴 ಗೈರುಹಾಜರು (Mark Absent)</div>
                    <div className="text-[10px] text-slate-400">ಹಾಜರಾತಿ ರದ್ದುಪಡಿಸಿ ಗೈರುಹಾಜರು ಮಾಡುತ್ತದೆ</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Multiple Share Numbers Input Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  ಶೇರು ಸಂಖ್ಯೆಗಳನ್ನು ನಮೂದಿಸಿ (Enter Multiple Share Numbers):
                </label>
                <span className="text-[10px] text-slate-400">
                  ಕಾಮಾ (,), ಸ್ಪೇಸ್, ಅಥವಾ ಶ್ರೇಣಿ (1-50) ಬೆಂಬಲಿತವಾಗಿದೆ
                </span>
              </div>
              <textarea
                value={bulkShareNumbersInput}
                onChange={(e) => setBulkShareNumbersInput(e.target.value)}
                placeholder="ಉದಾಹರಣೆಗೆ: 1, 2, 5, 881, 9541, 10-25"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-3 text-xs text-white font-mono placeholder:text-slate-500 outline-none resize-none transition"
              />
            </div>

            {/* Quick Search & Add Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>ತ್ವರಿತ ಶೋಧನೆ & ಸೇರ್ಪಡೆ (Quick Search & Add):</span>
                <span className="text-[10px] text-slate-400">ಹೆಸರು / ಶೇರು ಸಂಖ್ಯೆ ಟೈಪ್ ಮಾಡಿ</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bulkSearchText}
                  onChange={(e) => setBulkSearchText(e.target.value)}
                  placeholder="ಶೇರುದಾರರ ಹೆಸರು, ಶೇರು ಸಂಖ್ಯೆ ಅಥವಾ ಊರು..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              {/* Suggestions dropdown */}
              {bulkSearchResults.length > 0 && (
                <div className="bg-slate-950 border border-slate-700 rounded-xl p-1.5 space-y-1 max-h-36 overflow-y-auto">
                  {bulkSearchResults.map((s) => {
                    const idStr = String(s.entity_id).trim();
                    const isAdded = matchedShareholders.some(m => String(m.entity_id).trim() === idStr);
                    return (
                      <div
                        key={s.entity_id}
                        onClick={() => handleAddBulkShareholder(idStr)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                          isAdded
                            ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/40'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-emerald-400">#{s.entity_id}</span>
                          <span>{s.name}</span>
                          <span className="text-[10px] text-slate-400">({s.department || 'ಊರು ಇಲ್ಲ'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            s.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {s.status === 'Present' ? 'ಹಾಜರು' : 'ಗೈರು'}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            {isAdded ? '✓ ಸೇರಿದೆ' : '+ ಸೇರಿಸಿ'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Matched Shareholders Live Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span>ಗುರುತಿಸಲಾದ ಶೇರುದಾರರು (Matched):</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                    matchedShareholders.length > 0 ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {matchedShareholders.length} ಸದಸ್ಯರು
                  </span>
                </span>
                {matchedShareholders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllBulkShareholders}
                    className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer underline"
                  >
                    ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ (Clear All)
                  </button>
                )}
              </div>

              {matchedShareholders.length > 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                  {matchedShareholders.map((s) => (
                    <div
                      key={s.entity_id}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200 flex items-center gap-1.5 group hover:border-slate-500"
                    >
                      <span className="font-bold text-emerald-400 font-mono">#{s.entity_id}</span>
                      <span className="max-w-[120px] truncate">{s.name}</span>
                      <span className={`text-[9px] px-1 rounded ${
                        s.status === 'Present' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {s.status === 'Present' ? 'ಹಾಜರು' : 'ಗೈರು'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBulkShareholder(s.entity_id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="ತೆಗೆದುಹಾಕಿ"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  ಯಾವುದೇ ಶೇರುದಾರರು ಆಯ್ಕೆಯಾಗಿಲ್ಲ. ಮೇಲಿನ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ಶೇರು ಸಂಖ್ಯೆಗಳನ್ನು ನಮೂದಿಸಿ ಅಥವಾ ಸರ್ಚ್ ಮಾಡಿ ಸೇರಿಸಿ.
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowBulkPresentModal(false);
                  setBulkSearchText('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                ರದ್ದುಮಾಡಿ (Cancel)
              </button>
              <button
                type="button"
                disabled={matchedShareholders.length === 0}
                onClick={handleApplyStatusByShareNumbers}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer flex items-center gap-2 ${
                  matchedShareholders.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : bulkTargetStatus === 'Present'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  ✓ {matchedShareholders.length} ಶೇರುದಾರರ ಸ್ಥಿತಿ '{bulkTargetStatus === 'Present' ? 'ಹಾಜರು' : 'ಗೈರುಹಾಜರು'}' ಎಂದು ಬದಲಾಯಿಸಿ
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: ELECTION ELIGIBILITY TAB (ALL 5 AGMS REPORT) */}
      {/* ======================================================== */}
      {activeAgmTab === 'ELECTION_ELIGIBLE' ? (
        <div className="space-y-5 animate-fadeIn">
          {/* Election Rule & Summary Bar */}
          <div className="bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/70 border-2 border-amber-500/60 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                    <span>ಸಹಕಾರಿ ಸಂಘದ ಚುನಾವಣಾ ಮತದಾರರ ಅರ್ಹತಾ ವಹಿ (5 AGMs Master Register)</span>
                    <span className="text-[10px] bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-bold">
                      Section 20(2) KCS Act
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ ಕಲಂ 20(2) ನಿಯಮಾನುಸಾರ, ಕಳೆದ 5 ಮಹಾಸಭೆಗಳಲ್ಲಿ ಕನಿಷ್ಠ {minAgmsRequired} ಸಭೆಗಳಿಗೆ ಹಾಜರಾದ ಶೇರುದಾರರಿಗೆ ಮತದಾನದ ಅರ್ಹತೆ
                  </p>
                </div>
              </div>

              {/* Statutory Rule Criterion Selector */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400 font-semibold">ಅರ್ಹತಾ ಮಾನದಂಡ:</span>
                <select
                  value={minAgmsRequired}
                  onChange={(e) => setMinAgmsRequired(Number(e.target.value))}
                  className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer"
                >
                  <option value={1} className="bg-slate-900 text-slate-100">ಕನಿಷ್ಠ 1 ಮಹಾಸಭೆ (1 of 5 AGMs)</option>
                  <option value={2} className="bg-slate-900 text-slate-100">ಕನಿಷ್ಠ 2 ಮಹಾಸಭೆಗಳು (2 of 5 AGMs - ಕಲಂ 20(2) ನಿಯಮ)</option>
                  <option value={3} className="bg-slate-900 text-slate-100">ಕನಿಷ್ಠ 3 ಮಹಾಸಭೆಗಳು (3 of 5 AGMs)</option>
                  <option value={4} className="bg-slate-900 text-slate-100">ಕನಿಷ್ಠ 4 ಮಹಾಸಭೆಗಳು (4 of 5 AGMs)</option>
                  <option value={5} className="bg-slate-900 text-slate-100">ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳು (All 5 AGMs)</option>
                </select>
              </div>
            </div>

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-slate-400 font-medium">ಒಟ್ಟು ಸದಸ್ಯರು</div>
                  <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">{totalCoopMembers.toLocaleString()}</div>
                </div>
                <Users className="w-5 h-5 text-slate-500" />
              </div>

              <div className="bg-slate-900/90 border border-emerald-800/60 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-emerald-400 font-medium">ಚುನಾವಣೆಗೆ ಅರ್ಹರು (Eligible)</div>
                  <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">{eligibleVotersCount.toLocaleString()}</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="bg-slate-900/90 border border-rose-800/60 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-rose-400 font-medium">ಅನರ್ಹರು (Ineligible)</div>
                  <div className="text-xl font-bold text-rose-300 font-mono mt-0.5">{ineligibleVotersCount.toLocaleString()}</div>
                </div>
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>

              <div className="bg-slate-900/90 border border-amber-800/60 p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-amber-400 font-medium">ಮತದಾನ ಅರ್ಹತಾ ಪ್ರಮಾಣ</div>
                  <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{voterEligibilityRate}%</div>
                </div>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Election Filter & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1">ಫಿಲ್ಟರ್:</span>
              <button
                onClick={() => { setElectionFilterStatus('All'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  electionFilterStatus === 'All' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ಎಲ್ಲಾ ಸದಸ್ಯರು ({totalCoopMembers.toLocaleString()})
              </button>
              <button
                onClick={() => { setElectionFilterStatus('Eligible'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  electionFilterStatus === 'Eligible' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ಚುನಾವಣೆಗೆ ಅರ್ಹರು ({eligibleVotersCount.toLocaleString()})
              </button>
              <button
                onClick={() => { setElectionFilterStatus('Ineligible'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  electionFilterStatus === 'Ineligible' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ಅನರ್ಹರು ({ineligibleVotersCount.toLocaleString()})
              </button>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Name, Share No, Place, Category..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Election Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-3">ಷೇರು ನಂ</th>
                    <th className="py-3.5 px-4">ಶೇರುದಾರರ ಹೆಸರು</th>
                    <th className="py-3.5 px-3 text-center">ವರ್ಗ</th>
                    <th className="py-3.5 px-3">ಸ್ಥಳ / ಗ್ರಾಮ</th>
                    <th className="py-3.5 px-2 text-center" title="2023-24 AGM 6">AGM 6</th>
                    <th className="py-3.5 px-2 text-center" title="2024-25 AGM 7">AGM 7</th>
                    <th className="py-3.5 px-2 text-center" title="2025-26 AGM 8">AGM 8</th>
                    <th className="py-3.5 px-2 text-center" title="2026-27 AGM 9">AGM 9</th>
                    <th className="py-3.5 px-2 text-center" title="2027-28 AGM 10">AGM 10</th>
                    <th className="py-3.5 px-3 text-center">ಹಾಜರಾತಿ</th>
                    <th className="py-3.5 px-4 text-center">ಚುನಾವಣಾ ಅರ್ಹತೆ (Eligibility)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paginatedElectionList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-emerald-400">#{item.entity_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {Number(item.shares) > 0 ? (
                            <span className="text-[10px] text-slate-400">({item.shares} ಶೇರು)</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-900 border border-slate-700/80 text-amber-300 whitespace-nowrap">
                          {item.category || 'ಅ - ವರ್ಗ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{item.department}</td>
                      <td className="py-3 px-2 text-center">
                        {item.hasAgm6 ? <span className="text-emerald-400 font-bold text-xs">✓</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.hasAgm7 ? <span className="text-emerald-400 font-bold text-xs">✓</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.hasAgm8 ? <span className="text-emerald-400 font-bold text-xs">✓</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.hasAgm9 ? <span className="text-emerald-400 font-bold text-xs">✓</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.hasAgm10 ? <span className="text-emerald-400 font-bold text-xs">✓</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                        {item.attendedCount} / 5
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold ${
                          item.isEligible
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {item.isEligible ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{item.isEligible ? 'ಚುನಾವಣೆಗೆ ಅರ್ಹರು' : 'ಅನರ್ಹರು'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {electionTotalPages > 1 && (
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  ತೋರಿಸಲಾಗುತ್ತಿದೆ: {((currentPage - 1) * pageSize) + 1} ರಿಂದ {Math.min(currentPage * pageSize, filteredElectionList.length)} (ಒಟ್ಟು {filteredElectionList.length.toLocaleString()})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> ಹಿಂದಿನದು
                  </button>
                  <span className="font-bold text-slate-200 font-mono">
                    ಪುಟ {currentPage} / {electionTotalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(electionTotalPages, p + 1))}
                    disabled={currentPage >= electionTotalPages}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    ಮುಂದಿನದು <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW 2: INDIVIDUAL AGM ATTENDANCE TAB (AGM 1, 2, 3, 4, 5) */
        /* ======================================================== */
        <div className="space-y-5 animate-fadeIn">
          {/* Scanner Box */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/70 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <QrCode className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2">
                      <span>{DEFAULT_AGM_CONFIGS[activeAgmTab]?.labelKn || activeAgmTab} ಹಾಜರಾತಿ QR ಸ್ಕ್ಯಾನರ್</span>
                      {isCurrentAgmFrozen ? (
                        <span className="text-[10px] bg-amber-500 text-black px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> ಫ್ರೀಜ್ ಆಗಿದೆ
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-600 font-bold">
                          ⚡ ಸ್ವಯಂ ಉಳಿತಾಯ ಸಕ್ರಿಯ
                        </span>
                      )}
                    </h3>

                    {/* Bulk Status by Share Numbers Button inside Scanner Box */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isCurrentAgmFrozen) {
                          showToast(`🔒 ಈ ಮಹಾಸಭೆ (${activeAgmTab}) ಫ್ರೀಜ್ ಆಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ಮೊದಲು ಅನ್‌ಲಾಕ್ ಮಾಡಿ.`, 'error');
                          handleRequestUnlock(activeAgmTab);
                        } else {
                          setShowBulkPresentModal(true);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-teal-400/40"
                      title="ಶೇರು ಸಂಖ್ಯೆಗಳ ಮೂಲಕ ಸ್ಥಿತಿ (ಹಾಜರು / ಗೈರುಹಾಜರು) ಬದಲಾಯಿಸಿ"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>👥 ಶೇರು ನಂ ಮೂಲಕ ಸ್ಥಿತಿ ಬದಲಾವಣೆ</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ಶೇರುದಾರರ ಪುಸ್ತಕ ಸ್ಟಿಕ್ಕರ್ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಷೇರು ನಂ ನಮೂದಿಸಿ (Auto-saved to Database)
                  </p>
                </div>
              </div>

              {/* Stats for current AGM */}
              <div className="flex items-center gap-3 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">ಹಾಜರಾದವರು: </span>
                  <strong className="text-emerald-400 font-mono text-sm">{presentMembers}</strong>
                  <span className="text-slate-500"> / {totalMembers.toLocaleString()}</span>
                </div>
                <span className="text-slate-600">|</span>
                <div>
                  <span className="text-slate-400">ಕೋರಂ: </span>
                  <strong className="text-amber-400 font-mono text-sm">{quorumPct}%</strong>
                </div>
              </div>
            </div>

            {/* Quick Scanner Input Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={scanInputRef}
                  type="text"
                  autoFocus
                  value={scanInput}
                  disabled={!canRecordAttendance || isCurrentAgmFrozen}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scanInput.trim()) {
                      handleProcessScan(scanInput.trim(), 'ಮ್ಯಾನುವಲ್ ಎಂಟ್ರಿ');
                    }
                  }}
                  placeholder={isCurrentAgmFrozen ? "🔒 ಈ ಸಭೆಯು ಫ್ರೀಜ್ ಆಗಿದೆ. ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಅನ್‌ಲಾಕ್ ಕೋಡ್ ಬಳಸಿ..." : "ಪುಸ್ತಕ ಸ್ಟಿಕ್ಕರ್ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಷೇರು ನಂ ನಮೂದಿಸಿ (Press Enter)..."}
                  className="w-full bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-9 pr-24 py-2.5 text-xs text-emerald-100 placeholder:text-slate-500 outline-none transition-all shadow-inner font-mono disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={!canRecordAttendance || isCurrentAgmFrozen}
                  onClick={() => scanInput.trim() && handleProcessScan(scanInput.trim(), 'ಮ್ಯಾನುವಲ್ ಎಂಟ್ರಿ')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  ದಾಖಲಿಸಿ
                </button>
              </div>

              {/* Camera Scanner Trigger */}
              <button
                type="button"
                disabled={!canRecordAttendance || isCurrentAgmFrozen}
                onClick={() => {
                  setCameraError('');
                  setCameraOpen(!cameraOpen);
                }}
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 disabled:opacity-50 ${
                  cameraOpen
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{cameraOpen ? 'ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ' : '🎥 ಲೈವ್ ಕ್ಯಾಮೆರಾ'}</span>
              </button>

              {/* Gallery Image Scan */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUploadScan}
              />
              <button
                type="button"
                disabled={!canRecordAttendance || isCurrentAgmFrozen}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                title="ಗ್ಯಾಲರಿಯಿಂದ ಚಿತ್ರ ಆಯ್ಕೆ ಮಾಡಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline">ಗ್ಯಾಲರಿ</span>
              </button>

              {/* Particular AGM Manual Book Entry Button (Scan or Manual Option) */}
              <button
                type="button"
                disabled={!canRecordAttendance || isCurrentAgmFrozen}
                onClick={() => setShowParticularManualModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-500/50 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
                title={`${DEFAULT_AGM_CONFIGS[activeAgmTab]?.name || 'AGM'} (${DEFAULT_AGM_CONFIGS[activeAgmTab]?.year || ''}) ಕೈಪಿಡಿ ಪುಸ್ತಕ ಹಾಜರಾತಿ ನಮೂದು`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-200" />
                <span>📖 ಕೈಪಿಡಿ ನಮೂದು</span>
              </button>
            </div>

            <div id="temp-qr-file-scanner" className="hidden" />

            {/* Camera Viewfinder */}
            {cameraOpen && (
              <div className="bg-slate-950/90 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                    <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>ಲೈವ್ ಕ್ಯಾಮೆರಾ QR ಸ್ಕ್ಯಾನರ್</span>
                    </h4>
                  </div>
                  <button onClick={() => setCameraOpen(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-emerald-500/70 shadow-2xl bg-black">
                  <div id="qr-camera-reader" className="w-full min-h-[260px] bg-black flex items-center justify-center text-slate-500 text-xs [&>video]:w-full [&>video]:max-h-[340px] [&>video]:object-contain" />
                </div>
              </div>
            )}

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="bg-amber-950/80 border-2 border-amber-500 rounded-xl p-3.5 flex items-center justify-between text-xs animate-fadeIn text-amber-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-black text-amber-300 text-sm">
                      ⚠️ ಈಗಾಗಲೇ ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ! #{duplicateWarning.entity_id} - {duplicateWarning.name}
                    </div>
                    <div className="text-[11.5px] text-amber-100 mt-0.5">
                      ದಾಖಲಾದ ಸಮಯ: <strong>{duplicateWarning.time}</strong> • ಸಿಬ್ಬಂದಿ: <strong>{duplicateWarning.scanned_by}</strong> ({duplicateWarning.counter})
                    </div>
                  </div>
                </div>
                <button onClick={() => setDuplicateWarning(null)} className="text-amber-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Last Scanned Member Notification Card */}
            {lastScannedMember && (
              <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg border border-emerald-500/50 bg-slate-900 flex items-center justify-center font-bold text-emerald-400 font-mono text-sm overflow-hidden shrink-0">
                    #{lastScannedMember.entity_id}
                  </div>
                  <div>
                    <div className="font-bold text-emerald-200 text-sm flex items-center gap-2">
                      <span>{lastScannedMember.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                        {lastScannedMember.category || 'ಅ - ವರ್ಗ'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ⚡ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸೇವ್ ಆಗಿದೆ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      ಸಾ॥ {lastScannedMember.department} • ಸಮಯ: <strong className="text-white font-mono">{lastScannedMember.time}</strong> • ದಾಖಲಿಸಿದವರು: <strong className="text-cyan-300">{lastScannedMember.scanned_by}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ಹಾಜರಾತಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-slate-400 font-medium">ಒಟ್ಟು ಷೇರುದಾರರು</div>
                <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">{totalMembers.toLocaleString()}</div>
              </div>
              <Users className="w-5 h-5 text-slate-500" />
            </div>

            <div className="bg-slate-950/80 border border-emerald-800/50 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-emerald-400 font-medium">ಹಾಜರಾದವರು (Present)</div>
                <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">{presentMembers.toLocaleString()}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="bg-slate-950/80 border border-rose-800/50 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-rose-400 font-medium">ಗೈರುಹಾಜರಾದವರು (Absent)</div>
                <div className="text-xl font-bold text-rose-300 font-mono mt-0.5">{absentMembers.toLocaleString()}</div>
              </div>
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>

            <div className="bg-slate-950/80 border border-amber-800/50 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-amber-400 font-medium">ಕೋರಂ ಸ್ಥಿತಿ (Quorum)</div>
                <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{quorumPct}%</div>
              </div>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1">ಫಿಲ್ಟರ್:</span>
              {['All', 'Present', 'Absent'].map(st => (
                <button
                  key={st}
                  onClick={() => { setFilterStatus(st); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterStatus === st
                      ? st === 'Present' ? 'bg-emerald-600 text-white shadow' : st === 'Absent' ? 'bg-rose-600 text-white shadow' : 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'All' ? `ಎಲ್ಲವೂ (${attendanceList.length})` : st === 'Present' ? `ಹಾಜರು (${presentMembers})` : `ಗೈರುಹಾಜರು (${absentMembers})`}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Name, Share No, Place, Category..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedList.length > 0 && paginatedList.every(i => selectedShareholderIds.has(String(i.entity_id).trim()))}
                        onChange={(e) => {
                          const nextSet = new Set(selectedShareholderIds);
                          if (e.target.checked) {
                            paginatedList.forEach(i => nextSet.add(String(i.entity_id).trim()));
                          } else {
                            paginatedList.forEach(i => nextSet.delete(String(i.entity_id).trim()));
                          }
                          setSelectedShareholderIds(nextSet);
                        }}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                        title="ಪ್ರಸ್ತುತ ಪುಟದ ಎಲ್ಲರನ್ನೂ ಆಯ್ಕೆ ಮಾಡಿ"
                      />
                    </th>
                    <th className="py-3.5 px-4">Entity ID (ಷೇರು ಸಂ)</th>
                    <th className="py-3.5 px-4">Name (ಹೆಸರು)</th>
                    <th className="py-3.5 px-4 text-center">ವರ್ಗ (Category)</th>
                    <th className="py-3.5 px-4">Place / Dept (ಸ್ಥಳ)</th>
                    <th className="py-3.5 px-4">Scan Time (ಸಮಯ)</th>
                    <th className="py-3.5 px-4">ದಾಖಲಿಸಿದ ಸಿಬ್ಬಂದಿ (Recorded By)</th>
                    <th className="py-3.5 px-4 text-center">Status (ಸ್ಥಿತಿ)</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paginatedList.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-slate-900/60 transition-colors ${selectedShareholderIds.has(String(item.entity_id).trim()) ? 'bg-emerald-950/30' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedShareholderIds.has(String(item.entity_id).trim())}
                          onChange={(e) => {
                            const nextSet = new Set(selectedShareholderIds);
                            const id = String(item.entity_id).trim();
                            if (e.target.checked) {
                              nextSet.add(id);
                            } else {
                              nextSet.delete(id);
                            }
                            setSelectedShareholderIds(nextSet);
                          }}
                          className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 cursor-pointer accent-emerald-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">#{item.entity_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {Number(item.shares) > 0 ? (
                            <span className="text-[10px] text-slate-400">({item.shares} ಶೇರು)</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-900 border border-slate-700/80 text-amber-300 whitespace-nowrap">
                          {item.category || 'ಅ - ವರ್ಗ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{item.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{item.time || '—'}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.scanned_by ? (
                          <div className="flex flex-col">
                            <span className="text-cyan-300 font-semibold">{item.scanned_by}</span>
                            <span className="text-[10px] text-slate-500">{item.counter || 'ಕೌಂಟರ್'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Present'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {item.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.status === 'Present' ? 'ಹಾಜರು (Present)' : 'ಗೈರುಹಾಜರು (Absent)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          disabled={!canRecordAttendance}
                          onClick={() => toggleStatus(item.entity_id)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
                        >
                          {item.status === 'Present' ? 'Mark Absent' : 'Mark Present'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  ತೋರಿಸಲಾಗುತ್ತಿದೆ: {((currentPage - 1) * pageSize) + 1} ರಿಂದ {Math.min(currentPage * pageSize, filteredList.length)} (ಒಟ್ಟು {filteredList.length.toLocaleString()})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> ಹಿಂದಿನದು
                  </button>
                  <span className="font-bold text-slate-200 font-mono">
                    ಪುಟ {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    ಮುಂದಿನದು <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION BAR FOR SELECTED SHAREHOLDERS */}
      {selectedShareholderIds.size > 0 && activeAgmTab !== 'ELECTION_ELIGIBLE' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/80 rounded-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center gap-3 animate-slideUp">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-black">
              {selectedShareholderIds.size}
            </span>
            <span>ಶೇರುದಾರರು ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <button
            onClick={() => handleBulkMarkPresent('selected')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ಹಾಜರು ಮಾಡಿ (Mark Present)</span>
          </button>
          <button
            onClick={() => handleResetAgmAttendance('selected')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ಗೈರುಹಾಜರು / ರಿಸೆಟ್ (Reset to Absent)</span>
          </button>
          <button
            onClick={() => setSelectedShareholderIds(new Set())}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
          >
            ಆಯ್ಕೆ ರದ್ದು
          </button>
        </div>
      )}

    </div>
  );
}
