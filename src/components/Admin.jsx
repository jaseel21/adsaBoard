import React, { useEffect, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData'; // Assuming this is your context
import { useNavigate,useLocation } from 'react-router-dom';
import {AuthContext} from "../store/AuthContext"
import { motion } from 'framer-motion';
import {faCalendarDay } from '@fortawesome/free-solid-svg-icons';


const SwitchButton = ({ number,block, isOn, toggleSwitch }) => {
  return (
    <button
    onClick={toggleSwitch}
    className={`flex items-center justify-center ${block && 'glossy-button2 text-white px-4 py-2 rounded-4xl shadow-md hover:shadow-lg transition-shadow duration-300' } ${isOn ? 'bg-green-600 glossy-button text-white  px-4 py-2 rounded-4xl shadow-md hover:shadow-lg transition-shadow duration-300' : 'bg-red-500 text-white px-4 py-2 rounded-4xl shadow-md hover:shadow-lg transition-shadow duration-300'}  text-white font-bold text-center no-underline rounded-2xl w-14 h-14 m-2 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
  >
    {number}
  </button>
  );
};

function Admin() {
  const location=useLocation()
  const { setStdata } = useContext(DataOfOne); // Getting context value

  const [documents, setDocuments] = useState([]);
  const [isChecked, setIsChecked] = useState();
  const [isLunch, setIsLunch] = useState(false);
  const [loading,setLoading]=useState(true)
  const navigate=useNavigate()

  const {user}=useContext(AuthContext)

  useEffect(() => {
    // Check for location state and update isLunch accordingly
    if (location.state?.isLunch !== undefined) {
      setIsLunch(location.state.isLunch);
    } else {
      setIsLunch(false); // Default value if no state is provided
    }
  }, [location.state]);

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
        setLoading(false)

        await firebase.firestore().collection("tokenboard").doc("g8iJVNn2RQkysjMAvX1h").get().then((doc=>{
          if (doc.exists) {
            
            let tbStatus = doc.data(); // Assign doc.data() to tbStatus
            console.log(tbStatus); // Optionally log tbStatus
            setIsChecked(tbStatus.status)
          } else {
            console.log("No such document!");
          }
        }))

      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchData();
  }, []);

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

  // Function to get the day of the week from a Date object
  const getDayOfWeek = (date) => {
    const daysOfWeek = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    return daysOfWeek[date.getUTCDay()]; // Use getUTCDay() to ensure we're working in UTC
  };



  const toggleSwitch1 = () => {
    if(user){

      const action = isChecked ? 'close' : 'open';
      const changeConfirm = window.confirm(`Are you sure you want to ${action} the board?`);
      if (changeConfirm) {
        changeStatus();
      }
    }else{
      navigate('/alogin')
    }
  };

  const changeStatus = () => {
     firebase.firestore().collection("tokenboard").doc("g8iJVNn2RQkysjMAvX1h").get().then((doc=>{
      if (doc.exists) {
        
        let tbStatus = doc.data(); // Assign doc.data() to tbStatus
        console.log(tbStatus); // Optionally log tbStatus
        setIsChecked(tbStatus.status)
        console.log(tbStatus);
      } else {
        console.log("No such document!");
      }
    }))
    // setIsChecked(!isChecked);
    firebase.firestore().collection("tokenboard").doc("g8iJVNn2RQkysjMAvX1h").set({
      status: !isChecked
    });
  };

  const toggleSwitch = async (index) => {

    let StInfo = await firebase.firestore().collection('students').where('tokenNo', '==', parseInt(documents[index].tokenNo)).get();
    if (!StInfo.empty) {
      let studentData = StInfo.docs[0].data();
      studentData.documentId = StInfo.docs[0].id;
      studentData.isLunch=isLunch

      setStdata(studentData); // Assuming setStdata updates context state
      navigate("/astudent-port")

      // Assuming navigate is a function to navigate to a different page (e.g., using React Router)
      // Make sure to import navigate from your routing library (e.g., React Router's useHistory)
      // navigate('/student-portal');
    }
    // Example logic: You would update Firestore here
  };

  const toggleStatus = () => {
    setIsLunch(!isLunch);
  };
 


const handleTokens =()=>{
  navigate("/m-tokens")
}


if (loading) {
  // Loading screen


return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
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
const fullDayName = {
  su: 'Sunday',
  mo: 'Monday',
  tu: 'Tuesday',
  we: 'Wednesday',
  th: 'Thursday',
  fr: 'Friday',
  sa: 'Saturday'
};

  return (
    <div className=''>
      <div className="p-2 flex">
  
      
        <div className="flex flex-col items-center p-2 justify-center  rounded-md w-1/3 md:w-1/12 ">
  {/* <h1 className="text-gray-800 text-lg font-semibold mb-4">Token Board</h1> */}
  <div className="flex flex-col items-center">
    <span className="text-sm text-gray-500 font-medium mb-2">
      {isChecked ? 'Unlocked' : 'Locked'}
    </span>
    <div className="relative">
      {/* Outer metallic ring */}
      <div
        className={`w-16 h-16 rounded-full bg-gray-800 border-4 shadow-inner flex items-center justify-center relative duration-300 ${
          isChecked ? 'border-green-500' : 'border-red-500'
        }`}
        style={{
          boxShadow: `0 0 15px ${isChecked ? 'green' : 'red'}`,
          background: 'linear-gradient(145deg, #3a3a3a, #1a1a1a)', // Metallic gradient
        }}
      >
        {/* Inner dial with lock/unlock icon */}
        <div
          className={`w-10 h-10 bg-gray-700 rounded-full shadow-md flex items-center justify-center`}
        >
          {/* Lock/Unlock SVG icon */}
          {isChecked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 17v-1m-4-4v-4a4 4 0 118 0v4m4 4v4H4v-4h16z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12V9a4 4 0 00-8 0v3m-4 4v4h16v-4m-4-4h-4m4 0h-4"
              />
            </svg>
          )}
        </div>
      </div>
      {/* Clickable button */}
      <button
        className="absolute inset-0 rounded-full focus:outline-none"
        onClick={toggleSwitch1}
      ></button>
    </div>
  </div>
</div>



<div className='flex-wrap ml-auto'>
<div className="  justify-end  py-1 items-end  ">
  
  <div className='  items-center'>
  
            <h1  class="text-sm  uppercase text-center text-gray-500 ">
              <span><FontAwesomeIcon icon={faCalendarDay} className="text-sm text-gray-500 pr-1 " /></span>
              {fullDayName[day] || ''}
            </h1>
  </div>
  
          </div>
<button onClick={handleTokens} className='bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-md border hover:shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 m-9 inline-flex items-center' >Manage Tokens</button>
</div>









      </div>



      <div className="flex items-center justify-center">

      <button
  onClick={toggleStatus}
  className={`relative flex items-center justify-center w-60 h-12 bg-gray-700 rounded-full focus:outline-none transition-all duration-1000 ease-in-out shadow-[0_0_15px_5px_rgba(0,255,0,0.6)]`}
  
>
  {/* Animated toggle circle */}
  <span
    className={`absolute top-0 bottom-0 my-auto w-12 h-12 bg-gray-800 rounded-full transition-all duration-1000 ease-in-out ${
      isLunch ? "left-0" : "left-[calc(100%-3rem)]"
    }`}
    style={{
      boxShadow: "0 0 15px 5px rgba(0, 255, 0, 0.8)", // Persistent glow
    }}
  ></span>

  {/* Text */}
  <div className="flex flex-col items-center">
  <span className="text-white font-semibold tracking-wide">
    {isLunch ? "Lunch" : "Breakfast"}
  </span>
  <span className="text-[11px] text-gray-400 ">
  {isLunch ? "swipe to breakfast" : "swipe to lunch"}
  </span>
</div>


  {/* Icon */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 text-white absolute transition-all duration-1000 ease-in-out ${
      isLunch ? "left-4 rotate-180" : "right-4 rotate-180"
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
</button>
    </div>

      <h1 className='text-3xl font-bold mb-8'></h1>
      <div className="flex flex-wrap justify-center">
        

        {isLunch ? <>
        <div className="md:px-28">
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
        </>
           
         : <>
         <div className="md:px-28">
         <div className="flex flex-wrap justify-center">
         { documents.map((doc, index) => (
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
    </div>
  );
}

export default Admin;
