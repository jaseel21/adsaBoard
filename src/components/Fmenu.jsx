import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Coffee, Sparkles, ArrowLeft, UtensilsCrossed, Calendar } from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useWorldTime } from '../utils/time';

const MenuTable = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { dayShort } = useWorldTime('Asia/Kolkata');

  const menu = [
    { key: 'su', day: 'Sunday', short: 'Sun', breakfast: 'Porotta & Kadala', lunch: 'Rice & Beef/Fish Curry', evening: 'Tea & Snacks' },
    { key: 'mo', day: 'Monday', short: 'Mon', breakfast: 'Appam & Veg Curry', lunch: 'Rice & Chicken/Fish Curry', evening: 'Tea & Snacks' },
    { key: 'tu', day: 'Tuesday', short: 'Tue', breakfast: 'Idli & Sambar', lunch: 'Rice & Fish Curry/Veg', evening: 'Tea & Snacks' },
    { key: 'we', day: 'Wednesday', short: 'Wed', breakfast: 'Dosa & Chutney', lunch: 'Rice & Meat Curry', evening: 'Tea & Snacks' },
    { key: 'th', day: 'Thursday', short: 'Thu', breakfast: 'Puttu & Kadala', lunch: 'Rice & Fish Curry', evening: 'Tea & Snacks' },
    { key: 'fr', day: 'Friday', short: 'Friday', breakfast: 'Pathiri & Curry', lunch: 'Special Biriyani / Ghee Rice', evening: 'Tea & Snacks' },
    { key: 'sa', day: 'Saturday', short: 'Sat', breakfast: 'Porotta & Egg Curry', lunch: 'Rice & Fish Curry', evening: 'Tea & Snacks' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            <span>{t('navMenu') || 'Weekly Canteen Menu'}</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Weekly meal schedule served at Alathurpadi Dars dining hall
          </p>
        </div>

        <button
          onClick={() => {
            feedback('tick');
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors self-end sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Board</span>
        </button>
      </div>

      {/* Mobile Card Grid (sm:hidden) */}
      <div className="block sm:hidden space-y-3">
        {menu.map((item) => {
          const isToday = dayShort === item.key;
          return (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border transition-all ${
                isToday
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 shadow-sm'
                  : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {item.day}
                </span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex-shrink-0">
                    ☕ BF
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{item.breakfast}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                    🍲 Lunch
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold">{item.lunch}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex-shrink-0">
                    🫖 Tea
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{item.evening}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (hidden sm:block) */}
      <div className="hidden sm:block rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-lg overflow-hidden backdrop-blur-xl">
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
              {menu.map((item) => {
                const isToday = dayShort === item.key;
                return (
                  <tr
                    key={item.key}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold'
                        : 'hover:bg-gray-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3.5 px-5 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <span>{item.day}</span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                          Today
                        </span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuTable;
