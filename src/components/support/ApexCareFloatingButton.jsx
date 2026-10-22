import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, Sparkles, HelpCircle } from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import ApexCareHubModal from './ApexCareHubModal';

export default function ApexCareFloatingButton({ className = '' }) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setModalOpen(true);
  };

  return (
    <>
      <div className={`fixed bottom-5 sm:bottom-6 right-4 sm:right-6 z-40 ${className}`}>
        <motion.button
          type="button"
          onClick={handleClick}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 sm:px-4.5 sm:py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/20 dark:shadow-emerald-950/60 ring-2 ring-white/20 dark:ring-white/10 backdrop-blur-xl cursor-pointer transition-all"
        >
          {/* Subtle glowing ring aura */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500/30 opacity-70 blur-md group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100 group-hover:scale-110 transition-transform" />
          </div>

          <span className="relative z-10 hidden sm:inline tracking-tight font-extrabold">
            {t('navSupport', 'Care & Support')}
          </span>

          <span className="relative z-10 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
          </span>
        </motion.button>
      </div>

      <ApexCareHubModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
