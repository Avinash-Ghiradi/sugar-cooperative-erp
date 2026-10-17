import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  User, Coins, CreditCard, CalendarCheck, PackageCheck, FileSpreadsheet,
  X, Printer, Contact, CheckCircle2, ShieldCheck, MapPin, Phone, Building2,
  BookOpen, FileText, Fingerprint, Users2
} from 'lucide-react';

export default function ShareholderProfile({ shareholderId, onClose }) {
  const { setActiveModule } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('ledger');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [shareholderId]);

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

  const tabs = [
    { id: 'ledger', label: '1. Statutory Ledger (ನಮೂನೆ ವಹಿ)', icon: BookOpen },
    { id: 'address', label: '2. Address & Place (ಸ್ಥಳ/ವಿಳಾಸ)', icon: MapPin },
    { id: 'tharava', label: '3. Board Tharava (ಠರಾವು ವಿವರ)', icon: FileText },
    { id: 'nominee', label: '4. Nominee (ನಾಮಿನಿ ವಿವರ)', icon: Users2 },
    { id: 'kyc', label: '5. KYC & Biometrics', icon: Fingerprint },
    { id: 'transactions', label: `6. Transactions (${history.transactions?.length || 0})`, icon: CreditCard },
    { id: 'allotments', label: `7. Sugar Quota (${history.sugarAllotments?.length || 0})`, icon: PackageCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-print">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Profile Header */}
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
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">{sh.shareholder_name || sh.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-sky-400 border border-slate-700">
                  {sh.book_no || 'B.No: 1'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>Share No: <strong className="text-emerald-400 font-mono text-sm">{sh.share_no || sh.share_number}</strong></span>
                <span>•</span>
                <span>Sl. No: <strong className="text-slate-200 font-mono">{sh.sl_no || sh.id}</strong></span>
                <span>•</span>
                <span>Shares: <strong className="text-slate-200">{sh.number_of_shares || 1}</strong></span>
                <span>•</span>
                <span>Total Capital: <strong className="text-amber-400">₹ {(sh.total_amount || sh.share_value || 2000).toLocaleString()}</strong></span>
                <span>•</span>
                <span>Place: <strong className="text-emerald-300">{sh.place || sh.village_name}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" /> Print
            </button>

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
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Book & Share Certificate Details
                </h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Book. No:</span><span className="text-sky-400 font-bold font-mono">{sh.book_no || 'B.No: 1'}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Sl. No:</span><span className="text-slate-100 font-mono">{sh.sl_no || sh.id}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Share No:</span><span className="text-emerald-400 font-bold font-mono text-sm">{sh.share_no || sh.share_number}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">No. of Shares:</span><span className="text-slate-100 font-bold">{sh.number_of_shares || 1} Shares</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Schedule Cast / Class:</span><span className="text-emerald-400 font-semibold">{sh.schedule_cast || 'ಅ - ವರ್ಗ'}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Member Type:</span><span className="text-slate-200">{sh.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)'}</span></div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" /> Share Capital & Receipt Details
                </h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Total Share Amount:</span><span className="text-amber-400 font-bold text-sm">₹ {(sh.total_amount || sh.share_value || 2000).toLocaleString()}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Receipt No:</span><span className="text-slate-200 font-mono">{sh.receipt_no || sh.id}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Receipt Amount:</span><span className="text-slate-100 font-mono">₹ {(sh.receipt_amount || sh.amount || 2000).toLocaleString()}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Receipt Date:</span><span className="text-slate-200">{sh.date || sh.reg_date || sh.registration_date}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Registration Date:</span><span className="text-slate-200">{sh.reg_date || sh.registration_date}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Cooperative Status:</span><span className="text-emerald-400 font-bold">{sh.status || 'Active'}</span></div>
              </div>
            </div>
          )}

          {/* Tab 2: Address & Place */}
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
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Relationship (ಸಂಬಂಧ):</span><span className="text-slate-200">{sh.relationship || 'ಸ್ವಂತ (Self)'}</span></div>
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
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40"><span className="text-slate-400">Relationship to Member:</span><span className="text-slate-200">{sh.relationship || 'ಸ್ವಂತ/ಕುಟುಂಬ'}</span></div>
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
        </div>
      </div>
    </div>
  );
}
