import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_PREFERENCES } from '../utils/preferencesConfig';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { dialog } from '../utils/dialog';

export const PreferencesContext = createContext(null);

const STORAGE_KEY = 'adsatboard-app-preferences';

export function PreferencesProvider({ children }) {
  const { setTheme: setAppTheme } = useTheme();
  const { setLangPref: setAppLangPref } = useLanguage();
  const { setSoundEnabled: setFeedbackSoundEnabled, setHapticsEnabled: setFeedbackHapticsEnabled, feedback } = useFeedback();

  // Load baseline persisted preferences
  const [persisted, setPersisted] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...DEFAULT_PREFERENCES, ...parsed };
        }
      } catch (err) {
        console.warn('Could not parse persisted preferences, falling back to defaults:', err);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
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
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      dialog.toast.success('Reset Complete', 'System preferences returned to factory defaults.');
    }
  }, [feedback]);

  // Apply root DOM attributes based on active draft/persisted preferences
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Font Scale & Motion Fidelity
    root.setAttribute('data-font-scale', draft.fontSizeScale || 'balanced');
    root.setAttribute('data-motion-fidelity', draft.motionFidelity || 'cinematic');

    // Accessibility Attributes
    root.setAttribute('data-high-contrast', draft.highContrastMode || 'standard');
    root.setAttribute('data-colorblind-filter', draft.colorBlindFilter || 'none');
    root.setAttribute('data-dyslexic-font', String(Boolean(draft.dyslexicFont)));
    root.setAttribute('data-text-spacing', draft.textSpacing || 'standard');
    root.setAttribute('data-focus-ring', draft.focusRingStyle || 'prominent');
    root.setAttribute('data-underline-links', String(Boolean(draft.underlineLinks)));
    root.setAttribute('data-big-cursor', String(Boolean(draft.bigCursor)));

    // Glassmorphism
    if (draft.glassmorphismLevel === 'off') {
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
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
