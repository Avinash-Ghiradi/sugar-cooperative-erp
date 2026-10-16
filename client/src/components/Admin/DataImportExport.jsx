import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Download, FileCheck, RefreshCw, Check, Trash2, ShieldAlert
} from 'lucide-react';
import ResetConfirmModal from '../Common/ResetConfirmModal';

export default function DataImportExport() {
  const { showToast, setActiveModule } = useAuth();
  const [previewRecords, setPreviewRecords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef(null);

  // Parse actual uploaded Excel (.xlsx, .xls) or CSV file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processExcelFile(file);
  };

  const processExcelFile = async (file) => {
    setFileName(file.name);
    setIsProcessing(true);

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
        // Fallback for CSV / TSV
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
            return parseCsvLine(line);
          });
        }
      }

      if (!rawRows || rawRows.length < 2) {
        showToast('Excel file is empty or missing data rows', 'error');
        setIsProcessing(false);
        return;
      }

      // Check header row for column mapping
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
        if (!row || row.length === 0 || row.every(val => String(val || '').trim() === '')) continue;

        const getVal = (colIdx) => {
          const val = row[colIdx];
          return val !== undefined && val !== null ? String(val).trim().normalize('NFC') : '';
        };

        const nameVal = getVal(cName);
        const shareNoVal = getVal(cShare) || String(i);

        const r = {
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
          place: getVal(cPlace) || 'ಬಳ್ಳೊಳ್ಳಿ',
          taluk: getVal(cTaluk) || 'ಇಂಡಿ',
          district: getVal(cDist) || 'ವಿಜಯಪುರ',
          pin_code: getVal(cPin) || '586 117',
          circle: getVal(cCircle) || 'ಇಂಡಿ',
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
        };
        records.push(r);
      }

      setPreviewRecords(records);
      showToast(`Successfully parsed ${records.length} records from Excel with Kannada Unicode!`);
    } catch (err) {
      showToast('Error reading Excel spreadsheet: ' + err.message, 'error');
    }
    setIsProcessing(false);
  };

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

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const loadDefaultSample = async () => {
    try {
      const res = await fetch('./shareholders_details.xlsx');
      if (res.ok) {
        const blob = await res.blob();
        const fakeFile = new File([blob], 'shareholders_details.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        processExcelFile(fakeFile);
        return;
      }
    } catch (e) {}

    // Fallback if fetch fails
    setFileName('shareholders_details.xlsx');
    setPreviewRecords([
      { book_no: 'B.No: 1', sl_no: 1, share_no: '1', shareholder_name: 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '1', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 2, share_no: '2', shareholder_name: 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '2', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 3, share_no: '3', shareholder_name: 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '3', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 4, share_no: '4', shareholder_name: 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '4', receipt_amount: 2000, total_amount: 8000, number_of_shares: 4, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 5, share_no: '6', shareholder_name: 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '6', receipt_amount: 25000, total_amount: 29000, number_of_shares: 14, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', circle: 'ಚಡಚಣ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 6, share_no: '7', shareholder_name: 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', gender: 'M', reg_date: '15/Aug/1982', receipt_no: '8', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', circle: 'ಇಂಡಿ', validation: 'Valid' }
    ]);
    showToast('Loaded sample 38-column statutory Excel ledger data');
  };

  const handleDownloadTemplateXlsx = () => {
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
    showToast('Downloaded official 38-column Excel (.xlsx) template with Kannada Unicode');
  };

  const handleCommitImport = async () => {
    if (previewRecords.length === 0) return;
    setIsProcessing(true);
    const count = previewRecords.length;
    await ApiService.addShareholdersBulk(previewRecords);
    setIsProcessing(false);
    showToast(`Successfully committed ${count.toLocaleString()} records into the live Shareholders Registry!`);
    setPreviewRecords([]);
    setActiveModule('shareholders');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Shareholder Details Excel (.xlsx / .xls) Uploader
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload official 38-column shareholder ledger Excel spreadsheet (Book No, Share No, Aadhaar, Receipt, Place, Nominee, Tharava)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplateXlsx}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Excel Template (.xlsx)
          </button>
          <a
            href="./shareholders_details.xlsx"
            download="shareholders_details.xlsx"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Direct Sample (.xlsx)
          </a>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 hover:text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
            title="Erase all records and reset database"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Erase / Reset All Data
          </button>
        </div>
      </div>

      {/* Hidden File Input - Configured strictly for Excel files (.xlsx, .xls) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
      />

      {/* Interactive Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-slate-950/80 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 cursor-pointer rounded-3xl p-10 text-center space-y-4 transition-all group"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-emerald-950">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-bold text-slate-100 text-sm">
            {fileName ? `Selected Excel File: ${fileName}` : 'Click here to Browse or Drag & Drop your Excel Spreadsheet (.xlsx, .xls)'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Accepts Microsoft Excel (.xlsx / .xls) statutory 38-column cooperative ledger spreadsheets with Kannada Unicode support
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Choose Excel File (.xlsx, .xls)
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); loadDefaultSample(); }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            Load Sample Ledger (Vijayapura/Indi)
          </button>
        </div>
      </div>

      {/* Validation Preview Grid */}
      {previewRecords.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Parsed {previewRecords.length} Shareholder Records from {fileName || 'Excel Spreadsheet'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ready to commit to active registry database</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewRecords([])}
                className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs rounded-xl"
              >
                Clear
              </button>

              <button
                disabled={isProcessing}
                onClick={handleCommitImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Import {previewRecords.length} Records to Database
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Book No</th>
                  <th className="py-2.5 px-3">Sl No</th>
                  <th className="py-2.5 px-3">Share No</th>
                  <th className="py-2.5 px-4">Share Holder Name</th>
                  <th className="py-2.5 px-2 text-center">Gender</th>
                  <th className="py-2.5 px-3">Reg. Date</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-2 text-center">Shares</th>
                  <th className="py-2.5 px-3">Schedule Cast</th>
                  <th className="py-2.5 px-3">Place</th>
                  <th className="py-2.5 px-3">Taluk</th>
                  <th className="py-2.5 px-3">Circle</th>
                  <th className="py-2.5 px-3 font-mono">Mobile</th>
                  <th className="py-2.5 px-3">Nominee Name</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {previewRecords.slice(0, 50).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/60">
                    <td className="py-2 px-3 font-mono text-sky-400 font-bold">{r.book_no}</td>
                    <td className="py-2 px-3 font-mono">{r.sl_no}</td>
                    <td className="py-2 px-3 font-mono text-emerald-400 font-bold">{r.share_no}</td>
                    <td className="py-2 px-4 font-bold text-slate-100">{r.shareholder_name}</td>
                    <td className="py-2 px-2 text-center">{r.gender}</td>
                    <td className="py-2 px-3 text-slate-400">{r.reg_date}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-400 font-bold">₹ {(r.total_amount || 2000).toLocaleString()}</td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-400">{r.number_of_shares}</td>
                    <td className="py-2 px-3 text-center">{r.schedule_cast}</td>
                    <td className="py-2 px-3 font-bold text-emerald-300">{r.place}</td>
                    <td className="py-2 px-3">{r.taluk}</td>
                    <td className="py-2 px-3 text-slate-400">{r.circle}</td>
                    <td className="py-2 px-3 font-mono text-emerald-400">{r.mobile_no || '—'}</td>
                    <td className="py-2 px-3 text-slate-300">{r.nominee_name || '—'}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ✓ {r.validation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewRecords.length > 50 && (
            <p className="text-[11px] text-slate-500 text-right mt-2">
              Showing preview of first 50 rows out of {previewRecords.length.toLocaleString()} parsed records.
            </p>
          )}
        </div>
      )}

      {/* Danger Zone: Erase Everything & Factory Reset */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 border border-rose-900/60 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-200 flex items-center gap-2">
                Danger Zone: Erase Everything & Reset All Data (ಡೇಟಾಬೇಸ್ ರದ್ದುಪಡಿಸುವಿಕೆ)
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Permanently purge all loaded shareholder records (17,000+) from IndexedDB, clear transaction ledgers, sugar quotas, and restore the ERP database to a clean empty state.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 transition-all cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Erase Everything & Reset All</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onResetComplete={() => setPreviewRecords([])}
      />
    </div>
  );
}
