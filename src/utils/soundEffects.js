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

  /**
   * 5. Crystalline Notification Chime
   * Harmonic ascending chime (C6 -> E6 -> G6) for incoming broadcasts and opening alerts
   */
  playNotificationChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [1046.5, 1318.51, 1567.98]; // C6, E6, G6

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startAt = now + idx * 0.045;
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.06, startAt);
        gain.gain.exponentialRampToValueAtTime(0.0005, startAt + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + 0.23);
      });
    } catch (_) {}
  }

  /**
   * 6. Dismiss Soft Whoosh
   * Played when an alert or notification card is dismissed or marked read
   */
  playDismissWhoosh() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (_) {}
  }

  /**
   * 7. Meal Cutoff Alarm Chime (E5 -> G#5 -> B5 -> E6 Harmonic Arpeggio)
   * High-resonance alert sequence for campus meal deadline countdowns
   */
  playCutoffAlarmChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startAt = now + index * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.09, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + 0.36);
      });
    } catch (_) {}
  }

  /**
   * 8. Food Supply Approved Chime
   * Crisp, high-fidelity ascending tone (C6 -> G6) for sub-second serving confirmation
   */
  playServingApprovedChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [1046.5, 1567.98]; // C6, G6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startAt = now + idx * 0.035;
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.12, startAt);
        gain.gain.exponentialRampToValueAtTime(0.0008, startAt + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + 0.17);
      });
    } catch (_) {}
  }

  /**
   * 9. Food Supply Avoider Warning Tone
   * Distinctive low-frequency warning buzz to instantly arrest server's hand before dishing food
   */
  playAvoiderWarningTone() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.18);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_) {}
  }

  /**
   * 10. Duplicate Serving Alert
   * Dissonant dual-tone alert (320Hz + 370Hz) when a token has already taken food
   */
  playDuplicateAlert() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [320, 370].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);
      });
    } catch (_) {}
  }

  /**
   * 11. Grace Plate Courtesy Chime
   * Warm, gentle major triad (F5 -> A5 -> C6) for issuing compassionate dining plates
   */
  playGracePlateChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [698.46, 880.0, 1046.5]; // F5, A5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startAt = now + idx * 0.05;
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.09, startAt);
        gain.gain.exponentialRampToValueAtTime(0.0005, startAt + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + 0.29);
      });
    } catch (_) {}
  }
}

export const soundEngine = new AudioSynthesizer();

