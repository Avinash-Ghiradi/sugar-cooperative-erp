import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  User, Coins, CreditCard, CalendarCheck, PackageCheck, FileSpreadsheet,
  X, Printer, Contact, CheckCircle2, ShieldCheck, MapPin, Phone, Building2
} from 'lucide-react';

export default function ShareholderProfile({ shareholderId, onClose }) {
  const { setActiveModule } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
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
          Loading shareholder profile...
        </div>
      </div>
    );
  }

  const { shareholder, history } = profile;

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'shares', label: 'Share Details', icon: Coins },
    { id: 'transactions', label: `Transactions (${history.transactions?.length || 0})`, icon: CreditCard },
    { id: 'allotments', label: `Sugar Quota (${history.sugarAllotments?.length || 0})`, icon: PackageCheck },
    { id: 'varasa', label: `Varasa History (${history.varasaHistory?.length || 0})`, icon: FileSpreadsheet },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-print">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-lg">
              {shareholder.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">{shareholder.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  shareholder.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {shareholder.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>ID: <strong className="text-emerald-400 font-mono">{shareholder.shareholder_id}</strong></span>
                <span>•</span>
                <span>Share No: <strong className="text-slate-200 font-mono">{shareholder.share_number}</strong></span>
                <span>•</span>
                <span>Shares: <strong className="text-slate-200">{shareholder.number_of_shares}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400" /> Print Profile
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
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2">Personal Details</h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Full Name:</span><span className="text-slate-100 font-medium">{shareholder.name}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Father's / Husband's Name:</span><span className="text-slate-200">{shareholder.father_husband_name}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Date of Birth:</span><span className="text-slate-200">{shareholder.dob || 'N/A'}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Gender:</span><span className="text-slate-200">{shareholder.gender}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Aadhaar Ref:</span><span className="text-slate-200 font-mono">{shareholder.aadhaar_ref || 'Verified'}</span></div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-800 pb-2">Address & Location</h3>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Mobile Number:</span><span className="text-emerald-400 font-mono font-medium">{shareholder.mobile}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Village:</span><span className="text-slate-100 font-medium">{shareholder.village_name}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Circle Division:</span><span className="text-slate-200">{shareholder.circle_name}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Full Address:</span><span className="text-slate-200 text-right max-w-[200px]">{shareholder.address}</span></div>
              </div>
            </div>
          )}

          {activeTab === 'shares' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-slate-400 mb-1">Share Number</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">{shareholder.share_number}</div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-slate-400 mb-1">Total Shares</div>
                  <div className="text-xl font-bold text-slate-100">{shareholder.number_of_shares} Shares</div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-slate-400 mb-1">Total Share Capital</div>
                  <div className="text-xl font-bold text-amber-400">₹ {(shareholder.share_value || shareholder.number_of_shares * 100).toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-semibold text-slate-200 mb-2">Registration & Status Audit</h4>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Registration Date:</span><span className="text-slate-200">{shareholder.registration_date}</span></div>
                <div className="flex justify-between py-1 border-b border-slate-800/40"><span className="text-slate-400">Shareholder Category:</span><span className="text-slate-200">Producer Member (Sugarcane Farmer)</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-400">Remarks:</span><span className="text-slate-300">{shareholder.remarks || 'None'}</span></div>
              </div>
            </div>
          )}

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

          {activeTab === 'varasa' && (
            <div className="space-y-3">
              {history.varasaHistory?.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No Varasa (legal heir) share transfer applications for this shareholder.</div>
              ) : (
                <div className="space-y-3">
                  {history.varasaHistory.map((v) => (
                    <div key={v.id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">Heir: {v.heir_name} ({v.heir_relationship})</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold text-[10px]">{v.approval_status}</span>
                      </div>
                      <p className="text-slate-400">Application Date: {v.application_date} • Mobile: {v.heir_mobile}</p>
                      <p className="text-slate-300">{v.remarks}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-200">Annual General Body Meeting Attendance</h4>
                  <p className="text-slate-400 text-[11px]">Recorded at Cooperative Complex</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-semibold">Present</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
