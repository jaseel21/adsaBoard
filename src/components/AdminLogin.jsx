import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Users,
  Utensils,
  ChefHat,
  Code,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { ROLES, ROLE_LABELS, getRoleHomeRoute } from '../utils/rbac';

// Helper icon mapping per database role
const ROLE_ICONS = {
  [ROLES.DEVELOPER]: Code,
  [ROLES.CENTRAL_COMMITTEE]: ShieldCheck,
  [ROLES.CANTEEN_COMMITTEE]: Utensils,
  [ROLES.COOK]: ChefHat,
};

const ROLE_BADGE_STYLES = {
  [ROLES.DEVELOPER]: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  [ROLES.CENTRAL_COMMITTEE]: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  [ROLES.CANTEEN_COMMITTEE]: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  [ROLES.COOK]: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
};

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic Staff Accounts loaded from database (staff_users collection)
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { homeRoute } = useContext(AuthContext);

  const redirectTarget = location.state?.from;
  const noticeMessage = location.state?.notice;

  // Real-time dynamic fetch of registered staff accounts from Firestore database
  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('staff_users')
      .where('status', '==', 'active')
      .onSnapshot(
        (snapshot) => {
          const accounts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Deduplicate by normalized email
          const unique = [];
          const seenEmails = new Set();
          accounts.forEach((acc) => {
            const em = (acc.email || '').toLowerCase().trim();
            if (em && !seenEmails.has(em)) {
              seenEmails.add(em);
              unique.push(acc);
            }
          });

          // Sort alphabetically by displayName or email
          unique.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
          setStaffAccounts(unique);
          setLoadingStaff(false);
        },
        (err) => {
          console.warn('Could not read staff directory from database:', err);
          setLoadingStaff(false);
        }
      );

    return () => unsub();
  }, []);

  const handleSelectStaff = (account) => {
    feedback('tick');
    setSelectedStaffId(account.id);
    setEmail(account.email || '');
  };

  const handleClearSelectedStaff = () => {
    feedback('pop');
    setSelectedStaffId(null);
    setEmail('');
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
      // Enforce session persistence on public campus computers
      if (firebase.auth.Auth && firebase.auth.Auth.Persistence) {
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
      }

      // Authenticate with Firebase Authentication
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email.trim(), password);

      // Determine authenticated user's role dynamically from Firestore staff_users
      let staffRole = null;
      let staffName = userCredential.user?.displayName;

      try {
        // 1. Direct UID lookup
        const staffDoc = await firebase
          .firestore()
          .collection('staff_users')
          .doc(userCredential.user.uid)
          .get();

        if (staffDoc.exists && staffDoc.data().role) {
          staffRole = staffDoc.data().role;
          staffName = staffDoc.data().displayName || staffName;
        } else {
          // 2. Fallback email lookup in staff_users
          const emailQuery = await firebase
            .firestore()
            .collection('staff_users')
            .where('email', '==', email.trim().toLowerCase())
            .limit(1)
            .get();

          if (!emailQuery.empty) {
            const matchedData = emailQuery.docs[0].data();
            staffRole = matchedData.role;
            staffName = matchedData.displayName || staffName;
          }
        }
      } catch (err) {
        console.warn('Could not read staff_users collection from database:', err);
      }

      // Default safe fallback if not yet classified
      if (!staffRole) {
        staffRole = ROLES.CENTRAL_COMMITTEE;
      }

      // Log successful security audit event
      await logAuditEvent({
        category: AUDIT_CATEGORIES.SECURITY,
        action: 'ADMIN_LOGIN',
        severity: AUDIT_SEVERITIES.NOTICE,
        actor: {
          uid: userCredential.user?.uid || 'admin',
          email: email.trim(),
          displayName: staffName || email.split('@')[0],
          role: staffRole,
        },
        target: { type: 'system', id: 'admin-auth', label: 'Admin Session Login' },
        changes: {
          diffSummary: `Staff authenticated dynamically as ${staffRole} (${email})`,
        },
      });

      feedback('success');

      // Smart routing: if coming from a specific guarded route, return there; otherwise go to role home
      const destination = redirectTarget || getRoleHomeRoute(staffRole);
      navigate(destination, { replace: true });
    } catch (error) {
      await logAuditEvent({
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
      });

      dialog.alert({
        type: 'error',
        title: 'Authentication Failed',
        message: error.message || 'Invalid credentials. Please verify your email and password.',
      });
    } finally {
      setLoading(false);
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

        {/* Dynamic Staff Selector (Fetched directly from Firestore database) */}
        {!loadingStaff && staffAccounts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {t('registeredStaffAccounts', 'Registered Accounts (From Database)')}
              </label>
              {selectedStaffId && (
                <button
                  type="button"
                  onClick={handleClearSelectedStaff}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('customEmail', 'Type Custom Email')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
              {staffAccounts.map((account) => {
                const IconComp = ROLE_ICONS[account.role] || UserCheck;
                const isSelected = selectedStaffId === account.id || email.toLowerCase() === (account.email || '').toLowerCase();
                const badgeStyle = ROLE_BADGE_STYLES[account.role] || 'bg-gray-100 text-gray-700 border-gray-200';

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleSelectStaff(account)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                          {account.displayName || account.email}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate block font-mono">
                          {account.email}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ml-2 ${badgeStyle}`}>
                      {ROLE_LABELS[account.role] || account.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {noticeMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {t('adminEmailLabel', 'Staff Email')}
            </label>
            <div className="relative">
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedStaffId(null);
                }}
                value={email}
                type="email"
                required
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {t('password', 'Password')}
            </label>
            <div className="relative">
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
