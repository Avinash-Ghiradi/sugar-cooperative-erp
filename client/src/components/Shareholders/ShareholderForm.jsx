import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Save, Plus, Printer, Contact, AlertTriangle } from 'lucide-react';

export default function ShareholderForm({ initialData, onClose, onSaveSuccess }) {
  const { showToast, setActiveModule } = useAuth();
  const [villages, setVillages] = useState([]);
  const [circles, setCircles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    shareholder_id: initialData?.shareholder_id || `SH-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    name: initialData?.name || '',
    father_husband_name: initialData?.father_husband_name || '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || 'Male',
    mobile: initialData?.mobile || '',
    address: initialData?.address || '',
    village_id: initialData?.village_id || 'VIL-001',
    circle_id: initialData?.circle_id || 'CIR-001',
    share_number: initialData?.share_number || `SN-${String(Math.floor(Math.random() * 900000) + 100000)}`,
    number_of_shares: initialData?.number_of_shares || 5,
    registration_date: initialData?.registration_date || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'Active',
    aadhaar_ref: initialData?.aadhaar_ref || '',
    remarks: initialData?.remarks || ''
  });

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    const vRes = await ApiService.getVillages();
    if (vRes && vRes.data) setVillages(vRes.data);

    const cRes = await ApiService.getCircles();
    if (cRes && cRes.data) setCircles(cRes.data);
  };

  const handleVillageChange = (vId) => {
    const selectedV = villages.find(v => v.village_id === vId);
    setFormData(prev => ({
      ...prev,
      village_id: vId,
      circle_id: selectedV ? selectedV.circle_id : prev.circle_id
    }));
  };

  const handleSubmit = async (e, saveAndNew = false) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.mobile || !formData.share_number) {
      setErrorMsg('Please fill in all mandatory fields (Name, Mobile, Share Number).');
      return;
    }

    if (initialData) {
      // Edit mode
      showToast(`Updated shareholder ${formData.name}`);
      if (onSaveSuccess) onSaveSuccess();
    } else {
      // Create mode
      const res = await ApiService.addShareholder(formData);
      if (res && res.success) {
        showToast(`Shareholder ${formData.name} added successfully!`);
        if (saveAndNew) {
          setFormData({
            shareholder_id: `SH-${String(Math.floor(Math.random() * 90000) + 10000)}`,
            name: '',
            father_husband_name: '',
            dob: '',
            gender: 'Male',
            mobile: '',
            address: '',
            village_id: villages[0]?.village_id || 'VIL-001',
            circle_id: circles[0]?.circle_id || 'CIR-001',
            share_number: `SN-${String(Math.floor(Math.random() * 900000) + 100000)}`,
            number_of_shares: 5,
            registration_date: new Date().toISOString().split('T')[0],
            status: 'Active',
            aadhaar_ref: '',
            remarks: ''
          });
        } else {
          if (onSaveSuccess) onSaveSuccess();
        }
      } else {
        setErrorMsg(res?.message || 'Failed to save shareholder.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-print">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {initialData ? 'Edit Shareholder Record' : 'Register New Shareholder'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter shareholder personal, share quota and village circle details</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Shareholder ID */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Shareholder ID *</label>
              <input
                type="text"
                disabled={!!initialData}
                value={formData.shareholder_id}
                onChange={(e) => setFormData({ ...formData, shareholder_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            {/* Share Number */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Share Number *</label>
              <input
                type="text"
                required
                value={formData.share_number}
                onChange={(e) => setFormData({ ...formData, share_number: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            {/* Shares Count */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Number of Shares *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.number_of_shares}
                onChange={(e) => setFormData({ ...formData, number_of_shares: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Shareholder Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rajaram Dattatray Patil"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium outline-none focus:border-emerald-500"
              />
            </div>

            {/* Father/Husband Name */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Father's / Husband's Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dattatray Patil"
                value={formData.father_husband_name}
                onChange={(e) => setFormData({ ...formData, father_husband_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Mobile */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="10 digit mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
              />
            </div>

            {/* Village */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Village Master *</label>
              <select
                value={formData.village_id}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              >
                {villages.map(v => (
                  <option key={v.village_id} value={v.village_id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Circle */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Circle Master</label>
              <select
                value={formData.circle_id}
                onChange={(e) => setFormData({ ...formData, circle_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              >
                {circles.map(c => (
                  <option key={c.circle_id} value={c.circle_id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* DOB */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Shareholder Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Full Postal Address *</label>
            <textarea
              rows="2"
              required
              placeholder="House number, street, landmark, post office..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-sky-400" /> Print Application
              </button>

              <button
                type="button"
                onClick={() => { onClose(); setActiveModule('id_cards'); }}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Contact className="w-4 h-4 text-purple-400" /> Generate ID Card
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              {!initialData && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Save & New
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all"
              >
                <Save className="w-4 h-4" /> {initialData ? 'Update Shareholder' : 'Save Shareholder'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
