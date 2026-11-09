import React from 'react';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { useLanguage } from '../context/LanguageContext';
import { useCompanyLogo, DEFAULT_LOGO_PATH } from '../services/organizationService';
import {
  Download,
  KeyRound,
  LayoutDashboard, Users, CreditCard, CalendarCheck, PackageCheck, FileSpreadsheet,
  Building2, MapPin, BarChart3, Contact, Briefcase, UserCog, History, ShieldAlert, Megaphone,
  Settings, LogOut, Upload, ArrowRightLeft, UserPlus, ChevronDown, ChevronRight, GitMerge, X
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shareholders', label: 'Shareholders', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'sugar_allotment', label: 'AGM Utilities', icon: PackageCheck },
  { id: 'villages', label: 'Village Master', icon: Building2 },
  { id: 'circles', label: 'Circle Master', icon: MapPin },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'id_cards', label: 'ID Card Generator', icon: Contact },
  { id: 'employees', label: 'Employees', icon: Briefcase },
  { id: 'users', label: 'Users & RBAC', icon: UserCog },
  { id: 'password_manager', label: 'Password Manager', icon: KeyRound },
  { id: 'audit_logs', label: 'Audit Logs', icon: History },
  { id: 'notices', label: 'Notice Board', icon: Megaphone },
  { id: 'settings', label: 'Cooperative Settings', icon: Settings },
];

const SHAREHOLDER_SUB_ITEMS = [
  { id: 'enrollment', label: '1. New Enrollment (ಹೊಸ ನೋಂದಣಿ)', icon: UserPlus },
  { id: 'varasa', label: '2. Varasa (ವಾರಸು ವರ್ಗಾವಣೆ)', icon: FileSpreadsheet },
  { id: 'vargavane', label: '3. Vargavane (ವರ್ಗಾವಣೆ)', icon: ArrowRightLeft },
  { id: 'merge_shares', label: '4. Merge Shares (ಬಹು-ಶೇರು ವಿಲೀನ)', icon: GitMerge },
];

const SHAREHOLDER_MODULES = ['shareholders', 'enrollment', 'varasa', 'vargavane', 'merge_shares'];

const REPORT_SUB_ITEMS = [
  { id: 'shareholders', label: '1. ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು (Shareholders)', icon: Users },
  { id: 'transactions', label: '2. ಆರ್ಥಿಕ ವಹಿವಾಟು ವಹಿ (Financial Ledger)', icon: CreditCard },
  { id: 'sugar', label: '3. AGM Utilities (ಸಕ್ಕರೆ ಹಂಚಿಕೆ)', icon: PackageCheck },
  { id: 'varasa', label: '4. ವಾರಸುದಾರರ ಆಡಿಟ್ (Varasa Audit)', icon: History },
  { id: 'villages', label: '5. ಗ್ರಾಮ & ವಲಯ ಸಾರಾಂಶ (Villages & Circles)', icon: Building2 },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, activeModule, setActiveModule, activeReportSubTab, setActiveReportSubTab, hasPermission, logout } = useAuth();
  const { installApp, isInstalled } = usePwa();
  const { isEnglish, t, formatName } = useLanguage();
  const [reportsExpanded, setReportsExpanded] = React.useState(true);
  const [shareholdersExpanded, setShareholdersExpanded] = React.useState(true);
  const companyLogo = useCompanyLogo();

  const getMenuLabel = (id) => {
    switch (id) {
      case 'dashboard': return isEnglish ? 'Dashboard' : 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್';
      case 'shareholders': return isEnglish ? 'Shareholders' : 'ಶೇರುದಾರರು';
      case 'transactions': return isEnglish ? 'Transactions' : 'ವಹಿವಾಟುಗಳು';
      case 'attendance': return isEnglish ? 'Attendance' : 'ಹಾಜರಾತಿ';
      case 'sugar_allotment': return isEnglish ? 'AGM Utilities' : 'AGM Utilities (ಸಕ್ಕರೆ ಹಂಚಿಕೆ)';
      case 'villages': return isEnglish ? 'Village Master' : 'ಗ್ರಾಮಗಳ ಪಟ್ಟಿ';
      case 'circles': return isEnglish ? 'Circle Master' : 'ವಲಯಗಳ ಪಟ್ಟಿ';
      case 'reports': return isEnglish ? 'Reports & Analytics' : 'ವರದಿಗಳು & ವಿಶ್ಲೇಷಣೆ';
      case 'id_cards': return isEnglish ? 'ID Card Generator' : 'ಗುರುತಿನ ಚೀಟಿ';
      case 'employees': return isEnglish ? 'Employees' : 'ಸಿಬ್ಬಂದಿ';
      case 'users': return isEnglish ? 'Users & RBAC' : 'ಬಳಕೆದಾರರು & ಪಾತ್ರಗಳು';
      case 'password_manager': return isEnglish ? 'Password Manager' : 'ಪಾಸ್‌ವರ್ಡ್ ನಿರ್ವಹಣೆ';
      case 'audit_logs': return isEnglish ? 'Audit Logs' : 'ಆಡಿಟ್ ಲಾಗ್‌ಗಳು';
      case 'notices': return isEnglish ? 'Notice Board & Wishes' : 'ಸೂಚನಾ ಫಲಕ & ಪ್ರಕಟಣೆಗಳು';
      case 'settings': return isEnglish ? 'Cooperative Settings' : 'ಕಾರ್ಖಾನೆ ಸೆಟ್ಟಿಂಗ್ಸ್';
      default: return id;
    }
  };

  const getShareholderSubLabel = (id) => {
    switch (id) {
      case 'enrollment': return isEnglish ? '1. New Enrollment (Form 15)' : '1. ಹೊಸ ನೋಂದಣಿ (ನಮೂನೆ 15)';
      case 'varasa': return isEnglish ? '2. Varasa (Heir Transfer)' : '2. ವಾರಸಾ (ಬದಲಾವಣೆ ವಹಿ)';
      case 'vargavane': return isEnglish ? '3. Share Transfer (Vargavane)' : '3. ಷೇರು ವರ್ಗಾವಣೆ';
      case 'merge_shares': return isEnglish ? '4. Merge Multiple Shares' : '4. ಬಹು-ಶೇರು ವಿಲೀನ';
      default: return id;
    }
  };

  const getReportSubLabel = (id) => {
    switch (id) {
      case 'shareholders': return isEnglish ? '1. Shareholders Reports' : '1. ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು';
      case 'transactions': return isEnglish ? '2. Financial Ledger' : '2. ಆರ್ಥಿಕ ವಹಿವಾಟು ವಹಿ';
      case 'sugar': return isEnglish ? '3. AGM Utilities' : '3. AGM Utilities (ಸಕ್ಕರೆ ಹಂಚಿಕೆ)';
      case 'varasa': return isEnglish ? '4. Varasa Audit' : '4. ವಾರಸುದಾರರ ಆಡಿಟ್';
      case 'villages': return isEnglish ? '5. Villages & Circles' : '5. ಗ್ರಾಮ & ವಲಯ ಸಾರಾಂಶ';
      default: return id;
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 lg:hidden no-print"
          aria-hidden="true"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col no-print`}>
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 overflow-hidden shrink-0">
            <img
              src={companyLogo}
              alt="BSSKN Logo"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                if (!e.target.src.includes('./id_assets/')) {
                  e.target.src = DEFAULT_LOGO_PATH;
                  return;
                }
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center font-black text-[11px] text-slate-950">
              BSSKN
            </div>
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-xs text-slate-100 leading-tight truncate">
              {isEnglish ? 'Shree Bheemashankar Sugar' : 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ'}
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold truncate">
              {isEnglish ? 'Maragur - 586204 • Margur' : 'ಮರಗೂರ - 586204 • Margur'}
            </p>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title={isEnglish ? 'Close menu' : 'ಮೆನು ಮುಚ್ಚಿ'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">{isEnglish ? 'Active Role:' : 'ಸಕ್ರಿಯ ಪಾತ್ರ:'}</span>
        <span className="px-2.5 py-0.5 rounded-full font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50">
          {user?.role || 'Guest'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const permitted = hasPermission(item.id);
          const isActive = activeModule === item.id;

          if (!permitted) return null;

          if (item.id === 'shareholders') {
            const isShareholdersModuleActive = SHAREHOLDER_MODULES.includes(activeModule);
            const isShareholdersOpen = isShareholdersModuleActive && shareholdersExpanded;
            const isCurrentModule = activeModule === 'shareholders';

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (activeModule === 'shareholders') {
                      setShareholdersExpanded(!shareholdersExpanded);
                    } else {
                      setActiveModule('shareholders');
                      setShareholdersExpanded(true);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrentModule
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                      : isShareholdersModuleActive
                      ? 'bg-slate-900 text-emerald-300 font-medium border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 ${isCurrentModule ? 'text-white' : isShareholdersModuleActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{getMenuLabel(item.id)}</span>
                  </div>
                  {isShareholdersOpen ? (
                    <ChevronDown className={`w-3.5 h-3.5 ${isCurrentModule ? 'text-white' : isShareholdersModuleActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${isCurrentModule ? 'text-white' : isShareholdersModuleActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  )}
                </button>

                {/* Sub-sidebar for Shareholders Navigation - ONLY rendered if a shareholder module is in use */}
                {isShareholdersOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-emerald-500/40 ml-4 my-1 bg-slate-900/40 rounded-r-lg">
                    {SHAREHOLDER_SUB_ITEMS.map((sub) => {
                      const SubIcon = sub.icon;
                      if (!hasPermission(sub.id)) return null;
                      const isSubActive = activeModule === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveModule(sub.id);
                            if (window.innerWidth < 1024) setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all text-left ${
                            isSubActive
                              ? 'bg-emerald-950/90 text-emerald-300 font-bold border border-emerald-700/80 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="truncate">{getShareholderSubLabel(sub.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (item.id === 'reports') {
            const isReportsOpen = isActive && reportsExpanded;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (activeModule === 'reports') {
                      setReportsExpanded(!reportsExpanded);
                    } else {
                      setActiveModule('reports');
                      setReportsExpanded(true);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{getMenuLabel(item.id)}</span>
                  </div>
                  {isReportsOpen ? (
                    <ChevronDown className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  )}
                </button>

                {/* Sub-sidebar for Reports Navigation - ONLY rendered if Reports is in use */}
                {isReportsOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-emerald-500/40 ml-4 my-1 bg-slate-900/40 rounded-r-lg">
                    {REPORT_SUB_ITEMS.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = isActive && (activeReportSubTab || 'shareholders') === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveModule('reports');
                            setActiveReportSubTab(sub.id);
                            if (window.innerWidth < 1024) setIsOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all text-left ${
                            isSubActive
                              ? 'bg-emerald-950/90 text-emerald-300 font-bold border border-emerald-700/80 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="truncate">{getReportSubLabel(sub.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{getMenuLabel(item.id)}</span>
            </button>
          );
        })}
      </nav>

      {/* Chrome App Banner */}
      {!isInstalled && (
        <div className="px-3 pb-2">
          <button
            onClick={installApp}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400/60 transition-all text-xs font-bold cursor-pointer shadow-sm group"
            title={isEnglish ? "Install Chrome App" : "ಕ್ರೋಮ್ ಡೆಸ್ಕ್‌ಟಾಪ್ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ"}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px]">{isEnglish ? 'Install Chrome App' : 'ಕ್ರೋಮ್ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್'}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              App
            </span>
          </button>
        </div>
      )}

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{formatName(user?.name, user?.name_english) || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            title={isEnglish ? "Logout" : "ಲಾಗ್‌ಔಟ್"}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
