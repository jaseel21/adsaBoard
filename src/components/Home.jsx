import React, { useState, useEffect, useContext } from 'react';
import firebase from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPrint,faCalendarDay } from '@fortawesome/free-solid-svg-icons';
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


  

  const navigate=useNavigate()

  const [day, setDay] = useState("");
  const [day1,setDay1]=useState("");

  const getISTTime = () => {
    const options = {
      timeZone: 'Asia/Kolkata',
      hour12: false, // Use 24-hour format
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };
  
    const formatter = new Intl.DateTimeFormat('en-US', options);
    return formatter.format(new Date());
  };
   
  
  
   

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
  
<div className='flex  items-center'>

<FontAwesomeIcon icon={faCalendarDay} className="text-sm text-gray-500 pr-1 " />
          <h1  class="text-sm  uppercase text-center text-gray-500 ">
            {fullDayName[day] || ''}
          </h1>
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
        className={`group relative flex items-center justify-center w-56 h-14 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all duration-700 ease-out shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 border border-slate-600/50 backdrop-blur-sm`}
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
      
    </div>
  );
};

export default SwitchPage;






































































































