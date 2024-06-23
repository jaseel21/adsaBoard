// MenuTable.jsx

import React from 'react';

const MenuTable = () => {
  // Dummy data for menu items
  const menu = [
    { day: 'Sun', meal: 'bf', item: 'Panca' },
    { day: 'Mon', meal: 'lu', item: 'Chicken ' },
    { day: 'Tues', meal: 'putt', item: ' Salm' },
    { day: 'Wed', meal: 'rise', item: 'Omele' },
    { day: 'Thu', meal: 'rise', item: 'Sand' },
    { day: 'Fri', meal: 'rise', item: 'Pasta ' },
    { day: 'Sat', meal: 'rise', item: 'Pasta ' },
    // Add more days and meals as needed
  ];

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-center my-4">Food Menu</h1>
      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-800 uppercase  leading-normal">
          <tr>
            <th className="py-3 px-6 text-left">Day</th>
            <th className="py-3 px-6 text-left">M-T</th>
            <th className="py-3 px-6 text-left">B-F</th>
            {/* <th className="py-3 px-6 text-left">L</th>
            <th className="py-3 px-6 text-left">e-t</th> */}
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {menu.map((menuItem, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">{menuItem.day}</td>
              <td className="py-3 px-6 text-left">{menuItem.meal}</td>
              <td className="py-3 px-6 text-left">{menuItem.item}</td>
              {/* <td className="py-3 px-6 text-left">{menuItem.meal}</td>
              <td className="py-3 px-6 text-left">{menuItem.meal}</td> */}
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MenuTable;
