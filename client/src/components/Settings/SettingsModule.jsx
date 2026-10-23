import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService, getMemberTypeByCategory, getShareholderOwnership } from '../../services/api';
import { CloudDbService } from '../../services/cloudDb';
import * as XLSX from 'xlsx';
import {
  Settings, Save, Building2, Trash2, ShieldAlert, Upload, Download,
  FileSpreadsheet, RefreshCw, CheckCircle2, AlertTriangle, FileCheck,
  Database, Layers, Check, ArrowRight, Eye, FileText, XCircle, MapPin, Users, Cloud
} from 'lucide-react';
import BackupManager from '../Admin/BackupManager';
import ResetConfirmModal from '../Common/ResetConfirmModal';

const OFFICIAL_38_HEADERS = [
  'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
  'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
  'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
  'Pin Code', 'Circle', 'Member Type', 'Ownership', 'Tharava Date', 'Tharava No',
  'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
  'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
];

export default function SettingsModule({ initialTab = 'org' }) {
  const { showToast, user, setActiveModule } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetScope, setResetScope] = useState('everything');

  // Stats
  const [stats, setStats] = useState({
    totalShareholders: 0,
    totalAmount: 0,
    totalPlaces: 0,
    totalCircles: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Form State
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('sugar_erp_org_settings');
    return saved ? JSON.parse(saved) : {
      org_name: 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ. / Shree Bheemashankar Co-operative Sugar Factory',
      org_reg_no: 'BSSKN-MARGUR-586204',
      org_address: 'ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ / Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur',
      org_phone: '+91 8359 254800',
      org_email: 'info@bheemashankarsugar.com',
      crushing_season: '2025-2026',
      sugar_quota_per_share: '15'
    };
  });

  // Upload & Import State
  const [previewRecords, setPreviewRecords] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [autoMergeOnImport, setAutoMergeOnImport] = useState(true);
  const fileInputRef = useRef(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadDatabaseStats = async () => {
    setLoadingStats(true);
    try {
      const allSh = await ApiService.getAllShareholdersRaw();
      const records = Array.isArray(allSh) ? allSh : [];
      let totalAmt = 0;
      const placesSet = new Set();
      const circlesSet = new Set();

      records.forEach(s => {
        const rawAmt = parseFloat(s.total_amount);
        const amt = !isNaN(rawAmt) && rawAmt > 0 ? rawAmt : (parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000));
        totalAmt += amt;
        if (s.place || s.village_name) placesSet.add((s.place || s.village_name).trim());
        if (s.circle || s.circle_name) circlesSet.add((s.circle || s.circle_name).trim());
      });

      setStats({
        totalShareholders: records.length,
        totalAmount: totalAmt,
        totalPlaces: placesSet.size,
        totalCircles: circlesSet.size
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const handleSaveOrg = (e) => {
    e.preventDefault();
    localStorage.setItem('sugar_erp_org_settings', JSON.stringify(form));
    showToast('Cooperative organization settings saved successfully!');
  };

  // --- UPLOAD & IMPORT LOGIC ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processExcelOrCsvFile(file);
  };

  const processExcelOrCsvFile = async (file) => {
    setUploadFileName(file.name);
    setIsProcessingFile(true);

    try {
      const buffer = await file.arrayBuffer();
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      let rawRows = [];

      if (isExcel) {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
      } else {
        // Fallback for CSV / TSV with UTF-8 / UTF-16
        const bytes = new Uint8Array(buffer);
        let text = '';
        if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
          text = new TextDecoder('utf-16le').decode(buffer);
        } else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
          text = new TextDecoder('utf-16be').decode(buffer);
        } else {
          text = new TextDecoder('utf-8').decode(buffer);
        }
        text = text.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length > 0) {
          const firstLine = lines[0];
          let delimiter = ',';
          if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
            delimiter = '\t';
          } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
            delimiter = ';';
          }
          rawRows = lines.map(line => {
            if (delimiter === '\t') return line.split('\t').map(s => s.replace(/^"|"$/g, '').trim());
            return line.split(delimiter).map(s => s.replace(/^"|"$/g, '').trim());
          });
        }
      }

      if (!rawRows || rawRows.length < 2) {
        showToast('Uploaded spreadsheet is empty or has no data rows', 'error');
        setIsProcessingFile(false);
        return;
      }

      const headerRow = (rawRows[0] || []).map(h => String(h || '').trim().toLowerCase());
      const findCol = (keywords, defaultIdx) => {
        for (const kw of keywords) {
          const idx = headerRow.findIndex(h => h.includes(kw.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return defaultIdx;
      };

      const cBookNo = findCol(['book. no', 'book_no', 'book no', 'book', 'ಬಿ.ನಂ', 'ಬುಕ್'], 0);
      const cSlNo = findCol(['sl. no', 'sl_no', 'sl no', 'ಕ್ರಮ ಸಂಖ್ಯೆ'], 1);
      const cShareNo = findCol(['share no', 'share_no', 'ಶೇರು ನಂ', 'ಶೇರ್'], 2);
      const cName = findCol(['share holder name', 'shareholder_name', 'shareholder', 'ಹೆಸರು', 'name'], 3);
      const cGender = findCol(['gender', 'ಲಿಂಗ', 'sex'], 4);
      const cAadhaar = findCol(['aadhaar card no', 'aadhaar', 'ಆಧಾರ್'], 5);
      const cRegDate = findCol(['reg. date', 'reg_date', 'registration date', 'ನೋಂದಣಿ ದಿನಾಂಕ'], 6);
      const cReceiptNo = findCol(['receipt no', 'receipt_no', 'ಪಾವತಿ ನಂ'], 7);
      const cReceiptAmt = findCol(['receipt amount', 'receipt_amount'], 8);
      const cDate = findCol(['date', 'ದಿನಾಂಕ'], 9);
      const cReciept2 = findCol(['reciept', 'receipt'], 10);
      const cAmt = findCol(['amount', 'ಮೊತ್ತ'], 11);
      const cTotalAmt = findCol(['total amount', 'total_amount', 'ಒಟ್ಟು ಮೊತ್ತ'], 12);
      const cShares = findCol(['no. of shares', 'number_of_shares', 'shares', 'ಶೇರುಗಳ ಸಂಖ್ಯೆ'], 13);
      const cCast = findCol(['schedule cast', 'schedule_cast', 'cast', 'ವರ್ಗ', 'ಜಾತಿ'], 14);
      const cAddress = findCol(['address', 'ವಿಳಾಸ'], 15);
      const cNagara = findCol(['nagara', 'ನಗರ'], 16);
      const cRoad = findCol(['road', 'ರಸ್ತೆ'], 17);
      const cPlace = findCol(['place', 'village', 'ಗ್ರಾಮ', 'ಸ್ಥಳ'], 18);
      const cTaluk = findCol(['taluk', 'ತಾಲೂಕು'], 19);
      const cDistrict = findCol(['district', 'ಜಿಲ್ಲೆ'], 20);
      const cPincode = findCol(['pin code', 'pincode', 'ಪಿನ್ ಕೋಡ್'], 21);
      const cCircle = findCol(['circle', 'ವಲಯ', 'ಸರ್ಕಲ್'], 22);
      const cMemberType = findCol(['member type', 'member_type', 'ಸದಸ್ಯತ್ವ'], 23);
      const cOwnership = findCol(['ownership', 'ಸ್ವಾಮ್ಯ'], 24);
      const cTharavaDate = findCol(['tharava date', 'tharava_date', 'ಠರಾವು ದಿನಾಂಕ'], 25);
      const cTharavaNo = findCol(['tharava no', 'tharava_no', 'ಠರಾವು ನಂ'], 26);
      const cMobile = findCol(['mobile no', 'mobile_no', 'mobile', 'ಮೊಬೈಲ್'], 27);
      const cNominee = findCol(['nominee name', 'nominee_name', 'ವಾರಸುದಾರರ ಹೆಸರು', 'nominee'], 34);

      const parsed = [];
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.every(cell => String(cell || '').trim() === '')) continue;

        const name = String(row[cName] || '').trim();
        const shareNo = String(row[cShareNo] || '').trim();
        if (!name && !shareNo) continue;

        const rawTotalAmt = parseFloat(String(row[cTotalAmt] || '0').replace(/[^\d.]/g, '')) || 0;
        const rawReceiptAmt = parseFloat(String(row[cReceiptAmt] || row[cAmt] || '0').replace(/[^\d.]/g, '')) || 0;
        const sharesCount = parseInt(String(row[cShares] || '1').replace(/[^\d]/g, ''), 10) || 1;
        const totalAmount = rawTotalAmt > 0 ? rawTotalAmt : (rawReceiptAmt > 0 ? rawReceiptAmt : sharesCount * 2000);

        parsed.push({
          book_no: String(row[cBookNo] || 'B.No: 1').trim(),
          sl_no: parseInt(String(row[cSlNo] || i).replace(/[^\d]/g, ''), 10) || i,
          share_no: shareNo || String(i),
          shareholder_name: name || 'Unnamed Shareholder',
          gender: String(row[cGender] || 'M').trim().toUpperCase().charAt(0) || 'M',
          aadhaar_card_no: String(row[cAadhaar] || '').trim(),
          reg_date: String(row[cRegDate] || row[cDate] || '10/Aug/1982').trim(),
          receipt_no: String(row[cReceiptNo] || row[cReciept2] || String(i)).trim(),
          receipt_amount: rawReceiptAmt || 2000,
          date: String(row[cDate] || row[cRegDate] || '10/Aug/1982').trim(),
          reciept: String(row[cReciept2] || row[cReceiptNo] || String(i)).trim(),
          amount: rawReceiptAmt || 2000,
          total_amount: totalAmount,
          number_of_shares: sharesCount,
          schedule_cast: String(row[cCast] || 'ಅ - ವರ್ಗ').trim(),
          address: String(row[cAddress] || '').trim(),
          nagara: String(row[cNagara] || '').trim(),
          road: String(row[cRoad] || '').trim(),
          place: String(row[cPlace] || 'ಮರಗೂರ').trim(),
          taluk: String(row[cTaluk] || 'ಚಡಚಣ').trim(),
          district: String(row[cDistrict] || 'ವಿಜಯಪುರ').trim(),
          pin_code: String(row[cPincode] || '586204').trim(),
          circle: String(row[cCircle] || 'ಚಡಚಣ').trim(),
          member_type: String(row[cMemberType] || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)').trim(),
          ownership: String(row[cOwnership] || 'ಸ್ವಂತ (Self)').trim(),
          tharava_date: String(row[cTharavaDate] || '10/Aug/1982').trim(),
          tharava_no: String(row[cTharavaNo] || `TR-${i}/1982`).trim(),
          mobile_no: String(row[cMobile] || '').trim(),
          nominee_name: String(row[cNominee] || '').trim(),
          status: 'Active'
        });
      }

      setPreviewRecords(parsed);
      showToast(`Spreadsheet parsed! Found ${parsed.length.toLocaleString()} valid shareholder records.`);
    } catch (err) {
      console.error('File parse error:', err);
      showToast('Failed to parse file: ' + err.message, 'error');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const commitImportToRegistry = async () => {
    if (previewRecords.length === 0) return;
    setIsImporting(true);
    setUploadProgress({ uploaded: 0, total: previewRecords.length, percentage: 0 });
    const count = previewRecords.length;

    try {
      showToast(`Saving ${count.toLocaleString()} records & syncing to Cloud Database...`);
      await ApiService.addShareholdersBulk(previewRecords, (p) => {
        setUploadProgress(p);
      });

      if (autoMergeOnImport) {
        try {
          const mergeRes = await ApiService.mergeAllMultipleHoldings({ adminUser: user?.name || 'Admin' });
          if (mergeRes && mergeRes.success && mergeRes.mergedCount > 0) {
            showToast(`Auto-merge: ${mergeRes.mergedCount} duplicate shareholder records combined successfully!`);
          }
        } catch (err) {
          console.error('Auto merge error:', err);
        }
      }

      showToast(`Successfully imported & synced ${count.toLocaleString()} records across local & Cloud Database! 🟢`, 'success');
      setPreviewRecords([]);
      setUploadFileName('');
      await loadDatabaseStats();
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
    } finally {
      setIsImporting(false);
      setTimeout(() => setUploadProgress(null), 2500);
    }
  };

  const handleDownloadExcelTemplate = () => {
    const sampleRows = [
      OFFICIAL_38_HEADERS,
      ['B.No: 1', 1, '1', 'ಈರಣ್ಣ ಸೋಮಲಿಂಗ ಧುಮಾಳೆ', 'M', '1234 5678 9012', '10/Aug/1982', '1', 1000, '10/Aug/1982', '1', 1000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಮರಗೂರ ಮುಖ್ಯ ರಸ್ತೆ, ಚಡಚಣ', 'ರೈತ ನಗರ', 'ಮೇನ್ ರೋಡ್', 'ಮರಗೂರ', 'ಚಡಚಣ', 'ವಿಜಯಪುರ', '586 204', 'ಚಡಚಣ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-01/1982', '9845012341', '', '', '', 'Yes', 'Yes', 'Yes', 'ಸೋಮಲಿಂಗ ಈರಣ್ಣ ಧುಮಾಳೆ', '1234 5678 9900', '9845012342', 'ಮರಗೂರ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 2, '2', 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', 'M', '7890 1234 5678', '10/Aug/1982', '2', 1000, '10/Aug/1982', '2', 1000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಅಗಸಿ ಹತ್ತಿರ, ಇಂಡಿ ರಸ್ತೆ', 'ಬ್ರಾಹ್ಮಣ ಗಲ್ಲಿ', 'ದೇವಸ್ಥಾನ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-02/1982', '9845012343', '', '', '', 'Yes', 'Yes', 'Yes', 'ವೆಂಕಟೇಶ ರಮೇಶ ಪುರಾಣಿಕ', '7890 1234 9900', '9845012344', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shareholders_Ledger');
    XLSX.writeFile(wb, 'shareholders_details_template.xlsx');
    showToast('Downloaded official 38-column Excel (.xlsx) template with Kannada Unicode');
  };

  const handleDownloadCsvTemplate = () => {
    const sampleRows = [
      OFFICIAL_38_HEADERS.join(','),
      '"B.No: 1",1,"1","ಈರಣ್ಣ ಸೋಮಲಿಂಗ ಧುಮಾಳೆ","M","1234 5678 9012","10/Aug/1982","1",1000,"10/Aug/1982","1",1000,2000,1,"ಅ - ವರ್ಗ","ಮರಗೂರ ಮುಖ್ಯ ರಸ್ತೆ, ಚಡಚಣ","ರೈತ ನಗರ","ಮೇನ್ ರೋಡ್","ಮರಗೂರ","ಚಡಚಣ","ವಿಜಯಪುರ","586 204","ಚಡಚಣ","ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)","ಸ್ವಂತ (Self)","10/Aug/1982","TR-01/1982","9845012341","","","","Yes","Yes","Yes","ಸೋಮಲಿಂಗ ಈರಣ್ಣ ಧುಮಾಳೆ","1234 5678 9900","9845012342","ಮರಗೂರ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ"'
    ].join('\n');

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shareholders_details_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded official 38-column CSV template (UTF-8 BOM)');
  };

  // --- DATA EXPORT LOGIC ---
  const handleExportAllToExcel = async () => {
    setIsExporting(true);
    showToast('Preparing complete 38-column Excel ledger of all shareholders...');
    try {
      const allSh = await ApiService.getAllShareholdersRaw();
      const records = Array.isArray(allSh) ? allSh : [];

      if (records.length === 0) {
        showToast('No shareholder records found to export', 'error');
        setIsExporting(false);
        return;
      }

      let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      tableHtml += '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
      tableHtml += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Shareholders Master Ledger</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
      tableHtml += '<body style="font-family:\'Noto Sans Kannada\', Arial, sans-serif;">';
      tableHtml += `<h3>${form.org_name}</h3>`;
      tableHtml += `<p>Shareholder Statutory Registry (38 Columns Official Format) • Total Records: ${records.length.toLocaleString()}</p>`;
      tableHtml += '<table border="1"><thead><tr style="background-color:#16a34a; color:#ffffff; font-weight:bold;">';
      OFFICIAL_38_HEADERS.forEach(h => { tableHtml += `<th>${h}</th>`; });
      tableHtml += '</tr></thead><tbody>';

      records.forEach(s => {
        tableHtml += '<tr>';
        tableHtml += `<td>${s.book_no || 'B.No: 1'}</td>`;
        tableHtml += `<td>${s.sl_no || s.id}</td>`;
        tableHtml += `<td>${s.share_no || s.share_number || ''}</td>`;
        tableHtml += `<td>${s.shareholder_name || s.name || ''}</td>`;
        tableHtml += `<td>${s.gender || 'M'}</td>`;
        tableHtml += `<td>${s.aadhaar_card_no || s.aadhaar_ref || ''}</td>`;
        tableHtml += `<td>${s.reg_date || s.registration_date || ''}</td>`;
        tableHtml += `<td>${s.receipt_no || ''}</td>`;
        tableHtml += `<td>${s.receipt_amount || s.amount || 2000}</td>`;
        tableHtml += `<td>${s.date || s.reg_date || ''}</td>`;
        tableHtml += `<td>${s.reciept || s.receipt_no || ''}</td>`;
        tableHtml += `<td>${s.amount || s.receipt_amount || 2000}</td>`;
        tableHtml += `<td>${s.total_amount || s.share_value || 2000}</td>`;
        tableHtml += `<td>${s.number_of_shares || 1}</td>`;
        tableHtml += `<td>${s.schedule_cast || 'ಅ - ವರ್ಗ'}</td>`;
        tableHtml += `<td>${s.address || ''}</td>`;
        tableHtml += `<td>${s.nagara || ''}</td>`;
        tableHtml += `<td>${s.road || ''}</td>`;
        tableHtml += `<td>${s.place || s.village_name || ''}</td>`;
        tableHtml += `<td>${s.taluk || ''}</td>`;
        tableHtml += `<td>${s.district || ''}</td>`;
        tableHtml += `<td>${s.pin_code || ''}</td>`;
        tableHtml += `<td>${s.circle || s.circle_name || ''}</td>`;
        tableHtml += `<td>${getMemberTypeByCategory(s.schedule_cast, s.member_type)}</td>`;
        tableHtml += `<td>${getShareholderOwnership(s)}</td>`;
        tableHtml += `<td>${s.tharava_date || ''}</td>`;
        tableHtml += `<td>${s.tharava_no || ''}</td>`;
        tableHtml += `<td>${s.mobile_no || s.mobile || ''}</td>`;
        tableHtml += `<td>${s.photo_url || ''}</td>`;
        tableHtml += `<td>${s.signature_url || ''}</td>`;
        tableHtml += `<td>${s.thumb_url || ''}</td>`;
        tableHtml += `<td>${s.photo_updated || 'No'}</td>`;
        tableHtml += `<td>${s.signature_updated || 'No'}</td>`;
        tableHtml += `<td>${s.thumb_updated || 'Yes'}</td>`;
        tableHtml += `<td>${s.nominee_name || ''}</td>`;
        tableHtml += `<td>${s.nominee_aadhaar_no || ''}</td>`;
        tableHtml += `<td>${s.nominee_mobile_no || ''}</td>`;
        tableHtml += `<td>${s.nominee_address || ''}</td>`;
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></body></html>';

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BSSKN_Shareholders_Statutory_Ledger_${records.length}_Records.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported all ${records.length.toLocaleString()} shareholders to Excel (.xls) with 100% Kannada Unicode!`);
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllToCsv = async () => {
    setIsExporting(true);
    showToast('Generating complete 38-column CSV export...');
    try {
      const allSh = await ApiService.getAllShareholdersRaw();
      const records = Array.isArray(allSh) ? allSh : [];

      if (records.length === 0) {
        showToast('No shareholder records found to export', 'error');
        setIsExporting(false);
        return;
      }

      const rows = records.map(s => [
        `"${s.book_no || 'B.No: 1'}"`,
        s.sl_no || s.id,
        s.share_no || s.share_number || '',
        `"${(s.shareholder_name || s.name || '').replace(/"/g, '""')}"`,
        s.gender || 'M',
        `"${s.aadhaar_card_no || s.aadhaar_ref || ''}"`,
        `"${s.reg_date || s.registration_date || ''}"`,
        s.receipt_no || '',
        s.receipt_amount || s.amount || 2000,
        `"${s.date || s.reg_date || ''}"`,
        s.reciept || s.receipt_no || '',
        s.amount || s.receipt_amount || 2000,
        s.total_amount || s.share_value || 2000,
        s.number_of_shares || 1,
        `"${s.schedule_cast || 'ಅ - ವರ್ಗ'}"`,
        `"${(s.address || '').replace(/"/g, '""')}"`,
        `"${(s.nagara || '').replace(/"/g, '""')}"`,
        `"${(s.road || '').replace(/"/g, '""')}"`,
        `"${(s.place || s.village_name || '').replace(/"/g, '""')}"`,
        `"${(s.taluk || '').replace(/"/g, '""')}"`,
        `"${(s.district || '').replace(/"/g, '""')}"`,
        `"${s.pin_code || ''}"`,
        `"${(s.circle || s.circle_name || '').replace(/"/g, '""')}"`,
        `"${getMemberTypeByCategory(s.schedule_cast, s.member_type)}"`,
        `"${getShareholderOwnership(s)}"`,
        `"${s.tharava_date || ''}"`,
        `"${s.tharava_no || ''}"`,
        `"${s.mobile_no || s.mobile || ''}"`,
        `"${s.photo_url || ''}"`,
        `"${s.signature_url || ''}"`,
        `"${s.thumb_url || ''}"`,
        s.photo_updated || 'No',
        s.signature_updated || 'No',
        s.thumb_updated || 'Yes',
        `"${(s.nominee_name || '').replace(/"/g, '""')}"`,
        `"${s.nominee_aadhaar_no || ''}"`,
        `"${s.nominee_mobile_no || ''}"`,
        `"${(s.nominee_address || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [OFFICIAL_38_HEADERS.join(','), ...rows.map(e => e.join(','))].join('\n');
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BSSKN_Shareholders_Statutory_Ledger_${records.length}_Records.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported all ${records.length.toLocaleString()} shareholders to Unicode CSV (UTF-8 BOM)!`);
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCircleSummary = async () => {
    setIsExporting(true);
    showToast('Generating Placewise & Circlewise summary spreadsheet...');
    try {
      const allSh = await ApiService.getAllShareholdersRaw();
      const records = Array.isArray(allSh) ? allSh : [];

      const map = new Map();
      records.forEach(s => {
        const place = (s.place || s.village_name || 'ಇತರೆ').trim();
        const circle = (s.circle || s.circle_name || 'ಇತರೆ').trim();
        const key = `${circle}___${place}`;
        const rawAmt = parseFloat(s.total_amount);
        const amt = !isNaN(rawAmt) && rawAmt > 0 ? rawAmt : (parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000));
        const shares = parseInt(s.number_of_shares, 10) || 1;

        if (!map.has(key)) {
          map.set(key, { circle, place, count: 0, shares: 0, amount: 0 });
        }
        const item = map.get(key);
        item.count += 1;
        item.shares += shares;
        item.amount += amt;
      });

      const summaryList = Array.from(map.values()).sort((a, b) => a.circle.localeCompare(b.circle, 'kn') || a.place.localeCompare(b.place, 'kn'));

      let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      tableHtml += '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>';
      tableHtml += '<body style="font-family:\'Noto Sans Kannada\', Arial, sans-serif;">';
      tableHtml += `<h3>${form.org_name} - Placewise & Circlewise Summary</h3>`;
      tableHtml += '<table border="1"><thead><tr style="background-color:#0d9488; color:#ffffff; font-weight:bold;">';
      tableHtml += '<th>#</th><th>Circle (ಸರ್ಕಲ್)</th><th>Place (ಗ್ರಾಮ / ಸ್ಥಳ)</th><th>Total Shareholders (ಒಟ್ಟು ಸದಸ್ಯರು)</th><th>Total Shares (ಶೇರುಗಳು)</th><th>Total Share Capital (₹)</th>';
      tableHtml += '</tr></thead><tbody>';

      let totalCount = 0, totalShares = 0, totalAmt = 0;
      summaryList.forEach((r, idx) => {
        totalCount += r.count;
        totalShares += r.shares;
        totalAmt += r.amount;
        tableHtml += `<tr><td>${idx + 1}</td><td>${r.circle}</td><td>${r.place}</td><td>${r.count}</td><td>${r.shares}</td><td>${r.amount}</td></tr>`;
      });
      tableHtml += `<tr style="font-weight:bold; background-color:#f1f5f9;"><td colspan="3">Grand Total (ಒಟ್ಟು)</td><td>${totalCount}</td><td>${totalShares}</td><td>${totalAmt}</td></tr>`;
      tableHtml += '</tbody></table></body></html>';

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BSSKN_Placewise_Circlewise_Summary.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported Placewise & Circlewise summary to Excel!');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncOfficial17076 = async () => {
    setIsProcessingFile(true);
    setUploadProgress({ uploaded: 0, total: 17076, percentage: 0 });
    showToast('Syncing official 17,076 records across all 10 circles and Cloud Database...');
    try {
      const res = await ApiService.restoreOfficialData((p) => {
        setUploadProgress(p);
      });
      if (res.success) {
        showToast(`Successfully synced ${res.count.toLocaleString()} official shareholders to local & Cloud DB! 🟢`, 'success');
        await loadDatabaseStats();
      } else {
        showToast(`Sync failed: ${res.message}`, 'error');
      }
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setIsProcessingFile(false);
      setUploadProgress(null);
    }
  };

  const handlePullFromCloud = async () => {
    setIsProcessingFile(true);
    setUploadProgress({ downloaded: 0, total: 17076, percentage: 0 });
    showToast('Pulling complete shareholder registry from Supabase Cloud Database...');
    try {
      const res = await ApiService.syncAllShareholdersFromCloud((p) => {
        setUploadProgress(p);
      });
      if (res.success) {
        showToast(`Successfully synced ${res.count.toLocaleString()} records from Cloud Database! 🟢`, 'success');
        await loadDatabaseStats();
      } else {
        showToast(`Sync failed: ${res.message}`, 'error');
      }
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    } finally {
      setIsProcessingFile(false);
      setUploadProgress(null);
    }
  };

  const TABS = [
    { id: 'org', label: '1. Organization Profile (ಸಂಸ್ಥೆಯ ವಿವರ)', icon: Building2 },
    { id: 'clouddb', label: '2. Cloud Database (ಕ್ಲೌಡ್ ಡೇಟಾಬೇಸ್ - Supabase)', icon: Cloud },
    { id: 'upload', label: '3. Upload & Import (ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್)', icon: Upload },
    { id: 'export', label: '4. Data Export (ಡೇಟಾ ರಫ್ತು - Excel/CSV)', icon: Download },
    { id: 'reset', label: '5. Erase & Reset (ಡೇಟಾ ರಿಸೆಟ್)', icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" /> Cooperative Settings & Data Center (ಸೆಟ್ಟಿಂಗ್ಸ್ & ಡೇಟಾ ನಿರ್ವಹಣೆ)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure organization branding, season quotas, bulk Excel upload, 38-column registry exports & factory reset
          </p>
        </div>

        {/* Live Database Counter Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Live Registry:</span>
            <span className="font-bold text-emerald-300 font-mono">
              {loadingStats ? 'Loading...' : `${stats.totalShareholders.toLocaleString()} Members`}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 ring-1 ring-emerald-400/50 scale-[1.02]'
                  : 'bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORGANIZATION & QUOTA SETTINGS */}
      {activeTab === 'org' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-3xl space-y-5 animate-fadeIn">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Organization Profile & Sugar Quota Parameters
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              These details appear on official share certificates, ID cards, statutory receipts, and print exports.
            </p>
          </div>

          <form onSubmit={handleSaveOrg} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cooperative Society Official Name *</label>
              <input
                type="text"
                required
                value={form.org_name}
                onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={form.org_reg_no}
                  onChange={(e) => setForm({ ...form, org_reg_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Active Crushing Season</label>
                <input
                  type="text"
                  value={form.crushing_season}
                  onChange={(e) => setForm({ ...form, crushing_season: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Official Contact Phone</label>
                <input
                  type="text"
                  value={form.org_phone}
                  onChange={(e) => setForm({ ...form, org_phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Sugar Quota per Share (kg)</label>
                <input
                  type="number"
                  value={form.sugar_quota_per_share}
                  onChange={(e) => setForm({ ...form, sugar_quota_per_share: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-emerald-400 font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Postal Address *</label>
              <textarea
                rows="2"
                value={form.org_address}
                onChange={(e) => setForm({ ...form, org_address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-100 outline-none leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Organization Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CLOUD DATABASE (SUPABASE) & BACKUP */}
      {activeTab === 'clouddb' && (
        <div className="space-y-6 animate-fadeIn">
          <BackupManager />
        </div>
      )}

      {/* TAB 3: DATA UPLOAD & IMPORT */}
      {activeTab === 'upload' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Info & Action Header */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" /> Bulk Shareholder Excel / CSV Upload (ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್)
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Upload your complete 38-column shareholder registry spreadsheet (.xlsx, .xls, .csv). Full Kannada Unicode is 100% supported.
                </p>
              </div>

              {/* Template Download Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-teal-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all shadow-sm cursor-pointer"
                  title="Download standard 38-column Excel template with Kannada sample rows"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-400" /> Excel Template (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-all shadow-sm cursor-pointer"
                  title="Download CSV template with UTF-8 BOM"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> CSV Template (.csv)
                </button>
              </div>
            </div>

            {/* Dropzone Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-900/50 hover:bg-slate-900 p-8 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                {isProcessingFile ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">
                  {uploadFileName ? uploadFileName : 'Click to select or drag & drop Excel / CSV file here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) & Unicode CSV with 38 statutory cooperative columns
                </p>
              </div>
            </div>

            {/* Auto-Merge Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="settingsAutoMerge"
                  checked={autoMergeOnImport}
                  onChange={(e) => setAutoMergeOnImport(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="settingsAutoMerge" className="text-slate-300 font-medium cursor-pointer">
                  Auto-merge duplicate holdings on import (ಒಂದೇ ಹೆಸರು ಮತ್ತು ಗ್ರಾಮದ ಬಹು-ಶೇರುಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ವಿಲೀನಗೊಳಿಸಿ)
                </label>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
                Recommended for clean ledger
              </span>
            </div>
          </div>

          {/* Validation & Preview Section */}
          {previewRecords.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Parsed {previewRecords.length.toLocaleString()} Shareholder Records from {uploadFileName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify records preview below before committing into the live IndexedDB database
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isImporting}
                    onClick={() => { setPreviewRecords([]); setUploadFileName(''); }}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs rounded-xl cursor-pointer"
                  >
                    Clear
                  </button>

                  <button
                    disabled={isImporting}
                    onClick={commitImportToRegistry}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Import & Save {previewRecords.length.toLocaleString()} to Live Registry
                  </button>
                </div>
              </div>

              {/* Real-time Cloud Sync Progress Bar */}
              {(isImporting || uploadProgress) && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-semibold flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Syncing & Uploading to Supabase Cloud Database across all browsers...
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {uploadProgress ? `${(uploadProgress.uploaded || uploadProgress.downloaded || 0).toLocaleString()} / ${(uploadProgress.total || 0).toLocaleString()} (${uploadProgress.percentage || 0}%)` : 'Processing...'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress?.percentage || 15}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scrollable Preview Table */}
              <div className="overflow-x-auto max-h-[50vh] border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Book No</th>
                      <th className="py-2.5 px-3">Sl No</th>
                      <th className="py-2.5 px-3">Share No</th>
                      <th className="py-2.5 px-4">Share Holder Name</th>
                      <th className="py-2.5 px-2 text-center">Gender</th>
                      <th className="py-2.5 px-3">Place</th>
                      <th className="py-2.5 px-3">Taluk</th>
                      <th className="py-2.5 px-3">Circle</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-2 text-center">Shares</th>
                      <th className="py-2.5 px-3">Schedule Cast</th>
                      <th className="py-2.5 px-3 font-mono">Mobile</th>
                      <th className="py-2.5 px-3">Nominee Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {previewRecords.slice(0, 50).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-mono text-sky-400 font-bold">{r.book_no}</td>
                        <td className="py-2 px-3 font-mono">{r.sl_no}</td>
                        <td className="py-2 px-3 font-mono text-emerald-400 font-bold">{r.share_no}</td>
                        <td className="py-2 px-4 font-bold text-slate-100">{r.shareholder_name}</td>
                        <td className="py-2 px-2 text-center">{r.gender}</td>
                        <td className="py-2 px-3 font-bold text-emerald-300">{r.place}</td>
                        <td className="py-2 px-3">{r.taluk}</td>
                        <td className="py-2 px-3 text-slate-400">{r.circle}</td>
                        <td className="py-2 px-3 text-right font-mono text-amber-400 font-bold">₹ {(r.total_amount || 2000).toLocaleString()}</td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-400">{r.number_of_shares}</td>
                        <td className="py-2 px-3 text-center">{r.schedule_cast}</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">{r.mobile_no || '—'}</td>
                        <td className="py-2 px-3 text-slate-300">{r.nominee_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRecords.length > 50 && (
                <p className="text-[11px] text-slate-500 text-right">
                  Showing preview of first 50 rows out of {previewRecords.length.toLocaleString()} parsed records.
                </p>
              )}
            </div>
          )}

          {/* Quick 1-Click Official Master Dataset Sync */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-900/60 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-200 flex items-center gap-2">
                    Sync / Restore Official 17,076 Shareholder Master Data (ಅಧಿಕೃತ 17,076 ಶೇರುದಾರರ ಮಾಹಿತಿ ಮರುಸ್ಥಾಪನೆ)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Instantly load the full 17,076 shareholder dataset with 357 village circle mappings into this device. Perfect if database was cleared or setting up on a new device.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={handlePullFromCloud}
                  title="Download and sync all records from Supabase Cloud Database to this browser"
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
                >
                  <Cloud className={`w-4 h-4 ${isProcessingFile ? 'animate-spin' : ''}`} />
                  <span>Pull from Cloud DB</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={handleSyncOfficial17076}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessingFile ? 'animate-spin' : ''}`} />
                  <span>Sync 17,076 Master Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA EXPORT */}
      {activeTab === 'export' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Total Shareholders</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {stats.totalShareholders.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Total Share Capital</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                ₹ {stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Covered Villages / Places</p>
              <p className="text-xl font-bold text-sky-400 font-mono mt-1">
                {stats.totalPlaces.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Operational Circles</p>
              <p className="text-xl font-bold text-teal-400 font-mono mt-1">
                {stats.totalCircles.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Option 1: Full Excel .xls */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-600/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Export Full Statutory Ledger to Excel (.xls)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Downloads all 38 statutory cooperative columns with 100% Kannada Unicode font encoding, green headers, and Microsoft Excel formatting.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportAllToExcel}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Complete Excel (.xls)</span>
              </button>
            </div>

            {/* Option 2: Full Unicode CSV */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-teal-600/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Export Full Registry to CSV (Unicode UTF-8)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Standard comma-separated format with UTF-8 Byte Order Mark (BOM). Suitable for external audits, database backups, and custom reporting.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportAllToCsv}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-950 transition-all cursor-pointer"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Unicode CSV (.csv)</span>
              </button>
            </div>

            {/* Option 3: Circle & Village Summary */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-sky-600/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Placewise & Circlewise Summary (.xls)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Aggregated summary table grouped by operational Circle and Village, showing total shareholder counts and combined capital values.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportCircleSummary}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Summary Excel (.xls)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ERASE & RESET DATABASE */}
      {activeTab === 'reset' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Danger Zone: Two Erase Scopes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Scope 1: Erase Shareholders Only */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 border border-amber-900/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-200">
                    Clear Shareholders Database Only (ಶೇರುದಾರರ ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ಅಳಿಸಿ)
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Removes all currently loaded shareholder records ({stats.totalShareholders.toLocaleString()}) from IndexedDB while preserving circle masters, village configurations, and cooperative settings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setResetScope('shareholders'); setShowResetModal(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-950 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Erase Shareholder Records</span>
              </button>
            </div>

            {/* Scope 2: Full Factory Reset */}
            <div className="bg-gradient-to-br from-rose-950/40 via-slate-950 to-slate-900 border border-rose-900/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-200">
                    Erase Everything & Factory Reset (ಸಂಪೂರ್ಣ ಸಿಸ್ಟಂ ರಿಸೆಟ್)
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Permanently purges all data from IndexedDB and browser storage (shareholders, transactions, sugar allotments, attendance logs). Restores the application to a pristine empty state.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setResetScope('everything'); setShowResetModal(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-950 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Erase Everything & Factory Reset</span>
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              If you mistakenly erase records, you can always click <strong className="text-emerald-400 font-semibold">"Sync 17,076 Master Records"</strong> under the Upload tab to restore the official factory dataset at any time.
            </span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetComplete={async () => {
          await loadDatabaseStats();
        }}
      />
    </div>
  );
}
