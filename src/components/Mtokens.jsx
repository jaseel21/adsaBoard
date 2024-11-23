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
};

console.log(fNO,tNO);




    return (
        <div className="container mx-auto p-4 md:p-6">

        <div className="max-w-md mx-auto bg-white rounded shadow-md p-4 border border-gray-500 border-l-8 border-b-2 border-r-2">
          <h1 className="text-2xl text-center font- mb-4">Manage Tokens</h1>
    
          <form onSubmit={updateStudentMeals}>

            <div className="flex  flex-col">

            <div className="flex flex-row">
                

                <input type="checkbox" 
                onClick={handleBreakfast}
                checked={breakfast}/>
                <label className='px-4' htmlFor="">breakfast</label>
                </div>

                <div className=" flex flex-row">

                <input type="checkbox"
                checked={lunch}
                onChange={handleLunch} />
                <label className='px-4' htmlFor="">lunch</label>

                </div>              

            </div>
            <div className="flex flex-col space-y-4 items-center justify-center">
              <div className="flex items-center">
                <label htmlFor="lunchInput" className="mr-2">From:</label>
                <input
                  type="number"
                  id="lunchInput"
                  
                 onChange={(e)=>{setfNO(e.target.value)}}
                  className="border border-gray-300 rounded px-4 py-2"
                />
              </div>
    
              <div className="flex items-center">
                <label htmlFor="breakfastInput" className="mr-8">To:</label>
                <input
                  type="number"
                  id="breakfastInput"
                  onChange={(e)=>{settNO(e.target.value)}}
                 
                 
                  className="border border-gray-300 rounded px-4 py-2"
                />
              </div>
    
              <button
                type="submit"
               
                className="bg-emerald-500 hover:bg-emerald-700   text-white  font-bold py-2 px-4 rounded"
              >
                Update   
    
              </button>   
    
            </div>
          </form>
    
          
        </div>
        </div>
      );
}

export default Mtokens