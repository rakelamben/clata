# ADR 0012 — Practice Session Availability

Status: Accepted

## Context

Pengguna perlu dapat mencoba Guess the Word, Fill the Gap, dan Dialog tanpa harus lebih dahulu membaca sejumlah kata di ScrollableWordFeed.

## Decision

`kata_dilihat` tidak menentukan keterbukaan sesi Guess the Word, Fill the Gap, atau Dialog, dan tidak digunakan untuk mengisi bank sesi. Semua sesi dibuka dari session setup di tab Latihan.

Konten tetap harus berasal dari package terpasang dan bank yang valid. Jika package/bank benar-benar kosong, aplikasi menampilkan keadaan kosong dan tindakan pemulihan, bukan gate berdasarkan viewed words.

## Consequences

Streak tetap hanya bertambah dari ScrollableWordFeed. Pemilih konten dan aturan mastery harus dipisahkan dari aturan ketersediaan screen/session. Acceptance test wajib mencakup pengguna baru yang langsung membuka ketiga jenis sesi.
