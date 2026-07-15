import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createI18n, resolveLocale, DEFAULT_LOCALE } from '../src/index.js'

describe('@bevp/i18n', () => {
  it('resolves zh browser tags', () => {
    assert.equal(resolveLocale('zh-CN'), 'zh')
    assert.equal(resolveLocale('zh-Hans-CN'), 'zh')
    assert.equal(resolveLocale('en-US'), 'en')
    assert.equal(resolveLocale('fr'), DEFAULT_LOCALE)
  })

  it('translates nested keys with zh/en', () => {
    const i18n = createI18n({ locale: 'en', storage: null })
    assert.equal(i18n.t('nav.vows'), 'Vows')
    i18n.setLocale('zh')
    assert.equal(i18n.t('nav.vows'), '誓言')
    assert.equal(i18n.htmlLang(), 'zh-CN')
  })

  it('interpolates params and falls back to en', () => {
    const i18n = createI18n({ locale: 'zh', storage: null })
    assert.equal(
      i18n.t('pwa.vows.photoBytes', { params: { n: 12 } }),
      '照片 · 12 B',
    )
    assert.equal(i18n.t('missing.key.xyz'), 'missing.key.xyz')
  })

  it('persists locale when storage provided', () => {
    /** @type {Record<string, string>} */
    const map = {}
    const storage = {
      getItem: (k) => map[k] ?? null,
      setItem: (k, v) => {
        map[k] = v
      },
    }
    const i18n = createI18n({ storage, navigatorLanguage: 'en-US' })
    i18n.setLocale('zh')
    assert.equal(map.bevp_locale, 'zh')
    const again = createI18n({ storage })
    assert.equal(again.getLocale(), 'zh')
  })
})
