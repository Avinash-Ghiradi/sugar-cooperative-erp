import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3, FileSpreadsheet, Printer, Download, Filter, RefreshCw,
  Users, CreditCard, PackageCheck, History, Building2, ChevronLeft, ChevronRight
} from 'lucide-react';
import ShareholderReports from './ShareholderReports';

export default function ReportsModule() {
  const { showToast, activeReportSubTab, setActiveReportSubTab } = useAuth();
  const selectedReport = activeReportSubTab || 'shareholders';
  const setSelectedReport = setActiveReportSubTab;
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
    {
      id: 'shareholders',
      number: '1',
      title: 'ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು',
      subTitle: 'Shareholder Reports',
      desc: 'ಗ್ರಾಮ, ವರ್ಗ, ವಲಯ, ನಗದು & ಶೇರುವಾರು ವಿಶ್ಲೇಷಣೆ',
      icon: Users,
      badge: 'Advanced'
    },
    {
      id: 'transactions',
      number: '2',
      title: 'ಆರ್ಥಿಕ ವಹಿವಾಟು ವಹಿ',
      subTitle: 'Financial Ledger',
      desc: 'ದೈನಂದಿನ ಹಣಕಾಸು ಜಮಾ/ಖರ್ಚು & ಪಾಸ್‌ಬುಕ್ ದಾಖಲೆ',
      icon: CreditCard,
      badge: 'Ledger'
    },
    {
      id: 'sugar',
      number: '3',
      title: 'ಸಕ್ಕರೆ ಕೋಟಾ ಹಂಚಿಕೆ',
      subTitle: 'Sugar Allotment',
      desc: 'ಶೇರುದಾರರ ಸಕ್ಕರೆ ಕೋಟಾ ಹಂಚಿಕೆ & ವಿತರಣಾ ವರದಿ',
      icon: PackageCheck,
      badge: 'Quota'
    },
    {
      id: 'varasa',
      number: '4',
      title: 'ವಾರಸುದಾರರ ಆಡಿಟ್',
      subTitle: 'Varasa Audit',
      desc: 'ವಾರಸುದಾರರ ವರ್ಗಾವಣೆ ಮತ್ತು ಅನುಮೋದನೆ ದಾಖಲೆ',
      icon: History,
      badge: 'Audit'
    },
    {
      id: 'villages',
      number: '5',
      title: 'ಗ್ರಾಮ & ವಲಯ ಸಾರಾಂಶ',
      subTitle: 'Villages & Circles',
      desc: 'ಕಾರ್ಯವ್ಯಾಪ್ತಿ ಗ್ರಾಮಗಳು & ಸರ್ಕಲ್‌ಗಳ ಸಂಕ್ಷಿಪ್ತ ವರದಿ',
      icon: Building2,
      badge: 'Master'
    }
  ];

  const exportGeneralReport = () => {
    if (!data || data.length === 0) {
      showToast('ರಫ್ತು ಮಾಡಲು ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ', 'error');
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      const rep = reportTypes.find(r => r.id === selectedReport);
      XLSX.utils.book_append_sheet(wb, ws, rep?.subTitle || 'Report');
      XLSX.writeFile(wb, `${selectedReport}_report.xlsx`);
      showToast('ಎಕ್ಸೆಲ್ ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!');
    } catch (err) {
      showToast('Error exporting Excel: ' + err.message, 'error');
    }
  };

  return (
    <div className="w-full space-y-6">
      {selectedReport === 'shareholders' ? (
        <ShareholderReports />
      ) : (
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 printable-area">
            {/* Printable Official Header */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-emerald-400 tracking-wide">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204</h2>
                <p className="text-xs text-slate-300">Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur</p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1">
                  OFFICIAL AUDIT REPORT: {reportTypes.find(r => r.id === selectedReport)?.title} ({reportTypes.find(r => r.id === selectedReport)?.subTitle})
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-sky-400" /> Print
                </button>

                <button
                  onClick={exportGeneralReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
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
