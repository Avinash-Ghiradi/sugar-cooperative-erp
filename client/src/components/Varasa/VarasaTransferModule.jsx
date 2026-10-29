import TableScrollerContainer from '../Common/TableScrollerContainer';
import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import VarasaTransferModal from './VarasaTransferModal';
import VarasaPrintModal from './VarasaPrintModal';
import RegisterListPrintModal from '../Common/RegisterListPrintModal';
import {
  FileSpreadsheet, Search, Plus, CheckCircle2, Clock, X, Lock, Save,
  Download, Upload, Filter, Printer, Trash2, Edit3, User, MapPin,
  Phone, CreditCard, ShieldCheck, Check, AlertCircle, RefreshCw, Eye
} from 'lucide-react';

const isTransferApproved = (t) => {
  if (!t) return false;
  return ['Approved', 'Completed', 'ಮಂಜೂರಾಗಿದೆ', 'ಅನುಮೋದಿಸಲಾಗಿದೆ'].includes(t.approval_status);
};

export default function VarasaTransferModule() {
  const { showToast, user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [talukFilter, setTalukFilter] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [printSlipTransfer, setPrintSlipTransfer] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [importAsCompleted, setImportAsCompleted] = useState(true);
  const [adminApproveModal, setAdminApproveModal] = useState({ open: false, transfer: null, remarks: '' });
  const uploadFileInputRef = useRef(null);
  // Multi-select & List Print states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [listPrintModalOpen, setListPrintModalOpen] = useState(false);
  const [listPrintScope, setListPrintScope] = useState('filtered');

  const toggleSelectAllCurrent = () => {
    const ids = transfers.map(t => t.id || t.transfer_id);
    const allSel = ids.length > 0 && ids.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSel) ids.forEach(id => next.delete(id));
    else ids.forEach(id => next.add(id));
    setSelectedIds(next);
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleOpenListPrint = (scope = 'filtered') => {
    if (scope === 'selected' && selectedIds.size === 0) {
      showToast('ದಯವಿಟ್ಟು ಮೊದಲು ಮುದ್ರಿಸಲು ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ', 'warning');
      return;
    }
    setListPrintScope(scope);
    setListPrintModalOpen(true);
  };


  useEffect(() => {
    loadTransfers();
  }, [search, statusFilter, talukFilter]);

  const loadTransfers = async () => {
    setLoading(true);
    const res = await ApiService.getVarasaTransfers({
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
        showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ವಾರಸು ವರ್ಗಾವಣೆ ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ನವೀಕರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
        return;
      }
      const item = transfers.find(t => String(t.transfer_id) === String(transferId) || String(t.id) === String(transferId));
      setAdminApproveModal({ open: true, transfer: item, remarks: '' });
      return;
    }
    const res = await ApiService.updateVarasaStatus(transferId, newStatus);
    if (res && res.success) {
      showToast(`Application updated to: ${newStatus}`);
      loadTransfers();
    }
  };

  const handleConfirmAdminApproval = async (e) => {
    e.preventDefault();
    if (!adminApproveModal.transfer) return;
    try {
      const res = await ApiService.approveVarasaTransferByAdmin({
        transferId: adminApproveModal.transfer.transfer_id || adminApproveModal.transfer.id,
        adminUser: user?.name || 'Admin',
        remarks: adminApproveModal.remarks
      });
      if (res && res.success) {
        showToast(`ವಾರಸು ವರ್ಗಾವಣೆ ಮಂಜೂರಾಗಿದೆ! ಶೇರು ಸಂಖ್ಯೆ #${adminApproveModal.transfer.share_no} ಯಶಸ್ವಿಯಾಗಿ ${res.heir_name} ಅವರ ಹೆಸರಿಗೆ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ನವೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ಆಡಿಟ್ ಇತಿಹಾಸ ದಾಖಲಾಗಿದೆ.`);
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
    if (!window.confirm('Are you sure you want to delete this Varasa transfer record?')) return;
    const res = await ApiService.deleteVarasaTransfer(transferId);
    if (res && res.success) {
      showToast('Varasa transfer record deleted.');
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

  // 22 Official Column Headers exactly matching the user's Excel sheet:
  const OFFICIAL_HEADERS = [
    'Sl. No.',
    '1. Varasa Member',
    '1.1 Place',
    '1.2 Taluk',
    '1.3 District',
    '1.4 Relationship',
    '1.5 Age',
    '4. Mobile No',
    '1.6 Aadhar No',
    'Photo',
    '2. Share Holder',
    '2.1 Place',
    '2.2 Taluk',
    '2.3 District',
    '2.4 Relationship',
    'B. D.o.D',
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
        '1. Varasa Member': t.varasa_member || t.heir_name || '',
        '1.1 Place': t.heir_place || '',
        '1.2 Taluk': t.heir_taluk || '',
        '1.3 District': t.heir_district || '',
        '1.4 Relationship': t.heir_relationship || '',
        '1.5 Age': t.heir_age || '',
        '4. Mobile No': t.heir_mobile || '',
        '1.6 Aadhar No': t.heir_aadhaar || '',
        'Photo': t.heir_photo ? 'Attached' : '',
        '2. Share Holder': t.shareholder_name || t.existing_shareholder_name || '',
        '2.1 Place': t.shareholder_place || '',
        '2.2 Taluk': t.shareholder_taluk || '',
        '2.3 District': t.shareholder_district || '',
        '2.4 Relationship': t.shareholder_relationship || '',
        'B. D.o.D': t.dod || '',
        '5. Share No': t.share_no || t.existing_share_number || '',
        '6. Category': t.category || '',
        '7. No. of Shares': t.no_of_shares || 1,
        '9. Fees': t.fees !== undefined ? t.fees : 570,
        '10. Receipt No': t.receipt_no || '',
        '11. Rp. Date': t.receipt_date || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows, { header: OFFICIAL_HEADERS });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Varasa_Register');
      XLSX.writeFile(wb, `varasa_legal_heir_register_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Exported Varasa Legal Heir Register (.xlsx) with 22 official columns!');
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
          'ಶಂಕರಗೌಡ ಮಲ್ಲಪ್ಪ ತಾರಾಪೂರ',
          'ಅಥರ್ಗಾ',
          'ಇಂಡಿ',
          'ವಿಜಯಪುರ',
          'ಮಗ',
          '',
          '9901661920',
          '',
          '',
          'ಮಲ್ಲಪ್ಪ ಈರಣ್ಣ ತಾರಾಪೂರ',
          'ಅಥರ್ಗಾ',
          'ಇಂಡಿ',
          'ವಿಜಯಪುರ',
          'ತಂದೆ',
          '05/11/2021',
          '10006',
          'ಅ',
          1,
          570,
          '816',
          '05-11-22'
        ]
      ];
      const ws = XLSX.utils.aoa_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'varasa_transfer_template.xlsx');
      showToast('Downloaded official 22-column Varasa Excel template (.xlsx)');
    } catch (err) {
      showToast('Failed to download template: ' + err.message, 'error');
    }
  };

  // Parse uploaded Varasa Excel file
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
      const cVMember = findCol(['varasa member', 'varasa', 'ವಾರಸುದಾರ'], 1);
      const cHPlace = findCol(['1.1 place', 'place', 'ಸ್ಥಳ'], 2);
      const cHTaluk = findCol(['1.2 taluk', 'taluk', 'ತಾಲ್ಲೂಕು'], 3);
      const cHDist = findCol(['1.3 dist', 'district', 'ಜಿಲ್ಲೆ'], 4);
      const cHRel = findCol(['1.4 relation', 'relationship', 'ಸಂಬಂಧ'], 5);
      const cHAge = findCol(['1.5 age', 'age', 'ವಯಸ್ಸು'], 6);
      const cMob = findCol(['mobile', 'phone', 'ಮೊಬೈಲ್'], 7);
      const cAadh = findCol(['aadhar', 'aadhaar', 'ಆಧಾರ್'], 8);
      const cShName = findCol(['share holder', 'shareholder', 'ಮೂಲ ಶೇರುದಾರ'], 10);
      const cSPlace = findCol(['2.1 place', 'ಸ್ಥಳ'], 11);
      const cSTaluk = findCol(['2.2 taluk', 'ತಾಲ್ಲೂಕು'], 12);
      const cSDist = findCol(['2.3 dist', 'ಜಿಲ್ಲೆ'], 13);
      const cSRel = findCol(['2.4 relation', 'ಸಂಬಂಧ'], 14);
      const cDod = findCol(['d.o.d', 'dod', 'ನಿಧನ ದಿನಾಂಕ'], 15);
      const cShareNo = findCol(['share no', 'ಶೇರು'], 16);
      const cCat = findCol(['category', 'cast', 'ವರ್ಗ'], 17);
      const cNumShares = findCol(['no. of shares', 'shares', 'ಸಂಖ್ಯೆ'], 18);
      const cFees = findCol(['fees', 'fee', 'ಶುಲ್ಕ'], 19);
      const cReceiptNo = findCol(['receipt no', 'ರಶೀದಿ'], 20);
      const cReceiptDate = findCol(['rp. date', 'receipt date', 'ದಿನಾಂಕ'], 21);
      const cStatus = findCol(['status', 'approval', 'ಸ್ಥಿತಿ', 'ಮಂಜೂರಾತಿ'], -1);

      const parsedRecords = [];
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every(val => String(val || '').trim() === '')) continue;

        const getVal = (col) => (col !== undefined && col >= 0 && row[col] !== undefined) ? String(row[col]).trim() : '';

        const vName = getVal(cVMember);
        const shName = getVal(cShName);
        if (!vName && !shName) continue;

        const fileStatus = getVal(cStatus);
        let resolvedStatus = 'Approved';
        if (fileStatus) {
          if (fileStatus.toLowerCase().includes('rec') || fileStatus.includes('ಸ್ವೀಕರಿಸಲಾಗಿದೆ')) {
            resolvedStatus = 'Application Received';
          } else if (fileStatus.toLowerCase().includes('ver') || fileStatus.includes('ಪರಿಶೀಲನೆ')) {
            resolvedStatus = 'Under Verification';
          } else {
            resolvedStatus = 'Approved';
          }
        } else {
          resolvedStatus = importAsCompleted ? 'Approved' : 'Application Received';
        }

        parsedRecords.push({
          sl_no: parseInt(getVal(cSl)) || i,
          varasa_member: vName || `ವಾರಸುದಾರ ${i}`,
          heir_name: vName || `ವಾರಸುದಾರ ${i}`,
          heir_place: getVal(cHPlace) || 'ಅಥರ್ಗಾ',
          heir_taluk: getVal(cHTaluk) || 'ಇಂಡಿ',
          heir_district: getVal(cHDist) || 'ವಿಜಯಪುರ',
          heir_relationship: getVal(cHRel) || 'ಮಗ',
          heir_age: getVal(cHAge),
          heir_mobile: getVal(cMob),
          heir_aadhaar: getVal(cAadh),
          shareholder_name: shName || 'ಮೂಲ ಶೇರುದಾರ',
          existing_shareholder_name: shName || 'ಮೂಲ ಶೇರುದಾರ',
          shareholder_place: getVal(cSPlace) || getVal(cHPlace) || '',
          shareholder_taluk: getVal(cSTaluk) || getVal(cHTaluk) || 'ಇಂಡಿ',
          shareholder_district: getVal(cSDist) || getVal(cHDist) || 'ವಿಜಯಪುರ',
          shareholder_relationship: getVal(cSRel) || 'ತಂದೆ',
          dod: getVal(cDod),
          share_no: getVal(cShareNo) || String(i + 1000),
          existing_share_number: getVal(cShareNo) || String(i + 1000),
          category: getVal(cCat) || 'ಅ - ವರ್ಗ',
          no_of_shares: parseInt(getVal(cNumShares)) || 1,
          fees: parseFloat(getVal(cFees)) || 570,
          receipt_no: getVal(cReceiptNo) || String(800 + i),
          receipt_date: getVal(cReceiptDate) || new Date().toLocaleDateString('en-GB'),
          approval_status: resolvedStatus
        });
      }

      if (parsedRecords.length > 0) {
        await ApiService.addVarasaTransfersBulk(parsedRecords);
        showToast(`ಯಶಸ್ವಿಯಾಗಿ ${parsedRecords.length} ವಾರಸು ದಾಖಲೆಗಳನ್ನು ಆಮದು ಮಾಡಲಾಗಿದೆ (${importAsCompleted ? 'ಮಂಜೂರಾಗಿದೆ / ಸ್ವಾಮ್ಯತ್ವ ನವೀಕರಿಸಲಾಗಿದೆ' : 'ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ'})!`);
        setShowUploadModal(false);
        loadTransfers();
      } else {
        showToast('No valid records found in the spreadsheet.', 'error');
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
      <div className="bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-950 shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100">
                ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ (Varasa Legal-Heir Share Transfer)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                22 Columns Register
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Official statutory legal-heir transfer workflow with complete 22-column records, deceased shareholder link, photo preservation, transfer fees receipt, and committee verification.
            </p>
          </div>
        </div>

        {/* Action Buttons below header in a single row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setEditingTransfer(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + ಹೊಸ ವಾರಸು ಅರ್ಜಿ (New Varasa Application)
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Upload Varasa Excel Sheet"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್ (Import Excel)
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Export full Varasa register with 22 columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" /> ಎಕ್ಸೆಲ್ ರಫ್ತು (Export .xlsx)
          </button>

          <button
            type="button"
            onClick={() => handleOpenListPrint('filtered')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ ಪಟ್ಟಿ ಮುದ್ರಿಸಿ (Print Varasa List)"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" /> ಪಟ್ಟಿಯನ್ನು ಮುದ್ರಿಸಿ (Print List)
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Template (.xlsx)
          </button>
        </div>
      </div>

      {/* KPI Stats Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] text-slate-400 block mb-1">Total Applications</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Heir Name, Shareholder Name, Share No, Mobile, Place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-300 outline-none w-full md:w-auto"
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
            className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-300 outline-none w-full md:w-auto"
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

      {/* Selected Holders Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-fadeIn mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow">
              {selectedIds.size}
            </div>
            <span className="text-xs font-bold text-emerald-200">
              {selectedIds.size} ವಾರಸುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ ({selectedIds.size} Holders Selected)
            </span>
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
              onClick={clearSelection}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              ಆಯ್ಕೆ ತೆರವು (Clear)
            </button>
          </div>
        </div>
      )}

      
      {/* Main Varasa Records Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Loading Varasa legal-heir records...</span>
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Varasa Transfer Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a new application or import your official Varasa Excel spreadsheet to begin.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTransfer(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              Add First Varasa Application
            </button>
          </div>
        ) : (
          <TableScrollerContainer label="22 ಕಾಲಂಗಳ ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ ವಹಿ (Scroll Varasa):">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-emerald-800 border-b-2 border-emerald-400 text-white uppercase font-bold text-[10.5px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center border-r border-emerald-700/40 w-10">
                    <input
                      type="checkbox"
                      checked={transfers.length > 0 && transfers.every(t => selectedIds.has(t.id || t.transfer_id))}
                      onChange={toggleSelectAllCurrent}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="ಪ್ರಸ್ತುತ ಎಲ್ಲಾ ವಾರಸುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ"
                    />
                  </th>
                  <th className="py-3 px-3 text-center border-r border-emerald-700/40">Sl.</th>
                  <th className="py-3 px-4 border-r border-emerald-700/40">1. Varasa Member (ವಾರಸುದಾರರು)</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">1.1-1.3 Place & Taluk</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40 text-amber-300 font-extrabold">1.4 Ownership / Rel / Age</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">4. Mobile / 1.6 Aadhaar</th>
                  <th className="py-3 px-4 border-r border-emerald-700/40">2. Share Holder (ಮೂಲ ಶೇರುದಾರರು)</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">B. D.o.D (ನಿಧನ ದಿನಾಂಕ)</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40 text-amber-300">5. Share No</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">6. Category / Shares</th>
                  <th className="py-3 px-3 border-r border-emerald-700/40">Fee & 10. Receipt</th>
                  <th className="py-3 px-3 text-center border-r border-emerald-700/40">Workflow Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {transfers.map((v, idx) => {
                  const rowId = v.id || v.transfer_id;
                  const isSelected = selectedIds.has(rowId);
                  return (
                  <tr key={rowId || idx} className={`transition-colors ${isSelected ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500' : 'hover:bg-slate-900/50'}`}>
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center border-r border-slate-800/60 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowId)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    {/* Sl. No */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                      {v.sl_no || (idx + 1)}
                    </td>

                    {/* 1. Varasa Member (with Photo) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                          {v.heir_photo ? (
                            <img src={v.heir_photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{v.varasa_member || v.heir_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {v.transfer_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 1.1 - 1.3 Location */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{v.heir_place || '—'}</div>
                      <div className="text-[10px] text-slate-400">{v.heir_taluk || '—'}, {v.heir_district || 'ವಿಜಯಪುರ'}</div>
                    </td>

                    {/* 1.4 Rel / 1.5 Age */}
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                        {v.heir_relationship || 'ಮಗ'}
                      </span>
                      {v.heir_age && <span className="text-[10px] text-slate-400 ml-1.5">{v.heir_age} yrs</span>}
                    </td>

                    {/* 4. Mobile / 1.6 Aadhaar */}
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="text-slate-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{v.heir_mobile || '—'}</span>
                      </div>
                      {v.heir_aadhaar && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {v.heir_aadhaar}
                        </div>
                      )}
                    </td>

                    {/* 2. Share Holder */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">
                        {v.shareholder_name || v.existing_shareholder_name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>ಸಂಬಂಧ: {v.shareholder_relationship || 'ತಂದೆ'}</span>
                        <span>• {v.shareholder_place || v.heir_place}</span>
                      </div>
                    </td>

                    {/* B. D.o.D */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                      {v.dod ? (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {v.dod}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* 5. Share No */}
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      #{v.share_no || v.existing_share_number}
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
                        disabled={isTransferApproved(v)}
                        onChange={(e) => handleStatusUpdate(v.transfer_id || v.id, e.target.value)}
                        title={isTransferApproved(v) ? 'ಅಡ್ಮಿನ್ ಅವರಿಂದ ಮಂಜೂರಾಗಿದೆ - ಸ್ಥಿತಿ ಲಾಕ್ ಆಗಿದೆ (Approved & Locked)' : 'Change Status'}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full outline-none border ${
                          isTransferApproved(v)
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 cursor-not-allowed opacity-90'
                            : v.approval_status === 'Under Verification'
                            ? 'bg-amber-950 text-amber-300 border-amber-800 cursor-pointer'
                            : 'bg-slate-900 text-slate-400 border-slate-700 cursor-pointer'
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
                                showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ವಾರಸು ವರ್ಗಾವಣೆ ಮಂಜೂರಿಸಿ ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ನವೀಕರಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
                                return;
                              }
                              setAdminApproveModal({ open: true, transfer: v, remarks: '' });
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/70 text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
                            title="Admin Approve & Update Master Shareholder Record"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ಮಂಜೂರಾತಿ</span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 text-[10px] font-medium border border-emerald-900/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>ಮಂಜೂರಾಗಿದೆ</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setPrintSlipTransfer(v)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="ಶೇರು ವಾರಸಾ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Varasa 12-Page Complete Bundle Print)"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-400" />
                        </button>

                        {isTransferApproved(v) ? (
                          <span
                            className="p-1.5 rounded-lg bg-slate-900/60 text-amber-400/80 border border-amber-800/60 cursor-not-allowed inline-flex items-center justify-center"
                            title="ಮಂಜೂರಾದ ವಾರಸು ದಾಖಲೆಯನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ (Approved by Admin - Locked from Editing)"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTransfer(v);
                              setShowAddModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Varasa Record"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                        )}

                        {isTransferApproved(v) ? (
                          <span
                            className="p-1.5 rounded-lg bg-slate-900/40 text-slate-600 border border-slate-800/60 cursor-not-allowed inline-flex items-center justify-center opacity-40"
                            title="ಮಂಜೂರಾದ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ (Locked)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(v.transfer_id || v.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </TableScrollerContainer>
        )}
      </div>

      {/* Varasa Form Modal (New / Edit) */}
      {showAddModal && (
        <VarasaTransferModal
          key={editingTransfer ? (editingTransfer.transfer_id || editingTransfer.id || editingTransfer.sl_no || 'edit') : 'new'}
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingTransfer(null);
          }}
          initialData={editingTransfer}
          onSaveSuccess={loadTransfers}
          showToast={showToast}
        />
      )}

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> Upload Varasa Excel Sheet
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload your official 22-column Varasa transfer spreadsheet (.xlsx / .xls / .csv). Columns with Kannada headers are automatically parsed.
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
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> ಈಗಾಗಲೇ ಪೂರ್ಣಗೊಂಡಿದೆ
                  </div>
                  <div className="text-[9.5px] text-emerald-400/80 mt-1">Approved & Auto-sync Ownership to ವಾರಸದಾರರು</div>
                </button>
                <button
                  type="button"
                  onClick={() => setImportAsCompleted(false)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !importAsCompleted
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" /> ಹೊಸ ಅರ್ಜಿಗಳು
                  </div>
                  <div className="text-[9.5px] text-sky-400/80 mt-1">Application Received (Pending Approval)</div>
                </button>
              </div>
            </div>

            <div
              onClick={() => uploadFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40"
            >
              <input
                type="file"
                ref={uploadFileInputRef}
                onChange={handleUploadFile}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-200">
                {uploadFileName ? `Selected: ${uploadFileName}` : 'Click to select or drag & drop Varasa Excel file'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Supports Microsoft Excel (.xlsx, .xls) & CSV</div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
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

      {/* Official 5-Page Varasa Application Document Bundle Print Modal */}
      {printSlipTransfer && (
        <VarasaPrintModal
          isOpen={Boolean(printSlipTransfer)}
          onClose={() => setPrintSlipTransfer(null)}
          varasaData={printSlipTransfer}
          isNewSubmission={false}
        />
      )}

            {/* Admin Approval & Master Sync Modal */}
      {adminApproveModal.open && adminApproveModal.transfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ಅಡ್ಮಿನ್ ವಾರಸು ಮಂಜೂರಾತಿ (Admin Varasa Approval)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಅಧಿಕೃತ ವರ್ಗಾವಣೆ ಅನುಮೋದನೆ
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
                <strong>ಗಮನಿಸಿ:</strong> ಈ ವಾರಸು ವರ್ಗಾವಣೆಯನ್ನು ಅನುಮೋದಿಸಿದ ತಕ್ಷಣ, ಶೇರು ಸಂಖ್ಯೆ <strong>#{adminApproveModal.transfer.share_no}</strong> ಯಜಮಾನಿಕೆಯು ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಯಲ್ಲಿ ವಾರಸುದಾರರಾದ <strong>{adminApproveModal.transfer.varasa_member || adminApproveModal.transfer.heir_name}</strong> ಅವರ ಹೆಸರಿಗೆ ಅಧಿಕೃತವಾಗಿ ಬದಲಾಗುತ್ತದೆ ಮತ್ತು ಶಾಶ್ವತ ಆಡಿಟ್ ಇತಿಹಾಸ ದಾಖಲಾಗುತ್ತದೆ.
              </span>
            </div>

            {/* Transfer Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">ಮೂಲ ಶೇರುದಾರರು (ನಿಧನ)</span>
                <p className="font-semibold text-slate-200">{adminApproveModal.transfer.shareholder_name || adminApproveModal.transfer.existing_shareholder_name}</p>
                <p className="text-slate-400 text-[11px]">ಶೇರು ಸಂಖ್ಯೆ: <strong className="text-emerald-400">#{adminApproveModal.transfer.share_no}</strong></p>
                <p className="text-slate-400 text-[11px]">ಗ್ರಾಮ: {adminApproveModal.transfer.shareholder_place || '—'}</p>
                <p className="text-slate-400 text-[11px]">ನಿಧನ ದಿನಾಂಕ: {adminApproveModal.transfer.dod || '—'}</p>
              </div>

              <div className="bg-slate-950/60 border border-emerald-900/40 p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">ಹೊಸ ವಾರಸುದಾರರು</span>
                <p className="font-semibold text-slate-100">{adminApproveModal.transfer.varasa_member || adminApproveModal.transfer.heir_name}</p>
                <p className="text-slate-400 text-[11px]">ಸಂಬಂಧ: <strong>{adminApproveModal.transfer.heir_relationship}</strong></p>
                <p className="text-slate-400 text-[11px]">ಮೊಬೈಲ್: {adminApproveModal.transfer.heir_mobile || '—'}</p>
                <p className="text-slate-400 text-[11px]">ಗ್ರಾಮ: {adminApproveModal.transfer.heir_place || '—'}, {adminApproveModal.transfer.heir_taluk || ''}</p>
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
                placeholder="ಉದಾ: ನಿರ್ಣಯ ಸಂಖ್ಯೆ #14/2026 ಪ್ರಕಾರ ಮಂಜೂರು ಮಾಡಲಾಗಿದೆ (Resolution #14 approved)..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                ಮಂಜೂರಾತಿ ನೀಡಿ & ಮಾಸ್ಟರ್ ಪಟ್ಟಿಯಲ್ಲಿ ಬದಲಾಯಿಸಿ (Approve & Update Master)
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Official Statutory Varasa Register List Print Modal */}
      <RegisterListPrintModal
        isOpen={listPrintModalOpen}
        onClose={() => setListPrintModalOpen(false)}
        type="varasa"
        allRecords={transfers}
        selectedIds={selectedIds}
        initialScope={listPrintScope}
        filterSummary={{
          search,
          status: statusFilter,
          taluk: talukFilter
        }}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
