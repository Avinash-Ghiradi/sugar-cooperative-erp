import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { useCompanyLogo, DEFAULT_LOGO_PATH } from '../../services/organizationService';
import {
  X, Sparkles, Sun, Sunrise, Sunset, Moon, Bell, Megaphone,
  Calendar, CheckCircle, ChevronRight, ChevronLeft, Eye, Maximize2,
  Share2, ShieldCheck, LogIn, Award, Heart
} from 'lucide-react';

export default function PreLoginNoticeModal({ isOpen, onClose, isPreview = false }) {
  const companyLogo = useCompanyLogo();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active login notices
  useEffect(() => {
    let isMounted = true;
    async function loadNotices() {
      try {
        setLoading(true);
        const res = await ApiService.getActiveLoginNotices();
        if (isMounted && res && res.data) {
          setNotices(res.data);
        }
      } catch (err) {
        console.error('Failed to load notices:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (isOpen) {
      loadNotices();
      setCurrentIndex(0);
    }

    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate dynamic time of day greeting
  const getGreetingData = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return {
        label: 'ಶುಭೋದಯ',
        labelEnglish: 'Good Morning',
        subtext: 'ಇಂದಿನ ಹೊಸ ಮುಂಜಾನೆ ನಿಮಗೆ ಹಾಗೂ ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಸಂತೋಷ & ಸಮೃದ್ಧಿ ತರಲಿ.',
        icon: Sunrise,
        gradient: 'from-amber-500 via-orange-500 to-yellow-400',
        bgPill: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        badge: '🌅 ಮುಂಜಾನೆಯ ಶುಭೋದಯ'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        label: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
        labelEnglish: 'Good Afternoon',
        subtext: 'ಕಾರ್ಖಾನೆಯ ದಿನನಿತ್ಯದ ಕಾರ್ಯಚಟುವಟಿಕೆಗಳು ಹಾಗೂ ಕಬ್ಬು ಅರೆಕೆ ಯಶಸ್ವಿಯಾಗಿ ಸಾಗಲಿ.',
        icon: Sun,
        gradient: 'from-emerald-500 via-teal-500 to-cyan-400',
        bgPill: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        badge: '☀️ ಮಧ್ಯಾಹ್ನದ ಶುಭ ಹಾರೈಕೆ'
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        label: 'ಶುಭ ಸಂಜೆ',
        labelEnglish: 'Good Evening',
        subtext: 'ಇಂದಿನ ದಿನದ ಸಮಸ್ತ ಕಾರ್ಯಗಳು ಸುಸೂತ್ರವಾಗಿ ಪೂರ್ಣಗೊಂಡಿರಲಿ ಎಂದು ಹಾರೈಸುತ್ತೇವೆ.',
        icon: Sunset,
        gradient: 'from-orange-500 via-rose-500 to-purple-600',
        bgPill: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
        badge: '🌇 ಶುಭ ಸಂಜೆ ವಂದನೆಗಳು'
      };
    } else {
      return {
        label: 'ಶುಭ ರಾತ್ರಿ',
        labelEnglish: 'Good Night',
        subtext: 'ಶಾಂತಿಯುತ ವಿಶ್ರಾಂತಿ & ಸುಖನಿದ್ರೆ ನಿಮ್ಮದಾಗಲಿ.',
        icon: Moon,
        gradient: 'from-indigo-500 via-purple-600 to-slate-800',
        bgPill: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
        badge: '🌙 ಶುಭ ರಾತ್ರಿ'
      };
    }
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;

  const currentNotice = notices[currentIndex] || null;

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'FESTIVAL':
        return {
          icon: Sparkles,
          label: 'ಹಬ್ಬದ ಶುಭಾಶಯ',
          en: 'Festival Wishes',
          cls: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40'
        };
      case 'URGENT':
        return {
          icon: Megaphone,
          label: 'ತುರ್ತು ಪ್ರಕಟಣೆ',
          en: 'Urgent Announcement',
          cls: 'bg-rose-950/70 text-rose-300 border-rose-500/50 animate-pulse'
        };
      case 'SUGAR':
        return {
          icon: Award,
          label: 'ಸಕ್ಕರೆ ಕೋಟಾ',
          en: 'Sugar Allotment',
          cls: 'bg-purple-950/70 text-purple-300 border-purple-500/40'
        };
      case 'GREETING':
        return {
          icon: Heart,
          label: 'ಶುಭಾಶಯ',
          en: 'Greeting',
          cls: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
        };
      default:
        return {
          icon: Bell,
          label: 'ಅಧಿಕೃತ ಸೂಚನೆ',
          en: 'Notice',
          cls: 'bg-sky-950/70 text-sky-300 border-sky-500/40'
        };
    }
  };

  const formattedDate = currentTime.toLocaleDateString('kn-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedDateEn = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleDismissToday = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`sugar_erp_notice_dismissed_${today}`, 'true');
    } catch (e) {}
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
        <div
          className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-950/50 overflow-hidden flex flex-col my-auto max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Decorative Color Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-500 shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <img
                  src={companyLogo}
                  alt="BSSKN Logo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    if (!e.target.src.includes('./id_assets/')) {
                      e.target.src = DEFAULT_LOGO_PATH;
                      return;
                    }
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight leading-tight">
                    ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.
                  </h2>
                  {isPreview && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      ಮುನ್ನೋಟ (Preview)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">
                  ಮರಗೂರ - 586204, ತಾ: ಇಂಡಿ/ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formattedDate} • {formattedDateEn}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
              title="ಮುಚ್ಚಿ (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Time of the Day Dynamic Greeting Card */}
          <div className="px-4 sm:px-6 pt-4 pb-2 shrink-0">
            <div className={`p-3.5 sm:p-4 rounded-2xl border ${greeting.bgPill} flex items-center justify-between gap-3 shadow-md`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${greeting.gradient} text-slate-950 shadow-md shrink-0`}>
                  <GreetingIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black tracking-tight text-white">
                      {greeting.label}!
                    </span>
                    <span className="text-xs font-semibold opacity-80 text-slate-200">
                      ({greeting.labelEnglish})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                    {greeting.subtext}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 border border-white/20 text-white shrink-0">
                {greeting.badge}
              </span>
            </div>
          </div>

          {/* Notice Tabs / Navigation Pills */}
          {notices.length > 1 && (
            <div className="px-4 sm:px-6 pt-2 pb-1 shrink-0 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 flex-wrap">
                {notices.map((n, idx) => {
                  const badgeInfo = getCategoryBadge(n.category);
                  const Icon = badgeInfo.icon;
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={n.id || idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 border border-emerald-400'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{n.title.slice(0, 22)}{n.title.length > 22 ? '...' : ''}</span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : notices.length - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="ಹಿಂದಿನ ಸೂಚನೆ"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
                  {currentIndex + 1}/{notices.length}
                </span>
                <button
                  onClick={() => setCurrentIndex(prev => (prev < notices.length - 1 ? prev + 1 : 0))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="ಮುಂದಿನ ಸೂಚನೆ"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Notice Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-medium">ಸೂಚನೆಗಳು & ಶುಭಾಶಯಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</p>
              </div>
            ) : currentNotice ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Notice Header & Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {(() => {
                    const b = getCategoryBadge(currentNotice.category);
                    const BIcon = b.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${b.cls}`}>
                        <BIcon className="w-3.5 h-3.5" />
                        <span>{b.label}</span>
                        <span className="text-[10px] opacity-80">({b.en})</span>
                      </span>
                    );
                  })()}

                  <div className="flex items-center gap-2">
                    {currentNotice.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        ತುರ್ತು (URGENT)
                      </span>
                    )}
                    {currentNotice.priority === 'IMPORTANT' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ಮುಖ್ಯ (IMPORTANT)
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium">
                      ಪ್ರೇಕ್ಷಕರು: {currentNotice.target === 'ALL' ? 'ಎಲ್ಲರಿಗೂ (All)' : currentNotice.target === 'STAFF' ? 'ಸಿಬ್ಬಂದಿಗೆ (Staff)' : 'ಶೇರುದಾರರಿಗೆ (Shareholders)'}
                    </span>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black text-slate-100 leading-snug">
                    {currentNotice.title}
                  </h3>
                  {currentNotice.subtitle && (
                    <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                      {currentNotice.subtitle}
                    </p>
                  )}
                  {currentNotice.title_english && (
                    <p className="text-xs text-slate-400 italic font-medium">
                      {currentNotice.title_english}
                    </p>
                  )}
                </div>

                {/* Optional Attached Notice Image / Banner */}
                {currentNotice.image && (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950/80 shadow-lg">
                    <img
                      src={currentNotice.image}
                      alt={currentNotice.title}
                      className="w-full max-h-72 object-contain bg-slate-950 cursor-pointer transition-transform duration-300 group-hover:scale-102"
                      onClick={() => setLightboxImage(currentNotice.image)}
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImage(currentNotice.image)}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ಪೂರ್ಣ ಚಿತ್ರ ವೀಕ್ಷಿಸಿ (Zoom)</span>
                    </button>
                    {currentNotice.image_caption && (
                      <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-900/90 border-t border-slate-800">
                        {currentNotice.image_caption}
                      </div>
                    )}
                  </div>
                )}

                {/* Notice Message Details */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                    {currentNotice.message}
                  </p>
                  {currentNotice.message_english && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                        {currentNotice.message_english}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs">ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಪ್ರಕಟಣೆಗಳಿಲ್ಲ.</p>
              </div>
            )}
          </div>

          {/* Modal Footer Action Bar */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDismissToday}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors cursor-pointer order-2 sm:order-1"
            >
              ಇಂದಿಗೆ ಮತ್ತೆ ತೋರಿಸಬೇಡ (Don't show again today)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer order-1 sm:order-2 group"
            >
              <LogIn className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              <span>ಲಾಗಿನ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ (Continue to Login)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 cursor-pointer shadow-xl z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
