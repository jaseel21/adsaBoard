import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

export const LanguageContext = createContext({
  langPref: 'system',
  setLangPref: () => {},
  lang: 'en',
  language: 'en',
  t: (key, fallback) => (fallback !== undefined ? fallback : key),
});

export const LanguageProvider = ({ children }) => {
  const [langPref, setLangPrefState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adsatboard-lang') || 'system';
    }
    return 'system';
  });

  const resolveEffectiveLang = (pref) => {
    if (pref === 'en' || pref === 'ml') return pref;
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.userLanguage || '';
      if (browserLang.toLowerCase().startsWith('ml')) return 'ml';
    }
    return 'en';
  };

  const [lang, setLang] = useState(() => resolveEffectiveLang(langPref));

  const setLangPref = (newPref) => {
    setLangPrefState(newPref);
    try {
      localStorage.setItem('adsatboard-lang', newPref);
    } catch (_) {}
    const resolved = resolveEffectiveLang(newPref);
    setLang(resolved);
    document.documentElement.setAttribute('lang', resolved);
  };

  useEffect(() => {
    const resolved = resolveEffectiveLang(langPref);
    setLang(resolved);
    document.documentElement.setAttribute('lang', resolved);
  }, [langPref]);

  const t = (key, fallback) => {
    if (!key) return '';
    const dict = translations[lang] || translations.en;
    
    // Direct key lookup
    if (dict && dict[key] !== undefined) return dict[key];
    if (translations.en && translations.en[key] !== undefined) return translations.en[key];

    // Dot-notation lookup (e.g. 'days.su' or 'months.0')
    if (typeof key === 'string' && key.includes('.')) {
      const parts = key.split('.');
      let val = dict;
      for (const p of parts) {
        val = val?.[p];
      }
      if (val !== undefined) return val;

      let enVal = translations.en;
      for (const p of parts) {
        enVal = enVal?.[p];
      }
      if (enVal !== undefined) return enVal;
    }

    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ langPref, setLangPref, lang, language: lang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

