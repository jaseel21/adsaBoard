import React from 'react';
import TokenCard from '../../ui/TokenCard';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * DossierCardKeycap: Rich card density view with audio-haptic interaction wrapper.
 */
export default function DossierCardKeycap({
  doc,
  isOn,
  onLeave,
  isBlocked,
  isLunch,
  isSupplyOff = false,
  onClick,
  dimmed = false,
  isSelectMode = false,
  isSelected = false,
}) {
  const handleClick = (studentDoc, e) => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    if (onClick) onClick(studentDoc, e);
  };

  return (
    <div
      className={`transition-all duration-200 ${
        dimmed ? 'opacity-20' : 'opacity-100'
      } ${
        isSelected
          ? 'ring-2 sm:ring-4 ring-emerald-400 rounded-2xl shadow-xl scale-[1.02]'
          : ''
      }`}
    >
      <TokenCard
        doc={doc}
        isOn={isOn}
        onLeave={onLeave}
        isBlocked={isBlocked}
        isLunch={isLunch}
        isSupplyOff={isSupplyOff}
        onClick={handleClick}
        isSelectMode={isSelectMode}
        isSelected={isSelected}
      />
    </div>
  );
}
