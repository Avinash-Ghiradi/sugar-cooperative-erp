import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { History, Search, ShieldCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    const res = await ApiService.getAuditLogs();
    if (res && res.data) setLogs(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" /> Immutable System Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Track every user action, shareholder modification, transaction entry & Varasa transfer</p>
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-100">{log.username}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{log.role}</td>
                  <td className="py-3 px-4 text-slate-300">{log.module}</td>
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{log.record_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
