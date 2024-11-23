import React, { useContext, useEffect, useState } from 'react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './StudentPort.css'


function AstudentPort() {
  const { stdata } = useContext(DataOfOne);

  const [lunch, setLunch] = useState(stdata.obj.lunch);
  const [breakfast, setBreakfast] = useState(stdata.obj.breakfast);
  const [beef, setBeef] = useState(stdata.obj2.beef);
  const [chicken, setChicken] = useState(stdata.obj2.chicken);
  const [fish, setFish] = useState(stdata.obj2.fish);
  const [mutton, setMutton] = useState(stdata.obj2.mutton);


  const navigate = useNavigate();
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);

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


  const [lsu, setLsu] = useState(stdata.obj.lunch['su'])
  const [lmo, setLmo] = useState(stdata.obj.lunch["mo"])
  const [ltu, setLtu] = useState(stdata.obj.lunch["tu"])
  const [lwe, setLwe] = useState(stdata.obj.lunch["we"])
  const [lth, setLth] = useState(stdata.obj.lunch["th"])
  const [lfr, setLfr] = useState(stdata.obj.lunch["fr"])
  const [lsa, setLsa] = useState(stdata.obj.lunch["sa"])

  const [checkedL, setChackedL] = useState(false);

  useEffect(() => {
    // Check if all lunch states are true
    if (lsu && lmo && ltu && lwe && lth && lfr && lsa) {
      setChackedL(true);  // Set lunch state to true
    } else {
      setChackedL(false); // Set lunch state to false
    }
  }, [lsu, lmo, ltu, lwe, lth, lfr, lsa]);

  const [bsu, setBsu] = useState(stdata.obj.breakfast['su'])
  const [bmo, setBmo] = useState(stdata.obj.breakfast["mo"])
  const [btu, setBtu] = useState(stdata.obj.breakfast["tu"])
  const [bwe, setBwe] = useState(stdata.obj.breakfast["we"])
  const [bth, setBth] = useState(stdata.obj.breakfast["th"])
  const [bfr, setBfr] = useState(stdata.obj.breakfast["fr"])
  const [bsa, setBsa] = useState(stdata.obj.breakfast["sa"])

  const [checkedBF, setChackedBF] = useState(false)

  useEffect(() => {
    // Check if all lunch states are true
    if (bsu && bmo && btu && bwe && bth && bfr && bsa) {
      setChackedBF(true);  // Set breakfast state to true
    } else {
      setChackedBF(false); // Set breakfast state to false
    }
  }, [bsu, bmo, btu, bwe, bth, bfr, bsa]);




  const [blocked, setBlocked] = useState(stdata.block);
  console.log(blocked);

  const handleBlockChange = () => {
    const blockStatus = window.confirm("Are you sure you want to block this user")
    if (blockStatus) {

      setBlocked(true);
      console.log(blocked);
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
        })
    }
  };

  const handleUnblockChange = () => {
    console.log('called');
    const unblockStatus = window.confirm("Are sure you want to unblock this user")
    if (unblockStatus) {
      setBlocked(false);
      console.log(blocked);
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
        })
    }
  };




  const handleCkeckedlsu = () => {
    const conFirmOfLsu = window.confirm("Are you sure you want to apply this change? ")
    if (conFirmOfLsu) {
      setLsu(!lsu)
    }
  }

  const handleCkeckedLmo = () => {
    const confirmOFLmo = window.confirm("Are you sure you want to apply this change?")
    if (confirmOFLmo) {
      setLmo(!lmo)
    }
  }

  const handleCkeckedLtu = () => {
    const confirmOfLtu = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLtu) {
      setLtu(!ltu)
    }
  }

  const handleCkeckedLwe = () => {
    const confirmOfLwe = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLwe) {
      setLwe(!lwe)
    }
  }

  const handleCkeckedLth = () => {
    const confirmOfLth = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLth) {
      setLth(!lth)
    }
  }

  const handleCkeckedLfr = () => {
    const confirmOfLfr = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLfr) {
      setLfr(!lfr)
    }
  }

  const handleCheckedLsa = () => {
    const confrimOfLsa = window.confirm("Are you sure you want to apply this change?")
    if (confrimOfLsa) {
      setLsa(!lsa)
    }
  }


  const handleCheckedBsu = () => {
    const conFirmOfLsu = window.confirm("Are you sure you want to apply this change?")
    if (conFirmOfLsu) {
      setBsu(!bsu)
    }
  }

  const handleCheckedBmo = () => {
    const confirmOFLmo = window.confirm("Are you sure you want to apply this change?")
    if (confirmOFLmo) {
      setBmo(!bmo)
    }
  }

  const handleCheckedBtu = () => {
    const confirmOfLtu = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLtu) {
      setBtu(!btu)
    }
  }

  const handleCheckedBwe = () => {
    const confirmOfLwe = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLwe) {
      setBwe(!bwe)
    }
  }

  const handleCheckedBth = () => {
    const confirmOfLth = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLth) {
      setBth(!bth)
    }
  }

  const handleCheckedBfr = () => {
    const confirmOfLfr = window.confirm("Are you sure you want to apply this change?")
    if (confirmOfLfr) {
      setBfr(!bfr)
    }
  }

  const handleCheckedBsa = () => {
    const confrimOfLsa = window.confirm("Are you sure you want to apply this change?")
    if (confrimOfLsa) {
      setBsa(!bsa)
    }
  }


  const lunchSelectAll = (event) => {

    const { checked } = event.target;
    const LunchSelectConfirm = window.confirm('Are you sure you want to apply this change?');
    if (LunchSelectConfirm) {
      if (checked) {

        setLsu(true)
        setLmo(true)
        setLtu(true)
        setLwe(true)
        setLth(true)
        setLfr(true)
        setLsa(true)
      }
      else {
        setLsu(false)
        setLmo(false)
        setLtu(false)
        setLwe(false)
        setLth(false)
        setLfr(false)
        setLsa(false)
      }
    }
  };

  const selectBreackfastAll = (event) => {
    const { checked } = event.target;
    const breackFastConfirm = window.confirm('Are you sure you want to apply this change?');
    if (breackFastConfirm) {
      if (checked) {
        setBsu(true)
        setBmo(true)
        setBtu(true)
        setBwe(true)
        setBth(true)
        setBfr(true)
        setBsa(true)
      } else {
        setBsu(false)
        setBmo(false)
        setBtu(false)
        setBwe(false)
        setBth(false)
        setBfr(false)
        setBsa(false)
      }
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 ">
      <div className="max-w-md mx-auto bg-white rounded shadow-md p-4 border border-gray-500 border-l-8 border-b-2 border-r-2 ">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4 text-center">Student Portal</h2>
          <div className="flex">

            
            <div className='block w-full p-2'>

              <div className=" mb-4">
                <div className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md shadow-sm">
                  <i className="fas fa-user text-blue-500 text-lg"></i>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Name</span>
                    <span className="text-gray-800 text-sm font-medium">{stdata.uname}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md shadow-sm">
                  <i className="fas fa-id-badge text-blue-500 text-lg"></i>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Token Number</span>
                    <span className="text-gray-800 text-sm font-medium">{stdata.tokenNo}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-auto mt-2 pr-6 h-28 border border-gray-500 border-l-2 border-b-2 border-r-2 rounded p-4"> {/* ml-auto pushes content to the right */}
              <div>
                {blocked ? (
                  <div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="block"
                        name="blockUnblock"
                        className="form-radio h-5 w-5 text-blue-500"
                        checked={true}
                        onChange={handleBlockChange}
                      />
                      <label htmlFor="block" className="ml-2 text-red-600">Block</label>
                    </div>
                    <div className="flex items-center mt-2">
                      <input
                        type="radio"
                        id="unblock"
                        name="blockUnblock"
                        className="form-radio h-5 w-5"
                        checked={false}
                        onChange={handleUnblockChange}
                      />
                      <label htmlFor="unblock" className="ml-2 text-green-700">Unblock</label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="block"
                        name="blockUnblock"
                        className="form-radio h-5 w-5 text-blue-500"
                        checked={false}
                        onChange={handleBlockChange}
                      />
                      <label htmlFor="block" className="ml-2 text-red-600">Block</label>
                    </div>
                    <div className="flex items-center mt-2">
                      <input
                        type="radio"
                        id="unblock"
                        name="blockUnblock"
                        className="form-radio h-5 w-5"
                        checked={true}
                        onChange={handleUnblockChange}
                      />
                      <label htmlFor="unblock" className="ml-2 text-green-700">Unblock</label>
                    </div>
                  </div>
                )}
              </div>


              {blocked && (
                <span className="ml-2 text-red-500 text-[0.70rem]  underline">Token is locked</span>
              )}
            </div>

          </div>

          <div class="border-t border-gray-300 my-4"></div>
          
          <div className='border border-gray-300 rounded-lg shadow-sm bg-white'>

          <div className="mb-4 p-4 ">
              <label className="block text-gray-800 text-sm font-semibold mb-2">
                Breakfast
              </label>
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  onChange={selectBreackfastAll}
                  checked={checkedBF}
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>

              <div className="grid grid-cols-7 gap-0 mt-3">
                {/* Sunday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="su" className="text-xs text-gray-600">Su</label>
                  <input
                    type="checkbox"
                    id="su"
                    name="day"
                    checked={bsu}
                    onChange={handleCheckedBsu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>

                {/* Monday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="mo" className="text-xs text-gray-600">Mo</label>
                  <input
                    type="checkbox"
                    id="mo"
                    name="day"
                    checked={bmo}
                    onChange={handleCheckedBmo}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>

                {/* Tuesday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="tu" className="text-xs text-gray-600">Tu</label>
                  <input
                    type="checkbox"
                    id="tu"
                    name="day"
                    checked={btu}
                    onChange={handleCheckedBtu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>

                {/* Wednesday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="we" className="text-xs text-gray-600">We</label>
                  <input
                    type="checkbox"
                    id="we"
                    name="day"
                    checked={bwe}
                    onChange={handleCheckedBwe}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>

                {/* Thursday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="th" className="text-xs text-gray-600">Th</label>
                  <input
                    type="checkbox"
                    id="th"
                    name="day"
                    checked={bth}
                    onChange={handleCheckedBth}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>

                {/* Friday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="fr" className="text-xs text-gray-600">Fr</label>
                  <input
                    type="checkbox"
                    id="fr"
                    name="day"
                    checked={bfr}
                    onChange={handleCheckedBfr}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>

                {/* Saturday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="sa" className="text-xs text-gray-600">Sa</label>
                  <input
                    type="checkbox"
                    id="sa"
                    name="day"
                    checked={bsa}
                    onChange={handleCheckedBsa}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div class="border-t border-gray-300 my-4"></div>

            <div className="mb-4 p-4 pt-1">
              <label className="block text-gray-800 text-sm font-semibold mb-2">
                Lunch
              </label>
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  onChange={lunchSelectAll}
                  checked={checkedL}
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>

              <div className="grid grid-cols-7 gap-0 mt-3">
                {/* Sunday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="su" className="text-xs text-gray-600">Su</label>
                  <input
                    type="checkbox"
                    id="su"
                    name="day"
                    checked={lsu}
                    onChange={handleCkeckedlsu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                {/* Monday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="mo" className="text-xs text-gray-600">Mo</label>
                  <input
                    type="checkbox"
                    id="mo"
                    name="day"
                    checked={lmo}
                    onChange={handleCkeckedLmo}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                {/* Tuesday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="tu" className="text-xs text-gray-600">Tu</label>
                  <input
                    type="checkbox"
                    id="tu"
                    name="day"
                    checked={ltu}
                    onChange={handleCkeckedLtu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                {/* Wednesday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="we" className="text-xs text-gray-600">We</label>
                  <input
                    type="checkbox"
                    id="we"
                    name="day"
                    checked={lwe}
                    onChange={handleCkeckedLwe}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                {/* Thursday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="th" className="text-xs text-gray-600">Th</label>
                  <input
                    type="checkbox"
                    id="th"
                    name="day"
                    checked={lth}
                    onChange={handleCkeckedLth}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                {/* Friday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="fr" className="text-xs text-gray-600">Fr</label>
                  <input
                    type="checkbox"
                    id="fr"
                    name="day"
                    checked={lfr}
                    onChange={handleCkeckedLfr}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                {/* Saturday */}
                <div className="flex flex-col items-center">
                  <label htmlFor="sa" className="text-xs text-gray-600">Sa</label>
                  <input
                    type="checkbox"
                    id="sa"
                    name="day"
                    checked={lsa}
                    onChange={handleCheckedLsa}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>
              </div>
            </div>
            

            
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={toggleCheckoutOptions}
              className="text-blue-500 underline text-[0.85rem] cursor-pointer focus:outline-none"
            >
              More Options
            </button>
          </div>
          {showCheckoutOptions && (
            <div className="mb-4 ">
              <h2 className="text-sm font-bold mb-2 ">Dietary Preferences</h2>
              <div className="flex flex-wrap px-8 py-3">
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-gray-600"
                    checked={beef}
                    onChange={handleBeefToggle}
                  />
                  <span className="ml-2 text-sm cursor-pointer">Beef</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-gray-600"
                    checked={chicken}
                    onChange={handleChickenToggle}
                  />
                  <span className="ml-2 text-sm cursor-pointer">Chicken</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-gray-600"
                    checked={fish}
                    onChange={handleFishToggle}
                  />
                  <span className="ml-2 text-sm cursor-pointer">Fish</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-gray-600"
                    checked={mutton}
                    onChange={handleMuttonToggle}
                  />
                  <span className="ml-2 text-sm cursor-pointer">Mutton</span>
                </label>
              </div>
            </div>
          )}
          <button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default AstudentPort;
