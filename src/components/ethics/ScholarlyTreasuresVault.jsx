import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Share2,
  Sparkles,
  Quote,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';

export default function ScholarlyTreasuresVault({ onShareQuote }) {
  const { scholarlyQuotes } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const CATEGORIES = [
    { id: 'all', label: 'എല്ലാ ജ്ഞാനമൊഴികളും (All)' },
    { id: 'scholarly', label: 'ഫിഖ്ഹും പണ്ഡിതന്മാരും' },
    { id: 'spiritual', label: 'ആത്മീയ ദർശനം' },
    { id: 'wisdom', label: 'ഉദ്ബോധനങ്ങൾ' },
  ];

  const handleCopy = (quote) => {
    feedback('tick');
    const fullText = `${quote.quoteAr}\n\n"${quote.quoteMl}"\n— ${quote.scholarNameMl} (${quote.sourceBook})\n\n[ADSA T-Board • ആലത്തൂർപടി ദർസ്]`;
    navigator.clipboard?.writeText(fullText);
    setCopiedId(quote.id);
    dialog.toast.success('കോപ്പി ചെയ്തു', 'ജ്ഞാനമൊഴി ക്ലിപ്പ്ബോർഡിലേക്ക് പകർത്തി.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredQuotes = scholarlyQuotes.filter((q) => {
    const matchesCategory =
      selectedCategory === 'all' || q.category === selectedCategory;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      q.scholarNameMl.toLowerCase().includes(qLower) ||
      q.quoteMl.toLowerCase().includes(qLower) ||
      q.sourceBook.toLowerCase().includes(qLower) ||
      q.quoteAr.includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="scholarly-vault" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>പണ്ഡിത മൊഴികളും ആത്മീയ വെളിച്ചവും</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          കിതാബുകളിലെ അന്ന രഹസ്യങ്ങൾ
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam max-w-2xl mx-auto">
          ഇമാം ഗസ്സാലി (റ) യുടെ ഇഹ്‌യായും, പൊന്നാനി ശൈഖ് സൈനുദ്ദീൻ മഖ്ദൂം (റ) യുടെ ഫത്ഹുൽ മുഈനും പകർന്നു നൽകുന്ന ആഴമേറിയ ചിന്തകൾ.
        </p>

        {/* Search Bar & Category Filters */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="പണ്ഡിതനെയോ കിതാബിനെയോ തിരയുക..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scholarly Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredQuotes.map((quote) => {
            const isCopied = copiedId === quote.id;

            return (
              <motion.div
                key={quote.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1814] border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-emerald-800 dark:text-emerald-300 font-malayalam">
                        {quote.scholarNameMl}
                      </h3>
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 font-malayalam">
                        {quote.sourceBook}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Quote className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Classical Arabic Quote */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15 mb-4">
                    <p className="font-arabic text-base sm:text-lg text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed select-none">
                      {quote.quoteAr}
                    </p>
                  </div>

                  {/* Malayalam Commentary */}
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
                    &ldquo;{quote.quoteMl}&rdquo;
                  </p>
                </div>

                {/* Card Action Footers */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopy(quote)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-500/10 text-gray-700 dark:text-gray-300 font-bold transition-all active:scale-95"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{isCopied ? 'പകർത്തി' : 'കോപ്പി ചെയ്യുക'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      if (onShareQuote) onShareQuote(quote);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>സ്റ്റാറ്റസ് കാർഡാക്കുക</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
