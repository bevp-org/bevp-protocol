# `@bevp/ots`

OpenTimestamps client helpers for BEVP (BUSL-1.1).

Wraps [`@vitrified/typescript-opentimestamps`](https://www.npmjs.com/package/@vitrified/typescript-opentimestamps) (LGPL-3.0-or-later).

| Mode | Behavior |
| --- | --- |
| `bitcoin` (default) | Submit to public OTS calendars → pending `.ots` until upgraded to a Bitcoin block |
| `signet` | Same API; requires explicit `calendars` (no public Signet calendar by default) |
| `sandbox` | Offline pending envelope for CI / offline UI (not a real OTS proof) |

Calendar scheduling / Gas remain in private `bevp-relay-server`.
