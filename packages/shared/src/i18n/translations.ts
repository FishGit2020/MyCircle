// Re-export types and English (synchronous fallback) from split locale files.
// Spanish and Chinese are lazy-loaded via I18nContext when the locale changes.
export type { TranslationKey } from './locales/en';
export type Locale = 'en' | 'es' | 'zh';

import en from './locales/en';
export { en };

// Lazy loaders for non-English locales (used by I18nContext)
export const localeLoaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  es: () => import('./locales/es'),
  zh: () => import('./locales/zh'),
};
