import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function DataImportExport() {
  const { showToast } = useAuth();
  const [previewRecords, setPreviewRecords] = useState([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const sampleCsvData = `shareholder_id,name,father_husband_name,mobile,share_number,number_of_shares,village_id
SH-90001,Mahesh Balwant Shinde,Balwant Shinde,9822998877,SN-900001,10,VIL-001
SH-90002,Prakash Vithal Pawar,Vithal Pawar,9822112233,SN-900002,5,VIL-002`;

  const handleSimulateFileDrop = () => {
    setPreviewRecords([
      { shareholder_id: 'SH-90001', name: 'Mahesh Balwant Shinde', father_husband_name: 'Balwant Shinde', mobile: '9822998877', share_number: 'SN-900001', number_of_shares: 10, village_id: 'VIL-001', validation: 'Valid' },
      { shareholder_id: 'SH-90002', name: 'Prakash Vithal Pawar', father_husband_name: 'Vithal Pawar', mobile: '9822112233', share_number: 'SN-900002', number_of_shares: 5, village_id: 'VIL-002', validation: 'Valid' },
      { shareholder_id: 'SH-00001', name: 'Rajaram Patil', father_husband_name: 'Dattatray Patil', mobile: '9822100001', share_number: 'SN-100001', number_of_shares: 5, village_id: 'VIL-001', validation: 'Duplicate ID Found' }
    ]);
    setDuplicateCount(1);
    showToast('Parsed CSV file: 3 records loaded for validation check');
  };

  const handleCommitImport = () => {
    showToast(`Successfully imported ${previewRecords.filter(r => r.validation === 'Valid').length} new shareholder records into database!`);
    setPreviewRecords([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" /> Data Ingestion & Batch CSV Import
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Import bulk shareholder records with pre-validation & duplicate detection</p>
        </div>
      </div>

      {/* File Upload Dropzone */}
      <div className="bg-slate-950/80 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 text-center space-y-4 transition-all">
        <Upload className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Drag & Drop CSV / Excel File to Import</h3>
          <p className="text-xs text-slate-400 mt-1">Accepts .csv, .xlsx containing Shareholder ID, Name, Mobile, Village & Share Number</p>
        </div>
        <button
          onClick={handleSimulateFileDrop}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950 transition-all"
        >
          Select Sample CSV File to Inspect
        </button>
      </div>

      {/* Validation Preview Grid */}
      {previewRecords.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-100 text-sm">Import Validation Preview ({previewRecords.length} records)</h2>
            <button
              onClick={handleCommitImport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
            >
              Commit Valid Import Records
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Shareholder ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Share No</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {previewRecords.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-mono font-semibold">{r.shareholder_id}</td>
                    <td className="py-2 px-3">{r.name}</td>
                    <td className="py-2 px-3 font-mono">{r.mobile}</td>
                    <td className="py-2 px-3 font-mono">{r.share_number}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.validation === 'Valid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {r.validation}
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
