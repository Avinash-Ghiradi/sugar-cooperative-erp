import React, { useState, useEffect } from 'react';
import { ApiService, getShareholderSharesCount, isShareholderInactive } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import OfficialShareholderIDCard, { ShareholderAttendanceQR } from '../IDCards/OfficialShareholderIDCard';
import ChangePasswordModal from '../Auth/ChangePasswordModal';
import {
  BookOpen, Contact, PackageCheck, QrCode, History, CreditCard, Award,
  UserCheck, MapPin, Phone, ShieldCheck, Printer, KeyRound, LogOut,
  RefreshCw, AlertCircle, Clock, GitMerge, FileSpreadsheet, ArrowRightLeft,
  FileText, Coins, CheckCircle2, ChevronRight, User
} from 'lucide-react';

export default function ShareholderPortal() {
  const { user, logout, showToast } = useAuth();
  const companyLogo = useCompanyLogo();

  const [shareholder, setShareholder] = useState(null);
  const [history, setHistory] = useState({ transactions: [], sugarAllotments: [], timeline: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ID Card Print Options
  const [idCardSide, setIdCardSide] = useState('Front');
  const [printLayout, setPrintLayout] = useState('a4');
  const [cardSize, setCardSize] = useState('85x54');

  const loadData = async () => {
    setLoading(true);
    const targetId = user?.share_no || user?.id || user?.username;
    if (targetId) {
      try {
        const res = await ApiService.getShareholderById(targetId);
        if (res && res.success && res.shareholder) {
          setShareholder(res.shareholder);
          setHistory(res.history || { transactions: [], sugarAllotments: [], timeline: [] });
        } else if (user) {
          // Fallback to user session data
          setShareholder({
            share_no: user.share_no,
            shareholder_name: user.name,
            name: user.name,
            mobile_no: user.mobile,
            place: user.village,
            taluk: user.taluk,
            district: user.district,
            circle: user.circle,
            total_amount: user.total_amount || 2000,
            number_of_shares: user.number_of_shares || 1
          });
        }
      } catch (e) {
        console.warn('Error loading shareholder profile:', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-slate-300 text-sm font-semibold">ಷೇರುದಾರರ ಸದಸ್ಯರ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</p>
        <p className="text-slate-500 text-xs mt-1">Loading official shareholder portal & history...</p>
      </div>
    );
  }

  const sh = shareholder || user || {};
  const sharesCount = getShareholderSharesCount(sh);
  const totalAmt = parseFloat(sh.total_amount) || (sharesCount > 0 ? sharesCount * 2000 : 1000);
  const timelineEvents = history?.timeline || [];
  const transactionsList = history?.transactions || [];
  const sugarAllotmentsList = history?.sugarAllotments || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans print:bg-white print:text-black">
      {/* 1. Portal Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Society Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-emerald-500/30 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img
                src={companyLogo || DEFAULT_LOGO_PATH}
                alt="SBSK Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = DEFAULT_LOGO_PATH; }}
              />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight">
                ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-emerald-400 font-semibold">
                <span>ಅಧಿಕೃತ ಷೇರುದಾರರ ಸದಸ್ಯ ಪೋರ್ಟಲ್</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Statutory Member Portal Online</span>
              </div>
            </div>
          </div>

          {/* Member Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <div className="text-xs font-bold text-slate-200">
                {sh.shareholder_name || sh.name}
              </div>
              <div className="text-[10.5px] font-mono text-amber-300">
                ಷೇರು ನಂ: #{sh.share_no || sh.share_number}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-800/80 transition-all cursor-pointer shadow-sm"
              title="ಲಾಗ್‌ಔಟ್"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ಲಾಗ್‌ಔಟ್</span>
            </button>
          </div>
        </div>
      </header>

      {/* Default Password Reminder Banner */}
      {user?.is_default_password && (
        <div className="bg-amber-950/60 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>ಭದ್ರತಾ ಸಲಹೆ:</strong> ನಿಮ್ಮ ಖಾತೆಯು ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ (Shares123) ಬಳಸುತ್ತಿದೆ. ಖಾತೆಯ ಸುರಕ್ಷತೆಗಾಗಿ ದಯವಿಟ್ಟು ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿಕೊಳ್ಳಿ.
            </span>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer transition-colors shrink-0"
          >
            ಈಗಲೇ ಬದಲಾಯಿಸಿ
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        
        {/* 2. Shareholder Hero Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Member Identity & Details */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                {sh.photo_url ? (
                  <img src={sh.photo_url} alt={sh.shareholder_name || sh.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-emerald-950 text-emerald-300 font-extrabold text-2xl flex items-center justify-center rounded-xl">
                    {(sh.shareholder_name || sh.name || 'S').charAt(0)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    ಷೇರು ನಂ: #{sh.share_no || sh.share_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700 text-[11px] font-semibold">
                    {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                  </span>
                  {sh.book_no && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                      B.No: {sh.book_no}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-bold">
                    Active Member
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {sh.shareholder_name || sh.name}
                </h2>
                {sh.name_english && (
                  <p className="text-xs text-slate-400 font-medium">
                    {sh.name_english}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                  {sh.father_husband_name && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <span>ತಂದೆ/ಗಂಡ:</span> <strong>{sh.father_husband_name}</strong>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{sh.place || sh.village || '—'}, {sh.taluk || '—'}, {sh.circle || '—'}</span>
                  </span>
                  {(sh.mobile_no || sh.mobile) && (
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                      <span>{sh.mobile_no || sh.mobile}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
                <div className="text-[10.5px] text-slate-400 font-medium">ಒಟ್ಟು ಷೇರುಗಳು</div>
                <div className={`text-xl font-extrabold font-mono mt-0.5 ${sharesCount === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {sharesCount === 0 ? '0' : sharesCount}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  {sharesCount === 0 ? '₹1,000 ಬಾಕಿ' : `${sharesCount} ಷೇರು`}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
                <div className="text-[10.5px] text-slate-400 font-medium">ಪಾವತಿಸಿದ ಮೊತ್ತ</div>
                <div className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">
                  ₹{totalAmt.toLocaleString('en-IN')}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  ಶೇರು ಬಂಡವಾಳ
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
                <div className="text-[10.5px] text-slate-400 font-medium">ವಾರ್ಷಿಕ ಸಕ್ಕರೆ ಕೋಟಾ</div>
                <div className="text-xl font-extrabold text-sky-400 font-mono mt-0.5">
                  {sharesCount > 0 ? `${sharesCount * 1} ಚೀಲ` : '0 ಚೀಲ'}
                </div>
                <div className="text-[9.5px] text-emerald-400 font-semibold mt-0.5">
                  ಅರ್ಹ ಫಲಾನುಭವಿ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto no-scrollbar pb-1 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. ಶಾಸನಬದ್ಧ ಲೆಡ್ಜರ್ (Statutory Ledger)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>2. ಇತಿಹಾಸ & ವಹಿವಾಟುಗಳು ({timelineEvents.length || transactionsList.length || 1})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sugar_quota')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sugar_quota'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-sky-400" />
            <span>3. ಸಕ್ಕರೆ ಕೋಟಾ & ಹಂಚಿಕೆ ({sugarAllotmentsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('id_card')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'id_card'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Contact className="w-4 h-4 text-amber-400" />
            <span>4. ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ (Official ID Card)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span>5. ಹಾಜರಾತಿ & ಮಹಾಸಭೆಯ QR</span>
          </button>
        </div>

        {/* 4. Tab Contents */}

        {/* TAB 1: STATUTORY LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 no-print">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ 38-ಕಾಲಂಗಳ ವಹಿ (Form "A" Register of Members)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆಯನ್ವಯ ದಾಖಲಾದ ಅಧಿಕೃತ ಸದಸ್ಯರ ವಹಿ</p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 shadow-md cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>ವಹಿ ಪ್ರಿಂಟ್ ಮಾಡಿ (Print Passbook)</span>
              </button>
            </div>

            {/* Statutory Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Section 1: ವೈಯಕ್ತಿಕ ವಿವರ */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <UserCheck className="w-4 h-4" /> 1. ವೈಯಕ್ತಿಕ & ಸದಸ್ಯತ್ವ ವಿವರ
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಶೇರುದಾರರ ಪೂರ್ಣ ಹೆಸರು:</span>
                    <strong className="text-white text-right">{sh.shareholder_name || sh.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಹೆಸರು:</span>
                    <span className="text-slate-200 text-right">{sh.name_english || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ತಂದೆ / ಗಂಡನ ಹೆಸರು:</span>
                    <span className="text-slate-200 text-right">{sh.father_husband_name || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಸದಸ್ಯತ್ವದ ವರ್ಗ:</span>
                    <span className="text-emerald-400 font-bold text-right">{sh.schedule_cast || 'ಅ - ವರ್ಗ'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">ಸ್ವಾಮ್ಯತ್ವ / ಒಡೆತನ:</span>
                    <span className="text-sky-300 font-semibold text-right">{sh.ownership || 'ಸ್ವಂತ (Self)'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: ಸ್ಥಳ & ವಿಳಾಸ ವಿವರ */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <MapPin className="w-4 h-4" /> 2. ಸ್ಥಳ & ಸಂಪರ್ಕ ವಿಳಾಸ
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಗ್ರಾಮ / ಸ್ಥಳ:</span>
                    <strong className="text-white text-right">{sh.place || sh.village || '—'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ತಾಲೂಕು & ಜಿಲ್ಲೆ:</span>
                    <span className="text-slate-200 text-right">{sh.taluk || '—'}, {sh.district || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಸಹಕಾರಿ ವಲಯ (Circle):</span>
                    <span className="text-amber-300 font-semibold text-right">{sh.circle || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ:</span>
                    <span className="text-emerald-400 font-mono font-bold text-right">{sh.mobile_no || sh.mobile || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">ವಿಳಾಸ / ಮನೆ ನಂ:</span>
                    <span className="text-slate-300 text-right truncate max-w-[180px]">{sh.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: ಶೇರು ಬಂಡವಾಳ & ಪ್ರಮಾಣಪತ್ರ */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Award className="w-4 h-4" /> 3. ಶೇರು ಬಂಡವಾಳ & ಪ್ರಮಾಣಪತ್ರ
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಶೇರು ಸಂಖ್ಯೆ (Share No):</span>
                    <strong className="text-amber-400 font-mono text-right">#{sh.share_no || sh.share_number}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಒಟ್ಟು ಷೇರುಗಳು:</span>
                    <strong className={`font-mono text-right ${sharesCount === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {sharesCount === 0 ? '0 ಷೇರು (ಅಪೂರ್ಣ)' : `${sharesCount} ಷೇರು`}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಪಾವತಿಸಿದ ಮೊತ್ತ:</span>
                    <strong className="text-white font-mono text-right">₹{totalAmt.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ರಸೀದಿ ನಂ & ದಿನಾಂಕ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.receipt_no || '—'} ({sh.date || '—'})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.certificate_no || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <CreditCard className="w-4 h-4" /> 4. ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ (Bank Details)
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಬ್ಯಾಂಕ್ ಹೆಸರು:</span>
                    <strong className="text-white text-right">{sh.bank_name || '—'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಶಾಖೆ (Branch):</span>
                    <span className="text-slate-200 text-right">{sh.bank_branch || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಖಾತೆ ಸಂಖ್ಯೆ (A/c No):</span>
                    <strong className="text-emerald-400 font-mono text-right">{sh.bank_account_no || '—'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">IFSC ಕೋಡ್:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.bank_ifsc || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: ಗುರುತಿನ ದಾಖಲೆಗಳು (KYC) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4" /> 5. KYC & ಶಾಸನಬದ್ಧ ಗುರುತು
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಆಧಾರ್ ಕಾರ್ಡ್ ನಂ:</span>
                    <span className="text-white font-mono text-right">{sh.aadhaar_card_no || sh.aadhaar_no || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಪಾನ್ ಕಾರ್ಡ್ ನಂ:</span>
                    <span className="text-slate-200 font-mono text-right">{sh.pan_card_no || sh.pan_no || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಮಂಡಳಿ ಠರಾವು ನಂ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.tharava_no || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">ಠರಾವು ದಿನಾಂಕ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.tharava_date || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 6: ವಾರಸುದಾರರ ವಿವರ (Nominee) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4" /> 6. ವಾರಸುದಾರರ (ನಾಮಿನಿ) ವಿವರ
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ನಾಮಿನಿ ಹೆಸರು:</span>
                    <strong className="text-white text-right">{sh.nominee_name || '—'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ಸದಸ್ಯರೊಂದಿಗೆ ಸಂಬಂಧ:</span>
                    <span className="text-slate-200 text-right">{sh.relationship || sh.nominee_relationship || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">ನಾಮಿನಿ ವಯಸ್ಸು:</span>
                    <span className="text-slate-300 text-right">{sh.nominee_age || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">ನಾಮಿನಿ ಮೊಬೈಲ್:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.nominee_mobile_no || '—'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: HISTORY & TIMELINE & TRANSACTIONS */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 no-print">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" /> ಸದಸ್ಯತ್ವದ ಸಂಪೂರ್ಣ ಇತಿಹಾಸ & ವಹಿವಾಟುಗಳು (Member History & Timeline)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ನೋಂದಣಿ, ಷೇರು ಪಾವತಿ, ವರ್ಗಾವಣೆ, ವಿಲೀನ ಮತ್ತು ಶಾಸನಬದ್ಧ ಇತಿಹಾಸದ ದಾಖಲೆಗಳು</p>
              </div>

              <span className="text-xs px-3 py-1 rounded-full font-bold bg-purple-950 text-purple-300 border border-purple-800">
                {timelineEvents.length || transactionsList.length || 1} ದಾಖಲೆಗಳು
              </span>
            </div>

            {/* Timeline View */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> ಕಾಲಾನುಕ್ರಮದ ಸದಸ್ಯತ್ವ ಇತಿಹಾಸ (Chronological Events)
              </h4>

              {timelineEvents.length === 0 ? (
                // Fallback timeline event from shareholder record
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  <div className="relative">
                    <div className="absolute -left-6 top-2 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-950 border border-slate-900" />
                    <div className="p-4 rounded-2xl border border-emerald-800/60 bg-emerald-950/20 shadow-lg space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಸದಸ್ಯತ್ವ ನೋಂದಣಿ (Official Statutory Membership)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{sh.date || sh.reg_date || 'ಮೂಲ ದಾಖಲೆ'}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ ಶೇರುದಾರರಾಗಿ #{sh.share_no || sh.share_number} ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಪಾವತಿಸಿದ ಶೇರು ಮೊತ್ತ: ₹{totalAmt.toLocaleString('en-IN')}, ವರ್ಗ: {sh.schedule_cast || 'ಅ - ವರ್ಗ'}, ಪುಸ್ತಕ ಸಂಖ್ಯೆ: {sh.book_no || '1'}.
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                        <span>ರಶೀದಿ ನಂ: <strong className="text-slate-200 font-mono">#{sh.receipt_no || '—'}</strong></span>
                        <span>ಪ್ರಮಾಣಪತ್ರ: <strong className="text-slate-200 font-mono">{sh.certificate_no || '—'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {timelineEvents.map((evt, idx) => {
                    const isMerge = evt.type && evt.type.includes('MERGE');
                    const isVarasa = evt.type === 'VARASA_TRANSFER';
                    const isVargavane = evt.type === 'VARGAVANE_TRANSFER';
                    const isEdit = evt.type === 'SHAREHOLDER_UPDATE';

                    const dotColor = isMerge
                      ? 'bg-amber-400 ring-amber-950'
                      : isVarasa
                      ? 'bg-purple-500 ring-purple-950'
                      : isVargavane
                      ? 'bg-cyan-500 ring-cyan-950'
                      : isEdit
                      ? 'bg-sky-500 ring-sky-950'
                      : 'bg-emerald-500 ring-emerald-950';

                    const borderColor = isMerge
                      ? 'border-amber-700/60 bg-amber-950/25'
                      : isVarasa
                      ? 'border-purple-800/60 bg-purple-950/20'
                      : isVargavane
                      ? 'border-cyan-800/60 bg-cyan-950/20'
                      : isEdit
                      ? 'border-sky-800/60 bg-sky-950/20'
                      : 'border-emerald-800/60 bg-emerald-950/20';

                    return (
                      <div key={evt.id || idx} className="relative">
                        <div className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 border border-slate-900 shadow-md`} />
                        <div className={`p-4 rounded-2xl border ${borderColor} shadow-lg space-y-2`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              {isMerge && <GitMerge className="w-4 h-4 text-amber-400" />}
                              {isVarasa && <FileSpreadsheet className="w-4 h-4 text-purple-400" />}
                              {isVargavane && <ArrowRightLeft className="w-4 h-4 text-cyan-400" />}
                              {isEdit && <FileText className="w-4 h-4 text-sky-400" />}
                              {!isMerge && !isVarasa && !isVargavane && !isEdit && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                              <span className="font-bold text-white text-xs">{evt.title}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" /> {evt.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {evt.description}
                          </p>
                          {evt.performed_by && (
                            <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 pt-1">
                              <span>ನಮೂದು:</span> <span className="text-slate-400 font-semibold">{evt.performed_by}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transactions History Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>ಷೇರು ಬಂಡವಾಳ & ಹಣಕಾಸು ರಸೀದಿಗಳ ಇತಿಹಾಸ (Financial Ledger)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">ರಸೀದಿ ಸಂಖ್ಯೆ</th>
                      <th className="py-3 px-4">ದಿನಾಂಕ</th>
                      <th className="py-3 px-4">ವಿವರ / ಖಾತೆ</th>
                      <th className="py-3 px-4">ಷೇರುಗಳು</th>
                      <th className="py-3 px-4">ಜಮೆ ಮೊತ್ತ</th>
                      <th className="py-3 px-4 text-center">ಸ್ಥಿತಿ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {transactionsList.length > 0 ? (
                      transactionsList.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-amber-300">#{tx.receipt_no || tx.transaction_id || idx + 1}</td>
                          <td className="py-3 px-4">{tx.date || tx.created_at || '—'}</td>
                          <td className="py-3 px-4 text-slate-300">{tx.description || tx.type || 'ಷೇರು ಬಂಡವಾಳ ಪಾವತಿ'}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{tx.shares || 1} ಷೇರು</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">₹{(tx.amount || 2000).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                              ಜಮೆಯಾಗಿದೆ (Credited)
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">#{sh.receipt_no || '261'}</td>
                        <td className="py-3 px-4">{sh.date || sh.reg_date || '—'}</td>
                        <td className="py-3 px-4 text-slate-300">ಮೂಲ ಷೇರು ಬಂಡವಾಳ ರಶೀದಿ ಪಾವತಿ ({sh.schedule_cast || 'ಅ - ವರ್ಗ'})</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{sharesCount} ಷೇರು</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">₹{totalAmt.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                            ಅಧಿಕೃತವಾಗಿ ಜಮೆಯಾಗಿದೆ
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUGAR QUOTA & ALLOTMENT */}
        {activeTab === 'sugar_quota' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 no-print">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-400" /> ಸಕ್ಕರೆ ಕೋಟಾ ಅರ್ಹತೆ & ವಿತರಣಾ ಇತಿಹಾಸ
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ಶೇರು ಆಧಾರಿತ ವಾರ್ಷಿಕ/ಮಾಸಿಕ ಸಕ್ಕರೆ ಕೋಟಾ ವಿವರಗಳು</p>
              </div>
            </div>

            {/* Sugar Quota Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400">ಒಟ್ಟು ಅರ್ಹ ಸಕ್ಕರೆ ಕೋಟಾ</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {sharesCount > 0 ? `${sharesCount * 1} ಚೀಲ (50 Kg)` : '0 ಚೀಲ'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {sharesCount > 0 ? 'ಪ್ರತಿ ಷೇರಿಗೆ 1 ಚೀಲದಂತೆ' : 'ಕನಿಷ್ಠ 1 ಪೂರ್ಣ ಷೇರು ಅಗತ್ಯ'}
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400">ಪಡೆದ ಒಟ್ಟು ಸಕ್ಕರೆ ಚೀಲಗಳು</div>
                <div className="text-2xl font-bold text-sky-400 font-mono mt-1">
                  {sugarAllotmentsList.reduce((sum, a) => sum + (Number(a.allotted_quantity || a.quantity) || 0), 0) || 0} ಚೀಲ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  ವಿತರಣಾ ದಾಖಲೆಗಳ ಪ್ರಕಾರ
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400">ಬಾಕಿ ಲಭ್ಯ ಸಕ್ಕರೆ ಕೋಟಾ</div>
                <div className="text-2xl font-bold text-amber-300 font-mono mt-1">
                  {Math.max(0, (sharesCount * 1) - (sugarAllotmentsList.reduce((sum, a) => sum + (Number(a.allotted_quantity || a.quantity) || 0), 0) || 0))} ಚೀಲ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  ಸಹಕಾರಿ ಗೋದಾಮಿನಲ್ಲಿ ಲಭ್ಯ
                </div>
              </div>
            </div>

            {/* Allotment History Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-200">
                ವಿತರಣಾ ಇತಿಹಾಸ (Distribution Log)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">ರಸೀದಿ ಸಂಖ್ಯೆ</th>
                      <th className="py-3 px-4">ದಿನಾಂಕ</th>
                      <th className="py-3 px-4">ಕೋಟಾ ಚೀಲಗಳು</th>
                      <th className="py-3 px-4">ದರ / ಮೊತ್ತ</th>
                      <th className="py-3 px-4 text-center">ಸ್ಥಿತಿ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {sugarAllotmentsList.length > 0 ? (
                      sugarAllotmentsList.map((sa, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-amber-300">#{sa.allotment_id || sa.receipt_no || idx + 1}</td>
                          <td className="py-3 px-4">{sa.date || sa.allotment_date || '—'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{sa.allotted_quantity || sa.quantity || 1} ಚೀಲ</td>
                          <td className="py-3 px-4 font-mono">₹{(sa.amount || sa.total_amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                              ವಿತರಿಸಲಾಗಿದೆ (Delivered)
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          ಯಾವುದೇ ಸಕ್ಕರೆ ವಿತರಣಾ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL ID CARD */}
        {activeTab === 'id_card' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 no-print">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Contact className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಸದಸ್ಯ ಗುರುತಿನ ಚೀಟಿ (Official Shareholder ID Card)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ಮುದ್ರಣ ಹಾಗೂ ಸ್ಕ್ಯಾನರ್ ಪರಿಶೀಲನೆಗೆ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಐಡಿ ಕಾರ್ಡ್</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ID ಕಾರ್ಡ್ ಪ್ರಿಂಟ್ ಮಾಡಿ (Print ID Card)</span>
                </button>
              </div>
            </div>

            {/* ID Card Display Container */}
            <div className="bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center overflow-x-auto">
              <OfficialShareholderIDCard
                shareholder={sh}
                side={idCardSide}
                printLayout={printLayout}
                cardSize={cardSize}
                showSeal={true}
              />
            </div>
          </div>
        )}

        {/* TAB 5: ATTENDANCE & AGM QR CODE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 no-print">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" /> ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM) ಹಾಜರಾತಿ & ಮತದಾನ ಅರ್ಹತೆ
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ಕಾರ್ಖಾನೆ ಗೇಟ್ ಹಾಗೂ ಮಹಾಸಭೆಯ ಸಭಾಂಗಣದಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಅಧಿಕೃತ QR ಪಾಸ್</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Verification Box */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                <div className="p-3 bg-white rounded-2xl shadow-xl">
                  <ShareholderAttendanceQR shareholder={sh} size={180} />
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-sm font-bold text-emerald-400">
                    ||| ಷೇರು ನಂ: #{sh.share_no || sh.share_number} |||
                  </div>
                  <h4 className="text-base font-bold text-white">{sh.shareholder_name || sh.name}</h4>
                  <p className="text-xs text-slate-400">{sh.place || sh.village || '—'}, {sh.circle || '—'}</p>
                </div>

                <div className="w-full pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>2D ಸ್ಕ್ಯಾನರ್ / ಮೊಬೈಲ್ ಕ್ಯಾಮೆರಾದಲ್ಲಿ ತಕ್ಷಣ ಗುರುತಿಸುತ್ತದೆ</span>
                </div>
              </div>

              {/* Voting & Eligibility Rights */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 font-bold text-emerald-400 text-sm">
                  <Award className="w-5 h-5" /> ಮತದಾನ & ಮಹಾಸಭೆಯ ಅಧಿಕೃತ ಹಕ್ಕುಗಳು
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-0.5">ಮತದಾನ ಅರ್ಹತೆ (Voting Eligibility):</strong>
                    {sharesCount > 0 ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="w-4 h-4" /> ನೀವು ಕಾರ್ಖಾನೆಯ ವಾರ್ಷಿಕ ಮಹಾಸಭೆಯ ಅಧಿಕೃತ ಮತದಾರರಾಗಿದ್ದೀರಿ.
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5 mt-1">
                        <AlertCircle className="w-4 h-4" /> ಶೇರು ಕಂತು ಬಾಕಿ ಇರುವುದರಿಂದ ಮತದಾನ ಹಕ್ಕಿಗಾಗಿ ಬಾಕಿ ಮೊತ್ತ ಪಾವತಿಸಿ.
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-0.5">ಹಾಜರಾತಿ ನಿಯಮಗಳು:</strong>
                    ಸಭೆಗೆ ಆಗಮಿಸುವಾಗ ಈ ಡಿಜಿಟಲ್ QR ಕೋಡ್ ಅಥವಾ ಗುರುತಿನ ಚೀಟಿಯನ್ನು ತೋರಿಸಿ ತಕ್ಷಣವೇ ಹಾಜರಾತಿ ದಾಖಲಿಸಬಹುದು.
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-0.5">ಲಾಭಾಂಶ & ಸೌಲಭ್ಯಗಳು:</strong>
                    ವಾರ್ಷಿಕ ಠರಾವು ಪ್ರಕಾರ ಸಕ್ಕರೆ ಕೋಟಾ, ಡಿವಿಡೆಂಡ್ ಹಾಗೂ ಇತರೆ ಸೌಲಭ್ಯಗಳನ್ನು ನೇರವಾಗಿ ನಿಮ್ಮ ಖಾತೆಗೆ ಜಮೆ ಮಾಡಲಾಗುತ್ತದೆ.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 5. Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 no-print">
        ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ • ಶಾಸನಬದ್ಧ ಷೇರುದಾರರ ಖಾತೆ ಸುರಕ್ಷಿತವಾಗಿದೆ
      </footer>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}
