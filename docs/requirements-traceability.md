# Clata Requirements Traceability

Every implemented PRD requirement MUST map to a module, contract, test, and status. This prevents the architecture from becoming detached from the PRD.

| PRD | Area | Planned module | Evidence/test | Status |
|---|---|---|---|---|
| FR-10..12 | vocabulary/audio/viewed | `src/features/vocabulary`, `src/infrastructure/audio`, `src/features/progress` | `tests/unit/vocabulary/*`, progress integration tests, offline/device E2E | Vocabulary/search/viewed foundation implemented; valid audio fixture and device playback evidence pending |
| FR-20..24 | practice/picker | `src/features/practice`, `src/infrastructure/database/migrations/0003_practice_sessions.ts`, `src/features/progress` | `tests/unit/practice/*`, practice transaction/integration tests, offline E2E pending | Practice domain, session persistence, answer transaction, and basic offline UI implemented; expanded E2E/accessibility evidence pending |
| FR-30..35 | curated dialogue | `src/features/dialogues`, `src/infrastructure/database/migrations/0004_dialogues_and_challenges.ts`, `src/features/progress` | `tests/unit/dialogues/*`, `tests/integration/dialogues/*` | Curated dialogue graph traversal, repair loops, deterministic scoring, offline audio playback, and active run persistence implemented |
| FR-50..56 | local profile/settings/about | `src/domain/onboarding`, `src/features/onboarding`, `src/features/settings`, SQLite | `tests/unit/settings/*`, `tests/integration/settings/*`, `tests/e2e/airplaneModeJourney.test.ts`, `tests/unit/onboarding/ageGate.test.ts` | Implemented in Plan 8: 2-step package reset & clear all data (FR-55), offline About screen with credits/licenses/age limit/reporting (FR-56), and full airplane mode journey |
| FR-60..62 | streak/mastery/statistics | `src/domain/progress`, `src/features/progress`, SQLite migrations | `tests/unit/progress/*`, `tests/integration/database/*`, `tests/property/progress/*` | Plan 3 blueprint — implementation pending; AI-dialogue quota submetric in FR-61 explicitly deferred to P1 |
| FR-70..73 | challenge | `src/features/challenges`, `src/infrastructure/database/migrations/0004_dialogues_and_challenges.ts` | `tests/unit/challenges/*`, `tests/integration/challenges/*` | Challenges domain, solo/social variants, minor safety, rescue phrases, local check persistence, and no-progress invariant implemented |
| FR-80 | bundled package install | `src/features/packages`, SQLite package persistence, bundled source, startup | package contract tests, `tests/integration/packages/*`, `tests/integration/database/package-persistence.test.ts` | Plan 2 foundation implemented; durable persistence/activation specified in Plan 3 |
| FR-81 | package identity/isolation | `src/features/packages/domain/packageTypes.ts`, package validator | `tests/contract/packages/validator.test.ts` | partial — package identity contract implemented |
| FR-82 | bundled package update | `src/features/packages/application/verifyBundledPackage.ts`, SQLite activation and replay | `tests/unit/packages/version-rules.test.ts`, `tests/integration/packages/atomic-install.test.ts`, `tests/integration/database/package-persistence.test.ts`, `tests/property/progress/package-update.test.ts` | Plan 2 update foundation; stable-ID progress preservation specified in Plan 3 |
| FR-90 | content builder/validation | `tools/content-builder/src`, `content/packages/jawa-mataraman` | `tests/contract/packages/content-rules.test.ts`, `npm run content:validate` | partial — fixture and validator implemented; release signing workflow pending key custody |
| FR-83..88 | package P1 | `packages`, `infrastructure` | fault-path E2E | P1 |
| FR-40..45 | AI dialogue | `account`, `dialogues` | contract/security/E2E | P1 |
| FR-51A | sync | `account`, `progress` | multi-device scenario tests | P1 |
| Architecture/runtime | startup, dependency boundary, recovery | `src/bootstrap`, `src/domain`, `src/data`, `src/infrastructure` | `tests/architecture/import-boundaries.test.ts`, `tests/integration/startup-runner.test.ts`, `tests/unit/error-mapping.test.ts`, `tests/unit/logger-sanitization.test.ts` | implemented in Plan 1; SQLite/package adapters pending Plans 2–3 |

The matrix MUST be expanded for every FR/NFR before release and linked to test filenames and evidence.
