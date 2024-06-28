import React from 'react'
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';

function Admin() {

  const [isChecked, setIsChecked] = useState(false);

  const toggleSwitch = () => {
    setIsChecked(!isChecked);
  };
  return (
    <div>
      <div className="p-10">

      <div className=" flex justify-center items-center pb-4">
       <FontAwesomeIcon icon={faScrewdriverWrench} className='px-1'></FontAwesomeIcon>
      <h1 class="text-center text-2xl font-bold">Admin panel</h1>
      </div>
      <div className="text-left p-3 rounded-lg w-3/5 md:w-2/12 justify-center items-center flex  bg-white border  border-gray-500 border-l-8 border-b-2 border-r-2">

      <div className="flex p-1 items-center space-x-2 justify-start ">
        <h1 className='text-gray-500 text-sm font-bold'>Token Board</h1>
      <button
        className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${
          isChecked ? 'bg-green-600' : 'bg-red-600'
        }`}
        onClick={toggleSwitch}
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

     
    </div>
  )
}

export default Admin
