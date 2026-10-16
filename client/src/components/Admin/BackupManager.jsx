import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Download, RefreshCw, ShieldCheck } from 'lucide-react';

export default function BackupManager() {
  const { showToast } = useAuth();
  const [backups, setBackups] = useState([
    { id: 1, name: 'sugar_erp_backup_2026-09-03.db', size: '14.8 MB', date: '2026-09-03 05:00:00' },
    { id: 2, name: 'sugar_erp_backup_2026-09-02.db', size: '14.5 MB', date: '2026-09-02 05:00:00' },
    { id: 3, name: 'sugar_erp_backup_2026-09-01.db', size: '14.2 MB', date: '2026-09-01 05:00:00' }
  ]);

  const handleCreateBackup = () => {
    const newB = {
      id: backups.length + 1,
      name: `sugar_erp_backup_${new Date().toISOString().split('T')[0]}.db`,
      size: '15.1 MB',
      date: new Date().toLocaleString()
    };
    setBackups([newB, ...backups]);
    showToast('Database backup snapshot created successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> Database Backup & Recovery Manager
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Generate full SQLite database snapshots & inspect backup history</p>
        </div>

        <button
          onClick={handleCreateBackup}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
        >
          <Database className="w-4 h-4" /> Create Instant Backup Snapshot
        </button>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Backup File Name</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Created Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{b.name}</td>
                  <td className="py-3 px-4 text-slate-300">{b.size}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{b.date}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => showToast(`Downloading ${b.name}...`)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-sky-400 font-medium text-[11px] flex items-center gap-1 ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Snapshot
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
