// pages/login.js
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faUser, faLock, faClock, faShieldAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Adjust if using Next.js navigation
import firebase from '../firebase/config'; // Adjust path as per your setup
import { DataOfOne } from '../store/StudentData'; // Adjust path as per your setup

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [currentTime, setCurrentTime] = useState(null);
  const [canClick, setCanClick] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formFocused, setFormFocused] = useState(false);

  const { setStdata } = useContext(DataOfOne);
  const navigate = useNavigate(); // Replace with Next.js useRouter if needed

  const startTime = "14:00:00";
  const endTime = "24:00:00";
  const startTimeA = "00:00:00";
  const endTimeA = "09:00:00";

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

    updateTime();
    const intervalId = setInterval(updateTime, 60000);

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

  // Input handlers
  const handleUsernameChange = (e) => {
    setToken(e.target.value);
    setErr('');
  };

  const handlePasswordChange = (e) => {
    setPass(e.target.value);
    setErr('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animation: `float 6s ease-in-out infinite alternate`
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Status indicator */}
        <div className="mb-6 flex items-center justify-center">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
            canClick 
              ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
              : 'bg-red-100 border-red-300 text-red-700'
          }`}>
            <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
            <span className="text-sm font-medium">
              {canClick ? 'Login Available' : 'Outside Login Hours'}
            </span>
            {currentTime && (
              <span className="text-xs opacity-75">({currentTime})</span>
            )}
          </div>
        </div>

        {/* Main login card */}
        <div className={`backdrop-blur-lg bg-white/90 border border-gray-200 rounded-2xl shadow-2xl p-8 transition-all duration-500 ${
          formFocused ? 'scale-105 shadow-blue-300/25' : ''
        }`}>
          {/* Logo and header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-2xl mb-4 shadow-lg">
              <FontAwesomeIcon icon={faShieldAlt} className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your student portal</p>
          </div>

          {/* Error message */}
          {err && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl backdrop-blur-sm animate-shake">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-600 text-sm">{err}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} aria-label="Student Login Form" className="space-y-6">
            {/* Username field */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="number"
                  id="username"
                  value={token}
                  onChange={handleUsernameChange}
                  onFocus={() => setFormFocused(true)}
                  onBlur={() => setFormFocused(false)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your token number"
                  required
                  aria-required="true"
                  aria-describedby="username-error"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={pass}
                  onChange={handlePasswordChange}
                  onFocus={() => setFormFocused(true)}
                  onBlur={() => setFormFocused(false)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-emerald-500 transition-colors"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-emerald-400/25 focus:outline-none focus:ring-2 focus:ring-emerald-400 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed overflow-hidden group"
              aria-busy={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          {/* <div className="mt-8 text-center">
            <a 
              href="/signup" 
              className="text-emerald-500 hover:text-emerald-600 text-sm font-medium transition-colors duration-300 hover:underline"
            >
              Don't have an account? Create one
            </a>
          </div> */}

          {/* Demo credentials */}
         
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default Login;