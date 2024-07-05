import React, { useEffect, useState } from 'react';
import firebase from '../firebase/config'


const MenuTable = () => {
  const [document,setDocuments]=useState([])
  const [beef,setBeef]=useState([])
  const [chicken,setChicken]=useState([])
  const [fish,setFish]=useState([])
  const [mutton,setMutton]=useState([])
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await firebase.firestore().collection('students').get();
        const tokenDocuments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        tokenDocuments.sort((a, b) => a.tokenNo - b.tokenNo);
        setDocuments(tokenDocuments);
        
        // Now that documents are fetched, call fetchBeef to process them
        fetchRejections(tokenDocuments);
        
        
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };
  
    const fetchRejections = (documents) => {
      const beefTokens = documents.filter(doc => doc.obj2 && !doc.obj2.beef).map(doc => doc.tokenNo);
      setBeef(beefTokens);

      const chickenTokens= documents.filter(doc => doc.obj && !doc.obj2.chicken).map(doc =>doc.tokenNo);
      setChicken(chickenTokens)

      const fishTokens= documents.filter(doc => doc.obj && !doc.obj2.fish).map(doc =>doc.tokenNo);
      setFish(fishTokens)

      const muttonTokens= documents.filter(doc => doc.obj && !doc.obj2.mutton).map(doc =>doc.tokenNo);
      setMutton(muttonTokens)
    };

    
  
    fetchData();
  
  }, []);
  
  useEffect(() => {
    console.log(beef); // This will log whenever beef state changes
    console.log(chicken);
    console.log(fish);
    console.log(mutton);
  }, [beef]);
  

  

  return (
    <div className="flex flex-col w-full max-w-md mx-auto">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black  uppercase tracking-wider">
        Beef
      </th>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black  uppercase tracking-wider">
        Chicken
      </th>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black  uppercase tracking-wider">
        Fish
      </th>
      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
        Mutton
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {Array.from({ length: Math.max(beef.length, chicken.length, fish.length, mutton.length) }).map((_, index) => (
      <tr key={index}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index < beef.length ? beef[index] : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index < chicken.length ? chicken[index] : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index < fish.length ? fish[index] : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index < mutton.length ? mutton[index] : ''}
        </td>
      </tr>
    ))}
  </tbody>
</table>




          </div>
        </div>
      </div>
    
    </div>
  );
};

export default MenuTable;
