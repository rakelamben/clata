# Screen: Paket Bahasa

## Tujuan dan entry

Diakses melalui `Profil → Pengaturan → Paket Bahasa` atau button `Unggah paket` pada Profil. Screen ini mengelola package terpasang, progress yang belum memiliki package lokal, upload file, katalog online, update, export, dan penghapusan package tambahan.

## Struktur layout

Header safe area berisi back dan judul **Paket Bahasa**. Section pertama menampilkan package terpasang sebagai rows berisi bahasa, dialek, versi, ukuran, sumber, storage impact, dan status. Section kedua menampilkan `Progres tersedia — pasang paket untuk melanjutkan` bila ada progress tanpa package lokal. Primary button `Unggah paket` selalu tersedia. Katalog online hanya dirender setelah screen dibuka dan server menjawab; tidak pernah menghambat startup.

## Upload dan install

Bottom sheet berjudul `Unggah paket` memiliki dialog semantics, focus containment, dan menawarkan `Pilih file dari perangkat`, menjelaskan bahwa `.clata` adalah format resmi dan `.zip` fallback, serta button `Batal`. Cancellation file picker mengembalikan pengguna ke screen tanpa error. Setelah file dipilih, tampilkan nama, ukuran, versi, dan sumber sebelum validasi. Tampilkan tahap `Memeriksa package`, `Memasang`, dan `Selesai`; installer harus atomic sehingga kegagalan signature, checksum, schema, storage, atau content tidak meninggalkan package setengah jadi.

## Katalog dan actions

Saat online, rows katalog menampilkan versi dan ukuran dengan `Unduh dan pasang`; peringatan data seluler muncul sebelum download. Download memiliki progress ukuran `12 MB dari 40 MB`, pause/resume bila didukung, dan cancel. Saat offline/server unavailable, katalog disembunyikan dan copy `Katalog belum tersedia. Kamu tetap bisa unggah file.` ditampilkan. `Bagikan paket` mengekspor arsip asli bertanda tangan; `Perbarui` hanya muncul bila versi lebih tinggi; package bundel Jawa-Mataraman tidak dapat dihapus.

Penghapusan package tambahan memakai warning bottom modal dan konfirmasi dua langkah. Modal memiliki focus containment, `Batal`, dan label spesifik `Hapus paket [nama]`.

## State

`loading skeleton`, `catalog loading/loaded`, `offline`, `server unavailable`, `file picker`, `validation`, `bad signature/checksum`, `unsupported package`, `download progress`, `cancelled`, `storage full`, `already installed`, `update available`, `installed`, dan `recovery`.

## Accessibility tree, copy, dan WCAG

Heading → package rows dengan bahasa/dialek/versi/ukuran/sumber/status → `Unggah paket` → katalog. Progress memiliki teks persentase/tahap dan `Batal`; perubahan diumumkan polite. Bottom sheet mengembalikan fokus ke trigger. Semua control minimal 44×44 pt iOS atau 48×48 dp Android, progress tidak hanya warna, content reflow pada text scaling, dan error menjelaskan cara memperbaiki. Mencakup 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.3.1, 3.3.3, dan 4.1.3.

Flow detail: [Language packages](../flows/packages.md).
