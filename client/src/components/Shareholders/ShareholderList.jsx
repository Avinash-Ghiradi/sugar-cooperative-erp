import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Search, Filter, Plus, FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
  Eye, Edit, Contact, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import ShareholderProfile from './ShareholderProfile';
import ShareholderForm from './ShareholderForm';

export default function ShareholderList() {
  const { showToast, setActiveModule } = useAuth();
  const [shareholders, setShareholders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Options
  const [villages, setVillages] = useState([]);
  const [circles, setCircles] = useState([]);

  // Modals
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editShareholderData, setEditShareholderData] = useState(null);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    fetchShareholders(1);
  }, [search, selectedVillage, selectedCircle, selectedStatus]);

  const loadMasters = async () => {
    const vRes = await ApiService.getVillages();
    if (vRes && vRes.data) setVillages(vRes.data);

    const cRes = await ApiService.getCircles();
    if (cRes && cRes.data) setCircles(cRes.data);
  };

  const fetchShareholders = async (page = 1) => {
    setLoading(true);
    const res = await ApiService.getShareholders({
      page,
      limit: 20,
      search,
      village_id: selectedVillage,
      circle_id: selectedCircle,
      status: selectedStatus
    });

    if (res && res.success) {
      setShareholders(res.data);
      setPagination(res.pagination);
    }
    setLoading(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchShareholders(newPage);
    }
  };

  const exportToCsv = () => {
    const headers = ['Shareholder ID', 'Name', 'Father/Husband Name', 'Mobile', 'Village', 'Circle', 'Share No', 'Shares Count', 'Status'];
    const rows = shareholders.map(s => [
      s.shareholder_id, s.name, s.father_husband_name, s.mobile, s.village_name, s.circle_name, s.share_number, s.number_of_shares, s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shareholders_Page_${pagination.page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported shareholder page to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Shareholder Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage 17,250+ Shareholders, Share Records & Personal Profiles</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setEditShareholderData(null); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Shareholder
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print
          </button>
        </div>
      </div>

      {/* Powerful Search & Multi-Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Shareholder ID, Name, Share No, Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Village Filter */}
        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Villages ({villages.length})</option>
          {villages.map(v => (
            <option key={v.village_id} value={v.village_id}>{v.name}</option>
          ))}
        </select>

        {/* Circle Filter */}
        <select
          value={selectedCircle}
          onChange={(e) => setSelectedCircle(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Circles ({circles.length})</option>
          {circles.map(c => (
            <option key={c.circle_id} value={c.circle_id}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
        </select>
      </div>

      {/* High Performance Shareholders Data Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Searching database index across 17,250 records...
          </div>
        ) : shareholders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No shareholders found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Shareholder ID</th>
                  <th className="py-3.5 px-4">Shareholder Name</th>
                  <th className="py-3.5 px-4">Father/Husband Name</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Village</th>
                  <th className="py-3.5 px-4">Circle</th>
                  <th className="py-3.5 px-4">Share No</th>
                  <th className="py-3.5 px-4 text-center">Shares</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {shareholders.map((sh) => (
                  <tr key={sh.id} className="hover:bg-slate-900/60 transition-colors group">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{sh.shareholder_id}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{sh.name}</td>
                    <td className="py-3 px-4 text-slate-400">{sh.father_husband_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{sh.mobile}</td>
                    <td className="py-3 px-4 text-slate-300">{sh.village_name}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{sh.circle_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{sh.share_number}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-100">{sh.number_of_shares}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sh.status === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {sh.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {sh.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveProfileId(sh.shareholder_id)}
                          title="View Full Profile"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => { setEditShareholderData(sh); setShowAddForm(true); }}
                          title="Edit Shareholder"
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setActiveModule('id_cards')}
                          title="Generate ID Card"
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <Contact className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Side Pagination Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-bold text-emerald-400">{pagination.total.toLocaleString()}</span> total shareholders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Shareholder Profile Modal */}
      {activeProfileId && (
        <ShareholderProfile
          shareholderId={activeProfileId}
          onClose={() => setActiveProfileId(null)}
        />
      )}

      {/* Add / Edit Form Modal */}
      {showAddForm && (
        <ShareholderForm
          initialData={editShareholderData}
          onClose={() => { setShowAddForm(false); setEditShareholderData(null); }}
          onSaveSuccess={() => { setShowAddForm(false); setEditShareholderData(null); fetchShareholders(pagination.page); }}
        />
      )}
    </div>
  );
}
