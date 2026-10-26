import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePreferences } from '../../store/PreferencesContext';

/**
 * FluidCursor
 * Dual-layer award-winning desktop cursor with magnetic docking,
 * morphological shape shifts, and trailing stardust aura.
 * Strictly bypassed on touchscreens, reduced motion, or assistive big cursor modes.
 */
export default function FluidCursor({ cursorVariant, magneticTarget, isMouseDown }) {
  const { preferences } = usePreferences();
  const [visible, setVisible] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);

  // Position references (bypasses React state for 120fps mousemove)
  const mousePosRef = useRef({ x: -100, y: -100 });
  const haloPosRef = useRef({ x: -100, y: -100 });
  const lastTimeRef = useRef(performance.now());
  const velocityRef = useRef(0);
  const trailParticlesRef = useRef([]);

  const dotRef = useRef(null);
  const haloRef = useRef(null);
  const trailCanvasRef = useRef(null);
  const rafRef = useRef(null);

  const cursorStyle = preferences?.cursorStyle || 'magnetic_fluid';
  const showTrail = Boolean(preferences?.cursorTrail);
  const isReducedMotion = preferences?.motionFidelity === 'reduced';
  const isBigCursor = Boolean(preferences?.bigCursor);

  // Check hardware pointer capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsFinePointer(media.matches);

    const handler = (e) => setIsFinePointer(e.matches);
    try {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    } catch (_) {
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
  }, []);

  const shouldRender =
    isFinePointer &&
    cursorStyle !== 'system' &&
    !isReducedMotion &&
    !isBigCursor;

  // Track native mouse coordinates
  const handleMouseMove = useCallback((e) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;
    const dist = Math.hypot(dx, dy);

    velocityRef.current = dist / dt;
    lastTimeRef.current = now;

    mousePosRef.current = { x: e.clientX, y: e.clientY };

    if (!visible) setVisible(true);

    // Immediate inner dot placement for 0-latency precision
    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }

    // Spawn stardust particle if moving fast
    if (showTrail && velocityRef.current > 1.2 && trailCanvasRef.current) {
      trailParticlesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 2.5 + 1.2,
        alpha: 0.6,
        decay: 0.04,
        color: '#10b981',
      });
    }
  }, [visible, showTrail]);

  const handleMouseEnter = useCallback(() => setVisible(true), []);
  const handleMouseLeave = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!shouldRender) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [shouldRender, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  // Animation loop for spring halo and particle trail
  useEffect(() => {
    if (!shouldRender) return;

    const canvas = trailCanvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }

    const loop = () => {
      const targetX = magneticTarget
        ? magneticTarget.left + magneticTarget.width / 2
        : mousePosRef.current.x;
      const targetY = magneticTarget
        ? magneticTarget.top + magneticTarget.height / 2
        : mousePosRef.current.y;

      // Spring ease towards target
      const ease = magneticTarget ? 0.28 : 0.2;
      haloPosRef.current.x += (targetX - haloPosRef.current.x) * ease;
      haloPosRef.current.y += (targetY - haloPosRef.current.y) * ease;

      if (haloRef.current) {
        if (magneticTarget) {
          haloRef.current.style.transform = `translate3d(${magneticTarget.left}px, ${magneticTarget.top}px, 0)`;
          haloRef.current.style.width = `${magneticTarget.width}px`;
          haloRef.current.style.height = `${magneticTarget.height}px`;
          haloRef.current.style.borderRadius = `${magneticTarget.borderRadius || 16}px`;
          haloRef.current.style.borderColor = 'rgba(16, 185, 129, 0.6)';
          haloRef.current.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
        } else {
          let haloW = 34;
          let haloH = 34;
          let borderRadius = '50%';
          let borderCol = 'rgba(16, 185, 129, 0.45)';
          let bgCol = 'rgba(16, 185, 129, 0.04)';

          if (isMouseDown) {
            haloW = 22;
            haloH = 22;
            borderCol = 'rgba(16, 185, 129, 0.8)';
            bgCol = 'rgba(16, 185, 129, 0.15)';
          } else if (cursorVariant === 'pointer') {
            haloW = 46;
            haloH = 46;
            borderCol = 'rgba(16, 185, 129, 0.6)';
            bgCol = 'rgba(16, 185, 129, 0.08)';
          } else if (cursorVariant === 'text') {
            haloW = 4;
            haloH = 24;
            borderRadius = '4px';
            borderCol = 'rgba(16, 185, 129, 0.9)';
            bgCol = 'rgba(16, 185, 129, 0.5)';
          } else if (cursorVariant === 'view') {
            haloW = 54;
            haloH = 54;
            borderCol = 'rgba(56, 189, 248, 0.6)';
            bgCol = 'rgba(56, 189, 248, 0.1)';
          }

          haloRef.current.style.transform = `translate3d(${haloPosRef.current.x - haloW / 2}px, ${haloPosRef.current.y - haloH / 2}px, 0)`;
          haloRef.current.style.width = `${haloW}px`;
          haloRef.current.style.height = `${haloH}px`;
          haloRef.current.style.borderRadius = borderRadius;
          haloRef.current.style.borderColor = borderCol;
          haloRef.current.style.backgroundColor = bgCol;
        }
      }

      // Draw particle trail if enabled
      if (showTrail && trailCanvasRef.current) {
        const ctx = trailCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          const particles = trailParticlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
              particles.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [shouldRender, magneticTarget, isMouseDown, cursorVariant, showTrail]);

  if (!shouldRender || !visible) return null;

  return (
    <>
      {/* 1. Trailing Stardust Canvas */}
      {showTrail && (
        <canvas
          ref={trailCanvasRef}
          className="fixed inset-0 pointer-events-none z-[99997]"
          style={{ width: '100vw', height: '100vh' }}
          aria-hidden="true"
        />
      )}

      {/* 2. Fluid Magnetic Outer Spring Halo */}
      <div
        ref={haloRef}
        className="fixed top-0 left-0 pointer-events-none z-[99998] border transition-[border-color,background-color,border-radius] duration-150 ease-out will-change-transform shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-contrast-105"
        style={{
          boxSizing: 'border-box',
        }}
        aria-hidden="true"
      />

      {/* 3. Surgical Inner Point Dot (0-latency) */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999] will-change-transform"
        style={{
          width: '6px',
          height: '6px',
          marginLeft: '-3px',
          marginTop: '-3px',
        }}
        aria-hidden="true"
      >
        <div
          className={`w-full h-full rounded-full transition-transform duration-100 ${
            isMouseDown
              ? 'bg-rose-500 scale-125 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              : cursorVariant === 'view'
              ? 'bg-sky-400 scale-110 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
              : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
          }`}
        />
      </div>
    </>
  );
}
