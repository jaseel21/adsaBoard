import React from 'react';
import { motion } from 'framer-motion';
import {
  Utensils,
  Coffee,
  ChefHat,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useTiltGlare } from '../../hooks/useTiltGlare';

function CanteenMemberCard({ member }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();
  const tilt = useTiltGlare({ maxTilt: 7, scale: 1.02 });

  const name = lang === 'ml' ? member.nameMl || member.nameEn : member.nameEn || member.nameMl;
  const role = lang === 'ml' ? member.roleMl || member.roleEn : member.roleEn || member.roleMl;
  const duty = lang === 'ml' ? member.dutyMl || member.dutyEn : member.dutyEn || member.dutyMl;

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="relative rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-gray-900 dark:text-gray-100"
    >
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
        style={tilt.glareStyle}
      />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/30">
            <img
              src={
                member.photoURL ||
                'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80'
              }
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80';
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs shadow">
            <Utensils className="w-3 h-3" />
          </div>
        </div>

        {/* Member Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300">
            {role}
          </span>

          <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 truncate">
            {name}
          </h3>

          {member.batch && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              {member.batch}
            </div>
          )}

          {duty && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
              {duty}
            </p>
          )}

          {/* Contact Actions */}
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

export default function CanteenWingSection({ canteenMembers }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  if (!canteenMembers || canteenMembers.length === 0) return null;

  return (
    <section id="canteen-wing" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
          <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{lang === 'ml' ? 'കാന്റീൻ വിംഗ് • ഭക്ഷണ സംരക്ഷകർ' : 'Canteen Wing • Mess Guardians'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {lang === 'ml' ? 'അഡ്സ കാന്റീൻ സബ് കമ്മിറ്റി' : 'ADSA Canteen & Culinary Wing'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ml'
            ? 'പ്രതിദിനം 3 നേരത്തെ ഭക്ഷണ വിതരണം, അടുക്കള മേൽനോട്ടം, റേഷൻ കൃത്യത, സീറോ വേസ്റ്റ് കാമ്പയിൻ എന്നിവ നയിക്കുന്ന അഡ്സയുടെ സമർപ്പിത സേവന സംഘം.'
            : 'The dedicated operational custodians ensuring punctual daily meals, flawless kitchen coordination, nutritional standards, and zero food waste.'}
        </p>
      </div>

      {/* Operational Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-center space-y-1">
          <div className="text-lg font-black text-amber-800 dark:text-amber-300">
            {lang === 'ml' ? '3 നേരം സമീകൃതാഹാരം' : '3 Balanced Daily Meals'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {lang === 'ml' ? 'പ്രഭാതഭക്ഷണം, ഉച്ചഭക്ഷണം, അത്താഴം' : 'Breakfast, Lunch & Dinner'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-1">
          <div className="text-lg font-black text-emerald-800 dark:text-emerald-300">
            {lang === 'ml' ? 'സീറോ വേസ്റ്റ് ദൗത്യം' : '100% Zero-Waste Goal'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {lang === 'ml' ? 'ഒരു മണി അന്നം പോലും പാഴാക്കാതെ' : 'Precise kitchen ratio matching'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/20 text-center space-y-1">
          <div className="text-lg font-black text-teal-800 dark:text-teal-300">
            {lang === 'ml' ? 'പ്രത്യേക ഡയറ്റ് പരിഗണന' : 'Dietary Care & Medical'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {lang === 'ml' ? 'അലർജികളും രോഗങ്ങളും പ്രത്യേകമായി പരിഗണിക്കുന്നു' : 'Strict avoiders manifests'}
          </div>
        </div>
      </div>

      {/* Canteen Members Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {canteenMembers.map((member, idx) => (
          <CanteenMemberCard key={member.id || idx} member={member} />
        ))}
      </div>
    </section>
  );
}

