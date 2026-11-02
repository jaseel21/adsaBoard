import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TOUR_TRACKS, getTrackById } from './tourTracks';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { useSmoothScroll } from '../scroll/SmoothScrollProvider';
import { subscribeToTourCampaign, evaluateTourAutoPrompt } from '../../utils/tourCampaignService';

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

  // Completed Missions Tracking
  const [completedTracks, setCompletedTracks] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Admin Campaign Governance Config
  const [campaignConfig, setCampaignConfig] = useState(null);

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
      try {
        localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(updated));
        localStorage.setItem(STORAGE_SEEN_KEY, 'true');
      } catch (_) {}
      return updated;
    });
  }, []);

  // Update target bounding box
  const updateTargetRect = useCallback(() => {
    if (status !== 'running' || !currentStep) {
      setTargetRect(null);
      setIsTargetFound(false);
      return;
    }

    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
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
      setTargetRect(null);
      setIsTargetFound(false);
    }
  }, [status, currentStep, scrollTo]);

  // Recalculate target rect on step change, resize, scroll, or DOM mutation
  useEffect(() => {
    if (status !== 'running' || !currentStep) return;

    // If step requires a different route, navigate there first
    if (currentStep.route && location.pathname !== currentStep.route) {
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
    };
  }, [status, currentStep, currentStepIndex, activeTrack, location.pathname, navigate, updateTargetRect, lang]);

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
    setStatus('idle');
    setActiveTrackId(null);
    setCurrentStepIndex(0);
    setTargetRect(null);
  }, [feedback]);

  // Close celebration modal
  const closeCelebration = useCallback(() => {
    setIsCelebrationOpen(false);
    setStatus('idle');
    setActiveTrackId(null);
    setCelebratedTrack(null);
  }, []);

  // Dismiss auto-prompt banner
  const dismissAutoPrompt = useCallback(() => {
    feedback('tick');
    setShowAutoPromptBanner(false);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, String(Date.now()));
    } catch (_) {}
  }, [feedback]);

  // Evaluate auto-prompt condition when campaign config or route changes
  useEffect(() => {
    if (!campaignConfig || status === 'running') return;

    let dismissedAt = null;
    let isFirstTime = true;
    try {
      const storedDismiss = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (storedDismiss) dismissedAt = Number(storedDismiss);
      const storedSeen = localStorage.getItem(STORAGE_SEEN_KEY);
      if (storedSeen === 'true') isFirstTime = false;
    } catch (_) {}

    const shouldPrompt = evaluateTourAutoPrompt({
      campaign: campaignConfig,
      isStudent: location.pathname.startsWith('/student'),
      isFirstTime,
      completedCount: completedTracks.length,
      lastDismissedAt: dismissedAt,
    });

    if (shouldPrompt) {
      const timer = setTimeout(() => {
        setShowAutoPromptBanner(true);
      }, (campaignConfig.triggerRule?.delaySeconds || 2) * 1000);
      return () => clearTimeout(timer);
    }
  }, [campaignConfig, status, location.pathname, completedTracks.length]);

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

