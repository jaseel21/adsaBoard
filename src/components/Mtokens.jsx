import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Coffee, Utensils, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { useFeedback } from '../utils/useFeedback';

function Mtokens() {
  const navigate = useNavigate();
  const { feedback } = useFeedback();

  const [lunch, setLunch] = useState(false);
  const [breakfast, setBreakfast] = useState(false);
  const [fNO, setfNO] = useState('');
  const [tNO, settNO] = useState('');
  const [updating, setUpdating] = useState(false);

  const updateStudentMeals = async (e) => {
    e.preventDefault();
    const from = parseInt(fNO);
    const to = parseInt(tNO);

    if (isNaN(from) || isNaN(to) || from > to) {
      feedback('warning');
      Swal.fire({
        icon: 'error',
        title: 'Invalid Range',
        text: 'The "From" token number must be less than or equal to the "To" token number.',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    feedback('tick');
    Swal.fire({
      title: `Bulk Update Tokens #${from} to #${to}?`,
      text: `This will set Lunch to ${lunch ? 'ON' : 'OFF'} and Breakfast to ${breakfast ? 'ON' : 'OFF'} across all tokens in this range.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Yes, Apply to Range',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setUpdating(true);
        try {
          const querySnapshot = await firebase
            .firestore()
            .collection('students')
            .where('tokenNo', '>=', from)
            .where('tokenNo', '<=', to)
            .get();

          const batch = firebase.firestore().batch();
          querySnapshot.forEach((doc) => {
            const docData = doc.data();
            const updatedData = {
              ...docData,
              obj: {
                lunch: {
                  su: lunch,
                  mo: lunch,
                  tu: lunch,
                  we: lunch,
                  th: lunch,
                  fr: lunch,
                  sa: lunch,
                },
                breakfast: {
                  su: breakfast,
                  mo: breakfast,
                  tu: breakfast,
                  we: breakfast,
                  th: breakfast,
                  fr: breakfast,
                  sa: breakfast,
                },
              },
            };
            batch.update(doc.ref, updatedData);
          });

          await batch.commit();
          feedback('success');
          Swal.fire({
            title: 'Bulk Update Successful',
            text: `Updated ${querySnapshot.size} tokens in range #${from} to #${to}.`,
            icon: 'success',
            confirmButtonColor: '#10b981',
          }).then(() => {
            navigate('/admin');
          });
        } catch (error) {
          console.error('Error batch updating tokens: ', error);
          feedback('warning');
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Could not update token range.',
            confirmButtonColor: '#ef4444',
          });
        } finally {
          setUpdating(false);
        }
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              Bulk Manage Token Range
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Apply bulk meal rules to a contiguous block of tokens
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            feedback('tick');
            navigate('/admin');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <form onSubmit={updateStudentMeals} className="space-y-6">
          
          {/* Target Meal Settings */}
          <div className="space-y-3">
            <span className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Set Target State For Range
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setBreakfast(!breakfast);
                }}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  breakfast
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'
                }`}
              >
                <Coffee className="w-5 h-5 mx-auto mb-1.5" />
                <span className="text-xs block">Breakfast</span>
                <span className="text-[10px] mt-0.5 block">{breakfast ? 'Turn ON' : 'Turn OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setLunch(!lunch);
                }}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  lunch
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'
                }`}
              >
                <Utensils className="w-5 h-5 mx-auto mb-1.5" />
                <span className="text-xs block">Lunch</span>
                <span className="text-[10px] mt-0.5 block">{lunch ? 'Turn ON' : 'Turn OFF'}</span>
              </button>
            </div>
          </div>

          {/* Token Range Fields */}
          <div className="space-y-3">
            <span className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Token Range
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  From Token #
                </label>
                <input
                  type="number"
                  value={fNO}
                  onChange={(e) => setfNO(e.target.value)}
                  placeholder="e.g. 50"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  To Token #
                </label>
                <input
                  type="number"
                  value={tNO}
                  onChange={(e) => settNO(e.target.value)}
                  placeholder="e.g. 100"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={updating}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{updating ? 'Applying Range Batch...' : 'Apply Bulk Update'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Mtokens;