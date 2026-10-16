import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X, ShieldAlert, Database, Check } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ResetConfirmModal({ isOpen, onClose, onResetComplete }) {
  const { showToast } = useAuth();
  const [resetType, setResetType] = useState('everything'); // 'everything' or 'shareholders'
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      ApiService.getDashboardStats().then(res => {
        if (res && res.stats) {
          setTotalCount(res.stats.totalShareholders || 0);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    setIsProcessing(true);
    try {
      if (resetType === 'shareholders') {
        const res = await ApiService.clearAllShareholders();
        showToast(res.message || 'All shareholder records have been permanently erased.');
      } else {
        const res = await ApiService.clearAllData();
        showToast(res.message || 'Everything erased! System reset to factory clean slate.');
      }
      if (onResetComplete) {
        await onResetComplete();
      }
      onClose();
    } catch (err) {
      showToast('Error during reset: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-900/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-rose-950/80 bg-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-100 flex items-center gap-2">
                Erase Everything & Reset Data
              </h2>
              <p className="text-xs text-rose-300/80">
                ಡೇಟಾಬೇಸ್ ಸಂಪೂರ್ಣ ರದ್ದುಪಡಿಸುವಿಕೆ / ಮರುಹೊಂದಿಕೆ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Warning Banner */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-rose-200 font-bold">Caution: This action cannot be undone!</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                You are about to permanently erase data stored in the browser's IndexedDB and cache.
                {totalCount !== null && (
                  <span className="block font-semibold text-rose-300 mt-1">
                    Currently active: {totalCount.toLocaleString()} shareholder records.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-xs">Choose Erase Scope:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResetType('everything')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  resetType === 'everything'
                    ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg shadow-rose-950/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-rose-300">Erase Everything & Reset All</span>
                  {resetType === 'everything' && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-[11px] text-slate-300">
                  Wipes shareholders, transactions, allotments, transfers, logs, and resets to a clean blank slate.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setResetType('shareholders')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  resetType === 'shareholders'
                    ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg shadow-amber-950/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-amber-300">Shareholders Only</span>
                  {resetType === 'shareholders' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-300">
                  Wipes all shareholder records from IndexedDB and storage without touching other modules.
                </p>
              </button>
            </div>
          </div>

          {/* Safety Confirmation Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-slate-400 text-[11px]">
              Type <strong className="text-rose-400 font-mono">RESET</strong> below to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type RESET"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-center tracking-widest text-sm outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={confirmText !== 'RESET' || isProcessing}
            onClick={handleExecuteReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Erasing and Resetting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>
                  {resetType === 'everything' ? 'Erase Everything & Reset All' : 'Erase All Shareholders'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
