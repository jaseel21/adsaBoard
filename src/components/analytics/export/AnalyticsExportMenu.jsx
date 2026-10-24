import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Table, Printer, ChevronDown, Check, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import { generateExecutiveAnalyticsPdf } from './AnalyticsExecutiveReport';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function AnalyticsExportMenu({
  telemetry = {},
  dietary = {},
  batchBenchmarks = [],
  wasteEconomics = {},
  kitchenRations = {},
  meta = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleExportPdf = () => {
    setDownloading(true);
    soundEngine.playSoftChime();
    hapticEngine.successPulse();

    try {
      const doc = generateExecutiveAnalyticsPdf({
        telemetry,
        dietary,
        batchBenchmarks,
        wasteEconomics,
        kitchenRations,
        meta,
      });
      const filename = `ADSA_Analytics_Dossier_${meta.targetDateIST || 'report'}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setDownloading(false);
      setIsOpen(false);
    }
  };

  const handleExportCsv = () => {
    soundEngine.playSoftChime();
    hapticEngine.successPulse();

    try {
      const rows = batchBenchmarks.map((b) => ({
        Batch: b.name,
        TotalEnrolled: b.total,
        ActiveDiners: b.active,
        ParticipationRate: `${b.rate}%`,
        Status: b.status,
        OptedOut: b.optedOut,
        NoBeefAvoiders: b.beefAvoid,
        NoFishAvoiders: b.fishAvoid,
      }));

      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ADSA_Batch_Analytics_${meta.targetDateIST || 'data'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV:', e);
    } finally {
      setIsOpen(false);
    }
  };

  const handlePrint = () => {
    soundEngine.playSoftChime();
    setIsOpen(false);
    window.print();
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          soundEngine.playPop();
          hapticEngine.lightTap();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold border border-gray-200 dark:border-white/10 transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5 text-emerald-500" />
        <span>Export Studio</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-emerald-500/30 shadow-2xl z-50 text-xs"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Download Dossier
            </div>

            <button
              onClick={handleExportPdf}
              disabled={downloading}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Executive PDF Report</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <Table className="w-4 h-4 text-indigo-500" />
              <span>Raw Batch CSV Data</span>
            </button>

            <div className="my-1 border-t border-gray-100 dark:border-white/10" />

            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Print Page View</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
