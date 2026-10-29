# ADR 0014 — Clata Package Extension

Status: Accepted

## Context

Package Clata adalah arsip ZIP, tetapi perlu memiliki ekstensi resmi yang mudah dikenali saat dibagikan.

## Decision

Gunakan `.clata` sebagai ekstensi resmi package. Aplikasi tetap menerima `.zip` sebagai fallback kompatibilitas karena beberapa aplikasi berbagi file atau pengelola berkas dapat mengubah atau menolak ekstensi custom.

## Consequences

- File picker harus menerima `.clata` dan `.zip`.
- Validasi archive, checksum, dan signature tetap sama untuk kedua ekstensi.
- Nama file dan katalog menggunakan `.clata` sebagai format distribusi resmi.
- MIME/UTI dan Android intent filter perlu diuji pada platform target.
