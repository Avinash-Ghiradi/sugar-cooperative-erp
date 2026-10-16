import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Search, Bell, ShieldCheck, User, LogOut } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout, setActiveModule } = useAuth();

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-400 hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Chhatrapati Sugar Cooperative ERP</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Statutory Ledger Online
          </span>
        </div>
      </div>

      {/* Quick Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveModule('shareholders')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:border-emerald-500/50 transition-all w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick search shareholder / ID...</span>
          <kbd className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </button>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
