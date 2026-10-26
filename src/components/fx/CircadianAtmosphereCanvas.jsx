import React, { useEffect, useState, useMemo } from 'react';
import { usePreferences } from '../../store/PreferencesContext';

/**
 * CircadianAtmosphereCanvas
 * Immersive ambient background storytelling canvas.
 * Gently adapts luminous background hues based on Islamic prayer and meal windows:
 * - Dawn / Breakfast (Fajr): Aurora mint & ethereal emerald.
 * - Midday / Lunch (Dhuhr): Solar radiance & warm sage.
 * - Twilight / Night (Maghrib/Isha): Deep obsidian & celestial teal starlight.
 */
export default function CircadianAtmosphereCanvas() {
  const { preferences } = usePreferences();
  const [tiltOffset, setTiltOffset] = useState({ x: 0, y: 0 });

  const atmosphereSetting = preferences?.ambientAtmosphere || 'circadian';
  const isReducedMotion = preferences?.motionFidelity === 'reduced';
  const isLowGpu = preferences?.glassmorphismLevel === 'off';

  const isEnabled = atmosphereSetting !== 'off' && !isReducedMotion && !isLowGpu;

  // Compute Circadian Phase based on current hour
  const phase = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      return 'dawn'; // Breakfast & Morning
    } else if (hour >= 11 && hour < 16) {
      return 'solar'; // Midday & Lunch
    } else if (hour >= 16 && hour < 20) {
      return 'sunset'; // Asr & Maghrib
    } else {
      return 'night'; // Isha & Night
    }
  }, []);

  // Gyroscope tilt reaction for physical device presence
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    const handleOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;
      // Clamp tilt to subtle +/- 12px
      const x = Math.max(-12, Math.min(12, e.gamma * 0.4));
      const y = Math.max(-12, Math.min(12, (e.beta - 45) * 0.4));
      setTiltOffset({ x, y });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000 opacity-40 dark:opacity-25"
      style={{
        transform: `translate3d(${tiltOffset.x}px, ${tiltOffset.y}px, 0)`,
        transition: 'transform 120ms ease-out',
      }}
    >
      {/* Orb 1: Primary Circadian Luminescence */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 sm:w-[32rem] sm:h-[32rem] rounded-full blur-3xl transition-colors duration-1000 ${
          phase === 'dawn'
            ? 'bg-emerald-400/20'
            : phase === 'solar'
            ? 'bg-amber-300/18'
            : phase === 'sunset'
            ? 'bg-orange-400/15'
            : 'bg-teal-500/15'
        }`}
      />

      {/* Orb 2: Ambient Secondary Fill */}
      <div
        className={`absolute top-1/3 -right-32 w-80 h-80 sm:w-[28rem] sm:h-[28rem] rounded-full blur-3xl transition-colors duration-1000 ${
          phase === 'dawn'
            ? 'bg-teal-300/15'
            : phase === 'solar'
            ? 'bg-emerald-300/15'
            : phase === 'sunset'
            ? 'bg-rose-400/12'
            : 'bg-indigo-500/12'
        }`}
      />
    </div>
  );
}
