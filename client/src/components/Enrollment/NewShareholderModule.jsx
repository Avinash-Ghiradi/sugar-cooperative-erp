import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import NewShareholderModal from './NewShareholderModal';
import * as XLSX from 'xlsx';
import {
  Coins, Search, Plus, Download, Upload, Printer, RefreshCw,
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
  const [editingRecord, setEditingRecord] = useState(null);
  const [printingRecord, setPrintingRecord] = useState(null);
  const [promoteModal, setPromoteModal] = useState({
    open: false,
    record: null,
    shareNo: '',
    tharavaNo: '',
    tharavaDate: '',
    remarks: ''
  });

  useEffect(() => {
    loadEnrollments();
  }, [page, searchTerm, categoryFilter, statusFilter]);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
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
      }
    } catch (err) {
      showToast('Error loading enrollments: ' + err.message, 'error');
    } finally {
      setLoading(false);
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

  // Promote to Master Shareholder Database via Admin Approval
  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ಹೊಸ ಶೇರುದಾರರನ್ನು ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
      return;
    }
    if (!promoteModal.shareNo?.trim()) {
      showToast('ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (Enter Share No)', 'error');
      return;
    }
    const res = await ApiService.approveEnrollmentByAdmin({
      enrollmentId: promoteModal.record.enrollment_id || promoteModal.record.id,
      shareNo: promoteModal.shareNo.trim(),
      adminUser: user?.name || 'Admin',
      tharavaNo: promoteModal.tharavaNo || promoteModal.record.tharava_no || '',
      tharavaDate: promoteModal.tharavaDate || promoteModal.record.tharava_date || '',
      remarks: promoteModal.remarks || ''
    });
    if (res && res.success) {
      showToast(`ಶೇರು ನಂ. #${res.share_no} ಯಶಸ್ವಿಯಾಗಿ ಕಾರ್ಖಾನೆಯ ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ ಮತ್ತು ಆಡಿಟ್ ಇತಿಹಾಸ ದಾಖಲಾಗಿದೆ!`);
      setPromoteModal({ open: false, record: null, shareNo: '', tharavaNo: '', tharavaDate: '', remarks: '' });
      loadEnrollments();
    } else {
      showToast(res?.message || 'ಕಾರ್ಯಾಚರಣೆ ವಿಫಲವಾಗಿದೆ', 'error');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-400" />
              <span>ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ (New Shareholder Enrollment)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ಕಾರ್ಖಾನೆ ಠರಾವು, ₹24,000 ಶೇರು ಮೊತ್ತ, ₹570 ಪ್ರವೇಶ ಶುಲ್ಕ ಹಾಗೂ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಂಚಿಕೆ ರಿಜಿಸ್ಟರ್
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700"
            title="ಹೊರಗಿನ ಎಕ್ಸೆಲ್ ಫೈಲ್‌ನಿಂದ ಆಮದು ಮಾಡಿಕೊಳ್ಳಿ"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700"
            title="15 ಕಾಲಂಗಳ ಎಕ್ಸೆಲ್ ರಫ್ತು"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್
          </button>

          <button
            onClick={() => {
              setEditingRecord(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 hover:scale-105"
          >
            <Plus className="w-4 h-4" /> + ಹೊಸ ನೋಂದಣಿ (New Enrollment)
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
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="ಹುಡುಕಿ (ಹೆಸರು, ಊರು, ರಶೀದಿ, ಠರಾವು ನಂ, ಶೇರು ನಂ)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
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

      {/* 15-Column Statutory Register Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
            {/* 15 Official Table Headers matching the user's Excel sheet */}
            <thead className="bg-[#608b34] text-white font-bold text-[11px] border-b border-[#4d7228] sticky top-0 z-10 select-none">
              <tr>
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
                  <td colSpan="16" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>ಲೋಡ್ ಆಗುತ್ತಿದೆ...</span>
                    </div>
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan="16" className="py-12 text-center text-slate-500">
                    ಯಾವುದೇ ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. "+ ಹೊಸ ನೋಂದಣಿ" ಬಟನ್ ಒತ್ತಿ ದಾಖಲಿಸಿ.
                  </td>
                </tr>
              ) : (
                enrollments.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
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
                        
                        {/* Promote / Add to Master Shareholders */}
                        {!item.share_no ? (
                          <button
                            onClick={async () => {
                              if (user?.role !== 'Admin') {
                                showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ಹೊಸ ಶೇರುದಾರರನ್ನು ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಸೇರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
                                return;
                              }
                              const nextNo = await ApiService.getNextAvailableShareNumber();
                              setPromoteModal({
                                open: true,
                                record: item,
                                shareNo: item.share_no || nextNo,
                                tharavaNo: item.tharava_no || '05(8)',
                                tharavaDate: item.tharava_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
                                remarks: ''
                              });
                            }}
                            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition-colors cursor-pointer"
                            title="Admin ಮಂಜೂರಾತಿ ನೀಡಿ ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಸೇರಿಸಿ"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="p-1.5 rounded-lg bg-slate-900 text-emerald-400 border border-emerald-900/50" title="ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿದೆ">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {/* Print Receipt */}
                        <button
                          onClick={() => setPrintingRecord(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="ಅಧಿಕೃತ ಪ್ರವೇಶ ರಶೀದಿ ಪ್ರಿಂಟ್"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingRecord(item);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="ತಿದ್ದುಪಡಿ"
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
                ))
              )}
            </tbody>
          </table>
        </div>

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

      {/* Modal: New / Edit Enrollment */}
      <NewShareholderModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={loadEnrollments}
        editRecord={editingRecord}
      />

      {/* Modal: Admin Approval & Promote to Master Shareholders */}
      {promoteModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">ಅಡ್ಮಿನ್ ಹೊಸ ಶೇರು ಮಂಜೂರಾತಿ (Admin Share Approval)</h3>
                  <p className="text-[11px] text-slate-400">ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಡೇಟಾಬೇಸ್‌ಗೆ ಅಧಿಕೃತ ಸೇರ್ಪಡೆ</p>
                </div>
              </div>
              <button
                onClick={() => setPromoteModal({ open: false, record: null, shareNo: '', tharavaNo: '', tharavaDate: '', remarks: '' })}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-200 leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>ಗಮನಿಸಿ:</strong> ಅಡ್ಮಿನ್ ಅನುಮೋದನೆಯ ನಂತರ, ಈ ಸದಸ್ಯರು ಅಧಿಕೃತ ಶೇರು ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಕಾರ್ಖಾನೆಯ ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಸೇರ್ಪಡೆಗೊಳ್ಳುತ್ತಾರೆ ಮತ್ತು ಖಾತೆಗೆ ಶಾಶ್ವತ ಆಡಿಟ್ ಇತಿಹಾಸ ಸೃಷ್ಟಿಯಾಗುತ್ತದೆ.
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ಸದಸ್ಯರ ಹೆಸರು:</span>
                <span className="font-bold text-slate-100">{promoteModal.record?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ಗ್ರಾಮ / ತಾಲೂಕು:</span>
                <span className="text-emerald-400 font-semibold">{promoteModal.record?.place} ({promoteModal.record?.taluk || promoteModal.record?.dist})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ಶೇರು ವಿವರ:</span>
                <span className="text-slate-200">{promoteModal.record?.no_shares || 1} ಶೇರು ({promoteModal.record?.category || 'ಅ ವರ್ಗ'}) • ₹{promoteModal.record?.share_amount || 2000}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ಪ್ರವೇಶ ಶುಲ್ಕ & ರಶೀದಿ:</span>
                <span className="text-slate-200 font-mono">₹{promoteModal.record?.admission_fee || 50} (ರಶೀದಿ #{promoteModal.record?.receipt_no || '—'})</span>
              </div>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" /> ಅಧಿಕೃತ ಶೇರು ಸಂಖ್ಯೆ (Official Share Certificate No) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={promoteModal.shareNo}
                  onChange={(e) => setPromoteModal(prev => ({ ...prev, shareNo: e.target.value }))}
                  placeholder="ಉದಾ: 17077 / 18500"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    ಠರಾವು ಸಂಖ್ಯೆ (Tharava / Resolution No):
                  </label>
                  <input
                    type="text"
                    value={promoteModal.tharavaNo}
                    onChange={(e) => setPromoteModal(prev => ({ ...prev, tharavaNo: e.target.value }))}
                    placeholder="ಉದಾ: 05(8)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    ಠರಾವು ದಿನಾಂಕ (Tharava Date):
                  </label>
                  <input
                    type="text"
                    value={promoteModal.tharavaDate}
                    onChange={(e) => setPromoteModal(prev => ({ ...prev, tharavaDate: e.target.value }))}
                    placeholder="DD-MM-YYYY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  ಷರಾ / ಆಡಳಿತ ಮಂಡಳಿ ಅನುಮೋದನೆ ಟಿಪ್ಪಣಿ (Admin Remarks):
                </label>
                <input
                  type="text"
                  value={promoteModal.remarks}
                  onChange={(e) => setPromoteModal(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ಅಂಗೀಕರಿಸಲಾಗಿದೆ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromoteModal({ open: false, record: null, shareNo: '', tharavaNo: '', tharavaDate: '', remarks: '' })}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  ರದ್ದು (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> ಮಂಜೂರಾತಿ ನೀಡಿ & ಮಾಸ್ಟರ್ ಪಟ್ಟಿಗೆ ಸೇರಿಸಿ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Admission Receipt Slip */}
      {printingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 print:p-0 print:shadow-none print:w-full">
            
            {/* Top Modal Close Button (hidden on print) */}
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <span className="font-bold text-sm text-slate-700">ಅಧಿಕೃತ ಪ್ರವೇಶ ರಶೀದಿ ಮುದ್ರಣ (Official Printable Receipt)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500"
                >
                  <Printer className="w-3.5 h-3.5" /> ಮುದ್ರಿಸಿ (Print)
                </button>
                <button
                  onClick={() => setPrintingRecord(null)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="border-2 border-slate-800 p-6 rounded-xl space-y-4 bg-amber-50/20 text-xs">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
                <h2 className="text-base font-extrabold text-slate-900 tracking-wide">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204
                </h2>
                <p className="text-[11px] text-slate-700 font-medium">
                  ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]">
                  ಹೊಸ ಶೇರುದಾರರ ಪ್ರವೇಶ ರಶೀದಿ ಮತ್ತು ಠರಾವು ನಮೂನೆ (New Shareholder Admission Receipt)
                </div>
              </div>

              {/* Receipt Info Row */}
              <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-400 pb-2">
                <div>
                  <span className="text-slate-600">ನೋಂದಣಿ ಸಂಖ್ಯೆ (Enrollment ID): </span>
                  <span className="font-mono font-bold text-slate-900">{printingRecord.enrollment_id}</span>
                </div>
                <div>
                  <span className="text-slate-600">ರಶೀದಿ ನಂ (Receipt No): </span>
                  <span className="font-mono font-bold text-slate-900">{printingRecord.receipt_no || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-600">ದಿನಾಂಕ (Date): </span>
                  <span className="font-bold text-slate-900">{printingRecord.date}</span>
                </div>
              </div>

              {/* Member Details */}
              <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-300">
                <div className="col-span-2 space-y-1.5">
                  <div>
                    <span className="text-slate-500">ಶೇರುದಾರರ ಹೆಸರು: </span>
                    <span className="font-bold text-sm text-slate-900">{printingRecord.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ಸ್ಥಳ / ಗ್ರಾಮ: </span>
                    <span className="font-semibold text-slate-900">{printingRecord.place}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-slate-500">ತಾಲೂಕು: </span>
                      <span className="font-semibold text-slate-900">{printingRecord.taluk}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">ಜಿಲ್ಲೆ: </span>
                      <span className="font-semibold text-slate-900">{printingRecord.dist}</span>
                    </div>
                  </div>
                </div>

                {/* Photo box */}
                <div className="flex justify-end">
                  <div className="w-24 h-28 border border-slate-400 rounded bg-slate-50 flex items-center justify-center overflow-hidden text-[10px] text-slate-400">
                    {printingRecord.photo ? (
                      <img src={printingRecord.photo} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <span>ಭಾವಚಿತ್ರ</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Shares & Statutory Fees Table */}
              <table className="w-full border border-slate-400 text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-400 font-bold">
                  <tr>
                    <th className="p-2 border-r border-slate-400">ವಿವರ (Particulars)</th>
                    <th className="p-2 border-r border-slate-400 text-center">ಶೇರುಗಳ ಸಂಖ್ಯೆ</th>
                    <th className="p-2 border-r border-slate-400 text-center">ವರ್ಗ</th>
                    <th className="p-2 text-right">ಮೊತ್ತ (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="p-2 border-r border-slate-400 font-medium">ಶೇರು ಬಂಡವಾಳ ಠೇವಣಿ (Share Capital Amount)</td>
                    <td className="p-2 border-r border-slate-400 text-center font-bold">{printingRecord.no_shares}</td>
                    <td className="p-2 border-r border-slate-400 text-center">{printingRecord.category}</td>
                    <td className="p-2 text-right font-mono font-bold">₹ {Number(printingRecord.share_amount).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-400 font-medium">ಶೇರು ಪ್ರವೇಶ ಶುಲ್ಕ (Admission Fee)</td>
                    <td className="p-2 border-r border-slate-400 text-center font-bold">{printingRecord.no_shares}</td>
                    <td className="p-2 border-r border-slate-400 text-center">—</td>
                    <td className="p-2 text-right font-mono font-bold">₹ {Number(printingRecord.admission_fee).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-sm">
                    <td colSpan="3" className="p-2 border-r border-slate-400 text-right">ಒಟ್ಟು ಪಾವತಿಸಿದ ಮೊತ್ತ (Total Amount Received):</td>
                    <td className="p-2 text-right text-emerald-800 font-mono">₹ {Number(printingRecord.total_amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Board Resolution & Share Number */}
              <div className="bg-white p-3 rounded-lg border border-slate-300 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">ಠರಾವು ಸಂಖ್ಯೆ: </span>
                  <span className="font-mono font-bold text-slate-900">{printingRecord.tharava_no || '05(8)'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ಠರಾವು ದಿನಾಂಕ: </span>
                  <span className="font-mono font-bold text-slate-900">{printingRecord.tharava_date || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ಹಂಚಿಕೆಯಾದ ಶೇರು ನಂ: </span>
                  <span className="font-mono font-bold text-emerald-700">{printingRecord.share_no ? `#${printingRecord.share_no}` : 'ಬಾಕಿ (Pending)'}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-center text-xs">
                <div className="space-y-1">
                  <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                    ಶೇರುದಾರರ ಸಹಿ / ಹೆಬ್ಬೆಟ್ಟು
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                    ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="w-36 border-t border-slate-800 pt-1 font-semibold text-slate-700">
                    ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು (MD)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
