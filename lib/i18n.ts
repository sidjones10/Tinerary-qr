import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '@/public/locales/en/common.json'
import es from '@/public/locales/es/common.json'
import fr from '@/public/locales/fr/common.json'
import de from '@/public/locales/de/common.json'
import ja from '@/public/locales/ja/common.json'
import zh from '@/public/locales/zh/common.json'

// Map language preference values (from DB) to i18n locale codes
export const LANGUAGE_TO_LOCALE: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  japanese: 'ja',
  chinese: 'zh',
}

// Map i18n locale codes to BCP 47 locale tags for Intl APIs
export const LOCALE_TO_BCP47: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  zh: 'zh-CN',
}

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'zh'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      es: { common: es },
      fr: { common: fr },
      de: { common: de },
      ja: { common: ja },
      zh: { common: zh },
    },
    defaultNS: 'common',
    ns: ['common'],
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })

export default i18n
