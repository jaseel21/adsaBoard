import React, { useEffect, useRef, useCallback } from 'react';
import { particlePool } from '../../utils/particlePhysics';
import { usePreferences } from '../../store/PreferencesContext';

/**
 * ClickParticleCanvas
 * Fixed non-blocking canvas that renders Newtonian particle bursts & expanding water drop ripples.
 * Automatically halts requestAnimationFrame when idle to ensure 0% CPU consumption.
 */
export default function ClickParticleCanvas({ burstTriggerRef }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const ripplesRef = useRef([]);
  const { preferences } = usePreferences();

  const isReducedMotion = preferences?.motionFidelity === 'reduced';
  const clickStyle = preferences?.clickRippleStyle || 'burst';
  const enabled = clickStyle !== 'off' && !isReducedMotion;

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw and update expanding kinetic ripples
    const ripples = ripplesRef.current;
    let hasActiveRipples = false;

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      if (!r.active) continue;

      hasActiveRipples = true;
      r.radius += r.speed;
      r.alpha -= r.decay;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        r.active = false;
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lineWidth;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw and update particle bursts
    const hasActiveParticles = clickStyle === 'burst'
      ? particlePool.updateAndDraw(ctx, canvas.width, canvas.height)
      : false;

    if (hasActiveRipples || hasActiveParticles) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      animFrameRef.current = null;
    }
  }, [clickStyle]);

  const ensureRunning = useCallback(() => {
    if (!animFrameRef.current && enabled) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animate, enabled]);

  // Window resize handler for crisp device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Expose triggers to parent via ref
  useEffect(() => {
    if (!burstTriggerRef) return;

    burstTriggerRef.current = {
      burst: (x, y, theme = 'emerald', count = 14) => {
        if (!enabled) return;
        if (clickStyle === 'burst') {
          particlePool.spawn(x, y, theme, count);
        }
        // Also spawn expanding kinetic ripple
        ripplesRef.current.push({
          x,
          y,
          radius: 4,
          maxRadius: 42,
          speed: 2.2,
          alpha: 0.5,
          decay: 0.024,
          lineWidth: 2,
          color: theme === 'rose' ? '#f43f5e' : theme === 'amber' ? '#f59e0b' : '#10b981',
          active: true,
        });
        ensureRunning();
      },
      ripple: (x, y, color = '#10b981') => {
        if (!enabled) return;
        ripplesRef.current.push({
          x,
          y,
          radius: 3,
          maxRadius: 36,
          speed: 2.0,
          alpha: 0.45,
          decay: 0.025,
          lineWidth: 1.5,
          color,
          active: true,
        });
        ensureRunning();
      },
    };
  }, [burstTriggerRef, enabled, clickStyle, ensureRunning]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99990] w-full h-full"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
}
