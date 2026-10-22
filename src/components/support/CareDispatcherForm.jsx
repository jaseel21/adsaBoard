import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Lock,
  Leaf,
  Clock,
  Receipt,
  Cpu,
  Sparkles,
  Send,
  CheckCircle2,
  Copy,
  AlertCircle,
  UploadCloud,
  X,
  User,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_URGENCIES,
  createSupportTicket,
} from '../../utils/supportTicketService';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import { DataOfOne } from '../../store/StudentData';
import { AuthContext } from '../../store/AuthContext';
import CareSatisfactionSlider from './CareSatisfactionSlider';
import CareTagCloud from './CareTagCloud';

const CATEGORY_ICONS = {
  food_quality: Utensils,
  token_lock: Lock,
  dietary: Leaf,
  cutoff_timing: Clock,
  billing: Receipt,
  technical: Cpu,
  general_suggestion: Sparkles,
};

export default function CareDispatcherForm({ onTicketCreated, onNavigateTrack }) {
  const { t } = useLanguage();
  const { stdata } = useContext(DataOfOne);
  const { user, staffProfile } = useContext(AuthContext);

  // Form State
  const [category, setCategory] = useState('food_quality');
  const [urgency, setUrgency] = useState('normal');
  const [rating, setRating] = useState(4);
  const [selectedTags, setSelectedTags] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tokenNumber, setTokenNumber] = useState('');
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [phone, setPhone] = useState('');
  const [attachment, setAttachment] = useState(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-detect student or admin session
  useEffect(() => {
    if (stdata) {
      setTokenNumber(String(stdata.id || stdata.tokenNo || ''));
      setName(stdata.name || '');
      setBatch(stdata.batch || '');
      setPhone(stdata.phone || '');
    } else if (staffProfile) {
      setName(staffProfile.name || staffProfile.email || '');
      setPhone(staffProfile.phone || '');
    }
  }, [stdata, staffProfile]);

  const handleToggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      soundEngine.playCautionThud();
      setErrorMsg('Image size cannot exceed 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      soundEngine.playPop();
      hapticEngine.lightTap();
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result,
      });
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      soundEngine.playCautionThud();
      hapticEngine.mediumTick();
      setErrorMsg('Please describe your feedback, inquiry, or issue.');
      return;
    }

    try {
      setSubmitting(true);
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();

      const ticket = await createSupportTicket({
        category,
        urgency,
        rating,
        tags: selectedTags,
        subject: subject.trim() || `${SUPPORT_CATEGORIES[category]?.label || 'Inquiry'}`,
        description: description.trim(),
        isAnonymous,
        tokenNumber: tokenNumber ? parseInt(tokenNumber, 10) : null,
        name: isAnonymous ? 'Anonymous Diner' : name.trim(),
        batch: isAnonymous ? '' : batch.trim(),
        phone: isAnonymous ? '' : phone.trim(),
        attachments: attachment ? [attachment] : [],
      });

      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      setSubmittedTicket(ticket);
      if (onTicketCreated) onTicketCreated(ticket);
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      soundEngine.playCautionThud();
      hapticEngine.heavyThud();
      setErrorMsg('Failed to submit ticket. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submittedTicket?.ticketNumber) return;
    soundEngine.playPop();
    hapticEngine.lightTap();
    navigator.clipboard.writeText(submittedTicket.ticketNumber);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleReset = () => {
    soundEngine.playPop();
    setSubmittedTicket(null);
    setDescription('');
    setSubject('');
    setSelectedTags([]);
    setAttachment(null);
    setErrorMsg('');
  };

  if (submittedTicket) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 sm:p-8 flex flex-col items-center text-center bg-white dark:bg-[#0c1412] rounded-3xl border border-emerald-500/30 shadow-2xl"
      >
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-glow-emerald mb-4">
          <CheckCircle2 className="w-8 h-8 animate-bounce-short" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {t('ticketSuccessTitle', 'Request Received!')}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          {t('ticketSuccessSubtitle', 'Your ticket tracking reference code is')}
        </p>

        {/* Tracking Code Badge */}
        <div className="mt-4 flex items-center gap-2 p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-inner">
          <span className="font-mono text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
            {submittedTicket.ticketNumber}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-all border border-gray-200/60 dark:border-white/10"
            title={t('copyTrackingCode', 'Copy Reference Code')}
          >
            {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
          Saved to your device&apos;s recent history. Committee officers have been alerted.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
          {onNavigateTrack && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                onNavigateTrack(submittedTicket.ticketNumber);
              }}
              className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <span>{t('trackRequest', 'Track This Request')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200/80 dark:border-white/10 transition-all"
          >
            Submit Another
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
      {/* Category Selection Grid */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {t('categoryLabel', 'Issue / Feedback Category')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(SUPPORT_CATEGORIES).map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
            const isSelected = category === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  soundEngine.playMechanicalClick();
                  hapticEngine.lightTap();
                  setCategory(cat.id);
                }}
                className={`p-3 rounded-2xl flex flex-col items-start gap-1.5 text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {t(cat.key, cat.label)}
                  </h4>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Satisfaction Rating Slider (for Food & General categories) */}
      {(category === 'food_quality' || category === 'general_suggestion') && (
        <CareSatisfactionSlider value={rating} onChange={setRating} />
      )}

      {/* Micro-Tags Cloud */}
      <CareTagCloud selectedTags={selectedTags} onToggleTag={handleToggleTag} />

      {/* Urgency Level Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span>{t('urgencyLabel', 'Urgency Level')}</span>
          {urgency === 'critical' && (
            <span className="text-[11px] font-extrabold text-rose-500 flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> High priority queue
            </span>
          )}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(SUPPORT_URGENCIES).map((urg) => {
            const isSelected = urgency === urg.id;
            const isCritical = urg.id === 'critical';
            return (
              <button
                key={urg.id}
                type="button"
                onClick={() => {
                  if (isCritical) {
                    soundEngine.playCautionThud();
                    hapticEngine.mediumTick();
                  } else {
                    soundEngine.playPop();
                    hapticEngine.lightTap();
                  }
                  setUrgency(urg.id);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  isSelected
                    ? isCritical
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/30'
                      : 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(urg.key, urg.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description Textarea */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Details / Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide full details (e.g. meal item, timing, or specific issue)..."
          className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-none"
        />
      </div>

      {/* Student Identity Card / Anonymous Toggle */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Diner Identification</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => {
                soundEngine.playPop();
                setIsAnonymous(e.target.checked);
              }}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 select-none">
              {t('submitAnonymously', 'Submit Anonymously')}
            </span>
          </label>
        </div>

        {!isAnonymous && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Token #</label>
              <input
                type="number"
                value={tokenNumber}
                onChange={(e) => setTokenNumber(e.target.value)}
                placeholder="e.g. 42"
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Academic Batch</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. Batch 2024 / Sanaviya 2"
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Phone (WhatsApp)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98470..."
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Attachment Upload Field */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Evidence / Photo Attachment (Optional)
        </label>
        {attachment ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={attachment.url}
                alt="Upload preview"
                className="w-10 h-10 rounded-xl object-cover border border-emerald-400/40"
              />
              <span className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">
                {attachment.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                setAttachment(null);
              }}
              className="p-1.5 rounded-xl text-gray-400 hover:text-rose-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 cursor-pointer transition-all">
            <UploadCloud className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Attach food photo, payment slip, or screenshot (Max 5MB)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submit Action */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
      >
        <Send className="w-4 h-4" />
        <span>{submitting ? t('submittingTicket', 'Transmitting...') : t('submitTicketBtn', 'Send to Canteen Committee')}</span>
      </button>
    </form>
  );
}
