import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X, Save, User, MapPin, Coins, Receipt, FileText, CheckCircle2,
  Calendar, Phone, CreditCard, Camera, Upload, Trash2, Building,
  Stamp, PenTool, Hash, Info, ShieldCheck, ArrowRight, ArrowLeft
} from 'lucide-react';

export default function NewShareholderModal({ isOpen, onClose, onSuccess, editRecord, mode = 'register' }) {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'approve' ? 'tharavu' : 'member');
  const [loading, setLoading] = useState(false);
  const [villageSuggestions, setVillageSuggestions] = useState([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const placeDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (placeDropdownRef.current && !placeDropdownRef.current.contains(e.target)) {
        setShowPlaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    approval_status: mode === 'approve' ? 'Share Issued (ಶೇರು ವಿತರಿಸಲಾಗಿದೆ)' : 'Application Submitted (ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ)',
    remarks: ''
  });

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'approve' && editRecord) {
      // APPROVAL MODE: Steps 3 & 4
      setActiveTab('tharavu');
      setFormData({
        ...editRecord,
        no_shares: editRecord.no_shares || 1,
        share_amount: editRecord.share_amount || 24000,
        admission_fee: editRecord.admission_fee || 570,
        total_amount: editRecord.total_amount || 24570,
        category: editRecord.category || 'ಅ ವರ್ಗ',
        taluk: editRecord.taluk || 'ಚಡಚಣ',
        dist: editRecord.dist || 'ವಿಜಯಪುರ',
        tharava_no: editRecord.tharava_no || '05(8)',
        tharava_date: editRecord.tharava_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        approval_status: 'Share Issued (ಶೇರು ವಿತರಿಸಲಾಗಿದೆ)'
      });

      // Auto-suggest next available share certificate number if not already assigned
      if (!editRecord.share_no) {
        ApiService.getNextAvailableShareNumber().then(nextNo => {
          setFormData(prev => ({
            ...prev,
            share_no: prev.share_no || nextNo
          }));
        });
      }
    } else if (editRecord) {
      // EDIT MODE
      setActiveTab(mode === 'register' ? 'member' : 'member');
      setFormData({
        ...editRecord,
        no_shares: editRecord.no_shares || 1,
        share_amount: editRecord.share_amount || 24000,
        admission_fee: editRecord.admission_fee || 570,
        total_amount: editRecord.total_amount || 24570,
        category: editRecord.category || 'ಅ ವರ್ಗ',
        taluk: editRecord.taluk || 'ಚಡಚಣ',
        dist: editRecord.dist || 'ವಿಜಯಪುರ',
        approval_status: editRecord.approval_status || 'Application Submitted (ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ)'
      });
    } else {
      // NEW REGISTRATION MODE: Steps 1 & 2 ONLY
      setActiveTab('member');
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
        approval_status: 'Application Submitted (ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ)',
        remarks: ''
      });
    }

    const loadVillages = async () => {
      const vRes = await ApiService.getVillages();
      if (vRes && vRes.data) {
        setVillageSuggestions([...vRes.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
      }
    };
    loadVillages();
  }, [editRecord, isOpen, mode]);

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

  const filteredVillages = useMemo(() => {
    const q = (formData?.place || '').trim().toLowerCase();
    if (!q) return villageSuggestions.slice(0, 20);
    return villageSuggestions.filter(v => {
      const name = (v.name || '').toLowerCase();
      const taluk = (v.taluk || '').toLowerCase();
      return name.includes(q) || taluk.includes(q);
    });
  }, [formData?.place, villageSuggestions]);

  const handleSelectVillage = (v) => {
    const placeName = typeof v === 'string' ? v : v.name;
    const circleRes = ApiService.resolveCircleForPlace(placeName);
    setFormData(prev => ({
      ...prev,
      place: placeName,
      taluk: v.taluk || circleRes?.taluk || prev.taluk,
      dist: v.district || circleRes?.district || prev.dist
    }));
    setShowPlaceDropdown(false);
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. APPROVAL MODE SUBMIT (Phase 2: Steps 3 & 4)
    if (mode === 'approve') {
      if (!formData.share_no?.trim()) {
        showToast('ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಶೇರು ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (Enter Share No)', 'error');
        setActiveTab('tharavu');
        return;
      }
      if (!formData.tharava_no?.trim()) {
        showToast('ದಯವಿಟ್ಟು ಮಂಡಳಿ ಠರಾವು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (Enter Tharava No)', 'error');
        setActiveTab('tharavu');
        return;
      }

      setLoading(true);
      try {
        const res = await ApiService.approveEnrollmentByAdmin({
          enrollmentId: editRecord?.enrollment_id || editRecord?.id,
          shareNo: formData.share_no.trim(),
          adminUser: user?.name || 'Admin',
          tharavaNo: formData.tharava_no || '05(8)',
          tharavaDate: formData.tharava_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          remarks: formData.remarks || '',
          photo: formData.photo || '',
          signature: formData.signature || '',
          thumb_impression: formData.thumb_impression || '',
          bank_name: formData.bank_name || '',
          bank_account: formData.bank_account || '',
          ifsc_code: formData.ifsc_code || ''
        });

        if (res && res.success) {
          showToast(`ಶೇರು ನಂ. #${res.share_no} ಯಶಸ್ವಿಯಾಗಿ ಕಾರ್ಖಾನೆಯ ಮಾಸ್ಟರ್ ಶೇರುದಾರರ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ!`);
          onSuccess();
          onClose();
        } else {
          showToast(res?.message || 'ಅನುಮೋದನೆ ವಿಫಲವಾಗಿದೆ', 'error');
        }
      } catch (err) {
        showToast('ದೋಷ ಸಂಭವಿಸಿದೆ: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. REGISTRATION MODE SUBMIT (Phase 1: Steps 1 & 2 ONLY)
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

      if (mode === 'register') {
        // Enforce Phase 1 constraints: Pending Application ONLY!
        submissionData.approval_status = 'Application Submitted (ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ)';
        submissionData.share_no = '';
        submissionData.tharava_no = '';
        submissionData.tharava_date = '';
      }

      let res;
      if (editRecord) {
        res = await ApiService.updateEnrollment(editRecord.id || editRecord.enrollment_id, submissionData);
      } else {
        res = await ApiService.addEnrollment(submissionData);
      }

      if (res && res.success) {
        showToast(
          editRecord
            ? 'ನೋಂದಣಿ ದಾಖಲೆ ನವೀಕರಿಸಲಾಗಿದೆ!'
            : 'ಅರ್ಜಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲಾಗಿದೆ! (ಮಂಡಳಿ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇದೆ)'
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
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md ${
              mode === 'approve'
                ? 'bg-amber-950 border border-amber-600/60 text-amber-400 shadow-amber-950'
                : 'bg-emerald-950 border border-emerald-700/60 text-emerald-400 shadow-emerald-950'
            }`}>
              {mode === 'approve' ? <ShieldCheck className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {mode === 'approve' ? (
                  <>
                    <span>ಆಡಳಿತ ಮಂಡಳಿ ಅನುಮೋದನೆ & ಶೇರು ವಿತರಣೆ (Board Approval & Allotment)</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                      ಹಂತ 3 & 4 (Approval Phase)
                    </span>
                  </>
                ) : editRecord && mode === 'all' ? (
                  <>
                    <span>ಶೇರುದಾರರ ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Shareholder Record)</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ಅಧಿಕೃತ 15 ಕಾಲಂ ನಮೂನೆ
                    </span>
                  </>
                ) : (
                  <>
                    <span>ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ನೋಂದಣಿ (New Shareholder Registration)</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ಹಂತ 1 & 2 (ಅರ್ಜಿ ಹಂತ)
                    </span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'approve'
                  ? 'ಮಂಡಳಿ ಠರಾವು, ಅಧಿಕೃತ ಶೇರು ಸಂಖ್ಯೆ ನಿಯೋಜನೆ ಮತ್ತು ಫೋಟೋ/ಸಹಿ/ಬ್ಯಾಂಕ್ ವಿವರಗಳ ನಮೂದು'
                  : 'ಕಾರ್ಖಾನೆಯ ಶೇರು ಮೊತ್ತ (₹24,000/ಶೇರು) ಮತ್ತು ಪ್ರವೇಶ ಶುಲ್ಕ (₹570/ಶೇರು) ಅರ್ಜಿ ನೋಂದಣಿ'}
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

        {/* In Approval Mode: Applicant Summary Card */}
        {mode === 'approve' && (
          <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">ಅರ್ಜಿದಾರರ ಹೆಸರು</span>
                <span className="font-bold text-slate-200 truncate block">{formData.full_name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ಸ್ಥಳ / ಗ್ರಾಮ</span>
                <span className="font-semibold text-slate-300 truncate block">{formData.place}, {formData.taluk}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ಶೇರುಗಳ ಸಂಖ್ಯೆ</span>
                <span className="font-bold text-emerald-400 block">{formData.no_shares} ಶೇರು ({formData.category})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ಒಟ್ಟು ಪಾವತಿ</span>
                <span className="font-extrabold text-teal-400 block">₹{Number(formData.total_amount).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ರಶೀದಿ ನಂ / ದಿನಾಂಕ</span>
                <span className="font-mono text-slate-300 block">{formData.receipt_no ? `#${formData.receipt_no}` : '—'} ({formData.date})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ಅರ್ಜಿ ID</span>
                <span className="font-mono text-sky-400 font-semibold block">{editRecord?.enrollment_id || editRecord?.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Bar: Controlled by Mode */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2 text-xs overflow-x-auto">
          {/* STEP 1: Member (Shown in Register & All modes) */}
          {(mode === 'register' || mode === 'all') && (
            <button
              type="button"
              onClick={() => setActiveTab('member')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'member'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" /> 1. ಸದಸ್ಯರ ವಿವರಗಳು (Member)
            </button>
          )}

          {/* STEP 2: Shares & Fees (Shown in Register & All modes) */}
          {(mode === 'register' || mode === 'all') && (
            <button
              type="button"
              onClick={() => setActiveTab('shares')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'shares'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-4 h-4" /> 2. ಶೇರು & ಶುಲ್ಕ ವಿವರ (Shares & Fees)
            </button>
          )}

          {/* STEP 3: Board Resolution (Shown in Approve & All modes) */}
          {(mode === 'approve' || mode === 'all') && (
            <button
              type="button"
              onClick={() => setActiveTab('tharavu')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'tharavu'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stamp className="w-4 h-4" /> 3. ಮಂಡಳಿ ಠರಾವು & ಶೇರು ಸಂಖ್ಯೆ (Board Resolution)
            </button>
          )}

          {/* STEP 4: KYC & Photos (Shown in Approve & All modes) */}
          {(mode === 'approve' || mode === 'all') && (
            <button
              type="button"
              onClick={() => setActiveTab('kyc')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'kyc'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" /> 4. ಫೋಟೋ, ಸಹಿ & ಬ್ಯಾಂಕ್ (KYC & Photos)
            </button>
          )}
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
                      placeholder="ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಪೂರ್ಣ ಹೆಸರು"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-semibold outline-none"
                    />
                  </div>

                  {/* Place / Village (with Rich Interactive Suggestions while typing) */}
                  <div className="relative" ref={placeDropdownRef}>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Place (ಸ್ಥಳ / ಗ್ರಾಮ) *
                      </span>
                      {formData.place && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {ApiService.resolveCircleForPlace(formData.place)?.circle_name || ''}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      list="village-list"
                      autoComplete="off"
                      value={formData.place}
                      onFocus={() => setShowPlaceDropdown(true)}
                      onChange={(e) => {
                        handlePlaceChange(e.target.value);
                        setShowPlaceDropdown(true);
                      }}
                      placeholder="ಗ್ರಾಮದ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none transition-all placeholder:text-slate-500"
                    />

                    {/* Datalist fallback */}
                    <datalist id="village-list">
                      {villageSuggestions.map((v, i) => (
                        <option key={i} value={v.name} />
                      ))}
                    </datalist>

                    {/* Rich Dropdown Suggestions while typing */}
                    {showPlaceDropdown && filteredVillages.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-slate-800/60 animate-fadeIn">
                        <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold bg-slate-950/80 sticky top-0 flex items-center justify-between">
                          <span>ಸೂಚಿಸಿದ ಗ್ರಾಮಗಳು ({filteredVillages.length})</span>
                          <span className="text-[9px] text-slate-500">ಕ್ಲಿಕ್ ಮಾಡಿ ಆಯ್ಕೆಮಾಡಿ</span>
                        </div>
                        {filteredVillages.slice(0, 30).map((v, i) => {
                          const vName = v.name || v;
                          const taluk = v.taluk || '';
                          const circleRes = ApiService.resolveCircleForPlace(vName);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectVillage(v)}
                              className="w-full text-left px-3 py-2 hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors flex items-center justify-between group cursor-pointer text-xs"
                            >
                              <div>
                                <span className="font-semibold text-slate-200 group-hover:text-emerald-300">
                                  {vName}
                                </span>
                                {taluk && (
                                  <span className="text-[10px] text-slate-400 ml-1.5">
                                    (ತಾ: {taluk})
                                  </span>
                                )}
                              </div>
                              {circleRes?.circle_name && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 group-hover:bg-emerald-900/50 text-slate-300 group-hover:text-emerald-200 font-mono">
                                  {circleRes.circle_name}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Taluk */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> Taluk (ತಾಲ್ಲೂಕು)
                    </label>
                    <input
                      type="text"
                      value={formData.taluk}
                      onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                      placeholder="ಚಡಚಣ / ಇಂಡಿ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* District */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> Dist (ಜಿಲ್ಲೆ)
                    </label>
                    <input
                      type="text"
                      value={formData.dist}
                      onChange={(e) => setFormData({ ...formData, dist: e.target.value })}
                      placeholder="ವಿಜಯಪುರ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Aadhaar No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Aadhaar No (ಆಧಾರ್ ಕಾರ್ಡ್ ನಂ)
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={formData.aadhaar_no}
                      onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                      placeholder="12 ಅಂಕಿಗಳ ಆಧಾರ್ ಸಂಖ್ಯೆ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                    />
                  </div>

                  {/* Mobile No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile No (ಮೊಬೈಲ್ ನಂ)
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.mobile_no}
                      onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                      placeholder="10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('shares')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-2 cursor-pointer"
                >
                  <span>ಮುಂದೆ: ಶೇರು & ಶುಲ್ಕ ವಿವರ (Next: Shares & Fees)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Shares & Fees */}
          {activeTab === 'shares' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>ಶೇರು ಮತ್ತು ಪ್ರವೇಶ ಶುಲ್ಕ ವಿವರಗಳು (Shares & Statutory Fees)</span>
                  </h3>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    ₹24,000 / ಶೇರು • ಶುಲ್ಕ ₹570 / ಶೇರು
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* No of Shares */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" /> No. Shares (ಶೇರುಗಳ ಸಂಖ್ಯೆ) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={formData.no_shares}
                      onChange={(e) => handleShareCountChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-bold outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Category (ವರ್ಗ) *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none cursor-pointer"
                    >
                      <option value="ಅ ವರ್ಗ">ಅ ವರ್ಗ (A - Class)</option>
                      <option value="ಬ ವರ್ಗ">ಬ ವರ್ಗ (B - Class)</option>
                      <option value="ಕ ವರ್ಗ">ಕ ವರ್ಗ (C - Class)</option>
                      <option value="ಡ ವರ್ಗ">ಡ ವರ್ಗ (D - Class)</option>
                    </select>
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
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm outline-none"
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
                  <div>
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
                  <div className="sm:col-span-3">
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>◀ ಹಿಂದಕ್ಕೆ: ಸದಸ್ಯರ ವಿವರಗಳು</span>
                </button>

                {mode === 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('tharavu')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ಮುಂದೆ: ಮಂಡಳಿ ಠರಾವು ➔</span>
                  </button>
                )}
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
                  <span className="text-[11px] text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/40 font-semibold">
                    ಮಂಡಳಿ ಮಂಜೂರಾತಿ ಹಂತ (Approval Phase)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Tharava No */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Stamp className="w-3.5 h-3.5 text-slate-400" /> Tharava No (ಠರಾವು ಸಂಖ್ಯೆ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tharava_no}
                      onChange={(e) => setFormData({ ...formData, tharava_no: e.target.value })}
                      placeholder="ಉದಾ: 05(8)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold outline-none"
                    />
                  </div>

                  {/* Tharava Date */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tharava Date (ಠರಾವು ದಿನಾಂಕ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tharava_date}
                      onChange={(e) => setFormData({ ...formData, tharava_date: e.target.value })}
                      placeholder="DD-MM-YYYY (ಉದಾ: 22-10-2026)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  {/* Share No - Prominently highlighted */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" /> Allotted Share No (ಹಂಚಿಕೆಯಾದ ಶೇರು ಸಂಖ್ಯೆ) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.share_no}
                        onChange={(e) => setFormData({ ...formData, share_no: e.target.value })}
                        placeholder="ಉದಾ: 18011"
                        className="w-full bg-emerald-950/60 border-2 border-emerald-500 rounded-xl px-3 py-2 text-emerald-300 font-mono font-extrabold text-base outline-none shadow-sm"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-emerald-400 font-semibold bg-emerald-900/60 px-1.5 py-0.5 rounded">
                        ಅಧಿಕೃತ ಶೇರು
                      </span>
                    </div>
                  </div>

                  {/* Approval Status Selector */}
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 font-medium mb-1">ಸ್ಥಿತಿ (Enrollment Workflow Status)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'Share Issued (ಶೇರು ವಿತರಿಸಲಾಗಿದೆ)', label: 'ಶೇರು ಪ್ರಮಾಣಪತ್ರ ವಿತರಿಸಲಾಗಿದೆ (Share Certificate Issued)' },
                        { id: 'Board Approved (ಠರಾವು ಮಂಜೂರು)', label: 'ಠರಾವು ಮಂಜೂರಾಗಿದೆ (Board Approved)' }
                      ].map((st) => {
                        const isSelected = formData.approval_status === st.id ||
                          (st.id.includes('Issued') && (formData.approval_status || '').includes('Issued'));

                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, approval_status: st.id }))}
                            className={`p-3 rounded-xl text-left border transition-all text-xs flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold shadow-sm'
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

                  {/* Remarks */}
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 font-medium mb-1">ಮಂಡಳಿ ಠರಾವು ಷರಾ (Resolution Remarks)</label>
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="ಉದಾ: ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯಲ್ಲಿ ಅಧಿಕೃತ ಅನುಮೋದನೆ ನೀಡಲಾಗಿದೆ"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-2">
                {mode === 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('shares')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>◀ ಹಿಂದಕ್ಕೆ: ಶೇರು & ಶುಲ್ಕ ವಿವರ</span>
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('kyc')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-2 cursor-pointer"
                  >
                    <span>ಮುಂದೆ: ಫೋಟೋ, ಸಹಿ & ಬ್ಯಾಂಕ್ (Next)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
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
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors cursor-pointer"
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
                    <div className="w-36 h-20 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                      {formData.signature ? (
                        <>
                          <img src={formData.signature} alt="Signature" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, signature: '' })}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors cursor-pointer"
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
                    <div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                      {formData.thumb_impression ? (
                        <>
                          <img src={formData.thumb_impression} alt="Thumb" className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, thumb_impression: '' })}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-colors cursor-pointer"
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

                {/* Bank Account Info */}
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

              {/* Navigation button */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('tharavu')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>◀ ಹಿಂದಕ್ಕೆ: ಮಂಡಳಿ ಠರಾವು</span>
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
              >
                ರದ್ದು (Cancel)
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                  mode === 'approve'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                }`}
              >
                {loading ? (
                  <span>ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...</span>
                ) : mode === 'approve' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ಅನುಮೋದಿಸಿ & ಶೇರು ವಿತರಿಸಿ (Approve & Issue Certificate)</span>
                  </>
                ) : editRecord && mode === 'all' ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ದಾಖಲೆ ನವೀಕರಿಸಿ (Update Record)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ಅರ್ಜಿ ನೋಂದಾಯಿಸಿ (Save Enrollment Application)</span>
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
