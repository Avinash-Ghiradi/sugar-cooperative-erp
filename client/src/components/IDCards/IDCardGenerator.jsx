import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import OfficialShareholderIDCard, {
  getCustomIdCardSettings,
  saveCustomIdCardSettings,
  resetCustomIdCardSettings,
  makeSignatureTransparent,
  compressBackgroundImage
} from './OfficialShareholderIDCard';
import {
  Contact, Printer, Search, RefreshCw, CheckCircle2, ShieldCheck,
  BookOpen, Eye, Image as ImageIcon, SlidersHorizontal, RotateCw, X, Download, Filter,
  Upload, Trash2, Check, Sparkles
} from 'lucide-react';

export default function IDCardGenerator() {
  const [shareholders, setShareholders] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [cardSide, setCardSide] = useState('Front'); // 'Front' or 'Back'
  const [showSeal, setShowSeal] = useState(true);
  const [search, setSearch] = useState('');
  const [circleFilter, setCircleFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [circles, setCircles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState(null);
  const [showReferenceSample, setShowReferenceSample] = useState(false);
  const [printLayout, setPrintLayout] = useState('pvc'); // 'pvc' (single) or 'a4' (sheet)

  // Custom ID Card Upload Settings (Background & MD Signature)
  const [customSettings, setCustomSettings] = useState(getCustomIdCardSettings());
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  const bgFileInputRef = useRef(null);
  const sigFileInputRef = useRef(null);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadShareholders();
  }, [search, circleFilter, placeFilter]);

  useEffect(() => {
    const handleUpdate = () => {
      setCustomSettings(getCustomIdCardSettings());
    };
    window.addEventListener('id_card_settings_updated', handleUpdate);
    return () => window.removeEventListener('id_card_settings_updated', handleUpdate);
  }, []);

  const loadFilters = async () => {
    const cRes = await ApiService.getCircles();
    if (cRes && cRes.data) {
      setCircles([...cRes.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
    }
    const vRes = await ApiService.getVillages();
    if (vRes && vRes.data) {
      setPlaces([...vRes.data].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'kn')));
    }
  };

  const loadShareholders = async () => {
    setLoading(true);
    const res = await ApiService.getShareholders({
      page: 1,
      limit: 24,
      search,
      circle: circleFilter,
      place: placeFilter
    });
    if (res && res.data) {
      setShareholders(res.data);
      if (selectedCards.length === 0 && res.data.length > 0) {
        setSelectedCards(res.data.slice(0, 4));
      }
    }
    setLoading(false);
  };

  const toggleSelectCard = (sh) => {
    const shId = sh.shareholder_id || sh.id;
    if (selectedCards.some(c => (c.shareholder_id || c.id) === shId)) {
      setSelectedCards(prev => prev.filter(c => (c.shareholder_id || c.id) !== shId));
    } else {
      setSelectedCards(prev => [...prev, sh]);
    }
  };

  const isSelected = (sh) => {
    const shId = sh.shareholder_id || sh.id;
    return selectedCards.some(c => (c.shareholder_id || c.id) === shId);
  };

  const handlePrint = () => {
    window.print();
  };

  // Upload Background Image Handler
  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const dataUrl = await compressBackgroundImage(file, 1200, 800, 0.9);
      const newSettings = { ...customSettings, customBackground: dataUrl };
      setCustomSettings(newSettings);
      saveCustomIdCardSettings(newSettings);
      setUploadSuccessMsg('ID Card front background image uploaded and applied successfully!');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to process background image: ' + err.message);
    } finally {
      setUploadLoading(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    }
  };

  // Upload MD Signature Handler (with auto white-background removal)
  const handleMdSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const transparentSigUrl = await makeSignatureTransparent(file);
      const newSettings = { ...customSettings, customMdSignature: transparentSigUrl };
      setCustomSettings(newSettings);
      saveCustomIdCardSettings(newSettings);
      setUploadSuccessMsg('Managing Director signature uploaded with transparent background!');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to process signature: ' + err.message);
    } finally {
      setUploadLoading(false);
      if (sigFileInputRef.current) sigFileInputRef.current.value = '';
    }
  };

  const handleResetBackground = () => {
    const newSettings = { ...customSettings, customBackground: '', hideHeader: false };
    setCustomSettings(newSettings);
    saveCustomIdCardSettings(newSettings);
    setUploadSuccessMsg('Restored default official factory background.');
    setTimeout(() => setUploadSuccessMsg(''), 3000);
  };

  const handleResetMdSignature = () => {
    const newSettings = { ...customSettings, customMdSignature: '' };
    setCustomSettings(newSettings);
    saveCustomIdCardSettings(newSettings);
    setUploadSuccessMsg('Restored default official MD signature.');
    setTimeout(() => setUploadSuccessMsg(''), 3000);
  };

  const handleResetAllSettings = () => {
    resetCustomIdCardSettings();
    setCustomSettings(getCustomIdCardSettings());
    setUploadSuccessMsg('All card settings reset to official statutory defaults.');
    setTimeout(() => setUploadSuccessMsg(''), 3000);
  };

  const hasCustomizations = !!(customSettings.customBackground || customSettings.customMdSignature || customSettings.hideHeader || !customSettings.showSugarcaneWatermark);

  return (
    <div className="space-y-6" style={{ fontFamily: "'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif" }}>
      {/* Print Stylesheet Injection */}
      <style>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .id-card-print-sheet {
            display: grid !important;
            grid-template-columns: repeat(2, 85.6mm) !important;
            gap: 6mm !important;
            justify-content: center !important;
            padding: 10mm !important;
            page-break-after: always !important;
          }
          .id-card-print-single {
            width: 85.6mm !important;
            height: 54mm !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 no-print shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Contact className="w-5 h-5 text-emerald-400" /> ಸದಸ್ಯರ ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ (Official Shareholder ID Cards)
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              B.S.S.K.N. Official Format
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
              Google ಅನೇಕ ಕನ್ನಡ (Anek Kannada)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ, ನಿ. ಮರೂರ (ತಾ॥ ಚಡಚಣ ಜಿ॥ ವಿಜಯಪುರ) • Plastic PVC & A4 Sheet ID Generation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Uploads Settings Button */}
          <button
            onClick={() => setShowCustomizerModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              hasCustomizations
                ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/60 hover:bg-emerald-600/35 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
            title="Upload Custom Card Background or MD Signature"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ಹಿನ್ನೆಲೆ & MD ಸಹಿ ಅಪ್ಲೋಡ್</span>
            {hasCustomizations && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          {/* Reference Sample Comparison Toggle */}
          <button
            onClick={() => setShowReferenceSample(!showReferenceSample)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showReferenceSample
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {showReferenceSample ? 'Hide Sample Reference' : 'Compare with Sample Photo'}
          </button>

          {/* Front / Back Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCardSide('Front')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                cardSide === 'Front'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ಮುಂಭಾಗ (Front)
            </button>
            <button
              onClick={() => setCardSide('Back')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                cardSide === 'Back'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ಹಿಂಬದಿ (Back)
            </button>
          </div>

          {/* Official Seal Toggle */}
          <button
            onClick={() => setShowSeal(!showSeal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              showSeal
                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Official Purple Cooperative Rubber Stamp"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {showSeal ? 'ಅಧಿಕೃತ ಮೊಹರು (Seal: ON)' : 'Seal: OFF'}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={selectedCards.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> ಮುದ್ರಣ ({selectedCards.length} Cards)
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs flex items-center justify-between animate-fadeIn no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
          <button onClick={() => setUploadSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reference Comparison Banner */}
      {showReferenceSample && (
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 no-print space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <h3 className="text-xs font-bold text-amber-300">
                Official Statutory ID Card Format Reference (ಅಧಿಕೃತ ಮಾದರಿ ಹೋಲಿಕೆ)
              </h3>
            </div>
            <button
              onClick={() => setShowReferenceSample(false)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400">1. Original Physical ID Card Issued to Member:</span>
              <div className="rounded-xl overflow-hidden border border-slate-700 max-w-[370px] shadow-lg">
                <img
                  src="/official_id_card_sample.jpg"
                  alt="Original ID Card Sample"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400">2. Live Dynamic Generated Card with Database Data (Google ಅನೇಕ ಕನ್ನಡ):</span>
              <div className="max-w-[372px]">
                {shareholders.length > 0 && (
                  <OfficialShareholderIDCard
                    shareholder={shareholders[0]}
                    side={cardSide}
                    showSeal={showSeal}
                    scale={1}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selector & Filter Controls */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">
              Select Shareholders for Printing ({selectedCards.length} selected)
            </span>
            <span className="text-xs text-slate-500">|</span>
            <button
              onClick={() => setSelectedCards(shareholders)}
              className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Select All on Page
            </button>
            <span className="text-xs text-slate-500">•</span>
            <button
              onClick={() => setSelectedCards([])}
              className="text-xs text-slate-400 hover:underline font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Print Layout Mode */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Layout:</span>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none text-xs"
            >
              <option value="pvc">CR80 Plastic Card Format (Single)</option>
              <option value="a4">A4 Sheet (8 Cards per Sheet)</option>
            </select>
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Name (ಕನ್ನಡ/English), Share No, Book No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={circleFilter}
              onChange={(e) => setCircleFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">All Circles (ಎಲ್ಲಾ ವಲಯಗಳು)</option>
              {circles.map(c => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">All Villages/Places (ಎಲ್ಲಾ ಗ್ರಾಮಗಳು)</option>
              {places.map(p => (
                <option key={p.id || p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards Workbench Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs">Loading shareholder records for ID card generation...</p>
        </div>
      ) : shareholders.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-slate-300">No shareholders found matching the search criteria.</p>
          <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 id-card-grid">
          {shareholders.map((sh, idx) => {
            const selected = isSelected(sh);
            return (
              <div
                key={sh.id || idx}
                className={`p-3 rounded-2xl border transition-all relative group flex flex-col items-center ${
                  selected
                    ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Selection Overlay & Card Actions */}
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 no-print text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelectCard(sh)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <span className={`font-semibold ${selected ? 'text-emerald-400' : 'text-slate-400'}`}>
                      Share #{sh.share_no || sh.share_number}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewCard(sh)}
                      title="Enlarge & Print Single"
                      className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Render the Exact Official ID Card */}
                <div className="cursor-pointer" onClick={() => toggleSelectCard(sh)}>
                  <OfficialShareholderIDCard
                    shareholder={sh}
                    side={cardSide}
                    showSeal={showSeal}
                    scale={0.96}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HIDDEN PRINT-ONLY CONTAINER (for window.print()) */}
      <div className="hidden print:block id-card-print-sheet">
        {(selectedCards.length > 0 ? selectedCards : shareholders).map((sh, idx) => (
          <div key={`print-${sh.id || idx}`} className="id-card-print-single mb-4">
            <OfficialShareholderIDCard
              shareholder={sh}
              side={cardSide}
              showSeal={showSeal}
              scale={1}
            />
          </div>
        ))}
      </div>

      {/* CUSTOMIZATION & UPLOAD MODAL (Background & MD Signature) */}
      {showCustomizerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                    ಕಾರ್ಡ್ ಹಿನ್ನೆಲೆ & MD ಸಹಿ ಕಸ್ಟಮೈಸೇಶನ್ (Background & MD Signature)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Custom Uploads
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Upload custom background artwork for the front of the ID card and signature of the Managing Director (ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು).
                </p>
              </div>

              <button
                onClick={() => setShowCustomizerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* SECTION 1: Front Page Background Image Upload */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" /> 1. ಕಾರ್ಡ್ ಮುಂಭಾಗದ ಹಿನ್ನೆಲೆ (Front Background)
                  </h4>
                  {customSettings.customBackground && (
                    <button
                      onClick={handleResetBackground}
                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Reset Default
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upload your society's custom pre-printed card design, template, or custom graphics (PNG, JPG, WebP).
                </p>

                {/* Thumbnail Preview */}
                <div className="w-full h-32 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center relative shadow-inner">
                  {customSettings.customBackground ? (
                    <img
                      src={customSettings.customBackground}
                      alt="Custom Background Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-500">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <span className="text-[11px] font-medium text-slate-400 block">Default Official Factory Mint & Sugarcane Graphic</span>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  ref={bgFileInputRef}
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadLoading}
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  {customSettings.customBackground ? 'Change Background Image' : '+ Upload Background Image (ಹಿನ್ನೆಲೆ ಅಪ್ಲೋಡ್)'}
                </button>

                {/* Extra Options for Pre-printed cards */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={customSettings.hideHeader}
                      onChange={(e) => {
                        const newSettings = { ...customSettings, hideHeader: e.target.checked };
                        setCustomSettings(newSettings);
                        saveCustomIdCardSettings(newSettings);
                      }}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span className="text-[11px]">
                      Hide Society Header Bar (ಚಿತ್ರದಲ್ಲೇ ಹೆಡರ್ ಮುದ್ರಿತವಾಗಿದ್ದರೆ)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={customSettings.showSugarcaneWatermark}
                      onChange={(e) => {
                        const newSettings = { ...customSettings, showSugarcaneWatermark: e.target.checked };
                        setCustomSettings(newSettings);
                        saveCustomIdCardSettings(newSettings);
                      }}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span className="text-[11px]">
                      Show Sugarcane Watermark (ಕಬ್ಬಿನ ಗಿಡದ ವಾಟರ್‌ಮಾರ್ಕ್)
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: Managing Director (MD) Signature Upload */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> 2. ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರ ಸಹಿ (MD Signature)
                  </h4>
                  {customSettings.customMdSignature && (
                    <button
                      onClick={handleResetMdSignature}
                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Reset Default
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upload official signature image. Photos/scans on white paper will <strong>automatically have their white background removed into transparent ink</strong>!
                </p>

                {/* Signature Preview */}
                <div className="w-full h-32 rounded-xl border border-slate-700 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:16px_16px] bg-slate-950 flex flex-col items-center justify-center relative p-3">
                  {customSettings.customMdSignature ? (
                    <>
                      <img
                        src={customSettings.customMdSignature}
                        alt="Custom MD Signature Preview"
                        className="max-h-16 max-w-full object-contain filter drop-shadow-sm"
                      />
                      <span className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Custom MD Signature Active</span>
                    </>
                  ) : (
                    <>
                      <img
                        src="/id_assets/md_signature_transparent.png"
                        alt="Default MD Signature"
                        className="max-h-16 max-w-full object-contain"
                      />
                      <span className="text-[10px] text-slate-400 mt-1">Default Official MD Signature (Green Ink)</span>
                    </>
                  )}
                </div>

                {/* Upload Button */}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  ref={sigFileInputRef}
                  onChange={handleMdSignatureUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadLoading}
                  onClick={() => sigFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  {customSettings.customMdSignature ? 'Change MD Signature' : '+ Upload MD Signature (MD ಸಹಿ ಅಪ್ಲೋಡ್)'}
                </button>

                <p className="text-[10.5px] text-slate-400 italic pt-1">
                  💡 Tip: You can photograph or scan the MD's signature directly on paper. Our system automatically makes it transparent.
                </p>
              </div>
            </div>

            {/* LIVE CARD PREVIEW with Custom Settings */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> ಲೈವ್ ಕಾರ್ಡ್ ಮುನ್ನೋಟ (Live Card Preview with Custom Settings)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Font: Google ಅನೇಕ ಕನ್ನಡ (Anek Kannada)
                </span>
              </div>

              <div className="py-2 flex justify-center">
                {shareholders.length > 0 && (
                  <OfficialShareholderIDCard
                    shareholder={shareholders[0]}
                    side="Front"
                    showSeal={showSeal}
                    customBackground={customSettings.customBackground}
                    customMdSignature={customSettings.customMdSignature}
                    hideHeader={customSettings.hideHeader}
                    showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                    scale={1.1}
                  />
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAllSettings}
                className="text-xs text-rose-400 hover:underline font-semibold"
              >
                Reset All to Official Defaults
              </button>

              <button
                type="button"
                onClick={() => setShowCustomizerModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> ಮುಗಿಯಿತು & ಅನ್ವಯಿಸಿ (Done & Apply)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE CARD PREVIEW & PRINT MODAL */}
      {previewCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 no-print">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Contact className="w-4 h-4 text-emerald-400" />
                  ಸದಸ್ಯರ ಗುರುತಿನ ಚೀಟಿ ಮುನ್ನೋಟ (ID Card Preview)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {previewCard.shareholder_name || previewCard.name} • Share #{previewCard.share_no}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCardSide(cardSide === 'Front' ? 'Back' : 'Front')}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <RotateCw className="w-3 h-3 text-emerald-400" />
                  Flip to {cardSide === 'Front' ? 'Back' : 'Front'}
                </button>
                <button
                  onClick={() => setPreviewCard(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Enlarged Card Presentation */}
            <div className="py-4 flex justify-center bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4">
              <OfficialShareholderIDCard
                shareholder={previewCard}
                side={cardSide}
                showSeal={showSeal}
                scale={1.2}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Statutory Plastic PVC Card Format (85.6mm x 54mm)
              </span>

              <button
                onClick={() => {
                  setSelectedCards([previewCard]);
                  setTimeout(() => window.print(), 100);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> ಈ ಗುರುತಿನ ಚೀಟಿ ಮುದ್ರಿಸಿ (Print This Card)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
