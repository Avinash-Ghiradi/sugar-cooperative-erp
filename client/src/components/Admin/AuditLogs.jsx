import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { History, Search, ShieldCheck, RefreshCw, Filter, GitMerge, FileText, ArrowRightLeft, UserCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all'); // 'all', 'merge', 'varasa', 'vargavane', 'updates'

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    const res = await ApiService.getAuditLogs();
    if (res && res.data) setLogs(res.data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      (log.record_id && String(log.record_id).toLowerCase().includes(q)) ||
      (log.share_no && String(log.share_no).toLowerCase().includes(q)) ||
      (log.username && log.username.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.module && log.module.toLowerCase().includes(q)) ||
      (log.description && log.description.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterModule === 'merge') {
      return (log.module && log.module.includes('Merge')) || (log.action && log.action.includes('MERGE'));
    }
    if (filterModule === 'varasa') {
      return (log.module && log.module.includes('Varasa')) || (log.action && log.action.includes('VARASA'));
    }
    if (filterModule === 'vargavane') {
      return (log.module && log.module.includes('Vargavane')) || (log.action && log.action.includes('VARGAVANE'));
    }
    if (filterModule === 'updates') {
      return (log.action && log.action.includes('UPDATE')) || (log.action && log.action.includes('REVISION'));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Immutable System Audit Logs (ಶಾಸನಬದ್ಧ ಲೆಕ್ಕಪರಿಶೋಧನಾ ದಾಖಲೆ)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ೨-ಹಂತದ ಷೇರು ವಿಲೀನ ಅನುಮೋದನೆಗಳು, ವಾರಸು ವರ್ಗಾವಣೆ, ನೇರ ವರ್ಗಾವಣೆ, ಹಾಗೂ ಶಾಸನಬದ್ಧ ಬದಲಾವಣೆಗಳ ಶಾಶ್ವತ ಇತಿಹಾಸ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAuditLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>ಮರುಲೋಡ್ ಮಾಡಿ</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            {logs.length} ಒಟ್ಟು ಆಡಿಟ್ ದಾಖಲೆಗಳು
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ಷೇರು ನಂ, ಆಪರೇಟರ್, ಕ್ರಿಯೆ ಅಥವಾ ವಿವರಗಳನ್ನು ಹುಡುಕಿ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterModule('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterModule === 'all' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            ಎಲ್ಲವೂ ({logs.length})
          </button>
          <button
            onClick={() => setFilterModule('merge')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterModule === 'merge' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5 text-amber-400" />
            <span>ವಿಲೀನ (Merges)</span>
          </button>
          <button
            onClick={() => setFilterModule('varasa')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterModule === 'varasa' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>ವಾರಸು (Varasa)</span>
          </button>
          <button
            onClick={() => setFilterModule('vargavane')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterModule === 'vargavane' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>ವರ್ಗಾವಣೆ (Transfers)</span>
          </button>
          <button
            onClick={() => setFilterModule('updates')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterModule === 'updates' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>ತಿದ್ದುಪಡಿಗಳು (Updates)</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">ದಿನಾಂಕ & ಸಮಯ</th>
                <th className="py-3.5 px-4">ಬಳಕೆದಾರ / User</th>
                <th className="py-3.5 px-4">ಮಾಹಿತಿ ವಿಭಾಗ (Module)</th>
                <th className="py-3.5 px-4">ಕ್ರಿಯೆ (Action)</th>
                <th className="py-3.5 px-4">ಷೇರು ನಂ / Record</th>
                <th className="py-3.5 px-4">ವಿವರಗಳು (Audit Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>ಆಡಿಟ್ ಲಾಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    ಯಾವುದೇ ಆಡಿಟ್ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isMerge = (log.module && log.module.includes('Merge')) || (log.action && log.action.includes('MERGE'));
                  const isVarasa = (log.module && log.module.includes('Varasa')) || (log.action && log.action.includes('VARASA'));
                  const isVargavane = (log.module && log.module.includes('Vargavane')) || (log.action && log.action.includes('VARGAVANE'));
                  const isUpdate = (log.action && log.action.includes('UPDATE')) || (log.action && log.action.includes('REVISION'));

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : (log.dateFormatted || '—')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{log.username || log.performed_by || log.operator || 'Admin'}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                            {log.role || 'Admin'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isMerge ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          isVarasa ? 'bg-purple-950 text-purple-300 border-purple-800' :
                          isVargavane ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                          isUpdate ? 'bg-sky-950 text-sky-300 border-sky-800' :
                          'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {log.module || 'Shareholders'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-[11px]">
                        <span className={`${
                          isMerge ? 'text-amber-400' :
                          isVarasa ? 'text-purple-400' :
                          isVargavane ? 'text-cyan-400' :
                          isUpdate ? 'text-sky-400' :
                          'text-emerald-400'
                        }`}>
                          {log.action || log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                        {log.record_id || (log.share_no ? `#${log.share_no}` : (log.target_id ? `#${log.target_id}` : '—'))}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-xs max-w-md">
                        <p className="line-clamp-2 leading-relaxed">
                          {log.description || (typeof log.details === 'string' ? log.details : (log.details?.remarks || JSON.stringify(log.details || '')))}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
