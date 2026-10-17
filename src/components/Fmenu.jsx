import React from 'react';
import { Utensils, Coffee, Sparkles } from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';

const MenuTable = () => {
  const { t } = useLanguage();

  const menu = [
    { day: 'Sun', breakfast: 'Porotta & Kadala', lunch: 'Rice & Beef/Fish Curry', evening: 'Tea & Snacks' },
    { day: 'Mon', breakfast: 'Appam & Veg Curry', lunch: 'Rice & Chicken/Fish Curry', evening: 'Tea & Snacks' },
    { day: 'Tue', breakfast: 'Idli & Sambar', lunch: 'Rice & Fish Curry/Veg', evening: 'Tea & Snacks' },
    { day: 'Wed', breakfast: 'Dosa & Chutney', lunch: 'Rice & Meat Curry', evening: 'Tea & Snacks' },
    { day: 'Thu', breakfast: 'Puttu & Kadala', lunch: 'Rice & Fish Curry', evening: 'Tea & Snacks' },
    { day: 'Fri', breakfast: 'Pathiri & Curry', lunch: 'Special Biriyani / Ghee Rice', evening: 'Tea & Snacks' },
    { day: 'Sat', breakfast: 'Porotta & Egg Curry', lunch: 'Rice & Fish Curry', evening: 'Tea & Snacks' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-500" />
          {t('navMenu')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Weekly meal schedule served at Alathurpadi Dars dining hall
        </p>
      </div>

      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-lg overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 dark:bg-[#131d1a]">
              <tr>
                <th className="py-3.5 px-5 font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Day
                </th>
                <th className="py-3.5 px-5 font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  ☕ Breakfast
                </th>
                <th className="py-3.5 px-5 font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  🍲 Lunch
                </th>
                <th className="py-3.5 px-5 font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  🫖 Evening Tea
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-800 dark:text-gray-200">
              {menu.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400">
                    {item.day}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600 dark:text-gray-300">
                    {item.breakfast}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900 dark:text-white">
                    {item.lunch}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600 dark:text-gray-300">
                    {item.evening}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuTable;
