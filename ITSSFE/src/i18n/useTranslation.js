import { useLanguage } from './LanguageContext.js';

/**
 * Convenience hook: returns t(key, fallback?) function.
 * Falls back gracefully if key not found.
 */
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
