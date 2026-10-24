import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, ChefHat, Check } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';

export default function RationPrintModal({
  isOpen,
  onClose,
  items = [],
  meta = {},
  activeDiners = 0,
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    soundEngine.playSoftChime();
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-emerald-500/30 shadow-2xl bg-white dark:bg-[#0f1715] text-gray-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold">Kitchen Ration Distribution Slip</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Slip Content */}
          <div className="py-4 space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs">
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                Alathurpadi Dars Mess Preparation Order
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-1 flex justify-between">
                <span>Date: {meta.friendlyDate || meta.targetDateIST}</span>
                <span className="capitalize font-semibold">Meal: {meta.meal}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                Total Active Diners: <strong className="text-emerald-700 dark:text-emerald-300">{activeDiners} students</strong>
              </div>
            </div>

            {/* Item Table */}
            <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-white/5 font-semibold text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="p-2.5">Ingredient</th>
                    <th className="p-2.5 text-right">Target Weight</th>
                    <th className="p-2.5 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{item.name}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {item.weight}
                      </td>
                      <td className="p-2.5 text-right text-gray-500 dark:text-gray-400 text-[11px]">
                        {item.sub}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
