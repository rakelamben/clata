# ADR 0013 — Account Age and Password Recovery

Status: Accepted with compliance dependency

## Context

Pemilik produk mengubah batas akses akun menjadi 10 tahun ke atas dan meminta fitur lupa password. Akun dan sinkronisasi memproses data server, sehingga pengguna 10–17 tahun membutuhkan persetujuan wali sebelum aktivasi server.

## Decision

Akun dapat dimulai oleh pengguna usia 10+. Usia 10–17 masuk alur guardian consent sebelum account data/progress sync aktif. Dialog AI tetap 18+. Email password recovery dikelola Supabase Auth melalui tautan resmi; aplikasi tidak menyimpan password atau reset token.

## Consequences

Guardian consent, age/privacy impact assessment, retention, deletion, and store/regulatory review become release dependencies. Until the consent mechanism is implemented and approved, account signup for 10–17 must remain unavailable or clearly marked pending.
