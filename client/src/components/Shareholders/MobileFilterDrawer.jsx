import React from 'react';
import { Filter, X, ArrowUp, ArrowDown, RotateCcw, Check } from 'lucide-react';

/**
 * MobileFilterDrawer: Touch-friendly slide-up sheet/drawer for mobile devices.
 * Lets users easily configure all 7 statutory filters and sort options.
 */
export default function MobileFilterDrawer({
  isOpen,
  onClose,
  selectedBook,
  setSelectedBook,
  bookList = [],
  selectedCast,
  setSelectedCast,
  castList = [],
  selectedVillage,
  setSelectedVillage,
  villages = [],
  selectedCircle,
  setSelectedCircle,
  circles = [],
  selectedAmount,
  setSelectedAmount,
  amountList = [],
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onResetFilters,
  formatCategory,
  formatPlace,
  formatCircle,
  isEnglish = false,
  t
}) {
  if (!isOpen) return null;

  const activeCount = [
    selectedBook,
    selectedCast,
    selectedVillage,
    selectedCircle,
    selectedAmount,
    selectedStatus,
    (sortBy && sortBy !== 'share_no' ? sortBy : null),
    (sortBy === 'share_no' && sortOrder === 'desc' ? 'desc' : null)
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn no-print">
      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden z-10"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {isEnglish ? 'Statutory Filters & Sorting' : 'ಶಾಸನಬದ್ಧ ಫಿಲ್ಟರ್‌ಗಳು (Filters)'}
            </h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {activeCount} {isEnglish ? 'active' : 'ಸಕ್ರಿಯ'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isEnglish ? "Close" : "ಮುಚ್ಚಿ"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* 1. Book No */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              📖 {isEnglish ? 'Book No (ವಹಿ ಪುಸ್ತಕ ನಂ):' : 'ಪುಸ್ತಕ ನಂ (Book No):'}
            </label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
            >
              <option value="">{t ? t('sh_all_books') : 'ಎಲ್ಲ ಪುಸ್ತಕಗಳು'} ({bookList.length})</option>
              {bookList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 2. Schedule Cast / Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              👥 {isEnglish ? 'Category / Class (ವರ್ಗ):' : 'ವರ್ಗ (Category / Class):'}
            </label>
            <select
              value={selectedCast}
              onChange={(e) => setSelectedCast(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
            >
              <option value="">{t ? t('sh_all_categories') : 'ಎಲ್ಲ ವರ್ಗಗಳು'} ({castList.length})</option>
              {castList.map(c => (
                <option key={c} value={c}>
                  {formatCategory ? formatCategory(c) : c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Place / Village */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              📍 {isEnglish ? 'Place / Village (ಸ್ಥಳ / ಗ್ರಾಮ):' : 'ಸ್ಥಳ / ಗ್ರಾಮ (Place / Village):'}
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
            >
              <option value="">{t ? t('sh_all_places') : 'ಎಲ್ಲ ಸ್ಥಳಗಳು'} ({villages.length})</option>
              {villages.map(v => (
                <option key={v.village_id || v.name} value={v.name}>
                  {formatPlace ? formatPlace(v.name) : v.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Circle */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              🏛️ {isEnglish ? 'Operational Circle (ವಲಯ):' : 'ವಲಯ (Operational Circle):'}
            </label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
            >
              <option value="">{t ? t('sh_all_circles') : 'ಎಲ್ಲ ವಲಯಗಳು'} ({circles.length})</option>
              {circles.map(c => (
                <option key={c.circle_id || c.name} value={c.name}>
                  {formatCircle ? formatCircle(c.name) : c.name} ({c.shareholder_count || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Total Cash Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              💰 {isEnglish ? 'Cash Capital Amount (ಶೇರು ಮೊತ್ತ):' : 'ಶೇರು ಮೊತ್ತ (Capital Amount):'}
            </label>
            <select
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none font-medium"
            >
              <option value="">{t ? t('sh_all_amounts') : 'ಎಲ್ಲ ನಗದು ಮೊತ್ತಗಳು'} ({amountList.length})</option>
              {amountList.map(a => (
                <option key={a.amount} value={a.amount}>
                  ₹ {a.amount.toLocaleString('en-IN')} ({a.count} {isEnglish ? 'Members' : 'ಸದಸ್ಯರು'})
                </option>
              ))}
            </select>
          </div>

          {/* 6. Account Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              🟢 {isEnglish ? 'Account Status (ಖಾತೆ ಸ್ಥಿತಿ):' : 'ಖಾತೆ ಸ್ಥಿತಿ (Account Status):'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
            >
              <option value="">{t ? t('sh_all_statuses') : 'ಎಲ್ಲ ಸ್ಥಿತಿಗಳು'}</option>
              <option value="Active">{t ? t('sh_status_active') : 'ಸಕ್ರಿಯ (Active)'}</option>
              <option value="Inactive">{t ? t('sh_status_inactive') : 'ನಿಷ್ಕ್ರಿಯ (Inactive)'}</option>
            </select>
          </div>

          {/* 7. Alphabetical Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              ↕️ {isEnglish ? 'Alphabetical Sort (ವಿಂಗಡಣೆ):' : 'ಅಕಾರಾದಿ ವಿಂಗಡಣೆ (Sort By):'}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
              >
                <option value="share_no">{t ? t('sh_sort_share_no') : 'ಶೇರು ಸಂಖ್ಯೆ'} (1 ➔ ... {isEnglish ? 'Asc' : 'ಏರಿಕೆ'})</option>
                <option value="place">{t ? t('sh_sort_place') : 'ಸ್ಥಳ / ಗ್ರಾಮ (ಅ-ಹ)'}</option>
                <option value="circle">{t ? t('sh_sort_circle') : 'ವಲಯ (ಅ-ಹ)'}</option>
                <option value="address">{t ? t('sh_sort_address') : 'ವಿಳಾಸ (ಅ-ಹ)'}</option>
                <option value="name">{t ? t('sh_sort_name') : 'ಹೆಸರು (ಅ-ಹ)'}</option>
              </select>
              {sortBy && (
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-emerald-400 text-xs shrink-0 cursor-pointer"
                  title={sortOrder === 'asc' ? 'Ascending (A-Z)' : 'Descending (Z-A)'}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEnglish ? 'Reset All' : 'ಎಲ್ಲ ತೆರವು'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isEnglish ? 'Apply Filters' : 'ಫಿಲ್ಟರ್ ಅನ್ವಯಿಸಿ (Apply)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
