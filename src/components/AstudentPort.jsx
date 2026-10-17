import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Coffee,
  Utensils,
  Check,
  Lock,
  Unlock,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { AuthContext } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

function AstudentPort() {
  const { stdata } = useContext(DataOfOne);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // State declared unconditionally
  const [blocked, setBlocked] = useState(() => Boolean(stdata?.block));
  const [password, setPassword] = useState(() => stdata?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lunch, setLunch] = useState(() => stdata?.obj?.lunch || {});
  const [breakfast, setBreakfast] = useState(() => stdata?.obj?.breakfast || {});
  const [dietary, setDietary] = useState(
    () => stdata?.obj2 || { beef: true, chicken: true, fish: true, mutton: true }
  );

  useEffect(() => {
    if (stdata?.obj) {
      setBlocked(Boolean(stdata.block));
      setPassword(stdata.password || '');
      setLunch(stdata.obj.lunch || {});
      setBreakfast(stdata.obj.breakfast || {});
      setDietary(stdata.obj2 || { beef: true, chicken: true, fish: true, mutton: true });
    }
  }, [stdata]);

  if (!stdata || !stdata.obj) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-4">No student selected for admin editing.</p>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
        >
          Return to Admin Console
        </button>
      </div>
    );
  }

  const daysList = [
    { key: 'su', label: t('days').su },
    { key: 'mo', label: t('days').mo },
    { key: 'tu', label: t('days').tu },
    { key: 'we', label: t('days').we },
    { key: 'th', label: t('days').th },
    { key: 'fr', label: t('days').fr },
    { key: 'sa', label: t('days').sa },
  ];

  const toggleBreakfastDay = (key) => {
    feedback('tick');
    setBreakfast((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLunchDay = (key) => {
    feedback('tick');
    setLunch((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDiet = (key) => {
    feedback('tick');
    setDietary((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    feedback('tick');

    try {
      await firebase
        .firestore()
        .collection('students')
        .doc(stdata.documentId)
        .set({
          uname: stdata.uname,
          password: password,
          tokenNo: stdata.tokenNo,
          block: blocked,
          obj: { lunch, breakfast },
          obj2: dietary,
        });

      feedback('success');
      Swal.fire({
        title: 'Updated Successfully',
        text: `Student #${stdata.tokenNo} records have been updated.`,
        icon: 'success',
        confirmButtonColor: '#10b981',
      }).then(() => {
        navigate('/admin');
      });
    } catch (err) {
      console.error('Error updating student record:', err);
      feedback('warning');
      Swal.fire({
        title: 'Error',
        text: 'Failed to update student records.',
        icon: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = () => {
    feedback('warning');
    Swal.fire({
      title: `Delete Token #${stdata.tokenNo}?`,
      text: `Are you sure you want to permanently delete ${stdata.uname}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await firebase.firestore().collection('students').doc(stdata.documentId).delete();
          feedback('pop');
          Swal.fire('Deleted!', 'Student record deleted.', 'success');
          navigate('/admin');
        } catch (err) {
          console.error('Delete error:', err);
        }
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
            {stdata.tokenNo}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {stdata.uname} (Admin Edit)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Token #{stdata.tokenNo} • {blocked ? 'Locked Account' : 'Active Account'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              feedback('tick');
              navigate('/admin');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Account Controls Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md">
          
          {/* Lock / Unlock Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Canteen Account Access
            </label>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setBlocked(!blocked);
              }}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-all ${
                blocked
                  ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {blocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{blocked ? 'Blocked from Dining Service' : 'Active Account (Unblocked)'}</span>
            </button>
          </div>

          {/* Password Edit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Student Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 pr-11 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Meal Schedules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Breakfast */}
          <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Breakfast Schedule
              </h2>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysList.map(({ key, label }) => {
                const active = Boolean(breakfast[key]);
                return (
                  <div key={key} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBreakfastDay(key)}
                      className={`w-full max-w-[42px] h-10 sm:h-12 aspect-square rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                        active
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-400'
                      }`}
                    >
                      {active ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : '-'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lunch */}
          <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Lunch Schedule
              </h2>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysList.map(({ key, label }) => {
                const active = Boolean(lunch[key]);
                return (
                  <div key={key} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLunchDay(key)}
                      className={`w-full max-w-[42px] h-10 sm:h-12 aspect-square rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                        active
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-400'
                      }`}
                    >
                      {active ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : '-'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Dietary Exclusions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'beef', label: 'Beef', emoji: '🥩' },
              { key: 'chicken', label: 'Chicken', emoji: '🍗' },
              { key: 'fish', label: 'Fish', emoji: '🐟' },
              { key: 'mutton', label: 'Mutton', emoji: '🍖' },
            ].map(({ key, label, emoji }) => {
              const active = Boolean(dietary[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDiet(key)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'
                  }`}
                >
                  <span className="text-xl block mb-1">{emoji}</span>
                  <span className="text-xs font-bold block">{label}</span>
                  <span className="text-[10px] mt-0.5 block">{active ? 'Allowed' : 'Excluded'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDeleteStudent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-500/20 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Student Record</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Records...' : 'Save Student Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AstudentPort;