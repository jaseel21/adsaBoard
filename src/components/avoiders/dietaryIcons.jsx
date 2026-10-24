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
  CheckCircle2,
  Layers,
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
  CheckCircle2,
  Layers,
};

export const getCategoryIcon = (iconName, className = 'w-4 h-4') => {
  if (!iconName) return <UtensilsCrossed className={className} />;
  if (React.isValidElement(iconName)) return iconName;
  const match =
    ICON_MAP[iconName] ||
    Object.entries(ICON_MAP).find(
      ([k]) => k.toLowerCase() === String(iconName).toLowerCase()
    )?.[1];
  const IconComp = match || UtensilsCrossed;
  return <IconComp className={className} />;
};

export default getCategoryIcon;
