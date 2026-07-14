# bevp-protocol

Bitcoin Experience Validation Protocol — monorepo for the Rust core crate and the JS/TS client SDK.

| Package | Registry | Path |
|---------|----------|------|
| `bevp-protocol` (Rust) | [crates.io](https://crates.io/crates/bevp-protocol) | `crates/bevp-protocol` |
| `bevp-protocol` (JS/TS) | [npm](https://www.npmjs.com/package/bevp-protocol) | `packages/bevp-protocol` |

Repository: https://github.com/bevp-org/bevp-protocol  
Homepage: https://bevp.org

## Layout

```text
bevp-protocol/
├── Cargo.toml                 # Rust workspace
├── package.json               # npm workspaces root
├── crates/bevp-protocol/      # crates.io package
├── packages/bevp-protocol/    # npm package
└── scripts/release.sh         # publish helper
```

## Develop

```bash
# Rust
cargo test -p bevp-protocol

# JS/TS
npm test -w bevp-protocol
```

## Git remote (SSH Host alias)

If you use a dedicated deploy key:

```sshconfig
Host github.com-bevp
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_bevp
```

```bash
git remote set-url origin git@github.com-bevp:bevp-org/bevp-protocol.git
```

## Release

Prerequisites:

- crates.io: `cargo login` (token with publish scope)
- npm: `npm login` (account that owns `bevp-protocol`)
- npm 2FA: pass `--otp <code>`, or `NPM_OTP=<code> ./scripts/release.sh npm`
- clean git working tree on `main`
- push access via the SSH remote above

### One-shot publish (recommended)

```bash
# Publish whatever versions are currently in the manifests
./scripts/release.sh cargo
./scripts/release.sh npm
./scripts/release.sh both

# Bump then publish
./scripts/release.sh cargo patch
./scripts/release.sh npm minor
./scripts/release.sh both 0.2.0

# Verify without uploading
./scripts/release.sh cargo --dry-run
./scripts/release.sh npm --dry-run
```

The script will:

1. optionally bump the version (`patch` / `minor` / `major` / `X.Y.Z`)
2. run tests
3. commit the bump (if any)
4. `cargo publish` and/or `npm publish`
5. create annotated tags: `crate-vX.Y.Z` and/or `npm-vX.Y.Z`
6. `git push origin main --follow-tags`

### Manual publish

```bash
# crates.io
cargo test -p bevp-protocol
cargo publish -p bevp-protocol
git tag -a crate-v0.1.1 -m "Release crate bevp-protocol 0.1.1"
git push origin main --follow-tags

# npm
npm test -w bevp-protocol
npm publish -w bevp-protocol --access public
git tag -a npm-v1.0.1 -m "Release npm bevp-protocol 1.0.1"
git push origin main --follow-tags
```

### Version notes

- Crate and npm versions are **independent** (today: crate `0.1.x`, npm `1.0.x`).
- Every crates.io / npm upload needs a **new** version number.
- Registry pages pick up GitHub links from `repository` / `homepage` metadata in each package manifest.

## License

BUSL-1.1
