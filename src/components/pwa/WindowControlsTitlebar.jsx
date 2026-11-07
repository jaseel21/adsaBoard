import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Command, ShieldCheck, Monitor } from 'lucide-react';
import {
  isWindowControlsOverlayActive,
  subscribeWindowControlsOverlay,
  detectOS,
  openDesktopInstallModal,
} from '../../utils/pwaManager';
import { useWorldTime } from '../../utils/time';
import { useFeedback } from '../../utils/useFeedback';

/**
 * Window Controls Overlay (WCO) Titlebar
 * Blends custom branded controls into the OS titlebar when running as an installed desktop PWA.
 * Supports Windows 11/10 window controls on the right and macOS traffic lights on the left.
 */
export default function WindowControlsTitlebar({ onOpenSearch }) {
  const [wcoActive, setWcoActive] = useState(false);
  const [titlebarRect, setTitlebarRect] = useState(null);
  const { feedback } = useFeedback();
  const { timeParts, formatTime, dayFull } = useWorldTime('Asia/Kolkata');
  const os = detectOS();

  useEffect(() => {
    // Check initial state
    setWcoActive(isWindowControlsOverlayActive());

    // Subscribe to geometry changes (e.g. window resize or snap)
    const unsub = subscribeWindowControlsOverlay((visible, rect) => {
      setWcoActive(visible);
      if (rect) setTitlebarRect(rect);
    });

    return unsub;
  }, []);

  if (!wcoActive) return null;

  // Compute left and right paddings to avoid overlapping native window controls
  const isMac = os === 'macos';
  const paddingLeft = isMac ? (titlebarRect?.x ? `${titlebarRect.x}px` : '80px') : '12px';
  const paddingRight = !isMac ? '140px' : '16px';

  return (
    <div
      style={{
        paddingLeft,
        paddingRight,
        WebkitAppRegion: 'drag',
        appRegion: 'drag',
      }}
      className="fixed top-0 left-0 right-0 z-50 h-[36px] bg-[#0c1412]/95 dark:bg-[#080d0b]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between text-xs text-white select-none transition-all"
    >
      {/* Left zone: Campus logo and branding */}
      <div
        style={{ WebkitAppRegion: 'no-drag', appRegion: 'no-drag' }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            openDesktopInstallModal('tools');
          }}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/10 text-gray-200 transition-colors cursor-pointer"
          title="Open Desktop App Tools & Diagnostics"
        >
          <img
            src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
            alt="ADSA Logo"
            className="w-3.5 h-3.5 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-extrabold text-[11px] tracking-tight text-white">ADSA T-Board</span>
          <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
            PRO
          </span>
        </button>
      </div>

      {/* Center Draggable Spacer & Breadcrumb Title */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        <span className="text-[11px] font-semibold text-gray-400 truncate max-w-xs">
          Alathurpadi Dars • Dining Logistics & Token Attendance
        </span>
      </div>

      {/* Right zone: Quick Search trigger & Clock */}
      <div
        style={{ WebkitAppRegion: 'no-drag', appRegion: 'no-drag' }}
        className="flex items-center gap-2"
      >
        {/* Quick Search Shortcut Pill */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={() => {
              feedback('pop');
              onOpenSearch();
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition-all cursor-pointer text-[10.5px]"
            title="Search pages (⌘K)"
          >
            <Search className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="font-mono text-[9px] px-1 rounded bg-black/40 text-gray-300">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
        )}

        {/* Live IST Clock Mini Capsule */}
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-black/30 border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {timeParts ? `${timeParts.hours}:${timeParts.minutes} ${timeParts.period}` : '--:--'}
          </span>
        </div>
      </div>
    </div>
  );
}
