import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';
import { validateBackupFile, computeDryRunDiff, executeRestore } from '../../../utils/backupRestoreService';
import { dialog } from '../../../utils/dialog';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';

export default function DatabaseRestoreModal({ isOpen, onClose, actor }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const [step, setStep] = useState('upload'); // 'upload' | 'diff' | 'executing' | 'done'
  const [fileData, setFileData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [diffReport, setDiffReport] = useState(null);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [isComputingDiff, setIsComputingDiff] = useState(false);
  const [restoreResults, setRestoreResults] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    feedback('tick');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      const validation = validateBackupFile(content);
      if (!validation.isValid) {
        feedback('warning');
        dialog.alert({
          type: 'error',
          title: 'Invalid Backup File',
          message: validation.error || 'The uploaded file does not conform to the ADSA JSON schema.',
        });
        return;
      }

      setValidationResult(validation);
      setFileData(validation.parsedData);
      setSelectedCollections(validation.collections);

      // Compute dry-run diff
      setIsComputingDiff(true);
      setStep('diff');
      try {
        const diff = await computeDryRunDiff(validation.parsedData);
        setDiffReport(diff);
      } catch (diffErr) {
        console.error('Error computing dry-run diff:', diffErr);
      } finally {
        setIsComputingDiff(false);
      }
    };
    reader.readAsText(file);
  };

  const toggleCollectionSelection = (col) => {
    feedback('tick');
    setSelectedCollections((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleExecuteRestore = async () => {
    if (selectedCollections.length === 0) {
      dialog.alert({
        type: 'warning',
        title: 'No Collections Selected',
        message: 'Please choose at least one collection to restore.',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'Confirm Database Restore?',
      message: `You are about to restore ${selectedCollections.length} collections into live Firestore. This will merge backup records. Ensure this operation is intended.`,
      confirmText: 'Execute Restore',
      cancelText: 'Cancel',
      confirmColor: 'amber',
      icon: 'warning',
    });

    if (confirmed) {
      feedback('pop');
      setStep('executing');
      try {
        const results = await executeRestore(fileData, selectedCollections, actor);
        setRestoreResults(results);
        setStep('done');
        feedback('success');
      } catch (err) {
        console.error('Restore failure:', err);
        dialog.alert({
          type: 'error',
          title: 'Restore Failed',
          message: err.message || 'An unexpected error occurred during database restoration.',
        });
        setStep('diff');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {language === 'ml' ? 'ഡാറ്റാബേസ് സുരക്ഷിത പുനഃസ്ഥാപനം' : 'Safe Database Restore & Rollback'}
              </h3>
              <span className="text-[11px] text-gray-400 font-medium">
                Dry-run diff verification before live Firestore commit
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-3xl p-8 text-center space-y-4 hover:border-emerald-500 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white block">
                  Select ADSA JSON Backup File
                </span>
                <span className="text-xs text-gray-400 mt-1 block">
                  Supports standard snapshot packages generated from the Backup panel
                </span>
              </div>
              <label className="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95">
                Browse JSON File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* STEP 2: DIFF PREVIEW */}
          {step === 'diff' && (
            <div className="space-y-4">
              {isComputingDiff ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mx-auto" />
                  <span className="text-xs font-semibold text-gray-500">
                    Comparing snapshot with live Firestore database...
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Dry-Run Diff Completed</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Select which collections you want to commit. Merging will update existing document keys without erasing unreferenced fields.
                    </p>
                  </div>

                  {/* Collections List */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block">
                      Target Collections ({selectedCollections.length}/{validationResult?.collections?.length || 0} selected)
                    </span>
                    {validationResult?.collections?.map((col) => {
                      const isSelected = selectedCollections.includes(col);
                      const report = diffReport?.collections?.[col];
                      return (
                        <div
                          key={col}
                          onClick={() => toggleCollectionSelection(col)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                              : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled via parent onClick
                              className="accent-emerald-500 rounded"
                            />
                            <div>
                              <span className="text-xs font-extrabold capitalize block">{col}</span>
                              <span className="text-[10px] text-gray-400">
                                {validationResult.summary[col]} documents in snapshot
                              </span>
                            </div>
                          </div>

                          {report && (
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                +{report.newDocsCount} new
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                                ~{report.existingDocsCount} merge
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: EXECUTING */}
          {step === 'executing' && (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <span className="text-sm font-extrabold text-gray-900 dark:text-white block">
                Restoring Collections...
              </span>
              <span className="text-xs text-gray-400 block">
                Committing batched operations to Firestore with audit verification.
              </span>
            </div>
          )}

          {/* STEP 4: DONE */}
          {step === 'done' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Restoration Successful
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Selected collections have been updated in live Firestore.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-xs text-left font-mono space-y-1">
                {restoreResults &&
                  Object.keys(restoreResults.restoredCounts).map((col) => (
                    <div key={col} className="flex justify-between">
                      <span className="text-gray-400">{col}:</span>
                      <span className="font-bold text-emerald-500">
                        {restoreResults.restoredCounts[col]} docs restored
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
          {step === 'diff' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isComputingDiff || selectedCollections.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Commit Restore</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'done' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all"
            >
              Done & Return
            </button>
          )}

          {step === 'upload' && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
