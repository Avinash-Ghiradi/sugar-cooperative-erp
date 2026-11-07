import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

export default function LanguageSwitchButton({ className = '', variant = 'pill' }) {
  const { language, toggleLanguage, setLanguage, isEnglish } = useLanguage();

  if (variant === 'toggle-bar') {
    return (
      <div className={`inline-flex items-center p-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-sm text-xs font-bold ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('kn')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            language === 'kn'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ಕನ್ನಡ
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          English
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/80 text-xs font-bold transition-all shadow-sm cursor-pointer select-none group ${className}`}
      title={isEnglish ? 'ಕನ್ನಡ ಭಾಷೆಗೆ ಬದಲಾಯಿಸಿ (Switch to Kannada)' : 'Switch complete ERP to English'}
    >
      <Languages className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
      <span className={language === 'kn' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
        ಕನ್ನಡ
      </span>
      <span className="text-slate-600 font-normal">/</span>
      <span className={language === 'en' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
        ENG
      </span>
    </button>
  );
}
