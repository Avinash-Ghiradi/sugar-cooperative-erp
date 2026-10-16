import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Building2, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function VillageMaster() {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  useEffect(() => {
    loadVillages();
  }, []);

  const loadVillages = async () => {
    setLoading(true);
    const res = await ApiService.getVillages();
    if (res && res.data) setVillages(res.data);
    setLoading(false);
  };

  const filtered = villages.filter(v => {
    if (!search) return true;
    const q = search.trim().toLowerCase();
    return (v.name || '').toLowerCase().includes(q) ||
      (v.taluk || '').toLowerCase().includes(q) ||
      (v.circle_name || '').toLowerCase().includes(q) ||
      (v.village_id || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" /> Village Master Registry (ಗ್ರಾಮ / ಸ್ಥಳಗಳ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold font-mono">
              {villages.length} Total Places
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Territories and shareholder counts dynamically extracted from cooperative records
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Place / Village / Taluk..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Loading all registered places...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((v) => (
              <div key={v.village_id} className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl space-y-3 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{v.name}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-400 font-mono">{v.village_id}</span>
                      <span>•</span>
                      <span>ತಾ: {v.taluk || 'ಇಂಡಿ'}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                    {v.circle_name || 'ಇಂಡಿ'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="bg-slate-900 p-2 rounded-xl text-center">
                    <span className="text-slate-400 text-[10px]">Shareholders</span>
                    <div className="font-bold text-slate-100 mt-0.5">{v.shareholder_count ?? 0}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl text-center">
                    <span className="text-slate-400 text-[10px]">Total Shares</span>
                    <div className="font-bold text-emerald-400 mt-0.5">{v.total_shares ?? 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs">
              <span className="text-slate-400">
                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} places
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
