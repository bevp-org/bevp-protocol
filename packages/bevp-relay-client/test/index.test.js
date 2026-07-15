import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createMockRelay, payAndSubmitStamp, RUSH_FEE_USD } from '../src/index.js'

describe('@bevp/relay-client mock', () => {
  it('queues for free and stamps', async () => {
    const relay = createMockRelay()
    const digestHex = 'a'.repeat(64)
    const { intent, payment, job } = await payAndSubmitStamp(relay, {
      digestHex,
      tier: 'queue',
    })
    assert.equal(intent.amountUsd, 0)
    assert.equal(payment.status, 'paid')
    assert.equal(job.status, 'stamped')
    assert.equal(job.digestHex, digestHex)
    const again = await relay.getJob(job.jobId)
    assert.equal(again.jobId, job.jobId)
  })

  it('requires token for rush tier', async () => {
    const relay = createMockRelay()
    const intent = await relay.createPayIntent({
      digestHex: 'b'.repeat(64),
      tier: 'rush',
    })
    assert.equal(intent.amountUsd, RUSH_FEE_USD)
    await assert.rejects(
      () => relay.confirmPayment({ intentId: intent.intentId, paymentToken: '' }),
      /paymentToken/,
    )
    const paid = await relay.confirmPayment({
      intentId: intent.intentId,
      paymentToken: 'tok_rush',
    })
    assert.equal(paid.status, 'paid')
  })
})
