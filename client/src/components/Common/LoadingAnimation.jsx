import React from 'react';
import { DEFAULT_LOGO_PATH, getCompanyLogo } from '../../services/organizationService';

/**
 * Universal High-End Loading Animation Component
 * 
 * Supports variants:
 * - 'page' | 'fullscreen': Full-page or module-level viewport loader with glowing official emblem & orbital rings
 * - 'section' | 'card': Centered inside cards, tables, modal dialogs, and sections
 * - 'skeleton': Shimmering table/card placeholder skeleton preview
 * - 'inline': Compact inline spinner for buttons, badges, and small controls
 */
export default function LoadingAnimation({
  variant = 'section',
  message = 'ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
  subMessage = 'Statutory Cooperative ERP Database Connection Active',
  size = 'md',
  showEmblem = true,
  className = '',
  rows = 5
}) {
  const companyLogo = typeof window !== 'undefined' ? getCompanyLogo() : DEFAULT_LOGO_PATH;

  // 1. INLINE SPINNER (Buttons, input adornments, small chips)
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 text-emerald-400 ${className}`}>
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
        </div>
        {message && <span className="text-xs font-medium">{message}</span>}
      </div>
    );
  }

  // 2. SKELETON PREVIEW (For tables, lists, and form cards)
  if (variant === 'skeleton') {
    return (
      <div className={`w-full p-4 space-y-3 ${className}`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="h-4 w-48 bg-slate-800/80 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-slate-800/60 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden h-12 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center px-4 gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800/80 shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 bg-slate-800/90 rounded"></div>
                <div className="h-2.5 w-1/2 bg-slate-800/50 rounded"></div>
              </div>
              <div className="w-20 h-6 bg-slate-800/70 rounded-lg shrink-0"></div>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. FULL PAGE / VIEWPORT LOADER
  if (variant === 'page' || variant === 'fullscreen') {
    return (
      <div
        className={`min-h-[55vh] flex flex-col items-center justify-center p-8 text-center select-none ${className}`}
      >
        {/* Orbital Emblem Core */}
        <div className="relative flex items-center justify-center w-28 h-28 mb-6">
          {/* Outer glowing ripple */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>

          {/* Clockwise rotating dashed emerald ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 border-dashed animate-orbit-cw"></div>

          {/* Counter-clockwise rotating gold/teal gradient ring */}
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-400 border-r-teal-300 animate-orbit-ccw"></div>

          {/* Inner core circle with official Emblem */}
          <div className="relative w-16 h-16 rounded-full bg-slate-950 border border-emerald-500/40 p-2 shadow-2xl shadow-emerald-500/20 flex items-center justify-center overflow-hidden animate-pulse-glow">
            {showEmblem ? (
              <img
                src={companyLogo}
                alt="Factory Emblem"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]"></div>
            )}
          </div>
        </div>

        {/* Kannada & English Loading Titles */}
        <div className="space-y-2 max-w-lg">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
            <span>{message}</span>
            <span className="flex space-x-1 items-center">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
            </span>
          </h3>
          {subMessage && (
            <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
              {subMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 4. SECTION / CARD / TABLE LOADER (Default)
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div
      className={`w-full flex flex-col items-center justify-center ${
        isLarge ? 'p-16 space-y-5 min-h-[320px]' : isSmall ? 'p-6 space-y-2.5 min-h-[150px]' : 'p-10 space-y-4 min-h-[220px]'
      } text-center select-none ${className}`}
    >
      {/* Dual Ring Orbital Spinner */}
      <div className={`relative flex items-center justify-center ${isLarge ? 'w-24 h-24' : isSmall ? 'w-12 h-12' : 'w-20 h-20'}`}>
        {/* Soft background glow */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/15 blur-lg animate-pulse"></div>

        {/* Outer clockwise ring */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/25 border-t-emerald-400 border-r-emerald-300 animate-orbit-cw"></div>

        {/* Inner counter-clockwise ring */}
        <div className="absolute inset-2 rounded-full border-2 border-teal-500/25 border-b-teal-300 border-l-teal-300 animate-orbit-ccw"></div>

        {/* Center emblem badge */}
        {showEmblem && !isSmall ? (
          <div className={`relative ${isLarge ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-slate-950 border border-emerald-500/40 p-1.5 flex items-center justify-center shadow-lg shadow-emerald-950/50 overflow-hidden`}>
            <img
              src={companyLogo}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"></div>
        )}
      </div>

      {/* Message Text with Animated Dots */}
      <div className="space-y-1.5 max-w-md">
        <p className={`${isLarge ? 'text-base' : isSmall ? 'text-xs' : 'text-sm sm:text-base'} font-bold text-slate-100 flex items-center justify-center gap-2`}>
          <span>{message}</span>
          <span className="inline-flex space-x-1 items-center">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
          </span>
        </p>
        {subMessage && (
          <p className="text-xs text-slate-400 font-medium">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}
