import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ApiService, hasSecondInstallment, getMemberTypeByCategory, getShareholderOwnership, isShareholderInactive } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OfficialShareholderIDCard, { OfficialSocietySeal } from '../IDCards/OfficialShareholderIDCard';
import {
  User, Edit, Coins, CreditCard, CalendarCheck, PackageCheck, FileSpreadsheet,
  X, Printer, Contact, CheckCircle2, ShieldCheck, MapPin, Phone, Building2,
  BookOpen, FileText, Fingerprint, Users2, History, ArrowRightLeft, Stamp,
  Clock, ArrowRight, Award, GitMerge, SlidersHorizontal
} from 'lucide-react';

export default function ShareholderProfile({ shareholderId, onClose, initialTab = 'ledger' }) {
  const { setActiveModule } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'ledger');
  const [loading, setLoading] = useState(true);
  const [idCardSide, setIdCardSide] = useState('Front');
  const [idCardSeal, setIdCardSeal] = useState(true);

  // ID Card Print Options: layout (A4 / PVC), size (85.6x54 / 95x65), and sides (both / front / back)
  const [printLayout, setPrintLayout] = useState(() => {
    try {
      return localStorage.getItem('sugar_erp_id_card_print_layout') || 'a4';
    } catch (e) {
      return 'a4';
    }
  });

  const [cardSize, setCardSize] = useState(() => {
    try {
      return localStorage.getItem('sugar_erp_id_card_print_size') || '85x54';
    } catch (e) {
      return '85x54';
    }
  });

  const [printSides, setPrintSides] = useState('both'); // 'both', 'front', 'back'

  useEffect(() => {
    const handleBeforePrint = () => {
      if (activeTab === 'id_card') {
        document.body.classList.add('id-card-printing');
        document.body.classList.remove('shareholder-record-printing');
      } else {
        document.body.classList.add('shareholder-record-printing');
        document.body.classList.remove('id-card-printing');
      }
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('id-card-printing');
      document.body.classList.remove('shareholder-record-printing');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('id-card-printing');
      document.body.classList.remove('shareholder-record-printing');
    };
  }, [activeTab]);

  const handlePrintIdCard = () => {
    document.body.classList.remove('shareholder-record-printing');
    document.body.classList.add('id-card-printing');
    const cleanup = () => {
      document.body.classList.remove('id-card-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2500);
    }, 120);
  };

  const handlePrintShareholderRecord = () => {
    document.body.classList.remove('id-card-printing');
    document.body.classList.add('shareholder-record-printing');
    const cleanup = () => {
      document.body.classList.remove('shareholder-record-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2500);
    }, 120);
  };

  useEffect(() => {
    loadProfile();
  }, [shareholderId]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const loadProfile = async () => {
    setLoading(true);
    const res = await ApiService.getShareholderById(shareholderId);
    if (res && res.success) {
      setProfile(res);
    }
    setLoading(false);
  };

  if (loading || !profile) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
          Loading statutory shareholder profile...
        </div>
      </div>
    );
  }

  const { shareholder: sh, history } = profile;

  // Dynamic Card Dimension Calculations for 85.6mm x 54.0mm vs 95.0mm x 65.0mm
  const isJumbo = cardSize === '95x65';
  const cardWidth = isJumbo ? '95mm' : '85.6mm';
  const cardHeight = isJumbo ? '65mm' : '54mm';
  const pairWidth = isJumbo ? '190mm' : '171.2mm';
  const sheetMaxWidth = isJumbo ? '196mm' : '186mm';
  const cardOuterHeight = isJumbo ? '254.5px' : '238px';
  const cardOuterScale = isJumbo ? '0.965' : '0.86';
  const cutGuideLabel = isJumbo ? '95×65mm' : '85.6×54mm';

  const tabs = [
    { id: 'ledger', label: '1. Statutory Ledger (ನಮೂನೆ ವಹಿ)', icon: BookOpen },
    { id: 'id_card', label: '2. ಗುರುತಿನ ಚೀಟಿ (Official ID Card)', icon: Contact },
    { id: 'address', label: '3. Address & Place (ಸ್ಥಳ/ವಿಳಾಸ)', icon: MapPin },
    { id: 'tharava', label: '4. Board Tharava (ಠರಾವು ವಿವರ)', icon: FileText },
    { id: 'nominee', label: '5. Nominee (ನಾಮಿನಿ ವಿವರ)', icon: Users2 },
    { id: 'kyc', label: '6. KYC & Biometrics', icon: Fingerprint },
    { id: 'transactions', label: `7. Transactions (${history.transactions?.length || 0})`, icon: CreditCard },
    { id: 'allotments', label: `8. Sugar Quota (${history.sugarAllotments?.length || 0})`, icon: PackageCheck },
    { id: 'history', label: `9. History & Audit Trail (${(history.timeline || []).length || 0})`, icon: History },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-print">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Profile Header */}
        {isShareholderInactive(sh) && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-3 text-xs text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>ದ್ವಿತೀಯ ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಂಡಿದೆ (Second Account Merged & Disabled):</strong> ಈ ಖಾತೆಯ ಮೊತ್ತ (₹{(sh.original_total_amount || sh.transferred_amount || 2000).toLocaleString()}) ಹಾಗೂ ಷೇರುಗಳನ್ನು ಮುಖ್ಯ ಷೇರು <strong>#{sh.merged_into_share_no || 'Master'}</strong> ಗೆ ಅಧಿಕೃತವಾಗಿ ವರ್ಗಾಯಿಸಲಾಗಿದೆ. ಈ ಖಾತೆಯು ಕಾಯಂ ಆಗಿ ನಿಷ್ಕ್ರಿಯಗೊಂಡಿದ್ದು, ಎಲ್ಲೆಡೆ ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ (Disabled Everywhere).
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-900/90 text-rose-200 font-bold text-[10px] whitespace-nowrap border border-rose-700">
              ಮೊತ್ತ ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ (Transferred to #{sh.merged_into_share_no || 'Master'})
            </span>
          </div>
        )}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-lg overflow-hidden shrink-0">
              {sh.photo_url ? (
                <img src={sh.photo_url} alt={sh.shareholder_name || sh.name} className="w-full h-full object-cover" />
              ) : (
                (sh.shareholder_name || sh.name || 'S').charAt(0)
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-100">{sh.shareholder_name || sh.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-sky-400 border border-slate-700">
                  {sh.book_no || 'B.No: 1'}
                </span>
                {isShareholderInactive(sh) ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1 shadow">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>ನಿಷ್ಕ್ರಿಯ (Inactive - ವಿಲೀನಗೊಂಡಿದೆ)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                    ಸಕ್ರಿಯ (Active)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>Share No: <strong className="text-emerald-400 font-mono text-sm">{sh.share_no || sh.share_number}</strong></span>
                <span>•</span>
                <span>Sl. No: <strong className="text-slate-200 font-mono">{sh.sl_no || sh.id}</strong></span>
                <span>•</span>
                <span>Shares: {isShareholderInactive(sh) ? (
                  <strong className="text-slate-400 line-through">0 ಷೇರು (ವರ್ಗಾವಣೆ ➔ #{sh.merged_into_share_no || 'ಮುಖ್ಯ'})</strong>
                ) : (
                  <strong className="text-slate-200">{sh.number_of_shares || 1}</strong>
                )}</span>
                <span>•</span>
                <span>Total Capital: {isShareholderInactive(sh) ? (
                  <span className="text-slate-400 line-through">
                    ₹ 0 <span className="text-[10px] text-amber-300 font-sans">(ಮೂಲ: ₹{(sh.original_total_amount || sh.transferred_amount || 2000).toLocaleString()} ವರ್ಗಾವಣೆ ➔ #{sh.merged_into_share_no})</span>
                  </span>
                ) : (
                  <strong className="text-amber-400">₹ {(sh.total_amount || sh.share_value || 2000).toLocaleString()}</strong>
                )}</span>
                <span>•</span>
                <span>Place: <strong className="text-emerald-300">{sh.place || sh.village_name}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Record Button */}
            {isShareholderInactive(sh) ? (
              <button
                disabled
                className="px-3 py-2 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-50"
                title="ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯಗೊಂಡ ಖಾತೆ - ತಿದ್ದುಪಡಿ ಅಸಾಧ್ಯ (Editing disabled for merged inactive account)"
              >
                <Edit className="w-4 h-4" />
                <span>ಖಾತೆ ನಿಷ್ಕ್ರಿಯ (Disabled)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onEditRecord && sh) {
                    onEditRecord(sh);
                  }
                }}
                className="px-3 py-2 text-white bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-950"
                title="ಶಾಸನಬದ್ಧ 38-ಕಾಲಂಗಳ ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Statutory Shareholder Record)"
              >
                <Edit className="w-4 h-4" />
                <span>ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('id_card')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'id_card'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/80'
              }`}
            >
              <Contact className="w-4 h-4 text-emerald-400" /> ಗುರುತಿನ ಚೀಟಿ (ID Card)
            </button>

            <button
              onClick={handlePrintShareholderRecord}
              className="px-3 py-2 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ ದಾಖಲೆ ಪತ್ರ ಮುದ್ರಿಸಿ (Print Statutory Shareholder Record)"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>ದಾಖಲೆ ಮುದ್ರಿಸಿ (Print Record)</span>
            </button>

            {activeTab === 'id_card' && (
              <button
                onClick={handlePrintIdCard}
                className="px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="ಗುರುತಿನ ಚೀಟಿ ಮುದ್ರಿಸಿ (Print Official ID Card)"
              >
                <Printer className="w-4 h-4" />
                <span>ಕಾರ್ಡ್ ಮುದ್ರಿಸಿ</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-900/50 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tab 1: Statutory Ledger */}
          {activeTab === 'ledger' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Quick Official Record Print Bar */}
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-700/60 p-3.5 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-900/80 border border-emerald-600/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-200">
                      ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ ದಾಖಲೆ ಪತ್ರ (Official Statutory Record Slip)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      ಈ ಷೇರುದಾರರ ಎಲ್ಲಾ 38-ಶಾಸನಬದ್ಧ ವಿವರಗಳು, ಕಂತುಗಳು ಹಾಗೂ ಪ್ರಮಾಣಪತ್ರದ ಅಧಿಕೃತ ಮುದ್ರಣ ಪ್ರತಿ (A4 Format)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePrintShareholderRecord}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>ದಾಖಲೆ ಪತ್ರ ಮುದ್ರಿಸಿ (Print Record)</span>
                </button>
              </div>
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Book & Share Certificate Details
                </h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Book. No:</span><span className="text-sky-400 font-bold font-mono">{sh.book_no || 'B.No: 1'}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Sl. No:</span><span className="text-slate-100 font-mono">{sh.sl_no || sh.id}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Share No:</span><span className="text-emerald-400 font-bold font-mono text-sm">{sh.share_no || sh.share_number}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">No. of Shares:</span>
                  <span className="text-slate-100 font-bold">
                    {isShareholderInactive(sh) ? (
                      <span className="text-slate-400 line-through">0 Shares (ವರ್ಗಾವಣೆ ➔ #{sh.merged_into_share_no || 'ಮುಖ್ಯ'})</span>
                    ) : (
                      `${sh.number_of_shares || 1} Shares`
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Schedule Cast / Class:</span><span className="text-emerald-400 font-semibold">{sh.schedule_cast || 'ಅ - ವರ್ಗ'}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Member Type (ಸದಸ್ಯರ ಪ್ರಕಾರ):</span><span className="text-slate-200 font-medium">{getMemberTypeByCategory(sh.schedule_cast, sh.member_type)}</span></div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" /> Share Capital & Receipt Details
                </h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Total Share Amount (ಒಟ್ಟು ಮೊತ್ತ):</span>
                  <span className="font-bold text-sm font-mono">
                    {isShareholderInactive(sh) ? (
                      <div className="text-right">
                        <span className="text-slate-500 line-through">₹ 0</span>
                        <div className="text-[10px] text-amber-300 font-sans font-normal">
                          ಮೂಲ: ₹{(sh.original_total_amount || sh.transferred_amount || 2000).toLocaleString()} ಮುಖ್ಯ ಖಾತೆ #{sh.merged_into_share_no || 'ಮುಖ್ಯ'} ಗೆ ವರ್ಗಾವಣೆಗೊಂಡಿದೆ
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-400">₹ {(Number(sh.total_amount ?? sh.share_value ?? 2000)).toLocaleString()}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">1st Receipt No (1ನೇ ರಶೀದಿ ನಂ):</span><span className="text-slate-200 font-mono font-semibold">#{sh.receipt_no || sh.id}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">1st Installment (1ನೇ ಕಂತು ಜಮೆ):</span><span className="text-emerald-400 font-mono font-bold">₹ {(sh.receipt_amount || sh.total_amount || 2000).toLocaleString()}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Registration Date (ದಿನಾಂಕ):</span><span className="text-slate-200">{sh.reg_date || sh.registration_date}</span></div>
                {hasSecondInstallment(sh) && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-800/40 bg-amber-950/20 px-2 rounded-lg">
                      <span className="text-amber-400 font-medium">2nd Receipt No (2ನೇ ರಶೀದಿ ನಂ):</span>
                      <span className="text-amber-300 font-mono font-bold">#{sh.reciept}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40 bg-amber-950/20 px-2 rounded-lg">
                      <span className="text-amber-400 font-medium">2nd Installment (2ನೇ ಕಂತು ಜಮೆ):</span>
                      <span className="text-amber-300 font-mono font-bold">₹ {Number(sh.amount).toLocaleString()}</span>
                    </div>
                    {sh.date && (
                      <div className="flex justify-between py-1 border-b border-slate-800/40 bg-amber-950/20 px-2 rounded-lg">
                        <span className="text-slate-400">2nd Installment Date (2ನೇ ಕಂತಿನ ದಿನಾಂಕ):</span>
                        <span className="text-slate-200">{sh.date}</span>
                      </div>
                    )}
                  </>
                )}
                {sh.remaining_balance !== undefined && Number(sh.remaining_balance) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/40 bg-amber-950/30 px-2 rounded-lg text-xs">
                    <span className="text-amber-300 font-medium">Balance for Next Share (ಮುಂದಿನ ಶೇರಿಗೆ ಬಾಕಿ):</span>
                    <span className="text-amber-300 font-mono font-bold">₹ {Number(sh.remaining_balance).toLocaleString()}</span>
                  </div>
                )}
                {sh.new_shares_count !== undefined && Number(sh.new_shares_count) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/40 bg-sky-950/30 px-2 rounded-lg text-xs">
                    <span className="text-sky-300 font-medium">Additional Shares (ಹೆಚ್ಚುವರಿ ಶೇರುಗಳು):</span>
                    <span className="text-sky-300 font-mono font-bold">{sh.new_shares_count} Shares (@ current rate)</span>
                  </div>
                )}
                <div className="flex justify-between py-1"><span className="text-slate-400">Cooperative Status:</span><span className="text-emerald-400 font-bold">{sh.status || 'Active'}</span></div>
              </div>

              {/* Merged Share Certificates & Multiple Amounts Section */}
              {(sh.is_merged || (sh.merged_holdings && sh.merged_holdings.length > 0) || hasSecondInstallment(sh)) && (
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-amber-400" />
                      ಬಹು-ಶೇರುಗಳು & ಪಾವತಿ ವಿವರಗಳು (Merged Share Holdings & Installments)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
                      {sh.merged_holdings && sh.merged_holdings.length > 0 ? `${sh.merged_holdings.length} Certificates Merged` : '2 Installments (2 ಕಂತುಗಳು)'}
                    </span>
                  </div>

                  {sh.merged_holdings && sh.merged_holdings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {sh.merged_holdings.map((h, hIdx) => (
                        <div key={h.id || hIdx} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-emerald-400 text-xs">ಶೇರು #{h.share_no}</span>
                            <span className="text-[11px] font-bold text-slate-300">{h.shares} ಶೇರು</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>ರಶೀದಿ #{h.receipt_no}</span>
                            <span className="font-mono font-bold text-amber-400">₹ {Number(h.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{h.receipt_date} • {h.book_no || 'B.No: 1'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">1ನೇ ಕಂತು / ರಶೀದಿ (1st Installment)</span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">ರಶೀದಿ #{sh.receipt_no || '—'}</span>
                          <span className="font-mono font-bold text-emerald-400">₹ {Number(sh.receipt_amount || sh.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{sh.reg_date || sh.date}</div>
                      </div>

                      {hasSecondInstallment(sh) && (
                        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-amber-400">2ನೇ ಕಂತು / ರಶೀದಿ (2nd Installment)</span>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">ರಶೀದಿ #{sh.reciept}</span>
                            <span className="font-mono font-bold text-amber-400">₹ {Number(sh.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{sh.date || '—'}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap items-center justify-between text-[11px] text-slate-300 border-t border-slate-800/60">
                    <div>
                      ಒಟ್ಟು ಸಂಯೋಜಿತ ಶೇರುಗಳು: <strong className="text-emerald-400">{sh.number_of_shares || 1} ಶೇರುಗಳು</strong>
                    </div>
                    <div>
                      ಒಟ್ಟು ಶೇರು ಬಂಡವಾಳ ಜಮೆ: <strong className="text-amber-400 font-mono">₹ {Number(sh.total_amount || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Official ID Card */}
          {activeTab === 'id_card' && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-100 text-xs flex items-center gap-2">
                    <Contact className="w-4 h-4 text-emerald-400" />
                    ಅಧಿಕೃತ ಸದಸ್ಯರ ಗುರುತಿನ ಚೀಟಿ (Official Statutory ID Card)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204 • {cardSize === '95x65' ? '95.0mm × 65.0mm (Pouch)' : '85.6mm × 54.0mm (CR80)'} • {printLayout === 'a4' ? 'A4 ಹಾಳೆ ಮುದ್ರಣ (Cut & Fold)' : 'PVC / ಪ್ರತ್ಯೇಕ ಕಾರ್ಡ್'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Flip Preview Side */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setIdCardSide('Front')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        idCardSide === 'Front' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ಮುಂಭಾಗ
                    </button>
                    <button
                      onClick={() => setIdCardSide('Back')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        idCardSide === 'Back' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ಹಿಂಬದಿ
                    </button>
                  </div>

                  {/* Format Toggle (A4 Sheet vs PVC) */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setPrintLayout('a4');
                        try { localStorage.setItem('sugar_erp_id_card_print_layout', 'a4'); } catch (e) {}
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printLayout === 'a4' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="A4 Sheet (Prints Front & Back side-by-side on A4 paper with Cut & Fold Guides)"
                    >
                      A4 ಹಾಳೆ
                    </button>
                    <button
                      onClick={() => {
                        setPrintLayout('pvc');
                        try { localStorage.setItem('sugar_erp_id_card_print_layout', 'pvc'); } catch (e) {}
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printLayout === 'pvc' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Single Card (PVC / User Defined Paper)"
                    >
                      PVC ಕಾರ್ಡ್
                    </button>
                  </div>

                  {/* Card Size Toggle (85.6x54mm vs 95x65mm) */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setCardSize('85x54');
                        try { localStorage.setItem('sugar_erp_id_card_print_size', '85x54'); } catch (e) {}
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        cardSize === '85x54' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Standard CR80 (85.6mm × 54.0mm)"
                    >
                      85.6×54
                    </button>
                    <button
                      onClick={() => {
                        setCardSize('95x65');
                        try { localStorage.setItem('sugar_erp_id_card_print_size', '95x65'); } catch (e) {}
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        cardSize === '95x65' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Pouch / Jumbo (95.0mm × 65.0mm - ಲ್ಯಾಮಿನೇಷನ್ ಪೌಚ್ ಗಾತ್ರ)"
                    >
                      95×65
                    </button>
                  </div>

                  {/* Print Sides Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setPrintSides('both')}
                      className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printSides === 'both' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Print Both Pages (Front & Back)"
                    >
                      ಎರಡೂ ಬದಿ
                    </button>
                    <button
                      onClick={() => setPrintSides('front')}
                      className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printSides === 'front' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Print Front Page Only"
                    >
                      ಮುಂಭಾಗ
                    </button>
                    <button
                      onClick={() => setPrintSides('back')}
                      className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        printSides === 'back' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Print Back Page Only"
                    >
                      ಹಿಂಬದಿ
                    </button>
                  </div>

                  {/* Seal Toggle */}
                  <button
                    onClick={() => setIdCardSeal(!idCardSeal)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                      idCardSeal ? 'bg-purple-950/70 text-purple-300 border-purple-800' : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {idCardSeal ? 'Seal: ON' : 'Seal: OFF'}
                  </button>

                  {/* Print ID Card Button */}
                  <button
                    onClick={handlePrintIdCard}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer transition-all"
                    title="Print ID Card directly (ಮುಂಭಾಗ & ಹಿಂಬದಿ ಕತ್ತರಿಸುವ ಹಾಗೂ ಮಡಚುವ ಗೆರೆಗಳೊಂದಿಗೆ)"
                  >
                    <Printer className="w-4 h-4" /> ಕಾರ್ಡ್ ಮುದ್ರಿಸಿ (Print Card)
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      setActiveModule('id_cards');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                    title="Open Full ID Card Generator & Uploads"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> ಲೋಗೋ/MD ಸಹಿ
                  </button>
                </div>
              </div>

              {/* Card Presentation Container */}
              <div className="py-8 flex flex-col items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6">
                <OfficialShareholderIDCard
                  shareholder={sh}
                  side={idCardSide}
                  showSeal={idCardSeal}
                  cardSize={cardSize}
                  scale={1.25}
                />
                <p className="text-[11px] text-slate-400 mt-4 text-center font-medium">
                  {cardSize === '95x65'
                    ? 'ಲ್ಯಾಮಿನೇಷನ್ ಪೌಚ್ ಅಳತೆ (95.0mm × 65.0mm Pouch) • Attested with Official Stamp & Signatures'
                    : 'Standard Statutory Cooperative ID Card Dimensions (85.6mm × 54.0mm CR80) • Attested with Official Stamp & Signatures'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Address & Place */}
          {activeTab === 'address' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Village & Territorial Jurisdiction
                </h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Place (ಸ್ಥಳ / ಗ್ರಾಮ):</span><span className="text-emerald-300 font-bold text-sm">{sh.place || sh.village_name}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Taluk (ತಾಲೂಕು):</span><span className="text-slate-100 font-semibold">{sh.taluk || 'ಇಂಡಿ'}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">District (ಜಿಲ್ಲೆ):</span><span className="text-slate-100">{sh.district || 'ವಿಜಯಪುರ'}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Pin Code:</span><span className="text-slate-200 font-mono">{sh.pin_code || '586 112'}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Cooperative Circle (ವಲಯ):</span><span className="text-sky-400 font-bold">{sh.circle || sh.circle_name}</span></div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> Street & Local Postal Address
                </h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Nagara (ನಗರ/ಓಣಿ):</span><span className="text-slate-200">{sh.nagara || 'ಗ್ರಾಮ ಠಾಣಾ'}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Road (ರಸ್ತೆ):</span><span className="text-slate-200">{sh.road || 'ಮುಖ್ಯ ರಸ್ತೆ'}</span></div>
                <div className="py-2"><span className="text-slate-400 block mb-1">Full Postal Address:</span><p className="text-slate-200 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">{sh.address}</p></div>
              </div>
            </div>
          )}

          {/* Tab 3: Board Tharava */}
          {activeTab === 'tharava' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" /> Board Resolution & Sanction Details (ಆಡಳಿತ ಮಂಡಳಿ ಠರಾವು)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Tharava No (ಠರಾವು ನಂ.):</span><span className="text-sky-400 font-mono font-bold">{sh.tharava_no || 'TR-01/1982'}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Tharava Date (ಠರಾವು ದಿನಾಂಕ):</span><span className="text-slate-200 font-semibold">{sh.tharava_date || sh.reg_date}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Ownership (ಸ್ವಾಮ್ಯತ್ವ / ಒಡೆತನ):</span><span className="text-emerald-400 font-semibold">{getShareholderOwnership(sh)}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Registration Date:</span><span className="text-slate-200">{sh.reg_date || sh.registration_date}</span></div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-slate-300 text-[11px] leading-relaxed mt-2">
                  ಸದರಿ ಷೇರುದಾರರ ಅರ್ಜಿಯನ್ನು ದಿನಾಂಕ: {sh.tharava_date || sh.reg_date} ರಂದು ನಡೆದ ಆಡಳಿತ ಮಂಡಳಿಯ ಸಭೆಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಠರಾವು ನಂ: {sh.tharava_no || 'TR-01'} ಪ್ರಕಾರ ಅನುಮೋದಿಸಲಾಗಿದೆ.
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Nominee Details */}
          {activeTab === 'nominee' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-emerald-400" /> Registered Nominee & Legal Successor (ನಾಮಿನಿ ವಿವರ)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Nominee Name (ನಾಮಿನಿ ಹೆಸರು):</span><span className="text-slate-100 font-bold">{sh.nominee_name || '—'}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Nominee Aadhaar No:</span><span className="text-slate-200 font-mono">{sh.nominee_aadhaar_no || '—'}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Nominee Mobile No:</span><span className="text-emerald-400 font-mono font-semibold">{sh.nominee_mobile_no || '—'}</span></div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Nominee Relation (ನಾಮಿನಿ ಸಂಬಂಧ):</span><span className="text-slate-200">{sh.nominee_relationship || sh.relationship || 'ಸ್ವಂತ/ಕುಟುಂಬ'}</span></div>
                </div>
                <div className="py-2"><span className="text-slate-400 block mb-1">Nominee Postal Address:</span><p className="text-slate-200 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">{sh.nominee_address || '—'}</p></div>
              </div>
            </div>
          )}

          {/* Tab 5: KYC & Biometrics */}
          {activeTab === 'kyc' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Photo */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center flex flex-col items-center shadow-md">
                  <div className="text-slate-300 font-bold mb-2 flex items-center gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> Shareholder Photo (ಭಾವಚಿತ್ರ)
                  </div>
                  <div className="w-28 h-32 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center mb-2.5 shadow-inner">
                    {sh.photo_url ? (
                      <img src={sh.photo_url} alt="Shareholder" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-600 text-[10px]">No Photo</div>
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${sh.photo_url || sh.photo_updated === 'Yes' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                    {sh.photo_url || sh.photo_updated === 'Yes' ? '✓ Photo Available' : 'Pending Upload'}
                  </span>
                </div>

                {/* 2. Signature */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center flex flex-col items-center shadow-md">
                  <div className="text-slate-300 font-bold mb-2 flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-sky-400" /> Member Signature (ಸಹಿ)
                  </div>
                  <div className="w-full h-32 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center mb-2.5 shadow-inner p-2">
                    {sh.signature_url ? (
                      <img src={sh.signature_url} alt="Signature" className="max-w-full max-h-full object-contain filter invert dark:invert-0" />
                    ) : (
                      <div className="text-slate-600 text-[10px]">No Signature</div>
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${sh.signature_url || sh.signature_updated === 'Yes' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                    {sh.signature_url || sh.signature_updated === 'Yes' ? '✓ Signature Available' : 'Pending Signature'}
                  </span>
                </div>

                {/* 3. Thumb Impression */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center flex flex-col items-center shadow-md">
                  <div className="text-slate-300 font-bold mb-2 flex items-center gap-1.5 text-xs">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-400" /> Thumb Impression (ಹೆಬ್ಬೆರಳು)
                  </div>
                  <div className="w-28 h-32 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center mb-2.5 shadow-inner p-2">
                    {sh.thumb_url ? (
                      <img src={sh.thumb_url} alt="Thumb" className="max-w-full max-h-full object-contain filter invert dark:invert-0" />
                    ) : (
                      <div className="text-slate-600 text-[10px]">No Thumb</div>
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${sh.thumb_url || sh.thumb_updated === 'Yes' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                    {sh.thumb_url || sh.thumb_updated === 'Yes' ? '✓ Thumb Available' : 'Pending Thumb'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Shareholder Aadhaar Card No:</span><span className="text-slate-100 font-mono font-bold">{sh.aadhaar_card_no || sh.aadhaar_ref || 'Verified'}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Shareholder Mobile No:</span><span className="text-emerald-400 font-mono font-bold">{sh.mobile_no || sh.mobile}</span></div>
              </div>
            </div>
          )}

          {/* Tab 6: Transactions */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              {history.transactions?.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No transactions recorded yet for this shareholder.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Ref No</th>
                        <th className="py-2.5 px-3">Payment Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {history.transactions.map((t) => (
                        <tr key={t.id}>
                          <td className="py-2.5 px-3 text-slate-300">{t.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-400">{t.type}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-100">₹ {t.amount}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{t.reference_no}</td>
                          <td className="py-2.5 px-3 text-slate-300">{t.payment_mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 7: Sugar Allotments */}
          {activeTab === 'allotments' && (
            <div className="space-y-3">
              {history.sugarAllotments?.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No sugar allotments recorded for this period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3">Total Quota</th>
                        <th className="py-2.5 px-3">Issued</th>
                        <th className="py-2.5 px-3">Remaining</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {history.sugarAllotments.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2.5 px-3 text-slate-200">{a.allotment_period}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100">{a.sugar_quantity_kg} kg</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-semibold">{a.issued_quantity_kg} kg</td>
                          <td className="py-2.5 px-3 text-amber-400 font-semibold">{a.remaining_quantity_kg} kg</td>
                          <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 8: History & Audit Trail */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2 text-xs">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>ಶೇರುದಾರರ ಸಮಗ್ರ ಇತಿಹಾಸ ಮತ್ತು ಲೆಕ್ಕಪರಿಶೋಧನಾ ದಾಖಲೆ (Shareholder Lifecycle Audit Trail)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ಮೂಲ ನೋಂದಣಿ, ಷೇರುಗಳ ವಿಲೀನ, ೨-ಹಂತದ ಅಡ್ಮಿನ್ ಅನುಮೋದನೆ, ವಾರಸು ವರ್ಗಾವಣೆ, ನೇರ ವರ್ಗಾವಣೆ ಮತ್ತು ಶಾಸನಬದ್ಧ ತಿದ್ದುಪಡಿಗಳ ಇತಿಹಾಸ
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {history.timeline?.length || 0} ಈವೆಂಟ್‌ಗಳು (Events)
                </span>
              </div>

              {(!history.timeline || history.timeline.length === 0) ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  ಯಾವುದೇ ಇತಿಹಾಸ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {history.timeline.map((evt, idx) => {
                    const isEnrollment = evt.type === 'NEW_ENROLLMENT' || evt.type === 'INITIAL_MEMBERSHIP';
                    const isVarasa = evt.type === 'VARASA_TRANSFER';
                    const isVargavane = evt.type === 'VARGAVANE_TRANSFER';
                    const isMerge = evt.type === 'MERGE_SHARES' || (evt.type && evt.type.includes('MERGE'));
                    const isEdit = evt.type === 'SHAREHOLDER_UPDATE' || evt.type === 'STATUTORY_AMENDMENT' || evt.type === 'REVISION';
                    const isInstallment = evt.type === 'MULTIPLE_AMOUNTS';

                    const dotColor = isMerge
                      ? 'bg-amber-400 ring-amber-950'
                      : isVarasa
                      ? 'bg-purple-500 ring-purple-950'
                      : isVargavane
                      ? 'bg-cyan-500 ring-cyan-950'
                      : isEdit
                      ? 'bg-sky-500 ring-sky-950'
                      : isInstallment
                      ? 'bg-indigo-500 ring-indigo-950'
                      : 'bg-emerald-500 ring-emerald-950';

                    const borderColor = isMerge
                      ? 'border-amber-700/60 bg-amber-950/25'
                      : isVarasa
                      ? 'border-purple-800/60 bg-purple-950/20'
                      : isVargavane
                      ? 'border-cyan-800/60 bg-cyan-950/20'
                      : isEdit
                      ? 'border-sky-800/60 bg-sky-950/20'
                      : isInstallment
                      ? 'border-indigo-800/60 bg-indigo-950/20'
                      : 'border-emerald-800/60 bg-emerald-950/20';

                    const iconColor = isMerge
                      ? 'text-amber-400'
                      : isVarasa
                      ? 'text-purple-400'
                      : isVargavane
                      ? 'text-cyan-400'
                      : isEdit
                      ? 'text-sky-400'
                      : isInstallment
                      ? 'text-indigo-400'
                      : 'text-emerald-400';

                    return (
                      <div key={evt.id || idx} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-6 top-2 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 border border-slate-900 shadow-md`} />

                        <div className={`p-4 rounded-2xl border ${borderColor} shadow-lg space-y-3`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              {isMerge && <GitMerge className={`w-4 h-4 ${iconColor}`} />}
                              {isVarasa && <FileSpreadsheet className={`w-4 h-4 ${iconColor}`} />}
                              {isVargavane && <ArrowRightLeft className={`w-4 h-4 ${iconColor}`} />}
                              {isEdit && <FileText className={`w-4 h-4 ${iconColor}`} />}
                              {isInstallment && <Coins className={`w-4 h-4 ${iconColor}`} />}
                              {isEnrollment && <ShieldCheck className={`w-4 h-4 ${iconColor}`} />}
                              {!isMerge && !isVarasa && !isVargavane && !isEdit && !isInstallment && !isEnrollment && (
                                <Clock className={`w-4 h-4 ${iconColor}`} />
                              )}
                              <span className="font-bold text-slate-100 text-xs">{evt.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {evt.date}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                {evt.performed_by}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {evt.description}
                          </p>

                          {/* Key details tags */}
                          {evt.details && Object.keys(evt.details).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/40 text-[11px]">
                              {evt.details.confirmation_steps && (
                                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                                  {evt.details.confirmation_steps}
                                </span>
                              )}
                              {evt.details.combined_share_no_str && (
                                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                                  ವಿಲೀನ ಷೇರುಗಳು: #{evt.details.combined_share_no_str}
                                </span>
                              )}
                              {evt.details.merged_into_share_no && (
                                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                                  ವಿಲೀನಗೊಂಡ ಮುಖ್ಯ ಖಾತೆ: #{evt.details.merged_into_share_no}
                                </span>
                              )}
                              {evt.details.deceased_holder && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                                  ಮೂಲ/ಹಳೆಯ ಶೇರುದಾರರು: <strong className="text-white">{evt.details.deceased_holder}</strong>
                                </span>
                              )}
                              {evt.details.heir_name && (
                                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                  ವಾರಸುದಾರರು: <strong className="text-white">{evt.details.heir_name}</strong>
                                </span>
                              )}
                              {evt.details.transferor && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                                  ವರ್ಗಾವಣೆದಾರರು: <strong className="text-white">{evt.details.transferor}</strong>
                                </span>
                              )}
                              {evt.details.transferee && (
                                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                  ವರ್ಗಾವಣೆ ಪಡೆದವರು: <strong className="text-white">{evt.details.transferee}</strong>
                                </span>
                              )}
                              {evt.details.relationship && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                                  ಸಂಬಂಧ: {evt.details.relationship}
                                </span>
                              )}
                              {evt.details.shares && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-bold">
                                  ಶೇರುಗಳು: {evt.details.shares}
                                </span>
                              )}
                              {evt.details.total_amount && (
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold font-mono">
                                  ಬಂಡವಾಳ: ₹{Number(evt.details.total_amount).toLocaleString()}
                                </span>
                              )}
                              {evt.details.receipt_no && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                                  ರಶೀದಿ: #{evt.details.receipt_no}
                                </span>
                              )}
                              {evt.details.receipt_1 && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                                  1ನೇ ರಶೀದಿ: #{evt.details.receipt_1} (₹{evt.details.amount_1})
                                </span>
                              )}
                              {evt.details.receipt_2 && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                                  2ನೇ ರಶೀದಿ: #{evt.details.receipt_2} (₹{evt.details.amount_2})
                                </span>
                              )}
                              {evt.details.tharava_no && (
                                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-mono">
                                  ಠರಾವು: {evt.details.tharava_no}
                                </span>
                              )}
                              {evt.details.tharava_date && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                                  ದಿನಾಂಕ: {evt.details.tharava_date}
                                </span>
                              )}
                              {/* Edit diff tags */}
                              {evt.details.changes && Array.isArray(evt.details.changes) && evt.details.changes.length > 0 && (
                                <div className="w-full pt-1.5 flex flex-wrap gap-1.5">
                                  {evt.details.changes.map((c, cIdx) => (
                                    <span key={cIdx} className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-200 border border-sky-800/60 text-[10px] font-mono">
                                      {c.field}: <span className="line-through text-slate-400">{c.from || '—'}</span> ➔ <strong className="text-white">{c.to}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Merged Shareholders Full Details Breakdown Section (Shows ONLY Second Account details) */}
                          {(() => {
                            const currentShareNo = String(sh.share_no || sh.share_number || '').trim();
                            const primaryShareNo = String(evt.details?.primary_share_no || currentShareNo).trim();
                            const rawMergedList = evt.details?.merged_shareholders || evt.details?.holdings || [];
                            if (!Array.isArray(rawMergedList) || rawMergedList.length === 0) return null;

                            // User instruction: "only second account details show"
                            // Filter to show ONLY the secondary / merged account(s), excluding the primary account being viewed
                            const secondAccounts = rawMergedList.filter(mRec => {
                              const mShareNo = String(mRec.share_no || '').trim();
                              const isPrimary = mRec.isPrimary || mShareNo === primaryShareNo || mShareNo === currentShareNo;
                              return !isPrimary;
                            });

                            const accountsToShow = secondAccounts.length > 0
                              ? secondAccounts
                              : rawMergedList.filter(mRec => String(mRec.share_no || '').trim() !== currentShareNo);

                            if (accountsToShow.length === 0) return null;

                            return (
                              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <Users2 className="w-3.5 h-3.5 text-amber-400" />
                                    <span>ವಿಲೀನಗೊಂಡ ದ್ವಿತೀಯ ಖಾತೆಯ ವಿವರಗಳು (Merged Secondary Account Details):</span>
                                  </h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
                                    {accountsToShow.length} ದ್ವಿತೀಯ ಖಾತೆ ವಿಲೀನಗೊಂಡಿದೆ
                                  </span>
                                </div>

                                <div className={`grid grid-cols-1 ${accountsToShow.length > 1 ? 'md:grid-cols-2' : ''} gap-2.5`}>
                                  {accountsToShow.map((mRec, mIdx) => {
                                    const isPrimary = mRec.isPrimary || String(mRec.share_no).trim() === primaryShareNo;
                                    return (
                                      <div
                                        key={mIdx}
                                        className="p-3 rounded-xl border text-xs space-y-2 transition-all bg-slate-950/70 border-slate-800 hover:border-amber-500/40"
                                      >
                                        {/* Header: Share No, Name, Role badge */}
                                        <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-1.5">
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono font-bold text-amber-400 text-sm">
                                                #{mRec.share_no}
                                              </span>
                                              <strong className="text-slate-100 text-xs font-bold">
                                                {mRec.shareholder_name || mRec.name}
                                              </strong>
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                              ಸ್ಥಳ: <strong className="text-slate-300">{mRec.place || '—'}</strong>
                                              {mRec.taluk ? ` (ತಾ: ${mRec.taluk})` : ''}
                                            </div>
                                          </div>

                                          <div>
                                            {isPrimary ? (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 shadow-sm whitespace-nowrap">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                <span>ಮುಖ್ಯ ಖಾತೆ (ಸಕ್ರಿಯ)</span>
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-amber-300 border border-amber-800/80 flex items-center gap-1 whitespace-nowrap">
                                                <GitMerge className="w-3 h-3 text-amber-400" />
                                                <span>ದ್ವಿತೀಯ ಖಾತೆ (ವಿಲೀನಗೊಂಡಿದೆ)</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                                          <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">ಷೇರುಗಳ ಸಂಖ್ಯೆ</span>
                                            <span className="font-mono font-bold text-slate-200">
                                              {mRec.shares || 1} ಷೇರು
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">ಶೇರು ಬಂಡವಾಳ</span>
                                            <span className="font-mono font-bold text-emerald-400">
                                              ₹{Number(mRec.amount || 0).toLocaleString()}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">ರಶೀದಿ ಸಂಖ್ಯೆ & ದಿನಾಂಕ</span>
                                            <span className="font-mono text-slate-300">
                                              #{mRec.receipt_no || '—'} {mRec.receipt_date && mRec.receipt_date !== '—' ? `(${mRec.receipt_date})` : ''}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">ಪುಸ್ತಕ / ಠರಾವು ನಂ</span>
                                            <span className="text-slate-300 font-mono">
                                              {mRec.book_no || 'B.No: 1'} {mRec.tharava_no && mRec.tharava_no !== '—' ? `/ ಠರಾವು: ${mRec.tharava_no}` : ''}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>



    {/* Dedicated Official Statutory Shareholder Record Sheet Print Portal */}
    {typeof document !== 'undefined' && createPortal(
      <div className="shareholder-record-print-portal">
        <style>{`
          @media screen {
            .shareholder-record-print-portal { display: none !important; }
          }
          @media print {
            body.shareholder-record-printing > #root {
              display: none !important;
              visibility: hidden !important;
            }
            .id-card-profile-print-portal { display: none !important; }
            body.shareholder-record-printing .id-card-profile-print-portal { display: none !important; }
            body.shareholder-record-printing .shareholder-record-print-portal {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              width: 100% !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
          }
          .sh-record-sheet {
            max-width: 790px;
            margin: 0 auto;
            border: 2px solid #064e3b;
            padding: 18px 22px;
            background: #ffffff;
            color: #0f172a;
            font-size: 11.5px;
            line-height: 1.4;
            position: relative;
            box-sizing: border-box;
          }
          .sh-record-inner-frame {
            border: 1px solid #047857;
            padding: 12px;
          }
        `}</style>

        <div className="sh-record-sheet">
          <div className="sh-record-inner-frame">
            {/* Top Factory Header: Clean Logo (No Background) & Centered Text (No Seal) */}
            <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-3 mb-3 gap-3">
              {/* Clean Factory Logo without any background or border */}
              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                <img
                  src="./id_assets/bsskn_logo.png"
                  alt="BSSKN Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Centered Factory Name & Official Banner */}
              <div className="text-center flex-1">
                <h1 className="text-xl font-black text-emerald-950 leading-tight">
                  ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ
                </h1>
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  SHREE BHEEMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT
                </h2>
                <p className="text-[10.5px] text-slate-700 font-medium mt-0.5">
                  ಕಾರ್ಯಾಲಯ: ಮರಗೂರ - 586204, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ (ಕರ್ನಾಟಕ)
                </p>
                <p className="text-[9.5px] text-slate-600">
                  (ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ರ ಪ್ರಕಾರ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ • Reg No: BSSKN/1982/COOP)
                </p>
                <div className="inline-block mt-1.5 px-4 py-0.5 rounded-full bg-emerald-900 text-white text-[11px] font-black tracking-wide">
                  ಷೇರುದಾರರ ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ ವಿವರ ದಾಖಲೆ (ಫಾರಂ 'ಅ')
                </div>
              </div>

              {/* Invisible spacer on right to ensure center text is perfectly balanced */}
              <div className="w-24 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Sub-Header Status Bar */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 bg-emerald-50/70 border border-emerald-200 px-3 py-1.5 rounded mb-3">
              <div>
                <span>ಮುದ್ರಣ ದಿನಾಂಕ (Date): </span>
                <span className="font-mono text-slate-900">{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>
                <span>ನಮೂನೆ ವಹಿ ಸಂಖ್ಯೆ (Book No): </span>
                <span className="font-mono font-bold text-emerald-900">{sh.book_no || 'B.No: 1'}</span>
                <span className="mx-2">•</span>
                <span>ಕ್ರಮ ಸಂಖ್ಯೆ (Sl. No): </span>
                <span className="font-mono font-bold text-emerald-900">{sh.sl_no || sh.id}</span>
              </div>
              <div>
                <span>ಸದಸ್ಯತ್ವ ಸ್ಥಿತಿ: </span>
                {isShareholderInactive(sh) ? (
                  <span className="font-bold text-rose-800">ನಿಷ್ಕ್ರಿಯ (Inactive - ವಿಲೀನಗೊಂಡಿದೆ)</span>
                ) : (
                  <span className="font-bold text-emerald-800">ಸಕ್ರಿಯ (Active)</span>
                )}
              </div>
            </div>

            {/* Section 1: Member Identification & Shares with Shareholder Photo in Details Place */}
            <div className="mb-3">
              <div className="bg-emerald-900 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-t flex items-center justify-between">
                <span>1. ಸದಸ್ಯರ ಹಾಗೂ ಷೇರು ಪ್ರಮಾಣ ಪತ್ರ ವಿವರ (Member & Share Certificate Identification)</span>
                <span className="font-mono text-amber-300">ಷೇರು ನಂ: #{sh.share_no || sh.share_number}</span>
              </div>
              <div className="flex border border-slate-300 bg-white">
                {/* Left: Shareholder Details Table */}
                <div className="flex-1">
                  <table className="w-full border-collapse text-[10.5px]">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/4 p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಷೇರುದಾರರ ಹೆಸರು:</td>
                        <td className="w-1/4 p-1.5 font-bold text-slate-900 border-r border-slate-300">{sh.shareholder_name || sh.name}</td>
                        <td className="w-1/4 p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಷೇರು ಸಂಖ್ಯೆ (Share No):</td>
                        <td className="w-1/4 p-1.5 font-mono font-bold text-emerald-900">{sh.share_no || sh.share_number}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ವರ್ಗ / ಪ್ರವರ್ಗ (Category):</td>
                        <td className="p-1.5 font-bold text-emerald-800 border-r border-slate-300">{sh.schedule_cast || 'ಅ - ವರ್ಗ'}</td>
                        <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಒಟ್ಟು ಷೇರುಗಳ ಸಂಖ್ಯೆ:</td>
                        <td className="p-1.5 font-bold text-slate-900">{sh.number_of_shares || 1} ಷೇರುಗಳು</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಸದಸ್ಯರ ಪ್ರಕಾರ (Member Type):</td>
                        <td className="p-1.5 text-slate-900 border-r border-slate-300">{getMemberTypeByCategory(sh.schedule_cast, sh.member_type)}</td>
                        <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಸ್ವಾಮ್ಯತ್ವ (Ownership):</td>
                        <td className="p-1.5 text-slate-900">{getShareholderOwnership(sh)}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಲಿಂಗ (Gender):</td>
                        <td className="p-1.5 text-slate-900 border-r border-slate-300">{sh.gender === 'F' ? 'ಮಹಿಳೆ (Female)' : 'ಪುರುಷ (Male)'}</td>
                        <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ನೋಂದಣಿ ದಿನಾಂಕ:</td>
                        <td className="p-1.5 text-slate-900 font-mono">{sh.reg_date || sh.registration_date}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right: Shareholder Photo placed directly inside Shareholder Details place */}
                <div className="w-28 shrink-0 border-l border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-1.5 text-center">
                  <div className="w-20 h-24 border border-slate-400 bg-white flex flex-col items-center justify-center overflow-hidden shadow-sm">
                    {sh.photo_url ? (
                      <img src={sh.photo_url} alt="Shareholder" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-1 text-[9px] text-slate-500 font-medium">
                        ಸದಸ್ಯರ<br />ಭಾವಚಿತ್ರ<br />(Photo)
                      </div>
                    )}
                  </div>
                  <span className="text-[8.5px] font-semibold text-slate-700 mt-1">ಸದಸ್ಯರ ಭಾವಚಿತ್ರ</span>
                </div>
              </div>
            </div>

            {/* Section 2: Share Capital & Installments */}
            <div className="mb-3">
              <div className="bg-emerald-900 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-t flex items-center justify-between">
                <span>2. ಷೇರು ಬಂಡವಾಳ ಮತ್ತು ಕಂತುಗಳ ಜಮೆ ವಿವರ (Share Capital & Receipts)</span>
                <span className="font-mono text-amber-300 font-bold">ಒಟ್ಟು ಬಂಡವಾಳ: ₹ {(sh.total_amount || sh.share_value || 2000).toLocaleString()}</span>
              </div>
              <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/4 p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">1ನೇ ಕಂತು ಜಮೆ ಮೊತ್ತ:</td>
                    <td className="w-1/4 p-1.5 font-mono font-bold text-emerald-900 border-r border-slate-300">₹ {(sh.receipt_amount || sh.total_amount || 2000).toLocaleString()}</td>
                    <td className="w-1/4 p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">1ನೇ ರಶೀದಿ ನಂ & ದಿನಾಂಕ:</td>
                    <td className="w-1/4 p-1.5 font-mono text-slate-900">#{sh.receipt_no || sh.id} ({sh.reg_date || sh.registration_date})</td>
                  </tr>
                  {hasSecondInstallment(sh) && (
                    <tr className="border-b border-slate-200 bg-amber-50/50">
                      <td className="p-1.5 bg-amber-100/70 font-semibold text-slate-700 border-r border-slate-300">2ನೇ ಕಂತು ಜಮೆ ಮೊತ್ತ:</td>
                      <td className="p-1.5 font-mono font-bold text-amber-900 border-r border-slate-300">₹ {Number(sh.amount).toLocaleString()}</td>
                      <td className="p-1.5 bg-amber-100/70 font-semibold text-slate-700 border-r border-slate-300">2ನೇ ರಶೀದಿ ನಂ & ದಿನಾಂಕ:</td>
                      <td className="p-1.5 font-mono text-slate-900">#{sh.reciept} ({sh.date || '-'})</td>
                    </tr>
                  )}
                  {sh.remaining_balance !== undefined && Number(sh.remaining_balance) > 0 && (
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಮುಂದಿನ ಶೇರಿಗೆ ಬಾಕಿ:</td>
                      <td className="p-1.5 font-mono font-bold text-amber-700 border-r border-slate-300">₹ {Number(sh.remaining_balance).toLocaleString()}</td>
                      <td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಹೆಚ್ಚುವರಿ ಶೇರುಗಳು (@ ಪ್ರಸ್ತುತ ದರ):</td>
                      <td className="p-1.5 font-bold text-sky-800">{sh.new_shares_count || 0} ಶೇರುಗಳು</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Merged Holdings mini-table if merged */}
              {sh.merged_holdings && sh.merged_holdings.length > 0 && (
                <div className="mt-1 border border-amber-300 bg-amber-50/60 p-2 text-[10px]">
                  <strong className="text-amber-900">ಸಂಯೋಜಿತ ಶೇರುಗಳ ವಿವರ (Merged Certificates): </strong>
                  {sh.merged_holdings.map((h, i) => (
                    <span key={i} className="inline-block mr-3">
                      ಶೇರು #{h.share_no} ({h.shares} ಶೇರು, ₹ {Number(h.amount || 0).toLocaleString()}, ರಶೀದಿ: #{h.receipt_no})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Place, Address & Board Tharava */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="bg-emerald-900 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-t">
                  3. ಸ್ಥಳ ಹಾಗೂ ಅಂಚೆ ವಿಳಾಸ (Jurisdiction & Address)
                </div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <tbody>
                    <tr className="border-b border-slate-200"><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 w-1/3 border-r border-slate-300">ಗ್ರಾಮ / ಸ್ಥಳ:</td><td className="p-1.5 font-bold text-slate-900">{sh.place || sh.village_name}</td></tr>
                    <tr className="border-b border-slate-200"><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ತಾಲೂಕು & ಜಿಲ್ಲೆ:</td><td className="p-1.5 text-slate-900">{sh.taluk || 'ಇಂಡಿ'}, {sh.district || 'ವಿಜಯಪುರ'}</td></tr>
                    <tr className="border-b border-slate-200"><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಪಿನ್ ಕೋಡ್ & ವಲಯ:</td><td className="p-1.5 text-slate-900">{sh.pin_code || '586 112'} • {sh.circle || 'ವಲಯ'}</td></tr>
                    <tr><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ಪೂರ್ಣ ವಿಳಾಸ:</td><td className="p-1.5 text-slate-800">{sh.address}</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <div className="bg-emerald-900 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-t">
                  4. ಆಡಳಿತ ಮಂಡಳಿ ಠರಾವು & ನಾಮಿನಿ ವಿವರ
                </div>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <tbody>
                    <tr className="border-b border-slate-200"><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 w-1/3 border-r border-slate-300">ಠರಾವು ನಂ & ದಿನಾಂಕ:</td><td className="p-1.5 font-mono font-bold text-slate-900">{sh.tharava_no || 'TR-01/1982'} ({sh.tharava_date || sh.reg_date})</td></tr>
                    <tr className="border-b border-slate-200"><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ನಾಮಿನಿ ಹೆಸರು:</td><td className="p-1.5 font-bold text-slate-900">{sh.nominee_name || '—'}</td></tr>
                    <tr className="border-b border-slate-200"><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ನಾಮಿನಿ ಸಂಬಂಧ:</td><td className="p-1.5 text-slate-900">{sh.nominee_relationship || '—'}</td></tr>
                    <tr><td className="p-1.5 bg-slate-100 font-semibold text-slate-700 border-r border-slate-300">ನಾಮಿನಿ ಆಧಾರ್ / ಮೊ.:</td><td className="p-1.5 text-slate-900 font-mono">{sh.nominee_aadhaar_no || '—'} / {sh.nominee_mobile_no || '—'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: KYC & Signatures Block */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50 mb-3">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 border-b border-slate-200 pb-1.5 mb-2">
                <span>ಆಧಾರ್ ಕಾರ್ಡ್: <strong className="font-mono text-slate-900">{sh.aadhaar_card_no || 'ದಾಖಲಿಸಲಾಗಿದೆ'}</strong></span>
                <span>ಮೊಬೈಲ್ ನಂ: <strong className="font-mono text-slate-900">{sh.mobile_no || '—'}</strong></span>
                <span>ಇ-ಸಹಿ / ಹೆಬ್ಬೆರಳು: <strong className="text-emerald-800">{sh.signature_url ? 'ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'ಲಭ್ಯವಿದೆ'}</strong></span>
              </div>

              {/* 4 Signatures and Stamp */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                {/* 1. Member Sign / Thumb */}
                <div className="flex flex-col items-center justify-end h-24 border border-dashed border-slate-300 bg-white p-1 rounded">
                  {sh.signature_url ? (
                    <img src={sh.signature_url} alt="Member Sign" className="max-h-12 object-contain mb-1" />
                  ) : sh.thumb_url ? (
                    <img src={sh.thumb_url} alt="Member Thumb" className="max-h-12 object-contain mb-1" />
                  ) : (
                    <div className="text-[9px] text-slate-400 mb-2">(ಸಹಿ / ಹೆಬ್ಬೆರಳು)</div>
                  )}
                  <span className="text-[9.5px] font-bold text-slate-800 border-t border-slate-300 w-full pt-0.5">
                    ಸದಸ್ಯರ ಸಹಿ / ಹೆಬ್ಬೆರಳು
                  </span>
                </div>

                {/* 2. Prepared by */}
                <div className="flex flex-col items-center justify-end h-24 border border-dashed border-slate-300 bg-white p-1 rounded">
                  <div className="text-[9px] text-slate-400 mb-2">ಕರಣಿಕರು</div>
                  <span className="text-[9.5px] font-bold text-slate-800 border-t border-slate-300 w-full pt-0.5">
                    ತಯಾರಿಸಿದವರು (Clerk)
                  </span>
                </div>

                {/* 3. Verified by */}
                <div className="flex flex-col items-center justify-end h-24 border border-dashed border-slate-300 bg-white p-1 rounded">
                  <div className="text-[9px] text-slate-400 mb-2">ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ</div>
                  <span className="text-[9.5px] font-bold text-slate-800 border-t border-slate-300 w-full pt-0.5">
                    ಪರಿಶೀಲಿಸಿದವರು (Auditor)
                  </span>
                </div>

                {/* 4. MD & Official Seal */}
                <div className="flex flex-col items-center justify-end h-24 border border-dashed border-slate-300 bg-white p-1 rounded relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-75 pointer-events-none">
                    <OfficialSocietySeal className="w-full h-full" />
                  </div>
                  <img
                    src="./id_assets/md_signature_transparent.png"
                    alt="MD Sign"
                    className="max-h-10 object-contain mb-1 relative z-10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-[9.5px] font-bold text-slate-800 border-t border-slate-300 w-full pt-0.5 relative z-10">
                    ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು
                  </span>
                </div>
              </div>
            </div>

            {/* Official Footer Note */}
            <div className="text-center text-[9px] text-slate-500 border-t border-slate-200 pt-1">
              ಈ ದಾಖಲೆಯು ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ ಇವರ ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ ರಿಜಿಸ್ಟರ್ ಪ್ರಕಾರ ಮುದ್ರಿಸಲ್ಪಟ್ಟಿದೆ.
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

        {typeof document !== 'undefined' && activeTab === 'id_card' && createPortal(
      <div className="id-card-profile-print-portal">
        <style>{`
          @media screen {
            .id-card-profile-print-portal { display: none !important; }
          }
          @media print {
            .id-card-profile-print-portal { display: none !important; }
            body:not(.id-card-printing) .id-card-profile-print-portal { display: none !important; }
            body.shareholder-record-printing .id-card-profile-print-portal { display: none !important; }
            body.id-card-printing > #root {
              display: none !important;
              visibility: hidden !important;
            }
            body.id-card-printing .id-card-profile-print-portal {
              display: block !important;
              visibility: visible !important;
              position: static !important;
              width: 100% !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Anek Kannada', 'Aneka Kannada', 'Noto Sans Kannada', sans-serif !important;
            }
            @page {
              ${printLayout === 'a4'
                ? `size: A4 portrait; margin: ${isJumbo ? '8mm 10mm' : '10mm 12mm'};`
                : `size: ${cardWidth} ${cardHeight}; margin: 0;`}
            }
            ${printLayout === 'pvc' ? `
              body.id-card-printing, body.id-card-printing html {
                width: ${cardWidth} !important;
                height: ${cardHeight} !important;
                max-width: ${cardWidth} !important;
                max-height: ${cardHeight} !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
            ` : ''}
            .id-card-print-single {
              width: ${cardWidth} !important;
              height: ${cardHeight} !important;
              max-width: ${cardWidth} !important;
              max-height: ${cardHeight} !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              position: relative !important;
              display: block !important;
              vertical-align: top !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            .id-card-print-single .id-card-container-outer {
              width: 372px !important;
              height: ${cardOuterHeight} !important;
              min-width: 372px !important;
              min-height: ${cardOuterHeight} !important;
              transform: scale(${cardOuterScale}) !important;
              transform-origin: 0 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .id-card-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .id-card-a4-sheet {
              display: block !important;
              width: 100% !important;
              max-width: ${sheetMaxWidth} !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            .id-card-a4-pairs-container {
              display: flex !important;
              flex-direction: column !important;
              gap: 4mm !important;
              align-items: center !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            .id-card-a4-foldable-unit {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            .id-card-a4-member-pair {
              display: flex !important;
              flex-direction: row !important;
              gap: 0 !important;
              justify-content: center !important;
              align-items: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border: 1px dashed #334155 !important;
              width: ${pairWidth} !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              position: relative !important;
            }
            .id-card-center-fold-line {
              width: 0px !important;
              height: ${cardHeight} !important;
              border-left: 1.5px dashed #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              position: relative !important;
              z-index: 25 !important;
            }
            .id-card-guide-top,
            .id-card-guide-bottom {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              width: ${pairWidth} !important;
              font-size: 7px !important;
              font-weight: 700 !important;
              color: #475569 !important;
              line-height: 1 !important;
              padding: 1.5px 1mm !important;
              user-select: none !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            .id-card-guide-cut-text {
              display: inline-flex !important;
              align-items: center !important;
              gap: 2px !important;
              color: #334155 !important;
              font-size: 6.8px !important;
            }
            .id-card-guide-fold-marker {
              font-weight: 800 !important;
              color: #0f172a !important;
              font-size: 7px !important;
              letter-spacing: 0.3px !important;
              text-align: center !important;
            }
            .id-card-guide-single {
              width: ${cardWidth} !important;
            }
            .id-card-cut-border {
              border: 1px dashed #334155 !important;
              box-sizing: border-box !important;
            }
            .id-card-a4-single-unit {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .id-card-a4-grid {
              display: grid !important;
              grid-template-columns: repeat(2, ${cardWidth}) !important;
              gap: 4mm !important;
              justify-content: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            .id-card-print-pvc-list {
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
          }
        `}</style>

        {printLayout === 'a4' ? (
          <div className="id-card-a4-sheet">
            {printSides === 'both' ? (
              <div className="id-card-a4-pairs-container">
                <div className="id-card-a4-foldable-unit">
                  <div className="id-card-guide-top">
                    <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ ({cutGuideLabel} Cut)</span>
                    <span className="id-card-guide-fold-marker">▼ ಇಲ್ಲಿ ಮಡಚಿ (Fold Line) ▼</span>
                    <span className="id-card-guide-cut-text">✂ Cut</span>
                  </div>

                  <div className="id-card-a4-member-pair">
                    <div className="id-card-print-single">
                      <OfficialShareholderIDCard
                        shareholder={sh}
                        side="Front"
                        showSeal={idCardSeal}
                        cardSize={cardSize}
                        scale={1}
                      />
                    </div>

                    <div className="id-card-center-fold-line" title="ಮಡಚುವ ಗೆರೆ (Fold Line)"></div>

                    <div className="id-card-print-single">
                      <OfficialShareholderIDCard
                        shareholder={sh}
                        side="Back"
                        showSeal={idCardSeal}
                        cardSize={cardSize}
                        scale={1}
                      />
                    </div>
                  </div>

                  <div className="id-card-guide-bottom">
                    <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ ({cutGuideLabel} Cut)</span>
                    <span className="id-card-guide-fold-marker">▲ ಇಲ್ಲಿ ಮಡಚಿ (Fold Line) ▲</span>
                    <span className="id-card-guide-cut-text">✂ Cut</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="id-card-a4-pairs-container">
                <div className="id-card-a4-single-unit">
                  <div className="id-card-guide-top id-card-guide-single">
                    <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ ({cutGuideLabel} Cut Line)</span>
                    <span className="id-card-guide-cut-text">✂ Cut</span>
                  </div>
                  <div className="id-card-print-single id-card-cut-border">
                    <OfficialShareholderIDCard
                      shareholder={sh}
                      side={printSides === 'front' ? 'Front' : 'Back'}
                      showSeal={idCardSeal}
                      cardSize={cardSize}
                      scale={1}
                    />
                  </div>
                  <div className="id-card-guide-bottom id-card-guide-single">
                    <span className="id-card-guide-cut-text">✂ ಕತ್ತರಿಸುವ ಗೆರೆ ({cutGuideLabel} Cut Line)</span>
                    <span className="id-card-guide-cut-text">✂ Cut</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="id-card-print-pvc-list">
            {(printSides === 'both' ? ['Front', 'Back'] : [printSides === 'front' ? 'Front' : 'Back']).map((sideName, sIdx) => (
              <div
                key={`pvc-${sh.id || 'sh'}-${sideName}`}
                className={`id-card-print-single ${sIdx === 0 && printSides === 'both' ? 'id-card-page-break' : ''}`}
              >
                <OfficialShareholderIDCard
                  shareholder={sh}
                  side={sideName}
                  showSeal={idCardSeal}
                  cardSize={cardSize}
                  scale={1}
                />
              </div>
            ))}
          </div>
        )}
      </div>,
      document.body
    )}
  </>
  );
}
