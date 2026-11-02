import React, { useEffect } from 'react';
import { useTourEngine } from '../tour/TourEngineContext';

/**
 * Legacy WalkthroughTour Wrapper
 * Forwards any legacy open triggers to the Apex Tour Engine.
 */
const WalkthroughTour = ({ isOpen, onClose }) => {
  const { startTour } = useTourEngine();

  useEffect(() => {
    if (isOpen) {
      startTour('dashboard-basics', 'interactive');
      if (typeof onClose === 'function') {
        onClose();
      }
    }
  }, [isOpen, startTour, onClose]);

  return null;
};

export default WalkthroughTour;
