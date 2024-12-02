import React, { useContext, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [time, setTime] = useState(new Date());
  const [canClick, setCanClick] = useState(true);

  const { setStdata } = useContext(DataOfOne);
  const navigate = useNavigate();

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
   

  const startTime="14:00:00"
  const endTime="24:00:00"

  const startTimeA='00:00:00'
  const endTimeA="06:00:00"

//   const startTime = new Date();
// startTime.setDate(startTime.getDate() ); // Move to the previous day
// startTime.setHours(3, 0, 0, 0); // Set start time to 2:00 PM of the previous day
// startTime.setMinutes(startTime.getMinutes() - startTime.getTimezoneOffset() + 330); // Adjust for GMT+5:30

// // Set end time to 6:00 AM today
// const endTime = new Date();
// endTime.setDate(endTime.getDate()+1 )
// endTime.setHours(-5, 0, 0, 0); // Set end time to 6:00 AM of the current day
// endTime.setMinutes(endTime.getMinutes() - endTime.getTimezoneOffset() + 330); // Adjust for GMT+5:30


useEffect(() => {
  const updateClock = () => setTime(new Date());
  updateClock(); // Set initial time

  const intervalId = setInterval(updateClock, 1000); // Update every second
  return () => clearInterval(intervalId); // Clean up on component unmount
}, []);

useEffect(() => {
  const timer = setInterval(() => {
    const now = convertToGMTPlus530(new Date());
    setCanClick(now >= startTime && now <= endTime);
  }, 60000); // Update every minute

  return () => clearInterval(timer);
}, [startTime, endTime]);

// const convertToGMTPlus530 = (date) => {
//   const utc = date.getTime() + date.getTimezoneOffset() * 60000;
//   return new Date(utc + 3600000 * 5.5); // Add 5 hours 30 minutes
// };


const isCurrentTimeInRange = () => {
  // const now = convertToGMTPlus530(new Date());
  const now =getISTTime()
  console.log(now);
  console.log(now, startTime, endTime);
  return now >= startTime && now <= endTime || now >=startTimeA && now<=endTimeA;
};

 

  const LoginWith = async () => {
    try {
      const StInfo = await firebase.firestore().collection('students').where('tokenNo', '==', parseInt(token)).where('password', '==', pass).get();
      if (!StInfo.empty) {
        const studentData = StInfo.docs[0].data();
        studentData.documentId = StInfo.docs[0].id;
        setStdata(studentData);
        navigate('/student-portal');
      } else {
        setErr('Invalid entry');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErr('Error during login');
    }
  };

  const SubmitForm = async () => {
    try {
      const doc = await firebase.firestore().collection("tokenboard").doc("g8iJVNn2RQkysjMAvX1h").get();
      if (doc.exists) {
        const tbStatus = doc.data().status;
        if (isCurrentTimeInRange() || tbStatus === true) {
          await LoginWith();
        } else {
          alert('Your login attempt has been prevented');
        }
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error('Error checking tokenboard status:', error);
    }
  };

  const checkTimeAndHandleClick = async () => {
    try {
      const blockStatus = await firebase.firestore().collection('students').where('tokenNo', '==', parseInt(token)).get();
      if (!blockStatus.empty) {
        const statusData = blockStatus.docs[0].data().block;
        if (statusData === false) {
          await SubmitForm();
        } else {
          alert('Your token has been blocked');
        }
      } else {
        console.log('No document found for token:', token);
      }
    } catch (error) {
      console.error('Error fetching block status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      await checkTimeAndHandleClick();
   
  };

  const handleUsernameChange = (e) => {
    setToken(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPass(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


//   return (
//     <div className="flex justify-center items-center h-auto md:pt-24 sm:pt-20">
//       <div className="max-w-md w-full p-8 mt-8 bg-white rounded shadow-md">
//         <h2 className="text-3xl font-bold mb-4 text-gray-800">Student Login</h2>

//         {err && (
//           <div className="flex items-center pb-3">
//             <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger mr-2 text-red-700" />
//             <p className="text-red-600">{err}</p>
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
//               Username
//             </label>
//             <input
//               required
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               id="username"
//               type="number"
//               value={token}
//               onChange={handleUsernameChange}
//               placeholder="Enter your username"
//             />
//           </div>
//           <div className="mb-6">
//             <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 required
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
//                 id="password"
//                 type={showPassword ? 'text' : 'password'}
//                 value={pass}
//                 onChange={handlePasswordChange}
//                 placeholder="Enter your password"
//               />
//               <button
//                 type="button"
//                 className="absolute inset-y-0 right-0 px-3 py-2"
//                 onClick={togglePasswordVisibility}
//               >
//                 <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
//               </button>
//             </div>
//           </div>
//           <button
//             className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
//             type="submit"
//             disabled={!canClick}
//           >
//             Sign In
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default Login;



  
  return (
    <div className=" flex items-center h-[600px] justify-center  bg-white">
      <div className=" max-w-md w-full p-5  space-y-8">
        <div className="flex flex-col items-center">
        </div>
        <div className="max-w-md w-full  space-y-8">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 border-t-4 border-emerald-500">
            <h2 className="text-2xl  font-bold text-gray-800 font-mono mb-4"> Login</h2>

            {err && (
          <div className="flex items-center pb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger mr-2 text-red-700" />
            <p className="text-red-600">{err}</p>
          </div>
        )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm  mb-2"
                  htmlFor="username"
                >
                  Username
                </label>
              
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="username"
                  type="number"
                  value={token}
                  onChange={handleUsernameChange}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm  mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                 id="password"
                 type={showPassword ? 'text' : 'password'}
                 value={pass}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="flex items-center justify-between mb-6">
                <label className="inline-flex items-center text-gray-700 text-sm">
                  <input type="checkbox" className="form-checkbox text-blue-500" />
                  <span className="ml-2">Remember Me</span>
                </label>
                <a  className="text-green-500 text-sm">Forgot Password?</a>
              </div>
              <button
                type="submit"
               
                className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-700 transition duration-200"
              >
                LOGIN
              </button>
            </form>
            <div className="mt-6 text-center">
              <a  className="text-sm text-green-500">Create New Account</a>
            </div>
          </div>
        </div>
        
      
      </div>
    </div>
  );
};

export default Login;
