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

## Startup & Blank Slate Principle

1. Aplikasi dimulai dalam kondisi kosong murni (*blank slate*) tanpa paket bawaan yang terpasang.
2. Membuka database SQLite lokal `clata.db` dan menjalankan migrasi skema tabel dasar (`app_settings` dan `installed_packages`).
3. Memeriksa status `onboarding_completed` dan `active_package_id` di `app_settings`:
   - Jika onboarding selesai dan paket aktif terdaftar: langsung navigasi ke `/(tabs)/kata`.
   - Jika belum: arahkan pengguna ke alur onboarding (`/onboarding/intro-1`).
4. Penyimpanan paket biner asli (`.clata`) terisolasi di internal storage (`packages/installed/<packageId>/bundle.clata`) dan sepenuhnya terpisah dari database personal pengguna.

## Package Lifecycle (Schema Version 2)

`pilih berkas lokal (.clata/.zip) → stage temporary files → safe extract (fflate) → cek kontaminasi data personal → verifikasi checksum SHA-256 → verifikasi tanda tangan Ed25519 (JCS RFC 8785) → validasi konten Schema v2 (bebas level, 3 register, kalimat utuh, dialog audio) → persist SQLite record → atomic activation`.

Seluruh tahapan pemasangan memancarkan event progres real-time (`READING_ARCHIVE` 10%, `EXTRACTING_FILES` 30%, `VERIFYING_CHECKSUMS` 55%, `VERIFYING_SIGNATURE` 75%, `VALIDATING_CONTENT` 90%, `SAVING_STORAGE` 95%, `COMPLETED` 100%) sehingga antarmuka pengguna dapat menampilkan progres instalasi sesungguhnya.

## Diagrams

The implementation SHOULD maintain Mermaid diagrams for system context, package installation, learning event flow, and P1 synchronization in the relevant feature documentation or ADR.
