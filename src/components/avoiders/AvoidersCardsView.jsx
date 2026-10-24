import React from 'react';
import { motion } from 'framer-motion';
import { Layers, DoorClosed, Copy, Check, UtensilsCrossed, ExternalLink, Grid3X3 } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getCategoryIcon } from './dietaryIcons';

export default function AvoidersCardsView({
  students = [],
  preferences = [],
  onSelectStudent,
  searchQuery = '',
  sectionChunkSize = 25,
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const [copiedTokenId, setCopiedTokenId] = React.useState(null);

  const handleCopyToken = (e, tokenNo) => {
    e.stopPropagation();
    feedback('tick');
    navigator.clipboard.writeText(`#${tokenNo}`);
    setCopiedTokenId(tokenNo);
    setTimeout(() => setCopiedTokenId(null), 1800);
  };

  if (students.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <UtensilsCrossed className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {t('noStudentsFound', 'No students match current filter criteria')}
        </h4>
        <p className="text-xs text-gray-400 mt-1">
          {t('tryAdjustingFilters', 'Try resetting search query or clearing active filters.')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full min-w-0">
      {students.map((student) => {
        const tokenNo = Number(student.tokenNo) || 0;
        const stNameEn = student.nameEn || student.name || `Token #${tokenNo}`;
        const stNameMl = student.nameMl || '';
        const batch = student.batch || 'General';
        const room = student.room || student.roomNo;

        const sectionSize = sectionChunkSize || 25;
        const sectionIndex = Math.floor((tokenNo - 1) / sectionSize) + 1;

        const avoidedPrefs = preferences.filter(
          (p) => student.obj2 && student.obj2[p.id] === false
        );
        const isCopied = copiedTokenId === tokenNo;

        return (
          <motion.div
            key={student.id || tokenNo}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              feedback('tick');
              if (onSelectStudent) onSelectStudent(student);
            }}
            className="flex flex-col rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/30 p-3.5 sm:p-4 transition-all cursor-pointer backdrop-blur-xl group w-full max-w-full min-w-0 overflow-hidden"
          >
            {/* Card Header: Token & Batch */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-mono font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  #{tokenNo}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {stNameEn}
                  </h4>
                  {stNameMl && (
                    <p className="text-[10px] text-gray-400 truncate">{stNameMl}</p>
                  )}
                </div>
              </div>

              {/* Copy Token Button */}
              <button
                type="button"
                onClick={(e) => handleCopyToken(e, tokenNo)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
                title={`Copy #${tokenNo}`}
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Badges: Section, Batch & Room */}
            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-gray-500 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                <Grid3X3 className="w-3 h-3 text-emerald-500" />
                Sec {sectionIndex}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px]">
                <Layers className="w-3 h-3 text-emerald-500" />
                {batch}
              </span>

              {room && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 text-[10px]">
                  <DoorClosed className="w-3 h-3" />
                  {room}
                </span>
              )}
            </div>

            {/* Excluded Food Pills Strip */}
            <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5 flex-1 flex flex-col justify-end">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
                <span>{t('exclusions', 'Avoided Foods')}</span>
                <span className="text-rose-500 font-mono font-black">{avoidedPrefs.length}</span>
              </div>

              {avoidedPrefs.length === 0 ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t('standardFullDiet', 'Full Diet (No Exclusions)')}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {avoidedPrefs.map((p) => {
                    const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : (p.labelEn || p.name);
                    return (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/40 text-[10px] font-bold"
                      >
                        {getCategoryIcon(p.icon, 'w-3 h-3')}
                        <span>{prefLabel}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
