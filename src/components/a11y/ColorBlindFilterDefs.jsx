import React from 'react';

/**
 * Universal SVG Color Deficiency (Daltonization) Filters
 * Injected once into the root document to provide hardware-accelerated color transforms
 * for users with Protanopia, Deuteranopia, Tritanopia, or Achromatopsia.
 */
export default function ColorBlindFilterDefs() {
  return (
    <svg
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Protanopia (Red-Weak / Red-Blind) Daltonization Filter */}
        <filter id="a11y-filter-protanopia">
          <feColorMatrix
            type="matrix"
            values="
              0.567, 0.433, 0.000, 0, 0
              0.558, 0.442, 0.000, 0, 0
              0.000, 0.242, 0.758, 0, 0
              0.000, 0.000, 0.000, 1, 0
            "
          />
        </filter>

        {/* Deuteranopia (Green-Weak / Green-Blind) Daltonization Filter */}
        <filter id="a11y-filter-deuteranopia">
          <feColorMatrix
            type="matrix"
            values="
              0.625, 0.375, 0.000, 0, 0
              0.700, 0.300, 0.000, 0, 0
              0.000, 0.300, 0.700, 0, 0
              0.000, 0.000, 0.000, 1, 0
            "
          />
        </filter>

        {/* Tritanopia (Blue-Weak / Blue-Blind) Daltonization Filter */}
        <filter id="a11y-filter-tritanopia">
          <feColorMatrix
            type="matrix"
            values="
              0.950, 0.050, 0.000, 0, 0
              0.000, 0.433, 0.567, 0, 0
              0.000, 0.475, 0.525, 0, 0
              0.000, 0.000, 0.000, 1, 0
            "
          />
        </filter>

        {/* Achromatopsia / Monochromacy (True Grayscale High-Contrast) */}
        <filter id="a11y-filter-achromatopsia">
          <feColorMatrix
            type="matrix"
            values="
              0.299, 0.587, 0.114, 0, 0
              0.299, 0.587, 0.114, 0, 0
              0.299, 0.587, 0.114, 0, 0
              0.000, 0.000, 0.000, 1, 0
            "
          />
        </filter>
      </defs>
    </svg>
  );
}
