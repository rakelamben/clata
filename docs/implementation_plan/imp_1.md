# P0 Implementation Plan 1 — Foundation & Runtime

## Tujuan

Membangun fondasi runtime Clata agar fitur P0 memiliki batas arsitektur yang jelas, startup yang aman, dan dependency injection yang siap dipakai oleh Plan 2–8.

Plan ini tidak mengimplementasikan content package, SQLite adapter, audio, latihan, dialog, challenge, atau fitur P1. Fokusnya adalah runtime, boundary, startup, recovery, dan kontrak dasar.

## Scope

### Termasuk

- Composition root di `src/bootstrap`.
- Boundary route Expo Router di `src/app`.
- Layer domain, application, data, dan infrastructure.
- Dependency injection berbasis port/capability.
- Startup lifecycle dan recovery state.
- Async operation state.
- Error model dan error mapping Bahasa Indonesia.
- Konfigurasi environment non-rahasia.
- Import boundary dan test architecture.
- Logging non-sensitif.

### Tidak termasuk

- Supabase/Auth/sync.
- Dialog AI, reminder, portal kontributor.
- Download/import package tambahan.
- Implementasi lengkap SQLite, content package, audio, vocabulary, practice, dialogue, atau challenge.

## Kondisi saat ini

- `src/app/` berisi route onboarding dan tab placeholder.
- `src/bootstrap/AppProviders.tsx` hanya membungkus `SafeAreaProvider`.
- Belum ada `src/domain`, `src/data`, atau `src/infrastructure`.
- Belum ada startup controller, migration runner, recovery state, dependency container, atau test suite.
- Typecheck dan lint berhasil.
- `expo-doctor` belum tersedia.

## Invariant arsitektur

```text
Presentation (routes/screens/components)
              ↓
Application (use cases/orchestration)
              ↓
Domain (entities/rules/ports/errors)
              ↑
Data + Infrastructure (repositories/adapters/platform APIs)
```

1. `src/app/` hanya route Expo Router dan komposisi UI.
2. Route tidak boleh berisi business logic.
3. Domain tidak boleh mengimpor React, Expo, SQLite, Supabase, Zustand, atau API platform.
4. UI tidak boleh mengakses database, filesystem, network, audio, atau crypto secara langsung.
5. Infrastructure hanya dihubungkan melalui composition root.
6. Operasi async harus memiliki state `idle`, `loading`, `success`, `error`; network dapat menambah `offline` dan `retrying`.
7. Startup failure tidak boleh menghapus data lokal secara diam-diam.
8. Operasi destruktif memerlukan konfirmasi eksplisit.
9. Startup handler yang disediakan oleh plan berikutnya wajib idempotent atau transactional sehingga aman diulang setelah kegagalan.

## Struktur target

```text
src/
  app/                         # route Expo Router saja
  bootstrap/
    AppBootstrap.tsx
    AppProviders.tsx
    DependencyContainer.ts
    bootstrapTypes.ts
    startupRecovery.ts
  domain/
    errors/DomainError.ts
    ports/Clock.ts
    ports/DeviceIdentity.ts
    ports/Logger.ts
    value-objects/OperationState.ts
  data/repositories/RepositoryResult.ts
  features/onboarding/application/bootstrapApp.ts
  shared/errors/mapErrorToMessage.ts

tests/
  unit/operation-state.test.ts
  unit/error-mapping.test.ts
  integration/startup-runner.test.ts
  architecture/import-boundaries.test.ts
```

## Kontrak inti

### Operation state

```ts
export type OperationState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError }
  | { status: 'offline'; retry: () => Promise<void> }
  | { status: 'retrying'; attempt: number };
```

Kontrak ini framework-independent dan tidak mengimpor React.

### Application error

```ts
export type AppErrorCode =
  | 'STARTUP_FAILED'
  | 'MIGRATION_FAILED'
  | 'RECOVERY_REQUIRED'
  | 'INVALID_CONFIGURATION'
  | 'UNSUPPORTED_PLATFORM'
  | 'UNKNOWN';

export type AppError = {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
  recoverable: boolean;
};
```

Pesan teknis tidak boleh langsung ditampilkan ke pengguna; gunakan mapper Bahasa Indonesia.

### Startup capability

```ts
export type StartupStep =
  | 'loadMetadata'
  | 'openDatabase'
  | 'runMigrations'
  | 'recoverInterruptedWork'
  | 'rebuildDerivedCaches'
  | 'verifyBundledPackage'
  | 'ready';

export type StartupStatus =
  | { status: 'idle' }
  | { status: 'running'; step: StartupStep }
  | { status: 'ready' }
  | { status: 'recovery-required'; error: AppError };

export interface StartupRunner {
  run(): Promise<StartupStatus>;
}
```

Plan 1 membuat orchestrator dan contract. Adapter SQLite dan package dipasok oleh Plan 2–3.

### Dependency container

```ts
export type DependencyContainer = {
  clock: Clock;
  deviceIdentity: DeviceIdentity;
  logger: Logger;
  startup: StartupRunner;
};
```

Container dibuat sekali di composition root dan diekspos sebagai capability read-only, bukan global mutable state.

## Tahap implementasi

### Tahap 1 — Audit boundary dan konfigurasi

1. Verifikasi versi Expo dari `package.json` dan cocokkan API dengan dokumentasi SDK 58.
2. Pastikan `src/app` tetap menjadi Expo Router boundary.
3. Tambahkan path alias TypeScript bila diperlukan.
4. Dokumentasikan environment development/staging/production tanpa memasukkan secret.
5. Pastikan source mobile hanya memuat konfigurasi public.
6. Perbarui `docs/architecture.md` bila ada penyimpangan.

**Output:** boundary dan konfigurasi dasar terdokumentasi.

### Tahap 2 — Domain primitives dan error model

1. Buat `OperationState` framework-independent.
2. Buat `AppError` dan error code stabil.
3. Buat `Result<T, E>` bila diperlukan.
4. Buat port `Clock`, `DeviceIdentity`, dan `Logger`.
5. Buat fake/test adapter untuk semua port.
6. Tambahkan unit test state transition dan error mapping.

**Output:** kontrak dasar dapat dipakai semua feature.

### Tahap 3 — Infrastructure adapters minimal

1. Implementasikan system clock.
2. Implementasikan device identity provider yang dapat diganti saat SQLite siap.
3. Implementasikan logger yang menyensor token, PII, birth year, dan payload konten.
4. Tambahkan no-op/in-memory adapter untuk test.
5. Jangan menambahkan persistence database; itu Plan 3.

**Output:** capability platform minimal tersedia di composition root.

### Tahap 4 — Startup orchestrator

Urutan wajib:

1. Load safe app metadata.
2. Open SQLite melalui adapter Plan 3.
3. Run migrations.
4. Recover interrupted package install.
5. Rebuild invalid derived caches.
6. Verify/install bundled package melalui Plan 2.
7. Initialize dependency container.
8. Mark runtime ready.

Production tidak boleh menganggap startup siap bila dependency wajib belum tersedia. Startup harus berhenti ke recovery state bila migration, recovery, atau package verification gagal.

**Output:** `StartupRunner` deterministik dan dapat diuji.

### Tahap 5 — Composition root

1. Ubah `AppProviders` menjadi composition root.
2. Jalankan startup sekali pada lifecycle aplikasi.
3. Sediakan provider/context read-only untuk public feature API.
4. Tampilkan bootstrap loading screen.
5. Tampilkan recovery screen dengan aksi `Coba lagi`.
6. Jangan menghapus database atau reset data otomatis.
7. Cegah duplicate container dan duplicate lifecycle.

**Output:** aplikasi memiliki runtime state eksplisit sebelum route utama digunakan.

### Tahap 6 — Route integration

1. `src/app/index.tsx` menunggu bootstrap state.
2. Redirect ke onboarding hanya bila onboarding belum selesai.
3. Redirect ke tab utama bila runtime dan onboarding siap.
4. Hilangkan redirect hard-code yang selalu menuju onboarding.
5. Route hanya memanggil public application API.
6. Tambahkan fallback route untuk recovery state.

**Output:** navigation tidak melewati startup state.

### Tahap 7 — Documentation dan boundary tests

1. Test domain tidak mengimpor platform.
2. Test `src/app` tidak mengimpor infrastructure adapter.
3. Test startup order.
4. Test startup failure dan retry.
5. Test logger sanitization.
6. Perbarui `docs/requirements-traceability.md` untuk Plan 1.
7. Tambahkan ADR bila ada perubahan boundary.

**Output:** evidence arsitektur dan runtime otomatis.

## File dibuat dan dimodifikasi

### Dibuat

| File | Tujuan |
|---|---|
| `src/bootstrap/AppBootstrap.tsx` | Lifecycle startup dan runtime state |
| `src/bootstrap/DependencyContainer.ts` | Wiring port dan adapter |
| `src/bootstrap/bootstrapTypes.ts` | Tipe startup/container |
| `src/bootstrap/startupRecovery.ts` | Recovery dan retry behavior |
| `src/domain/value-objects/OperationState.ts` | State operasi async |
| `src/domain/errors/DomainError.ts` | Error framework-independent |
| `src/domain/ports/Clock.ts` | Port waktu |
| `src/domain/ports/DeviceIdentity.ts` | Port identity perangkat |
| `src/domain/ports/Logger.ts` | Port logging tersanitasi |
| `src/data/repositories/RepositoryResult.ts` | Kontrak hasil repository |
| `src/shared/errors/mapErrorToMessage.ts` | Mapping error Bahasa Indonesia |
| `tests/unit/operation-state.test.ts` | Unit test operation state |
| `tests/unit/error-mapping.test.ts` | Unit test error mapping |
| `tests/integration/startup-runner.test.ts` | Startup/recovery test |
| `tests/architecture/import-boundaries.test.ts` | Dependency direction test |

### Dimodifikasi

| File | Perubahan |
|---|---|
| `src/bootstrap/AppProviders.tsx` | Inisialisasi bootstrap dan container |
| `src/app/_layout.tsx` | Runtime loading/recovery boundary |
| `src/app/index.tsx` | Redirect berdasarkan bootstrap/onboarding state |
| `tsconfig.json` | Alias dan strict boundary bila perlu |
| `package.json` | Test script dan dependency minimum |
| `docs/architecture.md` | Dokumentasi runtime aktual |
| `docs/requirements-traceability.md` | Evidence Plan 1 |

## Test plan

### Unit

- `idle → loading → success`.
- `idle → loading → error`.
- `loading → retrying → success`.
- Recoverable dan non-recoverable error.
- Error teknis menjadi pesan Bahasa Indonesia.
- Logger menyensor token, email, nomor telepon, birth year, dan payload konten.

### Integration

- Startup menjalankan step dalam urutan benar.
- Startup berhenti saat migration gagal.
- Startup failure tidak menghapus data.
- Retry startup aman dan idempotent.
- Container siap hanya setelah startup sukses.
- Route tidak menerima infrastructure adapter langsung.

### Architecture

- Domain tidak mengimpor React/Expo/SQLite/Supabase.
- `src/app` tidak mengimpor infrastructure adapter.
- Feature application hanya mengimpor public domain ports.
- Tidak ada import relatif yang melanggar boundary.

## Acceptance criteria

Plan 1 selesai bila:

1. `src/app` hanya berisi route dan komposisi UI.
2. Domain dan port bebas dependency framework/platform.
3. AppProviders menjadi composition root teruji.
4. Startup memiliki state loading, ready, dan recovery required.
5. Startup failure tidak menghapus local data.
6. Retry tidak membuat duplicate container/lifecycle.
7. `src/app/index.tsx` tidak selalu redirect ke onboarding.
8. Logger tidak mengeluarkan secret atau PII.
9. Architecture boundary test lulus.
10. Unit dan integration test Plan 1 lulus.
11. `npm run typecheck` lulus.
12. `npm run lint` lulus.
13. Test script dapat dijalankan dari project root.

## Risiko dan mitigasi

| Risiko | Level | Mitigasi |
|---|---|---|
| Startup terlalu banyak memuat business logic | Medium | Startup hanya orchestration; rule tetap di domain/use case |
| Container menjadi global mutable state | High | Container read-only dan dibuat sekali di composition root |
| Route mengakses adapter langsung | High | Import boundary test dan public feature API |
| Startup failure menghapus data | High | Recovery state eksplisit; destructive action terpisah |
| Fake adapter berbeda dari production adapter | Medium | Contract test untuk fake dan adapter produksi |
| API Expo tidak cocok SDK project | High | Verifikasi dokumentasi Expo SDK 58 sebelum memakai API platform |
| Error teknis bocor ke pengguna | Medium | Central error mapper Bahasa Indonesia |
| Test tergantung device | Medium | Clock, identity, logger, dan runner memakai fake adapter |

## Definition of Done

- File boundary utama tersedia.
- AppProviders menjalankan bootstrap lifecycle.
- Loading, ready, dan recovery state dapat diverifikasi.
- Domain bebas dependency framework.
- Import boundary test tersedia dan lulus.
- Startup failure/retry test tersedia dan lulus.
- Tidak ada secret/PII dalam log.
- Typecheck dan lint lulus.
- Architecture dan requirements traceability diperbarui.
- Plan 2 dan Plan 3 dapat dimulai tanpa mengubah ulang composition root.

## Handoff

### Ke Plan 2 — Content Package & Bundled Install

- Gunakan `DependencyContainer`.
- Integrasikan `verifyBundledPackage`.
- Gunakan startup recovery untuk interrupted install.
- Gunakan error model package.

### Ke Plan 3 — SQLite & Progress Engine

- Integrasikan `openDatabase` dan `runMigrations`.
- Gunakan `Clock`, `DeviceIdentity`, dan `Logger` ports.
- Daftarkan SQLite adapter di composition root.
- Gunakan repository result/error contract.
