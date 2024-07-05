import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import firebase from '../firebase/config';

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

function Admin() {
  const [documents, setDocuments] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isLunch, setIsLunch] = useState(true);

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

  const toggleSwitch1 = () => {
    setIsChecked(!isChecked);
    firebase.firestore().collection("tokenboard").doc("g8iJVNn2RQkysjMAvX1h").set({
      status:!isChecked
    })
  };

  const toggleSwitch = (index) => {
    // Implement your toggle logic here
    console.log("Toggle switch for token:", documents[index]);
    // Example logic: You would update Firestore here
  };

  const toggleStatus = () => {
    setIsLunch(!isLunch);
  };

  return (
    <div>
      <div className="p-10">
        <div className="flex justify-center items-center pb-4">
          <FontAwesomeIcon icon={faScrewdriverWrench} className='px-1' />
          <h1 className="text-center text-2xl font-bold">Admin panel</h1>
        </div>
        <div className="text-left p-3 rounded-lg w-3/5 md:w-2/12 justify-center items-center flex bg-white border border-gray-500 border-l-8 border-b-2 border-r-2">
          <div className="flex p-1 items-center space-x-2 justify-start">
            <h1 className='text-gray-500 text-sm font-bold'>Token Board</h1>
            <button
              className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${
                isChecked ? 'bg-green-600' : 'bg-red-600'
              }`}
              onClick={toggleSwitch1}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-md transform duration-300 ${
                  isChecked ? 'translate-x-6 bg-white' : 'translate-x-0 bg-white'
                }`}
              ></div>
            </button>
            <span className="text-sm">{isChecked ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      <h1 className='text-3xl font-bold mb-8'></h1>
      <div className="flex flex-wrap justify-center">
        {isLunch ? (
          documents.map((doc, index) => (
            <SwitchButton
              key={index}
              number={doc.tokenNo}
              isOn={doc.obj && doc.obj.lunch}
              toggleSwitch={() => toggleSwitch(index)}
            />
          ))
        ) : (
          documents.map((doc, index) => (
            <SwitchButton
              key={index}
              number={doc.tokenNo}
              isOn={doc.obj && doc.obj.breakfast}
              toggleSwitch={() => toggleSwitch(index)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Admin;
