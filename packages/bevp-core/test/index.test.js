const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sha256Hex } = require('@bevp/crypto');
const { VOW_DOMAIN, buildVowCanonical, commitVow } = require('../src/index.js');

describe('@bevp/core commitVow', () => {
  it('exports vow domain constant', () => {
    assert.equal(VOW_DOMAIN, 'bevp:vow:v1');
  });

  it('is deterministic for fixed createdAt and digests', async () => {
    const a = await commitVow({
      partnerA: 'Alice',
      partnerB: 'Bob',
      vowText: 'We promise.',
      createdAt: '2026-07-15T00:00:00.000Z',
    });
    const b = await commitVow({
      partnerA: ' Alice ',
      partnerB: 'Bob',
      vowText: 'We promise.',
      createdAt: '2026-07-15T00:00:00.000Z',
    });
    assert.equal(a.evidenceRoot, b.evidenceRoot);
    assert.equal(a.photoDigest, '');
    assert.equal(a.audioDigest, '');
  });

  it('changes evidenceRoot when media digests change', async () => {
    const photo = new Uint8Array([1, 2, 3, 4]);
    const audio = new Uint8Array([9, 8, 7]);
    const without = await commitVow({
      partnerA: 'Alice',
      partnerB: 'Bob',
      vowText: 'We promise.',
      createdAt: '2026-07-15T00:00:00.000Z',
    });
    const withMedia = await commitVow({
      partnerA: 'Alice',
      partnerB: 'Bob',
      vowText: 'We promise.',
      createdAt: '2026-07-15T00:00:00.000Z',
      photo,
      audio,
    });
    assert.notEqual(without.evidenceRoot, withMedia.evidenceRoot);
    assert.equal(withMedia.photoDigest, await sha256Hex(photo));
    assert.equal(withMedia.audioDigest, await sha256Hex(audio));
  });

  it('matches manual sha256 of canonical string', async () => {
    const createdAt = '2026-01-01T12:00:00.000Z';
    const photoDigest = await sha256Hex(new Uint8Array([42]));
    const canonical = buildVowCanonical({
      partnerA: 'A',
      partnerB: 'B',
      vowText: 'x',
      createdAt,
      photoDigest,
      audioDigest: '',
    });
    const expected = await sha256Hex(canonical);
    const vow = await commitVow({
      partnerA: 'A',
      partnerB: 'B',
      vowText: 'x',
      createdAt,
      photoDigest,
    });
    assert.equal(vow.evidenceRoot, expected);
    assert.match(
      canonical,
      /^bevp:vow:v1\nA\nB\nx\n2026-01-01T12:00:00.000Z\nphoto:[0-9a-f]{64}\naudio:$/,
    );
  });

  it('rejects malformed digest hex', async () => {
    await assert.rejects(
      () =>
        commitVow({
          partnerA: 'A',
          partnerB: 'B',
          vowText: 'x',
          createdAt: '2026-01-01T00:00:00.000Z',
          photoDigest: 'not-hex',
        }),
      /photoDigest/,
    );
  });
});
