import { useCallback, useRef, useState } from 'react';
import { safeLocalStorage } from './storage';

const PREFS_STORAGE_KEY = 'adsatboard-app-preferences';

function getStoredAppPrefs() {
  if (typeof window === 'undefined') return {};
  return safeLocalStorage.getJSON(PREFS_STORAGE_KEY, {});
}

export function useFeedback() {
  const audioCtxRef = useRef(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const prefs = getStoredAppPrefs();
      if (typeof prefs.soundEnabled === 'boolean') return prefs.soundEnabled;
      const val = safeLocalStorage.getItem('adsatboard-sound', 'true');
      return val !== 'false'; // default true
    }
    return true;
  });

  const [hapticsEnabled, setHapticsEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const prefs = getStoredAppPrefs();
      if (typeof prefs.hapticsEnabled === 'boolean') return prefs.hapticsEnabled;
      const val = safeLocalStorage.getItem('adsatboard-haptics', 'true');
      return val !== 'false'; // default true
    }
    return true;
  });

  const setSoundEnabled = (val) => {
    setSoundEnabledState(val);
    safeLocalStorage.setItem('adsatboard-sound', String(val));
    const prefs = getStoredAppPrefs();
    safeLocalStorage.setJSON(PREFS_STORAGE_KEY, { ...prefs, soundEnabled: val });
  };

  const setHapticsEnabled = (val) => {
    setHapticsEnabledState(val);
    safeLocalStorage.setItem('adsatboard-haptics', String(val));
    const prefs = getStoredAppPrefs();
    safeLocalStorage.setJSON(PREFS_STORAGE_KEY, { ...prefs, hapticsEnabled: val });
  };

  const getAudioContext = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    return audioCtxRef.current;
  };

  const playSynthesizedSound = (type) => {
    if (!soundEnabled) return;
    try {
      const prefs = getStoredAppPrefs();
      const volumeMultiplier = typeof prefs.soundVolume === 'number' ? Math.max(0, Math.min(1, prefs.soundVolume)) : 0.8;
      if (volumeMultiplier <= 0) return;

      const profile = prefs.soundProfile || 'glass';

      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'tick' || type === 'light') {
        // High soft glass tick or soft bubble
        osc.type = profile === 'soft' ? 'sine' : profile === 'pop' ? 'triangle' : 'sine';
        const baseFreq = profile === 'soft' ? 520 : profile === 'chime' ? 987.77 : 800;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.025);
        gain.gain.setValueAtTime(0.04 * volumeMultiplier, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'pop' || type === 'medium') {
        // Soft rounded pop
        osc.type = profile === 'glass' ? 'sine' : 'triangle';
        const baseFreq = profile === 'chime' ? 440 : 320;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.05);
        gain.gain.setValueAtTime(0.06 * volumeMultiplier, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        // Warm celebratory chime
        osc.type = 'sine';
        const rootFreq = profile === 'soft' ? 440 : 587.33;
        const targetFreq = profile === 'soft' ? 659.25 : 880;
        osc.frequency.setValueAtTime(rootFreq, now);
        osc.frequency.setValueAtTime(targetFreq, now + 0.06);
        gain.gain.setValueAtTime(0.06 * volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'warning' || type === 'error') {
        // Subtle thud
        osc.type = profile === 'soft' ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.05 * volumeMultiplier, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'nudge') {
        // Gentle double bump for guiding user back to interactive target
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.03 * volumeMultiplier, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (_) {}
  };

  const triggerVibration = (type) => {
    if (!hapticsEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;
    try {
      const prefs = getStoredAppPrefs();
      const profile = prefs.hapticProfile || 'crisp';

      if (profile === 'subtle') {
        if (type === 'tick' || type === 'light') {
          navigator.vibrate(6);
        } else if (type === 'pop' || type === 'medium') {
          navigator.vibrate(14);
        } else if (type === 'success') {
          navigator.vibrate([15, 30, 15]);
        } else if (type === 'warning' || type === 'error') {
          navigator.vibrate([25, 30, 35]);
        }
      } else if (profile === 'pulse') {
        if (type === 'tick' || type === 'light') {
          navigator.vibrate([12, 10, 12]);
        } else if (type === 'pop' || type === 'medium') {
          navigator.vibrate([20, 15, 20]);
        } else if (type === 'success') {
          navigator.vibrate([30, 20, 30, 20, 45]);
        } else if (type === 'warning' || type === 'error') {
          navigator.vibrate([50, 35, 50]);
        }
      } else {
        // Default 'crisp'
        if (type === 'tick' || type === 'light') {
          navigator.vibrate(12);
        } else if (type === 'pop' || type === 'medium') {
          navigator.vibrate(28);
        } else if (type === 'success') {
          navigator.vibrate([25, 40, 25]);
        } else if (type === 'warning' || type === 'error') {
          navigator.vibrate([40, 40, 60]);
        } else if (type === 'nudge') {
          navigator.vibrate([10, 40, 15]);
        }
      }
    } catch (_) {}
  };

  const feedback = useCallback((type = 'tick') => {
    playSynthesizedSound(type);
    triggerVibration(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, hapticsEnabled]);

  return {
    feedback,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
  };
}
