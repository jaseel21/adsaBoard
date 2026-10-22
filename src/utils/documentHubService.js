/**
 * Universal Document Hub Service
 * Provides centralized in-memory document preparation, silent iframe direct printing,
 * Web Share API integration (with native files and social fallbacks), direct downloads,
 * and tabular/CSV clipboard copying.
 */

import { dialog } from './dialog';

/**
 * Creates a Blob and managed object URL from a jsPDF instance.
 * @param {import('jspdf').jsPDF} doc
 * @returns {{ blob: Blob, blobUrl: string }}
 */
export function createPdfBlob(doc) {
  if (!doc) throw new Error('Missing jsPDF document instance');
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  return { blob, blobUrl };
}

/**
 * Creates a Blob and managed object URL from a CSV string with UTF-8 BOM.
 * @param {string} csvText
 * @returns {{ blob: Blob, blobUrl: string }}
 */
export function createCsvBlob(csvText) {
  const content = csvText.startsWith('\uFEFF') ? csvText : '\uFEFF' + csvText;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  return { blob, blobUrl };
}

/**
 * Creates a Blob and managed object URL from a JSON object/string.
 * @param {object|string} jsonData
 * @returns {{ blob: Blob, blobUrl: string }}
 */
export function createJsonBlob(jsonData) {
  const text = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  return { blob, blobUrl };
}

/**
 * Safely revokes an object URL to prevent memory leaks.
 * @param {string} blobUrl
 */
export function revokeBlobUrl(blobUrl) {
  if (blobUrl && typeof blobUrl === 'string' && blobUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch (_) {}
  }
}

/**
 * Direct silent printing for PDF files via a hidden sandboxed iframe.
 * Avoids downloading the file or leaving the current screen.
 * @param {string} blobUrl
 * @returns {Promise<boolean>}
 */
export function directPrintPdf(blobUrl) {
  return new Promise((resolve) => {
    try {
      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.src = blobUrl;

      const cleanup = () => {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 15000);
      };

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanup();
          resolve(true);
        } catch (printErr) {
          console.warn('Iframe print failed, falling back to window.open:', printErr);
          window.open(blobUrl, '_blank');
          cleanup();
          resolve(false);
        }
      };

      iframe.onerror = () => {
        window.open(blobUrl, '_blank');
        cleanup();
        resolve(false);
      };

      document.body.appendChild(iframe);
    } catch (e) {
      console.error('Direct print initialization error:', e);
      window.open(blobUrl, '_blank');
      resolve(false);
    }
  });
}

/**
 * Shares a document using the Web Share API (native OS share sheet with file attached).
 * Falls back to WhatsApp web link, mailto, or clipboard summary when native file sharing is unavailable.
 * @param {Object} options
 * @param {Blob} options.blob - Document blob
 * @param {string} options.filename - Name of the file (e.g. Manifest.pdf)
 * @param {string} options.title - Document title
 * @param {string} [options.text] - Accompanying message or summary
 * @param {string} [options.mimeType] - MIME type (e.g. 'application/pdf', 'text/csv')
 * @returns {Promise<boolean>}
 */
export async function shareDocument({ blob, filename, title, text, mimeType = 'application/pdf' }) {
  const shareTitle = title || 'ADSA Canteen Document';
  const shareText = text || `${shareTitle} • Generated from Alathurpadi Dars T-Board`;

  // 1. Check native Web Share API with File support
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && blob) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText,
        });
        dialog.toast.success('Shared Successfully', 'Document sent via system share sheet.');
        return true;
      }
    } catch (err) {
      // AbortError is raised if user cancels the share dialog - do not treat as error
      if (err.name === 'AbortError') {
        return false;
      }
      console.warn('Native file share failed, trying fallback:', err);
    }
  }

  // 2. Secondary check: Native share without file (links / text)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `${shareText}\n\nDocument: ${filename}\nLink: ${window.location.href}`,
        url: window.location.href,
      });
      dialog.toast.success('Shared', 'Details shared successfully.');
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
    }
  }

  // 3. Desktop / Unsupported browser fallback: WhatsApp Web direct trigger
  try {
    const waText = encodeURIComponent(`*${shareTitle}*\n${shareText}\n\nAccess via ADSA Board: ${window.location.origin}`);
    const waUrl = `https://api.whatsapp.com/send?text=${waText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    dialog.toast.info('Sharing via WhatsApp', 'Opening WhatsApp dispatch...');
    return true;
  } catch (err) {
    console.error('WhatsApp fallback error:', err);
    // 4. Ultimate fallback: Copy summary to clipboard
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${window.location.href}`);
      dialog.toast.success('Copied to Clipboard', 'Document summary copied to clipboard.');
      return true;
    } catch (_) {
      return false;
    }
  }
}

/**
 * Triggers a direct file download to disk.
 * @param {Object} options
 * @param {Blob|string} options.blob - Blob or string content
 * @param {string} options.filename - File download name
 */
export function downloadBlob({ blob, filename }) {
  if (!blob) return;
  const url = typeof blob === 'string' && blob.startsWith('blob:') ? blob : URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blob !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Copies text (e.g. CSV content or summary) to system clipboard.
 * @param {string} content
 * @param {string} [successMessage]
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(content, successMessage = 'Copied to clipboard!') {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      dialog.toast.success('Copied', successMessage);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    dialog.toast.success('Copied', successMessage);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    dialog.toast.error('Copy Failed', 'Unable to copy to clipboard.');
    return false;
  }
}
