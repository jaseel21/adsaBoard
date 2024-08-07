import React, { useContext, useState } from 'react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './StudentPort.css'


function AstudentPort() {
  const { stdata } = useContext(DataOfOne);

  const [lunch, setLunch] = useState(stdata.obj.lunch);
  const [breakfast, setBreakfast] = useState(stdata.obj.breakfast);
  const [beef, setBeef] = useState(stdata.obj2.beef);
  const [chicken, setChicken] = useState(stdata.obj2.chicken);
  const [fish, setFish] = useState(stdata.obj2.fish);
  const [mutton, setMutton] = useState(stdata.obj2.mutton);


  const navigate = useNavigate();
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);

  const handleLunchToggle = () => {
    const LunchConfirm = window.confirm('Are you sure you want to change the settings');
    if (LunchConfirm) {
      setLunch(!lunch);
    }
  };

  const handleBeackfastToggle = () => {
    const breackFastConfirm = window.confirm('Are you sure you want to change the settings');
    if (breackFastConfirm) {
      setBreakfast(!breakfast);
    }
  };

  const handleBeefToggle = () => {
    const beefConfirm = window.confirm('Are you sure you want to change the settings');
    if (beefConfirm) {
      setBeef(!beef);
    }
  };

  const handleChickenToggle = () => {
    const chickenConfirm = window.confirm('Are you sure you want to change the settings');
    if (chickenConfirm) {
      setChicken(!chicken);
    }
  };

  const handleFishToggle = () => {
    const fishConfirm = window.confirm('Are you sure you want to change the settings');
    if (fishConfirm) {
      setFish(!fish);
    }
  };

  const handleMuttonToggle = () => {
    const muttonConfirm = window.confirm('Are you sure you want to change the settings');
    if (muttonConfirm) {
      setMutton(!mutton);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    firebase
      .firestore()
      .collection('students')
      .doc(stdata.documentId)
      .set({
        uname: stdata.uname,
        password: stdata.password,
        tokenNo: stdata.tokenNo,
        block:blocked  ,
        obj: {
          lunch: lunch,
          breakfast: breakfast,
        },
        obj2: {
          beef: beef,
          chicken: chicken,
          fish: fish,
          mutton: mutton,
        },
      })
      .then(() => {
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your token updated',
          showConfirmButton: false,
          timer: 1500,
          customClass: {
            popup: 'swal2-center swal2-small',
            title: 'swal2-title-center',
            icon: 'swal2-icon-small',
            content: 'swal2-content-padding'
          },
        });
        navigate('/admin',{state:{isLunch:stdata.isLunch}});
        
      });
  };

  const toggleCheckoutOptions = () => {
    setShowCheckoutOptions(!showCheckoutOptions);
  };

  const [blocked, setBlocked] = useState(stdata.block);
  console.log(blocked);

  const handleBlockChange = () => {
    const  blockStatus=window.confirm("Are you sure you want to block this user")
    if (blockStatus) {
      
      setBlocked(true);
      console.log(blocked);
       firebase
      .firestore()
      .collection('students')
      .doc(stdata.documentId)
      .set({
        uname: stdata.uname,
        password: stdata.password,
        tokenNo: stdata.tokenNo,
        block:true,
        obj: {
          lunch: lunch,
          breakfast: breakfast,
        },
        obj2: {
          beef: beef,
          chicken: chicken,
          fish: fish,
          mutton: mutton,
        },
      })
    }
  };

  const handleUnblockChange = () => {
    console.log('called');
    const unblockStatus=window.confirm("Are sure you want to unblock this user")
    if (unblockStatus) {
      setBlocked(false);
      console.log(blocked);
      firebase
      .firestore()
      .collection('students')
      .doc(stdata.documentId)
      .set({
        uname: stdata.uname,
        password: stdata.password,
        tokenNo: stdata.tokenNo,
        block:false,
        obj: {
          lunch: lunch,
          breakfast: breakfast,
        },
        obj2: {
          beef: beef,
          chicken: chicken,
          fish: fish,
          mutton: mutton,
        },
      })
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="max-w-md mx-auto bg-white rounded shadow-md p-4">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-4 text-center">Student Portal</h2>
          <div className="flex">
  <div className="flex-none">
    <div className="mb-4 flex">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Name:
      </label>
      <h2 className="block pl-2 text-gray-700 text-sm mb-2">
        {stdata.uname}
      </h2>
    </div>
    <div className="mb-4 flex">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Token Number:
      </label>
      <h2 className="block pl-2 text-gray-700 text-sm mb-2">
        {stdata.tokenNo}
      </h2>
    </div>
  </div>

  <div className="ml-auto pr-6 border border-gray-500 border-l-8 border-b-2 border-r-2 rounded p-4"> {/* ml-auto pushes content to the right */}
  <div>
  {blocked ? (
    <div>
      <div className="flex items-center">
        <input
          type="radio"
          id="block"
          name="blockUnblock"
          className="form-radio h-5 w-5 text-blue-500"
          checked={true}
          onChange={handleBlockChange}
        />
        <label htmlFor="block" className="ml-2 text-red-600">Block</label>
      </div>
      <div className="flex items-center mt-2">
        <input
          type="radio"
          id="unblock"
          name="blockUnblock"
          className="form-radio h-5 w-5"
          checked={false}
          onChange={handleUnblockChange}
        />
        <label htmlFor="unblock" className="ml-2 text-green-700">Unblock</label>
      </div>
    </div>
  ) : (
    <div>
      <div className="flex items-center">
        <input
          type="radio"
          id="block"
          name="blockUnblock"
          className="form-radio h-5 w-5 text-blue-500"
          checked={false}
          onChange={handleBlockChange}
        />
        <label htmlFor="block" className="ml-2 text-red-600">Block</label>
      </div>
      <div className="flex items-center mt-2">
        <input
          type="radio"
          id="unblock"
          name="blockUnblock"
          className="form-radio h-5 w-5"
          checked={true}
          onChange={handleUnblockChange}
        />
        <label htmlFor="unblock" className="ml-2 text-green-700">Unblock</label>
      </div>
    </div>
  )}
</div>

  
  {blocked && (
    <span className="ml-2 text-red-500 text-sm  underline">Token is locked</span>
  )}
</div>

</div>

          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Lunch
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-500"
                checked={lunch}
                onChange={handleLunchToggle}
              />
              <span
                className={lunch ? "ml-2 text-green-800" : "ml-2 text-red-600"}
              >
                {lunch ? 'Lunch is On' : 'Lunch is Off'}
              </span>
            </label>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Breakfast
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-500"
                checked={breakfast}
                onChange={handleBeackfastToggle}
              />
              <span
                className={breakfast ? "ml-2 text-green-800" : "ml-2 text-red-600"}
              >
                {breakfast ? 'Breakfast is On' : 'Breakfast is Off'}
              </span>
            </label>
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={toggleCheckoutOptions}
              className="text-blue-500 underline cursor-pointer focus:outline-none"
            >
              More Options
            </button>
          </div>
          {showCheckoutOptions && (
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Checkout Options</h2>
              <div className="flex flex-wrap">
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={beef}
                    onChange={handleBeefToggle}
                  />
                  <span className="ml-2 cursor-pointer">Beef</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={chicken}
                    onChange={handleChickenToggle}
                  />
                  <span className="ml-2 cursor-pointer">Chicken</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={fish}
                    onChange={handleFishToggle}
                  />
                  <span className="ml-2 cursor-pointer">Fish</span>
                </label>
                <label className="inline-flex items-center mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-gray-600"
                    checked={mutton}
                    onChange={handleMuttonToggle}
                  />
                  <span className="ml-2 cursor-pointer">Mutton</span>
                </label>
              </div>
            </div>
          )}
          <button
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default AstudentPort;
