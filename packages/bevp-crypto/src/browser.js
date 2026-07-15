const { bytesToHex, toUint8Array, shortHash } = require('./bytes.js');
const { sha256Hex } = require('./sha256-web.js');
const shamir = require('./shamir.js');
const passkey = require('./passkey.js');

module.exports = {
  bytesToHex,
  toUint8Array,
  sha256Hex,
  shortHash,
  ...shamir,
  ...passkey,
};
