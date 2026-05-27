import vi from './locales/vi.json';
import en from './locales/en.json';

const resources = { vi, en };

export const supportedLocales = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

export function createTranslator(locale) {
  const dict = resources[locale] || resources['en'];
  return function t(key, fallback) {
    const value = getNestedValue(dict, key);
    if (value !== null) return value;
    const fallbackValue = getNestedValue(resources['en'], key);
    return fallbackValue !== null ? fallbackValue : (fallback || key);
  };
}

export function getLocaleFromSession() {
  if (typeof window === 'undefined') return 'en';
  try {
    return sessionStorage.getItem('app_locale') || 'en';
  } catch {
    return 'en';
  }
}

export function setLocaleToSession(locale) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('app_locale', locale);
  } catch {
    // sessionStorage unavailable, ignore
  }
}

export { resources };
