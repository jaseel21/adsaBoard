import React, { useContext, useState } from 'react';
import firebase from '../firebase/config'
import {DataOfOne} from '../store/StudentData';
import { useNavigate } from 'react-router-dom';







function StudentPort() {

  const {stdata}=useContext(DataOfOne)

   
  const [lunch, setLunch] = useState(stdata.obj.lunch);
  const [breakfast, setBreakfast] = useState(stdata.obj.breakfast);
  const [beef, setBeef] = useState(stdata.obj2.beef);
  const [chicken,setChicken]=useState(stdata.obj2.chicken);
  const [fish,setFish]=useState(stdata.obj2.fish)
  const [mutton,setMutton]=useState(stdata.obj2.mutton)

  const navigate=useNavigate()



 
 const handleLunchToggle=()=>{
  const LunchConfirm=window.confirm('Are you sure you want to change the settings')
  if(LunchConfirm){
    setLunch(!lunch)
  }
 }
 const handleBeackfastToggle=()=>{
  const breackFastConfirm=window.confirm('Are you sure you want to change the settings')
  if(breackFastConfirm){
    setBreakfast(!breakfast)
  }
 }

 const handleBeefToggle=()=>{
  const beefConfirm=window.confirm('Are you sure you want to change the settings')
  if(beefConfirm){
    setBeef(!beef)
  }
 }

 const handleChickenToggle=()=>{
  const chickenConfirm=window.confirm('Are you sure you want to change the settings')
  if(chickenConfirm){
    setChicken(!chicken)
  }
 }

 const handleFishToggle=()=>{
  const fishConfirm=window.confirm('Are you sure you want to change the settings')
  if(fishConfirm){
    setFish(!fish)
  }
 }
 const handleMuttonToggle=()=>{
  const muttonConfirm=window.confirm('Are you sure you want to change the settings')
  if(muttonConfirm){
    setMutton(!mutton)
  }
 }
 

  const handleSubmit = async (e) => {
  e.preventDefault();
  firebase.firestore().collection('students').doc(stdata.documentId).set({
    uname:stdata.uname,
    password:stdata.password,
    tokenNo:stdata.tokenNo,
    obj:{
      lunch:lunch,
      breakfast:breakfast
    },
    obj2:{
      beef:beef,
      chicken:chicken,
      fish:fish,
      mutton:mutton
    }

  }).then(()=>{
    navigate('/login')
    console.log("sucsussfully submitted");
  })
};


  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Student Portal</h2>
        <div className="mb-2 flex">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentNumber">
            Name :
          </label>
          <h2 className='block pl-2 text-gray-700 text-sm font-bold mb-2'>{stdata.uname}</h2>
        </div>
        <div className="mb-2 flex">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentNumber">
            Token Number : 
          </label>
          <h2 className='block pl-2 text-gray-700 text-sm font-bold mb-2'>{stdata.tokenNo}</h2>
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
            <span className="ml-2">Lunch On/Off</span>
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
            <span className="ml-2">Breakfast On/Off</span>
          </label>
        </div>
        {/* Checkout Options */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Checkout Options</h2>
          <div className="flex">
            <label className="inline-flex items-center mr-2">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-gray-600"
                checked={beef}
                onChange={handleBeefToggle}
              />
              <span className="ml-2 cursor-pointer">Beef </span>
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
        {/* Confirmation Dialog */}
        
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default StudentPort;
