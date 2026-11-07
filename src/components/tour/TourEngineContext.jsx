import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TOUR_TRACKS, getTrackById } from './tourTracks';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { useSmoothScroll } from '../scroll/SmoothScrollProvider';
import { subscribeToTourCampaign, evaluateTourAutoPrompt } from '../../utils/tourCampaignService';
import { safeLocalStorage, safeSessionStorage } from '../../utils/storage';

const STORAGE_PROGRESS_KEY = 'adsatboard-tour-progress-v3';
const STORAGE_SEEN_KEY = 'adsatboard-tour-seen-v3';
const STORAGE_DISMISSED_KEY = 'adsatboard-tour-dismissed-at';

export const TourEngineContext = createContext(null);

export function TourProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { feedback } = useFeedback();
  const { lang, t } = useLanguage();
  const { scrollTo } = useSmoothScroll();

  // Active tour state
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourMode, setTourMode] = useState('interactive'); // 'interactive' | 'cinematic'
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'completed'

  // Dynamic Target Rect
  const [targetRect, setTargetRect] = useState(null);
  const [isTargetFound, setIsTargetFound] = useState(false);
  const [waitingForAction, setWaitingForAction] = useState(true);

  // Modals & UI Controls
  const [isMissionHubOpen, setIsMissionHubOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [celebratedTrack, setCelebratedTrack] = useState(null);
  const [showAutoPromptBanner, setShowAutoPromptBanner] = useState(false);

  // Viewport / Device sensing
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  // Completed Missions Tracking
  const [completedTracks, setCompletedTracks] = useState(() => {
    if (typeof window === 'undefined') return [];
    return safeLocalStorage.getJSON(STORAGE_PROGRESS_KEY, []);
  });

  // Admin Campaign Governance Config
  const [campaignConfig, setCampaignConfig] = useState(null);

  // Active elevated target elements ref (tracks target and parent containers for clean restoration)
  const elevatedRecordsRef = useRef([]);

  const cleanupActiveElements = useCallback(() => {
    if (elevatedRecordsRef.current && elevatedRecordsRef.current.length > 0) {
      elevatedRecordsRef.current.forEach(({ element, position, zIndex, pointerEvents }) => {
        try {
          if (element) {
            element.style.position = position;
            element.style.zIndex = zIndex;
            element.style.pointerEvents = pointerEvents;
            element.classList.remove('tour-active-target');
          }
        } catch (_) {}
      });
      elevatedRecordsRef.current = [];
    }
  }, []);

  // Helper to find the first visible matching tour element (handling responsive mobile vs desktop elements)
  const findVisibleTourElement = useCallback((targetKey) => {
    if (!targetKey) return null;
    const matches = document.querySelectorAll(`[data-tour="${targetKey}"]`);
    if (!matches || matches.length === 0) return null;

    for (let i = 0; i < matches.length; i++) {
      const node = matches[i];
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      const isVisible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        (rect.width > 0 || rect.height > 0 || node.getClientRects().length > 0);

      if (isVisible) {
        return node;
      }
    }

    return matches[0];
  }, []);

  // Subscribe to real-time Tour Campaign Governance
  useEffect(() => {
    const unsub = subscribeToTourCampaign((cfg) => {
      setCampaignConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Active track and active step resolution
  const activeTrack = activeTrackId ? getTrackById(activeTrackId) : null;
  const currentStep = activeTrack && activeTrack.steps[currentStepIndex] ? activeTrack.steps[currentStepIndex] : null;

  // Save completed tracks to localStorage
  const markTrackCompleted = useCallback((trackId) => {
    setCompletedTracks((prev) => {
      if (prev.includes(trackId)) return prev;
      const updated = [...prev, trackId];
      safeLocalStorage.setJSON(STORAGE_PROGRESS_KEY, updated);
      safeLocalStorage.setItem(STORAGE_SEEN_KEY, 'true');
      return updated;
    });
  }, []);

  // Update target bounding box
  const updateTargetRect = useCallback(() => {
    if (status !== 'running' || !currentStep) {
      cleanupActiveElements();
      setTargetRect(null);
      setIsTargetFound(false);
      return;
    }

    // Resolve primary target or any fallback target
    let el = findVisibleTourElement(currentStep.target);
    if (!el && currentStep.fallbackTargets) {
      for (const fb of currentStep.fallbackTargets) {
        const candidate = findVisibleTourElement(fb);
        if (candidate) {
          el = candidate;
          break;
        }
      }
    }

    if (el) {
      // Re-elevate elements if target changed or elements are fresh
      cleanupActiveElements();

      const targetsToElevate = [el];
      if (currentStep.fallbackTargets) {
        currentStep.fallbackTargets.forEach((fbKey) => {
          const fbEl = findVisibleTourElement(fbKey);
          if (fbEl && !targetsToElevate.includes(fbEl)) {
            targetsToElevate.push(fbEl);
          }
        });
      }

      targetsToElevate.forEach((targetNode) => {
        if (!elevatedRecordsRef.current.some((r) => r.element === targetNode)) {
          elevatedRecordsRef.current.push({
            element: targetNode,
            position: targetNode.style.position || '',
            zIndex: targetNode.style.zIndex || '',
            pointerEvents: targetNode.style.pointerEvents || '',
          });
          targetNode.classList.add('tour-active-target');

          const computedPos = window.getComputedStyle(targetNode).position;
          if (computedPos === 'static') {
            targetNode.style.position = 'relative';
          }
          targetNode.style.zIndex = '126';
          targetNode.style.pointerEvents = 'auto';

          // Ascend parent tree and elevate any fixed/absolute/sticky containers having z-index < 126
          let curr = targetNode.parentElement;
          while (curr && curr !== document.body) {
            const comp = window.getComputedStyle(curr);
            if (['fixed', 'absolute', 'sticky', 'relative'].includes(comp.position)) {
              const z = parseInt(comp.zIndex, 10);
              if (!isNaN(z) && z < 126) {
                if (!elevatedRecordsRef.current.some((r) => r.element === curr)) {
                  elevatedRecordsRef.current.push({
                    element: curr,
                    position: curr.style.position || '',
                    zIndex: curr.style.zIndex || '',
                    pointerEvents: curr.style.pointerEvents || '',
                  });
                  curr.style.zIndex = '125';
                }
              }
            }
            curr = curr.parentElement;
          }
        }
      });

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const borderRadius = parseFloat(style.borderRadius) || 16;

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
        borderRadius: Math.min(borderRadius, 28),
      });
      setIsTargetFound(true);

      // Auto scroll target into comfortable view if out of viewport
      const viewportHeight = window.innerHeight;
      const margin = 100;
      if (rect.top < margin || rect.bottom > viewportHeight - margin) {
        if (typeof scrollTo === 'function') {
          scrollTo(el, { offset: -120, immediate: false });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else {
      cleanupActiveElements();
      setTargetRect(null);
      setIsTargetFound(false);
    }
  }, [status, currentStep, scrollTo, cleanupActiveElements, findVisibleTourElement]);

  // Recalculate target rect on step change, resize, scroll, or DOM mutation
  useEffect(() => {
    if (status !== 'running' || !currentStep) return;

    // If step requires a different route, navigate there first (unless already authenticated)
    if (currentStep.route && location.pathname !== currentStep.route) {
      if (currentStep.skipIfAuthenticated) {
        const session = safeSessionStorage.getJSON('adsa_student_session', null);
        if (session && session.tokenNo) {
          return;
        }
      }
      navigate(currentStep.route);
      return;
    }

    // Polling retry for elements that mount asynchronously or inside opened modals
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      updateTargetRect();
      if (attempts >= 15) {
        clearInterval(interval);
      }
    }, 120);

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, { passive: true });

    // Announce to screen readers
    const stepNumber = currentStepIndex + 1;
    const totalSteps = activeTrack ? activeTrack.steps.length : 1;
    const a11yMsg = `${lang === 'ml' ? currentStep.titleMl : currentStep.titleEn}. Step ${stepNumber} of ${totalSteps}. ${
      lang === 'ml' ? currentStep.actionPromptMl : currentStep.actionPromptEn
    }`;
    window.dispatchEvent(
      new CustomEvent('a11y-announce', {
        detail: { message: a11yMsg, mode: 'polite' },
      })
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
      cleanupActiveElements();
    };
  }, [status, currentStep, currentStepIndex, activeTrack, location.pathname, navigate, updateTargetRect, lang, cleanupActiveElements]);

  // Start a specific track
  const startTour = useCallback(
    (trackId = 'dashboard-basics', mode = 'interactive') => {
      feedback('pop');
      const track = getTrackById(trackId);
      setActiveTrackId(track.id);
      setCurrentStepIndex(0);
      setTourMode(mode);
      setStatus('running');
      setWaitingForAction(mode === 'interactive');
      setIsMissionHubOpen(false);
      setShowAutoPromptBanner(false);

      if (track.route && location.pathname !== track.route) {
        navigate(track.route);
      }
    },
    [feedback, location.pathname, navigate]
  );

  // Complete current step (triggered by ActionWatcher when preferred action is satisfied)
  const completeCurrentStep = useCallback(() => {
    feedback('success');

    if (!activeTrack) return;

    if (currentStepIndex < activeTrack.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setWaitingForAction(tourMode === 'interactive');
    } else {
      // Tour Track Completed!
      markTrackCompleted(activeTrack.id);
      setStatus('completed');
      setCelebratedTrack(activeTrack);
      setIsCelebrationOpen(true);
      feedback('success');
    }
  }, [activeTrack, currentStepIndex, tourMode, markTrackCompleted, feedback]);

  // Navigate manually to next step
  const nextStep = useCallback(() => {
    completeCurrentStep();
  }, [completeCurrentStep]);

  // Navigate back to previous step
  const prevStep = useCallback(() => {
    feedback('tick');
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setWaitingForAction(tourMode === 'interactive');
    }
  }, [currentStepIndex, feedback, tourMode]);

  // Skip or close tour
  const skipTour = useCallback(() => {
    feedback('tick');
    cleanupActiveElements();
    setStatus('idle');
    setActiveTrackId(null);
    setCurrentStepIndex(0);
    setTargetRect(null);
  }, [feedback, cleanupActiveElements]);

  // Close celebration modal
  const closeCelebration = useCallback(() => {
    cleanupActiveElements();
    setIsCelebrationOpen(false);
    setStatus('idle');
    setActiveTrackId(null);
    setCelebratedTrack(null);
  }, [cleanupActiveElements]);

  // Dismiss auto-prompt banner
  const dismissAutoPrompt = useCallback(() => {
    feedback('tick');
    setShowAutoPromptBanner(false);
    safeLocalStorage.setItem(STORAGE_DISMISSED_KEY, String(Date.now()));
  }, [feedback]);

  // Evaluate auto-prompt condition when campaign config or route changes
  useEffect(() => {
    if (!campaignConfig || status === 'running') return;

    let dismissedAt = null;
    let isFirstTime = true;
    const storedDismiss = safeLocalStorage.getItem(STORAGE_DISMISSED_KEY);
    if (storedDismiss) dismissedAt = Number(storedDismiss);
    const storedSeen = safeLocalStorage.getItem(STORAGE_SEEN_KEY);
    if (storedSeen === 'true') isFirstTime = false;

    const shouldPrompt = evaluateTourAutoPrompt({
      campaign: campaignConfig,
      isStudent: location.pathname.startsWith('/student'),
      isFirstTime,
      completedCount: completedTracks.length,
      lastDismissedAt: dismissedAt,
      isMobile,
    });

    if (shouldPrompt) {
      const timer = setTimeout(() => {
        setShowAutoPromptBanner(true);
      }, (campaignConfig.triggerRule?.delaySeconds || 2) * 1000);
      return () => clearTimeout(timer);
    }
  }, [campaignConfig, status, location.pathname, completedTracks.length, isMobile]);

  const value = {
    // State
    activeTrack,
    activeTrackId,
    currentStep,
    currentStepIndex,
    totalSteps: activeTrack ? activeTrack.steps.length : 0,
    tourMode,
    status,
    targetRect,
    isTargetFound,
    waitingForAction,
    completedTracks,
    isMissionHubOpen,
    isCelebrationOpen,
    celebratedTrack,
    showAutoPromptBanner,
    campaignConfig,
    isMobile,

    // Controls
    startTour,
    nextStep,
    prevStep,
    completeCurrentStep,
    skipTour,
    setTourMode,
    openMissionHub: () => {
      feedback('pop');
      setIsMissionHubOpen(true);
    },
    closeMissionHub: () => {
      feedback('tick');
      setIsMissionHubOpen(false);
    },
    closeCelebration,
    dismissAutoPrompt,
    updateTargetRect,
  };

  return <TourEngineContext.Provider value={value}>{children}</TourEngineContext.Provider>;
}

export function useTourEngine() {
  const context = useContext(TourEngineContext);
  if (!context) {
    throw new Error('useTourEngine must be used within a TourProvider');
  }
  return context;
}

