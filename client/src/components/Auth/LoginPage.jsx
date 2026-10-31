import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import {
  LogIn, Lock, User, Eye, EyeOff, ShieldCheck, AlertTriangle
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const companyLogo = useCompanyLogo();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('ದಯವಿಟ್ಟು ಸಿಬ್ಬಂದಿ ಐಡಿ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.');
      return;
    }
    if (!password) {
      setError('ದಯವಿಟ್ಟು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiService.authenticateUser({
        identifier: identifier.trim(),
        password: password.trim()
      });

      if (res && res.success && res.user) {
        login(res.user);
      } else {
        setError(res?.message || 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ.');
      }
    } catch (err) {
      setError(err.message || 'ಲಾಗಿನ್ ದೋಷ ಸಂಭವಿಸಿದೆ.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fadeIn">
        {/* Factory Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 mx-auto p-1.5 flex items-center justify-center text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/20 overflow-hidden">
            <img
              src={companyLogo}
              alt="BSSKN Logo"
              className="w-full h-full object-contain rounded-2xl bg-white/10"
              onError={(e) => {
                if (!e.target.src.includes('./id_assets/')) {
                  e.target.src = DEFAULT_LOGO_PATH;
                  return;
                }
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center font-black text-xs text-white">
              BSSKN
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-100 tracking-tight leading-snug">
              ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
            </h1>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              ಮರಗೂರ - 586204, ತಾ: ಇಂಡಿ/ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-slate-900/90 border border-emerald-500/30 rounded-full text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಪೋರ್ಟಲ್ • Staff ERP Login</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Staff ID / Mobile */}
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold flex items-center justify-between">
                <span>ಸಿಬ್ಬಂದಿ ಐಡಿ / ಮೊಬೈಲ್ (Staff ID / Mobile) *</span>
                <span className="text-[10px] text-slate-500 font-mono">ಉದಾ: EMP-001</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="EMP-001 ಅಥವಾ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ನಂ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-slate-100 font-mono text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all pl-10"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold flex items-center justify-between">
                <span>ಪಾಸ್‌ವರ್ಡ್ (Password) *</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">ಡೀಫಾಲ್ಟ್: Shares123</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-slate-100 font-mono text-sm placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all pl-10 pr-10"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ಲಾಗಿನ್ ಆಗಿ (Sign In to ERP)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Policy / Security Notice */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-[10.5px] text-emerald-300/90 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ಪಾಸ್‌ವರ್ಡ್ & ಕರ್ತವ್ಯದ ಪಾತ್ರದ ಸೂಚನೆ (RBAC Policy):</span>
            </div>
            <p className="leading-relaxed">
              • ಪ್ರತಿಯೊಬ್ಬ ಸಿಬ್ಬಂದಿಗೆ ಡೀಫಾಲ್ಟ್ ಪಾಸ್‌ವರ್ಡ್ <strong className="font-mono text-amber-300">Shares123</strong> ಇರುತ್ತದೆ.
            </p>
            <p className="leading-relaxed">
              • ಲಾಗಿನ್ ಆದ ನಂತರ ಮೇಲ್ಭಾಗದ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ತಮ್ಮದೇ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿಕೊಳ್ಳಬಹುದು.
            </p>
            <p className="leading-relaxed">
              • ನಿರ್ವಾಹಕರು ನಿಯೋಜಿಸಿದ ಪಾತ್ರದ (Assigned Role) ಪ್ರಕಾರ ಮಾತ್ರ ವೈಶಿಷ್ಟ್ಯಗಳು ಲಭ್ಯವಾಗುತ್ತವೆ.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <div>© {new Date().getFullYear()} ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ. All rights reserved.</div>
          <div className="text-[10px]">Cloud Multi-Device ERP • Superfast Statutory Ledger</div>
        </div>
      </div>
    </div>
  );
}
