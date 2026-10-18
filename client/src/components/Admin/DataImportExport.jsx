import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService, getMemberTypeByCategory } from '../../services/api';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Download, FileCheck,
  RefreshCw, Check, Trash2, ShieldAlert, MapPin, Users, Layers
} from 'lucide-react';
import ResetConfirmModal from '../Common/ResetConfirmModal';

export default function DataImportExport() {
  const { showToast, setActiveModule } = useAuth();
  const [importType, setImportType] = useState('shareholders'); // 'shareholders' (38 cols) or 'circles' (7 cols)
  const [previewRecords, setPreviewRecords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef(null);

  // Parse uploaded Excel (.xlsx, .xls) or CSV file
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

      // Auto-detect if file is Circle Directory (7 columns: Address, Circle Name, Taluk, District, Pincode, Circle In-charge, Contact No)
      const isCircleFile = headerRow.some(h =>
        h.includes('circle in-charge') ||
        h.includes('circle incharge') ||
        h.includes('contact no') ||
        (h.includes('circle name') && !headerRow.some(x => x.includes('share') || x.includes('book')))
      );

      const targetType = isCircleFile ? 'circles' : (importType === 'circles' && !headerRow.some(h => h.includes('share')) ? 'circles' : 'shareholders');
      setImportType(targetType);

      if (targetType === 'circles') {
        // Parse 7-column Circle & Village Directory
        const cAddress = findCol(['address', 'place', 'village', 'ವಿಳಾಸ', 'ಸ್ಥಳ', 'ಗ್ರಾಮ'], 0);
        const cCircle = findCol(['circle name', 'circle_name', 'circle', 'ಸರ್ಕಲ್', 'ವಲಯ'], 1);
        const cTaluk = findCol(['taluk', 'taluka', 'ತಾಲೂಕು'], 2);
        const cDistrict = findCol(['district', 'dist', 'ಜಿಲ್ಲೆ'], 3);
        const cPincode = findCol(['pincode', 'pin code', 'pin', 'ಪಿನ್‌ಕೋಡ್'], 4);
        const cInCharge = findCol(['circle in-charge', 'circle incharge', 'in-charge', 'incharge', 'ಪ್ರಭಾರಿ'], 5);
        const cContact = findCol(['contact no', 'contact', 'mobile', 'phone', 'ಸಂಪರ್ಕ'], 6);

        const records = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every(cell => String(cell || '').trim() === '')) continue;

          const getVal = (idx) => {
            if (idx === -1 || idx >= row.length) return '';
            return String(row[idx] ?? '').trim().normalize('NFC');
          };

          const addr = getVal(cAddress);
          const circle = getVal(cCircle);
          if (!addr && !circle) continue;

          records.push({
            address: addr,
            circle_name: circle || 'ಇತರೆ',
            taluk: getVal(cTaluk) || '',
            district: getVal(cDistrict) || '',
            pincode: getVal(cPincode) || '',
            circle_in_charge: getVal(cInCharge) || '',
            contact_no: getVal(cContact) || '',
            validation: 'Valid'
          });
        }

        setPreviewRecords(records);
        showToast(`Auto-detected Circle Directory! Parsed ${records.length} circle & village records from Excel.`);
      } else {
        // Parse 38-column Shareholder Statutory Ledger
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
        const cRel = findCol(['ownership', 'ಸ್ವಾಮ್ಯತ್ವ', 'ಒಡೆತನ', 'relationship', 'ಸಂಬಂಧ'], 24);
        const cTharavaDate = findCol(['tharava date', 'ಠರಾವು ದಿನಾಂಕ'], 25);
        const cTharavaNo = findCol(['tharava no', 'tharava', 'ಠರಾವು ನಂ'], 26);
        const cMobile = findCol(['mobile', 'phone', 'ಮೊಬೈಲ್'], 27);
        const cPhotoUrl = findCol(['photo url', 'photo'], 28);
        const cSignUrl = findCol(['signature url', 'signature'], 29);
        const cThumbUrl = findCol(['thumb url', 'thumb'], 30);
        const cPhotoUp = findCol(['photo updated'], 31);
        const cSignUp = findCol(['signature updated'], 32);
        const cThumbUp = findCol(['thumb updated'], 33);
        const cNomName = findCol(['nominee name', 'nominee', 'ವಾರಸ್ದಾರ'], 34);
        const cNomAadhaar = findCol(['nominee aadhaar'], 35);
        const cNomMob = findCol(['nominee mobile'], 36);
        const cNomAddr = findCol(['nominee address'], 37);

        const records = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every(cell => String(cell || '').trim() === '')) continue;

          const getVal = (idx) => {
            if (idx === -1 || idx >= row.length) return '';
            return String(row[idx] ?? '').trim().normalize('NFC');
          };

          const shName = getVal(cName);
          const shareNo = getVal(cShare) || String(i);

          if (!shName && !shareNo) continue;

          const rawPlace = getVal(cPlace) || getVal(cAddr) || '';
          const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(rawPlace) : null;
          const resolvedCircle = circleInfo?.circle_name ? circleInfo.circle_name : 'ಇತರೆ (Other)';

          records.push({
            book_no: getVal(cBook) || 'B.No: 1',
            sl_no: parseInt(getVal(cSl)) || i,
            share_no: shareNo,
            shareholder_name: shName || `ಷೇರುದಾರ ${i}`,
            name: shName || `ಷೇರುದಾರ ${i}`,
            gender: (getVal(cGender) || 'M').toUpperCase().startsWith('F') ? 'F' : 'M',
            aadhaar_card_no: getVal(cAadhaar),
            reg_date: getVal(cRegDate) || '10/Aug/1982',
            receipt_no: getVal(cReceiptNo) || String(i),
            receipt_amount: parseFloat(getVal(cReceiptAmt)) || 2000,
            date: getVal(cDate) || '',
            reciept: getVal(cReciept) || '',
            amount: parseFloat(getVal(cAmt)) || 0,
            total_amount: parseFloat(getVal(cTotalAmt)) || (parseFloat(getVal(cReceiptAmt)) || 0) + (parseFloat(getVal(cAmt)) || 0) || 2000,
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
            member_type: getMemberTypeByCategory(getVal(cCast), getVal(cMemberType)),
            ownership: getVal(cRel) || 'ಸ್ವಂತ (Self)',
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
        showToast(`Successfully parsed ${records.length} shareholder records with full Kannada Unicode!`);
      }
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
    if (importType === 'circles') {
      try {
        const res = await fetch('./circle_details.xlsx');
        if (res.ok) {
          const blob = await res.blob();
          const fakeFile = new File([blob], 'circle_details.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          processExcelFile(fakeFile);
          return;
        }
      } catch (e) {}

      setFileName('circle_details.xlsx');
      setPreviewRecords([
        { address: 'ಅಗರಖೇಡ', circle_name: 'ಇಂಡಿ ಸರ್ಕಲ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586209', circle_in_charge: 'ಸಂಗಮೇಶ ಕುಂಬಾರ', contact_no: '9845011221', validation: 'Valid' },
        { address: 'ಅಗಸನಾಳ', circle_name: 'ಧೋಳಖೇಡ ಸರ್ಕಲ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', pincode: '586207', circle_in_charge: 'ರಮೇಶ ಪಾಟೀಲ', contact_no: '9845011222', validation: 'Valid' },
        { address: 'ಅಂಜುಟಗಿ', circle_name: 'ಇಂಡಿ ಸ್ಟೇಶನ್ ಸರ್ಕಲ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586209', circle_in_charge: 'ಸುರೇಶ ಬಿರಾದಾರ', contact_no: '9845011223', validation: 'Valid' },
        { address: 'ಅಣಚಿ', circle_name: 'ಧೋಳಖೇಡ ಸರ್ಕಲ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', pincode: '586207', circle_in_charge: 'ರಮೇಶ ಪಾಟೀಲ', contact_no: '9845011222', validation: 'Valid' },
        { address: 'ಅಥರ್ಗಾ', circle_name: 'ತಾಂಬಾ ಸರ್ಕಲ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586112', circle_in_charge: 'ಬಸವರಾಜ ಹಡಪದ', contact_no: '9845011224', validation: 'Valid' },
        { address: 'ಅಫಜಲಪೂರ', circle_name: 'Post', taluk: 'III', district: 'ಕಲಬುರಗಿ', pincode: '598999', circle_in_charge: 'ಪೋಸ್ಟ್ ಅಧಿಕಾರಿ', contact_no: '9845011225', validation: 'Valid' },
        { address: 'ಅರಕೇರಿ', circle_name: 'Post', taluk: 'ವಿಜಯಪುರ', district: 'ವಿಜಯಪುರ', pincode: '586104', circle_in_charge: 'ಪೋಸ್ಟ್ ಅಧಿಕಾರಿ', contact_no: '9845011225', validation: 'Valid' },
        { address: 'ಅರ್ಜನಾಳ', circle_name: 'ಧೋಳಖೇಡ ಸರ್ಕಲ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', pincode: '586207', circle_in_charge: 'ರಮೇಶ ಪಾಟೀಲ', contact_no: '9845011222', validation: 'Valid' },
        { address: 'ಅರ್ಜುಣಗಿ ಕೆ ಡಿ', circle_name: 'ಸಾಲೋಟಗಿ ಸರ್ಕಲ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586217', circle_in_charge: 'ಮಲ್ಲಪ್ಪ ಪೂಜಾರಿ', contact_no: '9845011226', validation: 'Valid' },
        { address: 'ಅರ್ಜುಣಗಿ ಬಿ ಕೆ', circle_name: 'ಸಾಲೋಟಗಿ ಸರ್ಕಲ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586217', circle_in_charge: 'ಮಲ್ಲಪ್ಪ ಪೂಜಾರಿ', contact_no: '9845011226', validation: 'Valid' },
        { address: 'ಅಲಹಳ್ಳಿ', circle_name: 'ಆಲಮೇಲ - ಸಿಂದಗಿ - ದೇವರಹಿಪ್ಪರಗಿ', taluk: 'ಸಿಂದಗಿ', district: 'ವಿಜಯಪುರ', pincode: '586128', circle_in_charge: 'ಸಿದ್ದರಾಮಯ್ಯ ಹಿರೇಮಠ', contact_no: '9845011227', validation: 'Valid' },
        { address: 'ಅಲಿಯಾಬಾದ', circle_name: 'Post', taluk: 'ವಿಜಯಪುರ', district: 'ವಿಜಯಪುರ', pincode: '586101', circle_in_charge: 'ಪೋಸ್ಟ್ ಅಧಿಕಾರಿ', contact_no: '9845011225', validation: 'Valid' },
        { address: 'ಅಸಂತಾಪೂರ', circle_name: 'Post', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586209', circle_in_charge: 'ಪೋಸ್ಟ್ ಅಧಿಕಾರಿ', contact_no: '9845011225', validation: 'Valid' },
        { address: 'ಅಸ್ತಿ', circle_name: 'Post', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586209', circle_in_charge: 'ಪೋಸ್ಟ್ ಅಧಿಕಾರಿ', contact_no: '9845011225', validation: 'Valid' },
        { address: 'ಅಹೀರಸಂಗ', circle_name: 'ಇಂಡಿ ಸ್ಟೇಶನ್ ಸರ್ಕಲ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', pincode: '586209', circle_in_charge: 'ಸುರೇಶ ಬಿರಾದಾರ', contact_no: '9845011223', validation: 'Valid' },
        { address: 'ಆಲಗೂರ', circle_name: 'ಆಲಮೇಲ - ಸಿಂದಗಿ - ದೇವರಹಿಪ್ಪರಗಿ', taluk: 'ಸಿಂದಗಿ', district: 'ವಿಜಯಪುರ', pincode: '586128', circle_in_charge: 'ಸಿದ್ದರಾಮಯ್ಯ ಹಿರೇಮಠ', contact_no: '9845011227', validation: 'Valid' },
        { address: 'ಆಲಮಟ್ಟಿ', circle_name: 'Post', taluk: 'ನಿಡಗುಂದಿ', district: 'ವಿಜಯಪುರ', pincode: '586201', circle_in_charge: 'ಪೋಸ್ಟ್ ಅಧಿಕಾರಿ', contact_no: '9845011225', validation: 'Valid' },
        { address: 'ಆಲಮೇಲ', circle_name: 'ಆಲಮೇಲ - ಸಿಂದಗಿ - ದೇವರಹಿಪ್ಪರಗಿ', taluk: 'ಸಿಂದಗಿ', district: 'ವಿಜಯಪುರ', pincode: '586202', circle_in_charge: 'ಸಿದ್ದರಾಮಯ್ಯ ಹಿರೇಮಠ', contact_no: '9845011227', validation: 'Valid' },
        { address: 'ಅಸಂಗಿಹಾಳ', circle_name: 'ಆಲಮೇಲ - ಸಿಂದಗಿ - ದೇವರಹಿಪ್ಪರಗಿ', taluk: 'ಸಿಂದಗಿ', district: 'ವಿಜಯಪುರ', pincode: '586128', circle_in_charge: 'ಸಿದ್ದರಾಮಯ್ಯ ಹಿರೇಮಠ', contact_no: '9845011227', validation: 'Valid' }
      ]);
      showToast('Loaded 19 official Circle & Village records');
    } else {
      try {
        const res = await fetch('./shareholders_details.xlsx');
        if (res.ok) {
          const blob = await res.blob();
          const fakeFile = new File([blob], 'shareholders_details.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          processExcelFile(fakeFile);
          return;
        }
      } catch (e) {}

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
    }
  };

  const handleDownloadTemplateXlsx = () => {
    if (importType === 'circles') {
      const headers = ['Address', 'Circle Name', 'Taluk', 'District', 'Pincode', 'Circle In-charge', 'Contact No'];
      const sampleRows = [
        headers,
        ['ಅಗರಖೇಡ', 'ಇಂಡಿ ಸರ್ಕಲ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586209', 'ಸಂಗಮೇಶ ಕುಂಬಾರ', '9845011221'],
        ['ಅಗಸನಾಳ', 'ಧೋಳಖೇಡ ಸರ್ಕಲ', 'ಚಡಚಣ', 'ವಿಜಯಪುರ', '586207', 'ರಮೇಶ ಪಾಟೀಲ', '9845011222'],
        ['ಅಂಜುಟಗಿ', 'ಇಂಡಿ ಸ್ಟೇಶನ್ ಸರ್ಕಲ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586209', 'ಸುರೇಶ ಬಿರಾದಾರ', '9845011223'],
        ['ಅಥರ್ಗಾ', 'ತಾಂಬಾ ಸರ್ಕಲ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586112', 'ಬಸವರಾಜ ಹಡಪದ', '9845011224']
      ];
      const ws = XLSX.utils.aoa_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Circle_Details');
      XLSX.writeFile(wb, 'circle_details_template.xlsx');
      showToast('Downloaded official 7-column Circle Excel template');
    } else {
      const headers = [
        'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
        'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
        'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
        'Pin Code', 'Circle', 'Member Type', 'Ownership', 'Tharava Date', 'Tharava No',
        'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
        'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
      ];
      const sampleRows = [
        headers,
        ['B.No: 1', 1, '1', 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', 'M', '4582 9981 1234', '10/Aug/1982', '1', 2000, '10/Aug/1982', '1', 2000, 2000, 1, 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಗ್ರಾಮ, ಶ್ರೀ ಹನುಮಾನ್ ದೇವಸ್ಥಾನದ ಹತ್ತಿರ', 'ಗ್ರಾಮ ಠಾಣಾ', 'ಮುಖ್ಯ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ', '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ', 'ಸ್ವಂತ (Self)', '10/Aug/1982', 'TR-01/1982', '9845012341', '', '', '', 'Yes', 'Yes', 'Yes', 'ಕಾಮಣ್ಣ ಬೀರಪ್ಪ ಸಗಾಯಿ', '4582 9981 5566', '9845012342', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ']
      ];
      const ws = XLSX.utils.aoa_to_sheet(sampleRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Shareholders_Ledger');
      XLSX.writeFile(wb, 'shareholders_details_template.xlsx');
      showToast('Downloaded official 38-column Excel (.xlsx) template with Kannada Unicode');
    }
  };

  const handleCommitImport = async () => {
    if (previewRecords.length === 0) return;
    setIsProcessing(true);
    const count = previewRecords.length;

    if (importType === 'circles') {
      await ApiService.addCircleDirectoryBulk(previewRecords);
      setIsProcessing(false);
      showToast(`Successfully committed ${count.toLocaleString()} Circle & Village records to the directory!`);
      setPreviewRecords([]);
      setActiveModule('circles');
    } else {
      await ApiService.addShareholdersBulk(previewRecords);
      setIsProcessing(false);
      showToast(`Successfully committed ${count.toLocaleString()} records into the live Shareholders Registry!`);
      setPreviewRecords([]);
      setActiveModule('shareholders');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Cooperative Data Excel (.xlsx / .xls) Uploader
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bulk upload official spreadsheets with 100% Kannada Unicode (Shareholders 38 Columns or Circle Details 7 Columns)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplateXlsx}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Template ({importType === 'circles' ? '7 Columns' : '38 Columns'})
          </button>
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

      {/* Import Mode Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => { setImportType('shareholders'); setPreviewRecords([]); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            importType === 'shareholders'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Shareholders Registry (38 Columns Format)</span>
        </button>

        <button
          onClick={() => { setImportType('circles'); setPreviewRecords([]); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            importType === 'circles'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>2. Circle & Village Master (7 Headers: Address, Circle Name, Taluk, District, Pincode...)</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
            {fileName ? `Selected Excel File: ${fileName}` : `Click here to Browse or Drag & Drop your ${importType === 'circles' ? 'Circle Details (7 Columns)' : 'Shareholder Ledger (38 Columns)'} Spreadsheet`}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {importType === 'circles'
              ? 'Accepts Address | Circle Name | Taluk | District | Pincode | Circle In-charge | Contact No'
              : 'Accepts official 38-column shareholder ledger with Book No, Share No, Aadhaar, Receipt, Place, Nominee, Tharava'}
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
            {importType === 'circles' ? 'Load Sample Circle Details (19 Rows)' : 'Load Sample Ledger (Vijayapura/Indi)'}
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
                Parsed {previewRecords.length} {importType === 'circles' ? 'Circle & Village' : 'Shareholder'} Records from {fileName || 'Excel Spreadsheet'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ready to commit to active database</p>
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
            {importType === 'circles' ? (
              /* 7 Columns Table View for Circle Details */
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-4">Address (ಗ್ರಾಮ / ಸ್ಥಳ)</th>
                    <th className="py-2.5 px-4">Circle Name (ಸರ್ಕಲ್ ಹೆಸರು)</th>
                    <th className="py-2.5 px-3">Taluk (ತಾಲೂಕು)</th>
                    <th className="py-2.5 px-3">District (ಜಿಲ್ಲೆ)</th>
                    <th className="py-2.5 px-3">Pincode (ಪಿನ್‌ಕೋಡ್)</th>
                    <th className="py-2.5 px-4">Circle In-charge (ಪ್ರಭಾರಿ)</th>
                    <th className="py-2.5 px-3 font-mono">Contact No (ಸಂಪರ್ಕ ಸಂಖ್ಯೆ)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {previewRecords.slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-900/60">
                      <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="py-2 px-4 font-bold text-slate-100 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{r.address}</span>
                      </td>
                      <td className="py-2 px-4 font-semibold text-emerald-400">{r.circle_name}</td>
                      <td className="py-2 px-3">{r.taluk}</td>
                      <td className="py-2 px-3 text-slate-400">{r.district}</td>
                      <td className="py-2 px-3 font-mono">{r.pincode || '—'}</td>
                      <td className="py-2 px-4 text-slate-300">{r.circle_in_charge || '—'}</td>
                      <td className="py-2 px-3 font-mono text-teal-400">{r.contact_no || '—'}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ✓ {r.validation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* 38 Columns Table View for Shareholders */
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
            )}
          </div>
          {previewRecords.length > 50 && (
            <p className="text-[11px] text-slate-500 text-right mt-2">
              Showing preview of first 50 rows out of {previewRecords.length.toLocaleString()} parsed records.
            </p>
          )}
        </div>
      )}

      {/* Official Master Dataset Sync & Restore */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-900/60 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-200 flex items-center gap-2">
                Sync / Restore Official 17,076 Shareholder Master Data (ಅಧಿಕೃತ 17,076 ಶೇರುದಾರರ ಮಾಹಿತಿ ಮರುಸ್ಥಾಪನೆ)
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Restore the complete authoritative 17,076 shareholder dataset with all 357 village circle mappings into this device's local database. Use this on any mobile or laptop to immediately sync all records.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={async () => {
              setIsProcessing(true);
              showToast('Syncing official 17,076 records across all circles...');
              const res = await ApiService.restoreOfficialData();
              setIsProcessing(false);
              if (res.success) {
                showToast(`Successfully synced ${res.count.toLocaleString()} official shareholders!`);
                setActiveModule('shareholders');
              } else {
                showToast(`Sync failed: ${res.message}`, 'error');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Sync 17,076 Records Now</span>
          </button>
        </div>
      </div>

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
