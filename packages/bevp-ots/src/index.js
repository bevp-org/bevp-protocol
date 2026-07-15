import {
  submit,
  upgrade,
  verify,
  read,
  write,
  info,
  canVerify,
  canUpgrade,
  verifiers as defaultVerifiers,
} from '@vitrified/typescript-opentimestamps'
import { sha256Hex } from '@bevp/crypto'

/** @typedef {'bitcoin' | 'signet' | 'sandbox'} OtsNetwork */

export const SANDBOX_MAGIC = 'bevp-ots-sandbox-v1'

/** Default public Bitcoin calendars (mainnet attestation path). */
export const BITCOIN_CALENDARS = [
  'https://alice.btc.calendar.opentimestamps.org',
  'https://bob.btc.calendar.opentimestamps.org',
  'https://finney.calendar.eternitywall.com',
  'https://btc.calendar.catallaxy.com',
]

/**
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  const normalized = hex.trim().toLowerCase().replace(/^0x/, '')
  if (!/^[0-9a-f]*$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error('@bevp/ots: invalid hex')
  }
  const out = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

/**
 * @param {Uint8Array | ArrayBuffer} bytes
 * @returns {string}
 */
export function bytesToHex(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return [...view].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * @param {string | Uint8Array} digest
 * @returns {{ algorithm: 'sha256', value: Uint8Array, hex: string }}
 */
function normalizeDigest(digest) {
  const value = typeof digest === 'string' ? hexToBytes(digest) : new Uint8Array(digest)
  if (value.length !== 32) {
    throw new Error('@bevp/ots: digest must be 32 bytes (sha256)')
  }
  return { algorithm: 'sha256', value, hex: bytesToHex(value) }
}

/**
 * @param {import('@vitrified/typescript-opentimestamps').Timestamp} timestamp
 * @returns {'pending' | 'upgraded'}
 */
function statusOf(timestamp) {
  return canVerify(timestamp) ? 'upgraded' : 'pending'
}

/**
 * Create an offline sandbox pending proof (not independently verifiable).
 * @param {string | Uint8Array} digest
 * @returns {Promise<import('./index.d.ts').StampResult>}
 */
export async function stampSandbox(digest) {
  const { hex } = normalizeDigest(digest)
  const stampedAt = new Date().toISOString()
  const payload = {
    magic: SANDBOX_MAGIC,
    digestHex: hex,
    stampedAt,
    note: 'Sandbox pending proof — not an OpenTimestamps attestation.',
  }
  const ots = new TextEncoder().encode(`${JSON.stringify(payload)}\n`)
  return {
    digestHex: hex,
    ots,
    status: 'pending',
    network: 'sandbox',
    info: `sandbox pending for ${hex}`,
    calendarErrors: [],
    attestations: {},
  }
}

/**
 * Submit a digest to OTS calendars and return a serialized `.ots` proof.
 * @param {string | Uint8Array} digest
 * @param {{
 *   network?: OtsNetwork,
 *   calendars?: string[],
 * }} [options]
 * @returns {Promise<import('./index.d.ts').StampResult>}
 */
export async function stampDigest(digest, options = {}) {
  const network = options.network || 'bitcoin'
  if (network === 'sandbox') {
    return stampSandbox(digest)
  }

  const { value, hex } = normalizeDigest(digest)
  let calendars = options.calendars
  if (network === 'signet' && (!calendars || calendars.length === 0)) {
    throw new Error(
      '@bevp/ots: network=signet requires options.calendars (no public Signet calendar by default)',
    )
  }
  calendars = calendars && calendars.length > 0 ? calendars : BITCOIN_CALENDARS

  const { timestamp, errors } = await submit('sha256', value, undefined, calendars)
  const calendarErrors = (errors || []).map((e) => String(e?.message || e))
  if (!timestamp?.fileHash) {
    throw new Error(`@bevp/ots: stamp failed — ${calendarErrors.join('; ') || 'no timestamp'}`)
  }

  let ots
  try {
    ots = write(timestamp)
  } catch (err) {
    throw new Error(
      `@bevp/ots: could not serialize stamp — ${calendarErrors.join('; ') || err.message}`,
    )
  }
  if (!ots?.byteLength) {
    throw new Error(`@bevp/ots: empty stamp — ${calendarErrors.join('; ') || 'unknown'}`)
  }

  return {
    digestHex: hex,
    ots,
    status: statusOf(timestamp),
    network: network === 'signet' ? 'signet' : 'bitcoin',
    info: info(timestamp),
    calendarErrors,
    attestations: {},
  }
}

/**
 * Ask calendars to upgrade a pending `.ots` (or sandbox JSON) proof.
 * @param {Uint8Array | ArrayBuffer} otsBytes
 * @returns {Promise<import('./index.d.ts').UpgradeResult>}
 */
export async function upgradeOts(otsBytes) {
  const bytes = otsBytes instanceof Uint8Array ? otsBytes : new Uint8Array(otsBytes)
  if (isSandboxOts(bytes)) {
    const pending = parseSandbox(bytes)
    return {
      digestHex: pending.digestHex,
      ots: bytes,
      status: 'pending',
      changed: false,
      network: 'sandbox',
      info: pending.note,
      attestations: {},
    }
  }

  const timestamp = read(bytes)
  const before = write(timestamp)
  const { timestamp: upgraded, errors } = await upgrade(timestamp)
  const after = write(upgraded)
  const changed = before.length !== after.length || before.some((b, i) => b !== after[i])
  return {
    digestHex: bytesToHex(upgraded.fileHash.value),
    ots: after,
    status: statusOf(upgraded),
    changed,
    network: 'bitcoin',
    info: info(upgraded),
    calendarErrors: (errors || []).map((e) => String(e?.message || e)),
    attestations: {},
  }
}

/**
 * Verify an `.ots` proof against a digest (or original bytes hashed as sha256).
 * @param {Uint8Array | ArrayBuffer} otsBytes
 * @param {string | Uint8Array | ArrayBuffer} digestOrPayload
 * @param {{ verifiers?: typeof defaultVerifiers }} [options]
 * @returns {Promise<import('./index.d.ts').VerifyResult>}
 */
export async function verifyOts(otsBytes, digestOrPayload, options = {}) {
  const bytes = otsBytes instanceof Uint8Array ? otsBytes : new Uint8Array(otsBytes)

  if (isSandboxOts(bytes)) {
    const pending = parseSandbox(bytes)
    let digestHex
    if (typeof digestOrPayload === 'string' && /^[0-9a-fA-Fx]+$/.test(digestOrPayload.trim()) && digestOrPayload.replace(/^0x/, '').length === 64) {
      digestHex = digestOrPayload.trim().toLowerCase().replace(/^0x/, '')
    } else {
      digestHex = await sha256Hex(digestOrPayload)
    }
    const match = digestHex === pending.digestHex
    return {
      ok: false,
      digestHex: pending.digestHex,
      status: 'pending',
      network: 'sandbox',
      message: match
        ? 'Sandbox proof matches digest but is not Bitcoin-anchored.'
        : 'Sandbox proof digest mismatch.',
      attestations: {},
      errors: match ? {} : { sandbox: ['digest mismatch'] },
    }
  }

  const timestamp = read(bytes)
  const proofDigest = bytesToHex(timestamp.fileHash.value)

  let expectedHex
  if (
    typeof digestOrPayload === 'string' &&
    /^[0-9a-fA-Fx]+$/.test(digestOrPayload.trim()) &&
    digestOrPayload.replace(/^0x/i, '').length === 64
  ) {
    expectedHex = digestOrPayload.trim().toLowerCase().replace(/^0x/, '')
  } else if (digestOrPayload instanceof Uint8Array && digestOrPayload.length === 32) {
    expectedHex = bytesToHex(digestOrPayload)
  } else {
    expectedHex = await sha256Hex(digestOrPayload)
  }

  if (expectedHex !== proofDigest) {
    return {
      ok: false,
      digestHex: proofDigest,
      status: statusOf(timestamp),
      network: 'bitcoin',
      message: 'Digest does not match .ots file hash.',
      attestations: {},
      errors: { digest: ['mismatch'] },
    }
  }

  if (!canVerify(timestamp)) {
    return {
      ok: false,
      digestHex: proofDigest,
      status: 'pending',
      network: 'bitcoin',
      message: 'Proof is still pending calendar / blockchain upgrade.',
      attestations: {},
      errors: {},
      info: info(timestamp),
      canUpgrade: canUpgrade(timestamp),
    }
  }

  const { attestations, errors } = await verify(timestamp, options.verifiers || defaultVerifiers)
  const ok = Object.keys(attestations || {}).length > 0
  return {
    ok,
    digestHex: proofDigest,
    status: ok ? 'upgraded' : 'pending',
    network: 'bitcoin',
    message: ok ? 'OpenTimestamps verification succeeded.' : 'Verification did not yield attestations.',
    attestations: attestations || {},
    errors: errors || {},
    info: info(timestamp),
  }
}

/**
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function isSandboxOts(bytes) {
  try {
    const text = new TextDecoder().decode(bytes)
    return text.includes(SANDBOX_MAGIC)
  } catch {
    return false
  }
}

/**
 * @param {Uint8Array} bytes
 */
function parseSandbox(bytes) {
  const text = new TextDecoder().decode(bytes)
  const data = JSON.parse(text)
  if (data.magic !== SANDBOX_MAGIC || !data.digestHex) {
    throw new Error('@bevp/ots: invalid sandbox proof')
  }
  return data
}

/**
 * Human-readable info for an `.ots` or sandbox proof.
 * @param {Uint8Array | ArrayBuffer} otsBytes
 * @returns {string}
 */
export function infoOts(otsBytes) {
  const bytes = otsBytes instanceof Uint8Array ? otsBytes : new Uint8Array(otsBytes)
  if (isSandboxOts(bytes)) {
    const pending = parseSandbox(bytes)
    return `sandbox\ndigest ${pending.digestHex}\nstamped ${pending.stampedAt}`
  }
  return info(read(bytes))
}

export { canUpgrade, canVerify, read as readOts, write as writeOts }
