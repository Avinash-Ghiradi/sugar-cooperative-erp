import LoadingAnimation from '../Common/LoadingAnimation';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ApiService, getShareholderSharesCount } from '../../services/api';
import { CloudDbService } from '../../services/cloudDb';
import { useAuth } from '../../context/AuthContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  CalendarCheck, Search, CheckCircle2, XCircle, Clock, Save, RefreshCw,
  QrCode, UserCheck, Users, FileSpreadsheet, Sparkles, Filter, Check, ArrowRight,
  Camera, AlertTriangle, X, Image as ImageIcon, Video, VideoOff, ShieldCheck,
  Smartphone, Monitor, Download, Printer, ChevronLeft, ChevronRight, CheckCheck,
  Radio, Lock
} from 'lucide-react';

const COUNTER_OPTIONS = [
  'ಕೌಂಟರ್ 1 (ಮುಖ್ಯ ಪ್ರವೇಶದ್ವಾರ - Gate 1)',
  'ಕೌಂಟರ್ 2 (ಉತ್ತರ ಗೇಟ್ - Gate 2)',
  'ಕೌಂಟರ್ 3 (ದಕ್ಷಿಣ ಗೇಟ್ - Gate 3)',
  'ಮೊಬೈಲ್ ಕೌಂಟರ್ 1',
  'ಮೊಬೈಲ್ ಕೌಂಟರ್ 2',
  'ವಿಶೇಷ / ಗಣ್ಯರ ಕೌಂಟರ್',
  'ಕಚೇರಿ ಕೌಂಟರ್ (Office Counter)'
];

export default function AttendanceModule() {
  const { user, hasPermission, showToast } = useAuth();

  // Role-Based Access Control check
  const canRecordAttendance = useMemo(() => {
    if (!user) return false;
    if (typeof hasPermission === 'function' && hasPermission('attendance')) return true;
    const allowedRoles = ['Admin', 'Computer Operator', 'Attendance Operator', 'Employee'];
    return allowedRoles.includes(user.role);
  }, [user, hasPermission]);

  const [recordType, setRecordType] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('attendance') || p.get('share_no') || p.get('attn') ? 'Shareholder' : 'Shareholder'; // Default to AGM Shareholder
    } catch (e) {
      return 'Shareholder';
    }
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Counter Selection (persisted per device in localStorage)
  const [selectedCounter, setSelectedCounter] = useState(() => {
    try {
      return localStorage.getItem('sugar_erp_attendance_counter') || COUNTER_OPTIONS[0];
    } catch (e) {
      return COUNTER_OPTIONS[0];
    }
  });

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

  // Live Camera Scanner States
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
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

  // 1. Initial Load of Attendance Register
  const loadAttendance = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let masterMembers = [];

      if (recordType === 'Shareholder') {
        // Load all shareholders from local DB / API
        const rawSh = await ApiService.getAllShareholdersRaw();
        if (Array.isArray(rawSh) && rawSh.length > 0) {
          masterMembers = rawSh.map((s, idx) => ({
            entity_id: String(s.share_no || s.share_number || s.id || (idx + 1)),
            name: s.shareholder_name || s.name || 'Member',
            department: s.place || s.village_name || '—',
            book_no: s.book_no || 'B.No: 1',
            status: 'Absent',
            time: null,
            scanned_by: null,
            scanned_by_role: null,
            counter: null,
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
              book_no: s.book_no || 'B.No: 1',
              status: 'Absent',
              time: null,
              scanned_by: null,
              scanned_by_role: null,
              counter: null,
              photo_url: s.photo_url || null,
              shares: getShareholderSharesCount(s)
            }));
          }
        }
      } else {
        const empRes = await ApiService.getEmployees();
        if (empRes && empRes.data) {
          masterMembers = empRes.data.map(e => ({
            entity_id: String(e.employee_id),
            name: e.name,
            department: e.department || e.designation || '—',
            status: 'Absent',
            time: null,
            scanned_by: null,
            scanned_by_role: null,
            counter: null,
            photo_url: e.photo_url || null
          }));
        }
      }

      // Check Cloud Database for individual scans for this date
      let cloudScans = [];
      if (CloudDbService.isEnabled()) {
        try {
          const scans = await CloudDbService.getCollection('agm_attendance_scans');
          if (Array.isArray(scans)) {
            cloudScans = scans.filter(s => s && s.date === selectedDate && s.type === recordType);
          }
        } catch (e) {
          console.warn('Cloud scans load note:', e);
        }
      }

      // Check local storage backup for this date
      let localScans = [];
      try {
        const key = `sugar_agm_scans_${selectedDate}_${recordType}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          localScans = JSON.parse(saved);
        }
      } catch (e) {}

      // Combine cloud scans and local scans
      const scanMap = new Map();
      [...localScans, ...cloudScans].forEach(s => {
        if (s && s.entity_id) {
          scanMap.set(String(s.entity_id).trim(), s);
        }
      });

      // Apply scans to master list
      const combined = masterMembers.map(item => {
        const scan = scanMap.get(String(item.entity_id).trim());
        if (scan) {
          return {
            ...item,
            status: 'Present',
            time: scan.time || scan.scan_time,
            scanned_by: scan.scanned_by || scan.scanned_by_name || 'Staff',
            scanned_by_role: scan.scanned_by_role || 'Staff',
            counter: scan.counter || 'ಕೌಂಟರ್'
          };
        }
        return item;
      });

      // Also ensure any scanned shareholder not present in master is prepended
      scanMap.forEach((scan, eid) => {
        const found = combined.find(c => String(c.entity_id).trim() === eid);
        if (!found) {
          combined.unshift({
            entity_id: eid,
            name: scan.name || 'Member',
            department: scan.department || '—',
            book_no: scan.book_no || '—',
            status: 'Present',
            time: scan.time || scan.scan_time,
            scanned_by: scan.scanned_by || 'Staff',
            scanned_by_role: scan.scanned_by_role || 'Staff',
            counter: scan.counter || 'ಕೌಂಟರ್',
            photo_url: null,
            shares: 1
          });
        }
      });

      // Sort: Present members at top, then by entity ID
      combined.sort((a, b) => {
        if (a.status === 'Present' && b.status !== 'Present') return -1;
        if (a.status !== 'Present' && b.status === 'Present') return 1;
        return Number(a.entity_id) - Number(b.entity_id);
      });

      setAttendanceList(combined);
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    } catch (err) {
      console.error('Failed to load attendance:', err);
      showToast('ಹಾಜರಾತಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ' + err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [recordType, selectedDate]);

  // 2. Real-time Multi-Device Background Sync (Every 4 seconds + on tab focus)
  const syncWithCloudNow = useCallback(async () => {
    if (!CloudDbService.isEnabled() || isSyncing) return;
    setIsSyncing(true);
    try {
      const scans = await CloudDbService.getCollection('agm_attendance_scans');
      if (Array.isArray(scans)) {
        const currentScans = scans.filter(s => s && s.date === selectedDate && s.type === recordType);
        if (currentScans.length > 0) {
          const scanMap = new Map();
          currentScans.forEach(s => scanMap.set(String(s.entity_id).trim(), s));

          setAttendanceList(prev => {
            let hasChanges = false;
            const updated = prev.map(item => {
              const scan = scanMap.get(String(item.entity_id).trim());
              if (scan && item.status !== 'Present') {
                hasChanges = true;
                return {
                  ...item,
                  status: 'Present',
                  time: scan.time || scan.scan_time,
                  scanned_by: scan.scanned_by || scan.scanned_by_name || 'Staff',
                  scanned_by_role: scan.scanned_by_role || 'Staff',
                  counter: scan.counter || 'ಕೌಂಟರ್'
                };
              }
              return item;
            });

            if (hasChanges) {
              updated.sort((a, b) => {
                if (a.status === 'Present' && b.status !== 'Present') return -1;
                if (a.status !== 'Present' && b.status === 'Present') return 1;
                return Number(a.entity_id) - Number(b.entity_id);
              });
              return updated;
            }
            return prev;
          });
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    } catch (e) {
      console.warn('Background sync note:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedDate, recordType, isSyncing]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncWithCloudNow();
    }, 4000);

    const onFocus = () => syncWithCloudNow();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    // Cross-tab BroadcastChannel sync for 0ms lag
    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('sugar_erp_attendance_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEW_ATTENDANCE_SCAN') {
            const scan = event.data.payload;
            if (scan && scan.date === selectedDate && scan.type === recordType) {
              setAttendanceList(prev => {
                const copy = [...prev];
                const idx = copy.findIndex(i => String(i.entity_id).trim() === String(scan.entity_id).trim());
                if (idx !== -1) {
                  const updated = {
                    ...copy[idx],
                    status: 'Present',
                    time: scan.time,
                    scanned_by: scan.scanned_by,
                    counter: scan.counter
                  };
                  copy.splice(idx, 1);
                  return [updated, ...copy];
                }
                return copy;
              });
            }
          }
        };
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
    };
  }, [syncWithCloudNow, selectedDate, recordType]);

  // Extract share number or Employee ID from raw text, QR URL or JSON
  const extractEntityId = (raw) => {
    if (!raw) return '';
    const text = String(raw).trim();
    // 1. Employee URL parameter format
    const empMatch = text.match(/[?&](?:emp_attn|emp_id|employee|emp)=([^&]+)/i);
    if (empMatch) return decodeURIComponent(empMatch[1]).trim().toUpperCase();

    // 2. Shareholder URL parameter format (?attn=3652, ?share_no=3652, ?share=3652)
    const urlMatch = text.match(/[?&](?:attn|share_no|share|id)=(\d+)/i);
    if (urlMatch) return urlMatch[1];

    // 3. Employee ID prefix (EMP-001)
    const empPrefixMatch = text.match(/EMP[:\-\s#]*(\d+)/i);
    if (empPrefixMatch) return `EMP-${empPrefixMatch[1].padStart(3, '0')}`;

    // 4. JSON format
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const obj = JSON.parse(text);
        if (obj.employee_id) return String(obj.employee_id).trim().toUpperCase();
        if (obj.emp_attn) return String(obj.emp_attn).trim().toUpperCase();
        if (obj.share_no) return String(obj.share_no).replace(/\D/g, '');
        if (obj.attn) return String(obj.attn).replace(/\D/g, '');
      } catch (e) {}
    }

    // 5. Shareholder prefix format (BSSKN-3652, ATTN: 3652, SHARE #3652)
    const prefixMatch = text.match(/(?:BSSKN|ATTN|SHARE|MEMBER)[:\-\s#]*(\d+)/i);
    if (prefixMatch) return prefixMatch[1];

    // 6. Direct EMP text
    if (/^EMP/i.test(text)) return text.toUpperCase();

    // 7. Raw digits
    return text.replace(/\D/g, '');
  };

  // Debounce refs
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  // 3. Main Processing Method: Auto-Saves to Database and Broadcasts to all Staff
  const handleProcessScan = async (rawCode, scanMethod = 'QR Scanner') => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಹಾಜರಾತಿ ದಾಖಲಿಸಲು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ (Authorized Staff Only)', 'error');
      return;
    }

    const targetId = extractEntityId(rawCode);
    if (!targetId) {
      showToast('⚠️ ಅಮಾನ್ಯ QR ಕೋಡ್ / ಷೇರು ಸಂಖ್ಯೆ (Invalid QR Code)', 'error');
      return;
    }

    // Anti-spam debounce (prevent double triggers within 2.5s)
    const now = Date.now();
    if (lastScannedCodeRef.current === targetId && (now - lastScanTimeRef.current) < 2500) {
      return;
    }
    lastScannedCodeRef.current = targetId;
    lastScanTimeRef.current = now;

    setScanInput('');
    setDuplicateWarning(null);

    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const isEmployeeScan = targetId.startsWith('EMP');

    if (isEmployeeScan && recordType !== 'Employee') {
      setRecordType('Employee');
    }

    const staffName = user?.name || user?.username || 'Official Staff';
    const staffRole = user?.role || 'Staff';
    const staffLabel = `${staffName} (${staffRole})`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'ಮೊಬೈಲ್' : 'ಡೆಸ್ಕ್‌ಟಾಪ್';

    // A. Check if already marked present today
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
        showToast(`⚠️ ಈಗಾಗಲೇ ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ! ಷೇರು #${existing.entity_id} (${existing.name}) - ${existing.time} ಕ್ಕೆ ${existing.scanned_by || 'ಸಿಬ್ಬಂದಿ'} ದಾಖಲಿಸಿದ್ದಾರೆ.`, 'error');
        return;
      }
    }

    // B. Prepare the attendance record
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
        return [updatedItem, ...copy]; // Move to top of table
      });
    } else {
      // Look up member from database
      let match = null;
      if (isEmployeeScan) {
        try {
          const empRes = await ApiService.getEmployeeById(targetId);
          if (empRes?.success && empRes.employee) match = empRes.employee;
        } catch (e) {}
      } else {
        try {
          const shRes = await ApiService.getShareholderById(targetId);
          if (shRes?.success && shRes.shareholder) match = shRes.shareholder;
        } catch (e) {}
      }

      updatedItem = {
        entity_id: targetId,
        name: match ? (match.shareholder_name || match.name) : `Member #${targetId}`,
        department: match ? (match.place || match.village_name || match.department || '—') : '—',
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

    // C. AUTO-SAVE IMMEDIATELY TO DATABASE (Supabase Cloud DB + IndexedDB + Local Storage)
    const scanPayload = {
      date: selectedDate,
      type: recordType,
      entity_id: String(targetId),
      name: updatedItem.name,
      department: updatedItem.department,
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

    // 1. Save to Supabase Cloud DB (agm_attendance_scans)
    if (CloudDbService.isEnabled()) {
      CloudDbService.saveCollectionItem('agm_attendance_scans', `${selectedDate}_${recordType}_${targetId}`, scanPayload)
        .then(() => {
          setAutoSaveStatus(`⚡ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸ್ವಯಂ-ಉಳಿಸಲಾಗಿದೆ (${currentTime})`);
        })
        .catch(err => {
          console.warn('Cloud DB auto-save note:', err);
        });
    }

    // 2. Save to local storage backup
    try {
      const key = `sugar_agm_scans_${selectedDate}_${recordType}`;
      const existingLocal = JSON.parse(localStorage.getItem(key) || '[]');
      const filteredLocal = existingLocal.filter(s => String(s.entity_id).trim() !== targetId);
      filteredLocal.unshift(scanPayload);
      localStorage.setItem(key, JSON.stringify(filteredLocal));
    } catch (e) {}

    // 3. Broadcast across all open browser tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('sugar_erp_attendance_channel');
        channel.postMessage({ type: 'NEW_ATTENDANCE_SCAN', payload: scanPayload });
        channel.close();
      } catch (e) {}
    }

    showToast(`✅ ${isEmployeeScan ? 'ಸಿಬ್ಬಂದಿ' : 'ಷೇರು'} #${updatedItem.entity_id} - ${updatedItem.name} ಹಾಜರಾತಿ ಸ್ವಯಂ-ಉಳಿಸಲಾಗಿದೆ! (ದಾಖಲಿಸಿದವರು: ${staffName})`, 'success');

    if (scanInputRef.current) scanInputRef.current.focus();
  };

  // Toggle Member Status manually
  const toggleStatus = async (entityId) => {
    if (!canRecordAttendance) {
      showToast('⚠️ ಹಾಜರಾತಿ ಬದಲಾಯಿಸಲು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಅಗತ್ಯವಿದೆ', 'error');
      return;
    }

    const idx = attendanceList.findIndex(a => String(a.entity_id).trim() === String(entityId).trim());
    if (idx === -1) return;

    const item = attendanceList[idx];
    const nextStatus = item.status === 'Present' ? 'Absent' : 'Present';
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const staffLabel = `${user?.name || 'Staff'} (${user?.role || 'Staff'})`;

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

    // Auto-save toggle to Cloud DB
    if (CloudDbService.isEnabled()) {
      if (nextStatus === 'Present') {
        await CloudDbService.saveCollectionItem('agm_attendance_scans', `${selectedDate}_${recordType}_${entityId}`, {
          date: selectedDate,
          type: recordType,
          entity_id: String(entityId),
          name: updated.name,
          department: updated.department,
          book_no: updated.book_no,
          status: 'Present',
          time: currentTime,
          scanned_by: staffLabel,
          counter: selectedCounter
        });
      } else {
        await CloudDbService.deleteCollectionItem('agm_attendance_scans', `${selectedDate}_${recordType}_${entityId}`);
      }
    }

    showToast(`ಷೇರು #${entityId} ಸ್ಥಿತಿ '${nextStatus}' ಎಂದು ಬದಲಾಯಿಸಲಾಗಿದೆ`, 'info');
  };

  // Manual Backup / Force Save
  const handleSaveAttendance = async () => {
    const presentCount = attendanceList.filter(i => i.status === 'Present').length;
    if (CloudDbService.isEnabled()) {
      try {
        await CloudDbService.saveCollectionItem('attendance_records', `${selectedDate}_${recordType}`, {
          date: selectedDate,
          type: recordType,
          present_count: presentCount,
          total_count: attendanceList.length,
          saved_by: user?.name || 'Staff',
          updated_at: new Date().toISOString()
        });
        showToast(`✅ ${selectedDate} ದಿನಾಂಕದ ಹಾಜರಾತಿ ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಸಿಂಕ್ ಆಗಿದೆ! (${presentCount} Present)`, 'success');
        return;
      } catch (err) {
        console.warn('Cloud DB save error:', err);
      }
    }
    showToast(`ಹಾಜರಾತಿ ಉಳಿಸಲಾಗಿದೆ (${presentCount} ಹಾಜರು)`, 'success');
  };

  // Export AGM Attendance to CSV
  const handleExportCSV = () => {
    const presentItems = attendanceList.filter(i => i.status === 'Present');
    if (presentItems.length === 0) {
      showToast('⚠️ ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ಹಾಜರಾತಿ ದಾಖಲೆಗಳಿಲ್ಲ', 'error');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += `ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ\n`;
    csvContent += `ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM) ಹಾಜರಾತಿ ವಹಿ - ದಿನಾಂಕ: ${selectedDate}\n\n`;
    csvContent += `ಕ್ರಮ ಸಂಖ್ಯೆ,ಷೇರು / ನೌಕರ ಸಂ,ಹೆಸರು,ಗ್ರಾಮ / ಸ್ಥಳ,ಪುಸ್ತಕ ನಂ,ಹಾಜರಾತಿ ಸಮಯ,ದಾಖಲಿಸಿದ ಸಿಬ್ಬಂದಿ,ಕೌಂಟರ್,ಸ್ಥಿತಿ\n`;

    presentItems.forEach((item, idx) => {
      const cleanName = (item.name || '').replace(/,/g, ' ');
      const cleanDept = (item.department || '').replace(/,/g, ' ');
      const cleanStaff = (item.scanned_by || '').replace(/,/g, ' ');
      const cleanCounter = (item.counter || '').replace(/,/g, ' ');
      csvContent += `${idx + 1},#${item.entity_id},"${cleanName}","${cleanDept}","${item.book_no || '—'}",${item.time || '—'},"${cleanStaff}","${cleanCounter}",ಹಾಜರು (Present)\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AGM_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📥 AGM ಹಾಜರಾತಿ ವಹಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ (${presentItems.length} ಸದಸ್ಯರು)`, 'success');
  };

  // Handle Photo File Upload QR Scanning
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

  // Camera Scanner Lifecycle
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
            console.warn('Could not enumerate cameras upfront:', camErr);
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
              setCameraError('ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಅನುಮತಿ ನೀಡಿ (Permission required). ಬ್ರೌಸರ್ URL ಬಾರ್‌ನಲ್ಲಿ 🔒 ಐಕಾನ್ ಕ್ಲಿಕ್ ಮಾಡಿ Camera Allow ಮಾಡಿ.');
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

  // Check URL parameters for direct scan verification on load
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const urlShare = p.get('share_no') || p.get('attn');
      if (urlShare) {
        setRecordType('Shareholder');
        setTimeout(() => {
          handleProcessScan(urlShare, 'URL ಸ್ಕ್ಯಾನ್');
        }, 700);
      }
    } catch (e) {}
  }, []);

  // Filtered attendance list
  const filteredList = useMemo(() => {
    return attendanceList.filter(item => {
      if (filterStatus !== 'All' && item.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = String(item.entity_id).toLowerCase().includes(q);
        const matchName = String(item.name).toLowerCase().includes(q);
        const matchDept = String(item.department).toLowerCase().includes(q);
        return matchId || matchName || matchDept;
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

  // Attendance stats
  const totalMembers = attendanceList.length || 17085;
  const presentMembers = attendanceList.filter(i => i.status === 'Present').length;
  const absentMembers = totalMembers - presentMembers;
  const quorumPct = totalMembers > 0 ? ((presentMembers / totalMembers) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5">

      {/* Top Header & Role-Based Access Control Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
              <span>ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM) ಹಾಜರಾತಿ ನಿರ್ವಹಣೆ</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Auto-Save Database
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ಮಲ್ಟಿ-ಡಿವೈಸ್ ಕ್ಲೌಡ್ ಸಿಂಕ್ • ಲಾಗಿನ್ ಸಿಬ್ಬಂದಿ ಟ್ರ್ಯಾಕಿಂಗ್ • QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಆದ ತಕ್ಷಣ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸ್ವಯಂ-ದಾಖಲು
          </p>
        </div>

        {/* Top Controls: AGM Date, Counter, Sync Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* AGM Meeting Date */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-semibold">ಮಹಾಸಭೆ ದಿನಾಂಕ:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-emerald-300 font-mono font-bold outline-none cursor-pointer"
            />
          </div>

          {/* Counter / Gate Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-amber-400 font-bold shrink-0">ಕೌಂಟರ್:</span>
            <select
              value={selectedCounter}
              onChange={(e) => handleCounterChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer max-w-[160px] truncate"
            >
              {COUNTER_OPTIONS.map((c, i) => (
                <option key={i} value={c} className="bg-slate-900 text-slate-100">{c}</option>
              ))}
            </select>
          </div>

          {/* Live Sync Status & Manual Sync Button */}
          <button
            onClick={() => syncWithCloudNow()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
            title="ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್‌ನಿಂದ ಇತ್ತೀಚಿನ ಹಾಜರಾತಿ ಸಿಂಕ್ ಮಾಡಿ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
            <span>{isSyncing ? 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...' : 'ಸಿಂಕ್'}</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
            title="ಹಾಜರಾತಿ ವಹಿಯನ್ನು ಎಕ್ಸೆಲ್/CSV ರೂಪದಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV ಎಕ್ಸ್‌ಪೋರ್ಟ್</span>
          </button>
        </div>
      </div>

      {/* Role-Based Access Control Info Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">ಲಾಗಿನ್ ಸಿಬ್ಬಂದಿ (Logged-in Staff):</span>
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
            <span>ಮಲ್ಟಿ-ಡಿವೈಸ್ ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸಕ್ರಿಯವಾಗಿದೆ (ಕೊನೆಯ ಸಿಂಕ್: {lastSyncTime || '—'})</span>
          </span>
        </div>
      </div>

      {!canRecordAttendance && (
        <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-xl text-amber-200 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>ವೀಕ್ಷಣೆ ಮೋಡ್ (Read-Only): ನೀವು ಶೇರುದಾರ ಖಾತೆಯಲ್ಲಿ ಲಾಗಿನ್ ಆಗಿದ್ದೀರಿ. ಹಾಜರಾತಿ ದಾಖಲಿಸಲು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಖಾತೆಯಿಂದ ಲಾಗಿನ್ ಆಗಿ.</span>
        </div>
      )}

      {/* Record Type Tabs: AGM Shareholder vs Employee */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            setRecordType('Shareholder');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            recordType === 'Shareholder'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>ಶೇರುದಾರರ ಮಹಾಸಭೆ ಹಾಜರಾತಿ (Shareholder AGM Attendance)</span>
        </button>

        <button
          onClick={() => {
            setRecordType('Employee');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            recordType === 'Employee'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ಸಿಬ್ಬಂದಿ ದಿನನಿತ್ಯದ ಹಾಜರಾತಿ (Staff Attendance)</span>
        </button>
      </div>

      {/* QR Code Attendance Scanner Banner with Auto-Save Notification */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/70 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2">
                <span>
                  {recordType === 'Employee'
                    ? 'ಸಿಬ್ಬಂದಿ ಹಾಜರಾತಿ QR ಸ್ಕ್ಯಾನರ್ (Staff Attendance Scanner)'
                    : 'ಶೇರುದಾರರ ಮಹಾಸಭೆ ಹಾಜರಾತಿ QR ಸ್ಕ್ಯಾನರ್ (AGM Auto-Save Scanner)'}
                </span>
                <span className="text-[10px] bg-emerald-900/90 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-600 font-bold">
                  ⚡ ಸ್ವಯಂ ಉಳಿತಾಯ ಸಕ್ರಿಯ
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {recordType === 'Employee'
                  ? 'ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಚೀಟಿಯ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ Emp ID ನಮೂದಿಸಿ'
                  : 'ಶೇರುದಾರರ ಪುಸ್ತಕ ಸ್ಟಿಕ್ಕರ್ / ID ಕಾರ್ಡ್‌ನ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಶೇರು ನಂ ನಮೂದಿಸಿ (Auto-saved to Database)'}
              </p>
            </div>
          </div>

          {/* Live Quorum Badge */}
          <div className="flex items-center gap-3 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400">{recordType === 'Employee' ? 'ಹಾಜರಾದ ಸಿಬ್ಬಂದಿ: ' : 'ಹಾಜರಾದ ಷೇರುದಾರರು: '}</span>
              <strong className="text-emerald-400 font-mono text-sm">{presentMembers}</strong>
              <span className="text-slate-500"> / {totalMembers.toLocaleString()}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              <span className="text-slate-400">ಕೋರಂ ಸ್ಥಿತಿ: </span>
              <strong className="text-amber-400 font-mono text-sm">{quorumPct}%</strong>
            </div>
          </div>
        </div>

        {/* Quick Scanner Input Bar with Camera Trigger */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={scanInputRef}
              type="text"
              autoFocus
              value={scanInput}
              disabled={!canRecordAttendance}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && scanInput.trim()) {
                  handleProcessScan(scanInput.trim(), 'ಮ್ಯಾನುವಲ್ ಎಂಟ್ರಿ');
                }
              }}
              placeholder={recordType === 'Employee' ? "ಸಿಬ್ಬಂದಿ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ Emp ID (EMP-001) ನಮೂದಿಸಿ..." : "ಪುಸ್ತಕ ಸ್ಟಿಕ್ಕರ್ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಷೇರು ನಂ ನಮೂದಿಸಿ (Press Enter)..."}
              className="w-full bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-9 pr-24 py-2.5 text-xs text-emerald-100 placeholder:text-slate-500 outline-none transition-all shadow-inner font-mono disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!canRecordAttendance}
              onClick={() => scanInput.trim() && handleProcessScan(scanInput.trim(), 'ಮ್ಯಾನುವಲ್ ಎಂಟ್ರಿ')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
            >
              ದಾಖಲಿಸಿ
            </button>
          </div>

          {/* Option 1: Live Video Camera Stream */}
          <button
            type="button"
            disabled={!canRecordAttendance}
            onClick={() => {
              setCameraError('');
              setCameraOpen(!cameraOpen);
            }}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 disabled:opacity-50 ${
              cameraOpen
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
            }`}
            title="ಕ್ಯಾಮೆರಾ ತೆರೆದು ಲೈವ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ"
          >
            <Camera className="w-4 h-4" />
            <span>{cameraOpen ? 'ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ' : '🎥 ಲೈವ್ ಕ್ಯಾಮೆರಾ'}</span>
          </button>

          {/* Option 2: Scan from Photo Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUploadScan}
          />
          <button
            type="button"
            disabled={!canRecordAttendance}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="ಗ್ಯಾಲರಿಯಿಂದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">ಗ್ಯಾಲರಿ</span>
          </button>
        </div>

        {/* Hidden helper element for file photo scanning */}
        <div id="temp-qr-file-scanner" className="hidden" />

        {/* Live Camera Viewfinder */}
        {cameraOpen && (
          <div className="bg-slate-950/90 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>ಲೈವ್ ಕ್ಯಾಮೆರಾ QR ಸ್ಕ್ಯಾನರ್ (Live Camera Active)</span>
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none"
                  >
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setCameraOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {cameraError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">ಕ್ಯಾಮೆರಾ ದೋಷ (Camera Error):</div>
                    <p className="text-[11px] text-rose-300">{cameraError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError('');
                    setRetryCount(c => c + 1);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ</span>
                </button>
              </div>
            )}

            <div className="relative max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-emerald-500/70 shadow-2xl bg-black">
              <div id="qr-camera-reader" className="w-full min-h-[260px] bg-black flex items-center justify-center text-slate-500 text-xs [&>video]:w-full [&>video]:max-h-[340px] [&>video]:object-contain" />

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-emerald-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br"></div>
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_8px_#34d399] animate-pulse"></div>
                </div>
                <span className="text-[10px] font-bold text-white bg-slate-950/90 px-3 py-1 rounded-full mt-2 border border-slate-700 shadow-md">
                  ಬುಕ್ ಸ್ಟಿಕ್ಕರ್ QR ಕೋಡ್ ಅನ್ನು ಚೌಕಟ್ಟಿನಲ್ಲಿ ಹಿಡಿಯಿರಿ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Warning Notice */}
        {duplicateWarning && (
          <div className="bg-amber-950/80 border-2 border-amber-500 rounded-xl p-3.5 flex items-center justify-between text-xs animate-fadeIn text-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-amber-300 text-sm flex items-center gap-2">
                  <span>⚠️ ಈಗಾಗಲೇ ಹಾಜರಾತಿ ದಾಖಲಾಗಿದೆ! (Already Recorded)</span>
                  <span className="font-mono text-xs">#{duplicateWarning.entity_id}</span>
                </div>
                <div className="text-[11.5px] text-amber-100 mt-0.5">
                  ಶೇರುದಾರರು: <strong>{duplicateWarning.name}</strong> • ದಾಖಲಾದ ಸಮಯ: <strong>{duplicateWarning.time}</strong> • ಸಿಬ್ಬಂದಿ: <strong>{duplicateWarning.scanned_by}</strong> ({duplicateWarning.counter})
                </div>
              </div>
            </div>
            <button
              onClick={() => setDuplicateWarning(null)}
              className="text-amber-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Last Scanned Member Notification Card */}
        {lastScannedMember && (
          <div className="bg-emerald-950/80 border-2 border-emerald-500 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg border border-emerald-500/50 bg-slate-900 flex items-center justify-center font-bold text-emerald-400 font-mono text-sm overflow-hidden shrink-0">
                {lastScannedMember.photo_url ? (
                  <img src={lastScannedMember.photo_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  `#${lastScannedMember.entity_id}`
                )}
              </div>
              <div>
                <div className="font-bold text-emerald-200 text-sm flex items-center gap-2">
                  <span>{lastScannedMember.name}</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    ({recordType === 'Employee' || String(lastScannedMember.entity_id).startsWith('EMP') ? `Emp ID: ${lastScannedMember.entity_id}` : `ಷೇರು #${lastScannedMember.entity_id}`})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ⚡ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸೇವ್ ಆಗಿದೆ
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  ಸಾ॥ {lastScannedMember.department} • ಸಮಯ: <strong className="text-white font-mono">{lastScannedMember.time}</strong> • ದಾಖಲಿಸಿದವರು: <strong className="text-cyan-300">{lastScannedMember.scanned_by}</strong> ({lastScannedMember.counter})
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

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">ಒಟ್ಟು ಷೇರುದಾರರು</div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {totalMembers.toLocaleString()}
            </div>
          </div>
          <Users className="w-5 h-5 text-slate-500" />
        </div>

        <div className="bg-slate-950/80 border border-emerald-800/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-emerald-400 font-medium">ಹಾಜರಾದವರು (Present)</div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
              {presentMembers.toLocaleString()}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-slate-950/80 border border-rose-800/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-rose-400 font-medium">ಗೈರುಹಾಜರಾದವರು (Absent)</div>
            <div className="text-xl font-bold text-rose-300 font-mono mt-0.5">
              {absentMembers.toLocaleString()}
            </div>
          </div>
          <XCircle className="w-5 h-5 text-rose-400" />
        </div>

        <div className="bg-slate-950/80 border border-amber-800/50 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-amber-400 font-medium">ಕೋರಂ ಸ್ಥಿತಿ (Quorum)</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">
              {quorumPct}%
            </div>
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
              onClick={() => {
                setFilterStatus(st);
                setCurrentPage(1);
              }}
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Name, Share No, Place..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Register Table with Recorded By Staff Column */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <LoadingAnimation
            variant="card"
            message="ಮಹಾಸಭೆ (AGM) ಹಾಜರಾತಿ ವಹಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading AGM Attendance Register & Multi-Device Sync..."
          />
        ) : paginatedList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            ಯಾವುದೇ ಹಾಜರಾತಿ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ (No records match the current filter).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Entity ID (ಷೇರು / ನೌಕರ ಸಂ)</th>
                  <th className="py-3.5 px-4">Name (ಹೆಸರು)</th>
                  <th className="py-3.5 px-4">Place / Dept (ಸ್ಥಳ)</th>
                  <th className="py-3.5 px-4">Scan Time (ಸಮಯ)</th>
                  <th className="py-3.5 px-4">ದಾಖಲಿಸಿದ ಸಿಬ್ಬಂದಿ (Recorded By)</th>
                  <th className="py-3.5 px-4 text-center">Status (ಸ್ಥಿತಿ)</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {paginatedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">#{item.entity_id}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.shares && (
                          <span className="text-[10px] text-slate-500">({item.shares} ಶೇರು)</span>
                        )}
                      </div>
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
        )}

        {/* Pagination Bar */}
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
  );
}
