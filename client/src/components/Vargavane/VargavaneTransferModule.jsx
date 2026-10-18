import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import VargavaneTransferModal from './VargavaneTransferModal';
import {
  ArrowRightLeft, Search, Plus, CheckCircle2, Clock, X, Save,
  Download, Upload, Filter, Printer, Trash2, Edit3, User, MapPin,
  Phone, CreditCard, ShieldCheck, Check, AlertCircle, RefreshCw, Eye,
  Building2, FileSpreadsheet
} from 'lucide-react';

export default function VargavaneTransferModule() {
  const { showToast, user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [talukFilter, setTalukFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [printSlipTransfer, setPrintSlipTransfer] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [importAsCompleted, setImportAsCompleted] = useState(true);
  const [adminApproveModal, setAdminApproveModal] = useState({ open: false, transfer: null, remarks: '' });
  const uploadFileInputRef = useRef(null);

  useEffect(() => {
    loadTransfers();
  }, [search, statusFilter, talukFilter]);

  const loadTransfers = async () => {
    setLoading(true);
    const res = await ApiService.getVargavaneTransfers({
      search,
      status: statusFilter,
      taluk: talukFilter
    });
    if (res && res.data) {
      setTransfers(res.data);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (transferId, newStatus) => {
    if (newStatus === 'Completed') {
      if (user?.role !== 'Admin') {
        showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ವರ್ಗಾವಣೆ ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ನವೀಕರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
        return;
      }
      const item = transfers.find(t => String(t.transfer_id) === String(transferId) || String(t.id) === String(transferId));
      setAdminApproveModal({ open: true, transfer: item, remarks: '' });
      return;
    }
    const res = await ApiService.updateVargavaneStatus(transferId, newStatus);
    if (res && res.success) {
      showToast(`Vargavane status updated to: ${newStatus}`);
      loadTransfers();
    }
  };

  const handleConfirmAdminApproval = async (e) => {
    e.preventDefault();
    if (!adminApproveModal.transfer) return;
    try {
      const res = await ApiService.approveVargavaneTransferByAdmin({
        transferId: adminApproveModal.transfer.transfer_id || adminApproveModal.transfer.id,
        adminUser: user?.name || 'Admin',
        remarks: adminApproveModal.remarks
      });
      if (res && res.success) {
        showToast(`ವರ್ಗಾವಣೆ ಮಂಜೂರಾಗಿದೆ! ಶೇರು ಸಂಖ್ಯೆ #${adminApproveModal.transfer.share_no} ಯಶಸ್ವಿಯಾಗಿ ${res.transferee_name} ಅವರ ಹೆಸರಿಗೆ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ನವೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ಆಡಿಟ್ ಇತಿಹಾಸ ದಾಖಲಾಗಿದೆ.`);
        setAdminApproveModal({ open: false, transfer: null, remarks: '' });
        loadTransfers();
      } else {
        showToast(res?.message || 'ಅನುಮೋದನೆ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    }
  };

  const handleDelete = async (transferId) => {
    if (!window.confirm('Are you sure you want to delete this Vargavane transfer record?')) return;
    const res = await ApiService.deleteVargavaneTransfer(transferId);
    if (res && res.success) {
      showToast('Vargavane transfer record deleted.');
      loadTransfers();
    }
  };

  // Stats calculation
  const totalApps = transfers.length;
  const receivedApps = transfers.filter(t => t.approval_status === 'Application Received').length;
  const underVerification = transfers.filter(t => t.approval_status === 'Under Verification').length;
  const approvedApps = transfers.filter(t => t.approval_status === 'Approved').length;
  const completedApps = transfers.filter(t => t.approval_status === 'Completed').length;
  const totalFees = transfers.reduce((acc, t) => acc + (parseFloat(t.fees) || 0), 0);

  // 22 Official Column Headers exactly matching the user's Excel sheet
  const OFFICIAL_HEADERS = [
    'Sl. No.',
    '1. Share Holder Name',
    '1.1 Place',
    '1.2 Taluk',
    '1.3 District',
    '1.4 Relationship',
    '1.5 Age',
    '1.6 Aadhar No',
    '1.7 Mobile No.',
    '2. Vargavane Madikolluvaru',
    '2.1 Place',
    '2.2 Taluk',
    '2.3 District',
    '2.4 Relationship',
    '2.5 Aadhar No',
    '2.6 Mobile No',
    '5. Share No',
    '6. Category',
    '7. No. of Shares',
    '9. Fees',
    '10. Receipt No',
    '11. Rp. Date'
  ];

  // Export to Excel with the exact 22 columns
  const handleExportExcel = () => {
    try {
      const rows = transfers.map((t, idx) => ({
        'Sl. No.': t.sl_no || (idx + 1),
        '1. Share Holder Name': t.transferor_name || t.shareholder_name || '',
        '1.1 Place': t.transferor_place || '',
        '1.2 Taluk': t.transferor_taluk || '',
        '1.3 District': t.transferor_district || '',
        '1.4 Relationship': t.transferor_relationship || '',
        '1.5 Age': t.transferor_age || '',
        '1.6 Aadhar No': t.transferor_aadhaar || '',
        '1.7 Mobile No.': t.transferor_mobile || '',
        '2. Vargavane Madikolluvaru': t.transferee_name || '',
        '2.1 Place': t.transferee_place || '',
        '2.2 Taluk': t.transferee_taluk || '',
        '2.3 District': t.transferee_district || '',
        '2.4 Relationship': t.transferee_relationship || '',
        '2.5 Aadhar No': t.transferee_aadhaar || '',
        '2.6 Mobile No': t.transferee_mobile || '',
        '5. Share No': t.share_no || '',
        '6. Category': t.category || '',
        '7. No. of Shares': t.no_of_shares || 1,
        '9. Fees': t.fees !== undefined ? t.fees : 570,
        '10. Receipt No': t.receipt_no || '',
        '11. Rp. Date': t.receipt_date || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows, { header: OFFICIAL_HEADERS });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Vargavane_Register');
      XLSX.writeFile(wb, `vargavane_share_transfer_register_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Exported Vargavane Register (.xlsx) with 22 official columns!');
    } catch (err) {
      showToast('Failed to export Excel: ' + err.message, 'error');
    }
  };

  // Download Empty Template
  const handleDownloadTemplate = () => {
    try {
      const sampleRows = [
        OFFICIAL_HEADERS,
        [
          1,
          'ಶ್ರೀಮತಿ ಕಸ್ತೂರಿಬಾಯಿ ಗದ್ದೆಪ್ಪ ಕುಂಬಾರ',
          'ಅಹಿರಸಂಗ',
          'ಇಂಡಿ',
          'ವಿಜಯಪುರ',
          'ತಾಯಿ',
          '',
          '3892 6622 2757',
          '',
          'ಶ್ರೀ ರಾಜಶೇಖರ ಗದ್ದೆಪ್ಪ ಕುಂಬಾರ',
          'ಅಹಿರಸಂಗ',
          'ಇಂಡಿ',
          'ವಿಜಯಪುರ',
          'ಮಗ',
          '4269 5069 6182',
          '9632668696',
          '157',
          'ಅ',
          2,
          570,
          '591',
          '01-06-24'
        ]
      ];
      const ws = XLSX.utils.aoa_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'vargavane_transfer_template.xlsx');
      showToast('Downloaded official 22-column Vargavane Excel template (.xlsx)');
    } catch (err) {
      showToast('Failed to download template: ' + err.message, 'error');
    }
  };

  // Parse uploaded Vargavane Excel file
  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setIsUploading(true);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (!rawRows || rawRows.length < 2) {
        showToast('File is empty or contains no data rows.', 'error');
        setIsUploading(false);
        return;
      }

      const headers = (rawRows[0] || []).map(h => String(h || '').trim().toLowerCase());
      const findCol = (keywords, def) => {
        for (const kw of keywords) {
          const idx = headers.findIndex(h => h.includes(kw.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return def;
      };

      const cSl = findCol(['sl', 'ಕ್ರಮ'], 0);
      const cTorName = findCol(['share holder', 'ಮೂಲ ಶೇರುದಾರ'], 1);
      const cTorPlace = findCol(['1.1 place', 'place', 'ಸ್ಥಳ'], 2);
      const cTorTaluk = findCol(['1.2 tal', 'taluk', 'ತಾಲ್ಲೂಕು'], 3);
      const cTorDist = findCol(['1.3 dist', 'district', 'ಜಿಲ್ಲೆ'], 4);
      const cTorRel = findCol(['1.4 relation', 'relationship', 'ಸಂಬಂಧ'], 5);
      const cTorAge = findCol(['1.5 age', 'age', 'ವಯಸ್ಸು'], 6);
      const cTorAadh = findCol(['1.6 aadhar', 'ಆಧಾರ್'], 7);
      const cTorMob = findCol(['1.7 mobile', 'ಮೊಬೈಲ್'], 8);

      const cTeeName = findCol(['vargavane', 'madikolluvaru', 'ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು'], 9);
      const cTeePlace = findCol(['2.1 pla', 'place', 'ಸ್ಥಳ'], 10);
      const cTeeTaluk = findCol(['2.2 tal', 'taluk', 'ತಾಲ್ಲೂಕು'], 11);
      const cTeeDist = findCol(['2.3 dist', 'district', 'ಜಿಲ್ಲೆ'], 12);
      const cTeeRel = findCol(['2.4 relation', 'ಸಂಬಂಧ'], 13);
      const cTeeAadh = findCol(['2.5 aadhar', 'ಆಧಾರ್'], 14);
      const cTeeMob = findCol(['2.6 mobile', 'ಮೊಬೈಲ್'], 15);

      const cShareNo = findCol(['5. share', 'share no', 'ಶೇರು'], 16);
      const cCat = findCol(['6. cate', 'category', 'ವರ್ಗ'], 17);
      const cNumShares = findCol(['7. no. sh', 'shares', 'ಸಂಖ್ಯೆ'], 18);
      const cFees = findCol(['9. fees', 'fees', 'ಶುಲ್ಕ'], 19);
      const cReceiptNo = findCol(['10. rec', 'receipt', 'ರಶೀದಿ'], 20);
      const cReceiptDate = findCol(['11. rp. d', 'receipt date', 'ದಿನಾಂಕ'], 21);
      const cStatus = findCol(['status', 'approval', 'ಸ್ಥಿತಿ', 'ಮಂಜೂರಾತಿ'], -1);

      const parsedRecords = [];
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every(val => String(val || '').trim() === '')) continue;

        const getVal = (col) => (col !== undefined && col >= 0 && row[col] !== undefined) ? String(row[col]).trim() : '';

        const torName = getVal(cTorName);
        const teeName = getVal(cTeeName);
        if (!torName && !teeName) continue;

        const fileStatus = getVal(cStatus);
        let resolvedStatus = 'Completed';
        if (fileStatus) {
          if (fileStatus.toLowerCase().includes('rec') || fileStatus.includes('ಸ್ವೀಕರಿಸಲಾಗಿದೆ')) {
            resolvedStatus = 'Application Received';
          } else if (fileStatus.toLowerCase().includes('ver') || fileStatus.includes('ಪರಿಶೀಲನೆ')) {
            resolvedStatus = 'Under Verification';
          } else {
            resolvedStatus = 'Completed';
          }
        } else {
          resolvedStatus = importAsCompleted ? 'Completed' : 'Application Received';
        }

        parsedRecords.push({
          sl_no: parseInt(getVal(cSl)) || i,
          transferor_name: torName || `ಶೇರುದಾರ ${i}`,
          shareholder_name: torName || `ಶೇರುದಾರ ${i}`,
          transferor_place: getVal(cTorPlace) || 'ಅಹಿರಸಂಗ',
          transferor_taluk: getVal(cTorTaluk) || 'ಇಂಡಿ',
          transferor_district: getVal(cTorDist) || 'ವಿಜಯಪುರ',
          transferor_relationship: getVal(cTorRel) || 'ಸ್ವಂತ',
          transferor_age: getVal(cTorAge),
          transferor_aadhaar: getVal(cTorAadh),
          transferor_mobile: getVal(cTorMob),
          transferee_name: teeName || `ವರ್ಗಾವಣೆದಾರ ${i}`,
          transferee_place: getVal(cTeePlace) || getVal(cTorPlace) || 'ಅಹಿರಸಂಗ',
          transferee_taluk: getVal(cTeeTaluk) || getVal(cTorTaluk) || 'ಇಂಡಿ',
          transferee_district: getVal(cTeeDist) || getVal(cTorDist) || 'ವಿಜಯಪುರ',
          transferee_relationship: getVal(cTeeRel) || 'ಮಗ',
          transferee_aadhaar: getVal(cTeeAadh),
          transferee_mobile: getVal(cTeeMob),
          share_no: getVal(cShareNo) || String(i + 100),
          category: getVal(cCat) || 'ಅ - ವರ್ಗ',
          no_of_shares: parseInt(getVal(cNumShares)) || 1,
          fees: parseFloat(getVal(cFees)) || 570,
          receipt_no: getVal(cReceiptNo) || String(500 + i),
          receipt_date: getVal(cReceiptDate) || new Date().toLocaleDateString('en-GB'),
          approval_status: resolvedStatus
        });
      }

      if (parsedRecords.length > 0) {
        await ApiService.addVargavaneTransfersBulk(parsedRecords);
        showToast(`ಯಶಸ್ವಿಯಾಗಿ ${parsedRecords.length} ವರ್ಗಾವಣೆ ದಾಖಲೆಗಳನ್ನು ಆಮದು ಮಾಡಲಾಗಿದೆ (${importAsCompleted ? 'ಪೂರ್ಣಗೊಂಡಿದೆ / ಸ್ವಾಮ್ಯತ್ವ ನವೀಕರಿಸಲಾಗಿದೆ' : 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ'})!`);
        setShowUploadModal(false);
        loadTransfers();
      } else {
        showToast('No valid records found in spreadsheet.', 'error');
      }
    } catch (err) {
      showToast('Error reading spreadsheet: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-sky-950 shrink-0">
            <ArrowRightLeft className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100">
                ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ (Vargavane Share Transfer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                22 Columns Register
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Official statutory direct share transfer register between original members and transferees (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು) with 22-column records, fee receipt, and complete audit tracking.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Template (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer"
            title="Upload Vargavane Excel Sheet"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" /> Import Excel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-xl text-xs font-semibold border border-sky-900/60 transition-all cursor-pointer"
            title="Export full Vargavane register with 22 columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingTransfer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Vargavane Application
          </button>
        </div>
      </div>

      {/* KPI Stats Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-slate-400 block mb-1">Total Transfers</span>
          <span className="text-xl font-bold text-slate-100 font-mono">{totalApps.toLocaleString()}</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-amber-400 block mb-1">Received (ಸ್ವೀಕೃತ)</span>
          <span className="text-xl font-bold text-amber-400 font-mono">{receivedApps.toLocaleString()}</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-sky-400 block mb-1">Under Verification</span>
          <span className="text-xl font-bold text-sky-400 font-mono">{underVerification.toLocaleString()}</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-teal-400 block mb-1">Approved (ಮಂಜೂರಾದ)</span>
          <span className="text-xl font-bold text-teal-400 font-mono">{approvedApps.toLocaleString()}</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-emerald-400 block mb-1">Completed (ವರ್ಗಾವಣೆ)</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{completedApps.toLocaleString()}</span>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-purple-400 block mb-1">Fees Collected (ಶುಲ್ಕ)</span>
          <span className="text-xl font-bold text-purple-400 font-mono">₹{totalFees.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Transferor, Transferee, Share No, Mobile, Place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-300 outline-none w-full md:w-auto"
          >
            <option value="">All Statuses (ಎಲ್ಲಾ ಹಂತಗಳು)</option>
            <option value="Application Received">Application Received</option>
            <option value="Under Verification">Under Verification</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={talukFilter}
            onChange={(e) => setTalukFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-300 outline-none w-full md:w-auto"
          >
            <option value="">All Taluks (ಎಲ್ಲಾ ತಾಲ್ಲೂಕುಗಳು)</option>
            <option value="ಇಂಡಿ">ಇಂಡಿ</option>
            <option value="ಚಡಚಣ">ಚಡಚಣ</option>
            <option value="ಬನಹಟ್ಟಿ">ಬನಹಟ್ಟಿ</option>
            <option value="ಸಿಂದಗಿ">ಸಿಂದಗಿ</option>
            <option value="ವಿಜಯಪುರ">ವಿಜಯಪುರ</option>
          </select>

          {(search || statusFilter || talukFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTalukFilter('');
              }}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Vargavane Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            <span>Loading Vargavane share transfer records...</span>
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Vargavane Transfer Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a new application or import your official Vargavane Excel spreadsheet to begin.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTransfer(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
            >
              Add First Vargavane Application
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-emerald-800 border-b-2 border-emerald-400 text-white uppercase font-bold text-[10.5px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center border-r border-emerald-700/40">Sl.</th>
                  <th className="py-3 px-4 border-r border-emerald-700/40">1. Share Holder (ಮೂಲ ಶೇರುದಾರರು)</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">1.1-1.3 Place & Taluk</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40 text-amber-300">1.4 Ownership / 1.6 Aadhaar</th>
                  <th className="py-3 px-4 border-r border-emerald-700/40">2. Vargavane Madikolluvaru (ವರ್ಗಾವಣೆದಾರರು)</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">2.1-2.3 Transferee Location</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40 text-amber-300 font-extrabold">2.4 Ownership / 2.6 Mobile</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40 text-amber-300">5. Share No</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">6. Category / Shares</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">Fee & 10. Receipt</th>
                  <th className="py-3 px-3 text-center border-r border-emerald-700/40">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {transfers.map((v, idx) => (
                  <tr key={v.id || v.transfer_id || idx} className="hover:bg-slate-900/50 transition-colors">
                    {/* Sl. No */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                      {v.sl_no || (idx + 1)}
                    </td>

                    {/* 1. Share Holder Name (Transferor) */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">
                        {v.transferor_name || v.shareholder_name}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {v.transfer_id}
                      </span>
                    </td>

                    {/* 1.1 - 1.3 Place & Taluk */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{v.transferor_place || '—'}</div>
                      <div className="text-[10px] text-slate-400">{v.transferor_taluk || '—'}, {v.transferor_district || 'ವಿಜಯಪುರ'}</div>
                    </td>

                    {/* 1.4 Rel & 1.6 Aadhaar */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                        {v.transferor_relationship || 'ಸ್ವಂತ'}
                      </span>
                      {v.transferor_aadhaar && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {v.transferor_aadhaar}
                        </div>
                      )}
                    </td>

                    {/* 2. Vargavane Madikolluvaru (Transferee) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                          {v.transferee_photo ? (
                            <img src={v.transferee_photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">
                            {v.transferee_name}
                          </div>
                          {v.transferee_aadhaar && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Aadhaar: {v.transferee_aadhaar}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2.1 - 2.3 Transferee Location */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{v.transferee_place || '—'}</div>
                      <div className="text-[10px] text-slate-400">{v.transferee_taluk || '—'}, {v.transferee_district || 'ವಿಜಯಪುರ'}</div>
                    </td>

                    {/* 2.4 Rel & 2.6 Mobile */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                        {v.transferee_relationship || 'ಮಗ'}
                      </span>
                      <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{v.transferee_mobile || '—'}</span>
                      </div>
                    </td>

                    {/* 5. Share No */}
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">
                      #{v.share_no}
                    </td>

                    {/* 6. Category / 7. No. of Shares */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{v.category || 'ಅ - ವರ್ಗ'}</div>
                      <div className="text-[10px] text-slate-400">{v.no_of_shares || 1} Share(s)</div>
                    </td>

                    {/* Fee & 10. Receipt No & 11. Date */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-200">
                        ₹{v.fees || 570} <span className="text-[10px] font-normal text-slate-500 font-sans">(Rcpt #{v.receipt_no || '—'})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {v.receipt_date || v.application_date || '—'}
                      </div>
                    </td>

                    {/* Status Workflow */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={v.approval_status}
                        onChange={(e) => handleStatusUpdate(v.transfer_id || v.id, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full outline-none border cursor-pointer ${
                          v.approval_status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : v.approval_status === 'Approved'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : v.approval_status === 'Under Verification'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="Application Received">Application Received</option>
                        <option value="Under Verification">Under Verification</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed & Transferred</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.approval_status !== 'Completed' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (user?.role !== 'Admin') {
                                showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ವರ್ಗಾವಣೆ ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ನವೀಕರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
                                return;
                              }
                              setAdminApproveModal({ open: true, transfer: v, remarks: '' });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-800 text-sky-300 border border-sky-700/70 text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
                            title="Admin Approve & Update Master Shareholder Record"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                            <span>ಮಂಜೂರಾತಿ</span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/40 text-sky-400 text-[10px] font-medium border border-sky-900/50">
                            <CheckCircle2 className="w-3 h-3 text-sky-400" />
                            <span>ಮಂಜೂರಾಗಿದೆ</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setPrintSlipTransfer(v)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="View / Print Vargavane Acknowledgement Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingTransfer(v);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Edit Vargavane Record"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(v.transfer_id || v.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vargavane Form Modal (New / Edit) */}
      <VargavaneTransferModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTransfer(null);
        }}
        initialData={editingTransfer}
        onSaveSuccess={loadTransfers}
        showToast={showToast}
      />

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-400" /> Upload Vargavane Excel Sheet
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload your official 22-column Vargavane transfer spreadsheet (.xlsx / .xls / .csv). Columns with Kannada headers are automatically parsed.
            </p>

            {/* Import Mode Selector: Already Done vs New Application */}
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">ದಾಖಲೆಗಳ ಪ್ರಕಾರ (Import Mode):</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportAsCompleted(true)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    importAsCompleted
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" /> ಈಗಾಗಲೇ ಪೂರ್ಣಗೊಂಡಿದೆ
                  </div>
                  <div className="text-[9.5px] text-sky-400/80 mt-1">Completed & Auto-sync Ownership to ವಾರಸದಾರರು</div>
                </button>
                <button
                  type="button"
                  onClick={() => setImportAsCompleted(false)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !importAsCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> ಹೊಸ ಅರ್ಜಿಗಳು
                  </div>
                  <div className="text-[9.5px] text-emerald-400/80 mt-1">Application Received (Pending Approval)</div>
                </button>
              </div>
            </div>

            <div
              onClick={() => uploadFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40"
            >
              <input
                type="file"
                ref={uploadFileInputRef}
                onChange={handleUploadFile}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-sky-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-200">
                {uploadFileName ? `Selected: ${uploadFileName}` : 'Click to select or drag & drop Vargavane Excel file'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Supports Microsoft Excel (.xlsx, .xls) & CSV</div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Vargavane Acknowledgement Receipt Slip Modal */}
      {printSlipTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-400" /> Vargavane Acknowledgement Slip (ವರ್ಗಾವಣೆ ಶೇರು ಪಾವತಿ ರಶೀದಿ)
              </h2>
              <button onClick={() => setPrintSlipTransfer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Area */}
            <div id="printable-vargavane-slip" className="bg-white text-slate-900 p-6 rounded-2xl shadow-inner space-y-5 text-xs font-sans border-2 border-slate-300">
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h1 className="text-base font-extrabold text-slate-900 tracking-wide">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ.
                </h1>
                <h2 className="text-xs font-semibold text-slate-700">
                  ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪಾವತಿ ರಶೀದಿ (Vargavane Share Transfer Slip)
                </h2>
                <div className="text-[10px] text-slate-600 mt-1 flex justify-between px-2 font-mono">
                  <span>Transfer ID: {printSlipTransfer.transfer_id}</span>
                  <span>Date: {printSlipTransfer.receipt_date || printSlipTransfer.application_date || new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 border-r pr-3 border-slate-200">
                  <h3 className="font-bold text-slate-950 border-b pb-1 text-[11px]">1. ಮೂಲ ಶೇರುದಾರರ ವಿವರಗಳು (Transferor)</h3>
                  <div><span className="text-slate-600">ಹೆಸರು:</span> <strong className="text-slate-900">{printSlipTransfer.transferor_name || printSlipTransfer.shareholder_name}</strong></div>
                  <div><span className="text-slate-600">ಸ್ವಾಮ್ಯತ್ವ (Ownership):</span> <strong>{printSlipTransfer.transferor_relationship || 'ಸ್ವಂತ (Self)'}</strong></div>
                  <div><span className="text-slate-600">ಆಧಾರ್ ಸಂಖ್ಯೆ:</span> <strong>{printSlipTransfer.transferor_aadhaar || '—'}</strong></div>
                  <div><span className="text-slate-600">ಸ್ಥಳ / ತಾಲ್ಲೂಕು:</span> <strong>{printSlipTransfer.transferor_place}, {printSlipTransfer.transferor_taluk}</strong></div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-slate-950 border-b pb-1 text-[11px]">2. ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು (Transferee)</h3>
                  <div><span className="text-slate-600">ಹೆಸರು:</span> <strong className="text-slate-900">{printSlipTransfer.transferee_name}</strong></div>
                  <div><span className="text-slate-600">ಸ್ವಾಮ್ಯತ್ವ (Ownership):</span> <strong>ವಾರಸದಾರರು ({printSlipTransfer.transferee_relationship || 'ಮಗ'})</strong></div>
                  <div><span className="text-slate-600">ಮೊಬೈಲ್:</span> <strong>{printSlipTransfer.transferee_mobile || '—'}</strong></div>
                  <div><span className="text-slate-600">ಆಧಾರ್ ಸಂಖ್ಯೆ:</span> <strong>{printSlipTransfer.transferee_aadhaar || '—'}</strong></div>
                  <div><span className="text-slate-600">ಸ್ಥಳ / ತಾಲ್ಲೂಕು:</span> <strong>{printSlipTransfer.transferee_place}, {printSlipTransfer.transferee_taluk}</strong></div>
                </div>
              </div>

              {/* Share & Fee Receipt Info */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl grid grid-cols-4 gap-2 font-mono text-center">
                <div>
                  <span className="text-slate-600 block text-[10px]">ಶೇರು ಸಂಖ್ಯೆ (Share No)</span>
                  <strong className="text-sky-700 text-sm">#{printSlipTransfer.share_no}</strong>
                  <div className="text-[10px] text-slate-500 font-sans">{printSlipTransfer.category}</div>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">ಶೇರುಗಳ ಸಂಖ್ಯೆ (Shares)</span>
                  <strong className="text-slate-900 text-sm">{printSlipTransfer.no_of_shares || 1}</strong>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">ರಶೀದಿ ನಂ (Receipt No)</span>
                  <strong className="text-slate-900 text-sm">#{printSlipTransfer.receipt_no || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">ವರ್ಗಾವಣೆ ಶುಲ್ಕ (Fee)</span>
                  <strong className="text-emerald-700 text-sm">₹{printSlipTransfer.fees || 570}</strong>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-center text-[10px] text-slate-700">
                <div>
                  <div className="w-32 border-t border-slate-800 pt-1">ಮೂಲ ಶೇರುದಾರರ ಸಹಿ</div>
                </div>
                <div>
                  <div className="w-32 border-t border-slate-800 pt-1">ವರ್ಗಾವಣೆದಾರರ ಸಹಿ</div>
                </div>
                <div>
                  <div className="w-32 border-t border-slate-800 pt-1">ಕ್ಲಾರ್ಕ್ / ಆಪರೇಟರ್ ಸಹಿ</div>
                </div>
                <div>
                  <div className="w-32 border-t border-slate-800 pt-1">ವ್ಯವಸ್ಥಾಪಕರು / ಕಾರ್ಯದರ್ಶಿ</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPrintSlipTransfer(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Approval & Master Sync Modal */}
      {adminApproveModal.open && adminApproveModal.transfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/50 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  ಅಡ್ಮಿನ್ ವರ್ಗಾವಣೆ ಮಂಜೂರಾತಿ (Admin Vargavane Approval)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಅಧಿಕೃತ ಅಂತರ-ಸದಸ್ಯ ವರ್ಗಾವಣೆ ಅನುಮೋದನೆ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdminApproveModal({ open: false, transfer: null, remarks: '' })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>ಗಮನಿಸಿ:</strong> ಈ ಶೇರು ವರ್ಗಾವಣೆಯನ್ನು ಅನುಮೋದಿಸಿದ ತಕ್ಷಣ, ಶೇರು ಸಂಖ್ಯೆ <strong>#{adminApproveModal.transfer.share_no}</strong> ಯಜಮಾನಿಕೆಯು ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರಾದ <strong>{adminApproveModal.transfer.transferee_name || adminApproveModal.transfer.vargavane_madikolluvaru}</strong> ಅವರ ಹೆಸರಿಗೆ ಅಧಿಕೃತವಾಗಿ ನವೀಕರಣಗೊಳ್ಳುತ್ತದೆ ಮತ್ತು ಶಾಶ್ವತ ಆಡಿಟ್ ಇತಿಹಾಸ ದಾಖಲಾಗುತ್ತದೆ.
              </span>
            </div>

            {/* Transfer Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">ಮೂಲ ಶೇರುದಾರರು (ವರ್ಗಾವಣೆ ಕೊಡುವವರು)</span>
                <p className="font-semibold text-slate-200">{adminApproveModal.transfer.transferor_name || adminApproveModal.transfer.shareholder_name}</p>
                <p className="text-slate-400 text-[11px]">ಶೇರು ಸಂಖ್ಯೆ: <strong className="text-sky-400">#{adminApproveModal.transfer.share_no}</strong></p>
                <p className="text-slate-400 text-[11px]">ಗ್ರಾಮ: {adminApproveModal.transfer.transferor_place || adminApproveModal.transfer.shareholder_place || '—'}</p>
                <p className="text-slate-400 text-[11px]">ಮೊಬೈಲ್: {adminApproveModal.transfer.transferor_mobile || '—'}</p>
              </div>

              <div className="bg-slate-950/60 border border-sky-900/40 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು (ಸ್ವೀಕರ್ತರು)</span>
                <p className="font-semibold text-slate-100">{adminApproveModal.transfer.transferee_name || adminApproveModal.transfer.vargavane_madikolluvaru}</p>
                <p className="text-slate-400 text-[11px]">ಸಂಬಂಧ: <strong>{adminApproveModal.transfer.relationship || adminApproveModal.transfer.transferee_relationship || '—'}</strong></p>
                <p className="text-slate-400 text-[11px]">ಮೊಬೈಲ್: {adminApproveModal.transfer.transferee_mobile || '—'}</p>
                <p className="text-slate-400 text-[11px]">ಗ್ರಾಮ: {adminApproveModal.transfer.transferee_place || '—'}, {adminApproveModal.transfer.transferee_taluk || ''}</p>
              </div>
            </div>

            {/* Fee & Receipt Details */}
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">ರಶೀದಿ ಸಂಖ್ಯೆ</span>
                <span className="font-mono font-bold text-slate-200">#{adminApproveModal.transfer.receipt_no || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ವರ್ಗಾವಣೆ ಶುಲ್ಕ</span>
                <span className="font-mono font-bold text-emerald-400">₹{adminApproveModal.transfer.fees || 570}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ಶೇರುಗಳ ಸಂಖ್ಯೆ</span>
                <span className="text-slate-300 font-semibold">{adminApproveModal.transfer.no_of_shares || 1} ಶೇರು</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ಅರ್ಜಿ ದಿನಾಂಕ</span>
                <span className="text-slate-300">{adminApproveModal.transfer.receipt_date || adminApproveModal.transfer.application_date || '—'}</span>
              </div>
            </div>

            {/* Admin Remarks / Board Resolution */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ಆಡಳಿತ ಮಂಡಳಿ ನಿರ್ಣಯ / ಷರಾ (Board Resolution No. / Tharavu & Remarks):
              </label>
              <textarea
                value={adminApproveModal.remarks}
                onChange={(e) => setAdminApproveModal(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="ಉದಾ: ನಿರ್ಣಯ ಸಂಖ್ಯೆ #18/2026 ಪ್ರಕಾರ ವರ್ಗಾವಣೆ ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ (Resolution #18 approved)..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAdminApproveModal({ open: false, transfer: null, remarks: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmAdminApproval}
                className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950/40 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                ಮಂಜೂರಾತಿ ನೀಡಿ & ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಬದಲಾಯಿಸಿ (Approve & Update Master)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
