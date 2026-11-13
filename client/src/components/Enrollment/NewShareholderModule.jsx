import LoadingAnimation from '../Common/LoadingAnimation';
import TableScrollerContainer from '../Common/TableScrollerContainer';
import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { RealtimeSyncService } from '../../services/realtimeSync';
import { useAuth } from '../../context/AuthContext';
import NewShareholderModal from './NewShareholderModal';
import OfficeNotePrintModal from './OfficeNotePrintModal';
import RegisterListPrintModal from '../Common/RegisterListPrintModal';
import EnrollmentDocxExportModal from './EnrollmentDocxExportModal';
import * as XLSX from 'xlsx';
import {
  Coins, Search, Plus, FileText, Download, Upload, Printer, RefreshCw,
  FileSpreadsheet, Filter, CheckCircle2, AlertCircle, Eye,
  Trash2, Edit, ChevronLeft, ChevronRight, UserPlus, Stamp,
  ArrowRight, ShieldCheck, X, Building2, MapPin, Receipt, Hash
} from 'lucide-react';

export default function NewShareholderModule() {
  const { showToast, user } = useAuth();
  const fileInputRef = useRef(null);

  // Data states
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    totalShares: 0,
    totalShareCapital: 0,
    totalAdmissionFees: 0,
    totalAmountCollected: 0,
    boardApprovedCount: 0,
    sharesIssuedCount: 0
  });

  // Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 20;

  // Modal & Printing states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('register'); // 'register' | 'approve' | 'all'
  const [editingRecord, setEditingRecord] = useState(null);
  const [printingRecord, setPrintingRecord] = useState(null);
  const [officeNoteRecord, setOfficeNoteRecord] = useState(null);
  // Multi-Selection & List Print states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedHoldersMap, setSelectedHoldersMap] = useState(new Map());
  const [selectedPrintRecords, setSelectedPrintRecords] = useState([]);
  const [listPrintModalOpen, setListPrintModalOpen] = useState(false);
  const [listPrintInitialScope, setListPrintInitialScope] = useState('filtered');
  const [docxModalOpen, setDocxModalOpen] = useState(false);
  const [docxInitialScope, setDocxInitialScope] = useState('filtered');
  const [isPreparingDocx, setIsPreparingDocx] = useState(false);

  const toggleSelectAllCurrentPage = () => {
    const allSelected = enrollments.length > 0 && enrollments.every(e => selectedIds.has(e.id));
    const newSet = new Set(selectedIds);
    const newMap = new Map(selectedHoldersMap);
    if (allSelected) {
      enrollments.forEach(e => {
        newSet.delete(e.id);
        newMap.delete(e.id);
      });
    } else {
      enrollments.forEach(e => {
        newSet.add(e.id);
        newMap.set(e.id, e);
      });
    }
    setSelectedIds(newSet);
    setSelectedHoldersMap(newMap);
  };

  const toggleSelectRow = (itemOrId) => {
    const id = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId.id : itemOrId;
    const item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : enrollments.find(e => e.id === id);

    const newSet = new Set(selectedIds);
    const newMap = new Map(selectedHoldersMap);

    if (newSet.has(id)) {
      newSet.delete(id);
      newMap.delete(id);
    } else {
      newSet.add(id);
      if (item) newMap.set(id, item);
    }
    setSelectedIds(newSet);
    setSelectedHoldersMap(newMap);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectedHoldersMap(new Map());
    setSelectedPrintRecords([]);
  };

  const selectAllFiltered = async () => {
    try {
      const res = await ApiService.getEnrollments({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
        page: 1,
        limit: 99999
      });
      if (res && res.success && Array.isArray(res.data)) {
        const newSet = new Set(res.data.map(e => e.id));
        const newMap = new Map();
        res.data.forEach(e => newMap.set(e.id, e));
        setSelectedIds(newSet);
        setSelectedHoldersMap(newMap);
        showToast(`ಎಲ್ಲಾ ${res.data.length} ಶೋಧಿತ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ`);
      }
    } catch (err) {
      showToast('ಆಯ್ಕೆ ಮಾಡಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ: ' + err.message, 'error');
    }
  };

  const [allPrintRecords, setAllPrintRecords] = useState([]);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  // Helper to ensure both filtered list and full selected records are loaded
  const prepareRecordsForExport = async () => {
    let fullList = [];
    try {
      const allRes = await ApiService.getEnrollments({ page: 1, limit: 99999 });
      if (allRes && allRes.success && Array.isArray(allRes.data)) {
        fullList = allRes.data;
      }
    } catch (e) {
      console.warn('Failed to fetch full enrollments:', e);
    }
    if (fullList.length === 0) {
      fullList = enrollments;
    }

    let filteredList = fullList;
    const hasFilter = Boolean(searchTerm || (categoryFilter && categoryFilter !== 'All') || (statusFilter && statusFilter !== 'All'));
    if (hasFilter) {
      try {
        const filteredRes = await ApiService.getEnrollments({
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
          page: 1,
          limit: 99999
        });
        if (filteredRes && filteredRes.success && Array.isArray(filteredRes.data)) {
          filteredList = filteredRes.data;
        }
      } catch (e) {
        console.warn('Failed to fetch filtered enrollments:', e);
      }
    }

    const isIdSelected = (r) => {
      if (!selectedIds || selectedIds.size === 0) return false;
      const rawId = r.id !== undefined ? r.id : r.enrollment_id;
      const strId = String(rawId);
      const numId = Number(rawId);
      const enrId = r.enrollment_id ? String(r.enrollment_id) : '';
      return selectedIds.has(rawId) ||
             selectedIds.has(strId) ||
             (!isNaN(numId) && selectedIds.has(numId)) ||
             (enrId && selectedIds.has(enrId));
    };

    let selectedList = fullList.filter(isIdSelected);

    if (selectedHoldersMap && selectedHoldersMap.size > 0) {
      selectedHoldersMap.forEach((holder, id) => {
        if (!selectedList.some(r => r.id === id || r.enrollment_id === id)) {
          selectedList.push(holder);
        }
      });
    }

    enrollments.forEach(e => {
      if (isIdSelected(e) && !selectedList.some(r => r.id === e.id || r.enrollment_id === e.enrollment_id)) {
        selectedList.push(e);
      }
    });

    return { filteredList, selectedList };
  };

  const handleOpenListPrint = async (targetScope = 'filtered') => {
    if (targetScope === 'selected' && selectedIds.size === 0) {
      showToast('ದಯವಿಟ್ಟು ಮೊದಲು ಮುದ್ರಿಸಲು ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ (Please select holders first)', 'warning');
      return;
    }
    setListPrintInitialScope(targetScope);
    setIsPreparingPrint(true);
    try {
      const { filteredList, selectedList } = await prepareRecordsForExport();
      setAllPrintRecords(filteredList);
      setSelectedPrintRecords(selectedList);
      setListPrintModalOpen(true);
    } catch (e) {
      console.error(e);
      setAllPrintRecords(enrollments);
      setSelectedPrintRecords(enrollments.filter(e => selectedIds.has(e.id)));
      setListPrintModalOpen(true);
    } finally {
      setIsPreparingPrint(false);
    }
  };

  const handleOpenDocxExport = async (targetScope = 'filtered') => {
    if (targetScope === 'selected' && selectedIds.size === 0) {
      showToast('ದಯವಿಟ್ಟು ಮೊದಲು ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ (Please select holders first)', 'warning');
      return;
    }
    setDocxInitialScope(targetScope);
    setIsPreparingDocx(true);
    try {
      const { filteredList, selectedList } = await prepareRecordsForExport();
      setAllPrintRecords(filteredList);
      setSelectedPrintRecords(selectedList);
      setDocxModalOpen(true);
    } catch (e) {
      console.error(e);
      setAllPrintRecords(enrollments);
      setSelectedPrintRecords(enrollments.filter(e => selectedIds.has(e.id)));
      setDocxModalOpen(true);
    } finally {
      setIsPreparingDocx(false);
    }
  };


  useEffect(() => {
    loadEnrollments();
  }, [page, searchTerm, categoryFilter, statusFilter]);

  // Real-time synchronization across all tabs, windows, and browsers
  useEffect(() => {
    const unsubscribe = RealtimeSyncService.subscribe('enrollments', () => {
      loadEnrollments(true);
    });
    return () => {
      unsubscribe();
    };
  }, [page, searchTerm, categoryFilter, statusFilter]);

  const loadEnrollments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const cleanSearch = (searchTerm || '').trim();
      const rawTokens = cleanSearch ? cleanSearch.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean) : [];
      const hasDelimiter = /[,;]/.test(cleanSearch);
      const isAllShareTokens = rawTokens.length > 0 && rawTokens.every(t => /^[#\$\w\-\.]*\d+$/i.test(t));
      const isMultiQuery = (hasDelimiter && isAllShareTokens) || (rawTokens.length > 1 && isAllShareTokens) || (rawTokens.length === 1 && (rawTokens[0].startsWith('#') || hasDelimiter));

      const res = await ApiService.getEnrollments({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
        page,
        limit
      });
      if (res && res.success) {
        setEnrollments(res.data);
        setTotalPages(res.totalPages);
        setTotalRecords(res.total);
        if (res.stats) setStats(res.stats);

        // If multi-number search, automatically select all matched records for instant printing / export!
        if (isMultiQuery && res.data.length > 0) {
          const newSet = new Set(res.data.map(e => e.id));
          const newMap = new Map();
          res.data.forEach(e => newMap.set(e.id, e));
          setSelectedIds(newSet);
          setSelectedHoldersMap(newMap);
        }
      }
    } catch (err) {
      if (!silent) showToast('Error loading enrollments: ' + err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (window.confirm(`ಖಂಡಿತವಾಗಿ "${name}" ಅವರ ನೋಂದಣಿ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ?`)) {
      const res = await ApiService.deleteEnrollment(id);
      if (res && res.success) {
        showToast('ದಾಖಲೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ');
        loadEnrollments();
      } else {
        showToast('ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
      }
    }
  };



  // Export to Excel with exact 15 statutory columns
  const handleExportExcel = () => {
    if (enrollments.length === 0) {
      showToast('ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ', 'error');
      return;
    }

    const exportRows = enrollments.map((item, idx) => ({
      'Sl No': item.sl_no || (idx + 1),
      'Date': item.date || '',
      'Full Name': item.full_name || '',
      'Place': item.place || '',
      'Taluk': item.taluk || '',
      'Dist': item.dist || '',
      'Share amount': Number(item.share_amount || 0),
      'Admission Fee': Number(item.admission_fee || 0),
      'Total Amount': Number(item.total_amount || 0),
      'Reciept No': item.receipt_no || '',
      'No. Shares': Number(item.no_shares || 1),
      'Category': item.category || 'ಅ ವರ್ಗ',
      'Tharava Date': item.tharava_date || '',
      'Tharava No': item.tharava_no || '',
      'Share No': item.share_no || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);

    // Auto column widths
    const colWidths = [
      { wch: 8 },  // Sl No
      { wch: 12 }, // Date
      { wch: 28 }, // Full Name
      { wch: 16 }, // Place
      { wch: 14 }, // Taluk
      { wch: 14 }, // Dist
      { wch: 14 }, // Share amount
      { wch: 14 }, // Admission Fee
      { wch: 14 }, // Total Amount
      { wch: 12 }, // Reciept No
      { wch: 12 }, // No. Shares
      { wch: 12 }, // Category
      { wch: 14 }, // Tharava Date
      { wch: 14 }, // Tharava No
      { wch: 12 }, // Share No
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'New_Shareholders');
    XLSX.writeFile(wb, `New_Shareholders_Enrollment_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('15 ಕಾಲಂಗಳ ಅಧಿಕೃತ ಎಕ್ಸೆಲ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
  };

  // Import from Excel (15 Columns Mapping)
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const rawJson = XLSX.utils.sheet_to_json(wb.Sheets[wsName]);

        if (!rawJson || rawJson.length === 0) {
          showToast('ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಲ್ಲಿ ಯಾವುದೇ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ', 'error');
          return;
        }

        const mappedRecords = rawJson.map((row, idx) => {
          // Normalize column headers
          const getVal = (possibleHeaders) => {
            for (const h of possibleHeaders) {
              for (const key of Object.keys(row)) {
                if (key.trim().toLowerCase() === h.trim().toLowerCase()) {
                  return row[key];
                }
              }
            }
            return '';
          };

          const noShares = parseInt(getVal(['No. Shares', 'No. of Shares', 'No. Shar', 'Shares', 'ಶೇರು'])) || 1;
          const shareAmt = parseFloat(getVal(['Share amount', 'Share Amount', 'Amount', 'ಶೇರು ಮೊತ್ತ'])) || (noShares * 24000);
          const fee = parseFloat(getVal(['Admission Fee', 'Admission on Fee', 'Fee', 'ಪ್ರವೇಶ ಶುಲ್ಕ'])) || (noShares * 570);
          const totalAmt = parseFloat(getVal(['Total Amount', 'Total', 'ಒಟ್ಟು'])) || (shareAmt + fee);

          return {
            sl_no: parseInt(getVal(['Sl No', 'Sl. No', 'Sl. No.', 'ಕ್ರಮ ಸಂಖ್ಯೆ'])) || (idx + 1),
            date: String(getVal(['Date', 'ದಿನಾಂಕ']) || ''),
            full_name: String(getVal(['Full Name', 'Name', 'Shareholder Name', 'ಹೆಸರು']) || ''),
            place: String(getVal(['Place', 'Village', 'ಸ್ಥಳ', 'ಊರು']) || ''),
            taluk: String(getVal(['Taluk', 'ತಾಲೂಕು']) || 'ಚಡಚಣ'),
            dist: String(getVal(['Dist', 'District', 'ಜಿಲ್ಲೆ']) || 'ವಿಜಯಪುರ'),
            share_amount: shareAmt,
            admission_fee: fee,
            total_amount: totalAmt,
            receipt_no: String(getVal(['Reciept No', 'Receipt No', 'ರಶೀದಿ']) || ''),
            no_shares: noShares,
            category: String(getVal(['Category', 'ವರ್ಗ']) || 'ಅ ವರ್ಗ'),
            tharava_date: String(getVal(['Tharava Date', 'ಠರಾವು ದಿನಾಂಕ']) || ''),
            tharava_no: String(getVal(['Tharava No', 'ಠರಾವು ಸಂಖ್ಯೆ']) || ''),
            share_no: String(getVal(['Share No', 'ಶೇರು ಸಂಖ್ಯೆ']) || '')
          };
        }).filter(r => r.full_name);

        if (mappedRecords.length === 0) {
          showToast('ಮಾನ್ಯವಾದ ಶೇರುದಾರರ ಹೆಸರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ', 'error');
          return;
        }

        const res = await ApiService.addEnrollmentsBulk(mappedRecords);
        if (res && res.success) {
          showToast(`${res.count} ಹೊಸ ಶೇರುದಾರರ ದಾಖಲೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಆಮದು ಮಾಡಿಕೊಳ್ಳಲಾಗಿದೆ!`);
          loadEnrollments();
        } else {
          showToast('ಆಮದು ವಿಫಲವಾಗಿದೆ', 'error');
        }
      } catch (err) {
        showToast('ಎಕ್ಸೆಲ್ ಓದುವಲ್ಲಿ ದೋಷ: ' + err.message, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title & Stats Banner */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-400" />
              <span>ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ (New Shareholder Enrollment)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ಕಾರ್ಖಾನೆ ಠರಾವು, ₹24,000 ಶೇರು ಮೊತ್ತ, ₹570 ಪ್ರವೇಶ ಶುಲ್ಕ ಹಾಗೂ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಂಚಿಕೆ ರಿಜಿಸ್ಟರ್
          </p>
        </div>

        {/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          {/* File input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer shadow-sm"
            title="ಹೊರಗಿನ ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಿಂದ ಆಮದು ಮಾಡಿಕೊಳ್ಳಿ"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer shadow-sm"
            title="15 ಕಾಲಂಗಳ ಎಕ್ಸೆಲ್ ರಫ್ತು"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್
          </button>

          <button
            onClick={() => handleOpenListPrint('filtered')}
            disabled={isPreparingPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer shadow-sm"
            title="ಪ್ರಸ್ತುತ ಶೋಧಿತ ಅಥವಾ ಆಯ್ದ ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ ಮುದ್ರಿಸಿ"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>{isPreparingPrint ? 'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : 'ಪಟ್ಟಿಯನ್ನು ಮುದ್ರಿಸಿ (Print List)'}</span>
          </button>

          <button
            onClick={() => handleOpenDocxExport('filtered')}
            disabled={isPreparingDocx}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-950/70 hover:bg-blue-900/90 text-blue-200 rounded-xl text-xs font-semibold transition-colors border border-blue-700/80 cursor-pointer shadow-sm"
            title="ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ Word (.docx) ಫೈಲ್ ಡೌನ್‌ಲೋಡ್"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>{isPreparingDocx ? 'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : 'Word (.docx) ಡೌನ್‌ಲೋಡ್'}</span>
          </button>

          <button
            onClick={() => {
              setEditingRecord(null);
              setModalMode('register');
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ಹೊಸ ನೋಂದಣಿ (New Enrollment)
          </button>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Enrolled */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">ಒಟ್ಟು ನೋಂದಣಿ (Enrolled Members)</div>
            <div className="text-xl font-extrabold text-slate-100 mt-1">{stats.totalEnrolled.toLocaleString()} ಸದಸ್ಯರು</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">{stats.totalShares.toLocaleString()} ಒಟ್ಟು ಶೇರುಗಳು</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Share Capital */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">ಒಟ್ಟು ಶೇರು ಬಂಡವಾಳ (Share Capital)</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">₹ {stats.totalShareCapital.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">₹24,000 / ಶೇರು ಪ್ರಮಾಣ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Admission Fees Collected */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">ಪ್ರವೇಶ ಶುಲ್ಕ (Admission Fees)</div>
            <div className="text-xl font-extrabold text-teal-400 mt-1">₹ {stats.totalAdmissionFees.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">₹570 / ಶೇರು ಶುಲ್ಕ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Amount Collected */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ (Total Collected)</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">₹ {stats.totalAmountCollected.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stats.boardApprovedCount} ಠರಾವು ಮಂಜೂರಾಗಿದೆ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search with exact share/receipt match */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="ಹುಡುಕಿ (ಷೇರು ನಂ, ರಶೀದಿ: 12, #2659, 18009... ಅಥವಾ ಹೆಸರು, ಊರು)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="All">ಎಲ್ಲ ವರ್ಗಗಳು (All Categories)</option>
              <option value="ಅ ವರ್ಗ">ಅ - ವರ್ಗ : ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Class A)</option>
              <option value="ಬ ವರ್ಗ">ಬ - ವರ್ಗ : ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ (Class B)</option>
              <option value="ಕ ವರ್ಗ">ಕ - ವರ್ಗ (Class C)</option>
              <option value="ಡ ವರ್ಗ">ಡ - ವರ್ಗ : ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ (Class D)</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {['All', 'Application Submitted', 'Approved', 'Issued'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'All' ? 'ಎಲ್ಲಾ' : st === 'Application Submitted' ? 'ಅರ್ಜಿ' : st === 'Approved' ? 'ಠರಾವು' : 'ವಿತರಿಸಲಾಗಿದೆ'}
              </button>
            ))}
          </div>

          <button
            onClick={loadEnrollments}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
            title="ರಿಫ್ರೆಶ್"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

            {/* Selected Holders Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow">
              {selectedIds.size}
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-200">
                {selectedIds.size} ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ ({selectedIds.size} Holders Selected)
              </span>
              {totalRecords > enrollments.length && selectedIds.size < totalRecords && (
                <button
                  onClick={selectAllFiltered}
                  className="text-[11px] text-emerald-400 hover:text-emerald-200 underline cursor-pointer ml-2"
                >
                  ಎಲ್ಲಾ {totalRecords} ಶೋಧಿತ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenListPrint('selected')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ಆಯ್ದವರ ಮುದ್ರಣ ({selectedIds.size})</span>
            </button>
            <button
              onClick={() => handleOpenDocxExport('selected')}
              disabled={isPreparingDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              title="ಆಯ್ದ ಶೇರುದಾರರ Word (.docx) ಡೌನ್‌ಲೋಡ್"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ಆಯ್ದವರ Word (.docx) ({selectedIds.size})</span>
            </button>
            <button
              onClick={clearSelection}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              ಆಯ್ಕೆ ತೆರವು (Clear)
            </button>
          </div>
        </div>
      )}

      {/* Multi-Receipt / Share Search Notification Banner */}
      {(() => {
        const cleanSearch = (searchTerm || '').trim();
        const rawTokens = cleanSearch ? cleanSearch.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean) : [];
        if (rawTokens.length <= 1) return null;

        return (
          <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-2xl p-3 text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-fadeIn">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <span className="text-base">🎯</span>
                <span>
                  ನಿಖರ ರಶೀದಿ / ಷೇರು ಸಂಖ್ಯೆ ಹೊಂದಾಣಿಕೆ (Exact Receipt / Share Match):{' '}
                  <span className="font-mono text-emerald-400 text-sm">{enrollments.length}</span> / {rawTokens.length} ಸದಸ್ಯರು ಕಂಡುಬಂದಿದ್ದಾರೆ
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                ನಮೂದಿಸಿದ ಸಂಖ್ಯೆಗಳ ({rawTokens.join(', ')}) ಎಲ್ಲಾ ಸದಸ್ಯರನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ ({selectedIds.size} Enrolled Members Selected).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const newSet = new Set(enrollments.map(e => e.id));
                  const newMap = new Map();
                  enrollments.forEach(e => newMap.set(e.id, e));
                  setSelectedIds(newSet);
                  setSelectedHoldersMap(newMap);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm"
              >
                ✓ ಎಲ್ಲರನ್ನೂ ಆಯ್ಕೆಮಾಡಿ ({enrollments.length})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer transition-all"
              >
                ✕ ತೆರವುಗೊಳಿಸಿ
              </button>
            </div>
          </div>
        );
      })()}

      {/* 15-Column Statutory Register Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <TableScrollerContainer label="15 ಕಾಲಂಗಳ ನೋಂದಣಿ ವಹಿ (Scroll Register):">
          <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
            {/* 15 Official Table Headers matching the user's Excel sheet */}
            <thead className="bg-[#608b34] text-white font-bold text-[11px] border-b border-[#4d7228] sticky top-0 z-10 select-none">
              <tr>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center w-10">
                  <input
                    type="checkbox"
                    checked={enrollments.length > 0 && enrollments.every(e => selectedIds.has(e.id))}
                    onChange={toggleSelectAllCurrentPage}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    title="ಪ್ರಸ್ತುತ ಪುಟದ ಎಲ್ಲಾ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ (Select All on this page)"
                  />
                </th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">Sl No</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50">Date</th>
                <th className="px-4 py-3 border-r border-[#4d7228]/50">Full Name</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50">Place</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50">Taluk</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50">Dist</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-right">Share amount</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-right">Admission Fee</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-right">Total Amount</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">Reciept No</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">No. Shares</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">Category</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">Tharava Date</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">Tharava No</th>
                <th className="px-3 py-3 border-r border-[#4d7228]/50 text-center">Share No</th>
                <th className="px-4 py-3 text-center no-print">ಕಾರ್ಯಗಳು (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="18" className="py-12">
                    <LoadingAnimation
                      variant="card"
                      message="ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
                      subMessage="Loading New Shareholder Enrollment Roster..."
                    />
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan="18" className="py-12 text-center text-slate-500">
                    ಯಾವುದೇ ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. "+ ಹೊಸ ನೋಂದಣಿ" ಬಟನ್ ಒತ್ತಿ ದಾಖಲಿಸಿ.
                  </td>
                </tr>
              ) : (
                enrollments.map((item, idx) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                  <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500' : 'hover:bg-slate-900/60'}`}>
                    {/* 0. Row Checkbox */}
                    <td className="px-3 py-2.5 text-center border-r border-slate-800/60 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(item)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* 1. Sl No */}
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400 border-r border-slate-800/60">
                      {item.sl_no || (idx + 1)}
                    </td>

                    {/* 2. Date */}
                    <td className="px-3 py-2.5 font-mono text-slate-300 border-r border-slate-800/60">
                      {item.date || '—'}
                    </td>

                    {/* 3. Full Name */}
                    <td className="px-4 py-2.5 font-semibold text-slate-100 border-r border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {item.photo && (
                          <img src={item.photo} alt="Photo" className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0" />
                        )}
                        <span>{item.full_name}</span>
                      </div>
                    </td>

                    {/* 4. Place */}
                    <td className="px-3 py-2.5 text-emerald-300 font-medium border-r border-slate-800/60">
                      {item.place || '—'}
                    </td>

                    {/* 5. Taluk */}
                    <td className="px-3 py-2.5 text-slate-300 border-r border-slate-800/60">
                      {item.taluk || '—'}
                    </td>

                    {/* 6. Dist */}
                    <td className="px-3 py-2.5 text-slate-300 border-r border-slate-800/60">
                      {item.dist || '—'}
                    </td>

                    {/* 7. Share amount */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-400 border-r border-slate-800/60">
                      {Number(item.share_amount || 0).toLocaleString()}
                    </td>

                    {/* 8. Admission Fee */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-teal-400 border-r border-slate-800/60">
                      {Number(item.admission_fee || 0).toLocaleString()}
                    </td>

                    {/* 9. Total Amount */}
                    <td className="px-3 py-2.5 text-right font-mono font-extrabold text-emerald-300 bg-emerald-950/20 border-r border-slate-800/60">
                      {Number(item.total_amount || 0).toLocaleString()}
                    </td>

                    {/* 10. Reciept No */}
                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-slate-200 border-r border-slate-800/60">
                      {item.receipt_no ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700">
                          {item.receipt_no}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 11. No. Shares */}
                    <td className="px-3 py-2.5 text-center font-bold text-slate-100 border-r border-slate-800/60">
                      <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-900 border border-slate-700">
                        {item.no_shares || 1}
                      </span>
                    </td>

                    {/* 12. Category */}
                    <td className="px-3 py-2.5 text-center border-r border-slate-800/60">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (item.category || '').includes('ಅ')
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : (item.category || '').includes('ಡ')
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {item.category || 'ಅ ವರ್ಗ'}
                      </span>
                    </td>

                    {/* 13. Tharava Date */}
                    <td className="px-3 py-2.5 text-center font-mono text-slate-300 border-r border-slate-800/60">
                      {item.tharava_date || '—'}
                    </td>

                    {/* 14. Tharava No */}
                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-amber-300 border-r border-slate-800/60">
                      {item.tharava_no || '—'}
                    </td>

                    {/* 15. Share No */}
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-400 border-r border-slate-800/60">
                      {item.share_no ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                          #{item.share_no}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">ಬಾಕಿ (Pending)</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Approval / Status Action */}
                        {!item.share_no ? (
                          <button
                            onClick={() => {
                              if (user?.role !== 'Admin') {
                                showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ಹೊಸ ಶೇರುದಾರರನ್ನು ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
                                return;
                              }
                              setEditingRecord(item);
                              setModalMode('approve');
                              setModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition-colors flex items-center gap-1 font-bold text-[11px] shadow-sm cursor-pointer"
                            title="ಆಡಳಿತ ಮಂಡಳಿ ಮಂಜೂರಾತಿ ನೀಡಿ (ಹಂತ 3 ಮತ್ತು 4)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>ಮಂಜೂರಾತಿ</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold flex items-center gap-1" title="ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿದೆ">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ಮಂಜೂರಾಗಿದೆ</span>
                          </span>
                        )}

                        {/* Print Office Note (ಕಛೇರಿ ಟಿಪ್ಪಣಿ) */}
                        <button
                          onClick={() => setOfficeNoteRecord(item)}
                          className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition-colors cursor-pointer shadow-sm"
                          title="ಕಛೇರಿ ಟಿಪ್ಪಣಿ ಮುದ್ರಿಸಿ (Print Office Note Sheet)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingRecord(item);
                            setModalMode(item.share_no ? 'all' : 'register');
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title={item.share_no ? "ದಾಖಲೆ ತಿದ್ದುಪಡಿ" : "ಅರ್ಜಿ ವಿವರಗಳ ತಿದ್ದುಪಡಿ"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id, item.full_name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition-colors"
                          title="ಅಳಿಸಿ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </TableScrollerContainer>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            ಒಟ್ಟು <b>{totalRecords}</b> ದಾಖಲೆಗಳಲ್ಲಿ <b>{enrollments.length}</b> ತೋರಿಸಲಾಗುತ್ತಿದೆ
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200">
              ಪುಟ {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: New / Edit / Approve Enrollment */}
      <NewShareholderModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={loadEnrollments}
        editRecord={editingRecord}
        mode={modalMode}
      />

      {/* Official Printable Office Note & Receipt Modal */}
      <OfficeNotePrintModal
        isOpen={Boolean(officeNoteRecord)}
        onClose={() => setOfficeNoteRecord(null)}
        enrollment={officeNoteRecord}
      />

      {/* Official Statutory Register List Print Modal */}
      {listPrintModalOpen && (
        <RegisterListPrintModal
          isOpen={listPrintModalOpen}
          onClose={() => setListPrintModalOpen(false)}
          type="enrollment"
          allRecords={allPrintRecords.length > 0 ? allPrintRecords : enrollments}
          selectedIds={selectedIds}
          selectedRecords={selectedPrintRecords}
          initialScope={listPrintInitialScope}
          filterSummary={{
            search: searchTerm,
            category: categoryFilter,
            status: statusFilter
          }}
          onClearSelection={clearSelection}
        />
      )}

      {/* Official Word (.docx) Statutory List Export Modal */}
      {docxModalOpen && (
        <EnrollmentDocxExportModal
          isOpen={docxModalOpen}
          onClose={() => setDocxModalOpen(false)}
          allFilteredRecords={allPrintRecords.length > 0 ? allPrintRecords : enrollments}
          selectedIds={selectedIds}
          selectedRecords={selectedPrintRecords}
          initialScope={docxInitialScope}
          filterSummary={{
            search: searchTerm,
            category: categoryFilter,
            status: statusFilter
          }}
        />
      )}
    </div>
  );
}