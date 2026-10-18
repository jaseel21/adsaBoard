import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Check,
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

export default function CsvManagerModal({
  isOpen,
  onClose,
  allStudents = [],
  onImportComplete
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationIssues, setValidationIssues] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [conflictMode, setConflictMode] = useState('update'); // 'update' | 'skip'

  if (!isOpen) return null;

  const existingTokensSet = new Set(allStudents.map(s => Number(s.tokenNo)));

  // File drop / select handler
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      dialog.alert({ type: 'error', title: 'Invalid File', message: 'Please select a valid .csv file' });
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        setParsing(false);
        const rows = results.data;
        const issues = [];
        const validated = [];

        rows.forEach((row, idx) => {
          // Normalize column names
          const malayalamRegex = /[\u0D00-\u0D7F]/;
          const tokenNo = parseInt(row.tokenno || row.token || row['token no'] || row['token_no'], 10);
          let rawNameEn = (row.nameen || row.name || row['english name'] || row['name_en'] || '').trim();
          let rawNameMl = (row.nameml || row['malayalam name'] || row['name_ml'] || '').trim();
          
          if (rawNameEn && malayalamRegex.test(rawNameEn) && !rawNameMl) {
            rawNameMl = rawNameEn;
            rawNameEn = '';
          }
          const nameEn = rawNameEn;
          const nameMl = rawNameMl;
          const uname = (row.uname || row.username || (!isNaN(tokenNo) ? String(tokenNo) : '')).trim();
          const password = String(row.password || row.pass || 'pass123').trim();
          const batch = (row.batch || row.class || row.year || 'General').trim();
          const roomNo = String(row.roomno || row.room || '').trim();
          const phone = String(row.phone || row.mobile || '').trim();

          const isTokenMissing = isNaN(tokenNo) || tokenNo <= 0;
          const isNameMissing = !nameEn;
          const isExisting = existingTokensSet.has(tokenNo);

          if (isTokenMissing) {
            issues.push({ rowIdx: idx + 1, message: 'Missing or invalid token number' });
          } else if (isNameMissing) {
            issues.push({ rowIdx: idx + 1, message: `Token #${tokenNo} is missing student name` });
          }

          validated.push({
            tokenNo,
            nameEn,
            nameMl,
            uname,
            password,
            batch,
            roomNo,
            phone,
            isExisting,
            isValid: !isTokenMissing && !isNameMissing
          });
        });

        setParsedRows(validated);
        setValidationIssues(issues);
        feedback('success');
      },
      error: (err) => {
        setParsing(false);
        dialog.alert({ type: 'error', title: 'CSV Error', message: err.message });
      }
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Commit valid parsed rows to Firestore
  const handleCommitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      dialog.alert({ type: 'warning', title: 'No Valid Records', message: 'No valid student rows to import.' });
      return;
    }

    setUploading(true);
    feedback('tick');

    try {
      const db = firebase.firestore();
      const existingMap = new Map();
      allStudents.forEach(s => existingMap.set(Number(s.tokenNo), s));

      // Filter rows according to conflictMode
      const rowsToProcess = validRows.filter(r => {
        if (conflictMode === 'skip' && r.isExisting) return false;
        return true;
      });

      // Split into chunks of 400 writes
      const chunkSize = 400;
      for (let i = 0; i < rowsToProcess.length; i += chunkSize) {
        const chunk = rowsToProcess.slice(i, i + chunkSize);
        const batch = db.batch();

        chunk.forEach(row => {
          const existing = existingMap.get(row.tokenNo);
          const studentRef = existing ? db.collection('students').doc(existing.id) : db.collection('students').doc();

          const finalUname = row.uname || (existing ? (existing.username || existing.uname) : String(row.tokenNo));
          const payload = {
            tokenNo: row.tokenNo,
            nameEn: row.nameEn,
            nameMl: row.nameMl || (existing ? existing.nameMl || '' : ''),
            name: row.nameEn,
            uname: finalUname,
            username: finalUname,
            password: row.password || (existing ? existing.password : 'pass123'),
            batch: row.batch || (existing ? existing.batch : 'General'),
            roomNo: row.roomNo || (existing ? existing.roomNo || '' : ''),
            phone: row.phone || (existing ? existing.phone || '' : ''),
            block: existing ? Boolean(existing.block) : false,
            blockReason: existing ? existing.blockReason || '' : '',
            obj: existing?.obj || {
              lunch: { su: true, mo: true, tu: true, we: true, th: true, fr: true, sa: true },
              breakfast: { su: true, mo: true, tu: true, we: true, th: true, fr: true, sa: true },
            },
            obj2: existing?.obj2 || { beef: true, chicken: true, fish: true, mutton: true },
            updatedAt: new Date().toISOString()
          };

          if (!existing) {
            payload.createdAt = new Date().toISOString();
          }

          batch.set(studentRef, payload, { merge: true });
        });

        await batch.commit();
      }

      dialog.toast.success(
        'Import Successful',
        `Processed ${rowsToProcess.length} students into the canteen system.`
      );
      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      dialog.alert({ type: 'error', title: 'Import Failed', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Sample CSV generator with Malayalam text (UTF-8 BOM)
  const handleDownloadSample = () => {
    feedback('tick');
    const sampleHeaders = ['tokenNo', 'nameEn', 'nameMl', 'uname', 'password', 'batch', 'roomNo', 'phone'];
    const sampleRows = [
      ['1', 'Muhammed Rashad', 'മുഹമ്മദ് റഷാദ്', 'rashad_1', 'pass123', 'Batch 2024', 'B-10', '9847000001'],
      ['2', 'Ahmed Faris', 'അഹ്മദ് ഫാരിസ്', 'faris_2', 'pass456', 'Batch 2024', 'A-04', '9847000002'],
      ['3', 'Ali Shaheen', 'അലി ഷാഹീൻ', 'shaheen_3', 'pass789', 'Senior Dars', 'C-02', '9847000003'],
    ];

    const csvText = '\uFEFF' + [sampleHeaders.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'adsa_students_template_bilingual.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export current students to CSV
  const handleExportCsv = () => {
    feedback('tick');
    const headers = ['tokenNo', 'nameEn', 'nameMl', 'uname', 'password', 'batch', 'roomNo', 'phone', 'status'];
    const rows = allStudents.map(s => [
      s.tokenNo,
      `"${(s.nameEn || s.name || '').replace(/"/g, '""')}"`,
      `"${(s.nameMl || '').replace(/"/g, '""')}"`,
      `"${(s.username || s.uname || String(s.tokenNo || '')).replace(/"/g, '""')}"`,
      `"${(s.password || '').replace(/"/g, '""')}"`,
      `"${(s.batch || 'General').replace(/"/g, '""')}"`,
      `"${(s.roomNo || '').replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      s.block ? 'Blocked' : 'Active'
    ]);

    const csvText = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ADSA_Student_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export current students to PDF
  const handleExportPdf = () => {
    feedback('tick');
    const doc = new jsPDF('p', 'mm', 'a4');

    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text('Alathurpadi Dars - Students Directory Roster', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} • Total Students: ${allStudents.length}`, 14, 23);

    const sorted = [...allStudents].sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));

    const columns = [
      { header: 'Token', dataKey: 'token' },
      { header: 'English Name', dataKey: 'name' },
      { header: 'Batch / Year', dataKey: 'batch' },
      { header: 'Room', dataKey: 'room' },
      { header: 'Status', dataKey: 'status' },
    ];

    const data = sorted.map(s => ({
      token: s.tokenNo,
      name: s.nameEn || s.name || '-',
      batch: s.batch || 'General',
      room: s.roomNo || '-',
      status: s.block ? 'BLOCKED' : 'ACTIVE',
    }));

    doc.autoTable({
      columns,
      body: data,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 248] },
    });

    doc.save(`ADSA_Student_Roster_${new Date().toISOString().slice(0, 10)}.pdf`);
    feedback('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] pb-safe"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                CSV & Data Manager
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Bulk import, bilingual roster export & sample templates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] px-3 sm:px-6 overflow-x-auto scrollbar-none whitespace-nowrap touch-pan-x">
          <button
            onClick={() => { feedback('tick'); setActiveTab('import'); }}
            className={`py-2.5 sm:py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => { feedback('tick'); setActiveTab('export'); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Roster (CSV / PDF)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* Template Download Prompt */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Need the formatted template?
                  </h4>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                    Includes sample Malayalam & English columns encoded in UTF-8.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-gray-300 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 bg-gray-50/50 dark:bg-white/[0.02]'
                }`}
                onClick={() => document.getElementById('csvFileInput')?.click()}
              >
                <input
                  id="csvFileInput"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {file ? file.name : 'Click to upload or drag & drop CSV file here'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports standard CSV with UTF-8 character encoding
                </p>
              </div>

              {/* Validation Preview Diff */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Parsed {parsedRows.length} rows ({parsedRows.filter(r => r.isValid).length} valid, {validationIssues.length} warnings)
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-gray-500">Conflict handling:</label>
                      <select
                        value={conflictMode}
                        onChange={(e) => setConflictMode(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 border-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="update">Update existing tokens</option>
                        <option value="skip">Skip existing tokens</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-white/5 text-gray-500 uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Token</th>
                          <th className="px-3 py-2">English Name</th>
                          <th className="px-3 py-2">Malayalam Name</th>
                          <th className="px-3 py-2">Batch</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {parsedRows.slice(0, 30).map((row, idx) => (
                          <tr key={idx} className={!row.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                            <td className="px-3 py-2 font-bold font-mono">#{row.tokenNo}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{row.nameEn || '-'}</td>
                            <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400 font-medium">{row.nameMl || '-'}</td>
                            <td className="px-3 py-2 text-gray-500">{row.batch}</td>
                            <td className="px-3 py-2">
                              {row.isExisting ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                                  Existing
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                                  New
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={uploading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{uploading ? 'Processing into database...' : `Commit Import (${parsedRows.filter(r => r.isValid).length} Students)`}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* EXPORT TAB */
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Download the complete roster of registered students including their token numbers, bilingual names, credentials, batches, and current active/blocked statuses.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-gray-200/80 dark:border-white/10 hover:border-emerald-400 text-left transition-all space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Export to CSV (Excel)</h4>
                    <p className="text-xs text-gray-500">Full dataset with UTF-8 Malayalam text support</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-gray-200/80 dark:border-white/10 hover:border-emerald-400 text-left transition-all space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Export Printable PDF</h4>
                    <p className="text-xs text-gray-500">Clean A4 document ready for canteen notice board</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
