import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_PREFERENCES } from '../utils/preferencesConfig';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { dialog } from '../utils/dialog';
import { safeLocalStorage } from '../utils/storage';

export const DEFAULT_PREFERENCES_CONTEXT_VALUE = {
  preferences: DEFAULT_PREFERENCES,
  persistedPreferences: DEFAULT_PREFERENCES,
  setPreference: () => {},
  updatePreferences: () => {},
  savePreferences: () => {},
  discardChanges: () => {},
  resetToFactoryDefaults: () => {},
  isDirty: false,
  dirtyKeys: [],
  dirtyCount: 0,
};

export const PreferencesContext = createContext(DEFAULT_PREFERENCES_CONTEXT_VALUE);

const STORAGE_KEY = 'adsatboard-app-preferences';

export function PreferencesProvider({ children }) {
  const { setTheme: setAppTheme } = useTheme();
  const { setLangPref: setAppLangPref } = useLanguage();
  const { setSoundEnabled: setFeedbackSoundEnabled, setHapticsEnabled: setFeedbackHapticsEnabled, feedback } = useFeedback();

  // Load baseline persisted preferences safely
  const [persisted, setPersisted] = useState(() => {
    if (typeof window !== 'undefined') {
      const parsed = safeLocalStorage.getJSON(STORAGE_KEY, null);
      if (parsed) {
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    }
    return { ...DEFAULT_PREFERENCES };
  });

  // Working draft state (enables smooth dirty checking and atomic Save / Discard)
  const [draft, setDraft] = useState(persisted);

  // Compute dirty state
  const { isDirty, dirtyKeys, dirtyCount } = useMemo(() => {
    const altered = [];
    for (const key of Object.keys(DEFAULT_PREFERENCES)) {
      if (JSON.stringify(draft[key]) !== JSON.stringify(persisted[key])) {
        altered.push(key);
      }
    }
    return {
      isDirty: altered.length > 0,
      dirtyKeys: altered,
      dirtyCount: altered.length,
    };
  }, [draft, persisted]);

  // Update a single preference key in draft
  const setPreference = useCallback((key, value) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Bulk update draft preferences
  const updatePreferences = useCallback((updates) => {
    setDraft((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Save changes to localStorage & trigger active environmental changes
  const savePreferences = useCallback(() => {
    try {
      safeLocalStorage.setJSON(STORAGE_KEY, draft);
      setPersisted(draft);

      // Harmonize with ThemeContext
      if (draft.theme === 'light' || draft.theme === 'dark' || draft.theme === 'system') {
        setAppTheme(draft.theme);
      } else if (draft.theme === 'obsidian' || draft.theme === 'solar') {
        setAppTheme('dark');
      }

      // Harmonize with LanguageContext
      if (draft.language) {
        setAppLangPref(draft.language);
      }

      // Harmonize with Feedback
      setFeedbackSoundEnabled(draft.soundEnabled);
      setFeedbackHapticsEnabled(draft.hapticsEnabled);

      feedback('success');
      dialog.toast.success('Preferences Saved', 'Your system preferences have been updated.');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      feedback('warning');
      dialog.toast.error('Save Error', 'Could not save preferences to local storage.');
    }
  }, [draft, setAppTheme, setAppLangPref, setFeedbackSoundEnabled, setFeedbackHapticsEnabled, feedback]);

  // Discard working changes back to persisted state
  const discardChanges = useCallback(() => {
    feedback('tick');
    setDraft(persisted);
    dialog.toast.info('Changes Discarded', 'Reverted unsaved adjustments.');
  }, [persisted, feedback]);

  // Reset all to system factory defaults
  const resetToFactoryDefaults = useCallback(async () => {
    const confirmed = await dialog.confirm({
      title: 'Reset All Preferences?',
      message: 'This will reset themes, audio, typography scaling, and security timings back to system defaults.',
      confirmText: 'Reset Defaults',
      cancelText: 'Cancel',
      confirmColor: 'rose',
      icon: 'warning',
    });

    if (confirmed) {
      feedback('pop');
      setDraft(DEFAULT_PREFERENCES);
      setPersisted(DEFAULT_PREFERENCES);
      safeLocalStorage.removeItem(STORAGE_KEY);
      dialog.toast.success('Reset Complete', 'System preferences returned to factory defaults.');
    }
  }, [feedback]);

  // Apply root DOM attributes based on active draft/persisted preferences
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Detect 3GB or lower RAM / low-spec CPU devices for automatic GPU acceleration protection
    const isLowMemoryDevice =
      (typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory <= 3) ||
      (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    // Font Scale & Motion Fidelity
    root.setAttribute('data-font-scale', draft.fontSizeScale || 'balanced');
    root.setAttribute('data-motion-fidelity', isLowMemoryDevice && draft.motionFidelity === 'cinematic' ? 'ergonomic' : (draft.motionFidelity || 'cinematic'));

    // Accessibility Attributes
    root.setAttribute('data-high-contrast', draft.highContrastMode || 'standard');
    root.setAttribute('data-colorblind-filter', draft.colorBlindFilter || 'none');
    root.setAttribute('data-dyslexic-font', String(Boolean(draft.dyslexicFont)));
    root.setAttribute('data-text-spacing', draft.textSpacing || 'standard');
    root.setAttribute('data-focus-ring', draft.focusRingStyle || 'prominent');
    root.setAttribute('data-underline-links', String(Boolean(draft.underlineLinks)));
    root.setAttribute('data-big-cursor', String(Boolean(draft.bigCursor)));

    // Glassmorphism (Automatically disable heavy backdrop blurs on 3GB RAM or low-GPU devices)
    if (draft.glassmorphismLevel === 'off' || (isLowMemoryDevice && draft.glassmorphismLevel !== 'high')) {
      root.classList.add('low-gpu-perf');
    } else {
      root.classList.remove('low-gpu-perf');
    }

    // Solar Theme High Contrast Class
    if (draft.theme === 'solar') {
      root.classList.add('solar-theme');
    } else {
      root.classList.remove('solar-theme');
    }

    // Obsidian Pure Black Theme Class
    if (draft.theme === 'obsidian') {
      root.classList.add('obsidian-theme');
    } else {
      root.classList.remove('obsidian-theme');
    }
  }, [
    draft.fontSizeScale,
    draft.motionFidelity,
    draft.glassmorphismLevel,
    draft.theme,
    draft.highContrastMode,
    draft.colorBlindFilter,
    draft.dyslexicFont,
    draft.textSpacing,
    draft.focusRingStyle,
    draft.underlineLinks,
    draft.bigCursor,
  ]);

  const value = useMemo(
    () => ({
      preferences: draft,
      persistedPreferences: persisted,
      setPreference,
      updatePreferences,
      savePreferences,
      discardChanges,
      resetToFactoryDefaults,
      isDirty,
      dirtyKeys,
      dirtyCount,
    }),
    [
      draft,
      persisted,
      setPreference,
      updatePreferences,
      savePreferences,
      discardChanges,
      resetToFactoryDefaults,
      isDirty,
      dirtyKeys,
      dirtyCount,
    ]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  return context || DEFAULT_PREFERENCES_CONTEXT_VALUE;
}
