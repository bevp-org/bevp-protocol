#!/usr/bin/env bash
# Publish bevp-protocol to crates.io and/or npm.
#
# Usage:
#   ./scripts/release.sh cargo [patch|minor|major|X.Y.Z] [--dry-run]
#   ./scripts/release.sh npm   [patch|minor|major|X.Y.Z] [--dry-run]
#   ./scripts/release.sh both  [patch|minor|major|X.Y.Z] [--dry-run]
#
# Examples:
#   ./scripts/release.sh cargo              # publish current crate version
#   ./scripts/release.sh npm patch          # bump npm patch, then publish
#   ./scripts/release.sh both 0.2.0         # set both to 0.2.0 and publish
#   ./scripts/release.sh cargo --dry-run    # verify only

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CRATE_TOML="crates/bevp-protocol/Cargo.toml"
NPM_PKG="packages/bevp-protocol"
DRY_RUN=0
TARGET=""
BUMP=""

die() { echo "error: $*" >&2; exit 1; }

usage() {
  sed -n '2,14p' "$0" | sed 's/^# \?//'
  exit "${1:-0}"
}

parse_args() {
  [[ $# -ge 1 ]] || usage 1
  TARGET="$1"
  shift

  case "$TARGET" in
    cargo|npm|both) ;;
    -h|--help|help) usage 0 ;;
    *) die "unknown target '$TARGET' (expected: cargo|npm|both)" ;;
  esac

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dry-run) DRY_RUN=1 ;;
      -h|--help) usage 0 ;;
      patch|minor|major|[0-9]*.[0-9]*.[0-9]*)
        [[ -z "$BUMP" ]] || die "bump already set to '$BUMP'"
        BUMP="$1"
        ;;
      *) die "unknown argument: $1" ;;
    esac
    shift
  done
}

require_clean_git() {
  if [[ -n "$(git status --porcelain)" ]]; then
    die "working tree is dirty; commit or stash first"
  fi
}

current_crate_version() {
  sed -n 's/^version = "\(.*\)"/\1/p' "$CRATE_TOML" | head -1
}

current_npm_version() {
  node -p "require('./$NPM_PKG/package.json').version"
}

bump_semver() {
  local version="$1" part="$2"
  local major minor patch
  IFS=. read -r major minor patch <<<"$version"
  case "$part" in
    patch) patch=$((patch + 1)) ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    major) major=$((major + 1)); minor=0; patch=0 ;;
    *) die "invalid bump kind: $part" ;;
  esac
  echo "${major}.${minor}.${patch}"
}

resolve_version() {
  local current="$1"
  if [[ -z "$BUMP" ]]; then
    echo "$current"
  elif [[ "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "$BUMP"
  else
    bump_semver "$current" "$BUMP"
  fi
}

set_crate_version() {
  local new="$1"
  local tmp
  tmp="$(mktemp)"
  awk -v ver="$new" '
    BEGIN { done = 0 }
    /^version = "/ && !done { print "version = \"" ver "\""; done = 1; next }
    { print }
  ' "$CRATE_TOML" >"$tmp"
  mv "$tmp" "$CRATE_TOML"
}

set_npm_version() {
  local new="$1"
  node -e "
    const fs = require('fs');
    const path = '$NPM_PKG/package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.version = process.argv[1];
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  " "$new"
}

run_checks() {
  echo "==> cargo test -p bevp-protocol"
  cargo test -p bevp-protocol

  if [[ "$TARGET" == "npm" || "$TARGET" == "both" ]]; then
    echo "==> npm test -w bevp-protocol"
    npm run test -w bevp-protocol --if-present
  fi
}

publish_crate() {
  local version
  version="$(current_crate_version)"
  echo "==> crates.io: bevp-protocol@$version"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    cargo publish -p bevp-protocol --dry-run
    echo "dry-run ok (crate $version)"
    return
  fi

  cargo publish -p bevp-protocol
  git tag -a "crate-v${version}" -m "Release crate bevp-protocol ${version}"
  echo "tagged crate-v${version}"
}

publish_npm() {
  local version
  version="$(current_npm_version)"
  echo "==> npm: bevp-protocol@$version"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    npm publish -w bevp-protocol --dry-run
    echo "dry-run ok (npm $version)"
    return
  fi

  npm publish -w bevp-protocol --access public
  git tag -a "npm-v${version}" -m "Release npm bevp-protocol ${version}"
  echo "tagged npm-v${version}"
}

commit_bumps_if_needed() {
  if [[ -z "$(git status --porcelain)" ]]; then
    return
  fi

  local msg="release:"
  [[ "$TARGET" == "cargo" || "$TARGET" == "both" ]] && msg+=" crate $(current_crate_version)"
  [[ "$TARGET" == "both" ]] && msg+=" +"
  [[ "$TARGET" == "npm" || "$TARGET" == "both" ]] && msg+=" npm $(current_npm_version)"

  git add "$CRATE_TOML" Cargo.lock "$NPM_PKG/package.json" 2>/dev/null || true
  git commit -m "$msg"
  echo "committed: $msg"
}

push_release() {
  [[ "$DRY_RUN" -eq 1 ]] && return
  echo "==> git push origin main --follow-tags"
  git push origin main --follow-tags
}

main() {
  parse_args "$@"

  echo "repo:   $ROOT"
  echo "target: $TARGET"
  echo "bump:   ${BUMP:-<keep current>}"
  echo "mode:   $([[ "$DRY_RUN" -eq 1 ]] && echo dry-run || echo publish)"
  echo

  require_clean_git

  if [[ "$TARGET" == "cargo" || "$TARGET" == "both" ]]; then
    local cur new
    cur="$(current_crate_version)"
    new="$(resolve_version "$cur")"
    if [[ "$new" != "$cur" ]]; then
      echo "==> bump crate $cur -> $new"
      set_crate_version "$new"
      cargo generate-lockfile >/dev/null
    else
      echo "==> crate version $cur"
    fi
  fi

  if [[ "$TARGET" == "npm" || "$TARGET" == "both" ]]; then
    local cur new
    cur="$(current_npm_version)"
    new="$(resolve_version "$cur")"
    if [[ "$new" != "$cur" ]]; then
      echo "==> bump npm $cur -> $new"
      set_npm_version "$new"
    else
      echo "==> npm version $cur"
    fi
  fi

  run_checks

  if [[ "$DRY_RUN" -eq 0 ]]; then
    commit_bumps_if_needed
  fi

  case "$TARGET" in
    cargo) publish_crate ;;
    npm) publish_npm ;;
    both) publish_crate; publish_npm ;;
  esac

  push_release
  echo
  echo "done."
  [[ "$DRY_RUN" -eq 1 ]] || {
    echo "  crates.io: https://crates.io/crates/bevp-protocol"
    echo "  npm:       https://www.npmjs.com/package/bevp-protocol"
    echo "  github:    https://github.com/bevp-org/bevp-protocol"
  }
}

main "$@"
