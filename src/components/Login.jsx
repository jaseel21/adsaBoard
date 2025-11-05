import React, { useContext, useState, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faUsers, faLock, faClock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useWorldTime } from '../utils/time';

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [currentTime, setCurrentTime] = useState(null);
  const [canClick, setCanClick] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formFocused, setFormFocused] = useState(false);
  const { timeHms } = useWorldTime('Asia/Kolkata');

  const { setStdata } = useContext(DataOfOne);
  const navigate = useNavigate();

  const startTime = "14:00:00";
  const endTime = "23:00:00";

  // Get current IST time strictly from worldtimeapi hook
  const getISTTime = useCallback(() => timeHms.padStart(8, '0'), [timeHms]);

  // Update time and canClick state
  useEffect(() => {
    let isMounted = true;

    const updateTime = () => {
      const time = getISTTime();
      if (isMounted) {
        setCurrentTime(time);
        setCanClick(
          (time >= startTime && time <= endTime)
        );
      }
    };

    // Initial update
    updateTime();
    // Update displayed time every second for accurate UI
    const intervalId = setInterval(updateTime, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [getISTTime, startTime, endTime]);

  // Time fetching is centralized in useWorldTime

  // Check if current time is in allowed range
  const isCurrentTimeInRange = useCallback(() => {
    if (!currentTime) return false;
    return (
      (currentTime >= startTime && currentTime <= endTime)
    );
  }, [currentTime, startTime, endTime]);

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
      const time = getISTTime();
      if (!time) {
        setErr('Unable to get time. Please try again.');
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
          alert('Login is restricted outside allowed time (2:00 PM to 11:00 PM).');
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
  }, [isCurrentTimeInRange, loginWith, getISTTime]);

  // Check token block status
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs - Green Theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Time Status Banner - Green Theme */}
        <div className="mb-6 flex items-center justify-center">
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl backdrop-blur-lg border-2 shadow-lg transition-all duration-300 ${
            canClick 
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-700 shadow-emerald-200/50' 
              : 'bg-red-50/90 border-red-300 text-red-700 shadow-red-200/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${canClick ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
            <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-sm font-bold">
                {canClick ? 'Login Available' : 'Outside Login Hours'}
              </span>
              {currentTime && (
                <span className="text-xs opacity-80 font-medium">{currentTime} IST</span>
              )}
            </div>
          </div>
        </div>

        {/* Logo and Title outside card */}
        <div className="text-center mb-8">
          {/* <div className="relative inline-block mb-5 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-40 animate-pulse"></div>
            <img className='h-auto w-40 relative z-10' src="https://alathurpadidars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png" alt="Institution Logo" />
          </div> */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">Student Login</h1>
          <p className="text-gray-600 font-semibold">Welcome back! Please sign in to your team account.</p>
        </div>

        {/* Login Card - Enhanced Glass Effect - Only form fields */}
        <div className={`backdrop-blur-2xl bg-white/80 border border-white/30 rounded-3xl shadow-2xl p-8 transition-all duration-500 ${
          formFocused ? 'scale-[1.02] shadow-emerald-300/30 ring-1 ring-emerald-200/50' : 'shadow-lg shadow-green-200/20'
        }`}>
          
          {/* Error Message - Green Theme Accent */}
          {err && (
            <div className="mb-6 p-4 bg-red-50/80 border-l-4 border-red-400 rounded-xl backdrop-blur-sm animate-shake shadow-md">
              <div className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{err}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} aria-label="Team Login Form" className="space-y-6">
            
            {/* Select Team Field - Glass Input with Chevron */}
            <div className="relative group">
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="team">
                Select Team
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon 
                    icon={faUsers} 
                    className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-300" 
                  />
                </div>
                <input
                  type="number"
                  id="team"
                  value={token}
                  onChange={handleUsernameChange}
                  onFocus={() => setFormFocused(true)}
                  onBlur={() => setFormFocused(false)}
                  className="w-full pl-12 pr-12 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-300 font-medium shadow-sm hover:shadow-md appearance-none"
                  placeholder="Enter your token No"
                  required
                  aria-required="true"
                  aria-describedby="team-error"
                />
                
              </div>
            </div>

            {/* Password Field - Glass Input */}
            <div className="relative group">
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon 
                    icon={faLock} 
                    className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-300" 
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={pass}
                  onChange={handlePasswordChange}
                  onFocus={() => setFormFocused(true)}
                  onBlur={() => setFormFocused(false)}
                  className="w-full pl-12 pr-14 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 transition-colors duration-300"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Submit Button - Green Theme */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:transform-none disabled:cursor-not-allowed overflow-hidden group"
              aria-busy={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </span>
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6">
            <a href="#" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors duration-300">
              Don't have a team account? Register here
            </a>
          </div>

          {/* Footer Info - Official Note */}
          <div className="mt-6 text-center pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">
              Login hours: <span className="font-semibold text-gray-700">2:00 PM - 11:00 PM IST</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Secure • Official • Confidential
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
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