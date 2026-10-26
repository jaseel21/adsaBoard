import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, BarChart3, Table2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

/**
 * ApexSurfaceTabs: Tri-Surface Switcher between Tactical Token Matrix, Operations Radar, and Universal Data Studio.
 */
export default function ApexSurfaceTabs({
  activeSurface = 'matrix',
  onChangeSurface,
  tokenCount = 0,
}) {
  const { t } = useLanguage();

  const handleTabChange = (surface) => {
    if (surface === activeSurface) return;
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (onChangeSurface) onChangeSurface(surface);
  };

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-1.5 sm:p-2 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl">
      <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
        {/* Surface 1: Tactical Token Matrix */}
        <button
          type="button"
          onClick={() => handleTabChange('matrix')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all select-none ${
            activeSurface === 'matrix'
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {activeSurface === 'matrix' && (
            <motion.div
              layoutId="apexActiveSurfaceTab"
              className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md shadow-emerald-600/25"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
          <LayoutGrid className="w-4 h-4 relative z-10 shrink-0" />
          <span className="relative z-10">{t('tacticalMatrix', 'Tactical Matrix')}</span>
          <span className="relative z-10 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black">
            {tokenCount}
          </span>
        </button>

        {/* Surface 2: Universal Data Studio (Spreadsheet CRUD) */}
        <button
          type="button"
          onClick={() => handleTabChange('studio')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all select-none ${
            activeSurface === 'studio'
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {activeSurface === 'studio' && (
            <motion.div
              layoutId="apexActiveSurfaceTab"
              className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 rounded-xl shadow-md shadow-cyan-600/25"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
          <Table2 className="w-4 h-4 relative z-10 shrink-0" />
          <span className="relative z-10">Data Studio (CRUD)</span>
        </button>

        {/* Surface 3: Operations Radar & Telemetry */}
        <button
          type="button"
          onClick={() => handleTabChange('radar')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all select-none ${
            activeSurface === 'radar'
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {activeSurface === 'radar' && (
            <motion.div
              layoutId="apexActiveSurfaceTab"
              className="absolute inset-0 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-xl shadow-md shadow-teal-600/25"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
          <BarChart3 className="w-4 h-4 relative z-10 shrink-0" />
          <span className="relative z-10">{t('operationsRadar', 'Operations Radar')}</span>
          <span className="relative z-10 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300" />
          </span>
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pr-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="font-medium text-[11px]">
          {activeSurface === 'matrix'
            ? t('interactiveSwitchGrid', 'Interactive Switch Grid')
            : activeSurface === 'studio'
            ? 'Spreadsheet-Style Grid with Inline Editing & Bulk Dispatch'
            : t('realtimeInstitutionalTelemetry', 'Real-time Institutional Telemetry')}
        </span>
      </div>
    </div>
  );
}
