import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  stampSandbox,
  stampDigest,
  upgradeOts,
  verifyOts,
  infoOts,
  isSandboxOts,
  hexToBytes,
} from '../src/index.js'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe('@bevp/ots sandbox', () => {
  it('creates and recognizes sandbox proofs', async () => {
    const digest = 'a'.repeat(64)
    const stamped = await stampSandbox(digest)
    assert.equal(stamped.network, 'sandbox')
    assert.equal(stamped.status, 'pending')
    assert.ok(isSandboxOts(stamped.ots))
    assert.match(infoOts(stamped.ots), /sandbox/)

    const verified = await verifyOts(stamped.ots, digest)
    assert.equal(verified.ok, false)
    assert.match(verified.message, /not Bitcoin-anchored/)
  })

  it('detects sandbox digest mismatch', async () => {
    const stamped = await stampSandbox('b'.repeat(64))
    const verified = await verifyOts(stamped.ots, 'c'.repeat(64))
    assert.equal(verified.ok, false)
    assert.match(verified.message, /mismatch/)
  })
})

describe('@bevp/ots fixtures', () => {
  it('reads incomplete.ots as pending verify', async () => {
    const ots = readFileSync(join(fixtures, 'incomplete.txt.ots'))
    const digest = '05c4f616a8e5310d19d938cfd769864d7f4ccdc2ca8b479b10af83564b097af9'
    const result = await verifyOts(ots, digest)
    assert.equal(result.digestHex, digest)
    assert.equal(result.status, 'pending')
    assert.equal(result.ok, false)
  })

  it('checks hello-world digest match before chain verify', async () => {
    const file = readFileSync(join(fixtures, 'hello-world.txt'))
    const ots = readFileSync(join(fixtures, 'hello-world.txt.ots'))
    const wrong = await verifyOts(ots, 'd'.repeat(64))
    assert.equal(wrong.ok, false)
    assert.match(wrong.message, /does not match/)

    // May fail if explorers are down; digest match path must not throw.
    const result = await verifyOts(ots, file)
    assert.equal(result.digestHex.length, 64)
    assert.ok(result.message)
  })
})

describe('@bevp/ots live stamp', () => {
  it('stamps a digest against public calendars when network allows', async (t) => {
    if (process.env.BEVP_OTS_LIVE !== '1') {
      t.skip('set BEVP_OTS_LIVE=1 to run live calendar stamp')
      return
    }
    const digest = hexToBytes(
      '1111111111111111111111111111111111111111111111111111111111111111',
    )
    const stamped = await stampDigest(digest, { network: 'bitcoin' })
    assert.equal(stamped.digestHex, '1'.repeat(64))
    assert.ok(stamped.ots.byteLength > 32)
    assert.equal(stamped.status, 'pending')

    const upgraded = await upgradeOts(stamped.ots)
    assert.equal(upgraded.digestHex, stamped.digestHex)
    assert.ok(upgraded.ots.byteLength > 0)
  })
})
