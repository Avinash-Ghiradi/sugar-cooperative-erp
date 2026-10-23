import React, { useRef } from 'react';
import TopHorizontalScrollbar from './TopHorizontalScrollbar';

/**
 * TableScrollerContainer: Replaces tables whose horizontal scrollbar was below the table
 * by placing a prominent, synchronized horizontal scrollbar ABOVE the table.
 * Preserves full vertical scrolling while cleanly hiding the redundant bottom horizontal scrollbar.
 */
export default function TableScrollerContainer({
  children,
  className = '',
  maxHeight = '',
  label = ''
}) {
  const containerRef = useRef(null);

  return (
    <div className="w-full">
      {/* Top Synchronized Horizontal Scroller Bar */}
      <TopHorizontalScrollbar targetRef={containerRef} label={label} />

      {/* Main Table Container */}
      <div
        ref={containerRef}
        className={`overflow-x-auto table-hide-bottom-scroller ${maxHeight || ''} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
