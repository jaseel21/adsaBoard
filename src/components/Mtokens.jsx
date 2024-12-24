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

  const [bcsu,setBCSu]=useState(false)
  const [bcmo,setBCMo]=useState(false)
  const [bctu,setBCTu]=useState(false)
  const [bcwe,setBCWe]=useState(false)
  const [bcth,setBCTh]=useState(false)
  const [bcfr,setBCfr]=useState(false)
  const [bcsa,setBCSa]=useState(false)

  const [lcsu,setLCSu]=useState(false)
  const [lcmo,setLCMo]=useState(false)
  const [lctu,setLCTu]=useState(false)
  const [lcwe,setLCWe]=useState(false)
  const [lcth,setLCTh]=useState(false)
  const [lcfr,setLCfr]=useState(false)
  const [lcsa,setLCSa]=useState(false)

  const [bsu,setBSu]=useState(false)


  const handleBCSu=()=>{
    setBCSu(!bcsu)
  }

  const handleBCMo=()=>{
    setBCMo(!bcmo)
  }

  const handleBCTu=()=>{
    setBCTu(!bctu)
  }

  const handleBCWe=()=>{
    setBCWe(!bcwe)
  }

  const handleBCTh=()=>{
    setBCTh(!bcth)
  }

  const handleBCFr=()=>{
    setBCfr(!bcfr)
  }

  const handleBCSa=()=>{
    setBCSa(!lcsa)
  }

  //-----------------------
  const handleLCSu=()=>{
    setLCSu(!lcsu)
  }

  const handleLCMo=()=>{
    setLCMo(!lcmo)
  }

  const handleLCTu=()=>{
    setLCTu(!lctu)
  }

  const handleLCWe=()=>{
    setLCWe(!lcwe)
  }

  const handleLCTh=()=>{
    setLCTh(!lcth)
  }

  const handleLCFr=()=>{
    setLCfr(!lcfr)
  }

  const handleLCSa=()=>{
    setLCSa(!lcsa)
  }

  //-------------------
   const handleBSu=()=>{
     setBSu(!bsu)
     console.log(bsu);
    
   }


//   querySnapshot.forEach((doc) => {
//     // Get the current document data
//     const docData = doc.data();

//     // Define the specific updates for the days
//     const specificUpdates = {
//         lunch: {
//             mo: true,  // Set lunch for Monday to true
//             we: false, // Set lunch for Wednesday to false
//         },
//         breakfast: {
//             mo: true,  // Set breakfast for Monday to true
//             we: false, // Set breakfast for Wednesday to false
//         },
//     };

//     // Prepare the updated data
//     const updatedData = {
//         ...docData, // Merge the existing data
//         obj: { // Update the obj field
//             lunch: {
//                 ...docData.obj.lunch, // Keep existing values
//                 ...specificUpdates.lunch, // Overwrite specific days
//             },
//             breakfast: {
//                 ...docData.obj.breakfast, // Keep existing values
//                 ...specificUpdates.breakfast, // Overwrite specific days
//             },
//         },
//     };

//     // Use updatedData to update your Firestore document
//     console.log(updatedData);
// });




    return (
        <div className="container mx-auto p-6">

  <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 border-t-4 border-emerald-500">
    <h1 className="text-lg text-center font-medium text-gray-800 mb-6">Manage Tokens</h1>

    <form onSubmit={updateStudentMeals}>
      <div className="">

        <div className="flex  items-center space-x-4">
          <input
            type="checkbox"
            onClick={handleBreakfast}
            checked={breakfast}
            className="text-emerald-500 border-2 border-gray-400 rounded-lg focus:ring-emerald-500"
          />
 

          <label className="text-gray-700 text-sm">Breakfast</label>
         
          {/* <div className="mb-4 p-2 pt-1 w-full">
    

              <div className="grid grid-cols-7 gap-0 mt-3">
                
                <div className="flex flex-col items-center ">
                  <label htmlFor="su" className="text-xs text-gray-600">Su</label>
                  <input
                    type="checkbox"
                    id="su"
                    name="day"
                    checked={bcsu}                  
                    onChange={handleBCSu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded  focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="mo" className="text-xs text-gray-600">Mo</label>
                  <input
                    type="checkbox"
                    id="mo"
                    name="day"
                   checked={bcmo}
                   onChange={handleBCMo}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

              
                <div className="flex flex-col items-center">
                  <label htmlFor="tu" className="text-xs text-gray-600">Tu</label>
                  <input
                    type="checkbox"
                    id="tu"
                    name="day"
                   checked={bctu}
                   onChange={handleBCTu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                
                <div className="flex flex-col items-center">
                  <label htmlFor="we" className="text-xs text-gray-600">We</label>
                  <input
                    type="checkbox"
                    id="we"
                    name="day"
                   checked={bcwe}
                   onChange={handleBCWe}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="th" className="text-xs text-gray-600">Th</label>
                  <input
                    type="checkbox"
                    id="th"
                    name="day"
                    checked={bcth}
                    onChange={handleBCTh}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="fr" className="text-xs text-gray-600">Fr</label>
                  <input
                    type="checkbox"
                    id="fr"
                    name="day"
                   checked={bcfr}
                   onChange={handleBCFr}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="sa" className="text-xs text-gray-600">Sa</label>
                  <input
                    type="checkbox"
                    id="sa"
                    name="day"
                   checked={bcsa}
                   onChange={handleBCSa}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>
              </div>
            </div> */}

        </div>
        

            <div className="mb-4 p-4 pt-1">
    

              <div className="grid grid-cols-7 gap-0 mt-3">
                {bcsu && 
               
                 <div className="flex flex-col items-center">
                 <label htmlFor="su" className="text-xs text-gray-600">Su</label>
                 <input
                   type="checkbox"
                   id="su"
                   name="day"
                   checked={bsu}
                   onChange={handleBSu}
                   className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                 />
               </div>

                }
               
              {bcmo && <div className="flex flex-col items-center">
                  <label htmlFor="mo" className="text-xs text-gray-600">Mo</label>
                  <input
                    type="checkbox"
                    id="mo"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

               {bctu && <div className="flex flex-col items-center">
                  <label htmlFor="tu" className="text-xs text-gray-600">Tu</label>
                  <input
                    type="checkbox"
                    id="tu"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

               {bcwe && <div className="flex flex-col items-center">
                  <label htmlFor="we" className="text-xs text-gray-600">We</label>
                  <input
                    type="checkbox"
                    id="we"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

              {bcth &&  <div className="flex flex-col items-center">
                  <label htmlFor="th" className="text-xs text-gray-600">Th</label>
                  <input
                    type="checkbox"
                    id="th"
                    name="day"
                  
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
               

                {bcfr && <div className="flex flex-col items-center">
                  <label htmlFor="fr" className="text-xs text-gray-600">Fr</label>
                  <input
                    type="checkbox"
                    id="fr"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

               {bcsa && <div className="flex flex-col items-center">
                  <label htmlFor="sa" className="text-xs text-gray-600">Sa</label>
                  <input
                    type="checkbox"
                    id="sa"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                
              </div>
            </div>

        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={lunch}
            onChange={handleLunch}
            className="text-emerald-500 border-2 border-gray-400 rounded-lg focus:ring-emerald-500"
          />
          <label className="text-gray-700 text-sm ">Lunch</label>

          {/* <div className="mb-4 p-2 pt-1 w-full">
    

              <div className="grid grid-cols-7 gap-0 mt-3">
                
                <div className="flex flex-col items-center">
                  <label htmlFor="su" className="text-xs text-gray-600">Su</label>
                  <input
                    type="checkbox"
                    id="su"
                    name="day"
                    checked={lcsu}                  
                    onChange={handleLCSu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="mo" className="text-xs text-gray-600">Mo</label>
                  <input
                    type="checkbox"
                    id="mo"
                    name="day"
                   checked={lcmo}
                   onChange={handleLCMo}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

              
                <div className="flex flex-col items-center">
                  <label htmlFor="tu" className="text-xs text-gray-600">Tu</label>
                  <input
                    type="checkbox"
                    id="tu"
                    name="day"
                   checked={lctu}
                   onChange={handleLCTu}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

                
                <div className="flex flex-col items-center">
                  <label htmlFor="we" className="text-xs text-gray-600">We</label>
                  <input
                    type="checkbox"
                    id="we"
                    name="day"
                   checked={lcwe}
                   onChange={handleLCWe}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="th" className="text-xs text-gray-600">Th</label>
                  <input
                    type="checkbox"
                    id="th"
                    name="day"
                    checked={lcth}
                    onChange={handleLCTh}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="fr" className="text-xs text-gray-600">Fr</label>
                  <input
                    type="checkbox"
                    id="fr"
                    name="day"
                   checked={lcfr}
                   onChange={handleLCFr}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>

               
                <div className="flex flex-col items-center">
                  <label htmlFor="sa" className="text-xs text-gray-600">Sa</label>
                  <input
                    type="checkbox"
                    id="sa"
                    name="day"
                   checked={lcsa}
                   onChange={handleLCSa}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>
              </div>
            </div> */}
        </div>

        <div className="mb-4 p-4 pt-1">
    

              <div className="grid grid-cols-7 gap-0 mt-3">
                {lcsu && 
               
                 <div className="flex flex-col items-center">
                 <label htmlFor="su" className="text-xs text-gray-600">Su</label>
                 <input
                   type="checkbox"
                   id="su"
                   name="day"
                   
                   className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                 />
               </div>

                }
               
              {lcmo && <div className="flex flex-col items-center">
                  <label htmlFor="mo" className="text-xs text-gray-600">Mo</label>
                  <input
                    type="checkbox"
                    id="mo"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

               {lctu && <div className="flex flex-col items-center">
                  <label htmlFor="tu" className="text-xs text-gray-600">Tu</label>
                  <input
                    type="checkbox"
                    id="tu"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

               {lcwe && <div className="flex flex-col items-center">
                  <label htmlFor="we" className="text-xs text-gray-600">We</label>
                  <input
                    type="checkbox"
                    id="we"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

              {lcth &&  <div className="flex flex-col items-center">
                  <label htmlFor="th" className="text-xs text-gray-600">Th</label>
                  <input
                    type="checkbox"
                    id="th"
                    name="day"
                  
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
               

                {lcfr && <div className="flex flex-col items-center">
                  <label htmlFor="fr" className="text-xs text-gray-600">Fr</label>
                  <input
                    type="checkbox"
                    id="fr"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                

               {lcsa && <div className="flex flex-col items-center">
                  <label htmlFor="sa" className="text-xs text-gray-600">Sa</label>
                  <input
                    type="checkbox"
                    id="sa"
                    name="day"
                   
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 checked:bg-indigo-600 checked:border-indigo-600"
                  />
                </div>}
                
              </div>
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
            className="bg-emerald-600 mt-5 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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