import { useCallback, useRef, useState } from 'react';

export function useFeedback() {
  const audioCtxRef = useRef(null);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('adsatboard-sound');
      return val !== 'false'; // default true
    }
    return true;
  });

  const [hapticsEnabled, setHapticsEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('adsatboard-haptics');
      return val !== 'false'; // default true
    }
    return true;
  });

  const setSoundEnabled = (val) => {
    setSoundEnabledState(val);
    try {
      localStorage.setItem('adsatboard-sound', String(val));
    } catch (_) {}
  };

  const setHapticsEnabled = (val) => {
    setHapticsEnabledState(val);
    try {
      localStorage.setItem('adsatboard-haptics', String(val));
    } catch (_) {}
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
        // High soft glass tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.025);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'pop' || type === 'medium') {
        // Soft rounded pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        // Warm celebratory chime (D5 -> A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'warning' || type === 'error') {
        // Subtle thud
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (_) {}
  };

  const triggerVibration = (type) => {
    if (!hapticsEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;
    try {
      if (type === 'tick' || type === 'light') {
        navigator.vibrate(12);
      } else if (type === 'pop' || type === 'medium') {
        navigator.vibrate(28);
      } else if (type === 'success') {
        navigator.vibrate([25, 40, 25]);
      } else if (type === 'warning' || type === 'error') {
        navigator.vibrate([40, 40, 60]);
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
