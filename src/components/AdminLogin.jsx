import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { getRoleHomeRoute } from '../utils/rbac';
import { seedSuperAdmin } from '../utils/authSeeder';
import { verifyTOTP, verifyAndConsumeBackupCode } from '../utils/totpService';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Optional 2FA states for staff
  const [pendingStaff2FA, setPendingStaff2FA] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { setUser, setRole, setStaffProfile, setLoadingAuth } = useContext(AuthContext);

  const redirectTarget = location.state?.from;
  const noticeMessage = location.state?.notice;

  const completeAdminLogin = ({ userCredential, staffRole, staffName, resolvedProfile }) => {
    // Optimistically synchronize AuthContext so downstream route guards have active role immediately
    if (setUser) setUser(userCredential.user);
    if (setStaffProfile && resolvedProfile) setStaffProfile(resolvedProfile);
    if (setRole) setRole(staffRole);
    if (setLoadingAuth) setLoadingAuth(false);

    // Log successful security audit event in the background (non-blocking)
    logAuditEvent({
      category: AUDIT_CATEGORIES.SECURITY,
      action: 'ADMIN_LOGIN',
      severity: AUDIT_SEVERITIES.NOTICE,
      actor: {
        uid: userCredential.user?.uid || 'admin',
        email: userCredential.user?.email || email.trim(),
        displayName: staffName || email.split('@')[0],
        role: staffRole,
      },
      target: { type: 'system', id: 'admin-auth', label: 'Admin Session Login' },
      changes: {
        diffSummary: `Staff authenticated dynamically as ${staffRole} (${email})`,
      },
    }).catch(console.warn);

    feedback('success');

    // Smart routing
    const destination = redirectTarget || getRoleHomeRoute(staffRole) || '/admin';
    navigate(destination, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      dialog.alert({
        type: 'warning',
        title: 'Missing Credentials',
        message: 'Please enter both your email address and password.',
      });
      return;
    }

    setLoading(true);
    feedback('tick');

    try {
      // Enforce session persistence on public computers
      if (firebase.auth.Auth && firebase.auth.Auth.Persistence) {
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
      }

      // Signal in AuthContext that authentication is in-flight
      if (setLoadingAuth) setLoadingAuth(true);

      // Authenticate with Firebase Authentication
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email.trim(), password);

      // Determine authenticated user's role dynamically from Firestore staff_users
      let staffRole = null;
      let staffName = userCredential.user?.displayName;
      let isActiveStaff = false;
      let resolvedProfile = null;

      try {
        // 1. Direct UID lookup (single fast document read)
        const staffDoc = await firebase
          .firestore()
          .collection('staff_users')
          .doc(userCredential.user.uid)
          .get();

        if (staffDoc.exists) {
          const sData = staffDoc.data();
          if (sData.status === 'active' && sData.role) {
            staffRole = sData.role;
            staffName = sData.displayName || staffName;
            isActiveStaff = true;
            resolvedProfile = sData;
          }
        } else {
          // 2. Check dynamic Super Admin seeding if not yet created
          const seeded = await seedSuperAdmin(userCredential.user);
          if (seeded && seeded.role && seeded.status === 'active') {
            staffRole = seeded.role;
            staffName = seeded.displayName || staffName;
            isActiveStaff = true;
            resolvedProfile = seeded;
          } else {
            // 3. Fallback email lookup in staff_users
            const emailQuery = await firebase
              .firestore()
              .collection('staff_users')
              .where('email', '==', email.trim().toLowerCase())
              .limit(1)
              .get();

            if (!emailQuery.empty) {
              const matchedDoc = emailQuery.docs[0];
              const matchedData = matchedDoc.data();
              if (matchedData.status === 'active' && matchedData.role) {
                staffRole = matchedData.role;
                staffName = matchedData.displayName || staffName;
                isActiveStaff = true;
                resolvedProfile = {
                  ...matchedData,
                  uid: userCredential.user.uid,
                };
                // Link UID asynchronously in background
                firebase
                  .firestore()
                  .collection('staff_users')
                  .doc(userCredential.user.uid)
                  .set(resolvedProfile, { merge: true })
                  .catch(console.warn);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not read staff_users collection from database:', err);
      }

      // FAIL-SECURE GATE: Reject unprovisioned accounts
      if (!isActiveStaff || !staffRole) {
        if (setLoadingAuth) setLoadingAuth(false);
        await firebase.auth().signOut();

        logAuditEvent({
          category: AUDIT_CATEGORIES.SECURITY,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: AUDIT_SEVERITIES.WARNING,
          actor: {
            uid: userCredential.user?.uid || 'unauthorized',
            email: email.trim(),
            displayName: staffName || email.split('@')[0],
            role: 'unassigned',
          },
          target: { type: 'system', id: 'admin-auth', label: 'Staff Login Gate' },
          changes: {
            diffSummary: `Rejected login for unprovisioned account: ${email}`,
          },
          metadata: {
            reason: 'Account authenticated in Firebase but lacks active staff_users assignment',
          },
        }).catch(console.warn);

        dialog.alert({
          type: 'error',
          title: 'Access Restricted',
          message:
            'Your account is authenticated, but you do not have an active administrative staff role. Please contact a Super Admin to assign your role.',
        });
        return;
      }

      // Check if staff member has opted into 2FA in settings
      if (resolvedProfile?.totpEnabled) {
        setPendingStaff2FA({
          userCredential,
          staffRole,
          staffName,
          resolvedProfile,
        });
        if (setLoadingAuth) setLoadingAuth(false);
        feedback('tick');
        return;
      }

      // Default: Direct login with 0 extra steps
      completeAdminLogin({
        userCredential,
        staffRole,
        staffName,
        resolvedProfile,
      });
    } catch (error) {
      if (setLoadingAuth) setLoadingAuth(false);
      logAuditEvent({
        category: AUDIT_CATEGORIES.SECURITY,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: AUDIT_SEVERITIES.WARNING,
        actor: {
          uid: 'unauthenticated',
          email: email.trim(),
          displayName: 'Unauthorized Attempt',
          role: 'system',
        },
        target: { type: 'system', id: 'admin-auth', label: 'Staff Login Gate' },
        changes: {
          diffSummary: `Failed login attempt for ${email}`,
        },
        metadata: {
          errorMessage: error.message,
        },
      }).catch(console.warn);

      dialog.alert({
        type: 'error',
        title: 'Authentication Failed',
        message: error.message || 'Invalid credentials. Please verify your email and password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStaff2FA = async (e) => {
    e.preventDefault();
    if (!pendingStaff2FA) return;
    setVerifying2FA(true);

    try {
      const { userCredential, staffRole, staffName, resolvedProfile } = pendingStaff2FA;

      if (useBackupCode) {
        const cleanBackup = (backupCodeInput || '').trim();
        const { isValid, remainingHashedCodes } = await verifyAndConsumeBackupCode(
          cleanBackup,
          resolvedProfile.totpBackupCodes || []
        );

        if (!isValid) {
          feedback('warning');
          dialog.alert({
            type: 'error',
            title: 'Invalid Backup Code',
            message: 'The recovery code entered is incorrect or has already been used.',
          });
          setVerifying2FA(false);
          return;
        }

        // Update remaining backup codes
        await firebase.firestore().collection('staff_users').doc(userCredential.user.uid).update({
          totpBackupCodes: remainingHashedCodes,
        });

        completeAdminLogin({
          userCredential,
          staffRole,
          staffName,
          resolvedProfile: { ...resolvedProfile, totpBackupCodes: remainingHashedCodes },
        });
      } else {
        const cleanTotp = (totpCode || '').trim();
        const isValid = await verifyTOTP(cleanTotp, resolvedProfile.totpSecret);

        if (!isValid) {
          feedback('warning');
          dialog.alert({
            type: 'error',
            title: 'Invalid 2FA Code',
            message: 'The 6-digit authenticator code was incorrect. Please check your device time.',
          });
          setVerifying2FA(false);
          return;
        }

        completeAdminLogin({
          userCredential,
          staffRole,
          staffName,
          resolvedProfile,
        });
      }
    } catch (err) {
      console.error('Staff 2FA error:', err);
      dialog.alert({
        type: 'error',
        title: 'Verification Error',
        message: 'Could not verify 2FA code. Please try again.',
      });
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = (email || '').trim();
    if (!targetEmail) {
      dialog.alert({
        type: 'info',
        title: 'Staff Password Reset',
        message: 'Please enter your registered staff email address in the field above, then click Forgot Password.',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'Reset Password',
      message: `Send a password reset link to ${targetEmail}?`,
      confirmText: 'Send Reset Link',
      confirmColor: 'emerald',
    });

    if (confirmed) {
      feedback('tick');
      try {
        await firebase.auth().sendPasswordResetEmail(targetEmail);
        dialog.toast.success(
          'Reset Link Sent',
          `A password reset link has been dispatched to ${targetEmail}. Please check your inbox.`
        );
      } catch (err) {
        dialog.alert({
          type: 'error',
          title: 'Error Sending Reset Email',
          message: err.message || 'Could not send reset email. Verify email is registered.',
        });
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 xs:p-4 sm:p-6 min-h-[calc(100dvh-8rem)]">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-gray-200/80 dark:border-white/10 shadow-2xl p-5 xs:p-6 sm:p-8 space-y-5 sm:space-y-6 backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('adminLoginTitle', 'ADSA Staff Portal')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('adminLoginSubtitle', 'Sign in with administrative, committee, or kitchen staff credentials')}
          </p>
        </div>

        {noticeMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* 2FA Challenge Form (If staff opted into 2FA) */}
        {pendingStaff2FA ? (
          <form onSubmit={handleVerifyStaff2FA} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-800 dark:text-teal-200">
              <Shield className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
              <div>
                <span className="font-bold block">Two-Factor Authentication</span>
                <span>Enter the 6-digit verification code from your authenticator app.</span>
              </div>
            </div>

            {!useBackupCode ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-center font-mono text-xl tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Backup Recovery Code
                </label>
                <input
                  type="text"
                  autoFocus
                  value={backupCodeInput}
                  onChange={(e) => setBackupCodeInput(e.target.value)}
                  placeholder="e.g. ABCD-EFGH"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-center font-mono text-base tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setUseBackupCode(!useBackupCode)}
                className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
              >
                {useBackupCode ? 'Use 6-digit code instead' : 'Use a backup recovery code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingStaff2FA(null);
                  setTotpCode('');
                  setBackupCodeInput('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              disabled={verifying2FA}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              {verifying2FA ? <span>Verifying...</span> : <span>Confirm & Enter Console</span>}
            </button>
          </form>
        ) : (
          /* Primary Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('adminEmailLabel', 'Staff Email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('password', 'Password')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('forgotPassword', 'Forgot Password?')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>{t('authenticating', 'Authenticating...')}</span>
              ) : (
                <>
                  <span>{t('enterAdminConsole', 'Enter Staff Console')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 flex flex-col items-center gap-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors py-1 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('returnToPublicHome', 'Return to Public Home')}</span>
          </button>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            {t('authorizedCommitteeOnly', 'Role-Based Access Protected • Alathurpadi Dars Committee')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
