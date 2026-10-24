import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function SettingsSidebarNav({
  sections = [],
  activeSectionId,
  onSelectSection,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const handleSelect = (id) => {
    feedback('tick');
    onSelectSection(id);
  };

  return (
    <>
      {/* Mobile Horizontal Scrolling Ribbon */}
      <div className="lg:hidden w-full overflow-x-auto scrollbar-none py-2 px-1 flex items-center gap-2 border-b border-gray-200/80 dark:border-white/10 mb-6 sticky top-14 bg-[#f8faf8]/95 dark:bg-[#080d0b]/95 backdrop-blur-xl z-20">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSectionId === sec.id;
          const label = language === 'ml' ? sec.labelMl : sec.labelEn;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleSelect(sec.id)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all flex-shrink-0 ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeMobileSettingsTab"
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/35 rounded-xl -z-10 shadow-xs"
                />
              )}
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Sticky Vertical Nav */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 rounded-3xl bg-white/70 dark:bg-[#0c1412]/70 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 p-3 shadow-sm">
          <div className="px-3 py-2 mb-2 border-b border-gray-100 dark:border-white/5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {language === 'ml' ? 'വിഭാഗങ്ങൾ' : 'Configuration'}
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSectionId === sec.id;
              const label = language === 'ml' ? sec.labelMl : sec.labelEn;
              const desc = language === 'ml' ? sec.descriptionMl : sec.descriptionEn;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleSelect(sec.id)}
                  className={`relative text-left px-3 py-2.5 rounded-2xl transition-all flex items-start gap-3 group ${
                    isActive
                      ? 'text-emerald-800 dark:text-emerald-200 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDesktopSettingsTab"
                      transition={{ type: 'spring', damping: 26, stiffness: 380 }}
                      className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl -z-10 shadow-xs"
                    />
                  )}

                  <div
                    className={`p-2 rounded-xl mt-0.5 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{label}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 font-normal">
                      {desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
