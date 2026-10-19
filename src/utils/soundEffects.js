/**
 * ADSA T-Board Procedural Audio Synthesizer (Web Audio API)
 * Generates zero-latency, high-fidelity tactile sounds without requiring external audio assets.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;

    // Load user sound preference from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adsa_sound_enabled');
        if (stored !== null) {
          this.enabled = stored === 'true';
        }
      } catch (_) {}
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('adsa_sound_enabled', String(this.enabled));
      } catch (_) {}
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * 1. Tactile Mechanical Keycap Click
   * Simulates a physical tactile mechanical keyboard switch (12ms pitch drop)
   */
  playMechanicalClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const now = this.ctx.currentTime;
      osc.type = 'triangle';

      // Rapid pitch plunge gives that crisp mechanical snap
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.014);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.016);
    } catch (_) {}
  }

  /**
   * 2. Harmonious Dual-Sine Soft Chime
   * Played on successful meal status toggle or confirmation
   */
  playSoftChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        gain.gain.setValueAtTime(0.08, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.13);
      });
    } catch (_) {}
  }

  /**
   * 3. Frequency-Sweep Pop
   * Played for tab switches, accordion expands, and filter chips
   */
  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.032);
    } catch (_) {}
  }

  /**
   * 4. Low-Frequency Caution Thud
   * Played for emergency freeze, locked actions, or warnings
   */
  playCautionThud() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch (_) {}
  }
}

export const soundEngine = new AudioSynthesizer();
