const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sha256Hex, shortHash, toUint8Array } = require('../src/index.js');

describe('@bevp/crypto', () => {
  it('hashes the empty string to the NIST vector', async () => {
    const hex = await sha256Hex('');
    assert.equal(
      hex,
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('hashes utf-8 "abc" to the NIST vector', async () => {
    const hex = await sha256Hex('abc');
    assert.equal(
      hex,
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hashes Uint8Array the same as string', async () => {
    const fromString = await sha256Hex('bevp');
    const fromBytes = await sha256Hex(toUint8Array('bevp'));
    assert.equal(fromString, fromBytes);
  });

  it('shortens hex digests', () => {
    assert.equal(shortHash('abcdef1234567890', 4, 4), 'abcd…7890');
  });
});
