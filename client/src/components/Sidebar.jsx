import React from 'react';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck, PackageCheck, FileSpreadsheet,
  Building2, MapPin, BarChart3, Contact, Briefcase, UserCog, History, ShieldAlert,
  Settings, LogOut, Upload
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shareholders', label: 'Shareholders (17k+)', icon: Users },
  { id: 'import_export', label: 'Upload CSV (ಅಪ್ಲೋಡ್)', icon: Upload },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'sugar_allotment', label: 'Sugar Allotment', icon: PackageCheck },
  { id: 'varasa', label: 'Varasa Transfer', icon: FileSpreadsheet },
  { id: 'villages', label: 'Village Master', icon: Building2 },
  { id: 'circles', label: 'Circle Master', icon: MapPin },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'id_cards', label: 'ID Card Generator', icon: Contact },
  { id: 'employees', label: 'Employees', icon: Briefcase },
  { id: 'users', label: 'Users & RBAC', icon: UserCog },
  { id: 'audit_logs', label: 'Audit Logs', icon: History },
  { id: 'settings', label: 'Cooperative Settings', icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, activeModule, setActiveModule, hasPermission, logout } = useAuth();

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col no-print`}>
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            CS
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">Chhatrapati Sugar</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Cooperative ERP v2.5</p>
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
