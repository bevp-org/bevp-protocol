# BEVP: Bitcoin Experience Validation Protocol

> Bitcoin gives wealth an immutable past; BEVP gives life an unforgotten past.  
> 比特币让财富拥有不可篡改的过去；BEVP 让人生拥有不可遗忘的过去。

| Package | Registry | Path |
|---------|----------|------|
| `bevp-protocol` (Rust) | [crates.io](https://crates.io/crates/bevp-protocol) | [`crates/bevp-protocol`](./crates/bevp-protocol) |
| `@bevp/crypto` | npm (scoped) | [`packages/bevp-crypto`](./packages/bevp-crypto) |
| `@bevp/core` | npm (scoped) | [`packages/bevp-core`](./packages/bevp-core) |
| `@bevp/ots` | npm (scoped) | [`packages/bevp-ots`](./packages/bevp-ots) |
| `@bevp/relay-client` | npm (scoped) | [`packages/bevp-relay-client`](./packages/bevp-relay-client) |
| `@bevp/i18n` | npm (scoped) | [`packages/bevp-i18n`](./packages/bevp-i18n) |
| `bevp-protocol` (JS umbrella) | [npm](https://www.npmjs.com/package/bevp-protocol) | [`packages/bevp-protocol`](./packages/bevp-protocol) |

Homepage: [https://bevp.org](https://bevp.org) · Repository: [github.com/bevp-org/bevp-protocol](https://github.com/bevp-org/bevp-protocol)

---

## ✦ Core Pillars (四大支柱)

- **Trust (可信)**: Time-anchored via OpenTimestamps on the physical PoW of Bitcoin.
- **Family (家庭)**: A flowing chronicle mapped via client-side Merkle-DAG.
- **Privacy (私密)**: Absolute zero-knowledge end-to-end encryption (E2EE) and NIP-17 metadata wrapping.
- **Heritage (传承)**: Digital legacy transition powered by Shamir Secret Sharing and relative time-locks (CSV).

## ✦ Repository Structure

```text
bevp-protocol/
├── LICENSE                    # BUSL-1.1
├── Cargo.toml                 # Rust workspace
├── package.json               # npm workspaces root
├── crates/bevp-protocol/      # Core Rust protocol (crates.io)
├── packages/
│   ├── bevp-crypto/           # @bevp/crypto — SHA-256 digests
│   ├── bevp-core/             # @bevp/core — vow commitments (+ media digests)
│   ├── bevp-ots/              # @bevp/ots — OpenTimestamps stamp/upgrade/verify
│   ├── bevp-relay-client/     # @bevp/relay-client — pay/queue/rush thin client
│   ├── bevp-i18n/             # @bevp/i18n — static zh/en Language Pack
│   └── bevp-protocol/         # umbrella re-exports (legacy npm name)
├── scripts/release.sh         # Publish helper
└── .github/SECURITY.md
```

- `/packages/bevp-crypto` — Shared hashing (`sha256Hex`, `shortHash`).
- `/packages/bevp-core` — Stage 1 `commitVow` / `bevp:vow:v1` evidence roots.
- `/packages/bevp-ots` — OTS stamp / upgrade / verify (public calendars; Signet needs custom URLs).
- `/packages/bevp-relay-client` — Sponsor Relay pay intent + stamp job client (mock or HTTP).
- `/packages/bevp-i18n` — Static zh/en dictionaries (`t` / `setLocale`); no cloud translation.
- `/packages/bevp-crypto` also exports Shamir 2-of-3 + Passkey helpers.
- `/packages/bevp-core` also exports Merkle-DAG root/proof helpers.
- Calendar Gas / Stripe secrets stay in private `bevp-relay-server`.

## ✦ Develop

```bash
# Rust
cargo test -p bevp-protocol

# JS/TS
npm install
npm test
npm test -w @bevp/crypto
npm test -w @bevp/core
```

## ✦ Git remote (SSH Host alias)

```sshconfig
Host github.com-bevp
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_bevp
```

```bash
git remote set-url origin git@github.com-bevp:bevp-org/bevp-protocol.git
```

## ✦ Release

Prerequisites:

- crates.io: `cargo login`
- npm: `npm login` (owner of `bevp-protocol`)
- npm 2FA: `--otp <code>` or `NPM_OTP=<code>`
- clean git working tree on `main`

```bash
./scripts/release.sh cargo              # publish current crate version
./scripts/release.sh npm --otp XXXXXX   # publish current npm version
./scripts/release.sh both patch --otp XXXXXX
./scripts/release.sh both --dry-run
```

Tags: `crate-vX.Y.Z` / `npm-vX.Y.Z`. Crate and npm versions are independent.

## ✦ Security

Please report vulnerabilities privately — see [SECURITY.md](./.github/SECURITY.md).  
Contact: **security@bevp.org** (do not open a public issue for security bugs).

## ✦ License

This project is licensed under the [Business Source License 1.1](./LICENSE) (BUSL-1.1).

- Licensor: BEVP Foundation Ltd.
- Change Date: 2029-07-14
- Change License: Apache License, Version 2.0
- Additional Use Grant: Non-commercial use and individual private self-hosting are permitted.
