import {
  Sliders,
  Palette,
  Volume2,
  UserCheck,
  Shield,
  HardDrive,
  Database,
  Utensils,
  HelpCircle,
  Smartphone,
  Sparkles,
  Laptop,
  Accessibility,
} from 'lucide-react';
import { ROLES, hasRole } from './rbac';

/**
 * Default Client Preferences Baseline
 */
export const DEFAULT_PREFERENCES = {
  // General
  language: 'system', // 'system' | 'en' | 'ml'
  clockFormat: '12h', // '12h' | '24h'
  showHijriDate: true,
  hijriDateOffset: 0, // -2 | -1 | 0 | 1 | 2 (days offset for local Hilal moon sighting)
  defaultLandingRoute: '/', // '/', '/menu', '/student', '/kitchen', '/admin'
  smoothScrollEnabled: true,

  // Appearance
  theme: 'system', // 'system' | 'dark' | 'light' | 'obsidian' | 'solar'
  glassmorphismLevel: 'high', // 'high' | 'low' | 'off'
  fontSizeScale: 'balanced', // 'compact' | 'balanced' | 'roomy' | 'kiosk'
  motionFidelity: 'cinematic', // 'cinematic' | 'ergonomic' | 'reduced'
  accentGlow: true,

  // Advanced Universal Accessibility (WCAG 2.2 AA/AAA)
  highContrastMode: 'standard', // 'standard' | 'high' | 'maximum_oled'
  colorBlindFilter: 'none', // 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
  underlineLinks: false,
  bigCursor: false,
  dyslexicFont: false, // Atkinson Hyperlegible
  textSpacing: 'standard', // 'standard' | 'enhanced'
  readingGuide: false, // Cognitive cursor line ruler
  focusRingStyle: 'prominent', // 'subtle' | 'prominent' | 'high_visibility_halo'
  screenReaderVerbosity: 'balanced', // 'compact' | 'balanced' | 'descriptive'
  voiceAssistance: false, // Web Speech API voice synthesis
  voiceRate: 1.0, // 0.8 to 1.5

  // Sound & Tactile
  soundEnabled: true,
  soundProfile: 'glass', // 'glass' | 'pop' | 'chime' | 'soft'
  soundVolume: 0.8, // 0.0 to 1.0
  hapticsEnabled: true,
  hapticProfile: 'crisp', // 'subtle' | 'crisp' | 'pulse'

  // Student Privacy & Display
  kioskTimeoutMode: 'strict', // 'strict' (90s) | 'extended' (15m) | 'persistent' (24h)

  // Cook / Kitchen Ops Client Config
  kdsAutoRefreshInterval: 30, // seconds: 10 | 30 | 60 | 0 (manual)
  screenWakeLockEnabled: true,
  audibleAvoidanceAlert: true,
};

/**
 * Settings Navigation Sections Registry
 */
export const SETTINGS_SECTIONS = [
  {
    id: 'general',
    hash: '#general',
    labelEn: 'General & Locale',
    labelMl: 'പൊതുവായവ & ഭാഷ',
    descriptionEn: 'Language, time display, landing portal & smooth scroll',
    descriptionMl: 'സിസ്റ്റം ഭാഷ, സമയം, ഹോം പേജ് ക്രമീകരണങ്ങൾ',
    icon: Sliders,
    color: 'emerald',
    isPublic: true,
  },
  {
    id: 'appearance',
    hash: '#appearance',
    labelEn: 'Appearance & Themes',
    labelMl: 'പ്രതീതി & തീം',
    descriptionEn: 'Themes, glassmorphism, font scaling & live preview',
    descriptionMl: 'ഡാർക്ക്/ലൈറ്റ് തീം, അക്ഷര വലിപ്പം, ഡിസൈൻ ശൈലി',
    icon: Palette,
    color: 'teal',
    isPublic: true,
  },
  {
    id: 'accessibility',
    hash: '#accessibility',
    labelEn: 'Accessibility & Inclusion',
    labelMl: 'ആക്സസിബിലിറ്റി & ഇൻക്ലൂഷൻ',
    descriptionEn: 'Colorblind filters, high contrast, dyslexic font, TTS voice & reading ruler',
    descriptionMl: 'കളർ-ബ്ലൈൻഡ് ഫിൽട്ടർ, ഹൈ കോൺട്രാസ്റ്റ്, വോയ്സ് വായന, റീഡിംഗ് റൂളർ',
    icon: Accessibility,
    color: 'cyan',
    isPublic: true,
  },
  {
    id: 'feedback',
    hash: '#feedback',
    labelEn: 'Tactile & Audio FX',
    labelMl: 'ശബ്ദം & വൈബ്രേഷൻ',
    descriptionEn: 'Synthesizer sound effects, volume slider & haptics',
    descriptionMl: 'ക്ലിക്ക് ശബ്ദങ്ങളും സ്പർശന വൈബ്രേഷനും',
    icon: Volume2,
    color: 'cyan',
    isPublic: true,
  },
  {
    id: 'account',
    hash: '#account',
    labelEn: 'Account & Identity',
    labelMl: 'അക്കൗണ്ട് & ഐഡന്റിറ്റി',
    descriptionEn: 'Token profile, staff credentials & PIN password update',
    descriptionMl: 'ടോക്കൺ വിവരങ്ങളും പാസ്‌വേഡ് മാറ്റവും',
    icon: UserCheck,
    color: 'indigo',
    isPublic: true,
  },
  {
    id: 'security',
    hash: '#security',
    labelEn: 'Security & Kiosk',
    labelMl: 'സുരക്ഷ & കിയോസ്ക്',
    descriptionEn: 'Public terminal timer, session monitor & device health',
    descriptionMl: 'ഓട്ടോ ലോഗൗട്ട് സമയം, സുരക്ഷാ പരിശോധനകൾ',
    icon: Shield,
    color: 'amber',
    isPublic: true,
  },
  {
    id: 'privacy',
    hash: '#privacy',
    labelEn: 'Privacy & Storage',
    labelMl: 'സ്വകാര്യത & സ്റ്റോറേജ്',
    descriptionEn: 'Client cache audit, search history & offline storage purge',
    descriptionMl: 'ബ്രൗസർ കാഷെ മാനേജ്‌മെന്റും സ്റ്റോറേജ് പരിശോധനയും',
    icon: HardDrive,
    color: 'violet',
    isPublic: true,
  },
  {
    id: 'backup',
    hash: '#backup',
    labelEn: 'Backup & Recovery',
    labelMl: 'ബാക്കപ്പ് & റിക്കവറി',
    descriptionEn: 'Full JSON database export, safe restore & student records',
    descriptionMl: 'ഡാറ്റാബേസ് ബാക്കപ്പും സുരക്ഷിത പുനഃസ്ഥാപനവും',
    icon: Database,
    color: 'rose',
    isPublic: true,
  },
  {
    id: 'canteen-ops',
    hash: '#canteen-ops',
    labelEn: 'Canteen & Kitchen Ops',
    labelMl: 'കാന്റീൻ & കിച്ചൻ കൺട്രോൾ',
    descriptionEn: 'Section chunk size, KDS screen wake-lock & orders chime',
    descriptionMl: 'സെക്ഷൻ വലുപ്പവും അടുക്കള സ്ക്രീൻ ക്രമീകരണങ്ങളും',
    icon: Utensils,
    color: 'emerald',
    allowedRoles: [
      ROLES.COOK,
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
  },
  {
    id: 'about',
    hash: '#about',
    labelEn: 'Help & Diagnostics',
    labelMl: 'സഹായം & സിസ്റ്റം വിവരം',
    descriptionEn: 'Keyboard shortcuts HUD, system ping, version & accreditation',
    descriptionMl: 'കീബോർഡ് ഷോർട്ട്കട്ടുകൾ, സിസ്റ്റം വേർഷൻ, വിവരങ്ങൾ',
    icon: HelpCircle,
    color: 'sky',
    isPublic: true,
  },
];

/**
 * Filter sections based on active user role and authentication state
 */
export function getVisibleSettingsSections(userRole, isStudent = false) {
  return SETTINGS_SECTIONS.filter((section) => {
    if (section.studentOnly && !isStudent) return false;
    if (section.allowedRoles && section.allowedRoles.length > 0) {
      return hasRole(userRole, section.allowedRoles);
    }
    return true;
  });
}

/**
 * Theme Presets Specification
 */
export const THEME_PRESETS = [
  {
    id: 'dark',
    nameEn: 'Emerald Twilight',
    nameMl: 'എമറാൾഡ് നൈറ്റ്',
    descriptionEn: 'Deep obsidian surface with radiant emerald luminescence',
    descriptionMl: 'സുഖകരമായ ഇരുണ്ട തീമും എമറാൾഡ് പച്ച വെളിച്ചവും',
    bgClass: 'bg-[#080d0b]',
    surfaceClass: 'bg-[#0f1815]',
    accentColor: '#10b981',
    badge: 'Signature',
    badgeColor: 'emerald',
  },
  {
    id: 'light',
    nameEn: 'Clean Daylight',
    nameMl: 'ക്ലീൻ ഡേലൈറ്റ്',
    descriptionEn: 'Sunlit porcelain surface with crisp high-contrast legibility',
    descriptionMl: 'പകൽ വെളിച്ചത്തിന് അനുയോജ്യമായ തെളിഞ്ഞ നിറം',
    bgClass: 'bg-[#f8faf8]',
    surfaceClass: 'bg-white',
    accentColor: '#059669',
    badge: 'High Contrast',
    badgeColor: 'teal',
  },
  {
    id: 'obsidian',
    nameEn: 'Midnight OLED',
    nameMl: 'മിഡ്‌നൈറ്റ് ഒലെഡ്',
    descriptionEn: 'True black #000000 pixels for battery saving & pure contrast',
    descriptionMl: 'യഥാർത്ഥ കറുപ്പ്, ബാറ്ററി സംരക്ഷണത്തിന് ഉത്തമം',
    bgClass: 'bg-black',
    surfaceClass: 'bg-[#0a0a0a]',
    accentColor: '#34d399',
    badge: 'OLED Black',
    badgeColor: 'purple',
  },
  {
    id: 'solar',
    nameEn: 'Kitchen Solar',
    nameMl: 'കിച്ചൻ സോളാർ',
    descriptionEn: 'High-visibility amber & emerald contrast for kitchen stations',
    descriptionMl: 'അടുക്കളയിലെ പ്രകാശത്തിൽ വ്യക്തമായി കാണാൻ',
    bgClass: 'bg-[#12130e]',
    surfaceClass: 'bg-[#1c1d15]',
    accentColor: '#f59e0b',
    badge: 'Kitchen Optimized',
    badgeColor: 'amber',
  },
];
