/**
 * WebAuthn / Passkey helpers for unlocking local vault material.
 * Does not persist private keys — only credential ids and optional derived unlock keys.
 */

/**
 * @returns {boolean}
 */
function isWebAuthnAvailable() {
  return typeof globalThis.PublicKeyCredential !== 'undefined' && !!globalThis.navigator?.credentials
}

/**
 * @param {{
 *   rpId?: string,
 *   rpName?: string,
 *   userId: Uint8Array | string,
 *   userName: string,
 *   userDisplayName?: string,
 *   challenge?: Uint8Array,
 * }} input
 */
async function createPasskey(input) {
  if (!isWebAuthnAvailable()) {
    throw new Error('@bevp/crypto passkey: WebAuthn unavailable')
  }
  const challenge =
    input.challenge || globalThis.crypto.getRandomValues(new Uint8Array(32))
  const userId =
    typeof input.userId === 'string' ? new TextEncoder().encode(input.userId) : input.userId

  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        id: input.rpId || globalThis.location?.hostname || 'localhost',
        name: input.rpName || 'BEVP',
      },
      user: {
        id: userId,
        name: input.userName,
        displayName: input.userDisplayName || input.userName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      timeout: 60_000,
    },
  })

  if (!cred) throw new Error('@bevp/crypto passkey: create cancelled')
  const pk = /** @type {PublicKeyCredential} */ (cred)
  return {
    credentialId: bufferToBase64Url(pk.rawId),
    rawId: new Uint8Array(pk.rawId),
    transports: pk.response.getTransports?.() || [],
  }
}

/**
 * @param {{
 *   credentialId: string,
 *   challenge?: Uint8Array,
 *   rpId?: string,
 * }} input
 */
async function assertPasskey(input) {
  if (!isWebAuthnAvailable()) {
    throw new Error('@bevp/crypto passkey: WebAuthn unavailable')
  }
  const challenge =
    input.challenge || globalThis.crypto.getRandomValues(new Uint8Array(32))
  const allow = base64UrlToBuffer(input.credentialId)

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: input.rpId || globalThis.location?.hostname || 'localhost',
      allowCredentials: [{ type: 'public-key', id: allow }],
      userVerification: 'required',
      timeout: 60_000,
    },
  })
  if (!assertion) throw new Error('@bevp/crypto passkey: assertion cancelled')
  const pk = /** @type {PublicKeyCredential} */ (assertion)
  const response = /** @type {AuthenticatorAssertionResponse} */ (pk.response)
  return {
    credentialId: bufferToBase64Url(pk.rawId),
    authenticatorData: new Uint8Array(response.authenticatorData),
    clientDataJSON: new Uint8Array(response.clientDataJSON),
    signature: new Uint8Array(response.signature),
  }
}

/**
 * Derive a 32-byte unlock key from assertion material (app-level stretch).
 * Prefer WebAuthn PRF when available in future; this is a portable fallback.
 * @param {Uint8Array} authenticatorData
 * @param {Uint8Array} clientDataJSON
 */
async function deriveUnlockKey(authenticatorData, clientDataJSON) {
  const domain = new TextEncoder().encode('bevp:passkey:unlock:v1')
  const material = new Uint8Array(
    authenticatorData.length + clientDataJSON.length + domain.length,
  )
  material.set(authenticatorData, 0)
  material.set(clientDataJSON, authenticatorData.length)
  material.set(domain, authenticatorData.length + clientDataJSON.length)
  if (!globalThis.crypto?.subtle) {
    throw new Error('@bevp/crypto passkey: Web Crypto unavailable for key derivation')
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', material)
  return new Uint8Array(digest)
}

function bufferToBase64Url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i])
  const b64 =
    typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBuffer(value) {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const str =
    typeof atob === 'function'
      ? atob(b64 + pad)
      : Buffer.from(b64 + pad, 'base64').toString('binary')
  const out = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i += 1) out[i] = str.charCodeAt(i)
  return out
}

module.exports = {
  isWebAuthnAvailable,
  createPasskey,
  assertPasskey,
  deriveUnlockKey,
  bufferToBase64Url,
  base64UrlToBuffer,
}
