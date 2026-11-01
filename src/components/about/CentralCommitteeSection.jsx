import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Phone,
  MessageCircle,
  Award,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useTiltGlare } from '../../hooks/useTiltGlare';

function ExecutiveMemberCard({ member, isTopLeader = false }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();
  const tilt = useTiltGlare({ maxTilt: isTopLeader ? 6 : 8, scale: 1.02 });

  const name = lang === 'ml' ? member.nameMl || member.nameEn : member.nameEn || member.nameMl;
  const role = lang === 'ml' ? member.roleMl || member.roleEn : member.roleEn || member.roleMl;
  const portfolio =
    lang === 'ml'
      ? member.portfolioMl || member.portfolioEn
      : member.portfolioEn || member.portfolioMl;

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 overflow-hidden ${
        isTopLeader
          ? 'bg-gradient-to-br from-emerald-950/40 via-teal-950/50 to-slate-900 border-2 border-emerald-500/40 shadow-xl text-white'
          : 'bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:shadow-lg text-gray-900 dark:text-gray-100'
      }`}
    >
      {/* Specular glare */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
        style={tilt.glareStyle}
      />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 ${
              isTopLeader ? 'border-amber-400/80 shadow-md' : 'border-emerald-500/30'
            }`}
          >
            <img
              src={
                member.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
              }}
            />
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isTopLeader ? 'bg-amber-500 text-slate-950 shadow' : 'bg-emerald-600 text-white shadow'
            }`}
          >
            #{member.order || '•'}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                isTopLeader
                  ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {role}
            </span>
            {member.batch && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                {member.batch}
              </span>
            )}
          </div>

          <h3
            className={`text-base sm:text-lg font-black truncate ${
              isTopLeader ? 'text-amber-100' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {name}
          </h3>

          {portfolio && (
            <p
              className={`text-xs leading-relaxed line-clamp-2 ${
                isTopLeader ? 'text-emerald-100/80' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {portfolio}
            </p>
          )}

          {/* Quick Contact Actions if available */}
          {member.phone && (
            <div className="pt-2 flex items-center gap-2">
              <a
                href={`tel:${member.phone}`}
                onClick={() => feedback('pop')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition-all active:scale-95"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/91${member.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold transition-all active:scale-95"
              >
                <MessageCircle className="w-3 h-3 text-emerald-500" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CentralCommitteeSection({ tenuresList }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  // Pick first active/current tenure by default
  const defaultTenureId = useMemo(() => {
    if (!tenuresList || tenuresList.length === 0) return null;
    const current = tenuresList.find((t) => t.isCurrentTenure);
    return current ? current.id : tenuresList[0].id;
  }, [tenuresList]);

  const [selectedTenureId, setSelectedTenureId] = useState(defaultTenureId);

  // Sync state if defaultTenureId changes
  React.useEffect(() => {
    if (defaultTenureId && !selectedTenureId) {
      setSelectedTenureId(defaultTenureId);
    }
  }, [defaultTenureId, selectedTenureId]);

  const activeTenure = useMemo(() => {
    if (!tenuresList || tenuresList.length === 0) return null;
    return tenuresList.find((t) => t.id === selectedTenureId) || tenuresList[0];
  }, [tenuresList, selectedTenureId]);

  const centralMembers = activeTenure?.centralCommittee || [];

  return (
    <section id="central-committee" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ml' ? 'നേതൃത്വ സമിതി' : 'Supreme Leadership'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {lang === 'ml' ? 'അഡ്സ സെൻട്രൽ കമ്മിറ്റി' : 'ADSA Central Committee'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ml'
            ? 'വിദ്യാർത്ഥി ഭരണകൂടത്തിന്റെ പരമോന്നത എക്സിക്യൂട്ടീവ് സമിതി'
            : 'The supreme executive council governing campus discipline, welfare, student affairs, and institutional operations.'}
        </p>
      </div>

      {/* Academic Tenure Switcher Tabs */}
      {tenuresList && tenuresList.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          {tenuresList.map((tenure) => {
            const isSelected = tenure.id === selectedTenureId;
            return (
              <button
                key={tenure.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSelectedTenureId(tenure.id);
                }}
                className={`relative px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-white dark:bg-[#0c1512] text-gray-600 dark:text-gray-400 hover:text-emerald-600 border border-gray-200 dark:border-emerald-500/20'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeTenureTab"
                    className="absolute inset-0 bg-emerald-600 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{tenure.academicYear}</span>
                  {tenure.isCurrentTenure && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                      Current
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Tenure Banner */}
      {activeTenure && (
        <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {lang === 'ml' ? 'അധ്യയന വർഷം:' : 'Tenure Term:'} {activeTenure.academicYear}{' '}
              {activeTenure.hijriYear && `(${activeTenure.hijriYear})`}
            </div>
            {activeTenure.theme && (
              <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                &quot;{lang === 'ml' ? activeTenure.themeMl || activeTenure.theme : activeTenure.theme}&quot;
              </div>
            )}
          </div>
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {lang === 'ml'
              ? `${centralMembers.length} ഭാരവാഹികൾ`
              : `${centralMembers.length} Executives`}
          </div>
        </div>
      )}

      {/* Executive Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {centralMembers.map((member, idx) => (
          <ExecutiveMemberCard
            key={member.id || idx}
            member={member}
            isTopLeader={idx < 2} // Top 2 (President & Gen Sec) have distinction
          />
        ))}
      </div>
    </section>
  );
}

