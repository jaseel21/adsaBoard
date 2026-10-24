import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  Printer,
  Package,
  Scale,
  Sparkles,
  CheckCircle2,
  Wheat,
  Drumstick,
  Fish,
  Carrot,
  UtensilsCrossed,
  Droplets,
  Layers,
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import RationPrintModal from './RationPrintModal';

export default function KitchenRationCalculator({
  kitchenRations = {},
  telemetry = {},
  meta = {},
}) {
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const activeDiners = kitchenRations.activeDiners || telemetry.activeDiners || 0;
  const isBreakfast = meta.meal === 'breakfast';

  const items = [
    {
      name: isBreakfast ? 'Rice / Flour (അരി/മാവ്)' : 'Mess Rice (ചോറരി)',
      weight: `${kitchenRations.totalRiceKg || 0} kg`,
      sub: `${kitchenRations.riceSacks || 0} Chakku Sacks`,
      icon: Wheat,
      iconColor: 'text-amber-500 bg-amber-500/10',
      highlight: true,
    },
    ...(!isBreakfast ? [
      {
        name: 'Fresh Beef (ബീഫ്)',
        weight: `${kitchenRations.totalBeefKg || 0} kg`,
        sub: 'Deducted avoiders',
        icon: Drumstick,
        iconColor: 'text-rose-500 bg-rose-500/10',
        highlight: false,
      },
      {
        name: 'Fresh Fish (മത്സ്യം)',
        weight: `${kitchenRations.totalFishKg || 0} kg`,
        sub: 'Deducted avoiders',
        icon: Fish,
        iconColor: 'text-sky-500 bg-sky-500/10',
        highlight: false,
      },
    ] : []),
    {
      name: 'Fresh Vegetables (പച്ചക്കറികൾ)',
      weight: `${kitchenRations.totalVegKg || 0} kg`,
      sub: 'Curry & Sides',
      icon: Carrot,
      iconColor: 'text-orange-500 bg-orange-500/10',
      highlight: false,
    },
    {
      name: 'Pulses & Dhal (പരിപ്പ്)',
      weight: `${kitchenRations.totalDhalKg || 0} kg`,
      sub: 'Sambar / Parippu',
      icon: UtensilsCrossed,
      iconColor: 'text-amber-600 bg-amber-600/10',
      highlight: false,
    },
    {
      name: 'Cooking Oil (വെളിച്ചെണ്ണ/എണ്ണ)',
      weight: `${kitchenRations.cookingOilLiters || 0} L`,
      sub: 'Standard allocation',
      icon: Droplets,
      iconColor: 'text-yellow-500 bg-yellow-500/10',
      highlight: false,
    },
    {
      name: 'Onions & Shallots (ഉള്ളി)',
      weight: `${kitchenRations.onionsKg || 0} kg`,
      sub: 'Base gravy',
      icon: Layers,
      iconColor: 'text-purple-500 bg-purple-500/10',
      highlight: false,
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-emerald-500" />
            <span>Kitchen Preparation & Ingredient Projections</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Calculated raw ingredient weights for {activeDiners} active diners (avoidances deducted)
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playMechanicalClick();
            hapticEngine.lightTap();
            setPrintModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Kitchen Slip</span>
        </button>
      </div>

      {/* Ingredient Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                item.highlight
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-gray-50/70 dark:bg-white/5 border-gray-200/60 dark:border-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${item.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                {item.name}
              </div>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-sans">
                {item.weight}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {item.sub}
              </div>
            </div>
          );
        })}
      </div>

      {printModalOpen && (
        <RationPrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          items={items}
          meta={meta}
          activeDiners={activeDiners}
        />
      )}
    </div>
  );
}
