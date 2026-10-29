# Clata Architecture

## System shape

Clata adalah aplikasi React Native + Expo offline-first. P0 berjalan lokal. P1 menambahkan adapter Supabase, katalog Vercel, dan sinkronisasi tanpa menjadikan network sebagai dependency P0.

## Layers

1. **Presentation**: route, screen, component, accessibility, UI state.
2. **Application**: use case dan orchestration.
3. **Domain**: entity, value object, rules, ports, domain errors; framework-independent.
4. **Data**: repository contract, DTO, mapper, query model.
5. **Infrastructure**: SQLite, filesystem, audio, crypto, clock, network, Supabase.

Dependency direction: `presentation → application → domain ← data/infrastructure`. Composition root menghubungkan semua implementasi.

## Expo boundary

`src/app/` khusus Expo Router routes dan `src/bootstrap/` berisi composition root, provider, migration startup, dependency injection, dan recovery startup. Route tidak boleh berisi business logic.

Runtime foundation is implemented in `src/bootstrap/AppBootstrap.tsx`, `DependencyContainer.ts`, and `startupRecovery.ts`. SQLite migration, derived-cache rebuild, and bundled-package verification remain explicit startup capabilities for Plans 2–3; production startup reports ready only when the composition root marks all required adapters configured. Startup handlers supplied by later plans MUST be idempotent or transactional so a failed handler can be retried safely.

## Use cases

Use case minimum: `completeOnboarding`, `installBundledPackage`, `recordWordViewed`, `getVocabularyPage`, `playAudio`, `submitPracticeAnswer`, `rebuildProgress`, `resetPackageProgress`, `importPackage`, `removePackage`. P1 menambahkan `signIn`, `syncAccount`, `downloadPackage`, dan `deleteAccount`.

## Runtime states

Setiap operasi async memiliki `idle | loading | success | error`; operasi jaringan juga memiliki `offline | retrying`. Screen MUST menyediakan loading, error, empty, offline, dan success state yang relevan.

## Startup

1. Load safe app metadata.
2. Open SQLite and run migrations transactionally.
3. Recover interrupted package installs.
4. Rebuild invalid derived caches.
5. Install/verify bundled package if absent.
6. Initialize dependency container, local profile, capability state, and navigation.

Startup failure MUST show recovery action and MUST NOT silently delete local data.

## Package lifecycle

`select source → stage temporary files → safe extract → schema validation → signature/checksum validation → semantic validation → capacity check → persist → atomic activation → rebuild indexes`.

Package signatures use Ed25519 over the canonical manifest and checksum list; SHA-256 is used for file checksums. Audio targets Opus with AAC/M4A fallback after device validation.

Plan 2 adds package validation, SemVer comparison, bundled source, staging/activation contracts, Ed25519 verification, safe-path checks, and a development in-memory storage adapter. Persistent SQLite package records and production archive recovery are completed with Plan 3.

## Diagrams

The implementation SHOULD maintain Mermaid diagrams for system context, package installation, learning event flow, and P1 synchronization in the relevant feature documentation or ADR.
