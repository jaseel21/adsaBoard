import React, { useState, useEffect } from 'react';
import firebase from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';



const SwitchButton = ({ number, isOn, toggleSwitch }) => {
  
  
  return (
    <button
      onClick={toggleSwitch}
      className={`flex items-center justify-center ${isOn ? 'bg-emerald-700' : 'bg-rose-700'} text-white font-bold text-center no-underline rounded-2xl w-14 h-14 m-2 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
    >
      {number}
    </button>
  );
};



const SwitchPage = () => {

  const [documents, setDocuments] = useState([]);
  const [lunchCount, setLunchCount] = useState(0);
  const [breakfastCount, setBreakfastCount] = useState(0);

  

  const navigate=useNavigate()


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
        if (doc.obj && doc.obj.lunch) {
          lunch++;
        }
        if (doc.obj && doc.obj.breakfast) {
          breakfast++;
        }
      });

      setLunchCount(lunch);
      setBreakfastCount(breakfast);
    } catch (err) {
      console.error('Error calculating counts:', err);
    }
  };

  const toggleSwitch = (index) => {
    // Implement your toggle logic here
    console.log("Toggle switch for token:", documents[index]);
    // Example logic: You would update Firestore here
  };

  const [isLunch, setIsLunch] = useState(true); // State to track current status, default is lunch

  const toggleStatus = () => {
    setIsLunch(!isLunch); // Toggle between lunch and breakfast
  };


  const handleUpdateBtn=()=>{
    navigate('/login')
  }

  return (
    <div className='text-center'>
<div className="pb-5 flex justify-center items-center">

<FontAwesomeIcon icon={faListCheck} className="text-lg pr-1 " />
          <h1 class="text-1xl underline text-center text-gray-800">ADSA TOEKN BOARD</h1>
        </div>
      <div className="flex px-2 md:px-64 pb-10 justify-between">
        
      <div className="text-left p-3 rounded-lg bg-white border border-gray-500 border-l-8 border-b-2 border-r-2">

          <h1 className='text-1xl text-gray-950 '>Lunch : {lunchCount}</h1>
          <h1 className='text-1xl text-gray-950 '>Breakfast : {breakfastCount}</h1>
        </div>

 

        <div className="flex items-center">
        
          <button onClick={handleUpdateBtn} className="text-white bg-gray-800 font-bold hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300  rounded-[3px] text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Update Token</button>
        </div>
      </div>

      <div className="flex items-center justify-center">
      <button
        onClick={toggleStatus}
        className={`relative flex items-center justify-center w-60 h-10 bg-gray-900 rounded-full focus:outline-none transition-all duration-300 ${
          isLunch ? 'bg-blue-500' : 'bg-gary-400'
        }`}
      >
        <span
          className={`absolute left-0 w-1/2 h-full bg-slate-700 rounded-full transition-transform duration-300 transform ${
            isLunch ? 'translate-x-0' : 'translate-x-full'
          }`}
        ></span>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
          {isLunch ? 'Lunch' : 'Breakfast'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 text-white absolute ${
            isLunch ? 'left-3' : 'right-3'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isLunch ? "M17 8l4 4m0 0l-4 4m4-4H3" : "M7 16l-4-4m0 0l4-4m-4 4h18"}
          />
        </svg>
      </button>
    </div>
      {
        isLunch ?
        <>
      <h1 className='text-3xl  font-bold mb-8'></h1>
      <div className="flex flex-wrap justify-center">
        {documents.map((doc, index) => (
          <SwitchButton
            key={index}
            number={doc.tokenNo}
            isOn={doc.obj && doc.obj.lunch}
            toggleSwitch={() => toggleSwitch(index)}
          />
        ))}
      </div> 
        </> : 
        <>
        <h1 className='text-3xl  font-bold mb-8'></h1>
        <div className="flex flex-wrap justify-center">
          {documents.map((doc, index) => (
            <SwitchButton
              key={index}
              number={doc.tokenNo}
              isOn={doc.obj && doc.obj.breakfast}
              toggleSwitch={() => toggleSwitch(index)}
            />
          ))}
        </div> 
          </>
      }
      
    </div>
  );
};

export default SwitchPage;
