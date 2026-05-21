import type { Lang } from '@/lib/types'
import it from './locales/it.json'
import en from './locales/en.json'
import si from './locales/si.json'

export const translations: Record<Lang, Record<string, string>> = { it, en, si }

export function getTranslations(lang: Lang): Record<string, string> {
  return translations[lang]
}