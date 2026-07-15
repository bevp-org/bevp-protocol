import en from '../locales/en.json' with { type: 'json' }
import zh from '../locales/zh.json' with { type: 'json' }

/** @typedef {'en' | 'zh'} Locale */

export const DEFAULT_LOCALE = /** @type {Locale} */ ('en')
export const SUPPORTED_LOCALES = /** @type {const} */ (['en', 'zh'])
export const STORAGE_KEY = 'bevp_locale'

const catalogs = { en, zh }

/**
 * @param {string | undefined | null} raw
 * @returns {Locale}
 */
export function resolveLocale(raw) {
  if (!raw) return DEFAULT_LOCALE
  const lower = String(raw).toLowerCase().replace('_', '-')
  if (lower === 'zh' || lower.startsWith('zh-')) return 'zh'
  if (lower === 'en' || lower.startsWith('en-')) return 'en'
  return DEFAULT_LOCALE
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} path
 */
function lookup(obj, path) {
  const parts = path.split('.')
  let cur = /** @type {unknown} */ (obj)
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = /** @type {Record<string, unknown>} */ (cur)[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

/**
 * @param {string} template
 * @param {Record<string, string | number> | undefined} params
 */
function interpolate(template, params) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] === undefined || params[key] === null ? `{${key}}` : String(params[key]),
  )
}

/**
 * @param {object} [opts]
 * @param {Locale} [opts.locale]
 * @param {Storage | null} [opts.storage]
 * @param {string} [opts.navigatorLanguage]
 */
export function createI18n(opts = {}) {
  const storage = opts.storage === undefined
    ? typeof localStorage !== 'undefined'
      ? localStorage
      : null
    : opts.storage

  const stored = storage?.getItem(STORAGE_KEY)
  let locale =
    opts.locale ||
    (stored ? resolveLocale(stored) : undefined) ||
    resolveLocale(opts.navigatorLanguage) ||
    DEFAULT_LOCALE

  if (!SUPPORTED_LOCALES.includes(locale)) locale = DEFAULT_LOCALE

  return {
    /** @returns {Locale} */
    getLocale() {
      return locale
    },

    /** @returns {readonly Locale[]} */
    getSupportedLocales() {
      return SUPPORTED_LOCALES
    },

    /**
     * @param {Locale | string} next
     * @returns {Locale}
     */
    setLocale(next) {
      locale = resolveLocale(next)
      try {
        storage?.setItem(STORAGE_KEY, locale)
      } catch {
        // private mode / denied
      }
      return locale
    },

    /**
     * @param {string} key
     * @param {{
     *   locale?: Locale
     *   params?: Record<string, string | number>
     * }} [options]
     */
    t(key, options = {}) {
      const loc = options.locale || locale
      const primary = catalogs[loc] || catalogs[DEFAULT_LOCALE]
      const fallback = catalogs[DEFAULT_LOCALE]
      const value = lookup(primary, key) ?? lookup(fallback, key) ?? key
      return interpolate(value, options.params)
    },

    /** HTML lang attribute value */
    htmlLang() {
      return locale === 'zh' ? 'zh-CN' : 'en'
    },
  }
}

export { en, zh }
