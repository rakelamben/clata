# Flow: Onboarding and Age Gate

## Entry

First launch atau setelah `Hapus semua data`.

## Screen count

Onboarding terdiri dari **empat screen berurutan**. Screen pengantar dapat dilewati; profil lokal, age gate, dan persiapan paket tidak dapat dilewati.

## Screen 1 — Tentang Clata

Tujuan: menjelaskan manfaat aplikasi secara singkat.

- Headline: **Belajar bahasa daerah dengan percaya diri.**
- Supporting copy: **Pelajari kata dan percakapan untuk digunakan sehari-hari.**
- Primary action: `Lanjut`.
- Secondary action: `Lewati` boleh tersedia karena informasi ini bukan syarat teknis.

## Screen 2 — Profil lokal dan data offline

Tujuan: menjelaskan model offline-first dan konfirmasi data lokal.

- Headline: **Siapkan profil lokal.**
- Supporting copy: **Aplikasi berjalan 100% offline. Tahun lahir dan paket belajar disimpan di perangkatmu, bukan di server.**
- Primary action: `Lanjut`.

Jangan meminta login atau jaringan pada screen ini. Sinkronisasi tetap opsional dan hanya berlaku setelah pengguna memiliki akun yang memenuhi syarat.

Screen ini menampilkan peringatan bahwa data lokal dapat hilang jika aplikasi dihapus dan membutuhkan centang konfirmasi.

## Screen 3 — Age Gate

Tujuan: menetapkan akses fitur berdasarkan usia.

- Headline: **Berapa tahun lahirmu?**
- Input: pemilih tanggal/tahun lahir.
- Primary action: `Lanjut`.

Rules:

- di bawah 10 tahun: tampilkan pesan ramah bahwa aplikasi ditujukan untuk usia 10 tahun ke atas dan hentikan onboarding;
- usia 10–17 tahun: aktifkan fitur lokal P0; akun, sinkronisasi, dan AI hanya setelah persetujuan wali;
- usia 18 tahun ke atas: seluruh fitur yang tersedia dapat ditampilkan, akun tetap opsional.

## Screen 4 — Preparation & Package Install

Tujuan: menampilkan paket belajar yang akan dipasang dan menyiapkan database lokal serta paket bundel Jawa-Mataraman.

- Headline: **Siapkan paket belajarmu.** (persiapan: **Menyiapkan ruang belajarmu.**, siap: **Paket belajar siap**, gagal: **Persiapan belum selesai.**)
- Supporting copy: **Paket berikut akan dipasang untuk mulai belajar. Semua materi tersedia tanpa koneksi internet.**
- Card Info: Nama paket (Jawa · Mataraman), deskripsi, kategori (Kata, Latihan, Dialog), dan status paket bawaan offline.
- Progress/status: pemasangan database lokal, validasi materi belajar, dan paket bundel Jawa–Mataraman.
- Primary action: `Mulai` (sebelum install), `Mulai belajar` (setelah siap), atau `Coba lagi` (jika gagal).

Jika proses terhenti atau aplikasi ditutup, startup recovery melanjutkan atau mengulang proses dengan aman tanpa paket setengah jadi.

## Completion

Setelah pengguna menekan `Mulai belajar` di Screen 4, aplikasi membuka **Kata — Scrollable Feed**. Tidak ada halaman Home/index terpisah.

## Accessibility

- Screen reader mengumumkan judul dan satu status utama per screen.
- Progress persiapan diumumkan berdasarkan perubahan bermakna, bukan setiap persen.
- Pemilih tanggal lahir memiliki label, format error sederhana, dan hint bahwa data hanya disimpan di perangkat.
- Loading screen tidak memiliki aksi lain yang membingungkan.
