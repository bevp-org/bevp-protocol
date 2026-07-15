export type Locale = 'en' | 'zh'

export const DEFAULT_LOCALE: Locale
export const SUPPORTED_LOCALES: readonly Locale[]
export const STORAGE_KEY: 'bevp_locale'

export const en: Record<string, unknown>
export const zh: Record<string, unknown>

export function resolveLocale(raw: string | undefined | null): Locale

export type I18n = {
  getLocale(): Locale
  getSupportedLocales(): readonly Locale[]
  setLocale(next: Locale | string): Locale
  t(key: string, options?: { locale?: Locale; params?: Record<string, string | number> }): string
  htmlLang(): string
}

export function createI18n(opts?: {
  locale?: Locale
  storage?: Storage | null
  navigatorLanguage?: string
}): I18n
