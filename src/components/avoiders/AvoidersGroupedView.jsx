import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, UtensilsCrossed, Users, Grid3X3, Layers } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getCategoryIcon } from './dietaryIcons';

export default function AvoidersGroupedView({
  preferences = [],
  rejectionsByPref = {},
  students = [],
  onSelectStudent,
  sortOrder = 'asc',
  categorization = 'meal',
  sectionsList = [],
  batchesList = [],
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  // Map of tokenNo to student doc
  const studentByToken = React.useMemo(() => {
    const map = {};
    students.forEach((s) => {
      map[s.tokenNo] = s;
    });
    return map;
  }, [students]);

  // Build accordion groups based on categorization
  const groups = React.useMemo(() => {
    if (categorization === 'section') {
      return sectionsList.map((sec) => {
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
          icon: <Grid3X3 className="w-5 h-5 text-emerald-500" />,
          copyText: `ADSA Mess • ${sec.name} (${sec.range}) Avoiders (${tokenList.length} students):\n${tokenList.map((t) => `#${t}`).join(', ')}`,
        };
      });
    }

    if (categorization === 'batch') {
      return batchesList.map((batch) => {
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
          icon: <Layers className="w-5 h-5 text-emerald-500" />,
          copyText: `ADSA Mess • ${batch.name} Avoiders (${tokenList.length} students):\n${tokenList.map((t) => `#${t}`).join(', ')}`,
        };
      });
    }

    // Default: 'meal'
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
        title: `${prefLabel} ${t('avoiders', 'Avoiders')}`,
        subtitle: subLabel,
        tokenList,
        icon: getCategoryIcon(pref.icon, 'w-5 h-5'),
        copyText: `ADSA Mess • ${prefLabel} Avoiders (${tokenList.length} students):\n${tokenList.map((tok) => `#${tok}`).join(', ')}`,
      };
    });
  }, [categorization, sectionsList, batchesList, preferences, rejectionsByPref, students, sortOrder, lang, t]);

  // Expanded accordions state (default: all expanded)
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const init = {};
    groups.forEach((g) => {
      init[g.id] = true;
    });
    return init;
  });

  const [copiedId, setCopiedId] = useState(null);

  const toggleAccordion = (groupId) => {
    feedback('tick');
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCopy = (e, group) => {
    e.stopPropagation();
    feedback('tick');
    navigator.clipboard.writeText(group.copyText);
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0">
      {groups.map((group) => {
        const isExpanded = expandedGroups[group.id] !== false;
        const isCopied = copiedId === group.id;
        const tokenList = group.tokenList || [];

        return (
          <div
            key={group.id}
            className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl transition-all w-full max-w-full min-w-0"
          >
            {/* Accordion Header */}
            <div
              onClick={() => toggleAccordion(group.id)}
              className="p-3.5 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer select-none hover:bg-gray-50/60 dark:hover:bg-white/2 transition-colors min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                  {group.icon}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {group.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      {tokenList.length}
                    </span>
                  </div>
                  {group.subtitle && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{group.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Copy Tokens Button */}
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, group)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  title={`Copy ${group.title} Tokens`}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {/* Chevron */}
                <div className="p-1 rounded-lg text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Accordion Body */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-gray-100 dark:border-white/5"
                >
                  <div className="p-4 sm:p-5">
                    {tokenList.length === 0 ? (
                      <div className="py-6 text-center text-gray-400 text-xs">
                        {t('noAvoidersInCat', 'No avoiders recorded for this category')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {tokenList.map((tokenNo) => {
                          const student = studentByToken[tokenNo];
                          const stNameEn = student?.nameEn || student?.name || '';
                          const batch = student?.batch || 'General';

                          // Get avoided preferences for this student
                          const avoided = student
                            ? preferences.filter((p) => student.obj2 && student.obj2[p.id] === false)
                            : [];

                          return (
                            <button
                              key={tokenNo}
                              type="button"
                              onClick={() => {
                                feedback('tick');
                                if (student && onSelectStudent) onSelectStudent(student);
                              }}
                              className="p-2.5 rounded-2xl bg-gray-50 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/40 border border-gray-200/80 hover:border-rose-300 dark:border-white/10 dark:hover:border-rose-900/50 text-left transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                                  #{tokenNo}
                                </span>
                                <span className="text-[9px] font-semibold text-gray-400">
                                  {batch}
                                </span>
                              </div>
                              {stNameEn && (
                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate mt-1">
                                  {stNameEn}
                                </p>
                              )}

                              {/* Show small dietary icons if in Section or Batch mode */}
                              {categorization !== 'meal' && avoided.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-200/50 dark:border-white/5">
                                  {avoided.slice(0, 3).map((p) => (
                                    <span key={p.id} className="text-rose-500 opacity-80" title={p.labelEn}>
                                      {getCategoryIcon(p.icon, 'w-2.5 h-2.5')}
                                    </span>
                                  ))}
                                  {avoided.length > 3 && (
                                    <span className="text-[8px] font-bold text-gray-400">+{avoided.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
