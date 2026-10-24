import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, UtensilsCrossed, Info, Grid3X3, Layers } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getCategoryIcon } from './dietaryIcons';

export default function AvoidersMatrixView({
  preferences = [],
  rejectionsByPref = {},
  students = [],
  onSelectStudent,
  searchQuery = '',
  sortOrder = 'asc',
  categorization = 'meal',
  sectionsList = [],
  batchesList = [],
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const [copiedId, setCopiedId] = useState(null);

  // Map of studentId/tokenNo to student doc for quick lookup
  const studentByToken = React.useMemo(() => {
    const map = {};
    students.forEach((s) => {
      map[s.tokenNo] = s;
    });
    return map;
  }, [students]);

  // 1. Determine columns based on categorization
  const columns = React.useMemo(() => {
    if (categorization === 'section') {
      return sectionsList.map((sec) => {
        // Students in this section who have at least 1 dietary avoidance
        const avoiders = (sec.students || []).filter((s) => {
          return preferences.some((p) => s.obj2 && s.obj2[p.id] === false);
        });

        let tokenList = avoiders.map((s) => s.tokenNo);
        if (sortOrder === 'desc') {
          tokenList.sort((a, b) => Number(b) - Number(a));
        } else {
          tokenList.sort((a, b) => Number(a) - Number(b));
        }

        return {
          id: sec.id || `sec_${sec.sectionIndex}`,
          title: sec.name,
          subtitle: sec.range,
          tokenList,
          icon: <Grid3X3 className="w-4 h-4 text-emerald-500" />,
          copyText: `ADSA Mess • ${sec.name} (${sec.range}) Avoiders (${tokenList.length} students):\n${tokenList.map((t) => `#${t}`).join(', ')}`,
        };
      });
    }

    if (categorization === 'batch') {
      return batchesList.map((batch) => {
        // Students in this batch who have at least 1 dietary avoidance
        const avoiders = students.filter(
          (s) => (s.batch && s.batch.trim() ? s.batch.trim() : 'General') === batch.name
        );

        let tokenList = avoiders.map((s) => s.tokenNo);
        if (sortOrder === 'desc') {
          tokenList.sort((a, b) => Number(b) - Number(a));
        } else {
          tokenList.sort((a, b) => Number(a) - Number(b));
        }

        return {
          id: `batch_${batch.name}`,
          title: batch.name,
          subtitle: `${batch.count || avoiders.length} enrolled`,
          tokenList,
          icon: <Layers className="w-4 h-4 text-emerald-500" />,
          copyText: `ADSA Mess • ${batch.name} Avoiders (${tokenList.length} students):\n${tokenList.map((t) => `#${t}`).join(', ')}`,
        };
      });
    }

    // Default: 'meal' categorization
    return preferences.map((pref) => {
      let tokenList = [...(rejectionsByPref[pref.id] || [])];
      if (sortOrder === 'desc') {
        tokenList.sort((a, b) => Number(b) - Number(a));
      } else {
        tokenList.sort((a, b) => Number(a) - Number(b));
      }

      const prefLabel = lang === 'ml' && pref.labelMl ? pref.labelMl : pref.labelEn;
      const subLabel = lang === 'ml' ? pref.labelEn : pref.labelMl;

      return {
        id: pref.id,
        title: prefLabel,
        subtitle: subLabel,
        tokenList,
        icon: getCategoryIcon(pref.icon, 'w-4 h-4'),
        copyText: `ADSA Mess • ${prefLabel} Avoiders (${tokenList.length} students):\n${tokenList.map((t) => `#${t}`).join(', ')}`,
      };
    });
  }, [categorization, sectionsList, batchesList, preferences, rejectionsByPref, students, sortOrder, lang]);

  const handleCopy = (col) => {
    feedback('tick');
    navigator.clipboard.writeText(col.copyText);
    setCopiedId(col.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full min-w-0">
      {columns.map((col) => {
        const isCopied = copiedId === col.id;
        const tokenList = col.tokenList || [];

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl w-full max-w-full min-w-0"
          >
            {/* Column Header */}
            <div className="p-4 bg-gradient-to-r from-gray-50/90 to-gray-100/50 dark:from-white/5 dark:to-white/2 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                  {col.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {col.title}
                  </h3>
                  {col.subtitle && (
                    <p className="text-[10px] text-gray-400 truncate">{col.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-xs font-black font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {tokenList.length}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopy(col)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
                  title={`Copy ${col.title} Tokens`}
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Column Body: Tokens Grid */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[550px] min-h-[140px] space-y-2">
              {tokenList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <UtensilsCrossed className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs font-medium">{t('noAvoidersInCat', 'No avoiders in this category')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {tokenList.map((tokenNo) => {
                    const student = studentByToken[tokenNo];
                    const isMatchedBySearch =
                      searchQuery.trim() &&
                      String(tokenNo).includes(searchQuery.trim());

                    // Get specific avoided preferences for this student if in section or batch mode
                    const avoided = student
                      ? preferences.filter((p) => student.obj2 && student.obj2[p.id] === false)
                      : [];

                    return (
                      <motion.button
                        key={tokenNo}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          if (student && onSelectStudent) {
                            onSelectStudent(student);
                          }
                        }}
                        className={`group relative p-2 rounded-xl text-center font-mono font-bold text-xs transition-all cursor-pointer border ${
                          isMatchedBySearch
                            ? 'bg-amber-400 text-gray-900 border-amber-500 shadow-md ring-2 ring-amber-400/50'
                            : 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:border-rose-300'
                        }`}
                        title={
                          student
                            ? `${student.nameEn || student.name || ''} (${student.batch || 'General'}) • Avoids: ${avoided.map((p) => p.labelEn).join(', ') || 'None'}`
                            : `Token #${tokenNo}`
                        }
                      >
                        <span>#{tokenNo}</span>
                        {/* Sub-label under token: Batch in Meal mode, or Avoidance icon count in Section/Batch mode */}
                        {categorization === 'meal' ? (
                          student && (
                            <span className="block text-[8px] font-sans text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 truncate mt-0.5 max-w-full">
                              {student.batch || ''}
                            </span>
                          )
                        ) : (
                          <div className="flex items-center justify-center gap-0.5 mt-0.5 overflow-hidden">
                            {avoided.slice(0, 3).map((p) => (
                              <span key={p.id} className="opacity-70 group-hover:opacity-100" title={p.labelEn}>
                                {getCategoryIcon(p.icon, 'w-2.5 h-2.5')}
                              </span>
                            ))}
                            {avoided.length > 3 && (
                              <span className="text-[7px] font-sans font-bold">+{avoided.length - 3}</span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column Footer: High Contrast in Dark Mode */}
            <div className="px-4 py-2.5 bg-gray-50/90 dark:bg-[#14211d] border-t border-gray-200/80 dark:border-white/10 text-[11px] flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {t('totalCount', 'Count:')}{' '}
                <strong className="text-gray-900 dark:text-white font-mono font-bold">
                  {tokenList.length}
                </strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-semibold">
                {Math.round((tokenList.length / Math.max(students.length, 1)) * 100)}% of mess
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
