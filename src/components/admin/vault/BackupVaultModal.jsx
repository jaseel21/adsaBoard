import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  HardDrive,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  Fingerprint,
  Info,
  Clock,
} from 'lucide-react';
import {
  BACKUP_COLLECTIONS,
  generateFullSystemBackup,
  subscribeToBackupCatalog,
  deleteBackupRecord,
  validateBackupFile,
  computeDryRunDiff,
  executeRestore,
  triggerFileDownload,
} from '../../../utils/backupRestoreService';
import { AuthContext } from '../../../store/AuthContext';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { dialog } from '../../../utils/dialog';

export default function BackupVaultModal({ isOpen, onClose }) {
  const { user, role } = useContext(AuthContext);

  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Restore & Diff Inspection State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedBackupData, setSelectedBackupData] = useState(null);
  const [diffReport, setDiffReport] = useState(null);
  const [computingDiff, setComputingDiff] = useState(false);
  const [selectedCollectionsToRestore, setSelectedCollectionsToRestore] = useState([]);
  const [restoring, setRestoring] = useState(false);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Subscribe to backup catalog
  useEffect(() => {
    if (!isOpen) return;
    setLoadingCatalog(true);
    const unsub = subscribeToBackupCatalog(
      (items) => {
        setCatalog(items);
        setLoadingCatalog(false);
      },
      () => setLoadingCatalog(false)
    );
    return () => unsub();
  }, [isOpen]);

  const actor = useMemo(() => ({
    uid: user?.uid || 'admin',
    displayName: user?.displayName || user?.email || 'Super Admin',
    email: user?.email || '',
    role: role || 'developer',
  }), [user, role]);

  if (!isOpen) return null;

  // Trigger Instant Snapshot
  const handleTriggerSnapshot = async () => {
    soundEngine.playPop();
    hapticEngine.mediumTick();
    setCreatingBackup(true);

    try {
      const result = await generateFullSystemBackup(actor, {
        download: true,
        triggerType: 'MANUAL_DISPATCH',
      });
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      await dialog.alert({
        title: 'Snapshot Created & Downloaded',
        message: `Database snapshot verified with SHA-256: ${result.checksum.slice(0, 16)}...`,
        tone: 'success',
      });
    } catch (err) {
      soundEngine.playCautionThud();
      await dialog.alert({
        title: 'Backup Failed',
        message: err.message || 'Could not export database snapshot.',
        tone: 'danger',
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  // Delete Backup Record from Catalog
  const handleDeleteBackup = async (backupId) => {
    const confirmed = await dialog.confirm({
      title: 'Delete Backup Catalog Entry?',
      message: 'This removes the catalog record and checksum from Firestore. Any downloaded JSON files remain unaffected.',
      confirmLabel: 'Delete Record',
      tone: 'danger',
    });
    if (!confirmed) return;

    soundEngine.playCautionThud();
    hapticEngine.mediumTick();
    try {
      await deleteBackupRecord(backupId, actor);
      soundEngine.playSoftChime();
    } catch (err) {
      console.warn('Error deleting backup:', err);
    }
  };

  // Handle Local File Upload for Restore
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    soundEngine.playPop();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      const validation = validateBackupFile(content);

      if (!validation.isValid) {
        soundEngine.playCautionThud();
        await dialog.alert({
          title: 'Invalid Backup File',
          message: validation.error,
          tone: 'danger',
        });
        return;
      }

      openInspection(validation.parsedData);
    };
    reader.readAsText(file);
  };

  // Open Dry-Run Inspection Modal
  const openInspection = async (backupData) => {
    setSelectedBackupData(backupData);
    setSelectedCollectionsToRestore(Object.keys(backupData.collections || {}));
    setInspectModalOpen(true);
    setComputingDiff(true);

    try {
      const diff = await computeDryRunDiff(backupData);
      setDiffReport(diff);
    } catch (err) {
      console.warn('Error computing diff:', err);
    } finally {
      setComputingDiff(false);
    }
  };

  // Execute Restore Operation
  const handleExecuteRestore = async () => {
    if (selectedCollectionsToRestore.length === 0) {
      await dialog.alert({
        title: 'No Collections Selected',
        message: 'Please check at least one collection to restore.',
        tone: 'warning',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'CRITICAL: Execute Database Rehydration?',
      message: `You are about to restore: ${selectedCollectionsToRestore.join(', ')}. Existing documents with matching IDs will be merged or updated.`,
      confirmLabel: 'Execute Live Restore',
      tone: 'danger',
    });
    if (!confirmed) return;

    soundEngine.playPop();
    hapticEngine.mediumTick();
    setRestoring(true);

    try {
      const res = await executeRestore(selectedBackupData, selectedCollectionsToRestore, actor);
      if (res.success) {
        soundEngine.playSoftChime();
        hapticEngine.successPulse();
        await dialog.alert({
          title: 'Restore Completed Successfully',
          message: `Restored collections: ${JSON.stringify(res.restoredCounts, null, 2)}`,
          tone: 'success',
        });
        setInspectModalOpen(false);
      } else {
        soundEngine.playCautionThud();
        await dialog.alert({
          title: 'Restore Completed with Errors',
          message: res.errors.join('\n'),
          tone: 'warning',
        });
      }
    } catch (err) {
      soundEngine.playCautionThud();
      await dialog.alert({
        title: 'Restore Failed',
        message: err.message,
        tone: 'danger',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-4xl bg-white dark:bg-[#0c1310] border border-gray-200 dark:border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-md flex items-center justify-center text-cyan-300 border border-white/10 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                Cloud Storage & Backup Vault
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 tracking-wider">
                  Sovereign Archive
                </span>
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Point-in-Time Database Snapshots, SHA-256 Checksums & Rehydration Hub
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Action Toolbar */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={creatingBackup}
              onClick={handleTriggerSnapshot}
              className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {creatingBackup ? 'Synthesizing Snapshot...' : 'Create Instant Snapshot'}
            </button>

            <label className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95">
              <Upload className="w-4 h-4 text-cyan-500" />
              Upload Backup File
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <HardDrive className="w-4 h-4 text-teal-500" />
            <span>Catalog Entries: <strong className="text-gray-900 dark:text-white font-mono">{catalog.length}</strong></span>
          </div>
        </div>

        {/* Catalog List */}
        <div className="p-6 space-y-3 max-h-[55vh] overflow-y-auto">
          {loadingCatalog ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-xs">Inspecting backup registry...</span>
            </div>
          ) : catalog.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
              <Database className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No snapshot records found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Click &ldquo;Create Instant Snapshot&rdquo; to generate your first full institutional database archive.
              </p>
            </div>
          ) : (
            catalog.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black font-mono text-gray-900 dark:text-white">
                      {item.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {item.type || 'SNAPSHOT'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.createdAtISO ? new Date(item.createdAtISO).toLocaleString('en-IN') : '--'}
                    </span>
                  </div>

                  {/* Collections Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(item.collectionsDumped || []).map((col) => (
                      <span
                        key={col.collectionId}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5"
                      >
                        {col.collectionId}: <strong className="text-emerald-500">{col.documentCount}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Fingerprint */}
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-500" />
                    <span>SHA-256: {item.checksum?.slice(0, 20)}...</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteBackup(item.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete record from registry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/70 dark:bg-black/30 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-500" />
            Automated backups run daily at 02:00 IST via Cloud Scheduler.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white transition-all"
          >
            Close Vault
          </button>
        </div>
      </motion.div>

      {/* INSPECT & RESTORE MODAL */}
      <AnimatePresence>
        {inspectModalOpen && selectedBackupData && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
            onClick={() => setInspectModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      Inspect & Restore Snapshot
                    </h3>
                    <p className="text-xs text-gray-400">
                      Dry-Run Schema Analysis & Selective Collection Rehydration
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Diff Summary */}
              {computingDiff ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Comparing snapshot against live Firestore...
                </div>
              ) : diffReport ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                      <span className="text-gray-400">Documents in Backup:</span>
                      <p className="font-mono font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                        {diffReport.totalNewDocs + diffReport.totalUpdatedDocs}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                      <span className="text-gray-400">Target Match in Live:</span>
                      <p className="font-mono font-bold text-sm text-amber-500 mt-0.5">
                        {diffReport.totalUpdatedDocs} existing (will merge)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                      Select Collections to Restore:
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {Object.keys(selectedBackupData.collections || {}).map((colName) => {
                        const checked = selectedCollectionsToRestore.includes(colName);
                        const count = (selectedBackupData.collections[colName] || []).length;
                        return (
                          <label
                            key={colName}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                              checked
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold'
                                : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCollectionsToRestore([...selectedCollectionsToRestore, colName]);
                                  } else {
                                    setSelectedCollectionsToRestore(selectedCollectionsToRestore.filter((c) => c !== colName));
                                  }
                                }}
                                className="accent-amber-500"
                              />
                              <span>{colName}</span>
                            </div>
                            <span className="font-mono text-[11px] opacity-80">{count} docs</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={restoring || computingDiff}
                  onClick={handleExecuteRestore}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {restoring ? 'Rehydrating Firestore...' : 'Execute Restore'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
