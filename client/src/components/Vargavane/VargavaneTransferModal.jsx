import React, { useState, useEffect, useRef } from 'react';
import { ApiService, isShareholderInactive } from '../../services/api';
import {
  X, Save, User, MapPin, Phone, CreditCard, Calendar, Upload,
  Search, CheckCircle2, AlertCircle, FileText, Camera, Trash2,
  Building2, Hash, Layers, ShieldCheck, DollarSign, Receipt, ArrowRightLeft
} from 'lucide-react';

// Fast client-side image compression
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

export default function VargavaneTransferModal({
  isOpen,
  onClose,
  initialData = null,
  onSaveSuccess,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('transferor'); // 'transferor', 'transferee', 'shares_fees', 'verification'
  const [villages, setVillages] = useState([]);
  const [searchShareholderQuery, setSearchShareholderQuery] = useState('');
  const [shareholderSearchResults, setShareholderSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // 22 Official Statutory Cooperative Vargavane Ledger Fields
  const [form, setForm] = useState({
    sl_no: initialData?.sl_no || '',
    transfer_id: initialData?.transfer_id || '',

    // 1. Share Holder (ಮೂಲ ಶೇರುದಾರರ ವಿವರಗಳು - Transferor)
    transferor_name: initialData?.transferor_name || initialData?.shareholder_name || '',
    shareholder_name: initialData?.transferor_name || initialData?.shareholder_name || '',
    transferor_place: initialData?.transferor_place || '',
    transferor_taluk: initialData?.transferor_taluk || 'ಇಂಡಿ',
    transferor_district: initialData?.transferor_district || 'ವಿಜಯಪುರ',
    transferor_relationship: initialData?.transferor_relationship || 'ಸ್ವಂತ',
    transferor_age: initialData?.transferor_age || '',
    transferor_aadhaar: initialData?.transferor_aadhaar || '',
    transferor_mobile: initialData?.transferor_mobile || '',

    // 2. Vargavane Madikolluvaru (ವರ್ಗಾವಣೆ ಮಾಡಿಸಿಕೊಳ್ಳುವವರು - Transferee)
    transferee_name: initialData?.transferee_name || '',
    transferee_place: initialData?.transferee_place || '',
    transferee_taluk: initialData?.transferee_taluk || 'ಇಂಡಿ',
    transferee_district: initialData?.transferee_district || 'ವಿಜಯಪುರ',
    transferee_relationship: initialData?.transferee_relationship || 'ಮಗ',
    transferee_aadhaar: initialData?.transferee_aadhaar || '',
    transferee_mobile: initialData?.transferee_mobile || '',
    transferee_photo: initialData?.transferee_photo || '',

    // 3. Share & Fee Details (ಶೇರು ಮತ್ತು ಶುಲ್ಕ ರಶೀದಿ ವಿವರಗಳು)
    share_no: initialData?.share_no || '',
    category: initialData?.category || 'ಅ - ವರ್ಗ', // 6. Category
    no_of_shares: initialData?.no_of_shares || 1, // 7. No. of Shares
    fees: initialData?.fees !== undefined ? initialData?.fees : 570, // 9. Fees
    receipt_no: initialData?.receipt_no || '', // 10. Receipt No
    receipt_date: initialData?.receipt_date || new Date().toLocaleDateString('en-GB'), // 11. Rp. Date

    // 4. Verification & Status
    approval_status: initialData?.approval_status || 'Application Received',
    documents_verified: initialData?.documents_verified || 'Pending',
    transfer_form_attached: initialData?.transfer_form_attached !== undefined ? initialData.transfer_form_attached : true,
    aadhaar_attached: initialData?.aadhaar_attached !== undefined ? initialData.aadhaar_attached : true,
    consent_letter_attached: initialData?.consent_letter_attached !== undefined ? initialData.consent_letter_attached : true,
    remarks: initialData?.remarks || 'ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ನಮೂನೆ ಹಾಗೂ ಒಪ್ಪಿಗೆ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ.'
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
      if (showToast) showToast(`ಷೇರು #${sh.share_no} ಖಾತೆಯು ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ. ವರ್ಗಾವಣೆ ಅಸಾಧ್ಯ (Merged and Inactive account - transfer disabled).`, 'error');
      return;
    }
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(sh.place) : null;
    setForm(prev => ({
      ...prev,
      transferor_name: sh.shareholder_name || sh.name || '',
      shareholder_name: sh.shareholder_name || sh.name || '',
      share_no: String(sh.share_no || ''),
      category: sh.schedule_cast || prev.category,
      no_of_shares: parseInt(sh.number_of_shares) || 1,
      transferor_place: sh.place || '',
      transferor_taluk: circleInfo?.taluk || sh.taluk || prev.transferor_taluk,
      transferor_district: circleInfo?.district || sh.district || prev.transferor_district,
      transferor_aadhaar: sh.aadhaar_card_no || prev.transferor_aadhaar,
      transferor_mobile: sh.mobile_no || sh.mobile || prev.transferor_mobile,
      // If transferee place is empty, pre-fill with member place
      transferee_place: prev.transferee_place || sh.place || '',
      transferee_taluk: prev.transferee_place ? prev.transferee_taluk : (circleInfo?.taluk || sh.taluk || prev.transferee_taluk),
      transferee_district: prev.transferee_place ? prev.transferee_district : (circleInfo?.district || sh.district || prev.transferee_district)
    }));
    setSearchShareholderQuery('');
    setShareholderSearchResults([]);
    if (showToast) showToast(`Selected Member: ${sh.shareholder_name} (Share No: ${sh.share_no})`);
  };

  const handleTransferorPlaceChange = (place) => {
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(place) : null;
    const vMatch = villages.find(v => v.name === place);
    setForm(prev => ({
      ...prev,
      transferor_place: place,
      transferor_taluk: circleInfo?.taluk || (vMatch ? vMatch.taluk : prev.transferor_taluk),
      transferor_district: circleInfo?.district || (vMatch ? vMatch.district : prev.transferor_district)
    }));
  };

  const handleTransfereePlaceChange = (place) => {
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(place) : null;
    const vMatch = villages.find(v => v.name === place);
    setForm(prev => ({
      ...prev,
      transferee_place: place,
      transferee_taluk: circleInfo?.taluk || (vMatch ? vMatch.taluk : prev.transferee_taluk),
      transferee_district: circleInfo?.district || (vMatch ? vMatch.district : prev.transferee_district)
    }));
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
      setForm(prev => ({ ...prev, transferee_photo: dataUrl }));
      if (showToast) showToast('Transferee photo uploaded successfully!');
    } catch (err) {
      if (showToast) showToast('Failed to process image: ' + err.message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.transferor_name?.trim()) {
      if (showToast) showToast('Please enter Transferor Shareholder name.', 'error');
      setActiveTab('transferor');
      return;
    }
    if (!form.transferee_name?.trim()) {
      if (showToast) showToast('Please enter Transferee (Vargavane Madikolluvaru) name.', 'error');
      setActiveTab('transferee');
      return;
    }
    if (!form.share_no?.trim()) {
      if (showToast) showToast('Please enter Share Number.', 'error');
      setActiveTab('shares_fees');
      return;
    }

    try {
      if (initialData?.id || initialData?.transfer_id) {
        const res = await ApiService.updateVargavaneTransfer(initialData.id || initialData.transfer_id, form);
        if (res.success) {
          if (showToast) showToast('Vargavane transfer application updated successfully!');
          onSaveSuccess();
          onClose();
        } else {
          if (showToast) showToast(res.message || 'Update failed', 'error');
        }
      } else {
        const res = await ApiService.addVargavaneTransfer(form);
        if (res.success) {
          if (showToast) showToast(`Vargavane transfer ${res.transfer_id} registered successfully!`);
          onSaveSuccess();
          onClose();
        } else {
          if (showToast) showToast(res.message || 'Creation failed', 'error');
        }
      }
    } catch (err) {
      if (showToast) showToast('Error saving Vargavane transfer: ' + err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-950">
              <ArrowRightLeft className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {initialData ? 'Edit Vargavane Share Transfer' : 'New Vargavane Share Transfer Application'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800/60">
                  22 Official Columns
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ನಮೂನೆ (ಮೂಲ ಶೇರುದಾರರಿಂದ ಹೊಸಬರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ)
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
            onClick={() => setActiveTab('transferor')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'transferor'
                ? 'border-sky-500 text-sky-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> 1. Share Holder (ಮೂಲ ಶೇರುದಾರರು)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transferee')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'transferee'
                ? 'border-sky-500 text-sky-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> 2. Vargavane Madikolluvaru (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರು)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shares_fees')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shares_fees'
                ? 'border-sky-500 text-sky-400 font-bold bg-slate-900/80 rounded-t-xl'
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
                ? 'border-sky-500 text-sky-400 font-bold bg-slate-900/80 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 4. Status & Docs (ದಾಖಲೆಗಳು & ಪರಿಶೀಲನೆ)
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: 1. TRANSFEROR SHAREHOLDER DETAILS */}
          {activeTab === 'transferor' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Quick Search Member from 17,076 Database */}
              <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900/60 p-4 rounded-2xl border border-sky-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-sky-400" /> Fast Search Member from 17,076 Database (ಮೂಲ ಶೇರುದಾರರ ಹುಡುಕಾಟ)
                  </label>
                  {isSearching && <span className="text-[10px] text-sky-400 animate-pulse font-semibold">Searching 17,076 records...</span>}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type Share No (e.g. 157, 13453), Name, or Mobile to auto-fill..."
                    value={searchShareholderQuery}
                    onChange={(e) => setSearchShareholderQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 outline-none"
                  />
                  {shareholderSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800">
                      {shareholderSearchResults.map((sh) => (
                        <div
                          key={sh.id}
                          onClick={() => handleSelectShareholder(sh)}
                          className="p-3 hover:bg-sky-950/40 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-2">
                              <span>{sh.shareholder_name || sh.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800">
                                Share #{sh.share_no}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex gap-3">
                              <span>ಸ್ಥಳ: {sh.place || '—'}</span>
                              <span>ತಾಲ್ಲೂಕು: {sh.taluk || '—'}</span>
                              <span>ವರ್ಗ: {sh.schedule_cast || '—'}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transferor Input Fields */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      1. Share Holder Name (ಮೂಲ ಶೇರುದಾರರ ಹೆಸರು) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ಉದಾ: ಶ್ರೀಮತಿ ಕಸ್ತೂರಿಬಾಯಿ ಗದ್ದೆಪ್ಪ ಕುಂಬಾರ"
                      value={form.transferor_name}
                      onChange={(e) => setForm({ ...form, transferor_name: e.target.value, shareholder_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-medium placeholder-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.4 Relationship (ಶೇರುದಾರರ ಸಂಬಂಧ)
                    </label>
                    <input
                      type="text"
                      placeholder="ಉದಾ: ತಾಯಿ, ತಂದೆ, ಸ್ವಂತ, ಪತಿ"
                      value={form.transferor_relationship}
                      onChange={(e) => setForm({ ...form, transferor_relationship: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.5 Age (ಶೇರುದಾರರ ವಯಸ್ಸು)
                    </label>
                    <input
                      type="number"
                      placeholder="ವಯಸ್ಸು"
                      value={form.transferor_age}
                      onChange={(e) => setForm({ ...form, transferor_age: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.6 Aadhar No (ಶೇರುದಾರರ ಆಧಾರ್ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      placeholder="ಉದಾ: 3892 6622 2757"
                      value={form.transferor_aadhaar}
                      onChange={(e) => setForm({ ...form, transferor_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      1.7 Mobile No. (ಶೇರುದಾರರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="tel"
                      placeholder="ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                      value={form.transferor_mobile}
                      onChange={(e) => setForm({ ...form, transferor_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Transferor Place & Address */}
                <div className="pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Transferor Place & Taluk</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">1.1 Place (ಸ್ಥಳ / ಗ್ರಾಮ)</label>
                      <input
                        type="text"
                        list="transferor-places-list"
                        placeholder="ಉದಾ: ಅಹಿರಸಂಗ"
                        value={form.transferor_place}
                        onChange={(e) => handleTransferorPlaceChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                      <datalist id="transferor-places-list">
                        {villages.slice(0, 50).map((v, i) => (
                          <option key={i} value={v.name} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">1.2 Taluk (ತಾಲ್ಲೂಕು)</label>
                      <input
                        type="text"
                        value={form.transferor_taluk}
                        onChange={(e) => setForm({ ...form, transferor_taluk: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">1.3 District (ಜಿಲ್ಲೆ)</label>
                      <input
                        type="text"
                        value={form.transferor_district}
                        onChange={(e) => setForm({ ...form, transferor_district: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 2. VARGAVANE MADIKOLLUVARU (TRANSFEREE) DETAILS */}
          {activeTab === 'transferee' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-5 items-start">
                {/* Transferee Photo */}
                <div className="flex flex-col items-center gap-2.5 shrink-0 self-center md:self-start">
                  <div className="relative group w-24 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 shadow-inner">
                    {form.transferee_photo ? (
                      <img src={form.transferee_photo} alt="Transferee" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <User className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                        <span className="text-[10px] text-slate-500 font-medium">Photo (ಭಾವಚಿತ್ರ)</span>
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] text-sky-400 font-bold">
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
                      <Camera className="w-3 h-3 text-sky-400" /> Upload
                    </button>
                    {form.transferee_photo && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, transferee_photo: '' }))}
                        className="p-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Transferee Inputs */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      2. Vargavane Madikolluvaru (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರು) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ಉದಾ: ಶ್ರೀ ರಾಜಶೇಖರ ಗದ್ದೆಪ್ಪ ಕುಂಬಾರ"
                      value={form.transferee_name}
                      onChange={(e) => setForm({ ...form, transferee_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-medium placeholder-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      2.4 Relationship (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಸಂಬಂಧ) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={form.transferee_relationship}
                      onChange={(e) => setForm({ ...form, transferee_relationship: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none"
                    >
                      <option value="ಮಗ">ಮಗ (Son)</option>
                      <option value="ಮಗಳು">ಮಗಳು (Daughter)</option>
                      <option value="ಪತ್ನಿ">ಪತ್ನಿ (Wife)</option>
                      <option value="ಪತಿ">ಪತಿ (Husband)</option>
                      <option value="ಸಹೋದರ">ಸಹೋದರ (Brother)</option>
                      <option value="ತಾಯಿ">ತಾಯಿ (Mother)</option>
                      <option value="ತಂದೆ">ತಂದೆ (Father)</option>
                      <option value="ಸೊಸೆ">ಸೊಸೆ (Daughter-in-law)</option>
                      <option value="ಮೊಮ್ಮಗ">ಮೊಮ್ಮಗ (Grandson)</option>
                      <option value="ಇತರೆ">ಇತರೆ (Other Member)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      2.6 Mobile No (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಮೊಬೈಲ್) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="ಉದಾ: 9632668696"
                      value={form.transferee_mobile}
                      onChange={(e) => setForm({ ...form, transferee_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      2.5 Aadhar No (ವರ್ಗಾವಣೆ ಮಾಡಿಕೊಳ್ಳುವವರ ಆಧಾರ್ ಸಂಖ್ಯೆ)
                    </label>
                    <input
                      type="text"
                      placeholder="ಉದಾ: 4269 5069 6182"
                      value={form.transferee_aadhaar}
                      onChange={(e) => setForm({ ...form, transferee_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Transferee Location */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" /> Transferee Residence & Location (ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸ ವಿವರಗಳು)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">2.1 Place (ಸ್ಥಳ / ಗ್ರಾಮ)</label>
                    <input
                      type="text"
                      list="transferee-places-list"
                      placeholder="ಉದಾ: ಅಹಿರಸಂಗ, ನಾಟೇಕಾರಗಾಂವ"
                      value={form.transferee_place}
                      onChange={(e) => handleTransfereePlaceChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                    <datalist id="transferee-places-list">
                      {villages.slice(0, 50).map((v, i) => (
                        <option key={i} value={v.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">2.2 Taluk (ತಾಲ್ಲೂಕು)</label>
                    <input
                      type="text"
                      value={form.transferee_taluk}
                      onChange={(e) => setForm({ ...form, transferee_taluk: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">2.3 District (ಜಿಲ್ಲೆ)</label>
                    <input
                      type="text"
                      value={form.transferee_district}
                      onChange={(e) => setForm({ ...form, transferee_district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHARES & FEES DETAILS */}
          {activeTab === 'shares_fees' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400" /> Share & Transfer Fee Details (ಶೇರು ಮತ್ತು ಶುಲ್ಕ ರಶೀದಿ ವಿವರಗಳು)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      5. Share No (ಶೇರು ಸಂಖ್ಯೆ) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ಉದಾ: 157"
                      value={form.share_no}
                      onChange={(e) => setForm({ ...form, share_no: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sky-400 font-mono font-bold text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      6. Category (ವರ್ಗ) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 outline-none"
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
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-bold outline-none"
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
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-7 pr-3 py-2.5 text-slate-100 font-mono font-bold outline-none"
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
                      placeholder="ಉದಾ: 591"
                      value={form.receipt_no}
                      onChange={(e) => setForm({ ...form, receipt_no: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      11. Rp. Date (ರಶೀದಿ ದಿನಾಂಕ)
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY (ಉದಾ: 01/06/2024)"
                      value={form.receipt_date}
                      onChange={(e) => setForm({ ...form, receipt_date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-mono outline-none"
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
                  <ShieldCheck className="w-4 h-4 text-sky-400" /> Workflow Status & Verification Checklist
                </h3>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Workflow Status (ಅರ್ಜಿ ಸ್ಥಿತಿ)
                  </label>
                  <select
                    value={form.approval_status}
                    onChange={(e) => setForm({ ...form, approval_status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-slate-100 font-semibold outline-none"
                  >
                    <option value="Application Received">Application Received (ಅರ್ಜಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ)</option>
                    <option value="Under Verification">Under Verification (ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ)</option>
                    <option value="Approved">Approved (ಮಂಜೂರಾಗಿದೆ)</option>
                    <option value="Completed">Completed & Transferred (ವರ್ಗಾವಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ)</option>
                  </select>
                </div>

                {/* Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.transfer_form_attached}
                      onChange={(e) => setForm({ ...form, transfer_form_attached: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">Share Transfer Agreement Attached (ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.consent_letter_attached}
                      onChange={(e) => setForm({ ...form, consent_letter_attached: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">Consent Letter of Transferor (ಮೂಲ ಶೇರುದಾರರ ಒಪ್ಪಿಗೆ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.aadhaar_attached}
                      onChange={(e) => setForm({ ...form, aadhaar_attached: e.target.checked })}
                      className="w-4 h-4 accent-sky-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">Aadhaar Card Copy of Both Parties (ಇಬ್ಬರ ಆಧಾರ್ ಕಾರ್ಡ್ ಪ್ರತಿಗಳು ಲಗತ್ತಿಸಲಾಗಿದೆ)</span>
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
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {form.sl_no ? `Sl. No: ${form.sl_no} • ` : ''}
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
                    const tabs = ['transferor', 'transferee', 'shares_fees', 'verification'];
                    const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
                    setActiveTab(tabs[nextIdx]);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Next Section →
                </button>
              ) : null}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{initialData ? 'Update Vargavane' : 'Submit Vargavane Application'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
