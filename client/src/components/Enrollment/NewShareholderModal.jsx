import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X, Save, User, MapPin, Coins, Receipt, FileText, CheckCircle2,
  Calendar, Phone, CreditCard, Camera, Upload, Trash2, Building,
  Stamp, PenTool, Hash, Info
} from 'lucide-react';

export default function NewShareholderModal({ isOpen, onClose, onSuccess, editRecord }) {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('member'); // 'member' | 'shares' | 'tharavu' | 'kyc'
  const [loading, setLoading] = useState(false);
  const [villageSuggestions, setVillageSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    full_name: '',
    place: '',
    taluk: 'ಚಡಚಣ',
    dist: 'ವಿಜಯಪುರ',
    no_shares: 1,
    category: 'ಅ ವರ್ಗ',
    share_amount: 24000,
    admission_fee: 570,
    total_amount: 24570,
    receipt_no: '',
    tharava_date: '',
    tharava_no: '',
    share_no: '',
    aadhaar_no: '',
    mobile_no: '',
    photo: '',
    signature: '',
    thumb_impression: '',
    bank_name: '',
    bank_account: '',
    ifsc_code: '',
    approval_status: 'Board Approved (ಠರಾವು ಮಂಜೂರು)',
    remarks: ''
  });

  useEffect(() => {
    if (editRecord) {
      setFormData({
        ...editRecord,
        no_shares: editRecord.no_shares || 1,
        share_amount: editRecord.share_amount || 24000,
        admission_fee: editRecord.admission_fee || 570,
        total_amount: editRecord.total_amount || 24570,
        category: editRecord.category || 'ಅ ವರ್ಗ',
        taluk: editRecord.taluk || 'ಚಡಚಣ',
        dist: editRecord.dist || 'ವಿಜಯಪುರ'
      });
    } else {
      setFormData({
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        full_name: '',
        place: '',
        taluk: 'ಚಡಚಣ',
        dist: 'ವಿಜಯಪುರ',
        no_shares: 1,
        category: 'ಅ ವರ್ಗ',
        share_amount: 24000,
        admission_fee: 570,
        total_amount: 24570,
        receipt_no: '',
        tharava_date: '',
        tharava_no: '',
        share_no: '',
        aadhaar_no: '',
        mobile_no: '',
        photo: '',
        signature: '',
        thumb_impression: '',
        bank_name: '',
        bank_account: '',
        ifsc_code: '',
        approval_status: 'Board Approved (ಠರಾವು ಮಂಜೂರು)',
        remarks: ''
      });
    }
    setActiveTab('member');

    const loadVillages = async () => {
      const vRes = await ApiService.getVillages();
      if (vRes && vRes.data) {
        setVillageSuggestions([...vRes.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
      }
    };
    loadVillages();
  }, [editRecord, isOpen]);

  // Handle Share count change -> Auto-calculate Share Amount & Admission Fee
  const handleShareCountChange = (shares) => {
    const s = parseInt(shares) || 1;
    const shareAmt = s * 24000;
    const fee = s * 570;
    const total = shareAmt + fee;
    setFormData(prev => ({
      ...prev,
      no_shares: s,
      share_amount: shareAmt,
      admission_fee: fee,
      total_amount: total
    }));
  };

  // Place suggestions lookup
  const handlePlaceChange = async (val) => {
    setFormData(prev => ({ ...prev, place: val }));
    if (val.trim().length >= 2) {
      const circleRes = ApiService.resolveCircleForPlace(val);
      if (circleRes && circleRes.circle_name !== 'ಇತರೆ (Other)') {
        setFormData(prev => ({
          ...prev,
          place: val,
          taluk: circleRes.taluk || prev.taluk,
          dist: circleRes.district || prev.dist
        }));
      }
    }
  };

  // Client-side Canvas Image Compression
  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG or PNG)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400; // Optimal for ERP photos & signatures

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
        showToast(`${field.replace('_', ' ')} uploaded successfully!`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name?.trim()) {
      showToast('ದಯವಿಟ್ಟು ಶೇರುದಾರರ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ (Enter Full Name)', 'error');
      setActiveTab('member');
      return;
    }
    if (!formData.place?.trim()) {
      showToast('ದಯವಿಟ್ಟು ಸ್ಥಳ / ಗ್ರಾಮ ನಮೂದಿಸಿ (Enter Place)', 'error');
      setActiveTab('member');
      return;
    }

    setLoading(true);
    try {
      const submissionData = { ...formData };
      const isIssuedOrApproved = (submissionData.approval_status || '').includes('Issued') ||
                                 (submissionData.approval_status || '').includes('ವಿತರಿಸಲಾಗಿದೆ') ||
                                 (submissionData.approval_status || '').includes('Approved') ||
                                 (submissionData.approval_status || '').includes('ಮಂಜೂರು');
      if (isIssuedOrApproved && !submissionData.share_no?.trim()) {
        submissionData.share_no = await ApiService.getNextAvailableShareNumber();
      }

      let res;
      if (editRecord) {
        res = await ApiService.updateEnrollment(editRecord.id || editRecord.enrollment_id, submissionData);
      } else {
        res = await ApiService.addEnrollment(submissionData);
      }

      if (res && res.success) {
        showToast(
          isIssuedOrApproved
            ? `ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ಮತ್ತು ಶಾಸನಬದ್ಧ ವಹಿ (#${submissionData.share_no}) ಸೇರ್ಪಡೆ ಯಶಸ್ವಿಯಾಗಿದೆ! 🟢`
            : (editRecord ? 'ನೋಂದಣಿ ದಾಖಲೆ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!')
        );
        onSuccess();
        onClose();
      } else {
        showToast(res?.message || 'ಕಾರ್ಯಾಚರಣೆ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ ಸಂಭವಿಸಿದೆ: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 font-bold shadow-md shadow-emerald-950">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{editRecord ? 'ಶೇರುದಾರರ ನೋಂದಣಿ ತಿದ್ದುಪಡಿ (Edit Enrollment)' : 'ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ (New Shareholder Enrollment)'}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ಅಧಿಕೃತ 15 ಕಾಲಂ ನಮೂನೆ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ಕಾರ್ಖಾನೆಯ ಠರಾವು, ಶೇರು ಮೊತ್ತ (₹24,000/ಶೇರು) ಮತ್ತು ಪ್ರವೇಶ ಶುಲ್ಕ (₹570/ಶೇರು) ನೋಂದಣಿ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('member')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'member'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> 1. ಸದಸ್ಯರ ವಿವರಗಳು (Member)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shares')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'shares'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" /> 2. ಶೇರು & ಶುಲ್ಕ ವಿವರ (Shares & Fees)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tharavu')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tharavu'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stamp className="w-4 h-4" /> 3. ಮಂಡಳಿ ಠರಾವು (Board Resolution)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kyc')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'kyc'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" /> 4. ಫೋಟೋ & ಸಹಿ (KYC & Photo)
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* TAB 1: Member Personal Details */}
          {activeTab === 'member' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>ಅರ್ಜಿದಾರರ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ (Applicant Personal Information)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">* ಕಡ್ಡಾಯ ಕಾಲಂಗಳು</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date (ಅರ್ಜಿ ದಿನಾಂಕ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="DD-MM-YYYY (ಉದಾ: 23-03-22)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Full Name (ಶೇರುದಾರರ ಪೂರ್ಣ ಹೆಸರು) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="ಉದಾ: ಧೋಳೇಶ ಧನಸಿಂಗ ಚವ್ಹಾಣ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-medium outline-none text-sm"
                    />
                  </div>

                  {/* Place */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Place (ಸ್ಥಳ / ಊರು) *
                    </label>
                    <input
                      type="text"
                      required
                      list="new-sh-places-list"
                      value={formData.place}
                      onChange={(e) => handlePlaceChange(e.target.value)}
                      placeholder="ಉದಾ: ಚಣೆಗಾಂವ / ಗೋಡಿಹಾಳ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                    <datalist id="new-sh-places-list">
                      {villageSuggestions.map(v => (
                        <option key={v.village_id || v.name} value={v.name}>
                          {v.name} {v.taluk ? `(${v.taluk})` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Taluk */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> Taluk (ತಾಲೂಕು)
                    </label>
                    <input
                      type="text"
                      value={formData.taluk}
                      onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                      placeholder="ಉದಾ: ಚಡಚಣ / ಇಂಡಿ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Dist */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Dist (ಜಿಲ್ಲೆ)
                    </label>
                    <input
                      type="text"
                      value={formData.dist}
                      onChange={(e) => setFormData({ ...formData, dist: e.target.value })}
                      placeholder="ಉದಾ: ವಿಜಯಪುರ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Mobile No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile No (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile_no}
                      onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                      placeholder="10-digit Mobile"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Aadhaar No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Aadhar No (ಆಧಾರ್ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      value={formData.aadhaar_no}
                      onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" /> Category (ವರ್ಗ) *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none cursor-pointer font-medium"
                    >
                      <option value="ಅ ವರ್ಗ">ಅ - ವರ್ಗ : ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Class A)</option>
                      <option value="ಬ ವರ್ಗ">ಬ - ವರ್ಗ : ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ (Class B)</option>
                      <option value="ಕ ವರ್ಗ">ಕ - ವರ್ಗ (Class C)</option>
                      <option value="ಡ ವರ್ಗ">ಡ - ವರ್ಗ : ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ (Class D)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Next step hint */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">ಮುಂದಿನ ಹಂತ: ಶೇರು ಮೊತ್ತ ಮತ್ತು ಪ್ರವೇಶ ಶುಲ್ಕ ವಿವರ</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('shares')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-950"
                >
                  ಮುಂದೆ (Next) ➔
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Shares, Fees and Calculation */}
          {activeTab === 'shares' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>ಶೇರು ಮತ್ತು ಪ್ರವೇಶ ಶುಲ್ಕದ ಲೆಕ್ಕಾಚಾರ (Statutory Share Amount & Fees)</span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-emerald-400">
                    <Info className="w-3.5 h-3.5" /> 1 ಶೇರು = ₹24,000 + ₹570 ಪ್ರವೇಶ ಶುಲ್ಕ = ₹24,570
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* No. of Shares */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" /> No. Shares (ಶೇರುಗಳ ಸಂಖ್ಯೆ) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={formData.no_shares}
                      onChange={(e) => handleShareCountChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-bold text-sm outline-none text-center"
                    />
                  </div>

                  {/* Share Amount */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-slate-400" /> Share Amount (ಶೇರು ಮೊತ್ತ ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.share_amount}
                      onChange={(e) => {
                        const amt = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          share_amount: amt,
                          total_amount: amt + (parseFloat(prev.admission_fee) || 0)
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-amber-400 font-bold text-sm outline-none"
                    />
                  </div>

                  {/* Admission Fee */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" /> Admission Fee (ಪ್ರವೇಶ ಶುಲ್ಕ ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.admission_fee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          admission_fee: fee,
                          total_amount: (parseFloat(prev.share_amount) || 0) + fee
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-teal-400 font-bold text-sm outline-none"
                    />
                  </div>

                  {/* Total Amount (Auto-Calculated) */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Amount (ಒಟ್ಟು ಮೊತ್ತ ₹)
                    </label>
                    <div className="w-full bg-emerald-950/40 border border-emerald-600/50 rounded-xl px-3 py-2 text-emerald-300 font-extrabold text-sm flex items-center justify-between">
                      <span>₹ {Number(formData.total_amount).toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-500 font-normal">ಆಟೋ ಲೆಕ್ಕಾಚಾರ</span>
                    </div>
                  </div>

                  {/* Receipt No */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" /> Reciept No (ರಶೀದಿ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      value={formData.receipt_no}
                      onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                      placeholder="ಉದಾ: 390 / 412"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">ಷರಾ (Remarks / Notes)</label>
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="ಉದಾ: ಕಾರ್ಖಾನೆ ಹೊಸ ಶೇರು ಪ್ರವೇಶ ನಮೂನೆ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('member')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all"
                >
                  ◀ ಹಿಂದಕ್ಕೆ (Back)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tharavu')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-950"
                >
                  ಮುಂದೆ: ಮಂಡಳಿ ಠರಾವು (Next) ➔
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Board Resolution (Tharavu) & Share No Assignment */}
          {activeTab === 'tharavu' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-emerald-400" />
                    <span>ಆಡಳಿತ ಮಂಡಳಿ ಠರಾವು ವಿವರಗಳು (Board Resolution & Allotment)</span>
                  </h3>
                  <span className="text-[11px] text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/40">
                    ಮಂಡಳಿ ಮಂಜೂರಾತಿ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Tharava No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Stamp className="w-3.5 h-3.5 text-slate-400" /> Tharava No (ಠರಾವು ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      value={formData.tharava_no}
                      onChange={(e) => setFormData({ ...formData, tharava_no: e.target.value })}
                      placeholder="ಉದಾ: 05(8)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                    />
                  </div>

                  {/* Tharava Date */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tharava Date (ಠರಾವು ದಿನಾಂಕ)
                    </label>
                    <input
                      type="text"
                      value={formData.tharava_date}
                      onChange={(e) => setFormData({ ...formData, tharava_date: e.target.value })}
                      placeholder="DD-MM-YYYY (ಉದಾ: 10-08-22)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Share No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" /> Share No (ಹಂಚಿಕೆಯಾದ ಶೇರು ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      value={formData.share_no}
                      onChange={(e) => setFormData({ ...formData, share_no: e.target.value })}
                      placeholder="ಖಾಲಿ ಬಿಡಬಹುದು (ಅಥವಾ ಸರ್ಟಿಫಿಕೇಟ್ ನಂ)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none"
                    />
                  </div>

                  {/* Approval Status */}
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 font-medium mb-1">ಸ್ಥಿತಿ (Enrollment Workflow Status)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'Application Submitted', label: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Application Submitted)' },
                        { id: 'Board Approved (ಠರಾವು ಮಂಜೂರು)', label: 'ಠರಾವು ಮಂಜೂರಾಗಿದೆ (Board Approved)' },
                        { id: 'Share Issued (ಶೇರು ವಿತರಿಸಲಾಗಿದೆ)', label: 'ಶೇರು ವಿತರಿಸಲಾಗಿದೆ (Share Certificate Issued)' }
                      ].map((st) => {
                        const isSelected = formData.approval_status === st.id ||
                          (st.id.includes('Issued') && (formData.approval_status || '').includes('Issued')) ||
                          (st.id.includes('Approved') && !st.id.includes('Issued') && (formData.approval_status || '').includes('Approved') && !(formData.approval_status || '').includes('Issued'));

                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={async () => {
                              let nextShare = formData.share_no;
                              if (st.id.includes('Issued') && !nextShare) {
                                nextShare = await ApiService.getNextAvailableShareNumber();
                              }
                              setFormData(prev => ({
                                ...prev,
                                approval_status: st.id,
                                share_no: prev.share_no || nextShare
                              }));
                            }}
                            className={`p-2.5 rounded-xl text-left border transition-all text-xs flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span>{st.label}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('shares')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all"
                >
                  ◀ ಹಿಂದಕ್ಕೆ (Back)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('kyc')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-950"
                >
                  ಮುಂದೆ: ಫೋಟೋ & ಸಹಿ (Next) ➔
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Photo, Signature, Thumb Impression & Bank Details */}
          {activeTab === 'kyc' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>ಭಾವಚಿತ್ರ, ಸಹಿ ಮತ್ತು ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು (Photo, Signature & Thumb Impression)</span>
                  </h3>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    ಆಟೋ ಕಂಪ್ರೆಷನ್ ವ್ಯವಸ್ಥೆ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Photo Upload */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-2">
                    <span className="font-semibold text-slate-300">ಶೇರುದಾರರ ಭಾವಚಿತ್ರ (Photo)</span>
                    <div className="w-28 h-32 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                      {formData.photo ? (
                        <>
                          <img src={formData.photo} alt="Shareholder" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo: '' })}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-600">
                          <User className="w-8 h-8" />
                          <span className="text-[10px]">ಭಾವಚಿತ್ರ ಇಲ್ಲ</span>
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> ಫೋಟೋ ಅಪ್ಲೋಡ್
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'photo')}
                      />
                    </label>
                  </div>

                  {/* Signature Upload */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-2">
                    <span className="font-semibold text-slate-300">ಸಹಿ (Signature)</span>
                    <div className="w-28 h-32 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner p-2">
                      {formData.signature ? (
                        <>
                          <img src={formData.signature} alt="Signature" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, signature: '' })}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-600">
                          <PenTool className="w-8 h-8" />
                          <span className="text-[10px]">ಸಹಿ ಇಲ್ಲ</span>
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> ಸಹಿ ಅಪ್ಲೋಡ್
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'signature')}
                      />
                    </label>
                  </div>

                  {/* Thumb Impression Upload */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-2">
                    <span className="font-semibold text-slate-300">ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು (Thumb)</span>
                    <div className="w-28 h-32 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner p-2">
                      {formData.thumb_impression ? (
                        <>
                          <img src={formData.thumb_impression} alt="Thumb Impression" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, thumb_impression: '' })}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-600">
                          <Stamp className="w-8 h-8" />
                          <span className="text-[10px]">ಹೆಬ್ಬೆಟ್ಟು ಇಲ್ಲ</span>
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> ಹೆಬ್ಬೆಟ್ಟು ಅಪ್ಲೋಡ್
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'thumb_impression')}
                      />
                    </label>
                  </div>
                </div>

                {/* Bank Account Info (Optional) */}
                <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">ಬ್ಯಾಂಕ್ ಹೆಸರು (Bank Name)</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="ಉದಾ: DCC Bank / SBI"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">ಖಾತೆ ಸಂಖ್ಯೆ (Bank Account No)</label>
                    <input
                      type="text"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      placeholder="Account Number"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">IFSC ಕೋಡ್ (IFSC Code)</label>
                    <input
                      type="text"
                      value={formData.ifsc_code}
                      onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                      placeholder="IFSC Code"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('tharavu')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all"
                >
                  ◀ ಹಿಂದಕ್ಕೆ (Back)
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-slate-400">
              ಒಟ್ಟು ಮೊತ್ತ: <span className="text-emerald-400 font-extrabold text-sm">₹ {Number(formData.total_amount).toLocaleString()}</span>
              <span className="text-slate-500 text-[10px] ml-1">({formData.no_shares} ಶೇರು)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                ರದ್ದು (Cancel)
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-950 flex items-center gap-2"
              >
                {loading ? (
                  <span>ಉಳಿಸಲಾಗುತ್ತಿದೆ...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editRecord ? 'ನವೀಕರಿಸಿ (Update)' : 'ನೋಂದಾಯಿಸಿ (Save Enrollment)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
