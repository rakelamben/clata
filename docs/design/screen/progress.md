# Screen: Profil — Kemajuan Belajar

## Tujuan dan entry

Profil adalah tab utama untuk memahami kemajuan, mengganti package/language, dan membuka pengaturan. Kemajuan dijelaskan sebagai informasi, bukan peringkat atau tekanan. Progress, mastery, dan streak bukan tab navigasi terpisah.

## Struktur layout

Dalam scroll view safe-area, tampilkan berurutan:

1. heading `Profil` dan streak global dengan label penjelas;
2. selector bahasa/dialek aktif dengan nilai saat ini dan button `Ganti`;
3. primary button `Unggah paket`;
4. mastery package aktif, current level, highest level, dan penjelasan perubahan denominator;
5. tiga statistic cards latihan;
6. bar chart ringkas 3–5 periode dengan label periode, unit, nilai, dan ringkasan teks;
7. daftar pengaturan dari screen Settings.

Card tidak boleh bergantung pada warna atau ikon untuk menyampaikan nilai. Streak yang belum aktif memakai copy `Belum ada streak` dan bukan angka nol yang membingungkan.

## Interaksi dan data rules

`Ganti` hanya menampilkan package terpasang atau package dengan progress tersedia. Setelah package diperbarui, tampilkan info `Mastery dihitung ulang karena materi baru masuk ke total kata.` Challenge dan browsing Kamus tidak menambah streak; hanya aktivitas ScrollableWordFeed yang memenuhi syarat streak. Chart memiliki ringkasan teks dan detail yang dapat dibuka.

## State

`loading`, `ready`, `no progress`, `package missing`, `package updated`, `offline`, `sync pending`, `sync failed`, `chart unavailable`, dan `selector open`.

Offline tetap menampilkan data terakhir dengan label waktu `Terakhir diperbarui ...`; sync failure menyediakan `Coba lagi` tanpa menghapus progress lokal. Tanpa data, chart menampilkan `Belum cukup data untuk grafik.` dan bukan grafik kosong tanpa penjelasan.

## Accessibility tree dan UX copy

Heading → streak dan definisinya → selector dengan current value → `Ganti` → `Unggah paket` → mastery summary → statistics → chart summary → settings. Chart wajib menyediakan tabel/ringkasan teks, misalnya `Minggu ini: 12 kata dilihat, 8 latihan selesai.` Focus kembali ke trigger setelah selector ditutup. Gunakan `aria-live`/native polite live region hanya untuk perubahan sync atau package, bukan setiap angka berubah.

## Acceptance dan WCAG

Screen dapat discroll pada layar kecil, content tidak tertutup bottom navigation, text scaling tidak memotong angka, control minimal 44×44 pt iOS atau 48×48 dp Android, kontras teks 4.5:1, non-text contrast 3:1, dan fokus terlihat. Mencakup WCAG 1.3.1, 1.3.3, 1.4.3, 1.4.11, 1.4.10, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.3.2, dan 4.1.3.

Flow detail: [Progress, mastery, and streak](../flows/progress.md).
