// MenuTable.jsx

import React from 'react';

const MenuTable = () => {
  // Dummy data for menu items
  const menu = [
    { day: 'Monday', meal: 'Breakfast', item: 'Pancakes' },
    { day: 'Monday', meal: 'Lunch', item: 'Chicken Salad' },
    { day: 'Monday', meal: 'Dinner', item: 'Grilled Salmon' },
    { day: 'Tuesday', meal: 'Breakfast', item: 'Omelette' },
    { day: 'Tuesday', meal: 'Lunch', item: 'Sandwiches' },
    { day: 'Tuesday', meal: 'Dinner', item: 'Pasta Carbonara' },
    // Add more days and meals as needed
  ];

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-center my-4">Weekly Menu</h1>
      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-800 uppercase text-sm leading-normal">
          <tr>
            <th className="py-3 px-6 text-left">Day</th>
            <th className="py-3 px-6 text-left">Meal</th>
            <th className="py-3 px-6 text-left">Item</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {menu.map((menuItem, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-3 px-6 text-left whitespace-nowrap">{menuItem.day}</td>
              <td className="py-3 px-6 text-left">{menuItem.meal}</td>
              <td className="py-3 px-6 text-left">{menuItem.item}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MenuTable;
