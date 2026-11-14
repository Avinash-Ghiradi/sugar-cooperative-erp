import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitchButton from './Common/LanguageSwitchButton';
import ThemeToggle from './Common/ThemeToggle';
import ChangePasswordModal from './Auth/ChangePasswordModal';
import GlobalSearchModal from './Common/GlobalSearchModal';
import ShareholderProfile from './Shareholders/ShareholderProfile';
import {
  Menu, Search, Bell, ShieldCheck, User, LogOut, KeyRound,
  ChevronDown, Briefcase, Building2, CheckCircle2, Download, Printer, Megaphone, RotateCw
} from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout, setActiveModule } = useAuth();
  const { installApp, isInstalled } = usePwa();
  const { t, formatName, isEnglish } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedShareholderId, setSelectedShareholderId] = useState(null);
  const dropdownRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'Cashier': return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Computer Operator': return 'bg-sky-950/80 text-sky-300 border-sky-700/60';
      case 'Attendance Operator': return 'bg-teal-950/80 text-teal-300 border-teal-700/60';
      case 'Sugar Operator': return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      default: return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 no-print select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 text-slate-400 hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{t('factory_name')}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('statutory_ledger_online')}
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Global Kannada / English Language Switcher */}
          <LanguageSwitchButton />
          {/* Light / Dark Mode Theme Switcher */}
          <ThemeToggle />

          {/* Quick Clear Cache & Reload Button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.forceAppRefresh) {
                window.forceAppRefresh();
              } else {
                window.location.reload(true);
              }
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800 transition-colors cursor-pointer shadow-sm"
            title="ಕ್ಯಾಶ್ ಕ್ಲಿಯರ್ & ಪುನಃ ಲೋಡ್ (Clear Cache & Reload)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          
          {/* Quick Notice Board / Announcement Button */}
          {user?.role !== 'Shareholder' && (
            <button
              onClick={() => setActiveModule('notices')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title={isEnglish ? "Notice Board & Greetings" : "ಸೂಚನಾ ಫಲಕ & ಶುಭಾಶಯಗಳು"}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isEnglish ? "Notices" : "ಸೂಚನೆಗಳು"}</span>
            </button>
          )}
  
          {/* 5:20 PM Daily Work Summary Quick Print Button */}
          {user?.role !== 'Shareholder' && (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-daily-work-summary'));
                }
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="5:20 PM ದೈನಂದಿನ ಕಾರ್ಯ ನಿರ್ವಹಣಾ ಸಾರಾಂಶ ಮುದ್ರಣ (Daily Work Summary)"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">5:20 PM ಸಾರಾಂಶ</span>
            </button>
          )}

          {/* Chrome App Install Button */}
          {!isInstalled && (
            <button
              onClick={installApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title={isEnglish ? "Install Chrome App" : "ಕ್ರೋಮ್ ಡೆಸ್ಕ್‌ಟಾಪ್ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ"}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{t('install_app')}</span>
            </button>
          )}
          {/* Quick Global Search (Ctrl+K / Spotlight) */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs text-slate-300 transition-all w-60 cursor-pointer shadow-sm group"
            title={isEnglish ? "Quick Global Search (Ctrl+K)" : "ಶೇರುದಾರ ತ್ವರಿತ ಹುಡುಕಾಟ (Ctrl+K)"}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span className="truncate text-slate-400 group-hover:text-slate-200">{t('quick_search')}</span>
            <kbd className="ml-auto text-[10px] bg-slate-800 border border-slate-700/80 px-1.5 py-0.5 rounded text-slate-400 font-mono group-hover:text-emerald-300">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-3 border-l border-slate-800 hover:opacity-90 transition-all cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-slate-950 font-black text-xs shadow-md overflow-hidden shrink-0">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-200 leading-tight flex items-center gap-1">
                  <span className="truncate max-w-[130px]">{formatName(user?.name, user?.name_english)}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded font-semibold border ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role || 'Staff'}
                  </span>
                  {user?.employee_id && (
                    <span className="font-mono text-slate-500">#{user.employee_id}</span>
                  )}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 animate-fadeIn">
                {!isInstalled && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      installApp();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 text-left transition-colors cursor-pointer border-b border-slate-800"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>ಕ್ರೋಮ್ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ (Install App)</span>
                  </button>
                )}
                {/* User Info Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-slate-950 font-black text-sm overflow-hidden shrink-0">
                      {user?.photo_url ? (
                        <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold text-xs text-slate-100 truncate">{user?.name}</div>
                      {user?.kannada_name && user.kannada_name !== user.name && (
                        <div className="text-[11px] text-slate-300 truncate">{user.kannada_name}</div>
                      )}
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${getRoleBadgeColor(user?.role)}`}>
                          {user?.role}
                        </span>
                        {user?.employee_id && (
                          <span className="font-mono text-emerald-400 font-semibold">#{user.employee_id}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(user?.department || user?.designation) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                      {user?.designation && <div><strong>ಹುದ್ದೆ:</strong> {user.designation}</div>}
                      {user?.department && <div><strong>ವಿಭಾಗ:</strong> {user.department}</div>}
                    </div>
                  )}
                </div>

                {/* Dropdown Action Items */}
                <div className="p-1 space-y-0.5 text-xs">
                  {user?.role !== 'Shareholder' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('open-daily-work-summary'));
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>ಇಂದಿನ ಸಾರಾಂಶ ಮುದ್ರಣ (5:20 PM)</span>
                    </button>
                  )}
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setActiveModule('password_manager');
                      }}
                      className="w-full px-3 py-2 text-left text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                    >
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>{t('menu_password_manager')}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>{t('change_password')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      if (typeof window !== 'undefined' && window.forceAppRefresh) {
                        window.forceAppRefresh();
                      } else {
                        window.location.reload(true);
                      }
                    }}
                    className="w-full px-3 py-2 text-left text-sky-300 hover:text-sky-200 hover:bg-sky-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <RotateCw className="w-4 h-4 text-sky-400" />
                    <span>ಕ್ಯಾಶ್ ಕ್ಲಿಯರ್ & ಪುನಃ ಲೋಡ್ (Clear Cache & Reload)</span>
                  </button>

                  <div className="my-1 border-t border-slate-800/60" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Global Spotlight Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectShareholder={(sh) => {
          setSelectedShareholderId(sh.id || sh.shareholder_id);
        }}
      />

      {/* Shareholder Profile Modal when opened from Global Search */}
      {selectedShareholderId && (
        <ShareholderProfile
          shareholderId={selectedShareholderId}
          onClose={() => setSelectedShareholderId(null)}
        />
      )}
    </>
  );
}
