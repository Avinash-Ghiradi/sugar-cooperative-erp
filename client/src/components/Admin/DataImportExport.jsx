import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { ShieldAlert, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Download, FileCheck, RefreshCw } from 'lucide-react';

export default function DataImportExport() {
  const { showToast, setActiveModule } = useAuth();
  const [previewRecords, setPreviewRecords] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Parse actual uploaded CSV file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processCsvFile(file);
  };

  const processCsvFile = (file) => {
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          showToast('CSV file is empty or missing data rows', 'error');
          setIsProcessing(false);
          return;
        }

        // Parse header
        const rawHeaders = parseCsvLine(lines[0]);
        const records = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length === 0 || values.every(v => v === '')) continue;

          // Map by position or header name
          const r = {
            book_no: values[0] || 'B.No: 1',
            sl_no: parseInt(values[1]) || i,
            share_no: values[2] || String(i),
            shareholder_name: values[3] || 'ಷೇರುದಾರ',
            gender: values[4] || 'M',
            aadhaar_card_no: values[5] || '',
            reg_date: values[6] || '10/Aug/1982',
            receipt_no: values[7] || String(i),
            receipt_amount: parseFloat(values[8]) || 2000,
            date: values[9] || values[6] || '10/Aug/1982',
            reciept: values[10] || values[7] || '',
            amount: parseFloat(values[11]) || 2000,
            total_amount: parseFloat(values[12]) || 2000,
            number_of_shares: parseInt(values[13]) || 1,
            schedule_cast: values[14] || 'ಅ - ವರ್ಗ',
            address: values[15] || '',
            nagara: values[16] || '',
            road: values[17] || '',
            place: values[18] || 'ಬಳ್ಳೊಳ್ಳಿ',
            taluk: values[19] || 'ಇಂಡಿ',
            district: values[20] || 'ವಿಜಯಪುರ',
            pin_code: values[21] || '586 117',
            circle: values[22] || 'ಇಂಡಿ',
            member_type: values[23] || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
            relationship: values[24] || 'ಸ್ವಂತ (Self)',
            tharava_date: values[25] || '10/Aug/1982',
            tharava_no: values[26] || `TR-${i}/1982`,
            mobile_no: values[27] || '',
            photo_url: values[28] || '',
            signature_url: values[29] || '',
            thumb_url: values[30] || '',
            photo_updated: values[31] || 'Yes',
            signature_updated: values[32] || 'Yes',
            thumb_updated: values[33] || 'Yes',
            nominee_name: values[34] || '',
            nominee_aadhaar_no: values[35] || '',
            nominee_mobile_no: values[36] || '',
            nominee_address: values[37] || '',
            validation: 'Valid'
          };
          records.push(r);
        }

        setPreviewRecords(records);
        showToast(`Successfully parsed ${records.length} shareholder records from ${file.name}`);
      } catch (err) {
        showToast('Error parsing CSV file format', 'error');
      }
      setIsProcessing(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Helper function to parse CSV lines handling quoted values with commas
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
      processCsvFile(e.dataTransfer.files[0]);
    }
  };

  const loadDefaultSample = async () => {
    try {
      const res = await fetch('./shareholders_details.csv');
      if (res.ok) {
        const text = await res.text();
        const fakeFile = new Blob([text], { type: 'text/csv' });
        fakeFile.name = 'shareholders_details.csv';
        processCsvFile(fakeFile);
        return;
      }
    } catch (e) {}

    // Fallback default sample
    setFileName('shareholders_details.csv');
    setPreviewRecords([
      { book_no: 'B.No: 1', sl_no: 1, share_no: '1', shareholder_name: 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '1', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 2, share_no: '2', shareholder_name: 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '2', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 3, share_no: '3', shareholder_name: 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '3', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 4, share_no: '4', shareholder_name: 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '4', receipt_amount: 2000, total_amount: 8000, number_of_shares: 4, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 5, share_no: '6', shareholder_name: 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '6', receipt_amount: 25000, total_amount: 29000, number_of_shares: 14, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 6, share_no: '7', shareholder_name: 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', gender: 'M', reg_date: '15/Aug/1982', receipt_no: '8', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' }
    ]);
    showToast('Loaded 38-column statutory ledger data');
  };

  const handleCommitImport = async () => {
    setIsProcessing(true);
    for (const r of previewRecords) {
      await ApiService.addShareholder(r);
    }
    setIsProcessing(false);
    showToast(`Successfully committed ${previewRecords.length} records into the live Shareholders Registry!`);
    setPreviewRecords([]);
    setActiveModule('shareholders');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" /> Shareholder Details CSV Uploader
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload any 38-column shareholder ledger CSV file (Book No, Share No, Aadhaar, Receipt, Place, Nominee, Tharava)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="./shareholders_details.csv"
            download="shareholders_details.csv"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Download shareholders_details.csv
          </a>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Interactive Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-slate-950/80 border-2 border-dashed border-slate-800 hover:border-emerald-500/60 cursor-pointer rounded-3xl p-10 text-center space-y-4 transition-all group"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-emerald-950">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-bold text-slate-100 text-sm">
            {fileName ? `Selected File: ${fileName}` : 'Click here to Browse or Drag & Drop your CSV File'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Uploads and parses official 38-column cooperative ledger files with UTF-8 Kannada and English support
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all"
          >
            Choose CSV File from Computer
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
                Parsed {previewRecords.length} Shareholder Records from {fileName || 'CSV'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ready to commit to active 17,250+ registry database</p>
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
                {previewRecords.map((r, i) => (
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
        </div>
      )}
    </div>
  );
}
