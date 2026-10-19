import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3, FileSpreadsheet, Printer, Download, Filter, RefreshCw, Users, CreditCard,
  PackageCheck, History, Building2, Layers, MapPin, Coins, IndianRupee, FileText, ChevronDown
} from 'lucide-react';
import ShareholderReports from './ShareholderReports';

export default function ReportsModule() {
  const { showToast } = useAuth();
  const [selectedReport, setSelectedReport] = useState('shareholders');
  const [shareholderSubReport, setShareholderSubReport] = useState('placewise');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedReport !== 'shareholders') {
      generateReport();
    }
  }, [selectedReport]);

  const generateReport = async () => {
    setLoading(true);
    if (selectedReport === 'transactions') {
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
    { id: 'shareholders', label: '1. ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು (Shareholder Reports)', icon: Users },
    { id: 'transactions', label: '2. ಆರ್ಥಿಕ ವಹಿವಾಟು ವಹಿ (Financial Ledger)', icon: CreditCard },
    { id: 'sugar', label: '3. ಸಕ್ಕರೆ ಕೋಟಾ ಹಂಚಿಕೆ (Sugar Allotment)', icon: PackageCheck },
    { id: 'varasa', label: '4. ವಾರಸುದಾರರ ಆಡಿಟ್ (Varasa Audit)', icon: History },
    { id: 'villages', label: '5. ಗ್ರಾಮ & ವಲಯ ಸಾರಾಂಶ (Villages & Circles)', icon: Building2 }
  ];

  // Submenu for Shareholder Reports (ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳ ಉಪ-ಮೆನು)
  const shareholderSubmenus = [
    { id: 'placewise', label: '1. ಸ್ಥಳವಾರು ವರದಿ (Place-wise)', icon: Building2 },
    { id: 'categorywise', label: '2. ವರ್ಗವಾರು ವರದಿ (Category-wise)', icon: Layers },
    { id: 'circlewise', label: '3. ವಲಯವಾರು ವರದಿ (Circle-wise)', icon: MapPin },
    { id: 'shareswise', label: '4. ಶೇರುವಾರು ವರದಿ (Shares-wise)', icon: Coins },
    { id: 'amountwise', label: '5. ನಗದು ಮೊತ್ತವಾರು ವರದಿ (Cash Amount-wise)', icon: IndianRupee },
    { id: 'detailed', label: '6. ಸದಸ್ಯರ ಸಮಗ್ರ ವಿವರ ಪಟ್ಟಿ (Detailed Register)', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Level Report Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 no-print">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          const isSel = selectedReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSel
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSel ? 'text-white' : 'text-emerald-400'}`} />
              <span>{r.label}</span>
              {r.id === 'shareholders' && isSel && (
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Submenu for Shareholder Reports - Directly under 1. ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು */}
      {selectedReport === 'shareholders' && (
        <div className="bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 p-3.5 rounded-2xl border-2 border-emerald-500/30 shadow-xl no-print space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳ ಉಪ-ಮೆನು (Shareholders Report Submenu):
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              ಯಾವುದೇ ಉಪ-ವರದಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ (Click to view breakdown)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {shareholderSubmenus.map((sub) => {
              const SubIcon = sub.icon;
              const isSubSel = shareholderSubReport === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setShareholderSubReport(sub.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSubSel
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950 ring-2 ring-emerald-400/60 scale-[1.02]'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <SubIcon className={`w-3.5 h-3.5 ${isSubSel ? 'text-white' : 'text-emerald-400'}`} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Render Active Report */}
      {selectedReport === 'shareholders' ? (
        <ShareholderReports
          activeMode={shareholderSubReport}
          onModeChange={setShareholderSubReport}
        />
      ) : (
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

            <div className="flex items-center gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
              >
                <Printer className="w-4 h-4 text-sky-400" /> Print
              </button>

              <button
                onClick={() => showToast('Exporting report...')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Report Content Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">ದಾಖಲೆಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
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
      )}
    </div>
  );
}
