/**
 * High-Performance Newtonian Particle Burst Simulation Engine
 * Designed for 60/120fps tactile click & meal toggle celebrations.
 * Uses object pooling to eliminate Garbage Collection stutter during interactions.
 */

const THEME_PALETTES = {
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#ecfdf5'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#e11d48', '#fff1f2'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#d97706', '#fffbeb'],
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#0891b2', '#ecfeff'],
  gold: ['#eab308', '#facc15', '#fde047', '#fef08a', '#ca8a04', '#ffffff'],
};

class ParticlePool {
  constructor(size = 120) {
    this.particles = [];
    for (let i = 0; i < size; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        alpha: 0,
        decay: 0,
        color: '#10b981',
        shape: 'circle', // 'circle' | 'spark' | 'star'
        active: false,
      });
    }
  }

  spawn(x, y, theme = 'emerald', count = 12) {
    const palette = THEME_PALETTES[theme] || THEME_PALETTES.emerald;
    let spawned = 0;

    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 2.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = Math.random() * 3.5 + 2.0;
        p.alpha = 1.0;
        p.decay = Math.random() * 0.025 + 0.02;
        p.color = palette[Math.floor(Math.random() * palette.length)];
        p.shape = Math.random() > 0.4 ? 'circle' : 'spark';
        spawned++;
      }
    }
  }

  updateAndDraw(ctx, width, height) {
    let hasActive = false;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      hasActive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96; // air resistance
      p.vy += 0.08; // subtle gravity
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.active = false;
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    return hasActive;
  }

  clear() {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
    }
  }
}

export const particlePool = new ParticlePool(150);
