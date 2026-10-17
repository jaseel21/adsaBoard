import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

export const LanguageContext = createContext({
  langPref: 'system',
  setLangPref: () => {},
  lang: 'en',
  t: (key) => key,
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

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    if (dict[key] !== undefined) return dict[key];
    if (translations.en[key] !== undefined) return translations.en[key];
    return key;
  };

  return (
    <LanguageContext.Provider value={{ langPref, setLangPref, lang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
