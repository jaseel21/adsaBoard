import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Coffee,
  Check,
  Save,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import './StudentPort.css';

function StudentPort() {
  const { stdata } = useContext(DataOfOne);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Meal selections - unconditionally declared
  const [lunch, setLunch] = useState(() => stdata?.obj?.lunch || {});
  const [breakfast, setBreakfast] = useState(() => stdata?.obj?.breakfast || {});
  const [dietary, setDietary] = useState(() => stdata?.obj2 || { beef: true, chicken: true, fish: true, mutton: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stdata?.obj) {
      setLunch(stdata.obj.lunch || {});
      setBreakfast(stdata.obj.breakfast || {});
      setDietary(stdata.obj2 || { beef: true, chicken: true, fish: true, mutton: true });
    }
  }, [stdata]);

  if (!stdata || !stdata.obj) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500 mb-4">No active student session found.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
        >
          Return to Login
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

  const toggleBreakfastDay = (dayKey) => {
    feedback('tick');
    setBreakfast((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const toggleLunchDay = (dayKey) => {
    feedback('tick');
    setLunch((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const selectAllBreakfast = (targetVal) => {
    feedback('pop');
    setBreakfast({
      su: targetVal,
      mo: targetVal,
      tu: targetVal,
      we: targetVal,
      th: targetVal,
      fr: targetVal,
      sa: targetVal,
    });
  };

  const selectAllLunch = (targetVal) => {
    feedback('pop');
    setLunch({
      su: targetVal,
      mo: targetVal,
      tu: targetVal,
      we: targetVal,
      th: targetVal,
      fr: targetVal,
      sa: targetVal,
    });
  };

  const toggleDiet = (key) => {
    feedback('tick');
    setDietary((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allBreakfastSelected = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].every((d) => breakfast[d]);
  const allLunchSelected = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].every((d) => lunch[d]);

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
          password: stdata.password,
          tokenNo: stdata.tokenNo,
          block: false,
          obj: {
            lunch,
            breakfast,
          },
          obj2: dietary,
        });

      feedback('success');
      Swal.fire({
        title: t('changesSaved'),
        text: 'Your meal schedule has been updated successfully.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Return to Board',
      }).then(() => {
        navigate('/');
      });
    } catch (err) {
      console.error('Error updating document:', err);
      feedback('warning');
      Swal.fire({
        title: 'Error',
        text: 'Could not save changes. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
            {stdata.tokenNo}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {stdata.uname}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Token #{stdata.tokenNo} • Active Dars Student
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            feedback('tick');
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Board</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Breakfast & Lunch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Breakfast Card */}
          <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('navBreakfast')}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    Daily morning meal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectAllBreakfast(!allBreakfastSelected)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {allBreakfastSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysList.map(({ key, label }) => {
                const active = Boolean(breakfast[key]);
                return (
                  <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBreakfastDay(key)}
                      className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform active:scale-90 ${
                        active
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-400'
                      }`}
                    >
                      {active ? <Check className="w-4 h-4" /> : '-'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lunch Card */}
          <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('navLunch')}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    Daily afternoon meal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectAllLunch(!allLunchSelected)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {allLunchSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysList.map(({ key, label }) => {
                const active = Boolean(lunch[key]);
                return (
                  <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLunchDay(key)}
                      className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform active:scale-90 ${
                        active
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-400'
                      }`}
                    >
                      {active ? <Check className="w-4 h-4" /> : '-'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dietary Preferences Card */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Dietary Selections
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'beef', label: t('beef'), emoji: '🥩' },
              { key: 'chicken', label: t('chicken'), emoji: '🍗' },
              { key: 'fish', label: t('fish'), emoji: '🐟' },
              { key: 'mutton', label: t('mutton'), emoji: '🍖' },
            ].map(({ key, label, emoji }) => {
              const active = Boolean(dietary[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDiet(key)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'
                  }`}
                >
                  <span className="text-2xl block mb-1">{emoji}</span>
                  <span className="text-xs font-bold block">{label}</span>
                  <span className="text-[10px] mt-1 block">
                    {active ? 'Included' : 'Excluded'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('saving') : t('saveChanges')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentPort;