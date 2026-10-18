import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/api';
import OfficialShareholderIDCard, {
  getCustomIdCardSettings,
  saveCustomIdCardSettings,
  resetCustomIdCardSettings,
  makeSignatureTransparent,
  compressBackgroundImage,
  compressLogoImage
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
  const [printSides, setPrintSides] = useState('both'); // 'both' (Front & Back), 'front', 'back'
  const [showSeal, setShowSeal] = useState(true);
  const [search, setSearch] = useState('');
  const [circleFilter, setCircleFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState('');
  const [circles, setCircles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState(null);
  const [showReferenceSample, setShowReferenceSample] = useState(false);
  const [printLayout, setPrintLayout] = useState('a4'); // 'a4' (sheet) or 'pvc' (single)

  // Custom ID Card Upload Settings (Logo, Background & MD Signature)
  const [customSettings, setCustomSettings] = useState(getCustomIdCardSettings());
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  const logoFileInputRef = useRef(null);
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
        setSelectedCards([res.data[0]]); // Default to 1 selected member
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
    if (selectedCards.length === 0) {
      alert('ದಯವಿಟ್ಟು ಮುದ್ರಿಸಲು ಕನಿಷ್ಠ 1 ಶೇರುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ (Please select at least 1 shareholder to print)');
      return;
    }
    window.print();
  };

  const handlePrintSingle = (sh) => {
    setSelectedCards([sh]);
    setTimeout(() => window.print(), 80);
  };

  // Upload Factory Logo Handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const dataUrl = await compressLogoImage(file, 400, 400);
      const newSettings = { ...customSettings, customLogo: dataUrl };
      setCustomSettings(newSettings);
      saveCustomIdCardSettings(newSettings);
      setUploadSuccessMsg('ಕಾರ್ಖಾನೆಯ ಲೋಗೋ ಅಪ್ಲೋಡ್ ಮಾಡಲಾಗಿದೆ (Factory logo uploaded and applied successfully)!');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to process logo image: ' + err.message);
    } finally {
      setUploadLoading(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleResetLogo = () => {
    const newSettings = { ...customSettings, customLogo: '' };
    setCustomSettings(newSettings);
    saveCustomIdCardSettings(newSettings);
    setUploadSuccessMsg('ಮೂಲ ಅಧಿಕೃತ ಕಾರ್ಖಾನೆ ಲೋಗೋ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ (Restored default official factory logo).');
    setTimeout(() => setUploadSuccessMsg(''), 3000);
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

  const hasCustomizations = !!(customSettings.customLogo || customSettings.customBackground || customSettings.customMdSignature || customSettings.hideHeader || !customSettings.showSugarcaneWatermark);

  return (
    <div className="space-y-6" style={{ fontFamily: "'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif" }}>
      {/* Print Stylesheet Injection */}
      <style>{`
        @media print {
          @page {
            ${printLayout === 'a4'
              ? 'size: A4 portrait; margin: 10mm 12mm;'
              : 'size: 85.6mm 54mm; margin: 0;'
            }
          }
          body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
            visibility: hidden !important;
          }
          /* CR80 Physical Dimensions: 85.6mm x 54mm */
          .id-card-print-single {
            width: 85.6mm !important;
            height: 54mm !important;
            max-width: 85.6mm !important;
            max-height: 54mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            position: relative !important;
            display: inline-block !important;
            vertical-align: top !important;
          }
          .id-card-print-single .id-card-container-outer {
            width: 372px !important;
            height: 238px !important;
            min-width: 372px !important;
            min-height: 238px !important;
            transform: scale(0.86) !important;
            transform-origin: 0 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .id-card-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          /* A4 Layout Styles */
          .id-card-a4-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 186mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          .id-card-a4-pairs-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 6mm !important;
            align-items: center !important;
          }
          .id-card-a4-member-pair {
            display: flex !important;
            flex-direction: row !important;
            gap: 6mm !important;
            justify-content: center !important;
            align-items: center !important;
            page-break-inside: avoid !important;
          }
          .id-card-a4-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 85.6mm) !important;
            gap: 6mm !important;
            justify-content: center !important;
            page-break-inside: avoid !important;
          }
          .id-card-print-pvc-list {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
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
            ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
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
            title="Upload Custom Card Logo, Background or MD Signature"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ಲೋಗೋ, ಹಿನ್ನೆಲೆ & MD ಸಹಿ</span>
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

          {/* Print Layout Format Toggle (A4 Sheet vs CR80 PVC Card) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ಫಾರ್ಮ್ಯಾಟ್:</span>
            <button
              onClick={() => setPrintLayout('a4')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                printLayout === 'a4'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="A4 Sheet (Prints Front & Back side-by-side on A4 paper)"
            >
              A4 ಹಾಳೆ (A4 Sheet)
            </button>
            <button
              onClick={() => setPrintLayout('pvc')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                printLayout === 'pvc'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="CR80 Plastic Card Printer (Separate cards)"
            >
              PVC ಕಾರ್ಡ್ (CR80)
            </button>
          </div>

          {/* Print Sides Toggle (Both Sides / Front Only / Back Only) */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ಮುದ್ರಣ:</span>
            <button
              onClick={() => setPrintSides('both')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                printSides === 'both'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Print Both Pages (Front and Back on 2 pages)"
            >
              ಎರಡೂ ಬದಿಗಳು (Both Sides)
            </button>
            <button
              onClick={() => setPrintSides('front')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                printSides === 'front'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Print Front page only"
            >
              ಮುಂಭಾಗ
            </button>
            <button
              onClick={() => setPrintSides('back')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                printSides === 'back'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Print Back page only"
            >
              ಹಿಂಬದಿ
            </button>
          </div>

          {/* Screen Preview Side Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider hidden lg:inline">ವೀಕ್ಷಣೆ:</span>
            <button
              onClick={() => setCardSide('Front')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                cardSide === 'Front'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ಮುಂಭಾಗ
            </button>
            <button
              onClick={() => setCardSide('Back')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                cardSide === 'Back'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ಹಿಂಬದಿ
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
            title={`Print ${selectedCards.length} Cards (${printSides === 'both' ? 'Both Pages: Front & Back' : printSides === 'front' ? 'Front Side Only' : 'Back Side Only'})`}
          >
            <Printer className="w-4 h-4" /> ಮುದ್ರಣ ({selectedCards.length} Cards • {printSides === 'both' ? 'ಎರಡೂ ಬದಿಗಳು' : printSides === 'front' ? 'ಮುಂಭಾಗ' : 'ಹಿಂಬದಿ'})
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
                    customLogo={customSettings.customLogo}
                    customBackground={customSettings.customBackground}
                    customMdSignature={customSettings.customMdSignature}
                    hideHeader={customSettings.hideHeader}
                    showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
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
            <span className="text-slate-400">Layout (ಫಾರ್ಮ್ಯಾಟ್):</span>
            <select
              value={printLayout}
              onChange={(e) => setPrintLayout(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 outline-none text-xs"
            >
              <option value="a4">A4 Sheet (ಹಾಳೆಯ ಮುದ್ರಣ)</option>
              <option value="pvc">CR80 Plastic Card Format (PVC ಕಾರ್ಡ್)</option>
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

      {/* Cards Workbench Grid (ON-SCREEN ONLY - Hidden in Print) */}
      <div className="no-print">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
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
                        onClick={() => handlePrintSingle(sh)}
                        title="Print this card directly"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>ಮುದ್ರಣ</span>
                      </button>

                      <button
                        onClick={() => setPreviewCard(sh)}
                        title="Enlarge & Inspect Preview"
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
                      customLogo={customSettings.customLogo}
                      customBackground={customSettings.customBackground}
                      customMdSignature={customSettings.customMdSignature}
                      hideHeader={customSettings.hideHeader}
                      showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                      scale={0.96}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HIDDEN PRINT-ONLY CONTAINER (for window.print()) */}
      <div className="hidden print:block printable-area">
        {(() => {
          const cardsToPrint = selectedCards.length > 0 ? selectedCards : (previewCard ? [previewCard] : []);
          if (cardsToPrint.length === 0) return null;

          if (printLayout === 'a4') {
            return (
              <div className="id-card-a4-sheet">
                {printSides === 'both' ? (
                  <div className="id-card-a4-pairs-container">
                    {cardsToPrint.map((sh, idx) => (
                      <div key={`a4-pair-${sh.id || idx}`} className="id-card-a4-member-pair">
                        <div className="id-card-print-single">
                          <OfficialShareholderIDCard
                            shareholder={sh}
                            side="Front"
                            showSeal={showSeal}
                            customLogo={customSettings.customLogo}
                            customBackground={customSettings.customBackground}
                            customMdSignature={customSettings.customMdSignature}
                            hideHeader={customSettings.hideHeader}
                            showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                            scale={1}
                          />
                        </div>
                        <div className="id-card-print-single">
                          <OfficialShareholderIDCard
                            shareholder={sh}
                            side="Back"
                            showSeal={showSeal}
                            customLogo={customSettings.customLogo}
                            customBackground={customSettings.customBackground}
                            customMdSignature={customSettings.customMdSignature}
                            hideHeader={customSettings.hideHeader}
                            showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                            scale={1}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="id-card-a4-grid">
                    {cardsToPrint.map((sh, idx) => (
                      <div key={`a4-single-${sh.id || idx}`} className="id-card-print-single">
                        <OfficialShareholderIDCard
                          shareholder={sh}
                          side={printSides === 'front' ? 'Front' : 'Back'}
                          showSeal={showSeal}
                          customLogo={customSettings.customLogo}
                          customBackground={customSettings.customBackground}
                          customMdSignature={customSettings.customMdSignature}
                          hideHeader={customSettings.hideHeader}
                          showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                          scale={1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // PVC Mode (Single Card CR80)
          return (
            <div className="id-card-print-pvc-list">
              {cardsToPrint.map((sh, idx) => {
                const sides = printSides === 'both' ? ['Front', 'Back'] : [printSides === 'front' ? 'Front' : 'Back'];
                return sides.map((sideName) => (
                  <div
                    key={`pvc-${sh.id || idx}-${sideName}`}
                    className="id-card-print-single id-card-page-break"
                  >
                    <OfficialShareholderIDCard
                      shareholder={sh}
                      side={sideName}
                      showSeal={showSeal}
                      customLogo={customSettings.customLogo}
                      customBackground={customSettings.customBackground}
                      customMdSignature={customSettings.customMdSignature}
                      hideHeader={customSettings.hideHeader}
                      showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                      scale={1}
                    />
                  </div>
                ));
              })}
            </div>
          );
        })()}
      </div>

      {/* CUSTOMIZATION & UPLOAD MODAL (Logo, Background & MD Signature) */}
      {showCustomizerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                    ಕಾರ್ಡ್ ಲೋಗೋ, ಹಿನ್ನೆಲೆ & MD ಸಹಿ ಕಸ್ಟಮೈಸೇಶನ್ (Logo, Background & MD Signature)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Custom Uploads
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ. | Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204, Tq|| Chadachan, Dist|| Vijayapur
                </p>
              </div>

              <button
                onClick={() => setShowCustomizerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Options Grid: 3-column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* SECTION 1: Factory Logo Upload */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" /> 1. ಕಾರ್ಖಾನೆ ಲೋಗೋ (Factory Logo)
                    </h4>
                    {customSettings.customLogo && (
                      <button
                        onClick={handleResetLogo}
                        className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Upload official factory emblem/logo (PNG with transparency recommended, JPG, WebP).
                  </p>

                  {/* Thumbnail Preview */}
                  <div className="w-full h-32 rounded-xl border border-slate-700 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:16px_16px] bg-slate-950 flex flex-col items-center justify-center relative p-2 shadow-inner">
                    {customSettings.customLogo ? (
                      <>
                        <img
                          src={customSettings.customLogo}
                          alt="Custom Factory Logo Preview"
                          className="max-h-20 max-w-full object-contain filter drop-shadow-md"
                        />
                        <span className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Custom Logo Active</span>
                      </>
                    ) : (
                      <>
                        <img
                          src="/id_assets/bsskn_logo.png"
                          alt="Default Official Factory Logo"
                          className="max-h-20 max-w-full object-contain filter drop-shadow-md"
                        />
                        <span className="text-[10px] text-slate-400 mt-1">Default BSSKN Logo</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <div className="pt-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    ref={logoFileInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadLoading}
                    onClick={() => logoFileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    {customSettings.customLogo ? 'Change Factory Logo' : '+ Upload Logo (ಲೋಗೋ ಅಪ್ಲೋಡ್)'}
                  </button>
                </div>
              </div>

              {/* SECTION 2: Front Page Background Image Upload */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-400" /> 2. ಮುಂಭಾಗದ ಹಿನ್ನೆಲೆ (Background)
                    </h4>
                    {customSettings.customBackground && (
                      <button
                        onClick={handleResetBackground}
                        className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Upload pre-printed card design, template, or custom graphics (PNG, JPG, WebP).
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
                        <ImageIcon className="w-7 h-7 mx-auto text-slate-600 mb-1" />
                        <span className="text-[10px] font-medium text-slate-400 block">Default Mint & Sugarcane Graphic</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button & Options */}
                <div className="space-y-2 pt-2">
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
                    {customSettings.customBackground ? 'Change Background' : '+ Upload Background'}
                  </button>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
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
                      <span className="text-[10.5px]">
                        Hide Header Bar (ಹೆಡರ್ ಮುಚ್ಚು)
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
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
                      <span className="text-[10.5px]">
                        Sugarcane Watermark (ಕಬ್ಬಿನ ಚಿತ್ರ)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Managing Director (MD) Signature Upload */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" /> 3. MD ಸಹಿ (MD Signature)
                    </h4>
                    {customSettings.customMdSignature && (
                      <button
                        onClick={handleResetMdSignature}
                        className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paper scans/photos <strong>automatically converted into transparent ink</strong>!
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
                        <span className="text-[10px] text-slate-400 mt-1">Default Official MD Signature</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <div className="pt-2">
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
                    {customSettings.customMdSignature ? 'Change MD Signature' : '+ Upload Signature (MD ಸಹಿ)'}
                  </button>
                </div>
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
                    customLogo={customSettings.customLogo}
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
                customLogo={customSettings.customLogo}
                customBackground={customSettings.customBackground}
                customMdSignature={customSettings.customMdSignature}
                hideHeader={customSettings.hideHeader}
                showSugarcaneWatermark={customSettings.showSugarcaneWatermark}
                scale={1.2}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                CR80 Plastic PVC Card (85.6mm × 54mm)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintSides(cardSide === 'Front' ? 'front' : 'back');
                    setSelectedCards([previewCard]);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  title={`Print ${cardSide} side only`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  {cardSide === 'Front' ? 'ಮುಂಭಾಗ ಮಾತ್ರ' : 'ಹಿಂಬದಿ ಮಾತ್ರ'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrintSides('both');
                    setSelectedCards([previewCard]);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                  title="Print Page 1: Front and Page 2: Back"
                >
                  <Printer className="w-4 h-4" /> ಎರಡೂ ಬದಿಗಳನ್ನು ಮುದ್ರಿಸಿ (Print Both Pages)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
