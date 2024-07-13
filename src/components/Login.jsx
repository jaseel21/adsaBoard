import React, { useContext, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';


import firebase from '../firebase/config'
import {DataOfOne} from '../store/StudentData';




function Login() {

  const [token, setToken] = useState();
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [err,setErr]=useState("")
  const {setStdata} = useContext(DataOfOne)



  const navigate=useNavigate()



  // Define your time period here
  const startTime = new Date();
  startTime.setHours(1, 0, 0); // 5:00 AM
  const endTime = new Date();
  endTime.setHours(24, 0, 0); // 5:00 PM



  const [canClick, setCanClick] = useState(isCurrentTimeInRange(startTime, endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setCanClick(isCurrentTimeInRange(startTime, endTime));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  function isCurrentTimeInRange(start, end) {
    const now = new Date();
    return now >= start && now <= end;
  }

  const LoginWith=async()=>{
    let StInfo= await firebase.firestore().collection('students').where('tokenNo','==',parseInt(token)).where('password',"==",pass).get()
    if (!StInfo.empty) {
      // Access the data of the first document found
      
      let studentData = StInfo.docs[0].data();
      studentData.documentId = StInfo.docs[0].id;
     
      
      // Assuming setStdata is a function to set state or perform further actions
      setStdata(studentData);
      
      // Assuming navigate is a function to navigate to a different page (e.g., using React Router)
      navigate('/student-portal');
  } else {
      
      setErr(' entry is invalid')

      // Handle case where no matching student is found
      // You might want to show an error message or take appropriate action
  }
  }


  const SubmitForm = async()=> {

    let tbStatus
    await firebase.firestore().collection("tokenboard").doc("g8iJVNn2RQkysjMAvX1h").get().then((doc=>{
      if (doc.exists) {
        tbStatus = doc.data(); // Assign doc.data() to tbStatus
        console.log(tbStatus.status); // Optionally log tbStatus
        tbStatus=tbStatus.status  
      } else {
        console.log("No such document!");
      }
    }))
  if (isCurrentTimeInRange(startTime, endTime)) {
  console.log(tbStatus);
  LoginWith();

      console.log('pass time',tbStatus);
      // if(tbStatus==true){
      //   console.log('pass admin pri'.tbStatus);

      //   LoginWith();
      //   console.log('in status checking codition');
      // }else{
      //   alert("blocked by admin")
      // }
    
     } else {
       alert('You cannot log in at this time');
     }

     if(tbStatus==true){
      LoginWith();
     }else{
      alert('blocked by admin')
     }
    
  }

  async function checkTimeAndHandleClick() {
    try {
      // Assuming 'token' is passed as an argument to the function
      let blockStatus = await firebase.firestore().collection('students').where('tokenNo','==',parseInt(token)).get();
  
      if (!blockStatus.empty) {
        let statusData = blockStatus.docs[0].data();
       statusData=statusData.block
        // Call SubmitForm() here or pass 'statusData' to it if needed
        if(statusData==false){

          SubmitForm();
        }else{
         alert("youer token has been blocked")
        }
      } else {
        console.log('No document found for token:', token);
      }
    } catch (error) {
      console.error('Error fetching block status:', error);
      // Handle error as needed
    }
  }
  

  const handleSubmit = async(e) => {

    e.preventDefault();
    checkTimeAndHandleClick();
    console.log(token, pass);
  
    
    // Add logic here to handle login authentication or other operations
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

  return (
    <div className="flex justify-center items-center h-auto md:pt-24 sm:pt-20 ">
      <div className="max-w-md w-full p-8 mt-8 bg-white rounded shadow-md">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">Student Login</h2>

        {err && (
          <div className="flex items-center pb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger mr-2 text-red-700" />
            <p className="text-red-600">{err}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="number"
              value={token}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={pass}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 py-2"
                onClick={togglePasswordVisibility}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
