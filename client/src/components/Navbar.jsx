import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './Auth/ChangePasswordModal';
import {
  Menu, Search, Bell, ShieldCheck, User, LogOut, KeyRound,
  ChevronDown, Briefcase, Building2, CheckCircle2
} from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout, setActiveModule } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef(null);

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
            <span className="font-semibold text-slate-200">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ - 586204</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Statutory Ledger Online
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <button
            onClick={() => setActiveModule('shareholders')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:border-emerald-500/50 transition-all w-60 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">ಶೇರುದಾರರ ಹುಡುಕಾಟ (⌘K)...</span>
            <kbd className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
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
                  <span className="truncate max-w-[130px]">{user?.name}</span>
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
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setActiveModule('password_manager');
                      }}
                      className="w-full px-3 py-2 text-left text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                    >
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>ಪಾಸ್‌ವರ್ಡ್ ನಿರ್ವಾಹಕ (Password Manager)</span>
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
                    <span>ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ (Change Password)</span>
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
                    <span>ಲಾಗ್‌ಔಟ್ (Sign Out / Logout)</span>
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
    </>
  );
}
