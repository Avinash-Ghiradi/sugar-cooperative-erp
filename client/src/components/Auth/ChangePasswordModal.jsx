import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, X, ShieldCheck, LogOut } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose, forced = false }) {
  const { user, logout, showToast, updateCurrentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState(() => {
    return user?.is_default_password ? 'Shares123' : '';
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('ದಯವಿಟ್ಟು ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ (Please enter current password).');
      return;
    }
    if (newPassword.length < 4) {
      setError('ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳನ್ನು ಹೊಂದಿರಬೇಕು (Minimum 4 characters required).');
      return;
    }
    if (newPassword === 'Shares123') {
      setError('ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್‌ಗಿಂತ (Shares123) ಭಿನ್ನವಾಗಿರಬೇಕು.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು ದೃಢೀಕರಣ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ (New password and confirmation do not match).');
      return;
    }

    setLoading(true);
    try {
      const identifier = user.employee_id || user.share_no || user.mobile || user.username;
      const res = await ApiService.changePassword({
        identifier,
        currentPassword,
        newPassword
      });

      if (res && res.success) {
        showToast(res.message || 'ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ!', 'success');
        updateCurrentUser({ is_default_password: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onClose) onClose();
      } else {
        setError(res?.message || 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾವಣೆ ವಿಫಲವಾಗಿದೆ.');
      }
    } catch (err) {
      setError(err.message || 'ದೋಷ ಸಂಭವಿಸಿದೆ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${forced ? 'bg-amber-950 border-amber-700 text-amber-400' : 'bg-emerald-950 border-emerald-800 text-emerald-400'}`}>
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                {forced ? 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ರಚನೆ ಕಡ್ಡಾಯ (Mandatory Password Change)' : 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ (Change Password)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {user.share_no ? `ಷೇರು ನಂ: #${user.share_no}` : (user.employee_id ? `ಸಿಬ್ಬಂದಿ ಐಡಿ: #${user.employee_id}` : `ಬಳಕೆದಾರ: ${user.username}`)} • {user.name}
              </p>
            </div>
          </div>
          {!forced && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Forced / Default Password Reminder Banner */}
        {forced ? (
          <div className="p-3.5 bg-amber-950/60 border border-amber-600/60 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">
                ಮೊದಲ ಲಾಗಿನ್ ಭದ್ರತಾ ನಿಯಮ (First-Time Security Policy)
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                ನೀವು ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ (<strong className="font-mono text-white">Shares123</strong>) ಬಳಸಿ ಲಾಗಿನ್ ಆಗಿದ್ದೀರಿ. ನಿಮ್ಮ ಖಾತೆಯ ರಕ್ಷಣೆಗಾಗಿ ನಿಮ್ಮದೇ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸುವುದು ಕಡ್ಡಾಯವಾಗಿದೆ. ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಿದ ತಕ್ಷಣ ನಿಮ್ಮ ಖಾತೆ ಸಕ್ರಿಯಗೊಳ್ಳುತ್ತದೆ.
              </p>
            </div>
          </div>
        ) : (
          user.is_default_password && (
            <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl text-[11px] text-amber-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                ನೀವು ಇನ್ನೂ ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ (<strong className="font-mono text-amber-300">Shares123</strong>) ಬಳಸುತ್ತಿದ್ದೀರಿ. ಭದ್ರತೆಗಾಗಿ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ.
              </span>
            </div>
          )
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Current Password */}
          <div>
            <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
              <span>ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್ (Current Password) *</span>
              {user.is_default_password && (
                <button
                  type="button"
                  onClick={() => setCurrentPassword('Shares123')}
                  className="text-[10px] text-amber-400 hover:underline font-mono"
                >
                  Shares123 (ಡೀಫಾಲ್ಟ್ ತುಂಬಿದೆ)
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono pr-10 focus:border-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ (New Password) *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold pr-10 focus:border-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ (Confirm New Password) *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಮರು-ನಮೂದಿಸಿ"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-2.5">
            {forced ? (
              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ಲಾಗ್‌ಔಟ್ (Logout)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                ರದ್ದುಮಾಡಿ (Cancel)
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50 cursor-pointer ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : (forced ? 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಿ & ಮುಂದುವರಿಯಿರಿ' : 'ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಿ (Update)')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
