import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
} from 'lucide-react';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../../utils/supportFaqData';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';

export default function CareKnowledgeBase({ onNavigateFeedback }) {
  const { t, lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(FAQ_ITEMS[0]?.id || null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  // Filter FAQ items by category and search query
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const question = (lang === 'ml' ? item.questionMl : item.questionEn).toLowerCase();
      const answer = (lang === 'ml' ? item.answerMl : item.answerEn).toLowerCase();
      const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(q));

      return question.includes(q) || answer.includes(q) || matchesTags;
    });
  }, [searchQuery, activeCategory, lang]);

  const toggleAccordion = (id) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleHelpful = (id, isHelpful) => {
    soundEngine.playSoftChime();
    hapticEngine.selectionTick();
    setFeedbackGiven((prev) => ({ ...prev, [id]: isHelpful }));
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('faqSearchPlaceholder', 'Search dining questions, cutoff rules, avoiders...')}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all shadow-sm"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {FAQ_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                setActiveCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/20'
                  : 'bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t(cat.key, cat.label)}
            </button>
          );
        })}
      </div>

      {/* Accordion FAQ List */}
      <div className="flex flex-col gap-2.5">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200/60 dark:border-white/10">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              No matching answers found
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Try searching with different terms, or send a direct question to the committee.
            </p>
            {onNavigateFeedback && (
              <button
                type="button"
                onClick={onNavigateFeedback}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                <span>Ask Committee Directly</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const userVote = feedbackGiven[faq.id];
            const question = lang === 'ml' ? faq.questionMl : faq.questionEn;
            const answer = lang === 'ml' ? faq.answerMl : faq.answerEn;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-white dark:bg-[#111a17] border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isExpanded ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                    }`}>
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                      {question}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-white/5 flex flex-col gap-3">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {answer}
                        </p>

                        {/* Micro-Feedback bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-400">
                          <span>Was this answer helpful?</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleHelpful(faq.id, true)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                userVote === true
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/10'
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHelpful(faq.id, false)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                userVote === false
                                  ? 'bg-rose-500 text-white border-rose-500'
                                  : 'hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/10'
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
