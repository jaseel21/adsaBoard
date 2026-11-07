import React, { useEffect, useRef } from 'react';
import { useTourEngine } from './TourEngineContext';
import { useFeedback } from '../../utils/useFeedback';
import { safeSessionStorage } from '../../utils/storage';

export default function TourActionWatcher() {
  const {
    status,
    currentStep,
    tourMode,
    isTargetFound,
    completeCurrentStep,
  } = useTourEngine();

  const { feedback } = useFeedback();
  const stepCompletedRef = useRef(false);

  // Reset completion lock when step changes
  useEffect(() => {
    stepCompletedRef.current = false;
  }, [currentStep?.id]);

  useEffect(() => {
    if (status !== 'running' || !currentStep || tourMode !== 'interactive') return;

    const handleActionFired = () => {
      if (stepCompletedRef.current) return;
      stepCompletedRef.current = true;
      feedback('success');
      completeCurrentStep();
    };

    // Check if student is already authenticated
    const checkAuthStatus = () => {
      const parsed = safeSessionStorage.getJSON('adsa_student_session', null);
      if (parsed && (parsed.tokenNo || parsed.id)) {
        handleActionFired();
        return true;
      }
      return false;
    };

    if (currentStep.skipIfAuthenticated || currentStep.id === 'student-auth') {
      if (checkAuthStatus()) return;
    }

    // Monitor for student authentication state changes (handles instant login completion)
    let sessionInterval = null;
    if (currentStep.id === 'student-auth' || currentStep.skipIfAuthenticated) {
      sessionInterval = setInterval(() => {
        if (checkAuthStatus()) {
          clearInterval(sessionInterval);
        }
      }, 350);
    }

    // Dynamically track all matching primary and fallback targets (even if mounted inside modals)
    const watchedNodes = new Set();
    const syncAndAttach = () => {
      const keys = [currentStep.target, ...(currentStep.fallbackTargets || [])];
      keys.forEach((key) => {
        document.querySelectorAll(`[data-tour="${key}"]`).forEach((node) => {
          if (!watchedNodes.has(node)) {
            watchedNodes.add(node);
            if (currentStep.actionType === 'click' || currentStep.actionType === 'custom') {
              node.addEventListener('click', handleActionFired, { capture: true });
            } else if (currentStep.actionType === 'input' || currentStep.actionType === 'change') {
              node.addEventListener('input', handleActionFired, { capture: true });
              node.addEventListener('change', handleActionFired, { capture: true });
            }
          }
        });
      });
    };

    syncAndAttach();
    const scanInterval = setInterval(syncAndAttach, 250);

    return () => {
      clearInterval(scanInterval);
      if (sessionInterval) clearInterval(sessionInterval);
      watchedNodes.forEach((node) => {
        try {
          node.removeEventListener('click', handleActionFired, { capture: true });
          node.removeEventListener('input', handleActionFired, { capture: true });
          node.removeEventListener('change', handleActionFired, { capture: true });
        } catch (_) {}
      });
      watchedNodes.clear();
    };
  }, [status, currentStep, tourMode, isTargetFound, completeCurrentStep, feedback]);

  return null;
}
