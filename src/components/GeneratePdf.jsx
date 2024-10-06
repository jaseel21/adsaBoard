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
    const [section9, setSection9] = useState([]);
    const [section10, setSection10] = useState([]);

    const [Bsection1, setBsection1] = useState([]);
  const [Bsection2, setBsection2] = useState([]);
  const [Bsection3, setBsection3] = useState([]);
  const [Bsection4, setBsection4] = useState([]);
  const [Bsection5, setBsection5] = useState([]);
  const [Bsection6, setBsection6] = useState([]);
  const [Bsection7, setBsection7] = useState([]);
  const [Bsection8, setBsection8] = useState([]);
  const [Bsection9, setBsection9] = useState([]);
  const [Bsection10, setBsection10] = useState([]);


    
    
  const [day, setDay] = useState("");
 

  useEffect(() => {
  
   
    // Function to get the current day of the week in GMT+5:30
    const updateDay = () => {
      const nowUtc = new Date(); // Current time in UTC
      // Manually adjust for GMT+5:30
      const gmtPlus530 = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
      const dayOfWeek = getDayOfWeek(gmtPlus530);
      setDay(dayOfWeek);
      console.log(dayOfWeek, "day");
    };

    // Initial call to set the day immediately on mount
    updateDay();

    // Set up an interval to update every minute
    const timer = setInterval(updateDay, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Function to get the day of the week from a Date object
  const getDayOfWeek = (date) => {
    const daysOfWeek = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    return daysOfWeek[date.getUTCDay()]; // Use getUTCDay() to ensure we're working in UTC
    
  };

 console.log(day);


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
        
        

        console.log(day);
        

      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchData();

  }, []);





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
                const selectedSOT = sectionOneTokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection1(selectedSOT);
      
                
                
               const sectionTwoTokens = tokenDocuments.slice(5, 10);
               const selectedSTT = sectionTwoTokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
               setSection2(selectedSTT);
                

                const section3Tokens=tokenDocuments.slice(10, 15);
                const selectedS3T = section3Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                console.log(selectedS3T);
                setSection3(selectedS3T)
            
                const section4Tokens=tokenDocuments.slice(15, 20);
                const selectedS4T = section4Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection4(selectedS4T)
            
                const section5Tokens=tokenDocuments.slice(20, 25);
                const selectedS5T = section5Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection5(selectedS5T)
            
                const section6Tokens=tokenDocuments.slice(25, 30);
                const selectedS6T = section6Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection6(selectedS6T)
            
                const section7Tokens=tokenDocuments.slice(30, 35);
                const selectedS7T = section7Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection7(selectedS7T)
            
                const section8Tokens=tokenDocuments.slice(35, 40);
                const selectedS8T = section8Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection8(selectedS8T)
            
                const section9Tokens=tokenDocuments.slice(40, 45);
                const selectedS9T = section9Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection9(selectedS9T)
            
                const section10Tokens=tokenDocuments.slice(45, 50);
                const selectedS10T = section10Tokens.filter(doc => doc.obj && !doc.obj.lunch[day]).map(doc => doc.tokenNo);
                setSection10(selectedS10T)

                // -----------------------------------------------------



                const BsectionOneTokens = tokenDocuments.slice(0, 5);
        const BselectedSOT = BsectionOneTokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection1(BselectedSOT);

        console.log('sectionBf One:'+Bsection1);
        

        

        const BsectionTowTokens=tokenDocuments.slice(5, 10);
        console.log(BsectionTowTokens);
        const BselectedSTT = BsectionTowTokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);

        
        console.log(selectedSTT);
        setBsection2(BselectedSTT)

        const Bsection3Tokens=tokenDocuments.slice(10, 15);
        const BselectedS3T = Bsection3Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection3(BselectedS3T)

        const Bsection4Tokens=tokenDocuments.slice(15, 20);
        const BselectedS4T = Bsection4Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection4(BselectedS4T)

        const Bsection5Tokens=tokenDocuments.slice(20, 25);
        const BselectedS5T = Bsection5Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection5(BselectedS5T)

        const Bsection6Tokens=tokenDocuments.slice(25, 30);
        const BselectedS6T = Bsection6Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection6(BselectedS6T)

        const Bsection7Tokens=tokenDocuments.slice(30, 35);
        const BselectedS7T = Bsection7Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection7(BselectedS7T)

        const Bsection8Tokens=tokenDocuments.slice(35, 40);
        const BselectedS8T = Bsection8Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection8(BselectedS8T)

        const Bsection9Tokens=tokenDocuments.slice(40, 45);
        const BselectedS9T = Bsection9Tokens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection9(BselectedS9T)

        const Bsection10Tkens=tokenDocuments.slice(45, 50);
        const BselectedS10T= Bsection10Tkens.filter(doc => doc.obj && !doc.obj.breakfast[day]).map(doc => doc.tokenNo);
        setBsection10(BselectedS10T)
               

                
                // Similarly, set other sections as needed
                // Example: setSection3, setSection4, ..., setSection8

                console.log("secstoin one :"+section1);
                console.log("section two :"+section2);
                
                

            } catch (error) {
                console.error('Error fetching tokens:', error);
            }
        };

        fetchData();
    }, [day]);

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

  


  



  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Add the current date at the top of the document
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black color for the date
    doc.text(`Date: ${dateStr}`, 14, 10);

    // Define the columns for the first table
    const columns1 = [
        { header: 'Sec 1', dataKey: 'section1' },
        { header: 'Sec 2', dataKey: 'section2' },
        { header: 'Sec 3', dataKey: 'section3' },
        { header: 'Sec 4', dataKey: 'section4' },
        { header: 'Sec 5', dataKey: 'section5' },
        { header: 'Sec 6', dataKey: 'section6' },
        { header: 'Sec 7', dataKey: 'section7' },
        { header: 'Sec 8', dataKey: 'section8' },
        { header: 'Sec 9', dataKey: 'section9' },
        { header: 'Sec 10', dataKey: 'section10' }
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
        section8.length,
        section9.length,
        section10.length
    ) }).map((_, index) => ({
        section1: index === 0 && section1.length === 0 ? 'empty' : index < section1.length ? section1[index] : '',
        section2: index === 0 && section2.length === 0 ? 'empty' : index < section2.length ? section2[index] : '',
        section3: index === 0 && section3.length === 0 ? 'empty' : index < section3.length ? section3[index] : '',
        section4: index === 0 && section4.length === 0 ? 'empty' : index < section4.length ? section4[index] : '',
        section5: index === 0 && section5.length === 0 ? 'empty' : index < section5.length ? section5[index] : '',
        section6: index === 0 && section6.length === 0 ? 'empty' : index < section6.length ? section6[index] : '',
        section7: index === 0 && section7.length === 0 ? 'empty' : index < section7.length ? section7[index] : '',
        section8: index === 0 && section8.length === 0 ? 'empty' : index < section8.length ? section8[index] : '',
        section9: index === 0 && section9.length === 0 ? 'empty' : index < section9.length ? section9[index] : '',
        section10: index === 0 && section10.length === 0 ? 'empty' : index < section10.length ? section10[index] : '',
    }));

    // Add the title for the first table
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black color for the title
    doc.text('Lunch Token Canceled List', 14, 20);

    // Add the first table to the PDF
    doc.autoTable({
        columns: columns1,
        body: tableData1,
        startY: 25,
        theme: 'striped',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, padding: 5 },
        bodyStyles: { fontSize: 9, padding: 3 },
        margin: { top: 10 }, // Add top margin for the table
        didDrawPage: (data) => {
            // Ensure title is added before drawing tables
            if (data.pageCount === 1) {
                doc.text('Lunch Token Canceled List', 14, 20);
            }
        }
    });

    // Get the y-coordinate of the bottom of the first table
    const yAfterFirstTable = doc.lastAutoTable.finalY + 10; // add some margin

    // Define the columns for the second table
    const columns2 = [
        { header: 'Sec1', dataKey: 'Bsection1' },
        { header: 'Sec 2', dataKey: 'Bsection2' },
        { header: 'Sec 3', dataKey: 'Bsection3' },
        { header: 'Sec 4', dataKey: 'Bsection4' },
        { header: 'Sec 5', dataKey: 'Bsection5' },
        { header: 'Sec 6', dataKey: 'Bsection6' },
        { header: 'Sec 7', dataKey: 'Bsection7' },
        { header: 'Sec 8', dataKey: 'Bsection8' },
        { header: 'Sec 9', dataKey: 'Bsection9' },
        { header: 'Sec 10', dataKey: 'Bsection10' }
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
        Bsection8.length,
        Bsection9.length,
        Bsection10.length
    ) }).map((_, index) => ({
        Bsection1: index === 0 && Bsection1.length === 0 ? 'empty' : (index < Bsection1.length ? Bsection1[index] : ''),
        Bsection2: index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : ''),
        Bsection3: index === 0 && Bsection3.length === 0 ? 'empty' : (index < Bsection3.length ? Bsection3[index] : ''),
        Bsection4: index === 0 && Bsection4.length === 0 ? 'empty' : (index < Bsection4.length ? Bsection4[index] : ''),
        Bsection5: index === 0 && Bsection5.length === 0 ? 'empty' : (index < Bsection5.length ? Bsection5[index] : ''),
        Bsection6: index === 0 && Bsection6.length === 0 ? 'empty' : (index < Bsection6.length ? Bsection6[index] : ''),
        Bsection7: index === 0 && Bsection7.length === 0 ? 'empty' : (index < Bsection7.length ? Bsection7[index] : ''),
        Bsection8: index === 0 && Bsection8.length === 0 ? 'empty' : (index < Bsection8.length ? Bsection8[index] : ''),
        Bsection9: index === 0 && Bsection9.length === 0 ? 'empty' : (index < Bsection9.length ? Bsection9[index] : ''),
        Bsection10: index === 0 && Bsection10.length === 0 ? 'empty' : (index < Bsection10.length ? Bsection10[index] : '')
    }));

    // Add the title for the second table
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black color for the title
    doc.text('Breakfast Token Canceled List', 14, yAfterFirstTable + 10);

    // Add the second table to the PDF
    doc.autoTable({
        columns: columns2,
        body: tableData2,
        startY: yAfterFirstTable + 20, // Start after the title of the second table
        theme: 'striped',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, padding: 5 },
        bodyStyles: { fontSize: 9, padding: 3 },
        margin: { top: 10 }, // Add top margin for the table
        didDrawPage: (data) => {
            // Ensure title is added before drawing tables
            if (data.pageCount === 1) {
                doc.text('Breakfast Token Canceled List', 14, yAfterFirstTable + 10);
            }
        }
    });

    // Define y position for the third table after some margin from the second table
    const yAfterSecondTable = doc.lastAutoTable.finalY + 10; // Add some margin

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
    doc.text('Beef, Chicken, Mutton Avoiders', 14, yAfterSecondTable + 10);

    // Add the third table to the PDF
    doc.autoTable({
        columns: columns3,
        body: tableData3,
        startY: yAfterSecondTable + 15, // Start after the title of the third table
        theme: 'striped',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 10, padding: 5 },
        bodyStyles: { fontSize: 9, padding: 3 },
        margin: { top: 10 }, // Add top margin for the table
        didDrawPage: (data) => {
            // Ensure title is added before drawing tables
            if (data.pageCount === 1) {
                doc.text('Beef, Chicken, Mutton Avoiders', 14, yAfterSecondTable + 10);
            }
        }
    });

    // Save the PDF
    doc.save('adsa-token-list.pdf');
};




    return (
        <div className="p-14">
            <button onClick={generatePDF} class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center">
  <svg class="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
  <span>Download</span>
</button>

            <div className="flex flex-col w-full max-w-full mx-auto overflow-x-auto">
                <h1 className='p-5 text-center text-xl font-bold text-black underline'>Lunch Token Canceled List</h1>
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 1
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 2
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 3
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 4
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 5
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 6
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 7
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 8
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 9
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 10
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
                                section8.length,
                                section9.length,
                                section10.length
                            ) }).map((_, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && section1.length === 0 ? 'empty' : (index < section1.length ? section1[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && section2.length === 0 ? 'empty' : (index < section2.length ? section2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && section3.length === 0 ? 'empty' : (index < section3.length ? section3[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && section4.length === 0 ? 'empty' : (index < section4.length ? section4[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && section5.length === 0 ? 'empty' : (index < section5.length ? section5[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && section6.length === 0 ? 'empty' : (index < section6.length ? section6[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && section7.length === 0 ? 'empty' : (index < section7.length ? section7[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && section8.length === 0 ? 'empty' : (index < section8.length ? section8[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && section9.length === 0 ? 'empty' : (index < section9.length ? section9[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && section10.length === 0 ? 'empty' : (index < section10.length ? section10[index] : '')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <h1 className='p-5 text-center text-xl text-black font-bold underline'>Breakfast Token Canceled List</h1>
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 1
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 2
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 3
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 4
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 5
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 6
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 7
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 8
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 9
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                    Sec 10
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
                                Bsection8.length,
                                Bsection9.length,
                                Bsection10.length
                            ) }).map((_, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && Bsection1.length === 0 ? 'empty' : (index < Bsection1.length ? Bsection1[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && Bsection2.length === 0 ? 'empty' : (index < Bsection2.length ? Bsection2[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {index === 0 && Bsection3.length === 0 ? 'empty' : (index < Bsection3.length ? Bsection3[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                       {index === 0 && Bsection4.length === 0 ? 'empty' : (index < Bsection4.length ? Bsection4[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && Bsection5.length === 0 ? 'empty' : (index < Bsection5.length ? Bsection5[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && Bsection6.length === 0 ? 'empty' : (index < Bsection6.length ? Bsection6[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && Bsection7.length === 0 ? 'empty' : (index < Bsection7.length ? Bsection7[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && Bsection8.length === 0 ? 'empty' : (index < Bsection8.length ? Bsection8[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && Bsection9.length === 0 ? 'empty' : (index < Bsection9.length ? Bsection9[index] : '')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {index === 0 && Bsection10.length === 0 ? 'empty' : (index < Bsection10.length ? Bsection10[index] : '')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


            </div>
            <h1 className='p-5 text-center text-xl text-white font-bold underline'>Beef, Chicken, Mutton Avoiders</h1>
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
          {index ===0 && beef.length===0 ? "empty" : (index < beef.length ? beef[index] : '') }
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index==0 && chicken.length===0 ? "empty" : ( index < chicken.length ? chicken[index] : '')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index===0 && fish.length===0 ? "empty" : ( index < fish.length ? fish[index] : '')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {index===0 && mutton.length===0 ? "empty" : ( index < mutton.length ? mutton[index] : '')}
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
