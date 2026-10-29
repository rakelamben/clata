# Flow: Profil — Progress, Mastery, and Streak

## Entry

`Profil → Kemajuan belajar`.

Profil adalah satu-satunya tempat untuk melihat progress, mastery, streak, statistik, pencapaian level, dan status sinkronisasi. Tidak ada tab Progress/Stats terpisah dan tidak ada ringkasan mastery di landing screen Kata.

## Main path

```text
Profil
→ Kemajuan belajar
→ lihat streak global
→ lihat bahasa dan dialek terpilih
→ ganti bahasa/dialek atau unggah paket
→ lihat mastery package terpilih
→ lihat tiga kartu statistik latihan
→ lihat bar chart ringkas
→ lihat perubahan isi setelah pembaruan package
```

## Data display rules

- Mastery dihitung terpisah untuk setiap package/dialek.
- Current level dan highest level selalu ditampilkan sebagai dua nilai berbeda.
- Streak bersifat global, tetapi hanya dapat bertambah dari aktivitas `ScrollableWordFeed`.
- Membaca atau mencari kata di Kamus/Data Kata tidak memenuhi syarat streak.
- Streak membutuhkan minimal 10 kata unik yang tampil sesuai aturan ScrollableWordFeed.
- Challenge tidak memengaruhi mastery, streak, statistik, atau event progres.
- Dialog AI tidak masuk komponen mastery dialog; kreditnya mengikuti aturan domain PRD.
- Progress package yang belum terpasang ditampilkan sebagai `Progres tersedia — pasang paket untuk melanjutkan`.

## Visual order on Profile

Urutan visual wajib:

1. **Streak global** di bagian paling atas.
2. **Bahasa dan dialek terpilih** dalam satu selector, dengan tombol `Ganti` untuk memilih package/dialek lain yang sudah terpasang.
3. Tombol `Unggah paket` yang membuka menu upload/pasang paket dari file.
4. **Mastery package terpilih**, termasuk current level dan highest level.
5. **Tiga kartu statistik latihan** dengan angka utama dan label singkat.
6. **Bar chart ringkas** dengan 3–5 bar untuk statistik latihan yang sama.

Setelah seluruh komponen progress dan chart, tampilkan list vertikal tombol Pengaturan di dalam tab Profil.

Selector bahasa/dialek dan tombol unggah tidak boleh dipecah menjadi beberapa card berulang. Tombol unggah membuka bottom sheet/menu pilihan file dan mengikuti flow package installation.

## Statistics layout

Gunakan satu bar chart sederhana dengan 3–5 bar pada mobile. Setiap bar memiliki label pendek, nilai teks, dan accessible description. Jangan menampilkan banyak chart, legend panjang, atau kartu statistik yang memenuhi seluruh layar.

## Package update

Jika package bertambah, mastery saat ini dapat turun karena item baru masuk pembagi. Tampilkan penjelasan singkat seperti `Ada isi baru` dan tetap tampilkan highest level sebagai pencapaian. Jangan gunakan copy yang menyiratkan pengguna kehilangan kemampuan.

## Empty and recovery states

- Belum ada progress: `Mulai dari Kata atau Latihan.`
- Package belum terpasang: `Pasang paket untuk melihat kemajuan.`
- Cache sedang dihitung ulang: skeleton untuk struktur data dan spinner hanya pada operasi singkat.
- Sync tertunda: status ringkas di Profil, tidak menghalangi penggunaan offline.
- Sync gagal: `Belum tersinkron` + aksi `Coba lagi`.
- Data lokal tetap dipertahankan bila server tidak tersedia.

## Navigation

- Back mengembalikan pengguna ke Profil.
- Pengguna dapat berpindah ke Kata, Latihan, atau Tantangan tanpa kehilangan konteks.
- Profil juga menyediakan akses ke Pengaturan, Paket Bahasa, Akun, dan status offline.

## Accessibility

- Semua angka memiliki label teks, bukan hanya ring/chart.
- Package selector mengumumkan bahasa, dialek, dan version yang dipilih.
- Streak menjelaskan sumbernya: `Streak berasal dari 10 kata unik di Kata.`
- Current/highest level dibaca terpisah.
- Status sync diumumkan secara polite dan tidak mengganggu audio/latihan.
- Empty/error copy singkat dan memiliki satu tindakan utama.
