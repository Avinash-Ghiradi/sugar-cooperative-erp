import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Search, Filter, Plus, FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
  Eye, Edit, Contact, CheckCircle2, XCircle, RefreshCw, BookOpen, Layers, Check, Download, Upload, Trash2, AlertTriangle,
  History, GitMerge
} from 'lucide-react';
import ShareholderProfile from './ShareholderProfile';
import ShareholderForm from './ShareholderForm';
import ResetConfirmModal from '../Common/ResetConfirmModal';
import MergeSharesModal from './MergeSharesModal';

export default function ShareholderList() {
  const { showToast, setActiveModule, user } = useAuth();
  const [shareholders, setShareholders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedCast, setSelectedCast] = useState('');
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' (38 columns) or 'summary'

  // Options
  const [villages, setVillages] = useState([]);
  const [circles, setCircles] = useState([]);
  const [bookList, setBookList] = useState(['B.No: 1', 'B.No: 2', 'B.No: 3', 'B.No: 4', 'B.No: 5']);
  const [castList, setCastList] = useState([]);

  // Modals
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState('ledger');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editShareholderData, setEditShareholderData] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [multipleHoldingsCount, setMultipleHoldingsCount] = useState(0);
  const [previewRecords, setPreviewRecords] = useState([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [autoMergeOnImport, setAutoMergeOnImport] = useState(true);
  const [selectedShareIds, setSelectedShareIds] = useState([]);

  const toggleSelectRow = (id) => {
    setSelectedShareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPage = () => {
    const pageIds = shareholders.map(s => s.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedShareIds.includes(id));
    if (allSelected) {
      setSelectedShareIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedShareIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };
  const uploadInputRef = React.useRef(null);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    fetchShareholders(1);
  }, [search, selectedVillage, selectedCircle, selectedStatus, selectedBook, selectedCast]);

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

  const handleExcelFileUpload = async (file) => {
    if (!file) return;
    setUploadFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      let rawRows = [];
      if (isExcel) {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
      } else {
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
            return parseCsvLine(line, delimiter);
          });
        }
      }

      if (!rawRows || rawRows.length < 2) {
        showToast('File is empty or missing data rows', 'error');
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

      const cBook = findCol(['book', 'b.no', 'ಬುಕ್'], 0);
      const cSl = findCol(['sl', 'serial', 'ಕ್ರಮ'], 1);
      const cShare = findCol(['share no', 'share_no', 'ಷೇರು ನಂ'], 2);
      const cName = findCol(['share holder', 'shareholder', 'holder name', 'ಷೇರುದಾರರ ಹೆಸರು', 'ಹೆಸರು'], 3);
      const cGender = findCol(['gender', 'ಲಿಂಗ', 'sex'], 4);
      const cAadhaar = findCol(['aadhaar', 'adhar', 'ಆಧಾರ್'], 5);
      const cRegDate = findCol(['reg. date', 'reg date', 'registration', 'ದಾಖಲಾತಿ'], 6);
      const cReceiptNo = findCol(['receipt no', 'receipt_no', 'ರಶೀದಿ ನಂ'], 7);
      const cReceiptAmt = findCol(['receipt amount', 'ರಶೀದಿ ಮೊತ್ತ'], 8);
      const cDate = findCol(['date', 'ದಿನಾಂಕ'], 9);
      const cReciept = findCol(['reciept'], 10);
      const cAmt = findCol(['amount', 'ಮೊತ್ತ'], 11);
      const cTotalAmt = findCol(['total amount', 'ಒಟ್ಟು ಮೊತ್ತ'], 12);
      const cShares = findCol(['no. of shares', 'no of shares', 'shares', 'ಷೇರುಗಳ ಸಂಖ್ಯೆ'], 13);
      const cCast = findCol(['schedule cast', 'caste', 'category', 'ವರ್ಗ'], 14);
      const cAddr = findCol(['address', 'ವಿಳಾಸ'], 15);
      const cNagara = findCol(['nagara', 'ನಗರ'], 16);
      const cRoad = findCol(['road', 'ರಸ್ತೆ'], 17);
      const cPlace = findCol(['place', 'village', 'ಸ್ಥಳ', 'ಗ್ರಾಮ'], 18);
      const cTaluk = findCol(['taluk', 'ತಾಲ್ಲೂಕು', 'ತಾಲ್ಲೂಕ'], 19);
      const cDist = findCol(['district', 'ಜಿಲ್ಲೆ'], 20);
      const cPin = findCol(['pin code', 'pincode', 'ಪಿನ್'], 21);
      const cCircle = findCol(['circle', 'ವಲಯ', 'ಸರ್ಕಲ್'], 22);
      const cMemberType = findCol(['member type', 'member', 'ಸದಸ್ಯ'], 23);
      const cRel = findCol(['relationship', 'ಸಂಬಂಧ'], 24);
      const cTharavaDate = findCol(['tharava date', 'ಠರಾವು ದಿನಾಂಕ'], 25);
      const cTharavaNo = findCol(['tharava no', 'tharava', 'ಠರಾವು ನಂ'], 26);
      const cMobile = findCol(['mobile', 'phone', 'ಮೊಬೈಲ್'], 27);
      const cPhotoUrl = findCol(['photo url', 'photo'], 28);
      const cSignUrl = findCol(['signature url', 'signature'], 29);
      const cThumbUrl = findCol(['thumb url', 'thumb'], 30);
      const cPhotoUp = findCol(['photo updated'], 31);
      const cSignUp = findCol(['signature updated'], 32);
      const cThumbUp = findCol(['thumb updated'], 33);
      const cNomName = findCol(['nominee name', 'nominee', 'ವಾರಸುದಾರ'], 34);
      const cNomAadhaar = findCol(['nominee aadhaar', 'nominee aadhar'], 35);
      const cNomMob = findCol(['nominee mobile', 'nominee phone'], 36);
      const cNomAddr = findCol(['nominee address'], 37);

      const records = [];
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every(item => String(item || '').trim() === '')) continue;

        const getVal = (colIdx) => {
          const val = row[colIdx];
          return val !== undefined && val !== null ? String(val).trim().normalize('NFC') : '';
        };

        const nameVal = getVal(cName);
        const shareNoVal = getVal(cShare) || String(i);

        const rawPlace = getVal(cPlace) || '';
        const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(rawPlace) : null;
        const resolvedCircle = circleInfo?.circle_name ? circleInfo.circle_name : 'ಇತರೆ (Other)';

        records.push({
          book_no: getVal(cBook) || 'B.No: 1',
          sl_no: parseInt(getVal(cSl)) || i,
          share_no: shareNoVal,
          shareholder_name: nameVal || `ಷೇರುದಾರ ${i}`,
          gender: getVal(cGender) || 'M',
          aadhaar_card_no: getVal(cAadhaar),
          reg_date: getVal(cRegDate) || '10/Aug/1982',
          receipt_no: getVal(cReceiptNo) || String(i),
          receipt_amount: parseFloat(getVal(cReceiptAmt)) || 2000,
          date: getVal(cDate) || getVal(cRegDate) || '10/Aug/1982',
          reciept: getVal(cReciept) || getVal(cReceiptNo) || '',
          amount: parseFloat(getVal(cAmt)) || 2000,
          total_amount: parseFloat(getVal(cTotalAmt)) || parseFloat(getVal(cAmt)) || 2000,
          number_of_shares: parseInt(getVal(cShares)) || 1,
          schedule_cast: getVal(cCast) || 'ಅ - ವರ್ಗ',
          address: getVal(cAddr),
          nagara: getVal(cNagara),
          road: getVal(cRoad),
          place: rawPlace,
          taluk: circleInfo?.taluk || getVal(cTaluk) || '',
          district: circleInfo?.district || getVal(cDist) || '',
          pin_code: circleInfo?.pincode || getVal(cPin) || '',
          circle: resolvedCircle, // STRICT RULE: Do not consider circle column from shareholder list. Derived strictly from place.
          member_type: getVal(cMemberType) || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
          relationship: getVal(cRel) || 'ಸ್ವಂತ (Self)',
          tharava_date: getVal(cTharavaDate) || '10/Aug/1982',
          tharava_no: getVal(cTharavaNo) || `TR-${i}/1982`,
          mobile_no: getVal(cMobile),
          photo_url: getVal(cPhotoUrl),
          signature_url: getVal(cSignUrl),
          thumb_url: getVal(cThumbUrl),
          photo_updated: getVal(cPhotoUp) || 'Yes',
          signature_updated: getVal(cSignUp) || 'Yes',
          thumb_updated: getVal(cThumbUp) || 'Yes',
          nominee_name: getVal(cNomName),
          nominee_aadhaar_no: getVal(cNomAadhaar),
          nominee_mobile_no: getVal(cNomMob),
          nominee_address: getVal(cNomAddr),
          validation: 'Valid'
        });
      }
      setPreviewRecords(records);
      showToast(`Parsed ${records.length} records from Excel with full Kannada Unicode support!`);
    } catch (err) {
      showToast('Error reading Excel spreadsheet: ' + err.message, 'error');
    }
  };

  const loadSampleRecords = async () => {
    try {
      const res = await fetch('./shareholders_details.xlsx');
      if (res.ok) {
        const blob = await res.blob();
        const fakeFile = new File([blob], 'shareholders_details.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        await handleExcelFileUpload(fakeFile);
        return;
      }
    } catch (err) {}
    setUploadFileName('shareholders_details.xlsx');
    setPreviewRecords([
      { book_no: 'B.No: 1', sl_no: 1, share_no: '1', shareholder_name: 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '1', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', circle: 'ಧೂಳಖೇಡ ಸರ್ಕಲ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 2, share_no: '2', shareholder_name: 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '2', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', circle: 'ಧೂಳಖೇಡ ಸರ್ಕಲ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 3, share_no: '3', shareholder_name: 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '3', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ ಸರ್ಕಲ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 4, share_no: '4', shareholder_name: 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '4', receipt_amount: 2000, total_amount: 8000, number_of_shares: 4, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', circle: 'ಧೂಳಖೇಡ ಸರ್ಕಲ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 5, share_no: '6', shareholder_name: 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '6', receipt_amount: 25000, total_amount: 29000, number_of_shares: 14, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', circle: 'ಚಡಚಣ ಸರ್ಕಲ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 6, share_no: '7', shareholder_name: 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', gender: 'M', reg_date: '15/Aug/1982', receipt_no: '8', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ ಸರ್ಕಲ', validation: 'Valid' }
    ]);
    showToast('Loaded 6 official sample cooperative records (ಕನ್ನಡ ಯುನಿಕೋಡ್)');
  };

  const downloadExcelTemplate = () => {
    const headers = [
      'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
      'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
      'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
      'Pin Code', 'Circle', 'Member Type', 'Relationship', 'Tharava Date', 'Tharava No',
      'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
      'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
    ];

    const sampleRows = [
      headers,
      ['B.No: 1', 1, '1', 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', 'M', '4582 9981 1234', '10/Aug/1982', '1', 2000, '10/Aug/1982', '1', 2000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಗ್ರಾಮ, ಶ್ರೀ ಹನುಮಾನ್ ದೇವಸ್ಥಾನದ ಹತ್ತಿರ', 'ಗ್ರಾಮ ಠಾಣಾ', 'ಮುಖ್ಯ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-01/1982', '9845012341', '', '', '', 'Yes', 'Yes', 'Yes', 'ಕಾಮಣ್ಣ ಬೀರಪ್ಪ ಸಗಾಯಿ', '4582 9981 5566', '9845012342', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 2, '2', 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', 'M', '7890 1234 5678', '10/Aug/1982', '2', 1000, '10/Aug/1982', '2', 1000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಅಗಸಿ ಹತ್ತಿರ, ಇಂಡಿ ರಸ್ತೆ', 'ಬ್ರಾಹ್ಮಣ ಗಲ್ಲಿ', 'ದೇವಸ್ಥಾನ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-02/1982', '9845012343', '', '', '', 'Yes', 'Yes', 'Yes', 'ವೆಂಕಟೇಶ ರಮೇಶ ಪುರಾಣಿಕ', '7890 1234 9900', '9845012344', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 3, '3', 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', 'M', '3456 7890 1234', '10/Aug/1982', '3', 1000, '10/Aug/1982', '3', 1000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಜೇವೂರ ಗ್ರಾಮ, ಮುಖ್ಯ ಚೌಕ್', 'ಪಾಟೀಲ ಗಲ್ಲಿ', 'ಬಸ್ ನಿಲ್ದಾಣ ರಸ್ತೆ', 'ಜೇವೂರ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 112', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-03/1982', '9845012345', '', '', '', 'Yes', 'Yes', 'Yes', 'ಅಪ್ಪಾರಾವ ಬಾಬುರಾವ ಪಾಟೀಲ', '3456 7890 9988', '9845012346', 'ಜೇವೂರ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 4, '4', 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', 'M', '5678 9012 3456', '10/Aug/1982', '4', 2000, '10/Aug/1982', '4', 2000, 8000, 4, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ತೋಟದ ವಸ್ತಿ, ಕಾಲುವೆ ಹತ್ತಿರ', 'ರೈತ ನಗರ', 'ಹೊಲದ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-04/1982', '9845012347', '', '', '', 'Yes', 'Yes', 'Yes', 'ರಾಮಚಂದ್ರ ಮಲ್ಲನಗೌಡ ಪಾಟೀಲ', '5678 9012 1122', '9845012348', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 5, '6', 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', 'M', '9012 3456 7890', '10/Aug/1982', '6', 25000, '10/Aug/1982', '6', 25000, 29000, 14, 'ಅ - ವರ್ಗ', 'ಚಡಚಣ ಮೇನ್ ಬಜಾರ್, ಕ್ಲಿನಿಕ್ ಎದುರು', 'ವೈದ್ಯರ ಓಣಿ', 'ಹಾಸ್ಪಿಟಲ್ ರಸ್ತೆ', 'ಚಡಚಣ', 'ಚಡಚಣ', 'ವಿಜಯಪುರ', '586 205', 'ಚಡಚಣ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-05/1982', '9845012349', '', '', '', 'Yes', 'Yes', 'Yes', 'ಸಾಸವೇಲ ಇಮ್ಮಾನುವೆ ಕಟವಟೆ', '9012 3456 3344', '9845012350', 'ಚಡಚಣ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ'],
      ['B.No: 1', 6, '7', 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', 'M', '2345 6789 0123', '15/Aug/1982', '8', 2000, '15/Aug/1982', '8', 2000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಅಥರ್ಗಾ ರಸ್ತೆ, ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಹತ್ತಿರ', 'ಕುಂಬಾರ ಗಲ್ಲಿ', 'ಕಾಲೇಜು ರಸ್ತೆ', 'ಅಥರ್ಗಾ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 112', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)', 'ಸ್ವಂತ (Self)', '15/Aug/1982', 'TR-06/1982', '9845012351', '', '', '', 'Yes', 'Yes', 'Yes', 'ಮಲ್ಲಿಕಾರ್ಜುನ ಕುಂಬಾಳ', '2345 6789 7788', '9845012352', 'ಅಥರ್ಗಾ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Shareholders_Ledger');
    XLSX.writeFile(wb, 'shareholders_details_template.xlsx');
    showToast('Downloaded official Excel (.xlsx) template with Kannada Unicode');
  };

  const commitImport = async () => {
    if (previewRecords.length === 0) return;
    setIsImporting(true);
    const count = previewRecords.length;
    await ApiService.addShareholdersBulk(previewRecords);

    if (autoMergeOnImport) {
      try {
        const mergeRes = await ApiService.mergeAllMultipleHoldings({ adminUser: user?.name || 'Admin' });
        if (mergeRes && mergeRes.success && mergeRes.mergedCount > 0) {
          showToast(`ಸ್ವಯಂಚಾಲಿತ ವಿಲೀನ ಪೂರ್ಣಗೊಂಡಿದೆ: ${mergeRes.mergedCount} ಬಹು-ಶೇರುಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ!`, 'success');
        }
      } catch (err) {
        console.error('Auto merge error:', err);
      }
    }

    setIsImporting(false);
    showToast(`Successfully imported ${count.toLocaleString()} records into the Live Registry!`);
    setShowUploadModal(false);
    setPreviewRecords([]);
    await loadMasters();
    fetchShareholders(1);
  };

  const loadMasters = async () => {
    const vRes = await ApiService.getVillages();
    if (vRes && vRes.data) setVillages(vRes.data);

    const cRes = await ApiService.getCircles();
    if (cRes && cRes.data) setCircles(cRes.data);

    const bRes = await ApiService.getBooks();
    if (bRes && bRes.data) setBookList(bRes.data);

    const scRes = await ApiService.getScheduleCasts();
    if (scRes && scRes.data) setCastList(scRes.data);

    try {
      const mRes = await ApiService.getMultipleHoldingsSummary();
      if (mRes && mRes.success) {
        setMultipleHoldingsCount(mRes.totalDetectedShareholders || 0);
      }
    } catch (err) {}
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
      book_no: selectedBook,
      schedule_cast: selectedCast
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
      `"${s.taluk || ''}"`,
      `"${s.district || ''}"`,
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
      tableHtml += `<td>${s.taluk || ''}</td>`;
      tableHtml += `<td>${s.district || ''}</td>`;
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Shareholder Statutory Ledger (ಷೇರುದಾರರ ನಮೂನೆ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              38 Columns Official Format
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 text-emerald-300 border border-slate-700 font-mono">
              Total: {pagination.total.toLocaleString()} Members • {villages.length} Places • {circles.length} Circles • {castList.length} Categories • {bookList.length} Books
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Shareholders Statutory Registry with Book No, Share No, Aadhaar, Receipt, Place, Taluk, Circle, Tharava & Nominee Details
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

          {/* Merge Multiple Shares Button */}
          <button
            onClick={() => setShowMergeModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/60 hover:scale-[1.02] transition-all cursor-pointer"
            title="ಬಹು ಮೊತ್ತಗಳನ್ನು ಹೊಂದಿರುವ ಶೇರುದಾರರ ಶೇರುಗಳು ಮತ್ತು ವಿವರಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಿ"
          >
            <GitMerge className="w-4 h-4 text-slate-950" />
            <span>ಬಹು-ಶೇರು ವಿಲೀನ (Merge Shares)</span>
            {multipleHoldingsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                {multipleHoldingsCount}
              </span>
            )}
          </button>

          {/* Prominent Upload Excel Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/50 ring-2 ring-emerald-400/50 hover:scale-[1.02] transition-all cursor-pointer"
            title="Upload Shareholder Excel (.xlsx / .xls)"
          >
            <FileSpreadsheet className="w-4 h-4 text-white animate-pulse" />
            <span>Upload Excel (ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್)</span>
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

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Erase all shareholder records or factory reset entire database"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Erase / Reset All</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2 relative">
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
          <option value="">All Books ({bookList.length})</option>
          {bookList.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Schedule Cast / ವರ್ಗ Filter */}
        <select
          value={selectedCast}
          onChange={(e) => setSelectedCast(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Categories / ವರ್ಗ ({castList.length})</option>
          {castList.map(c => (
            <option key={c} value={c}>{c}</option>
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
            <option key={v.village_id || v.name} value={v.name}>
              {v.name} {v.taluk ? `(${v.taluk})` : ''} ({v.shareholder_count || 0})
            </option>
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
            <option key={c.circle_id || c.name} value={c.name}>
              {c.name} ({c.shareholder_count || 0})
            </option>
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
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Searching statutory cooperative ledger index...
          </div>
        ) : shareholders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-400/60" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">No shareholder records found</p>
              <p className="text-xs text-slate-500 mt-1">Upload your official 38-column Excel (.xlsx / .xls) ledger or add new shareholders to begin.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => { setEditShareholderData(null); setShowAddForm(true); }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Shareholder (ಹೊಸ ಷೇರುದಾರ)
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Upload Excel Ledger (ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್)
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold text-[11px] sticky top-0 z-20 shadow-md">
                <tr className="border-b border-slate-800">
                  <th className="py-3.5 px-2 bg-slate-900 sticky left-0 z-30 text-center w-10">
                    <input
                      type="checkbox"
                      checked={shareholders.length > 0 && shareholders.every(s => selectedShareIds.includes(s.id))}
                      onChange={toggleSelectAllPage}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700 cursor-pointer"
                      title="ಪ್ರಸ್ತುತ ಪುಟದ ಎಲ್ಲಾ ಷೇರುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ"
                    />
                  </th>
                  <th className="py-3.5 px-2 bg-slate-900 sticky left-10 z-30 shadow-r">Actions</th>
                  <th className="py-3.5 px-3 bg-slate-900 sticky left-[100px] z-30 border-r border-slate-800">Book. No</th>
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
                  <tr key={sh.id || idx} className={`hover:bg-slate-900/80 transition-colors group ${selectedShareIds.includes(sh.id) ? 'bg-amber-950/30' : ''}`}>
                    {/* Row Checkbox Column */}
                    <td className="py-2.5 px-2 bg-slate-950 group-hover:bg-slate-900 sticky left-0 z-10 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedShareIds.includes(sh.id)}
                        onChange={() => toggleSelectRow(sh.id)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-950 border-slate-700 cursor-pointer"
                      />
                    </td>

                    {/* Fixed Action Buttons Column */}
                    <td className="py-2.5 px-2 bg-slate-950 group-hover:bg-slate-900 sticky left-10 z-10">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveProfileId(sh.shareholder_id || sh.id);
                            setActiveProfileTab('ledger');
                          }}
                          title="View Full Profile (ಸಮಗ್ರ ಪ್ರೊಫೈಲ್)"
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveProfileId(sh.shareholder_id || sh.id);
                            setActiveProfileTab('history');
                          }}
                          title="ಇತಿಹಾಸ & ದಾಖಲೆಗಳು (History & Audit Trail)"
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <History className="w-3.5 h-3.5 text-amber-400" />
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
                    <td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-[100px] z-10 font-bold text-sky-400 border-r border-slate-800">
                      {sh.book_no || 'B.No: 1'}
                    </td>

                    {/* 2. Sl. No */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{sh.sl_no || idx + 1}</td>

                    {/* 3. Share No */}
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{sh.share_no || sh.share_number}</span>
                        {(sh.is_merged || (sh.all_share_numbers && sh.all_share_numbers.length > 1) || String(sh.share_no).includes(',')) && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-700/60 text-[9px] font-sans font-bold flex items-center gap-1 shrink-0" title="ಬಹು-ಶೇರುಗಳು ಮತ್ತು ಮೊತ್ತಗಳು ವಿಲೀನಗೊಂಡಿವೆ">
                            <GitMerge className="w-2.5 h-2.5 text-amber-400" />
                            <span>ವಿಲೀನ</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Share Holder Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-100 text-[13px]">
                      <div className="flex items-center gap-2">
                        {sh.photo_url ? (
                          <img src={sh.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40 shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {(sh.shareholder_name || sh.name || 'S').charAt(0)}
                          </div>
                        )}
                        <span className="truncate">{sh.shareholder_name || sh.name}</span>
                      </div>
                    </td>

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
                    <td className="py-2.5 px-2 text-center text-[10px]">
                      {sh.photo_url || sh.photo_updated === 'Yes' ? (
                        <span className="text-emerald-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[10px]">
                      {sh.signature_url || sh.signature_updated === 'Yes' ? (
                        <span className="text-sky-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[10px]">
                      {sh.thumb_url || sh.thumb_updated === 'Yes' ? (
                        <span className="text-amber-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>

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
          initialTab={activeProfileTab}
          onClose={() => {
            setActiveProfileId(null);
            setActiveProfileTab('ledger');
          }}
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

      {/* Upload Excel In-Page Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                    Upload Shareholder Details Excel (ಷೇರುದಾರರ ವಿವರಗಳ ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Accepts Microsoft Excel (.xlsx / .xls) • Full Kannada Unicode Support (ಕನ್ನಡ ಯುನಿಕೋಡ್ 100% ಬೆಂಬಲಿತವಾಗಿದೆ)
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
                    handleExcelFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-950/60 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                onClick={() => uploadInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={uploadInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleExcelFileUpload(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Click to Browse Excel Spreadsheet (.xlsx, .xls) or Drag & Drop here
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) with Kannada & English Unicode characters across 38 columns
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
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-md shadow-emerald-950 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Excel Template (.xlsx)
                  </button>
                  <a
                    href="./shareholders_details.xlsx"
                    download="shareholders_details.xlsx"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Sample (.xlsx)
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white rounded-lg font-medium border border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                    title="Erase all existing shareholder records before uploading"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Erase Existing Records
                  </button>
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

              {/* Auto-merge Multiple Holdings & Amounts Checkbox */}
              <div className="flex items-start gap-3 p-3 bg-emerald-950/25 border border-emerald-800/40 rounded-xl text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="autoMergeCheckbox"
                  checked={autoMergeOnImport}
                  onChange={(e) => setAutoMergeOnImport(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="autoMergeCheckbox" className="cursor-pointer select-none">
                  <span className="font-semibold text-emerald-400">ಸ್ವಯಂಚಾಲಿತ ಬಹು-ಶೇರು & ಕಂತು ಮೊತ್ತ ವಿಲೀನ (Auto-merge Multiple Holdings & Amounts):</span>
                  <span className="text-slate-400 block mt-0.5">
                    ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಶೇರು ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಕಂತು ಮೊತ್ತ ಹೊಂದಿರುವ ಷೇರುದಾರರ ಖಾತೆಗಳನ್ನು ಆಮದು ನಂತರ ತಕ್ಷಣವೇ ಒಂದೇ ಮಾಸ್ಟರ್ ಖಾತೆಗೆ ಸಂಯೋಜಿಸಿ (Consolidate shares and total amounts).
                  </span>
                </label>
              </div>
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

      {/* Reset & Erase Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetComplete={async () => {
          setPreviewRecords([]);
          await loadMasters();
          fetchShareholders(1);
        }}
      />

      {/* Merge Multiple Shares Modal */}
      <MergeSharesModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        onMergeSuccess={async () => {
          await loadMasters();
          fetchShareholders(pagination.page);
        }}
      />
    </div>
  );
}
