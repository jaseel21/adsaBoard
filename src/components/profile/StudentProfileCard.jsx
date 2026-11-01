import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Ban,
  Receipt,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Camera,
  Clock,
  LogOut,
  Layers,
  X,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getBatchTheme } from '../../utils/batchTheme';
import IslamicAvatar from '../ui/IslamicAvatar';

export default function StudentProfileCard({
  student = {},
  fineDue = 0,
  isBlocked = false,
  isTomorrowLocked = false,
  endTime = '21:00',
  onOpenPhotoModal,
  onSafeLogout,
  onSafeBack,
  onClose,
  className = '',
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [copiedField, setCopiedField] = useState(null);

  const tokenNo = student.tokenNo;
  const nameEn = student.nameEn || student.name || `Token ${tokenNo}`;
  const nameMl = student.nameMl;
  const uname = student.username || student.uname;
  const batch = student.batch || 'General';
  const phone = student.phone || student.mobile;
  const email = student.email;

  const batchTheme = getBatchTheme(batch);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    feedback('tick');
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div
      className={`rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-gray-200/80 dark:border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col ${className}`}
    >
      {/* Profile Header with Close Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
            My Profile
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 1. Student Identity Header */}
      <div className="relative p-5 pb-4 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 border-b border-gray-100 dark:border-white/5">
        <div className="flex flex-col items-center text-center relative z-10">
          {/* Avatar with Camera Overlay Trigger */}
          <div className="relative group">
            <IslamicAvatar
              student={student}
              size={92}
              showStatusRing
              interactive
              onClick={onOpenPhotoModal}
            />

            <button
              type="button"
              onClick={onOpenPhotoModal}
              className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 border-2 border-white dark:border-[#0f1715] transition-all transform active:scale-90"
              title="Change Profile Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Student Names & Batch */}
          <div className="mt-3.5 space-y-1 w-full px-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-lg ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border} shadow-xs`}>
                #{tokenNo}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white tracking-tight truncate max-w-[220px]">
                {nameEn}
              </h2>
            </div>

            {nameMl && (
              <p className="text-xs font-malayalam text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                {nameMl}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                <Layers className="w-3 h-3 opacity-80" />
                <span>{batch}</span>
              </span>

              {uname && (
                <button
                  type="button"
                  onClick={() => handleCopy(`@${uname}`, 'uname')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 transition-colors"
                  title="Copy Username"
                >
                  <span>@{uname}</span>
                  {copiedField === 'uname' ? (
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-60" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Standing & Governance Status */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Account Standing
          </span>
          {isBlocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <Ban className="w-3 h-3 text-rose-500" />
              <span>Suspended</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Active</span>
            </span>
          )}
        </div>

        {/* Fine Due Highlight if Blocked */}
        {isBlocked ? (
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-red-500/15 to-amber-500/15 border border-rose-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-rose-950 dark:text-rose-200">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                <span>Fine Payable:</span>
              </span>
              <span className="font-mono text-sm font-black px-2 py-0.5 rounded-md bg-white dark:bg-black/40 text-rose-600 dark:text-rose-400">
                ₹{fineDue}
              </span>
            </div>
            <p className="text-[10px] text-rose-900/80 dark:text-rose-300/80">
              Pay at ADSA Canteen Office to restore dining access.
            </p>
          </div>
        ) : (
          /* Daily Cutoff Radar Mini */
          <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-black/20 p-2 rounded-xl border border-gray-100 dark:border-white/5">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className={`w-3.5 h-3.5 ${!isTomorrowLocked ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span>Cutoff {endTime} IST</span>
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                !isTomorrowLocked
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              {!isTomorrowLocked ? 'Tomorrow Open' : 'Tomorrow Locked'}
            </span>
          </div>
        )}
      </div>

      {/* 3. Communication & Contact Channels */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
          Contact Channels
        </span>

        {/* Phone */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
              {phone || 'No phone registered'}
            </span>
          </div>

          {phone ? (
            <div className="flex items-center gap-1">
              <a
                href={`tel:${phone}`}
                className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                title="Call Student"
              >
                <Phone className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(phone, 'phone')}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                title="Copy Phone"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Optional</span>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
              {email || 'No email registered'}
            </span>
          </div>

          {email ? (
            <div className="flex items-center gap-1">
              <a
                href={`mailto:${email}`}
                className="p-1 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                title="Send Email"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => handleCopy(email, 'email')}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                title="Copy Email"
              >
                {copiedField === 'email' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Optional</span>
          )}
        </div>
      </div>

      {/* 4. Official Notice & Logout Footer */}
      <div className="p-4 bg-gray-50/70 dark:bg-white/[0.02] space-y-3 mt-auto">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>Official student record managed by Central Committee.</span>
        </div>

        <button
          type="button"
          onClick={onSafeLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200/60 dark:border-rose-500/20 transition-all active:scale-95"
          title="Sign out of student account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('navLogout') || 'Log Out'}</span>
        </button>
      </div>
    </div>
  );
}
