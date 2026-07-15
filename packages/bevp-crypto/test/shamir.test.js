const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { split2of3, combineShares, splitSecret } = require('../src/shamir.js');

describe('@bevp/crypto shamir', () => {
  it('round-trips 2-of-3', () => {
    const secret = new TextEncoder().encode('heritage-master-key-32bytes!!');
    const shares = split2of3(secret);
    assert.equal(shares.length, 3);
    const rebuilt = combineShares([shares[0], shares[2]]);
    assert.deepEqual(rebuilt, secret);
    const rebuilt2 = combineShares([shares[1], shares[2]]);
    assert.deepEqual(rebuilt2, secret);
  });

  it('fails with a single share length but wrong threshold content', () => {
    const secret = new Uint8Array([1, 2, 3, 4, 5]);
    const shares = splitSecret(secret, 3, 2);
    const wrong = combineShares([shares[0], { index: 9, data: shares[1].data }]);
    assert.notDeepEqual(wrong, secret);
  });
});
