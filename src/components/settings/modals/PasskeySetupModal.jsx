import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  KeyRound,
  Fingerprint,
  Smartphone,
  Laptop,
  Check,
  Trash2,
  Plus,
  AlertTriangle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import firebase from '../../../firebase/config';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import {
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
  registerPasskey,
} from '../../../utils/passkeyService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../../utils/auditLogger';

export default function PasskeySetupModal({
  isOpen,
  onClose,
  userType = 'student', // 'student' | 'staff'
  userData,
  onPasskeysUpdated,
}) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const [passkeys, setPasskeys] = useState([]);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsSupported(isPasskeySupported());
      isPlatformAuthenticatorAvailable().then(setHasBiometrics).catch(() => {});
      setPasskeys(Array.isArray(userData?.passkeys) ? userData.passkeys : []);
      setErrorMsg('');
      setSuccessMsg('');
      setDeviceLabel('');
    }
  }, [isOpen, userData]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleRegisterNewPasskey = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isSupported) {
      setErrorMsg(
        language === 'ml'
          ? 'ഈ ബ്രൗസറിൽ പാസ്‌കീ സപ്പോർട്ട് ലഭ്യമല്ല.'
          : 'Passkeys are not supported on this browser.'
      );
      return;
    }

    setIsLoading(true);
    feedback('tick');

    try {
      const docId = userData?.documentId || userData?.id || userData?.uid;
      const userName = userType === 'student' ? `Token #${userData?.tokenNo}` : userData?.email;

      // Trigger WebAuthn Registration Ceremony
      const credentialRecord = await registerPasskey({
        userId: docId,
        userName,
        userDisplayName: userData?.name || userName,
        authenticatorAttachment: hasBiometrics ? 'platform' : undefined,
      });

      // Default label if empty
      const label =
        deviceLabel.trim() ||
        (hasBiometrics
          ? 'Personal Device (Biometrics)'
          : `Device Key ${new Date().toLocaleDateString()}`);

      const newPasskeyEntry = {
        ...credentialRecord,
        deviceLabel: label,
      };

      const updatedList = [...passkeys, newPasskeyEntry];
      const updatedIds = updatedList.map((p) => p.id).filter(Boolean);

      // Save to Firestore
      const collectionName = userType === 'student' ? 'students' : 'staff_users';
      await firebase.firestore().collection(collectionName).doc(docId).update({
        passkeys: updatedList,
        passkeyIds: updatedIds,
        lastPasskeyAddedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setPasskeys(updatedList);
      setDeviceLabel('');

      logAuditEvent({
        action: 'PASSKEY_REGISTERED',
        category: AUDIT_CATEGORIES.SECURITY,
        severity: AUDIT_SEVERITIES.INFO,
        actor: {
          uid: docId,
          displayName: userName,
          role: userType,
        },
        details: { deviceLabel: label },
      }).catch(() => {});

      if (onPasskeysUpdated) {
        onPasskeysUpdated(updatedList);
      }

      soundEngine.playCelebrationFanfare();
      hapticEngine.successPulse();
      setSuccessMsg(
        language === 'ml'
          ? 'പാസ്‌കീ വിജയകരമായി ചേർത്തു!'
          : 'Passkey registered successfully!'
      );
    } catch (err) {
      console.error('Passkey creation error:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMsg(
          language === 'ml'
            ? 'രജിസ്ട്രേഷൻ റദ്ദാക്കി അല്ലെങ്കിൽ സമയം കഴിഞ്ഞു.'
            : 'Registration cancelled or timed out.'
        );
      } else {
        setErrorMsg(err.message || 'Failed to create passkey.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePasskey = async (passkeyId) => {
    setIsLoading(true);
    feedback('tick');

    try {
      const updatedList = passkeys.filter((p) => p.id !== passkeyId);
      const updatedIds = updatedList.map((p) => p.id).filter(Boolean);
      const docId = userData?.documentId || userData?.id || userData?.uid;
      const collectionName = userType === 'student' ? 'students' : 'staff_users';

      await firebase.firestore().collection(collectionName).doc(docId).update({
        passkeys: updatedList,
        passkeyIds: updatedIds,
      });

      setPasskeys(updatedList);
      if (onPasskeysUpdated) {
        onPasskeysUpdated(updatedList);
      }

      soundEngine.playTrashBin();
      hapticEngine.lightTap();
    } catch (err) {
      console.error('Passkey delete error:', err);
      setErrorMsg('Failed to remove passkey.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ml' ? 'പാസ്‌കീ & ബയോമെട്രിക്സ്' : 'Passkeys & Biometrics'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ml' ? 'FIDO2 / വെബ് ഓതന്റിക്കേഷൻ' : 'FIDO2 / WebAuthn Passwordless Sign-In'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dars Lab Shared PC Notice */}
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{language === 'ml' ? 'ദർസ് ലാബ് കമ്പ്യൂട്ടറുകൾക്കുള്ള ശ്രദ്ധ' : 'Important for Dars Lab Shared PCs'}</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
              {language === 'ml'
                ? 'നിങ്ങളുടെ സ്വന്തം മൊബൈൽ ഫോൺ അല്ലെങ്കിൽ സ്വകാര്യ ലാപ്ടോപ്പിൽ മാത്രമേ ബയോമെട്രിക്സ് രജിസ്റ്റർ ചെയ്യാവൂ. ലാബിലെ പൊതു കമ്പ്യൂട്ടറുകളിൽ ഐഡിയും പാസ്‌വേഡും ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക.'
                : 'Only register device biometrics on your personal mobile phone or laptop. On shared Dars lab PCs, continue using your Token ID and Password.'}
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* List of Registered Passkeys */}
          <div className="mt-5 space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{language === 'ml' ? 'രജിസ്റ്റർ ചെയ്ത പാസ്‌കീകൾ' : 'Registered Passkeys'}</span>
              <span className="text-[11px] font-normal text-slate-400">{passkeys.length} total</span>
            </div>

            {passkeys.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
                {language === 'ml'
                  ? 'ഇതുവരെ പാസ്‌കീകൾ ചേർത്തിട്ടില്ല.'
                  : 'No passkeys registered yet on this account.'}
              </div>
            ) : (
              <div className="space-y-2">
                {passkeys.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.deviceLabel || 'Registered Passkey'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePasskey(p.id)}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove Passkey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Passkey Form */}
          <form onSubmit={handleRegisterNewPasskey} className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'ml' ? 'ഡിവൈസ് പേര് (ഓപ്ഷണൽ)' : 'Device Name / Label (Optional)'}
              </label>
              <input
                type="text"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
                placeholder="e.g. My iPhone 15 / Personal Laptop"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isSupported}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>{language === 'ml' ? 'രജിസ്റ്റർ ചെയ്യുന്നു...' : 'Registering...'}</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ml' ? 'പുതിയ പാസ്‌കീ ചേർക്കുക' : 'Register New Passkey / Biometrics'}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
