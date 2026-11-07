import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '', showLabel = true }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { isEnglish, t } = useLanguage();

  const label = isDark
    ? (isEnglish ? 'Dark' : 'ಕತ್ತಲು')
    : (isEnglish ? 'Light' : 'ಬೆಳಕು');

  const tooltip = isDark
    ? (isEnglish ? 'Switch to Light Mode' : 'ಬೆಳಕಿನ ಶೈಲಿಗೆ ಬದಲಾಯಿಸಿ (Switch to Light Mode)')
    : (isEnglish ? 'Switch to Dark Mode' : 'ಗಾಢ ಶೈಲಿಗೆ ಬದಲಾಯಿಸಿ (Switch to Dark Mode)');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer select-none group ${
        isDark
          ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 hover:border-amber-400/80 text-amber-300'
          : 'bg-white hover:bg-slate-100 border-slate-300 hover:border-amber-500 text-amber-600'
      } ${className}`}
      title={tooltip}
      aria-label={tooltip}
    >
      {isDark ? (
        <Moon className="w-3.5 h-3.5 text-amber-300 group-hover:-rotate-12 transition-transform" />
      ) : (
        <Sun className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform" />
      )}
      {showLabel && (
        <span className="font-semibold text-[11px] sm:text-xs">
          {label}
        </span>
      )}
    </button>
  );
}
