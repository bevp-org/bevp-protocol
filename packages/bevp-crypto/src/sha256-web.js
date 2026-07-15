const { bytesToHex, toUint8Array } = require('./bytes.js');

/**
 * @param {string | ArrayBuffer | Uint8Array} input
 * @returns {Promise<string>}
 */
async function sha256Hex(input) {
  const data = toUint8Array(input);
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('@bevp/crypto: Web Crypto SHA-256 unavailable');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(digest);
}

module.exports = { sha256Hex };
