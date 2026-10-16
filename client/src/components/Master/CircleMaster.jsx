import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { MapPin, Building2, Users } from 'lucide-react';

export default function CircleMaster() {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    setLoading(true);
    const res = await ApiService.getCircles();
    if (res && res.data) setCircles(res.data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" /> Circle Master Division
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage administrative agricultural circles and regional village groupings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {circles.map((c) => (
          <div key={c.circle_id} className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl space-y-3 transition-all">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">{c.circle_id}</span>
              <h3 className="font-bold text-slate-100 text-sm mt-0.5">{c.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Villages:</span><span className="font-bold text-slate-100">{c.village_count || 6}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Shareholders:</span><span className="font-bold text-emerald-400">{c.shareholder_count || 2150}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Shares:</span><span className="font-bold text-slate-100">{c.total_shares || 10750}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
