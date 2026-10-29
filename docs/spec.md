# Clata Engineering Specification

Status: `baseline` · Version: `0.2` · Owner: product owner · Review: sebelum bootstrap source code

Dokumen ini adalah indeks normatif implementasi. `PRD_clata.md` adalah sumber kebenaran kebutuhan produk. Dokumen legal/keamanan memiliki prioritas lebih tinggi bila bertentangan dengan pilihan teknis.

## Normative language

- **MUST**: wajib untuk merge/rilis.
- **MUST NOT**: dilarang.
- **SHOULD**: default yang boleh menyimpang dengan alasan tertulis.
- **MAY**: opsional.
- Keputusan `K` sudah disetujui PRD; `U` adalah usulan; `T` adalah parameter yang harus diuji; `TBD` belum boleh dijadikan security boundary.

## Scope

### System language

Bahasa antarmuka, navigasi, onboarding, error message, bantuan, pengaturan, dan accessibility label adalah **Bahasa Indonesia**. MVP/P1 tidak menyediakan penggantian bahasa antarmuka. Bahasa daerah hanya berasal dari konten paket pembelajaran.

### P0

Onboarding offline, paket Jawa-Mataraman dari bundel, kosakata/audio, Guess the Word, Fill the Gap, dialog kurasi, streak, mastery, statistik, challenge, reset data, About, dan mode pesawat penuh.

### P1

Supabase Auth (email, phone OTP, Google), sinkronisasi, AI dialogue, backup file, package import/export/remove, catalog/download, reminders, contributor workflow, dan signed catalog.

### P2

Delta package, contributor recording, child accounts dengan parental consent, dan ekspansi bahasa/dialek.

## Architecture invariants

- P0 MUST berjalan tanpa jaringan setelah paket bundel terpasang.
- SQLite adalah sumber kebenaran lokal; server tidak menggantikan SQLite.
- Progress diidentifikasi dengan `(package_id, item_id)`.
- Learning event bersifat append-only; nilai turunan dapat dibangun ulang.
- UI MUST NOT mengakses SQLite, Supabase, filesystem, atau network secara langsung.
- Domain MUST NOT mengimpor React, Expo, Zustand, Supabase, atau SQLite.
- Tidak ada `service_role`, OAuth secret, SMS secret, atau private signing key dalam aplikasi.
- Package install MUST atomic dan gagal tanpa merusak versi aktif.
- Semua operasi destruktif MUST memerlukan konfirmasi eksplisit.

## Dokumen normatif

- [Architecture](./architecture.md)
- [Folder structure](./folder-structure.md)
- [Coding standards](./coding-standards.md)
- [Data model](./data-model.md)
- [SQLite schema](./sqlite-schema.md)
- [Content package](./content-package-spec.md)
- [Sync strategy](./sync-strategy.md)
- [API contracts](./api-contracts.md)
- [Supabase schema](./supabase-schema.md)
- [Testing strategy](./testing-strategy.md)
- [Security](./security.md)
- [Accessibility](./accessibility.md)
- [Content authoring](./content-authoring.md)
- [Requirements traceability](./requirements-traceability.md)
- [Release runbook](./release-runbook.md)
- [Glossary](./glossary.md)
- [Decisions](./decisions.md)
- [ADR index](./adr/README.md)
- [UX/UI design system](./design/README.md)

## Definition of ready

Fitur siap diimplementasikan bila acceptance criteria, data contract, offline behavior, error state, accessibility behavior, security impact, dan test cases telah ditentukan.

## Definition of done

Typecheck, lint, unit/integration tests, relevant E2E, migration test, accessibility check, security review, dan dokumentasi perubahan lulus. P1 juga membutuhkan contract test dan failure-path test.
