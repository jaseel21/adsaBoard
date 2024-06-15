import { createContext, useState } from "react";

export const DataOfOne=createContext(null)

function PersonInfo({children}){
    const [stdata,setStdata]=useState()

    return(
        <DataOfOne.Provider value={{stdata,setStdata}}>
            {children}
        </DataOfOne.Provider>
    )
}
export default PersonInfo