# `@bevp/core`

Protocol-level commitment helpers for BEVP.

- Stage 1 vows: canonical `bevp:vow:v1` with optional photo/audio digests (`commitVow`)
- Merkle-DAG helpers: `merkleRoot` / `merkleProof` / `verifyMerkleProof` for vault timelines

Plaintext media never leaves the client via this package — only digests enter the evidence root.
