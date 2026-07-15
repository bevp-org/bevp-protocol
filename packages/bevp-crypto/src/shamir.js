/**
 * Shamir secret sharing over GF(256) — 2-of-3 style splits for heritage shards.
 * Pure JS, no dependencies. Not constant-time; for client-side secret packaging.
 */

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)

;(function initGf() {
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x = x << 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
})()

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function gfDiv(a, b) {
  if (b === 0) throw new Error('@bevp/crypto shamir: division by zero')
  if (a === 0) return 0
  return GF_EXP[(GF_LOG[a] + 255 - GF_LOG[b]) % 255]
}

function gfPow(a, e) {
  if (e === 0) return 1
  if (a === 0) return 0
  return GF_EXP[(GF_LOG[a] * e) % 255]
}

/**
 * Evaluate polynomial coeffs at x (coeffs[0] = secret byte).
 * @param {number[]} coeffs
 * @param {number} x
 */
function evalPoly(coeffs, x) {
  let y = 0
  for (let i = coeffs.length - 1; i >= 0; i -= 1) {
    y = gfMul(y, x) ^ coeffs[i]
  }
  return y
}

/**
 * @param {Uint8Array} secret
 * @param {number} shares
 * @param {number} threshold
 * @param {{ randomBytes?: (n: number) => Uint8Array }} [opts]
 * @returns {{ index: number, data: Uint8Array }[]}
 */
function splitSecret(secret, shares = 3, threshold = 2, opts = {}) {
  if (threshold < 2 || shares < threshold || shares > 255) {
    throw new Error('@bevp/crypto shamir: invalid shares/threshold')
  }
  const randomBytes =
    opts.randomBytes ||
    ((n) => {
      const out = new Uint8Array(n)
      if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(out)
        return out
      }
      throw new Error('@bevp/crypto shamir: no CSPRNG available')
    })

  /** @type {{ index: number, data: Uint8Array }[]} */
  const out = []
  for (let i = 1; i <= shares; i += 1) {
    out.push({ index: i, data: new Uint8Array(secret.length) })
  }

  for (let bi = 0; bi < secret.length; bi += 1) {
    const coeffs = new Array(threshold)
    coeffs[0] = secret[bi]
    const rnd = randomBytes(threshold - 1)
    for (let c = 1; c < threshold; c += 1) coeffs[c] = rnd[c - 1]
    for (let s = 0; s < shares; s += 1) {
      out[s].data[bi] = evalPoly(coeffs, s + 1)
    }
  }
  return out
}

/**
 * Lagrange interpolation at x=0 for one byte across shares.
 * @param {{ index: number, byte: number }[]} points
 */
function interpolate(points) {
  let secret = 0
  for (let i = 0; i < points.length; i += 1) {
    let num = 1
    let den = 1
    for (let j = 0; j < points.length; j += 1) {
      if (i === j) continue
      num = gfMul(num, points[j].index)
      den = gfMul(den, points[i].index ^ points[j].index)
    }
    const lagrange = gfDiv(num, den)
    secret ^= gfMul(points[i].byte, lagrange)
  }
  return secret
}

/**
 * @param {{ index: number, data: Uint8Array }[]} shares
 * @returns {Uint8Array}
 */
function combineShares(shares) {
  if (!shares.length) throw new Error('@bevp/crypto shamir: no shares')
  const len = shares[0].data.length
  if (shares.some((s) => s.data.length !== len)) {
    throw new Error('@bevp/crypto shamir: share length mismatch')
  }
  const secret = new Uint8Array(len)
  for (let bi = 0; bi < len; bi += 1) {
    const points = shares.map((s) => ({ index: s.index, byte: s.data[bi] }))
    secret[bi] = interpolate(points)
  }
  return secret
}

/**
 * Convenience: split into 3 shares requiring any 2.
 * @param {Uint8Array | string} secret
 */
function split2of3(secret, opts) {
  const bytes =
    typeof secret === 'string' ? new TextEncoder().encode(secret) : new Uint8Array(secret)
  return splitSecret(bytes, 3, 2, opts)
}

module.exports = {
  splitSecret,
  combineShares,
  split2of3,
  gfMul,
  gfDiv,
  gfPow,
}
