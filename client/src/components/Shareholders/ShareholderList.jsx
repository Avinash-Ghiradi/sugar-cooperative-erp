import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Search, Filter, Plus, FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
  Eye, Edit, Contact, CheckCircle2, XCircle, RefreshCw, BookOpen, Layers, Check, Download
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
  const [selectedBook, setSelectedBook] = useState('');
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' (38 columns) or 'summary'

  // Options
  const [villages, setVillages] = useState([]);
  const [circles, setCircles] = useState([]);
  const [bookList, setBookList] = useState(['B.No: 1', 'B.No: 2', 'B.No: 3', 'B.No: 4', 'B.No: 5']);

  // Modals
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editShareholderData, setEditShareholderData] = useState(null);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    fetchShareholders(1);
  }, [search, selectedVillage, selectedCircle, selectedStatus, selectedBook]);

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
      status: selectedStatus,
      book_no: selectedBook
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

  // Full 38 Columns CSV Export matching the statutory cooperative format
  const exportFullLedgerCsv = () => {
    const headers = [
      'Book. No', 'Sl. No', 'Share No', 'Share Holder Name', 'Gender', 'Aadhaar Card No',
      'Reg. Date', 'Receipt No', 'Receipt Amount', 'Date', 'Reciept', 'Amount', 'Total Amount',
      'No. of Shares', 'Schedule Cast', 'Address', 'Nagara', 'Road', 'Place', 'Taluk', 'District',
      'Pin Code', 'Circle', 'Member Type', 'Relationship', 'Tharava Date', 'Tharava No',
      'Mobile No', 'Photo URL', 'Signature URL', 'Thumb URL', 'Photo Updated', 'Signature Updated',
      'Thumb Updated', 'Nominee Name', 'Nominee Aadhaar No', 'Nominee Mobile No', 'Nominee Address'
    ];

    const rows = shareholders.map(s => [
      `"${s.book_no || 'B.No: 1'}"`,
      s.sl_no || s.id,
      s.share_no || s.share_number || '',
      `"${s.shareholder_name || s.name || ''}"`,
      s.gender || 'M',
      `"${s.aadhaar_card_no || s.aadhaar_ref || ''}"`,
      `"${s.reg_date || s.registration_date || ''}"`,
      s.receipt_no || '',
      s.receipt_amount || s.amount || 2000,
      `"${s.date || s.reg_date || ''}"`,
      s.reciept || s.receipt_no || '',
      s.amount || s.receipt_amount || 2000,
      s.total_amount || s.share_value || 2000,
      s.number_of_shares || 1,
      `"${s.schedule_cast || 'ಅ - ವರ್ಗ'}"`,
      `"${s.address || ''}"`,
      `"${s.nagara || ''}"`,
      `"${s.road || ''}"`,
      `"${s.place || s.village_name || ''}"`,
      `"${s.taluk || 'ಇಂಡಿ'}"`,
      `"${s.district || 'ವಿಜಯಪುರ'}"`,
      `"${s.pin_code || ''}"`,
      `"${s.circle || s.circle_name || ''}"`,
      `"${s.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)'}"`,
      `"${s.relationship || 'ಸ್ವಂತ (Self)'}"`,
      `"${s.tharava_date || ''}"`,
      `"${s.tharava_no || ''}"`,
      `"${s.mobile_no || s.mobile || ''}"`,
      `"${s.photo_url || ''}"`,
      `"${s.signature_url || ''}"`,
      `"${s.thumb_url || ''}"`,
      s.photo_updated || 'No',
      s.signature_updated || 'No',
      s.thumb_updated || 'Yes',
      `"${s.nominee_name || ''}"`,
      `"${s.nominee_aadhaar_no || ''}"`,
      `"${s.nominee_mobile_no || ''}"`,
      `"${s.nominee_address || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cooperative_Shareholder_Ledger_Page_${pagination.page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported complete 38-column statutory ledger to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Shareholder Statutory Ledger (ಷೇರುದಾರರ ನಮೂನೆ ವಹಿ)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              38 Columns Official Format
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            17,250+ Shareholders Registry with Book No, Share No, Aadhaar, Receipt, Place, Taluk, Circle, Tharava & Nominee Details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'ledger' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Ledger (38 Cols)
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Summary View
            </button>
          </div>

          <button
            onClick={() => { setEditShareholderData(null); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Shareholder
          </button>

          <button
            onClick={exportFullLedgerCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export 38-Col CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print
          </button>
        </div>
      </div>

      {/* Multi-Field Search & Statutory Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Name (ಕನ್ನಡ / English), Share No, Book No, Mobile, Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Book No Filter */}
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Books (Book No)</option>
          {bookList.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Place / Village Filter */}
        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Places ({villages.length})</option>
          {villages.map(v => (
            <option key={v.village_id} value={v.name}>{v.name} ({v.taluk})</option>
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
            <option key={c.circle_id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active (ಸಕ್ರಿಯ)</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Main Table: Full 38-Column Official Cooperative Ledger View */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Searching statutory cooperative index across 17,250 records...
          </div>
        ) : shareholders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No shareholders found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[72vh]">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 font-bold text-[11px] sticky top-0 z-20 shadow-md">
                <tr className="border-b border-slate-800">
                  <th className="py-3.5 px-3 bg-slate-900 sticky left-0 z-30 shadow-r">Actions</th>
                  <th className="py-3.5 px-3 bg-slate-900 sticky left-14 z-30 border-r border-slate-800">Book. No</th>
                  <th className="py-3.5 px-3 text-center">Sl. No</th>
                  <th className="py-3.5 px-3 font-mono text-emerald-400">Share No</th>
                  <th className="py-3.5 px-4 font-bold text-slate-100 min-w-[200px]">Share Holder Name (ಷೇರುದಾರರ ಹೆಸರು)</th>
                  <th className="py-3.5 px-2 text-center">Gender</th>
                  <th className="py-3.5 px-3 font-mono">Aadhaar Card No</th>
                  <th className="py-3.5 px-3">Reg. Date</th>
                  <th className="py-3.5 px-2 text-center">Receipt No</th>
                  <th className="py-3.5 px-3 text-right">Receipt Amount</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-2 text-center">Reciept</th>
                  <th className="py-3.5 px-3 text-right">Amount</th>
                  <th className="py-3.5 px-3 text-right font-bold text-amber-400">Total Amount</th>
                  <th className="py-3.5 px-2 text-center font-bold text-emerald-400">No. of Shares</th>
                  <th className="py-3.5 px-3 text-center">Schedule Cast / ವರ್ಗ</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Address (ವಿಳಾಸ)</th>
                  <th className="py-3.5 px-3">Nagara</th>
                  <th className="py-3.5 px-3">Road</th>
                  <th className="py-3.5 px-3 font-bold text-slate-100">Place (ಸ್ಥಳ/ಗ್ರಾಮ)</th>
                  <th className="py-3.5 px-3">Taluk</th>
                  <th className="py-3.5 px-3">District</th>
                  <th className="py-3.5 px-3">Pin Code</th>
                  <th className="py-3.5 px-3">Circle</th>
                  <th className="py-3.5 px-3">Member Type</th>
                  <th className="py-3.5 px-3">Relationship</th>
                  <th className="py-3.5 px-3">Tharava Date</th>
                  <th className="py-3.5 px-3">Tharava No</th>
                  <th className="py-3.5 px-3 font-mono text-emerald-400">Mobile No</th>
                  <th className="py-3.5 px-2 text-center">Photo Upd.</th>
                  <th className="py-3.5 px-2 text-center">Sign Upd.</th>
                  <th className="py-3.5 px-2 text-center">Thumb Upd.</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Nominee Name</th>
                  <th className="py-3.5 px-3 font-mono">Nominee Aadhaar</th>
                  <th className="py-3.5 px-3 font-mono">Nominee Mobile</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nominee Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {shareholders.map((sh, idx) => (
                  <tr key={sh.id || idx} className="hover:bg-slate-900/80 transition-colors group">
                    {/* Fixed Action Buttons Column */}
                    <td className="py-2.5 px-2 bg-slate-950 group-hover:bg-slate-900 sticky left-0 z-10">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveProfileId(sh.shareholder_id || sh.id)}
                          title="View Full Profile"
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditShareholderData(sh); setShowAddForm(true); }}
                          title="Edit Record"
                          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveModule('id_cards')}
                          title="Generate ID Card"
                          className="p-1 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Contact className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* 1. Book. No (Sticky) */}
                    <td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-14 z-10 font-bold text-sky-400 border-r border-slate-800">
                      {sh.book_no || 'B.No: 1'}
                    </td>

                    {/* 2. Sl. No */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{sh.sl_no || idx + 1}</td>

                    {/* 3. Share No */}
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{sh.share_no || sh.share_number}</td>

                    {/* 4. Share Holder Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-100 text-[13px]">{sh.shareholder_name || sh.name}</td>

                    {/* 5. Gender */}
                    <td className="py-2.5 px-2 text-center text-slate-300 font-semibold">{sh.gender || 'M'}</td>

                    {/* 6. Aadhaar Card No */}
                    <td className="py-2.5 px-3 font-mono text-slate-300">{sh.aadhaar_card_no || sh.aadhaar_ref || '—'}</td>

                    {/* 7. Reg. Date */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.reg_date || sh.registration_date}</td>

                    {/* 8. Receipt No */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-300">{sh.receipt_no || sh.id}</td>

                    {/* 9. Receipt Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium">₹ {(sh.receipt_amount || 2000).toLocaleString()}</td>

                    {/* 10. Date */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.date || sh.reg_date || sh.registration_date}</td>

                    {/* 11. Reciept */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">{sh.reciept || sh.receipt_no || ''}</td>

                    {/* 12. Amount */}
                    <td className="py-2.5 px-3 text-right font-mono">₹ {(sh.amount || sh.receipt_amount || 2000).toLocaleString()}</td>

                    {/* 13. Total Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      ₹ {(sh.total_amount || sh.share_value || 2000).toLocaleString()}
                    </td>

                    {/* 14. No. of Shares */}
                    <td className="py-2.5 px-2 text-center font-extrabold text-emerald-400">{sh.number_of_shares || 1}</td>

                    {/* 15. Schedule Cast / ವರ್ಗ */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-200">
                        {sh.schedule_cast || 'ಅ - ವರ್ಗ'}
                      </span>
                    </td>

                    {/* 16. Address */}
                    <td className="py-2.5 px-4 text-slate-300 max-w-[220px] truncate" title={sh.address}>{sh.address || '—'}</td>

                    {/* 17. Nagara */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.nagara || '—'}</td>

                    {/* 18. Road */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.road || '—'}</td>

                    {/* 19. Place (Village) */}
                    <td className="py-2.5 px-3 font-bold text-emerald-300">{sh.place || sh.village_name}</td>

                    {/* 20. Taluk */}
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{sh.taluk || 'ಇಂಡಿ'}</td>

                    {/* 21. District */}
                    <td className="py-2.5 px-3 text-slate-300">{sh.district || 'ವಿಜಯಪುರ'}</td>

                    {/* 22. Pin Code */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sh.pin_code || '—'}</td>

                    {/* 23. Circle */}
                    <td className="py-2.5 px-3 text-slate-300">{sh.circle || sh.circle_name}</td>

                    {/* 24. Member Type */}
                    <td className="py-2.5 px-3 text-slate-300">{sh.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ'}</td>

                    {/* 25. Relationship */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.relationship || 'ಸ್ವಂತ'}</td>

                    {/* 26. Tharava Date */}
                    <td className="py-2.5 px-3 text-slate-400">{sh.tharava_date || '—'}</td>

                    {/* 27. Tharava No */}
                    <td className="py-2.5 px-3 font-mono text-sky-400">{sh.tharava_no || '—'}</td>

                    {/* 28. Mobile No */}
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">{sh.mobile_no || sh.mobile || '—'}</td>

                    {/* 29-31. Photos & URL status */}
                    <td className="py-2.5 px-2 text-center text-[10px] text-slate-300">{sh.photo_updated || 'No'}</td>
                    <td className="py-2.5 px-2 text-center text-[10px] text-slate-300">{sh.signature_updated || 'No'}</td>
                    <td className="py-2.5 px-2 text-center text-[10px] text-emerald-400 font-bold">{sh.thumb_updated || 'Yes'}</td>

                    {/* 35. Nominee Name */}
                    <td className="py-2.5 px-4 font-medium text-slate-200">{sh.nominee_name || '—'}</td>

                    {/* 36. Nominee Aadhaar */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sh.nominee_aadhaar_no || '—'}</td>

                    {/* 37. Nominee Mobile */}
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sh.nominee_mobile_no || '—'}</td>

                    {/* 38. Nominee Address */}
                    <td className="py-2.5 px-4 text-slate-400 max-w-[200px] truncate" title={sh.nominee_address}>{sh.nominee_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Side Pagination Bar */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-bold text-emerald-400">{pagination.total.toLocaleString()}</span> statutory cooperative shareholders
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
