import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

export default function OfflineStatusIndicator() {
  const { isOffline, reconnecting, wasOffline } = useNetworkStatus();
  const { feedback } = useFeedback();
  const { lang } = useLanguage();

  // Play subtle haptic feedback when state toggles
  useEffect(() => {
    if (isOffline) {
      feedback('warning');
    } else if (reconnecting) {
      feedback('success');
    }
  }, [isOffline, reconnecting, feedback]);

  const showIndicator = isOffline || (reconnecting && wasOffline);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-14 md:top-20 inset-x-0 z-40 pointer-events-none flex justify-center px-4"
        >
          <div
            className={`pointer-events-auto px-3.5 py-1.5 rounded-full backdrop-blur-2xl text-xs font-bold shadow-xl border flex items-center gap-2 max-w-sm select-none transition-colors ${
              isOffline
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/30 shadow-amber-950/30'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/30'
            }`}
          >
            {isOffline ? (
              <>
                <span className="flex h-2 w-2 relative flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate tracking-tight">
                  {lang === 'ml'
                    ? 'ഓഫ്‌ലൈൻ • കാഷെ ചെയ്ത ടോക്കണുകൾ കാണിക്കുന്നു'
                    : 'Offline • Displaying cached tokens & menu'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate tracking-tight">
                  {lang === 'ml'
                    ? 'ഓൺലൈൻ • വിവരങ്ങൾ സമന്വയിപ്പിച്ചു'
                    : 'Back Online • Live cloud synchronized'}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
