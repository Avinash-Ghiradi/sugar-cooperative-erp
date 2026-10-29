import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Download, CheckSquare, Square, Calendar, Sparkles } from 'lucide-react';
import { downloadEnrollmentDocx, formatDocxDate } from '../../services/enrollmentDocxService';

export default function EnrollmentDocxExportModal({
  isOpen,
  onClose,
  allFilteredRecords = [],
  selectedIds = new Set(),
  initialScope = 'filtered',
  filterSummary = {}
}) {
  const [scope, setScope] = useState(initialScope);
  const [season, setSeason] = useState('2025 – 26');
  const [listDate, setListDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialScope === 'selected' && selectedIds.size > 0) {
        setScope('selected');
      } else if (selectedIds.size > 0 && selectedIds.size < allFilteredRecords.length) {
        setScope('selected');
      } else {
        setScope('filtered');
      }

      // Read season from organization settings if available
      try {
        const saved = localStorage.getItem('sugar_erp_org_settings');
        if (saved) {
          const org = JSON.parse(saved);
          if (org.crushing_season) {
            setSeason(org.crushing_season.replace(/-/g, ' – '));
          }
        }
      } catch (e) {}
    }
  }, [isOpen, initialScope, selectedIds.size, allFilteredRecords.length]);

  if (!isOpen) return null;

  const recordsToExport = scope === 'selected' && selectedIds.size > 0
    ? allFilteredRecords.filter(r => selectedIds.has(r.id || r.enrollment_id))
    : allFilteredRecords;

  const totalShares = recordsToExport.reduce((sum, r) => sum + (parseInt(r.no_shares || r.number_of_shares || 1, 10) || 1), 0);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await downloadEnrollmentDocx({
        records: recordsToExport,
        season: season || '2025 – 26',
        listDate: listDate || formatDocxDate()
      });
      onClose();
    } catch (err) {
      alert('Word document export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ (.docx)</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                  Microsoft Word
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ಶಾಸನಬದ್ಧ 7 ಕಾಲಂ ಕೋಷ್ಟಕ ರೂಪದ ಅಧಿಕೃತ Word ಡಾಕ್ಯುಮೆಂಟ್ ರಫ್ತು
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-200">
          
          {/* Live Title Preview Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              ಡಾಕ್ಯುಮೆಂಟ್ ಹೆಡರ್ ಪೂರ್ವವೀಕ್ಷಣೆ (Header Preview)
            </div>
            <div className="text-center font-bold text-slate-100 text-xs py-1 border-y border-slate-800/80">
              ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ
            </div>
            <div className="text-center text-[10px] text-slate-400">
              SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-300 px-2 pt-0.5">
              <span>ತಾಲೂಕ॥ ಚಡಚಣ</span>
              <span className="text-blue-400 font-extrabold text-xs">ಶೇರು ವಿಭಾಗ</span>
              <span>ಜಿಲ್ಲಾ॥ ವಿಜಯಪೂರ</span>
            </div>
            <div className="text-center font-bold text-emerald-300 text-xs pt-1 border-t border-slate-800/80">
              ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ {season || '2025 – 26'} [{listDate || 'DD/MM/YYYY'}]
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400">
              ದಾಖಲೆಗಳ ಆಯ್ಕೆ (Select Scope):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  scope === 'filtered'
                    ? 'bg-blue-950/60 border-blue-500/80 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5">
                  {scope === 'filtered' ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-200">ಶೋಧಿತ ಎಲ್ಲಾ ದಾಖಲೆಗಳು</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {allFilteredRecords.length} ಶೇರುದಾರರ ಪಟ್ಟಿ
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setScope('selected')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  selectedIds.size === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-950/50 border-slate-800/50'
                    : scope === 'selected'
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-white shadow-sm cursor-pointer'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="mt-0.5">
                  {scope === 'selected' ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-200">ಆಯ್ದ ಶೇರುದಾರರು ಮಾತ್ರ</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {selectedIds.size > 0 ? `${selectedIds.size} ಸದಸ್ಯರು ಆಯ್ಕೆಯಾಗಿದ್ದಾರೆ` : 'ಯಾವುದನ್ನೂ ಆಯ್ಕೆಮಾಡಿಲ್ಲ'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Inputs: Season & List Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                ಕ್ರಶಿಂಗ್ ಹಂಗಾಮು (Season):
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2025 – 26"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                ಯಾದಿ / ಸಭೆಯ ದಿನಾಂಕ (Date):
              </label>
              <input
                type="text"
                value={listDate}
                onChange={(e) => setListDate(e.target.value)}
                placeholder="07/03/2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Summary Row */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-slate-300">
            <div>
              <span className="text-[11px] text-slate-400">ಒಟ್ಟು ರಫ್ತಾಗುವ ದಾಖಲೆಗಳು:</span>{' '}
              <strong className="text-white text-xs">{recordsToExport.length}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">ಒಟ್ಟು ಶೇರುಗಳು:</span>{' '}
              <strong className="text-white text-xs">{totalShares}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">ಕಾಲಂಗಳ ಸಂಖ್ಯೆ:</span>{' '}
              <strong className="text-white text-xs">7 ಕಾಲಂ</strong>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            ರದ್ದು (Cancel)
          </button>
          <button
            type="button"
            disabled={isExporting || recordsToExport.length === 0}
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-950 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Word ಫೈಲ್ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : 'Word (.docx) ಡೌನ್‌ಲೋಡ್'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
