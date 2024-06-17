import { createContext,useState,useEffect } from "react";

export const DataOnAll=createContext(null)

function  GetTokens({children}){

    const[allDocuments,setAllDocuments]=useState()

    return(

    <DataOnAll.Provider value={{allDocuments,setAllDocuments}}>
        {children}
    </DataOnAll.Provider>
    )

}
export default GetTokens