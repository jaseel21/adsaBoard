import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Award,
  Sparkles,
  Quote,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useTiltGlare } from '../../hooks/useTiltGlare';

function MudarrisCard({ scholar, isChief = false, onSelectBio }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();
  const tilt = useTiltGlare({ maxTilt: isChief ? 6 : 8, scale: 1.02 });

  const name = lang === 'ml' ? scholar.nameMl || scholar.nameEn : scholar.nameEn || scholar.nameMl;
  const designation =
    lang === 'ml'
      ? scholar.designationMl || scholar.designationEn
      : scholar.designationEn || scholar.designationMl;
  const quote = lang === 'ml' ? scholar.quoteMl || scholar.quoteEn : scholar.quoteEn || scholar.quoteMl;

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`relative rounded-3xl p-6 transition-shadow duration-300 overflow-hidden ${
        isChief
          ? 'bg-gradient-to-br from-amber-950/40 via-emerald-950/60 to-slate-900 border-2 border-amber-500/40 shadow-xl shadow-amber-950/20 text-white'
          : 'bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-950/30 text-gray-900 dark:text-gray-100'
      }`}
    >
      {/* Dynamic Specular Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
        style={tilt.glareStyle}
      />

      {isChief && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-sm">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'ml' ? 'സദ്റുൽ മുദരിസീൻ' : 'Chief Mudarris'}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Scholar Portrait */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md border-2 ${
              isChief ? 'border-amber-400/60' : 'border-emerald-500/30'
            }`}
          >
            <img
              src={scholar.photoURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80'}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80';
              }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>

        {/* Scholar Bio & Disciplines */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h3
              className={`text-lg sm:text-xl font-black tracking-tight ${
                isChief ? 'text-amber-200' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {name}
            </h3>
            <div
              className={`text-xs font-bold mt-0.5 ${
                isChief ? 'text-amber-300/80' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {designation}
            </div>
          </div>

          {/* Kitabs taught */}
          {scholar.kitabsTaught && scholar.kitabsTaught.length > 0 && (
            <div className="pt-1">
              <div
                className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                  isChief ? 'text-amber-400/80' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {lang === 'ml' ? 'പ്രധാന കിതാബുകൾ (Classical Texts):' : 'Key Classical Texts:'}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                {scholar.kitabsTaught.map((kitab, kIdx) => (
                  <span
                    key={kIdx}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                      isChief
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <BookOpen className="w-2.5 h-2.5 opacity-70" />
                    <span>{kitab}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scholarly quote */}
          {quote && (
            <div
              className={`pt-2 text-xs italic flex items-start gap-2 ${
                isChief ? 'text-amber-100/90' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Quote className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 mt-0.5 rotate-180 opacity-70" />
              <span>{quote}</span>
            </div>
          )}

          {/* Bio Expander Trigger */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onSelectBio(scholar);
              }}
              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all ${
                isChief
                  ? 'text-amber-300 hover:text-amber-200 underline underline-offset-4'
                  : 'text-emerald-600 dark:text-emerald-400 hover:underline'
              }`}
            >
              <span>{lang === 'ml' ? 'കൂടുതൽ വിവരങ്ങൾ വായിക്കുക' : 'Read Full Scholar Profile'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MudarrisunSection({ facultyList }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBioScholar, setSelectedBioScholar] = useState(null);

  const chiefScholar = useMemo(
    () => (facultyList || []).find((s) => s.role === 'chief_mudarris' || s.isChief),
    [facultyList]
  );

  const otherScholars = useMemo(() => {
    return (facultyList || []).filter((s) => s.id !== chiefScholar?.id);
  }, [facultyList, chiefScholar]);

  const filteredScholars = useMemo(() => {
    if (!searchQuery.trim()) return otherScholars;
    const q = searchQuery.toLowerCase().trim();
    return otherScholars.filter((s) => {
      const matchName =
        (s.nameEn || '').toLowerCase().includes(q) || (s.nameMl || '').toLowerCase().includes(q);
      const matchDesig =
        (s.designationEn || '').toLowerCase().includes(q) ||
        (s.designationMl || '').toLowerCase().includes(q);
      const matchKitab = (s.kitabsTaught || []).some((k) => k.toLowerCase().includes(q));
      return matchName || matchDesig || matchKitab;
    });
  }, [otherScholars, searchQuery]);

  return (
    <section id="mudarrisun" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'ml' ? 'ഗുരുശ്രേഷ്ഠർ (Faculty Sanctuary)' : 'Venerated Faculty'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {lang === 'ml' ? 'ബഹുമാനപ്പെട്ട മുദരിസുമാർ' : 'Mudarrisun & Scholars'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ml'
            ? 'ആലത്തൂർപടി ദർസിന്റെ ആത്മീയവും വൈജ്ഞാനികവുമായ നേർവഴികാട്ടികളായ ഉസ്താദുമാർ'
            : 'The esteemed Islamic scholars, jurists, and mentors transmitting sacred prophetic sciences at Alathurpadi Dars.'}
        </p>
      </div>

      {/* Chief Mudarris Spotlight Card */}
      {chiefScholar && (
        <div className="max-w-4xl mx-auto">
          <MudarrisCard
            scholar={chiefScholar}
            isChief={true}
            onSelectBio={(s) => setSelectedBioScholar(s)}
          />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto pt-2">
        <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
          {lang === 'ml'
            ? `ആകെ ${facultyList?.length || 0} മുദരിസുമാർ`
            : `Total Faculty: ${facultyList?.length || 0} Scholars`}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ml' ? 'മുദരിസിനെയോ കിതാബിനെയോ തിരയുക...' : 'Search scholar or text...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Other Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {filteredScholars.map((scholar) => (
          <MudarrisCard
            key={scholar.id}
            scholar={scholar}
            isChief={false}
            onSelectBio={(s) => setSelectedBioScholar(s)}
          />
        ))}
      </div>

      {/* Scholar Bio Modal */}
      <AnimatePresence>
        {selectedBioScholar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white dark:bg-[#0c1512] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-emerald-500/30 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBioScholar.photoURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80'}
                    alt={selectedBioScholar.nameEn}
                    className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30"
                  />
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">
                      {lang === 'ml'
                        ? selectedBioScholar.nameMl || selectedBioScholar.nameEn
                        : selectedBioScholar.nameEn}
                    </h3>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {lang === 'ml'
                        ? selectedBioScholar.designationMl || selectedBioScholar.designationEn
                        : selectedBioScholar.designationEn}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback('pop');
                    setSelectedBioScholar(null);
                  }}
                  className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bio Text */}
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3">
                {lang === 'ml'
                  ? selectedBioScholar.bioMl || selectedBioScholar.bioEn
                  : selectedBioScholar.bioEn || selectedBioScholar.bioMl}
              </div>

              {/* Kitabs Taught list */}
              {selectedBioScholar.kitabsTaught && selectedBioScholar.kitabsTaught.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {lang === 'ml' ? 'പഠിപ്പിക്കുന്ന കിതാബുകൾ:' : 'Classical Texts Taught:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBioScholar.kitabsTaught.map((k, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quote */}
              {(selectedBioScholar.quoteEn || selectedBioScholar.quoteMl) && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs italic flex items-start gap-2">
                  <Quote className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5 rotate-180" />
                  <span>
                    {lang === 'ml'
                      ? selectedBioScholar.quoteMl || selectedBioScholar.quoteEn
                      : selectedBioScholar.quoteEn || selectedBioScholar.quoteMl}
                  </span>
                </div>
              )}

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedBioScholar(null)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {lang === 'ml' ? 'അടയ്ക്കുക' : 'Close Profile'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

