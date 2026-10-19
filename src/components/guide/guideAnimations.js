// Pro-Motion Spring Configurations & Animation Variants for Token Board Guide
export const guideSprings = {
  // Modal & Drawer Entrance Physics
  modalEntrance: {
    type: 'spring',
    damping: 30,
    stiffness: 420,
    mass: 0.85,
  },
  // Mobile Bottom Sheet Gestural Spring
  sheetEntrance: {
    type: 'spring',
    damping: 32,
    stiffness: 380,
    mass: 0.9,
  },
  // Token Button Tactile Press
  tactilePress: {
    type: 'spring',
    stiffness: 550,
    damping: 26,
  },
  // Sliding Tab Indicator
  tabIndicator: {
    type: 'spring',
    stiffness: 480,
    damping: 34,
  },
  // Gentle pulse for spotlight halos
  spotlightPulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Container Stagger Variants
export const guideStaggerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const guideItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
    },
  },
};
