# `@bevp/i18n`

Static Language Pack for BEVP (BUSL-1.1).

- Locales: **`en`** (default) · **`zh`**
- Client-only; never send UGC to cloud translation APIs
- Nested keys: `t('stages.vows.tagline')`
- Interpolation: `t('pwa.vows.relayJob', { id: 'abc', status: 'stamped' })`

```js
import { createI18n, resolveLocale } from '@bevp/i18n'

const i18n = createI18n()
i18n.setLocale('zh')
i18n.t('nav.vows') // → 誓言
```
