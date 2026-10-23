import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Sparkles,
  HeartHandshake,
  RotateCcw,
  Check,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';

export default function StudentAdabPledgeModal({ onPledgeStatusChange }) {
  const { pledgeCovenant } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  const [studentName, setStudentName] = useState('');
  const [checkedPromises, setCheckedPromises] = useState({});
  const [pledgeData, setPledgeData] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('adsa-dining-pledge');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPledgeData(parsed);
        if (onPledgeStatusChange) onPledgeStatusChange(true);
      }
    } catch (_) {}
  }, [onPledgeStatusChange]);

  const handleTogglePromise = (id) => {
    feedback('tick');
    setCheckedPromises((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allChecked =
    pledgeCovenant.every((p) => checkedPromises[p.id]) && studentName.trim().length >= 2;

  const handleSealPledge = () => {
    if (!allChecked) {
      dialog.toast.warning(
        'അപൂർണ്ണം',
        'ദയവായി എല്ലാ പ്രതിജ്ഞകളും അംഗീകരിക്കുകയും നിങ്ങളുടെ പേര് നൽകുകയും ചെയ്യുക.'
      );
      return;
    }

    feedback('success');
    const newPledge = {
      name: studentName.trim(),
      date: new Date().toLocaleDateString('ml-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timestamp: Date.now(),
    };

    localStorage.setItem('adsa-dining-pledge', JSON.stringify(newPledge));
    setPledgeData(newPledge);
    if (onPledgeStatusChange) onPledgeStatusChange(true);

    dialog.toast.success(
      'ഉടമ്പടി സ്വീകരിക്കപ്പെട്ടു!',
      'ദർസിന്റെ പവിത്രമായ തീൻമേശ അദബുകൾ പാലിക്കാൻ നിങ്ങൾ പ്രതിജ്ഞയെടുത്തു.'
    );
  };

  const handleResetPledge = async () => {
    const confirmed = await dialog.confirm({
      title: 'പുതിയ പ്രതിജ്ഞ?',
      message: 'നിലവിലുള്ള പ്രതിജ്ഞാ റെക്കോർഡ് മാറ്റി പുതിയതായി ഒപ്പുവെക്കണോ?',
      confirmText: 'അതെ, മാറ്റി ഒപ്പുവെക്കാം',
      cancelText: 'റദ്ദാക്കുക',
      confirmColor: 'emerald',
    });

    if (confirmed) {
      localStorage.removeItem('adsa-dining-pledge');
      setPledgeData(null);
      setCheckedPromises({});
      setStudentName('');
      if (onPledgeStatusChange) onPledgeStatusChange(false);
    }
  };

  return (
    <section id="adab-pledge" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>വിദ്യാർത്ഥിയുടെ അദബ് ഉടമ്പടി</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          തീൻമേശ അദബിന്റെ പവിത്ര പ്രതിജ്ഞ
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam">
          അറിവ് തേടുന്ന ഒരു മുത്തഅല്ലിമിന്റെ തീൻമേശ ആത്മീയതയുടെയും നന്ദിയുടെയും സങ്കേതമായിരിക്കുമെന്ന ഡിജിറ്റൽ ഉടമ്പടി.
        </p>
      </div>

      {pledgeData ? (
        /* Sealed Covenant Display Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-50/90 via-emerald-50/60 to-amber-50/80 dark:from-[#10241d] dark:via-[#091b15] dark:to-[#122b22] border-2 border-amber-500/40 shadow-xl text-center relative overflow-hidden"
        >
          {/* Golden Seal Emblem */}
          <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border-2 border-amber-500/50 mx-auto flex items-center justify-center mb-5 shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            ഔദ്യോഗികമായി സ്വീകരിക്കപ്പെട്ടു
          </span>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-malayalam mt-4">
            അദബിന്റെ ഉടമ്പടിയിൽ ഒപ്പുവെച്ചയാൾ
          </h3>

          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 font-malayalam mt-2">
            {pledgeData.name}
          </p>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-malayalam mt-1">
            തീയതി: {pledgeData.date} • ആലത്തൂർപടി ദർസ്
          </p>

          <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-malayalam max-w-lg mx-auto mt-6 leading-relaxed bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-emerald-500/20">
            &ldquo;താങ്കൾ ദർസിന്റെ ഓരോ വറ്റിനെയും ആദരിക്കുമെന്നും, പാചകക്കാരെ സ്നേഹിക്കുമെന്നും, തിരുനബി ﷺ യുടെ തീൻമേശ ചര്യകൾ ജീവിതത്തിൽ പാലിക്കുമെന്നും പ്രതിജ്ഞയെടുത്തിരിക്കുന്നു. നാഥൻ തുണക്കട്ടെ.&rdquo;
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetPledge}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>പ്രതിജ്ഞ പുതുക്കുക</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* Interactive Pledge Form */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1814] border border-gray-200 dark:border-white/10 shadow-lg">
          <div className="mb-6">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 font-malayalam mb-2">
              വിദ്യാർത്ഥിയുടെ പേര് (നിങ്ങളുടെ പേര് നൽകുക):
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="ഉദാ: മുഹമ്മദ് യാസീൻ"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-malayalam text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-3 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-malayalam">
              താഴെ പറയുന്ന 5 വാഗ്ദാനങ്ങൾ പരിശോധിച്ച് ടിക്ക് ചെയ്യുക:
            </p>
            {pledgeCovenant.map((item, idx) => {
              const isChecked = Boolean(checkedPromises[item.id]);

              return (
                <div
                  key={item.id}
                  onClick={() => handleTogglePromise(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-emerald-500/30'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 text-white'
                        : 'border border-gray-300 dark:border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-malayalam leading-relaxed">
                    {item.textMl}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Golden Seal Button */}
          <div className="text-center">
            <button
              type="button"
              disabled={!allChecked}
              onClick={handleSealPledge}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-extrabold font-malayalam transition-all active:scale-95 shadow-md ${
                allChecked
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white shadow-glow-emerald cursor-pointer'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>ഉടമ്പടിയിൽ ഒപ്പുവെക്കുക (Seal the Adab Pledge)</span>
            </button>
            {!allChecked && (
              <p className="text-[11px] text-gray-400 mt-2 font-malayalam">
                എല്ലാ 5 കാര്യങ്ങളും ടിക്ക് ചെയ്യുകയും പേര് രേഖപ്പെടുത്തുകയും വേണം.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
