import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, ShieldCheck, Clock, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

export default function LiveCloudStatusBadge({ className = '' }) {
  const {
    isOnline,
    reconnecting,
    latencyMs,
    lastSyncedAt,
    triggerSoftReconnect,
  } = useNetworkStatus();
  const { feedback } = useFeedback();
  const { lang } = useLanguage();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const containerRef = useRef(null);

  // Close popover when clicking anywhere outside or pressing Escape
  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPopoverOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen]);

  const handleSyncClick = async (e) => {
    e.stopPropagation();
    feedback('tick');
    setSyncing(true);
    try {
      await triggerSoftReconnect();
    } finally {
      setSyncing(false);
    }
  };

  const formattedLatency = latencyMs > 0 ? `${latencyMs}ms` : '<50ms';
  const secondsAgo = Math.max(0, Math.round((Date.now() - (lastSyncedAt || Date.now())) / 1000));

  return (
    <div ref={containerRef} className={`relative inline-flex items-center flex-shrink-0 ${className}`}>
      {/* Sleek inline live indicator button (fits flush inside navbar with zero overflow) */}
      <motion.button
        type="button"
        onClick={() => {
          feedback('tick');
          setPopoverOpen((prev) => !prev);
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`relative inline-flex items-center gap-1.5 px-2 py-0.5 h-7 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none flex-shrink-0 ${
          popoverOpen
            ? 'bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
            : !isOnline
            ? 'bg-rose-500/10 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-300/60 dark:border-rose-800/40'
            : reconnecting || syncing
            ? 'bg-amber-500/10 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/40'
            : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10'
        }`}
        title={
          isOnline
            ? `Real-Time Cloud Synced (${formattedLatency}) • Click for details`
            : 'Offline • Local Cache Mode'
        }
        aria-label="Real-Time Cloud Connection Telemetry"
      >
        {isOnline && !reconnecting && !syncing ? (
          <>
            {/* Live Activity Icon */}
            <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 animate-pulse" />
            {/* Latency RTT */}
            <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
              {formattedLatency}
            </span>
          </>
        ) : reconnecting || syncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 tracking-tight">
              {lang === 'ml' ? 'സിങ്ക്' : 'Sync'}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 tracking-tight">
              {lang === 'ml' ? 'ഓഫ്‌ലൈൻ' : 'Offline'}
            </span>
          </>
        )}
      </motion.button>

      {/* Telemetry Popover Dropdown */}
      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white/95 dark:bg-[#0c1412]/95 border border-gray-200/90 dark:border-emerald-500/20 shadow-2xl backdrop-blur-2xl p-4 z-50 text-gray-900 dark:text-gray-100 space-y-3.5 select-none"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'ml' ? 'ലൈവ് കണക്ഷൻ' : 'Live Cloud Telemetry'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Latency RTT</p>
                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {isOnline ? formattedLatency : 'Disconnected'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Last Cloud Sync</p>
                <p className="text-sm font-bold font-mono text-gray-700 dark:text-gray-300 mt-0.5">
                  {secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`}
                </p>
              </div>
            </div>

            {/* Status details */}
            <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>{isOnline ? 'Real-time WebSocket streaming active' : 'Offline local cache active'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Monotonic Asia/Kolkata clock synced</span>
              </div>
            </div>

            {/* Soft Re-Sync Action Button */}
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={syncing}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? (lang === 'ml' ? 'സമന്വയിപ്പിക്കുന്നു...' : 'Soft Re-syncing...')
                  : (lang === 'ml' ? 'ഇപ്പോൾ സിങ്ക് ചെയ്യുക' : 'Force Soft Re-Sync')}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
