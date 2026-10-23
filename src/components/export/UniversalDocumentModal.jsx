import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  Share2,
  Download,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  FileText,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  createPdfBlob,
  createCsvBlob,
  createJsonBlob,
  directPrintPdf,
  shareDocument,
  downloadBlob,
  copyToClipboard,
  revokeBlobUrl,
} from '../../utils/documentHubService';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';

export default function UniversalDocumentModal({
  isOpen,
  onClose,
  documentData,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [activeBlobUrl, setActiveBlobUrl] = useState(null);
  const [activeBlob, setActiveBlob] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const containerRef = useRef(null);

  // Unpack document properties
  const docType = documentData?.type || 'pdf'; // 'pdf' | 'csv' | 'json'
  const title = documentData?.title || 'Document Preview';
  const subtitle = documentData?.subtitle || '';
  const filename = documentData?.filename || (docType === 'pdf' ? 'Document.pdf' : 'Data.csv');
  const rows = useMemo(() => documentData?.rows || [], [documentData?.rows]);
  const rawCsv = documentData?.csv || '';
  const rawJson = documentData?.json || null;

  // Prepare Blob and managed URL when documentData changes
  useEffect(() => {
    if (!isOpen || !documentData) return;

    let createdUrl = null;
    let createdBlob = null;

    try {
      if (documentData.blobUrl && documentData.blob) {
        setActiveBlobUrl(documentData.blobUrl);
        setActiveBlob(documentData.blob);
      } else if (docType === 'pdf') {
        if (documentData.doc) {
          const res = createPdfBlob(documentData.doc);
          createdUrl = res.blobUrl;
          createdBlob = res.blob;
          setActiveBlobUrl(createdUrl);
          setActiveBlob(createdBlob);
        } else if (documentData.blob) {
          createdUrl = URL.createObjectURL(documentData.blob);
          createdBlob = documentData.blob;
          setActiveBlobUrl(createdUrl);
          setActiveBlob(createdBlob);
        }
      } else if (docType === 'csv') {
        const csvContent = rawCsv || (rows.length > 0 ? Object.keys(rows[0]).join(',') + '\n' + rows.map(r => Object.values(r).join(',')).join('\n') : '');
        const res = createCsvBlob(csvContent);
        createdUrl = res.blobUrl;
        createdBlob = res.blob;
        setActiveBlobUrl(createdUrl);
        setActiveBlob(createdBlob);
      } else if (docType === 'json') {
        const res = createJsonBlob(rawJson || rows);
        createdUrl = res.blobUrl;
        createdBlob = res.blob;
        setActiveBlobUrl(createdUrl);
        setActiveBlob(createdBlob);
      }
    } catch (err) {
      console.error('Failed to prepare document blob for preview:', err);
    }

    return () => {
      // Clean up newly created blob URL
      if (createdUrl) {
        revokeBlobUrl(createdUrl);
      }
    };
  }, [isOpen, documentData, docType, rawCsv, rawJson, rows]);

  // Filter rows for CSV/Table preview
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((r) =>
      Object.values(r).some((val) => String(val || '').toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  // Headers for tabular preview
  const tableHeaders = useMemo(() => {
    if (rows && rows.length > 0) {
      return Object.keys(rows[0]);
    }
    return [];
  }, [rows]);

  if (!isOpen) return null;

  // Actions
  const handlePrint = async () => {
    feedback('tick');
    setIsPrinting(true);
    try {
      if (docType === 'pdf' && activeBlobUrl) {
        await directPrintPdf(activeBlobUrl);
      } else if (docType === 'csv' || docType === 'json') {
        window.print();
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShare = async () => {
    feedback('pop');
    setIsSharing(true);
    try {
      await shareDocument({
        blob: activeBlob,
        filename,
        title,
        text: `${title} • ${subtitle || 'Official ADSA Canteen Document'}`,
        mimeType: docType === 'pdf' ? 'application/pdf' : 'text/csv',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    feedback('success');
    downloadBlob({
      blob: activeBlob || activeBlobUrl,
      filename,
    });
  };

  const handleCopy = async () => {
    feedback('tick');
    let contentToCopy = '';
    if (docType === 'csv' && rawCsv) {
      contentToCopy = rawCsv;
    } else if (rows.length > 0) {
      const h = Object.keys(rows[0]).join('\t');
      const b = rows.map((r) => Object.values(r).join('\t')).join('\n');
      contentToCopy = `${h}\n${b}`;
    } else if (rawJson) {
      contentToCopy = JSON.stringify(rawJson, null, 2);
    } else {
      contentToCopy = `${title}\n${subtitle}\nFilename: ${filename}\nLink: ${window.location.href}`;
    }

    const success = await copyToClipboard(contentToCopy, t('copiedToClipboard', 'Copied to clipboard!'));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenNewTab = () => {
    feedback('tick');
    if (activeBlobUrl) {
      window.open(activeBlobUrl, '_blank');
    }
  };

  if (!isOpen || !documentData || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          data-lenis-prevent
          className={`relative w-full ${
            isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-5xl max-h-[92vh] rounded-3xl'
          } bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
                {docType === 'pdf' ? (
                  <FileText className="w-5 h-5 text-emerald-200" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-teal-200" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                    {title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 text-white border border-white/20">
                    {docType.toUpperCase()}
                  </span>
                </div>
                {subtitle && (
                  <p className="text-xs text-emerald-100/90 truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? t('exitFullscreen', 'Exit Fullscreen') : t('fullscreen', 'Fullscreen')}
                className="hidden sm:inline-flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                title={t('openInNewTab', 'Open in New Tab')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                title={t('close', 'Close')}
                className="p-2 rounded-xl bg-white/15 hover:bg-red-500/80 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-toolbar (Search / Zoom Controls) */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            {docType === 'pdf' ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {t('zoom', 'Zoom')}:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-white/10 rounded-xl p-0.5 border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 cursor-pointer"
                    title={t('zoomOut', 'Zoom Out')}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-[11px] font-mono font-bold text-gray-700 dark:text-gray-200">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 cursor-pointer"
                    title={t('zoomIn', 'Zoom In')}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md cursor-pointer"
                  >
                    {t('reset', 'Reset')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchRecords', 'Search records...')}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
                  {filteredRows.length} / {rows.length} {t('records', 'records')}
                </span>
              </div>
            )}

            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
              {filename}
            </div>
          </div>

          {/* Main Document Viewer Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#070c0b] p-2 sm:p-4 flex items-center justify-center min-h-[300px]">
            {docType === 'pdf' ? (
              activeBlobUrl ? (
                <div
                  className="w-full h-full min-h-[500px] flex items-center justify-center transition-transform duration-200 origin-top"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <iframe
                    src={`${activeBlobUrl}#toolbar=0&navpanes=0`}
                    title={title}
                    className="w-full h-full min-h-[500px] rounded-2xl bg-white shadow-xl border border-gray-200 dark:border-white/10"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">{t('generatingPreview', 'Rendering live document preview...')}</p>
                </div>
              )
            ) : docType === 'csv' || rows.length > 0 ? (
              <div className="w-full h-full min-h-[400px] bg-white dark:bg-[#0e1715] rounded-2xl border border-gray-200 dark:border-white/10 shadow-inner overflow-auto flex flex-col">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      {tableHeaders.map((header) => (
                        <th key={header} className="p-3 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-200 font-mono">
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                        >
                          <td className="p-2.5 text-center text-gray-400 font-sans text-[11px]">
                            {idx + 1}
                          </td>
                          {tableHeaders.map((h) => (
                            <td key={h} className="p-2.5 whitespace-nowrap">
                              {String(row[h] ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={tableHeaders.length + 1}
                          className="p-8 text-center text-gray-400 font-sans italic"
                        >
                          {searchQuery ? t('noMatchingRecords', 'No matching records found.') : t('noData', 'No records available to display.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="w-full h-full max-h-[500px] overflow-auto p-4 rounded-2xl bg-gray-900 text-emerald-400 font-mono text-xs shadow-inner">
                {rawJson ? JSON.stringify(rawJson, null, 2) : 'No data content.'}
              </pre>
            )}
          </div>

          {/* Action Hub Footer */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 bg-white dark:bg-[#0c1412] border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('readyToUse', 'Document ready')}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-gray-200/60 dark:border-white/5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied', 'Copied!') : t('copyData', 'Copy Data')}</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-teal-200/60 dark:border-teal-500/20"
              >
                <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{isPrinting ? t('printing', 'Printing...') : t('printDocument', 'Print Direct')}</span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-emerald-200/60 dark:border-emerald-500/20"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isSharing ? t('sharing', 'Sharing...') : t('shareDocument', 'Share')}</span>
              </button>

              {/* Download Button (Primary) */}
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('downloadFile', 'Download File')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
