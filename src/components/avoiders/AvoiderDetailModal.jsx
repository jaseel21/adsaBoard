import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  ShieldCheck,
  Phone,
  DoorClosed,
  Copy,
  Check,
  UtensilsCrossed,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getCategoryIcon } from './dietaryIcons';

export default function AvoiderDetailModal({
  isOpen,
  onClose,
  student,
  preferences = [],
  isAdmin = false,
  onNavigateToManage,
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const [copiedToken, setCopiedToken] = React.useState(false);
  const [copiedAll, setCopiedAll] = React.useState(false);

  if (!isOpen || !student) return null;

  const stNameEn = student.nameEn || student.name || `Token #${student.tokenNo}`;
  const stNameMl = student.nameMl || '';
  const tokenNo = student.tokenNo;
  const batch = student.batch || 'General';
  const room = student.room || student.roomNo || '-';
  const phone = student.phone || student.mobile || '';

  // Calculate avoided items
  const avoidedPrefs = preferences.filter(
    (p) => student.obj2 && student.obj2[p.id] === false
  );
  const hasAvoidance = avoidedPrefs.length > 0;

  const handleCopyToken = () => {
    feedback('tick');
    navigator.clipboard.writeText(`#${tokenNo}`);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1800);
  };

  const handleCopySummary = () => {
    feedback('tick');
    const avoidedStr = hasAvoidance
      ? avoidedPrefs.map((p) => p.labelEn).join(', ')
      : 'None (Standard Full Diet)';
    const text = `ADSA Mess • Token #${tokenNo} (${stNameEn}) | Batch: ${batch} | Avoids: ${avoidedStr}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  return (
    <AnimatePresence>
      <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            feedback('tick');
            onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#121c19] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 overscroll-contain"
        >
          {/* Header Banner */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-500/10 via-transparent to-rose-500/10 border-b border-gray-200/80 dark:border-white/10 relative">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              title={t('close', 'Close')}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              {/* Token Number Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex flex-col items-center justify-center font-mono shadow-md shadow-emerald-500/20 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Token</span>
                <span className="text-xl font-extrabold leading-none">#{tokenNo}</span>
              </div>

              {/* Student Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                    {stNameEn}
                  </h3>
                  {student.block && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      Blocked
                    </span>
                  )}
                </div>
                {stNameMl && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stNameMl}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                    <Layers className="w-3 h-3 text-emerald-500" />
                    {batch}
                  </span>
                  {room !== '-' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 text-xs font-medium">
                      <DoorClosed className="w-3 h-3 text-gray-400" />
                      {room}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[65vh] overflow-y-auto">
            {/* Dietary Status Overview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('dietaryMatrix', 'Dietary Restrictions Profile')}</span>
                </h4>
                <span className="text-[11px] font-semibold text-rose-500">
                  {avoidedPrefs.length} {t('itemsAvoided', 'excluded')}
                </span>
              </div>

              {/* Grid of All Available Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {preferences.map((p) => {
                  const isAvoided = student.obj2 && student.obj2[p.id] === false;
                  const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : (p.labelEn || p.name);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        isAvoided
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                          : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isAvoided
                              ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {getCategoryIcon(p.icon, 'w-3.5 h-3.5')}
                        </div>
                        <span className="text-xs font-bold truncate">{prefLabel}</span>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isAvoided
                            ? 'bg-rose-500 text-white'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {isAvoided ? t('avoids', 'AVOID') : t('eats', 'EATS')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact Details (if available) */}
            {phone && (
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-mono font-medium">{phone}</span>
                </div>
                <a
                  href={`tel:${phone}`}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Call
                </a>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-gray-50/80 dark:bg-white/5 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyToken}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                title="Copy Token Number"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Copied' : `#${tokenNo}`}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                title="Copy Student Summary"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Summary Copied' : 'Copy Full'}</span>
              </button>
            </div>

            {isAdmin && onNavigateToManage && (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  onNavigateToManage(student);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
              >
                <span>Manage</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
