import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, MapPin, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { ApiService, isShareholderInactive } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * GlobalSearchModal: Global Spotlight / Command Palette Search (Ctrl+K).
 * Allows users to search any shareholder across all 17,085 records from anywhere in the ERP.
 */
export default function GlobalSearchModal({ isOpen, onClose, onSelectShareholder }) {
  const { formatName, formatPlace, formatCategory, isEnglish } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        onSelectShareholder(results[selectedIndex]);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelectShareholder]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const cleanQ = query.trim();
    if (!cleanQ) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await ApiService.getShareholders({
          search: cleanQ,
          limit: 10,
          page: 1
        });
        if (res && res.success) {
          setResults(res.data || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.warn('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fadeIn no-print">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Search Header Input */}
        <div className="relative p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/70 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={isEnglish ? "Search shareholder by Name, Share #, Village, Mobile..." : "ಶೇರುದಾರರ ಹೆಸರು, ಶೇರು ನಂ, ಮೊಬೈಲ್ ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 outline-none"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 text-xs shrink-0"
            title="Close (ESC)"
          >
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">ESC</kbd>
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40">
          {!query.trim() ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-slate-300">
                {isEnglish ? "Search all 17,085 statutory cooperative shareholders" : "ಎಲ್ಲ 17,085 ಶಾಸನಬದ್ಧ ಶೇರುದಾರರಲ್ಲಿ ತ್ವರಿತ ಶೋಧನೆ"}
              </p>
              <p className="text-[11px] text-slate-500">
                {isEnglish ? "Type share number (e.g. 270, 1180), name, or village..." : "ಶೇರು ಸಂಖ್ಯೆ (ಉದಾ: 270, 1180), ಹೆಸರು ಅಥವಾ ಗ್ರಾಮದ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ..."}
              </p>
            </div>
          ) : loading && results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isEnglish ? "Searching statutory records..." : "ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳನ್ನು ಶೋಧಿಸಲಾಗುತ್ತಿದೆ..."}
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <p className="text-xs font-semibold text-slate-300">
                {isEnglish ? `No shareholders found for "${query}"` : `"${query}" ಗೆ ಯಾವುದೇ ಶೇರುದಾರರು ಕಂಡುಬಂದಿಲ್ಲ`}
              </p>
              <p className="text-[11px] text-slate-500">
                {isEnglish ? "Try searching with Share Number, partial Name or Place." : "ದಯವಿಟ್ಟು ಶೇರು ಸಂಖ್ಯೆ, ಹೆಸರಿನ ಭಾಗ ಅಥವಾ ಗ್ರಾಮದ ಹೆಸರಿನಿಂದ ಪ್ರಯತ್ನಿಸಿ."}
              </p>
            </div>
          ) : (
            results.map((sh, idx) => {
              const isInactive = isShareholderInactive(sh);
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={sh.id || idx}
                  onClick={() => {
                    onSelectShareholder(sh);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-emerald-950/60 border border-emerald-600/60 shadow-sm' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Initial Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 overflow-hidden">
                      {sh.photo_url ? (
                        <img src={sh.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(sh.shareholder_name || sh.name || 'S').charAt(0)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                          {sh.shareholder_name || sh.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                          #{sh.share_no || sh.share_number}
                        </span>
                        {isInactive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                            {isEnglish ? 'Inactive' : 'ನಿಷ್ಕ್ರಿಯ'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{sh.book_no || 'B.No: 1'}</span>
                        <span>•</span>
                        <span className="text-emerald-300 font-medium">📍 {formatPlace(sh.place || sh.village_name)}</span>
                        <span>•</span>
                        <span>{formatCategory(sh.schedule_cast)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400 hidden sm:inline">
                      ₹ {(Number(sh.total_amount ?? sh.share_value ?? 2000)).toLocaleString('en-IN')}
                    </span>
                    <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-500'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="p-2.5 px-4 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono">↑↓</kbd> {isEnglish ? 'Navigate' : 'ಆಯ್ಕೆ ಮಾಡಲು'}</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono">Enter</kbd> {isEnglish ? 'Open Profile' : 'ಪ್ರೊಫೈಲ್ ನೋಡಲು'}</span>
          </div>
          <span className="text-emerald-400 font-semibold">{results.length} {isEnglish ? 'results' : 'ಫಲಿತಾಂಶಗಳು'}</span>
        </div>
      </div>
    </div>
  );
}
