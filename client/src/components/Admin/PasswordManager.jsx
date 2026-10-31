import React, { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  KeyRound, ShieldCheck, Lock, RefreshCw, Search, Eye, EyeOff,
  Copy, Check, UserCheck, AlertTriangle, Users, Sparkles, X,
  Shield, CheckCircle2, UserCog, ExternalLink, MessageSquare, Phone
} from 'lucide-react';

export default function PasswordManager() {
  const { user, showToast, setActiveModule } = useAuth();

  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'shareholders' | 'audit'
  const [employees, setEmployees] = useState([]);
  const [shareholders, setShareholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Eye toggles for passwords: { [key]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Shareholder search & stats
  const [shSearchQuery, setShSearchQuery] = useState('');
  const [shSearchResults, setShSearchResults] = useState([]);
  const [shSearching, setShSearching] = useState(false);
  const [shStats, setShStats] = useState({ customPasswordsCount: 0 });
  const [shFilterCustomOnly, setShFilterCustomOnly] = useState(false);

  // Custom password modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState(null); // { type: 'employee'|'shareholder', id, name, mobile }
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [modalError, setModalError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Copied indicator state: { [key]: boolean }
  const [copiedKey, setCopiedKey] = useState(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  const loadShareholders = async (query = '') => {
    setShSearching(true);
    try {
      const res = await ApiService.searchForPasswordManager(query);
      if (res && res.shareholders) {
        setShSearchResults(res.shareholders);
      }
      const stats = ApiService.getShareholderPasswordStats();
      setShStats(stats || { customPasswordsCount: 0 });
    } catch (err) {
      console.warn('Shareholder search error:', err);
    } finally {
      setShSearching(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const empRes = await ApiService.getEmployees();
      if (empRes && empRes.data) {
        setEmployees(empRes.data);
      }
      const stats = ApiService.getShareholderPasswordStats();
      setShStats(stats || { customPasswordsCount: 0 });

      const logsRes = await ApiService.getAuditLogs();
      if (Array.isArray(logsRes)) {
        const pwdLogs = logsRes.filter(l => l.action === 'ADMIN_PASSWORD_RESET' || (l.module && l.module.includes('Password')));
        setAuditLogs(pwdLogs);
      }

      // Eagerly pre-load shareholders list so Tab 2 displays passwords right away
      await loadShareholders('');
    } catch (err) {
      console.warn('Error loading password manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('employees_updated', loadData);
    return () => window.removeEventListener('employees_updated', loadData);
  }, []);

  // Live shareholder search debounced (eagerly queries even on empty to show default list)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadShareholders(shSearchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [shSearchQuery]);

  const togglePasswordVisibility = (key) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 1-Click Reset to Default Shares123
  const handleResetToDefault = async (accountType, accountId, accountName) => {
    const confirmMsg = `ನೀವು ಖಚಿತವಾಗಿ ${accountType === 'employee' ? 'ಸಿಬ್ಬಂದಿ' : 'ಷೇರುದಾರ'} ${accountName} (#${accountId}) ಅವರ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಡೀಫಾಲ್ಟ್ 'Shares123' ಗೆ ಮರುಹೊಂದಿಸಲು (Reset) ಬಯಸುವಿರಾ?\n\n(ಗಮನಿಸಿ: ಮುಂದಿನ ಲಾಗಿನ್‌ನಲ್ಲಿ ಅವರು ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿರುತ್ತದೆ).`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await ApiService.adminResetPassword({
        type: accountType,
        id: accountId,
        newPassword: 'Shares123',
        adminUser: user?.name || user?.username || 'Admin'
      });

      if (res && res.success) {
        showToast(res.message || 'ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ Shares123 ಗೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ!', 'success');
        loadData();
        if (accountType === 'shareholder') {
          await loadShareholders(shSearchQuery);
        }
      } else {
        showToast(res?.message || 'ಮರುಹೊಂದಿಕೆ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    } catch (err) {
      showToast(err.message || 'ದೋಷ ಸಂಭವಿಸಿದೆ', 'error');
    }
  };

  // Open modal to set custom password
  const openCustomPasswordModal = (account) => {
    setTargetAccount(account);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setModalError('');
    setModalOpen(true);
  };

  const handleSaveCustomPassword = async (e) => {
    e.preventDefault();
    setModalError('');

    if (newPasswordInput.length < 4) {
      setModalError('ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳನ್ನು ಹೊಂದಿರಬೇಕು (Minimum 4 characters).');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setModalError('ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು ದೃಢೀಕರಣ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ (Passwords do not match).');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await ApiService.adminResetPassword({
        type: targetAccount.type,
        id: targetAccount.id,
        newPassword: newPasswordInput,
        adminUser: user?.name || user?.username || 'Admin'
      });

      if (res && res.success) {
        showToast(res.message || 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!', 'success');
        setModalOpen(false);
        loadData();
        if (targetAccount.type === 'shareholder') {
          await loadShareholders(shSearchQuery);
        }
      } else {
        setModalError(res?.message || 'ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ.');
      }
    } catch (err) {
      setModalError(err.message || 'ದೋಷ ಸಂಭವಿಸಿದೆ.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Generate random safe password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(result);
    setConfirmPasswordInput(result);
  };

  // Copy Login Credentials to Clipboard (WhatsApp / SMS format)
  const copyCredentials = (account) => {
    const isEmp = account.type === 'employee' || !!account.employee_id;
    const identifier = isEmp ? account.employee_id : (account.mobile_no || account.mobile || account.share_no);
    const password = account.current_password || account.password || 'Shares123';
    const appUrl = window.location.origin + window.location.pathname;

    const message = `🌾 *ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ., ಮರಗೂರ*\n` +
      `----------------------------------------\n` +
      `*ನಿಮ್ಮ ERP ಲಾಗಿನ್ ವಿವರಗಳು:*\n` +
      `• ಖಾತೆ ಪ್ರಕಾರ: ${isEmp ? 'ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್' : 'ಷೇರುದಾರರ ಲಾಗಿನ್'}\n` +
      `• ಹೆಸರು: ${account.name || account.shareholder_name}\n` +
      `• ಲಾಗಿನ್ ಐಡಿ / ಮೊಬೈಲ್: *${identifier}*\n` +
      `• ಪಾಸ್‌ವರ್ಡ್: *${password}*\n` +
      `• ಲಾಗಿನ್ ಲಿಂಕ್: ${appUrl}\n` +
      `----------------------------------------\n` +
      `_ಗಮನಿಸಿ: ಮೊದಲ ಲಾಗಿನ್ ಆದ ನಂತರ ನಿಮ್ಮದೇ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ._`;

    navigator.clipboard.writeText(message);
    const key = `${account.type || 'emp'}-${account.id || account.employee_id || account.share_no}`;
    setCopiedKey(key);
    showToast('ಲಾಗಿನ್ ವಿವರಗಳನ್ನು ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ಕಾಪಿ ಮಾಡಲಾಗಿದೆ! (WhatsApp / SMS ಗೆ ಕಳುಹಿಸಬಹುದು)', 'info');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  // Computed Staff Lists & Stats
  const staffStats = useMemo(() => {
    let defaultCount = 0;
    let customCount = 0;
    employees.forEach(emp => {
      const p = emp.password || 'Shares123';
      if (p === 'Shares123') defaultCount++;
      else customCount++;
    });
    return { total: employees.length, defaultCount, customCount };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (roleFilter !== 'ALL' && emp.role !== roleFilter) return false;
      const pwd = emp.password || 'Shares123';
      const isDefault = pwd === 'Shares123';
      if (statusFilter === 'DEFAULT' && !isDefault) return false;
      if (statusFilter === 'CUSTOM' && isDefault) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const id = String(emp.employee_id || '').toLowerCase();
      const name = String(emp.name || '').toLowerCase();
      const engName = String(emp.name_english || '').toLowerCase();
      const mobile = String(emp.mobile || '').toLowerCase();
      const role = String(emp.role || '').toLowerCase();
      return id.includes(q) || name.includes(q) || engName.includes(q) || mobile.includes(q) || role.includes(q);
    });
  }, [employees, roleFilter, statusFilter, searchQuery]);

  const filteredShareholders = useMemo(() => {
    if (shFilterCustomOnly) {
      return shSearchResults.filter(s => !s.is_default_password);
    }
    return shSearchResults;
  }, [shSearchResults, shFilterCustomOnly]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-950 to-amber-950 border border-emerald-700/60 text-emerald-400 shadow-lg">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100">ಪಾಸ್‌ವರ್ಡ್ ನಿರ್ವಾಹಕ (Password Manager & Reset Center)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ಸಿಬ್ಬಂದಿ ಮತ್ತು ಷೇರುದಾರರ ಲಾಗಿನ್ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಕೆ (Reset), ಭದ್ರತಾ ಪರಿಶೀಲನೆ & ಲಾಗಿನ್ ಸಂದೇಶ ಹಂಚಿಕೆ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModule('users')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition-colors cursor-pointer"
          >
            <UserCog className="w-4 h-4 text-emerald-400" />
            <span>ಬಳಕೆದಾರರು & ಪಾತ್ರಗಳು (Users & RBAC) ➔</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer"
            title="ರಿಫ್ರೆಶ್ ಮಾಡಿ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>ಒಟ್ಟು ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{staffStats.total}</div>
          <div className="text-[10px] text-slate-400">ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಬಳಕೆದಾರರು</div>
        </div>

        <div className="bg-slate-950/60 border border-amber-900/40 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-amber-300">
            <span>ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ ಸಿಬ್ಬಂದಿ</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{staffStats.defaultCount}</div>
          <div className="text-[10px] text-amber-400/80">Shares123 (ಬದಲಾವಣೆ ಕಡ್ಡಾಯ)</div>
        </div>

        <div className="bg-slate-950/60 border border-emerald-900/40 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-300">
            <span>ಸುರಕ್ಷಿತ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">{staffStats.customCount}</div>
          <div className="text-[10px] text-emerald-400/80">ಸ್ವಂತ ಪಾಸ್‌ವರ್ಡ್ ಸಕ್ರಿಯವಾಗಿದೆ</div>
        </div>

        <div className="bg-slate-950/60 border border-sky-900/40 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-sky-300">
            <span>ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿದ ಷೇರುದಾರರು</span>
            <Lock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-300">{shStats.customPasswordsCount}</div>
          <div className="text-[10px] text-sky-400/80">ಸ್ವತಂತ್ರ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿಕೊಂಡವರು</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>೧. ಸಿಬ್ಬಂದಿ ಪಾಸ್‌ವರ್ಡ್ ನಿರ್ವಹಣೆ ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shareholders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'shareholders'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>೨. ಷೇರುದಾರರ ಪಾಸ್‌ವರ್ಡ್ ನಿರ್ವಹಣೆ ({shSearchResults.length > 0 ? shSearchResults.length : '17,076'})</span>
          {(shStats.customPasswordsCount > 0 || shSearchResults.some(s => !s.is_default_password)) && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
              {shStats.customPasswordsCount || shSearchResults.filter(s => !s.is_default_password).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>೩. ಪಾಸ್‌ವರ್ಡ್ ರಿಸೆಟ್ ಇತಿಹಾಸ ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Staff / Employee Passwords */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center gap-3 justify-between text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ಸಿಬ್ಬಂದಿ ಹೆಸರು, ಐಡಿ (EMP-001), ಮೊಬೈಲ್ ಹುಡುಕಿ..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs outline-none cursor-pointer"
              >
                <option value="ALL">ಎಲ್ಲಾ ಪಾತ್ರಗಳು (All Roles)</option>
                <option value="Admin">Admin</option>
                <option value="Cashier">Cashier</option>
                <option value="Computer Operator">Computer Operator</option>
                <option value="Attendance Operator">Attendance Operator</option>
                <option value="Sugar Operator">Sugar Operator</option>
                <option value="Employee">Employee</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs outline-none cursor-pointer"
              >
                <option value="ALL">ಎಲ್ಲಾ ಪಾಸ್‌ವರ್ಡ್ ಸ್ಥಿತಿ</option>
                <option value="DEFAULT">ಡೀಫಾಲ್ಟ್ (Shares123 ಮಾತ್ರ)</option>
                <option value="CUSTOM">ಕಸ್ಟಮ್ ಪಾಸ್‌ವರ್ಡ್ ಮಾತ್ರ</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ಸಿಬ್ಬಂದಿ ಐಡಿ</th>
                    <th className="py-3 px-4">ಹೆಸರು & ಮೊಬೈಲ್</th>
                    <th className="py-3 px-4">ನಿಯೋಜಿತ ಪಾತ್ರ / ವಿಭಾಗ</th>
                    <th className="py-3 px-4">ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್</th>
                    <th className="py-3 px-4 text-center">ಭದ್ರತಾ ಸ್ಥಿತಿ</th>
                    <th className="py-3 px-4 text-center">ಕ್ರಮಗಳು (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const currentPwd = emp.password || 'Shares123';
                      const isDefault = currentPwd === 'Shares123';
                      const key = `emp-${emp.employee_id}`;
                      const isVisible = !!visiblePasswords[key];
                      const isCopied = copiedKey === key;

                      return (
                        <tr key={emp.id || emp.employee_id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-amber-300">
                            #{emp.employee_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-100">{emp.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{emp.mobile || '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-emerald-400">{emp.role || 'Employee'}</div>
                            <div className="text-[10px] text-slate-400">{emp.designation || emp.department || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${
                                isDefault
                                  ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                                  : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                              }`}>
                                {isVisible ? currentPwd : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(key)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                                title={isVisible ? 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಚಿ' : 'ಪಾಸ್‌ವರ್ಡ್ ನೋಡಿ'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isDefault ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>Shares123 ಡೀಫಾಲ್ಟ್</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>ಸ್ವಂತ ಪಾಸ್‌ವರ್ಡ್</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Reset to Shares123 Button */}
                              <button
                                type="button"
                                onClick={() => handleResetToDefault('employee', emp.employee_id, emp.name)}
                                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು 'Shares123' ಗೆ ರಿಸೆಟ್ ಮಾಡಿ"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Shares123 ಗೆ ರಿಸೆಟ್</span>
                              </button>

                              {/* Custom Password Button */}
                              <button
                                type="button"
                                onClick={() => openCustomPasswordModal({
                                  type: 'employee',
                                  id: emp.employee_id,
                                  name: emp.name,
                                  mobile: emp.mobile,
                                  current_password: currentPwd
                                })}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="ನಿರ್ದಿಷ್ಟ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಿಗದಿಪಡಿಸಿ"
                              >
                                <Lock className="w-3 h-3 text-emerald-400" />
                                <span>ಹೊಸ ಪಾಸ್‌ವರ್ಡ್</span>
                              </button>

                              {/* Copy Credentials for WhatsApp */}
                              <button
                                type="button"
                                onClick={() => copyCredentials({
                                  type: 'employee',
                                  employee_id: emp.employee_id,
                                  name: emp.name,
                                  mobile: emp.mobile,
                                  password: currentPwd
                                })}
                                className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center transition-all cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                                }`}
                                title="WhatsApp / SMS ಸಂದೇಶ ಕಾಪಿ ಮಾಡಿ"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Shareholder Password Reset & Management */}
      {activeTab === 'shareholders' && (
        <div className="space-y-4">
          {/* Shareholder Search Box & Filter Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" /> ಷೇರುದಾರರ ಪಾಸ್‌ವರ್ಡ್ ನಿರ್ವಹಣೆ (Shareholder Password Manager)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ಷೇರುದಾರರ ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ, 1-ಕ್ಲಿಕ್‌ನಲ್ಲಿ ರಿಸೆಟ್ ಮಾಡಿ ಅಥವಾ ನೇರವಾಗಿ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಿಗದಿಪಡಿಸಿ
                </p>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono self-start sm:self-auto">
                ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್: <strong className="text-amber-300">Shares123</strong>
              </div>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={shSearchQuery}
                onChange={(e) => setShSearchQuery(e.target.value)}
                placeholder="ಷೇರು ಸಂಖ್ಯೆ (ಉದಾ: #7950), 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ (6362...), ಅಥವಾ ಹೆಸರು ನಮೂದಿಸಿ..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-11 pr-10 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 outline-none text-sm font-medium shadow-inner"
              />
              {shSearching && (
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setShFilterCustomOnly(false)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !shFilterCustomOnly
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ಎಲ್ಲಾ ಷೇರುದಾರರು ({shSearchResults.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShFilterCustomOnly(true)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  shFilterCustomOnly
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>ಬದಲಾಯಿಸಿದ ಕಸ್ಟಮ್ ಪಾಸ್‌ವರ್ಡ್ ಮಾತ್ರ ({shSearchResults.filter(s => !s.is_default_password).length})</span>
              </button>
            </div>
          </div>

          {/* Shareholder Results Table */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredShareholders.length === 0 && !shSearching ? (
              <div className="p-10 text-center space-y-3 text-slate-400">
                <KeyRound className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">ಯಾವುದೇ ಷೇರುದಾರರ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {shFilterCustomOnly
                    ? 'ಯಾವುದೇ ಷೇರುದಾರರು ಇನ್ನೂ ತಮ್ಮ ಕಸ್ಟಮ್ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿಲ್ಲ. "ಎಲ್ಲಾ ಷೇರುದಾರರು" ಆಯ್ಕೆಮಾಡಿ.'
                    : `'${shSearchQuery}' ಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಷೇರು ಸಂಖ್ಯೆ ಅಥವಾ ಮೊಬೈಲ್ ನಮೂದಿಸಿ.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">ಷೇರು ನಂ</th>
                      <th className="py-3 px-4">ಷೇರುದಾರರ ಹೆಸರು</th>
                      <th className="py-3 px-4">ಲಾಗಿನ್ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</th>
                      <th className="py-3 px-4">ಗ್ರಾಮ / ವಲಯ</th>
                      <th className="py-3 px-4">ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್</th>
                      <th className="py-3 px-4 text-center">ಪಾಸ್‌ವರ್ಡ್ ಸ್ಥಿತಿ</th>
                      <th className="py-3 px-4 text-center">ಕ್ರಮಗಳು (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredShareholders.map((sh) => {
                      const key = `sh-${sh.share_no}`;
                      const isVisible = !!visiblePasswords[key];
                      const isCopied = copiedKey === key;
                      const isDefault = sh.is_default_password || sh.current_password === 'Shares123';

                      return (
                        <tr key={sh.id || sh.share_no} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            #{sh.share_no}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-100">
                            <div>{sh.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              ಒಟ್ಟು ಷೇರುಗಳು: {sh.number_of_shares || 1}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-amber-300">
                            {sh.mobile_no || 'ಮೊಬೈಲ್ ದಾಖಲಾಗಿಲ್ಲ'}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div>{sh.place || '—'}</div>
                            <div className="text-[10px] text-slate-500">{sh.taluk || ''}</div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${
                                isDefault
                                  ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                                  : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                              }`}>
                                {isVisible ? sh.current_password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(key)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                                title={isVisible ? 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಚಿ' : 'ಪಾಸ್‌ವರ್ಡ್ ನೋಡಿ'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isDefault ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                <span>Shares123 ಡೀಫಾಲ್ಟ್</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>ಬದಲಾಯಿಸಿದ ಪಾಸ್‌ವರ್ಡ್</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Reset to Shares123 Button */}
                              <button
                                type="button"
                                onClick={() => handleResetToDefault('shareholder', sh.share_no, sh.name)}
                                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಡೀಫಾಲ್ಟ್ 'Shares123' ಗೆ ಮರುಹೊಂದಿಸಿ"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Shares123 ಗೆ ರಿಸೆಟ್</span>
                              </button>

                              {/* Custom Password Button */}
                              <button
                                type="button"
                                onClick={() => openCustomPasswordModal({
                                  type: 'shareholder',
                                  id: sh.share_no,
                                  name: sh.name,
                                  mobile: sh.mobile_no,
                                  current_password: sh.current_password
                                })}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಿಗದಿಪಡಿಸಿ"
                              >
                                <Lock className="w-3 h-3 text-emerald-400" />
                                <span>ಹೊಸ ಪಾಸ್‌ವರ್ಡ್</span>
                              </button>

                              {/* Copy Credentials for WhatsApp */}
                              <button
                                type="button"
                                onClick={() => copyCredentials({
                                  type: 'shareholder',
                                  share_no: sh.share_no,
                                  name: sh.name,
                                  mobile: sh.mobile_no,
                                  mobile_no: sh.mobile_no,
                                  password: sh.current_password || 'Shares123'
                                })}
                                className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center transition-all cursor-pointer ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                                }`}
                                title="WhatsApp / SMS ಸಂದೇಶ ಕಾಪಿ ಮಾಡಿ"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಕೆ ಆಡಿಟ್ ಇತಿಹಾಸ (Password Reset Audit Trail)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ನಿರ್ವಾಹಕರು ನಿರ್ವಹಿಸಿದ ಎಲ್ಲಾ ಪಾಸ್‌ವರ್ಡ್ ರಿಸೆಟ್‌ಗಳ ಶಾಸನಬದ್ಧ ದಿನಾಂಕ & ಸಮಯದ ದಾಖಲೆಗಳು
              </p>
            </div>
            <button
              onClick={loadData}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> ರಿಫ್ರೆಶ್
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">ದಿನಾಂಕ & ಸಮಯ</th>
                  <th className="py-3 px-4">ನಿರ್ವಾಹಕರು (Admin)</th>
                  <th className="py-3 px-4">ಖಾತೆ ಐಡಿ</th>
                  <th className="py-3 px-4">ವಿವರಗಳು (Description)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">
                      ಇತ್ತೀಚೆಗೆ ಯಾವುದೇ ಪಾಸ್‌ವರ್ಡ್ ರಿಸೆಟ್ ಆಡಿಟ್ ದಾಖಲಾಗಿಲ್ಲ.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {log.username || log.performed_by || 'Admin'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {log.record_id || log.share_no || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Set Custom Password Modal */}
      {modalOpen && targetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಿಗದಿಪಡಿಸಿ (Set Custom Password)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {targetAccount.type === 'employee' ? `ಸಿಬ್ಬಂದಿ ಐಡಿ: #${targetAccount.id}` : `ಷೇರು ನಂ: #${targetAccount.id}`} • {targetAccount.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveCustomPassword} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ (New Password) *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>ರ‍್ಯಾಂಡಮ್ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ (Confirm Password) *
                </label>
                <input
                  type="text"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಮರು-ನಮೂದಿಸಿ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <div>• ಲಾಗಿನ್ ಐಡಿ: <strong className="font-mono text-slate-200">{targetAccount.mobile || targetAccount.id}</strong></div>
                <div>• ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಿದ ತಕ್ಷಣ ಈ ಬಳಕೆದಾರರು ಈ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಲಾಗಿನ್ ಆಗಬಹುದು.</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  ರದ್ದುಮಾಡಿ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingPassword ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಿ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
