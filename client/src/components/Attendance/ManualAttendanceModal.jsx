import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Download, Printer, Search, CheckCircle2,
  XCircle, X, ChevronLeft, ChevronRight, Award, BarChart3, ShieldCheck
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
    cellBg: 'bg-purple-50/40 dark:bg-purple-950/20'
  },
  {
    // Year 2 (2024-25 / 2019-20) - Soft Cyan/Sky
    headerBg: '#CFFAFE',
    headerText: '#164e63',
    subHeaderBg: '#E0F2FE',
    subHeaderText: '#0369a1',
    borderCol: 'border-cyan-300 dark:border-cyan-800',
    cellBg: 'bg-cyan-50/40 dark:bg-cyan-950/20'
  },
  {
    // Year 3 (2025-26 / 2020-21) - Peach/Apricot
    headerBg: '#FFEDD5',
    headerText: '#7c2d12',
    subHeaderBg: '#FEF3C7',
    subHeaderText: '#92400e',
    borderCol: 'border-amber-300 dark:border-amber-800',
    cellBg: 'bg-amber-50/40 dark:bg-amber-950/20'
  },
  {
    // Year 4 (2026-27 / 2021-22) - Soft Pink/Rose
    headerBg: '#FCE7F3',
    headerText: '#831843',
    subHeaderBg: '#FFE4E6',
    subHeaderText: '#9f1239',
    borderCol: 'border-pink-300 dark:border-pink-800',
    cellBg: 'bg-pink-50/40 dark:bg-pink-950/20'
  },
  {
    // Year 5 (2027-28 / 2022-23) - Light Slate/Grey
    headerBg: '#E2E8F0',
    headerText: '#1e293b',
    subHeaderBg: '#F1F5F9',
    subHeaderText: '#334155',
    borderCol: 'border-slate-300 dark:border-slate-700',
    cellBg: 'bg-slate-50/50 dark:bg-slate-900/30'
  }
];

const GRAND_TOTAL_THEME = {
  headerBg: '#FED7AA',
  headerText: '#7c2d12',
  borderCol: 'border-orange-400 dark:border-orange-800',
  cellBg: 'bg-amber-50/80 dark:bg-amber-950/30'
};

export default function ManualAttendanceModal({
  isOpen = true,
  onClose = () => {},
  masterShareholders = [],
  allAgmScansMap = new Map(),
  showToast = () => {}
}) {
  // Preset selector - Default is 2023-24 to 2027-28 (AGM 6 to AGM 10 - All 5 AGMs)
  const [selectedPresetKey, setSelectedPresetKey] = useState('CURRENT_2023_2028');
  const currentPreset = YEAR_PRESETS[selectedPresetKey] || YEAR_PRESETS.CURRENT_2023_2028;
  const activeYears = currentPreset.years;

  // Stored Manual Records Map: { [shareNo]: { [year]: { status: 'P'|'0', bookNo: '13', slNo: '36' } } }
  const [manualRecords] = useState(() => {
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

  // Compute full view items with attendance numbers and grand total (Read-Only consolidated data)
  const processedShareholders = useMemo(() => {
    return masterShareholders.map((m) => {
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
    let list = processedShareholders;

    // Filter mode
    if (filterMode === 'PRESENT') {
      list = list.filter(s => s.grandTotal > 0);
    } else if (filterMode === 'ELIGIBLE') {
      list = list.filter(s => s.isEligible);
    } else if (filterMode === 'ABSENT') {
      list = list.filter(s => s.grandTotal === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const idStr = String(s.entity_id || '').toLowerCase();
        const nameStr = String(s.name || '').toLowerCase();
        const villageStr = String(s.department || '').toLowerCase();
        const booksMatch = Object.values(s.yearData).some(yd =>
          (yd.bookNo && String(yd.bookNo).toLowerCase().includes(q)) ||
          (yd.slNo && String(yd.slNo).toLowerCase().includes(q))
        );
        return idStr.includes(q) || nameStr.includes(q) || villageStr.includes(q) || booksMatch;
      });
    }

    return list;
  }, [processedShareholders, filterMode, searchQuery]);

  // Summary counts
  const totalMembersCount = processedShareholders.length;
  const presentAnyCount = useMemo(() => processedShareholders.filter(s => s.grandTotal > 0).length, [processedShareholders]);
  const eligibleCount = useMemo(() => processedShareholders.filter(s => s.isEligible).length, [processedShareholders]);
  const absentCount = totalMembersCount - presentAnyCount;

  // Category breakdown of eligible voters
  const categoryStats = useMemo(() => {
    const stats = {
      'ಅ - ವರ್ಗ': { total: 0, eligible: 0 },
      'ಬ - ವರ್ಗ': { total: 0, eligible: 0 },
      'ಡ - ವರ್ಗ': { total: 0, eligible: 0 }
    };
    processedShareholders.forEach(s => {
      const cat = (s.category || 'ಅ - ವರ್ಗ').trim();
      if (!stats[cat]) stats[cat] = { total: 0, eligible: 0 };
      stats[cat].total += 1;
      if (s.isEligible) stats[cat].eligible += 1;
    });
    return stats;
  }, [processedShareholders]);

  // Pagination
  const totalPages = Math.ceil(filteredShareholders.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShareholders.slice(start, start + pageSize);
  }, [filteredShareholders, currentPage, pageSize]);

  // Export to Excel (Full 2-Tier Master Statutory Format)
  const handleExportExcel = () => {
    const rows = [];

    // Title Block
    rows.push(['ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204']);
    rows.push([`ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಸಂಯೋಜಿತ ಹಾಜರಾತಿ ವರದಿ (${currentPreset.name})`]);
    rows.push([`ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಒಟ್ಟು ಸದಸ್ಯರು: ${filteredShareholders.length} | ಚುನಾವಣಾ ಅರ್ಹರು (2+ AGMs): ${eligibleCount}`]);
    rows.push([]); // blank

    // Tier 1 Header
    const t1 = ['ಕ್ರ.ಸಂ', 'ಷೇರು ನಂ', 'ಶೇರುದಾರರ ಹೆಸರು', 'ಸ್ಥಳ / ಗ್ರಾಮ', 'ವರ್ಗ'];
    activeYears.forEach(yr => {
      t1.push(yr, '', '');
    });
    t1.push('Grand Total');
    rows.push(t1);

    // Tier 2 Header
    const t2 = ['', '', '', '', ''];
    activeYears.forEach(yr => {
      t2.push(yr, 'AGM Attendance Book No', 'Sl No');
    });
    t2.push('');
    rows.push(t2);

    // Data Rows
    filteredShareholders.forEach((item, idx) => {
      const row = [
        idx + 1,
        item.entity_id,
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
    const headerRowIdx = 4;
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

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Report');
    const filename = `Attendance_Report_${selectedPresetKey}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    if (typeof showToast === 'function') {
      showToast(`📊 5 ಮಹಾಸಭೆಗಳ ಸಂಯೋಜಿತ ವರದಿ ಎಕ್ಸೆಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!`, 'success');
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
        <title>ಹಾಜರಾತಿ ವರದಿ - ${currentPreset.name}</title>
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
          <h2>ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಸಂಯೋಜಿತ ಹಾಜರಾತಿ ವರದಿ (${currentPreset.name})</h2>
          <p>ದಿನಾಂಕ: ${new Date().toLocaleDateString('kn-IN')} | ಒಟ್ಟು ಸದಸ್ಯರು: ${filteredShareholders.length} | ಚುನಾವಣಾ ಅರ್ಹರು: ${eligibleCount}</p>
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
                <th class="y${idx}">ಹಾಜರು</th>
                <th class="y${idx}">Book No</th>
                <th class="y${idx}">Sl No</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredShareholders.slice(0, 500).map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="font-bold">${item.entity_id}</td>
                <td class="text-left font-bold">${item.name}</td>
                <td class="text-left">${item.department}</td>
                ${activeYears.map(yr => {
                  const yd = item.yearData[yr] || { status: '0', bookNo: '0', slNo: '0' };
                  return `
                    <td class="font-bold">${yd.status === 'P' ? '<span style="color:#047857;">P</span>' : '<span style="color:#888;">0</span>'}</td>
                    <td>${yd.bookNo && yd.bookNo !== '0' ? yd.bookNo : '—'}</td>
                    <td>${yd.slNo && yd.slNo !== '0' ? yd.slNo : '—'}</td>
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
        {/* 1. Header Banner & Preset Switcher (READ-ONLY REPORT) */}
        <div className="bg-gradient-to-r from-purple-950/90 via-slate-950 to-indigo-950/90 border-2 border-purple-500/50 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-400/50">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                    <span>📊 ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಸಂಯೋಜಿತ ಹಾಜರಾತಿ ವರದಿ (Consolidated 5-AGMs Report)</span>
                  </h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ಅಧಿಕೃತ ವರದಿ (Report Only)</span>
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  ಕೈಪಿಡಿ ಪುಸ್ತಕ ಹಾಗೂ QR ಸ್ಕ್ಯಾನರ್ ಮೂಲಕ ದಾಖಲಾದ ಎಲ್ಲಾ 5 ಮಹಾಸಭೆಗಳ ಅಧಿಕೃತ ಸಮಗ್ರ ವರದಿ (ಓದಲು ಮಾತ್ರ)
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

            {/* Action buttons: Excel, Print, Close */}
            <div className="flex flex-wrap items-center gap-2">
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

            <div className="bg-slate-900/80 border border-amber-900/50 p-2.5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-amber-300">ಚುನಾವಣಾ ಅರ್ಹರು (2+ AGMs)</div>
                  <div className="text-lg font-bold text-amber-300 font-mono">{eligibleCount.toLocaleString()}</div>
                </div>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-amber-900/40 text-[10px]">
                <span className="text-slate-400">ವರ್ಗ:</span>
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1 rounded font-mono font-bold" title="ಅ - ವರ್ಗ (ಕಬ್ಬು ಬೆಳೆಗಾರರು)">
                  ಅ: {categoryStats['ಅ - ವರ್ಗ']?.eligible || 0}
                </span>
                <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1 rounded font-mono font-bold" title="ಬ - ವರ್ಗ (ಸಹಕಾರಿ ಸಂಘಗಳು)">
                  ಬ: {categoryStats['ಬ - ವರ್ಗ']?.eligible || 0}
                </span>
                <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1 rounded font-mono font-bold" title="ಡ - ವರ್ಗ (ಬೆಳೆಗಾರರಲ್ಲದವರು)">
                  ಡ: {categoryStats['ಡ - ವರ್ಗ']?.eligible || 0}
                </span>
              </div>
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

        {/* 2. Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 mr-1">ಫಿಲ್ಟರ್:</span>
            <button
              onClick={() => { setFilterMode('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'ALL' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
            <div className="relative min-w-[280px]">
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

        {/* 3. The Statutory 2-Tier Master Table (READ-ONLY REPORT) */}
        <div className="rounded-2xl border-2 border-slate-800 overflow-hidden bg-slate-950/80 shadow-2xl">
          <div className="overflow-x-auto max-h-[58vh]">
            <table className="w-full text-xs text-center border-collapse select-none">
              {/* TIER 1 HEADER */}
              <thead className="sticky top-0 z-20 shadow-md">
                <tr className="border-b border-slate-800 text-[11px] font-bold">
                  {/* Fixed Columns */}
                  <th
                    rowSpan={2}
                    className="py-2.5 px-2 bg-slate-900 text-slate-300 border-r border-slate-800 w-12 sticky left-0 z-30"
                  >
                    ಕ್ರ.ಸಂ
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 bg-slate-900 text-slate-200 border-r border-slate-800 w-24 sticky left-12 z-30"
                  >
                    ಷೇರು ನಂ
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 bg-slate-900 text-slate-200 border-r border-slate-800 min-w-[200px] text-left sticky left-36 z-30"
                  >
                    ಶೇರುದಾರರ ಹೆಸರು
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-2.5 bg-slate-900 text-slate-300 border-r border-slate-800 min-w-[120px] text-left"
                  >
                    ಸ್ಥಳ / ಗ್ರಾಮ
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-2 bg-slate-900 text-slate-300 border-r border-slate-800 w-16"
                  >
                    ವರ್ಗ
                  </th>

                  {/* Year Group Super-Headers */}
                  {activeYears.map((yr, idx) => {
                    const theme = YEAR_THEMES[idx] || YEAR_THEMES[0];
                    const agmLabel = currentPreset.yearAgmMap?.[yr] || yr;
                    return (
                      <th
                        key={yr}
                        colSpan={3}
                        style={{ backgroundColor: theme.headerBg, color: theme.headerText }}
                        className="py-2 px-2 border-r border-slate-900 font-extrabold text-xs tracking-wider"
                      >
                        {yr}
                        <span className="block text-[10px] font-bold opacity-80">({agmLabel})</span>
                      </th>
                    );
                  })}

                  {/* Grand Total Super-Header */}
                  <th
                    rowSpan={2}
                    style={{ backgroundColor: GRAND_TOTAL_THEME.headerBg, color: GRAND_TOTAL_THEME.headerText }}
                    className="py-2.5 px-3 font-extrabold text-xs tracking-wider border-l border-orange-500 w-24 sticky right-0 z-30 shadow-md"
                  >
                    GRAND TOTAL
                    <span className="block text-[9.5px] font-semibold opacity-80">(ಹಾಜರಾತಿ ಮೊತ್ತ)</span>
                  </th>
                </tr>

                {/* TIER 2 SUB-HEADERS */}
                <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                  {activeYears.map((yr, idx) => {
                    const theme = YEAR_THEMES[idx] || YEAR_THEMES[0];
                    return (
                      <React.Fragment key={`${yr}_sub`}>
                        <th
                          style={{ backgroundColor: theme.subHeaderBg, color: theme.subHeaderText }}
                          className="py-1.5 px-1.5 border-r border-slate-700/60 w-16"
                          title="ಹಾಜರಾತಿ ಸ್ಥಿತಿ (Present 'P' / Absent '0')"
                        >
                          {yr}
                        </th>
                        <th
                          style={{ backgroundColor: theme.subHeaderBg, color: theme.subHeaderText }}
                          className="py-1.5 px-2 border-r border-slate-700/60 min-w-[95px]"
                          title="ಕೈಪಿಡಿ ಹಾಜರಾತಿ ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No)"
                        >
                          AGM Attendance Book No
                        </th>
                        <th
                          style={{ backgroundColor: theme.subHeaderBg, color: theme.subHeaderText }}
                          className="py-1.5 px-1.5 border-r border-slate-900 w-16"
                          title="ಪುಸ್ತಕದಲ್ಲಿನ ಕ್ರಮ ಸಂಖ್ಯೆ (Sl No in Book)"
                        >
                          Sl No
                        </th>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              {/* TABLE BODY (READ-ONLY) */}
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

                      {/* Year Groups Sub-cells (READ-ONLY) */}
                      {activeYears.map((yr, idx) => {
                        const yd = item.yearData[yr] || { status: '0', bookNo: '0', slNo: '0', isScanned: false };
                        const theme = YEAR_THEMES[idx] || YEAR_THEMES[0];
                        const isPresent = yd.status === 'P';

                        return (
                          <React.Fragment key={`${item.entity_id}_${yr}`}>
                            {/* 1. Status P / 0 Badge (Read-Only) */}
                            <td className={`py-1.5 px-1 border-r border-slate-800/80 ${theme.cellBg}`}>
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-xs select-none ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                    : 'bg-slate-800/60 text-slate-500'
                                }`}
                                title={yd.isScanned ? '📷 QR ಸ್ಕ್ಯಾನರ್ ಮೂಲಕ ದಾಖಲಾಗಿದೆ' : (isPresent ? 'ಹಾಜರು (Present)' : 'ಗೈರು (Absent)')}
                              >
                                {yd.status}
                              </span>
                            </td>

                            {/* 2. AGM Attendance Book No Display (Read-Only) */}
                            <td className={`py-1.5 px-1 border-r border-slate-800/80 text-center font-mono font-bold text-xs ${theme.cellBg} ${yd.bookNo && yd.bookNo !== '0' ? 'text-amber-300' : 'text-slate-500'}`}>
                              {yd.bookNo && yd.bookNo !== '0' ? yd.bookNo : '—'}
                            </td>

                            {/* 3. Sl No in Book Display (Read-Only) */}
                            <td className={`py-1.5 px-1 border-r border-slate-800 text-center font-mono font-bold text-xs ${theme.cellBg} ${yd.slNo && yd.slNo !== '0' ? 'text-slate-200' : 'text-slate-500'}`}>
                              {yd.slNo && yd.slNo !== '0' ? yd.slNo : '—'}
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

                {paginatedList.length === 0 && (
                  <tr>
                    <td colSpan={6 + activeYears.length * 3} className="py-12 text-center text-slate-500 text-sm">
                      ಯಾವುದೇ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ (No shareholders found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Pagination Bar */}
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
      </div>
    </div>
  );
}
