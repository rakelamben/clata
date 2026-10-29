# Implementation Plan 4 — Onboarding & Local Profile

## Requirements

Implement onboarding offline dan profil lokal untuk FR-01–03, FR-50, FR-52, dan FR-54:

- Onboarding maksimal tiga layar dan dapat dilewati.
- Paket bundel Jawa–Mataraman dipasang tanpa internet.
- Progress pemasangan menampilkan loading, sukses, gagal, dan coba lagi.
- Pengguna memilih tahun lahir yang hanya disimpan lokal.
- Usia di bawah 10 tahun diblokir dengan pesan ramah.
- Usia 10–17 tahun dapat memakai seluruh fitur P0, tetapi tidak melihat akun, sinkronisasi, atau AI dialogue.
- Usia 18 tahun ke atas memiliki akses penuh.
- Peringatan kehilangan data lokal ditampilkan.
- Bahasa/dialek hanya menampilkan paket yang terpasang.
- Onboarding selesai secara durable dan tidak muncul kembali setelah restart.
- Setelah selesai, pengguna masuk ke Kosakata unit pertama.

## Phase 1 — Audit Kontrak Plan 3 dan Data Lokal

- Pastikan `app_metadata`, `settings`, dan `installed_packages` mendukung onboarding, profil, dan status instalasi.
- Tetapkan key lokal: `birth_year`, `selected_package_id`, `intro_dismissed`, dan `age_gate_status`.
- Tambahkan tipe `LocalProfile`, `AgeCategory`, `OnboardingState`, dan `LanguageDialectOption`.
- Pastikan tahun lahir tidak masuk logger, learning event, request network, atau payload sinkronisasi.

**Dependency:** repository SQLite dan metadata dari Plan 3.

## Phase 2 — Domain Age Gate dan Onboarding Rules

Files:

- `src/domain/onboarding/ageGate.ts`
- `src/domain/onboarding/onboardingTypes.ts`
- `tests/unit/onboarding/ageGate.test.ts`
- `tests/unit/onboarding/onboardingRules.test.ts`

Implementasi:

- Hitung usia berdasarkan tahun lahir dan tanggal lokal perangkat.
- Kategori: usia `< 10` `blocked`, usia `10–17` `minor`, usia `>= 18` `adult`.
- Validasi tahun lahir: valid, tidak di masa depan, maksimum masuk akal, dan tidak menerima nilai kosong/parsial.
- Capability P0 tersedia untuk `minor` dan `adult`.
- Account, sync, dan AI hanya untuk `adult`.
- Semua capability ditolak untuk `blocked`.
- Uji boundary usia 9/10, 17/18, pergantian tahun, dan ulang tahun.

**Dependency:** `Clock` dari Plan 1.

## Phase 3 — Local Profile dan Repository

Files:

- `src/features/onboarding/domain/localProfile.ts`
- `src/features/onboarding/data/localProfileRepository.ts`
- `src/features/settings/data/settingsRepository.ts`
- `src/infrastructure/database/SQLiteMetadataStore.ts`
- `src/infrastructure/database/repositories/SQLiteSettingsRepository.ts`
- `tests/integration/database/local-profile.test.ts`

Implementasi:

- Buat repository khusus profil lokal.
- Simpan tahun lahir hanya di SQLite internal app storage.
- Sediakan operasi membaca profil, menyimpan tahun lahir, membaca kategori usia, membaca/menyimpan package aktif, membaca state onboarding, dan menyelesaikan onboarding.
- Operasi harus idempotent dan aman ketika aplikasi dihentikan.
- SQLite menjadi source of truth; jangan menduplikasi profil ke AsyncStorage/cache.
- Hanya package berstatus `active` yang dapat dipilih.
- Jika package aktif belum tersedia, kembalikan state yang dapat dipulihkan, bukan crash.

**Risk:** penulisan profil dan onboarding harus atomic agar tidak menghasilkan state setengah selesai.

## Phase 4 — Onboarding Orchestrator

Files:

- `src/features/onboarding/application/loadOnboardingState.ts`
- `src/features/onboarding/application/submitBirthYear.ts`
- `src/features/onboarding/application/selectLanguageDialect.ts`
- `src/features/onboarding/application/completeOnboarding.ts`
- `src/features/onboarding/application/installBundledPackageForOnboarding.ts`
- `tests/unit/onboarding/application.test.ts`

State yang didukung:

- `loading`
- `intro`
- `installing-package`
- `select-language`
- `local-data-warning`
- `birth-year`
- `blocked`
- `ready`
- `error`

Aturan:

- Gunakan use case instalasi package yang sama dengan jalur normal.
- Tidak melakukan network request.
- Setelah instalasi sukses, verifikasi package aktif dan simpan pilihan package.
- `completeOnboarding` hanya menulis status selesai setelah tahun lahir valid, package aktif tersedia, package tersimpan, dan warning lokal diakui.
- Jika instalasi gagal, onboarding tetap incomplete dan staging dibersihkan.
- Jika aplikasi mati saat instalasi, startup recovery melanjutkan atau membersihkan staging.

## Phase 5 — UI Onboarding dan Age Gate

Files:

- `src/app/onboarding.tsx`
- `src/features/onboarding/components/IntroStep.tsx`
- `src/features/onboarding/components/PackageInstallStep.tsx`
- `src/features/onboarding/components/LanguageDialectStep.tsx`
- `src/features/onboarding/components/LocalDataWarningStep.tsx`
- `src/features/onboarding/components/BirthYearStep.tsx`
- `src/features/onboarding/components/AgeBlockedScreen.tsx`
- `src/features/onboarding/components/OnboardingProgress.tsx`

Implementasi:

- Ganti layar onboarding saat ini dengan alur maksimal tiga layar dan tombol Lewati.
- Sediakan input tahun lahir dengan validasi inline.
- Jangan tampilkan tahun lahir dalam log.
- Tampilkan pesan ramah untuk usia di bawah 10 tahun tanpa opsi bypass.
- Untuk usia 10–17 tahun, sembunyikan entry point account, sync, dan AI.
- Jika hanya satu package aktif, pemilih bahasa dapat dilewati tetapi `selected_package_id` tetap disimpan.
- Tambahkan accessibility role/label, fokus ke error, disable tombol saat loading, dan dukungan layar kecil/font besar.

## Phase 6 — Runtime, Capability, dan Routing Integration

Files:

- `src/bootstrap/AppBootstrap.tsx`
- `src/bootstrap/DependencyContainer.ts`
- `src/bootstrap/bootstrapTypes.ts`
- `src/app/index.tsx`
- `src/app/_layout.tsx`
- `src/features/onboarding/application/routeAfterOnboarding.ts`

Implementasi:

- Daftarkan repository dan use case onboarding ke dependency container.
- Sediakan onboarding state, local profile, age capability, dan retry operation melalui runtime.
- Baca status onboarding setelah migration, package recovery, dan bundled package verification selesai.
- Routing: belum selesai ke `/onboarding`, blocked ke age gate, selesai ke `/(tabs)/kata`.
- Setelah restart, onboarding tidak muncul lagi jika status sudah durable.
- Semua query vocabulary dan progress memakai `selected_package_id`.
- Route screen tidak boleh mengakses SQLite langsung.

## Phase 7 — Language/Dialect Isolation

Files:

- `src/features/onboarding/application/selectLanguageDialect.ts`
- `src/features/packages/data/packageRepository.ts`
- `src/features/progress/data/progressRepository.ts`
- `tests/integration/onboarding/package-selection.test.ts`
- `tests/integration/progress/package-isolation.test.ts`

Implementasi:

- Query hanya package dengan `install_state = 'active'`.
- Tampilkan bahasa/dialek dari metadata package, bukan hardcoded UI.
- Tolak package staging, failed, atau tidak terpasang.
- Pergantian package tidak boleh menghapus learning events atau mencampur mastery antar-package.
- Tambahkan fixture dua package/dialek untuk membuktikan isolasi.

## Phase 8 — Dokumentasi dan Traceability

Files:

- `docs/implementation_plan/imp_4.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/requirements-traceability.md`
- `docs/accessibility.md`
- `docs/design/user-flows.md`
- `docs/design/screen/onboarding.md`

Dokumentasikan:

- key settings dan lifecycle onboarding;
- diagram state onboarding dan age gate;
- fakta bahwa tahun lahir hanya lokal;
- traceability FR-01, FR-02, FR-03, FR-50, FR-52, dan FR-54;
- batasan P0: belum ada account, sync, package download, parental consent, dan AI dialogue;
- recovery ketika instalasi package gagal atau proses mati.

## Dependencies

- Plan 1: `Clock`, `DeviceIdentity`, startup runner, error mapping, dependency container.
- Plan 2: bundled package source, validator, atomic installer, identity/version rules.
- Plan 3: SQLite, migrations, metadata/settings repository, installed package repository, progress snapshot/rebuild.
- Expo Router dan React Native UI.
- Tidak membutuhkan Supabase, account, network, atau API eksternal.

## Risks and Mitigations

- Onboarding selesai sebelum package/profile durable: gunakan completion use case atomic dan acceptance test setelah restart.
- Progress antar-package tercampur: semua query wajib memakai `package_id` dan diuji dengan dua package.
- Tahun lahir bocor ke log/network: sanitasi logger, static grep test, dan test tanpa network.
- Race condition startup dan routing: routing hanya setelah `StartupStatus = ready`.
- Instalasi setengah jadi: gunakan atomic installer dan recovery marker.
- Perhitungan usia salah: gunakan `Clock` dan boundary tests.
- Tombol ditekan berulang: disable selama operation dan gunakan command idempotent.
- Package nonaktif tampil: query hanya package active dan validasi ulang saat selection.
- Layout tidak sesuai perangkat: accessibility test, perangkat kecil, dan font scale 200%.

## Testing Strategy

### Unit

- Age calculation dan age category.
- Invalid birth year.
- Onboarding state transitions.
- Capability gating.

### Integration

- Profile persistence.
- Onboarding completion persistence.
- Package selection dan isolation.
- Failed install cleanup.
- Restart setelah onboarding.

### E2E

- Fresh install dalam airplane mode.
- Intro skip.
- Bundled install progress.
- Usia di bawah 10 tahun.
- Usia 10–17 tahun.
- Usia 18 tahun ke atas.
- Restart setelah onboarding.
- Masuk ke Kosakata unit pertama.

### Privacy and security

- Tahun lahir tidak muncul di logger.
- Tidak ada network request saat onboarding P0.
- Account/AI tidak tampil untuk minor.

### Verification commands

```bash
npm test
npm run typecheck
npm run lint
npm run doctor
```

## Build Sequence

1. Audit kontrak Plan 3 dan data lokal.
2. Implementasikan tipe domain dan age gate.
3. Implementasikan migration/repository profil lokal.
4. Implementasikan onboarding orchestrator.
5. Tambahkan UI onboarding dan age gate.
6. Integrasikan runtime, capability, dan routing.
7. Tambahkan isolasi package/dialek.
8. Tambahkan unit, integration, E2E, privacy, dan accessibility tests.
9. Perbarui dokumentasi dan requirements traceability.
10. Jalankan seluruh verification loop.

## Definition of Done

- [ ] Fresh install airplane mode berhasil sampai Kosakata unit 1.
- [ ] Paket bundel terpasang atomic dan dapat dipulihkan.
- [ ] Onboarding selesai tersimpan setelah restart.
- [ ] Tahun lahir hanya tersimpan lokal.
- [ ] Usia di bawah 10 tahun diblokir.
- [ ] Usia 10–17 tahun tetap dapat menggunakan seluruh fitur P0.
- [ ] Account, sync, dan AI tidak tampil untuk minor.
- [ ] Package selection hanya memakai package aktif.
- [ ] Progres antar-package/dialek terisolasi.
- [ ] FR-01, FR-02, FR-03, FR-50, FR-52, dan FR-54 memiliki evidence.
- [ ] Test, lint, typecheck, dan doctor lulus.
