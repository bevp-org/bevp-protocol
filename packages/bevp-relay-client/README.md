# `@bevp/relay-client`

Open thin client for BEVP Sponsor Relay (BUSL-1.1).

- Creates pay intents (`queue` / `rush`)
- Confirms mock or remote payment
- Submits digest stamp jobs after pay
- **Never** holds hot-wallet keys, Stripe secrets, or Gas regulators

Production HTTP API is implemented by private `bevp-relay-server`.
For local UI, use `createMockRelay()` (in-memory).
