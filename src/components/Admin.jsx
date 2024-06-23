import React, { useState, useEffect } from 'react';

const TimedButton = () => {
  // Define your time period here
  const startTime = new Date();
  startTime.setHours(22, 0, 0); // 5:00 AM
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

  function handleClick() {
    // Handle button click functionality here
    alert('Button clicked!');
  }

  function checkTimeAndHandleClick() {
    if (isCurrentTimeInRange(startTime, endTime)) {
      handleClick();
    } else {
      alert('Button can only be clicked between 5:00 AM and 5:00 PM.');
    }
  }

  return (
    <div>
      <button onClick={checkTimeAndHandleClick}  >
        Click me between 5:00 AM and 5:00 PM
      </button>
    </div>
  );
};

export default TimedButton;
