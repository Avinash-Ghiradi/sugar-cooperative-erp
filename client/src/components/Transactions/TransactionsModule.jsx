import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Search, Plus, FileSpreadsheet, Printer, ArrowUpRight, ArrowDownLeft, X, Save } from 'lucide-react';

export default function TransactionsModule() {
  const { showToast } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const [form, setForm] = useState({
    shareholder_id: 'SH-00005',
    type: 'Purchase',
    share_number: 'SN-100005',
    number_of_shares: 5,
    amount: 500,
    tx_kind: 'Credit',
    reference_no: `REF-${Date.now().toString().slice(-6)}`,
    payment_mode: 'Bank Transfer',
    remarks: 'Share capital subscription deposit'
  });

  useEffect(() => {
    loadTransactions();
  }, [search]);

  const loadTransactions = async () => {
    setLoading(true);
    const res = await ApiService.getTransactions({ search });
    if (res && res.data) {
      setTransactions(res.data);
    }
    setLoading(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const res = await ApiService.addTransaction(form);
    if (res && res.success) {
      showToast(`Transaction ${res.transaction_id} recorded successfully!`);
      setShowAddModal(false);
      loadTransactions();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Shareholder Financial Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Record share purchases, dividends, payments & ledger history</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" /> New Transaction
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Shareholder ID, Name, Reference Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading ledger records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Tx ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Shareholder</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Share No</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Kind</th>
                  <th className="py-3.5 px-4">Ref No</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{t.transaction_id}</td>
                    <td className="py-3 px-4 text-slate-400">{t.date?.split('T')[0]}</td>
                    <td className="py-3 px-4 font-medium">{t.shareholder_name} ({t.shareholder_id})</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{t.type}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{t.share_number}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">₹ {t.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${t.tx_kind === 'Credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.tx_kind === 'Credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {t.tx_kind}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{t.reference_no}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveReceipt(t)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-sky-400 font-medium transition-colors"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Record New Transaction</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Shareholder ID *</label>
                <input
                  type="text"
                  required
                  value={form.shareholder_id}
                  onChange={(e) => setForm({ ...form, shareholder_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Transaction Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="Purchase">Share Purchase</option>
                    <option value="Dividend">Dividend Deposit</option>
                    <option value="Transfer">Share Transfer Fee</option>
                    <option value="Refund">Refund / Withdrawal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Mode</label>
                <select
                  value={form.payment_mode}
                  onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="Bank Transfer">Bank NEFT / RTGS</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Printable View Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 printable-area">
            <div className="text-center border-b pb-3">
              <h2 className="font-extrabold text-sm text-emerald-800">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204</h2>
              <p className="text-[10px] text-slate-600">Shree Bheemashankar Co-operative Sugar Factory, Margur - 586204</p>
            </div>

            <div className="text-xs space-y-2 font-mono">
              <div className="flex justify-between"><span>Receipt No:</span><strong className="text-emerald-700">{activeReceipt.transaction_id}</strong></div>
              <div className="flex justify-between"><span>Date:</span><span>{activeReceipt.date?.split('T')[0]}</span></div>
              <div className="flex justify-between"><span>Shareholder ID:</span><span>{activeReceipt.shareholder_id}</span></div>
              <div className="flex justify-between"><span>Member Name:</span><strong>{activeReceipt.shareholder_name}</strong></div>
              <div className="flex justify-between"><span>Transaction Type:</span><span>{activeReceipt.type}</span></div>
              <div className="flex justify-between border-t border-b py-2 text-sm"><span>Amount Paid:</span><strong className="text-emerald-700">₹ {activeReceipt.amount}</strong></div>
              <div className="flex justify-between"><span>Payment Mode:</span><span>{activeReceipt.payment_mode}</span></div>
              <div className="flex justify-between"><span>Reference No:</span><span>{activeReceipt.reference_no}</span></div>
            </div>

            <div className="pt-4 flex justify-between items-end border-t no-print">
              <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button onClick={() => setActiveReceipt(null)} className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
