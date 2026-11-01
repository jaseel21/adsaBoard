import React from 'react';
import { ChefHat, Printer, Users, UtensilsCrossed, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { useLanguage } from '../../../store/LanguageContext';

export default function MealHeadcountManifestSummary({
  telemetry = {},
  dietary = {},
  meta = {},
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isBreakfast = meta.meal === 'breakfast';
  const activeCount = isBreakfast ? telemetry.breakfastDiners : telemetry.lunchDiners;
  const standardCount = dietary.fullStandardDiners || (activeCount - (dietary.customDietCount || 0));

  const items = [
    {
      label: 'Standard Full Diet',
      count: standardCount > 0 ? standardCount : 0,
      sub: 'All menu items',
      color: 'emerald',
    },
    {
      label: 'Beef Avoidance',
      count: dietary.beefAvoiders || 0,
      sub: 'Separate non-beef serving',
      color: 'amber',
    },
    {
      label: 'Fish Avoidance',
      count: dietary.fishAvoiders || 0,
      sub: 'Alternative curry / side',
      color: 'sky',
    },
    {
      label: 'Chicken Avoidance',
      count: dietary.chickenAvoiders || 0,
      sub: 'Poultry-free meal',
      color: 'purple',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-emerald-500" />
            <span>Kitchen Preparation & Headcount Manifest</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Verified institutional diner counts for {meta.friendlyDate || 'Selected Date'} ({isBreakfast ? 'Breakfast' : 'Lunch'})
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playMechanicalClick();
            hapticEngine.lightTap();
            navigate('/supply');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Open Printable Manifest</span>
        </button>
      </div>

      {/* Grid of Verified Preparation Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/5"
          >
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
              {item.label}
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-1">
              {item.count} <span className="text-xs font-normal text-gray-400">diners</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
