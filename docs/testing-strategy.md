# Clata Testing Strategy

## Test pyramid

- Domain unit tests: mastery, replay, decay priority, streak dates, picker, age gate, package rules. Target 90%+ domain coverage.
- Application tests: use-case orchestration and error mapping. Target 80%+.
- Integration tests: SQLite, migrations, filesystem, audio adapter, package install, outbox. Target 80%+ overall.
- Contract tests: package JSON schemas, signature/checksum, catalog, Supabase payloads.
- E2E: critical user journeys on real/simulated devices.

## Required failure tests

Airplane mode, process kill during install/sync/migration, disk full, malformed ZIP, path traversal, bad signature, wrong checksum, lower package version, interrupted download, duplicate event, clock skew, account switch, and offline-to-online recovery.

## Device matrix

At minimum use three mid-range Android devices and one supported iOS device, plus small screen and 200% font scenarios. The target baseline is Android 8+ and iOS 16.4+, matching the selected Expo SDK 58 support matrix.

## Determinism

Replay twice, replay after different import order, and replay after duplicate sync. Results MUST be identical. Property-based tests SHOULD cover event permutations and idempotent merge.

## Quality gates

Before merge: format, lint, typecheck, unit/integration/contract tests, dependency audit, and development build. Before release: full airplane-mode run, migration matrix, accessibility, performance, crash target, security review, privacy/store checklist, and release evidence.
