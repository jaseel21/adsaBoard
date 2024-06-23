import React, { useContext, useState } from 'react';
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

  const handleSubmit = async(e) => {
    e.preventDefault();
    console.log(token, pass);
  
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
    <div className="flex justify-center p-3  h-auto bg-gray-100">
      <div className="bg-white p-8 mt-8 rounded shadow-md ">
        <h2 className="text-2xl font-bold mb-4 ">Student Login</h2>

{

      err && <div className="flex  items-center pb-3">

        <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger mr-2 text-red-700" />
          <p class="text-red-600"> {err}</p>
      </div> 
}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
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
            className="text-white bg-gray-800 font-bold hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300  rounded-[3px] text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
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
