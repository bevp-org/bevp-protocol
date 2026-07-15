# `@bevp/crypto`

Client-side crypto helpers for BEVP (BUSL-1.1).

- SHA-256 digests (`sha256Hex`) — Web Crypto in browsers; Node fallback via `browser` field
- Shamir secret sharing (`split2of3` / `combineShares`) for heritage shards
- Passkey helpers (`createPasskey` / `assertPasskey` / `deriveUnlockKey`)
