import React, { useState } from 'react';
import {
  UserCheck,
  KeyRound,
  LogOut,
  ShieldCheck,
  Mail,
  User,
  Sparkles,
  Hash,
  Phone,
  LogIn,
  AtSign,
  Camera,
  Trash2,
  Eye,
  Lock,
  Plus,
  Edit2,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  Fingerprint,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import firebase from '../../../firebase/config';
import ChangePinModal from '../modals/ChangePinModal';
import EditUsernameModal from '../modals/EditUsernameModal';
import TwoFactorSetupModal from '../modals/TwoFactorSetupModal';
import PasskeySetupModal from '../modals/PasskeySetupModal';
import { getBatchTheme } from '../../../utils/batchTheme';
import IslamicAvatar from '../../ui/IslamicAvatar';

import PhotoViewerModal from '../../profile/PhotoViewerModal';
import PhotoUploadModal from '../../profile/PhotoUploadModal';
import AddContactModal from '../../profile/AddContactModal';
import RequestProfileChangeModal from '../../profile/RequestProfileChangeModal';
import {
  cancelProfileChangeRequest,
  studentRemoveApprovedPhoto,
} from '../../../utils/studentProfileRequestService';
import { cancelPhotoRequest } from '../../../utils/photoModerationService';

export default function AccountProfileSection({
  user,
  role,
  roleBadge,
  staffProfile,
  stdata,
  setStdata,
  logoutStudent,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();
  const navigate = useNavigate();

  // Modals state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [targetAuthUserType, setTargetAuthUserType] = useState('student'); // 'student' | 'staff'
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [addContactType, setAddContactType] = useState(null); // 'phone' | 'email' | null
  const [changeRequestType, setChangeRequestType] = useState(null); // 'phone' | 'email' | 'name' | null
  const [copiedField, setCopiedField] = useState(null);

  const isStudent = Boolean(stdata?.tokenNo);
  const isStaff = Boolean(user);
  const batchTheme = getBatchTheme(stdata?.batch);

  const pendingPhoto = stdata?.pendingPhotoRequest?.status === 'pending'
    ? stdata.pendingPhotoRequest
    : null;
  const pendingPhone = stdata?.pendingPhoneRequest?.status === 'pending'
    ? stdata.pendingPhoneRequest
    : null;
  const pendingEmail = stdata?.pendingEmailRequest?.status === 'pending'
    ? stdata.pendingEmailRequest
    : null;
  const pendingName = stdata?.pendingNameRequest?.status === 'pending'
    ? stdata.pendingNameRequest
    : null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    feedback('tick');
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleLogoutAdmin = async () => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'ലോഗൗട്ട് ചെയ്യണോ?' : 'Sign Out of Committee Console?',
      message:
        language === 'ml'
          ? 'നിങ്ങൾ അഡ്മിൻ സെഷനിൽ നിന്ന് പുറത്തു കടക്കുകയാണ്.'
          : 'Are you sure you want to sign out of the ADSA Committee session?',
      confirmText: language === 'ml' ? 'അതെ, ലോഗൗട്ട്' : 'Yes, Sign Out',
      cancelText: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
      confirmColor: 'rose',
      icon: 'warning',
    });

    if (confirmed) {
      await firebase.auth().signOut();
      feedback('pop');
      dialog.toast.info('Signed Out', 'You have been safely signed out.');
      navigate('/alogin');
    }
  };

  const handleLogoutStudent = () => {
    feedback('tick');
    if (logoutStudent) logoutStudent();
    dialog.toast.info('Signed Out', 'Your student token session has been cleared.');
  };

  const handleCancelContactRequest = async (type, requestId) => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'അപേക്ഷ റദ്ദാക്കണോ?' : 'Cancel Change Request?',
      message: `Are you sure you want to cancel your pending ${type} change request?`,
      confirmText: language === 'ml' ? 'അതെ, റദ്ദാക്കുക' : 'Yes, Cancel Request',
      confirmColor: 'rose',
    });

    if (confirmed) {
      try {
        const studentId = stdata.documentId || stdata.id;
        await cancelProfileChangeRequest({ requestId, studentId, type });
        feedback('pop');
        dialog.toast.info('Request Cancelled', 'Your pending request was withdrawn.');
      } catch (err) {
        console.error('Cancel request error:', err);
        dialog.alert({ type: 'error', title: 'Error', message: err.message });
      }
    }
  };

  const handleCancelPendingPhoto = async () => {
    if (!pendingPhoto?.requestId) return;
    const confirmed = await dialog.confirm({
      title: 'Cancel Photo Submission?',
      message: 'Withdraw your pending profile photo upload from committee review?',
      confirmText: 'Yes, Cancel Submission',
      confirmColor: 'rose',
    });

    if (confirmed) {
      try {
        const studentId = stdata.documentId || stdata.id;
        await cancelPhotoRequest({ requestId: pendingPhoto.requestId, studentId });
        feedback('pop');
        dialog.toast.info('Submission Cancelled', 'Pending photo submission was withdrawn.');
      } catch (err) {
        console.error('Cancel photo error:', err);
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
        const studentId = stdata.documentId || stdata.id;
        await studentRemoveApprovedPhoto({
          studentId,
          tokenNo: stdata.tokenNo,
          studentName: stdata.nameEn || stdata.name,
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
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'അക്കൗണ്ട് & ഐഡന്റിറ്റി' : 'Account & Identity'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'വിദ്യാർത്ഥി ലോഗിൻ വിവരങ്ങൾ, പ്രൊഫൈൽ ഫോട്ടോ, പാസ്‌വേഡ് എന്നിവ ക്രമീകരിക്കുക'
            : 'Comprehensive student dining credentials, profile photo CRUD, and secure login channels'}
        </p>
      </div>

      {/* 1. STUDENT IDENTITY HERO DOSSIER */}
      {isStudent && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Avatar with click to view */}
              <div className="relative group">
                <IslamicAvatar
                  student={stdata}
                  size={68}
                  showStatusRing
                  interactive
                  onClick={() => {
                    feedback('tick');
                    setPhotoViewerOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setPhotoUploadOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-2 border-white dark:border-[#0f1715] transition-all"
                  title="Upload / Change Photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5 min-w-0">
                {/* Status Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-lg ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                    #{stdata.tokenNo}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                    {stdata.batch || 'General'}
                  </span>

                  {stdata.block ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Locked / Blocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active Diner
                    </span>
                  )}
                </div>

                {/* Full English Name with Inline Edit Trigger */}
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-snug break-words">
                    <span>{stdata.nameEn || stdata.name}</span>
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
                  </h3>

                  {stdata.nameMl && (
                    <p className="text-xs font-malayalam text-emerald-700 dark:text-emerald-400 font-semibold leading-relaxed break-words mt-0.5">
                      {stdata.nameMl}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium flex-wrap pt-0.5">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                    {stdata.batch || 'General'}
                  </span>
                  <span>•</span>
                  <span className="text-[11px] text-gray-500">Official Alathurpadi Dars Registry</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (View Photo, Change PIN, 2FA, Passkeys, Sign Out) */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => setPinModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'ml' ? 'പാസ്‌വേഡ്' : 'PIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetAuthUserType('student');
                  setTwoFactorModalOpen(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                  stdata.totpEnabled
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30'
                    : 'bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                <span>2FA</span>
                {stdata.totpEnabled && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-teal-500 text-white">ON</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetAuthUserType('student');
                  setPasskeyModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Fingerprint className="w-3.5 h-3.5 text-purple-500" />
                <span>Passkey</span>
                {stdata.passkeys?.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500 text-white">
                    {stdata.passkeys.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogoutStudent}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'പുറത്തിറങ്ങുക' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* Pending Name Change Notice */}
          {pendingName && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">
                  Pending Name Change: <strong>{pendingName.requestedValue?.nameEn}</strong> (Under Committee Review)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCancelContactRequest('name', pendingName.requestId)}
                className="text-xs text-rose-500 hover:underline font-bold shrink-0"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. PROFILE PHOTO STUDIO (CRUD) */}
      {isStudent && (
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {language === 'ml' ? 'പ്രൊഫൈൽ ഫോട്ടോ സ്റ്റുഡിയോ' : 'Profile Photo Studio'}
              </h3>
            </div>

            {/* Photo Status Pill */}
            {stdata.photoURL && !pendingPhoto ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Approved</span>
              </span>
            ) : pendingPhoto ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                <span>Review Pending</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10">
                Default Calligraphy
              </span>
            )}
          </div>

          {/* Pending Photo Banner */}
          {pendingPhoto && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {pendingPhoto.photoURL && (
                  <img
                    src={pendingPhoto.photoURL}
                    alt="Pending upload"
                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/40"
                  />
                )}
                <div>
                  <span className="font-bold block">Photo Submitted for Verification</span>
                  <span className="text-[11px] opacity-80">
                    Awaiting Central Committee approval before public activation.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelPendingPhoto}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Photo CRUD Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {stdata.photoURL && (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setPhotoViewerOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'ml' ? 'ഫോട്ടോ കാണുക' : 'View Full HD Photo'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setPhotoUploadOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {stdata.photoURL
                  ? language === 'ml'
                    ? 'ഫോട്ടോ മാറ്റുക'
                    : 'Change Photo'
                  : language === 'ml'
                  ? 'ഫോട്ടോ ചേർക്കുക'
                  : 'Upload Photo'}
              </span>
            </button>

            {stdata.photoURL && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-500/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'ഫോട്ടോ ഒഴിവാക്കുക' : 'Remove Photo'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. OMNICHANNEL LOGIN CREDENTIALS MATRIX */}
      {isStudent && (
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ml' ? 'ലോഗിൻ വിവരങ്ങൾ & കീബോർഡ്' : 'Login Credentials & Identifiers'}</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'ml'
                  ? 'ഇതിൽ ഏതെങ്കിലും വിവരവും പാസ്‌വേഡും ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം'
                  : 'All 4 credentials below are uniquely bound to your dining account'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Card 1: Token Number */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-500" />
                  <span>Token Number</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  Login Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-black text-gray-900 dark:text-white">
                  #{stdata.tokenNo}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(stdata.tokenNo, 'tokenNo')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  title="Copy Token Number"
                >
                  {copiedField === 'tokenNo' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Card 2: Username */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-emerald-500" />
                  <span>Username Handle</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  Login Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white truncate">
                  @{stdata.username || stdata.uname || `token_${stdata.tokenNo}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(`@${stdata.username || stdata.uname}`, 'username')}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    title="Copy Username"
                  >
                    {copiedField === 'username' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsernameModalOpen(true)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Mobile Phone Number */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-500" />
                  <span>Mobile Phone</span>
                </span>
                {stdata.phone ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Locked & Usable</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    Not Linked
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
                  {stdata.phone || '—'}
                </span>
                {stdata.phone ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(stdata.phone, 'phone')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                      title="Copy Phone"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangeRequestType('phone')}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-0.5"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Request Change</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddContactType('phone')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Phone</span>
                  </button>
                )}
              </div>

              {pendingPhone && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>
                    Pending: <strong>{pendingPhone.requestedValue}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancelContactRequest('phone', pendingPhone.requestId)}
                    className="text-rose-500 hover:underline font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Card 4: Email Address */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-teal-500" />
                  <span>Email Address</span>
                </span>
                {stdata.email ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Locked & Usable</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    Not Linked
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                  {stdata.email || '—'}
                </span>
                {stdata.email ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(stdata.email, 'email')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                      title="Copy Email"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangeRequestType('email')}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-0.5"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Request Change</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddContactType('email')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Email</span>
                  </button>
                )}
              </div>

              {pendingEmail && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span className="truncate">
                    Pending: <strong>{pendingEmail.requestedValue}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancelContactRequest('email', pendingEmail.requestId)}
                    className="text-rose-500 hover:underline font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. STAFF IDENTITY CARD */}
      {isStaff && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 border border-indigo-500/20 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                    {staffProfile?.displayName || user.displayName || user.email?.split('@')[0]}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      roleBadge?.badgeClass || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {roleBadge?.fullLabel || roleBadge?.label || 'Staff'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTargetAuthUserType('staff');
                  setTwoFactorModalOpen(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                  staffProfile?.totpEnabled
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30'
                    : 'bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                <span>2FA</span>
                {staffProfile?.totpEnabled && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-teal-500 text-white">ON</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetAuthUserType('staff');
                  setPasskeyModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Fingerprint className="w-3.5 h-3.5 text-purple-500" />
                <span>Passkey</span>
                {staffProfile?.passkeys?.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500 text-white">
                    {staffProfile.passkeys.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'അഡ്മിൻ ലോഗൗട്ട്' : 'Sign Out Staff'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PUBLIC GUEST SESSION CARD */}
      {!isStudent && !isStaff && (
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  {language === 'ml' ? 'അതിഥി സന്ദർശകൻ (Guest Session)' : 'Public Guest Mode'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === 'ml'
                    ? 'ഭക്ഷണ വിവരങ്ങൾ കാണുന്നതിനും ടോക്കൺ മാറ്റങ്ങൾക്കും ലോഗിൻ ചെയ്യുക'
                    : 'Sign in to access personal dining routines, date exceptions, or committee controls'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'വിദ്യാർത്ഥി ലോഗിൻ' : 'Student Sign-In'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/alogin')}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{language === 'ml' ? 'കമ്മിറ്റി കൺസോൾ' : 'Staff Portal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {isStudent && (
        <ChangePinModal
          isOpen={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          studentData={stdata}
          onPinUpdated={(newPin) => {
            if (setStdata) {
              setStdata({ ...stdata, password: newPin });
            }
          }}
        />
      )}

      {/* Username Edit Modal */}
      {isStudent && (
        <EditUsernameModal
          isOpen={usernameModalOpen}
          onClose={() => setUsernameModalOpen(false)}
          studentData={stdata}
          onUsernameUpdated={(newUsername) => {
            if (setStdata) {
              setStdata({
                ...stdata,
                username: newUsername,
                uname: newUsername,
              });
            }
          }}
        />
      )}

      {/* Photo Viewer HD Lightbox Modal */}
      {isStudent && (
        <PhotoViewerModal
          isOpen={photoViewerOpen}
          onClose={() => setPhotoViewerOpen(false)}
          student={stdata}
          onOpenUploadModal={() => setPhotoUploadOpen(true)}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      {/* Photo Upload Modal */}
      {isStudent && (
        <PhotoUploadModal
          isOpen={photoUploadOpen}
          onClose={() => setPhotoUploadOpen(false)}
          student={stdata}
        />
      )}

      {/* Add Contact Modal (Phone / Email) */}
      {isStudent && addContactType && (
        <AddContactModal
          isOpen={Boolean(addContactType)}
          onClose={() => setAddContactType(null)}
          type={addContactType}
          student={stdata}
          onSuccess={(type, val) => {
            if (setStdata) {
              setStdata({ ...stdata, [type]: val });
            }
          }}
        />
      )}

      {/* Request Profile Change Modal (Phone / Email / Name) */}
      {isStudent && changeRequestType && (
        <RequestProfileChangeModal
          isOpen={Boolean(changeRequestType)}
          onClose={() => setChangeRequestType(null)}
          type={changeRequestType}
          student={stdata}
        />
      )}

      {/* Two-Factor Authentication (2FA) Modal */}
      <TwoFactorSetupModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        userType={targetAuthUserType}
        userData={targetAuthUserType === 'student' ? stdata : staffProfile}
        onStatusUpdated={(updated) => {
          if (targetAuthUserType === 'student' && setStdata) {
            setStdata(updated);
          }
        }}
      />

      {/* Passkey / Biometrics Setup Modal */}
      <PasskeySetupModal
        isOpen={passkeyModalOpen}
        onClose={() => setPasskeyModalOpen(false)}
        userType={targetAuthUserType}
        userData={targetAuthUserType === 'student' ? stdata : staffProfile}
        onPasskeysUpdated={(newList) => {
          if (targetAuthUserType === 'student' && setStdata) {
            setStdata({ ...stdata, passkeys: newList });
          }
        }}
      />
    </div>
  );
}
