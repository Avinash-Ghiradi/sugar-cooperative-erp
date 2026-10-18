import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, Building2, Trash2, ShieldAlert } from 'lucide-react';
import ResetConfirmModal from '../Common/ResetConfirmModal';

export default function SettingsModule() {
  const { showToast } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);
  const [form, setForm] = useState({
    org_name: 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ. / Shree Bheemashankar Co-operative Sugar Factory',
    org_reg_no: 'BSSKN-MARGUR-586204',
    org_address: 'ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ / Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur',
    org_phone: '+91 8359 254800',
    org_email: 'info@bheemashankarsugar.com',
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Organization Settings
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 border border-rose-900/60 rounded-3xl p-6 shadow-xl max-w-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-200 flex items-center gap-2">
                Danger Zone: Erase Everything & Reset All Data
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Wipe all records from IndexedDB and local browser storage. Restores database to a factory fresh slate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 transition-all cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Erase & Reset</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
}
