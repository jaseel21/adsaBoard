import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from '../firebase/config'




function Mtokens() {

    const navigate=useNavigate()
    
const [lunch,setLunch]=useState(false)
const [breakfast,setBreakfast]=useState(false)

const handleLunch=(event)=>{
    const {checked}=event.target
    if(!checked){

       const  lunchConform=window.confirm("want you off the lunch")
        if(lunchConform){
            setLunch(false)
        }else{
            setLunch(true)
        }
    }else{
        const  lunchConform=window.confirm("want you on the lunch")
        if(lunchConform){
            setLunch(true)
        }else{
            setLunch(false)
        }
    }

}

const handleBreakfast=(event)=>{
    const {checked}=event.target
    if(!checked){

       const  BFConform=window.confirm("want you off the breakfast")
        if(BFConform){
            setBreakfast(false)
        }else{
            setBreakfast(true)
        }
    }else{
        const  BFConform=window.confirm("want you on the breakfast")
        if(BFConform){
            setBreakfast(true)
        }else{
            setBreakfast(false)
        }
    }

}

const [fNO,setfNO]=useState(0)
const [tNO,settNO]=useState(0)


const updateStudentMeals = async (e) => {
    e.preventDefault();
    const SubmitConfirm=window.confirm("Are you sure you want to apply this change?")
    if(SubmitConfirm){

        
            if (fNO >= tNO) {
                alert('Invalid range: "From" token number must be less than "To" token number.');
                return; // Exit function if range is invalid
              }
        
            try {
                // Fetch documents where tokenNo is between 72 and 81
                const querySnapshot = await firebase.firestore()
                    .collection("students")
                    .where("tokenNo", ">=", parseInt(fNO))
                    .where("tokenNo", "<=", parseInt(tNO))
                    .get();
        
                // Create a batch to update documents
                const batch = firebase.firestore().batch();
        
                // Loop through each document in the query result
                querySnapshot.forEach((doc) => {
                    // Get the current document data
                    const docData = doc.data();
        
                    // Prepare the updated data: set lunch and breakfast to false for all days
                    const updatedData = {
                        ...docData, // Merge the existing data
                        obj: { // Update the obj field
                            lunch: {
                                su: lunch,
                                mo: lunch,
                                tu: lunch,
                                we: lunch,
                                th: lunch,
                                fr: lunch,
                                sa: lunch,
                            },
                            breakfast: {
                                su: breakfast,
                                mo: breakfast,
                                tu: breakfast,
                                we: breakfast,
                                th: breakfast,
                                fr: breakfast,
                                sa: breakfast,
                            }
                        },
                    };
        
                    // Add the update operation to the batch
                    batch.update(doc.ref, updatedData);
                });
        
                // Commit the batch to apply all the updates
                await batch.commit();
        
                console.log("Documents successfully updated!");
                navigate('/admin')
            } catch (error) {
                console.error("Error updating documents: ", error);
            }
    }
};

console.log(fNO,tNO);




    return (
        <div className="container mx-auto p-6">

  <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 border-t-4 border-emerald-500">
    <h1 className="text-lg text-center font-medium text-gray-800 mb-6">Manage Tokens</h1>

    <form onSubmit={updateStudentMeals}>
      <div className="space-y-6">

        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            onClick={handleBreakfast}
            checked={breakfast}
            className="text-emerald-500 border-2 border-gray-400 rounded-lg focus:ring-emerald-500"
          />
          <label className="text-gray-700 text-sm font-medium">Breakfast</label>
        </div>

        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={lunch}
            onChange={handleLunch}
            className="text-emerald-500 border-2 border-gray-400 rounded-lg focus:ring-emerald-500"
          />
          <label className="text-gray-700 text-sm font-medium">Lunch</label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4 justify-center">
            <label htmlFor="lunchInput" className="text-gray-700 font-sm">From:</label>
            <input
              type="number"
              id="lunchInput"
              onChange={(e) => { setfNO(e.target.value) }}
              className="border-2 border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-4 justify-center">
            <label htmlFor="breakfastInput" className="text-gray-700 pl-4 font-sm">To:</label>
            <input
              type="number"
              id="breakfastInput"
              onChange={(e) => { settNO(e.target.value) }}
              className="border-2 ml-4 border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            Update
          </button>
        </div>

      </div>
    </form>

  </div>
</div>

      );
}

export default Mtokens