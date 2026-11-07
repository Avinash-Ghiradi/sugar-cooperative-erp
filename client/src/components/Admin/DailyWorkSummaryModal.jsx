import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, X, Clock, Calendar, CheckCircle2, ShieldCheck, 
  FileText, ArrowRightLeft, UserCheck, GitMerge, AlertCircle, 
  RefreshCw, KeyRound, Building2, User, Eye, Check, ChevronRight
} from 'lucide-react';
import { useCompanyLogo, useHandshakeLogo } from '../../services/organizationService';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Helper to format date as DD/MM/YYYY
function formatDateDMY(dInput) {
  if (!dInput) return '—';
  const d = new Date(dInput);
  if (isNaN(d.getTime())) return String(dInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper to format time as 12-hour AM/PM
function formatTime12(dInput) {
  if (!dInput) return '—';
  const d = new Date(dInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

// Check if a log entry matches a target calendar day
function matchesCalendarDay(logDateOrTimestamp, targetDate) {
  if (!logDateOrTimestamp) return false;
  const d = new Date(logDateOrTimestamp);
  if (isNaN(d.getTime())) {
    const formatted = formatDateDMY(targetDate);
    return String(logDateOrTimestamp).includes(formatted);
  }
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth() === targetDate.getMonth() &&
    d.getDate() === targetDate.getDate()
  );
}

export default function DailyWorkSummaryModal({ isOpen, onClose, isAutoTriggered = false }) {
  const { user } = useAuth();
  const { t, isEnglish } = useLanguage();
  const companyLogo = useCompanyLogo();
  const handshakeLogo = useHandshakeLogo();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [viewScope, setViewScope] = useState('selected'); // 'selected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [printedTime, setPrintedTime] = useState('');

  // Local storage dismissal key for auto-popup
  const todayKey = new Date().toISOString().slice(0, 10);
  const dismissalStorageKey = `daily_summary_dismissed_${todayKey}`;

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setPrintedTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getAuditLogs();
      if (res && res.data) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error('Error loading audit logs for daily summary:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissForToday = () => {
    try {
      localStorage.setItem(dismissalStorageKey, 'true');
    } catch (e) {}
    onClose();
  };

  const targetDate = new Date(selectedDateStr + 'T00:00:00');

  // Filter logs according to scope and search term
  const filteredLogs = logs.filter(log => {
    // 1. Date filter if scope is 'selected'
    if (viewScope === 'selected') {
      const timeField = log.timestamp || log.dateFormatted || '';
      if (!matchesCalendarDay(timeField, targetDate)) {
        return false;
      }
    }

    // 2. Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        (log.record_id && String(log.record_id).toLowerCase().includes(q)) ||
        (log.share_no && String(log.share_no).toLowerCase().includes(q)) ||
        (log.username && log.username.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.module && log.module.toLowerCase().includes(q)) ||
        (log.description && log.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Calculate statistics for the active filtered scope
  const stats = {
    total: filteredLogs.length,
    shareholderUpdates: filteredLogs.filter(l => (l.action && l.action.includes('SHAREHOLDER')) || (l.module && l.module.includes('Shareholder'))).length,
    varasaTransfers: filteredLogs.filter(l => (l.action && l.action.includes('VARASA')) || (l.module && l.module.includes('Varasa'))).length,
    vargavaneTransfers: filteredLogs.filter(l => (l.action && l.action.includes('VARGAVANE')) || (l.module && l.module.includes('Vargavane'))).length,
    merges: filteredLogs.filter(l => (l.action && l.action.includes('MERGE')) || (l.module && l.module.includes('Merge'))).length,
    passwords: filteredLogs.filter(l => (l.action && l.action.includes('PASSWORD')) || (l.module && l.module.includes('Password'))).length,
    sugarAllotments: filteredLogs.filter(l => (l.action && l.action.includes('SUGAR')) || (l.module && l.module.includes('Sugar'))).length,
  };

  // Check how many logs exist strictly today
  const todayOnlyCount = logs.filter(l => matchesCalendarDay(l.timestamp || l.dateFormatted, new Date())).length;

  const handlePrint = () => {
    setPrintedTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    if (typeof document !== 'undefined') {
      document.body.classList.add('daily-summary-printing');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('daily-summary-printing');
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* -------------------- ONSCREEN MODAL DIALOG -------------------- */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto no-print">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
                <Printer className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">
                    ಇಂದಿನ ಕಾರ್ಯ ನಿರ್ವಹಣಾ ಸಾರಾಂಶ (Daily Work Summary)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                    5:20 PM ಕಚೇರಿ ಮುಕ್ತಾಯ ವರದಿ
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ • ದಿನನಿತ್ಯದ ಬದಲಾವಣೆಗಳ ಆಡಿಟ್ ಸಾರಾಂಶ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>ದಿನದ ಸಾರಾಂಶ ಮುದ್ರಿಸಿ (Print)</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="ಮುಚ್ಚಿ (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 5:20 PM Notification Banner */}
          <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>5:20 PM ಕಚೇರಿ ಸಮಯ ಮುಕ್ತಾಯ:</strong> ಇಂದಿನ ಎಲ್ಲಾ ಬದಲಾವಣೆಗಳು & ವಹಿವಾಟುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ದೈನಂದಿನ ಕಚೇರಿ ದಾಖಲೆಗಾಗಿ ಅಧಿಕೃತ ಪ್ರಿಂಟ್ ತೆಗೆದುಕೊಳ್ಳಿ.
              </span>
            </div>
            <button
              onClick={handleDismissForToday}
              className="text-[11px] underline text-amber-300 hover:text-white shrink-0 cursor-pointer"
            >
              ಇಂದಿಗೆ ಮುಕ್ತಾಯ (Dismiss for today)
            </button>
          </div>

          {/* Filter and Date Selection Controls */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 text-[11px]">ದಿನಾಂಕ:</span>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    setSelectedDateStr(e.target.value);
                    setViewScope('selected');
                  }}
                  className="bg-transparent text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewScope('selected')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewScope === 'selected'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ಆಯ್ದ ದಿನಾಂಕ ({filteredLogs.length})
                </button>
                <button
                  onClick={() => setViewScope('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewScope === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ಎಲ್ಲಾ ಇತ್ತೀಚಿನವು ({logs.length})
                </button>
              </div>

              <button
                onClick={loadLogs}
                disabled={loading}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="ಮರುಲೋಡ್ ಮಾಡಿ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="ಶೇರು ನಂ, ಕ್ರಿಯೆ, ಆಪರೇಟರ್ ಹುಡುಕಿ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-slate-950/20 border-b border-slate-800/80">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಕ್ರಿಯೆಗಳು</span>
              <span className="text-lg font-black text-emerald-400">{stats.total}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ಶೇರು ತಿದ್ದುಪಡಿ</span>
              <span className="text-lg font-black text-sky-400">{stats.shareholderUpdates}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ವಾರಸಾ ಮಂಜೂರಾತಿ</span>
              <span className="text-lg font-black text-purple-400">{stats.varasaTransfers}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ನೇರ ವರ್ಗಾವಣೆ</span>
              <span className="text-lg font-black text-cyan-400">{stats.vargavaneTransfers}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ಷೇರು ವಿಲೀನ</span>
              <span className="text-lg font-black text-amber-400">{stats.merges}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">ಪಾಸ್‌ವರ್ಡ್ & ಇತರ</span>
              <span className="text-lg font-black text-rose-400">{stats.passwords + stats.sugarAllotments}</span>
            </div>
          </div>

          {/* Activities Table Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                <span>ಇಂದಿನ ಆಡಿಟ್ ಲಾಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6 space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-200">
                  ಆಯ್ದ ದಿನಾಂಕದಲ್ಲಿ ({formatDateDMY(targetDate)}) ಯಾವುದೇ ನಮೂದುಗಳು ದಾಖಲಾಗಿಲ್ಲ.
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ಇಂದು ಯಾವುದೇ ಬದಲಾವಣೆಗಳು ಅಥವಾ ವಹಿವಾಟುಗಳು ದಾಖಲಾಗಿರದಿದ್ದರೆ, ಇತ್ತೀಚಿನ ಎಲ್ಲಾ ಆಡಿಟ್ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಕೆಳಗಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.
                </p>
                <button
                  onClick={() => setViewScope('all')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  ಎಲ್ಲಾ ಇತ್ತೀಚಿನ ಕಾರ್ಯಗಳನ್ನು ವೀಕ್ಷಿಸಿ ({logs.length} ಒಟ್ಟು)
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-3">ಕ್ರ.ಸಂ</th>
                      <th className="py-3 px-3">ಸಮಯ</th>
                      <th className="py-3 px-3">ಬಳಕೆದಾರ (User)</th>
                      <th className="py-3 px-3">ವಿಭಾಗ (Module)</th>
                      <th className="py-3 px-3">ಕ್ರಿಯೆ (Action)</th>
                      <th className="py-3 px-3">ಶೇರು ನಂ</th>
                      <th className="py-3 px-3">ಬದಲಾವಣೆ & ನೀಡಲಾದ ವಿವರಗಳು</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredLogs.map((log, idx) => {
                      const isMerge = (log.module && log.module.includes('Merge')) || (log.action && log.action.includes('MERGE'));
                      const isVarasa = (log.module && log.module.includes('Varasa')) || (log.action && log.action.includes('VARASA'));
                      const isVargavane = (log.module && log.module.includes('Vargavane')) || (log.action && log.action.includes('VARGAVANE'));
                      const isUpdate = (log.action && log.action.includes('UPDATE')) || (log.action && log.action.includes('REVISION'));
                      const isPwd = (log.action && log.action.includes('PASSWORD')) || (log.module && log.module.includes('Password'));

                      return (
                        <tr key={log.id || idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap text-[11px]">
                            {formatTime12(log.timestamp)}
                            <span className="block text-[9px] text-slate-500">{formatDateDMY(log.timestamp)}</span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{log.username || log.performed_by || log.operator || 'Admin'}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                                {log.role || 'Admin'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isMerge ? 'bg-amber-950 text-amber-300 border-amber-800' :
                              isVarasa ? 'bg-purple-950 text-purple-300 border-purple-800' :
                              isVargavane ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                              isUpdate ? 'bg-sky-950 text-sky-300 border-sky-800' :
                              isPwd ? 'bg-rose-950 text-rose-300 border-rose-800' :
                              'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}>
                              {log.module || 'Shareholders'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap text-[11px]">
                            <span className={`${
                              isMerge ? 'text-amber-400' :
                              isVarasa ? 'text-purple-400' :
                              isVargavane ? 'text-cyan-400' :
                              isUpdate ? 'text-sky-400' :
                              isPwd ? 'text-rose-400' :
                              'text-emerald-400'
                            }`}>
                              {log.action || log.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                            {log.record_id || (log.share_no ? `#${log.share_no}` : (log.target_id ? `#${log.target_id}` : '—'))}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 text-xs max-w-md">
                            <p className="line-clamp-2 leading-relaxed">
                              {log.description || (typeof log.details === 'string' ? log.details : (log.details?.remarks || JSON.stringify(log.details || '')))}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ಇಂದಿನ ದಿನಾಂಕದ ಶಾಸನಬದ್ಧ ಆಡಿಟ್ ವರದಿ ತಯಾರಾಗಿದೆ. A4 ಹಾಳೆಯಲ್ಲಿ ಮುದ್ರಿಸಿ ಕಚೇರಿ ಕಡತಕ್ಕೆ ಸೇರಿಸಿ.</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleDismissForToday}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ಇಂದಿಗೆ ಮುಕ್ತಾಯ (Dismiss for today)
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ಮುಚ್ಚಿ (Close)
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>ದಿನದ ಸಾರಾಂಶ ಮುದ್ರಿಸಿ (Print Daily Summary)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- STATUTORY A4 PRINT PORTAL -------------------- */}
      {typeof document !== 'undefined' && createPortal(
        <div className="daily-summary-print-portal" style={{ display: 'none' }}>
          <style>{`
            @media screen {
              .daily-summary-print-portal {
                display: none !important;
              }
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body.daily-summary-printing > #root {
                display: none !important;
                visibility: hidden !important;
              }
              body.daily-summary-printing {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body.daily-summary-printing > .daily-summary-print-portal,
              body.daily-summary-printing .daily-summary-print-portal {
                display: block !important;
                visibility: visible !important;
                position: static !important;
                width: 100% !important;
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Anek Kannada', 'Noto Sans Kannada', sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body.daily-summary-printing .summary-page {
                width: 100% !important;
                max-width: 100% !important;
                min-height: 270mm !important;
                padding: 12px 16px !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                page-break-after: always;
              }
            }
          `}</style>

          <div className="summary-page">
            <div>
              {/* Official Cooperative Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
                <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" style={{ maxHeight: '55px', maxWidth: '55px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: '50px', height: '50px', border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                      BSSKN
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
                  <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#000', lineHeight: 1.2 }}>
                    ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ - 586204
                  </h1>
                  <h2 style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 2px 0', color: '#333', letterSpacing: '0.3px' }}>
                    SHREE BHEEMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT, MARGUR - 586204
                  </h2>
                  <p style={{ fontSize: '9.5px', margin: 0, color: '#444' }}>
                    ತಾ|| ಇಂಡಿ, ಜಿ|| ವಿಜಯಪುರ (ಕರ್ನಾಟಕ) • Tq: Indi, Dist: Vijayapura (Karnataka)
                  </p>
                </div>

                <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {handshakeLogo ? (
                    <img src={handshakeLogo} alt="Cooperative" style={{ maxHeight: '45px', maxWidth: '55px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: '9px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #666', padding: '3px' }}>
                      ಸಹಕಾರ
                    </div>
                  )}
                </div>
              </div>

              {/* Title Banner */}
              <div style={{ backgroundColor: '#f3f4f6', border: '1.5px solid #000', padding: '6px 10px', textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>
                  ದೈನಂದಿನ ಕಾರ್ಯ ನಿರ್ವಹಣೆ & ಬದಲಾವಣೆಗಳ ಅಧಿಕೃತ ಸಾರಾಂಶ ವರದಿ
                </div>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#444' }}>
                  DAILY STATUTORY AUDIT & WORK SUMMARY REPORT (5:20 PM DAY-END)
                </div>
              </div>

              {/* Metadata strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', fontSize: '10px', marginBottom: '10px', padding: '6px 8px', border: '1px solid #999', backgroundColor: '#fafafa' }}>
                <div>
                  <strong style={{ color: '#000' }}>ವರದಿಯ ದಿನಾಂಕ:</strong> {formatDateDMY(targetDate)}
                </div>
                <div>
                  <strong style={{ color: '#000' }}>ಮುದ್ರಿಸಿದ ಸಮಯ:</strong> {printedTime || '5:20 PM'}
                </div>
                <div>
                  <strong style={{ color: '#000' }}>ಆಪರೇಟರ್:</strong> {user?.name || 'Avinash Ghiradimath (Admin)'}
                </div>
                <div>
                  <strong style={{ color: '#000' }}>ಒಟ್ಟು ನಮೂದುಗಳು:</strong> {filteredLogs.length}
                </div>
              </div>

              {/* Summary Metrics Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ border: '1px solid #000', padding: '4px 2px', background: '#fff' }}>
                  <div style={{ fontSize: '8.5px', color: '#444' }}>ಒಟ್ಟು ಕ್ರಿಯೆಗಳು</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{stats.total}</div>
                </div>
                <div style={{ border: '1px solid #000', padding: '4px 2px', background: '#fff' }}>
                  <div style={{ fontSize: '8.5px', color: '#444' }}>ಶೇರು ತಿದ್ದುಪಡಿ</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{stats.shareholderUpdates}</div>
                </div>
                <div style={{ border: '1px solid #000', padding: '4px 2px', background: '#fff' }}>
                  <div style={{ fontSize: '8.5px', color: '#444' }}>ವಾರಸಾ ವರ್ಗಾವಣೆ</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{stats.varasaTransfers}</div>
                </div>
                <div style={{ border: '1px solid #000', padding: '4px 2px', background: '#fff' }}>
                  <div style={{ fontSize: '8.5px', color: '#444' }}>ನೇರ ವರ್ಗಾವಣೆ</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{stats.vargavaneTransfers}</div>
                </div>
                <div style={{ border: '1px solid #000', padding: '4px 2px', background: '#fff' }}>
                  <div style={{ fontSize: '8.5px', color: '#444' }}>ಷೇರು ವಿಲೀನ</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{stats.merges}</div>
                </div>
                <div style={{ border: '1px solid #000', padding: '4px 2px', background: '#fff' }}>
                  <div style={{ fontSize: '8.5px', color: '#444' }}>ಪಾಸ್‌ವರ್ಡ್/ಇತರೆ</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{stats.passwords + stats.sugarAllotments}</div>
                </div>
              </div>

              {/* Detailed Activity Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1.5px solid #000', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e7eb', borderBottom: '1.5px solid #000', color: '#000', textAlign: 'left' }}>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '30px', textAlign: 'center' }}>ಕ್ರ.ಸಂ</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '60px' }}>ಸಮಯ</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '90px' }}>ಬಳಕೆದಾರ (User)</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '90px' }}>ವಿಭಾಗ (Module)</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '110px' }}>ಕ್ರಿಯೆ (Action)</th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '50px', textAlign: 'center' }}>ಶೇರು ನಂ</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>ಕೈಗೊಂಡ ಬದಲಾವಣೆ ಮತ್ತು ವಿವರಗಳು (Audit Details)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #000', padding: '16px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        ಈ ದಿನಾಂಕದಲ್ಲಿ ಯಾವುದೇ ಬದಲಾವಣೆಗಳು ಅಥವಾ ವಹಿವಾಟುಗಳು ದಾಖಲಾಗಿಲ್ಲ (No transactions or changes recorded on this date).
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr key={log.id || idx} style={{ borderBottom: '1px solid #999', backgroundColor: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                        <td style={{ border: '1px solid #999', padding: '3.5px', textAlign: 'center', fontWeight: 'bold' }}>
                          {idx + 1}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '3.5px', whiteSpace: 'nowrap' }}>
                          {formatTime12(log.timestamp)}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '3.5px', fontWeight: 'bold' }}>
                          {log.username || log.performed_by || log.operator || 'Admin'}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '3.5px' }}>
                          {log.module || 'Shareholders'}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '3.5px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {log.action || log.type}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '3.5px', textAlign: 'center', fontWeight: 'bold', color: '#000' }}>
                          {log.record_id || (log.share_no ? `#${log.share_no}` : '—')}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '3.5px', lineHeight: '1.25' }}>
                          {log.description || (typeof log.details === 'string' ? log.details : (log.details?.remarks || JSON.stringify(log.details || '')))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Statutory Signatures Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', textAlign: 'center', fontSize: '9.5px', color: '#000' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                  <strong>ತಯಾರಿಸಿದ ಕಂಪ್ಯೂಟರ್ ಆಪರೇಟರ್</strong>
                  <div style={{ fontSize: '8px', color: '#555' }}>(Computer Operator / DEO)</div>
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                  <strong>ಕಚೇರಿ ಅಧೀಕ್ಷಕರು</strong>
                  <div style={{ fontSize: '8px', color: '#555' }}>(Office Superintendent)</div>
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                  <strong>ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿಗಳು</strong>
                  <div style={{ fontSize: '8px', color: '#555' }}>(Chief Accountant)</div>
                </div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '6px' }}>
                  <strong>ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</strong>
                  <div style={{ fontSize: '8px', color: '#555' }}>(Managing Director)</div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #999', marginTop: '12px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#666' }}>
                <span>ಗಣಕೀಕೃತ ಶಾಸನಬದ್ಧ ದಿನನಿತ್ಯದ ಕಚೇರಿ ಮುಕ್ತಾಯ ಆಡಿಟ್ ವರದಿ (5:20 PM Day-End Statutory Report)</span>
                <span>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
