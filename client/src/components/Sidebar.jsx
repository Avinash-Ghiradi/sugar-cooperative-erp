import React from 'react';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck, PackageCheck, FileSpreadsheet,
  Building2, MapPin, BarChart3, Contact, Briefcase, UserCog, History, ShieldAlert,
  Settings, LogOut, Upload, ArrowRightLeft, UserPlus, ChevronDown, ChevronRight
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shareholders', label: 'Shareholders', icon: Users },
  { id: 'enrollment', label: 'New Enrollment (ಹೊಸ ನೋಂದಣಿ)', icon: UserPlus },
  { id: 'import_export', label: 'Upload Excel (ಎಕ್ಸೆಲ್ ಅಪ್ಲೋಡ್)', icon: FileSpreadsheet },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'sugar_allotment', label: 'Sugar Allotment', icon: PackageCheck },
  { id: 'varasa', label: 'Varasa Transfer (ವಾರಸುದಾರರು)', icon: FileSpreadsheet },
  { id: 'vargavane', label: 'Vargavane Transfer (ವರ್ಗಾವಣೆ)', icon: ArrowRightLeft },
  { id: 'villages', label: 'Village Master', icon: Building2 },
  { id: 'circles', label: 'Circle Master', icon: MapPin },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'id_cards', label: 'ID Card Generator', icon: Contact },
  { id: 'employees', label: 'Employees', icon: Briefcase },
  { id: 'users', label: 'Users & RBAC', icon: UserCog },
  { id: 'audit_logs', label: 'Audit Logs', icon: History },
  { id: 'settings', label: 'Cooperative Settings', icon: Settings },
];

const REPORT_SUB_ITEMS = [
  { id: 'shareholders', label: '1. ಶೇರುದಾರರ ವಿವರ ವರದಿಗಳು (Shareholders)', icon: Users },
  { id: 'transactions', label: '2. ಆರ್ಥಿಕ ವಹಿವಾಟು ವಹಿ (Financial Ledger)', icon: CreditCard },
  { id: 'sugar', label: '3. ಸಕ್ಕರೆ ಕೋಟಾ ಹಂಚಿಕೆ (Sugar Allotment)', icon: PackageCheck },
  { id: 'varasa', label: '4. ವಾರಸುದಾರರ ಆಡಿಟ್ (Varasa Audit)', icon: History },
  { id: 'villages', label: '5. ಗ್ರಾಮ & ವಲಯ ಸಾರಾಂಶ (Villages & Circles)', icon: Building2 },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, activeModule, setActiveModule, activeReportSubTab, setActiveReportSubTab, hasPermission, logout } = useAuth();
  const [reportsExpanded, setReportsExpanded] = React.useState(true);

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col no-print`}>
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20">
            BSSKN
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-xs text-slate-100 leading-tight truncate">ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ</h1>
            <p className="text-[10px] text-emerald-400 font-semibold truncate">ಮರಗೂರ - 586204 • Margur</p>
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">Active Role:</span>
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
                    <span className="truncate">{item.label}</span>
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
                          <span className="truncate">{sub.label}</span>
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
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
