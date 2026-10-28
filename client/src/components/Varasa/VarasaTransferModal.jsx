import React, { useState, useEffect, useRef } from 'react';
import { ApiService, isShareholderInactive } from '../../services/api';
import {
  X, Save, User, MapPin, Phone, CreditCard, Calendar, Upload,
  Search, CheckCircle2, AlertCircle, FileText, Camera, Trash2,
  Building2, Hash, Layers, ShieldCheck, DollarSign, Receipt, Printer
} from 'lucide-react';
import VarasaPrintModal from './VarasaPrintModal';

// Client-side image compression for fast storage and offline persistence
function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function VarasaTransferModal({
  isOpen,
  onClose,
  initialData = null,
  onSaveSuccess,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('heir'); // 'heir', 'shareholder', 'fees', 'verification'
  const [villages, setVillages] = useState([]);
  const [searchShareholderQuery, setSearchShareholderQuery] = useState('');
  const [shareholderSearchResults, setShareholderSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [printRecord, setPrintRecord] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef(null);
  const shFileInputRef = useRef(null);
  const [uploadingShPhoto, setUploadingShPhoto] = useState(false);

  // 22 Official Statutory Cooperative Varasa Ledger Fields
  const [form, setForm] = useState({
    // Sl. No
    sl_no: initialData?.sl_no || '',
    transfer_id: initialData?.transfer_id || '',
    family_count: initialData?.family_count || 4,

    // 1. Varasa Member (ವಾರಸುದಾರರ ವಿವರಗಳು)
    varasa_member: initialData?.varasa_member || initialData?.heir_name || '',
    heir_place: initialData?.heir_place || '',
    heir_taluk: initialData?.heir_taluk || 'ಇಂಡಿ',
    heir_district: initialData?.heir_district || 'ವಿಜಯಪುರ',
    heir_relationship: initialData?.heir_relationship || 'ಮಗ',
    heir_age: initialData?.heir_age || '',
    heir_mobile: initialData?.heir_mobile || '',
    heir_aadhaar: initialData?.heir_aadhaar || '',
    heir_photo: initialData?.heir_photo || '',

    // 2. Share Holder (ಮೂಲ ಶೇರುದಾರರ ವಿವರಗಳು)
    shareholder_name: initialData?.shareholder_name || initialData?.existing_shareholder_name || '',
    shareholder_place: initialData?.shareholder_place || '',
    shareholder_taluk: initialData?.shareholder_taluk || 'ಇಂಡಿ',
    shareholder_district: initialData?.shareholder_district || 'ವಿಜಯಪುರ',
    shareholder_relationship: initialData?.shareholder_relationship || 'ತಂದೆ',
    shareholder_aadhaar: initialData?.shareholder_aadhaar || '',
    shareholder_photo: initialData?.shareholder_photo || '',
    dod: initialData?.dod || '', // B. D.o.D (Date of Death)
    existing_shareholder_id: initialData?.existing_shareholder_id || '',

    // Share & Fee Details (ಶೇರು ಮತ್ತು ಶುಲ್ಕ ರಶೀದಿ ವಿವರಗಳು)
    share_no: initialData?.share_no || initialData?.existing_share_number || '',
    category: initialData?.category || 'ಅ - ವರ್ಗ', // 6. Category
    no_of_shares: initialData?.no_of_shares || initialData?.existing_shares || 1, // 7. No. of Shares
    fees: initialData?.fees !== undefined ? initialData?.fees : 570, // 9. Fees
    receipt_no: initialData?.receipt_no || '', // 10. Receipt No
    receipt_date: initialData?.receipt_date || new Date().toLocaleDateString('en-GB'), // 11. Rp. Date

    // Workflow & Verification
    approval_status: initialData?.approval_status || 'Application Received',
    documents_verified: initialData?.documents_verified || 'Pending',
    death_cert_attached: initialData?.death_cert_attached !== undefined ? initialData.death_cert_attached : true,
    affidavit_attached: initialData?.affidavit_attached !== undefined ? initialData.affidavit_attached : true,
    panchayat_noc_attached: initialData?.panchayat_noc_attached !== undefined ? initialData.panchayat_noc_attached : false,
    remarks: initialData?.remarks || 'ಮರಣ ಪ್ರಮಾಣ ಪತ್ರ ಹಾಗೂ ವಾರಸುದಾರರ ಪ್ರಮಾಣ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ.'
  });

  useEffect(() => {
    loadVillages();
  }, []);

  const loadVillages = async () => {
    try {
      const res = await ApiService.getVillages();
      if (res && res.data) setVillages([...res.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
    } catch (e) {}
  };

  // Auto-search 17,076 Shareholders
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchShareholderQuery && searchShareholderQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await ApiService.searchShareholderForVarasa(searchShareholderQuery);
        setShareholderSearchResults(results);
        setIsSearching(false);
      } else {
        setShareholderSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchShareholderQuery]);

  const handleSelectShareholder = (sh) => {
    if (isShareholderInactive(sh)) {
      if (showToast) showToast(`ಷೇರು #${sh.share_no} ಖಾತೆಯು ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ. ವಾರಸಾ ವರ್ಗಾವಣೆ ಅಸಾಧ್ಯ (Merged and Inactive account - transfer disabled).`, 'error');
      return;
    }
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(sh.place) : null;
    setForm(prev => ({
      ...prev,
      existing_shareholder_id: sh.shareholder_id || '',
      shareholder_name: sh.shareholder_name || sh.name || '',
      shareholder_aadhaar: sh.aadhaar || sh.aadhar_no || prev.shareholder_aadhaar,
      shareholder_photo: sh.photo || prev.shareholder_photo,
      share_no: String(sh.share_no || ''),
      category: sh.schedule_cast || prev.category,
      no_of_shares: parseInt(sh.number_of_shares) || 1,
      shareholder_place: sh.place || '',
      shareholder_taluk: circleInfo?.taluk || sh.taluk || prev.shareholder_taluk,
      shareholder_district: circleInfo?.district || sh.district || prev.shareholder_district,
      // If heir place is still empty, pre-fill with shareholder place as a convenience
      heir_place: prev.heir_place || sh.place || '',
      heir_taluk: prev.heir_place ? prev.heir_taluk : (circleInfo?.taluk || sh.taluk || prev.heir_taluk),
      heir_district: prev.heir_place ? prev.heir_district : (circleInfo?.district || sh.district || prev.heir_district)
    }));
    setSearchShareholderQuery('');
    setShareholderSearchResults([]);
    if (showToast) showToast(`Selected Member: ${sh.shareholder_name} (Share No: ${sh.share_no})`);
  };

  const handleHeirPlaceChange = (place) => {
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(place) : null;
    const vMatch = villages.find(v => v.name === place);
    setForm(prev => ({
      ...prev,
      heir_place: place,
      heir_taluk: circleInfo?.taluk || (vMatch ? vMatch.taluk : prev.heir_taluk),
      heir_district: circleInfo?.district || (vMatch ? vMatch.district : prev.heir_district)
    }));
  };

  const handleShareholderPlaceChange = (place) => {
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(place) : null;
    const vMatch = villages.find(v => v.name === place);
    setForm(prev => ({
      ...prev,
      shareholder_place: place,
      shareholder_taluk: circleInfo?.taluk || (vMatch ? vMatch.taluk : prev.shareholder_taluk),
      shareholder_district: circleInfo?.district || (vMatch ? vMatch.district : prev.shareholder_district)
    }));
  };

  const handleShPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select an image file (JPG, PNG).', 'error');
      return;
    }
    setUploadingShPhoto(true);
    try {
      const dataUrl = await compressImage(file, 400, 400, 0.85);
      setForm(prev => ({ ...prev, shareholder_photo: dataUrl }));
      if (showToast) showToast('Shareholder photo uploaded successfully!');
    } catch (err) {
      if (showToast) showToast('Failed to process image: ' + err.message, 'error');
    } finally {
      setUploadingShPhoto(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select an image file (JPG, PNG).', 'error');
      return;
    }
    setUploadingPhoto(true);
    try {
      const dataUrl = await compressImage(file, 400, 400, 0.85);
      setForm(prev => ({ ...prev, heir_photo: dataUrl }));
      if (showToast) showToast('Heir photo uploaded and compressed successfully!');
    } catch (err) {
      if (showToast) showToast('Failed to process image: ' + err.message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.varasa_member?.trim()) {
      if (showToast) showToast('Please enter Varasa Member (Legal Heir) name.', 'error');
      setActiveTab('heir');
      return;
    }
    if (!form.shareholder_name?.trim()) {
      if (showToast) showToast('Please enter Original Shareholder name.', 'error');
      setActiveTab('shareholder');
      return;
    }
    if (!form.share_no?.trim()) {
      if (showToast) showToast('Please enter Share Number.', 'error');
      setActiveTab('fees');
      return;
    }

    try {
      if (initialData?.id || initialData?.transfer_id) {
        const res = await ApiService.updateVarasaTransfer(initialData.id || initialData.transfer_id, form);
        if (res.success) {
          if (showToast) showToast('Varasa transfer application updated successfully!');
          onSaveSuccess();
          const rec = res.data || { ...form, transfer_id: initialData.transfer_id || initialData.id };
          setPrintRecord(rec);
        } else {
          if (showToast) showToast(res.message || 'Update failed', 'error');
        }
      } else {
        const res = await ApiService.addVarasaTransfer(form);
        if (res.success) {
          if (showToast) showToast(`Varasa application ${res.transfer_id} registered successfully!`);
          onSaveSuccess();
          const rec = res.data || { ...form, transfer_id: res.transfer_id };
          setPrintRecord(rec);
        } else {
          if (showToast) showToast(res.message || 'Creation failed', 'error');
        }
      }
    } catch (err) {
      if (showToast) showToast('Error saving Varasa application: ' + err.message, 'error');
    }
  };

  if (printRecord) {
    return (
      <VarasaPrintModal
        isOpen={Boolean(printRecord)}
        onClose={() => {
          setPrintRecord(null);
          onClose();
        }}
        varasaData={printRecord}
        isNewSubmission={true}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950">
              <FileText className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {initialData ? 'Edit Varasa Share Transfer Application' : 'New Varasa Share Transfer Application'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  22 Official Columns
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ನಮೂನೆ (ಕಾನೂನುಬದ್ಧ ಹಕ್ಕುದಾರರ ದಾಖಲಾತಿ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('heir')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'heir'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> 1. Varasa Member (ವಾರಸುದಾರರ ವಿವರ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shareholder')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shareholder'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> 2. Share Holder (ಮೂಲ ಶೇರುದಾರರ ವಿವರ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fees'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" /> 3. Shares & Fees (ಶೇರು ಮತ್ತು ರಶೀದಿ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'verification'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 4. Status & Docs (ದಾಖಲೆಗಳು & ಪರಿಶೀಲನೆ)
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: 1. VARASA MEMBER DETAILS */}
          {activeTab === 'heir' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-5 items-start">
                {/* Heir Photo */}
                <div className="flex flex-col items-center gap-2.5 shrink-0 self-center md:self-start">
                  <div className="relative group w-24 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 shadow-inner">
                    {form.heir_photo ? (
                      <img src={form.heir_photo} alt="Heir" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <User className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                        <span className="text-[10px] text-slate-500 font-medium">Photo (ಭಾವಚಿತ್ರ)</span>
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                        Compressing...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3 text-emerald-400" /> Upload
                    </button>
                    {form.heir_photo && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, heir_photo: '' }))}
                        className="p-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Heir Core Info */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      1. Varasa Member (ವಾರಸುದಾರರ ಪೂರ್ಣ ಹೆಸರು) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ಉದಾ: ಶಂಕರಗೌಡ ಮಲ್ಲಪ್ಪ ತಾರಾಪೂರ"
                      value={form.varasa_member}
                      onChange={(e) => setForm({ ...form, varasa_member: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-medium placeholder-slate-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.4 Relationship (ವಾರಸುದಾರರ ಸಂಬಂಧ) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={form.heir_relationship}
                      onChange={(e) => setForm({ ...form, heir_relationship: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none transition-all"
                    >
                      <option value="ಮಗ">ಮಗ (Son)</option>
                      <option value="ಮಗಳು">ಮಗಳು (Daughter)</option>
                      <option value="ಪತ್ನಿ">ಪತ್ನಿ (Wife)</option>
                      <option value="ಪತಿ">ಪತಿ (Husband)</option>
                      <option value="ತಾಯಿ">ತಾಯಿ (Mother)</option>
                      <option value="ತಂದೆ">ತಂದೆ (Father)</option>
                      <option value="ಸಹೋದರ">ಸಹೋದರ (Brother)</option>
                      <option value="ಸೊಸೆ">ಸೊಸೆ (Daughter-in-law)</option>
                      <option value="ಮೊಮ್ಮಗ">ಮೊಮ್ಮಗ (Grandson)</option>
                      <option value="ಮೊಮ್ಮಗಳು">ಮೊಮ್ಮಗಳು (Granddaughter)</option>
                      <option value="ವಾರಸುದಾರ">ವಾರಸುದಾರ (Legal Heir)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.5 Age (ವಯಸ್ಸು)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="ಉದಾ: 42"
                      value={form.heir_age}
                      onChange={(e) => setForm({ ...form, heir_age: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      4. Mobile No (ಮೊಬೈಲ್ ಸಂಖ್ಯೆ) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="ಉದಾ: 9901661920"
                      value={form.heir_mobile}
                      onChange={(e) => setForm({ ...form, heir_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono placeholder-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.6 Aadhar No (ಆಧಾರ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      placeholder="ಉದಾ: 2288 3046 0600"
                      value={form.heir_aadhaar}
                      onChange={(e) => setForm({ ...form, heir_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Family Count Selector */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    ಕುಟುಂಬದ ವಾರಸುದಾರರ ಒಟ್ಟು ಸಂಖ್ಯೆ (Total Family Members / Heirs)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ಪುಟ 8 ಮತ್ತು 9 ರಲ್ಲಿ ಕ್ಷೇತ್ರ ಚೌಕಾಸಿ ತನಿಖಾ ಪಟ್ಟಿಯಲ್ಲಿ ಬರುವ ಒಟ್ಟು ಸಾಲುಗಳು (ಉದಾ: 3, 4, 10)
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, family_count: Math.max(1, (parseInt(prev.family_count) || 4) - 1) }))}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-emerald-400 font-mono text-base">
                    {form.family_count || 4}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, family_count: Math.min(15, (parseInt(prev.family_count) || 4) + 1) }))}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Heir Address & Place */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Heir Residence & Location (ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸ ವಿವರಗಳು)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">1.1 Place (ಸ್ಥಳ / ಗ್ರಾಮ)</label>
                    <input
                      type="text"
                      list="heir-places-list"
                      placeholder="ಉದಾ: ಅಥರ್ಗಾ, ಬಳ್ಳೊಳ್ಳಿ"
                      value={form.heir_place}
                      onChange={(e) => handleHeirPlaceChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 outline-none"
                    />
                    <datalist id="heir-places-list">
                      {villages.map((v, i) => (
                        <option key={i} value={v.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">1.2 Taluk (ತಾಲ್ಲೂಕು)</label>
                    <input
                      type="text"
                      value={form.heir_taluk}
                      onChange={(e) => setForm({ ...form, heir_taluk: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">1.3 District (ಜಿಲ್ಲೆ)</label>
                    <input
                      type="text"
                      value={form.heir_district}
                      onChange={(e) => setForm({ ...form, heir_district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 2. ORIGINAL SHAREHOLDER DETAILS */}
          {activeTab === 'shareholder' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Autocomplete Lookup Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900/60 p-4 rounded-2xl border border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-400" /> Fast Search Member from 17,076 Database (ಶೇರುದಾರರ ನೇರ ಹುಡುಕಾಟ)
                  </label>
                  {isSearching && <span className="text-[10px] text-emerald-400 animate-pulse font-semibold">Searching 17,076 records...</span>}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type Share No (e.g. 10006), Name (e.g. ಮಲ್ಲಪ್ಪ), or Mobile to auto-populate..."
                    value={searchShareholderQuery}
                    onChange={(e) => setSearchShareholderQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 outline-none"
                  />
                  {shareholderSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {shareholderSearchResults.map((sh) => (
                        <div
                          key={sh.id}
                          onClick={() => handleSelectShareholder(sh)}
                          className="p-3 hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-2">
                              <span>{sh.shareholder_name || sh.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Share #{sh.share_no}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex gap-3">
                              <span>ಸ್ಥಳ: {sh.place || '—'}</span>
                              <span>ತಾಲ್ಲೂಕು: {sh.taluk || '—'}</span>
                              <span>ವರ್ಗ: {sh.schedule_cast || '—'}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Shareholder Form Inputs with Photo */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row gap-5 items-start">
                  {/* Shareholder Photo */}
                  <div className="flex flex-col items-center gap-2.5 shrink-0 self-center md:self-start">
                    <div className="relative group w-24 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 shadow-inner">
                      {form.shareholder_photo ? (
                        <img src={form.shareholder_photo} alt="Shareholder" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                          <span className="text-[10px] text-slate-500 font-medium">ದಿ. ಶೇರುದಾರರ ಭಾವಚಿತ್ರ</span>
                        </div>
                      )}
                      {uploadingShPhoto && (
                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                          Compressing...
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="file"
                        ref={shFileInputRef}
                        onChange={handleShPhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => shFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-emerald-400" /> Upload
                      </button>
                      {form.shareholder_photo && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, shareholder_photo: '' }))}
                          className="p-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shareholder Inputs */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        2. Share Holder (ಮೂಲ ಶೇರುದಾರರ ಹೆಸರು) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ಉದಾ: ಮಲ್ಲಪ್ಪ ಈರಣ್ಣ ತಾರಾಪೂರ"
                        value={form.shareholder_name}
                        onChange={(e) => setForm({ ...form, shareholder_name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-medium placeholder-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        2.4 Relationship (ಮೂಲ ಶೇರುದಾರರಿಗೆ ಸಂಬಂಧ) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ಉದಾ: ತಂದೆ, ಪತಿ, ಅಜ್ಜ, ತಾಯಿ"
                        value={form.shareholder_relationship}
                        onChange={(e) => setForm({ ...form, shareholder_relationship: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        B. D.o.D (ಮೂಲ ಶೇರುದಾರರ ನಿಧನ ದಿನಾಂಕ / Date of Death) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY (ಉದಾ: 05/11/2021)"
                        value={form.dod}
                        onChange={(e) => setForm({ ...form, dod: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        ಆಧಾರ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ (Aadhaar Card No)
                      </label>
                      <input
                        type="text"
                        placeholder="ಉದಾ: 2288 3046 0600"
                        value={form.shareholder_aadhaar}
                        onChange={(e) => setForm({ ...form, shareholder_aadhaar: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Shareholder Place & Taluk */}
                <div className="pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Shareholder Place & Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">2.1 Place (ಸ್ಥಳ / ಗ್ರಾಮ)</label>
                      <input
                        type="text"
                        list="sh-places-list"
                        placeholder="ಉದಾ: ಅಥರ್ಗಾ"
                        value={form.shareholder_place}
                        onChange={(e) => handleShareholderPlaceChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                      <datalist id="sh-places-list">
                        {villages.map((v, i) => (
                          <option key={i} value={v.name} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">2.2 Taluk (ತಾಲ್ಲೂಕು)</label>
                      <input
                        type="text"
                        value={form.shareholder_taluk}
                        onChange={(e) => setForm({ ...form, shareholder_taluk: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">2.3 District (ಜಿಲ್ಲೆ)</label>
                      <input
                        type="text"
                        value={form.shareholder_district}
                        onChange={(e) => setForm({ ...form, shareholder_district: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHARES & FEES DETAILS */}
          {activeTab === 'fees' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Share & Transfer Fee Details (ಶೇರು ಮತ್ತು ಶುಲ್ಕ ರಶೀದಿ ವಿವರಗಳು)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      5. Share No (ಶೇರು ಸಂಖ್ಯೆ) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ಉದಾ: 10006"
                      value={form.share_no}
                      onChange={(e) => setForm({ ...form, share_no: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-emerald-400 font-mono font-bold text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      6. Category (ವರ್ಗ) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none"
                    >
                      <option value="ಅ - ವರ್ಗ">ಅ - ವರ್ಗ (A - Class)</option>
                      <option value="ಬ - ವರ್ಗ">ಬ - ವರ್ಗ (B - Class)</option>
                      <option value="ಡ - ವರ್ಗ">ಡ - ವರ್ಗ (D - Class)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      7. No. of Shares (ಶೇರುಗಳ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.no_of_shares}
                      onChange={(e) => setForm({ ...form, no_of_shares: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      9. Fees (ವರ್ಗಾವಣೆ ಶುಲ್ಕ ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="570"
                        value={form.fees}
                        onChange={(e) => setForm({ ...form, fees: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-7 pr-3 py-2.5 text-slate-100 font-mono font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      10. Receipt No (ರಶೀದಿ ಸಂಖ್ಯೆ) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ಉದಾ: 816"
                      value={form.receipt_no}
                      onChange={(e) => setForm({ ...form, receipt_no: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      11. Rp. Date (ರಶೀದಿ ದಿನಾಂಕ)
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY (ಉದಾ: 05/11/2022)"
                      value={form.receipt_date}
                      onChange={(e) => setForm({ ...form, receipt_date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFICATION, STATUS & REMARKS */}
          {activeTab === 'verification' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Workflow Status & Verification Checklist
                </h3>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Workflow Status (ಅರ್ಜಿ ಸ್ಥಿತಿ)
                  </label>
                  <select
                    value={form.approval_status}
                    onChange={(e) => setForm({ ...form, approval_status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-slate-100 font-semibold outline-none"
                  >
                    <option value="Application Received">Application Received (ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ)</option>
                    <option value="Under Verification">Under Verification (ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ)</option>
                    <option value="Approved">Approved (ಮಂಜೂರಾಗಿದೆ)</option>
                    <option value="Completed">Completed & Transferred (ವರ್ಗಾವಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ)</option>
                  </select>
                </div>

                {/* Checklist Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.death_cert_attached}
                      onChange={(e) => setForm({ ...form, death_cert_attached: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">Death Certificate Attached (ಗ್ರಾಮ ಪಂಚಾಯತ್ / ಪುರಸಭೆ ಮರಣ ಪ್ರಮಾಣ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.affidavit_attached}
                      onChange={(e) => setForm({ ...form, affidavit_attached: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">Legal Heir Affidavit Attached (ವಾರಸುದಾರರ ಅಫಿಡವಿಟ್ ಪ್ರಮಾಣ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.panchayat_noc_attached}
                      onChange={(e) => setForm({ ...form, panchayat_noc_attached: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">No-Objection Certificate from Other Heirs (ಇತರ ವಾರಸುದಾರರ ನಿರಾಕ್ಷೇಪಣಾ ಪ್ರಮಾಣ ಪತ್ರ)</span>
                  </label>
                </div>

                {/* Remarks */}
                <div className="pt-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Remarks & Document Verification Notes (ಟಿಪ್ಪಣಿ ಮತ್ತು ಪರಿಶೀಲನಾ ವಿವರಗಳು)
                  </label>
                  <textarea
                    rows="3"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    placeholder="ನಮೂದಿಸಿ..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {form.sl_no ? `Record Sl. No: ${form.sl_no} • ` : ''}
              {form.share_no ? `Share No: ${form.share_no} • ` : ''}
              Fee: ₹{form.fees}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {activeTab !== 'verification' ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['heir', 'shareholder', 'fees', 'verification'];
                    const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
                    setActiveTab(tabs[nextIdx]);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Next Section →
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                title="ಮುದ್ರಣ ಪ್ರಿವ್ಯೂ (Print Preview)"
              >
                <Printer className="w-4 h-4" />
                <span>ಪ್ರಿವ್ಯೂ (Preview)</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{initialData ? 'Update Application' : 'Submit Application'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      {showPreviewModal && (
        <VarasaPrintModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          varasaData={{
            ...form,
            transfer_id: form.transfer_id || "VAR-PREVIEW"
          }}
          isNewSubmission={false}
        />
      )}
    </div>
  );
}
