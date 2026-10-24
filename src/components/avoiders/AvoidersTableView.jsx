import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, User, UtensilsCrossed, ExternalLink, Check, Grid3X3, Layers } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getCategoryIcon } from './dietaryIcons';

export default function AvoidersTableView({
  students = [],
  preferences = [],
  sortField,
  sortOrder,
  onSortChange,
  onSelectStudent,
  searchQuery = '',
  sectionChunkSize = 25,
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const handleHeaderClick = (field) => {
    feedback('tick');
    if (sortField === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-rose-500" />
    );
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
    <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl w-full max-w-full min-w-0">
      {/* Mobile Swipe Prompt */}
      <div className="sm:hidden px-3.5 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-between">
        <span>Swipe table horizontally to inspect all columns →</span>
        <span className="font-mono">({students.length})</span>
      </div>
      <div className="overflow-x-auto scrollbar-none touch-pan-x w-full max-w-full min-w-0">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50/90 dark:bg-white/5 border-b border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
              {/* Token # */}
              <th
                onClick={() => handleHeaderClick('tokenNo')}
                className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>{t('token', 'Token')}</span>
                  {renderSortIndicator('tokenNo')}
                </div>
              </th>

              {/* Student Name */}
              <th
                onClick={() => handleHeaderClick('nameEn')}
                className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>{t('studentName', 'Student Name')}</span>
                  {renderSortIndicator('nameEn')}
                </div>
              </th>

              {/* Section */}
              <th className="py-3.5 px-4 select-none whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Grid3X3 className="w-3 h-3 text-emerald-500" />
                  <span>{t('bySection', 'Section')}</span>
                </div>
              </th>

              {/* Academic Batch */}
              <th
                onClick={() => handleHeaderClick('batch')}
                className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-500" />
                  <span>{t('batch', 'Batch')}</span>
                  {renderSortIndicator('batch')}
                </div>
              </th>

              {/* Dietary Exclusions (Pills) */}
              <th className="py-3.5 px-4">{t('excludedItems', 'Excluded Foods')}</th>

              {/* Intensity / Count */}
              <th
                onClick={() => handleHeaderClick('avoidCount')}
                className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none text-center whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>{t('count', 'Exclusions')}</span>
                  {renderSortIndicator('avoidCount')}
                </div>
              </th>

              {/* Action */}
              <th className="py-3.5 px-4 text-right">{t('actions', 'Action')}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
            {students.map((student) => {
              const tokenNo = Number(student.tokenNo) || 0;
              const stNameEn = student.nameEn || student.name || `Token #${tokenNo}`;
              const stNameMl = student.nameMl || '';
              const batch = student.batch || 'General';

              const sectionSize = sectionChunkSize || 25;
              const sectionIndex = Math.floor((tokenNo - 1) / sectionSize) + 1;

              const avoidedPrefs = preferences.filter(
                (p) => student.obj2 && student.obj2[p.id] === false
              );
              const avoidCount = avoidedPrefs.length;

              return (
                <tr
                  key={student.id || tokenNo}
                  onClick={() => {
                    feedback('tick');
                    if (onSelectStudent) onSelectStudent(student);
                  }}
                  className="hover:bg-gray-50/80 dark:hover:bg-white/3 transition-colors cursor-pointer group"
                >
                  {/* Token Pill */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-black border border-emerald-500/20">
                      #{tokenNo}
                    </span>
                  </td>

                  {/* Student Name */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {stNameEn}
                    </div>
                    {stNameMl && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{stNameMl}</div>
                    )}
                  </td>

                  {/* Section Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                      Sec {sectionIndex}
                    </span>
                  </td>

                  {/* Batch Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[11px] font-semibold">
                      {batch}
                    </span>
                  </td>

                  {/* Excluded Food Pills */}
                  <td className="py-3 px-4">
                    {avoidCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('standardFullDiet', 'Full Diet (No Exclusions)')}</span>
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
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
                  </td>

                  {/* Exclusions Count Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {avoidCount > 0 ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                          avoidCount >= 3
                            ? 'bg-rose-500 text-white'
                            : avoidCount === 2
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {avoidCount}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 font-mono">0</span>
                    )}
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        feedback('tick');
                        if (onSelectStudent) onSelectStudent(student);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold transition-all"
                    >
                      <span>{t('view', 'View')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
