import React, { useContext, useEffect, useState } from 'react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './StudentPort.css';
import { AuthContext } from '../store/AuthContext';


function AstudentPort() {
    const { user } = useContext(AuthContext);
  
  const { stdata } = useContext(DataOfOne);

  const [email,setEmail]=useState('');
  const [lunch, setLunch] = useState(stdata.obj.lunch);
  const [breakfast, setBreakfast] = useState(stdata.obj.breakfast);
  const [beef, setBeef] = useState(stdata.obj2.beef);
  const [chicken, setChicken] = useState(stdata.obj2.chicken);
  const [fish, setFish] = useState(stdata.obj2.fish);
  const [mutton, setMutton] = useState(stdata.obj2.mutton);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);

  useEffect(() => {
    if (user && user.bc && user.bc.email) {
      console.log('User email:', user.bc.email);
      setEmail(user.bc.email);
    } else {
      console.log('No user or email found');
      setEmail('');
    }
  
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        closeDropdowns();
        setMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);
  
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        closeDropdowns();
        setMenuOpen(false);
      }
    };
  

  const handleLunchToggle = () => {
    const LunchConfirm = window.confirm('Are you sure you want to change the settings');
    if (LunchConfirm) {
      setLunch(!lunch);
    }
  };

  const handleBeackfastToggle = () => {
    const breackFastConfirm = window.confirm('Are you sure you want to change the settings');
    if (breackFastConfirm) {
      setBreakfast(!breakfast);
    }
  };

  const handleBeefToggle = () => {
    const beefConfirm = window.confirm('Are you sure you want to change the settings');
    if (beefConfirm) {
      setBeef(!beef);
    }
  };

  const handleChickenToggle = () => {
    const chickenConfirm = window.confirm('Are you sure you want to change the settings');
    if (chickenConfirm) {
      setChicken(!chicken);
    }
  };

  const handleFishToggle = () => {
    const fishConfirm = window.confirm('Are you sure you want to change the settings');
    if (fishConfirm) {
      setFish(!fish);
    }
  };

  const handleMuttonToggle = () => {
    const muttonConfirm = window.confirm('Are you sure you want to change the settings');
    if (muttonConfirm) {
      setMutton(!mutton);
    }
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
        block: blocked,
        obj: {
          lunch: {
            su: lsu,
            mo: lmo,
            tu: ltu,
            we: lwe,
            th: lth,
            fr: lfr,
            sa: lsa
          },
          breakfast: {
            su: bsu,
            mo: bmo,
            tu: btu,
            we: bwe,
            th: bth,
            fr: bfr,
            sa: bsa
          },
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
        navigate('/admin', { state: { isLunch: stdata.isLunch } });
      });
  };

  const toggleCheckoutOptions = () => {
    setShowCheckoutOptions(!showCheckoutOptions);
  };

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

  const [blocked, setBlocked] = useState(stdata.block);

  const handleBlockChange = () => {
    const blockStatus = window.confirm("Are you sure you want to block this user");
    if (blockStatus) {
      setBlocked(true);
      firebase
        .firestore()
        .collection('students')
        .doc(stdata.documentId)
        .set({
          uname: stdata.uname,
          password: stdata.password,
          tokenNo: stdata.tokenNo,
          block: true,
          obj: {
            lunch: {
              su: lsu,
              mo: lmo,
              tu: ltu,
              we: lwe,
              th: lth,
              fr: lfr,
              sa: lsa
            },
            breakfast: {
              su: bsu,
              mo: bmo,
              tu: btu,
              we: bwe,
              th: bth,
              fr: bfr,
              sa: bsa
            },
          },
          obj2: {
            beef: beef,
            chicken: chicken,
            fish: fish,
            mutton: mutton,
          },
        });
    }
  };

  const handleUnblockChange = () => {
    const unblockStatus = window.confirm("Are you sure you want to unblock this user");
    if (unblockStatus) {
      setBlocked(false);
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
            lunch: {
              su: lsu,
              mo: lmo,
              tu: ltu,
              we: lwe,
              th: lth,
              fr: lfr,
              sa: lsa
            },
            breakfast: {
              su: bsu,
              mo: bmo,
              tu: btu,
              we: bwe,
              th: bth,
              fr: bfr,
              sa: bsa
            },
          },
          obj2: {
            beef: beef,
            chicken: chicken,
            fish: fish,
            mutton: mutton,
          },
        });
    }
  };

  const handleCkeckedlsu = () => {
    const conFirmOfLsu = window.confirm("Are you sure you want to apply this change?");
    if (conFirmOfLsu) {
      setLsu(!lsu);
    }
  };

  const handleCkeckedLmo = () => {
    const confirmOFLmo = window.confirm("Are you sure you want to apply this change?");
    if (confirmOFLmo) {
      setLmo(!lmo);
    }
  };

  const handleCkeckedLtu = () => {
    const confirmOfLtu = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLtu) {
      setLtu(!ltu);
    }
  };

  const handleCkeckedLwe = () => {
    const confirmOfLwe = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLwe) {
      setLwe(!lwe);
    }
  };

  const handleCkeckedLth = () => {
    const confirmOfLth = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLth) {
      setLth(!lth);
    }
  };

  const handleCkeckedLfr = () => {
    const confirmOfLfr = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLfr) {
      setLfr(!lfr);
    }
  };

  const handleCheckedLsa = () => {
    const confrimOfLsa = window.confirm("Are you sure you want to apply this change?");
    if (confrimOfLsa) {
      setLsa(!lsa);
    }
  };

  const handleCheckedBsu = () => {
    const conFirmOfLsu = window.confirm("Are you sure you want to apply this change?");
    if (conFirmOfLsu) {
      setBsu(!bsu);
    }
  };

  const handleCheckedBmo = () => {
    const confirmOFLmo = window.confirm("Are you sure you want to apply this change?");
    if (confirmOFLmo) {
      setBmo(!bmo);
    }
  };

  const handleCheckedBtu = () => {
    const confirmOfLtu = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLtu) {
      setBtu(!btu);
    }
  };

  const handleCheckedBwe = () => {
    const confirmOfLwe = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLwe) {
      setBwe(!bwe);
    }
  };

  const handleCheckedBth = () => {
    const confirmOfLth = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLth) {
      setBth(!bth);
    }
  };

  const handleCheckedBfr = () => {
    const confirmOfLfr = window.confirm("Are you sure you want to apply this change?");
    if (confirmOfLfr) {
      setBfr(!bfr);
    }
  };

  const handleCheckedBsa = () => {
    const confrimOfLsa = window.confirm("Are you sure you want to apply this change?");
    if (confrimOfLsa) {
      setBsa(!bsa);
    }
  };

  const lunchSelectAll = (event) => {
    const { checked } = event.target;
    const LunchSelectConfirm = window.confirm('Are you sure you want to apply this change?');
    if (LunchSelectConfirm) {
      if (checked) {
        setLsu(true);
        setLmo(true);
        setLtu(true);
        setLwe(true);
        setLth(true);
        setLfr(true);
        setLsa(true);
      } else {
        setLsu(false);
        setLmo(false);
        setLtu(false);
        setLwe(false);
        setLth(false);
        setLfr(false);
        setLsa(false);
      }
    }
  };

  const selectBreackfastAll = (event) => {
    const { checked } = event.target;
    const breackFastConfirm = window.confirm('Are you sure you want to apply this change?');
    if (breackFastConfirm) {
      if (checked) {
        setBsu(true);
        setBmo(true);
        setBtu(true);
        setBwe(true);
        setBth(true);
        setBfr(true);
        setBsa(true);
      } else {
        setBsu(false);
        setBmo(false);
        setBtu(false);
        setBwe(false);
        setBth(false);
        setBfr(false);
        setBsa(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-white text-center">Student Portal</h2>
            </div>

            <div className="p-6">
              {/* Student Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  Student Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  {/* Name */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
                    <i className="fas fa-user text-blue-500 text-xl"></i>
                    <div className="flex-1">
                      <span className="text-gray-500 text-sm font-medium block">Name</span>
                      <span className="text-gray-800 font-semibold">{stdata.uname}</span>
                    </div>
                  </div>

                  {/* Token Number */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
                    <i className="fas fa-id-badge text-blue-500 text-xl"></i>
                    <div className="flex-1">
                      <span className="text-gray-500 text-sm font-medium block">Token Number</span>
                      <span className="text-gray-800 font-semibold">{stdata.tokenNo}</span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
                    <i className="fas fa-lock text-blue-500 text-xl"></i>
                    <div className="flex-1">
                      <span className="text-gray-500 text-sm font-medium block">Password</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-800 font-semibold">
                          {showPassword ? stdata.password : '••••••••'}
                        </span>
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="text-blue-500 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={togglePasswordVisibility}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Block/Unblock Section */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Account Status</h4>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="blockStatus"
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                        checked={blocked}
                        onChange={handleBlockChange}
                      />
                      <span className="text-red-600 font-medium">Block</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="blockStatus"
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                        checked={!blocked}
                        onChange={handleUnblockChange}
                      />
                      <span className="text-green-600 font-medium">Unblock</span>
                    </label>
                    {blocked && (
                      <span className="text-red-500 text-sm font-medium bg-red-50 px-2 py-1 rounded">
                        Token is blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meal Preferences Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  Meal Preferences
                </h3>

                {/* Breakfast Section */}
                

                {/* Lunch Section */}
                <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
  <div className="bg-orange-50 px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h4 className="text-md font-semibold text-gray-800">Breakfast</h4>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
          onChange={selectBreackfastAll}
          checked={checkedBF}
          disabled={email === "adsacanteen@gmail.com"}
        />
        <span className="text-sm font-medium text-gray-700">Select All</span>
      </label>
    </div>
  </div>
  <div className="p-4">
    <div className="grid grid-cols-7 gap-4">
      {[
        { key: 'su', label: 'Sun', state: bsu, handler: handleCheckedBsu },
        { key: 'mo', label: 'Mon', state: bmo, handler: handleCheckedBmo },
        { key: 'tu', label: 'Tue', state: btu, handler: handleCheckedBtu },
        { key: 'we', label: 'Wed', state: bwe, handler: handleCheckedBwe },
        { key: 'th', label: 'Thu', state: bth, handler: handleCheckedBth },
        { key: 'fr', label: 'Fri', state: bfr, handler: handleCheckedBfr },
        { key: 'sa', label: 'Sat', state: bsa, handler: handleCheckedBsa }
      ].map(day => (
        <div key={day.key} className="flex flex-col items-center space-y-2">
          <label className="text-sm font-medium text-gray-600">{day.label}</label>
          <input
            type="checkbox"
            checked={day.state}
            onChange={day.handler}
            className="w-5 h-5 text-orange-600 focus:ring-orange-500 rounded"
            disabled={email === "adsacanteen@gmail.com"} // disable condition here
          />
        </div>
      ))}
    </div>
  </div>
</div>

{/* Lunch Section */}
<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
  <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h4 className="text-md font-semibold text-gray-800">Lunch</h4>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
          onChange={lunchSelectAll}
          checked={checkedL}
          disabled={email === "adsacanteen@gmail.com"}
        />
        <span className="text-sm font-medium text-gray-700">Select All</span>
      </label>
    </div>
  </div>
  <div className="p-4">
    <div className="grid grid-cols-7 gap-4">
      {[
        { key: 'su', label: 'Sun', state: lsu, handler: handleCkeckedlsu },
        { key: 'mo', label: 'Mon', state: lmo, handler: handleCkeckedLmo },
        { key: 'tu', label: 'Tue', state: ltu, handler: handleCkeckedLtu },
        { key: 'we', label: 'Wed', state: lwe, handler: handleCkeckedLwe },
        { key: 'th', label: 'Thu', state: lth, handler: handleCkeckedLth },
        { key: 'fr', label: 'Fri', state: lfr, handler: handleCkeckedLfr },
        { key: 'sa', label: 'Sat', state: lsa, handler: handleCheckedLsa }
      ].map(day => (
        <div key={day.key} className="flex flex-col items-center space-y-2">
          <label className="text-sm font-medium text-gray-600">{day.label}</label>
          <input
            type="checkbox"
            checked={day.state}
            onChange={day.handler}
            className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
            disabled={email === "adsacanteen@gmail.com"} // disable condition here
          />
        </div>
      ))}
    </div>
  </div>
</div>
              </div>

              {/* Dietary Preferences Toggle */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={toggleCheckoutOptions}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <span>Dietary Preferences</span>
                  <i className={`fas fa-chevron-${showCheckoutOptions ? 'up' : 'down'} text-sm`}></i>
                </button>
              </div>

              {/* Dietary Preferences Section */}
              {showCheckoutOptions && (
                <div className="mb-8 bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Dietary Preferences</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'beef', label: 'Beef', state: beef, handler: handleBeefToggle },
                      { key: 'chicken', label: 'Chicken', state: chicken, handler: handleChickenToggle },
                      { key: 'fish', label: 'Fish', state: fish, handler: handleFishToggle },
                      { key: 'mutton', label: 'Mutton', state: mutton, handler: handleMuttonToggle }
                    ].map(item => (
                      <label key={item.key} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                          checked={item.state}
                          onChange={item.handler}
                        />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-emerald-200"
                >
                  Update Preferences
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AstudentPort;