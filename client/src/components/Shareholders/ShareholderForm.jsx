import React, { useState, useEffect } from 'react';
import { ApiService, hasSecondInstallment, getMemberTypeByCategory, getShareholderOwnership, isRegisteredOnOrBeforeCutoff, getShareRateConfig, calculateShareholdingDetails, isEligibleForSecondInstallment, getRequiredSecondInstallmentAmount } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X, Save, Plus, Printer, Contact, AlertTriangle, BookOpen, MapPin,
  FileText, Users2, Fingerprint, Camera, Upload, Trash2, FileSignature, User, CheckCircle2, RefreshCw,
  History, Clock, ArrowRight, Coins
} from 'lucide-react';

// Client-side image compression to store optimized base64 data URLs in IndexedDB
function compressImage(file, maxWidth = 600, maxHeight = 600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
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

export default function ShareholderForm({ initialData, onClose, onSaveSuccess }) {
  const { showToast, setActiveModule } = useAuth();
  const [villages, setVillages] = useState([]);
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

  const filteredVillages = useMemo(() => {
    const q = (formData.place || '').trim().toLowerCase();
    if (!q) return villages.slice(0, 20);
    return villages.filter(v => {
      const name = (v.name || '').toLowerCase();
      const taluk = (v.taluk || '').toLowerCase();
      return name.includes(q) || taluk.includes(q);
    });
  }, [formData.place, villages]);

  const handleSelectVillage = (v) => {
    const placeName = typeof v === 'string' ? v : v.name;
    handlePlaceChange(placeName);
    setShowPlaceDropdown(false);
  };
  const [circles, setCircles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const initialRegDate = initialData?.reg_date || initialData?.registration_date || new Date().toLocaleDateString('en-GB');
  const initialCast = initialData?.schedule_cast || 'ಅ - ವರ್ಗ';
  const initialReceiptAmt = initialData?.receipt_amount !== undefined ? (parseFloat(initialData.receipt_amount) || 0) : 2000;

  // 2nd installment eligibility check:
  // ONLY allow 1000, 3000, 5000, 7000, 9000... (incomplete share amounts)
  const initialEligible2nd = isEligibleForSecondInstallment(initialReceiptAmt, initialCast);
  const initialRequired2nd = getRequiredSecondInstallmentAmount(initialReceiptAmt, initialCast);

  const hasInitial2nd = initialEligible2nd && initialData ? hasSecondInstallment(initialData) : false;
  const [showSecondInstallment, setShowSecondInstallment] = useState(hasInitial2nd);
  const initial2ndAmt = hasInitial2nd ? (parseFloat(initialData?.amount) || initialRequired2nd || 1000) : 0;
  const initialAddShares = parseInt(initialData?.additional_shares_count, 10) || 0;
  const initialAddAmt = parseFloat(initialData?.additional_amount) || 0;

  const initialCalc = calculateShareholdingDetails({
    reg_date: initialRegDate,
    schedule_cast: initialCast,
    receipt_amount: initialReceiptAmt,
    amount: initial2ndAmt,
    has_second_installment: hasInitial2nd,
    additional_shares_count: initialAddShares,
    additional_amount: initialAddAmt,
    manual_total: initialData?.total_amount
  });

  const [showAdditionalSection, setShowAdditionalSection] = useState(
    initialAddShares > 0 || initialAddAmt > 0
  );

  const historyList = Array.isArray(initialData?.history)
    ? initialData.history
    : (Array.isArray(initialData?.change_history)
      ? initialData.change_history
      : (Array.isArray(initialData?.audit_history) ? initialData.audit_history : []));

  const [formData, setFormData] = useState({
    // 38 Official Statutory Cooperative Columns:
    book_no: initialData?.book_no || 'B.No: 1',
    sl_no: initialData?.sl_no || Math.floor(Math.random() * 500) + 1,
    share_no: initialData?.share_no || String(Math.floor(Math.random() * 90000) + 1000),
    shareholder_name: initialData?.shareholder_name || initialData?.name || '',
    gender: initialData?.gender || 'M',
    aadhaar_card_no: initialData?.aadhaar_card_no || initialData?.aadhaar_ref || '',
    reg_date: initialRegDate,
    receipt_no: initialData?.receipt_no || String(Math.floor(Math.random() * 9000) + 100),
    receipt_amount: initialReceiptAmt,
    date: hasInitial2nd ? (initialData?.date || '') : '',
    reciept: hasInitial2nd ? (initialData?.reciept || '') : '',
    amount: hasInitial2nd ? initial2ndAmt : '',
    total_amount: initialCalc.totalAmount,
    number_of_shares: initialCalc.completeShares,
    remaining_balance: initialCalc.remainingBalance,
    additional_shares_count: initialAddShares,
    additional_amount: initialAddAmt,
    additional_receipt_no: initialData?.additional_receipt_no || '',
    additional_date: initialData?.additional_date || '',
    schedule_cast: initialCast,
    address: initialData?.address || '',
    nagara: initialData?.nagara || 'ಗ್ರಾಮ ಠಾಣಾ',
    road: initialData?.road || 'ಮುಖ್ಯ ರಸ್ತೆ',
    place: initialData?.place || initialData?.village_name || 'ಬಳ್ಳೊಳ್ಳಿ',
    taluk: initialData?.taluk || 'ಇಂಡಿ',
    district: initialData?.district || 'ವಿಜಯಪುರ',
    pin_code: initialData?.pin_code || '586 117',
    circle: initialData?.circle || initialData?.circle_name || 'ಇಂಡಿ',
    member_type: getMemberTypeByCategory(initialCast, initialData?.member_type),
    ownership: getShareholderOwnership(initialData),
    relationship: getShareholderOwnership(initialData),
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
    status: initialData?.status || 'Active',
    history_notes: ''
  });

  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    const vRes = await ApiService.getVillages();
    if (vRes && vRes.data) {
      setVillages([...vRes.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
    }

    const cRes = await ApiService.getCircles();
    if (cRes && cRes.data) {
      setCircles([...cRes.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
    }
  };

  const handlePlaceChange = (placeName) => {
    const matchedV = villages.find(v => v.name === placeName);
    const circleInfo = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(placeName) : null;
    setFormData(prev => ({
      ...prev,
      place: placeName,
      taluk: (circleInfo?.taluk) || (matchedV ? matchedV.taluk : prev.taluk),
      circle: (circleInfo?.circle_name && circleInfo.circle_name !== 'ಇತರೆ (Other)') ? circleInfo.circle_name : (matchedV ? matchedV.circle_name : prev.circle),
      pin_code: (circleInfo?.pincode) || (matchedV ? matchedV.pin_code : prev.pin_code),
      district: (circleInfo?.district) || prev.district
    }));
  };

  const [uploadingState, setUploadingState] = useState({ photo: false, signature: false, thumb: false });

  const handleFileUpload = async (type, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }
    setUploadingState(prev => ({ ...prev, [type]: true }));
    try {
      const maxWidth = type === 'signature' ? 600 : 500;
      const maxHeight = type === 'signature' ? 300 : 500;
      const dataUrl = await compressImage(file, maxWidth, maxHeight, 0.85);

      if (type === 'photo') {
        setFormData(prev => ({ ...prev, photo_url: dataUrl, photo_updated: 'Yes' }));
        showToast('Shareholder Photo uploaded successfully!');
      } else if (type === 'signature') {
        setFormData(prev => ({ ...prev, signature_url: dataUrl, signature_updated: 'Yes' }));
        showToast('Shareholder Signature uploaded successfully!');
      } else if (type === 'thumb') {
        setFormData(prev => ({ ...prev, thumb_url: dataUrl, thumb_updated: 'Yes' }));
        showToast('Thumb impression uploaded successfully!');
      }
    } catch (err) {
      showToast('Failed to process image: ' + err.message, 'error');
    } finally {
      setUploadingState(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRemoveFile = (type) => {
    if (type === 'photo') {
      setFormData(prev => ({ ...prev, photo_url: '', photo_updated: 'No' }));
      showToast('Photo removed.');
    } else if (type === 'signature') {
      setFormData(prev => ({ ...prev, signature_url: '', signature_updated: 'No' }));
      showToast('Signature removed.');
    } else if (type === 'thumb') {
      setFormData(prev => ({ ...prev, thumb_url: '', thumb_updated: 'No' }));
      showToast('Thumb impression removed.');
    }
  };

  // Central Dynamic Calculation Function
  const updateCalculation = (overrides = {}) => {
    setFormData(prev => {
      const next = { ...prev, ...overrides };
      const curReceiptAmt = parseFloat(next.receipt_amount) || 0;
      const curEligible2nd = isEligibleForSecondInstallment(curReceiptAmt, next.schedule_cast);
      const curRequired2nd = getRequiredSecondInstallmentAmount(curReceiptAmt, next.schedule_cast);

      let effectiveShow2nd = overrides.showSecondInstallment !== undefined
        ? overrides.showSecondInstallment
        : showSecondInstallment;

      // Rule: If already completed share (e.g. 2000, 4000...), 2nd installment is NOT shown or allowed!
      if (!curEligible2nd) {
        effectiveShow2nd = false;
        setShowSecondInstallment(false);
        next.amount = 0;
        next.reciept = '';
        next.date = '';
      } else if (effectiveShow2nd && (!next.amount || parseFloat(next.amount) <= 0)) {
        next.amount = curRequired2nd || 1000;
      }

      const calc = calculateShareholdingDetails({
        reg_date: next.reg_date,
        schedule_cast: next.schedule_cast,
        receipt_amount: next.receipt_amount,
        amount: effectiveShow2nd ? (parseFloat(next.amount) || curRequired2nd || 1000) : 0,
        has_second_installment: effectiveShow2nd,
        additional_shares_count: next.additional_shares_count,
        additional_amount: next.additional_amount
      });

      return {
        ...next,
        total_amount: calc.totalAmount,
        number_of_shares: calc.completeShares,
        remaining_balance: calc.remainingBalance
      };
    });
  };

  // Current live rate and calculation details
  const rateConfig = getShareRateConfig(formData.schedule_cast, formData.reg_date);
  const isEligibleFor2nd = isEligibleForSecondInstallment(formData.receipt_amount, formData.schedule_cast);
  const required2ndAmt = getRequiredSecondInstallmentAmount(formData.receipt_amount, formData.schedule_cast);

  const currentCalc = calculateShareholdingDetails({
    reg_date: formData.reg_date,
    schedule_cast: formData.schedule_cast,
    receipt_amount: formData.receipt_amount,
    amount: (isEligibleFor2nd && showSecondInstallment) ? (parseFloat(formData.amount) || required2ndAmt || 1000) : 0,
    has_second_installment: isEligibleFor2nd && showSecondInstallment,
    additional_shares_count: formData.additional_shares_count,
    additional_amount: formData.additional_amount,
    manual_total: formData.total_amount
  });

  const handleSubmit = async (e, saveAndNew = false) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.shareholder_name || !formData.share_no) {
      setErrorMsg('Please enter Shareholder Name and Share Number.');
      return;
    }

    const submissionData = {
      ...formData,
      total_amount: currentCalc.totalAmount,
      number_of_shares: currentCalc.completeShares,
      remaining_balance: currentCalc.remainingBalance,
      old_shares_count: currentCalc.oldSharesCount,
      new_shares_count: currentCalc.newSharesCount,
      reciept: (isEligibleFor2nd && showSecondInstallment) ? String(formData.reciept || '').trim() : '',
      amount: (isEligibleFor2nd && showSecondInstallment) ? (parseFloat(formData.amount) || required2ndAmt || 1000) : 0,
      date: (isEligibleFor2nd && showSecondInstallment) ? String(formData.date || '').trim() : '',
      additional_shares_count: formData.additional_shares_count || 0,
      additional_amount: formData.additional_amount || 0,
      additional_receipt_no: String(formData.additional_receipt_no || '').trim(),
      additional_date: String(formData.additional_date || '').trim(),
      history_notes: (formData.history_notes || '').trim()
    };

    if (initialData) {
      const shId = initialData.share_no || initialData.share_number || initialData.id || initialData.shareholder_id;
      const res = await ApiService.updateShareholder(shId, submissionData);
      if (res && res.success) {
        showToast(`Updated shareholder record for ${formData.shareholder_name}`);
        if (onSaveSuccess) onSaveSuccess(res.data);
      } else {
        setErrorMsg(res?.message || 'Failed to update shareholder.');
      }
    } else {
      const res = await ApiService.addShareholder(submissionData);
      if (res && res.success) {
        showToast(`Shareholder ${formData.shareholder_name} saved successfully!`);
        if (saveAndNew) {
          setShowSecondInstallment(false);
          setFormData(prev => ({
            ...prev,
            sl_no: parseInt(prev.sl_no) + 1,
            share_no: String(parseInt(prev.share_no) + 1),
            shareholder_name: '',
            aadhaar_card_no: '',
            mobile_no: '',
            photo_url: '',
            signature_url: '',
            thumb_url: '',
            photo_updated: 'No',
            signature_updated: 'No',
            thumb_updated: 'No',
            reciept: '',
            amount: '',
            date: '',
            nominee_name: '',
            nominee_aadhaar_no: '',
            nominee_mobile_no: '',
            nominee_address: ''
          }));
        } else {
          if (onSaveSuccess) onSaveSuccess(res);
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                {initialData ? 'Edit Statutory Shareholder Record (ಷೇರುದಾರರ ತಿದ್ದುಪಡಿ)' : 'Register New Shareholder (ಹೊಸ ಷೇರುದಾರರ ನಮೂದು)'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                38 Statutory Columns
              </span>
              {initialData && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                  <History className="w-3 h-3 text-blue-400" />
                  {historyList.length} ತಿದ್ದುಪಡಿಗಳು (Revisions)
                </span>
              )}
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
          {/* Section 1: Shareholder Personal Info */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <Users2 className="w-4 h-4 text-sky-400" /> 1. Shareholder Personal Details (ಷೇರುದಾರರ ವೈಯಕ್ತಿಕ ವಿವರ)
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
                  onChange={(e) => updateCalculation({ reg_date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Book & Share Ledger */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> 2. Book & Share Certificate Details (ನಮೂನೆ ವಹಿ ಹಾಗೂ ಷೇರು ವಿವರ)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  ಶಾಸನಬದ್ಧ ಶೇರು ಮೌಲ್ಯ: <strong className="text-emerald-400 font-mono">₹{rateConfig.baseRate.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* Statutory Share Rate & Cutoff Banner */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${rateConfig.isLegacy ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-xs">
                    <span>{rateConfig.categoryName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rateConfig.isLegacy ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                      {rateConfig.isLegacy ? '28/02/2022 ಕ್ಕೂ ಮುಂಚಿನ ನೋಂದಣಿ (₹2,000 / ₹5,000)' : '28/02/2022 ನಂತರದ ನೋಂದಣಿ (₹24,000 / ₹25,000)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ಅನ್ವಯವಾಗುವ ಶೇರು ದರ: <strong className="text-emerald-400 font-mono">₹{rateConfig.baseRate.toLocaleString()}</strong>
                    {rateConfig.isLegacy && (
                      <span className="text-slate-400 ml-1.5">
                        • ಹೊಸ ಹೆಚ್ಚುವರಿ ಶೇರು ಖರೀದಿಗೆ ಪ್ರಸ್ತುತ ದರ: <strong className="text-sky-400 font-mono">₹{rateConfig.newRate.toLocaleString()}</strong>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-bold">
                  ಪೂರ್ಣ ಶೇರುಗಳು: {formData.number_of_shares}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-800 text-blue-300 font-bold font-mono">
                  ಒಟ್ಟು ಜಮಾ: ₹{Number(formData.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Row 1: Book No, Sl No, Share No, Schedule Cast */}
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
                  onChange={(e) => {
                    const sc = e.target.value;
                    updateCalculation({
                      schedule_cast: sc,
                      member_type: getMemberTypeByCategory(sc)
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="ಅ - ವರ್ಗ">ಅ - ವರ್ಗ : ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Class A - ₹2,000 / ₹24,000)</option>
                  <option value="ಬ - ವರ್ಗ">ಬ - ವರ್ಗ : ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ (Class B - ₹5,000 / ₹25,000)</option>
                  <option value="ಕ - ವರ್ಗ">ಕ - ವರ್ಗ (Class C)</option>
                  <option value="ಡ - ವರ್ಗ">ಡ - ವರ್ಗ : ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ (Class D - ₹2,000 / ₹24,000)</option>
                </select>
              </div>
            </div>

            {/* Row 2: 1st Installment, Total Amount, No of Shares */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">1ನೇ ಕಂತು ರಶೀದಿ ಸಂ. (Receipt No)</label>
                <input
                  type="text"
                  value={formData.receipt_no}
                  onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">1ನೇ ಕಂತು ಮೊತ್ತ (Receipt Amount ₹) *</label>
                </div>
                <input
                  type="number"
                  required
                  value={formData.receipt_amount}
                  onChange={(e) => updateCalculation({ receipt_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">Total Amount (₹) *</label>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800">
                    ಸ್ವಯಂಚಾಲಿತ ಮೊತ್ತ
                  </span>
                </div>
                <input
                  type="number"
                  required
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">No. of Shares *</label>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800">
                    {currentCalc.completeShares} ಪೂರ್ಣ ಶೇರು
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.number_of_shares}
                  onChange={(e) => setFormData({ ...formData, number_of_shares: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Row 3: Live Remaining Balance Alert Banner */}
            {currentCalc.remainingBalance > 0 ? (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    ಮುಂದಿನ ಶೇರಿಗೆ ಜಮೆಯಾಗಿರುವ ಬಾಕಿ ಮೊತ್ತ: <strong className="text-amber-300 font-mono font-bold">₹{currentCalc.remainingBalance.toLocaleString()}</strong>.
                    (ಇನ್ನೂ <strong className="text-white font-mono">₹{currentCalc.neededForNext.toLocaleString()}</strong> ಪಾವತಿಸಿದಾಗ ಮತ್ತೊಂದು ಪೂರ್ಣ ಶೇರು ಲಭ್ಯವಾಗುತ್ತದೆ)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700">
                  ಬಾಕಿ ಮೊತ್ತ: ₹{currentCalc.remainingBalance.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    ಪಾವತಿಸಿದ ಒಟ್ಟು ಮೊತ್ತಕ್ಕೆ ಎಲ್ಲಾ <strong className="text-white font-bold font-mono">{formData.number_of_shares}</strong> ಶೇರುಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿವೆ.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                  ಬಾಕಿ: ₹0
                </span>
              </div>
            )}

            {/* 2nd Installment Section - Only shown for incomplete share amounts (1000, 3000, 5000, 7000, 9000...) */}
            {isEligibleFor2nd && (
              <div className="pt-3 mt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">2ನೇ ಕಂತು / ರಶೀದಿ (2nd Installment - ಅಪೂರ್ಣ ಶೇರು ಪೂರ್ಣಗೊಳಿಸಲು)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        ನಿಗದಿತ ಕಂತು: ₹{required2ndAmt.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ಅಪೂರ್ಣ ಶೇರಿಗೆ (₹{Number(formData.receipt_amount || 0).toLocaleString()}) ಬಾಕಿ ಇರುವ ನಿಗದಿತ 2ನೇ ಕಂತು ₹{required2ndAmt.toLocaleString()} ಪಾವತಿಸಿದಾಗ ಮತ್ತೊಂದು ಪೂರ್ಣ ಶೇರು ಲಭ್ಯವಾಗುತ್ತದೆ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showSecondInstallment;
                      setShowSecondInstallment(next);
                      if (!next) {
                        updateCalculation({ showSecondInstallment: false, amount: 0, reciept: '', date: '' });
                      } else {
                        updateCalculation({
                          showSecondInstallment: true,
                          amount: required2ndAmt || 1000,
                          date: formData.date || new Date().toLocaleDateString('en-GB')
                        });
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors ${
                      showSecondInstallment
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {showSecondInstallment ? '✓ 2ನೇ ಕಂತು ಸಕ್ರಿಯವಾಗಿದೆ (Remove)' : '+ 2ನೇ ಕಂತು ಸೇರಿಸಿ (Add)'}
                  </button>
                </div>

                {showSecondInstallment && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium text-xs">2ನೇ ಕಂತು ರಶೀದಿ ಸಂ. (2nd Receipt No)</label>
                      <input
                        type="text"
                        placeholder="e.g. 5421"
                        value={formData.reciept}
                        onChange={(e) => setFormData({ ...formData, reciept: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 font-medium text-xs">2ನೇ ಕಂತು ಮೊತ್ತ (2nd Amount ₹) *</label>
                        <span className="text-[10px] text-emerald-400 font-bold">ನಿಗದಿತ ಮೊತ್ತ: ₹{required2ndAmt.toLocaleString()}</span>
                      </div>
                      <input
                        type="number"
                        value={formData.amount || required2ndAmt || 1000}
                        onChange={(e) => updateCalculation({ amount: parseFloat(e.target.value) || required2ndAmt || 1000 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium text-xs">2ನೇ ಕಂತು ದಿನಾಂಕ (2nd Date)</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional Share Purchase Rule (Point 4 & 6) for Existing Members (<= 28/02/2022) */}
            {rateConfig.isLegacy && (
              <div className="pt-3 mt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">
                      ಪ್ರಸ್ತುತ ದರದಲ್ಲಿ ಹೆಚ್ಚುವರಿ ಶೇರು ಖರೀದಿ (Purchase Additional Share @ ₹{rateConfig.newRate.toLocaleString()})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      ಮೂಲ ಶೇರುಗಳು ಹಳೆಯ ದರದಲ್ಲೇ (₹{rateConfig.oldRate.toLocaleString()}) ಉಳಿಯುತ್ತವೆ. ಹೊಸದಾಗಿ ಖರೀದಿಸುವ ಪ್ರತಿ ಹೆಚ್ಚುವರಿ ಶೇರಿಗೆ ₹{rateConfig.newRate.toLocaleString()} ಅನ್ವಯಿಸುತ್ತದೆ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showAdditionalSection;
                      setShowAdditionalSection(next);
                      if (!next) {
                        updateCalculation({ additional_shares_count: 0, additional_amount: 0 });
                      } else {
                        updateCalculation({
                          additional_shares_count: 1,
                          additional_amount: rateConfig.newRate,
                          additional_date: formData.additional_date || new Date().toLocaleDateString('en-GB')
                        });
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors ${
                      showAdditionalSection
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {showAdditionalSection ? '✓ ಹೆಚ್ಚುವರಿ ಶೇರು ಸಕ್ರಿಯವಾಗಿದೆ (Remove)' : '+ ಹೆಚ್ಚುವರಿ ಶೇರು ಸೇರಿಸಿ (Add New Share)'}
                  </button>
                </div>

                {showAdditionalSection && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 bg-sky-950/20 p-3 rounded-xl border border-sky-900/40 mt-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium text-xs">ಖರೀದಿಸುವ ಹೆಚ್ಚುವರಿ ಶೇರುಗಳ ಸಂಖ್ಯೆ</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={formData.additional_shares_count || 1}
                        onChange={(e) => {
                          const count = parseInt(e.target.value, 10) || 0;
                          updateCalculation({
                            additional_shares_count: count,
                            additional_amount: count * rateConfig.newRate
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sky-400 font-mono font-bold text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium text-xs">ಹೆಚ್ಚುವರಿ ಶೇರು ಮೊತ್ತ (₹{rateConfig.newRate.toLocaleString()} / ಪ್ರತಿ ಶೇರು)</label>
                      <input
                        type="number"
                        readOnly
                        value={(formData.additional_shares_count || 1) * rateConfig.newRate}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium text-xs">ಹೆಚ್ಚುವರಿ ಶೇರು ರಶೀದಿ ಸಂ.</label>
                      <input
                        type="text"
                        placeholder="e.g. REC-NEW-01"
                        value={formData.additional_receipt_no || ''}
                        onChange={(e) => setFormData({ ...formData, additional_receipt_no: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium text-xs">ಖರೀದಿ ದಿನಾಂಕ</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={formData.additional_date || ''}
                        onChange={(e) => setFormData({ ...formData, additional_date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="sm:col-span-4 pt-1 text-[11px] text-sky-300/90 font-medium border-t border-sky-900/30">
                      ℹ️ ಲೆಕ್ಕಾಚಾರ: ಹಳೆಯ ದರದ ಶೇರುಗಳು: <strong className="text-white">{currentCalc.oldSharesCount}</strong> (@ ₹{rateConfig.oldRate.toLocaleString()}) + ಹೊಸ ದರದ ಹೆಚ್ಚುವರಿ ಶೇರುಗಳು: <strong className="text-white">{currentCalc.newSharesCount}</strong> (@ ₹{rateConfig.newRate.toLocaleString()}) = ಒಟ್ಟು: <strong className="text-emerald-400">{currentCalc.completeShares}</strong> ಶೇರುಗಳು | ಒಟ್ಟು ಮೊತ್ತ: <strong className="text-amber-400 font-mono">₹{currentCalc.totalAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Place & Address */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> 3. Territorial Place & Address Details (ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative" ref={placeDropdownRef}>
                <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                  <span>Place (ಗ್ರಾಮ / ಸ್ಥಳ) *</span>
                  {formData.place && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formData.circle || ''}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  list="sh-form-places-list"
                  autoComplete="off"
                  placeholder="e.g. ಬಳ್ಳೊಳ್ಳಿ, ಜೇವೂರ, ಚಡಚಣ, ಅಥರ್ಗಾ..."
                  value={formData.place}
                  onFocus={() => setShowPlaceDropdown(true)}
                  onChange={(e) => {
                    handlePlaceChange(e.target.value);
                    setShowPlaceDropdown(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                />
                <datalist id="sh-form-places-list">
                  {villages.map(v => (
                    <option key={v.village_id || v.name} value={v.name}>
                      {v.name} {v.taluk ? `(${v.taluk})` : ''}
                    </option>
                  ))}
                </datalist>

                {/* Dropdown suggestions while typing */}
                {showPlaceDropdown && filteredVillages.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-slate-800/60 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold bg-slate-950/80 sticky top-0 flex items-center justify-between">
                      <span>ಸೂಚಿಸಿದ ಗ್ರಾಮಗಳು ({filteredVillages.length})</span>
                      <span className="text-[9px] text-slate-500">ಕ್ಲಿಕ್ ಮಾಡಿ ಆಯ್ಕೆಮಾಡಿ</span>
                    </div>
                    {filteredVillages.slice(0, 30).map((v, i) => {
                      const vName = v.name || v;
                      const taluk = v.taluk || '';
                      const circleRes = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(vName) : null;
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
                          {(v.circle_name || circleRes?.circle_name) && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 group-hover:bg-emerald-900/50 text-slate-300 group-hover:text-emerald-200 font-mono">
                              {v.circle_name || circleRes?.circle_name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                <label className="block text-slate-400 mb-1 font-medium">
                  Circle (ವಲಯ) <span className="text-[10px] text-emerald-400">(Auto-derived from Place)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  title="Circle is determined strictly from Place according to the Official Circle Directory"
                  value={formData.circle}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-semibold outline-none cursor-not-allowed"
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
                <label className="block text-slate-400 mb-1 font-medium">Member Type (ಸದಸ್ಯರ ಪ್ರಕಾರ) *</label>
                <select
                  value={formData.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ'}
                  onChange={(e) => setFormData({ ...formData, member_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-semibold outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ">ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower Member)</option>
                  <option value="ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ">ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ (Non-Cane Grower Member)</option>
                  <option value="ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ">ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ (Cooperative Society / Institution)</option>
                  <option value="ನಾಮಿನಿ / ವಾರಸುದಾರ ಸದಸ್ಯ">ನಾಮಿನಿ / ವಾರಸುದಾರ ಸದಸ್ಯ (Nominee / Successor Member)</option>
                  <option value="ವರ್ಗಾವಣೆ ಪಡೆದ ಸದಸ್ಯ">ವರ್ಗಾವಣೆ ಪಡೆದ ಸದಸ್ಯ (Transferee Member)</option>
                  <option value="ಸಾಮಾನ್ಯ ಸದಸ್ಯ">ಸಾಮಾನ್ಯ ಸದಸ್ಯ (General Member)</option>
                  <option value="ಇತರೆ">ಇತರೆ (Other)</option>
                  {formData.member_type && ![
                    'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ',
                    'ಕಬ್ಬು ಬೆಳೆಗಾರಲ್ಲದ ಸದಸ್ಯ',
                    'ಸಹಕಾರ ಸಂಘ/ ಸಂಘ ಸಂಸ್ಥೆ',
                    'ನಾಮಿನಿ / ವಾರಸುದಾರ ಸದಸ್ಯ',
                    'ವರ್ಗಾವಣೆ ಪಡೆದ ಸದಸ್ಯ',
                    'ಸಾಮಾನ್ಯ ಸದಸ್ಯ',
                    'ಇತರೆ'
                  ].includes(formData.member_type) && (
                    <option value={formData.member_type}>{formData.member_type}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Ownership / ಸ್ವಾಮ್ಯತ್ವ (ಒಡೆತನ)</label>
                <input
                  type="text"
                  list="ownership-type-suggestions"
                  placeholder="ಉದಾ: ಸ್ವಂತ, ವಾರಸದಾರರು, ವರ್ಗಾವಣೆದಾರರು..."
                  value={formData.ownership || formData.relationship}
                  onChange={(e) => setFormData({ ...formData, ownership: e.target.value, relationship: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-semibold outline-none focus:border-emerald-500"
                />
                <datalist id="ownership-type-suggestions">
                  {/* 1. ಸ್ವಂತ ಒಡೆತನ (Self / Original) */}
                  <option value="ಸ್ವಂತ (Self)" />
                  <option value="ಸ್ವಂತ" />

                  {/* 2. ವಾರಸಾ ಒಡೆತನ (Varasa / Legal Heir) */}
                  <option value="ವಾರಸದಾರರು (ಮಗ)" />
                  <option value="ವಾರಸದಾರರು (ಮಗಳು)" />
                  <option value="ವಾರಸದಾರರು (ಪತ್ನಿ)" />
                  <option value="ವಾರಸದಾರರು (ಪತಿ)" />
                  <option value="ವಾರಸದಾರರು (ತಾಯಿ)" />
                  <option value="ವಾರಸದಾರರು (ತಂದೆ)" />
                  <option value="ವಾರಸದಾರರು (ಸಹೋದರ)" />
                  <option value="ವಾರಸದಾರರು (ಸೊಸೆ)" />
                  <option value="ವಾರಸದಾರರು (ಮೊಮ್ಮಗ)" />
                  <option value="ವಾರಸದಾರರು (ಇತರೆ)" />
                  <option value="ವಾರಸದಾರರು" />

                  {/* 3. ವರ್ಗಾವಣೆ ಒಡೆತನ (Vargavane / Share Transfer) */}
                  <option value="ವರ್ಗಾವಣೆ (Transfer)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಮಗ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಮಗಳು)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಪತ್ನಿ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಪತಿ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಸಹೋದರ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ತಾಯಿ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ತಂದೆ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಸೊಸೆ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಮೊಮ್ಮಗ)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಖರೀದಿದಾರರು)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು (ಇತರೆ ಸದಸ್ಯರು)" />
                  <option value="ವರ್ಗಾವಣೆದಾರರು" />
                  <option value="ವರ್ಗಾವಣೆ" />
                </datalist>
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

          {/* Section 6: Biometrics & Photos (ಭಾವಚಿತ್ರ, ಸಹಿ ಮತ್ತು ಹೆಬ್ಬೆರಳಿನ ಗುರುತು) */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" /> 6. Shareholder Photo, Signature & Thumb Impression (ಭಾವಚಿತ್ರ, ಸಹಿ ಮತ್ತು ಹೆಬ್ಬೆರಳಿನ ಗುರುತು)
              </h3>
              <span className="text-[11px] text-slate-400">
                Supports JPG, PNG, WEBP • Auto-compressed for instant saving
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. Shareholder Photo */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center group hover:border-emerald-500/40 transition-all shadow-md">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" /> Photo (ಭಾವಚಿತ್ರ)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formData.photo_url ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {formData.photo_url ? '✓ Uploaded' : 'Pending'}
                  </span>
                </div>

                <div className="w-32 h-36 rounded-xl border-2 border-dashed border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center relative mb-3 shadow-inner group-hover:border-emerald-500/50 transition-colors">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Shareholder Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <User className="w-10 h-10 mx-auto mb-1 opacity-40 text-emerald-400" />
                      <span className="text-[10px] font-medium">No Photo Selected</span>
                    </div>
                  )}
                  {uploadingState.photo && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.photo_url ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('photo', e.target.files[0])}
                    />
                  </label>
                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('photo')}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Signature */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center group hover:border-sky-500/40 transition-all shadow-md">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-sky-400" /> Signature (ಸಹಿ)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formData.signature_url ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {formData.signature_url ? '✓ Uploaded' : 'Pending'}
                  </span>
                </div>

                <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center relative mb-3 shadow-inner p-2 group-hover:border-sky-500/50 transition-colors">
                  {formData.signature_url ? (
                    <img src={formData.signature_url} alt="Shareholder Signature" className="max-w-full max-h-full object-contain filter invert dark:invert-0 bg-white/5 rounded p-1" />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <FileSignature className="w-10 h-10 mx-auto mb-1 opacity-40 text-sky-400" />
                      <span className="text-[10px] font-medium">No Signature Selected</span>
                    </div>
                  )}
                  {uploadingState.signature && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-950/50">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.signature_url ? 'Change Sign' : 'Upload Signature'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('signature', e.target.files[0])}
                    />
                  </label>
                  {formData.signature_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('signature')}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition-colors cursor-pointer"
                      title="Remove Signature"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Thumb Impression */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center group hover:border-amber-500/40 transition-all shadow-md">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-400" /> Thumb (ಹೆಬ್ಬೆರಳು)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${formData.thumb_url ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {formData.thumb_url ? '✓ Uploaded' : 'Pending'}
                  </span>
                </div>

                <div className="w-32 h-36 rounded-xl border-2 border-dashed border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center relative mb-3 shadow-inner p-2 group-hover:border-amber-500/50 transition-colors">
                  {formData.thumb_url ? (
                    <img src={formData.thumb_url} alt="Thumb Impression" className="max-w-full max-h-full object-contain filter invert dark:invert-0 bg-white/5 rounded p-1" />
                  ) : (
                    <div className="text-center p-2 text-slate-500">
                      <Fingerprint className="w-10 h-10 mx-auto mb-1 opacity-40 text-amber-400" />
                      <span className="text-[10px] font-medium">No Thumb Impression</span>
                    </div>
                  )}
                  {uploadingState.thumb && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/50">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.thumb_url ? 'Change Thumb' : 'Upload Thumb'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('thumb', e.target.files[0])}
                    />
                  </label>
                  {formData.thumb_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('thumb')}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition-colors cursor-pointer"
                      title="Remove Thumb"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Revision History & Audit Trail */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" /> 7. ಬದಲಾವಣೆಗಳ ಇತಿಹಾಸ ಹಾಗೂ ಲೆಕ್ಕಪರಿಶೋಧನಾ ದಾಖಲೆ (Revision History & Audit Trail)
              </h3>
              {initialData && (
                <span className="text-[11px] text-slate-400 font-mono">
                  ಒಟ್ಟು ತಿದ್ದುಪಡಿಗಳು: <strong className="text-blue-400">{historyList.length}</strong>
                </span>
              )}
            </div>

            {/* Note / Reason for current edit */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                ಈ ತಿದ್ದುಪಡಿಯ ಕಾರಣ / ಆಪರೇಟರ್ ಟಿಪ್ಪಣಿ (Reason or Operator Note for this Revision)
              </label>
              <input
                type="text"
                placeholder="ಉದಾಹರಣೆಗೆ: ಗ್ರಾಮ/ವಿಳಾಸ ಬದಲಾವಣೆ, ವಾರಸುದಾರರ ಸೇರ್ಪಡೆ, 2ನೇ ಕಂತು ಜಮೆ, ಮೊಬೈಲ್ ನಂಬರ್ ತಿದ್ದುಪಡಿ..."
                value={formData.history_notes || ''}
                onChange={(e) => setFormData({ ...formData, history_notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Prior Revisions List */}
            {initialData && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> ಹಿಂದಿನ ಬದಲಾವಣೆಗಳ ಪಟ್ಟಿ (Past Revision History):
                </span>

                {historyList.length > 0 ? (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {historyList.map((rev, revIdx) => (
                      <div key={rev.id || revIdx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-950 text-blue-300 border border-blue-900 text-[10px]">
                              #{revIdx + 1} ತಿದ್ದುಪಡಿ
                            </span>
                            <span className="text-slate-300 font-mono flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" /> {rev.dateFormatted || rev.timestamp?.substring(0, 16)}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            ಆಪರೇಟರ್: <strong className="text-slate-200">{rev.operator || 'Admin'}</strong>
                          </span>
                        </div>

                        {rev.notes && (
                          <p className="text-[11px] text-amber-300/95 font-medium">
                            📝 ಟಿಪ್ಪಣಿ: {rev.notes}
                          </p>
                        )}

                        {/* List of changed fields */}
                        {Array.isArray(rev.changes) && rev.changes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {rev.changes.map((c, cIdx) => (
                              <div key={cIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
                                <span className="font-semibold text-sky-300">{c.field}:</span>
                                <span className="text-rose-400/90 line-through max-w-[140px] truncate" title={c.from}>{c.from || '—'}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                <span className="text-emerald-400 font-bold max-w-[160px] truncate" title={c.to}>{c.to || '—'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-400 flex flex-col gap-1.5">
                    <span className="text-slate-200 font-semibold flex items-center gap-1">
                      🏛️ ಮೂಲ ಶಾಸನಬದ್ಧ ನೊಂದಣಿ ದಾಖಲೆ (Original Statutory Ledger Record):
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300 text-[11px]">
                      <span>ನೊಂದಣಿ ದಿನಾಂಕ: <strong className="text-white">{initialData.reg_date || '10/Aug/1982'}</strong></span>
                      <span>ಬುಕ್ ಸಂಖ್ಯೆ: <strong className="text-sky-400 font-mono">{initialData.book_no || 'B.No: 1'}</strong></span>
                      <span>ಠರಾವು ಸಂಖ್ಯೆ: <strong className="text-white font-mono">{initialData.tharava_no || 'TR-01/1982'}</strong></span>
                      <span>ಶೇರು ಸಂಖ್ಯೆ: <strong className="text-emerald-400 font-mono">#{initialData.share_no}</strong></span>
                    </div>
                    <span className="text-slate-500 text-[10px] mt-0.5">
                      ಈ ಶೇರುದಾರರಿಗೆ ಯಾವುದೇ ಹಿಂದಿನ ತಿದ್ದುಪಡಿಗಳಿಲ್ಲ. ಪ್ರಸ್ತುತ ನಮೂನೆಯಲ್ಲಿ ಅಗತ್ಯ ತಿದ್ದುಪಡಿಗಳನ್ನು ಮಾಡಿ ಉಳಿಸಿದಾಗ, ಮೊದಲ ತಿದ್ದುಪಡಿ ದಾಖಲೆಯಾಗಿ ಅಧಿಕೃತವಾಗಿ ಉಳಿಯುತ್ತದೆ.
                    </span>
                  </div>
                )}
              </div>
            )}
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
