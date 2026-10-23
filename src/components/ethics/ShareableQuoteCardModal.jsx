import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Sparkles, MessageCircle } from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';

export default function ShareableQuoteCardModal({ quote, isOpen, onClose }) {
  const { feedback } = useFeedback();

  if (!isOpen || !quote) return null;

  const shareText = `🌟 *${quote.scholarNameMl}*\n📖 ${quote.sourceBook}\n\n«${quote.quoteAr}»\n\n"${quote.quoteMl}"\n\n🔗 ADSA T-Board • ആലത്തൂർപടി ദർസ്\nhttps://canteen.alathurpadidars.in/adab`;

  const handleCopyText = () => {
    feedback('tick');
    navigator.clipboard?.writeText(shareText);
    dialog.toast.success('കോപ്പി ചെയ്തു', 'വാട്സ്ആപ്പ് സന്ദേശം ക്ലിപ്പ്ബോർഡിലേക്ക് പകർത്തി.');
  };

  const handleShareWhatsApp = () => {
    feedback('tick');
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0c1814] rounded-3xl border border-emerald-500/30 shadow-2xl p-6 sm:p-8 overflow-hidden"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              സ്റ്റാറ്റസ് കാർഡ്
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-malayalam mt-2">
              ജ്ഞാനമൊഴി പങ്കുവെക്കുക
            </h3>
          </div>

          {/* Styled Card Preview */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900 via-[#063326] to-[#021f17] text-white border border-emerald-500/30 shadow-md text-center relative">
            <p className="font-arabic text-lg sm:text-xl text-emerald-100 font-medium leading-relaxed select-none mb-4">
              {quote.quoteAr}
            </p>

            <p className="text-xs sm:text-sm text-emerald-50 font-malayalam leading-relaxed">
              &ldquo;{quote.quoteMl}&rdquo;
            </p>

            <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300 font-malayalam">
              <span>{quote.scholarNameMl}</span>
              <span>{quote.sourceBook}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യുക</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>ടെക്സ്റ്റ് കോപ്പി</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
