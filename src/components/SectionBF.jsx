import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHamburger } from '@fortawesome/free-solid-svg-icons';

import firebase from "../firebase/config";
import { faSearchMinus } from '@fortawesome/free-solid-svg-icons';

const SectionBF = () => {
  const [documents, setDocuments] = useState([]);
  const [section1, setSection1] = useState([]);
  const [section2, setSection2] = useState([]);
  const [section3, setSection3] = useState(null);
  const [section4, setSection4] = useState(null);
  const [section5, setSection5] = useState(null);
  const [section6, setSection6] = useState(null);
  const [section7, setSection7] = useState(null);
  const [section8, setSection8] = useState(null);
  const [section9, setSection9] = useState(null);
  const [section10, setSection10] = useState(null);
  const [section11, setSection11] = useState([]);
  const [section12, setSection12] = useState([]);

  const [activeSection, setActiveSection] = useState(null);

   
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
  
    // Function to fetch data from Firestore and update sections
    const fetchData = async () => {
      try {
        const querySnapshot = await firebase.firestore().collection('students').get();
        const tokenDocuments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        tokenDocuments.sort((a, b) => a.tokenNo - b.tokenNo);
        setDocuments(tokenDocuments);
  
        const sectionOneTokens = tokenDocuments.slice(0, 17);
                const selectedSOT = sectionOneTokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection1(selectedSOT);
      
                
                
               const sectionTwoTokens = tokenDocuments.slice(17, 34);
               const selectedSTT = sectionTwoTokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
               setSection2(selectedSTT);
                

                const section3Tokens=tokenDocuments.slice(34, 51);
                const selectedS3T = section3Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                console.log(selectedS3T);
                setSection3(selectedS3T)
            
                const section4Tokens=tokenDocuments.slice(51, 68);
                const selectedS4T = section4Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection4(selectedS4T)
            
                const section5Tokens=tokenDocuments.slice(68, 85);
                const selectedS5T = section5Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection5(selectedS5T)
            
                const section6Tokens=tokenDocuments.slice(85, 102);
                const selectedS6T = section6Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection6(selectedS6T)
            
                const section7Tokens=tokenDocuments.slice(102, 119);
                const selectedS7T = section7Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection7(selectedS7T)
            
                const section8Tokens=tokenDocuments.slice(119, 136);
                const selectedS8T = section8Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection8(selectedS8T)
            
                const section9Tokens=tokenDocuments.slice(136,153 );
                const selectedS9T = section9Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection9(selectedS9T)
            
                const section10Tokens=tokenDocuments.slice(153, 170);
                const selectedS10T = section10Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection10(selectedS10T)

                const section11Tokens=tokenDocuments.slice(170, 187);
                const selectedS11T = section11Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection11(selectedS11T)

                const section12Tokens=tokenDocuments.slice(187, 200);
                const selectedS12T = section12Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
                setSection12(selectedS12T)
               
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };
  
    // Initial call to set the day and fetch data immediately on mount
    updateDay();
    fetchData();
  
    // Set up an interval to update the day every minute
    const timer = setInterval(updateDay, 60000);
  
    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, [day]); // Dependency array should include 'day' to ensure fetchData updates when the day changes
  
  // Function to get the day of the week from a Date object
  const getDayOfWeek = (date) => {
    const daysOfWeek = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    return daysOfWeek[date.getUTCDay()]; // Use getUTCDay() to ensure we're working in UTC
  };
  

  // Function to toggle active section
  const toggleSection = (sectionIndex) => {
    if (activeSection === sectionIndex) {
      setActiveSection(null); // Collapse section if already active
    } else {
      setActiveSection(sectionIndex); // Expand section if not active
    }
  };

  return (
    <div className=" min-h-screen py-8 flex">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center pb-5">
      <FontAwesomeIcon icon={faSearchMinus} className="text-lg pr-1" />

            <h1 className='font-normal underline  -700 text-gray-800  rounded-lg text-1xl'>Breakfast Sections</h1>
          </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {/* Section 1 */}
          <div>
            <button
              onClick={() => toggleSection(1)}
              className={`focus:outline-none ${
                activeSection === 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 1
              <span className='text-sm font-normal'>1-17</span>
            </button>
            {/* Display list for active section */}
            
            {activeSection === 1 && (
            
              <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                <div className='flex justify-end items-end'>

                <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section1.length}</h2>
                </div>
                {/* Map over section1 state */}
                {section1.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 2 */}
          <div>
            <button
              onClick={() => toggleSection(2)}
              className={`focus:outline-none ${
                activeSection === 2
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 2
              <span className='text-sm font-normal'>18-34</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 2 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section2.length}</h2>
                  </div>
                 {
                   section2.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection(3)}
              className={`focus:outline-none ${
                activeSection === 3
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 3
              <span className='text-sm font-normal'>34-51</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 3 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section3.length}</h2>
                  </div>
                 {
                   section3.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>
          <div>
            <button
              onClick={() => toggleSection(4)}
              className={`focus:outline-none ${
                activeSection === 4
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 4
              <span className='text-sm font-normal'>52-68</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 4 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section4.length}</h2>
                  </div>
                 {
                   section4.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>
          
          <div>
            <button
              onClick={() => toggleSection(5)}
              className={`focus:outline-none ${
                activeSection === 5
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 5
              <span className='text-sm font-normal'>69-85</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 5 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section5.length}</h2>
                  </div>
                 {
                   section5.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>
          
          
          <div>
            <button
              onClick={() => toggleSection(6)}
              className={`focus:outline-none ${
                activeSection === 6
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 6
              <span className='text-sm font-normal'>86-102</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 6 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section6.length}</h2>
                  </div>
                 {
                   section6.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>
          
          
          <div>
            <button
              onClick={() => toggleSection(7)}
              className={`focus:outline-none ${
                activeSection === 7
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 7
              <span className='text-sm font-normal'>103-119</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 7 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section7.length}</h2>
                  </div>
                 {
                   section7.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>


          <div>
            <button
              onClick={() => toggleSection(8)}
              className={`focus:outline-none ${
                activeSection === 8
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 8
              <span className='text-sm font-normal'>120-136</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 8 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section8.length}</h2>
                  </div>
                 {
                   section8.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection(9)}
              className={`focus:outline-none ${
                activeSection === 9
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 9
              <span className='text-sm font-normal'>137-153</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 9 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section9.length}</h2>
                  </div>
                 {
                   section9.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection(10)}
              className={`focus:outline-none ${
                activeSection === 10
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 10
              <span className='text-sm font-normal'>154-170</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 10 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section10.length}</h2>
                  </div>
                 {
                   section10.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection(11)}
              className={`focus:outline-none ${
                activeSection === 11
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 11
              <span className='text-sm font-normal'>171-187</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 11 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section11.length}</h2>
                  </div>
                 {
                   section11.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => toggleSection(12)}
              className={`focus:outline-none ${
                activeSection === 12
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              } rounded-lg shadow-md p-6 text-lg font-semibold flex flex-col items-center justify-center transition duration-300 ease-in-out transform hover:scale-105`}
            >
              <FontAwesomeIcon icon={faHamburger} className="text-xl mb-2" />
              Section 12
              <span className='text-sm font-normal'>188-200</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 12 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                   <div className='flex justify-end items-end'>
                     <h2 className='bg-gray-200 p-2 w-auto font-medium  rounded-md text-emerald-500 text-sm text-end'>{'count : '+section12.length}</h2>
                  </div>
                 {
                   section12.map((item,index)=>(
     
                     <li key={index} className="text-gray-700"> {item}</li>
                   ))
                 }
                 {/* Add additional fields as needed */}
               </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SectionBF;
