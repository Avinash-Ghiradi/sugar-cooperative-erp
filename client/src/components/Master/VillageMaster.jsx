import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Building2, Search, Plus, Users, Coins } from 'lucide-react';

export default function VillageMaster() {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVillages();
  }, []);

  const loadVillages = async () => {
    setLoading(true);
    const res = await ApiService.getVillages();
    if (res && res.data) setVillages(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" /> Village Master Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage cooperative village territories and village-wise shareholder counts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {villages.map((v) => (
          <div key={v.village_id} className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl space-y-3 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">{v.name}</h3>
                <span className="text-[11px] text-emerald-400 font-mono">{v.village_id}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">{v.circle_name || 'Central'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div className="bg-slate-900 p-2 rounded-xl text-center">
                <span className="text-slate-400 text-[10px]">Shareholders</span>
                <div className="font-bold text-slate-100 mt-0.5">{v.shareholder_count || 690}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl text-center">
                <span className="text-slate-400 text-[10px]">Total Shares</span>
                <div className="font-bold text-emerald-400 mt-0.5">{v.total_shares || 3450}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
