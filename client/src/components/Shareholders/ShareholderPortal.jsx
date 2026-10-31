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
  FileText, Coins, CheckCircle2, ChevronRight, User, ShieldAlert, Sparkles,
  Building2, Calendar, Download, Eye, ChevronDown
} from 'lucide-react';

export default function ShareholderPortal() {
  const { user, logout, showToast } = useAuth();
  const companyLogo = useCompanyLogo();

  const [shareholder, setShareholder] = useState(null);
  const [history, setHistory] = useState({ transactions: [], sugarAllotments: [], timeline: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'history' | 'sugar_quota' | 'id_card' | 'attendance'
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ID Card Options
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

  // Clean duplicate "B.No:" in book number
  const cleanBookNo = String(sh.book_no || '').replace(/^b\.?no:?\s*/i, '').trim();

  const totalSugarEntitled = sharesCount > 0 ? sharesCount * 1 : 0;
  const totalSugarLifted = sugarAllotmentsList.reduce((sum, a) => sum + (Number(a.allotted_quantity || a.quantity) || 0), 0) || 0;
  const sugarBalance = Math.max(0, totalSugarEntitled - totalSugarLifted);

  // Tabs Definition for Navigation
  const TABS = [
    { id: 'ledger', label: 'ಶಾಸನಬದ್ಧ ಲೆಡ್ಜರ್', shortLabel: 'ಲೆಡ್ಜರ್', icon: BookOpen, badge: null },
    { id: 'history', label: 'ಇತಿಹಾಸ & ವಹಿವಾಟು', shortLabel: 'ಇತಿಹಾಸ', icon: History, badge: timelineEvents.length || transactionsList.length || 1 },
    { id: 'sugar_quota', label: 'ಸಕ್ಕರೆ ಕೋಟಾ', shortLabel: 'ಸಕ್ಕರೆ', icon: PackageCheck, badge: `${totalSugarEntitled} ಚೀಲ` },
    { id: 'id_card', label: 'ಗುರುತಿನ ಚೀಟಿ', shortLabel: 'ID ಕಾರ್ಡ್', icon: Contact, badge: null },
    { id: 'attendance', label: 'ಮಹಾಸಭೆ QR ಪಾಸ್', shortLabel: 'QR ಪಾಸ್', icon: QrCode, badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans print:bg-white print:text-black">
      
      {/* 1. Sleek Modern Header (Mobile & Desktop Responsive) */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Organization Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-950 border border-emerald-500/40 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img
                src={companyLogo || DEFAULT_LOGO_PATH}
                alt="SBSK Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = DEFAULT_LOGO_PATH; }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight truncate">
                ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ
              </h1>
              <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] text-emerald-400 font-semibold truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">ಅಧಿಕೃತ ಸದಸ್ಯ ಪೋರ್ಟಲ್ • Member Portal</span>
              </div>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop User Info */}
            <div className="hidden lg:flex flex-col text-right mr-1">
              <span className="text-xs font-bold text-slate-100 truncate max-w-[140px]">
                {sh.shareholder_name || sh.name}
              </span>
              <span className="text-[10px] font-mono text-amber-300">
                #{sh.share_no || sh.share_number}
              </span>
            </div>

            {/* Change Password Button */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-sm"
              title="ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 rounded-xl text-xs font-semibold border border-rose-800/60 transition-all cursor-pointer shadow-sm"
              title="ಲಾಗ್‌ಔಟ್"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">ಲಾಗ್‌ಔಟ್</span>
            </button>
          </div>
        </div>
      </header>

      {/* Security Banner (Compact Mobile Alert) */}
      {user?.is_default_password && (
        <div className="bg-amber-950/50 border-b border-amber-800/60 px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-amber-200 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>ಭದ್ರತೆ:</strong> ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸುತ್ತಿದ್ದೀರಿ. ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ.
            </span>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10.5px] whitespace-nowrap cursor-pointer transition-colors shrink-0"
          >
            ಬದಲಾಯಿಸಿ
          </button>
        </div>
      )}

      {/* Main Content Area (With bottom padding for Mobile Dock) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full flex-1 space-y-4 sm:space-y-6 pb-24 md:pb-8">
        
        {/* 2. Member Profile Hero Card (Compact, Professional, Executive Look) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
            
            {/* Identity & Basic Info */}
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Photo / Avatar */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 p-0.5 sm:p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                {sh.photo_url ? (
                  <img src={sh.photo_url} alt={sh.shareholder_name || sh.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-emerald-950 text-emerald-300 font-black text-xl sm:text-2xl flex items-center justify-center rounded-xl">
                    {(sh.shareholder_name || sh.name || 'S').charAt(0)}
                  </div>
                )}
              </div>

              {/* Name & Chips */}
              <div className="space-y-1 min-w-0">
                {/* Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] sm:text-[11px] font-bold font-mono">
                    #{sh.share_no || sh.share_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700 text-[10px] sm:text-[11px] font-semibold">
                    {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                  </span>
                  {cleanBookNo && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] sm:text-[11px] font-mono">
                      B.No: {cleanBookNo}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full text-[9.5px] font-bold">
                    Active
                  </span>
                </div>

                {/* Full Name */}
                <h2 className="text-base sm:text-2xl font-bold text-white tracking-tight truncate">
                  {sh.shareholder_name || sh.name}
                </h2>

                {/* Subtitle / Details */}
                <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-400 pt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{sh.place || sh.village || '—'}, {sh.taluk || ''}</span>
                  </span>
                  {(sh.mobile_no || sh.mobile) && (
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{sh.mobile_no || sh.mobile}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Executive Metric Cards (Side-by-side on Mobile 3-Cols!) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-slate-800/80 sm:border-t-0">
              {/* Metric 1: Shares Count */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center flex flex-col justify-center">
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">ಒಟ್ಟು ಷೇರು</div>
                <div className={`text-base sm:text-xl font-black font-mono mt-0.5 ${sharesCount === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {sharesCount === 0 ? '0' : sharesCount}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {sharesCount === 0 ? 'ಅಪೂರ್ಣ' : `${sharesCount} ಷೇರು`}
                </div>
              </div>

              {/* Metric 2: Amount Paid */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center flex flex-col justify-center">
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">ಠೇವಣಿ ಮೊತ್ತ</div>
                <div className="text-base sm:text-xl font-black text-amber-300 font-mono mt-0.5 truncate">
                  ₹{totalAmt.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  ಷೇರು ಬಂಡವಾಳ
                </div>
              </div>

              {/* Metric 3: Annual Sugar Quota */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center flex flex-col justify-center">
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">ಸಕ್ಕರೆ ಕೋಟಾ</div>
                <div className="text-base sm:text-xl font-black text-sky-400 font-mono mt-0.5">
                  {totalSugarEntitled > 0 ? `${totalSugarEntitled} ಚೀಲ` : '0'}
                </div>
                <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">
                  ಅರ್ಹ ಕೋಟಾ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Top Tab Pills Selector (Smooth horizontal scroll with active pills) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800/80 no-print">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                    isActive ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-emerald-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. Tab Contents */}

        {/* TAB 1: STATUTORY LEDGER (Form "A" Register) */}
        {activeTab === 'ledger' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ವಹಿ (Form "A" Register of Members)
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆಯನ್ವಯ ದಾಖಲಾದ ಅಧಿಕೃತ ಸದಸ್ಯರ ವಹಿ</p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 shadow-md cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>ವಹಿ ಪ್ರಿಂಟ್ ಮಾಡಿ (Print Passbook)</span>
              </button>
            </div>

            {/* Mobile Key-Value Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Card 1: ವೈಯಕ್ತಿಕ ವಿವರ */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <UserCheck className="w-4 h-4" /> 1. ವೈಯಕ್ತಿಕ & ಸದಸ್ಯತ್ವ ವಿವರ
                </div>
                <div className="space-y-1.5 text-xs divide-y divide-slate-800/50">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಪೂರ್ಣ ಹೆಸರು:</span>
                    <strong className="text-white text-right font-medium">{sh.shareholder_name || sh.name}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">English Name:</span>
                    <span className="text-slate-200 text-right">{sh.name_english || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ತಂದೆ / ಗಂಡನ ಹೆಸರು:</span>
                    <span className="text-slate-200 text-right">{sh.father_husband_name || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಸದಸ್ಯತ್ವ ವರ್ಗ:</span>
                    <span className="text-emerald-400 font-bold text-right">{sh.schedule_cast || 'ಅ - ವರ್ಗ'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಸ್ವಾಮ್ಯತ್ವ / ಒಡೆತನ:</span>
                    <span className="text-sky-300 font-semibold text-right">{sh.ownership || 'ಸ್ವಂತ (Self)'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: ಸ್ಥಳ & ವಿಳಾಸ */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-bold text-xs text-sky-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <MapPin className="w-4 h-4" /> 2. ಸ್ಥಳ & ಸಂಪರ್ಕ ವಿಳಾಸ
                </div>
                <div className="space-y-1.5 text-xs divide-y divide-slate-800/50">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಗ್ರಾಮ / ಸ್ಥಳ:</span>
                    <strong className="text-white text-right">{sh.place || sh.village || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ತಾಲೂಕು & ಜಿಲ್ಲೆ:</span>
                    <span className="text-slate-200 text-right">{sh.taluk || '—'}, {sh.district || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಸಹಕಾರಿ ವಲಯ (Circle):</span>
                    <span className="text-amber-300 font-semibold text-right">{sh.circle || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ:</span>
                    <span className="text-emerald-400 font-mono font-bold text-right">{sh.mobile_no || sh.mobile || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ವಿಳಾಸ / ಮನೆ ನಂ:</span>
                    <span className="text-slate-300 text-right truncate max-w-[150px]">{sh.address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: ಶೇರು ಬಂಡವಾಳ */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-bold text-xs text-amber-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <Award className="w-4 h-4" /> 3. ಶೇರು ಬಂಡವಾಳ & ಪ್ರಮಾಣಪತ್ರ
                </div>
                <div className="space-y-1.5 text-xs divide-y divide-slate-800/50">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಶೇರು ಸಂಖ್ಯೆ:</span>
                    <strong className="text-amber-400 font-mono text-right">#{sh.share_no || sh.share_number}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಒಟ್ಟು ಷೇರುಗಳು:</span>
                    <strong className={`font-mono text-right ${sharesCount === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {sharesCount === 0 ? '0 ಷೇರು (ಅಪೂರ್ಣ)' : `${sharesCount} ಷೇರು`}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಪಾವತಿಸಿದ ಮೊತ್ತ:</span>
                    <strong className="text-white font-mono text-right">₹{totalAmt.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ರಸೀದಿ ನಂ & ದಿನಾಂಕ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.receipt_no || '—'} ({sh.date || '—'})</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.certificate_no || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <CreditCard className="w-4 h-4" /> 4. ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ (Bank Details)
                </div>
                <div className="space-y-1.5 text-xs divide-y divide-slate-800/50">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಬ್ಯಾಂಕ್ ಹೆಸರು:</span>
                    <strong className="text-white text-right">{sh.bank_name || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಶಾಖೆ (Branch):</span>
                    <span className="text-slate-200 text-right">{sh.bank_branch || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಖಾತೆ ಸಂಖ್ಯೆ (A/c No):</span>
                    <strong className="text-emerald-400 font-mono text-right">{sh.bank_account_no || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">IFSC ಕೋಡ್:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.bank_ifsc || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: ಗುರುತಿನ ದಾಖಲೆಗಳು (KYC) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-bold text-xs text-sky-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <ShieldCheck className="w-4 h-4" /> 5. KYC & ಶಾಸನಬದ್ಧ ಗುರುತು
                </div>
                <div className="space-y-1.5 text-xs divide-y divide-slate-800/50">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಆಧಾರ್ ಕಾರ್ಡ್ ನಂ:</span>
                    <span className="text-white font-mono text-right">{sh.aadhaar_card_no || sh.aadhaar_no || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಪಾನ್ ಕಾರ್ಡ್ ನಂ:</span>
                    <span className="text-slate-200 font-mono text-right">{sh.pan_card_no || sh.pan_no || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಮಂಡಳಿ ಠರಾವು ನಂ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.tharava_no || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಠರಾವು ದಿನಾಂಕ:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.tharava_date || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Card 6: ವಾರಸುದಾರರ ವಿವರ (Nominee) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="font-bold text-xs text-amber-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <FileText className="w-4 h-4" /> 6. ವಾರಸುದಾರರ (ನಾಮಿನಿ) ವಿವರ
                </div>
                <div className="space-y-1.5 text-xs divide-y divide-slate-800/50">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ನಾಮಿನಿ ಹೆಸರು:</span>
                    <strong className="text-white text-right">{sh.nominee_name || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ಸದಸ್ಯರೊಂದಿಗೆ ಸಂಬಂಧ:</span>
                    <span className="text-slate-200 text-right">{sh.relationship || sh.nominee_relationship || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ನಾಮಿನಿ ವಯಸ್ಸು:</span>
                    <span className="text-slate-300 text-right">{sh.nominee_age || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">ನಾಮಿನಿ ಮೊಬೈಲ್:</span>
                    <span className="text-slate-300 font-mono text-right">{sh.nominee_mobile_no || '—'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: HISTORY & TRANSACTIONS */}
        {activeTab === 'history' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2 no-print">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" /> ಸದಸ್ಯತ್ವ ಇತಿಹಾಸ & ಹಣಕಾಸು ವಹಿವಾಟುಗಳು
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">ನೋಂದಣಿ, ಷೇರು ಪಾವತಿ & ಶಾಸನಬದ್ಧ ಇತಿಹಾಸದ ದಾಖಲೆಗಳು</p>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-purple-950 text-purple-300 border border-purple-800">
                {timelineEvents.length || transactionsList.length || 1} ದಾಖಲೆ
              </span>
            </div>

            {/* Mobile-Friendly Transactions Cards */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" /> ಷೇರು ಬಂಡವಾಳ ರಸೀದಿಗಳು (Financial Receipts)
              </h4>

              {transactionsList.length > 0 ? (
                transactionsList.map((tx, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 text-xs">#{tx.receipt_no || tx.transaction_id || idx + 1}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{tx.date || tx.created_at || '—'}</span>
                      </div>
                      <div className="text-xs font-semibold text-white">{tx.description || tx.type || 'ಷೇರು ಬಂಡವಾಳ ಪಾವತಿ'}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{tx.shares || 1} ಷೇರು • ಅಧಿಕೃತ ಜಮೆ</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
                        ₹{(tx.amount || 2000).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[9.5px] font-bold border border-emerald-800 mt-1">
                        Credited
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300 text-xs">#{sh.receipt_no || '18479'}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{sh.date || sh.reg_date || '19-Sep-96'}</span>
                    </div>
                    <div className="text-xs font-semibold text-white">ಮೂಲ ಷೇರು ಬಂಡವಾಳ ರಸೀದಿ ಪಾವತಿ</div>
                    <div className="text-[11px] text-emerald-400 font-semibold">{sharesCount} ಷೇರು ({sh.schedule_cast || 'ಅ - ವರ್ಗ'})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
                      ₹{totalAmt.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[9.5px] font-bold border border-emerald-800 mt-1">
                      ಅಧಿಕೃತ ಜಮೆ
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Events */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" /> ಕಾಲಾನುಕ್ರಮದ ಇತಿಹಾಸ (Chronological Timeline)
              </h4>

              <div className="relative pl-5 sm:pl-6 space-y-4 sm:space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timelineEvents.length === 0 ? (
                  <div className="relative">
                    <div className="absolute -left-5 sm:-left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-950 border border-slate-900" />
                    <div className="p-3.5 rounded-2xl border border-emerald-800/60 bg-emerald-950/20 shadow-md space-y-1.5">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಸದಸ್ಯತ್ವ ನೋಂದಣಿ
                        </span>
                        <span className="text-[10.5px] font-mono text-slate-400">{sh.date || sh.reg_date || '19-Sep-96'}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-300 leading-relaxed">
                        ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ ಶೇರುದಾರರಾಗಿ #{sh.share_no || sh.share_number} ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಪಾವತಿಸಿದ ಶೇರು ಮೊತ್ತ: ₹{totalAmt.toLocaleString('en-IN')}, ವರ್ಗ: {sh.schedule_cast || 'ಅ - ವರ್ಗ'}, ಪುಸ್ತಕ ಸಂಖ್ಯೆ: {cleanBookNo || '41'}.
                      </p>
                    </div>
                  </div>
                ) : (
                  timelineEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative">
                      <div className="absolute -left-5 sm:-left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-950 border border-slate-900" />
                      <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 shadow-md space-y-1.5">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                          <span className="font-bold text-white text-xs">{evt.title}</span>
                          <span className="text-[10.5px] font-mono text-slate-400">{evt.date}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">{evt.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUGAR QUOTA & ALLOTMENT */}
        {activeTab === 'sugar_quota' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2 no-print">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-sky-400" /> ಸಕ್ಕರೆ ಕೋಟಾ ಅರ್ಹತೆ & ವಿತರಣೆ
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">ಶೇರು ಆಧಾರಿತ ವಾರ್ಷಿಕ ರಿಯಾಯಿತಿ ಸಕ್ಕರೆ ಕೋಟಾ ವಿವರಗಳು</p>
              </div>
            </div>

            {/* 3 Executive Sugar Metrics (Mobile-Friendly Grid) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center">
                <div className="text-[10px] sm:text-xs text-slate-400">ಒಟ್ಟು ಕೋಟಾ</div>
                <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {totalSugarEntitled} ಚೀಲ
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">ವಾರ್ಷಿಕ ಅರ್ಹತೆ</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center">
                <div className="text-[10px] sm:text-xs text-slate-400">ವಿತರಿಸಲಾದ ಸಕ್ಕರೆ</div>
                <div className="text-lg sm:text-2xl font-black text-sky-400 font-mono mt-0.5">
                  {totalSugarLifted} ಚೀಲ
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">ಪಡೆದ ಚೀಲಗಳು</div>
              </div>

              <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-3 sm:p-4 text-center">
                <div className="text-[10px] sm:text-xs text-amber-300">ಬಾಕಿ ಲಭ್ಯ ಕೋಟಾ</div>
                <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono mt-0.5">
                  {sugarBalance} ಚೀಲ
                </div>
                <div className="text-[9px] sm:text-[10px] text-amber-400/80 mt-0.5">ಗೋದಾಮಿನಲ್ಲಿ ಲಭ್ಯ</div>
              </div>
            </div>

            {/* Instructions Alert Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> ಸಕ್ಕರೆ ಪಡೆಯಲು ಸೂಚನೆಗಳು (Collection Guidelines)
              </div>
              <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>• ಸಕ್ಕರೆ ಪಡೆಯಲು ಕಾರ್ಖಾನೆಯ ಗೋದಾಮಿಗೆ ಭೇಟಿ ನೀಡುವಾಗ ನಿಮ್ಮ <strong>ಸದಸ್ಯತ್ವ ID ಕಾರ್ಡ್</strong> ಅಥವಾ <strong>ಮೊಬೈಲ್ QR ಕೋಡ್</strong> ತೋರಿಸಿ.</li>
                <li>• ವಿತರಣಾ ಕೇಂದ್ರ: ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ಆವರಣ, ಮರಗೂರ - 586204.</li>
                <li>• ಪ್ರತಿ ಪೂರ್ಣ ಶೇರಿಗೆ (₹2,000) ವರ್ಷಕ್ಕೆ 1 ಚೀಲ (50 ಕೆ.ಜಿ.) ಸಕ್ಕರೆ ನಿಗದಿತ ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಲಭ್ಯವಿರುತ್ತದೆ.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL ID CARD */}
        {activeTab === 'id_card' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 no-print">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Contact className="w-4 h-4 text-emerald-400" /> ಅಧಿಕೃತ ಸದಸ್ಯ ಗುರುತಿನ ಚೀಟಿ (Official Member ID Card)
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">ಮುದ್ರಣ ಹಾಗೂ ಪರಿಶೀಲನೆಗೆ ಶಾಸನಬದ್ಧ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಐಡಿ ಕಾರ್ಡ್</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ID ಕಾರ್ಡ್ ಪ್ರಿಂಟ್ ಮಾಡಿ (Print)</span>
                </button>
              </div>
            </div>

            {/* Responsive Scaled ID Card Box */}
            <div className="bg-slate-950 p-2 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 flex flex-col items-center justify-center overflow-x-auto w-full">
              <div className="w-full flex justify-center py-2 max-w-full overflow-x-auto no-scrollbar">
                <OfficialShareholderIDCard
                  shareholder={sh}
                  side={idCardSide}
                  printLayout={printLayout}
                  cardSize={cardSize}
                  showSeal={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ATTENDANCE & AGM QR CODE */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2 no-print">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-400" /> ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM) ಹಾಜರಾತಿ & QR ಪಾಸ್
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">ಕಾರ್ಖಾನೆ ಗೇಟ್ ಹಾಗೂ ಮಹಾಸಭೆಯ ಸಭಾಂಗಣದಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಅಧಿಕೃತ QR ಪಾಸ್</p>
              </div>
            </div>

            {/* Digital Pass Card (Modern Smartphone Wallet Pass) */}
            <div className="max-w-md mx-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-center">
              
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-950 border border-emerald-500/40 p-0.5 shrink-0">
                  <img src={companyLogo || DEFAULT_LOGO_PATH} alt="BSSKN" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ
                </div>
              </div>

              {/* QR Code container */}
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block mx-auto border-2 border-emerald-400/30">
                <ShareholderAttendanceQR shareholder={sh} size={180} />
              </div>

              {/* Member identification on pass */}
              <div className="space-y-1">
                <div className="font-mono text-sm font-bold text-emerald-400">
                  ||| ಷೇರು ನಂ: #{sh.share_no || sh.share_number} |||
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white">{sh.shareholder_name || sh.name}</h4>
                <p className="text-xs text-slate-400">{sh.place || sh.village || '—'}, {sh.circle || '—'}</p>
              </div>

              {/* Voting Eligibility Badge */}
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ನೀವು ಅಧಿಕೃತ ಮಹಾಸಭೆ ಮತದಾರರಾಗಿದ್ದೀರಿ (Eligible Voter)</span>
              </div>

              {/* Print / Save button */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>QR ಪಾಸ್ ಪ್ರಿಂಟ್ ಮಾಡಿ (Print Gate Pass)</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 5. Sticky Bottom Navigation Dock (Mobile Only Thumb-Friendly Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 md:hidden px-2 py-1.5 flex items-center justify-around shadow-2xl no-print">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative min-w-[56px] ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-950/80' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {tab.shortLabel}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 6. Footer (Desktop) */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 no-print hidden md:block">
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
