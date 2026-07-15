const { createHash } = require('node:crypto');
const { bytesToHex, toUint8Array } = require('./bytes.js');

/**
 * @param {string | ArrayBuffer | Uint8Array} input
 * @returns {Promise<string>}
 */
async function sha256Hex(input) {
  const data = toUint8Array(input);
  if (globalThis.crypto && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return bytesToHex(digest);
  }
  return createHash('sha256').update(Buffer.from(data)).digest('hex');
}

module.exports = { sha256Hex };
