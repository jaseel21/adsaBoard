import React, { useContext, useState, useEffect } from 'react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import {  useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './StudentPort.css'

function StudentPort() {
  const { stdata } = useContext(DataOfOne);

  const [lunch, setLunch] = useState(stdata.obj.lunch);
  const [breakfast, setBreakfast] = useState(stdata.obj.breakfast);
  const [beef, setBeef] = useState(stdata.obj2.beef);
  const [chicken, setChicken] = useState(stdata.obj2.chicken);
  const [fish, setFish] = useState(stdata.obj2.fish);
  const [mutton, setMutton] = useState(stdata.obj2.mutton);

  const navigate = useNavigate();
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);


  const [day, setDay] = useState("");

  useEffect(() => {
    // Function to get the current day of the week in GMT+5:30
    const updateDay = () => {
      const nowUtc = new Date(); // Current time in UTC
      // Manually adjust for GMT+5:30
      const gmtPlus530 = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
      const dayOfWeek = getDayOfWeek(gmtPlus530);
      setDay(dayOfWeek);
      console.log(dayOfWeek, "day");
    };

    // Initial call to set the day immediately on mount
    updateDay();

    // Set up an interval to update every minute
    const timer = setInterval(updateDay, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, []);

  console.log( day);
  const [lsu,setLsu]=useState(stdata.obj.lunch['su'] )
  const [lmo,setLmo]=useState(stdata.obj.lunch["mo"])
  const [ltu,setLtu]=useState(stdata.obj.lunch["tu"])
  const [lwe,setLwe]=useState(stdata.obj.lunch["we"])
  const [lth,setLth]=useState(stdata.obj.lunch["th"])
  const [lfr,setLfr]=useState(stdata.obj.lunch["fr"])
  const [lsa,setLsa]=useState(stdata.obj.lunch["sa"])

  const [bsu,setBsu]=useState(stdata.obj.breakfast['su'] )
  const [bmo,setBmo]=useState(stdata.obj.breakfast["mo"])
  const [btu,setBtu]=useState(stdata.obj.breakfast["tu"])
  const [bwe,setBwe]=useState(stdata.obj.breakfast["we"])
  const [bth,setBth]=useState(stdata.obj.breakfast["th"])
  const [bfr,setBfr]=useState(stdata.obj.breakfast["fr"])
  const [bsa,setBsa]=useState(stdata.obj.breakfast["sa"])


  

  // Function to get the day of the week from a Date object
  const getDayOfWeek = (date) => {
    const daysOfWeek = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    return daysOfWeek[date.getUTCDay()]; // Use getUTCDay() to ensure we're working in UTC
  };

  const lunchSelectAll = (event) => {

    const {checked} =event.target;
    const LunchSelectConfirm = window.confirm('Are you wnat to select all');
    if (LunchSelectConfirm) {
      if(checked){

        setLsu(true)
        setLmo(true)
        setLtu(true)
        setLwe(true)
        setLth(true)
        setLfr(true)
        setLsa(true)
      }
      else{
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
    const {checked}= event.target;
    const breackFastConfirm = window.confirm('Are you sure you want to change the settings');
    if (breackFastConfirm) {
      if(checked){
        setBsu(true)
        setBmo(true)
        setBtu(true)
        setBwe(true)
        setBth(true)
        setBfr(true)
        setBsa(true)
      }else{
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
        block: false,
        obj:{

          lunch: {
            su:lsu,
            mo:lmo,
            tu:ltu,
            we:lwe,
            th:lth,
            fr:lfr,
            sa:lsa
          },
          breakfast:{
            su:bsu,
            mo:bmo,
            tu:btu,
            we:bwe,
            th:bth,
            fr:bfr,
            sa:bsa
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
        navigate('/login');

      });
  };

  const toggleCheckoutOptions = () => {
    setShowCheckoutOptions(!showCheckoutOptions);
  };

  const handleCkeckedlsu=()=>{
    const conFirmOfLsu= window.confirm("are you want to change the settings  ")
    if(conFirmOfLsu){
      setLsu(!lsu)
    }
  }

  const handleCkeckedLmo=()=>{
    const confirmOFLmo= window.confirm("are you want to change the setting ")
    if(confirmOFLmo){
      setLmo(!lmo)
    }
  }

  const handleCkeckedLtu=()=>{
    const confirmOfLtu=window.confirm("are you wnat to change the token")
    if(confirmOfLtu){
      setLtu(!ltu)
    }
  }

  const handleCkeckedLwe=()=>{
    const confirmOfLwe=window.confirm("are you wnat to change the token")
    if(confirmOfLwe){
      setLwe(!lwe)
    }
  }
 
  const handleCkeckedLth=()=>{
    const confirmOfLth=window.confirm("are you wnat to change the token")
    if(confirmOfLth){
      setLth(!lth)
    }
  }

  const handleCkeckedLfr=()=>{
    const confirmOfLfr=window.confirm("are you wnat to change the token")
    if(confirmOfLfr){
      setLfr(!lfr)
    }
  }

  const handleCheckedLsa=()=>{
    const confrimOfLsa=window.confirm("are you want to change the token")
    if(confrimOfLsa){
      setLsa(!lsa)
    }
  }


  const handleCheckedBsu=()=>{
    const conFirmOfLsu= window.confirm("are you want to change the settings  ")
    if(conFirmOfLsu){
      setBsu(!bsu)
    }
  }

  const handleCheckedBmo=()=>{
    const confirmOFLmo= window.confirm("are you want to change the setting ")
    if(confirmOFLmo){
      setBmo(!bmo)
    }
  }

  const handleCheckedBtu=()=>{
    const confirmOfLtu=window.confirm("are you wnat to change the token")
    if(confirmOfLtu){
      setBtu(!btu)
    }
  }

  const handleCheckedBwe=()=>{
    const confirmOfLwe=window.confirm("are you wnat to change the token")
    if(confirmOfLwe){
      setBwe(!bwe)
    }
  }
 
  const handleCheckedBth=()=>{
    const confirmOfLth=window.confirm("are you wnat to change the token")
    if(confirmOfLth){
      setBth(!bth)
    }
  }

  const handleCheckedBfr=()=>{
    const confirmOfLfr=window.confirm("are you wnat to change the token")
    if(confirmOfLfr){
      setBfr(!bfr)
    }
  }

  const handleCheckedBsa=()=>{
    const confrimOfLsa=window.confirm("are you want to change the token")
    if(confrimOfLsa){
      setBsa(!bsa)
    }
  }


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="max-w-md mx-auto bg-white rounded shadow-md p-4">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4 text-center">Student Portal</h2>
          <div className="mb-4 flex">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name :
            </label>
            <h2 className="block pl-2 text-gray-700 text-sm  mb-2">
              {stdata.uname}
            </h2>
          </div>
          <div className="mb-4 flex">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Token Number :
            </label>
            <h2 className="block pl-2 text-gray-700 text-sm mb-2">
              {stdata.tokenNo}
            </h2>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Lunch
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-500"
                
                onChange={lunchSelectAll}
              />
              <span className='ml-2'>select all</span>
              {/* <span
                className={lunch ? "ml-2 text-green-800" : "ml-2 text-red-600"}
              >
                {lunch ? 'Lunch is On' : 'Lunch is Off'}
              </span> */}
            </label>
            <div className="flex flex-wrap gap-4 p-3">
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="su" className="text-sm">Su</label>
                <input
                  type="checkbox"
                  id="su"
                  name="day"
                  checked={lsu}
                  onChange={handleCkeckedlsu}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="mo" className="text-sm">Mo</label>
                <input
                  type="checkbox"
                  id="mo"
                  name="day"
                  onChange={handleCkeckedLmo}
                  checked={lmo}
                  
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="tu" className="text-sm">Tu</label>
                <input
                  type="checkbox"
                  id="tu"
                  name="day"
                  onChange={handleCkeckedLtu}
                  checked={ltu}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="we" className="text-sm">We</label>
                <input
                  type="checkbox"
                  id="we"
                  name="day"
                  onChange={handleCkeckedLwe}
                  checked={lwe}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="th" className="text-sm">Th</label>
                <input
                  type="checkbox"
                  id="th"
                  name="day"
                  onChange={handleCkeckedLth}
                  checked={lth}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="fr" className="text-sm">Fr</label>
                <input
                  type="checkbox"
                  id="fr"
                  name="day"
                  onChange={handleCkeckedLfr}
                  checked={lfr}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="sa" className="text-sm">Sa</label>
                <input
                  type="checkbox"
                  id="sa"
                  name="day"
                  onChange={handleCheckedLsa}
                  checked={lsa}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Breakfast
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-500"
               
                onChange={selectBreackfastAll}
              /> 
              <span className='ml-2'>select all</span>
              {/* <span
                className={breakfast ? "ml-2 text-green-800" : "ml-2 text-red-600"}
              >
                {breakfast ? 'Breakfast is On' : 'Breakfast is Off'}
              </span> */}
            </label>
          <div className="flex flex-wrap gap-4 p-3">
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="su" className="text-sm">Su</label>
                <input
                  type="checkbox"
                  id="su"
                  name="day"
                  checked={bsu}
                  onChange={handleCheckedBsu}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="mo" className="text-sm">Mo</label>
                <input
                  type="checkbox"
                  id="mo"
                  name="day"
                  checked={bmo}
                  onChange={handleCheckedBmo}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="tu" className="text-sm">Tu</label>
                <input
                  type="checkbox"
                  id="tu"
                  name="day"
                  checked={btu}
                  onChange={handleCheckedBtu}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="we" className="text-sm">We</label>
                <input
                  type="checkbox"
                  id="we"
                  name="day"
                  checked={bwe}
                  onChange={handleCheckedBwe}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="th" className="text-sm">Th</label>
                <input
                  type="checkbox"
                  id="th"
                  name="day"
                  checked={bth}
                  onChange={handleCheckedBth}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="fr" className="text-sm">Fr</label>
                <input
                  type="checkbox"
                  id="fr"
                  name="day"
                  checked={bfr}
                 onChange={handleCheckedBfr}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <label htmlFor="sa" className="text-sm">Sa</label>
                <input
                  type="checkbox"
                  id="sa"
                  name="day"
                  checked={bsa}
                  onChange={handleCheckedBsa}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={toggleCheckoutOptions}
              className="text-blue-500 underline cursor-pointer focus:outline-none"
            >
              More Options
            </button>
          </div>
          {showCheckoutOptions && (
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Checkout Options</h2>
              <div className="flex flex-wrap">
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={beef}
                    onChange={handleBeefToggle}
                  />
                  <span className="ml-2 cursor-pointer">Beef</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={chicken}
                    onChange={handleChickenToggle}
                  />
                  <span className="ml-2 cursor-pointer">Chicken</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={fish}
                    onChange={handleFishToggle}
                  />
                  <span className="ml-2 cursor-pointer">Fish</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={mutton}
                    onChange={handleMuttonToggle}
                  />
                  <span className="ml-2 cursor-pointer">Mutton</span>
                </label>
              </div>
            </div>
          )}
          <button
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentPort;
