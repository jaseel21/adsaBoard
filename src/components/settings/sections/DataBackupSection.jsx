import React, { useState } from 'react';
import { Database, Download, Upload, FileSpreadsheet, ShieldAlert, Sparkles, Check, FileText } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import { generateFullSystemBackup, exportStudentPersonalDossier } from '../../../utils/backupRestoreService';
import DatabaseRestoreModal from '../modals/DatabaseRestoreModal';

export default function DataBackupSection({
  user,
  role,
  isAdmin,
  stdata,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const [isExporting, setIsExporting] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  const isStudent = Boolean(stdata?.tokenNo);

  const handleFullBackup = async () => {
    feedback('tick');
    setIsExporting(true);
    try {
      await generateFullSystemBackup({
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        role,
      });
      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'ബാക്കപ്പ് പൂർത്തിയായി' : 'Backup Generated',
        language === 'ml' ? 'സിസ്റ്റം ഡാറ്റാബേസ് ഫയൽ ഡൗൺലോഡ് ചെയ്തു.' : 'Master system JSON backup has been successfully downloaded.'
      );
    } catch (err) {
      console.error('Backup failure:', err);
      feedback('warning');
      dialog.toast.error('Backup Failed', 'Could not export database snapshot.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStudentDossierExport = async () => {
    if (!stdata) return;
    feedback('tick');
    try {
      await exportStudentPersonalDossier(stdata);
      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'ഡാറ്റ ഡൗൺലോഡ് ചെയ്തു' : 'Dossier Downloaded',
        language === 'ml' ? 'നിങ്ങളുടെ ടോക്കൺ വിവരങ്ങളും ഭക്ഷണ ചരിത്രവും ഡൗൺലോഡ് ആയി.' : 'Personal dining transcript downloaded as JSON.'
      );
    } catch (err) {
      console.error('Failed to export student dossier:', err);
      feedback('warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'ബാക്കപ്പ് & ഡാറ്റാ റിക്കവറി' : 'Backup, Portability & Data Recovery'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'സിസ്റ്റം ഡാറ്റാബേസ് ബാക്കപ്പുകളും വ്യക്തിഗത ഭക്ഷണ രേഖകളും ഡൗൺലോഡ് ചെയ്യുക'
            : 'Export immutable database snapshots, download personal dining records, or safely rollback state'}
        </p>
      </div>

      {/* 1. STUDENT DOSSIER EXPORT */}
      {isStudent && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 border border-emerald-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white">
                {language === 'ml' ? 'എന്റെ ഭക്ഷണ രേഖകൾ ഡൗൺലോഡ് ചെയ്യുക' : 'Download My Dining Record'}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'ml'
                  ? 'ടോക്കൺ റുട്ടീൻ, തീയതി മാറ്റങ്ങൾ, ഡയറ്ററി ഹിസ്റ്ററി എന്നിവ അടങ്ങിയ വ്യക്തിഗത ഫയൽ'
                  : 'Export your personalized routine, date-specific leave requests, and dietary records'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStudentDossierExport}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ml' ? 'ഫയൽ ഡൗൺലോഡ്' : 'Export JSON Record'}</span>
          </button>
        </div>
      )}

      {/* 2. ADMIN FULL SYSTEM BACKUP */}
      {isAdmin ? (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                    {language === 'ml' ? 'മാസ്റ്റർ ഡാറ്റാബേസ് സ്നാപ്പ്ഷോട്ട് (JSON)' : 'Master Database Snapshot'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
                  {language === 'ml'
                    ? 'വിദ്യാർത്ഥികൾ, മെനു, ഡയറ്ററി, ക്രമീകരണങ്ങൾ, സ്റ്റാഫ് റോളുകൾ എന്നിവയുടെ സമ്പൂർണ്ണ JSON ബാക്കപ്പ് എടുക്കുക'
                    : 'Download a complete JSON snapshot containing all Firestore collections: students, weekly menus, dietary rules, staff users, and canteen settings'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFullBackup}
                disabled={isExporting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting
                    ? language === 'ml' ? 'തയ്യാറാക്കുന്നു...' : 'Exporting...'
                    : language === 'ml' ? 'ബാക്കപ്പ് ഡൗൺലോഡ്' : 'Generate Full Backup'}
                </span>
              </button>
            </div>

            {/* Restore Engine Card */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                  {language === 'ml' ? 'സുരക്ഷിത പുനഃസ്ഥാപനം & റോൾബാക്ക്' : 'Disaster Recovery & Safe Restore'}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  {language === 'ml'
                    ? 'മുമ്പ് സേവ് ചെയ്ത JSON ബാക്കപ്പിൽ നിന്ന് ഡാറ്റ താരതമ്യം ചെയ്ത് പുനഃസ്ഥാപിക്കുക'
                    : 'Import an existing JSON backup with dry-run diff inspection before applying changes'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setRestoreModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>{language === 'ml' ? 'റിക്കവറി വിസാർഡ് തുറക്കുക' : 'Restore from Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        !isStudent && (
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 text-center py-8">
            <Database className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
            <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block">
              {language === 'ml' ? 'ബാക്കപ്പ് ആക്‌സസ്സ്' : 'Protected Data Access'}
            </span>
            <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
              {language === 'ml'
                ? 'വ്യക്തിഗത ഭക്ഷണ രേഖകൾ ഡൗൺലോഡ് ചെയ്യാൻ വിദ്യാർത്ഥി ലോഗിൻ ചെയ്യുക'
                : 'Sign in with your student token to download your personal meal dossier, or committee credentials for full database snapshots.'}
            </p>
          </div>
        )
      )}

      {/* Restore Wizard Modal */}
      {isAdmin && (
        <DatabaseRestoreModal
          isOpen={restoreModalOpen}
          onClose={() => setRestoreModalOpen(false)}
          actor={{
            uid: user?.uid,
            email: user?.email,
            displayName: user?.displayName,
            role,
          }}
        />
      )}
    </div>
  );
}
