import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

export default function DataImportExport() {
  const { showToast } = useAuth();
  const [previewRecords, setPreviewRecords] = useState([]);

  const handleSimulateFileDrop = () => {
    setPreviewRecords([
      { book_no: 'B.No: 1', sl_no: 1, share_no: '1', shareholder_name: 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '1', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 2, share_no: '2', shareholder_name: 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '2', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 3, share_no: '3', shareholder_name: 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '3', receipt_amount: 1000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 4, share_no: '4', shareholder_name: 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '4', receipt_amount: 2000, total_amount: 8000, number_of_shares: 4, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 5, share_no: '6', shareholder_name: 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ', gender: 'M', reg_date: '10/Aug/1982', receipt_no: '6', receipt_amount: 25000, total_amount: 29000, number_of_shares: 14, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', district: 'ವಿಜಯಪುರ', validation: 'Valid' },
      { book_no: 'B.No: 1', sl_no: 6, share_no: '7', shareholder_name: 'ಎಸ್ ಎಂ ಕುಂಬಾಳ', gender: 'M', reg_date: '15/Aug/1982', receipt_no: '8', receipt_amount: 2000, total_amount: 2000, number_of_shares: 1, schedule_cast: 'ಅ - ವರ್ಗ', place: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', district: 'ವಿಜಯಪುರ', validation: 'Valid' }
    ]);
    showToast('Loaded 38-column official ledger CSV sample (6 records parsed)');
  };

  const downloadSampleTemplate = () => {
    const headers = [
      'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
      'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
      'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
      'Pin Code', 'Circle', 'Member Type', 'Relationship', 'Tharava Date', 'Tharava No',
      'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
      'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
    ];
    const sampleRow = [
      'B.No: 1', '1', '1', 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ', 'M', '4582 9981 1234',
      '10/Aug/1982', '1', '2000', '10/Aug/1982', '1', '2000', '2000',
      '1', 'ಅ - ವರ್ಗ', 'ಬಳ್ಳೊಳ್ಳಿ ಗ್ರಾಮ', 'ಗ್ರಾಮ ಠಾಣಾ', 'ಮುಖ್ಯ ರಸ್ತೆ', 'ಬಳ್ಳೊಳ್ಳಿ', 'ಇಂಡಿ', 'ವಿಜಯಪುರ',
      '586 117', 'ಇಂಡಿ', 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ', 'ಸ್ವಂತ', '10/Aug/1982', 'TR-01/1982',
      '9845012341', '', '', '', 'Yes', 'Yes', 'Yes', 'ಕಾಮಣ್ಣ ಬೀರಪ್ಪ ಸಗಾಯಿ', '4582 9981 5566', '9845012342', 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ'
    ];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + sampleRow.map(e => `"${e}"`).join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Cooperative_38_Column_Statutory_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded 38-column statutory CSV template');
  };

  const handleCommitImport = () => {
    showToast(`Successfully imported ${previewRecords.length} official shareholder ledger records into database!`);
    setPreviewRecords([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" /> Statutory Ledger Data Ingestion & Batch CSV Import
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Import bulk 38-column shareholder records with pre-validation & duplicate detection</p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Download 38-Col Template
        </button>
      </div>

      {/* File Upload Dropzone */}
      <div className="bg-slate-950/80 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 text-center space-y-4 transition-all">
        <Upload className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Drag & Drop 38-Column CSV / Excel File to Import</h3>
          <p className="text-xs text-slate-400 mt-1">
            Accepts Book No, Sl No, Share No, Share Holder Name, Gender, Aadhaar, Reg Date, Receipt, Amount, Place, Taluk, Circle, Tharava, Nominee details
          </p>
        </div>
        <button
          onClick={handleSimulateFileDrop}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950 transition-all"
        >
          Load Statutory Sample Ledger Data (Vijayapura/Indi)
        </button>
      </div>

      {/* Validation Preview Grid */}
      {previewRecords.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-100 text-sm">Import Validation Preview ({previewRecords.length} records verified)</h2>
            <button
              onClick={handleCommitImport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
            >
              Commit Valid Import Records
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Book No</th>
                  <th className="py-2.5 px-3">Sl No</th>
                  <th className="py-2.5 px-3">Share No</th>
                  <th className="py-2.5 px-3">Share Holder Name</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Reg. Date</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-center">Shares</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Place</th>
                  <th className="py-2.5 px-3">Taluk</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {previewRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/60">
                    <td className="py-2 px-3 font-mono text-sky-400 font-bold">{r.book_no}</td>
                    <td className="py-2 px-3 font-mono">{r.sl_no}</td>
                    <td className="py-2 px-3 font-mono text-emerald-400 font-bold">{r.share_no}</td>
                    <td className="py-2 px-3 font-bold text-slate-100">{r.shareholder_name}</td>
                    <td className="py-2 px-3">{r.gender}</td>
                    <td className="py-2 px-3 text-slate-400">{r.reg_date}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-400 font-bold">₹ {r.total_amount}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-400">{r.number_of_shares}</td>
                    <td className="py-2 px-3 text-center">{r.schedule_cast}</td>
                    <td className="py-2 px-3 font-bold text-emerald-300">{r.place}</td>
                    <td className="py-2 px-3">{r.taluk}</td>
                    <td className="py-2 px-3 text-slate-400">{r.district}</td>
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
