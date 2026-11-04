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
  Plus,
  Lock,
  Edit2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import { getBatchTheme } from '../../utils/batchTheme';
import IslamicAvatar from '../ui/IslamicAvatar';
import AddContactModal from './AddContactModal';
import RequestProfileChangeModal from './RequestProfileChangeModal';
import PhotoViewerModal from './PhotoViewerModal';
import {
  cancelProfileChangeRequest,
  studentRemoveApprovedPhoto,
} from '../../utils/studentProfileRequestService';

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
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const [copiedField, setCopiedField] = useState(null);
  const [addContactType, setAddContactType] = useState(null); // 'phone' | 'email' | null
  const [changeRequestType, setChangeRequestType] = useState(null); // 'phone' | 'email' | 'name' | null
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  const tokenNo = student.tokenNo;
  const nameEn = student.nameEn || student.name || `Token ${tokenNo}`;
  const nameMl = student.nameMl;
  const uname = student.username || student.uname;
  const batch = student.batch || 'General';
  const phone = student.phone || student.mobile;
  const email = student.email;

  const pendingPhone = student.pendingPhoneRequest?.status === 'pending'
    ? student.pendingPhoneRequest
    : null;
  const pendingEmail = student.pendingEmailRequest?.status === 'pending'
    ? student.pendingEmailRequest
    : null;
  const pendingName = student.pendingNameRequest?.status === 'pending'
    ? student.pendingNameRequest
    : null;

  const batchTheme = getBatchTheme(batch);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    feedback('tick');
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleCancelRequest = async (type, requestId) => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'അപേക്ഷ റദ്ദാക്കണോ?' : 'Cancel Change Request?',
      message:
        language === 'ml'
          ? 'ഈ മാറ്റത്തിനുള്ള നിങ്ങളുടെ അപേക്ഷ റദ്ദാക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?'
          : `Are you sure you want to cancel your pending ${type} change request?`,
      confirmText: language === 'ml' ? 'അതെ, റദ്ദാക്കുക' : 'Yes, Cancel Request',
      confirmColor: 'rose',
    });

    if (confirmed) {
      try {
        const studentId = student.documentId || student.id;
        await cancelProfileChangeRequest({ requestId, studentId, type });
        feedback('pop');
        dialog.toast.info('Request Cancelled', 'Your pending change request was withdrawn.');
      } catch (err) {
        console.error('Cancel request error:', err);
        dialog.alert({ type: 'error', title: 'Error', message: err.message });
      }
    }
  };

  const handleRemovePhoto = async () => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'ചിത്രം ഒഴിവാക്കണോ?' : 'Remove Profile Photo?',
      message:
        language === 'ml'
          ? 'നിങ്ങളുടെ പ്രൊഫൈൽ ഫോട്ടോ നീക്കം ചെയ്ത് സാധാരണ അവതാറിലേക്ക് മാറ്റണോ?'
          : 'Are you sure you want to remove your approved photo and revert to the default Islamic calligraphy token badge?',
      confirmText: language === 'ml' ? 'അതെ, ഒഴിവാക്കുക' : 'Yes, Remove Photo',
      confirmColor: 'rose',
    });

    if (confirmed) {
      try {
        const studentId = student.documentId || student.id;
        await studentRemoveApprovedPhoto({
          studentId,
          tokenNo: student.tokenNo,
          studentName: student.nameEn || student.name,
        });
        feedback('pop');
        dialog.toast.info('Photo Removed', 'Reverted to standard calligraphic avatar.');
        setPhotoViewerOpen(false);
      } catch (err) {
        console.error('Remove photo error:', err);
        dialog.alert({ type: 'error', title: 'Error', message: err.message });
      }
    }
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
          {/* Avatar with Click to View & Camera Overlay */}
          <div className="relative group">
            <IslamicAvatar
              student={student}
              size={92}
              showStatusRing
              interactive
              onClick={() => {
                feedback('tick');
                setPhotoViewerOpen(true);
              }}
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

          {/* Student Identity Information */}
          <div className="mt-3.5 space-y-2 w-full px-2">
            {/* 1. Dedicated Top Badge Row: Token Pill & Batch Pill */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-lg ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border} shadow-xs`}>
                #{tokenNo}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                <Layers className="w-3 h-3 opacity-80" />
                <span>{batch}</span>
              </span>
            </div>

            {/* 2. Full Student English Name with Integrated Inline Edit Button */}
            <div className="text-center px-1">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug break-words">
                <span>{nameEn}</span>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setChangeRequestType('name');
                  }}
                  className="inline-flex items-center justify-center align-middle ml-1.5 p-1 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Request Name Change"
                  aria-label="Request Name Change"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </h2>

              {/* 3. Malayalam Name (Wrapped naturally) */}
              {nameMl && (
                <p className="text-xs font-malayalam text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed break-words mt-0.5">
                  {nameMl}
                </p>
              )}
            </div>

            {/* 4. Username Handle Row */}
            {uname && (
              <div className="flex items-center justify-center pt-0.5">
                <button
                  type="button"
                  onClick={() => handleCopy(`@${uname}`, 'uname')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/30 transition-colors"
                  title="Copy Username"
                >
                  <span>@{uname}</span>
                  {copiedField === 'uname' ? (
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-60" />
                  )}
                </button>
              </div>
            )}

            {/* 5. Pending Name Change Alert Banner */}
            {pendingName && (
              <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-1 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    Name Change: <strong>{pendingName.requestedValue?.nameEn}</strong> (Under Review)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelRequest('name', pendingName.requestId)}
                  className="text-[10px] text-rose-500 hover:underline shrink-0 font-bold ml-1"
                >
                  Cancel
                </button>
              </div>
            )}
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
      <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Contact Channels
          </span>
          <span className="text-[10px] text-gray-400">Login Enabled</span>
        </div>

        {/* Phone Channel */}
        <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {phone ? (
                <span className="font-mono font-medium text-gray-800 dark:text-gray-200 truncate">
                  {phone}
                </span>
              ) : (
                <span className="text-gray-400 italic">No phone registered</span>
              )}
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
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setChangeRequestType('phone');
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-0.5"
                  title="Request Phone Change"
                >
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>Change</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setAddContactType('phone');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>Add Phone</span>
              </button>
            )}
          </div>

          {/* Pending Phone Change Banner */}
          {pendingPhone && (
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span className="truncate">
                Pending: <strong>{pendingPhone.requestedValue}</strong> (Review)
              </span>
              <button
                type="button"
                onClick={() => handleCancelRequest('phone', pendingPhone.requestId)}
                className="text-rose-500 hover:underline font-bold shrink-0 ml-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Email Channel */}
        <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              {email ? (
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                  {email}
                </span>
              ) : (
                <span className="text-gray-400 italic">No email registered</span>
              )}
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
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setChangeRequestType('email');
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-0.5"
                  title="Request Email Change"
                >
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>Change</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setAddContactType('email');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>Add Email</span>
              </button>
            )}
          </div>

          {/* Pending Email Change Banner */}
          {pendingEmail && (
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span className="truncate">
                Pending: <strong>{pendingEmail.requestedValue}</strong> (Review)
              </span>
              <button
                type="button"
                onClick={() => handleCancelRequest('email', pendingEmail.requestId)}
                className="text-rose-500 hover:underline font-bold shrink-0 ml-1"
              >
                Cancel
              </button>
            </div>
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

      {/* Interactive Modals */}
      {addContactType && (
        <AddContactModal
          isOpen={Boolean(addContactType)}
          onClose={() => setAddContactType(null)}
          type={addContactType}
          student={student}
        />
      )}

      {changeRequestType && (
        <RequestProfileChangeModal
          isOpen={Boolean(changeRequestType)}
          onClose={() => setChangeRequestType(null)}
          type={changeRequestType}
          student={student}
        />
      )}

      {photoViewerOpen && (
        <PhotoViewerModal
          isOpen={photoViewerOpen}
          onClose={() => setPhotoViewerOpen(false)}
          student={student}
          onOpenUploadModal={onOpenPhotoModal}
          onRemovePhoto={handleRemovePhoto}
        />
      )}
    </div>
  );
}
