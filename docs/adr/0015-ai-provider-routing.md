# ADR 0015 — Gemini and Groq Free-Tier AI Routing

Status: Accepted

## Context

AI dialogue P1 membutuhkan provider model dengan biaya awal minimum, tetapi harus tetap memiliki fallback ketika provider utama timeout, rate-limit, atau gagal. Fitur ini tersedia mulai usia 10 tahun dengan consent wali untuk pengguna 10–17.

## Decision

Gunakan free-tier Gemini API sebagai provider utama dan free-tier Groq API sebagai fallback. Keduanya hanya dipanggil dari trusted Supabase Edge Function. API key dan model ID disimpan di server configuration. Provider/model tidak ditampilkan di UI.

Sebelum hasil dikirim ke aplikasi, server wajib memvalidasi schema dialog, bank membership, register, batas kata, content safety, dan aturan usia.

## Consequences

- Free-tier quota, model availability, terms, dan rate limit harus dipantau asynchronous.
- Provider routing memiliki hard timeout, bounded retry, dan fallback ke dialog kurasi.
- Provider-specific response tidak boleh menjadi kontrak mobile; response harus dinormalisasi ke kontrak Clata.
- AI tetap diberi label `Dibuat AI, belum diverifikasi penutur` dan tidak memperoleh audio native.
- Guardian consent menjadi dependency sebelum request AI pengguna 10–17 diproses server.
