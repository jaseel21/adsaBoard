import React, { useState, useEffect, useContext } from 'react';
import firebase from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import { faBowlFood, faPrint } from '@fortawesome/free-solid-svg-icons';
import "./Home.css"



const SwitchButton = ({ number,block, isOn,  toggleSwitch }) => {
  return (
    <button
      onClick={toggleSwitch}
      className={`flex items-center justify-center ${block && 'glossy-button2 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300' } ${isOn ? 'bg-green-600 glossy-button text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300' : 'bg-red-600 glossy-button1 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300'}  text-white font-bold text-center no-underline rounded-2xl w-14 h-14 m-2 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
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
        if (doc.block==false && doc.obj.lunch) {
          lunch++;
        }
        if (doc.block==false && doc.obj.breakfast) {
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
    
    console.log("Toggle switch for token:", documents[index]);
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

  const addStudent=()=>{
    firebase.firestore().collection('students').add({
      uname:"MUHAMMED NUFAIL",
      tokenNo:30,
      password:"190",
      block:false,
      obj:{
        lunch:true,
        breakfast:true
      },
      obj2:{
        beef:true,
        chicken:true,
        fish:true,
        mutton:true
      }
  
    }).then(()=>{
      window.location.href = "/";
    }).catch((error) => {
      console.error("Error adding document: ", error);
    })
  }


  return (
    <div className='text-center'>
       <button onClick={addStudent} className='bg-white text-black font-bold p-5'>
        add student
      </button>
<div className="pb-5 flex justify-center items-center ">
  

<FontAwesomeIcon icon={faListCheck} className="text-lg text-gray-50 pr-1 " />
          <h1 class="text-1xl underline text-center text-gray-50 ">ADSA TOEKN BOARD</h1>

        </div>
      <div className="flex px-2 md:px-64 pb-10 justify-between">
        
      <div className="">
        <div className="text-left p-3 rounded-lg bg-white border border-gray-500 border-l-8 border-b-2 border-r-2">

          <h1 className='text-1xl text-gray-950 font-bold '>Lunch : {lunchCount}</h1>
          <h1 className='text-1xl text-gray-950 font-bold '>Breakfast : {breakfastCount}</h1>
        <div className=" justify-center mt-4">
          <button
            onClick={supplyList}
            className="bg-green-500 text-white rounded-lg shadow-md p-2 text-sm font-semibold flex items-center space-x-2 transition duration-300 ease-in-out hover:bg-green-600"
          >
            <FontAwesomeIcon icon={faPrint} className="text-xl" />
            <span>Supply List</span>
          </button>
        </div>
        </div>
        </div>


        
 

        <div className="flex items-center">
        
        {/* <button onClick={handleUpdateBtn} className="bg-green-500	 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-md border border-blue-500 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
  Update Token
</button> */}<button
onClick={handleUpdateBtn}
      
      class="bg-white hover:bg-gray-200 text-black font-bold py-2 px-4  inline-flex items-center border border-gray-400"
    >
<svg className="fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">

  <path d="M14.12 2.62a2.5 2.5 0 0 0-3.54 0L7.29 6.56a1 1 0 0 0-.29.71v8.59a1 1 0 0 0 1 1h8.59a1 1 0 0 0 .71-.29l3.29-3.29a2.5 2.5 0 0 0 0-3.54l-6.46-6.46zM12 4.13l3.88 3.88-1.41 1.41L10.59 5.54 12 4.13zM7 15.59V12h4v4H8.41L7 15.59zM17.29 16.29l-1.41-1.41 2.12-2.12 1.41 1.41-2.12 2.12z"/>
</svg>



      <span>Update token</span>
    </button>

 </div>
      </div>  

      <div className="flex items-center justify-center">
      <button
        onClick={toggleStatus}
        className={`relative flex items-center justify-center w-60 h-10 bg-yellow-500 rounded-md focus:outline-none transition-all duration-300 ${
          isLunch ? 'bg-blue-400' : 'bg-gary-400'
        }`}
      >
        <span
          className={`absolute left-0 w-1/2 h-full bg-gray-500 rounded-md transition-transform duration-300 transform ${
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
            block={doc.block}
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
              block={doc.block}
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
