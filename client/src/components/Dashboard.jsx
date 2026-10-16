import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserCheck, UserX, Coins, Building2, MapPin, FileCheck2, Clock,
  CreditCard, CalendarCheck, Package, Briefcase, Download, Filter, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export default function Dashboard() {
  const { setActiveModule, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('This Month');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const res = await ApiService.getDashboardStats();
    if (res && res.success) {
      setData(res);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-emerald-400 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading Cooperative Dashboard Analytics...
        </div>
      </div>
    );
  }

  const { stats, charts } = data;

  const cardItems = [
    { title: 'Total Shareholders', value: stats.totalShareholders.toLocaleString(), icon: Users, color: 'emerald', link: 'shareholders' },
    { title: 'Active Shareholders', value: stats.activeShareholders.toLocaleString(), icon: UserCheck, color: 'teal', link: 'shareholders' },
    { title: 'Inactive Shareholders', value: stats.inactiveShareholders.toLocaleString(), icon: UserX, color: 'rose', link: 'shareholders' },
    { title: 'Total Shares', value: stats.totalShares.toLocaleString(), icon: Coins, color: 'amber', link: 'shareholders' },
    { title: 'Total Villages', value: stats.totalVillages.toLocaleString(), icon: Building2, color: 'blue', link: 'villages' },
    { title: 'Total Circles', value: stats.totalCircles.toLocaleString(), icon: MapPin, color: 'indigo', link: 'circles' },
    { title: 'Pending Varasa', value: stats.pendingVarasa.toLocaleString(), icon: Clock, color: 'amber', link: 'varasa' },
    { title: 'Completed Varasa', value: stats.completedVarasa.toLocaleString(), icon: FileCheck2, color: 'emerald', link: 'varasa' },
    { title: 'Today\'s Transactions', value: stats.todayTx.toLocaleString(), icon: CreditCard, color: 'purple', link: 'transactions' },
    { title: 'Today\'s Attendance', value: `${stats.todayAttendance} Present`, icon: CalendarCheck, color: 'cyan', link: 'attendance' },
    { title: 'Sugar Allotted (kg)', value: `${stats.totalSugarAlloted.toLocaleString()} kg`, icon: Package, color: 'teal', link: 'sugar_allotment' },
    { title: 'Total Employees', value: stats.totalEmployees.toLocaleString(), icon: Briefcase, color: 'blue', link: 'employees' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Executive Cooperative Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time stats across Shareholders, Transactions & Sugar Allotments</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Season (2025-26)</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          <button
            onClick={() => showToast('Dashboard summary exported to Excel/PDF')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950"
          >
            <Download className="w-3.5 h-3.5" /> Export Dashboard
          </button>
        </div>
      </div>

      {/* 12 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardItems.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => setActiveModule(c.link)}
              className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{c.title}</span>
                <div className={`w-8 h-8 rounded-xl bg-slate-900 group-hover:bg-emerald-950/80 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-100 mt-2">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Shareholders by Village (Top 10) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center justify-between">
            <span>Shareholders by Village (Top 10)</span>
            <span className="text-[10px] text-slate-400 font-normal">Indexed records</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.shareholdersByVillage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="village_name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Shareholders by Circle Distribution */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Shareholders by Circle Division</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.shareholdersByCircle}
                  dataKey="total"
                  nameKey="circle_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                >
                  {charts.shareholdersByCircle.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Share Holding Category Ranges */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Share Distribution Ranges</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.shareRange} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis type="category" dataKey="range" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Varasa Transfer Status Workflow */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Varasa Legal-Heir Transfer Workflow Status</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.varasaStatusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {charts.varasaStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-v-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
