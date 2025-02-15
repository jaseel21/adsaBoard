import React, { useEffect, useState } from 'react';
import firebase from '../firebase/config'
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {motion} from "framer-motion"

const MenuTable = () => {
  const [document,setDocuments]=useState([])
  const [beef,setBeef]=useState([])
  const [chicken,setChicken]=useState([])
  const [fish,setFish]=useState([])
  const [mutton,setMutton]=useState([])
  const [loading,setLoading]=useState(true)
  

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
        setLoading(false)
        
        
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

  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    // Function to get the formatted date in "day/month/year" format in GMT+5:30
    const updateFormattedDate = () => {
      const nowUtc = new Date(); // Current time in UTC
      // Manually adjust for GMT+5:30
      const gmtPlus530 = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);

      // Get date, month, and year
      const date = gmtPlus530.getDate(); // Day of the month (1-31)
      const month = gmtPlus530.getMonth() + 1; // Months are zero-indexed, so +1 (1-12)
      const year = gmtPlus530.getFullYear(); // Get the full year (e.g., 2024)

      // Format the date as "day/month/year"
      const formatted = `${date}/${month}/${year}`;

      // Update state
      setFormattedDate(formatted);

      console.log(formatted, "formatted date");
    };

    // Initial call to set the date immediately on mount
    updateFormattedDate();

    // Set up an interval to update every minute
    const timer = setInterval(updateFormattedDate, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, []);
  
  // useEffect(() => {
  //   console.log(beef); // This will log whenever beef state changes
  //   console.log(chicken);
  //   console.log(fish);
  //   console.log(mutton);
  // }, [beef]);
  
  const generatePDF = () => {
    
    const doc = new jsPDF('p', 'mm', 'a4');

    // Add the current date at the top of the document
    const today = new Date();
    const dateStr = formattedDate;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color for the date
    doc.text(`Date: ${dateStr}`, 14, 10);

    // Define the columns for the first table
    // const columns1 = [
    //     { header: 'Sec 1', dataKey: 'section1' },
    //     { header: 'Sec 2', dataKey: 'section2' },
    //     { header: 'Sec 3', dataKey: 'section3' },
    //     { header: 'Sec 4', dataKey: 'section4' },
    //     { header: 'Sec 5', dataKey: 'section5' },
    //     { header: 'Sec 6', dataKey: 'section6' },
    //     { header: 'Sec 7', dataKey: 'section7' },
    //     { header: 'Sec 8', dataKey: 'section8' },
    //     { header: 'Sec 9', dataKey: 'section9' },
    //     { header: 'Sec 10', dataKey: 'section10' }
    // ];

    // // Prepare the data for the first table
    // const tableData1 = Array.from({ length: Math.max(
    //     section1.length,
    //     section2.length,
    //     section3.length,
    //     section4.length,
    //     section5.length,
    //     section6.length,
    //     section7.length,
    //     section8.length,
    //     section9.length,
    //     section10.length
    // ) }).map((_, index) => ({
    //     section1: index === 0 && section1.length === 0 ? 'empty' : index < section1.length ? section1[index] : '',
    //     section2: index === 0 && section2.length === 0 ? 'empty' : index < section2.length ? section2[index] : '',
    //     section3: index === 0 && section3.length === 0 ? 'empty' : index < section3.length ? section3[index] : '',
    //     section4: index === 0 && section4.length === 0 ? 'empty' : index < section4.length ? section4[index] : '',
    //     section5: index === 0 && section5.length === 0 ? 'empty' : index < section5.length ? section5[index] : '',
    //     section6: index === 0 && section6.length === 0 ? 'empty' : index < section6.length ? section6[index] : '',
    //     section7: index === 0 && section7.length === 0 ? 'empty' : index < section7.length ? section7[index] : '',
    //     section8: index === 0 && section8.length === 0 ? 'empty' : index < section8.length ? section8[index] : '',
    //     section9: index === 0 && section9.length === 0 ? 'empty' : index < section9.length ? section9[index] : '',
    //     section10: index === 0 && section10.length === 0 ? 'empty' : index < section10.length ? section10[index] : '',
    // }));

    // // Add the title for the first table
    // doc.setFontSize(16);
    // doc.setTextColor(0, 0, 0); // Black color for the title
    // doc.text('Lunch Token Canceled List', 14, 20);

    // // Add the first table to the PDF
    // doc.autoTable({
    //     columns: columns1,
    //     body: tableData1,
    //     startY: 25,
    //     theme: 'striped',
    //     headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, padding: 5 },
    //     bodyStyles: { fontSize: 9, padding: 3 },
    //     margin: { top: 10 }, // Add top margin for the table
    //     didDrawPage: (data) => {
    //         // Ensure title is added before drawing tables
    //         if (data.pageCount === 1) {
    //             doc.text('Lunch Token Canceled List', 14, 20);
    //         }
    //     }
    // });

    // // Get the y-coordinate of the bottom of the first table
    // const yAfterFirstTable = doc.lastAutoTable.finalY + 10; // add some margin

    // // Define the columns for the second table
    // const columns2 = [
    //     { header: 'Sec1', dataKey: 'Bsection1' },
    //     { header: 'Sec 2', dataKey: 'Bsection2' },
    //     { header: 'Sec 3', dataKey: 'Bsection3' },
    //     { header: 'Sec 4', dataKey: 'Bsection4' },
    //     { header: 'Sec 5', dataKey: 'Bsection5' },
    //     { header: 'Sec 6', dataKey: 'Bsection6' },
    //     { header: 'Sec 7', dataKey: 'Bsection7' },
    //     { header: 'Sec 8', dataKey: 'Bsection8' },
    //     { header: 'Sec 9', dataKey: 'Bsection9' },
    //     { header: 'Sec 10', dataKey: 'Bsection10' }
    // ];

    // // Prepare the data for the second table
    // const tableData2 = Array.from({ length: Math.max(
    //     Bsection1.length,
    //     Bsection2.length,
    //     Bsection3.length,
    //     Bsection4.length,
    //     Bsection5.length,
    //     Bsection6.length,
    //     Bsection7.length,
    //     Bsection8.length,
    //     Bsection9.length,
    //     Bsection10.length
    // ) }).map((_, index) => ({
    //     Bsection1: index === 0 && Bsection1.length === 0 ? 'empty' : (index < Bsection1.length ? Bsection1[index] : ''),
    //     Bsection2: index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : ''),
    //     Bsection3: index === 0 && Bsection3.length === 0 ? 'empty' : (index < Bsection3.length ? Bsection3[index] : ''),
    //     Bsection4: index === 0 && Bsection4.length === 0 ? 'empty' : (index < Bsection4.length ? Bsection4[index] : ''),
    //     Bsection5: index === 0 && Bsection5.length === 0 ? 'empty' : (index < Bsection5.length ? Bsection5[index] : ''),
    //     Bsection6: index === 0 && Bsection6.length === 0 ? 'empty' : (index < Bsection6.length ? Bsection6[index] : ''),
    //     Bsection7: index === 0 && Bsection7.length === 0 ? 'empty' : (index < Bsection7.length ? Bsection7[index] : ''),
    //     Bsection8: index === 0 && Bsection8.length === 0 ? 'empty' : (index < Bsection8.length ? Bsection8[index] : ''),
    //     Bsection9: index === 0 && Bsection9.length === 0 ? 'empty' : (index < Bsection9.length ? Bsection9[index] : ''),
    //     Bsection10: index === 0 && Bsection10.length === 0 ? 'empty' : (index < Bsection10.length ? Bsection10[index] : '')
    // }));

    // // Add the title for the second table
    // doc.setFontSize(16);
    // doc.setTextColor(0, 0, 0); // Black color for the title
    // doc.text('Breakfast Token Canceled List', 14, yAfterFirstTable + 10);

    // // Add the second table to the PDF
    // doc.autoTable({
    //     columns: columns2,
    //     body: tableData2,
    //     startY: yAfterFirstTable + 20, // Start after the title of the second table
    //     theme: 'striped',
    //     headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, padding: 5 },
    //     bodyStyles: { fontSize: 9, padding: 3 },
    //     margin: { top: 10 }, // Add top margin for the table
    //     didDrawPage: (data) => {
    //         // Ensure title is added before drawing tables
    //         if (data.pageCount === 1) {
    //             doc.text('Breakfast Token Canceled List', 14, yAfterFirstTable + 10);
    //         }
    //     }
    // });

    // // Define y position for the third table after some margin from the second table
    // const yAfterSecondTable = doc.lastAutoTable.finalY + 10; // Add some margin

    // Define the columns for the third table
    const columns3 = [
        { header: 'Beef', dataKey: 'beef' },
        { header: 'Chicken', dataKey: 'chicken' },
        { header: 'Fish', dataKey: 'fish' },
        { header: 'Mutton', dataKey: 'mutton' },
    ];

    // Prepare the data for the third table
    const tableData3 = Array.from({ length: Math.max(
        beef.length,
        chicken.length,
        fish.length,
        mutton.length
    ) }).map((_, index) => ({
        beef: index === 0 && beef.length === 0 ? 'empty' : (index < beef.length ? beef[index] : ''),
        chicken: index === 0 && chicken.length === 0 ? 'empty' : (index < chicken.length ? chicken[index] : ''),
        fish: index === 0 && fish.length === 0 ? 'empty' : (index < fish.length ? fish[index] : ''),
        mutton: index === 0 && mutton.length === 0 ? 'empty' : (index < mutton.length ? mutton[index] : ''),
    }));

    // Add the title for the third table
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black color for the title
    doc.text('Beef, Chicken,Fish,Mutton Avoiders', 14,  20);

    
    // Add the third table to the PDF
    doc.autoTable({
        columns: columns3,
        body: tableData3,
        startY:   25, // Start after the title of the third table
        theme: 'striped',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, padding: 5 },
        bodyStyles: { fontSize: 9, padding: 3 },
        margin: { top: 10 }, // Add top margin for the table
        didDrawPage: (data) => {
            // Ensure title is added before drawing tables
            if (data.pageCount === 1) {
                doc.text('', 14, 20);
            }
        }
    });

    // Save the PDF
    doc.save('adsa-token-list.pdf');
};

if (loading) {
  // Loading screen


return (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
  {/* Bouncing Dots */}
  <div className="flex space-x-2">
    {[...Array(3)].map((_, index) => (
      <motion.div
        key={index}
        className="w-4 h-4 rounded-full bg-green-500"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.6,
          delay: index * 0.2,
        }}
      ></motion.div>
    ))}
  </div>
  <motion.p
    className="mt-4 text-green-700 font-bold text-lg"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
  >
    Loading...
  </motion.p>
</div>

);
}

  return (
    <div className="flex flex-col w-full max-w-md mx-auto">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <h1 className='p-5 text-center text-xl text-black font-bold underline'>Beef, Chicken, Fish, Mutton Avoiders</h1>
        <button onClick={generatePDF} class=" mb-5 ml-3   bg-white hover:bg-gray-200 text-black    border border-gray-400 font-bold py-2 px-4 rounded inline-flex items-center">
  <svg class="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
  <span className='text-sm'>PDF</span>
</button>
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
          {index==0 && beef.length==0 ? "empty" : beef.length ? beef[index] : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index==0 && chicken.length==0 ? "empty" : chicken.length ? chicken[index] : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index==0 && fish.length==0 ? "empty" : fish.length ? fish[index] : ''}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index==0 && mutton.length==0 ? "empty" : mutton.length ? mutton[index] : ''}
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
