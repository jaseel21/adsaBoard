import React, { useState, useEffect, useContext } from 'react';
import { useWorldTime } from '../utils/time';
import firebase from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPrint,faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import {motion} from "framer-motion"
import { faTimes, faCheck, faSun, faUtensils,faBowlFood } from '@fortawesome/free-solid-svg-icons';

import "./Home.css"



const SwitchButton = ({ number,block, isOn,  toggleSwitch }) => {
  return (
<button
  onClick={toggleSwitch}
  disabled={block}
  className={`relative overflow-hidden
    flex items-center justify-center
    w-14 h-14 rounded-2xl select-none
    font-semibold text-md tracking-wide
    transition-all duration-300 ease-out
    hover:scale-[1.03] active:scale-95
    shadow-lg
    focus:outline-none focus:ring-4 focus:ring-white/30
    ${block
      ? "bg-gradient-to-b from-gray-700 to-gray-900 text-white cursor-not-allowed shadow-gray-800/40"
      : isOn
       ? "bg-gradient-to-b from-green-600 to-green-800 text-white shadow-black/20 hover:shadow-black/30"
      : "bg-gradient-to-b from-red-600 to-red-800 text-white shadow-black/20 hover:shadow-black/30"
    }
  `}
  style={{
    textShadow: !block ? "0 2px 4px rgba(0,0,0,0.25)" : "none",
  }}
>
  {/* Shine Animated Overlay */}
  {!block && (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-60"></div>
      <div className="absolute -top-16 -left-20 w-40 h-40 bg-white/20 blur-2xl rounded-full animate-pulse"></div>
    </div>
  )}

  {/* Number */}
  <span className="relative z-10">{number}</span>

  {/* Blocked overlay */}
  {block && (
    <div className="absolute inset-0 z-20   rounded-2xl"></div>
  )}
</button>

  );
};

const SwitchPage = () => {


  const [documents, setDocuments] = useState([]);
  const [lunchCount, setLunchCount] = useState(0);
  const [breakfastCount, setBreakfastCount] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state
  const { timeHms, longDate, dayShort, dayFull } = useWorldTime('Asia/Kolkata')


  

  const navigate=useNavigate()

  const [day, setDay] = useState("");
  const [day1,setDay1]=useState("");

  // const [showAlert, setShowAlert] = useState(false);

  // All time and date values use worldtimeapi hook (useWorldTime) for device-independent time
   

  // Derive current IST date string from worldtimeapi hook
  // Removed getISTDate - use longDate directly from useWorldTime hook

  // worldtimeapi fetching is centralized in useWorldTime


  
  
   

  // Removed getDayOfWeek - use dayShort directly from useWorldTime hook


  useEffect(() => {
    const updateDay = () => {
      // Use dayShort directly from worldtimeapi hook
      const dayOfWeek = dayShort;
      setDay1(dayOfWeek);
      // Use timeHms directly from worldtimeapi hook
      const currentTime = timeHms;
      if (currentTime > "18:00:00") {
        const days = ["su", "mo", "tu", "we", "th", "fr", "sa"];
        const currentIndex = days.indexOf(dayOfWeek);
        const nextDay = days[(currentIndex + 1) % 7];
        setDay(nextDay);
      } else {
        setDay(dayOfWeek);
      }
    };

    // Initial call to set the day immediately on mount
    updateDay();

    // Set up an interval to update every minute
    const timer = setInterval(updateDay, 60000);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, [timeHms, dayShort]);
 
  



  // Function to get the day of the week from a Date object
 

  useEffect(() => {
  
    const fetchData = async () => {
      try {
        const querySnapshot = await firebase.firestore().collection('students').get();
        const tokenDocuments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        tokenDocuments.sort((a, b) => a.tokenNo - b.tokenNo);
        setDocuments(tokenDocuments);
        
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }finally{
        setLoading(false)
      }
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   // Show alert on every component mount/reload
  //   setShowAlert(true);
  // }, []);

  useEffect(() => {
    calculateCounts();
  }, [documents]);

  const calculateCounts = () => {
    try {
      let lunch = 0;
      let breakfast = 0;
      
      documents.forEach((doc) => {
        if (doc.block==false && doc.obj.lunch[day]) {
          lunch++;
        }
        if (doc.block==false && doc.obj.breakfast[day]) {
          breakfast++;
        }
      });

      setLunchCount(lunch);
      setBreakfastCount(breakfast);
    } catch (err) {
      console.error('Error calculating counts:', err);
    }
  };

  const toggleSwitch = async (index) => {
    const doc = documents[index];
    navigate(`/login?token=${doc.tokenNo}`);
  };

  const [isLunch, setIsLunch] = useState(true); // State to track current status, default is lunch
  const [detailsDoc, setDetailsDoc] = useState(null);

  const toggleStatus = () => {
    setIsLunch(!isLunch); // Toggle between lunch and breakfast
  };


  const handleUpdateBtn=()=>{
    navigate('/login')
  }

  const supplyList=()=>{
    navigate("/pdfg")
  }

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

//   const message = `പ്രിയ ഉപഭോക്താവേ,
// adsaTboard'ന്‍റെ സർവീസിൽ താങ്കൾ സംതൃപ്തനാണെന്ന് പ്രതീക്ഷിക്കുന്നു.
// ALZAHRA അറബിക് മാഗസിനിലേക്ക് താങ്കളുടെ കൃതികൾ എത്രയും പെട്ടെന്ന് സമർപ്പിക്കുക.
// അല്ലാത്തപക്ഷം, adsaTboard മുഖേനയുള്ള ചോറ് സർവീസ് ബ്ലോക്ക് ചെയ്യപ്പെട്ടേക്കാം `

//   const footer = `തടസ്സങ്ങളില്ലാത്ത സേവനകൾക്കായി കൃതികൾ സമർപ്പിക്കൂ ....`




  // const addStudent=()=>{
  //   firebase.firestore().collection('students').add({

  //     uname:"NAFIH NANDI",
  //     tokenNo:200,
  //     password:"155",
  //     block:false,
  //     obj:{
  //       lunch:{
  //         su:true,
  //         mo:true,
  //         tu:true,
  //         we:true,
  //         th:true,
  //         fr:true,
  //         sa:true
  //       },
  //       breakfast:{
  //         su:true,
  //         mo:true,
  //         tu:true,
  //         we:true,
  //         th:true,
  //         fr:true,
  //         sa:true
  //       }
  //     },
  //     obj2:{
  //       beef:true,
  //       chicken:true,
  //       fish:true,
  //       mutton:true
  //     }
  
  //   }
  // ).then(()=>{
  //     window.location.href = "/";
  //   }).catch((error) => {
  //     console.error("Error adding document: ", error);
  //   })


  // }

  const fullDayName = {
    su: 'Sunday',
    mo: 'Monday',
    tu: 'Tuesday',
    we: 'Wednesday',
    th: 'Thursday',
    fr: 'Friday',
    sa: 'Saturday'
  };

  const dayOrder = ['su','mo','tu','we','th','fr','sa'];
  const splitDays = (dayObj) => {
    const on = [];
    const off = [];
    dayOrder.forEach(k => {
      if (dayObj && dayObj[k]) on.push(k); else off.push(k);
    });
    return { on, off };
  };


  if (loading) {
    // Loading screen


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] ">
  {/* Bouncing Dots */}
  <div className="flex space-x-2">
    {[...Array(3)].map((_, index) => (
      <motion.div
        key={index}
        className="w-4 h-4 rounded-full bg-green-500"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.6,
          delay: index * 0.2,
        }}
      ></motion.div>
    ))}
  </div>
  <motion.p
    className="mt-4 text-green-700 font-bold text-lg"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
  >
    Loading...
  </motion.p>
</div>


  );
}

  



  return (
    <div className='text-center'>
       {/* <button onClick={updateStudentMeals} className='bg-black text-white font-bold p-5'>
        update st
      </button>  */}
      {/* <button className='bg-black text-white' onClick={deleteStudent}>delete</button> */}
<div className=" flex justify-end mr-5 py-1 items-end md:mr-36  ">
  


<div className="flex justify-end mb-6 pt-2 ">
          <div className="bg-white rounded-xl shadow-md px-6 py-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h1 className="text-sm font-semibold text-gray-700 uppercase">{fullDayName[day]}</h1>
            </div>
            <h2 className="text-xs text-gray-500 text-center">{longDate}</h2>
          </div>
        </div>

        </div>
      <div className="flex px-5 md:px-36 pb-5 justify-between">
        
      <div className="text-left p-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-xl shadow-emerald-100/30 relative overflow-hidden transition-all duration-300 hover:shadow-emerald-200/50 hover:scale-[1.01]">
  {/* Gentle background gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/40 to-transparent pointer-events-none" />

  {/* Content */}
  <div className="relative space-y-3">
    <h1 className="text-base font-semibold text-gray-800 flex items-center gap-2">
      <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm" />
      Lunch:
      <span className="text-emerald-600 font-bold tracking-tight">{lunchCount}</span>
    </h1>

    <h1 className="text-base font-semibold text-gray-800 flex items-center gap-2">
      <span className="w-2 h-2 bg-amber-500 rounded-full shadow-sm" />
      Breakfast:
      <span className="text-amber-600 font-bold tracking-tight">{breakfastCount}</span>
    </h1>
  </div>

  {/* Action Button */}
  <div className="flex justify-center mt-4">
    <button
      onClick={supplyList}
      className="
        relative inline-flex items-center gap-2
        px-4 py-2
        bg-gradient-to-r from-emerald-600 to-green-600
        hover:from-emerald-700 hover:to-green-700
        text-white font-semibold text-sm rounded-lg
        shadow-md hover:shadow-emerald-400/30 border border-emerald-500/30
        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1
        transform hover:scale-[1.04] active:scale-[0.97]
        transition-all duration-200 ease-in-out overflow-hidden group
      "
    >
      {/* Soft hover glow overlay */}
      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <FontAwesomeIcon icon={faPrint} className="h-4 w-4 z-10" />
      <span className="z-10">Supply List</span>
    </button>
  </div>
</div>



        
 

        <div className="flex items-center">
        
        {/* <button onClick={handleUpdateBtn} className="bg-green-500	 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md border border-blue-500 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
  Update Token
//</button> */}<button
onClick={handleUpdateBtn}
      
      className=" bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg border-none transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 inline-flex items-center"
    >
<svg className="fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">

  <path d="M14.12 2.62a2.5 2.5 0 0 0-3.54 0L7.29 6.56a1 1 0 0 0-.29.71v8.59a1 1 0 0 0 1 1h8.59a1 1 0 0 0 .71-.29l3.29-3.29a2.5 2.5 0 0 0 0-3.54l-6.46-6.46zM12 4.13l3.88 3.88-1.41 1.41L10.59 5.54 12 4.13zM7 15.59V12h4v4H8.41L7 15.59zM17.29 16.29l-1.41-1.41 2.12-2.12 1.41 1.41-2.12 2.12z"/>
</svg>



      <span className='text-sm' >Update token</span>
    </button>

 </div>
      </div>  

      <div className="flex items-center justify-center">
  <button
        onClick={toggleStatus}
        className={`group relative flex items-center justify-center w-56 h-14 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl focus:outline-none ring-4 ring-emerald-500/30 transition-all duration-700 ease-out shadow-lg shadow-2xl shadow-emerald-500/20 border border-slate-600/50 backdrop-blur-sm`}
      >
        {/* Animated toggle circle */}
        <span
          className={`absolute top-1 bottom-1 my-auto w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl transition-all duration-700 ease-out border border-slate-500/30 ${
            isLunch ? "left-1" : "left-[calc(100%-3.25rem)]"
          }`}
          style={{
            boxShadow: isLunch 
              ? "0 0 20px 4px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)" 
              : "0 0 20px 4px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
          }}
        >
          {/* Inner glow indicator */}
          <div 
            className={`absolute inset-1 rounded-lg transition-all duration-700 ${
              isLunch ? 'bg-emerald-500/20' : 'bg-blue-500/20'
            }`}
          />
        </span>
        
        {/* Text Content */}
        <div className="flex flex-col items-center z-10">
          <span className={`font-bold text-lg tracking-wide transition-colors duration-700 ${
            isLunch ? 'text-emerald-100' : 'text-blue-100'
          }`}>
            {isLunch ? "Lunch" : "Breakfast"}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-0.5 group-hover:text-slate-300 transition-colors duration-300">
            {isLunch ? "Switch to breakfast" : "Switch to lunch"}
          </span>
        </div>
        
        {/* Arrow Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 text-white absolute transition-all duration-700 ease-out z-10 ${
            isLunch ? "left-5 rotate-180" : "right-5 rotate-180"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d={
              isLunch
                ? "M7 16l-4-4m0 0l4-4m-4 4h18" // Arrow pointing left
                : "M17 8l4 4m0 0l-4 4m4-4H3" // Arrow pointing right
            }
          />
        </svg>
        
        {/* Decorative wave pattern */}
        <div className={`absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-opacity duration-700 ${
          isLunch ? 'opacity-30' : 'opacity-20'
        }`}>
          <svg 
            className="absolute top-0 left-0 w-full h-full" 
            viewBox="0 0 288 56" 
            preserveAspectRatio="none"
          >
            <path
              d={isLunch 
                ? "M0,28 Q72,10 144,28 T288,28 L288,56 L0,56 Z"
                : "M0,28 Q72,46 144,28 T288,28 L288,0 L0,0 Z"
              }
              fill={isLunch ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)"}
              className="transition-all duration-700 ease-out"
            />
          </svg>
        </div>
        
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isLunch 
            ? 'bg-gradient-to-r from-emerald-500/5 to-green-500/5' 
            : 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5'
        }`} />
        
        {/* Animated border glow */}
        <div className={`absolute inset-0 rounded-2xl transition-all duration-700 ${
          isLunch 
            ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.3)]' 
            : 'shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
        } opacity-0 group-hover:opacity-100`} />
      </button>




 





    </div>
      {
        isLunch ?
        <>
        <div className='md:px-28 '>

      <h1 className='text-3xl  font-bold mb-8'></h1>
      <div className="flex flex-wrap justify-center gap-3">
        {documents.map((doc, index) => (
          <SwitchButton
            key={index}
            number={doc.tokenNo}
            block={doc.block}
            isOn={doc.obj && doc.obj.lunch[day]}
            toggleSwitch={() => toggleSwitch(index)}
          />                                          
        ))}
      </div> 
        </div>
        </> : 
        <>
        <div className='md:px-28'>

        <h1 className='text-3xl  font-bold mb-8'></h1>
        <div className="flex flex-wrap justify-center gap-3">
          {documents.map((doc, index) => (
            <SwitchButton
              key={index}
              number={doc.tokenNo}
              block={doc.block}
              isOn={doc.obj && doc.obj.breakfast[day]}
              toggleSwitch={() => toggleSwitch(index)}
            />
          ))}
        </div> 
        </div>
          </>
      }
      
      
      {/* Details Modal */}
      {detailsDoc && (
      <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200"
      onClick={() => setDetailsDoc(null)}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-5">
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center mt-2 space-x-2">
        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-sm font-semibold text-white">NO : {detailsDoc.tokenNo}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-xs text-white/90">{detailsDoc.uname}</p>
        </div>
      </div>
    </div>
    <button
      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm"
      onClick={() => setDetailsDoc(null)}
    >
      <FontAwesomeIcon icon={faTimes} className="text-lg" />
    </button>
  </div>
 
  {/* Decorative Wave */}
  <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" style={{ clipPath: 'ellipse(100% 100% at 50% 100%)' }}></div>
</div>
    
        {/* Content */}
        <div className="p-4 space-y-5 bg-gray-50">

  {/* Breakfast Section */}
  <div className="bg-white rounded-xl shadow-sm border border-yellow-100 overflow-hidden">

    {/* Header */}
    <div className="px-4 py-2.5 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-md flex items-center justify-center shadow-sm">
          <FontAwesomeIcon icon={faUtensils} className="w-3.5 h-3.5 text-white" />
        </div>
        <h4 className="font-semibold text-gray-900 text-sm">Breakfast</h4>
      </div>
    </div>

    {/* Days Grid */}
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "Sun", key: "su" },
          { label: "Mon", key: "mo" },
          { label: "Tue", key: "tu" },
          { label: "Wed", key: "we" },
          { label: "Thu", key: "th" },
          { label: "Fri", key: "fr" },
          { label: "Sat", key: "sa" },
        ].map(({ label, key }) => {
          const isChecked = detailsDoc?.obj?.breakfast?.[key] === true;
          return (
            <div key={key} className="flex flex-col items-center space-y-1.5">
              <span className="text-[10px] font-medium text-yellow-700">{label}</span>

              <div
                onClick={() => navigate("/login")}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isChecked
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 border border-amber-300 scale-105 shadow-sm"
                    : "bg-yellow-50 border border-yellow-200 hover:border-yellow-300 hover:bg-yellow-100"
                }`}
              >
                {isChecked ? (
                  <FontAwesomeIcon icon={faCheck} className="text-white text-base" />
                ) : (
                  <span className="text-yellow-300 text-lg">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {/* Lunch Section */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

    {/* Header */}
    <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-500 rounded-md flex items-center justify-center shadow-sm">
          <FontAwesomeIcon icon={faBowlFood} className="w-3.5 h-3.5 text-white" />
        </div>
        <h4 className="font-semibold text-gray-900 text-sm">Lunch</h4>
      </div>
    </div>

    {/* Days Grid */}
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "Sun", key: "su" },
          { label: "Mon", key: "mo" },
          { label: "Tue", key: "tu" },
          { label: "Wed", key: "we" },
          { label: "Thu", key: "th" },
          { label: "Fri", key: "fr" },
          { label: "Sat", key: "sa" },
        ].map(({ label, key }) => {
          const isChecked = detailsDoc?.obj?.lunch?.[key] === true;
          return (
            <div key={key} className="flex flex-col items-center space-y-1.5">
              <span className="text-[10px] font-medium text-gray-600">{label}</span>

              <div
                onClick={() => navigate("/login")}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isChecked
                    ? "bg-gradient-to-br from-emerald-500 to-green-500 border border-emerald-400 scale-105 shadow-sm"
                    : "bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                }`}
              >
                {isChecked ? (
                  <FontAwesomeIcon icon={faCheck} className="text-white text-base" />
                ) : (
                  <span className="text-gray-300 text-lg">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

</div>

      </div>
    </div>
      )}
    </div>
  );
};

export default SwitchPage;