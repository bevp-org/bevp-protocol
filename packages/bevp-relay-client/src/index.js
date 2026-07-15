/** @typedef {'queue' | 'rush'} PayTier */
/** @typedef {'pending_payment' | 'paid' | 'submitted' | 'stamped' | 'failed'} JobStatus */

export const RUSH_FEE_USD = 4
export const QUEUE_FEE_USD = 0

/**
 * @param {string} baseUrl
 * @param {{ fetchImpl?: typeof fetch }} [opts]
 */
export function createHttpRelay(baseUrl, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch
  if (!fetchImpl) throw new Error('@bevp/relay-client: fetch unavailable')
  const root = baseUrl.replace(/\/$/, '')

  async function json(path, init) {
    const res = await fetchImpl(`${root}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body.error || `@bevp/relay-client: HTTP ${res.status}`)
    }
    return body
  }

  return {
    kind: 'http',
    baseUrl: root,
    createPayIntent: (input) =>
      json('/v1/pay/intent', { method: 'POST', body: JSON.stringify(input) }),
    confirmPayment: (input) =>
      json('/v1/pay/confirm', { method: 'POST', body: JSON.stringify(input) }),
    submitStamp: (input) =>
      json('/v1/stamp', { method: 'POST', body: JSON.stringify(input) }),
    getJob: (jobId) => json(`/v1/jobs/${encodeURIComponent(jobId)}`, { method: 'GET' }),
  }
}

/**
 * In-memory mock relay for PWA / tests (no network).
 * Simulates Stripe-like intent → confirm → stamp job lifecycle.
 */
export function createMockRelay(options = {}) {
  const rushFee = options.rushFeeUsd ?? RUSH_FEE_USD
  const queueFee = options.queueFeeUsd ?? QUEUE_FEE_USD
  /** @type {Map<string, any>} */
  const intents = new Map()
  /** @type {Map<string, any>} */
  const jobs = new Map()

  function id(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
  }

  return {
    kind: 'mock',
    async createPayIntent(input) {
      const tier = input.tier === 'rush' ? 'rush' : 'queue'
      const amountUsd = tier === 'rush' ? rushFee : queueFee
      const intentId = id('pi')
      const intent = {
        intentId,
        tier,
        amountUsd,
        currency: 'usd',
        digestHex: input.digestHex,
        status: 'requires_payment',
        clientSecret: `mock_secret_${intentId}`,
        createdAt: new Date().toISOString(),
      }
      intents.set(intentId, intent)
      return { ...intent }
    },

    async confirmPayment(input) {
      const intent = intents.get(input.intentId)
      if (!intent) throw new Error('@bevp/relay-client: unknown intent')
      if (input.mockFail) {
        intent.status = 'failed'
        return { intentId: intent.intentId, status: 'failed' }
      }
      // Mock pay: queue is free; rush accepts any non-empty token
      if (intent.tier === 'rush' && !input.paymentToken && intent.amountUsd > 0) {
        throw new Error('@bevp/relay-client: paymentToken required for rush')
      }
      intent.status = 'paid'
      intent.paidAt = new Date().toISOString()
      return { intentId: intent.intentId, status: 'paid', paidAt: intent.paidAt }
    },

    async submitStamp(input) {
      const intent = intents.get(input.intentId)
      if (!intent) throw new Error('@bevp/relay-client: unknown intent')
      if (intent.status !== 'paid' && intent.amountUsd > 0) {
        throw new Error('@bevp/relay-client: intent not paid')
      }
      if (intent.amountUsd === 0) intent.status = 'paid'
      if (intent.digestHex !== input.digestHex) {
        throw new Error('@bevp/relay-client: digest mismatch')
      }
      const jobId = id('job')
      const job = {
        jobId,
        intentId: intent.intentId,
        digestHex: input.digestHex,
        tier: intent.tier,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        // Mock stamp artifact — real relay would call calendars / OTS flush
        otsHint: `pending:${input.digestHex.slice(0, 16)}`,
      }
      // Simulate async calendar accept
      job.status = 'stamped'
      job.stampedAt = new Date().toISOString()
      jobs.set(jobId, job)
      intent.jobId = jobId
      return { ...job }
    },

    async getJob(jobId) {
      const job = jobs.get(jobId)
      if (!job) throw new Error('@bevp/relay-client: unknown job')
      return { ...job }
    },
  }
}

/**
 * High-level helper: pay (mock/remote) then submit stamp job.
 * @param {ReturnType<typeof createMockRelay> | ReturnType<typeof createHttpRelay>} relay
 * @param {{
 *   digestHex: string,
 *   tier?: PayTier,
 *   paymentToken?: string,
 * }} input
 */
export async function payAndSubmitStamp(relay, input) {
  const tier = input.tier || 'queue'
  const intent = await relay.createPayIntent({
    digestHex: input.digestHex,
    tier,
  })
  const payment = await relay.confirmPayment({
    intentId: intent.intentId,
    paymentToken: input.paymentToken || (tier === 'rush' ? 'mock_rush_ok' : ''),
  })
  const job = await relay.submitStamp({
    intentId: intent.intentId,
    digestHex: input.digestHex,
  })
  return { intent, payment, job }
}
