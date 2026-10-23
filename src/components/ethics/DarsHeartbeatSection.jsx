import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Hammer,
  ChefHat,
  Users,
  Quote,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

export default function DarsHeartbeatSection() {
  const { darsHeartbeat } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();
  const [activeCardId, setActiveCardId] = useState(null);

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Hammer':
        return Hammer;
      case 'Heart':
        return Heart;
      case 'ChefHat':
        return ChefHat;
      case 'Users':
      default:
        return Users;
    }
  };

  return (
    <section id="dars-soul" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
          <Heart className="w-3.5 h-3.5 fill-current text-amber-500" />
          <span>{darsHeartbeat.sectionTagMl}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          {darsHeartbeat.titleMl}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-malayalam">
          {darsHeartbeat.introMl}
        </p>
      </div>

      {/* The Central Prophetic Standard (Hadith Card) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-[#063326] to-[#021f17] text-white p-6 sm:p-8 md:p-10 border border-emerald-500/30 shadow-xl mb-12"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Quote className="w-32 h-32 text-emerald-300" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 mb-4">
            തിരുനബിചര്യയിലെ സുവർണ്ണ മാനദണ്ഡം
          </span>

          {/* Arabic Hadith */}
          <p className="font-arabic text-xl sm:text-2xl md:text-3xl text-emerald-100 font-medium leading-relaxed tracking-wide select-none">
            {darsHeartbeat.primaryHadith.matnAr}
          </p>

          <p className="text-xs sm:text-sm text-emerald-300 font-medium mt-3 font-malayalam">
            {darsHeartbeat.primaryHadith.narratorMl} • {darsHeartbeat.primaryHadith.reference}
          </p>

          {/* Malayalam Meaning */}
          <div className="mt-5 pt-5 border-t border-emerald-500/30 w-full">
            <p className="text-sm sm:text-base text-emerald-50 font-malayalam leading-relaxed">
              &ldquo;{darsHeartbeat.primaryHadith.meaningMl}&rdquo;
            </p>
          </div>

          {/* Scholarly Commentary Box */}
          <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-emerald-400/20 text-xs sm:text-sm text-emerald-100/90 font-malayalam text-left flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>{darsHeartbeat.primaryHadith.lessonMl}</p>
          </div>
        </div>
      </motion.div>

      {/* Palate Advice vs. Gratitude Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="p-6 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-base mb-2 font-malayalam">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h3>{darsHeartbeat.palateAdviceMl.heading}</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
            {darsHeartbeat.palateAdviceMl.body}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base mb-2 font-malayalam">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <h3>ദർസിലെ ഭക്ഷണം ഒരു വിരുന്നാണ്</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
            നമ്മൾ ഇവിടെ പണം കൊടുത്ത് വാങ്ങി കഴിക്കുന്ന ഹോട്ടലിലല്ല. മറിച്ച്, മതവിജ്ഞാനം അഭ്യസിക്കുന്ന നമ്മെ കണ്ട് സ്വർഗ്ഗം കൊതിക്കുന്ന ഒരു സമുദായത്തിന്റെ സ്നേഹക്കടലിലാണ് നാം വസിക്കുന്നത്. ആ കടപ്പാട് നമ്മുടെ ഓരോ ഭക്ഷണ നിമിഷത്തിലും ഓർമ്മയുണ്ടാവണം.
          </p>
        </div>
      </div>

      {/* 4 Gratitude Contemplation Cards */}
      <div>
        <h3 className="text-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6 font-malayalam">
          ഓരോ ഉരുളക്ക് പിന്നിലെയും ത്യാഗങ്ങൾ
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {darsHeartbeat.gratitudeCards.map((card) => {
            const Icon = getIcon(card.icon);
            const isSelected = activeCardId === card.id;

            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  feedback('tick');
                  setActiveCardId(isSelected ? null : card.id);
                }}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-glow-emerald'
                    : 'bg-white dark:bg-[#0f1d18] hover:bg-emerald-50/50 dark:hover:bg-[#142620] border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 shadow-xs'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm sm:text-base font-malayalam mb-1.5">{card.titleMl}</h4>
                <p
                  className={`text-xs font-malayalam leading-relaxed ${
                    isSelected ? 'text-emerald-100' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {card.descMl}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
