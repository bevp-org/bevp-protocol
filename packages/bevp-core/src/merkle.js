const { sha256Hex } = require('@bevp/crypto')

/**
 * @typedef {{
 *   id: string,
 *   hash: string,
 *   parentId?: string,
 *   left?: string,
 *   right?: string,
 *   payloadDigest?: string,
 *   kind?: string,
 * }} MerkleNode
 */

/**
 * Hash two child digests in sorted hex order for determinism.
 * @param {string} leftHex
 * @param {string} rightHex
 */
async function hashPair(leftHex, rightHex) {
  const [a, b] = leftHex <= rightHex ? [leftHex, rightHex] : [rightHex, leftHex]
  return sha256Hex(`bevp:merkle:v1\n${a}\n${b}`)
}

/**
 * Build a binary Merkle root from leaf digests (hex or bytes).
 * @param {(string | Uint8Array)[]} leaves
 * @returns {Promise<{ root: string, layers: string[][], nodes: MerkleNode[] }>}
 */
async function merkleRoot(leaves) {
  if (!leaves.length) {
    throw new Error('@bevp/core merkle: empty leaves')
  }
  /** @type {string[]} */
  let layer = []
  for (const leaf of leaves) {
    layer.push(typeof leaf === 'string' ? leaf.toLowerCase() : await sha256Hex(leaf))
  }

  /** @type {string[][]} */
  const layers = [layer.slice()]
  /** @type {MerkleNode[]} */
  const nodes = layer.map((hash, i) => ({
    id: `L0-${i}`,
    hash,
    kind: 'leaf',
    payloadDigest: hash,
  }))

  let depth = 0
  while (layer.length > 1) {
    /** @type {string[]} */
    const next = []
    for (let i = 0; i < layer.length; i += 2) {
      if (i + 1 === layer.length) {
        next.push(layer[i])
        nodes.push({
          id: `L${depth + 1}-${next.length - 1}`,
          hash: layer[i],
          left: `L${depth}-${i}`,
          kind: 'promote',
        })
      } else {
        const hash = await hashPair(layer[i], layer[i + 1])
        next.push(hash)
        nodes.push({
          id: `L${depth + 1}-${next.length - 1}`,
          hash,
          left: `L${depth}-${i}`,
          right: `L${depth}-${i + 1}`,
          kind: 'branch',
        })
      }
    }
    layer = next
    layers.push(layer.slice())
    depth += 1
  }

  return { root: layer[0], layers, nodes }
}

/**
 * Inclusion proof for leaf index (sibling hashes toward root).
 * @param {(string | Uint8Array)[]} leaves
 * @param {number} index
 */
async function merkleProof(leaves, index) {
  const { layers, root } = await merkleRoot(leaves)
  if (index < 0 || index >= layers[0].length) {
    throw new Error('@bevp/core merkle: index out of range')
  }
  /** @type {{ sibling: string, position: 'left' | 'right' }[]} */
  const path = []
  let idx = index
  for (let d = 0; d < layers.length - 1; d += 1) {
    const layer = layers[d]
    const siblingIndex = idx % 2 === 0 ? idx + 1 : idx - 1
    if (siblingIndex < layer.length) {
      path.push({
        sibling: layer[siblingIndex],
        position: idx % 2 === 0 ? 'right' : 'left',
      })
    }
    idx = Math.floor(idx / 2)
  }
  return { root, leaf: layers[0][index], path }
}

/**
 * Verify a merkle proof against an expected root.
 * @param {string} leafHex
 * @param {{ sibling: string, position: 'left' | 'right' }[]} path
 * @param {string} expectedRoot
 */
async function verifyMerkleProof(leafHex, path, expectedRoot) {
  // hashPair sorts children — position is informational only.
  let acc = leafHex.toLowerCase()
  for (const step of path) {
    acc = await hashPair(acc, step.sibling)
  }
  return acc === expectedRoot.toLowerCase()
}

module.exports = {
  hashPair,
  merkleRoot,
  merkleProof,
  verifyMerkleProof,
}
