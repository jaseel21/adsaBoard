import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Maximize2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function CampusGallerySection({ galleryItems }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();
  const [activePhoto, setActivePhoto] = useState(null);

  if (!galleryItems || galleryItems.length === 0) return null;

  return (
    <section id="campus-gallery" className="scroll-mt-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ml' ? 'ക്യാമ്പസ് ദൃശ്യങ്ങൾ' : 'Campus Chronicles'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {lang === 'ml' ? 'ദർസ് കാമ്പസ് ചിത്രശാല' : 'Photographic Gallery'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ml'
            ? 'ആലത്തൂർപടി ദർസിലെ പവിത്രമായ പഠന നിമിഷങ്ങളും കാമ്പസ് ജീവനവും'
            : 'Visual glimpses of learning circles, historic architecture, communal mess, and scholarly atmosphere.'}
        </p>
      </div>

      {/* Masonry-Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {galleryItems.map((item, idx) => {
          const title = lang === 'ml' ? item.titleMl || item.titleEn : item.titleEn || item.titleMl;
          const caption =
            lang === 'ml' ? item.captionMl || item.captionEn : item.captionEn || item.captionMl;

          return (
            <motion.div
              key={item.id || idx}
              whileHover={{ y: -4 }}
              onClick={() => {
                feedback('pop');
                setActivePhoto(item);
              }}
              className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm cursor-pointer"
            >
              <img
                src={item.imageURL}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white space-y-1">
                <h4 className="text-sm font-bold truncate">{title}</h4>
                {caption && <p className="text-[11px] text-gray-300 line-clamp-1">{caption}</p>}
              </div>

              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full bg-[#0c1512] rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl space-y-3"
            >
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  setActivePhoto(null);
                }}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-h-[70vh] flex items-center justify-center bg-black">
                <img
                  src={activePhoto.imageURL}
                  alt={activePhoto.titleEn}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>

              <div className="p-4 sm:p-6 text-white space-y-1">
                <h3 className="text-lg font-bold">
                  {lang === 'ml' ? activePhoto.titleMl || activePhoto.titleEn : activePhoto.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300">
                  {lang === 'ml'
                    ? activePhoto.captionMl || activePhoto.captionEn
                    : activePhoto.captionEn}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

