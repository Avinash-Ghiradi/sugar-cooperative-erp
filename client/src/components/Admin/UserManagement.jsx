import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import { UserCog, Plus, ShieldCheck, CheckCircle2, Lock, X, Save } from 'lucide-react';

export default function UserManagement() {
  const { showToast, user } = useAuth();
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', name: 'System Administrator', role: 'Admin', status: 'Active', last_login: '2026-09-03 05:30' },
    { id: 2, username: 'cashier', name: 'Ramesh Patil', role: 'Cashier', status: 'Active', last_login: '2026-09-03 04:15' },
    { id: 3, username: 'operator', name: 'Sunita Deshmukh', role: 'Computer Operator', status: 'Active', last_login: '2026-09-02 18:20' },
    { id: 4, username: 'employee', name: 'Vikas Shinde', role: 'Employee', status: 'Active', last_login: '2026-09-01 11:10' }
  ]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    username: '',
    name: '',
    role: 'Computer Operator',
    password: 'password123'
  });

  const handleCreateUser = (e) => {
    e.preventDefault();
    setUsers(prev => [...prev, { id: prev.length + 1, ...form, status: 'Active', last_login: 'Never' }]);
    showToast(`User ${form.username} created with role ${form.role}`);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-emerald-400" /> User & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage operator accounts, financial permissions & system roles</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
        >
          <Plus className="w-4 h-4" /> Create User Account
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">#USR-{u.id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-100">{u.username}</td>
                  <td className="py-3 px-4 font-medium">{u.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{u.last_login}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px] font-semibold">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Role Permission Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {Object.entries(ROLE_PERMISSIONS).map(([roleName, modules]) => (
            <div key={roleName} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400 text-sm border-b border-slate-800 pb-2">{roleName}</div>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {modules.map(m => (
                  <li key={m} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="capitalize">{m.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100">Create System User Account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Cashier">Cashier (Transactions & Ledger)</option>
                  <option value="Computer Operator">Computer Operator (Data Entry)</option>
                  <option value="Employee">Employee (Attendance & Basic)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
