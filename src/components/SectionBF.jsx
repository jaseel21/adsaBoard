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
  const [activeSection, setActiveSection] = useState(null);

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
        
        const sectionOneTokens = tokenDocuments.slice(0, 5);
        const selectedSOT = sectionOneTokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection1(selectedSOT);

        const sectionTowTokens=tokenDocuments.slice(5, 10);
        const selectedSTT = sectionTowTokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        console.log(selectedSTT);
        setSection2(selectedSTT)


        const section3Tokens=tokenDocuments.slice(10, 15);
        const selectedS3T = section3Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection3(selectedS3T)

        const section4Tokens=tokenDocuments.slice(15, 20);
        const selectedS4T = section4Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection4(selectedS4T)

        const section5Tokens=tokenDocuments.slice(20, 25);
        const selectedS5T = section5Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection5(selectedS5T)

        const section6Tokens=tokenDocuments.slice(25, 30);
        const selectedS6T = section6Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection6(selectedS6T)

        const section7Tokens=tokenDocuments.slice(30, 35);
        const selectedS7T = section7Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection7(selectedS7T)

        const section8Tokens=tokenDocuments.slice(35, 40);
        const selectedS8T = section8Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection8(selectedS8T)

        const section9Tokens=tokenDocuments.slice(40, 45);
        const selectedS9T = section9Tokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection9(selectedS9T)

        const section10Tkens=tokenDocuments.slice(45, 50);
        const selectedS10T= section10Tkens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setSection10(selectedS10T)
  

      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchData();

  }, []);

  // Function to toggle active section
  const toggleSection = (sectionIndex) => {
    if (activeSection === sectionIndex) {
      setActiveSection(null); // Collapse section if already active
    } else {
      setActiveSection(sectionIndex); // Expand section if not active
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8 flex">
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
              <span className='text-sm font-normal'>1-5</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 1 && (
              <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>6-10</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 2 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>11-15</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 3 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>16-20</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 4 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>21-25</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 5 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>26-30</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 6 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>31-35</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 7 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>36-40</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 8 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>41-45</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 9 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
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
              <span className='text-sm font-normal'>46-50</span>
            </button>
            {/* Display list for active section */}
            {activeSection === 10 && (
                 <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                 {
                   section10.map((item,index)=>(
     
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
