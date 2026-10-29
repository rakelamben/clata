# Screen: Kamus / Data Kata

## Tujuan

Kamus adalah tempat eksplorasi terarah untuk mencari dan memfilter semua kata dalam package. Kamus berbeda dari Kata Feed dan tidak menjadi sumber syarat streak.

## Entry and exit

- Entry: `Kata → icon Buka Kamus`.
- Exit: back kembali ke Kata dan memulihkan posisi feed.

## Layout

1. Safe-area header dengan back button dan judul **Kamus**.
2. Search field berlabel **Cari kata**.
3. Filter tema dan tingkat tutur dalam control yang ringkas.
4. Hasil data kata dalam list sederhana.
5. Setiap item memiliki lema, arti, kelas kata bila relevan, icon volume, dan icon info.

Tidak ada register badge, ikon dekoratif, CTA latihan berulang, atau label status yang tidak membantu.

## Interaction

- Search bekerja offline dan menormalkan diakritik serta variasi `dh/th` sesuai PRD.
- Search menggunakan debounce singkat, memiliki keyboard action `Cari`, tombol clear saat ada input, dan dismiss keyboard yang tidak menghapus hasil.
- Filter dapat dikombinasikan dengan search dan memiliki clear action.
- Filter yang dibuka sebagai sheet memiliki heading, selected state, `Terapkan`, `Atur ulang`, dan focus return ke trigger.
- Icon volume memakai toggle play/stop; play setelah stop dimulai dari awal.
- Icon info membuka tooltip singkat `Tingkat tutur kata: [register]`.
- Browsing Kamus tidak memenuhi syarat streak. Streak hanya berasal dari Kata Feed.
- Hasil kosong menyediakan satu aksi: `Hapus pencarian` atau `Atur ulang filter`.

## States

`loading skeleton`, `results`, `filter active`, `empty query`, `no results`, `audio unavailable`, `error`, dan `offline`.

Skeleton mempertahankan bentuk list. Spinner hanya dipakai untuk tindakan singkat seperti apply filter atau retry.

## Accessibility

Search memiliki visible label, input hint, keyboard action, dan clear label. Filter mengumumkan selected state dan jumlah hasil setelah diterapkan. Item mengumumkan lema dan arti sekali. Icon volume mengumumkan playing/stopped. Tooltip mengembalikan focus ke trigger.

## Acceptance criteria

Pencarian dan filter berjalan tanpa internet, back memulihkan feed, screen tidak mengubah streak, dan seluruh hasil tetap berasal dari package terpasang.
