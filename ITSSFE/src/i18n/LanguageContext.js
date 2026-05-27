import * as React from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createTranslator, getLocaleFromSession, setLocaleToSession } from './index.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const [t, setT] = useState(() => createTranslator('en'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = getLocaleFromSession();
    setLocaleState(saved);
    setT(() => createTranslator(saved));
    setReady(true);
  }, []);

  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale);
    setT(() => createTranslator(newLocale));
    setLocaleToSession(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

export { createTranslator };
