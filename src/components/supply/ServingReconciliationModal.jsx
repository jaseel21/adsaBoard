import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Share2,
  X,
  CheckCircle2,
  Clock,
  Heart,
  AlertTriangle,
  UserX,
  Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useFeedback } from '../../utils/useFeedback';

export default function ServingReconciliationModal({
  isOpen,
  onClose,
  meal = 'lunch',
  targetDateIST,
  metrics,
  documents = [],
  servedMap = new Map(),
}) {
  const { feedback } = useFeedback();

  if (!isOpen || !metrics) return null;

  // Unserved students who had token turned ON
  const unservedEligible = metrics.eligibleList.filter(
    (st) => !servedMap.has(Number(st.tokenNo))
  );

  // Grace plates list
  const graceRecords = [];
  servedMap.forEach((rec) => {
    if (rec.isGracePlate) {
      graceRecords.push(rec);
    }
  });

  // Generate & Download PDF Report
  const handleDownloadPdf = () => {
    feedback('tick');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const mealLabel = meal.toUpperCase();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(6, 78, 59); // Emerald 900
    doc.text('ALATHURPADI DARS CANTEEN', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Official Dining Service Reconciliation Report • ${mealLabel}`, 14, 28);
    doc.text(`Service Date: ${targetDateIST} | Generated: ${new Date().toLocaleTimeString('en-IN')}`, 14, 34);

    // Summary KPI Table
    doc.autoTable({
      startY: 40,
      head: [['Total Eligible Diners', 'Plates Served', 'Remaining Unserved', 'Grace Plates Issued']],
      body: [
        [
          String(metrics.totalEligible),
          String(metrics.eligibleServedCount),
          String(metrics.remainingEligibleCount),
          String(metrics.gracePlatesCount),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { halign: 'center', fontSize: 11 },
    });

    // Unserved Diners Table (Food should be preserved for them!)
    if (unservedEligible.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 60;
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9); // Amber 700
      doc.text(`Unserved Eligible Students (Food Reserved): ${unservedEligible.length}`, 14, finalY + 10);

      const unservedRows = unservedEligible.map((st) => [
        `#${st.tokenNo}`,
        st.uname || st.name || 'Student',
        st.batch || 'Dars',
        st.phone || '—',
      ]);

      doc.autoTable({
        startY: finalY + 14,
        head: [['Token', 'Student Name', 'Batch', 'Phone']],
        body: unservedRows,
        theme: 'striped',
        headStyles: { fillColor: [180, 83, 9] },
        styles: { fontSize: 9 },
      });
    }

    // Grace Plates Table
    if (graceRecords.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 120;
      doc.setFontSize(12);
      doc.setTextColor(190, 24, 93); // Rose 700
      doc.text(`Courtesy Grace Plates Issued: ${graceRecords.length}`, 14, finalY + 10);

      const graceRows = graceRecords.map((gr) => [
        `#${gr.tokenNo}`,
        gr.studentName || 'Student',
        gr.graceReason || 'Courtesy plate',
        gr.servedByName || 'Staff',
      ]);

      doc.autoTable({
        startY: finalY + 14,
        head: [['Token', 'Student Name', 'Reason', 'Issued By']],
        body: graceRows,
        theme: 'striped',
        headStyles: { fillColor: [190, 24, 93] },
        styles: { fontSize: 9 },
      });
    }

    doc.save(`ADSA_${mealLabel}_Reconciliation_${targetDateIST}.pdf`);
  };

  // WhatsApp text summary
  const handleShareSummary = () => {
    feedback('pop');
    const text =
      `*ADSA CANTEEN DINING RECONCILIATION*\n` +
      `📅 *Date:* ${targetDateIST}\n` +
      `🍽️ *Meal:* ${meal.toUpperCase()}\n` +
      `--------------------------------\n` +
      `✅ *Eligible Diners:* ${metrics.totalEligible}\n` +
      `🍛 *Portions Served:* ${metrics.eligibleServedCount}\n` +
      `⏳ *Unserved Diners Remaining:* ${metrics.remainingEligibleCount}\n` +
      `🤲 *Grace Plates Issued:* ${metrics.gracePlatesCount}\n` +
      `--------------------------------\n` +
      (unservedEligible.length > 0
        ? `⚠️ *Keep food aside for remaining ${unservedEligible.length} students:* ` +
          unservedEligible.map((s) => `#${s.tokenNo}`).join(', ')
        : `✨ All eligible diners have collected their meals!`);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Reconciliation summary copied to clipboard! You can paste into the Canteen WhatsApp group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/40 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-emerald-900/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Dining Reconciliation Report
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {meal.toUpperCase()} • {targetDateIST}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#070b09] border border-gray-200 dark:border-emerald-900/30 text-center">
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.totalEligible}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase">Eligible Diners</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#070b09] border border-gray-200 dark:border-emerald-900/30 text-center">
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {metrics.eligibleServedCount}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase">Portions Served</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#070b09] border border-gray-200 dark:border-emerald-900/30 text-center">
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {metrics.remainingEligibleCount}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase">Remaining Diners</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#070b09] border border-gray-200 dark:border-emerald-900/30 text-center">
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {metrics.gracePlatesCount}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase">Grace Plates</div>
          </div>
        </div>

        {/* SCROLLABLE LIST OF UNSERVED STUDENTS */}
        <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
          {unservedEligible.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                <Clock className="w-4 h-4" />
                <span>Reserved Meals for Remaining {unservedEligible.length} Students:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unservedEligible.map((st) => (
                  <div
                    key={st.tokenNo}
                    className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                        #{st.tokenNo}
                      </span>
                      <span className="truncate max-w-[140px] text-gray-800 dark:text-gray-200">
                        {st.uname || st.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">{st.batch}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-center text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
              <strong>100% Meal Distribution Complete!</strong> All registered diners have collected their meals.
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-4 border-t border-gray-100 dark:border-emerald-900/30 flex items-center space-x-3">
          <button
            onClick={handleDownloadPdf}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          <button
            onClick={handleShareSummary}
            className="py-3 px-5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Copy WhatsApp Text</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
