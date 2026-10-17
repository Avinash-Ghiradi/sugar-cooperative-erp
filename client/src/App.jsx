import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ShareholderList from './components/Shareholders/ShareholderList';
import TransactionsModule from './components/Transactions/TransactionsModule';
import AttendanceModule from './components/Attendance/AttendanceModule';
import SugarAllotmentModule from './components/SugarAllotment/SugarAllotmentModule';
import VarasaTransferModule from './components/Varasa/VarasaTransferModule';
import VargavaneTransferModule from './components/Vargavane/VargavaneTransferModule';
import VillageMaster from './components/Master/VillageMaster';
import CircleMaster from './components/Master/CircleMaster';
import ReportsModule from './components/Reports/ReportsModule';
import IDCardGenerator from './components/IDCards/IDCardGenerator';
import EmployeeManagement from './components/Employees/EmployeeManagement';
import UserManagement from './components/Admin/UserManagement';
import AuditLogs from './components/Admin/AuditLogs';
import DataImportExport from './components/Admin/DataImportExport';
import BackupManager from './components/Admin/BackupManager';
import SettingsModule from './components/Settings/SettingsModule';
import { ShieldCheck, LogIn, Lock, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { user, login, activeModule, toastMessage, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              CS
            </div>
            <h1 className="text-xl font-bold text-slate-100">Chhatrapati Sugar Cooperative</h1>
            <p className="text-xs text-slate-400">Shareholder ERP & Administration Portal</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const roleMap = {
                admin: { name: 'System Administrator', role: 'Admin' },
                cashier: { name: 'Ramesh Patil (Chief Cashier)', role: 'Cashier' },
                operator: { name: 'Sunita Deshmukh (Data Operator)', role: 'Computer Operator' },
                employee: { name: 'Vikas Shinde', role: 'Employee' }
              };
              const sel = roleMap[loginUsername.toLowerCase()] || { name: loginUsername, role: 'Admin' };
              login({ id: Date.now(), username: loginUsername, name: sel.name, role: sel.role });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Username</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In to ERP
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[10px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Quick Test Credentials:</div>
              <div>• Admin: <code className="text-emerald-400">admin</code> / <code className="text-slate-300">admin123</code></div>
              <div>• Cashier: <code className="text-emerald-400">cashier</code> / <code className="text-slate-300">cashier123</code></div>
              <div>• Computer Operator: <code className="text-emerald-400">operator</code> / <code className="text-slate-300">operator123</code></div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    if (!hasPermission(activeModule)) {
      return (
        <div className="p-12 text-center bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
          <Lock className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-200">Access Restricted by Role</h2>
          <p className="text-xs text-slate-400">Your logged-in role ({user.role}) does not have permission to access the requested module.</p>
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'shareholders': return <ShareholderList />;
      case 'transactions': return <TransactionsModule />;
      case 'attendance': return <AttendanceModule />;
      case 'sugar_allotment': return <SugarAllotmentModule />;
      case 'varasa': return <VarasaTransferModule />;
      case 'vargavane': return <VargavaneTransferModule />;
      case 'villages': return <VillageMaster />;
      case 'circles': return <CircleMaster />;
      case 'reports': return <ReportsModule />;
      case 'id_cards': return <IDCardGenerator />;
      case 'employees': return <EmployeeManagement />;
      case 'users': return <UserManagement />;
      case 'audit_logs': return <AuditLogs />;
      case 'import_export': return <DataImportExport />;
      case 'backup': return <BackupManager />;
      case 'settings': return <SettingsModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce no-print">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.msg}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
