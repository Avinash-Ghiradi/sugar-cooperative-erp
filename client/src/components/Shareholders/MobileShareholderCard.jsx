import React from 'react';
import {
  Eye, Edit, Contact, History, CheckCircle2, XCircle, GitMerge,
  Phone, MapPin, Building2, BookOpen, Layers, Coins
} from 'lucide-react';

/**
 * MobileShareholderCard: Modern, thumb-friendly mobile card view for shareholders.
 * Displays all key statutory information (Share No, Book No, Sl No, Place, Circle,
 * Shares count, Total Amount, Mobile, Aadhaar) and quick actions.
 */
export default function MobileShareholderCard({
  sh,
  idx,
  isInactive,
  formatCategory,
  formatPlace,
  formatCircle,
  formatAddress,
  formatTaluk,
  formatDistrict,
  getShareholderSharesCount,
  onViewProfile,
  onViewHistory,
  onInitiateEdit,
  onViewIdCard,
  isEnglish = false,
  t
}) {
  const sharesCount = isInactive ? 0 : getShareholderSharesCount(sh);
  const totalAmount = isInactive ? 0 : (Number(sh.total_amount ?? sh.share_value ?? 2000));
  const isMerged = Boolean(sh.is_merged || (sh.all_share_numbers && sh.all_share_numbers.length > 1) || String(sh.share_no).includes(','));

  const memberName = sh.shareholder_name || sh.name || 'Member';
  const initial = memberName.trim().charAt(0) || 'S';

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isInactive
        ? 'bg-rose-950/20 border-rose-900/60 text-slate-300'
        : 'bg-slate-950/90 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/40 text-slate-100 shadow-md'
    }`}>
      {/* Top Header: Avatar + Shareholder Name + Badges */}
      <div className="flex items-start gap-3">
        {/* Avatar Photo or Initial */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-900 to-teal-800 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-extrabold text-base shadow-sm shrink-0 overflow-hidden">
          {sh.photo_url ? (
            <img src={sh.photo_url} alt={memberName} className="w-full h-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* Name, Badges & Category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onViewProfile(sh)}
              className="text-sm font-bold text-slate-100 hover:text-emerald-400 cursor-pointer transition-colors leading-snug break-words"
            >
              {memberName}
            </h3>
            {/* Category Badge */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-emerald-300 border border-emerald-700/60 shrink-0">
              {formatCategory ? formatCategory(sh.schedule_cast) : (sh.schedule_cast || 'ಅ - ವರ್ಗ')}
            </span>
          </div>

          {/* Status & Merged Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {isInactive ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>{isEnglish ? 'Inactive' : 'ನಿಷ್ಕ್ರಿಯ'}</span>
                {sh.merged_into_share_no && <span>➔ #{sh.merged_into_share_no}</span>}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{isEnglish ? 'Active' : 'ಸಕ್ರಿಯ'}</span>
              </span>
            )}

            {isMerged && !isInactive && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                <GitMerge className="w-3 h-3 text-amber-400" />
                <span>{isEnglish ? 'Merged' : 'ವಿಲೀನ'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Details Grid (2x3 info pills) */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
        {/* Share Number */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{isEnglish ? 'Share No:' : 'ಶೇರು ಸಂ:'}</span>
          <span
            onClick={() => onInitiateEdit(sh)}
            className="font-mono font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer text-xs"
            title="Edit record"
          >
            #{sh.share_no || sh.share_number}
          </span>
        </div>

        {/* Book & Sl No */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{isEnglish ? 'Book / Sl:' : 'ಪುಸ್ತಕ / ಕ್ರಮ:'}</span>
          <span className="font-mono text-sky-400 font-semibold text-xs">
            {sh.book_no || 'B.No: 1'} • #{sh.sl_no || idx + 1}
          </span>
        </div>

        {/* Place / Village */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{isEnglish ? 'Place:' : 'ಸ್ಥಳ / ಗ್ರಾಮ:'}</span>
          <span className="font-bold text-emerald-300 text-xs truncate max-w-[100px]" title={formatPlace ? formatPlace(sh.place || sh.village_name) : (sh.place || sh.village_name)}>
            {formatPlace ? formatPlace(sh.place || sh.village_name) : (sh.place || sh.village_name)}
          </span>
        </div>

        {/* Circle */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{isEnglish ? 'Circle:' : 'ವಲಯ:'}</span>
          <span className="text-slate-300 text-xs truncate max-w-[100px]" title={formatCircle ? formatCircle(sh.circle || sh.circle_name) : (sh.circle || sh.circle_name)}>
            {formatCircle ? formatCircle(sh.circle || sh.circle_name) : (sh.circle || sh.circle_name)}
          </span>
        </div>

        {/* Shares Count */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{isEnglish ? 'Shares:' : 'ಶೇರುಗಳು:'}</span>
          <span className="font-extrabold text-emerald-400 text-xs">
            {sharesCount} {isEnglish ? 'Shares' : 'ಶೇರು'}
          </span>
        </div>

        {/* Total Amount / Capital */}
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{isEnglish ? 'Capital:' : 'ಒಟ್ಟು ಮೊತ್ತ:'}</span>
          <span className="font-mono font-bold text-amber-400 text-xs">
            ₹ {totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Optional details row: Mobile / Aadhaar / Receipt if present */}
      {(sh.mobile_no || sh.mobile || sh.aadhaar_card_no || sh.receipt_no) && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          {(sh.mobile_no || sh.mobile) && (
            <a
              href={`tel:${sh.mobile_no || sh.mobile}`}
              className="flex items-center gap-1 text-emerald-400 font-mono hover:underline"
            >
              <Phone className="w-3 h-3" />
              <span>{sh.mobile_no || sh.mobile}</span>
            </a>
          )}
          {sh.receipt_no && (
            <span>{isEnglish ? 'Receipt #' : 'ರಶೀದಿ: '}{sh.receipt_no}</span>
          )}
          {sh.reg_date && (
            <span className="font-mono">{sh.reg_date}</span>
          )}
        </div>
      )}

      {/* Action Buttons: 4 Large Touch Targets */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
        {/* 1. Profile / Details */}
        <button
          onClick={() => onViewProfile(sh)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-all text-[10px] font-semibold cursor-pointer gap-1"
          title={isEnglish ? "View Full Profile" : "ಸಮಗ್ರ ಪ್ರೊಫೈಲ್"}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>{isEnglish ? 'Profile' : 'ವಿವರ'}</span>
        </button>

        {/* 2. ID Card */}
        {isInactive ? (
          <button
            disabled
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/40 border border-slate-900 text-slate-600 transition-all text-[10px] font-semibold opacity-40 cursor-not-allowed gap-1"
          >
            <Contact className="w-4 h-4" />
            <span>{isEnglish ? 'ID Card' : 'ಗುರುತಿನ ಚೀಟಿ'}</span>
          </button>
        ) : (
          <button
            onClick={() => onViewIdCard(sh)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-all text-[10px] font-semibold cursor-pointer gap-1"
            title={isEnglish ? "Official ID Card" : "ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ"}
          >
            <Contact className="w-4 h-4 text-emerald-400" />
            <span>{isEnglish ? 'ID Card' : 'ಗುರುತಿನ ಚೀಟಿ'}</span>
          </button>
        )}

        {/* 3. Edit Record */}
        {isInactive ? (
          <button
            disabled
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/40 border border-slate-900 text-slate-600 transition-all text-[10px] font-semibold opacity-40 cursor-not-allowed gap-1"
          >
            <Edit className="w-4 h-4" />
            <span>{isEnglish ? 'Edit' : 'ತಿದ್ದುಪಡಿ'}</span>
          </button>
        ) : (
          <button
            onClick={() => onInitiateEdit(sh)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-sky-400 transition-all text-[10px] font-semibold cursor-pointer gap-1"
            title={isEnglish ? "Edit Record" : "ದಾಖಲೆ ತಿದ್ದುಪಡಿ"}
          >
            <Edit className="w-4 h-4 text-sky-400" />
            <span>{isEnglish ? 'Edit' : 'ತಿದ್ದುಪಡಿ'}</span>
          </button>
        )}

        {/* 4. History / Audit */}
        <button
          onClick={() => onViewHistory(sh)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-all text-[10px] font-semibold cursor-pointer gap-1"
          title={isEnglish ? "History & Audit Trail" : "ಇತಿಹಾಸ & ಆಡಿಟ್"}
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>{isEnglish ? 'History' : 'ಇತಿಹಾಸ'}</span>
        </button>
      </div>
    </div>
  );
}
