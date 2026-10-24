import React, { useState } from 'react';
import { UserCheck, KeyRound, LogOut, ShieldCheck, Mail, User, Sparkles, Hash, Home, LogIn, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import firebase from '../../../firebase/config';
import ChangePinModal from '../modals/ChangePinModal';
import EditUsernameModal from '../modals/EditUsernameModal';

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
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);

  const isStudent = Boolean(stdata?.tokenNo);
  const isStaff = Boolean(user);

  const handleLogoutAdmin = async () => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'ലോഗൗട്ട് ചെയ്യണോ?' : 'Sign Out of Committee Console?',
      message: language === 'ml' ? 'നിങ്ങൾ അഡ്മിൻ സെഷനിൽ നിന്ന് പുറത്തു കടക്കുകയാണ്.' : 'Are you sure you want to sign out of the ADSA Committee session?',
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
            ? 'നിങ്ങളുടെ ലോഗിൻ വിവരങ്ങളും സുരക്ഷാ ആക്‌സസുകളും പരിശോധിക്കുക'
            : 'Manage student dining token credentials or staff committee authorization'}
        </p>
      </div>

      {/* 1. STUDENT IDENTITY CARD */}
      {isStudent && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 border border-emerald-500/20 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-emerald-500/20 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-90 leading-none">TOKEN</span>
                <span className="text-xl leading-none mt-1">#{stdata.tokenNo}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {stdata.name}
                  </h3>
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
                {stdata.nameMl && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-malayalam mt-0.5">
                    {stdata.nameMl}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                  <span>Batch: {stdata.batch || 'N/A'}</span>
                  <span>•</span>
                  <span>Room: {stdata.roomNo || stdata.room || 'N/A'}</span>
                </div>

                {/* Student Username Badge */}
                <div className="flex items-center gap-2 mt-2">
                  {stdata.username || (stdata.uname && !/^\d+$/.test(stdata.uname)) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <AtSign className="w-3 h-3 text-emerald-500" />
                      <span>{stdata.username || stdata.uname}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <span>{language === 'ml' ? 'യൂസർനെയിം നൽകിയിട്ടില്ല' : 'No username set'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Edit Username Button */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setUsernameModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <AtSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {stdata.username || (stdata.uname && !/^\d+$/.test(stdata.uname))
                    ? language === 'ml'
                      ? 'യൂസർനെയിം മാറ്റുക'
                      : 'Edit Username'
                    : language === 'ml'
                    ? 'യൂസർനെയിം നൽകുക'
                    : 'Set Username'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setPinModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'ml' ? 'പാസ്‌വേഡ് മാറ്റുക' : 'Change PIN'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogoutStudent}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'പുറത്തിറങ്ങുക' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STAFF IDENTITY CARD */}
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
      )}

      {/* 3. GUEST UN-AUTHENTICATED CARD */}
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
    </div>
  );
}
