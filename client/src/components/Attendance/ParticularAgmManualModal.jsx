import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BookOpen, FileSpreadsheet, Save, Download, Printer, Search,
  CheckCircle2, XCircle, RotateCcw, Plus, X, Filter, ChevronLeft,
  ChevronRight, ArrowRight, Layers, Sparkles, Check, Upload, Award,
  Camera, CheckCheck
} from 'lucide-react';

const STORAGE_KEY = 'sugar_erp_manual_book_attendance';

export default function ParticularAgmManualModal({
  isOpen = true,
  onClose = () => {},
  agmKey = 'AGM-10',
  agmConfig = { id: 'AGM-10', name: 'AGM 10', labelKn: '೧೦ನೇ ಮಹಾಸಭೆ (2027-28)', year: '2027-28', date: '2027-11-09' },
  masterShareholders = [],
  allAgmScansMap = new Map(),
  onSaveRecord = () => {},
  showToast = () => {},
  user = null
}) {
  const agmYear = agmConfig.year || '2027-28';
  const agmName = agmConfig.name || agmKey;
  const agmLabelKn = agmConfig.labelKn || agmKey;

  // Manual records from localStorage
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
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Quick Single-Entry Form State (Pre-locked to this AGM Year)
  const [quickShareNo, setQuickShareNo] = useState('');
  const [quickStatus, setQuickStatus] = useState('P');
  const [quickBookNo, setQuickBookNo] = useState('');
  const [quickSlNo, setQuickSlNo] = useState('');
  const [autoIncrementSlNo, setAutoIncrementSlNo] = useState(true);

  // Batch Book Entry Drawer / Modal (Pre-locked to this AGM Year)
  const [showBatchModal, setShowBatchModal] = useState(false);
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

  // Map of master shareholders for instant O(1) lookups (Exact share number matching: '1' vs '#1')
  const masterShareholdersMap = useMemo(() => {
    const map = new Map();
    masterShareholders.forEach(m => {
      const rawId = String(m.entity_id || '').trim();
      if (!rawId) return;
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

  // Update specific cell (status, bookNo, or slNo)
  const handleCellChange = (shareNo, field, value) => {
    const sId = String(shareNo).trim();
    let updatedStatus = '0';
    let updatedBookNo = '0';
    let updatedSlNo = '0';

    saveRecords(prev => {
      const memberRec = { ...(prev[sId] || {}) };
      const currYearData = { ...(memberRec[agmYear] || { status: '0', bookNo: '0', slNo: '0' }) };

      if (field === 'status') {
        currYearData.status = value;
      } else if (field === 'bookNo') {
        currYearData.bookNo = value;
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

      memberRec[agmYear] = currYearData;
      return {
        ...prev,
        [sId]: memberRec
      };
    });

    // Notify parent for bidirectional sync with scanned AGMs
    if (typeof onSaveRecord === 'function') {
      onSaveRecord(sId, agmYear, updatedStatus, updatedBookNo, updatedSlNo);
    }
  };

  // Toggle status button 'P' <-> '0'
  const handleToggleStatus = (shareNo) => {
    const sId = String(shareNo).trim();
    const currItem = processedShareholders.find(s => s.entity_id === sId);
    const currStatus = currItem?.status || '0';
    const nextStatus = currStatus === 'P' ? '0' : 'P';

    handleCellChange(sId, 'status', nextStatus);
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

    handleCellChange(sId, 'status', st);
    handleCellChange(sId, 'bookNo', bNo);
    handleCellChange(sId, 'slNo', sNo);

    playBeep(980, 0.08);
    if (typeof showToast === 'function') {
      showToast(`✅ ${agmName}: ಷೇರು ${sId.startsWith('#') ? sId : `#${sId}`} - ಪುಸ್ತಕ ನಂ: ${bNo}, ಕ್ರಮ ನಂ: ${sNo} ದಾಖಲಾಗಿದೆ!`, 'success');
    }

    // Auto-advance Sl No and clear share no for next quick entry
    if (autoIncrementSlNo && sNo !== '0' && !isNaN(Number(sNo))) {
      setQuickSlNo(String(Number(sNo) + 1));
    }
    setQuickShareNo('');
    const inputEl = document.getElementById('particular-agm-quick-share-input');
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

  // Resolved shareholders list for batch modal preview & print (Exact match: '1' -> Regular, '#1' -> SC)
  const batchResolvedList = useMemo(() => {
    const startSl = Number(batchStartSlNo) || 1;
    return batchParsedIds.map((id, index) => {
      const member = masterShareholdersMap.get(id) || masterShareholdersMap.get(id.toUpperCase());
      return {
        bookSlNo: startSl + index,
        entity_id: id,
        name: member?.name || (member ? `ಶೇರುದಾರ #${id}` : `⚠️ ಶೇರು #${id} ಕಂಡುಬಂದಿಲ್ಲ`),
        department: member?.department || member?.village || member?.place || '—',
        category: member?.category || 'ಅ - ವರ್ಗ',
        isFound: Boolean(member)
      };
    });
  }, [batchParsedIds, batchStartSlNo, masterShareholdersMap]);

  // Remove a single shareholder from batch input (by index)
  const handleRemoveBatchId = (indexToRemove) => {
    const updated = batchParsedIds.filter((_, idx) => idx !== indexToRemove);
    setBatchShareNosInput(updated.join(', '));
  };

  // Print official Attendance Register for this specific Book batch in this AGM
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
        <title>${agmName} - ಪುಸ್ತಕ #${bNo} ಹಾಜರಾತಿ ವಹಿ</title>
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
          <h2>${agmLabelKn} ಕೈಪಿಡಿ ಪುಸ್ತಕ ಹಾಜರಾತಿ ವಹಿ (Book Attendance Register)</h2>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">ಮಹಾಸಭೆ:</span> <span class="meta-value">${agmName} (${agmYear})</span></div>
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

  // Execute Batch Assignment for this AGM
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
        memberRec[agmYear] = {
          status: 'P',
          bookNo: bNo,
          slNo: sl
        };
        next[targetId] = memberRec;

        // Synchronize with scan records
        if (typeof onSaveRecord === 'function') {
          onSaveRecord(targetId, agmYear, 'P', bNo, sl);
        }
      });
      return next;
    });

    playBeep(1040, 0.12);
    if (typeof showToast === 'function') {
      showToast(`✅ ${agmName}: ${batchParsedIds.length} ಶೇರುದಾರರಿಗೆ ಪುಸ್ತಕ #${bNo} ರಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ!`, 'success');
    }

    if (shouldPrintAfter) {
      handlePrintBatchList();
    }

    setSearchQuery(bNo);
    setCurrentPage(1);
    setShowBatchModal(false);
    setBatchShareNosInput('');
  };

  // Compute shareholders list for this specific AGM
  const processedShareholders = useMemo(() => {
    return masterShareholders.map((m) => {
      const sId = String(m.entity_id || '').trim();
      const rec = manualRecords[sId] || {};

      // Check scan record in allAgmScansMap for this AGM
      const scanKey = `${agmKey}_${sId}`;
      const scanRecord = allAgmScansMap.get(scanKey);
      const isScannedPresent = Boolean(scanRecord && scanRecord.status === 'Present');

      const yRec = rec[agmYear];

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

      return {
        ...m,
        entity_id: sId,
        status,
        bookNo: bookNo === '' ? '0' : bookNo,
        slNo: slNo === '' ? '0' : slNo,
        isScanned,
        isPresent: status === 'P'
      };
    });
  }, [masterShareholders, manualRecords, agmKey, agmYear, allAgmScansMap]);

  // Filter and search
  const filteredShareholders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return processedShareholders.filter(item => {
      if (filterMode === 'PRESENT' && !item.isPresent) return false;
      if (filterMode === 'ABSENT' && item.isPresent) return false;

      if (q) {
        const idMatch = String(item.entity_id).toLowerCase().includes(q);
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const villageMatch = (item.department || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const bookMatch = String(item.bookNo || '').toLowerCase() === q;

        if (!idMatch && !nameMatch && !villageMatch && !catMatch && !bookMatch) {
          return false;
        }
      }

      return true;
    });
  }, [processedShareholders, filterMode, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredShareholders.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShareholders.slice(start, start + pageSize);
  }, [filteredShareholders, currentPage, pageSize]);

  // Stats
  const totalMembersCount = processedShareholders.length;
  const presentCount = processedShareholders.filter(i => i.isPresent).length;
  const absentCount = totalMembersCount - presentCount;

  // Export Excel for this AGM
  const handleExportExcel = () => {
    const rows = [
      ['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204'],
      [`${agmLabelKn} ಕೈಪಿಡಿ ಪುಸ್ತಕ & ಸ್ಕ್ಯಾನ್ ಹಾಜರಾತಿ ವಹಿ (Attendance Register)`],
      [`ದಿನಾಂಕ: ${agmConfig.date} • ಒಟ್ಟು ಸದಸ್ಯರು: ${totalMembersCount.toLocaleString()} • ಹಾಜರಾದವರು: ${presentCount.toLocaleString()}`],
      [],
      [
        'ಕ್ರಮ ಸಂಖ್ಯೆ',
        'ಷೇರು ಸಂಖ್ಯೆ',
        'ಶೇರುದಾರರ ಹೆಸರು',
        'ಗ್ರಾಮ / ಸ್ಥಳ',
        'ವರ್ಗ (Category)',
        'ಹಾಜರಾತಿ ಸ್ಥಿತಿ',
        'ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No)',
        'ಕ್ರಮ ಸಂಖ್ಯೆ (Sl No)',
        'ದಾಖಲಾದ ವಿಧಾನ (Method)'
      ]
    ];

    filteredShareholders.forEach((item, idx) => {
      rows.push([
        idx + 1,
        `#${item.entity_id}`,
        item.name,
        item.department,
        item.category || 'ಅ - ವರ್ಗ',
        item.isPresent ? 'ಹಾಜರು (P)' : 'ಗೈರು (0)',
        item.bookNo,
        item.slNo,
        item.isScanned ? '📷 QR ಸ್ಕ್ಯಾನ್' : (item.bookNo !== '0' ? '📖 ಕೈಪಿಡಿ ಪುಸ್ತಕ' : '—')
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 8 }, { wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 14 },
      { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, `${agmName}_Attendance`);
    XLSX.writeFile(wb, `${agmName}_Manual_Book_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);

    if (typeof showToast === 'function') {
      showToast(`📊 ${agmName} ಎಕ್ಸೆಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!`, 'success');
    }
  };

  // Print Full Register for this AGM
  const handlePrintFullRegister = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${agmName} - ಹಾಜರಾತಿ ವಹಿ</title>
        <style>
          @page { size: A4 landscape; margin: 8mm 6mm; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 10px; color: #111; margin: 0; padding: 0; }
          .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 6px; margin-bottom: 8px; }
          .header h1 { margin: 0; font-size: 15px; font-weight: bold; color: #047857; }
          .header h2 { margin: 2px 0 0; font-size: 12px; color: #1e293b; }
          .header p { margin: 2px 0 0; font-size: 9px; color: #555; }
          table { width: 100%; border-collapse: collapse; text-align: center; margin-top: 6px; }
          th, td { border: 1px solid #777; padding: 4px 6px; font-size: 9.5px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; padding: 0 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204</h1>
          <h2>${agmLabelKn} ಕೈಪಿಡಿ ಪುಸ್ತಕ & ಸ್ಕ್ಯಾನ್ ಹಾಜರಾತಿ ವಹಿ</h2>
          <p>ದಿನಾಂಕ: ${agmConfig.date} | ಒಟ್ಟು ಸದಸ್ಯರು: ${filteredShareholders.length} | ಹಾಜರಾದವರು: ${presentCount}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">ಕ್ರ.ಸಂ</th>
              <th style="width: 55px;">ಷೇರು ನಂ</th>
              <th class="text-left">ಶೇರುದಾರರ ಹೆಸರು</th>
              <th class="text-left" style="width: 120px;">ಸ್ಥಳ / ಗ್ರಾಮ</th>
              <th style="width: 70px;">ವರ್ಗ</th>
              <th style="width: 60px;">ಹಾಜರಾತಿ</th>
              <th style="width: 80px;">ಪುಸ್ತಕ ನಂ (Book)</th>
              <th style="width: 80px;">ಕ್ರಮ ನಂ (Sl No)</th>
              <th style="width: 100px;">ವಿಧಾನ (Method)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredShareholders.slice(0, 500).map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="font-bold">#${item.entity_id}</td>
                <td class="text-left font-bold">${item.name}</td>
                <td class="text-left">${item.department}</td>
                <td>${item.category || 'ಅ - ವರ್ಗ'}</td>
                <td class="font-bold" style="color:${item.isPresent ? '#047857' : '#991b1b'};">${item.isPresent ? 'P (ಹಾಜರು)' : '0 (ಗೈರು)'}</td>
                <td class="font-bold">${item.bookNo}</td>
                <td class="font-bold">${item.slNo}</td>
                <td>${item.isScanned ? '📷 QR ಸ್ಕ್ಯಾನ್' : (item.bookNo !== '0' ? '📖 ಕೈಪಿಡಿ ಪುಸ್ತಕ' : '—')}</td>
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
      <div className="bg-slate-950 border-2 border-purple-500/70 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
        {/* 1. Header Banner Specific to this AGM */}
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-950 to-indigo-950/90 border-2 border-purple-500/50 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-400/50">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                    <span>{agmLabelKn}</span>
                  </h2>
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2.5 py-0.5 rounded-full font-bold">
                    ಕೈಪಿಡಿ ಪುಸ್ತಕ ನಮೂದು (Manual Book Entry)
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  ವರ್ಷ: <b className="text-white">{agmYear}</b> • ಈ ನಿರ್ದಿಷ್ಟ ಮಹಾಸಭೆಗೆ ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No) ಮತ್ತು ಕ್ರಮ ಸಂಖ್ಯೆ (Sl No) ನಮೂದಿಸಿ
                </p>
              </div>
            </div>

            {/* Action buttons: Batch, Excel, Print, Close */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-indigo-400/40"
                title="ಒಂದು ಪುಸ್ತಕದ ಶೇರುದಾರರಿಗೆ ಸಾಮೂಹಿಕವಾಗಿ ನಮೂದಿಸಿ ಮತ್ತು ಪ್ರಿಂಟ್ ಮಾಡಿ"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-200" />
                <span>ಪುಸ್ತಕ ಸಾಮೂಹಿಕ ನಮೂದು (Batch)</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-emerald-400/40"
                title="ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
              >
                <Download className="w-3.5 h-3.5 text-emerald-200" />
                <span>ಎಕ್ಸೆಲ್</span>
              </button>

              <button
                onClick={handlePrintFullRegister}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all shadow cursor-pointer border border-slate-700"
                title="A4 ಮುದ್ರಣ"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>ಮುದ್ರಿಸಿ</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
                title="ಮುಚ್ಚಿ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Stats Chips for this AGM */}
          <div className="grid grid-cols-3 gap-3 text-xs pt-3 mt-3 border-t border-purple-500/20">
            <div className="bg-slate-900/80 border border-purple-900/50 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-purple-300">ಒಟ್ಟು ಶೇರುದಾರರು</div>
                <div className="text-lg font-bold text-white font-mono">{totalMembersCount.toLocaleString()}</div>
              </div>
              <Award className="w-5 h-5 text-purple-400" />
            </div>

            <div className="bg-slate-900/80 border border-emerald-900/50 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-emerald-300">ಹಾಜರಾದವರು (Present)</div>
                <div className="text-lg font-bold text-emerald-300 font-mono">{presentCount.toLocaleString()}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">ಗೈರುಹಾಜರು (Absent)</div>
                <div className="text-lg font-bold text-slate-300 font-mono">{absentCount.toLocaleString()}</div>
              </div>
              <XCircle className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* 2. Fast Single-Entry Bar for this AGM */}
        <div className="bg-slate-900/95 border border-purple-500/40 rounded-2xl p-3.5 shadow-lg">
          <form onSubmit={handleQuickFormSubmit} className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{agmName} ತ್ವರಿತ ನಮೂದು:</span>
            </div>

            {/* Share Number Input */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-purple-400">
              <span className="text-slate-400 font-bold">ಷೇರು ನಂ:</span>
              <input
                id="particular-agm-quick-share-input"
                type="text"
                value={quickShareNo}
                onChange={(e) => setQuickShareNo(e.target.value)}
                placeholder="Ex: 118"
                className="w-20 bg-transparent text-emerald-400 font-mono font-bold outline-none text-xs"
              />
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
                placeholder="Ex: 12"
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
                placeholder="Ex: 1"
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
                {agmName} ಹಾಜರಾತಿ: <b className={processedShareholders.find(s => s.entity_id === matchedMember.entity_id)?.isPresent ? 'text-emerald-400' : 'text-slate-500'}>
                  {processedShareholders.find(s => s.entity_id === matchedMember.entity_id)?.isPresent ? 'P (ಹಾಜರು)' : '0 (ಗೈರು)'}
                </b>
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
              ಹಾಜರಾದವರು ({presentCount.toLocaleString()})
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

        {/* 4. Attendance Table for this Specific AGM */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[58vh]">
            <table className="w-full text-center text-xs border-collapse select-none">
              <thead className="sticky top-0 z-20 shadow-md bg-slate-900 border-b border-slate-700 text-slate-300 font-bold uppercase text-[10.5px]">
                <tr>
                  <th className="py-2.5 px-2 w-12 border-r border-slate-700">ಕ್ರ.ಸಂ</th>
                  <th className="py-2.5 px-3 w-24 border-r border-slate-700">ಷೇರು ನಂ</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-700 min-w-[180px]">ಶೇರುದಾರರ ಹೆಸರು</th>
                  <th className="py-2.5 px-2.5 text-left border-r border-slate-700 min-w-[120px]">ಸ್ಥಳ / ಗ್ರಾಮ</th>
                  <th className="py-2.5 px-2 w-20 border-r border-slate-700">ವರ್ಗ</th>
                  <th className="py-2.5 px-2 w-20 border-r border-slate-700 bg-purple-900/40 text-purple-200">
                    {agmName}<br/>ಹಾಜರಾತಿ
                  </th>
                  <th className="py-2.5 px-2 w-24 border-r border-slate-700 bg-purple-900/30 text-purple-200">
                    ಪುಸ್ತಕ ಸಂಖ್ಯೆ<br/>(Book No)
                  </th>
                  <th className="py-2.5 px-2 w-20 border-r border-slate-700 bg-purple-900/30 text-purple-200">
                    ಕ್ರಮ ಸಂಖ್ಯೆ<br/>(Sl No)
                  </th>
                  <th className="py-2.5 px-3 w-32">ದಾಖಲಾದ ವಿಧಾನ<br/>(Method)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paginatedList.map((item, rowIdx) => {
                  const globalIdx = (currentPage - 1) * pageSize + rowIdx + 1;
                  return (
                    <tr key={item.entity_id} className="hover:bg-slate-900/80 transition-colors">
                      <td className="py-2 px-2 border-r border-slate-800 text-slate-400 font-mono">
                        {globalIdx}
                      </td>

                      <td className="py-2 px-3 border-r border-slate-800 font-mono font-bold text-emerald-400">
                        {item.entity_id}
                      </td>

                      <td className="py-2 px-3 border-r border-slate-800 text-left font-medium text-slate-100">
                        <div className="truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </div>
                      </td>

                      <td className="py-2 px-2.5 border-r border-slate-800 text-left text-slate-300 truncate max-w-[120px]">
                        {item.department}
                      </td>

                      <td className="py-2 px-2 border-r border-slate-800">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-amber-300">
                          {item.category || 'ಅ - ವರ್ಗ'}
                        </span>
                      </td>

                      {/* Status Toggle P / 0 */}
                      <td className="py-1.5 px-2 border-r border-slate-800 bg-purple-950/20">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.entity_id)}
                          className={`w-7 h-7 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center justify-center mx-auto ${
                            item.isPresent
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                          title={`ಕ್ಲಿಕ್ ಮಾಡಿ ಸ್ಥಿತಿ ಬದಲಾಯಿಸಿ (${item.isPresent ? 'P' : '0'})`}
                        >
                          {item.status}
                        </button>
                      </td>

                      {/* Book No Input */}
                      <td className="py-1.5 px-2 border-r border-slate-800 bg-purple-950/20">
                        <input
                          type="text"
                          value={item.bookNo}
                          onChange={(e) => handleCellChange(item.entity_id, 'bookNo', e.target.value)}
                          className="w-16 text-center bg-slate-900/90 text-slate-100 font-mono font-bold py-1 px-1 rounded-md border border-slate-700/80 outline-none text-xs focus:ring-1 focus:ring-purple-400"
                          placeholder="0"
                        />
                      </td>

                      {/* Sl No Input */}
                      <td className="py-1.5 px-2 border-r border-slate-800 bg-purple-950/20">
                        <input
                          type="text"
                          value={item.slNo}
                          onChange={(e) => handleCellChange(item.entity_id, 'slNo', e.target.value)}
                          className="w-14 text-center bg-slate-900/90 text-slate-100 font-mono font-bold py-1 px-1 rounded-md border border-slate-700/80 outline-none text-xs focus:ring-1 focus:ring-purple-400"
                          placeholder="0"
                        />
                      </td>

                      {/* Method Chip */}
                      <td className="py-2 px-3">
                        {item.isScanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            <Camera className="w-3 h-3 text-emerald-400" />
                            <span>QR ಸ್ಕ್ಯಾನ್</span>
                          </span>
                        ) : item.bookNo !== '0' && item.isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                            <BookOpen className="w-3 h-3 text-purple-400" />
                            <span>ಕೈಪಿಡಿ ಪುಸ್ತಕ</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

        {/* 5. Batch Assignment Drawer / Modal for THIS AGM */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border-2 border-indigo-500/70 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{agmLabelKn} - ಪುಸ್ತಕ ಸಾಮೂಹಿಕ ನಮೂದು & ಮುದ್ರಣ</h3>
                    <p className="text-xs text-slate-400">
                      ಈ ಮಹಾಸಭೆಯ ಭೌತಿಕ ಪುಸ್ತಕದ ಸಂಖ್ಯೆ, ಶೇರುದಾರರ ಸಂಖ್ಯೆಗಳನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ಹಾಜರಾತಿ ಪಟ್ಟಿಯನ್ನು ಪ್ರಿಂಟ್ ಮಾಡಿ
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
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
                    <label className="block text-slate-400 font-bold mb-1">ಪ್ರಾರಂಭದ ಕ್ರಮ ಸಂಖ್ಯೆ (Start Sl No in Book):</label>
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

                {/* Live Preview Table of Matched Shareholders */}
                {batchResolvedList.length > 0 && (
                  <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{agmName} ನಮೂದಿಸಿದ ಶೇರುದಾರರ ಪಟ್ಟಿ:</span>
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

                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800">
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
                      title="ದಾಖಲಿಸಿ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರಿಂಟ್ ತೆರೆಯಿರಿ"
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
