import React, { useContext, useState, useEffect } from 'react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { User, CreditCard, Utensils, Coffee, ChevronDown, Check, AlertCircle } from 'lucide-react';
import './StudentPort.css';

function StudentPort() {
  const { stdata } = useContext(DataOfOne);
  const navigate = useNavigate();

  const [lunch, setLunch] = useState(stdata.obj.lunch);
  const [breakfast, setBreakfast] = useState(stdata.obj.breakfast);
  const [beef, setBeef] = useState(stdata.obj2.beef);
  const [chicken, setChicken] = useState(stdata.obj2.chicken);
  const [fish, setFish] = useState(stdata.obj2.fish);
  const [mutton, setMutton] = useState(stdata.obj2.mutton);
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);
  const [day, setDay] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const updateDay = () => {
      const nowUtc = new Date();
      const gmtPlus530 = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
      const dayOfWeek = getDayOfWeek(gmtPlus530);
      setDay(dayOfWeek);
      console.log(dayOfWeek, "day");
    };

    updateDay();
    const timer = setInterval(updateDay, 60000);
    return () => clearInterval(timer);
  }, []);

  const [lsu, setLsu] = useState(stdata.obj.lunch['su']);
  const [lmo, setLmo] = useState(stdata.obj.lunch["mo"]);
  const [ltu, setLtu] = useState(stdata.obj.lunch["tu"]);
  const [lwe, setLwe] = useState(stdata.obj.lunch["we"]);
  const [lth, setLth] = useState(stdata.obj.lunch["th"]);
  const [lfr, setLfr] = useState(stdata.obj.lunch["fr"]);
  const [lsa, setLsa] = useState(stdata.obj.lunch["sa"]);
  const [checkedL, setChackedL] = useState(false);

  useEffect(() => {
    if (lsu && lmo && ltu && lwe && lth && lfr && lsa) {
      setChackedL(true);
    } else {
      setChackedL(false);
    }
  }, [lsu, lmo, ltu, lwe, lth, lfr, lsa]);

  const [bsu, setBsu] = useState(stdata.obj.breakfast['su']);
  const [bmo, setBmo] = useState(stdata.obj.breakfast["mo"]);
  const [btu, setBtu] = useState(stdata.obj.breakfast["tu"]);
  const [bwe, setBwe] = useState(stdata.obj.breakfast["we"]);
  const [bth, setBth] = useState(stdata.obj.breakfast["th"]);
  const [bfr, setBfr] = useState(stdata.obj.breakfast["fr"]);
  const [bsa, setBsa] = useState(stdata.obj.breakfast["sa"]);
  const [checkedBF, setChackedBF] = useState(false);

  useEffect(() => {
    if (bsu && bmo && btu && bwe && bth && bfr && bsa) {
      setChackedBF(true);
    } else {
      setChackedBF(false);
    }
  }, [bsu, bmo, btu, bwe, bth, bfr, bsa]);

  const getDayOfWeek = (date) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return daysOfWeek[date.getUTCDay()].toUpperCase();
  };

  const lunchSelectAll = (event) => {
    const { checked } = event.target;
    const LunchSelectConfirm = window.confirm('Are you sure you want to apply this change?');
    if (LunchSelectConfirm) {
      if (checked) {
        setLsu(true); setLmo(true); setLtu(true); setLwe(true);
        setLth(true); setLfr(true); setLsa(true);
      } else {
        setLsu(false); setLmo(false); setLtu(false); setLwe(false);
        setLth(false); setLfr(false); setLsa(false);
      }
    }
  };

  const selectBreackfastAll = (event) => {
    const { checked } = event.target;
    const breackFastConfirm = window.confirm('Are you sure you want to apply this change?');
    if (breackFastConfirm) {
      if (checked) {
        setBsu(true); setBmo(true); setBtu(true); setBwe(true);
        setBth(true); setBfr(true); setBsa(true);
      } else {
        setBsu(false); setBmo(false); setBtu(false); setBwe(false);
        setBth(false); setBfr(false); setBsa(false);
      }
    }
  };

  const handleBeefToggle = () => {
    const beefConfirm = window.confirm('Are you sure you want to change the settings');
    if (beefConfirm) setBeef(!beef);
  };

  const handleChickenToggle = () => {
    const chickenConfirm = window.confirm('Are you sure you want to change the settings');
    if (chickenConfirm) setChicken(!chicken);
  };

  const handleFishToggle = () => {
    const fishConfirm = window.confirm('Are you sure you want to change the settings');
    if (fishConfirm) setFish(!fish);
  };

  const handleMuttonToggle = () => {
    const muttonConfirm = window.confirm('Are you sure you want to change the settings');
    if (muttonConfirm) setMutton(!mutton);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    firebase
      .firestore()
      .collection('students')
      .doc(stdata.documentId)
      .set({
        uname: stdata.uname,
        password: stdata.password,
        tokenNo: stdata.tokenNo,
        block: false,
        obj: {
          lunch: { su: lsu, mo: lmo, tu: ltu, we: lwe, th: lth, fr: lfr, sa: lsa },
          breakfast: { su: bsu, mo: bmo, tu: btu, we: bwe, th: bth, fr: bfr, sa: bsa },
        },
        obj2: {
          beef: beef,
          chicken: chicken,
          fish: fish,
          mutton: mutton,
        },
      })
      .then(() => {
  Swal.fire({
    html: `
      <div class="flex flex-col items-center justify-center p-6">
        <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 border-2 border-green-200">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Token Updated Successfully</h2>
        <p class="text-gray-600 text-center mb-4 text-sm leading-relaxed">
          Your authentication token has been updated and is now active.
        </p>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: false,
    allowOutsideClick: false,
    background: '#ffffff',
    padding: 0,
    width: '420px',
    customClass: {
      popup: 'rounded-xl shadow-xl border border-gray-100',
    },
    didOpen: () => {
      // Auto close after 2 seconds
      setTimeout(() => {
        Swal.close();
        navigate('/');
      }, 2000);
    }
  });
});

  };

  const toggleCheckoutOptions = () => {
    setShowCheckoutOptions(!showCheckoutOptions);
  };

  const handleCkeckedlsu = () => {
    const conFirmOfLsu = window.confirm("Are you sure you want to apply this change?");
    if (conFirmOfLsu) setLsu(!lsu);
  };

  const handleCkeckedLmo = () => {
    const confirmOFLmo = window.confirm("Are you sure you want to apply this change?");
    if (confirmOFLmo) setLmo(!lmo);
  };

  const handleCkeckedLtu = () => {
    const confirmOfLtu = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLtu) setLtu(!ltu);
  };

  const handleCkeckedLwe = () => {
    const confirmOfLwe = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLwe) setLwe(!lwe);
  };

  const handleCkeckedLth = () => {
    const confirmOfLth = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLth) setLth(!lth);
  };

  const handleCkeckedLfr = () => {
    const confirmOfLfr = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLfr) setLfr(!lfr);
  };

  const handleCheckedLsa = () => {
    const confrimOfLsa = window.confirm("Are you sure you want to apply this change?");
    if (confrimOfLsa) setLsa(!lsa);
  };

  const handleCheckedBsu = () => {
    const conFirmOfLsu = window.confirm("Are you sure you want to apply this change?");
    if (conFirmOfLsu) setBsu(!bsu);
  };

  const handleCheckedBmo = () => {
    const confirmOFLmo = window.confirm("Are you sure you want to apply this change?");
    if (confirmOFLmo) setBmo(!bmo);
  };

  const handleCheckedBtu = () => {
    const confirmOfLtu = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLtu) setBtu(!btu);
  };

  const handleCheckedBwe = () => {
    const confirmOfLwe = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLwe) setBwe(!bwe);
  };

  const handleCheckedBth = () => {
    const confirmOfLth = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLth) setBth(!bth);
  };

  const handleCheckedBfr = () => {
    const confirmOfLfr = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLfr) setBfr(!bfr);
  };

  const handleCheckedBsa = () => {
    const confrimOfLsa = window.confirm("Are you sure you want to apply this change?");
    if (confrimOfLsa) setBsa(!bsa);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Success Alert */}
     
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header Card */}
       <div className="mb-4">
  <div className="bg-white border border-emerald-200 rounded-lg shadow-sm p-3 text-emerald-600 relative">
    <div className="relative z-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight truncate">{stdata.uname}</h1>
            <div className="flex items-center space-x-1 mt-0.5">
              <CreditCard className="w-3 h-3 flex-shrink-0 text-emerald-500" />
              <span className="text-emerald-500 text-xs font-medium truncate">Token #{stdata.tokenNo}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50/50 rounded px-3 py-1.5 flex-shrink-0">
          <p className="text-sm font-semibold text-emerald-600">{day}</p>
        </div>
      </div>
    </div>
  </div>
</div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Breakfast Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Coffee className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Breakfast</h2>
                    <p className="text-amber-100 text-sm">Morning meal selection</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <label className="flex items-center space-x-3 p-3 bg-amber-50 rounded-xl mb-4 cursor-pointer hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-amber-600 rounded border-2 border-amber-300 focus:ring-2 focus:ring-amber-500"
                    onChange={selectBreackfastAll}
                    checked={checkedBF}
                  />
                  <span className="text-sm font-semibold text-gray-800">Select All Days</span>
                </label>

                <div className="grid grid-cols-7 gap-2">
                  {[
                    { label: 'Sun', state: bsu, handler: handleCheckedBsu },
                    { label: 'Mon', state: bmo, handler: handleCheckedBmo },
                    { label: 'Tue', state: btu, handler: handleCheckedBtu },
                    { label: 'Wed', state: bwe, handler: handleCheckedBwe },
                    { label: 'Thu', state: bth, handler: handleCheckedBth },
                    { label: 'Fri', state: bfr, handler: handleCheckedBfr },
                    { label: 'Sat', state: bsa, handler: handleCheckedBsa }
                  ].map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <label className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                        {day.label}
                      </label>
                      <button
                        type="button"
                        onClick={day.handler}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                          day.state
                            ? 'bg-amber-500 border-amber-600 shadow-md'
                            : 'bg-white border-gray-300 hover:border-amber-400'
                        }`}
                      >
                        {day.state && <Check className="w-5 h-5 text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lunch Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Lunch</h2>
                    <p className="text-emerald-100 text-sm">Afternoon meal selection</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <label className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-xl mb-4 cursor-pointer hover:bg-emerald-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-emerald-600 rounded border-2 border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                    onChange={lunchSelectAll}
                    checked={checkedL}
                  />
                  <span className="text-sm font-semibold text-gray-800">Select All Days</span>
                </label>

                <div className="grid grid-cols-7 gap-2">
                  {[
                    { label: 'Sun', state: lsu, handler: handleCkeckedlsu },
                    { label: 'Mon', state: lmo, handler: handleCkeckedLmo },
                    { label: 'Tue', state: ltu, handler: handleCkeckedLtu },
                    { label: 'Wed', state: lwe, handler: handleCkeckedLwe },
                    { label: 'Thu', state: lth, handler: handleCkeckedLth },
                    { label: 'Fri', state: lfr, handler: handleCkeckedLfr },
                    { label: 'Sat', state: lsa, handler: handleCheckedLsa }
                  ].map((day, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <label className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                        {day.label}
                      </label>
                      <button
                        type="button"
                        onClick={day.handler}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                          day.state
                            ? 'bg-emerald-500 border-emerald-600 shadow-md'
                            : 'bg-white border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        {day.state && <Check className="w-5 h-5 text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dietary Preferences Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
            

            {showCheckoutOptions && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {[
                    { label: 'Beef', state: beef, handler: handleBeefToggle, emoji: '🥩' },
                    { label: 'Chicken', state: chicken, handler: handleChickenToggle, emoji: '🍗' },
                    { label: 'Fish', state: fish, handler: handleFishToggle, emoji: '🐟' },
                    { label: 'Mutton', state: mutton, handler: handleMuttonToggle, emoji: '🍖' }
                  ].map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={item.handler}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        item.state
                          ? 'bg-purple-50 border-purple-500 shadow-md'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <div className="text-sm font-semibold text-gray-700">{item.label}</div>
                      {item.state && (
                        <div className="mt-2">
                          <Check className="w-4 h-4 text-purple-600 mx-auto" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Update Meal Preferences
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Changes will be applied immediately to your meal plan</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default StudentPort;