import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Code,
  Calendar,
  Filter,
  Eye,
  Printer,
  Share2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { dialog } from '../../utils/dialog';
import UniversalDocumentModal from '../export/UniversalDocumentModal';

export default function AuditExportModal({
  isOpen,
  onClose,
  logs = [],
  onHapticFeedback,
}) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [dateFilter, setDateFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  if (!isOpen) return null;

  // Filter logs by date range if requested
  const filteredLogsForExport = logs.filter((log) => {
    if (dateFilter === 'all') return true;
    const logTime = new Date(log.timestamp).getTime();
    const now = Date.now();
    if (dateFilter === 'today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      return logTime >= startOfDay;
    }
    if (dateFilter === '7days') {
      return logTime >= now - 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const handlePreviewAndActions = () => {
    if (onHapticFeedback) onHapticFeedback('tick');
    const nowStr = new Date().toISOString().split('T')[0];

    if (exportFormat === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(18);
      doc.setTextColor(5, 150, 105);
      doc.text('ADSA T-Board • Official Administrative Audit Report', 40, 45);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Alathurpadi Dars Students Association • Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`,
        40,
        62
      );
      doc.text(`Total Records: ${filteredLogsForExport.length} | Range: ${dateFilter.toUpperCase()}`, 40, 76);

      const tableRows = filteredLogsForExport.map((log) => [
        new Date(log.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        log.action.replace(/_/g, ' '),
        log.category?.toUpperCase() || 'SYSTEM',
        log.severity?.toUpperCase() || 'INFO',
        log.actor?.displayName || log.actor?.email || 'Admin',
        log.target?.label || log.target?.id || '-',
        log.changes?.diffSummary || '-',
      ]);

      doc.autoTable({
        startY: 90,
        head: [['Timestamp (IST)', 'Action', 'Category', 'Severity', 'Actor', 'Target', 'Summary']],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 40, right: 40 },
      });

      setUniversalDoc({
        isOpen: true,
        data: {
          type: 'pdf',
          doc,
          title: 'Audit Trail Report',
          subtitle: `Range: ${dateFilter.toUpperCase()} • ${filteredLogsForExport.length} Records`,
          filename: `adsa_audit_report_${nowStr}.pdf`,
        },
      });
    } else if (exportFormat === 'csv') {
      const csvRows = filteredLogsForExport.map((log) => ({
        ID: log.id,
        Timestamp: log.timestamp,
        Action: log.action,
        Category: log.category,
        Severity: log.severity,
        Actor: log.actor?.displayName || log.actor?.email || '',
        Target: log.target?.label || log.target?.tokenNo || '',
        Summary: log.changes?.diffSummary || '',
      }));
      const csvString = Papa.unparse(csvRows);
      setUniversalDoc({
        isOpen: true,
        data: {
          type: 'csv',
          rows: csvRows,
          csv: csvString,
          title: 'Audit Trail (CSV)',
          subtitle: `${filteredLogsForExport.length} Audit Entries`,
          filename: `adsa_audit_export_${nowStr}.csv`,
        },
      });
    } else if (exportFormat === 'json') {
      setUniversalDoc({
        isOpen: true,
        data: {
          type: 'json',
          json: filteredLogsForExport,
          title: 'Audit Trail JSON Dump',
          subtitle: `${filteredLogsForExport.length} Records`,
          filename: `adsa_audit_dump_${nowStr}.json`,
        },
      });
    }
  };

  const handleExport = async () => {
    if (!filteredLogsForExport.length) {
      dialog.toast.warning('No Records', 'There are no audit logs matching the chosen filter.');
      return;
    }

    setIsExporting(true);
    try {
      const nowStr = new Date().toISOString().split('T')[0];

      // Export as PDF
      if (exportFormat === 'pdf') {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        // Header Title
        doc.setFontSize(18);
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text('ADSA T-Board • Official Administrative Audit Report', 40, 45);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Alathurpadi Dars Students Association • Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`,
          40,
          62
        );
        doc.text(`Total Records: ${filteredLogsForExport.length} | Range: ${dateFilter.toUpperCase()}`, 40, 76);

        // Table Data
        const tableRows = filteredLogsForExport.map((log) => [
          new Date(log.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          log.action.replace(/_/g, ' '),
          log.category?.toUpperCase() || 'SYSTEM',
          log.severity?.toUpperCase() || 'INFO',
          log.actor?.displayName || log.actor?.email || 'Admin',
          log.target?.label || log.target?.id || '-',
          log.changes?.diffSummary || '-',
        ]);

        doc.autoTable({
          startY: 90,
          head: [['Timestamp (IST)', 'Action', 'Category', 'Severity', 'Actor', 'Target', 'Summary']],
          body: tableRows,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: {
            fillColor: [5, 150, 105],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 40, right: 40 },
        });

        doc.save(`adsa_audit_report_${nowStr}.pdf`);
      }

      // Export as CSV
      else if (exportFormat === 'csv') {
        const csvRows = filteredLogsForExport.map((log) => ({
          ID: log.id,
          Timestamp: log.timestamp,
          Action: log.action,
          Category: log.category,
          Severity: log.severity,
          Actor_Name: log.actor?.displayName || '',
          Actor_Email: log.actor?.email || '',
          Actor_Role: log.actor?.role || '',
          Target_Type: log.target?.type || '',
          Target_Label: log.target?.label || '',
          Target_Token: log.target?.tokenNo || '',
          Diff_Summary: log.changes?.diffSummary || '',
          Fields_Changed: (log.changes?.fieldsChanged || []).join('; '),
          Route: log.metadata?.route || '',
          Device: log.metadata?.deviceType || '',
          Reason: log.metadata?.reason || '',
        }));

        const csvString = Papa.unparse(csvRows);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `adsa_audit_export_${nowStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Export as JSON Dump
      else if (exportFormat === 'json') {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(filteredLogsForExport, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `adsa_audit_dump_${nowStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }

      if (onHapticFeedback) onHapticFeedback('success');
      dialog.toast.success(
        'Export Completed',
        `Successfully generated ${exportFormat.toUpperCase()} with ${filteredLogsForExport.length} entries.`
      );
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      dialog.alert({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not compile audit export.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (onHapticFeedback) onHapticFeedback('tick');
            onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 400 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-[#0f1715] rounded-3xl shadow-2xl border border-gray-200/80 dark:border-white/10 p-5 sm:p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Export Audit Trail
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Compile verified committee administrative logs
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onClose();
              }}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Format Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onHapticFeedback) onHapticFeedback('tick');
                  setExportFormat('pdf');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  exportFormat === 'pdf'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-200'
                }`}
              >
                <FileText className="w-5 h-5 mb-1 text-emerald-500" />
                <span>PDF Report</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onHapticFeedback) onHapticFeedback('tick');
                  setExportFormat('csv');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  exportFormat === 'csv'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mb-1 text-emerald-500" />
                <span>CSV Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onHapticFeedback) onHapticFeedback('tick');
                  setExportFormat('json');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                  exportFormat === 'json'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-gray-200'
                }`}
              >
                <Code className="w-5 h-5 mb-1 text-emerald-500" />
                <span>JSON Dump</span>
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Date Filter
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today Only' },
                { id: '7days', label: 'Past 7 Days' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (onHapticFeedback) onHapticFeedback('tick');
                    setDateFilter(opt.id);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    dateFilter === opt.id
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Count Preview */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
            <span>Matching Entries to Export:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {filteredLogsForExport.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={filteredLogsForExport.length === 0}
              onClick={handlePreviewAndActions}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold text-xs transition-all border border-teal-200/60 dark:border-teal-500/20 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Preview & Actions</span>
            </button>
            <button
              type="button"
              disabled={isExporting || filteredLogsForExport.length === 0}
              onClick={handleExport}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generating...' : `Download ${exportFormat.toUpperCase()}`}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Universal In-App Document Viewer & Action Modal */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />
    </AnimatePresence>
  );
}
