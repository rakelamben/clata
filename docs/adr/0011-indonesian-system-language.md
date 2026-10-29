# ADR 0011 — Bahasa Antarmuka Sistem

Status: Accepted

## Context

Clata menargetkan pengguna Indonesia dan PRD menetapkan antarmuka berbahasa Indonesia tanpa fitur multibahasa pada tahap awal.

## Decision

Seluruh UI, navigasi, onboarding, error message, bantuan, pengaturan, accessibility label, dan status sistem menggunakan Bahasa Indonesia. Bahasa daerah hanya berasal dari package konten pembelajaran.

MVP/P1 tidak mengikuti locale perangkat dan tidak menyediakan language switcher.

## Consequences

- Semua string UI harus ditulis dalam Bahasa Indonesia.
- Translation key tetap boleh digunakan agar ekspansi bahasa di masa depan tidak memerlukan refactor besar.
- Content package menyimpan teks bahasa daerah dan terjemahan Indonesianya secara terpisah.
