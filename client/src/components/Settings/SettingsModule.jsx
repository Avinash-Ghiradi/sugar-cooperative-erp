import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, Building2 } from 'lucide-react';

export default function SettingsModule() {
  const { showToast } = useAuth();
  const [form, setForm] = useState({
    org_name: 'Chhatrapati Sugar Cooperative Society Ltd.',
    org_reg_no: 'CS-SUGAR-1978-8842',
    org_address: 'Sugar Mill Road, District Cooperative Complex',
    org_phone: '+91 231 2548900',
    org_email: 'info@sugarcooperative.org',
    crushing_season: '2025-2026',
    sugar_quota_per_share: '15'
  });

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Cooperative organization settings updated!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" /> Organization & Business Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure cooperative headers, registration numbers, season quotas & print branding</p>
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Cooperative Society Official Name *</label>
            <input
              type="text"
              required
              value={form.org_name}
              onChange={(e) => setForm({ ...form, org_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Registration Number *</label>
              <input
                type="text"
                required
                value={form.org_reg_no}
                onChange={(e) => setForm({ ...form, org_reg_no: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Active Crushing Season</label>
              <input
                type="text"
                value={form.crushing_season}
                onChange={(e) => setForm({ ...form, crushing_season: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Official Phone</label>
              <input
                type="text"
                value={form.org_phone}
                onChange={(e) => setForm({ ...form, org_phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Sugar Quota per Share (kg)</label>
              <input
                type="number"
                value={form.sugar_quota_per_share}
                onChange={(e) => setForm({ ...form, sugar_quota_per_share: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Postal Address *</label>
            <textarea
              rows="2"
              value={form.org_address}
              onChange={(e) => setForm({ ...form, org_address: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all"
            >
              <Save className="w-4 h-4" /> Save Organization Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
