import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * TopHorizontalScrollbar: Renders an interactive, synchronized horizontal scrollbar
 * positioned directly ABOVE tables so users can scroll wide tables (like 38-column statutory ledgers)
 * horizontally from the top without scrolling all the way to the bottom.
 */
export default function TopHorizontalScrollbar({ targetRef, className = '', label = '' }) {
  const topScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isSyncingTop = useRef(false);
  const isSyncingBottom = useRef(false);

  const updateMeasurements = useCallback(() => {
    if (targetRef?.current) {
      const sw = targetRef.current.scrollWidth;
      const cw = targetRef.current.clientWidth;
      const sl = targetRef.current.scrollLeft;
      setScrollWidth(sw);
      setClientWidth(cw);
      setScrollLeft(sl);
      if (topScrollRef.current && Math.abs(topScrollRef.current.scrollLeft - sl) > 2) {
        topScrollRef.current.scrollLeft = sl;
      }
    }
  }, [targetRef]);

  useEffect(() => {
    updateMeasurements();
    const target = targetRef?.current;
    if (!target) return;

    // Observe size changes
    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });
    resizeObserver.observe(target);

    const tableEl = target.querySelector('table');
    if (tableEl) {
      resizeObserver.observe(tableEl);
    }

    const onTargetScroll = () => {
      if (isSyncingTop.current) return;
      isSyncingBottom.current = true;
      if (topScrollRef.current) {
        topScrollRef.current.scrollLeft = target.scrollLeft;
        setScrollLeft(target.scrollLeft);
      }
      requestAnimationFrame(() => {
        isSyncingBottom.current = false;
      });
    };

    target.addEventListener('scroll', onTargetScroll, { passive: true });
    window.addEventListener('resize', updateMeasurements);

    // Initial delay check for dynamic data rendering
    const timer = setTimeout(updateMeasurements, 300);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      target.removeEventListener('scroll', onTargetScroll);
      window.removeEventListener('resize', updateMeasurements);
    };
  }, [targetRef, updateMeasurements]);

  const onTopScroll = () => {
    if (isSyncingBottom.current) return;
    isSyncingTop.current = true;
    if (targetRef?.current && topScrollRef.current) {
      targetRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      setScrollLeft(topScrollRef.current.scrollLeft);
    }
    requestAnimationFrame(() => {
      isSyncingTop.current = false;
    });
  };

  const scrollByAmount = (amt) => {
    if (targetRef?.current) {
      targetRef.current.scrollBy({ left: amt, behavior: 'smooth' });
    }
  };

  // Only render when the content actually overflows horizontally
  if (scrollWidth <= clientWidth + 10 || scrollWidth === 0) {
    return null;
  }

  const maxScroll = Math.max(1, scrollWidth - clientWidth);
  const scrollPercent = Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100)));

  return (
    <div className={`flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-md mb-2 select-none z-30 sticky top-0 ${className}`}>
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => scrollByAmount(-350)}
        disabled={scrollLeft <= 2}
        className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-400 border border-slate-700 transition-colors shrink-0 cursor-pointer shadow-sm"
        title="Scroll left (ಎಡಕ್ಕೆ ಚಲಿಸಿ)"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Label or hint */}
      <span className="text-[10px] text-slate-400 font-semibold hidden md:inline shrink-0">
        {label || 'ಮೇಲಿನ ಅಡ್ಡಪಟ್ಟಿ (Top Scroller):'}
      </span>

      {/* Top Scroller Track with Sync */}
      <div className="flex-1 relative flex items-center">
        <div
          ref={topScrollRef}
          onScroll={onTopScroll}
          className="w-full overflow-x-auto overflow-y-hidden top-scroller-bar py-0.5"
          style={{
            height: '14px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#10b981 #1e293b'
          }}
          title="ಕೋಷ್ಟಕವನ್ನು ಎಡ-ಬಲಕ್ಕೆ ಚಲಿಸಲು ಈ ಸ್ಕ್ರಾಲ್ ಬಾರ್ ಎಳೆಯಿರಿ (Drag or scroll to move table)"
        >
          <div style={{ width: `${scrollWidth}px`, height: '2px' }} />
        </div>
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => scrollByAmount(350)}
        disabled={scrollLeft >= maxScroll - 5}
        className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-400 border border-slate-700 transition-colors shrink-0 cursor-pointer shadow-sm"
        title="Scroll right (ಬಲಕ್ಕೆ ಚಲಿಸಿ)"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>

      {/* Percentage pill */}
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
        {scrollPercent}%
      </span>
    </div>
  );
}
