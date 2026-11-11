import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BookOpen, FileSpreadsheet, Save, Download, Printer, Search,
  CheckCircle2, XCircle, RotateCcw, Plus, X, Filter, ChevronLeft,
  ChevronRight, ArrowRight, Layers, Sparkles, Check, Upload, Award,
  Camera, CheckCheck
} from 'lucide-react';

const STORAGE_KEY = 'sugar_erp_manual_book_attendance';

// Default Year Ranges (Active default is 2023-24 to 2027-28 - All 5 AGMs)
const YEAR_PRESETS = {
  CURRENT_2023_2028: {
    id: 'CURRENT_2023_2028',
    name: '2023-24 ರಿಂದ 2027-28 (ಮಹಾಸಭೆ 6 ರಿಂದ 10 - ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳು)',
    shortName: '2023-24 to 2027-28 (AGM 6-10)',
    years: ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28'],
    yearAgmMap: {
      '2023-24': 'AGM 6',
      '2024-25': 'AGM 7',
      '2025-26': 'AGM 8',
      '2026-27': 'AGM 9',
      '2027-28': 'AGM 10'
    }
  },
  CURRENT_2023_2027: {
    id: 'CURRENT_2023_2027',
    name: '2023-24 ರಿಂದ 2026-27 (ಮಹಾಸಭೆ 6 ರಿಂದ 9 - 4 ವರ್ಷಗಳು)',
    shortName: '2023-24 to 2026-27 (AGM 6-9)',
    years: ['2023-24', '2024-25', '2025-26', '2026-27'],
    yearAgmMap: {
      '2023-24': 'AGM 6',
      '2024-25': 'AGM 7',
      '2025-26': 'AGM 8',
      '2026-27': 'AGM 9'
    }
  },
  HISTORIC_2018_2023: {
    id: 'HISTORIC_2018_2023',
    name: '2018-19 ರಿಂದ 2022-23 (ಕೈಪಿಡಿ ಪುಸ್ತಕ ದಾಖಲೆಗಳು - ಹಿಂದಿನ 5 ವರ್ಷಗಳು)',
    shortName: '2018-19 to 2022-23',
    years: ['2018-19', '2019-20', '2020-21', '2021-22', '2022-23'],
    yearAgmMap: {
      '2018-19': '2018-19',
      '2019-20': '2019-20',
      '2020-21': '2020-21',
      '2021-22': '2021-22',
      '2022-23': '2022-23'
    }
  }
};

const AGM_KEY_BY_YEAR = {
  '2023-24': 'AGM-6',
  '2024-25': 'AGM-7',
  '2025-26': 'AGM-8',
  '2026-27': 'AGM-9',
  '2027-28': 'AGM-10'
};

// Color styles exactly matching the statutory ledger image
const YEAR_THEMES = [
  {
    // Year 1 (2023-24 / 2018-19) - Lilac/Purple
    headerBg: '#D8B4E2',
    headerText: '#2e1065',
    subHeaderBg: '#E9D5FF',
    subHeaderText: '#3b0764',
    borderCol: 'border-purple-300 dark:border-purple-800',
    cellBg: 'bg-purple-50/40 dark:bg-purple-950/20',
    focusRing: 'focus:ring-purple-500 focus:border-purple-500',
    badge: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200'
  },
  {
    // Year 2 (2024-25 / 2019-20) - Soft Cyan/Sky
    headerBg: '#CFFAFE',
    headerText: '#164e63',
    subHeaderBg: '#E0F2FE',
    subHeaderText: '#0369a1',
    borderCol: 'border-cyan-300 dark:border-cyan-800',
    cellBg: 'bg-cyan-50/40 dark:bg-cyan-950/20',
    focusRing: 'focus:ring-cyan-500 focus:border-cyan-500',
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-900/60 dark:text-cyan-200'
  },
  {
    // Year 3 (2025-26 / 2020-21) - Peach/Apricot
    headerBg: '#FFEDD5',
    headerText: '#7c2d12',
    subHeaderBg: '#FEF3C7',
    subHeaderText: '#92400e',
    borderCol: 'border-amber-300 dark:border-amber-800',
    cellBg: 'bg-amber-50/40 dark:bg-amber-950/20',
    focusRing: 'focus:ring-amber-500 focus:border-amber-500',
    badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200'
  },
  {
    // Year 4 (2026-27 / 2021-22) - Soft Pink/Rose
    headerBg: '#FCE7F3',
    headerText: '#831843',
    subHeaderBg: '#FFE4E6',
    subHeaderText: '#9f1239',
    borderCol: 'border-pink-300 dark:border-pink-800',
    cellBg: 'bg-pink-50/40 dark:bg-pink-950/20',
    focusRing: 'focus:ring-pink-500 focus:border-pink-500',
    badge: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-900/60 dark:text-pink-200'
  },
  {
    // Year 5 (2027-28 / 2022-23) - Light Slate/Grey
    headerBg: '#E2E8F0',
    headerText: '#1e293b',
    subHeaderBg: '#F1F5F9',
    subHeaderText: '#334155',
    borderCol: 'border-slate-300 dark:border-slate-700',
    cellBg: 'bg-slate-50/50 dark:bg-slate-900/30',
    focusRing: 'focus:ring-slate-500 focus:border-slate-500',
    badge: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
  }
];

const GRAND_TOTAL_THEME = {
  headerBg: '#FED7AA',
  headerText: '#7c2d12',
  borderCol: 'border-orange-400 dark:border-orange-800',
  cellBg: 'bg-amber-50/80 dark:bg-amber-950/30',
  badge: 'bg-amber-500 text-slate-950 font-black'
};

export default function ManualAttendanceModal({
  isOpen = true,
  onClose = () => {},
  masterShareholders = [],
  allAgmScansMap = new Map(),
  onManualAttendanceUpdate = () => {},
  isModal = true,
  showToast = () => {},
  user = null
}) {
  // Preset selector - Default is 2023-24 to 2027-28 (AGM 6 to AGM 10 - All 5 AGMs)
  const [selectedPresetKey, setSelectedPresetKey] = useState('CURRENT_2023_2028');
  const currentPreset = YEAR_PRESETS[selectedPresetKey] || YEAR_PRESETS.CURRENT_2023_2028;
  const activeYears = currentPreset.years;

  // Stored Manual Records Map: { [shareNo]: { [year]: { status: 'P'|'0', bookNo: '13', slNo: '36' } } }
  const [manualRecords, setManualRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {};
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ELIGIBLE' | 'ABSENT'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Quick Single-Entry Form State
  const [quickShareNo, setQuickShareNo] = useState('');
  const [quickYear, setQuickYear] = useState(activeYears[0]);
  const [quickStatus, setQuickStatus] = useState('P');
  const [quickBookNo, setQuickBookNo] = useState('');
  const [quickSlNo, setQuickSlNo] = useState('');
  const [autoIncrementSlNo, setAutoIncrementSlNo] = useState(true);

  // Batch Book Entry Drawer / Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchYear, setBatchYear] = useState(activeYears[0]);
  const [batchBookNo, setBatchBookNo] = useState('');
  const [batchStartSlNo, setBatchStartSlNo] = useState('1');
  const [batchShareNosInput, setBatchShareNosInput] = useState('');

  // Audio Beep
  const playBeep = (freq = 880, duration = 0.08) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Sync year selection when preset changes
  useEffect(() => {
    setQuickYear(activeYears[0]);
    setBatchYear(activeYears[0]);
  }, [selectedPresetKey]);

  // Persist records to localStorage on change
  const saveRecords = (updater) => {
    setManualRecords(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save manual attendance to localStorage', e);
      }
      return next;
    });
  };

  // Map of master shareholders for instant O(1) lookups (Exact share number matching: '1' vs '#1')
  const masterShareholdersMap = useMemo(() => {
    const map = new Map();
    masterShareholders.forEach(m => {
      const rawId = String(m.entity_id || '').trim();
      if (!rawId) return;
      // Map exact share number (e.g. '1' -> Beerappa, '#1' -> Dashavanta)
      map.set(rawId, m);
      map.set(rawId.toUpperCase(), m);
    });
    return map;
  }, [masterShareholders]);

  // Resolve single shareholder details for quick form (Exact match)
  const matchedMember = useMemo(() => {
    const q = quickShareNo.trim();
    if (!q) return null;
    return masterShareholdersMap.get(q) || masterShareholdersMap.get(q.toUpperCase()) || null;
  }, [quickShareNo, masterShareholdersMap]);

  // Update specific cell (status, bookNo, or slNo)
  const handleCellChange = (shareNo, year, field, value) => {
    const sId = String(shareNo).trim();
    let updatedStatus = '0';
    let updatedBookNo = '0';
    let updatedSlNo = '0';

    saveRecords(prev => {
      const memberRec = { ...(prev[sId] || {}) };
      const currYearData = { ...(memberRec[year] || { status: '0', bookNo: '0', slNo: '0' }) };

      if (field === 'status') {
        currYearData.status = value;
      } else if (field === 'bookNo') {
        currYearData.bookNo = value;
        // If user enters a book number, automatically mark Present 'P'
        if (value && String(value).trim() !== '0') {
          currYearData.status = 'P';
        }
      } else if (field === 'slNo') {
        currYearData.slNo = value;
        if (value && String(value).trim() !== '0') {
          currYearData.status = 'P';
        }
      }

      updatedStatus = currYearData.status;
      updatedBookNo = currYearData.bookNo;
      updatedSlNo = currYearData.slNo;

      memberRec[year] = currYearData;
      return {
        ...prev,
        [sId]: memberRec
      };
    });

    // Notify parent for bidirectional sync with scanned AGMs
    if (typeof onManualAttendanceUpdate === 'function') {
      onManualAttendanceUpdate(sId, year, updatedStatus, updatedBookNo, updatedSlNo);
    }
  };

  // Toggle status button 'P' <-> '0'
  const handleToggleStatus = (shareNo, year) => {
    const sId = String(shareNo).trim();
    const currItem = processedShareholders.find(s => s.entity_id === sId);
    const currStatus = currItem?.yearData[year]?.status || '0';
    const nextStatus = currStatus === 'P' ? '0' : 'P';

    handleCellChange(sId, year, 'status', nextStatus);
    playBeep(nextStatus === 'P' ? 880 : 440, 0.05);
  };

  // Save from Quick Form
  const handleQuickFormSubmit = (e) => {
    if (e) e.preventDefault();
    const sId = quickShareNo.trim();
    if (!sId) {
      if (typeof showToast === 'function') showToast('⚠️ ದಯವಿಟ್ಟು ಶೇರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ', 'warning');
      return;
    }

    const bNo = quickBookNo.trim() || '0';
    const sNo = quickSlNo.trim() || '0';
    const st = quickStatus;

    handleCellChange(sId, quickYear, 'status', st);
    handleCellChange(sId, quickYear, 'bookNo', bNo);
    handleCellChange(sId, quickYear, 'slNo', sNo);

    playBeep(980, 0.08);
    if (typeof showToast === 'function') {
      showToast(`✅ ಷೇರು ${sId.startsWith('#') ? sId : `#${sId}`}: ${quickYear} ಪುಸ್ತಕ ನಂ: ${bNo}, ಕ್ರಮ ನಂ: ${sNo} ದಾಖಲಾಗಿದೆ!`, 'success');
    }

    // Auto-advance Sl No and clear share no for next quick entry
    if (autoIncrementSlNo && sNo !== '0' && !isNaN(Number(sNo))) {
      setQuickSlNo(String(Number(sNo) + 1));
    }
    setQuickShareNo('');
    const inputEl = document.getElementById('quick-share-no-input');
    if (inputEl) inputEl.focus();
  };

  // Parsed list of share IDs from batch input (preserves exact token: '1' vs '#1', supports ranges e.g. 10-15)
  const batchParsedIds = useMemo(() => {
    const rawTokens = batchShareNosInput
      .split(/[\s,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const ids = [];
    rawTokens.forEach(token => {
      const isHash = token.startsWith('#');
      const cleanNum = token.replace(/^#+/, '');
      const rangeMatch = cleanNum.match(/^(\d+)\s*[-–]\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (start <= end && end - start <= 500) {
          for (let i = start; i <= end; i++) {
            ids.push(isHash ? `#${i}` : String(i));
          }
          return;
        }
      }
      if (token) {
        ids.push(token);
      }
    });

    return ids;
  }, [batchShareNosInput]);

  // Resolved shareholders list for the batch modal preview & print (Exact match: '1' -> Regular, '#1' -> SC)
  const batchResolvedList = useMemo(() => {
    const startSl = Number(batchStartSlNo) || 1;
    return batchParsedIds.map((id, index) => {
      const member = masterShareholdersMap.get(id) || masterShareholdersMap.get(id.toUpperCase());
      return {
        bookSlNo: startSl + index,
        entity_id: id,
        name: member?.name || (member ? `ಶೇರುದಾರ #${id}` : `⚠️ ಶೇರು #${id} ಕಂಡುಬಂದಿಲ್ಲ`),
        department: member?.department || member?.village || '—',
        category: member?.category || 'ಅ - ವರ್ಗ',
        shares: member?.shares || '1',
        isFound: Boolean(member)
      };
    });
  }, [batchParsedIds, batchStartSlNo, masterShareholdersMap]);

  // Remove a single shareholder from batch input (by index)
  const handleRemoveBatchId = (indexToRemove) => {
    const updated = batchParsedIds.filter((_, idx) => idx !== indexToRemove);
    setBatchShareNosInput(updated.join(', '));
  };

  // Print official Attendance Register for this specific Book batch
  const handlePrintBatchList = () => {
    if (batchResolvedList.length === 0) {
      if (typeof showToast === 'function') showToast('⚠️ ಮುದ್ರಿಸಲು ಯಾವುದೇ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ', 'warning');
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const bNo = batchBookNo.trim() || '1';
    const totalCount = batchResolvedList.length;
    const startSl = Number(batchStartSlNo) || 1;
    const endSl = startSl + totalCount - 1;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ಪುಸ್ತಕ #${bNo} ಹಾಜರಾತಿ ವಹಿ - ${batchYear}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 8mm; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 6px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 16px; font-weight: bold; color: #047857; }
          .header p { margin: 2px 0 0; font-size: 9.5px; color: #555; }
          .header h2 { margin: 2px 0 0; font-size: 12px; font-weight: bold; color: #1e293b; }
          .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; font-size: 11px; }
          .meta-item { display: flex; gap: 4px; }
          .meta-label { color: #64748b; font-weight: 600; }
          .meta-value { color: #0f172a; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th, td { border: 1px solid #475569; padding: 5px 6px; font-size: 10.5px; }
          th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .sig-cell { width: 130px; height: 26px; }
          .remark-cell { width: 70px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10.5px; font-weight: bold; padding: 0 10px; }
          .footer-item { text-align: center; min-width: 120px; border-top: 1px solid #94a3b8; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204</h1>
          <p>ತಾ|| ಅಫಜಲಪುರ, ಜಿ|| ಕಲಬುರಗಿ (ಕರ್ನಾಟಕ)</p>
          <h2>ವಾರ್ಷಿಕ ಮಹಾಸಭೆ ಕೈಪಿಡಿ ಪುಸ್ತಕ ಹಾಜರಾತಿ ವಹಿ (AGM Book Attendance Register)</h2>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">ಮಹಾಸಭೆಯ ವರ್ಷ:</span> <span class="meta-value">${batchYear}</span></div>
          <div class="meta-item"><span class="meta-label">ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No):</span> <span class="meta-value">ಪುಸ್ತಕ #${bNo}</span></div>
          <div class="meta-item"><span class="meta-label">ಕ್ರಮ ಸಂಖ್ಯೆ ವ್ಯಾಪ್ತಿ:</span> <span class="meta-value">${startSl} ರಿಂದ ${endSl}</span></div>
          <div class="meta-item"><span class="meta-label">ಒಟ್ಟು ಶೇರುದಾರರು:</span> <span class="meta-value">${totalCount}</span></div>
          <div class="meta-item"><span class="meta-label">ದಿನಾಂಕ:</span> <span class="meta-value">${new Date().toLocaleDateString('kn-IN')}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 38px;">ಪುಸ್ತಕ<br/>ಕ್ರ.ಸಂ</th>
              <th style="width: 60px;">ಷೇರು ನಂ</th>
              <th class="text-left">ಶೇರುದಾರರ ಹೆಸರು</th>
              <th class="text-left" style="width: 110px;">ಸ್ಥಳ / ಗ್ರಾಮ</th>
              <th style="width: 65px;">ವರ್ಗ</th>
              <th style="width: 55px;">ಹಾಜರಾತಿ</th>
              <th class="sig-cell">ಸಹಿ / ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು<br/>(Signature)</th>
              <th class="remark-cell">ಷರಾ</th>
            </tr>
          </thead>
          <tbody>
            ${batchResolvedList.map(item => `
              <tr>
                <td class="text-center font-bold">${item.bookSlNo}</td>
                <td class="text-center font-bold" style="color:#047857;">${item.entity_id}</td>
                <td class="text-left font-bold">${item.name}</td>
                <td class="text-left">${item.department}</td>
                <td class="text-center font-bold">${item.category}</td>
                <td class="text-center font-bold" style="color:#047857;">P (ಹಾಜರು)</td>
                <td class="sig-cell"></td>
                <td class="remark-cell"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="footer-item">ದಾಖಲಿಸಿದ ಸಿಬ್ಬಂದಿ ಸಹಿ<br/>(Operator / Clerk)</div>
          <div class="footer-item">ಕೌಂಟರ್ ಉಸ್ತುವಾರಿ ಸಹಿ<br/>(Counter In-charge)</div>
          <div class="footer-item">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು<br/>(Chief Accounts Officer)</div>
          <div class="footer-item">ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು<br/>(Managing Director)</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  // Execute Batch Assignment for a Book (with optional print trigger)
  const handleBatchSubmit = (e, shouldPrintAfter = false) => {
    if (e && e.preventDefault) e.preventDefault();
    const bNo = batchBookNo.trim();
    if (!bNo) {
      if (typeof showToast === 'function') showToast('⚠️ ಪುಸ್ತಕ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (Enter Book No)', 'warning');
      return;
    }

    if (batchParsedIds.length === 0) {
      if (typeof showToast === 'function') showToast('⚠️ ಕನಿಷ್ಠ 1 ಶೇರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ', 'warning');
      return;
    }

    let startSerial = Number(batchStartSlNo) || 1;

    saveRecords(prev => {
      const next = { ...prev };
      batchParsedIds.forEach((targetId, index) => {
        const memberRec = { ...(next[targetId] || {}) };
        const sl = String(startSerial + index);
        memberRec[batchYear] = {
          status: 'P',
          bookNo: bNo,
          slNo: sl
        };
        next[targetId] = memberRec;

        // Synchronize with scan records
        if (typeof onManualAttendanceUpdate === 'function') {
          onManualAttendanceUpdate(targetId, batchYear, 'P', bNo, sl);
        }
      });
      return next;
    });

    playBeep(1040, 0.12);
    if (typeof showToast === 'function') {
      showToast(`✅ ${batchParsedIds.length} ಶೇರುದಾರರಿಗೆ ಪುಸ್ತಕ #${bNo} ರಲ್ಲಿ ಕ್ರಮವಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ!`, 'success');
    }

    if (shouldPrintAfter) {
      handlePrintBatchList();
    }

    // Set search query in the main view to this Book No so the user immediately sees all these shareholders!
    setSearchQuery(bNo);
    setCurrentPage(1);
    setShowBatchModal(false);
    setBatchShareNosInput('');
  };

  // Reset all manual entries with confirmation
  const handleResetRecords = () => {
    if (window.confirm('⚠️ ನೀವು ಎಲ್ಲಾ ಕೈಪಿಡಿ ಹಾಜರಾತಿ ಪುಸ್ತಕ ದಾಖಲೆಗಳನ್ನು ಮರುಹೊಂದಿಸಲು (Reset) ಬಯಸುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ಹಿಂಪಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.')) {
      setManualRecords({});
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      if (typeof showToast === 'function') showToast('🔄 ಕೈಪಿಡಿ ದಾಖಲೆಗಳನ್ನು ಮರುಹೊಂದಿಸಲಾಗಿದೆ', 'info');
    }
  };

  // Compute full view items with attendance numbers and grand total (interchangeable between Scan and Manual Entry)
  const processedShareholders = useMemo(() => {
    return masterShareholders.map((m, idx) => {
      const sId = String(m.entity_id || '').trim();
      const rec = manualRecords[sId] || {};

      let totalP = 0;
      const yearData = {};

      activeYears.forEach(yr => {
        const agmKey = AGM_KEY_BY_YEAR[yr];
        // Check if scanned in allAgmScansMap
        const scanRecord = agmKey ? (
          allAgmScansMap.get(`${agmKey}_${sId}`) ||
          (agmKey === 'AGM-6' && allAgmScansMap.get(`AGM-1_${sId}`)) ||
          (agmKey === 'AGM-7' && allAgmScansMap.get(`AGM-2_${sId}`)) ||
          (agmKey === 'AGM-8' && allAgmScansMap.get(`AGM-3_${sId}`)) ||
          (agmKey === 'AGM-9' && allAgmScansMap.get(`AGM-4_${sId}`)) ||
          (agmKey === 'AGM-10' && allAgmScansMap.get(`AGM-5_${sId}`))
        ) : null;

        const isScannedPresent = Boolean(scanRecord && scanRecord.status === 'Present');
        const yRec = rec[yr];

        let status = '0';
        let bookNo = '0';
        let slNo = '0';
        let isScanned = false;

        if (yRec && yRec.status !== undefined) {
          status = yRec.status === 'P' || yRec.status === 'p' ? 'P' : '0';
          bookNo = yRec.bookNo !== undefined ? String(yRec.bookNo).trim() : '0';
          slNo = yRec.slNo !== undefined ? String(yRec.slNo).trim() : '0';
        } else if (isScannedPresent) {
          status = 'P';
          bookNo = scanRecord?.manualBookNo || 'QR Scan';
          slNo = scanRecord?.manualSlNo || '✓';
          isScanned = true;
        }

        if (status === 'P') totalP++;

        yearData[yr] = {
          status,
          bookNo: bookNo === '' ? '0' : bookNo,
          slNo: slNo === '' ? '0' : slNo,
          isScanned
        };
      });

      return {
        ...m,
        entity_id: sId,
        yearData,
        grandTotal: totalP,
        isEligible: totalP >= 2
      };
    });
  }, [masterShareholders, manualRecords, activeYears, allAgmScansMap]);

  // Filter and search
  const filteredShareholders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return processedShareholders.filter(item => {
      // Filter Mode
      if (filterMode === 'PRESENT' && item.grandTotal === 0) return false;
      if (filterMode === 'ELIGIBLE' && item.grandTotal < 2) return false;
      if (filterMode === 'ABSENT' && item.grandTotal > 0) return false;

      // Search Query
      if (q) {
        const idMatch = String(item.entity_id).toLowerCase().includes(q);
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const villageMatch = (item.department || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);

        // Also check if search query matches any entered Book No
        const bookMatch = activeYears.some(yr => {
          const b = item.yearData[yr]?.bookNo;
          return b && String(b).toLowerCase() === q;
        });

        if (!idMatch && !nameMatch && !villageMatch && !catMatch && !bookMatch) {
          return false;
        }
      }

      return true;
    });
  }, [processedShareholders, filterMode, searchQuery, activeYears]);

  // Pagination
  const totalPages = Math.ceil(filteredShareholders.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShareholders.slice(start, start + pageSize);
  }, [filteredShareholders, currentPage, pageSize]);

  // Stats
  const totalMembersCount = processedShareholders.length;
  const presentAnyCount = processedShareholders.filter(i => i.grandTotal > 0).length;
  const eligibleCount = processedShareholders.filter(i => i.grandTotal >= 2).length;
  const absentCount = totalMembersCount - presentAnyCount;

  // EXPORT EXCEL (Exact replica of user's uploaded image with 2-tier headers)
  const handleExportExcel = () => {
    const titleRow1 = ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204'];
    const titleRow2 = [`ಮಹಾಸಭೆ ಕೈಪಿಡಿ ಪುಸ್ತಕ & ಸ್ಕ್ಯಾನ್ ಹಾಜರಾತಿ ವಹಿ (${currentPreset.name})`];
    const emptyRow = [];

    // Header Tier 1: Grouped Years
    const headerTier1 = [
      'ಕ್ರಮ ಸಂ (Sl No)',
      'ಷೇರು ಸಂಖ್ಯೆ (Share No)',
      'ಶೇರುದಾರರ ಹೆಸರು (Shareholder Name)',
      'ಗ್ರಾಮ / ಸ್ಥಳ (Village)',
      'ವರ್ಗ (Category)'
    ];

    activeYears.forEach(yr => {
      const agmName = currentPreset.yearAgmMap?.[yr] || yr;
      headerTier1.push(`${yr} (${agmName})`, '', ''); // Spans 3 columns
    });
    headerTier1.push('Grand Total');

    // Header Tier 2: Sub-columns
    const headerTier2 = [
      '', '', '', '', ''
    ];
    activeYears.forEach(yr => {
      headerTier2.push(`${yr} (P/0)`, 'AGM Attendance Book No', 'Sl No');
    });
    headerTier2.push('');

    const rows = [titleRow1, titleRow2, emptyRow, headerTier1, headerTier2];

    // Data rows
    filteredShareholders.forEach((item, idx) => {
      const row = [
        idx + 1,
        `#${item.entity_id}`,
        item.name,
        item.department,
        item.category || 'ಅ - ವರ್ಗ'
      ];

      activeYears.forEach(yr => {
        const yd = item.yearData[yr] || { status: '0', bookNo: '0', slNo: '0' };
        row.push(yd.status, yd.bookNo, yd.slNo);
      });

      row.push(item.grandTotal);
      rows.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merges for the 2-tier headers
    const headerRowIdx = 3;
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 + activeYears.length * 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 + activeYears.length * 3 } },

      { s: { r: headerRowIdx, c: 0 }, e: { r: headerRowIdx + 1, c: 0 } },
      { s: { r: headerRowIdx, c: 1 }, e: { r: headerRowIdx + 1, c: 1 } },
      { s: { r: headerRowIdx, c: 2 }, e: { r: headerRowIdx + 1, c: 2 } },
      { s: { r: headerRowIdx, c: 3 }, e: { r: headerRowIdx + 1, c: 3 } },
      { s: { r: headerRowIdx, c: 4 }, e: { r: headerRowIdx + 1, c: 4 } }
    ];

    activeYears.forEach((yr, i) => {
      const startCol = 5 + i * 3;
      merges.push({
        s: { r: headerRowIdx, c: startCol },
        e: { r: headerRowIdx, c: startCol + 2 }
      });
    });

    const grandTotalCol = 5 + activeYears.length * 3;
    merges.push({
      s: { r: headerRowIdx, c: grandTotalCol },
      e: { r: headerRowIdx + 1, c: grandTotalCol }
    });

    ws['!merges'] = merges;

    const cols = [
      { wch: 8 },  // Sl No
      { wch: 14 }, // Share No
      { wch: 30 }, // Name
      { wch: 18 }, // Village
      { wch: 12 }  // Category
    ];
    activeYears.forEach(() => {
      cols.push({ wch: 10 }, { wch: 22 }, { wch: 10 });
    });
    cols.push({ wch: 14 });
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, 'Manual_Attendance_Register');
    const filename = `Attendance_Register_${selectedPresetKey}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    if (typeof showToast === 'function') {
      showToast(`📊 ಹಾಜರಾತಿ ವಹಿ ಎಕ್ಸೆಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!`, 'success');
    }
  };

  // Statutory Print Window
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ಹಾಜರಾತಿ ವಹಿ - ${currentPreset.name}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm 6mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9px; color: #111; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
          .header h1 { margin: 0; font-size: 15px; font-weight: bold; color: #047857; }
          .header h2 { margin: 2px 0 0 0; font-size: 11px; color: #333; }
          .header p { margin: 2px 0 0 0; font-size: 8.5px; color: #555; }
          table { width: 100%; border-collapse: collapse; text-align: center; }
          th, td { border: 1px solid #777; padding: 3px 2px; }
          th { font-size: 8.5px; font-weight: bold; }
          .y0 { background-color: #D8B4E2; }
          .y1 { background-color: #CFFAFE; }
          .y2 { background-color: #FFEDD5; }
          .y3 { background-color: #FCE7F3; }
          .y4 { background-color: #E2E8F0; }
          .gt { background-color: #FED7AA; font-weight: bold; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .footer { margin-top: 15px; display: flex; justify-content: space-between; font-size: 9px; font-weight: bold; padding: 0 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204</h1>
          <h2>ಮಹಾಸಭೆ ಹಾಜರಾತಿ ವಹಿ (${currentPreset.name})</h2>
          <p>ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಒಟ್ಟು ಸದಸ್ಯರು: ${filteredShareholders.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 25px;">ಕ್ರ.ಸಂ</th>
              <th rowspan="2" style="width: 45px;">ಷೇರು ನಂ</th>
              <th rowspan="2" style="width: 150px;">ಶೇರುದಾರರ ಹೆಸರು</th>
              <th rowspan="2" style="width: 80px;">ಸ್ಥಳ / ಗ್ರಾಮ</th>
              ${activeYears.map((yr, idx) => `<th colspan="3" class="y${idx}">${yr} (${currentPreset.yearAgmMap?.[yr] || yr})</th>`).join('')}
              <th rowspan="2" class="gt" style="width: 40px;">Grand Total</th>
            </tr>
            <tr>
              ${activeYears.map((yr, idx) => `
                <th class="y${idx}">${yr}</th>
                <th class="y${idx}">Book No</th>
                <th class="y${idx}">Sl No</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredShareholders.slice(0, 500).map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="font-bold">#${item.entity_id}</td>
                <td class="text-left font-bold">${item.name}</td>
                <td class="text-left">${item.department}</td>
                ${activeYears.map(yr => {
                  const yd = item.yearData[yr] || { status: '0', bookNo: '0', slNo: '0' };
                  return `
                    <td class="font-bold">${yd.status === 'P' ? '<span style="color:#047857;">P</span>' : '<span style="color:#888;">0</span>'}</td>
                    <td>${yd.bookNo}</td>
                    <td>${yd.slNo}</td>
                  `;
                }).join('')}
                <td class="gt">${item.grandTotal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>ಲಿಪಿಕಾರರ ಸಹಿ (Clerk)</div>
          <div>ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು (Chief Accounts Officer)</div>
          <div>ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (Managing Director)</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-950 border-2 border-purple-500/70 rounded-3xl w-full max-w-[96vw] max-h-[95vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
        {/* 1. Header Banner & Preset Switcher */}
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-950 to-indigo-950/90 border-2 border-purple-500/50 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-400/50">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                    <span>📊 ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಸಂಯೋಜಿತ ಕೈಪಿಡಿ ಹಾಜರಾತಿ ವಹಿ (Consolidated 5-AGMs Register)</span>
                  </h2>
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2.5 py-0.5 rounded-full font-bold">
                    AGM 6 to AGM 10 (2023-24 to 2027-28)
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಒಟ್ಟು ಸಂಯೋಜಿತ ವಹಿ: QR ಸ್ಕ್ಯಾನರ್ ಅಥವಾ ಕೈಪಿಡಿ ಪುಸ್ತಕ (Book No & Sl No) ದಾಖಲೆಗಳು
                </p>
              </div>
            </div>

            {/* Preset Selector */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-purple-500/30">
              <span className="text-[11px] text-purple-300 font-bold px-2">ವರ್ಷಗಳ ಶ್ರೇಣಿ:</span>
              {Object.values(YEAR_PRESETS).map(pr => {
                const isSelected = selectedPresetKey === pr.id;
                return (
                  <button
                    key={pr.id}
                    onClick={() => {
                      setSelectedPresetKey(pr.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-1 ring-purple-300'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {pr.shortName}
                  </button>
                );
              })}
            </div>

            {/* Action buttons: Print, Excel, Batch, Reset, Close */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-indigo-400/40"
                title="ಒಂದು ಪುಸ್ತಕದ ಶೇರುದಾರರಿಗೆ ಸಾಮೂಹಿಕವಾಗಿ ನಮೂದಿಸಿ ಮತ್ತು ಪ್ರಿಂಟ್ ಮಾಡಿ"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-200" />
                <span>ಪುಸ್ತಕ ಸಾಮೂಹಿಕ ನಮೂದು (Batch)</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-emerald-400/40"
                title="ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (Excel Export)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-200" />
                <span>ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-slate-700"
                title="A4 ಮುದ್ರಣ (Print)"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>ಮುದ್ರಿಸಿ</span>
              </button>

              <button
                onClick={handleResetRecords}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-200 rounded-xl text-xs font-bold transition-all border border-slate-700 hover:border-rose-500/50 cursor-pointer"
                title="ದಾಖಲೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ / ಮರುಹೊಂದಿಸಿ (Reset)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
                title="ಮುಚ್ಚಿ (Close)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Stats Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 mt-3 border-t border-purple-500/20">
            <div className="bg-slate-900/80 border border-purple-900/50 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-purple-300">ಒಟ್ಟು ಶೇರುದಾರರು</div>
                <div className="text-lg font-bold text-white font-mono">{totalMembersCount.toLocaleString()}</div>
              </div>
              <Award className="w-5 h-5 text-purple-400" />
            </div>

            <div className="bg-slate-900/80 border border-emerald-900/50 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-emerald-300">ಹಾಜರಾದವರು (ಕನಿಷ್ಠ 1)</div>
                <div className="text-lg font-bold text-emerald-300 font-mono">{presentAnyCount.toLocaleString()}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="bg-slate-900/80 border border-amber-900/50 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-300">ಚುನಾವಣಾ ಅರ್ಹರು (2+ AGMs)</div>
                <div className="text-lg font-bold text-amber-300 font-mono">{eligibleCount.toLocaleString()}</div>
              </div>
              <Award className="w-5 h-5 text-amber-400" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">ಗೈರುಹಾಜರು (0 AGMs)</div>
                <div className="text-lg font-bold text-slate-300 font-mono">{absentCount.toLocaleString()}</div>
              </div>
              <XCircle className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* 2. Fast Single-Entry Bar (ವೇಗದ ಪ್ರತ್ಯೇಕ ನಮೂದು) */}
        <div className="bg-slate-900/95 border border-purple-500/40 rounded-2xl p-3.5 shadow-lg">
          <form onSubmit={handleQuickFormSubmit} className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>ತ್ವರಿತ ನಮೂದು:</span>
            </div>

            {/* Share Number Input */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-purple-400">
              <span className="text-slate-400 font-bold">ಷೇರು ನಂ:</span>
              <input
                id="quick-share-no-input"
                type="text"
                value={quickShareNo}
                onChange={(e) => setQuickShareNo(e.target.value)}
                placeholder="Ex: 118"
                className="w-20 bg-transparent text-emerald-400 font-mono font-bold outline-none text-xs"
              />
            </div>

            {/* Year Dropdown */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-400 font-bold">ವರ್ಷ:</span>
              <select
                value={quickYear}
                onChange={(e) => setQuickYear(e.target.value)}
                className="bg-transparent text-purple-300 font-bold outline-none cursor-pointer text-xs"
              >
                {activeYears.map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr} ({currentPreset.yearAgmMap?.[yr] || yr})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Toggle P / 0 */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <span className="text-slate-400 font-bold mr-1">ಸ್ಥಿತಿ:</span>
              <button
                type="button"
                onClick={() => setQuickStatus('P')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                  quickStatus === 'P' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                P (ಹಾಜರು)
              </button>
              <button
                type="button"
                onClick={() => setQuickStatus('0')}
                className={`px-2 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                  quickStatus === '0' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                0 (ಗೈರು)
              </button>
            </div>

            {/* Book No Input */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-purple-400">
              <span className="text-slate-400 font-bold">ಪುಸ್ತಕ ನಂ (Book No):</span>
              <input
                type="text"
                value={quickBookNo}
                onChange={(e) => setQuickBookNo(e.target.value)}
                placeholder="Ex: 13"
                className="w-16 bg-transparent text-amber-300 font-mono font-bold outline-none text-xs"
              />
            </div>

            {/* Sl No in Book Input */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-purple-400">
              <span className="text-slate-400 font-bold">ಕ್ರಮ ನಂ (Sl No):</span>
              <input
                type="text"
                value={quickSlNo}
                onChange={(e) => setQuickSlNo(e.target.value)}
                placeholder="Ex: 36"
                className="w-16 bg-transparent text-amber-300 font-mono font-bold outline-none text-xs"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>ದಾಖಲಿಸಿ (Save)</span>
            </button>

            {/* Auto increment toggle */}
            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer select-none ml-auto">
              <input
                type="checkbox"
                checked={autoIncrementSlNo}
                onChange={(e) => setAutoIncrementSlNo(e.target.checked)}
                className="rounded accent-purple-600 cursor-pointer"
              />
              <span className="text-[11px]">ಆಟೋ ಕ್ರಮ ನಂ ಹೆಚ್ಚಳ (+1)</span>
            </label>
          </form>

          {/* Matched shareholder info chip */}
          {matchedMember && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-purple-200">
              <span className="font-bold text-emerald-400">{matchedMember.entity_id}</span>
              <span className="font-semibold text-white">{matchedMember.name}</span>
              <span className="text-slate-400">• {matchedMember.department}</span>
              <span className="text-amber-300 text-[10px] bg-slate-800 px-2 py-0.5 rounded">
                {matchedMember.category || 'ಅ - ವರ್ಗ'}
              </span>
              <span className="text-slate-400 ml-auto text-[11px]">
                ಒಟ್ಟು ಹಾಜರಾತಿ: <b className="text-emerald-400">{processedShareholders.find(s => s.entity_id === matchedMember.entity_id)?.grandTotal || 0} / {activeYears.length}</b>
              </span>
            </div>
          )}
        </div>

        {/* 3. Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 mr-1">ಫಿಲ್ಟರ್:</span>
            <button
              onClick={() => { setFilterMode('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಎಲ್ಲಾ ({totalMembersCount.toLocaleString()})
            </button>
            <button
              onClick={() => { setFilterMode('PRESENT'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'PRESENT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಹಾಜರಾದವರು ({presentAnyCount.toLocaleString()})
            </button>
            <button
              onClick={() => { setFilterMode('ELIGIBLE'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'ELIGIBLE' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಚುನಾವಣಾ ಅರ್ಹರು 2+ ({eligibleCount.toLocaleString()})
            </button>
            <button
              onClick={() => { setFilterMode('ABSENT'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'ABSENT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ಗೈರುಹಾಜರು ({absentCount.toLocaleString()})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search Name, Share #, Village, Book #..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            {/* Rows per page */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2 py-1.5 text-xs outline-none cursor-pointer"
            >
              <option value={25}>25 ಸಾಲುಗಳು</option>
              <option value={50}>50 ಸಾಲುಗಳು</option>
              <option value={100}>100 ಸಾಲುಗಳು</option>
              <option value={200}>200 ಸಾಲುಗಳು</option>
            </select>
          </div>
        </div>

        {/* 4. Statutory Master Ledger Table (Synchronized with QR Scan & Manual Entries) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-center text-xs border-collapse select-none">
              {/* Header Tier 1: Grouped Years */}
              <thead className="sticky top-0 z-20 shadow-md">
                <tr className="border-b border-slate-700 font-bold uppercase text-[11px]">
                  <th rowSpan={2} className="py-2.5 px-2 bg-slate-900 text-slate-300 border-r border-slate-700 w-12 sticky left-0 z-30">
                    ಕ್ರ.ಸಂ
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 bg-slate-900 text-slate-300 border-r border-slate-700 w-24 sticky left-12 z-30">
                    ಷೇರು ನಂ
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 bg-slate-900 text-slate-300 border-r border-slate-700 text-left min-w-[180px] sticky left-36 z-30">
                    ಶೇರುದಾರರ ಹೆಸರು
                  </th>
                  <th rowSpan={2} className="py-2.5 px-2.5 bg-slate-900 text-slate-300 border-r border-slate-700 text-left min-w-[110px]">
                    ಸ್ಥಳ / ಗ್ರಾಮ
                  </th>
                  <th rowSpan={2} className="py-2.5 px-2 bg-slate-900 text-slate-300 border-r border-slate-700 w-16">
                    ವರ್ಗ
                  </th>

                  {/* Year Super Headers */}
                  {activeYears.map((yr, idx) => {
                    const theme = YEAR_THEMES[idx] || YEAR_THEMES[0];
                    const agmLabel = currentPreset.yearAgmMap?.[yr];
                    return (
                      <th
                        key={yr}
                        colSpan={3}
                        style={{ backgroundColor: theme.headerBg, color: theme.headerText }}
                        className="py-2 px-2 border-r border-slate-700 font-black text-xs tracking-wider"
                      >
                        <div>{yr}</div>
                        {agmLabel && agmLabel !== yr && (
                          <div className="text-[10px] font-bold opacity-90">({agmLabel})</div>
                        )}
                      </th>
                    );
                  })}

                  {/* Grand Total Header */}
                  <th
                    rowSpan={2}
                    style={{ backgroundColor: GRAND_TOTAL_THEME.headerBg, color: GRAND_TOTAL_THEME.headerText }}
                    className="py-2.5 px-3 border-l border-slate-700 font-black text-xs w-20 sticky right-0 z-30"
                  >
                    Grand<br />Total
                  </th>
                </tr>

                {/* Header Tier 2: Sub-columns for each year */}
                <tr className="border-b border-slate-700 font-bold text-[10px]">
                  {activeYears.map((yr, idx) => {
                    const theme = YEAR_THEMES[idx] || YEAR_THEMES[0];
                    return (
                      <React.Fragment key={`${yr}_sub`}>
                        <th
                          style={{ backgroundColor: theme.subHeaderBg, color: theme.subHeaderText }}
                          className="py-1.5 px-2 border-r border-slate-300/40 w-14"
                          title={`${yr} ಹಾಜರಾತಿ ಸ್ಥಿತಿ (P / 0)`}
                        >
                          {yr}
                        </th>
                        <th
                          style={{ backgroundColor: theme.subHeaderBg, color: theme.subHeaderText }}
                          className="py-1.5 px-2 border-r border-slate-300/40 min-w-[90px]"
                          title="AGM Attendance Book No"
                        >
                          AGM<br />Attendance<br />Book No
                        </th>
                        <th
                          style={{ backgroundColor: theme.subHeaderBg, color: theme.subHeaderText }}
                          className="py-1.5 px-2 border-r border-slate-700 w-16"
                          title="Sl No in Book"
                        >
                          Sl No
                        </th>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedList.map((item, rowIdx) => {
                  const globalIdx = (currentPage - 1) * pageSize + rowIdx + 1;
                  return (
                    <tr key={item.entity_id} className="hover:bg-slate-900/80 transition-colors">
                      {/* Fixed Sl No */}
                      <td className="py-2 px-2 border-r border-slate-800 text-slate-400 font-mono bg-slate-950/90 sticky left-0 z-10">
                        {globalIdx}
                      </td>

                      {/* Share Number */}
                      <td className="py-2 px-3 border-r border-slate-800 font-mono font-bold text-emerald-400 bg-slate-950/90 sticky left-12 z-10">
                        {item.entity_id}
                      </td>

                      {/* Member Name */}
                      <td className="py-2 px-3 border-r border-slate-800 text-left font-medium text-slate-100 bg-slate-950/90 sticky left-36 z-10">
                        <div className="truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </div>
                      </td>

                      {/* Village */}
                      <td className="py-2 px-2.5 border-r border-slate-800 text-left text-slate-300 truncate max-w-[120px]">
                        {item.department}
                      </td>

                      {/* Category */}
                      <td className="py-2 px-2 border-r border-slate-800">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-amber-300">
                          {item.category || 'ಅ - ವರ್ಗ'}
                        </span>
                      </td>

                      {/* Year Groups Sub-cells */}
                      {activeYears.map((yr, idx) => {
                        const yd = item.yearData[yr] || { status: '0', bookNo: '0', slNo: '0', isScanned: false };
                        const theme = YEAR_THEMES[idx] || YEAR_THEMES[0];
                        const isPresent = yd.status === 'P';

                        return (
                          <React.Fragment key={`${item.entity_id}_${yr}`}>
                            {/* 1. Status P / 0 button */}
                            <td className={`py-1.5 px-1 border-r border-slate-800/80 ${theme.cellBg}`}>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(item.entity_id, yr)}
                                className={`w-7 h-7 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center justify-center mx-auto ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                                title={
                                  yd.isScanned
                                    ? `📷 QR ಸ್ಕ್ಯಾನ್ ಮೂಲಕ ದಾಖಲಾಗಿದೆ (ಕ್ಲಿಕ್ ಮಾಡಿ ಬದಲಾಯಿಸಿ)`
                                    : `ಕ್ಲಿಕ್ ಮಾಡಿ ಸ್ಥಿತಿ ಬದಲಾಯಿಸಿ (${isPresent ? 'P' : '0'})`
                                }
                              >
                                {yd.status}
                              </button>
                            </td>

                            {/* 2. AGM Attendance Book No Input */}
                            <td className={`py-1.5 px-1 border-r border-slate-800/80 ${theme.cellBg}`}>
                              <input
                                type="text"
                                value={yd.bookNo}
                                onChange={(e) => handleCellChange(item.entity_id, yr, 'bookNo', e.target.value)}
                                className={`w-16 text-center bg-slate-900/90 text-slate-100 font-mono font-bold py-1 px-1 rounded-md border border-slate-700/80 outline-none text-xs transition-all ${theme.focusRing}`}
                                placeholder="0"
                              />
                            </td>

                            {/* 3. Sl No in Book Input */}
                            <td className={`py-1.5 px-1 border-r border-slate-800 ${theme.cellBg}`}>
                              <input
                                type="text"
                                value={yd.slNo}
                                onChange={(e) => handleCellChange(item.entity_id, yr, 'slNo', e.target.value)}
                                className={`w-14 text-center bg-slate-900/90 text-slate-100 font-mono font-bold py-1 px-1 rounded-md border border-slate-700/80 outline-none text-xs transition-all ${theme.focusRing}`}
                                placeholder="0"
                              />
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Grand Total Cell */}
                      <td className={`py-2 px-3 border-l border-slate-800 font-mono font-black text-sm sticky right-0 z-10 bg-slate-950/95`}>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full ${
                            item.grandTotal >= 2
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : item.grandTotal > 0
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.grandTotal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border-t border-slate-800 text-xs">
            <div className="text-slate-400">
              ತೋರಿಸಲಾಗುತ್ತಿದೆ: <b className="text-slate-200">
                {filteredShareholders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </b> ರಿಂದ <b className="text-slate-200">
                {Math.min(currentPage * pageSize, filteredShareholders.length)}
              </b> (ಒಟ್ಟು <b className="text-purple-300">{filteredShareholders.length.toLocaleString()}</b> ಶೇರುದಾರರು)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono font-bold">
                ಪುಟ {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 font-bold cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 6. Batch Assignment Drawer / Modal with Live Shareholders Preview & Print Option */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border-2 border-indigo-500/70 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">ಪುಸ್ತಕ ಸಾಮೂಹಿಕ ನಮೂದು & ಮುದ್ರಣ (Batch Assignment & Print)</h3>
                    <p className="text-xs text-slate-400">
                      ಭೌತಿಕ ಪುಸ್ತಕದ ಸಂಖ್ಯೆ, ಶೇರುದಾರರ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ದಾಖಲಿಸಿ ಮತ್ತು ಹಾಜರಾತಿ ಪಟ್ಟಿಯನ್ನು ಪ್ರಿಂಟ್ ಮಾಡಿ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
                  title="ಮುಚ್ಚಿ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => handleBatchSubmit(e, false)} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">ಮಹಾಸಭೆ ವರ್ಷ ಆಯ್ಕೆಮಾಡಿ:</label>
                    <select
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-purple-300 font-bold outline-none cursor-pointer"
                    >
                      {activeYears.map(yr => (
                        <option key={yr} value={yr} className="bg-slate-900 text-white">
                          {yr} ({currentPreset.yearAgmMap?.[yr] || yr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No):</label>
                    <input
                      type="text"
                      value={batchBookNo}
                      onChange={(e) => setBatchBookNo(e.target.value)}
                      placeholder="Ex: 12, 13, 27"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">ಪ್ರಾರಂಭದ ಕ್ರಮ ಸಂಖ್ಯೆ (Start Sl No):</label>
                    <input
                      type="number"
                      min="1"
                      value={batchStartSlNo}
                      onChange={(e) => setBatchStartSlNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold">
                      ಶೇರು ಸಂಖ್ಯೆಗಳು (ಕಾಮಾ ಅಥವಾ ಸ್ಪೇಸ್ ಅಥವಾ ಹೊಸ ಸಾಲಿನ ಮೂಲಕ ನಮೂದಿಸಿ):
                    </label>
                    {batchParsedIds.length > 0 && (
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">
                        {batchParsedIds.length} ಶೇರು ಸಂಖ್ಯೆಗಳು ನಮೂದಿಸಲಾಗಿದೆ
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={batchShareNosInput}
                    onChange={(e) => setBatchShareNosInput(e.target.value)}
                    placeholder="Ex: 1, 28, #4698, 55, 2698, 15264, 894 (ಅಥವಾ 100-115)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-emerald-400 font-mono text-xs outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 leading-relaxed"
                  />
                </div>

                {/* LIVE RESOLVED SHAREHOLDERS PREVIEW */}
                {batchResolvedList.length > 0 && (
                  <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ನಮೂದಿಸಿದ ಶೇರುದಾರರ ಪಟ್ಟಿ (Matched Shareholders):</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono text-xs border border-emerald-500/40">
                          {batchResolvedList.length} ಸದಸ್ಯರು
                        </span>
                        {batchBookNo && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
                            ಪುಸ್ತಕ #{batchBookNo}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handlePrintBatchList}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-indigo-400/50"
                        title="ಈ ಶೇರುದಾರರ ಹಾಜರಾತಿ ವಹಿಯನ್ನು ಪ್ರಿಂಟ್ ಮಾಡಿ"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-200" />
                        <span>🖨️ ಈ ಪಟ್ಟಿ ಮುದ್ರಿಸಿ (Print Register)</span>
                      </button>
                    </div>

                    {/* Scrollable Table of Matched Shareholders */}
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800">
                      <table className="w-full text-xs text-left select-none border-collapse">
                        <thead className="bg-slate-900 text-slate-300 sticky top-0 text-[10.5px] uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-2.5 text-center w-14">ಕ್ರ.ಸಂ</th>
                            <th className="py-2 px-3 w-24">ಷೇರು ನಂ</th>
                            <th className="py-2 px-3">ಶೇರುದಾರರ ಹೆಸರು</th>
                            <th className="py-2 px-3">ಸ್ಥಳ / ಗ್ರಾಮ</th>
                            <th className="py-2 px-2 text-center w-20">ವರ್ಗ</th>
                            <th className="py-2 px-2 text-center w-16">ಸ್ಥಿತಿ</th>
                            <th className="py-2 px-2 text-center w-10">ತೆಗೆ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-200">
                          {batchResolvedList.map((item, index) => (
                            <tr key={`${item.entity_id}_${index}`} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-400">
                                {item.bookSlNo}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                {item.entity_id}
                              </td>
                              <td className="py-2 px-3 font-semibold text-white truncate max-w-[200px]" title={item.name}>
                                {item.name}
                              </td>
                              <td className="py-2 px-3 text-slate-300 truncate max-w-[140px]" title={item.department}>
                                {item.department}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className="px-2 py-0.5 rounded text-[10.5px] bg-slate-900 border border-slate-700 text-amber-300 font-bold">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                  P (ಹಾಜರು)
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatchId(index)}
                                  className="text-slate-500 hover:text-rose-400 cursor-pointer p-1 rounded hover:bg-slate-800 transition"
                                  title="ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಿ"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons in Batch Modal */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition text-xs"
                  >
                    ರದ್ದುಮಾಡಿ (Cancel)
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={batchResolvedList.length === 0}
                      onClick={handlePrintBatchList}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold border border-slate-700 cursor-pointer transition shadow text-xs"
                      title="ಶೇರುದಾರರ ಪಟ್ಟಿಯನ್ನು ಮಾತ್ರ ಮುದ್ರಿಸಿ"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-300" />
                      <span>🖨️ ಮುದ್ರಿಸಿ (Print Only)</span>
                    </button>

                    <button
                      type="button"
                      disabled={batchResolvedList.length === 0}
                      onClick={(e) => handleBatchSubmit(e, true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold shadow-lg cursor-pointer transition text-xs"
                      title="ವಹಿಯಲ್ಲಿ ದಾಖಲಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರಿಂಟ್ ತೆರೆಯಿರಿ"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-200" />
                      <span>💾 & 🖨️ ದಾಖಲಿಸಿ ಮತ್ತು ಮುದ್ರಿಸಿ (Assign & Print)</span>
                    </button>

                    <button
                      type="submit"
                      disabled={batchResolvedList.length === 0}
                      className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold shadow-lg cursor-pointer transition text-xs"
                    >
                      💾 ದಾಖಲಿಸಿ ({batchResolvedList.length} ಸದಸ್ಯರು)
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
