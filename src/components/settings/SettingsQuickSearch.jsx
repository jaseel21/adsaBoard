import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function SettingsQuickSearch({ searchQuery, setSearchQuery, matchCount = null }) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const handleClear = () => {
    feedback('tick');
    setSearchQuery('');
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'ml'
              ? 'ക്രമീകരണങ്ങൾ തിരയുക (തീം, പാസ്‌വേഡ്, ശബ്ദം, ബാക്കപ്പ്...)'
              : 'Search settings (theme, password, audio, backup, kiosk...)'
          }
          className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/90 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />

        {searchQuery ? (
          <div className="absolute right-2 flex items-center gap-1.5">
            {matchCount !== null && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            )}
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear Search"
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="absolute right-3 hidden sm:flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md">
              ⌘K
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}
