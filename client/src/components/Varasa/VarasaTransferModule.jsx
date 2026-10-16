import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FileSpreadsheet, Search, Plus, CheckCircle2, Clock, X, Save } from 'lucide-react';

export default function VarasaTransferModule() {
  const { showToast, user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    existing_shareholder_id: 'SH-00120',
    existing_share_number: 'SN-100120',
    existing_shares: 5,
    heir_name: 'Suresh Rajaram Patil',
    heir_relationship: 'Son',
    heir_mobile: '9821445566',
    heir_address: 'House No. 45, Shirol Gaon',
    heir_village_id: 'VIL-001',
    heir_circle_id: 'CIR-001',
    application_date: new Date().toISOString().split('T')[0],
    remarks: 'Legal heir transfer application submitted with Gram Panchayat death certificate and heir affidavit.'
  });

  useEffect(() => {
    loadTransfers();
  }, [search]);

  const loadTransfers = async () => {
    setLoading(true);
    const res = await ApiService.getVarasaTransfers();
    if (res && res.data) {
      setTransfers(res.data);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (transferId, newStatus) => {
    const res = await ApiService.updateVarasaStatus(transferId, newStatus);
    if (res && res.success) {
      showToast(`Varasa transfer ${transferId} updated to ${newStatus}`);
      loadTransfers();
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const res = await ApiService.addVarasaTransfer(form);
    if (res && res.success) {
      showToast(`Varasa Transfer Application ${res.transfer_id} registered!`);
      setShowAddModal(false);
      loadTransfers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Varasa Legal-Heir Share Transfer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage share transfer applications to authorized legal successors with audit trail preservation</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" /> New Varasa Application
          </button>
        </div>
      </div>

      {/* Transfers Grid */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading Varasa transfer applications...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Transfer ID</th>
                  <th className="py-3.5 px-4">Existing Member</th>
                  <th className="py-3.5 px-4">Share No</th>
                  <th className="py-3.5 px-4">Legal Heir Name</th>
                  <th className="py-3.5 px-4">Relationship</th>
                  <th className="py-3.5 px-4">App Date</th>
                  <th className="py-3.5 px-4 text-center">Status Workflow</th>
                  <th className="py-3.5 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {transfers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{v.transfer_id}</td>
                    <td className="py-3 px-4 font-medium">{v.existing_shareholder_name || v.existing_shareholder_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{v.existing_share_number} ({v.existing_shares} shares)</td>
                    <td className="py-3 px-4 font-bold text-slate-100">{v.heir_name}</td>
                    <td className="py-3 px-4 text-slate-400">{v.heir_relationship}</td>
                    <td className="py-3 px-4 text-slate-400">{v.application_date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                        v.approval_status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        v.approval_status === 'Approved' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {v.approval_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.approval_status !== 'Completed' && user?.role === 'Admin' && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleStatusUpdate(v.transfer_id, 'Approved')}
                            className="px-2 py-1 bg-sky-900 hover:bg-sky-800 text-white rounded text-[10px] font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(v.transfer_id, 'Completed')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                          >
                            Complete & Transfer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">New Varasa Share Transfer Application</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Existing Shareholder ID *</label>
                  <input
                    type="text"
                    required
                    value={form.existing_shareholder_id}
                    onChange={(e) => setForm({ ...form, existing_shareholder_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Share Number *</label>
                  <input
                    type="text"
                    required
                    value={form.existing_share_number}
                    onChange={(e) => setForm({ ...form, existing_share_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Legal Heir Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.heir_name}
                    onChange={(e) => setForm({ ...form, heir_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Relationship to Member *</label>
                  <select
                    value={form.heir_relationship}
                    onChange={(e) => setForm({ ...form, heir_relationship: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Wife">Wife</option>
                    <option value="Brother">Brother</option>
                    <option value="Legal Nominee">Legal Nominee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Heir Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={form.heir_mobile}
                  onChange={(e) => setForm({ ...form, heir_mobile: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Remarks & Document Verification Notes</label>
                <textarea
                  rows="2"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
