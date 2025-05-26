
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [currentTime, setCurrentTime] = useState(null);
  const [canClick, setCanClick] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setStdata } = useContext(DataOfOne);
  const navigate = useNavigate();

  const startTime = "14:00:00";
  const endTime = "24:00:00";
  const startTimeA = "00:00:00";
  const endTimeA = "06:00:00";

  // Fetch current IST time from API with retry logic
  const fetchISTTime = useCallback(async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch('https://www.timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return `${data.hour.toString().padStart(2, '0')}:${data.minute.toString().padStart(2, '0')}:${data.seconds.toString().padStart(2, '0')}`;
      } catch (error) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error('Error fetching time from API after retries:', error);
        return null;
      }
    }
  }, []);

  // Combined useEffect for time fetching and canClick state
  useEffect(() => {
    let isMounted = true;

    const updateTime = async () => {
      const time = await fetchISTTime();
      if (isMounted && time) {
        setCurrentTime(time);
        setCanClick(
          (time >= startTime && time <= endTime) ||
          (time >= startTimeA && time <= endTimeA)
        );
      } else if (isMounted) {
        setCanClick(false);
      }
    };

    updateTime(); // Initial fetch
    const intervalId = setInterval(updateTime, 60000); // Update every minute

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchISTTime, startTime, endTime, startTimeA, endTimeA]);

  // Check if current time is in allowed range
  const isCurrentTimeInRange = useCallback(() => {
    if (!currentTime) return false;
    return (
      (currentTime >= startTime && currentTime <= endTime) ||
      (currentTime >= startTimeA && currentTime <= endTimeA)
    );
  }, [currentTime, startTime, endTime, startTimeA, endTimeA]);

  // Handle login logic
  const loginWith = useCallback(async () => {
   
    try {
      const StInfo = await firebase.firestore()
        .collection('students')
        .where('tokenNo', '==', parseInt(token))
        .where('password', '==', pass)
        .get();

      if (!StInfo.empty) {
        const studentData = StInfo.docs[0].data();
        studentData.documentId = StInfo.docs[0].id;
        setStdata(studentData);
        navigate('/student-portal');
      } else {
        setErr('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErr('Failed to login. Please try again.');
    }
  }, [token, pass, setStdata, navigate]);

  // Check tokenboard status and proceed with login
  const submitForm = useCallback(async () => {
    try {
      setIsLoading(true);
      const time = await fetchISTTime();
      if (!time) {
        setErr('Unable to verify time. Please try again later.');
        return;
      }

      const doc = await firebase.firestore()
        .collection("tokenboard")
        .doc("g8iJVNn2RQkysjMAvX1h")
        .get();

      if (doc.exists) {
        const tbStatus = doc.data().status;
        if (isCurrentTimeInRange() || tbStatus === true) {
          await loginWith();
        } else {
          alert('Login is restricted outside allowed time (2:00PM to 6:00 AM).');
        }
      } else {
        setErr('System error: Configuration not found.');
      }
    } catch (error) {
      console.error('Error checking tokenboard status:', error);
      setErr('Error checking system status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isCurrentTimeInRange, loginWith]);

  // Check token block status before submission
  const checkTimeAndHandleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!token || isNaN(parseInt(token))) {
        setErr('Please enter a valid numeric token.');
        return;
      }

      const blockStatus = await firebase.firestore()
        .collection('students')
        .where('tokenNo', '==', parseInt(token))
        .get();

      if (!blockStatus.empty) {
        const statusData = blockStatus.docs[0].data().block;
        if (statusData === false) {
          await submitForm();
        } else {
          alert('Your token has been blocked.');
        }
      } else {
        setErr('Invalid token. Please check and try again.');
      }
    } catch (error) {
      console.error('Error fetching block status:', error);
      setErr('Error checking token status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token, submitForm]);

  // Form submission handler
  const handleSubmit = useCallback(async (e) => {
    
    e.preventDefault();
    setErr('');
    await checkTimeAndHandleClick();
  }, [checkTimeAndHandleClick]);

  // Simplified input handlers
  const handleUsernameChange = (e) => {
    console.log('Username input:', e.target.value); // Debugging log
    setToken(e.target.value);
    setErr('');
  };

  const handlePasswordChange = (e) => {
    console.log('Password input:', e.target.value); // Debugging log
    setPass(e.target.value);
    setErr('');
  };

  return (
    <div className="flex items-center pt-10 justify-center bg-white min-h-screen">
      <div className="max-w-md w-full px-5 space-y-8">
        <div className="max-w-md w-full space-y-8">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 border-t-4 border-emerald-600">
            <h2 className="text-[25px] font-extrabold text-gray-600 font-serif mb-4">Login</h2>

            {err && (
              <div className="flex items-center pb-3" role="alert">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-700 mr-2" aria-hidden="true" />
                <p className="text-red-600">{err}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} aria-label="Student Login Form">
              <div className="mb-4">
                <label
                  className="block text-gray-500 text-sm mb-2"
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
                  aria-required="true"
                  aria-describedby="username-error"
                />
              </div>
              <div className="mb-6">
                <label
                  className="block text-gray-500 text-sm mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={pass}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  onChange={handlePasswordChange}
                  required
                  aria-required="true"
                  aria-describedby="password-error"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition duration-200 disabled:bg-emerald-400 disabled:cursor-not-allowed"
               
                aria-busy={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <a href="/signup" className="text-sm text-emerald-500 hover:underline">Create New Account</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
