const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { merkleRoot, merkleProof, verifyMerkleProof } = require('../src/merkle.js');

describe('@bevp/core merkle', () => {
  it('builds a stable root and verifies proofs', async () => {
    const leaves = ['a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64)];
    const { root } = await merkleRoot(leaves);
    assert.equal(root.length, 64);

    const proof0 = await merkleProof(leaves, 0);
    assert.equal(proof0.root, root);
    assert.equal(await verifyMerkleProof(proof0.leaf, proof0.path, root), true);

    const proof2 = await merkleProof(leaves, 2);
    assert.equal(await verifyMerkleProof(proof2.leaf, proof2.path, root), true);
    assert.equal(await verifyMerkleProof('d'.repeat(64), proof2.path, root), false);
  });
});
