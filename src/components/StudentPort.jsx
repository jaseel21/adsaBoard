import React, { useContext, useState, useEffect } from 'react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { User, CreditCard, Utensils, CookingPot } from 'lucide-react';
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
    const daysOfWeek = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    return daysOfWeek[date.getUTCDay()];
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
          position: 'center',
          icon: 'success',
          title: 'Your token updated',
          showConfirmButton: false,
          timer: 1500,
          customClass: {
            popup: 'swal2-center swal2-small',
            title: 'swal2-title-center',
            icon: 'swal2-icon-small',
            content: 'swal2-content-padding'
          },
        });
        navigate('/');
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div>
              {/* Student Info Section */}
              <div className="bg-emerald-500 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{stdata.uname}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <CreditCard className="w-4 h-4 text-white" />
                      <span className="text-white">Token: {stdata.tokenNo}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-8">
                  {/* Breakfast Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Breakfast</h3>
                        <p className="text-sm text-gray-500">Select your breakfast days</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5">
                      <label className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          onChange={selectBreackfastAll}
                          checked={checkedBF}
                        />
                        <span className="text-sm font-medium text-gray-700">Select All Days</span>
                      </label>

                      <div className="grid grid-cols-7 gap-3">
                        {[
                          { label: 'Su', state: bsu, handler: handleCheckedBsu },
                          { label: 'Mo', state: bmo, handler: handleCheckedBmo },
                          { label: 'Tu', state: btu, handler: handleCheckedBtu },
                          { label: 'We', state: bwe, handler: handleCheckedBwe },
                          { label: 'Th', state: bth, handler: handleCheckedBth },
                          { label: 'Fr', state: bfr, handler: handleCheckedBfr },
                          { label: 'Sa', state: bsa, handler: handleCheckedBsa }
                        ].map((day, index) => (
                          <div key={index} className="flex flex-col items-center space-y-2">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {day.label}
                            </label>
                            <input
                              type="checkbox"
                              checked={day.state}
                              onChange={day.handler}
                              className="w-5 h-5 text-blue-500 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Lunch Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CookingPot className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Lunch</h3>
                        <p className="text-sm text-gray-500">Select your lunch days</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5">
                      <label className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          onChange={lunchSelectAll}
                          checked={checkedL}
                        />
                        <span className="text-sm font-medium text-gray-700">Select All Days</span>
                      </label>

                      <div className="grid grid-cols-7 gap-3">
                        {[
                          { label: 'Su', state: lsu, handler: handleCkeckedlsu },
                          { label: 'Mo', state: lmo, handler: handleCkeckedLmo },
                          { label: 'Tu', state: ltu, handler: handleCkeckedLtu },
                          { label: 'We', state: lwe, handler: handleCkeckedLwe },
                          { label: 'Th', state: lth, handler: handleCkeckedLth },
                          { label: 'Fr', state: lfr, handler: handleCkeckedLfr },
                          { label: 'Sa', state: lsa, handler: handleCheckedLsa }
                        ].map((day, index) => (
                          <div key={index} className="flex flex-col items-center space-y-2">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {day.label}
                            </label>
                            <input
                              type="checkbox"
                              checked={day.state}
                              onChange={day.handler}
                              className="w-5 h-5 text-blue-500 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dietary Preferences (Commented out as in original code) */}
                  {/*
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={toggleCheckoutOptions}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Dietary Preferences (Optional)</span>
                      <svg 
                        className={`w-4 h-4 transition-transform ${showCheckoutOptions ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showCheckoutOptions && (
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Select your dietary preferences</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Beef', state: beef, handler: handleBeefToggle },
                            { label: 'Chicken', state: chicken, handler: handleChickenToggle },
                            { label: 'Fish', state: fish, handler: handleFishToggle },
                            { label: 'Mutton', state: mutton, handler: handleMuttonToggle }
                          ].map((item, index) => (
                            <label key={index} className="flex items-center space-x-3 p-2 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                checked={item.state}
                                onChange={item.handler}
                              />
                              <span className="text-sm text-gray-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  */}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full relative bg-emerald-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:bg-emerald-600 hover:shadow-emerald-400/25 focus:outline-none focus:ring-2 focus:ring-blue-400 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed overflow-hidden group"
                    >
                      Update Preferences
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Changes will be applied to your meal plan immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPort;