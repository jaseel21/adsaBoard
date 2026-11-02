import React, { useEffect, useRef } from 'react';
import { useTourEngine } from './TourEngineContext';
import { useFeedback } from '../../utils/useFeedback';

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

    // Check if step can be auto-completed (e.g. Student Portal auth if already signed in)
    if (currentStep.skipIfAuthenticated) {
      try {
        const studentSession = sessionStorage.getItem('adsa_student_session');
        if (studentSession) {
          const parsed = JSON.parse(studentSession);
          if (parsed && (parsed.tokenNo || parsed.id)) {
            // Student is already authenticated! Advance automatically.
            const timer = setTimeout(() => {
              if (!stepCompletedRef.current) {
                stepCompletedRef.current = true;
                completeCurrentStep();
              }
            }, 600);
            return () => clearTimeout(timer);
          }
        }
      } catch (_) {}
    }

    const targetEl = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!targetEl) return;

    const handleActionFired = (e) => {
      if (stepCompletedRef.current) return;
      stepCompletedRef.current = true;
      feedback('success');
      completeCurrentStep();
    };

    // Attach listeners based on action type
    if (currentStep.actionType === 'click') {
      targetEl.addEventListener('click', handleActionFired, { capture: true, once: true });
    } else if (currentStep.actionType === 'input' || currentStep.actionType === 'change') {
      targetEl.addEventListener('input', handleActionFired, { capture: true, once: true });
      targetEl.addEventListener('change', handleActionFired, { capture: true, once: true });
    } else if (currentStep.actionType === 'custom') {
      // Listen for custom login or state change events
      const handleStorageUpdate = (e) => {
        if (e.key === 'adsa_student_session' && e.newValue) {
          handleActionFired(e);
        }
      };
      window.addEventListener('storage', handleStorageUpdate);
      targetEl.addEventListener('click', handleActionFired, { capture: true, once: true });

      return () => {
        window.removeEventListener('storage', handleStorageUpdate);
        targetEl.removeEventListener('click', handleActionFired, { capture: true });
      };
    }

    return () => {
      targetEl.removeEventListener('click', handleActionFired, { capture: true });
      targetEl.removeEventListener('input', handleActionFired, { capture: true });
      targetEl.removeEventListener('change', handleActionFired, { capture: true });
    };
  }, [status, currentStep, tourMode, isTargetFound, completeCurrentStep, feedback]);

  return null;
}

