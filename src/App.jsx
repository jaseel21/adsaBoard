import React, { useState } from 'react';
import "./App.css"

const SwitchButton = ({ number }) => {
  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  return (
    <a 
      onClick={toggleSwitch} 
      className={`flex items-center justify-center ${isOn ? 'bg-red-500' : 'bg-green-700'} text-white font-bold text-center no-underline rounded-full w-24 h-24 m-2 font-bold text-lg`}
    >
      {number}
    </a>
  );
};

const SwitchPage = () => {
  const numberOfButtons = 204;

  return (
    <div>
      <div className="text-right">

      <h1 className='text-3xl'>lunch : 123</h1>
      <h1 className='text-3xl' >breakfast : 130</h1>
      </div>
      <h1 className=' text-5xl font-bold'>Token Board</h1>
      <div className="flex flex-wrap">
        {[...Array(numberOfButtons)].map((_, index) => (
          <SwitchButton key={index} number={index + 1} />
        ))}
      </div>
    </div>
  );
};

export default SwitchPage;
