/**
 * @param {ArrayBuffer | Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * @param {string | ArrayBuffer | Uint8Array} input
 * @returns {Uint8Array}
 */
function toUint8Array(input) {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }
  if (input instanceof Uint8Array) {
    return input;
  }
  return new Uint8Array(input);
}

/**
 * @param {string} hex
 * @param {number} [head=6]
 * @param {number} [tail=4]
 * @returns {string}
 */
function shortHash(hex, head = 6, tail = 4) {
  if (typeof hex !== 'string') {
    return '';
  }
  if (hex.length <= head + tail + 1) {
    return hex;
  }
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

module.exports = {
  bytesToHex,
  toUint8Array,
  shortHash,
};
