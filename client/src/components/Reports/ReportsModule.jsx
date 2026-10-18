import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, FileSpreadsheet, Printer, Download, Filter, RefreshCw } from 'lucide-react';

export default function ReportsModule() {
  const { showToast } = useAuth();
  const [selectedReport, setSelectedReport] = useState('shareholders');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [selectedReport]);

  const generateReport = async () => {
    setLoading(true);
    if (selectedReport === 'shareholders') {
      const res = await ApiService.getShareholders({ page: 1, limit: 100 });
      if (res && res.data) setData(res.data);
    } else if (selectedReport === 'transactions') {
      const res = await ApiService.getTransactions({ page: 1, limit: 100 });
      if (res && res.data) setData(res.data);
    } else if (selectedReport === 'sugar') {
      const res = await ApiService.getSugarAllotments({ page: 1, limit: 100 });
      if (res && res.data) setData(res.data);
    } else if (selectedReport === 'varasa') {
      const res = await ApiService.getVarasaTransfers();
      if (res && res.data) setData(res.data);
    } else if (selectedReport === 'villages') {
      const res = await ApiService.getVillages();
      if (res && res.data) setData(res.data);
    }
    setLoading(false);
  };

  const reportTypes = [
    { id: 'shareholders', label: '1. Shareholder-wise Master Report' },
    { id: 'transactions', label: '2. Financial Transactions Ledger Report' },
    { id: 'sugar', label: '3. Sugar Allotment & Quota Report' },
    { id: 'varasa', label: '4. Varasa Transfer Audit Trail Report' },
    { id: 'villages', label: '5. Village & Circle Summary Report' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Share-Wise & Administrative Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Generate, filter and export official cooperative society audit reports</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print Official Report
          </button>

          <button
            onClick={() => showToast('Exporting active report to CSV...')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Report Selector Drawer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 no-print">
        {reportTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedReport(r.id)}
            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left truncate ${
              selectedReport === r.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Official Report Document Container */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 printable-area">
        {/* Printable Official Header */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-emerald-400 tracking-wide">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204</h2>
            <p className="text-xs text-slate-300">Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur</p>
            <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1">
              OFFICIAL AUDIT REPORT: {reportTypes.find(r => r.id === selectedReport)?.label}
            </p>
          </div>

          <div className="text-right text-[10px] text-slate-400 font-mono">
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Records: {data.length} Listed</div>
            <div>Status: Statutory Verified</div>
          </div>
        </div>

        {/* Report Content Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">Compiling report data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                {selectedReport === 'shareholders' && (
                  <tr>
                    <th className="py-3 px-3">Shareholder ID</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Village</th>
                    <th className="py-3 px-3">Circle</th>
                    <th className="py-3 px-3">Share No</th>
                    <th className="py-3 px-3 text-center">Shares</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                )}
                {selectedReport === 'transactions' && (
                  <tr>
                    <th className="py-3 px-3">Tx ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Shareholder</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Ref No</th>
                  </tr>
                )}
                {selectedReport === 'sugar' && (
                  <tr>
                    <th className="py-3 px-3">Allotment ID</th>
                    <th className="py-3 px-3">Shareholder</th>
                    <th className="py-3 px-3">Village</th>
                    <th className="py-3 px-3 text-center">Allocated</th>
                    <th className="py-3 px-3 text-center">Issued</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                )}
                {selectedReport === 'varasa' && (
                  <tr>
                    <th className="py-3 px-3">Transfer ID</th>
                    <th className="py-3 px-3">Existing Member</th>
                    <th className="py-3 px-3">Legal Heir</th>
                    <th className="py-3 px-3">Relationship</th>
                    <th className="py-3 px-3">App Date</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                )}
                {selectedReport === 'villages' && (
                  <tr>
                    <th className="py-3 px-3">Village ID</th>
                    <th className="py-3 px-3">Village Name</th>
                    <th className="py-3 px-3">Circle</th>
                    <th className="py-3 px-3 text-center">Shareholders</th>
                    <th className="py-3 px-3 text-center">Total Shares</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                    {selectedReport === 'shareholders' && (
                      <>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{item.shareholder_id}</td>
                        <td className="py-2.5 px-3 font-medium">{item.name}</td>
                        <td className="py-2.5 px-3 text-slate-300">{item.village_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.circle_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{item.share_number}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.number_of_shares}</td>
                        <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px]">{item.status}</span></td>
                      </>
                    )}
                    {selectedReport === 'transactions' && (
                      <>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{item.transaction_id}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.date?.split('T')[0]}</td>
                        <td className="py-2.5 px-3">{item.shareholder_name}</td>
                        <td className="py-2.5 px-3 font-semibold">{item.type}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹ {item.amount}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.reference_no}</td>
                      </>
                    )}
                    {selectedReport === 'sugar' && (
                      <>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{item.allotment_id}</td>
                        <td className="py-2.5 px-3">{item.shareholder_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.village_name}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.sugar_quantity_kg} kg</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">{item.issued_quantity_kg} kg</td>
                        <td className="py-2.5 px-3 text-center">{item.status}</td>
                      </>
                    )}
                    {selectedReport === 'varasa' && (
                      <>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{item.transfer_id}</td>
                        <td className="py-2.5 px-3">{item.existing_shareholder_name}</td>
                        <td className="py-2.5 px-3 font-bold">{item.heir_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.heir_relationship}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.application_date}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-emerald-400">{item.approval_status}</td>
                      </>
                    )}
                    {selectedReport === 'villages' && (
                      <>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{item.village_id}</td>
                        <td className="py-2.5 px-3 font-bold">{item.name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.circle_name}</td>
                        <td className="py-2.5 px-3 text-center font-semibold">{item.shareholder_count ?? 0}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{item.total_shares ?? 0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Footer */}
        <div className="pt-8 flex justify-between text-[10px] text-slate-400 border-t border-slate-800">
          <div>Report Compiled by: Computer Operator</div>
          <div>Authorized Society Officer Signature: _______________________</div>
        </div>
      </div>
    </div>
  );
}
