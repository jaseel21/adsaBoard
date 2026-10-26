import React, { useRef } from 'react';
import { useTiltGlare } from '../../hooks/useTiltGlare';
import { useSpotlightBorder } from '../../hooks/useSpotlightBorder';

/**
 * SpotlightCard
 * Premium card wrapper combining 3D Parallax Tilt, dynamic Specular Glare,
 * and mouse-tracking perimeter border lighting.
 */
export default function SpotlightCard({
  children,
  className = '',
  maxTilt = 8,
  glare = true,
  scale = 1.015,
  magnetic = false,
  onClick,
  ...props
}) {
  const tilt = useTiltGlare({ maxTilt, glare, scale });
  const spotlight = useSpotlightBorder();

  // Combine event handlers
  const handleMouseMove = (e) => {
    tilt.onMouseMove(e);
    spotlight.onMouseMove(e);
  };

  const handleMouseLeave = () => {
    tilt.onMouseLeave();
  };

  // Combine refs
  const setRefs = (el) => {
    tilt.ref.current = el;
    spotlight.ref.current = el;
  };

  return (
    <div
      ref={setRefs}
      data-magnetic={magnetic ? 'true' : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={tilt.style}
      className={`spotlight-card relative transform-style-preserve-3d ${className}`}
      {...props}
    >
      {children}
      {/* Dynamic Specular Glare Overlay */}
      {glare && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-20"
          style={tilt.glareStyle}
        />
      )}
    </div>
  );
}
