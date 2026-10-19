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
  onClick,
  dimmed = false,
}) {
  const handleClick = (studentDoc) => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    if (onClick) onClick(studentDoc);
  };

  return (
    <div className={`transition-opacity duration-200 ${dimmed ? 'opacity-20' : 'opacity-100'}`}>
      <TokenCard
        doc={doc}
        isOn={isOn}
        onLeave={onLeave}
        isBlocked={isBlocked}
        isLunch={isLunch}
        onClick={handleClick}
      />
    </div>
  );
}
