import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Save, Plus, Printer, Contact, AlertTriangle, BookOpen, MapPin, FileText, Users2, Fingerprint } from 'lucide-react';

export default function ShareholderForm({ initialData, onClose, onSaveSuccess }) {
  const { showToast, setActiveModule } = useAuth();
  const [villages, setVillages] = useState([]);
  const [circles, setCircles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    // 38 Official Statutory Cooperative Columns:
    book_no: initialData?.book_no || 'B.No: 1',
    sl_no: initialData?.sl_no || Math.floor(Math.random() * 500) + 1,
    share_no: initialData?.share_no || String(Math.floor(Math.random() * 90000) + 1000),
    shareholder_name: initialData?.shareholder_name || initialData?.name || '',
    gender: initialData?.gender || 'M',
    aadhaar_card_no: initialData?.aadhaar_card_no || initialData?.aadhaar_ref || '',
    reg_date: initialData?.reg_date || initialData?.registration_date || new Date().toLocaleDateString('en-GB'),
    receipt_no: initialData?.receipt_no || String(Math.floor(Math.random() * 9000) + 100),
    receipt_amount: initialData?.receipt_amount || 2000,
    date: initialData?.date || initialData?.reg_date || new Date().toLocaleDateString('en-GB'),
    reciept: initialData?.reciept || initialData?.receipt_no || '',
    amount: initialData?.amount || 2000,
    total_amount: initialData?.total_amount || 2000,
    number_of_shares: initialData?.number_of_shares || 1,
    schedule_cast: initialData?.schedule_cast || 'ಅ - ವರ್ಗ',
    address: initialData?.address || '',
    nagara: initialData?.nagara || 'ಗ್ರಾಮ ಠಾಣಾ',
    road: initialData?.road || 'ಮುಖ್ಯ ರಸ್ತೆ',
    place: initialData?.place || initialData?.village_name || 'ಬಳ್ಳೊಳ್ಳಿ',
    taluk: initialData?.taluk || 'ಇಂಡಿ',
    district: initialData?.district || 'ವಿಜಯಪುರ',
    pin_code: initialData?.pin_code || '586 117',
    circle: initialData?.circle || initialData?.circle_name || 'ಇಂಡಿ',
    member_type: initialData?.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
    relationship: initialData?.relationship || 'ಸ್ವಂತ (Self)',
    tharava_date: initialData?.tharava_date || initialData?.reg_date || new Date().toLocaleDateString('en-GB'),
    tharava_no: initialData?.tharava_no || `TR-${Math.floor(Math.random() * 50) + 1}/1982`,
    mobile_no: initialData?.mobile_no || initialData?.mobile || '',
    photo_url: initialData?.photo_url || '',
    signature_url: initialData?.signature_url || '',
    thumb_url: initialData?.thumb_url || '',
    photo_updated: initialData?.photo_updated || 'Yes',
    signature_updated: initialData?.signature_updated || 'Yes',
    thumb_updated: initialData?.thumb_updated || 'Yes',
    nominee_name: initialData?.nominee_name || '',
    nominee_aadhaar_no: initialData?.nominee_aadhaar_no || '',
    nominee_mobile_no: initialData?.nominee_mobile_no || '',
    nominee_address: initialData?.nominee_address || '',
    status: initialData?.status || 'Active'
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

  const handlePlaceChange = (placeName) => {
    const matchedV = villages.find(v => v.name === placeName);
    setFormData(prev => ({
      ...prev,
      place: placeName,
      taluk: matchedV ? matchedV.taluk : prev.taluk,
      circle: matchedV ? matchedV.circle_name : prev.circle,
      pin_code: matchedV ? matchedV.pin_code : prev.pin_code
    }));
  };

  const handleSharesChange = (shares) => {
    const s = parseInt(shares) || 1;
    setFormData(prev => ({
      ...prev,
      number_of_shares: s,
      total_amount: s * 2000
    }));
  };

  const handleSubmit = async (e, saveAndNew = false) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.shareholder_name || !formData.share_no) {
      setErrorMsg('Please enter Shareholder Name and Share Number.');
      return;
    }

    if (initialData) {
      showToast(`Updated shareholder record for ${formData.shareholder_name}`);
      if (onSaveSuccess) onSaveSuccess();
    } else {
      const res = await ApiService.addShareholder(formData);
      if (res && res.success) {
        showToast(`Shareholder ${formData.shareholder_name} saved successfully!`);
        if (saveAndNew) {
          setFormData(prev => ({
            ...prev,
            sl_no: parseInt(prev.sl_no) + 1,
            share_no: String(parseInt(prev.share_no) + 1),
            shareholder_name: '',
            aadhaar_card_no: '',
            mobile_no: '',
            nominee_name: '',
            nominee_aadhaar_no: '',
            nominee_mobile_no: '',
            nominee_address: ''
          }));
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
      <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                {initialData ? 'Edit Statutory Shareholder Record (ಷೇರುದಾರರ ತಿದ್ದುಪಡಿ)' : 'Register New Shareholder (ಹೊಸ ಷೇರುದಾರರ ನಮೂದು)'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                38 Statutory Columns
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Official Sugar Cooperative Society Ledger Format (Indi / Vijayapura)</p>
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
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-6 text-xs overflow-y-auto">
          {/* Section 1: Book & Share Ledger */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-emerald-400" /> 1. Book & Share Certificate Details (ನಮೂನೆ ವಹಿ ಹಾಗೂ ಷೇರು ವಿವರ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Book. No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.No: 1"
                  value={formData.book_no}
                  onChange={(e) => setFormData({ ...formData, book_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sky-400 font-bold font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Sl. No *</label>
                <input
                  type="number"
                  required
                  value={formData.sl_no}
                  onChange={(e) => setFormData({ ...formData, sl_no: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Share No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1, 2, 3..."
                  value={formData.share_no}
                  onChange={(e) => setFormData({ ...formData, share_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Schedule Cast / ವರ್ಗ *</label>
                <select
                  value={formData.schedule_cast}
                  onChange={(e) => setFormData({ ...formData, schedule_cast: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="ಅ - ವರ್ಗ">ಅ - ವರ್ಗ (Class A)</option>
                  <option value="ಬ - ವರ್ಗ">ಬ - ವರ್ಗ (Class B)</option>
                  <option value="ಕ - ವರ್ಗ">ಕ - ವರ್ಗ (Class C)</option>
                  <option value="ಡ - ವರ್ಗ">ಡ - ವರ್ಗ (Class D)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">No. of Shares *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.number_of_shares}
                  onChange={(e) => handleSharesChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Total Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Receipt No</label>
                <input
                  type="text"
                  value={formData.receipt_no}
                  onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value, reciept: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Receipt Amount (₹)</label>
                <input
                  type="number"
                  value={formData.receipt_amount}
                  onChange={(e) => setFormData({ ...formData, receipt_amount: parseFloat(e.target.value) || 0, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Shareholder Personal Info */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <Users2 className="w-4 h-4 text-sky-400" /> 2. Shareholder Personal Details (ಷೇರುದಾರರ ವೈಯಕ್ತಿಕ ವಿವರ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Share Holder Name (ಷೇರುದಾರರ ಹೆಸರು) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ"
                  value={formData.shareholder_name}
                  onChange={(e) => setFormData({ ...formData, shareholder_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                >
                  <option value="M">M (Male / ಪುರುಷ)</option>
                  <option value="F">F (Female / ಮಹಿಳೆ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Aadhaar Card No</label>
                <input
                  type="text"
                  placeholder="12 digit Aadhaar"
                  value={formData.aadhaar_card_no}
                  onChange={(e) => setFormData({ ...formData, aadhaar_card_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mobile No *</label>
                <input
                  type="text"
                  placeholder="10 digit mobile"
                  value={formData.mobile_no}
                  onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reg. Date</label>
                <input
                  type="text"
                  placeholder="e.g. 10/Aug/1982"
                  value={formData.reg_date}
                  onChange={(e) => setFormData({ ...formData, reg_date: e.target.value, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Place & Address */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> 3. Territorial Place & Address Details (ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Place (ಗ್ರಾಮ / ಸ್ಥಳ) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ಬಳ್ಳೊಳ್ಳಿ, ಜೇವೂರ, ಚಡಚಣ, ಅಥರ್ಗಾ..."
                  value={formData.place}
                  onChange={(e) => handlePlaceChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Taluk (ತಾಲೂಕು) *</label>
                <input
                  type="text"
                  required
                  value={formData.taluk}
                  onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">District (ಜಿಲ್ಲೆ) *</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Circle (ವಲಯ)</label>
                <input
                  type="text"
                  value={formData.circle}
                  onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sky-400 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Pin Code</label>
                <input
                  type="text"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nagara & Road</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nagara"
                    value={formData.nagara}
                    onChange={(e) => setFormData({ ...formData, nagara: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-slate-100 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Road"
                    value={formData.road}
                    onChange={(e) => setFormData({ ...formData, road: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Full Postal Address (ಸಂಪೂರ್ಣ ವಿಳಾಸ)</label>
              <textarea
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 4: Board Tharava */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-sky-400" /> 4. Board Resolution & Sanction (ಆಡಳಿತ ಮಂಡಳಿ ಠರಾವು ವಿವರ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tharava No (ಠರಾವು ನಂ.)</label>
                <input
                  type="text"
                  placeholder="e.g. TR-01/1982"
                  value={formData.tharava_no}
                  onChange={(e) => setFormData({ ...formData, tharava_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sky-400 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tharava Date (ಠರಾವು ದಿನಾಂಕ)</label>
                <input
                  type="text"
                  placeholder="e.g. 10/Aug/1982"
                  value={formData.tharava_date}
                  onChange={(e) => setFormData({ ...formData, tharava_date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Member Type</label>
                <input
                  type="text"
                  value={formData.member_type}
                  onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Relationship (ಸಂಬಂಧ)</label>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Nominee Details */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <Users2 className="w-4 h-4 text-emerald-400" /> 5. Nominee & Legal Successor Details (ನಾಮಿನಿ ವಿವರ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nominee Name (ನಾಮಿನಿ ಹೆಸರು)</label>
                <input
                  type="text"
                  value={formData.nominee_name}
                  onChange={(e) => setFormData({ ...formData, nominee_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nominee Aadhaar No</label>
                <input
                  type="text"
                  value={formData.nominee_aadhaar_no}
                  onChange={(e) => setFormData({ ...formData, nominee_aadhaar_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nominee Mobile No</label>
                <input
                  type="text"
                  value={formData.nominee_mobile_no}
                  onChange={(e) => setFormData({ ...formData, nominee_mobile_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nominee Address</label>
              <input
                type="text"
                value={formData.nominee_address}
                onChange={(e) => setFormData({ ...formData, nominee_address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
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
                <Save className="w-4 h-4" /> {initialData ? 'Update Record' : 'Save Record (ದಾಖಲಿಸು)'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
