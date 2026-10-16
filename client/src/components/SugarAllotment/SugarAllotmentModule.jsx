import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PackageCheck, Search, Plus, Printer, X, Save } from 'lucide-react';

export default function SugarAllotmentModule() {
  const { showToast } = useAuth();
  const [allotments, setAllotments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);

  const [form, setForm] = useState({
    shareholder_id: 'SH-00003',
    allotment_date: new Date().toISOString().split('T')[0],
    sugar_quantity_kg: 75,
    sugar_type: 'M30 Grade White Sugar',
    allotment_period: 'Crushing Season 2025-2026',
    issued_quantity_kg: 30,
    remarks: 'Annual shareholder sugar quota issue'
  });

  useEffect(() => {
    loadAllotments();
  }, [search]);

  const loadAllotments = async () => {
    setLoading(true);
    const res = await ApiService.getSugarAllotments({ search });
    if (res && res.data) {
      setAllotments(res.data);
    }
    setLoading(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const res = await ApiService.addSugarAllotment(form);
    if (res && res.success) {
      showToast(`Sugar Allotment ${res.allotment_id} created successfully!`);
      setShowAddModal(false);
      loadAllotments();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" /> Sugar Allotment & Distribution
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage annual sugar quotas, vouchers & issue statements for 17,250+ Shareholders</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" /> Issue New Quota Allotment
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Shareholder ID, Name, Allotment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Allotment Ledger Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading sugar allotment ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Allotment ID</th>
                  <th className="py-3.5 px-4">Shareholder</th>
                  <th className="py-3.5 px-4">Village</th>
                  <th className="py-3.5 px-4">Season Period</th>
                  <th className="py-3.5 px-4 text-center">Allocated (kg)</th>
                  <th className="py-3.5 px-4 text-center">Issued (kg)</th>
                  <th className="py-3.5 px-4 text-center">Remaining (kg)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {allotments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{a.allotment_id}</td>
                    <td className="py-3 px-4 font-medium">{a.shareholder_name} ({a.shareholder_id})</td>
                    <td className="py-3 px-4 text-slate-400">{a.village_name}</td>
                    <td className="py-3 px-4 text-slate-300">{a.allotment_period}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-100">{a.sugar_quantity_kg} kg</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-400">{a.issued_quantity_kg} kg</td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-400">{a.remaining_quantity_kg} kg</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-medium text-[10px]">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveVoucher(a)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-sky-400 font-medium transition-colors"
                      >
                        Print Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Allotment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Add Sugar Allotment Quota</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Shareholder ID *</label>
                <input
                  type="text"
                  required
                  value={form.shareholder_id}
                  onChange={(e) => setForm({ ...form, shareholder_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Crushing Season Period</label>
                <input
                  type="text"
                  value={form.allotment_period}
                  onChange={(e) => setForm({ ...form, allotment_period: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Total Quota (kg) *</label>
                  <input
                    type="number"
                    required
                    value={form.sugar_quantity_kg}
                    onChange={(e) => setForm({ ...form, sugar_quantity_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Issued Quantity (kg)</label>
                  <input
                    type="number"
                    value={form.issued_quantity_kg}
                    onChange={(e) => setForm({ ...form, issued_quantity_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold">Save Allotment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sugar Issue Voucher Print View Modal */}
      {activeVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 printable-area">
            <div className="text-center border-b pb-3">
              <h2 className="font-extrabold text-base text-emerald-800">Chhatrapati Sugar Cooperative Ltd.</h2>
              <p className="text-[10px] text-slate-600 uppercase">SUGAR ALLOTMENT & DISTRIBUTION VOUCHER</p>
            </div>

            <div className="text-xs space-y-2 font-mono">
              <div className="flex justify-between"><span>Voucher ID:</span><strong className="text-emerald-700">{activeVoucher.allotment_id}</strong></div>
              <div className="flex justify-between"><span>Shareholder ID:</span><span>{activeVoucher.shareholder_id}</span></div>
              <div className="flex justify-between"><span>Member Name:</span><strong>{activeVoucher.shareholder_name}</strong></div>
              <div className="flex justify-between"><span>Village:</span><span>{activeVoucher.village_name}</span></div>
              <div className="flex justify-between border-t border-b py-2 text-sm"><span>Sugar Issued Quantity:</span><strong className="text-emerald-700">{activeVoucher.issued_quantity_kg} KG</strong></div>
              <div className="flex justify-between"><span>Grade:</span><span>{activeVoucher.sugar_type || 'M30 Grade White Sugar'}</span></div>
              <div className="flex justify-between"><span>Season Period:</span><span>{activeVoucher.allotment_period}</span></div>
            </div>

            <div className="pt-8 flex justify-between text-[10px] text-slate-600 border-t">
              <div>Store Officer Signature</div>
              <div>Shareholder Signature</div>
            </div>

            <div className="pt-4 flex justify-between items-end border-t no-print">
              <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Print Voucher
              </button>
              <button onClick={() => setActiveVoucher(null)} className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
