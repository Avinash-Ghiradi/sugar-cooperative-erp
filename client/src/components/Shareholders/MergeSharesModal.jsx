import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  GitMerge, Search, CheckCircle2, AlertCircle, X, ShieldCheck,
  RefreshCw, Layers, Coins, Award, Check, Filter, ChevronRight
} from 'lucide-react';

export default function MergeSharesModal({ isOpen, onClose, onMergeSuccess }) {
  const { showToast, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mergingKey, setMergingKey] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHoldings();
    }
  }, [isOpen]);

  const loadHoldings = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getMultipleHoldingsSummary();
      if (res && res.success) {
        setSummary(res);
      }
    } catch (err) {
      showToast('Error loading multiple holdings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const candidates = summary?.data || [];
  const filteredCandidates = candidates.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const name = (c.shareholder_name || '').toLowerCase();
    const place = (c.place || '').toLowerCase();
    const taluk = (c.taluk || '').toLowerCase();
    const shareNos = (c.share_numbers || []).join(' ').toLowerCase();
    return name.includes(q) || place.includes(q) || taluk.includes(q) || shareNos.includes(q);
  });

  // Handle single shareholder merge
  const handleMergeOne = async (candidate) => {
    if (user?.role !== 'Admin') {
      showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ಶೇರುಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
      return;
    }
    setMergingKey(candidate.key);
    try {
      const res = await ApiService.mergeShareholderHoldings({
        groupKey: candidate.key,
        adminUser: user?.name || 'Admin'
      });
      if (res && res.success) {
        showToast(`ಯಶಸ್ವಿಯಾಗಿ ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ! ${candidate.shareholder_name} ಅವರ ${candidate.count} ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್‌ಗಳನ್ನು (${res.combinedShares} ಶೇರುಗಳು, ₹${res.combinedTotalAmt.toLocaleString()}) ಏಕೀಕರಿಸಲಾಗಿದೆ.`);
        await loadHoldings();
        if (onMergeSuccess) onMergeSuccess();
      } else {
        showToast(res?.message || 'ವಿಲೀನಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    } finally {
      setMergingKey(null);
    }
  };

  // Handle batch merge of all detected shareholders
  const handleMergeAll = async () => {
    if (user?.role !== 'Admin') {
      showToast('ಕೇವಲ Admin ಗಳಿಗೆ ಮಾತ್ರ ಶೇರುಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಲು ಅನುಮತಿ ಇದೆ (Admin approval required)', 'error');
      return;
    }

    const count = candidates.length;
    if (count === 0) return;

    if (!window.confirm(`ಪತ್ತೆಯಾದ ಒಟ್ಟು ${count} ಶೇರುದಾರರ ಬಹು-ಶೇರುಗಳು ಮತ್ತು ಮೊತ್ತಗಳನ್ನು ಖಚಿತವಾಗಿ ವಿಲೀನಗೊಳಿಸಲು ಬಯಸುವಿರಾ? ಇದು ಎಲ್ಲಾ ಪ್ರತ್ಯೇಕ ಶೇರು ಸಂಖ್ಯೆಗಳು, ಕಂತುಗಳು ಹಾಗೂ ಒಟ್ಟು ಶೇರುಗಳನ್ನು ಏಕೀಕರಿಸುತ್ತದೆ.`)) {
      return;
    }

    setIsMerging(true);
    try {
      const res = await ApiService.mergeAllMultipleHoldings({
        adminUser: user?.name || 'Admin'
      });
      if (res && res.success) {
        showToast(`ಅಭಿನಂದನೆಗಳು! ಒಟ್ಟು ${res.mergedCount} ಶೇರುದಾರರ ${res.totalSharesCombined} ಶೇರುಗಳು ಮತ್ತು ₹${res.totalCapitalCombined?.toLocaleString()} ಮೊತ್ತವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಏಕೀಕರಿಸಲಾಗಿದೆ!`);
        await loadHoldings();
        if (onMergeSuccess) onMergeSuccess();
      } else {
        showToast(res?.message || 'ವಿಲೀನ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err) {
      showToast('ದೋಷ: ' + err.message, 'error');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                ಬಹು-ಶೇರುಗಳು & ಮೊತ್ತಗಳ ವಿಲೀನ ನಿರ್ವಹಣೆ (Merge Multiple Shares & Amounts)
              </h2>
              <p className="text-xs text-slate-400">
                ಒಂದೇ ಶೇರುದಾರರಿಗೆ ಇರುವ ಬಹು ಮೊತ್ತಗಳು, ಕಂತುಗಳು ಹಾಗೂ ಪ್ರತ್ಯೇಕ ಶೇರು ಸಂಖ್ಯೆಗಳನ್ನು ಏಕೀಕೃತ ಖಾತೆಯಾಗಿ ವಿಲೀನಗೊಳಿಸಿ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/90 border border-amber-900/40 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">ಪತ್ತೆಯಾದ ಬಹು-ಶೇರುದಾರರು</span>
              <strong className="text-lg font-bold text-amber-300 font-mono">
                {loading ? '...' : (summary?.totalDetectedShareholders || 0)} ಸದಸ್ಯರು
              </strong>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-900/40 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಶೇರುಗಳು</span>
              <strong className="text-lg font-bold text-emerald-300 font-mono">
                {loading ? '...' : (summary?.totalMergedSharesSum || 0)} ಶೇರುಗಳು
              </strong>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-sky-900/40 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">ಒಟ್ಟು ಸಂಯೋಜಿತ ಶೇರು ಬಂಡವಾಳ</span>
              <strong className="text-lg font-bold text-sky-300 font-mono">
                {loading ? '...' : `₹ ${(summary?.totalMergedCapitalSum || 0).toLocaleString()}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Search & Batch Action Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ಶೇರುದಾರರ ಹೆಸರು, ಗ್ರಾಮ, ಅಥವಾ ಶೇರು ನಂ. ಹುಡುಕಿ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMergeAll}
              disabled={isMerging || candidates.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-950 transition-all cursor-pointer"
            >
              {isMerging ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ವಿಲೀನ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ...</span>
                </>
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  <span>ಎಲ್ಲಾ ಬಹು-ಶೇರುಗಳನ್ನು ಒಟ್ಟಿಗೆ ವಿಲೀನಗೊಳಿಸಿ (Merge All {candidates.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Candidates List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>ಬಹು-ಮೊತ್ತಗಳು ಮತ್ತು ಶೇರುಗಳ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ...</span>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-200">
                {searchTerm ? 'ಹುಡುಕಾಟಕ್ಕೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.' : 'ಅದ್ಭುತ! ಯಾವುದೇ ಅಸಂಯೋಜಿತ ಬಹು-ಶೇರುಗಳು ಬಾಕಿ ಉಳಿದಿಲ್ಲ.'}
              </p>
              <p className="text-xs text-slate-500">
                ಎಲ್ಲಾ ಶೇರುದಾರರ ಬಹು-ಮೊತ್ತಗಳು ಮತ್ತು ಶೇರುಗಳು ಯಶಸ್ವಿಯಾಗಿ ಏಕೀಕೃತಗೊಂಡಿವೆ.
              </p>
            </div>
          ) : (
            filteredCandidates.map((c, idx) => (
              <div
                key={c.key || idx}
                className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all space-y-3"
              >
                {/* Header row of candidate */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-sm">{c.shareholder_name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-700/60 text-amber-300">
                        {c.count} ಪ್ರತ್ಯೇಕ ಶೇರು ದಾಖಲೆಗಳು
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ಸ್ಥಳ: <strong className="text-emerald-400">{c.place}</strong> {c.taluk ? `(${c.taluk})` : ''} • ವರ್ಗ: {c.schedule_cast}
                      {c.mobile_no && ` • ಮೊಬೈಲ್: ${c.mobile_no}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMergeOne(c)}
                    disabled={mergingKey === c.key || isMerging}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer self-start sm:self-center shrink-0"
                  >
                    {mergingKey === c.key ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <GitMerge className="w-3.5 h-3.5" />
                    )}
                    <span>ವಿಲೀನಗೊಳಿಸಿ (Merge)</span>
                  </button>
                </div>

                {/* Holdings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {c.holdings.map((h, hIdx) => (
                    <div
                      key={h.id || hIdx}
                      className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-400 text-xs">ಶೇರು #{h.share_no}</span>
                          <span className="text-[10px] text-slate-400">({h.shares} ಶೇರು)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ರಶೀದಿ #{h.receipt_no} • {h.receipt_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200">₹ {h.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Merged Result Preview Banner */}
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-amber-200 font-medium">
                      ಏಕೀಕೃತ ಫಲಿತಾಂಶ: <strong>{c.combined_shares} ಒಟ್ಟು ಶೇರುಗಳು</strong> • ಮೊತ್ತ: <strong>₹ {c.combined_total_amount?.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    ಸಂಯೋಜಿತ ಶೇರು ಸಂಖ್ಯೆಗಳು: <strong className="text-emerald-400">#{c.share_numbers.join(', #')}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            ಒಟ್ಟು <b>{candidates.length}</b> ಶೇರುದಾರರು ಬಹು-ಮೊತ್ತಗಳನ್ನು ಹೊಂದಿದ್ದಾರೆ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
