# Clata P0 Implementation Plan

Dokumen ini memetakan pekerjaan menuju pencapaian P0 menjadi delapan kelompok implementation plan. P0 mencakup pengalaman belajar offline dengan paket Jawa-Mataraman yang dibundel di aplikasi.

## Status dokumen

Plan 1 dan Plan 2 telah memiliki foundation implementation. Plan 3 dirinci sebagai blueprint SQLite dan progress engine. Plan 4 mendetailkan onboarding dan profil lokal. Plan 5 mendetailkan vocabulary dan audio. Plan 6 mendetailkan sesi latihan offline (Guess the Word dan Fill the Gap). Plan 7 mendetailkan percakapan kurasi (Curated Dialogue) dan tantangan dunia nyata (Challenges). Plan 8 mendetailkan pengaturan, manajemen data/reset (FR-55), halaman Tentang & kepatuhan (FR-56), audit aksesibilitas, pengujian mode pesawat, dan release gate rilis P0.

## Pembagian implementation plan

| # | Implementation plan | PRD scope | Module utama | Evidence/test | Dependensi | Prioritas |
|---|---|---|---|---|---|---|
| 1 | **P0 Foundation & Runtime** ([detail](./imp_1.md)) | Architecture invariants, runtime state | `src/bootstrap`, `src/domain`, `src/features/*/application` | Architecture boundary test, startup recovery test | Tidak ada | P0-1 |
| 2 | **Content Package & Bundled Install** ([detail](./imp_2.md)) | FR-80..82, FR-90 | `src/features/packages`, `tools/content-builder`, `content/packages` | Package contract, signature/checksum, atomic install test | Plan 1 | P0-1 |
| 3 | **SQLite & Progress Engine** ([detail](./imp_3.md)) | FR-12, FR-60..62, FR-80..82 persistence | `src/infrastructure/database`, `src/features/progress` | Migration, replay/property, reset and statistics tests | Plan 1-2 | P0-1 |
| 4 | **Onboarding & Local Profile** ([detail](./imp_4.md)) | FR-01..03, FR-50, FR-52, FR-54 | `src/features/onboarding`, `src/features/settings` | Airplane onboarding E2E, age-gate and local-data tests | Plan 2-3 | P0-2 |
| 5 | **Vocabulary & Audio** ([detail](./imp_5.md)) | FR-10..12 | `src/features/vocabulary`, `src/infrastructure/audio` | Offline vocabulary/audio E2E, repository and viewed-log tests | Plan 2-3 | P0-2 |
| 6 | **Practice Sessions** ([detail](./imp_6.md)) | FR-20..24 | `src/features/practice`, `src/domain/services` | Picker, distractor, answer, feedback tests; offline E2E | Plan 3-5 | P0-3 |
| 7 | **Curated Dialogue & Challenge** ([detail](./imp_7.md)) | FR-30..32, FR-34..35, FR-70..72 | `src/features/dialogues`, `src/features/challenges` | Graph/audio contract, offline playback, no-progress invariant, dialogue E2E | Plan 2-3 | P0-3 |
| 8 | **Settings, QA & P0 Release Gate** ([detail](./imp_8.md)) | FR-55..56, all P0 NFRs | `src/features/settings`, `tests/e2e`, release evidence | Reset/About/accessibility/airplane-mode/release checklist | Plan 1-7 | P0-4 |

## Data flow utama

```text
Bundled content package
        ↓
Package validation and atomic install
        ↓
SQLite content tables
        ↓
Feature use cases
        ↓
Vocabulary / Practice / Dialogue / Challenge screens
        ↓
Append-only learning events
        ↓
Replay and derived progress caches
        ↓
Mastery / streak / statistics
```

## Urutan implementasi

1. **Foundation & Runtime** — siapkan batas arsitektur dan startup.
2. **Content Package & Bundled Install** — sediakan sumber konten offline yang valid.
3. **SQLite & Progress Engine** — sediakan penyimpanan dan aturan progres.
4. **Onboarding & Local Profile** — hubungkan instalasi paket dengan pengalaman pengguna baru.
5. **Vocabulary & Audio** — bangun vertical slice belajar pertama.
6. **Practice Sessions** — tambahkan latihan berbasis bank konten dan progres.
7. **Curated Dialogue & Challenge** — lengkapi fitur belajar P0 lainnya.
8. **Settings, QA & P0 Release Gate** — hardening, verifikasi, dan bukti rilis.

## Acceptance gate per kelompok

### Plan 1 — Foundation & Runtime

- `src/app/` hanya berisi route dan komposisi UI.
- Domain tidak mengimpor React, Expo, SQLite, Zustand, atau Supabase.
- Startup membuka database, menjalankan migration, dan menampilkan recovery state bila gagal.
- Semua operasi async memiliki state loading, success, error, dan empty/offline bila relevan.

### Plan 2 — Content Package & Bundled Install

- Paket hanya berisi Jawa-Mataraman untuk P0.
- Manifest, referensi item, graph dialog, audio, checksum, status konten, dan signature tervalidasi.
- Signature Ed25519 diverifikasi menggunakan canonical payload, `key_id`, dan daftar key aktif/revoked.
- Signature invalid, unknown key, revoked key, duplicate path, dan representasi non-canonical ditolak.
- Path arsip dinormalisasi ke separator `/`, harus relatif, tidak boleh absolut atau mengandung `..`, lalu diurutkan dan dicek duplikasinya sebelum checksum/reference validation.
- Contract test mencakup traversal, absolute path, mixed separator, duplicate alias setelah normalisasi, checksum mismatch, dan referensi file yang tidak ada.
- Instalasi atomic; paket rusak tidak mengubah paket aktif.
- Paket dapat dipasang tanpa jaringan.

### Plan 3 — SQLite & Progress Engine

- Migration berjalan transaksional.
- Learning event bersifat append-only dan idempotent.
- Strength dan mastery dapat dibangun ulang dari event.
- Streak global dan statistik per paket/dialek mengikuti aturan PRD.

### Plan 4 — Onboarding & Local Profile

- Pembukaan pertama dalam mode pesawat berhasil.
- Usia di bawah 10 tahun diblokir dengan pesan yang ramah.
- Usia 10–17 tahun tetap dapat menggunakan semua fitur P0 tanpa akun.
- Tahun lahir hanya tersimpan lokal.
- Progres onboarding tersimpan dan tidak selalu mengulang onboarding.

### Plan 5 — Vocabulary & Audio

- Daftar kata mengikuti urutan kurikulum.
- Search mengabaikan variasi ejaan yang dipersyaratkan.
- Kata yang tampil minimal satu detik dicatat sebagai viewed.
- Audio dapat diputar offline dan memiliki label aksesibilitas.
- Metadata audio memuat format, durasi, channel, dan sample rate.
- Format Opus mono diuji pada Android dan iOS yang didukung. AAC/M4A hanya menjadi fallback bila platform baru membutuhkannya.
- Audio yang tidak tersedia menampilkan status yang jelas tanpa tombol playback rusak.

### Plan 6 — Practice Sessions

- Guess the Word memiliki empat pilihan dan tiga arah soal.
- Fill the Gap hanya memakai kata yang telah dilihat.
- Distraktor berasal dari bank konten dan tidak memiliki dua jawaban benar.
- Bank kecil menghasilkan fallback yang informatif, bukan sesi kosong atau crash.
- Jawaban, feedback, audio, dan contoh kalimat tersedia offline.

### Plan 7 — Curated Dialogue & Challenge

- Graph dialog tidak memiliki orphan node atau dead end.
- Setiap baris dialog memiliki referensi audio yang tervalidasi dan dapat diputar offline bila audio tersedia.
- Pilihan register dan pemahaman mengikuti aturan PRD.
- Opsi tidak nyambung mengulang node yang sama tanpa membuat node baru.
- Setiap ending memiliki feedback.
- Challenge tidak menambah streak, mastery, statistik, atau learning event.

### Plan 8 — Settings, QA & P0 Release Gate

- Reset progres per paket memakai konfirmasi dua langkah.
- Hapus semua data mengembalikan aplikasi ke kondisi baru.
- About menampilkan versi, paket, kredit, lisensi, privasi, dan batas usia.
- Airplane-mode journey lulus dari install sampai belajar.
- Accessibility diuji dengan screen reader, layar kecil, dan font 200%.
- Build hanya membawa paket Jawa-Mataraman dan seluruh evidence rilis diarsipkan.

## Test matrix minimum

| Jenis test | Target |
|---|---|
| Domain unit test | Mastery, replay, streak, picker, age gate, package rules |
| Application test | Use case dan error mapping |
| SQLite integration test | Migration, transaction, reset, replay |
| Package contract test | Schema, referensi, audio, checksum, install atomic |
| Component/UI test | Loading, empty, error, offline, accessibility state |
| E2E | Onboarding, kosakata, latihan, dialog, challenge dalam mode pesawat |
| Failure test | Process kill, disk penuh, paket rusak, duplicate event, migration failure |

## Definition of done P0

P0 dianggap selesai bila:

1. Semua FR P0 memiliki module, contract, test, dan evidence pada requirements traceability.
2. Full airplane-mode journey lulus.
3. Paket Jawa-Mataraman terpasang dan tervalidasi secara atomic.
4. Tidak ada progres yang hilang setelah restart aplikasi.
5. Mastery, streak, dan statistik dapat direbuild dari learning events.
6. Lint, typecheck, unit/integration/contract test, E2E relevan, accessibility check, dan security review lulus.
7. Build, checksum paket, test report, dan release notes diarsipkan.

## Di luar scope P0

Fitur berikut tidak boleh menghambat penyelesaian P0:

- Supabase Auth dan sinkronisasi.
- Dialog AI.
- Unduh, impor, ekspor, dan hapus paket tambahan.
- Pengingat lokal.
- Portal kontributor dan signed catalog.
- Paket bahasa/dialek tambahan.
- Delta package dan parental consent.
