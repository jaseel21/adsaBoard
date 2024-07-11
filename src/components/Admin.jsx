import React, { useEffect, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData'; // Assuming this is your context
import { useNavigate } from 'react-router-dom';

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
  const { setStdata } = useContext(DataOfOne); // Getting context value

  const [documents, setDocuments] = useState([]);
  const [isChecked, setIsChecked] = useState();
  const [isLunch, setIsLunch] = useState(false);

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


  const toggleSwitch1 = () => {
    const action = isChecked ? 'close' : 'open';
    const changeConfirm = window.confirm(`Are you sure you want to ${action} the board?`);
    if (changeConfirm) {
      changeStatus();
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
    console.log("Toggle switch for token:", documents[index]);

    let StInfo = await firebase.firestore().collection('students').where('tokenNo', '==', parseInt(documents[index].tokenNo)).get();
    if (!StInfo.empty) {
      let studentData = StInfo.docs[0].data();
      studentData.documentId = StInfo.docs[0].id;

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
