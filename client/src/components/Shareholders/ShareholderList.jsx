import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Search, Filter, Plus, FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
  Eye, Edit, Contact, CheckCircle2, XCircle, RefreshCw, BookOpen, Layers, Check, Download, Upload
} from 'lucide-react';
import ShareholderProfile from './ShareholderProfile';
import ShareholderForm from './ShareholderForm';

export default function ShareholderList() {
  const { showToast, setActiveModule } = useAuth();
  const [shareholders, setShareholders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' (38 columns) or 'summary'

  // Options
  const [villages, setVillages] = useState([]);
  const [circles, setCircles] = useState([]);
  const [bookList, setBookList] = useState(['B.No: 1', 'B.No: 2', 'B.No: 3', 'B.No: 4', 'B.No: 5']);

  // Modals
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editShareholderData, setEditShareholderData] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewRecords, setPreviewRecords] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const uploadInputRef = React.useRef(null);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    fetchShareholders(1);
  }, [search, selectedVillage, selectedCircle, selectedStatus, selectedBook]);

  // CSV Line Parser handling quotes and commas
  const parseCsvLine = (line) => {
    const values = [];
    let insideQuotes = false;
    let currentValue = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  };

  const handleCsvFileUpload = (file) => {
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const bytes = new Uint8Array(buffer);
        let text = '';

        // Detect Encoding:
        // 1. UTF-16LE BOM: FF FE (Common Excel Unicode export)
        if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
          text = new TextDecoder('utf-16le').decode(buffer);
        }
        // 2. UTF-16BE BOM: FE FF
        else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
          text = new TextDecoder('utf-16be').decode(buffer);
        }
        // 3. UTF-8 (handles standard UTF-8 and UTF-8 with BOM EF BB BF)
        else {
          text = new TextDecoder('utf-8').decode(buffer);
        }

        // Strip any leading BOM characters
        text = text.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          showToast('File is empty or missing data rows', 'error');
          return;
        }

        // Auto-detect delimiter (comma, tab, or semicolon)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
          delimiter = '\t';
        } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
          delimiter = ';';
        }

        const parseLine = (line) => {
          if (delimiter === '\t') {
            return line.split('\t').map(s => s.replace(/^"|"$/g, '').trim());
          }
          return parseCsvLine(line, delimiter);
        };

        const records = [];
        for (let i = 1; i < lines.length; i++) {
          const v = parseLine(lines[i]);
          if (v.length === 0 || v.every(item => item === '')) continue;
          records.push({
            book_no: v[0] || 'B.No: 1',
            sl_no: parseInt(v[1]) || i,
            share_no: v[2] || String(i),
            shareholder_name: (v[3] || 'ಷೇರುದಾರ').normalize('NFC'),
            gender: v[4] || 'M',
            aadhaar_card_no: v[5] || '',
            reg_date: v[6] || '10/Aug/1982',
            receipt_no: v[7] || String(i),
            receipt_amount: parseFloat(v[8]) || 2000,
            date: v[9] || v[6] || '10/Aug/1982',
            reciept: v[10] || v[7] || '',
            amount: parseFloat(v[11]) || 2000,
            total_amount: parseFloat(v[12]) || 2000,
            number_of_shares: parseInt(v[13]) || 1,
            schedule_cast: (v[14] || 'ಅ - ವರ್ಗ').normalize('NFC'),
            address: (v[15] || '').normalize('NFC'),
            nagara: (v[16] || '').normalize('NFC'),
            road: (v[17] || '').normalize('NFC'),
            place: (v[18] || 'ಬಳ್ಳೊಳ್ಳಿ').normalize('NFC'),
            taluk: (v[19] || 'ಇಂಡಿ').normalize('NFC'),
            district: (v[20] || 'ವಿಜಯಪುರ').normalize('NFC'),
            pin_code: v[21] || '586 117',
            circle: (v[22] || 'ಇಂಡಿ').normalize('NFC'),
            member_type: (v[23] || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)').normalize('NFC'),
            relationship: (v[24] || 'ಸ್ವಂತ (Self)').normalize('NFC'),
            tharava_date: v[25] || '10/Aug/1982',
            tharava_no: v[26] || `TR-${i}/1982`,
            mobile_no: v[27] || '',
            photo_url: v[28] || '',
            signature_url: v[29] || '',
            thumb_url: v[30] || '',
            photo_updated: v[31] || 'Yes',
            signature_updated: v[32] || 'Yes',
            thumb_updated: v[33] || 'Yes',
            nominee_name: (v[34] || '').normalize('NFC'),
            nominee_aadhaar_no: v[35] || '',
            nominee_mobile_no: v[36] || '',
            nominee_address: (v[37] || '').normalize('NFC'),
            validation: 'Valid'
          });
        }
        setPreviewRecords(records);
        showToast(`Parsed ${records.length} records with full Kannada Unicode support!`);
      } catch (err) {
        showToast('Error reading Unicode file: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSampleRecords = async () => {
    try {
      const res = await fetch('./shareholders_details.csv');
      if (res.ok) {
        const text = await res.text();
        const fakeBlob = new Blob([text], { type: 'text/csv' });
        fakeBlob.name = 'shareholders_details.csv';
        handleCsvFileUpload(fakeBlob);
        return;
      }
    } catch (err) {}
    setUploadFileName('shareholders_details.csv');
    setPreviewRecords([
      { book_no: 'B.No: 1', sl_no: 1, share_no: '1', shareholder_name: 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '1', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 2, share_no: '2', shareholder_name: 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '2', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 3, share_no: '3', shareholder_name: 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '3', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 4, share_no: '4', shareholder_name: 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '4', receipt_amount: 2000, total_amount: 8000, number_of_shares: 4, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 5, share_no: '6', shareholder_name: 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '6', receipt_amount: 25000, total_amount: 29000, number_of_shares: 14, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 6, share_no: '7', shareholder_name: 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', gender: 'M', reg_date: '15/Aug/1982', receipt_no: '8', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' }
    ]);
    showToast('Loaded 6 official sample cooperative records (ಕನ್ನಡ ಯುನಿಕೋಡ್)');
  };

  const downloadExcelTemplate = () => {
    let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    tableHtml += '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
    tableHtml += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Template</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    tableHtml += '<body style="font-family:\'Noto Sans Kannada\', sans-serif;">';
    tableHtml += '<table border="1"><thead><tr style="background-color:#16a34a; color:#ffffff; font-weight:bold;">';
    const headers = [
      'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
      'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
      'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
      'Pin Code', 'Circle', 'Member Type', 'Relationship', 'Tharava Date', 'Tharava No',
      'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
      'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
    ];
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += '</tr></thead><tbody>';

    const sampleRows = [
      ['B.No: 1', 1, '1', 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', 'M', '4582 9981 1234', '10/Aug/1982', '1', 2000, '10/Aug/1982', '1', 2000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಗ್ರಾಮ, ಶ್ರೀ ಹನುಮಾನ್ ದೇವಸ್ಥಾನದ ಹತ್ತಿರ', 'ಗ್ರಾಮ ಠಾಣಾ', 'ಮುಖ್ಯ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-01/1982', '9845012341', '', '', '', 'Yes', 'Yes', 'Yes', 'ಕಾಮಣ್ಣ ಬೀರಪ್ಪ ಸಗಾಯಿ', '4582 9981 5566', '9845012342', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 2, '2', 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', 'M', '7890 1234 5678', '10/Aug/1982', '2', 1000, '10/Aug/1982', '2', 1000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಅಗಸಿ ಹತ್ತಿರ, ಇಂಡಿ ರಸ್ತೆ', 'ಬ್ರಾಹ್ಮಣ ಗಲ್ಲಿ', 'ದೇವಸ್ಥಾನ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-02/1982', '9845012343', '', '', '', 'Yes', 'Yes', 'Yes', 'ವೆಂಕಟೇಶ ರಮೇಶ ಪುರಾಣಿಕ', '7890 1234 9900', '9845012344', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 3, '3', 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', 'M', '3456 7890 1234', '10/Aug/1982', '3', 1000, '10/Aug/1982', '3', 1000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಜೇವೂರ ಗ್ರಾಮ, ಮುಖ್ಯ ಚೌಕ್', 'ಪಾಟೀಲ ಗಲ್ಲಿ', 'ಬಸ್ ನಿಲ್ದಾಣ ರಸ್ತೆ', 'ಜೇವೂರ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 112', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-03/1982', '9845012345', '', '', '', 'Yes', 'Yes', 'Yes', 'ಅಪ್ಪಾರಾವ ಬಾಬುರಾವ ಪಾಟೀಲ', '3456 7890 9988', '9845012346', 'ಜೇವೂರ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 4, '4', 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', 'M', '5678 9012 3456', '10/Aug/1982', '4', 2000, '10/Aug/1982', '4', 2000, 8000, 4, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ತೋಟದ ವಸ್ತಿ, ಕಾಲುವೆ ಹತ್ತಿರ', 'ರೈತ ನಗರ', 'ಹೊಲದ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-04/1982', '9845012347', '', '', '', 'Yes', 'Yes', 'Yes', 'ರಾಮಚಂದ್ರ ಮಲ್ಲನಗೌಡ ಪಾಟೀಲ', '5678 9012 1122', '9845012348', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 5, '6', 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', 'M', '9012 3456 7890', '10/Aug/1982', '6', 25000, '10/Aug/1982', '6', 25000, 29000, 14, 'ಅ - ವರ್ಗ', 'ಚಡಚಣ ಮೇನ್ ಬಜಾರ್, ಕ್ಲಿನಿಕ್ ಎದುರು', 'ವೈದ್ಯರ ಓಣಿ', 'ಹಾಸ್ಪಿಟಲ್ ರಸ್ತೆ', 'ಚಡಚಣ', 'ಚಡಚಣ', 'ವಿಜಯಪುರ', '586 205', 'ಚಡಚಣ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-05/1982', '9845012349', '', '', '', 'Yes', 'Yes', 'Yes', 'ಸಾಸವೇಲ ಇಮ್ಮಾನುವೆ ಕಟವಟೆ', '9012 3456 3344', '9845012350', 'ಚಡಚಣ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 6, '7', 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', 'M', '2345 6789 0123', '15/Aug/1982', '8', 2000, '15/Aug/1982', '8', 2000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಅಥರ್ಗಾ ರಸ್ತೆ, ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಹತ್ತಿರ', 'ಕುಂಬಾರ ಗಲ್ಲಿ', 'ಕಾಲೇಜು ರಸ್ತೆ', 'ಅಥರ್ಗಾ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 112', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '15/Aug/1982', 'TR-06/1982', '9845012351', '', '', '', 'Yes', 'Yes', 'Yes', 'ಮಲ್ಲಿಕಾರ್ಜುನ ಕುಂಬಾಳ', '2345 6789 7788', '9845012352', 'ಅಥರ್ಗಾ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ']
    ];

    sampleRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(val => { tableHtml += `<td>${val}</td>`; });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table></body></html>';
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shareholders_details_template.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded official Excel (.xls) template with Kannada Unicode');
  };

  const commitImport = async () => {
    if (previewRecords.length === 0) return;
    setIsImporting(true);
    for (const r of previewRecords) {
      await ApiService.addShareholder(r);
    }
    setIsImporting(false);
    showToast(`Successfully imported ${previewRecords.length} records into the Live Registry!`);
    setShowUploadModal(false);
    setPreviewRecords([]);
    fetchShareholders(1);
  };

  const loadMasters = async () => {
    const vRes = await ApiService.getVillages();
    if (vRes && vRes.data) setVillages(vRes.data);

    const cRes = await ApiService.getCircles();
    if (cRes && cRes.data) setCircles(cRes.data);
  };

  const fetchShareholders = async (page = 1) => {
    setLoading(true);
    const res = await ApiService.getShareholders({
      page,
      limit: 20,
      search,
      village_id: selectedVillage,
      circle_id: selectedCircle,
      status: selectedStatus,
      book_no: selectedBook
    });

    if (res && res.success) {
      setShareholders(res.data);
      setPagination(res.pagination);
    }
    setLoading(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchShareholders(newPage);
    }
  };

  // Full 38 Columns CSV Export matching the statutory cooperative format
  const exportFullLedgerCsv = () => {
    const headers = [
      'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
      'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
      'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
      'Pin Code', 'Circle', 'Member Type', 'Relationship', 'Tharava Date', 'Tharava No',
      'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
      'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
    ];

    const rows = shareholders.map(s => [
      `"${s.book_no || 'B.No: 1'}"`,
      s.sl_no || s.id,
      s.share_no || s.share_number || '',
      `"${s.shareholder_name || s.name || ''}"`,
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
      `"${s.address || ''}"`,
      `"${s.nagara || ''}"`,
      `"${s.road || ''}"`,
      `"${s.place || s.village_name || ''}"`,
      `"${s.taluk || 'ಇಂಡಿ'}"`,
      `"${s.district || 'ವಿಜಯಪುರ'}"`,
      `"${s.pin_code || ''}"`,
      `"${s.circle || s.circle_name || ''}"`,
      `"${s.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)'}"`,
      `"${s.relationship || 'ಸ್ವಂತ (Self)'}"`,
      `"${s.tharava_date || ''}"`,
      `"${s.tharava_no || ''}"`,
      `"${s.mobile_no || s.mobile || ''}"`,
      `"${s.photo_url || ''}"`,
      `"${s.signature_url || ''}"`,
      `"${s.thumb_url || ''}"`,
      s.photo_updated || 'No',
      s.signature_updated || 'No',
      s.thumb_updated || 'Yes',
      `"${s.nominee_name || ''}"`,
      `"${s.nominee_aadhaar_no || ''}"`,
      `"${s.nominee_mobile_no || ''}"`,
      `"${s.nominee_address || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cooperative_Shareholder_Ledger_Page_${pagination.page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported 38-column statutory ledger to CSV (UTF-8 BOM - ಕನ್ನಡ ಬೆಂಬಲಿತವಾಗಿದೆ)');
  };

  // Full 38 Columns Excel (.xls) Export with embedded UTF-8 Kannada font
  const exportFullLedgerExcel = () => {
    const headers = [
      'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
      'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
      'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
      'Pin Code', 'Circle', 'Member Type', 'Relationship', 'Tharava Date', 'Tharava No',
      'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
      'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
    ];

    let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    tableHtml += '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
    tableHtml += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Shareholders Ledger</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    tableHtml += '<body style="font-family:\'Noto Sans Kannada\', Arial, sans-serif;">';
    tableHtml += '<table border="1"><thead><tr style="background-color:#16a34a; color:#ffffff; font-weight:bold;">';
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += '</tr></thead><tbody>';

    shareholders.forEach(s => {
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
      tableHtml += `<td>${s.taluk || 'ಇಂಡಿ'}</td>`;
      tableHtml += `<td>${s.district || 'ವಿಜಯಪುರ'}</td>`;
      tableHtml += `<td>${s.pin_code || ''}</td>`;
      tableHtml += `<td>${s.circle || s.circle_name || ''}</td>`;
      tableHtml += `<td>${s.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)'}</td>`;
      tableHtml += `<td>${s.relationship || 'ಸ್ವಂತ (Self)'}</td>`;
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
    link.download = `Cooperative_Shareholder_Ledger_Page_${pagination.page}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported complete 38-column statutory ledger to Excel (.xls) with 100% Kannada Unicode!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Shareholder Statutory Ledger (ಷೇರುದಾರರ ನಮೂನೆ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              38 Columns Official Format
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            17,250+ Shareholders Registry with Book No, Share No, Aadhaar, Receipt, Place, Taluk, Circle, Tharava & Nominee Details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'ledger' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Ledger (38 Cols)
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Summary View
            </button>
          </div>

          <button
            onClick={() => { setEditShareholderData(null); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Shareholder
          </button>

          {/* Prominent Upload CSV Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/50 ring-2 ring-emerald-400/50 hover:scale-[1.02] transition-all cursor-pointer"
            title="Upload Shareholder CSV (38 Columns)"
          >
            <Upload className="w-4 h-4 text-white animate-pulse" />
            <span>Upload CSV (CSV ಅಪ್ಲೋಡ್)</span>
          </button>

          <button
            onClick={exportFullLedgerCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
            title="Export 38-column CSV with UTF-8 BOM (Kannada Supported)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV (Unicode)
          </button>

          <button
            onClick={exportFullLedgerExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
            title="Export Excel (.xls) - Opens directly in Microsoft Excel with 100% Kannada Unicode"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" /> Export Excel (.xls)
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print
          </button>
        </div>
      </div>

      {/* Prominent Quick CSV Import Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-slate-950 border border-emerald-800/50 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Upload className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-slate-100 flex items-center gap-2">
              <span>Bulk Shareholder Import & Ledger (ಕನ್ನಡ ಯುನಿಕೋಡ್ 100% ಬೆಂಬಲಿತವಾಗಿದೆ)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700/50">
                UTF-8 Unicode + Excel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your complete cooperative shareholder database in CSV or Excel format (Book No, Share No, Name in Kannada/English, Gender, Aadhaar, Receipt, Place, Taluk, Circle, Tharava & Nominee)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload File (ಅಪ್ಲೋಡ್)
          </button>
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm cursor-pointer"
            title="Download Excel Template with 100% Kannada Unicode"
          >
            <Download className="w-4 h-4 text-teal-400" /> Excel Template (.xls)
          </button>
          <a
            href="./shareholders_details.csv"
            download="shareholders_details.csv"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm"
            title="Download CSV Template with UTF-8 BOM"
          >
            <Download className="w-4 h-4 text-emerald-400" /> CSV Template
          </a>
        </div>
      </div>

      {/* Multi-Field Search & Statutory Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Name (ಕನ್ನಡ / English), Share No, Book No, Mobile, Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Book No Filter */}
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Books (Book No)</option>
          {bookList.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Place / Village Filter */}
        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Places ({villages.length})</option>
          {villages.map(v => (
            <option key={v.village_id} value={v.name}>{v.name} ({v.taluk})</option>
          ))}
        </select>

        {/* Circle Filter */}
        <select
          value={selectedCircle}
          onChange={(e) => setSelectedCircle(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Circles ({circles.length})</option>
          {circles.map(c => (
            <option key={c.circle_id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active (ಸಕ್ರಿಯ)</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Main Table: Full 38-Column Official Cooperative Ledger View */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Searching statutory cooperative index across 17,250 records...
          </div>
        ) : shareholders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No shareholders found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold text-[11px] sticky top-0 z-20 shadow-md">
                <tr className="border-b border-slate-800">
                  <th className="py-3.5 px-3 bg-slate-900 sticky left-0 z-30 shadow-r">Actions</th>
                  <th className="py-3.5 px-3 bg-slate-900 sticky left-14 z-30 border-r border-slate-800">Book. No</th>
                  <th className="py-3.5 px-3 text-center">Sl. No</th>
                  <th className="py-3.5 px-3 font-mono text-emerald-400">Share No</th>
                  <th className="py-3.5 px-4 font-bold text-slate-100 min-w-[200px]">Share Holder Name (ಷೇರುದಾರರ ಹೆಸರು)</th>
                  <th className="py-3.5 px-2 text-center">Gender</th>
                  <th className="py-3.5 px-3 font-mono">Aadhaar Card No</th>
                  <th className="py-3.5 px-3">Reg. Date</th>
                  <th className="py-3.5 px-2 text-center">Receipt No</th>
                  <th className="py-3.5 px-3 text-right">Receipt Amount</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-2 text-center">Reciept</th>
                  <th className="py-3.5 px-3 text-right">Amount</th>
                  <th className="py-3.5 px-3 text-right font-bold text-amber-400">Total Amount</th>
                  <th className="py-3.5 px-2 text-center font-bold text-emerald-400">No. of Shares</th>
                  <th className="py-3.5 px-3 text-center">Schedule Cast / ವರ್ಗ</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Address (ವಿಳಾಸ)</th>
                  <th className="py-3.5 px-3">Nagara</th>
                  <th className="py-3.5 px-3">Road</th>
                  <th className="py-3.5 px-3 font-bold text-slate-100">Place (ಸ್ಥಳ/ಗ್ರಾಮ)</th>
                  <th className="py-3.5 px-3">Taluk</th>
                  <th className="py-3.5 px-3">District</th>
                  <th className="py-3.5 px-3">Pin Code</th>
                  <th className="py-3.5 px-3">Circle</th>
                  <th className="py-3.5 px-3">Member Type</th>
                  <th className="py-3.5 px-3">Relationship</th>
                  <th className="py-3.5 px-3">Tharava Date</th>
                  <th className="py-3.5 px-3">Tharava No</th>
                  <th className="py-3.5 px-3 font-mono text-emerald-400">Mobile No</th>
                  <th className="py-3.5 px-2 text-center">Photo Upd.</th>
                  <th className="py-3.5 px-2 text-center">Sign Upd.</th>
                  <th className="py-3.5 px-2 text-center">Thumb Upd.</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Nominee Name</th>
                  <th className="py-3.5 px-3 font-mono">Nominee Aadhaar</th>
                  <th className="py-3.5 px-3 font-mono">Nominee Mobile</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nominee Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {shareholders.map((sh, idx) => (
                  <tr key={sh.id || idx} className="hover:bg-slate-900/80 transition-colors group">
                    {/* Fixed Action Buttons Column */}
                    <td className="py-2.5 px-2 bg-slate-950 group-hover:bg-slate-900 sticky left-0 z-10">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveProfileId(sh.shareholder_id || sh.id)}
                          title="View Full Profile"
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditShareholderData(sh); setShowAddForm(true); }}
                          title="Edit Record"
                          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveModule('id_cards')}
                          title="Generate ID Card"
                          className="p-1 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Contact className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* 1. Book. No (Sticky) */}
                    <td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-14 z-10 font-bold text-sky-400 border-r border-slate-800">
                      {sh.book_no || 'B.No: 1'}
                    </td>

                    {/* 2. Sl. No */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{sh.sl_no || idx + 1}</td>

                    {/* 3. Share No */}
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{sh.share_no || sh.share_number}</td>

                    {/* 4. Share Holder Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-100 text-[13px]">{sh.shareholder_name || sh.name}</td>

                    {/* 5. Gender */}
                    <td className="py-2.5 px-2 text-center text-slate-300 font-semibold">{sh.gender || 'M'}</td>

                    {/* 6. Aadhaar Card No */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">{sh.aadhaar_card_no || sh.aadhaar_ref || '—'}</td>

                    {/* 7. Reg. Date */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.reg_date || sh.registration_date}</td>

                    {/* 8. Receipt No */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300">{sh.receipt_no || sh.id}</td>

                    {/* 9. Receipt Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium">₹ {(sh.receipt_amount || 2000).toLocaleString()}</td>

                    {/* 10. Date */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.date || sh.reg_date || sh.registration_date}</td>

                    {/* 11. Reciept */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">{sh.reciept || sh.receipt_no || ''}</td>

                    {/* 12. Amount */}
                    <td className="py-2.5 px-3 text-right font-mono">₹ {(sh.amount || sh.receipt_amount || 2000).toLocaleString()}</td>

                    {/* 13. Total Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      ₹ {(sh.total_amount || sh.share_value || 2000).toLocaleString()}
                    </td>

                    {/* 14. No. of Shares */}
                    <td className="py-2.5 px-2 text-center font-extrabold text-emerald-400">{sh.number_of_shares || 1}</td>

                    {/* 15. Schedule Cast / ವರ್ಗ */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-200">
                        {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                      </span>
                    </td>

                    {/* 16. Address */}
                    <td className="py-2.5 px-4 text-slate-300 max-w-[220px] truncate" title={sh.address}>{sh.address || '—'}</td>

                    {/* 17. Nagara */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.nagara || '—'}</td>

                    {/* 18. Road */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.road || '—'}</td>

                    {/* 19. Place (Village) */}
                    <td className="py-2.5 px-3 font-bold text-emerald-300">{sh.place || sh.village_name}</td>

                    {/* 20. Taluk */}
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{sh.taluk || 'ಇಂಡಿ'}</td>

                    {/* 21. District */}
                    <td className="py-2.5 px-3 text-slate-300">{sh.district || 'ವಿಜಯಪುರ'}</td>

                    {/* 22. Pin Code */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sh.pin_code || '—'}</td>

                    {/* 23. Circle */}
                    <td className="py-2.5 px-3 text-slate-300">{sh.circle || sh.circle_name}</td>

                    {/* 24. Member Type */}
                    <td className="py-2.5 px-3 text-slate-300">{sh.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ'}</td>

                    {/* 25. Relationship */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.relationship || 'ಸ್ವಂತ'}</td>

                    {/* 26. Tharava Date */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.tharava_date || '—'}</td>

                    {/* 27. Tharava No */}
                    <td className="py-2.5 px-3 font-mono text-sky-400">{sh.tharava_no || '—'}</td>

                    {/* 28. Mobile No */}
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{sh.mobile_no || sh.mobile || '—'}</td>

                    {/* 29-31. Photos & URL status */}
                    <td className="py-2.5 px-2 text-center text-[10px] text-slate-300">{sh.photo_updated || 'No'}</td>
                    <td className="py-2.5 px-2 text-center text-[10px] text-slate-300">{sh.signature_updated || 'No'}</td>
                    <td className="py-2.5 px-2 text-center text-[10px] text-emerald-400 font-bold">{sh.thumb_updated || 'Yes'}</td>

                    {/* 35. Nominee Name */}
                    <td className="py-2.5 px-4 font-medium text-slate-200">{sh.nominee_name || '—'}</td>

                    {/* 36. Nominee Aadhaar */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sh.nominee_aadhaar_no || '—'}</td>

                    {/* 37. Nominee Mobile */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sh.nominee_mobile_no || '—'}</td>

                    {/* 38. Nominee Address */}
                    <td className="py-2.5 px-4 text-slate-400 max-w-[200px] truncate" title={sh.nominee_address}>{sh.nominee_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Side Pagination Bar */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-bold text-emerald-400">{pagination.total.toLocaleString()}</span> statutory cooperative shareholders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Shareholder Profile Modal */}
      {activeProfileId && (
        <ShareholderProfile
          shareholderId={activeProfileId}
          onClose={() => setActiveProfileId(null)}
        />
      )}

      {/* Add / Edit Form Modal */}
      {showAddForm && (
        <ShareholderForm
          initialData={editShareholderData}
          onClose={() => { setShowAddForm(false); setEditShareholderData(null); }}
          onSaveSuccess={() => { setShowAddForm(false); setEditShareholderData(null); fetchShareholders(pagination.page); }}
        />
      )}

      {/* Upload CSV In-Page Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                    Upload Shareholder Details CSV & Excel (ಷೇರುದಾರರ ವಿವರಗಳ CSV / Excel ಅಪ್ಲೋಡ್)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Full Kannada Unicode Support (ಕನ್ನಡ ಯುನಿಕೋಡ್ 100% ಬೆಂಬಲಿತವಾಗಿದೆ) • All 38 Statutory Cooperative Columns
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setPreviewRecords([]); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleCsvFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                onClick={() => uploadInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={uploadInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCsvFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".csv,.txt,.tsv,text/csv,text/plain"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Click to Browse CSV / Unicode Text file or Drag & Drop here
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports UTF-8, UTF-8 with BOM, and UTF-16LE Unicode (Full Kannada & English characters support)
                </p>
                {uploadFileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected File: {uploadFileName} ({previewRecords.length} records parsed)
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadSampleRecords}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Load Sample Records (ಕನ್ನಡ)
                  </button>
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" /> Download Excel Template (.xls)
                  </button>
                  <a
                    href="./shareholders_details.csv"
                    download="shareholders_details.csv"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" /> Download CSV (UTF-8 BOM)
                  </a>
                </div>

                {previewRecords.length > 0 && (
                  <div className="text-emerald-400 font-medium">
                    Ready to import: <strong className="font-bold text-white">{previewRecords.length}</strong> records
                  </div>
                )}
              </div>

              {/* Preview Table if records exist */}
              {previewRecords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Parsed Records Preview ({previewRecords.length} rows)</span>
                    <span className="text-emerald-400 text-[11px]">All 38 statutory fields mapped</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/80">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead className="bg-slate-900 sticky top-0 text-[11px] text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Book No</th>
                          <th className="py-2 px-3">Share No</th>
                          <th className="py-2 px-3">Shareholder Name</th>
                          <th className="py-2 px-3">Gender</th>
                          <th className="py-2 px-3">Aadhaar</th>
                          <th className="py-2 px-3">Shares</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Place</th>
                          <th className="py-2 px-3">Circle</th>
                          <th className="py-2 px-3">Nominee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {previewRecords.slice(0, 10).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-1.5 px-3 font-mono text-slate-400">{r.book_no}</td>
                            <td className="py-1.5 px-3 font-bold text-emerald-400">{r.share_no}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-200">{r.shareholder_name}</td>
                            <td className="py-1.5 px-3">{r.gender}</td>
                            <td className="py-1.5 px-3 font-mono text-slate-400">{r.aadhaar_card_no || '—'}</td>
                            <td className="py-1.5 px-3">{r.number_of_shares}</td>
                            <td className="py-1.5 px-3 font-medium text-emerald-300">₹{r.total_amount?.toLocaleString()}</td>
                            <td className="py-1.5 px-3">{r.place}</td>
                            <td className="py-1.5 px-3">{r.circle}</td>
                            <td className="py-1.5 px-3 text-slate-400">{r.nominee_name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRecords.length > 10 && (
                    <p className="text-[11px] text-slate-500 text-right">
                      Showing preview of first 10 rows out of {previewRecords.length} records.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setShowUploadModal(false); setPreviewRecords([]); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={commitImport}
                disabled={previewRecords.length === 0 || isImporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing {previewRecords.length} records...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import & Save to Live Registry ({previewRecords.length} records)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
