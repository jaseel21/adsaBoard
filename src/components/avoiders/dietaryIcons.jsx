import React from 'react';
import {
  UtensilsCrossed,
  Drumstick,
  Fish,
  Egg,
  Coffee,
  Apple,
  Leaf,
  Utensils,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const ICON_MAP = {
  Utensils,
  UtensilsCrossed,
  Drumstick,
  Fish,
  Egg,
  Apple,
  Coffee,
  Leaf,
  AlertCircle,
  ShieldAlert,
};

export const getCategoryIcon = (iconName, className = 'w-4 h-4') => {
  const IconComp = ICON_MAP[iconName] || UtensilsCrossed;
  return <IconComp className={className} />;
};

export default getCategoryIcon;
