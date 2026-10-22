/**
 * ADSA T-Board Haptic Feedback Controller
 * Safe wrapper around Navigator Vibration API for physical touch feedback on supported devices.
 */

class HapticController {
  constructor() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adsa_haptics_enabled');
        if (stored !== null) {
          this.enabled = stored === 'true';
        }
      } catch (_) {}
    }
  }

  isSupported() {
    return typeof window !== 'undefined' && 'vibrate' in navigator;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('adsa_haptics_enabled', String(this.enabled));
      } catch (_) {}
    }
  }

  isEnabled() {
    return this.enabled && this.isSupported();
  }

  vibrate(pattern) {
    if (this.isEnabled()) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  // Quick 8ms tap for keycaps
  lightTap() {
    this.vibrate(8);
  }

  // 15ms firm tick for switches and locks
  mediumTick() {
    this.vibrate(15);
  }

  // Success double-pulse
  successPulse() {
    this.vibrate([10, 30, 12]);
  }

  // Caution double-buzz
  warningBuzz() {
    this.vibrate([25, 40, 30]);
  }

  // Notification arrival double-tap
  notificationAlert() {
    this.vibrate([12, 35, 18]);
  }

  // Urgent notice attention sequence
  urgentAlert() {
    this.vibrate([25, 40, 25, 40, 40]);
  }
}

export const hapticEngine = new HapticController();

