import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { syncAllCloudWorkflows, checkAndApplyCloudReset } from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ShareholderList from './components/Shareholders/ShareholderList';
import TransactionsModule from './components/Transactions/TransactionsModule';
import AttendanceModule from './components/Attendance/AttendanceModule';
import SugarAllotmentModule from './components/SugarAllotment/SugarAllotmentModule';
import VarasaTransferModule from './components/Varasa/VarasaTransferModule';
import VargavaneTransferModule from './components/Vargavane/VargavaneTransferModule';
import NewShareholderModule from './components/Enrollment/NewShareholderModule';
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
import LoginPage from './components/Auth/LoginPage';
import ShareholderPortal from './components/Shareholders/ShareholderPortal';
import ChangePasswordModal from './components/Auth/ChangePasswordModal';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { ShieldCheck, LogIn, Lock, CheckCircle2 } from 'lucide-react';
import { useCompanyLogo, DEFAULT_LOGO_PATH } from './services/organizationService';

function AppContent() {
  const { user, login, activeModule, toastMessage, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // 1. Initial sync on app load
    syncAllCloudWorkflows().catch(() => {});

    // 2. Real-time multi-browser sync when switching tabs/windows
    const handleSyncOnActive = () => {
      checkAndApplyCloudReset().then(wiped => {
        if (wiped) {
          if (typeof window !== 'undefined') window.location.reload();
        } else {
          syncAllCloudWorkflows().catch(() => {});
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', handleSyncOnActive);
    const handleVisibility = () => {
      if (!document.hidden) handleSyncOnActive();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleSyncOnActive);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!user) {
    return <LoginPage />;
  }

  // Force mandatory password change if user logged in with default password (Shares123)
  if (user.is_default_password) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <ChangePasswordModal
          isOpen={true}
          forced={true}
          onClose={() => {}}
        />
      </div>
    );
  }

  // Dedicated member portal exclusively for shareholders to see their details and history only
  if (user.role === 'Shareholder') {
    return <ShareholderPortal />;
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
      case 'merge_shares': return <ShareholderList initialShowMerge={true} />;
      case 'enrollment': return <NewShareholderModule />;
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
      case 'import_export': return <SettingsModule initialTab="upload" />;
      case 'backup': return <BackupManager />;
      case 'settings': return <SettingsModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex print:bg-white print:text-black print:min-h-0 print:p-0 print:m-0">
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
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 print:pl-0 print:p-0 print:m-0 print:bg-white">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white">
          <ErrorBoundary>{renderActiveModule()}</ErrorBoundary>
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
