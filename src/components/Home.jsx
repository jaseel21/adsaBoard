import React, { useState, useEffect, useContext } from 'react';
import firebase from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPrint,faCalendarDay, faTimes } from '@fortawesome/free-solid-svg-icons';
import {motion} from "framer-motion"
import "./Home.css"



const SwitchButton = ({ number,block, isOn,  toggleSwitch }) => {
  return (
    <button
      onClick={toggleSwitch}
      className={`flex items-center justify-center ${block && 'glossy-button2 text-white px-4 py-2 rounded-4xl shadow-md hover:shadow-lg transition-shadow duration-300' } ${isOn ? 'bg-green-600 glossy-button text-white  px-4 py-2 rounded-4xl shadow-md hover:shadow-lg transition-shadow duration-300' : 'bg-red-500 text-white px-4 py-2 rounded-4xl shadow-md hover:shadow-lg transition-shadow duration-300'}  text-white font-bold text-center no-underline rounded-2xl w-14 h-14 m-2 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
    >
      {number}
    </button>
  );
};

const SwitchPage = () => {


  const [documents, setDocuments] = useState([]);
  const [lunchCount, setLunchCount] = useState(0);
  const [breakfastCount, setBreakfastCount] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state
  const [serverDateTime, setServerDateTime] = useState(null)


  

  const navigate=useNavigate()

  const [day, setDay] = useState("");
  const [day1,setDay1]=useState("");

  const [showAlert, setShowAlert] = useState(false);

  // Get time string HH:mm:ss using server time if available, otherwise fallback to Intl
  const getISTTime = () => {
    try {
      if (serverDateTime) {
        // serverDateTime example: 2025-10-20T12:34:56.789123+05:30
        return serverDateTime.slice(11, 19);
      }

      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: false, // Use 24-hour format
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      return formatter.format(new Date());
    } catch (err) {
      console.error('Error getting time:', err);
      return new Date().toLocaleTimeString('en-GB');
    }
  };
   

  // New function to get IST date (e.g. October 20, 2025) using server time when available
  const getISTDate = () => {
    try {
      if (serverDateTime) {
        const datePart = serverDateTime.slice(0, 10); // YYYY-MM-DD
        const [y, m, d] = datePart.split('-').map(Number);
        const months = [
          'January','February','March','April','May','June','July','August','September','October','November','December'
        ];
        return `${months[m-1]} ${d}, ${y}`;
      }

      const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      return formatter.format(new Date());
    } catch (err) {
      console.error('Error getting date:', err);
      return new Date().toLocaleDateString();
    }
  };

  // Fetch server time from worldtimeapi and refresh periodically
  useEffect(() => {
    let cancelled = false

    const fetchServerTime = async () => {
      try {
        const resp = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
        if (!resp.ok) throw new Error('Time API not ok')
        const data = await resp.json();
        if (!cancelled) setServerDateTime(data.datetime);
      } catch (err) {
        console.warn('Failed to fetch server time, falling back to local time:', err);
      }
    }

    // Initial fetch
    fetchServerTime()

    // Refresh every 60 seconds so displayed time stays accurate
    const id = setInterval(fetchServerTime, 60000)

    return () => { cancelled = true; clearInterval(id) }
  }, [])


  
  
   

  const getDayOfWeek = (date) => {
    const daysOfWeek = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    return daysOfWeek[date.getUTCDay()]; // Use getUTCDay() to ensure we're working in UTC
  };


  useEffect(() => {
    const updateDay = () => {
      const nowUtc = new Date(); // Current time in UTC
      const gmtPlus530 = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);
      const dayOfWeek = getDayOfWeek(gmtPlus530); // Calculate the day of the week
      setDay1(dayOfWeek); // Update the state with the current day of the week
      console.log("Calculated Day of Week:", dayOfWeek);
      console.log("Current IST Time:", getISTTime());

      const currentTime = getISTTime();
      console.log(currentTime);

      
      // Use the local variable `dayOfWeek` instead of `day1`
      if (currentTime > "18:00:00") {
        const days = ["su", "mo", "tu", "we", "th", "fr", "sa"];
        const currentIndex = days.indexOf(dayOfWeek);
        const nextDay = days[(currentIndex + 1) % 7]; // Get the next day in a circular manner
        setDay(nextDay);
      } else {
        setDay(dayOfWeek); // Keep the same day if time is not past 14:00:00
      }
    };

    // Initial call to set the day immediately on mount
    updateDay();

    // Set up an interval to update every minute
    const timer = setInterval(updateDay, 60000);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, []);
 
  



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

  useEffect(() => {
    // Show alert on every component mount/reload
    setShowAlert(true);
  }, []);

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
    
    // console.log("Toggle switch for token:", documents[index]);
    navigate('/login')

    // Example logic: You would update Firestore here
  };

  const [isLunch, setIsLunch] = useState(true); // State to track current status, default is lunch

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

  const message = `പ്രിയ ഉപഭോക്താവേ adsaTboard'ന്‍റെ സർവീസിൽ തങ്ങൾ സംതൃപ്തവനാണെന്ന് പ്രതീക്ഷിക്കുന്നു.
ALZAHRA അറബിക് മാഗസീനിലേക്ക് തങ്ങേളുടെ കൃതികൾ എത്രെയും പെട്ടെന്നുതന്നെ സമർപ്പിക്കുക അല്ലാത്തപക്ഷം adsaTboard മുകേനായുള്ള ചോറ് സർവിസ് ബ്ലോക്ക് ചെയ്യപ്പെട്ടെക്കാം `

  const footer = `തടസ്സങ്ങളില്ലാത്ത സേവനകൾക്കായി കൃതികൾ സമർപ്പിക്കൂ ....`




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
            <h2 className="text-xs text-gray-500 text-center">{getISTDate()}</h2>
          </div>
        </div>

        </div>
      <div className="flex px-5 md:px-36 pb-5 justify-between">
        
      <div className="">
       <div className="text-left p-3 rounded-lg bg-white border border-gray-200 shadow-lg shadow-emerald-100/20 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent pointer-events-none" />
  <div className="relative space-y-2">
    <h1 className="text-1xl font-semibold text-gray-900 tracking-tight">
      Lunch: <span className="text-1xl text-emerald-600 font-bold">{lunchCount}</span>
    </h1>
    <h1 className="text-1xl font-semibold text-gray-900 tracking-tight">
      Breakfast: <span className="text-1xl text-emerald-600 font-bold">{breakfastCount}</span>
    </h1>
  </div>
  <div className="flex justify-center mt-4">
    <button
      onClick={supplyList}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1 px-2 rounded-lg shadow-md hover:shadow-emerald-400/25 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 flex items-center space-x-1 transform hover:scale-105 transition-all duration-200 ease-in-out relative overflow-hidden group"
    >
      <span className="absolute inset-0 bg-emerald-800/20 scale-0 group-hover:scale-100 rounded-lg transition-transform duration-300 ease-out" />
      <FontAwesomeIcon icon={faPrint} className="h-4 w-4 z-10" />
      <span className="text-[15px] z-10">Supply List</span>
    </button>
  </div>
</div>
        </div>


        
 

        <div className="flex items-center">
        
        {/* <button onClick={handleUpdateBtn} className="bg-green-500	 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md border border-blue-500 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
  Update Token
</button> */}<button
onClick={handleUpdateBtn}
      
      class=" bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg border-none transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 inline-flex items-center"
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
      <div className="flex flex-wrap justify-center">
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
        <div className="flex flex-wrap justify-center">
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
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseAlert} />

 <motion.div
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -20, opacity: 0 }}
  transition={{ duration: 0.25 }}
  className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mx-4"
>
  {/* Top Accent Bar */}
  <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>

  {/* Content */}
  <div className="p-6">
    
    {/* Header with Close Button */}
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <div>
          <h2 
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: 'Noto Sans Malayalam, sans-serif' }}
          >
            പ്രധാന അറിയിപ്പ്
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Important Notice</p>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleCloseAlert}
        className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FontAwesomeIcon icon={faTimes} className="w-4 h-4 text-gray-400" />
      </button>
    </div>

    {/* Message */}
    <div className="mb-5">
      <p 
        className="text-gray-700 text-[15px] leading-relaxed"
        style={{ fontFamily: 'Noto Sans Malayalam, sans-serif' }}
      >
        {message}
      </p>
    </div>

    {/* Deadline Chip */}
    <div className="mb-5">
      <div className="inline-flex items-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <svg className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span 
          className="text-xs font-semibold text-gray-600 mr-2"
          style={{ fontFamily: 'Noto Sans Malayalam, sans-serif' }}
        >
          അവസാന തീയതി:
        </span>
        <span className="text-sm font-bold text-red-600">21/10/2025</span>
      </div>
    </div>

    {/* Footer Attribution */}
    <div className="pt-4 border-t border-gray-100">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p 
          className="text-sm text-green-700 font-medium"
          style={{ fontFamily: 'Noto Sans Malayalam, sans-serif' }}
        >
          {footer}
        </p>
      </div>
    </div>
  </div>
</motion.div>
        </div>
      )}
    </div>
  );
};

export default SwitchPage;