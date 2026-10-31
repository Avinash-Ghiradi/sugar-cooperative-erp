import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import {
  UserCog, Plus, ShieldCheck, CheckCircle2, Lock, X, Save,
  KeyRound, Edit, Briefcase, RefreshCw, UserCheck, Shield
} from 'lucide-react';

export default function UserManagement() {
  const { showToast, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    name: '',
    name_english: '',
    department: 'ಆಡಳಿತ ವಿಭಾಗ (Administration)',
    designation: 'Computer Operator',
    mobile: '',
    role: 'Computer Operator',
    password: 'Shares123'
  });

  const loadData = async () => {
    setLoading(true);
    const res = await ApiService.getEmployees();
    if (res && res.data) {
      setEmployees(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('employees_updated', loadData);
    return () => window.removeEventListener('employees_updated', loadData);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const nextNum = employees.length > 0 ? Math.max(...employees.map(emp => Number(emp.id) || 0)) + 1 : 1;
    const nextEmpId = `EMP-${String(nextNum).padStart(3, '0')}`;

    const res = await ApiService.addEmployee({
      employee_id: nextEmpId,
      name: form.name,
      name_english: form.name_english || form.name,
      department: form.department,
      designation: form.designation,
      mobile: form.mobile,
      role: form.role,
      password: form.password || 'Shares123',
      status: 'Active'
    });

    if (res && res.success) {
      showToast(`ಬಳಕೆದಾರ #${res.employee_id} (${form.role}) ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ!`, 'success');
      setShowModal(false);
      loadData();
    } else {
      showToast('ಖಾತೆ ರಚನೆ ವಿಫಲವಾಗಿದೆ', 'error');
    }
  };

  const handleUpdateRole = async (emp, newRole) => {
    const res = await ApiService.updateEmployee(emp.id || emp.employee_id, {
      role: newRole
    });
    if (res && res.success) {
      showToast(`ಸಿಬ್ಬಂದಿ ${emp.name} ಅವರ ಪಾತ್ರವನ್ನು '${newRole}' ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ!`, 'success');
      loadData();
    } else {
      showToast('ಪಾತ್ರ ಬದಲಾವಣೆ ವಿಫಲವಾಗಿದೆ', 'error');
    }
  };

  const handleResetPassword = async (emp) => {
    if (window.confirm(`ಸಿಬ್ಬಂದಿ ${emp.name} (${emp.employee_id}) ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಡೀಫಾಲ್ಟ್ 'Shares123' ಗೆ ಮರುಹೊಂದಿಸಬೇಕೇ?`)) {
      const res = await ApiService.updateEmployee(emp.id || emp.employee_id, {
        password: 'Shares123'
      });
      if (res && res.success) {
        showToast(`ಸಿಬ್ಬಂದಿ ${emp.name} ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು 'Shares123' ಗೆ ರಿಸೆಟ್ ಮಾಡಲಾಗಿದೆ!`, 'success');
        loadData();
      } else {
        showToast('ರಿಸೆಟ್ ವಿಫಲವಾಗಿದೆ', 'error');
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'Cashier': return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'Computer Operator': return 'bg-sky-950 text-sky-300 border-sky-700';
      case 'Attendance Operator': return 'bg-teal-950 text-teal-300 border-teal-700';
      case 'Sugar Operator': return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      default: return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-emerald-400" /> User & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಖಾತೆಗಳು, ನಿಯೋಜಿತ ಕರ್ತವ್ಯದ ಪಾತ್ರಗಳು & ಅಧಿಕಾರ ನಿರ್ಬಂಧ ನಿರ್ವಹಣೆ</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ಹೊಸ ಬಳಕೆದಾರರ ಖಾತೆ ರಚಿಸಿ
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User / Emp ID</th>
                <th className="py-3.5 px-4">ಸಿಬ್ಬಂದಿ ಹೆಸರು (Full Name)</th>
                <th className="py-3.5 px-4">ವಿಭಾಗ & ಹುದ್ದೆ</th>
                <th className="py-3.5 px-4">ನಿಯೋಜಿತ ಪಾತ್ರ (Assigned Role)</th>
                <th className="py-3.5 px-4">ಕಡೆಯ ಲಾಗಿನ್ (Last Login)</th>
                <th className="py-3.5 px-4 text-center">ಸ್ಥಿತಿ</th>
                <th className="py-3.5 px-4 text-center">ಕ್ರಮಗಳು (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {/* Legacy System Administrator Row - Disabled */}
              <tr className="bg-slate-950/40 opacity-60">
                <td className="py-3 px-4 font-mono font-bold text-slate-500">ADMIN</td>
                <td className="py-3 px-4 text-slate-400">
                  <div className="line-through font-semibold text-slate-400">System Administrator</div>
                  <div className="text-[10px] text-rose-400">ಡೀಫಾಲ್ಟ್ ಖಾತೆ ರದ್ದುಗೊಂಡಿದೆ</div>
                </td>
                <td className="py-3 px-4 text-slate-500">ಆಡಳಿತ ವಿಭಾಗ / IT</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 font-mono text-[10px]">
                    Disabled
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">—</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 bg-rose-950/50 text-rose-400 rounded-full text-[10px] font-semibold border border-rose-900/50">
                    Disabled (ರದ್ದುಗೊಂಡಿದೆ)
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                  ಅಧಿಕಾರವನ್ನು ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿಗೆ ನೀಡಲಾಗಿದೆ
                </td>
              </tr>

              {/* Dynamic Employee Accounts */}
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-400" />
                    ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಖಾತೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು ನೋಂದಣಿಯಾಗಿಲ್ಲ.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id || emp.employee_id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">#{emp.employee_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <div>{emp.name}</div>
                      {emp.name_english && <div className="text-[10px] text-slate-400 font-normal">{emp.name_english}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="text-emerald-400">{emp.designation || '—'}</div>
                      <div className="text-[10px] text-slate-400">{emp.department || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={emp.role || 'Employee'}
                        onChange={(e) => handleUpdateRole(emp, e.target.value)}
                        className={`px-2.5 py-1 rounded-xl font-bold text-[10.5px] border outline-none cursor-pointer bg-slate-950 ${getRoleBadge(emp.role)}`}
                      >
                        <option value="Admin">Admin (Full Access)</option>
                        <option value="Computer Operator">Computer Operator (ಷೇರು & ಸಕ್ಕರೆ)</option>
                        <option value="Cashier">Cashier (ಖಜಾಂಚಿ / ನಗದು)</option>
                        <option value="Attendance Operator">Attendance Operator (ಹಾಜರಾತಿ)</option>
                        <option value="Sugar Operator">Sugar Operator (ಸಕ್ಕರೆ ಕೋಟಾ)</option>
                        <option value="Employee">Employee (ಸಾಮಾನ್ಯ ಸಿಬ್ಬಂದಿ)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {emp.last_login ? new Date(emp.last_login).toLocaleString('en-GB') : 'Shares123 (ಡೀಫಾಲ್ಟ್)'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(emp)}
                        className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded-lg text-[10.5px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                        title="ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ 'Shares123' ಗೆ ರಿಸೆಟ್ ಮಾಡಿ"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>ಪಾಸ್‌ವರ್ಡ್ ರಿಸೆಟ್</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> ಸಕ್ರಿಯ ಅಧಿಕಾರ ನಿಯಂತ್ರಣ ಕೋಷ್ಟಕ (Active Role Permission Matrix)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {Object.entries(ROLE_PERMISSIONS).map(([roleName, modules]) => (
            <div key={roleName} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className={`font-bold text-xs border-b border-slate-800 pb-1.5 flex items-center justify-between ${
                roleName === 'Admin' ? 'text-rose-400' :
                roleName === 'Cashier' ? 'text-amber-400' :
                roleName === 'Computer Operator' ? 'text-sky-400' : 'text-emerald-400'
              }`}>
                <span>{roleName}</span>
                <span className="text-[10px] text-slate-500 font-mono">({modules.length})</span>
              </div>
              <ul className="space-y-1 text-slate-300 text-[10.5px]">
                {modules.slice(0, 8).map(m => (
                  <li key={m} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="capitalize">{m.replace('_', ' ')}</span>
                  </li>
                ))}
                {modules.length > 8 && (
                  <li className="text-[10px] text-slate-500 italic">
                    +{modules.length - 8} ಇನ್ನಷ್ಟು ಮಾಡ್ಯೂಲ್‌ಗಳು...
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-emerald-400" /> ಹೊಸ ಬಳಕೆದಾರರ ಖಾತೆ ರಚಿಸಿ
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ಪೂರ್ಣ ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ) *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ಉದಾ: ಆನಂದ ಎಸ್. ಕುಲಕರ್ಣಿ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Name in English</label>
                <input
                  type="text"
                  value={form.name_english}
                  onChange={(e) => setForm({ ...form, name_english: e.target.value })}
                  placeholder="ಉದಾ: Anand Kulkarni"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">ವಿಭಾಗ (Department)</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">ಹುದ್ದೆ (Designation)</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *</label>
                <input
                  type="text"
                  required
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ನಿಯೋಜಿತ ಪಾತ್ರ (Assigned Role) *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-emerald-300 font-bold"
                >
                  <option value="Admin">Admin (Full System Access)</option>
                  <option value="Computer Operator">Computer Operator (ಷೇರು, ನೋಂದಣಿ, ಸಕ್ಕರೆ, ID)</option>
                  <option value="Cashier">Cashier (ಮುಖ್ಯ ಖಜಾಂಚಿ)</option>
                  <option value="Attendance Operator">Attendance Operator (ಹಾಜರಾತಿ)</option>
                  <option value="Sugar Operator">Sugar Operator (ಸಕ್ಕರೆ ಹಂಚಿಕೆ)</option>
                  <option value="Employee">Employee (ಸಾಮಾನ್ಯ ಸಿಬ್ಬಂದಿ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                  <span>ಲಾಗಿನ್ ಪಾಸ್‌ವರ್ಡ್ *</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">ಡೀಫಾಲ್ಟ್: Shares123</span>
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                  ರದ್ದುಮಾಡಿ
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950">
                  ಖಾತೆ ರಚಿಸಿ (Create)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
