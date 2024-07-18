import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBowlFood } from '@fortawesome/free-solid-svg-icons';
import { faSearchMinus } from '@fortawesome/free-solid-svg-icons';

import firebase from "../firebase/config";

const Section = () => {
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
        const selectedSOT = sectionOneTokens.filter(doc => doc.obj && !doc.obj.lunch).map(doc => doc.tokenNo);
        setSection1(selectedSOT);

        const sectionTowTokens=tokenDocuments.slice(5, 10);
        console.log(sectionTowTokens);
    const selectedSTT = sectionTowTokens.filter(doc => doc.obj && !doc.obj.lunch).map(doc => doc.tokenNo);
    console.log(selectedSTT);
    setSection2(selectedSTT)
  

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
      <div className="max-w-7xl  mx-auto px-4  sm:px-6 lg:px-8">
          <div className="flex justify-center  pb-5 items-center">
            {/* <FontAwesomeIcon icon={faFileMagnifyingGlass} /> */}
          <FontAwesomeIcon icon={faSearchMinus} className="text-lg pr-1" />
            <h1 className='font-normal underline  -700 text-gray-900  rounded-lg text-1xl'>Lunch Sections</h1>
          </div>
        <div className=" grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
              <FontAwesomeIcon icon={faBowlFood} className="text-xl mb-2" />
              Section 1
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
              <FontAwesomeIcon icon={faBowlFood} className="text-xl mb-2" />
              Section 2
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
              <FontAwesomeIcon icon={faBowlFood} className="text-xl mb-2" />
              Section 3
            </button>
            {/* Display list for active section */}
            {activeSection === 3 && (
              <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                <li className="text-gray-700">Token No: {section2?.tokenNo}</li>
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
              <FontAwesomeIcon icon={faBowlFood} className="text-xl mb-2" />
              Section 4
            </button>
            {/* Display list for active section */}
            {activeSection === 4 && (
              <ul className="bg-white shadow-md rounded-lg p-4 mt-2">
                <li className="text-gray-700">Token No: {section2?.tokenNo}</li>
                {/* Add additional fields as needed */}
              </ul>
            )}
          </div>
          {/* Section 5 */}
          {/* Section 6 */}
          {/* Section 7 */}
          {/* Section 8 */}
          {/* Section 9 */}
          {/* Section 10 */}
          

        </div>
      </div>
    </div>
  );
};

export default Section;
