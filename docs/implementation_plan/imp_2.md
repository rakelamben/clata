# P0 Implementation Plan 2 — Content Package & Bundled Install

## 1. Tujuan

Menghasilkan paket konten Jawa-Mataraman yang valid, bertanda tangan, dan dapat dipasang secara atomic dari bundle aplikasi tanpa jaringan. Plan ini melanjutkan handoff Plan 1 dengan mengintegrasikan capability `verifyBundledPackage`, startup recovery, error model, dan dependency container.

Setelah plan ini selesai, aplikasi memiliki sumber konten offline yang dapat dipercaya untuk Plan 3–8: kata, kalimat, dialog kurasi, challenge, audio, metadata, dan informasi provenance.

## 2. PRD scope

| Requirement | Implementasi |
|---|---|
| FR-80 | Paket Jawa-Mataraman dibundel dan dipasang saat startup pertama tanpa internet |
| FR-81 | Satu paket mandiri untuk satu kombinasi bahasa-dialek |
| FR-82 | Update paket bundel melalui update aplikasi dan mempertahankan progres berdasarkan stable ID |
| FR-90 | Admin menyusun JSON/spreadsheet dan builder menghasilkan paket bertanda tangan |
| Architecture startup | `verifyBundledPackage`, recovery interrupted install, atomic activation |

## 3. Prasyarat dari Plan 1

- `DependencyContainer` tersedia di `src/bootstrap`.
- `StartupRunner` memiliki step `verifyBundledPackage`.
- Startup menggunakan recovery state dan retry.
- `AppError` serta error mapping tersedia.
- `Clock`, `DeviceIdentity`, dan `Logger` dapat digunakan adapter package.
- Startup handlers wajib idempotent atau transactional.
- Architecture boundary test sudah aktif.

## 4. Keputusan format package

Spesifikasi repository saat ini menetapkan:

- Archive resmi: `.clata`.
- `.zip` diterima sebagai compatibility fallback.
- PRD FR-85 menyebut `.skpaket`.

Untuk implementasi P0, keputusan plan ini adalah:

1. Gunakan `.clata` sebagai format archive resmi sesuai spesifikasi teknis.
2. `.zip` diterima sebagai fallback compatibility.
3. `.skpaket` dicatat sebagai alias input untuk P1 dan bukan format archive berbeda; PRD perlu diselaraskan sebelum FR-85/87 dibangun.
4. P0 tidak mengekspor package, sehingga output bundle memakai `.clata`.
5. Nama file tidak menjadi sumber kepercayaan; archive dan manifest selalu divalidasi.
6. Output ekspor P1 harus mempertahankan archive byte-for-byte agar checksum dan signature tetap valid.

## 5. Struktur package

```text
clata-jawa-mataraman-v1.clata
├── manifest.json
├── unit.json
├── kata.json
├── kalimat.json
├── dialog.json
├── challenge.json
├── audio/
│   ├── kata/<item-id>.opus
│   ├── kalimat/<item-id>.opus
│   └── dialog/<line-id>.opus
└── tanda-tangan
```

### Manifest minimum

Manifest harus memuat:

- `package_id`.
- `language_id`.
- `dialect_id`.
- `package_version`.
- `schema_version`.
- `minimum_app_version`.
- `register_mapping`.
- `orthography_reference`.
- `created_at`.
- `item_counts`.
- `files` dengan path, size, dan lowercase SHA-256.
- `key_id`.
- `signature_reference`.

Semua item harus memiliki stable ID yang unik dalam package. Progress Plan 3 akan memakai key `(package_id, item_id)`.

## 6. Struktur folder target

```text
content/
  packages/
    jawa-mataraman/
      source/
        manifest.json
        unit.json
        kata.json
        kalimat.json
        dialog.json
        challenge.json
        audio/
      README.md
      package.config.json

tools/
  content-builder/
    src/
      cli.ts
      buildPackage.ts
      validateContent.ts
      validateManifest.ts
      canonicalize.ts
      checksum.ts
      signPackage.ts
      archive.ts
      errors.ts
    fixtures/
    package.json

src/
  features/packages/
    application/
      verifyBundledPackage.ts
      installPackage.ts
      recoverPackageInstall.ts
    domain/
      packageTypes.ts
      packageErrors.ts
      packageVersion.ts
    data/
      packageRepository.ts
    infrastructure/
      bundledPackageSource.ts
      packageArchive.ts
      packageValidator.ts
      packageSignatureVerifier.ts
      packageStorage.ts

tests/
  unit/packages/
  integration/packages/
  contract/packages/
  fixtures/packages/
```

## 7. Kontrak domain

### Package identity

```ts
export type PackageIdentity = {
  packageId: string;
  languageId: string;
  dialectId: string;
  packageVersion: string;
  schemaVersion: number;
};
```

Invariant:

- `packageId` stabil antar-update.
- `languageId` dan `dialectId` tidak boleh berubah dalam package yang sama.
- `packageVersion` memakai SemVer `MAJOR.MINOR.PATCH` dan dibandingkan menurut SemVer, bukan perbandingan string/nilai numerik.
- Versi sama bersifat idempotent; versi lebih rendah ditolak; versi lebih tinggi diproses sebagai update.
- Perubahan makna item harus menghasilkan item ID baru.
- Koreksi ejaan/audio mempertahankan item ID.

### Install state

```ts
export type PackageInstallState =
  | 'staged'
  | 'validating'
  | 'ready-to-activate'
  | 'active'
  | 'failed'
  | 'recoverable';
```

State staging tidak boleh terlihat sebagai package aktif oleh query fitur.

### Validation result

```ts
export type PackageValidationResult =
  | { ok: true; identity: PackageIdentity; fileCount: number; totalBytes: number }
  | { ok: false; reasonCode: PackageRejectReason };
```

Reason code harus stabil dan dapat dipetakan ke pesan UI tanpa membocorkan detail sensitif.

Minimum reason code:

- `ARCHIVE_TOO_LARGE`.
- `TOO_MANY_ENTRIES`.
- `UNSAFE_PATH`.
- `DUPLICATE_PATH`.
- `INVALID_MANIFEST`.
- `UNSUPPORTED_SCHEMA`.
- `APP_VERSION_TOO_LOW`.
- `INVALID_SIGNATURE`.
- `UNKNOWN_KEY`.
- `REVOKED_KEY`.
- `NON_CANONICAL_SIGNATURE`.
- `CHECKSUM_MISMATCH`.
- `SIZE_MISMATCH`.
- `UNSUPPORTED_LANGUAGE`.
- `UNSUPPORTED_DIALECT`.
- `LOWER_PACKAGE_VERSION`.
- `DUPLICATE_PACKAGE_VERSION`.
- `INVALID_REFERENCE`.
- `INVALID_DIALOG_GRAPH`.
- `INVALID_AUDIO_METADATA`.
- `UNVERIFIED_PUBLIC_CONTENT`.
- `INSUFFICIENT_STORAGE`.
- `INSTALL_INTERRUPTED`.

## 8. Pipeline builder konten

### Tahap 1 — Input normalization

1. Terima source JSON canonical atau hasil ekspor spreadsheet.
2. Spreadsheet P0 memakai format CSV UTF-8 dengan header canonical yang sama dengan JSON; kolom nested memakai JSON string.
3. Builder menyediakan column mapping versioned dan fixture CSV untuk unit, kata, kalimat, dialog, dan challenge.
4. Normalisasi line ending dan encoding UTF-8 tanpa BOM.
5. Normalisasi ID, enum, register, status, dan path audio.
6. Tolak field wajib yang kosong.
7. Tolak duplicate ID dalam satu entity atau lintas entity yang tidak semestinya.
8. Simpan source input asli di luar archive rilis untuk audit.

### Resource limits

Builder dan mobile validator menggunakan satu constants contract. Nilai awal P0:

| Limit | Nilai | Reason |
|---|---:|---|
| Compressed archive size | 10 MiB | PRD package-size target |
| Archive entry count | 1,000 | Decompression-bomb protection |
| Total uncompressed size | 30 MiB | Memory/storage protection |
| Single file size | 2 MiB | Oversized content/audio protection |
| Maximum path depth | 8 segments | Safe extraction boundary |
| JSON file size | 5 MiB | Parser resource protection |
| Audio duration | 6 seconds | PRD audio limit |

Semua limit menjadi named constants, dilaporkan dalam reject reason, dan diuji pada boundary `limit - 1`, `limit`, dan `limit + 1`.

### Tahap 2 — Content validation

Validasi:

- Unit memiliki urutan unik.
- Kata memiliki glosa, kelas kata, register, tema, unit, status, provenance, license, dan audio status.
- Kalimat memiliki terjemahan, unit, register, status, provenance, dan referensi kata yang valid.
- Kata rumpang Fill the Gap termasuk dalam kata yang tersedia.
- Dialog memiliki node awal, node yang reachable, pilihan valid, dan ending.
- Dialog memiliki 6–10 giliran, 2–3 titik pilihan, dan 2–3 opsi di setiap titik.
- Dialog memiliki maksimal 5 kata baru yang belum diajarkan pada unit sebelumnya.
- Dialog tidak memiliki orphan node atau dead end.
- Choice register tidak memiliki opsi tidak nyambung.
- Choice pemahaman memiliki minimal satu opsi nyambung dan satu opsi tidak nyambung.
- Feedback ending tersedia untuk semua ending.
- Repair response melekat pada opsi dan kembali ke node yang sama.
- Challenge mereferensikan item yang ada dan memiliki varian solo serta sosial.
- Sentence tingkat L1/L2/L3 masing-masing maksimal 8/12/16 kata.
- Setiap kalimat memiliki tepat satu rumpang.
- Distraktor berasal dari bank dengan kelas kata dan register yang sama; semantic near-synonym yang juga benar ditolak.
- Tidak ada topik terlarang atau data pribadi yang tidak diperlukan.

### Tahap 3 — Provenance dan verifikasi

Setiap item mencatat:

- source;
- method;
- contributor;
- verifier;
- revision;
- license/consent metadata;
- register;
- unit;
- audio status.

Aturan:

- Contributor dan verifier harus berbeda.
- Status `poc` hanya boleh untuk fixture development/POC.
- Package publik tidak boleh berisi `poc` atau item belum terverifikasi.
- Audio harus memiliki consent tertulis.
- AI tidak boleh menjadi satu-satunya sumber linguistik atau verifier.

### Tahap 4 — Audio validation

Validasi setiap audio:

- Reference file ada di archive.
- Format, duration, channel count, dan sample rate tersedia.
- Audio target P0 adalah Opus mono.
- Accepted initial sample rates are 24 kHz and 48 kHz; any other rate is rejected until device-matrix evidence adds it.
- Metadata item sesuai dengan metadata file.
- File kosong, corrupt, atau tidak dapat dibaca ditolak.
- Package publik menolak audio yang hilang; item tanpa audio hanya boleh berstatus `poc` pada fixture non-rilis.
- Durasi audio kata, kalimat, dan baris dialog maksimal 6 detik.

### Tahap 5 — Manifest dan checksum

1. Kumpulkan seluruh archive entry.
2. Ubah separator menjadi `/`.
3. Tolak absolute path dan segment `..`.
4. Urutkan path menurut UTF-8 byte order.
5. Tolak duplicate path setelah normalisasi.
6. Hitung byte size dan lowercase SHA-256.
7. Pastikan `item_counts` sama dengan jumlah hasil parse.
8. Buat canonical manifest envelope.

### Tahap 6 — Signing

Signature menggunakan:

- Ed25519.
- JCS/RFC 8785.
- UTF-8 tanpa BOM.
- Object signed `{ manifest, files }` tanpa field signature.
- `tanda-tangan` berisi `algorithm`, `key_id`, `encoding: base64url`, dan `signature`.

Private signing key tidak boleh berada di repository, mobile app, atau daily development device. Signing dilakukan pada environment terproteksi.

### Key registry aplikasi

Validator mobile membawa public key registry berikut:

- active key utama;
- backup key untuk rotasi/failure recovery;
- `key_id` unik;
- status `active` atau `revoked`;
- effective/revocation metadata.

Registry memakai tiga state:

- `active`: boleh menandatangani dan memvalidasi package baru.
- `retired`: tidak boleh menandatangani package baru, tetapi tetap memvalidasi package lama yang sudah terpasang atau masih dalam compatibility window.
- `revoked`: tidak boleh memvalidasi package baru maupun mengaktifkan ulang archive baru.

Package aktif yang kemudian memakai key revoked tidak dihapus otomatis dan learning data tidak disentuh. Aplikasi mencatat trust warning, menolak update/reinstall dengan key tersebut, dan menunggu package pengganti dengan key aktif. Private key tidak pernah dibundel.

### Tahap 7 — Archive build

1. Build ke temporary directory.
2. Tulis file canonical.
3. Buat archive dengan entry order deterministik.
4. Pastikan archive tidak menyertakan source rahasia, private key, atau file sementara.
5. Tulis checksum archive dan build metadata di luar archive.
6. Jalankan validation ulang terhadap archive final.
7. Hanya archive final yang diserahkan ke aplikasi sebagai asset bundle.

## 9. Package validator di aplikasi

Validator aplikasi harus menggunakan urutan berikut:

1. Check ukuran archive, jumlah entry, dan safe path.
2. Baca minimum manifest envelope.
3. Check schema/app version.
4. Verify Ed25519 signature dan key status.
5. Verify semua checksum dan declared size.
6. Verify language/dialect yang didukung.
7. Verify package version.
8. Verify item references, graph reachability, audio references, dan semantic content rules.
9. Check storage capacity.
10. Commit install secara atomic.

Public release juga memerlukan verifier metadata. Dialog dan dialek baru membutuhkan dua verifier; kata dan kalimat membutuhkan minimal satu verifier yang berbeda dari contributor.

### Update semantics FR-82

- Package ID dan language/dialect harus sama saat update.
- Versi lebih tinggi menggantikan content aktif secara atomic.
- Learning events lama tidak dihapus atau diubah.
- Item dengan ID sama mempertahankan event dan progres.
- Item yang dihapus tidak masuk divisor versi baru, tetapi event lama tetap tersimpan.
- Perubahan makna wajib memakai ID baru dan mulai dari progres nol.
- Koreksi ejaan/audio mempertahankan ID.
- Package ID berbeda bukan update dan tidak boleh mengganti package aktif.
- Versi sama tidak menulis ulang content bila checksum archive sama; checksum berbeda pada versi sama ditolak.
- Setelah activation, Plan 3 melakukan rebuild derived progress dari event dan content versi aktif.

Bundled package wajib melewati validator yang sama dengan jalur package lain pada P1. Perbedaan hanya pada source dan kapan install dijalankan.

## 10. Atomic bundled install

### Flow

```text
bundle asset
   ↓
stage temporary package
   ↓
safe extract/read
   ↓
validate manifest/signature/checksum/content
   ↓
check capacity
   ↓
write staging records/files
   ↓
atomic activation
   ↓
rebuild package indexes
   ↓
mark active
```

### Invariant

- Tidak ada fitur yang membaca staging package.
- Metadata active berubah hanya setelah seluruh validasi dan persistence sukses.
- Jika proses mati sebelum activation, startup recovery menghapus staging atau melanjutkan commit dengan aman.
- Jika proses mati setelah activation, startup melakukan consistency check.
- Package lama tetap aktif bila package baru gagal.
- Install ulang versi sama bersifat idempotent.
- Package yang invalid tidak mengubah data existing.

## 11. Integrasi dengan Plan 1

### `verifyBundledPackage`

Implementasikan use case yang dipanggil startup:

```ts
export interface VerifyBundledPackage {
  execute(): Promise<PackageValidationResult>;
}
```

Perilaku:

1. Cek apakah package aktif sudah ada.
2. Bila ada, bandingkan versi aktif dengan versi bundle menggunakan SemVer.
3. Bila sama dan valid, return success tanpa install ulang.
4. Bila bundle lebih tinggi, stage bundle dan lakukan atomic upgrade.
5. Bila bundle lebih rendah, pertahankan versi aktif dan catat downgrade rejection.
6. Bila tidak ada, stage bundled archive.
7. Jalankan validator lengkap.
8. Install secara atomic.
9. Return package identity yang aktif.
10. Bila gagal, return typed package error ke `StartupRunner`.

Startup harus tetap recovery-required bila bundle wajib tidak dapat diverifikasi. Tidak boleh fallback ke aplikasi kosong yang tampak siap.

### Recovery interrupted install

Implementasikan handler yang:

- membaca install marker;
- mendeteksi staging directory/table;
- memvalidasi active package metadata;
- menyelesaikan commit bila staging valid dan commit marker tersedia;
- membuang staging bila tidak valid;
- tidak menghapus active package.

Handler harus idempotent dan aman dipanggil lebih dari sekali.

## 12. File yang dibuat/dimodifikasi

### Dibuat

| File | Tujuan |
|---|---|
| `src/features/packages/domain/packageTypes.ts` | Identity, manifest, install state, validation types |
| `src/features/packages/domain/packageErrors.ts` | Stable rejection codes |
| `src/features/packages/domain/packageVersion.ts` | Version comparison rules |
| `src/features/packages/application/verifyBundledPackage.ts` | Use case startup |
| `src/features/packages/application/installPackage.ts` | Atomic install orchestration |
| `src/features/packages/application/recoverPackageInstall.ts` | Interrupted install recovery |
| `src/features/packages/infrastructure/bundledPackageSource.ts` | Read bundled asset |
| `src/features/packages/infrastructure/packageArchive.ts` | Archive entry abstraction |
| `src/features/packages/infrastructure/packageValidator.ts` | Validation pipeline |
| `src/features/packages/infrastructure/packageSignatureVerifier.ts` | Ed25519/JCS verification |
| `src/features/packages/infrastructure/packageStorage.ts` | Staging and active storage port |
| `content/packages/jawa-mataraman/README.md` | Content package authoring instructions |
| `tools/content-builder/src/validateContent.ts` | Source validation |
| `tools/content-builder/src/validateManifest.ts` | Manifest validation |
| `tools/content-builder/src/canonicalize.ts` | Canonical signature payload |
| `tools/content-builder/src/checksum.ts` | SHA-256 file checksums |
| `tools/content-builder/src/signPackage.ts` | Protected signing integration |
| `tools/content-builder/src/buildPackage.ts` | Deterministic archive build |
| `tests/contract/packages/package-manifest.test.ts` | Manifest contract |
| `tests/contract/packages/signature.test.ts` | Signature contract |
| `tests/contract/packages/content-rules.test.ts` | Content semantic rules |
| `tests/integration/packages/bundled-install.test.ts` | Atomic bundle install |
| `tests/integration/packages/bundled-update.test.ts` | Bundled SemVer update and progress preservation |
| `tests/integration/packages/recovery.test.ts` | Interrupted install recovery |
| `tests/unit/packages/path-normalization.test.ts` | Safe path rules |
| `tests/unit/packages/version-rules.test.ts` | Version behavior |

### Dimodifikasi

| File | Perubahan |
|---|---|
| `src/bootstrap/DependencyContainer.ts` | Tambahkan package validator, installer, dan recovery capability |
| `src/bootstrap/startupRecovery.ts` | Jalankan `verifyBundledPackage` dan recovery handler nyata |
| `src/bootstrap/AppBootstrap.tsx` | Mark production adapters configured setelah package capability tersedia |
| `src/domain/errors/AppError.ts` | Mapping package errors bila diperlukan |
| `package.json` | Script builder/validation dan dependency archive/crypto yang kompatibel |
| `docs/content-package-spec.md` | Keputusan ekstensi resmi dan implementasi final |
| `docs/content-authoring.md` | Fixture dan workflow Jawa-Mataraman |
| `docs/requirements-traceability.md` | Evidence FR-80..82 dan FR-90 |
| `docs/architecture.md` | Package lifecycle implementation reference |
| `docs/implementation_plan/imp_1.md` | Handoff status Plan 1 ke Plan 2 |

## 13. Test matrix

### Builder contract tests

- Manifest field hilang.
- Item ID duplikat.
- Package ID tidak stabil.
- Register mapping tidak valid.
- Item `poc` untuk public build.
- Contributor dan verifier sama.
- License/consent hilang.
- Audio reference hilang.
- Audio metadata salah.
- Sentence word reference tidak valid.
- Dialog orphan node/dead end.
- Choice register memiliki opsi tidak nyambung.
- Choice pemahaman tidak memiliki opsi nyambung.
- Challenge reference tidak valid.
- Item count mismatch.
- Dialog kurang dari 6 atau lebih dari 10 giliran.
- Dialog memiliki kurang dari 2 atau lebih dari 3 choice point.
- Choice point memiliki kurang dari 2 atau lebih dari 3 opsi.
- Dialog memiliki lebih dari 5 kata baru.
- Sentence melebihi batas 8/12/16 kata berdasarkan level.
- Sentence memiliki nol atau lebih dari satu rumpang.
- Distraktor berbeda register/kelas kata atau merupakan near-synonym yang juga valid.
- Dialog/dialek baru hanya memiliki satu verifier.
- Spreadsheet header atau column mapping tidak valid.

### Signature/checksum tests

- Signature valid.
- Signature invalid.
- Unknown key.
- Revoked key.
- Active key dan backup key rotation.
- Wrong algorithm.
- Wrong encoding.
- Non-canonical JSON.
- BOM/trailing newline.
- File checksum mismatch.
- File size mismatch.
- Duplicate normalized path.
- Mixed separator alias.
- Absolute path.
- `..` traversal.

### Atomic install tests

- Install package valid pertama kali.
- Install package invalid.
- Install versi sama.
- Install versi lebih rendah.
- Upgrade bundled package ke versi lebih tinggi dan mempertahankan progress berdasarkan stable ID.
- Reinstall setelah update tidak menggandakan content atau menghapus learning events.
- Removed item tetap memiliki learning events tetapi tidak masuk pembagi mastery versi aktif.
- Changed-meaning item dengan ID baru mulai tanpa progress lama.
- Install dengan storage tidak cukup.
- Process kill sebelum activation.
- Process kill setelah activation.
- Recovery staging valid.
- Recovery staging corrupt.
- Active package tetap utuh setelah failure.
- Repeated recovery tidak menggandakan data.

### Bundle acceptance tests

- App dapat membaca bundle tanpa network.
- Hanya Jawa-Mataraman tersedia pada P0.
- Package identity aktif benar.
- Semua content files dapat dibaca setelah install.
- Semua audio reference memiliki target yang valid.
- Startup tidak ready bila bundle invalid.
- Restart tidak meng-install ulang package aktif.
- Playback interruption, silent-mode behavior, durasi, dan package-size regression pada Android/iOS.

## 14. Acceptance criteria

Plan 2 selesai bila:

1. Fixture Jawa-Mataraman tersedia dengan seluruh file yang diwajibkan.
2. Builder menghasilkan archive deterministik dengan manifest lengkap.
3. Signature Ed25519 dan checksum SHA-256 tervalidasi sesuai canonical contract.
4. Validator menolak semua reason code kritis tanpa merusak package aktif.
5. Bundled install berjalan tanpa network.
6. Install atomic dan recovery interrupted install berjalan aman.
7. Package ID dan item ID stabil untuk update.
8. Package hanya mencakup Jawa-Mataraman pada P0.
9. Bundle versi lebih tinggi menggantikan bundle aktif secara atomic tanpa menghapus progress berdasarkan stable ID.
10. Startup mengintegrasikan `verifyBundledPackage` dari handoff Plan 1.
11. Package validation dan install tidak mengakses React atau route.
12. Contract, unit, dan integration tests package lulus.
13. `npm test`, `npm run typecheck`, `npm run lint`, dan `npm run doctor` lulus.
14. FR-80, FR-81, FR-82, dan FR-90 memiliki module, contract, test filename, evidence, dan status traceability.

### Traceability evidence yang wajib dibuat

| PRD | Module/contract | Test/evidence |
|---|---|---|
| FR-80 | `src/features/packages/application/verifyBundledPackage.ts`, bundled source, atomic installer | `tests/integration/packages/bundled-install.test.ts`, airplane-mode evidence |
| FR-81 | `packageTypes.ts`, package identity/content isolation contract | `tests/contract/packages/package-manifest.test.ts`, package isolation fixture |
| FR-82 | SemVer package version, bundled upgrade use case | `tests/integration/packages/bundled-update.test.ts`, stable-ID progress preservation evidence |
| FR-90 | `tools/content-builder/src/validateContent.ts`, `buildPackage.ts`, signing pipeline | `tests/contract/packages/content-rules.test.ts`, `signature.test.ts`, `artifacts/content-builder/fixture-report.json` |

Evidence paths/commands:

- Bundle acceptance: `tests/integration/packages/bundled-install.test.ts` via `npm test -- tests/integration/packages/bundled-install.test.ts`.
- Update preservation: `tests/integration/packages/bundled-update.test.ts` via the same test command.
- Builder report: `artifacts/content-builder/fixture-report.json`, generated by `npm run content:validate`.
- Signature vectors: `tests/contract/packages/signature.test.ts` and `artifacts/content-builder/signature-report.json`.
- Airplane-mode evidence: `artifacts/release/p0-airplane-mode-report.md` from the release E2E command.

## 15. Risiko dan mitigasi

| Risiko | Level | Mitigasi |
|---|---|---|
| Signature atau canonicalization salah | High | Golden vectors JCS/Ed25519 dan negative contract tests |
| Package berbahaya mengeksploitasi path traversal | High | Normalize-before-deduplicate, safe extraction, archive limits |
| Package invalid merusak package aktif | High | Staging, atomic activation, rollback/recovery test |
| Private key masuk repository/device | Critical | Signing di environment terproteksi, secret scan, key custody review |
| Audio tidak kompatibel lintas device | High | Metadata validation dan Android/iOS playback fixture test |
| Stable ID berubah saat koreksi konten | High | ID policy, builder lint, update fixture test |
| Bundle terlalu besar | Medium | Size budget, asset report, only Jawa-Mataraman in P0 |
| Process kill meninggalkan staging | Medium | Install marker, recovery handler, disk/process-kill tests |
| Content provenance tidak lengkap | High | Builder rejects missing verifier/license/consent |
| Archive build tidak deterministik | Medium | Sorted entries, fixed canonical serialization, reproducibility test |
| Perbandingan versi numerik salah untuk `1.10.0` | Medium | SemVer parser dan test upgrade/downgrade |
| Resource exhaustion/decompression bomb | High | Shared size/entry/path/JSON limits and boundary tests |
| Key revocation memutus package aktif | High | Retired/revoked states, no destructive removal, replacement update path |

## 16. Definition of Done

- Package schema dan format resmi terkunci.
- Fixture Jawa-Mataraman tervalidasi.
- Builder dapat membuat package final tanpa private key di repository.
- Signature, checksum, path, version, semantic content, dan audio validation lulus.
- Bundled package dipasang atomic tanpa internet.
- Interrupted install dapat dipulihkan tanpa menghapus active package.
- `verifyBundledPackage` terhubung ke startup Plan 1.
- Package errors memiliki reason code dan pesan user-facing.
- Contract/unit/integration tests lulus.
- Requirements traceability diperbarui.
- Plan 3 dapat memakai package content tables dan stable IDs tanpa mengubah package contract.

## 17. Handoff ke plan berikutnya

### Ke Plan 3 — SQLite & Progress Engine

Plan 3 menerima:

- `PackageIdentity` dan stable `(package_id, item_id)`.
- Package content yang sudah lolos validation.
- Installed package metadata dan version.
- SemVer comparison dan hasil upgrade/downgrade.
- Active package query capability.
- Atomic install/recovery lifecycle.
- Content entity contract untuk `units`, `words`, `sentences`, `dialogues`, dan `challenges`.
- Package update event yang dapat memicu rebuild derived progress tanpa menghapus learning events.

### Ke Plan 4–7

Feature plan berikutnya dapat mengasumsikan:

- Content package tersedia offline.
- Content references valid.
- Audio references dan metadata tersedia.
- Dialog graph dan challenge references sudah aman digunakan renderer.
- Package tidak berubah di tengah sesi karena activation dilakukan atomic.
