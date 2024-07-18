import React, { useState, useEffect } from 'react';
import firebase from '../firebase/config';  // Update the path to your Firebase configuration file
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FetchData = () => {
    const [data, setData] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [section1, setSection1] = useState([]);
    const [section2, setSection2] = useState([]);
    const [section3, setSection3] = useState([]);
    const [section4, setSection4] = useState([]);
    const [section5, setSection5] = useState([]);
    const [section6, setSection6] = useState([]);
    const [section7, setSection7] = useState([]);
    const [section8, setSection8] = useState([]);

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
                
                const sectionOneTokens = tokenDocuments.slice(0, 5);
                const selectedSOT = sectionOneTokens.filter(doc => doc.obj && !doc.obj.lunch).map(doc => doc.tokenNo);
                setSection1(selectedSOT);

                const sectionTwoTokens = tokenDocuments.slice(5, 10);
                const selectedSTT = sectionTwoTokens.filter(doc => doc.obj && !doc.obj.lunch).map(doc => doc.tokenNo);
                setSection2(selectedSTT);
                
                // Similarly, set other sections as needed
                // Example: setSection3, setSection4, ..., setSection8

            } catch (error) {
                console.error('Error fetching tokens:', error);
            }
        };

        fetchData();
    }, []);

    const [document,setDocument]=useState([])
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
        setDocument(tokenDocuments);
        
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

  const [Bsection1, setBsection1] = useState([]);
  const [Bsection2, setBsection2] = useState([]);
  const [Bsection3, setBsection3] = useState([]);
  const [Bsection4, setBsection4] = useState([]);
  const [Bsection5, setSBsction5] = useState([]);
  const [Bsection6, setBsection6] = useState([]);
  const [Bsection7, setBsection7] = useState([]);
  const [Bsection8, setBsection8] = useState([]);
  const [Bsection9, setBsection9] = useState([]);
  const [Bsection10, setBsection10] = useState([]);


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
        
        const sectionOneTokens = tokenDocuments.slice(0, 5);
        const selectedSOT = sectionOneTokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
        setBsection1(selectedSOT);

        const sectionTowTokens=tokenDocuments.slice(5, 10);
        console.log(sectionTowTokens);
    const selectedSTT = sectionTowTokens.filter(doc => doc.obj && !doc.obj.breakfast).map(doc => doc.tokenNo);
    console.log(selectedSTT);
    setBsection2(selectedSTT)
  

      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchData();

  }, []);



  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Define the columns for the first table
    const columns1 = [
        { header: 'Section 1', dataKey: 'section1' },
        { header: 'Section 2', dataKey: 'section2' },
        { header: 'Section 3', dataKey: 'section2' },
        { header: 'Section 4', dataKey: 'section2' },
        { header: 'Section 5', dataKey: 'section5' },
        { header: 'Section 6', dataKey: 'section6' },
        { header: 'Section 7', dataKey: 'section7' },
        { header: 'Section 8', dataKey: 'section8' }
    ];

    // Prepare the data for the first table
    const tableData1 = Array.from({ length: Math.max(
        section1.length,
        section2.length,
        section3.length,
        section4.length,
        section5.length,
        section6.length,
        section7.length,
        section8.length
    ) }).map((_, index) => ({
        // section1: section1.length === 0 ? 'empty' : (index < section1.length ? section1[index] : ''),
        section1: index==0 && section1.length === 0 ? 'empty' : index < section1.length ? section1[index] : '',
        section2: index==0 && section2.length === 0 ? 'empty' : index < section2.length ? section2[index] : '',
        section3: index==0 && section3.length === 0 ? 'empty' : index < section3.length ? section3[index] : '',
        section4: index < section4.length ? section4[index] : '',
        section5: index < section5.length ? section5[index] : '',
        section6: index < section6.length ? section6[index] : '',
        section7: index < section7.length ? section7[index] : '',
        section8: index < section8.length ? section8[index] : ''
    }));

    // Add the title for the first table
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204); // Title color
    doc.text('Lunch Token Canceled List', 14, 10);

    // Add the first table to the PDF
    doc.autoTable({
        columns: columns1,
        body: tableData1,
        startY: 20,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontSize: 12, padding: 5 },
        bodyStyles: { fontSize: 10, padding: 4 },
        margin: { top: 30 },
        didDrawPage: (data) => {
            // Ensure title is added before drawing tables
            if (data.pageCount === 1) {
                doc.text('Lunch Token Canceled List', 14, 10);
            }
        }
    });

    // Get the y-coordinate of the bottom of the first table
    const yAfterFirstTable = doc.lastAutoTable.finalY + 10; // add some margin

    // Define the columns for the second table
    const columns2 = [
        { header: 'Bsection 1', dataKey: 'Bsection1' },
        { header: 'Bsection 2', dataKey: 'Bsection2' },
        { header: 'Bsection 3', dataKey: 'Bsection2' },
        { header: 'Bsection 4', dataKey: 'Bsection2' },
        { header: 'Bsection 5', dataKey: 'Bsection5' },
        { header: 'Bsection 6', dataKey: 'Bsection6' },
        { header: 'Bsection 7', dataKey: 'Bsection7' },
        { header: 'Bsection 8', dataKey: 'Bsection8' }
    ];

    // Prepare the data for the second table
    const tableData2 = Array.from({ length: Math.max(
        Bsection1.length,
        Bsection2.length,
        Bsection3.length,
        Bsection4.length,
        Bsection5.length,
        Bsection6.length,
        Bsection7.length,
        Bsection8.length
    ) }).map((_, index) => ({
        Bsection1: index === 0 && Bsection1.length === 0 ? 'empty' : (index < Bsection1.length ? Bsection1[index] : ''),
        Bsection2: index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : ''),
        Bsection3: index < Bsection3.length ? Bsection3[index] : '',
        Bsection4: index < Bsection4.length ? Bsection4[index] : '',
        Bsection5: index < Bsection5.length ? Bsection5[index] : '',
        Bsection6: index < Bsection6.length ? Bsection6[index] : '',
        Bsection7: index < Bsection7.length ? Bsection7[index] : '',
        Bsection8: index < Bsection8.length ? Bsection8[index] : ''
    }));

    // Add the title for the second table
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204); // Title color
    doc.text('Breakfast Token Canceled List', 14, yAfterFirstTable + 10);

    // Add the second table to the PDF
    doc.autoTable({
        columns: columns2,
        body: tableData2,
        startY: yAfterFirstTable + 20, // Start after the title of the second table
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontSize: 12, padding: 5 },
        bodyStyles: { fontSize: 10, padding: 4 },
        margin: { top: 30 },
        didDrawPage: (data) => {
            // Ensure title is added before drawing tables
            if (data.pageCount === 1) {
                doc.text('Breakfast Token Canceled List', 14, yAfterFirstTable + 10);
            }
        }
    });

   // Define y position for the second table after some margin from the first table
const yAfterFirstTableq = doc.lastAutoTable.finalY + 10; // Add some margin

// Define the columns for the second table
const columns3 = [
    { header: 'Beef', dataKey: 'beef' },
    { header: 'Chicken', dataKey: 'chicken' },
    { header: 'Fish', dataKey: 'fish' },
    { header: 'Mutton', dataKey: 'mutton' },
];

// Prepare the data for the second table
const tableData3 = Array.from({ length: Math.max(
    beef.length,
    chicken.length,
    fish.length,
    mutton.length
) }).map((_, index) => ({
    beef: index===0 && beef===0 ? "emppty" :( index < beef.length ? beef[index] : ''),
    chicken: chicken===0 && chicken===0 ? "emppty" :( index < chicken.length ? chicken[index] : ''),
    fish: fish===0 && fish===0 ? "emppty" :( index < fish.length ? fish[index] : ''),
    mutton: mutton===0 && mutton===0 ? "emppty" :( index < mutton.length ? mutton[index] : ''),
}));

// Add the title for the second table
doc.setFontSize(16);
doc.setTextColor(0, 102, 204); // Title color
doc.text('Beef, Chicken, Mutton Avoiders', 14, yAfterFirstTableq + 10);

// Add the second table to the PDF
doc.autoTable({
    columns: columns3,
    body: tableData3,
    startY: yAfterFirstTableq + 30, // Start after the title of the second table
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontSize: 12, padding: 5 },
    bodyStyles: { fontSize: 10, padding: 4 },
    margin: { top: 10 }, // Adjust margin if necessary

    didDrawPage: (data) => {
        // Ensure title is added before drawing tables
        if (data.pageCount === 1) {
            doc.text('Beef, Chicken, Mutton Avoiders', 14, yAfterFirstTableq + 10);
        }
    }
});


    // Save the PDF
    doc.save('adsa-token-list.pdf');
};



    return (
        <div className="p-14">
            <button onClick={generatePDF} className="bg-blue-500 text-white py-2 px-4 rounded mb-4">
                Generate PDF
            </button>
            <div className="flex flex-col w-full max-w-full mx-auto overflow-x-auto">
                <h1 className='p-5 text-center text-xl font-bold underline'>Lunch Token Canceled List</h1>
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 1
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 2
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 3
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 4
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 5
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 6
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 7
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 8
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.from({ length: Math.max(
                                section1.length,
                                section2.length,
                                section3.length,
                                section4.length,
                                section5.length,
                                section6.length,
                                section7.length,
                                section8.length
                            ) }).map((_, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && section1.length === 0 ? 'empty' : (index < section1.length ? section1[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && section2.length === 0 ? 'empty' : (index < section2.length ? section2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && section2.length === 0 ? 'empty' : (index < section2.length ? section2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && section2.length === 0 ? 'empty' : (index < section2.length ? section2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section5.length ? section5[index] : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section6.length ? section6[index] : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section7.length ? section7[index] : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section8.length ? section8[index] : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <h1 className='p-5 text-center text-xl font-bold underline'>Breakfast Token Canceled List</h1>
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 1
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 2
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 3
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 4
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 5
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 6
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 7
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Section 8
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.from({ length: Math.max(
                                Bsection1.length,
                                Bsection2.length,
                                Bsection3.length,
                                Bsection4.length,
                                Bsection5.length,
                                Bsection6.length,
                                Bsection7.length,
                                Bsection8.length
                            ) }).map((_, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && Bsection1.length === 0 ? 'empty' : (index < Bsection1.length ? Bsection1[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < Bsection5.length ? Bsection5[index] : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section6.length ? section6[index] : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section7.length ? section7[index] : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index < section8.length ? section8[index] : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


            </div>
            <h1 className='p-5 text-center text-xl font-bold underline'>Beef, Chicken, Mutton Avoiders</h1>
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

export default FetchData;
