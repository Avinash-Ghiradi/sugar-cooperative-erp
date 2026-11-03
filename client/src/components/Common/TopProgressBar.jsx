import React, { useState, useEffect } from 'react';

/**
 * TopProgressBar - Displays a sleek, YouTube/GitHub-style animated glowing progress bar
 * at the top of the browser viewport whenever an async operation, network sync, or module change occurs.
 */
export default function TopProgressBar() {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    const handleStart = () => setLoadingCount(c => c + 1);
    const handleEnd = () => setLoadingCount(c => Math.max(0, c - 1));

    window.addEventListener('app_loading_start', handleStart);
    window.addEventListener('app_loading_end', handleEnd);

    return () => {
      window.removeEventListener('app_loading_start', handleStart);
      window.removeEventListener('app_loading_end', handleEnd);
    };
  }, []);

  if (loadingCount <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-slate-900/40 pointer-events-none overflow-hidden">
      <div className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_12px_#10b981] animate-top-bar"></div>
    </div>
  );
}

// Global dispatch helper functions
export function triggerLoadingStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app_loading_start'));
  }
}

export function triggerLoadingEnd() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app_loading_end'));
  }
}
