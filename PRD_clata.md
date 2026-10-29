# PRD Draft 7 — Clata: Celoteh Nusantara

*Aplikasi mobile belajar bahasa daerah yang berjalan offline · Draft 7 untuk ditinjau · 28 Oktober 2026*

**Cara membaca dokumen ini.** Poin penting diberi tanda: **\[K\]** keputusan pemilik produk, **\[U\]** usulan penyusun yang belum disetujui, **\[T\]** angka atau parameter awal yang perlu diuji dan boleh diubah. Semua hal yang masih menggantung dikumpulkan di Bagian 17.

## Catatan Revisi Draft 7

Draft 7 mempertahankan keputusan Draft 6 mengenai paket bahasa dan distribusinya, lalu menetapkan Supabase sebagai layanan akun untuk P1. Supabase Auth mengelola autentikasi surel, nomor telepon dengan OTP, dan Google OAuth; Supabase Postgres menyimpan profil minimum serta data belajar yang disinkronkan. SQLite tetap menjadi penyimpanan lokal agar fitur inti tetap offline. Keputusan autentikasi sebelumnya yang menunda metode telepon ke P2 digantikan oleh Draft 7. Tidak ada pertanyaan terbuka baru; ketergantungan implementasi dicatat sebagai prasyarat rilis.

| Perubahan | Sumber | Bagian terdampak |
| --- | --- | --- |
| Hanya paket Jawa-Mataraman yang dibundel di aplikasi. Paket bahasa dan dialek lain tidak dibundel agar ukuran aplikasi tidak besar. **\[K\]** | Keputusan pemilik produk | 1, 7.9 (FR-80), 10, 14 |
| Saat online, pengguna mengunduh dan memasang paket lain langsung dari dalam aplikasi. **\[K\]** | Keputusan pemilik produk | 7.9 (FR-83), 10, 14 |
| Saat offline, fitur unduh dan pasang tidak tersedia. **\[K\]** | Keputusan pemilik produk | 7.9 (FR-86), 10 |
| Saat offline, pengguna mendapat file paket lewat berbagi file dan memasangnya manual lewat menu Pasang paket dari file. **\[K\]** | Keputusan pemilik produk | 7.9 (FR-85), 10, 16 |
| Paket bahasa dan dialek lain menyusul setelah MVP dan POC. Mekanisme unduh dan pasang dari file adalah P1. **\[K\]** | Keputusan pemilik produk | 4, 18 |
| Paket dan katalog dihosting di Vercel. **\[K\]** | Keputusan pemilik produk | 7.10 (FR-93), 10, 14, 16, 17.4, Lampiran D |
| Log server unduhan dianonimkan dengan masa simpan 30 hari, dan unduh tidak dibatasi usia di luar batas 10 tahun aplikasi. **\[K\]** | Keputusan pemilik produk (usulan penyusun disetujui) | 11.7, 14, 16 |
| Ekspor paket memakai salinan arsip asli yang disimpan di perangkat. **\[K\]** | Keputusan pemilik produk (usulan penyusun disetujui) | 7.9 (FR-87, FR-88), 14, Lampiran C |
| Layar Paket bahasa, katalog bertanda tangan dan alat penerbitnya, hapus paket, domain sendiri untuk alamat katalog. **\[U\]** | Usulan penyusun | 7.9 (FR-86, FR-88), 7.10 (FR-93), 9, 10 |
| Autentikasi dan penyimpanan akun menggunakan Supabase Auth dan Supabase Postgres; metode masuk P1 mencakup surel, nomor telepon, dan Google OAuth. **\[K\]** | Keputusan pemilik produk Draft 7 | 7.6 (FR-51, FR-58), 9, 11.7, 14, 16, 17.5, 18, Lampiran B dan D |
| Identitas autentikasi dipisahkan dari profil aplikasi dan data progres; nomor telepon memakai verifikasi OTP, OAuth Google mengikuti alur resmi, dan akses data server dibatasi dengan RLS. **\[K\]** | Keputusan pemilik produk Draft 7 | 7.6, 9, 14, Lampiran D |
| Lifecycle sinkronisasi progres belajar diperjelas: pemicu sinkronisasi, penggabungan per paket, status progres untuk paket yang belum terpasang, pemulihan setelah pemasangan, retry, dan perilaku reset lintas perangkat. Detail struktur tabel tetap menjadi bagian Arsitektur Sistem. | Perincian perilaku Draft 7 | 7.6 (FR-51A), 9.2, 14, 17.5, 18 |
| Penyesuaian pendukung: ringkasan, prinsip, FR-01, FR-52 sampai FR-54, FR-82, NFR, metrik, risiko, jadwal, SDG, Lampiran B sampai D. | Konsekuensi keputusan di atas | Tersebar |

## Catatan Revisi Draft 5

Draft 5 menjawab semua pertanyaan terbuka Draft 4. Tidak ada pertanyaan terbuka yang tersisa pada Draft 5.

| Perubahan | Sumber | Bagian terdampak |
| --- | --- | --- |
| Suara POC diisi pemilik produk sendiri, ditandai `poc`. **\[K\]** | Jawaban 1 | A.6 |
| Aturan data anak dan usia ditetapkan berdasarkan riset regulasi (UU PDP, PP 17/2025, Permenkomdigi 9/2026): batas usia 10 tahun, tanpa akun untuk 10 sampai 17 tahun, akun dan dialog AI 18 tahun ke atas, penilaian mandiri sebelum rilis. **\[K\]** | Jawaban 2 dan 5 | 11.7, 14, FR-54, FR-56, Lampiran D |
| Kalibrasi ambang level dilakukan setelah uji lapangan. **\[K\]** | Jawaban 3 | 8.2, 18 |
| Keputusan Draft 5: masuk dengan nomor telepon tidak dibangun di MVP dan tidak memakai verifikasi kode; keputusan ini digantikan oleh Draft 7. | Jawaban 4 (keputusan lama) | FR-51 |
| Lisensi: teks CC BY-SA 4.0, audio tidak dilisensikan terbuka. **\[K\]** | Jawaban 6 | 11.7 |
| Tim: satu pengembang (pemilik produk), tiga pembuat konten di masa POC, pemilik produk memegang kunci. Jadwal Fase 1 dan 2 diperpanjang. **\[K\]** | Jawaban 7 | 16, 18 |

## Catatan Revisi Draft 4 (hasil audit menyeluruh)

Draft 4 menutup celah yang ditemukan lewat audit. Seluruh tambahan telah disetujui pemilik produk (Bagian 17.2) dan bertanda **\[K\]**.

| Temuan audit | Perbaikan | Bagian |
| --- | --- | --- |
| Definisi "dilihat" dan "unit berjalan" tidak ada, padahal dipakai pemilih konten, streak, dan kekuatan. | Definisi pelengkap, aturan pengecoh saat bank sedikit, sesi terputus, tanggal lokal, dan kunci progres. | 8.8 |
| Penggabungan berbasis log tidak punya model data, aturan jam perangkat, atau versi rumus. | Aturan urutan waktu, versi rumus, dan model data lokal. | 9, Lampiran C |
| Tidak ada alur pertama kali, pengaturan, reset data, halaman Tentang, pengingat, hapus akun, atau lapor kesalahan konten. | FR-54 sampai FR-59. | 7.6 |
| Dialog AI tidak punya audio penutur asli, bertentangan dengan prinsip lisan dulu. | FR-45 dan pengecualian di Prinsip 2. | 5, 7.5 |
| Kuota AI memakai tanggal lokal perangkat, sehingga bisa dicurangi lewat zona waktu. | Kuota dihitung server menurut zona waktu profil. | FR-41 |
| Alat pembuat paket tidak punya daftar validasi tunggal, manajemen kunci, dan risiko format audio di iOS. | Daftar validasi, manajemen kunci, uji format audio. | 10 |
| Persyaratan 99% bebas crash dan metrik retensi tidak bisa diukur tanpa telemetri. | Cara pengukuran tanpa telemetri. | 14, 15 |
| Persyaratan rilis (toko, kebijakan privasi, migrasi basis data, cadangan OS, versi OS) belum ada. | Baris NFR baru. | 14 |
| Jadwal tidak memuat rekrutmen penutur dan verifier, serta persetujuan orang tua peserta uji di bawah umur. | Fase 1 dan 2 dilengkapi. | 18 |
| PRD tidak punya user story dan kriteria siap rilis. | Lampiran B dan D. | Lampiran |

## Catatan Revisi Draft 3

Draft 3 menerapkan jawaban pemilik produk atas 11 pertanyaan terbuka Draft 2 (Bagian 17.2 sekarang berisi keputusan, dan sisa pertanyaan ada di Bagian 17.3).

| Perubahan | Sumber | Bagian terdampak |
| --- | --- | --- |
| Teknologi ditetapkan: React Native (Expo) dengan SQLite. Flutter tidak dipakai. **\[K\]** | Jawaban 1 | 14, 17 |
| Tidak ada kota patokan. Mataraman diperlakukan sebagai satu rumpun: satu bentuk acuan per kata, variasi Solo atau Yogyakarta hanya keterangan informatif. **\[K\]** | Jawaban 2 | 6, 11.2, 17 |
| Siapa yang mengisi suara selama POC ditunda. Audio tetap ada di setiap item, tetapi bersumber dari rekaman POC tidak resmi (belum dari penutur asli terverifikasi). | Jawaban 3 | A.6, 17.3 |
| Paket dibundel di MVP, impor paket P1. Naik dari usulan menjadi keputusan. **\[K\]** | Jawaban 4 | 1, 7.9, 10 |
| Masuk akun: surel terkonfirmasi dan Google lebih dulu. Nomor telepon menyusul (P2). **\[K\]** | Jawaban 5 | 7.6, 14, 18 |
| Persona Dian di Klaten. Akun dan dialog AI hanya untuk usia 18 tahun ke atas sampai mekanisme persetujuan orang tua dibangun. **\[K\]** | Jawaban 6 | 3, 7.5, 11.7, 14 |
| FR-73 (Sudah kucoba) tetap P1. **\[K\]** | Jawaban 7 | 7.8 |
| Titik pemahaman bernilai 1 pada percobaan pertama dan 0,5 sesudah pengulangan. **\[K\]** | Jawaban 8 | 8.2 |
| Kekuatan item dihitung ulang dari log jawaban berurutan waktu, bukan digabung dari nilai antarperangkat. **\[K\]** | Jawaban 9 | 8.1, 8.3, 9 |
| Aturan pembaruan paket (mastery dihitung ulang, level tertinggi tersimpan sebagai pencapaian). **\[K\]** | Jawaban 10 | 8.7 |
| Ambang level dibiarkan sampai ada data uji lapangan. **\[K\]** | Jawaban 11 | 8.2, 17.3 |

## Catatan Revisi Draft 2

| Perubahan | Sumber | Bagian terdampak |
| --- | --- | --- |
| Sistem dialek umum, penimpaan, dan pewarisan dihapus. Tiap kombinasi bahasa-dialek adalah paket mandiri. | Keputusan pemilik produk | 1, 6, 7.1, 7.9, 8.3, 10, 16 |
| MVP memakai bahasa Jawa dialek Mataraman (Solo-Yogyakarta). | Jawaban 1 | 3, 12.2 |
| Platform menjadi aplikasi mobile lintas platform dengan penyimpanan lokal. PWA ditinggalkan. Masuk akun lewat surel terkonfirmasi, nomor telepon, atau Google. | Jawaban 5 | 1, 7.6, 14, 16 |
| Konten MVP dibundel di dalam aplikasi. Impor dan unduh paket menjadi P1. **\[U\]** | Usulan penyusun | 7.9, 10 |
| Streak: 10 kata tampil, tanpa syarat audio, boleh kata lama. | Jawaban 3 | 8.5, 12.3 |
| Dialog AI wajib akun. | Jawaban 7 | 7.5, 9, 16 |
| Tanpa telemetri dan tanpa pembekuan streak di MVP. Rumus mastery ditetapkan pemilik produk. | Jawaban 8, 11, 9 | 8, 14, 15 |
| Centang Sudah kucoba disetujui. Pemetaan register per bahasa wajib. | Jawaban 6, 10 | 6, 7.8 |
| Pedoman ejaan dan register, aturan lisensi, dan aturan data anak diusulkan. **\[U\]** | Jawaban 2, 4 | 6, 11.7, Lampiran A.2 |
| Status konten `poc` dan panduan pengumpulan data tanpa penutur asli. | Pertanyaan lanjutan | 11.8, Lampiran A |
| Persona Dian dipindah dari Kebumen ke Klaten agar sesuai dialek MVP. **\[U\]** | Konsekuensi keputusan dialek | 3 |
| Dua jenis titik pilihan dialog (register dan pemahaman), dengan balasan perbaikan tanpa node baru dan tanpa batas pengulangan. | Keputusan pemilik produk | 7.4, 8.3, 10, 11.5, 17.2, Lampiran A.5 |
| Celah mastery ditutup: sumber kredit kekuatan, nilai opsi dialog, rumus prioritas ulangan, dan aturan pembaruan paket. **\[U\]** | Tinjauan Bagian 8 | 8.1, 8.2, 8.4, 8.7, 9, 17.2 |

## 1. Ringkasan

Clata adalah aplikasi untuk anak muda perkotaan yang ingin belajar bahasa daerah asal keluarganya agar bisa berbicara dengan nenek dan masyarakat kampung. Ada tiga cara belajar: hafalan kosakata dengan audio penutur asli, latihan (Guess the Word dan Fill the Gap), dan dialog percakapan bercabang ala novel visual. Aplikasi berupa aplikasi mobile lintas platform (Android dan iOS) yang menyimpan konten dan progres di penyimpanan ponsel, sehingga semua fitur inti berjalan tanpa internet. Pada MVP, hanya konten bahasa Jawa dialek Mataraman (Solo-Yogyakarta) yang dibundel di dalam aplikasi, sehingga ukuran aplikasi tetap kecil. Paket bahasa dan dialek lain menyusul setelah MVP dan POC: saat online, pengguna mengunduh dan memasangnya langsung dari dalam aplikasi, sedangkan saat offline pengguna memasangnya manual dari file paket yang diperoleh lewat berbagi file. **\[K\]**

Tiga keputusan struktural menopang seluruh dokumen:

1. **Satu bahasa, satu dialek, satu kumpulan konten.** Setiap kombinasi bahasa-dialek berdiri sendiri dan tidak berbagi item dengan dialek lain. Tidak ada dialek umum atau pewarisan antardialek. Tingkat tutur adalah tag pada konten, bukan state tersendiri. **\[K\]**
2. **Konten dipilih, bukan digenerate.** Semua kuis dan kalimat berasal dari bank konten yang dikurasi. Sistem hanya memilih dari bank itu berdasarkan log belajar pengguna. **\[K\]**
3. **Paket konten adalah unit konten.** Satu paket memuat seluruh konten satu bahasa-dialek dalam format data yang sama untuk bundel, unduhan, dan impor file. Pada MVP hanya paket Jawa-Mataraman yang dibundel di aplikasi. Paket lain tidak dibundel dan dipasang lewat dua jalur menurut keadaan jaringan: unduh dan pasang dari dalam aplikasi (hanya saat online), atau pasang manual dari file hasil berbagi file (jalur untuk saat offline, dan tetap bisa dipakai saat online). Keduanya P1. **\[K\]**

## 2. Problem Statement

Anak muda yang tumbuh di kota sering kehilangan bahasa daerah keluarganya. Ketika harus berbicara dengan nenek atau tinggal di kampung, mereka terhambat: materi belajar sulit ditemukan dalam format yang menarik, jarang memuat bahasa lisan sehari-hari, dan aplikasi yang ada bergantung pada internet yang justru lemah di banyak daerah asal bahasa itu. Akibatnya jarak antargenerasi melebar dan bahasa daerah makin jarang dipakai.

**Status bukti.** Belum ada data primer. Rumusan di atas bersumber dari proposal dan tiga persona, sehingga harus divalidasi lewat survei kendala akses dan wawancara penutur sebelum dianggap terbukti (lihat Bagian 15).

## 3. Target Pengguna dan Persona

Pengguna utama: anak muda yang lama tinggal di kota, level pemula sampai dasar, dengan motivasi sosial yaitu berbicara dengan keluarga dan masyarakat kampung asal. Bukan target: penutur fasih, peneliti bahasa, dan anak yang belum lancar membaca.

| Persona | Situasi | Kebutuhan utama | Implikasi ke produk |
| --- | --- | --- | --- |
| Dian, siswa SMP | Tinggal di Jakarta sejak umur 4 tahun, lalu pindah ke kampung di Klaten. Hanya paham sedikit bahasa Jawa yang dipakai sehari-hari di lingkungannya. | Bahasa lisan sehari-hari untuk bertahan di kampung, mulai minggu ini. | Jalur belajar per situasi, audio, dialek setempat, challenge ringan. Pengguna di bawah 18 tahun (lihat Bagian 14). |
| Santi, mahasiswa | Tumbuh di Palangkaraya, lahir dan berkeluarga besar di Bali. Neneknya di Bali hanya berbahasa Bali. | Berbicara dengan nenek dengan sopan dan hangat. | Tag register (halus untuk orang yang dihormati), dialog dengan lawan bicara nenek, challenge lewat telepon atau video call. |
| Torik, mahasiswa | Sudah menguasai bahasa Jawa dan Sunda, ingin menambah bahasa Bali. Belajar lewat praktik langsung dan rutinitas. | Langsung berlatih memakai kalimat, tanpa terhalang urutan. | Tanpa penguncian fitur, mode tanpa bantuan, mastery terpisah per bahasa. |

Catatan Draft 2: kampung Dian dipindah dari Kebumen (dialek Banyumasan) ke Klaten agar sesuai dengan dialek MVP, Jawa Mataraman. **\[K\]** Persona Santi dan Torik berfokus pada bahasa Bali sehingga belum terlayani MVP. Keduanya tetap menjadi arah desain jangka panjang, sedangkan pengujian MVP memakai skenario Jawa.

## 4. Tujuan dan Bukan Tujuan

### Tujuan

| # | Tujuan | Cara mengukur (rinci di Bagian 15) |
| --- | --- | --- |
| 1 | Pengguna mampu menyapa dan bercakap dasar dengan penutur asli. | Tes kosakata sebelum dan sesudah, laporan diri. |
| 2 | Belajar menjadi kebiasaan. | Streak, retensi hari ke-7 dan ke-30. |
| 3 | Semua fitur inti berjalan tanpa internet. | Uji offline, waktu muat. |
| 4 | Konten akurat dan diakui penutur asli. Pada tahap POC konten berstatus `poc` (belum diverifikasi) dan tidak dirilis publik. | 100% konten rilis publik terverifikasi (Bagian 11.8). |
| 5 | Terbangun kemitraan dengan penutur asli dan komunitas budaya (SDG 17), dimulai setelah POC tervalidasi. | Jumlah kontributor dan mitra aktif (pasca-POC). |

### Bukan Tujuan (versi 1)

- **Penilaian pelafalan atau pengenalan suara.** Mahal dan akurasinya rendah untuk bahasa daerah. Aplikasi hanya meminta pengguna mengucapkan sendiri. **\[K\]**
- **Merekam suara pengguna.** Menghindari izin mikrofon dan beban privasi. **\[K\]**
- **Chat bebas dengan AI.** Risiko jawaban keliru terlalu tinggi untuk bahasa berdata sedikit. AI hanya membuat dialog terstruktur dengan batas ketat. **\[U\]**
- **Fitur sosial (papan peringkat, teman, berbagi hasil).** Belum ada bukti kebutuhan, dan menambah beban server. **\[U\]**
- **Aksara daerah (Hanacaraka, aksara Bali).** Keterampilan berbeda; fokus pada bahasa lisan. **\[U\]**
- **Antarmuka multibahasa.** Antarmuka berbahasa Indonesia saja. **\[U\]**
- **Verifikasi challenge otomatis.** Challenge adalah tantangan untuk diri sendiri. **\[K\]**
- **Dialek umum dan pewarisan item antardialek.** Tidak ada satu dialek yang bisa dianggap acuan bagi dialek lain, dan sistem pewarisan menambah kerumitan tanpa nilai bagi pengguna. Tiap dialek adalah paket mandiri. **\[K\]**
- **Telemetri dan pembekuan streak.** Tidak ada di MVP. **\[K\]**
- **Paket bahasa dan dialek selain Jawa-Mataraman pada MVP dan POC.** Paket lain menyusul setelah keduanya. Yang dibangun lebih dulu hanyalah mekanisme pemasangannya (P1). **\[K\]**
- **Unduhan otomatis atau di latar belakang, dan antrean unduh yang berjalan sendiri ketika koneksi kembali.** Setiap unduhan dimulai pengguna saat online, sehingga tidak ada lalu lintas jaringan atau kuota data yang terpakai tanpa diminta. **\[U\]**

## 5. Prinsip Desain

1. **Offline dulu.** Semua fitur inti harus jalan tanpa jaringan. Online hanya menambah (akun, AI, unduh paket bahasa tambahan). Pemasangan paket tambahan tetap punya jalur tanpa internet lewat file.
2. **Lisan sebelum tulisan.** Audio penutur asli ada di setiap kata, kalimat, dan baris dialog. Satu-satunya pengecualian adalah dialog AI (P1) yang tidak punya audio penutur asli dan diberi penanda (FR-45).
3. **Dikurasi, bukan digenerate.** Konten statis berasal dari admin dan kontributor penutur asli. Sistem memilih dan merangkai, tidak mengarang.
4. **Tanpa penguncian.** Kurikulum hanya rekomendasi. Pengguna bebas langsung ke latihan atau dialog.
5. **Jujur soal asal konten.** Setiap konten punya status verifikasi, dan konten buatan AI selalu diberi label.

## 6. Model Konsep: Bahasa, Dialek, Register

| Istilah | Arti | Aturan |
| --- | --- | --- |
| Bahasa (state 1) | Jawa, Sunda, Bali, dan seterusnya. | Pengelompok tampilan bagi satu atau lebih dialek. Progres, statistik, dan mastery dihitung per kombinasi bahasa-dialek. |
| Dialek (state 2) | Variasi geografis suatu bahasa, misalnya Jawa Mataraman (Solo-Yogyakarta) atau Jawa Banyumasan. | Tidak ada dialek umum, acuan, atau pewarisan. Tiap kombinasi bahasa-dialek adalah ruang konten mandiri dengan item, progres, dan mastery sendiri. Satu item hanya milik satu kombinasi bahasa-dialek, dan kata yang sama di dua dialek ditulis sebagai dua item terpisah. **\[K\]** Label dialek menunjuk rumpun, bukan kota patokan: Mataraman diperlakukan sebagai satu kesatuan dengan satu bentuk acuan per kata, dan variasi Solo atau Yogyakarta dicatat sebagai keterangan informatif tanpa item baru. **\[K\]** |
| Register | Tingkat tutur: akrab, netral, halus, beserta label lokal (misalnya ngoko, krama). | Tag pada kata, kalimat, dan baris dialog, bukan state. Tiap dialog punya lawan bicara (nenek, teman sebaya, pedagang, tetangga) yang menentukan register yang pas. |
| Item | Kata, kalimat, dialog, challenge. | Punya ID stabil dan unik di dalam paketnya. Koreksi ejaan atau audio mempertahankan ID. Perubahan makna membuat ID baru. |
| Paket konten | File berisi seluruh item satu bahasa-dialek. | Paket Jawa-Mataraman dibundel di aplikasi. Paket lain dipasang lewat unduhan (online) atau impor file (Bagian 7.9). Format dan validasi ada di Bagian 10. |

### Pemetaan register per bahasa **\[K wajib, U isi\]**

Skala tiga tingkat (akrab, netral, halus) dipertahankan, tetapi setiap bahasa wajib punya pemetaan ke label lokal yang dicantumkan di manifest paket. Usulan untuk bahasa Jawa (wajib diverifikasi sebelum rilis): akrab = ngoko, netral = ngoko alus, halus = krama. Krama madya dan krama inggil dicatat sebagai tag tambahan bila diperlukan. Rujukan pemetaan: *Tata Bahasa Jawa Mutakhir* (Balai Bahasa Yogyakarta dan Kanisius). Aturan memilih register menurut lawan bicara ada di Lampiran A.2.

## 7. Persyaratan Fungsional

P0 = harus ada di MVP. P1 = fast follow. P2 = belum dibangun, tetapi arsitektur tidak boleh menghalanginya.

### 7.1 Bahasa, dialek, dan sesi

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-01 | P0 | Pengguna memilih bahasa, lalu dialek. Pilihan penuh hanya untuk kombinasi yang paketnya sudah terpasang di perangkat. Pada MVP hanya ada satu kombinasi terpasang (Jawa, Mataraman, dari bundel), sehingga pemilih boleh disembunyikan tetapi model datanya tetap ada. Setelah P1, kombinasi yang belum terpasang diarahkan ke layar Paket bahasa (FR-86). | Diberikan paket Jawa-Mataraman terpasang, ketika pengguna memilih kombinasi itu, maka semua fitur memakai konten itu. Kombinasi yang belum terpasang tidak bisa dipilih untuk belajar dan menampilkan keterangan akan tersedia nanti (MVP) atau jalan memasangnya (setelah P1), bukan galat. |
| FR-02 | P0 | Pengguna dapat berganti bahasa atau dialek kapan saja tanpa kehilangan progres. | Setelah berganti lalu kembali, statistik dan mastery sebelumnya utuh. |
| FR-03 | P0 | Isolasi dialek: item, progres, dan mastery tiap kombinasi bahasa-dialek terpisah. Tidak ada pewarisan, penimpaan, atau berbagi item antardialek. | Diberikan dua paket dialek dari bahasa yang sama, ketika pengguna belajar di salah satunya, maka progres dan mastery paket lain tidak berubah. |

### 7.2 Kosakata (Vocab)

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-10 | P0 | Daftar kata dengan infinite scroll: kata, audio penutur asli, arti Indonesia atau istilah penerang, kelas kata, tag register. | Daftar memuat bertahap tanpa jaringan. Audio terputar offline. Kata tanpa audio ditandai jelas. |
| FR-11 | P0 | Urutan bawaan mengikuti kurikulum (Bagian 12), bukan alfabetis. Tersedia pencarian dan filter tema atau register. | Pengguna baru melihat unit pertama di atas. Pencarian bekerja offline dan mengabaikan diakritik serta variasi huruf (é, è, ê dianggap e; dh dianggap d; th dianggap t), sehingga mengetik dahar menemukan dhahar. |
| FR-12 | P0 | Kata yang tampil di layar minimal 1 detik masuk log kata-dilihat, dipakai untuk streak dan pemilih konten. | Kata yang hanya lewat sekejap saat scroll cepat tidak tercatat. Hitungan hanya berjalan saat aplikasi aktif di latar depan. Definisi lengkap di Bagian 8.8. |
| FR-13 | P1 | Target kata harian bawaan 10 (kata baru atau ulangan), dapat diubah antara 5 dan 20. **\[U\]** | Perubahan target tersimpan dan tidak memengaruhi syarat streak. |

### 7.3 Latihan: Guess the Word dan Fill the Gap

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-20 | P0 | **Guess the Word:** 4 pilihan, tiga arah (kata ke arti, arti ke kata, audio ke arti). Distraktor berasal dari kelas kata, register, dan tema yang sama. Satu sesi 10 soal. | Tidak pernah ada dua jawaban benar dalam satu soal. Semua distraktor berasal dari bank. |
| FR-21 | P0 | **Fill the Gap:** kalimat bahasa daerah dengan satu rumpang, terjemahan Indonesia selalu tampil sebagai petunjuk, 3 sampai 4 pilihan. Mengetik jawaban adalah P1. | Terjemahan tampil sebelum menjawab. Kata rumpang hanya dari kata yang sudah dilihat pengguna. |
| FR-22 | P0 | **Pemilih konten:** sistem merangkai sesi dengan memilih item dari bank, tidak membuat item baru **\[K\]**. Prioritas: (1) item salah atau lemah, (2) item sudah dilihat tetapi belum dilatih, (3) item baru di unit berjalan. Kalimat boleh dipilih bila kata rumpangnya sudah dilihat dan minimal 80% kata isi lainnya sudah dilihat **\[T\]**. | Diberikan pengguna belum melihat kata X, maka X tidak muncul sebagai jawaban atau rumpang. Item yang baru salah muncul lagi pada sesi berikutnya. |
| FR-23 | P0 | Bank terbatas dan bertambah lewat pembaruan paket. Bila tidak ada item baru yang memenuhi syarat, sesi berisi ulangan item lemah dan aplikasi menyatakan konten baru menyusul. | Tidak pernah tampil sesi kosong atau galat. |
| FR-24 | P0 | Setelah tiap soal: benar atau salah, jawaban benar, audio, dan satu kalimat contoh. | Umpan balik tampil offline. |

### 7.4 Dialog kurasi (offline)

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-30 | P0 | Dialog berbasis skema graf: giliran karakter (teks, audio, terjemahan), titik pilihan 2 sampai 3 opsi, cabang, ending. Metadata: lawan bicara, register, unit, tingkat (L1 sampai L3), kata target. | Dialog yang gagal validasi skema tidak masuk paket. |
| FR-31 | P0 | Jalur pilihan menentukan ending. Tiap ending punya umpan balik dalam bahasa Indonesia tentang pilihan yang pas dan kurang pas, termasuk soal register. | Tidak ada jalan buntu tanpa ending. Tiap ending punya umpan balik. |
| FR-32 | P0 | Langkah **Ucapkan sendiri**: aplikasi meminta pengguna mengucapkan kalimat pilihannya dengan suara keras. Tanpa rekaman, tanpa penilaian, dapat dilewati. **\[K\]** | Aplikasi tidak pernah meminta izin mikrofon. |
| FR-33 | P1 | Terjemahan baris dapat ditampilkan atau disembunyikan. Mode Tanpa Bantuan menyembunyikannya bawaan. **\[U\]** | Pilihan mode tersimpan per pengguna. |
| FR-34 | P0 | Setiap titik pilihan punya satu jenis uji. **Register:** semua opsi menjawab pembicaraan yang sama dan hanya berbeda tingkat tutur (pas, cukup, kurang pas). **Pemahaman:** sedikitnya satu opsi nyambung dengan pembicaraan dan sedikitnya satu opsi tidak berkaitan (pas dan tidak nyambung). Satu dialog boleh memadukan keduanya. **\[K\]** | Titik register tidak memuat opsi tidak nyambung. Titik pemahaman memuat sedikitnya satu opsi pas dan satu opsi tidak nyambung. |
| FR-35 | P0 | Pengulangan: memilih opsi tidak nyambung menampilkan balasan perbaikan dari lawan bicara (misalnya tanda ia tidak paham atau heran), lalu pertanyaan yang sama diulang dengan pilihan yang sama. Balasan perbaikan melekat pada opsi, bukan node atau cabang baru, dan tidak ada batas jumlah pengulangan. **\[K\]** Balasan memakai register yang cocok dengan lawan bicara dan tidak merendahkan pengguna. **\[U\]** | Opsi tidak nyambung selalu kembali ke node yang sama. Pengguna tidak bisa maju sebelum memilih opsi yang nyambung. Alat pembuat paket menolak titik pemahaman tanpa opsi nyambung. |

### 7.5 Dialog AI (online)

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-40 | P1 | Saat online dan masuk dengan akun, pengguna dapat memulai dialog buatan AI dengan skema yang sama seperti FR-30, ditampilkan oleh renderer yang sama. **\[K\]** Dialog AI wajib akun, dan akun hanya untuk pengguna 18 tahun ke atas (pernyataan diri) sampai mekanisme persetujuan orang tua dibangun (Bagian 11.7). **\[K\]** | Dialog AI dan dialog kurasi tidak dapat dibedakan secara fungsi, hanya lewat label. Pengguna tanpa akun melihat ajakan masuk, bukan galat. |
| FR-41 | P1 | Maksimal 3 sesi per hari per akun **\[K\]**. Hari dihitung server menurut zona waktu yang tersimpan di profil akun (bukan jam perangkat), dan zona waktu profil hanya dapat diubah sekali per 24 jam. **\[K\]** Hanya sesi yang berhasil dibuat yang dihitung. | Sesi ke-4 menampilkan pesan batas dan menawarkan dialog kurasi. Kegagalan generasi tidak memotong kuota. |
| FR-42 | P1 | Validasi otomatis sebelum tampil: skema valid, minimal 80% kata sudah dilihat pengguna **\[T\]**, maksimal 3 kata baru dan semuanya dari bank dengan glosa, register sesuai lawan bicara, tidak ada kata di luar bank. Gagal: regenerasi maksimal 2 kali, lalu fallback ke dialog kurasi. | Dialog yang gagal validasi tidak pernah sampai ke pengguna. |
| FR-43 | P1 | Label **Dibuat AI, belum diverifikasi penutur** selalu tampil. Tombol Laporkan kalimat ini mengantre laporan untuk ditinjau admin. | Laporan saat offline tersimpan dan terkirim saat online. |
| FR-44 | P1 | Kredit mastery dialog AI berbobot lebih rendah **\[K\]**, 0,5 sesuai ketetapan pemilik produk untuk MVP **\[K\]**. | Lihat Bagian 8. |
| FR-45 | P1 | Dialog AI tidak memiliki audio penutur asli. Baris AI tampil dengan penanda Tanpa audio, dan suara sintesis tidak dipakai karena tidak menjamin dialek dan bunyi yang benar. Kata yang sudah punya audio di bank tetap dapat diputar. **\[K\]** | Tidak ada tombol audio yang gagal diputar pada baris AI, dan penanda tampil jelas. |

### 7.6 Profil dan penyimpanan

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-50 | P0 | Mode tanpa akun: seluruh data tersimpan lokal di perangkat. | Semua fitur P0 berjalan tanpa login. |
| FR-51 | P1 | Mode akun menggunakan Supabase Auth untuk autentikasi dan Supabase Postgres untuk profil serta data belajar tersinkron. Metode masuk: (1) surel dan kata sandi dengan konfirmasi surel, (2) nomor telepon dengan verifikasi OTP SMS, dan (3) Google OAuth. Ketiganya ditangani melalui Supabase Auth; aplikasi tidak menyimpan kata sandi atau OTP sendiri. Akun hanya untuk pengguna berusia 18 tahun ke atas (FR-54 dan Bagian 11.7). **\[K\]** | Pengguna dapat mendaftar/masuk dengan ketiga metode; surel harus terkonfirmasi, nomor telepon harus lolos OTP, dan Google OAuth kembali ke aplikasi melalui redirect URI terdaftar. Setelah masuk di perangkat baru, progres server dipulihkan dan digabung mengikuti Bagian 9. Pengguna tanpa akun tetap dapat memakai semua fitur P0 secara offline. |
| FR-51A | P1 | Sinkronisasi progres belajar berjalan otomatis untuk pengguna akun yang berusia 18 tahun ke atas ketika sesi valid dan jaringan tersedia. Sinkronisasi mencakup progres seluruh paket yang pernah memiliki data belajar, termasuk paket yang saat ini tidak terpasang di perangkat. Perilaku siklus sinkronisasi, status, pemulihan, dan konflik mengikuti Bagian 9.2; struktur tabel dan kontrak API ditentukan di dokumen Arsitektur Sistem. **\[K\]** | Setelah progres dibuat atau berubah, data tetap tersimpan lokal terlebih dahulu dan masuk antrean. Saat sinkronisasi berhasil, progres tersedia di akun dan dapat dipulihkan pada perangkat lain. Paket yang belum terpasang ditandai sebagai memiliki progres; setelah paket dipasang, mastery dan statistik yang relevan muncul kembali. Gangguan jaringan tidak menghilangkan progres lokal atau menghentikan fitur offline. |
| FR-52 | P0 | Data disimpan di basis data lokal pada penyimpanan internal aplikasi (bukan cache), dan aplikasi memberi peringatan bahwa menghapus aplikasi atau datanya tanpa akun atau cadangan akan menghilangkan progres, dan paket tambahan yang sudah dipasang (P1) ikut terhapus sehingga perlu dipasang ulang. **\[U\]** | Pengguna tanpa akun melihat peringatan jelas tentang risiko kehilangan data. |
| FR-53 | P1 | Ekspor dan impor cadangan data sebagai file bagi pengguna tanpa akun. Cadangan memuat data belajar saja, bukan berkas paket. **\[U\]** | Cadangan hasil ekspor dapat diimpor di perangkat lain dengan aturan Bagian 9. Progres untuk paket yang belum terpasang di perangkat tujuan tetap tersimpan dan tampil setelah paketnya dipasang (FR-83 atau FR-85). |
| FR-54 | P0 | Alur pertama kali: sambutan singkat (maksimal 3 layar, dapat dilewati), pemasangan paket bundel Jawa-Mataraman dengan indikator progres (tanpa unduhan wajib dan tanpa permintaan jaringan), pemilih bahasa-dialek (disembunyikan bila hanya satu paket terpasang), peringatan data lokal (FR-52), tanpa meminta data pribadi, serta layar usia: pengguna memilih tahun lahir yang hanya disimpan di perangkat. Di bawah 10 tahun: pesan ramah bahwa aplikasi untuk usia 10 tahun ke atas dan pengguna tidak melanjutkan. Usia 10 sampai 17 tahun: semua fitur P0, sedangkan akun, sinkronisasi, dan dialog AI disembunyikan. Usia 18 tahun ke atas: semua fitur. **\[K\]** | Diberikan pemasangan baru dalam mode pesawat, ketika aplikasi dibuka, maka pemasangan paket selesai dalam 10 detik **\[T\]** dan pengguna masuk ke Kosakata unit 1. Tahun lahir tidak pernah dikirim ke server. Pemasangan yang gagal menampilkan Coba lagi dan tidak meninggalkan data setengah jadi. |
| FR-55 | P0 | Pengaturan dan data: Reset progres per paket (konfirmasi dua langkah, menghapus log, kekuatan, skor, dan hari aktif paket itu) dan Hapus semua data (kembali ke kondisi baru). Reset satu paket tidak mengubah paket lain. **\[K\]** | Setelah reset, mastery paket itu 0 dan peringatan data hilang tidak muncul lagi pada data kosong. Tanpa konfirmasi kedua, data tidak terhapus. |
| FR-56 | P0 | Halaman Tentang: versi aplikasi dan paket, kredit kontributor dan penutur, lisensi konten (Bagian 11.7), kebijakan privasi, batas usia minimum 10 tahun, serta kanal pelaporan penyalahgunaan atau pelanggaran hak anak (surel). **\[K\]** | Semua tampil offline. Kredit sesuai catatan persetujuan penutur. |
| FR-57 | P1 | Pengingat harian lokal: notifikasi lokal opsional pada jam pilihan, tanpa server. Izin notifikasi hanya diminta saat pengguna mengaktifkannya, bahasa positif tanpa rasa bersalah, dan tidak dikirim bila hari ini sudah aktif. **\[K\]** | Mematikan pengingat membatalkan semua jadwal. Aplikasi tetap tidak meminta izin mikrofon, kamera, atau lokasi. |
| FR-58 | P1 | Hapus akun tersedia dari dalam aplikasi. Alur menghapus akun Supabase Auth beserta profil, progres, log kejadian, pengaturan, dan data server lain yang terhubung ke `user_id`, sesuai Bagian 9. Penghapusan dijalankan melalui endpoint server tepercaya atau fungsi server dengan validasi sesi; kunci `service_role` tidak pernah ditanam di aplikasi. **\[K\]** | Setelah konfirmasi ulang dan autentikasi ulang bila sesi kedaluwarsa, akun tidak bisa masuk lagi dan data server dihapus sesuai Bagian 9. Data lokal tetap ada kecuali pengguna memilih Hapus semua data. Kegagalan penghapusan ditampilkan jelas dan dapat dicoba kembali. |
| FR-59 | P1 | Laporkan kesalahan konten kurasi (kata, kalimat, dialog, audio): membuka draf surel atau pesan berisi id_paket, id_item, versi paket, dan catatan yang diketik pengguna, dikirim lewat aplikasi pesan milik pengguna. Tanpa server pada tahap ini. Dengan akun, laporan antre dan terkirim saat online (selaras FR-43). **\[K\]** | Tidak ada izin tambahan dan tidak ada data pribadi selain yang diketik pengguna. |

### 7.7 Gamifikasi

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-60 | P0 | Streak harian global (lintas bahasa dan dialek) sesuai Bagian 8. | Belajar di dua bahasa pada hari yang sama menambah streak satu kali. |
| FR-61 | P0 | Statistik penyelesaian per bahasa dan dialek: sesi per jenis latihan, akurasi, dialog selesai per ending, sisa kuota dialog AI. | Challenge tidak muncul di statistik. |
| FR-62 | P0 | Mastery per kombinasi bahasa-dialek, dengan level L1 sampai L5 (Bagian 8). | Mastery tiap kombinasi tampil terpisah dari kombinasi lain. |

### 7.8 Challenge

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-70 | P0 | Kartu challenge per unit dan tingkat, berasal dari paket konten dan ditulis sesuai Bagian 13. | Challenge tampil offline. |
| FR-71 | P0 | Challenge tidak memengaruhi streak, mastery, statistik, atau log apa pun. **\[K\]** | Menyelesaikan challenge tidak mengubah angka apa pun. |
| FR-72 | P0 | Setiap challenge punya varian solo dan varian sosial. Pengguna memilih salah satu. | Tidak ada challenge yang mewajibkan orang kedua. |
| FR-73 | P1 | Centang pribadi Sudah kucoba, hanya tersimpan lokal dan tidak dihitung ke mana pun. **\[K\]** Prioritas tetap P1 (Bagian 17.2). | Centang tidak masuk sinkronisasi dan tidak memengaruhi angka. |

### 7.9 Paket konten: bundel, unduh, dan pasang dari file

Paket Jawa-Mataraman dibundel di aplikasi agar pembukaan pertama tidak membutuhkan internet dan ukuran aplikasi tetap kecil. Paket bahasa dan dialek lain tidak dibundel. Paket lain menyusul setelah MVP dan POC, dan mekanisme pemasangannya (FR-83 dan FR-85 sampai FR-88) adalah P1. **\[K\]** Semua jalur berbagi satu format paket dan satu rangkaian validasi (Bagian 10).

| Jalur | Kapan tersedia | Cara kerja | P |
| --- | --- | --- | --- |
| Bundel | Pembukaan pertama, tanpa internet | Aplikasi memasang paket Jawa-Mataraman dari dirinya sendiri (FR-80). | P0 |
| Unduh dan pasang | Hanya saat online | Pengguna memilih paket di layar Paket bahasa, lalu aplikasi mengunduh dan langsung memasangnya (FR-83). Saat offline fitur ini tidak tersedia (FR-86). | P1 |
| Pasang dari file | Kapan saja, wajib tersedia saat offline | Pengguna memperoleh file paket lewat berbagi file, lalu memilihnya lewat menu Pasang paket dari file (FR-85). | P1 |

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-80 | P0 | Paket bundel: aplikasi membawa paket Jawa-Mataraman dan memasangnya ke penyimpanan lokal saat pertama dibuka, tanpa internet, dengan validasi yang sama seperti impor (Bagian 10). Paket bahasa dan dialek lain tidak dibundel agar ukuran aplikasi tidak besar. **\[K\]** | Setelah pemasangan pertama dalam mode pesawat, semua fitur P0 berjalan. Build aplikasi tidak memuat paket selain Jawa-Mataraman dan ukuran pemasangan memenuhi Bagian 14. |
| FR-81 | P0 | Satu paket per kombinasi bahasa-dialek memuat seluruh konten dan membuka seluruh fitur kombinasi itu **\[K\]**. Paket berdiri sendiri tanpa ketergantungan pada paket lain. | Memasang satu paket tidak mengubah dan tidak membutuhkan paket lain. |
| FR-82 | P0 | Pembaruan konten pada MVP lewat pembaruan aplikasi (paket bundel versi lebih tinggi). Kelak, paket yang dipasang lewat unduhan atau impor file diperbarui dengan memasang versi yang lebih tinggi lewat jalur yang sama (FR-83 atau FR-85). Progres dipertahankan. | Setelah pembaruan, mastery dan statistik tidak berubah kecuali oleh perubahan pembagi. |
| FR-83 | P1 | Unduh dan pasang (hanya saat online): di layar Paket bahasa (FR-86), pengguna memilih paket dari katalog lalu mengetuk Unduh dan pasang. Aplikasi mengunduh paket dan langsung memasangnya dengan validasi yang sama seperti impor (Bagian 10), tanpa langkah berkas manual. **\[K\]** Unduhan selalu dimulai pengguna dan tidak berjalan di latar belakang. Sebelum mulai, aplikasi menampilkan ukuran unduhan, memeriksa ruang penyimpanan, dan memberi peringatan bila memakai data seluler. Progres tampil dengan tombol Batal. Paket terpasang yang punya versi lebih tinggi di katalog diberi label Pembaruan tersedia dan diperbarui lewat tombol yang sama. **\[U\]** | Diberikan perangkat online dan paket belum terpasang, ketika pengguna mengetuk Unduh dan pasang, maka paket terunduh, lolos validasi, terpasang, dan langsung muncul di pemilih bahasa-dialek (FR-01) tanpa membuka aplikasi lain. Unduhan yang dibatalkan, terputus, ditolak validasi, atau kehabisan ruang menampilkan pesan jelas dengan Coba lagi, membuang berkas sementara, dan tidak mengubah paket maupun progres yang ada. Memasang paket baru tidak mengubah paket lain (FR-81). Aplikasi tidak mengunduh apa pun tanpa ketukan pengguna. |
| FR-84 | P2 | Paket selisih (delta) untuk pembaruan kecil. | Tidak dibangun di MVP. |
| FR-85 | P1 | Pasang paket dari file: menu Pasang paket dari file (pemilih file) memungkinkan pengguna memasang paket yang diperoleh lewat berbagi file (flashdisk lewat pengelola berkas, Bluetooth, WhatsApp, atau unduhan peramban). Menu ini berfungsi tanpa internet dan menjadi satu-satunya jalur pemasangan paket tambahan saat offline. **\[K\]** Rincian: menerima ekstensi `.skpaket` dan `.zip`, validasi lengkap (Bagian 10), indikator progres, pesan galat yang jelas, dan panduan singkat berbagi file (Bagian 10). **\[U\]** | Diberikan perangkat dalam mode pesawat dan file paket bertanda tangan sah, ketika pengguna memilih file lewat menu itu, maka paket terpasang dan bisa dipilih tanpa internet. File `.zip` hasil penggantian nama dari `.skpaket` tetap diterima. Paket rusak, bertanda tangan salah, bahasa-dialek tidak didukung, atau versi lebih rendah ditolak dengan alasan yang jelas tanpa mengubah data yang ada. Versi sama menampilkan Sudah terpasang. |
| FR-86 | P1 | Layar Paket bahasa (di Pengaturan): daftar paket terpasang (bahasa, dialek, versi, ukuran, asal pemasangan), daftar paket yang punya progres tetapi belum terpasang di perangkat ini (misalnya setelah pulih dari akun atau cadangan), dan tombol Pasang paket dari file (FR-85). Saat online, layar juga menampilkan katalog paket yang tersedia beserta ukuran dan versinya dengan tombol Unduh dan pasang (FR-83). Saat offline, katalog tidak dimuat dan tombol Unduh dan pasang tidak ditampilkan; layar hanya memberi keterangan bahwa tidak ada internet dan mengarahkan ke Pasang paket dari file. **\[K\]** Online berarti ada koneksi dan server katalog menjawab dalam 10 detik **\[T\]**. Bila ada koneksi tetapi server tidak terjangkau, layar menampilkan galat jelas dengan Coba lagi dan tetap menawarkan Pasang paket dari file. Katalog hanya diminta saat layar ini dibuka dalam keadaan online, tidak saat aplikasi dibuka dan tidak di latar belakang. **\[U\]** | Diberikan perangkat dalam mode pesawat, ketika pengguna membuka layar Paket bahasa, maka tidak ada tombol Unduh dan pasang, tidak ada permintaan jaringan, dan tombol Pasang paket dari file tetap berfungsi. Diberikan perangkat online, ketika layar dibuka, maka katalog tampil dengan ukuran dan versi tiap paket. Selama hanya ada satu paket rilis, katalog menampilkan paket terpasang dan keterangan Paket lain akan menyusul. |
| FR-87 | P1 | Ekspor paket terpasang: pengguna dapat membagikan paket yang terpasang ke pengguna lain lewat lembar berbagi sistem (WhatsApp, Bluetooth, atau flashdisk) sebagai berkas `.skpaket` asli bertanda tangan, tidak diubah sehingga tanda tangan tetap sah. **\[U\]** Untuk itu aplikasi menyimpan salinan arsip asli tiap paket yang dipasang lewat unduhan atau file, sedangkan paket Jawa-Mataraman diekspor dari arsip bundel. **\[K\]** | Paket hasil ekspor lolos validasi dan terpasang di perangkat lain lewat FR-85 dalam mode pesawat, dan checksum berkas ekspor sama dengan arsip asli. Ekspor tidak mengubah paket terpasang maupun progres. |
| FR-88 | P1 | Hapus paket tambahan: pengguna dapat menghapus paket yang dipasang lewat unduhan atau file untuk mengosongkan ruang, dengan konfirmasi dua langkah. Penghapusan membuang berkas konten paket beserta salinan arsip aslinya, tetapi tidak menghapus log belajar (berbeda dari Reset progres, FR-55), sehingga memasang ulang paket itu memulihkan mastery dan statistiknya (Bagian 8.7 dan 9). Paket bundel Jawa-Mataraman tidak dapat dihapus. **\[U\]** | Setelah hapus lalu pasang ulang paket yang sama, mastery dan statistik kembali seperti sebelum dihapus. Menghapus satu paket tidak mengubah paket lain. Tanpa konfirmasi kedua, paket tidak terhapus. |

### 7.10 Admin dan kontributor

| ID | P | Persyaratan | Kriteria penerimaan |
| --- | --- | --- | --- |
| FR-90 | P0 | Pada MVP, admin menyusun konten lewat templat spreadsheet atau JSON dan alat pembuat paket yang menghasilkan paket bertanda tangan. | Alat menolak konten yang melanggar aturan Bagian 11 dan daftar validasi Bagian 10. |
| FR-91 | P1 | Portal kontributor untuk mengajukan kata, kalimat, dialog, dan rekaman suara, dengan alur status di Bagian 11. **\[K peran, U bentuk\]** | Konten tidak terverifikasi tidak dapat masuk paket. |
| FR-92 | P2 | Perekaman suara langsung dari ponsel kontributor di dalam portal. | Tidak dibangun di MVP. |
| FR-93 | P1 | Penerbitan katalog: alat pembuat paket (FR-90) menghasilkan berkas katalog bertanda tangan yang memuat paket rilis yang tersedia untuk diunduh (Bagian 10), dan menyiapkan katalog beserta paketnya untuk diterbitkan (deploy) ke proyek Vercel. Paket berstatus `poc` atau tidak terverifikasi tidak dapat masuk katalog. **\[U\]** | Katalog bertanda tangan salah ditolak oleh aplikasi. Paket `poc` ditolak oleh alat penerbit. |

## 8. Aturan Mastery, Streak, dan Statistik

### 8.1 Kekuatan item

Setiap item latihan (kata dan kalimat) punya **kekuatan** bernilai 0 sampai 1. Nilainya 0 sebelum pernah dilihat dan 0,1 saat pertama dilihat. Setiap jawaban memperbarui kekuatan:

kekuatan baru = kekuatan lama + 0,3 × bobot × (hasil − kekuatan lama)

Hasil bernilai 1 bila benar dan 0 bila salah. Bobot 1,0 untuk konten kurasi dan 0,5 untuk dialog AI **\[K\]**. Dalam dialog kurasi, pilihan yang pas memberi hasil 1 pada kata-kata target yang muncul di pilihan itu.

Kekuatan adalah nilai turunan dari log jawaban. Log disimpan append-only di SQLite dan tidak dipangkas di MVP. Kekuatan boleh disimpan sebagai cache demi kecepatan, tetapi harus bisa dibangun ulang kapan saja dengan memutar ulang log berurutan waktu kejadian (seri diurutkan menurut ID kejadian). **\[K\]**

**Sumber pembaruan kekuatan** **\[U\]**

- **Kata:** diperbarui oleh Guess the Word dan oleh dialog kurasi (hanya pilihan pas).
- **Kalimat:** diperbarui oleh Fill the Gap. Kata rumpangnya tidak ikut diperbarui, agar tidak terjadi kredit ganda.
- **Dialog:** pilihan cukup, kurang pas, dan tidak nyambung tidak mengubah kekuatan kata mana pun. Kesalahan register hanya memengaruhi skor dialog.

### 8.2 Komponen dan rumus mastery **\[K untuk MVP\]**

Rumus dan bobot di bawah ditetapkan pemilik produk untuk MVP dan ditinjau ulang setelah ada data uji lapangan.

- **Kosakata** = rata-rata kekuatan kata dalam cakupan.
- **Kalimat** = rata-rata kekuatan kalimat dalam cakupan.
- **Dialog** = rata-rata skor terbaik dialog kurasi. Skor satu permainan adalah rata-rata skor semua titik pilihannya, dan skor terbaik adalah nilai tertinggi dari semua permainan. Titik register: pas 1, cukup 0,5, kurang pas 0. Titik pemahaman: nyambung pada percobaan pertama 1, nyambung setelah satu atau lebih pengulangan 0,5. **\[K\]** Dialog AI tidak masuk komponen ini dan hanya memberi kredit lewat kekuatan kata.

**Mastery = 100 × (0,5 × Kosakata + 0,25 × Kalimat + 0,25 × Dialog).** Level: L1 0 sampai 19, L2 20 sampai 39, L3 40 sampai 59, L4 60 sampai 79, L5 80 sampai 100. Ambang level dibiarkan apa adanya sampai ada data uji lapangan. Simulasi menunjukkan pengguna tekun mencapai sekitar 48 pada hari ke-120 dengan volume latihan MVP, sehingga L4 baru tercapai lebih lama, dan angka ini ditinjau ulang setelah uji lapangan. **\[K\]**

### 8.3 Cakupan: mastery per kombinasi bahasa-dialek **\[K\]**

Mastery dihitung per kombinasi bahasa-dialek. Item yang dihitung adalah semua item di paket kombinasi itu, dan pembaginya adalah jumlah item di paket tersebut. Tidak ada mastery lintas dialek dan tidak ada pewarisan progres antardialek, karena item tiap dialek berdiri sendiri. Bila kelak ada ringkasan per bahasa, ia hanya mendaftar mastery tiap dialek tanpa menggabungkannya.

Mastery adalah nilai turunan. Ia dihitung ulang dari kekuatan dan skor (dan kekuatan sendiri diturunkan dari log jawaban, Bagian 8.1), tidak disimpan sebagai sumber kebenaran, sehingga aman untuk penggabungan data.

### 8.4 Prioritas ulangan

Pemilih konten memakai peluruhan 0,97 per hari sejak ulangan terakhir **hanya untuk prioritas**, sehingga item lama muncul lagi. Peluruhan tidak menurunkan mastery yang ditampilkan, supaya tidak mematahkan semangat. **\[U/T\]**

Rumus **\[U\]**: `kekuatan efektif = kekuatan × 0,97^(hari sejak ulangan terakhir)` dan `prioritas = 1 − kekuatan efektif`. Pemilih konten (FR-22) menyusun sesi dengan urutan kelompok: (1) item pernah dijawab dengan kekuatan efektif di bawah 0,5 atau salah pada jawaban terakhir, (2) item sudah dilihat tetapi belum pernah dijawab, (3) item baru di unit berjalan. Dalam satu kelompok, item berprioritas tertinggi didahulukan. Item berkekuatan efektif 0,5 ke atas hanya mengisi sisa sesi.

### 8.5 Streak

Hari dihitung aktif bila pengguna melihat minimal 10 kata unik (tampil minimal 1 detik) di layar kosakata. Kata boleh baru maupun yang pernah dilihat, dan memutar audio bukan syarat, karena kosakata MVP masih terbatas. **\[K\]** Aturan lain:

- Streak bersifat global: kata unik dihitung gabungan lintas bahasa dan dialek.
- Tanggal mengikuti zona waktu perangkat saat kejadian dan disimpan sebagai tanggal_lokal (Bagian 8.8).
- Streak adalah jumlah hari aktif berurutan sampai hari ini, atau sampai kemarin bila hari ini belum aktif.
- Tidak ada fitur membekukan streak di MVP, dan dievaluasi setelah MVP. **\[K\]**

### 8.6 Statistik

Per bahasa dan dialek: jumlah sesi per jenis latihan, akurasi 7 hari terakhir, dialog selesai per ending, dan kuota dialog AI hari ini (misalnya 1 dari 3). Challenge tidak muncul di sini. **\[K\]**

### 8.7 Pembaruan paket dan batas mastery **\[K\]**

Mastery selalu berada di antara 0 dan 100 untuk versi paket yang terpasang. Nilai 100 berarti menguasai seluruh isi versi itu, bukan menguasai bahasa tanpa batas. Karena paket bisa bertambah, aturannya:

- Mastery dihitung ulang dari semua item versi terpasang. Item baru masuk pembagi dengan kekuatan 0 dan skor 0, sehingga nilai bisa turun setelah pembaruan.
- Item yang dihapus tidak dihitung di pembagi dan progresnya tetap tersimpan (Bagian 9). Item yang ID-nya berganti dihitung sebagai item baru.
- Level tertinggi yang pernah dicapai disimpan sebagai pencapaian dan tidak ikut turun. Layar menampilkan level saat ini, pencapaian tertinggi, dan jumlah item baru sejak pembaruan, supaya penurunan terbaca sebagai bertambahnya isi dan bukan hilangnya kemampuan.

### 8.8 Definisi pelengkap **\[K\]**

- **Kata dilihat:** tampil minimal 1 detik di layar kosakata saat aplikasi aktif di latar depan (layar mati atau aplikasi di latar belakang menghentikan hitungan), atau muncul sebagai kata target bersorot dengan glosa di dialog kurasi. Hanya jalur pertama yang dihitung untuk streak (Bagian 8.5).
- **Kalimat dilihat:** pertama kali tampil di Fill the Gap. Sejak itu kekuatannya 0,1 dan berlaku rumus Bagian 8.1.
- **Unit berjalan:** unit pertama, berurutan, yang belum mencapai 80% katanya dilihat **\[T\]**. Pengguna yang membuka unit lain langsung (tanpa penguncian) menjadikan unit itu unit berjalan selama sesi tersebut. Pemilih konten (FR-22) memakai unit berjalan untuk kelompok item baru.
- **Pengecoh saat bank sedikit:** pengecoh hanya diambil dari kata yang sudah dilihat. Urutan pelonggaran: kelas kata, register, dan tema sama; lalu kelas kata dan register sama; lalu kelas kata sama; lalu kata terlihat apa pun. Latihan membutuhkan minimal 6 kata terlihat. Di bawah itu aplikasi mengajak ke Kosakata sebagai keadaan kosong, bukan galat.
- **Sesi terputus:** jawaban dicatat saat dijawab, sehingga kekuatan tetap berubah. Sesi latihan yang terputus tidak dilanjutkan dan tidak dihitung sebagai sesi selesai. Dialog yang terputus tidak dilanjutkan dan tidak mencatat skor, karena skor hanya dicatat saat ending tercapai. Pembaruan kekuatan dari pilihan pas yang sudah dibuat tetap berlaku.
- **Tanggal:** setiap kejadian menyimpan tanggal_lokal (YYYY-MM-DD menurut zona waktu perangkat saat kejadian). Hari aktif adalah himpunan tanggal_lokal. Perubahan zona waktu tidak menghapus tanggal yang sudah tercatat. Mengubah jam perangkat tidak dicegah di MVP karena dampaknya hanya pada diri sendiri.
- **Kunci progres:** semua progres dikunci pada pasangan (id_paket, id_item), karena ID item hanya unik di dalam satu paket.

## 9. Aturan Penggabungan Data (lokal, akun, dan banyak perangkat) **\[U\]**

**Prinsip:** (1) penggabungan biasa tidak pernah menghapus data; pengecualian hanya tindakan destruktif yang diminta dan dikonfirmasi pengguna seperti reset progres atau penghapusan akun, (2) setiap catatan punya ID unik dari perangkat, (3) nilai turunan selalu dihitung ulang setelah penggabungan, (4) penggabungan aman diulang tanpa menggandakan data.

### 9.1 Identitas akun dan penyimpanan Supabase **\[K\]**

Supabase menjadi layanan akun untuk P1. **Supabase Auth** mengelola kredensial, sesi, identitas penyedia, konfirmasi surel, OTP telepon, dan alur OAuth Google. **Supabase Postgres** menyimpan profil aplikasi dan data belajar yang perlu disinkronkan. SQLite tetap menjadi penyimpanan lokal utama untuk penggunaan offline; Supabase tidak menggantikan basis data lokal.

| Entitas | Penyimpanan | Medan minimum dan aturan |
| --- | --- | --- |
| Identitas autentikasi | `auth.users` yang dikelola Supabase Auth | ID UUID stabil (`user_id`), surel dan status konfirmasi jika tersedia, nomor telepon dan status konfirmasi jika tersedia, metadata penyedia OAuth yang dikelola Supabase, waktu pembuatan dan masuk terakhir. Aplikasi tidak membaca atau menyimpan kata sandi maupun OTP. |
| Profil aplikasi | Tabel `public.profiles` | `id` sebagai FK unik ke `auth.users.id`, `display_name` opsional, `timezone` untuk kuota AI, `created_at`, `updated_at`. Surel dan nomor telepon tidak disalin ke tabel profil; sumber otoritatifnya tetap Supabase Auth. |
| Data belajar tersinkron | Tabel-tabel progres/log server dengan `user_id` | Log kejadian, hari aktif, skor dialog, pencapaian, dan pengaturan yang memang disinkronkan menurut aturan Bagian 9. Data lokal yang tidak disinkronkan (termasuk centang FR-73) tetap lokal. |
| Relasi penyedia masuk | Identitas yang dikelola Supabase Auth | Surel, telepon, dan Google dapat menjadi metode masuk ke akun yang sama hanya melalui alur penautan/konfirmasi yang didukung Supabase. Jangan menggabungkan akun otomatis hanya karena alamat surel tampak sama. |

**Aturan autentikasi:**
- **Surel:** pendaftaran menggunakan surel dan kata sandi melalui Supabase Auth. Konfirmasi surel wajib sebelum fitur akun/sinkronisasi aktif. Tautan konfirmasi dan pemulihan kata sandi ditangani lewat alur Supabase Auth.
- **Nomor telepon:** format nomor dinormalisasi ke E.164. Verifikasi OTP SMS wajib sebelum nomor dapat digunakan untuk masuk atau ditautkan ke akun. OTP hanya digunakan untuk verifikasi, memiliki masa berlaku dan batas percobaan sesuai konfigurasi Supabase, serta tidak disimpan dalam tabel aplikasi atau log aplikasi. Penyedia SMS dan batas biaya dikonfigurasi sebelum fitur telepon dirilis.
- **Google OAuth:** proses masuk menggunakan alur OAuth Supabase dengan Google sebagai provider, redirect URI yang didaftarkan, dan deep link kembali ke aplikasi Expo. Token provider tidak ditulis ke log atau disimpan sendiri oleh aplikasi di luar kebutuhan sesi resmi Supabase.
- **Sesi:** access/refresh token dikelola oleh integrasi Supabase Auth pada penyimpanan perangkat yang sesuai untuk kredensial. Logout mencabut sesi sesuai kemampuan Supabase, menghapus token lokal, dan menanyakan apakah data lokal ingin dipertahankan.
- **Penautan akun:** jika pengguna sudah mempunyai akun lalu masuk dengan metode lain, aplikasi tidak membuat penggabungan berdasarkan kesamaan surel saja. Pengguna harus membuktikan kendali atas metode yang akan ditautkan; konflik identitas menampilkan instruksi pemulihan yang jelas.
- **Usia:** autentikasi tidak ditawarkan kepada pengguna di bawah 18 tahun. Tahun lahir dari FR-54 tetap lokal dan tidak dikirim ke Supabase.

**Keamanan data Supabase:**
- Semua tabel yang dapat diakses dari aplikasi mengaktifkan Row Level Security (RLS). Kebijakan membatasi baca/tulis hanya pada baris yang `user_id = auth.uid()`; pengecualian hanya untuk operasi server yang ditentukan secara eksplisit.
- Kunci publik/anon Supabase boleh berada di aplikasi hanya sebagai kunci publik proyek dengan RLS aktif. Kunci `service_role`, rahasia OAuth, dan kredensial penyedia SMS hanya disimpan di konfigurasi server/secret manager, tidak pernah di repositori atau bundle aplikasi.
- Komunikasi memakai HTTPS. Data autentikasi dan progres tidak dicatat ke log aplikasi, log analitik, atau laporan galat. Tidak ada telemetri atau pelacakan pihak ketiga.
- Akses server-side yang memerlukan hak administratif berjalan di fungsi server tepercaya, memvalidasi sesi pengguna dan memeriksa kepemilikan data sebelum membaca, mengubah, atau menghapus data.
- Cadangan, retensi, dan penghapusan mengikuti kebijakan Supabase yang dikonfigurasi dan Bagian 11.7; kebijakan privasi menjelaskan data yang disimpan, tujuan sinkronisasi, penyedia layanan, dan prosedur penghapusan akun.

### 9.2 Siklus sinkronisasi dan pemulihan akun **[K]**

Bagian ini menetapkan perilaku yang terlihat oleh pengguna. Rincian struktur tabel, indeks, bentuk payload, dan kontrak API ditentukan dalam dokumen Arsitektur Sistem; PRD tidak menetapkan skema tabel Supabase secara rinci.

**Pemicu dan urutan sinkronisasi**

1. **Perubahan progres saat belajar:** aplikasi menyimpan kejadian ke SQLite terlebih dahulu. Kejadian baru diberi ID unik dan masuk antrean sinkronisasi; layar belajar tidak perlu menunggu server.
2. **Kondisi yang memulai sinkronisasi:** aplikasi mencoba menyinkronkan ketika pengguna berhasil masuk, aplikasi dibuka atau kembali ke latar depan saat online, koneksi pulih, serta setelah ada perubahan progres saat sesi akun masih valid. Pengiriman boleh dikelompokkan agar tidak membuat permintaan jaringan untuk setiap ketukan.
3. **Pengiriman dan penggabungan:** aplikasi mengirim kejadian lokal yang belum terkonfirmasi dan meminta perubahan akun yang belum ada di perangkat. Server hanya menerima data milik akun pada sesi aktif. Kedua sisi digabung dengan aturan di Bagian 9; data server tidak ditimpa oleh snapshot lokal secara keseluruhan.
4. **Konfirmasi:** setelah server mengonfirmasi penerimaan, kejadian terkait ditandai tersinkron di perangkat. Progres turunan—termasuk kekuatan item, mastery, hari aktif/streak, skor dialog, dan level—dihitung ulang dari data yang sudah digabung sesuai aturan Bagian 8 dan tabel aturan gabung di bawah.
5. **Gagal atau terputus:** data lokal dan antrean tetap dipertahankan. Aplikasi menandai sinkronisasi sebagai tertunda/gagal dengan pesan yang dapat dipahami, lalu mencoba kembali pada pemicu berikutnya. Pengiriman ulang tidak boleh menggandakan kejadian atau membuat progres bertambah dua kali. Kegagalan sinkronisasi tidak memblokir belajar offline.

**Masuk pertama kali dan pergantian perangkat**

- Saat masuk pertama kali pada perangkat yang memiliki progres lokal, aplikasi menggabungkan progres lokal dengan progres akun. Jika akun belum memiliki progres, data lokal menjadi bagian dari progres akun. Jika akun sudah memiliki data, kedua sisi digabung mengikuti aturan Bagian 9; tidak ada penggantian diam-diam. Opsi **Gunakan data akun saja** harus dijelaskan dan dikonfirmasi sebelum progres lokal yang tidak dipilih ditinggalkan.
- Sebelum penggabungan awal, snapshot progres lokal disimpan selama 7 hari agar dapat dipulihkan jika hasil penggabungan tidak sesuai.
- Pada perangkat baru atau setelah masuk kembali, aplikasi mengambil progres akun dan menggabungkannya dengan progres lokal yang masih ada. Proses yang sama berlaku ketika pengguna berpindah di antara perangkat, dan sinkronisasi berulang harus menghasilkan keadaan progres yang konsisten.

**Progres per paket dan paket yang belum terpasang**

- Progres selalu diidentifikasi berdasarkan pasangan `(id_paket, id_item)`. Sinkronisasi tidak dibatasi hanya pada paket yang sedang terpasang atau sedang dibuka.
- Jika akun memiliki progres untuk suatu paket yang belum terpasang di perangkat saat ini, aplikasi tetap menyimpan progres itu di akun dan menampilkan paket tersebut sebagai **Progres tersedia — pasang paket untuk melanjutkan** pada layar Paket bahasa. Progres ini tidak dihitung ke mastery gabungan perangkat sampai konten paket tersedia secara lokal.
- Setelah pengguna memasang paket yang cocok melalui FR-83 atau FR-85, aplikasi menghubungkan progres tersimpan ke paket berdasarkan ID, menghitung ulang mastery dan statistik, lalu menampilkan progres tersebut. Pemasangan paket tidak boleh menghapus atau mengganti log belajar yang sudah tersimpan.
- Jika paket diperbarui, progres untuk ID item yang tetap sama dipertahankan dan nilai turunan dihitung ulang. Item yang sudah tidak ada tetap menyimpan riwayatnya tetapi tidak masuk pembagi mastery; ID item baru tidak mewarisi progres item lama. Aturan perubahan konten pada Bagian 8 dan 10 tetap berlaku.
- Menghapus paket dari perangkat hanya menghapus konten paket lokal sesuai FR-88, bukan progres akun. Progres dapat tampil kembali setelah paket dipasang lagi.

**Reset, logout, dan penghapusan akun**

- Untuk pengguna yang masuk akun, **Reset progres per paket** pada FR-55 berlaku pada akun dan perangkat-perangkat yang tersinkron, bukan hanya pada perangkat yang menekan tombol. Aplikasi meminta konfirmasi dua langkah, menerapkan reset sebagai tindakan eksplisit pengguna, dan menyelaraskan hasilnya pada sinkronisasi berikutnya. Reset tidak memengaruhi paket lain. Ini merupakan pengecualian terhadap prinsip penggabungan yang tidak menghapus data: perintah reset yang dikonfirmasi memang menghapus progres paket yang dipilih.
- Jika reset dilakukan saat offline, aplikasi menyimpan perintah reset dalam antrean dan menampilkan bahwa reset lintas perangkat masih menunggu sinkronisasi. Sebelum konfirmasi server diterima, perangkat lain mungkin masih menampilkan progres lama; setelah tersinkron, progres paket yang di-reset tidak boleh dipulihkan lagi dari antrean kejadian lama.
- Logout tidak menghapus data akun. Pengguna memilih mempertahankan salinan lokal atau menghapus data akun dari perangkat; pilihan bawaan adalah mempertahankan salinan lokal. Saat logout, antrean yang belum tersinkron tetap berada di perangkat dan tidak dikirim sampai pengguna masuk kembali ke akun yang sama. Antrean dan progres lokal yang belum tersinkron tidak boleh otomatis diunggah ke akun lain; jika pengguna masuk dengan akun berbeda, aplikasi harus memisahkan konteks akun dan meminta pilihan yang jelas sebelum menggabungkan data lokal.
- Penghapusan akun menghapus identitas Supabase Auth dan data server yang terkait, termasuk profil serta semua log/progres akun. Penghapusan tidak dapat dibatalkan setelah selesai. Data lokal tidak otomatis dihapus.


| Jenis data | Aturan gabung |
| --- | --- |
| Log kejadian belajar (kata dilihat, jawaban, sesi selesai) | Hanya bertambah. Gabungan himpunan dua sisi, duplikat dibuang berdasarkan ID kejadian. |
| Kekuatan item | Tidak digabung dari nilai tiap perangkat. Setelah log kedua sisi digabung, kekuatan dihitung ulang dengan memutar ulang seluruh log jawaban berurutan menurut waktu kejadian (seri diurutkan menurut ID kejadian), memakai rumus Bagian 8.1, sehingga hasilnya sama di semua perangkat. Penghitung (dilihat, benar, salah) juga diturunkan dari log, sehingga tidak terhitung ganda. **\[K\]** |
| Hari aktif (untuk streak) | Gabungan himpunan tanggal, lalu streak dihitung ulang. |
| Skor terbaik dialog dan ending tercapai | Skor memakai nilai maksimum. Ending memakai gabungan himpunan. |
| Level tertinggi yang pernah dicapai | Nilai maksimum. |
| Kuota dialog AI harian | Dialog AI wajib akun, sehingga kuota hanya ada per akun dan server menjadi otoritas. Sesi AI baru hanya bisa dibuat saat online. |
| Pengaturan | Yang terbaru menang per kunci. |
| Cap waktu | Server menyimpan waktu terima. Cap waktu perangkat yang lebih dari 24 jam di depan dipotong ke waktu terima. |
| Urutan dan jam perangkat | Pemutaran ulang memakai waktu_perangkat, seri diurutkan menurut id_kejadian. Selisih jam antarperangkat dapat menukar urutan jawaban yang berdekatan, dan dampak kecil ini diterima. Waktu yang lebih dari 24 jam di depan waktu terima atau waktu impor dipotong, termasuk saat impor cadangan file (FR-53). **\[K\]** |
| Versi rumus | Setiap kejadian menyimpan versi_rumus. Mengubah rumus kekuatan (misalnya setelah uji lapangan) berarti memutar ulang seluruh log dengan rumus baru dan dicatat di catatan rilis. Progres tidak hilang karena log tetap utuh. **\[K\]** |

**Alur:**

- **Daftar atau masuk pertama kali dari perangkat yang sudah berdata lokal:** snapshot lokal diunggah. Bila akun kosong, snapshot menjadi data akun. Bila akun sudah berisi, keduanya digabung otomatis, bukan ditimpa. Tersedia opsi tegas Gunakan data akun saja dengan konfirmasi.
- **Cadangan sebelum gabung:** snapshot lokal sebelum penggabungan disimpan 7 hari dan dapat dipulihkan.
- **Perubahan konten:** progres terikat pada ID item. Item yang dihapus dari paket tetap menyimpan progresnya tetapi tidak dihitung di pembagi mastery. Item yang ID-nya berganti karena makna berubah tidak mewarisi progres item lama.
- **Keluar dari akun:** pengguna memilih simpan salinan di perangkat atau hapus. Bawaan: simpan.
- **Hapus akun:** data server dihapus dalam 30 hari **\[T\]**. Data lokal tetap kecuali dihapus pengguna.
- **Impor cadangan file (FR-53):** diperlakukan sebagai sisi ketiga yang digabung dengan aturan yang sama.
- **Paket belum terpasang di perangkat tujuan:** log untuk paket itu tetap digabung dan disimpan, tetapi mastery dan statistiknya baru tampil setelah paketnya dipasang lewat FR-83 atau FR-85. Layar Paket bahasa menampilkan daftar paket yang punya progres tetapi belum terpasang (FR-86). **\[U\]**

## 10. Spesifikasi Paket Konten **\[U\]**

Paket adalah satu file arsip ZIP berekstensi `.skpaket`. Karena sebagian aplikasi pesan menolak ekstensi yang tidak dikenal, paket juga harus bisa diimpor bila namanya diganti menjadi `.zip`. Satu paket mewakili satu kombinasi bahasa-dialek (FR-81). Pada MVP hanya paket Jawa-Mataraman yang dibundel di dalam aplikasi (FR-80). Paket lain dipasang lewat unduhan dari dalam aplikasi saat online (FR-83) atau lewat impor file (FR-85), keduanya P1 dan memakai format serta validasi yang sama dengan paket bundel.

| Berkas dalam paket | Isi |
| --- | --- |
| `manifest.json` | ID paket, bahasa, dialek, versi paket (semver), versi skema, versi aplikasi minimum, pemetaan register (akrab, netral, halus ke label lokal), pedoman ejaan yang dipakai, tanggal dibuat, jumlah item, daftar checksum semua berkas. |
| `unit.json` | Struktur kurikulum: unit, urutan, tema, dan item di tiap unit. |
| `kata.json`, `kalimat.json`, `dialog.json`, `challenge.json` | Item konten (medan di bawah). |
| `audio/` | Berkas audio berformat Opus, satu berkas per kata, kalimat, atau baris dialog. |
| `tanda-tangan` | Tanda tangan digital atas manifest dan checksum. |

**Medan utama tiap jenis item**

| Jenis | Medan |
| --- | --- |
| Kata | id, lema, dialek, register, label register lokal, kelas kata, arti Indonesia, istilah penerang, tema, unit, tingkat, audio, status verifikasi, kontributor, versi item. |
| Kalimat | id, teks, terjemahan Indonesia, daftar id kata isi, kata rumpang yang diizinkan, register, unit, tingkat, audio, status verifikasi. |
| Dialog | id, judul, lawan bicara, register, unit, tingkat, kata target, daftar node. Tiap node berisi pembicara, teks, terjemahan, audio, jenis uji bila node memuat pilihan (register atau pemahaman), dan daftar pilihan (teks, terjemahan, kualitas pilihan, node tujuan, umpan balik). Opsi tidak nyambung memuat juga balasan perbaikan (teks, terjemahan, audio) dan tujuan ulang ke node yang sama. Ending berisi kualitas dan umpan balik. |
| Challenge | Lihat Bagian 13.5. |

**Validasi saat impor** (berurutan, berhenti di langkah pertama yang gagal):

1. Arsip dapat dibuka dan manifest terbaca.
2. Versi skema didukung dan versi aplikasi memenuhi minimum.
3. Tanda tangan sah menurut kunci publik yang tertanam di aplikasi.
4. Checksum semua berkas cocok.
5. Bahasa dan dialek pada manifest sesuai dengan kombinasi yang didukung aplikasi.
6. Ruang penyimpanan cukup.
7. Versi paket lebih tinggi dari yang terpasang. Versi sama: tampilkan sudah terpasang. Versi lebih rendah: tolak dengan penjelasan. **\[U\]**

Untuk paket hasil unduhan, dua pemeriksaan tambahan berjalan sebelum langkah 1: entri katalog bertanda tangan sah, dan ukuran serta checksum berkas unduhan cocok dengan entri itu. **\[U\]**

**Pemasangan atomik.** Isi ditulis ke area sementara dan baru ditukar setelah semuanya valid. Bila gagal atau perangkat mati di tengah jalan, versi lama tetap utuh. Berlaku sama untuk unduhan: berkas unduhan disimpan di area sementara dan dibuang setelah pemasangan selesai atau gagal.

**Ukuran.** Target paket MVP maksimal 10 MB **\[T\]**. Audio Opus mono sekitar 24 kbps dengan durasi maksimal 6 detik per kata atau kalimat **\[T\]**. Perkiraan paket MVP di Bagian 12: sekitar 2 sampai 4 MB. Target ukuran yang sama berlaku bagi paket tambahan, agar unduhan dan berbagi file tetap ringan bagi pengguna dengan koneksi terbatas.

**Distribusi (P1).** **\[K\]** Hanya paket Jawa-Mataraman yang menyatu dengan aplikasi. Paket lain mengikuti aturan berikut, menurut keadaan jaringan perangkat:

1. **Saat online:** pengguna mengunduh dan memasang paket langsung dari dalam aplikasi lewat layar Paket bahasa (FR-83, FR-86), tanpa menerima atau memindahkan berkas.
2. **Saat offline:** fitur unduh dan pasang tidak tersedia (FR-86).
3. **Saat offline:** pengguna memperoleh file paket dari orang lain lewat berbagi file (flashdisk lewat pengelola berkas, Bluetooth, atau WhatsApp) dan memasangnya manual lewat menu Pasang paket dari file (FR-85). WhatsApp sebaiknya dikirim sebagai dokumen, bukan sebagai media, agar tidak dikompres. Aplikasi menampilkan panduan singkat ini di layar Pasang paket dari file.

**Katalog dan hosting unduhan** **\[U\]****.** Unduhan dilayani dari proyek Vercel yang menyajikan berkas statis (hosting Vercel adalah keputusan **\[K\]**): satu berkas `katalog.json` bertanda tangan dengan kunci yang sama seperti paket, dan berkas `.skpaket` tiap paket. Entri katalog memuat id_paket, bahasa, dialek, versi_paket, versi_skema, versi aplikasi minimum, ukuran unduhan, checksum berkas, alamat unduh, dan tanggal rilis. Aplikasi hanya meminta katalog saat layar Paket bahasa dibuka dalam keadaan online, dan permintaan itu tidak membawa pengenal pengguna, tahun lahir, atau data belajar. Hanya paket rilis terverifikasi yang masuk katalog (Bagian 11.8, FR-93). Paket yang membutuhkan versi aplikasi lebih tinggi tampil dengan keterangan Perbarui aplikasi dan tidak bisa diunduh. Karena tanda tangan paket diperiksa di perangkat (validasi langkah 3), hosting yang dibobol tanpa kunci penandatangan tidak dapat menyajikan paket palsu yang lolos pemasangan. Alamat katalog sebaiknya memakai domain milik sendiri, bukan alamat bawaan Vercel, agar hosting bisa dipindah tanpa memperbarui aplikasi. **\[U\]**

**Keamanan.** Tanda tangan digital menjamin keaslian dan keutuhan paket, bukan kerahasiaan. Isi paket tidak dienkripsi. Paket tanpa tanda tangan sah tidak bisa dipasang.

**Manajemen kunci** **\[K\]****.** Kunci privat penandatangan disimpan di luar repositori dan di luar perangkat kerja harian, dengan cadangan terenkripsi di dua lokasi. Aplikasi menanam dua kunci publik (aktif dan cadangan) agar rotasi bisa dilakukan lewat pembaruan aplikasi. Bila kunci bocor, kunci dicabut lewat pembaruan aplikasi dan paket diterbitkan ulang.

**Format audio** **\[K\]****.** Opus mono tetap menjadi target ukuran, tetapi dukungan pemutarannya di iOS dan Android lewat pustaka audio Expo harus diuji di Fase 0 pada perangkat nyata sebelum format dikunci. Bila tidak lolos, dipakai AAC mono (m4a) pada bitrate sepadan dan ukuran paket dihitung ulang.

**Daftar validasi alat pembuat paket** **\[K\]****.** Paket ditolak bila salah satu gagal:

1. ID item unik di dalam paket, dan semua rujukan (kata isi, kata target, node tujuan, unit) ada.
2. Kalimat: semua kata isi ada di bank atau pengecualian, rumpang hanya pada kata isi atau penanda register, panjang sesuai Bagian 11.3.
3. Dialog: tidak ada node yatim, semua jalur berakhir di ending, 6 sampai 10 giliran, 2 sampai 3 titik pilihan, tiap titik punya jenis uji yang memenuhi FR-34 dan FR-35, maksimal 5 kata baru, lawan bicara dan register terisi.
4. Pengecoh: berasal dari bank dengan kelas kata dan register yang sama (kesamaan makna diperiksa verifier).
5. Audio: tiap kata, kalimat, dan baris dialog punya berkas dengan nama sesuai ID, durasi maksimal 6 detik, format sesuai spesifikasi. Item tanpa audio hanya boleh berstatus `poc`.
6. Status: tidak ada item `poc` pada paket rilis publik, verifier berbeda dari pengaju, setiap item terbit punya verifier.
7. Challenge sesuai Bagian 13.6.
8. Manifest: pemetaan register lengkap, jumlah item cocok, versi paket naik, checksum dan tanda tangan sah.
9. Ukuran paket tidak melebihi 10 MB.

## 11. Aturan Konten

### 11.1 Peran dan alur status

| Peran | Tugas |
| --- | --- |
| Kontributor | Mengajukan kata, kalimat, dialog, dan rekaman suara. **\[K\]** |
| Verifier (penutur asli) | Memeriksa ejaan, makna, kewajaran, dan register. Harus orang yang berbeda dari pengaju. |
| Admin | Menetapkan pedoman, menerbitkan, menyusun dan menandatangani paket. |

Status: **draft → diajukan → ditinjau → terverifikasi → terbit**, dengan jalur kembali ke draft bila diminta revisi. Aturan:

- Konten yang belum terverifikasi tidak pernah masuk paket rilis publik. Pada tahap POC, konten berstatus `poc` boleh masuk bundel uji internal dengan label jelas (Bagian 11.8).
- Kata dan kalimat butuh satu verifier. Dialog dan dialek baru butuh dua verifier **\[U/T\]**.
- Riwayat revisi dan nama verifier disimpan untuk setiap item.

### 11.2 Kata

- Satu kartu memuat satu lema dengan satu arti utama. Arti yang berbeda jauh dipecah menjadi kartu terpisah.
- Arti Indonesia maksimal 4 kata atau frasa pendek. Bila tidak ada padanan (misalnya konsep budaya), pakai istilah penerang maksimal 12 kata.
- Wajib ada: kelas kata, register, minimal satu contoh kalimat, dan audio.
- Ejaan bahasa Jawa mengikuti *Pedoman Umum Ejaan Bahasa Jawa Huruf Latin yang Disempurnakan* (Balai Bahasa Yogyakarta, edisi revisi), dicantumkan di manifest, dan keputusan tiap kasus dicatat (Lampiran A.2). **\[U\]**
- Prioritaskan kata yang sering terdengar dalam percakapan dan berguna secara sosial. Sertakan verba dan kata fungsi sejak awal, jangan hanya benda.
- Satu bentuk acuan per kata untuk seluruh rumpun Mataraman. Variasi lokal (misalnya Solo atau Yogyakarta) dicatat di kolom keterangan_variasi sebagai informasi, tidak membuat item baru dan tidak menjadikan satu kota sebagai patokan. **\[K\]**
- Kata kasar atau arkais hanya boleh masuk dengan tag dan peringatan, dan tidak masuk jalur MVP. **\[U\]**

### 11.3 Kalimat

- Panjang maksimal: tingkat 1 delapan kata, tingkat 2 dua belas kata, tingkat 3 enam belas kata **\[T\]**.
- Alami seperti ucapan penutur, bukan terjemahan harfiah dari bahasa Indonesia. Terjemahan Indonesia ditulis dalam bahasa sehari-hari agar maknanya jelas.
- Semua kata isi harus ada di bank kata atau di daftar pengecualian yang disetujui. Alat pembuat paket memeriksanya otomatis.
- Satu rumpang per kalimat. Rumpang dipilih pada kata isi atau penanda register (misalnya kata ganti atau partikel), supaya tingkat tutur ikut teruji.
- Idealnya tiap kata target muncul di minimal dua kalimat berbeda, agar pengguna tidak sekadar menghafal satu kalimat. **\[T\]**

### 11.4 Pengecoh (distraktor)

- Berasal dari kelas kata dan register yang sama, dan dari tema yang sama atau bentuk yang mirip.
- Tidak boleh ada dua pilihan yang sama-sama benar. Verifier memeriksa hal ini.
- Tidak memakai kata yang artinya hampir sama dengan jawaban. Maksimal empat pilihan.

### 11.5 Dialog

- Panjang 6 sampai 10 giliran, dengan 2 sampai 3 titik pilihan dan 2 sampai 3 opsi tiap titik.
- Setiap dialog punya lawan bicara yang jelas dan register yang konsisten dengan lawan bicara itu.
- Dua jenis titik pilihan. **Register:** semua opsi menjawab pembicaraan yang sama dan hanya berbeda tingkat tutur (pas, cukup, kurang pas). **Pemahaman:** sedikitnya satu opsi nyambung dengan pembicaraan dan sedikitnya satu opsi tidak berkaitan (pas dan tidak nyambung). Dialog sebaiknya memadukan keduanya. **\[K\]**
- Opsi tidak nyambung memuat balasan perbaikan dari lawan bicara, lalu pertanyaan yang sama diulang. Tidak ada node baru dan tidak ada batas pengulangan. **\[K\]** Balasan memakai register sesuai lawan bicara dan tidak merendahkan, dan opsi tidak nyambung tetap memakai kata dari bank. **\[U\]**
- Tiga kualitas ending: pas, cukup, dan kurang pas. Ending kurang pas bersifat canggung, bukan memalukan, dan selalu disertai penjelasan. Dialog tidak menghukum.
- Semua baris punya teks, terjemahan Indonesia, dan audio. Karakter yang sama memakai penutur yang sama dalam satu dialog.
- Maksimal 5 kata baru yang belum diajarkan pada unit sebelumnya, dan kata target ditandai.
- Situasi sehari-hari. Hindari politik, SARA, kekerasan, dan topik dewasa karena pengguna termasuk siswa SMP. **\[U\]**

### 11.6 Audio

- Penutur asli dari dialek yang dituju, direkam di ruang tenang. Mikrofon ponsel boleh dipakai dengan jarak sekitar 10 sampai 20 cm.
- Satu kata atau satu kalimat per berkas, diucapkan natural dengan kecepatan wajar dan tidak dilebih-lebihkan.
- Level suara dinormalisasi, keheningan di awal dan akhir dipotong, hasil akhir Opus mono.
- Penutur memberi persetujuan tertulis atas pemakaian suaranya. Pencantuman nama sebagai kredit bersifat opsional.

### 11.7 Lisensi, persetujuan, dan data anak **\[K\]**

Aturan berikut ditetapkan sebagai dasar sebelum menerima kontribusi pihak luar. Bagian data anak disusun dari riset regulasi per 28 Oktober 2026 dan bukan nasihat hukum formal.

- **Hak cipta:** kontributor tetap pemilik karyanya dan memberi lisensi non-eksklusif kepada proyek untuk memakai, mengubah, dan mendistribusikannya di dalam aplikasi.
- **Konten teks (kata, kalimat, dialog):** ditetapkan CC BY-SA 4.0 **\[K\]** dengan kredit di halaman Tentang, sejalan dengan sumber terbuka seperti Wikipedia dan Wiktionary.
- **Audio:** persetujuan tertulis per penutur yang memuat tujuan (aplikasi belajar), cakupan (aplikasi dan materi promosinya), hak mencabut izin untuk rilis berikutnya, kredit opsional, dan larangan memakai suara untuk melatih atau menyintesis suara tanpa izin terpisah. Keputusan **\[K\]**: audio tidak dilisensikan terbuka (bukan CC). Penutur tetap memegang hak atas suaranya dan memberi izin non-eksklusif terbatas kepada proyek untuk dipakai di aplikasi dan materi promosinya. Mengambil audio dari paket untuk dipakai di luar aplikasi tidak diizinkan, walaupun paket tidak dienkripsi.
- **Sumber luar:** kamus dan teks berhak cipta hanya menjadi rujukan. Arti dan kalimat ditulis ulang dan sumbernya dicatat.
- **Pengguna di bawah 18 tahun** **\[K\]****:** UU No. 27 Tahun 2022 Pasal 25 mensyaratkan persetujuan orang tua atau wali untuk pemrosesan data anak. PP No. 17 Tahun 2025 (berlaku penuh sejak 28 Maret 2026) mengatur batas usia minimum, persetujuan orang tua untuk akun anak, verifikasi usia, mekanisme pelaporan, penilaian dampak pelindungan data pribadi, dan larangan pemrofilan anak. Permenkomdigi No. 9 Tahun 2026 mewajibkan penilaian mandiri profil risiko. Keputusan produk:
  1. **Batas usia minimum 10 tahun**, karena materi membutuhkan kemampuan membaca. Diinformasikan di alur pertama kali, halaman Tentang, dan toko.
  2. **Tanpa akun** (semua fitur P0): tidak ada data pribadi yang diproses atau dikirim, sehingga tidak ada pemrosesan data anak. Pengguna 10 tahun ke atas boleh memakainya. Tahun lahir hanya tersimpan di perangkat. Unduh paket (P1) juga tanpa akun dan tidak mengirim data pribadi, tetapi server unduhan dapat mencatat akses standar (misalnya alamat IP), sehingga pengaturannya mengikuti Bagian 14: log dianonimkan dengan masa simpan 30 hari, dan unduh tersedia bagi semua pengguna aplikasi tanpa pembatasan usia tambahan. **\[K\]**
  3. **Akun, sinkronisasi, dan dialog AI hanya untuk 18 tahun ke atas** (pernyataan diri). Membuka akun bagi di bawah 18 tahun baru dilakukan bila fitur persetujuan orang tua dan verifikasi usia dibangun (P2).
  4. Pemilih konten berjalan di perangkat dan datanya tidak keluar, sehingga tidak dipakai untuk pemrofilan anak. Tidak ada iklan, pelacakan, interaksi antarpengguna, konten buatan pengguna, atau transaksi, sehingga profil risiko yang dituju adalah rendah.
  5. **Sebelum rilis publik:** penilaian mandiri profil risiko diisi, dan kanal pelaporan serta informasi batas usia tersedia (FR-56).
  6. **Sebelum akun (P1) dibuka:** pemilik produk ditunjuk sebagai pejabat pelindungan data pribadi, penilaian dampak pelindungan data pribadi disusun, hapus akun serta retensi data siap, dan konfigurasi Supabase (RLS, pengaturan autentikasi, redirect OAuth, kebijakan sesi, serta penghapusan) telah diuji.
  7. **Data akun dan penyedia:** Supabase Auth memproses identitas surel, nomor telepon, dan identitas Google sesuai metode yang dipakai. Supabase Postgres menyimpan profil minimum dan data belajar yang disinkronkan. Kebijakan privasi menyebut Supabase dan penyedia SMS/OAuth yang digunakan, tujuan pemrosesan, retensi, dan cara meminta penghapusan. Tidak ada akun bagi pengguna di bawah 18 tahun.
  8. **Minimisasi data:** nomor telepon hanya disimpan di Supabase Auth bila pengguna memilih metode telepon atau menautkannya. Nomor telepon tidak diwajibkan bagi pengguna surel atau Google.
  9. **Sebelum unduh paket (P1) dibuka:** kebijakan privasi memuat catatan server unduhan, dan konfigurasi log Vercel diperiksa terhadap keputusan di atas (anonim semampu pengaturan layanan, masa simpan 30 hari, tanpa analitik). **\[K\]**

### 11.8 Konten pada tahap POC **\[U\]**

- Status tambahan `poc`: konten dibuat tanpa verifikasi penutur asli. Konten `poc` hanya masuk bundel uji internal dan menampilkan label Konten contoh, belum diverifikasi penutur.
- Alat pembuat paket menolak paket rilis publik yang memuat item berstatus `poc`.
- Setiap item wajib mencatat `sumber` dan `metode` (misalnya kamus, korpus, penyusun sendiri, draf AI) agar kualitasnya bisa ditelusuri dan diverifikasi kelak.
- Panduan pengumpulan konten ada di Lampiran A.

## 12. Kurikulum MVP **\[U\]**

### 12.1 Prinsip

1. **Situasi dulu, baru kosakata.** Unit disusun dari situasi yang benar-benar dihadapi pengguna, dimulai dari yang paling sering terjadi di rumah dan kampung.
2. **Frasa sebelum kata lepas.** Setiap unit memuat frasa kunci yang bisa langsung dipakai.
3. **Kata fungsi sejak awal.** Kata seperti sudah, belum, tidak, mau, ada, dan di mana dibutuhkan untuk membangun kalimat apa pun.
4. **Register diperkenalkan sejak unit 1**, lewat satu pasang sapaan akrab dan halus, lalu diperdalam di unit 5.
5. **Lisan lebih dulu.** Semua materi punya audio.

### 12.2 Cakupan MVP: bahasa Jawa, dialek Mataraman (Solo-Yogyakarta) **\[K\]**

| Unit | Situasi | Isi kunci |
| --- | --- | --- |
| U1 | Sapaan dan basa-basi | Salam menurut waktu, apa kabar dan jawabannya, terima kasih, maaf, permisi, pamit, sudah makan belum. Termasuk frasa penyelamat (minta diulang, minta bicara pelan). |
| U2 | Keluarga dan perkenalan | Sebutan keluarga (nenek, kakek, bapak, ibu, paman, bibi, kakak, adik), nama, asal, tinggal di mana, umur. |
| U3 | Makan dan minum di rumah | Makan, minum, lapar, haus, enak, tambah, nasi, lauk, air, teh, kopi, silakan, mau. |
| U4 | Warung dan pasar | Beli, jual, berapa, mahal, murah, kembalian, uang, angka 1 sampai 10 lalu 20, 50, 100, ada, habis. |
| U5 | Bertamu dan sopan santun | Silakan masuk, duduk, izin, terima kasih banyak, dari mana, mau ke mana. Pendalaman register halus. |
| U6 | Kegiatan sehari-hari | Pergi, pulang, sekolah, kerja, tidur, mandi, hari ini, kemarin, besok, kapan, sedang apa. |

Cadangan untuk fase berikutnya: arah dan tempat, perasaan dan kesehatan sederhana, cuaca dan alam.

**Volume per unit:** 30 kata, 10 kalimat (termasuk 5 sampai 6 frasa kunci), 1 dialog, 1 challenge ringan, 1 challenge sedang. Dua unit (U3 dan U6) menambah 1 challenge besar. U1 dan U5 menambah satu varian dialog dengan lawan bicara berbeda untuk melatih register.

**Total MVP** **\[T\]**: sekitar 180 kata, 60 kalimat, 6 sampai 8 dialog, 14 challenge, dan perkiraan audio 800 detik (kira-kira 2 sampai 4 MB).

**Komposisi 30 kata per unit** **\[T\]**: sekitar 40% verba dan ungkapan, 30% benda, 20% kata fungsi dan partikel, 10% kata sifat.

### 12.3 Jalur belajar yang direkomendasikan (tidak mengunci)

Satu unit sekitar 4 hari, sehingga 6 unit sekitar 3 sampai 4 minggu:

| Hari | Kegiatan |
| --- | --- |
| 1 sampai 3 | 10 kata per hari di Kosakata (sekaligus memenuhi syarat streak, kata baru diprioritaskan dan kata lama boleh), lalu satu sesi Guess the Word. |
| 3 | Fill the Gap. |
| 4 | Dialog unit dan satu challenge. Ulangan item lemah dirangkai otomatis oleh pemilih konten. |

### 12.4 Cara menyusun materi satu unit (untuk admin)

1. Wawancarai penutur tentang situasi unit: apa yang paling sering diucapkan, oleh siapa, kepada siapa.
2. Kumpulkan sekitar 50 kata dan frasa kandidat, lalu pilih 30 dengan urutan prioritas: (a) langsung terdengar di situasi itu, (b) dibutuhkan agar dialog unit bisa dimengerti, (c) kata fungsi.
3. Tulis 10 kalimat dari kata unit ini dan unit sebelumnya.
4. Tulis dialog dari kata unit, dengan lawan bicara dan register yang jelas.
5. Rekam audio, lalu verifikasi semua item (Bagian 11.1).
6. Tulis challenge sesuai Bagian 13, bangun paket, dan jalankan validasi otomatis.
7. Uji coba dengan sekitar 5 pengguna sebelum unit dinyatakan selesai.

Pada tahap POC, langkah 1, 5, dan 7 dijalankan dengan cara pengganti di Lampiran A.

## 13. Panduan Pembuatan Konten Challenge **\[U\]**

### 13.1 Peran challenge

Challenge adalah jembatan dari aplikasi ke dunia nyata: keberanian memakai bahasa dengan orang sungguhan. Tujuannya mengajak, bukan menilai. Karena itu challenge berdiri di luar streak, mastery, dan statistik **\[K\]**. Aturan emasnya: **challenge yang bisa diselesaikan sepenuhnya di dalam aplikasi hanyalah latihan dengan nama lain.**

### 13.2 Tiga tingkat kesulitan

| Tingkat | Beban bahasa | Lawan bicara | Dukungan | Durasi |
| --- | --- | --- | --- | --- |
| Ringan | 1 sampai 2 frasa tetap dari unit | Diri sendiri atau satu orang tepercaya (keluarga) | Boleh membaca catatan | Maksimal 5 menit |
| Sedang | Tanya jawab 2 sampai 3 giliran memakai pola dari unit | Satu orang tepercaya, atau tetangga dan penjual yang sudah dikenal | Boleh membawa catatan | Maksimal 10 menit |
| Besar | Bercerita atau bercakap minimal 5 kalimat tentang topik unit | Satu sampai tiga orang, atau diri sendiri | Tanpa catatan, sebagian spontan | 10 sampai 20 menit |

Challenge Besar disarankan muncul setelah minimal tiga unit, tanpa mengunci. Lima dimensi untuk menaikkan atau menurunkan kesulitan: beban bahasa (frasa tetap, lalu pola, lalu improvisasi), lawan bicara (diri sendiri, lalu keluarga, lalu orang yang kurang dikenal), dukungan (catatan boleh atau tidak), spontanitas (disiapkan atau spontan), dan durasi.

### 13.3 Syarat wajib setiap challenge

1. Terkait satu unit dan hanya memakai kata atau frasa dari unit itu atau unit sebelumnya (diperiksa otomatis terhadap bank).
2. Punya varian solo dan varian sosial. Tidak pernah mengasumsikan teman pengguna bisa bahasa daerahnya.
3. Lawan bicara yang disarankan realistis bagi pengguna: nenek, kakek, paman, tetangga, penjual di warung, atau teman yang memang penutur. Tidak menyuruh mendekati orang asing.
4. Aman untuk pengguna di bawah 18 tahun: tidak menyuruh menemui orang asing sendirian, tidak ke tempat jauh, dan untuk tempat umum menyarankan ditemani keluarga.
5. Register dinyatakan jelas. Bila lawan bicara orang yang dihormati, pakai register halus.
6. Tanpa biaya: tidak membutuhkan uang, perjalanan, atau alat khusus.
7. Instruksi maksimal 3 kalimat dalam bahasa Indonesia sederhana, bernada ajakan, bukan perintah.
8. Tanpa penilaian benar atau salah. Kriteria selesai berupa pernyataan diri, misalnya Aku sudah mengucapkannya dengan suara keras.
9. Memuat langkah Kalau macet yang merujuk ke frasa penyelamat dari Unit 1 (minta diulang, minta bicara pelan).
10. Menyertakan satu kalimat penyemangat yang menormalkan salah ucap, dan tidak pernah mempermalukan bila gagal.
11. Tidak meminta pengguna membagikan foto, rekaman, lokasi, atau data pribadi.

### 13.4 Pemetaan ke persona

- **Dian:** misi di lingkungan kampung yang bisa dilakukan minggu ini (menyapa tetangga, membeli di warung), selalu dengan varian ditemani keluarga.
- **Santi:** challenge ke nenek lewat telepon atau video call dengan register halus, termasuk varian pesan suara yang dikirim sendiri lewat aplikasi pesan pengguna (di luar aplikasi ini).
- **Torik:** challenge tanpa bantuan dan kartu khusus lintas bahasa (membandingkan satu makna di bahasa yang ia kuasai dan bahasa barunya). Kartu lintas bahasa berlaku di tingkat bahasa, bukan unit.

### 13.5 Skema data challenge

| Medan | Keterangan |
| --- | --- |
| id, tingkat, unit, judul | Identitas dan posisi. |
| tujuan | Satu kalimat: keberanian atau keterampilan apa yang dilatih. |
| instruksi | Maksimal 3 kalimat bahasa Indonesia. |
| frasa\_bantu | Daftar id kata atau kalimat dari bank. Teks bahasa daerah selalu diambil dari bank, tidak ditulis ulang di challenge. |
| lawan\_bicara\_disarankan, register | Siapa dan tingkat tutur yang pas. |
| varian\_solo, varian\_sosial | Dua cara menyelesaikan, keduanya wajib ada. |
| kriteria\_selesai | Pernyataan diri, bukan penilaian. |
| jika\_macet | Rujukan id frasa penyelamat. |
| durasi\_menit, risiko\_sosial | Rendah atau sedang. |
| catatan\_keamanan | Khusus saran bagi pengguna di bawah 18 tahun. |
| status\_verifikasi | Mengikuti alur Bagian 11.1. |

### 13.6 Spesifikasi generator konten challenge (manual atau dibantu AI)

- **Masukan:** unit, tingkat, persona fokus, dan daftar id kata, frasa, dan kalimat unit itu beserta artinya.
- **Keluaran:** JSON sesuai skema 13.5.
- **Batas bahasa:** generator hanya menulis instruksi dalam bahasa Indonesia dan merujuk id dari bank. Generator tidak boleh menulis frasa bahasa daerah baru, sehingga tidak ada kalimat karangan yang belum diverifikasi.
- **Validasi otomatis:** skema valid, instruksi tidak lebih dari 3 kalimat, varian solo dan sosial ada, semua id ada di bank, dan tidak memuat kata terlarang (uang, transfer, alamat, nomor telepon, foto, lokasi, kunjungan ke orang asing).
- **Tinjauan manusia:** setiap challenge wajib ditinjau penutur asli dan admin sebelum terbit.

### 13.7 Contoh ilustrasi

Contoh berikut untuk menggambarkan format. Semua frasa bahasa daerah wajib diverifikasi penutur dan sebenarnya diambil dari bank.

| Tingkat dan unit | Isi |
| --- | --- |
| Ringan, U1 (Jawa) | **Judul:** Salam pagi pertama. **Instruksi:** Hari ini, sapa satu orang di rumah atau tetanggamu dengan salam pagi yang kamu pelajari, misalnya Sugeng enjang untuk orang yang lebih tua. **Varian solo:** Ucapkan salam itu tiga kali dengan suara keras seolah menyapa nenekmu. **Kriteria:** Aku sudah mengucapkannya dengan suara keras. **Jika macet:** \[frasa penyelamat dari bank U1\]. |
| Sedang, U4 | **Judul:** Tanya harga. **Instruksi:** Saat ke warung bersama keluarga, tanyakan harga satu barang dan ucapkan terima kasih memakai frasa dari Unit 4. **Varian solo:** Beri harga pada tiga benda di rumah memakai angka Unit 4, ucapkan keras. **Kriteria:** Aku sudah mencoba menyebut harga dalam bahasa daerah. |
| Besar, U6 | **Judul:** Cerita hari ini. **Instruksi:** Ceritakan lima kalimat tentang kegiatanmu hari ini kepada keluarga yang bisa bahasa daerahmu. **Varian solo:** Ceritakan ke cermin, lalu cek kata yang lupa di daftar kata Unit 6. **Kriteria:** Aku sudah bercerita lima kalimat. |

## 14. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
| --- | --- |
| Platform **\[K\]** | Aplikasi mobile lintas platform dengan satu basis kode, Android sebagai prioritas dan iOS didukung. Teknologi: React Native (Expo) dengan SQLite sebagai basis data lokal (Bagian 17.2). |
| Offline | Semua fitur P0 berfungsi tanpa jaringan setelah paket terpasang. Paket Jawa-Mataraman terpasang dari bundel tanpa jaringan. Paket tambahan selalu punya jalur pemasangan tanpa jaringan (pasang dari file, FR-85). Pembaruan aplikasi lewat toko aplikasi tanpa menghapus data lokal. |
| Performa **\[T\]** | Ukuran pemasangan MVP maksimal 50 MB (termasuk paket bundel Jawa-Mataraman, tanpa paket bahasa lain). Buka aplikasi dari kondisi mati maksimal 3 detik di Android RAM 3 GB. Pindah layar di bawah 300 milidetik. Audio mulai di bawah 300 milidetik setelah ketuk. |
| Penyimpanan **\[T\]** | Maksimal 30 MB per kombinasi bahasa-dialek, dengan peringatan sebelum penuh. Batas ini mencakup salinan arsip asli untuk ekspor (FR-87) dan berlaku sama untuk paket hasil unduh dan impor file, dan ruang diperiksa sebelum unduhan atau impor dimulai. Data berada di penyimpanan internal aplikasi (FR-52). |
| Keandalan **\[T\]** | Sesi bebas crash minimal 99%, diukur dari laporan crash OS yang diikutsertakan pengguna (Play Console dan TestFlight atau App Store Connect), bukan dari telemetri dalam aplikasi. Impor paket atomik. Data tidak rusak bila baterai habis saat impor atau sinkronisasi. |
| Aksesibilitas **\[U\]** | Ukuran huruf minimal 16 px dan dapat diperbesar, kontras memenuhi WCAG AA, tombol audio dan elemen utama dapat dibaca pembaca layar, tidak bergantung pada warna saja. |
| Privasi | Tanpa akun, tidak ada data pribadi yang dikirim. Tidak ada telemetri di MVP. **\[K\]** Pada MVP fitur tanpa akun tidak melakukan permintaan jaringan sama sekali. Setelah P1, satu-satunya permintaan jaringan pada mode tanpa akun adalah katalog dan unduhan paket yang dimulai pengguna dari layar Paket bahasa, dan permintaan itu tidak membawa tahun lahir, progres, atau pengenal pengguna. Server unduhan (Vercel) hanya boleh menyimpan catatan akses standar yang diperlukan untuk operasional, dianonimkan semampu pengaturan layanan, dengan masa simpan 30 hari, tanpa analitik atau pelacakan, dan hal ini dicantumkan di kebijakan privasi. **\[K\]** Pada P1, Supabase Auth menyimpan identitas metode masuk yang dipilih (surel, nomor telepon terverifikasi, dan/atau Google), sedangkan Supabase Postgres menyimpan profil minimum dan data belajar yang disinkronkan. RLS membatasi akses per akun; kunci administratif tidak ada di aplikasi. Tidak ada penjualan data, iklan, atau pelacakan pihak ketiga. Aplikasi tidak pernah meminta izin mikrofon, kamera, atau lokasi. |
| Pengguna di bawah 18 tahun **\[K\]** | Persona Dian adalah siswa SMP. Batas usia minimum 10 tahun. Tanpa akun tidak ada data pribadi yang diproses, dan unduh paket (P1) tidak memakai akun serta tidak mengirim data pribadi (baris Privasi). Tidak ada iklan atau pelacakan. Akun dan dialog AI hanya untuk 18 tahun ke atas sampai fitur persetujuan orang tua dibangun. Aturan lengkap di Bagian 11.7. |
| Keamanan | Tanda tangan paket, kunci publik tertanam, dan pencabutan kunci lewat pembaruan aplikasi. Komunikasi ke server memakai HTTPS. Katalog bertanda tangan dan diverifikasi di perangkat. Untuk Supabase (P1), RLS aktif di semua tabel yang dapat diakses klien, `service_role` dan rahasia provider hanya di server, OAuth memakai redirect URI terdaftar, dan autentikasi telepon memakai OTP. Unduhan tetap melewati seluruh validasi paket (Bagian 10), sehingga keaslian paket tidak bergantung pada keamanan hosting. |
| Unduh dan pasang paket (P1) **\[T\]** | Paket 10 MB diunduh dan dipasang dalam 60 detik pada koneksi 4G sedang, dengan pemasangan setelah unduhan selesai maksimal 10 detik (sama seperti FR-54). Unduhan dapat dibatalkan dan dicoba ulang tanpa meninggalkan data setengah jadi. Server katalog yang tidak tersedia tidak boleh memengaruhi fitur lain, dan jalur pasang dari file tetap berfungsi. |
| Pengujian | Uji di minimal tiga perangkat Android kelas menengah dan satu perangkat iOS. Uji mode pesawat penuh untuk semua fitur P0. Uji skenario penggabungan data pada Bagian 9. Untuk P1: uji unduh (koneksi terputus di tengah, ruang penuh, server tidak terjangkau, paket rusak, versi lebih rendah, berpindah ke mode pesawat saat mengunduh) dan uji pasang dari file (file dikirim lewat WhatsApp sebagai dokumen, Bluetooth, flashdisk, serta ekstensi `.zip`). Uji sinkronisasi P1 juga mencakup login pada perangkat kedua, perubahan di dua perangkat, pengulangan pengiriman tanpa duplikasi, offline lalu online, progres paket belum terpasang, pemulihan setelah paket dipasang, pembaruan/penghapusan paket, serta reset paket yang diselaraskan lintas perangkat. |
| Versi OS dan perangkat **\[T\]** | Usulan Android 8.0 ke atas dan iOS 15 ke atas, disesuaikan dengan batas minimum SDK Expo yang dipilih di Fase 1. Uji mencakup layar kecil dan huruf diperbesar 200%. |
| Kinerja pemutaran log **\[T\]** | Menghitung ulang kekuatan dari 50.000 kejadian selesai di bawah 2 detik di Android RAM 3 GB, berjalan di latar dan hasilnya disimpan sebagai cache. Dua kali pemutaran, atau pemutaran dengan urutan impor berbeda, menghasilkan angka identik (uji determinisme). |
| Migrasi data lokal | Skema SQLite berversi dengan migrasi maju yang diuji dari setiap versi rilis sebelumnya. Pembaruan aplikasi tidak boleh menghapus log kejadian. Migrasi yang gagal mengembalikan basis data ke kondisi sebelumnya. |
| Pemutaran audio | Tombol audio berbunyi saat mode senyap iOS aktif (aksi disengaja pengguna), audio baru menghentikan audio sebelumnya, interupsi (telepon, aplikasi lain) ditangani, audio item berikutnya dipramuat agar mulai di bawah 300 milidetik, dan ada tombol putar ulang. |
| Huruf dan teks | Font menampilkan é, è, ê, dh, dan th dengan benar pada semua layar. |
| Cadangan OS **\[K\]** | Basis data berada di lokasi yang ikut cadangan otomatis OS (Android Auto Backup dan cadangan perangkat iOS) agar pengguna tanpa akun terlindungi saat ganti ponsel, dan hal ini diungkapkan di kebijakan privasi. Diaktifkan sesuai persetujuan Draft 4 (Bagian 17.2). **\[K\]** |
| Rilis dan kepatuhan toko **\[K\]** | Kebijakan privasi publik dan formulir data toko selesai sebelum rilis, memuat pernyataan tanpa telemetri dan penjelasan cadangan OS. Aplikasi didaftarkan untuk usia 10 tahun ke atas, tanpa iklan, tanpa pelacakan, dan tanpa pengumpulan data, dan dirancang memenuhi persyaratan kategori anak di toko. Penilaian mandiri PP Tunas diisi sebelum rilis publik (Bagian 11.7). Bila Masuk dengan Google ditawarkan di iOS (P1), syarat opsi masuk setara pada pedoman toko diperiksa saat itu. Hapus akun dari dalam aplikasi wajib saat akun dibuka (FR-58). |

## 15. Metrik Keberhasilan

Semua angka berikut adalah **\[T\]**: hipotesis awal untuk diuji, bukan janji. Catatan penting: pengguna tanpa akun tidak mengirim data apa pun, sehingga sebagian metrik hanya bisa diperoleh dari survei, tes di luar aplikasi, dan pengamatan uji lapangan (telemetri tidak dibuat di MVP, keputusan pemilik produk).

**Cara mengukur tanpa telemetri** **\[K\]****.** Build uji lapangan (jalur uji internal toko) memiliki menu Ekspor ringkasan penggunaan yang hanya aktif bila peserta menyalakannya. Menu itu menghasilkan file tanpa identitas (jumlah hari aktif, sesi, akurasi, tanggal) yang dikirim peserta sendiri lewat WhatsApp atau surel. Tidak ada pengiriman otomatis dan menu ini tidak ada di rilis publik. Retensi hari ke-7 dan ke-30 dihitung dari file itu dan dari konfirmasi peserta. **Tes kosakata** **\[T\]**: 40 butir pilihan ganda kata ke arti, dibuat dalam dua bentuk setara (A dan B) yang dipakai bergantian sebelum dan sesudah, dengan sebagian butir dari bank MVP dan sebagian di luar bank sebagai pembanding. Peserta di bawah 18 tahun membutuhkan persetujuan orang tua atau wali.

### Indikator awal (hari sampai minggu)

| Metrik | Target (sukses / stretch) | Cara mengukur |
| --- | --- | --- |
| Aktivasi: membuka aplikasi dan menyelesaikan 10 kata hari pertama | 60% / 75% | Uji lapangan dan pengamatan. |
| Menyelesaikan satu sesi latihan pada hari pertama | 50% / 65% | Uji lapangan. |
| Retensi hari ke-7 | 20% / 30% | Cohort uji lapangan. |
| Waktu muat dan keberhasilan offline | Memenuhi Bagian 14 dan 100% fitur P0 lolos mode pesawat | Uji teknis. |
| Keberhasilan pemasangan paket tambahan (P1) | 95% / 99% percobaan unduh dan pasang dari file berhasil di perangkat uji, termasuk jalur file dalam mode pesawat | Uji teknis sebelum P1 dirilis, bukan telemetri. |

### Indikator lanjutan (minggu sampai bulan)

| Metrik | Target (sukses / stretch) | Cara mengukur |
| --- | --- | --- |
| Kenaikan skor tes kosakata setelah 4 minggu | Minimal 25 poin persentase / 35 | Tes sebelum dan sesudah pada 20 sampai 30 pengguna uji. |
| Frekuensi memakai bahasa daerah | Naik minimal 1 tingkat pada skala 5 poin untuk 50% responden / 65% | Survei sebelum dan sesudah. |
| Berani memakai satu kalimat dengan keluarga atau masyarakat | 60% responden / 75% | Survei di luar aplikasi (challenge tidak terlacak). |
| Kepuasan (SUS) | 68 / 80 | Kuesioner. |
| Retensi hari ke-30 | 10% / 20% | Cohort uji lapangan. |
| Kualitas konten | 100% terbit terverifikasi, laporan kesalahan di bawah 2% item | Basis data konten dan laporan pengguna. |
| Kemitraan (SDG 17) | Minimal 3 penutur asli aktif dan 1 komunitas atau sekolah mitra (mulai setelah POC) | Catatan proyek. |

## 16. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Produksi konten (kata, audio, verifikasi) menjadi hambatan utama. | MVP satu bahasa satu dialek, templat dan alat pembuat paket, panduan Lampiran A, verifikasi penutur wajib sebelum rilis publik. |
| Dialog AI mengajarkan bahasa daerah yang keliru. | FR-41 sampai FR-44: validasi ketat, label, tombol lapor, bobot rendah, batas 3 sesi per hari. AI bukan produk utama. |
| Data lokal hilang saat aplikasi atau datanya dihapus. | Peringatan jelas, ekspor cadangan (P1), dan mode akun (P1). |
| Pengguna offline mengandalkan berbagi file untuk paket tambahan (P1), dan berbagi lewat WhatsApp gagal (ekstensi ditolak, file dikompres). | Dukungan ekstensi `.zip`, panduan kirim sebagai dokumen, serta flashdisk dan Bluetooth sebagai alternatif. Pengguna yang sempat online dapat mengunduh langsung (FR-83) dan membagikan paket terpasang lewat ekspor (FR-87). |
| Paket tambahan sulit diperoleh pengguna di daerah tanpa internet yang tidak punya kenalan dengan paketnya. | Jalur file tetap ada, ekspor paket (FR-87), ukuran paket kecil agar mudah dikirim, dan komunitas atau sekolah mitra (SDG 17) dapat menyimpan serta membagikan file paket setelah POC. |
| Hosting Vercel tidak tersedia, melampaui batas paket gratisnya, atau paket gratisnya tidak sesuai syarat penggunaan (paket Hobby dibatasi untuk penggunaan pribadi nonkomersial). | Berkas statis berukuran kecil, unduhan hanya atas tindakan pengguna, fitur inti dan jalur file tidak bergantung pada server, domain sendiri agar hosting bisa dipindah, dan syarat serta batas bandwidth paket diperiksa sebelum unduh dibuka (Lampiran D). Naik ke paket berbayar atau pindah layanan bila perlu. |
| Unduhan terputus atau menghabiskan kuota data seluler pengguna. | Ukuran paket kecil (target 10 MB), ukuran dan peringatan data seluler tampil sebelum unduh, serta pemasangan atomik sehingga unduhan gagal tidak merusak data. |
| Paket palsu atau rusak masuk lewat unduhan atau berkas dari pihak lain. | Tanda tangan digital, checksum, dan pemasangan atomik pada semua jalur (Bagian 10). |
| Server unduhan mencatat alamat IP pengguna, termasuk yang berusia 10 sampai 17 tahun. | Tanpa akun dan tanpa pengenal pengguna, log akses dianonimkan semampu pengaturan Vercel dengan masa simpan 30 hari, tanpa analitik, dan kebijakan privasi memuat catatan ini (Bagian 11.7 dan 14). |
| Jumlah dialek membengkak dan konten terduplikasi antardialek. | Tiap dialek adalah paket mandiri dan dibuka satu per satu hanya bila sumber kontennya siap. Duplikasi diterima demi kesederhanaan sistem. |
| Pengguna hafal kata tetapi tetap tidak berani bicara. | Dialog, langkah Ucapkan sendiri, challenge, dan pengujian asumsi sejak Fase 0. |
| Hak atas konten dan suara komunitas tidak jelas. | Lisensi dan persetujuan tertulis sebelum menerima kontribusi. |
| Penyalahgunaan kuota dialog AI. | Dialog AI wajib akun dan kuota dihitung di server (FR-40, FR-41). |
| Pengguna di bawah umur. | Keputusan usia Bagian 11.7, persyaratan privasi Bagian 14, challenge aman, penilaian mandiri PP Tunas. |
| Kesalahan penggabungan data menghilangkan progres. | Aturan idempoten, snapshot cadangan 7 hari, uji skenario khusus. |
| Akses data akun lintas pengguna akibat konfigurasi backend yang salah. | RLS wajib pada semua tabel klien, uji kebijakan dengan dua akun berbeda, validasi `user_id` di server, dan larangan menaruh `service_role` di aplikasi. |
| Akun ganda atau pengambilalihan akun saat metode surel, telepon, dan Google ditautkan. | Tidak menggabungkan akun berdasarkan kesamaan surel saja; penautan memerlukan autentikasi kedua metode, konfirmasi, dan penanganan konflik yang jelas. |
| OTP SMS gagal terkirim atau menimbulkan biaya/penyalahgunaan. | Batas percobaan dan masa berlaku OTP, pembatasan permintaan ulang, pemantauan biaya penyedia, serta pesan gagal yang tidak membocorkan apakah nomor terdaftar. |
| Konfigurasi Google OAuth atau deep link salah. | Redirect URI didaftarkan dan diuji untuk Android/iOS, callback hanya menerima alur yang valid, dan rahasia provider disimpan di konfigurasi server. |
| Konten POC belum diverifikasi penutur dan bisa memuat kesalahan kata atau register. | Label `poc`, pemeriksaan silang dua sumber (Lampiran A.7), tidak dirilis publik sebelum diverifikasi. |
| Format audio Opus tidak diputar benar di salah satu platform. | Uji format di Fase 0 dan siapkan AAC sebagai cadangan (Bagian 10). |
| Penutur asli dan verifier belum ditemukan saat konten selesai, sehingga Fase 2 tertunda. | Rekrutmen dimulai di Fase 1 (minggu 4), jadwal rekaman dan verifikasi dipesan lebih awal, dan kemitraan ditargetkan bersama komunitas atau sekolah. |
| Kunci penandatangan paket hilang atau bocor. | Manajemen kunci Bagian 10: cadangan terenkripsi, dua kunci publik, rotasi lewat pembaruan aplikasi. |
| Dialog AI tanpa audio mengurangi nilai belajar lisan dan terasa berbeda dari dialog kurasi. | FR-45 dengan penanda jelas (disetujui) dan bobot kredit 0,5. |
| Penolakan atau pembatasan toko terkait data anak, opsi masuk, atau kebijakan privasi. | Persyaratan rilis di Bagian 14, keputusan Bagian 11.7, penilaian mandiri, dan Lampiran D sebelum rilis publik. |
| Pemutaran ulang log melambat seiring waktu atau menghasilkan angka berbeda antarperangkat. | Cache kekuatan, uji determinisme dan kinerja (Bagian 14), serta versi rumus. |
| Peraturan perlindungan anak berubah atau diperketat (PP Tunas dan turunannya masih berkembang). | Desain minim data (tanpa akun, tanpa pelacakan), akun hanya 18 tahun ke atas, dan penilaian mandiri diulang bila ada perubahan fitur atau aturan. |
| Satu pengembang merangkap pemilik produk dan pemegang kunci: pekerjaan terhenti bila berhalangan, dan kunci hilang bersama orangnya. | Jadwal diperpanjang (Bagian 18), dokumentasi prosedur rilis dan penandatanganan, cadangan kunci terenkripsi di dua lokasi (Bagian 10), serta lingkup P0 dijaga ketat. |

## 17. Keputusan dan Pertanyaan Terbuka

### 17.1 Keputusan dari jawaban pertanyaan terbuka draft 1

| No lama | Keputusan | Status |
| --- | --- | --- |
| 1 | MVP memakai Jawa dialek Mataraman (Solo-Yogyakarta). Sistem dialek umum dihapus. | **\[K\]** |
| 2 | Ejaan mengikuti pedoman ejaan resmi bahasa Jawa dan register tiga tingkat dipetakan ke label lokal (Lampiran A.2). | **\[U\]** menunggu persetujuan |
| 3 | Streak: 10 kata tampil, tanpa syarat audio, boleh kata lama. | **\[K\]** |
| 4 | Aturan lisensi, persetujuan suara, dan data anak (Bagian 11.7). | **\[K\]** |
| 5 | Aplikasi mobile lintas platform, offline, masuk dengan surel terkonfirmasi atau Google (nomor telepon menyusul, lihat 17.2). | **\[K\]** |
| 6 | Centang Sudah kucoba ada (FR-73). | **\[K\]** |
| 7 | Dialog AI wajib akun. | **\[K\]** |
| 8 | Tanpa telemetri di MVP. | **\[K\]** |
| 9 | Rumus mastery dan bobot AI adalah ketetapan pemilik produk untuk MVP. | **\[K\]** |
| 10 | Skala register tiga tingkat dipertahankan, pemetaan per bahasa wajib. | **\[K\]** |
| 11 | Tanpa pembekuan streak di MVP. | **\[K\]** |

### 17.2 Keputusan dari jawaban pertanyaan terbuka draft 2

| No lama | Keputusan | Status |
| --- | --- | --- |
| 1 | Teknologi: React Native (Expo) dengan SQLite. | **\[K\]** |
| 2 | Tidak ada kota patokan. Mataraman dipakai sebagai satu rumpun, satu bentuk acuan per kata, variasi hanya keterangan informatif. | **\[K\]** |
| 3 | Sumber audio dan pemeriksaan ringan POC ditunda sampai diputuskan nanti. Lihat 17.3. | Ditunda |
| 4 | Paket dibundel di MVP, impor paket menjadi P1. Diperinci di Bagian 17.4. | **\[K\]** |
| 5 | Keputusan Draft 3: surel terkonfirmasi dan Google lebih dulu, nomor telepon P2. Status historis; diperbarui pada Draft 7. | Keputusan lama |
| 6 | Persona Dian di Klaten. Akun dan dialog AI untuk usia 18 tahun ke atas sampai fitur persetujuan orang tua dibangun (diperinci di Bagian 11.7). | **\[K\]** |
| 7 | FR-73 (Sudah kucoba) tetap P1. | **\[K\]** |
| 8 | Titik pemahaman bernilai 1 pada percobaan pertama dan 0,5 sesudah pengulangan, tanpa memengaruhi kekuatan kata. | **\[K\]** |
| 9 | Kekuatan item dihitung ulang dengan memutar ulang log kejadian berurutan waktu agar sama di semua perangkat. | **\[K\]** |
| 10 | Aturan pembaruan paket Bagian 8.7 berlaku. | **\[K\]** |
| 11 | Ambang level dan volume latihan dibiarkan sampai ada data uji lapangan. | **\[K\]** |
| Draft 4 | Semua usulan Draft 4 disetujui: definisi pelengkap (8.8), FR-45 dan FR-54 sampai FR-59, kuota AI menurut zona waktu profil, daftar validasi dan manajemen kunci paket, persyaratan rilis, cara pengukuran tanpa telemetri, serta cadangan OS diaktifkan. Uji format audio tetap dilakukan di Fase 0. | **\[K\]** |

### 17.3 Keputusan dari jawaban pertanyaan terbuka draft 4

| No lama | Keputusan | Status |
| --- | --- | --- |
| 1 | Sumber audio POC: pemilik produk sendiri, ditandai `poc`. | **\[K\]** |
| 2 | Aturan data anak ditetapkan dari riset regulasi (Bagian 11.7): batas usia 10 tahun, tanpa akun untuk 10 sampai 17 tahun, akun dan dialog AI 18 tahun ke atas, penilaian mandiri sebelum rilis. | **\[K\]** |
| 3 | Kalibrasi ambang level mastery dan volume latihan dilakukan setelah uji lapangan. | **\[K\]** |
| 4 | Keputusan Draft 5: masuk dengan nomor telepon tidak dibangun dan tidak memakai verifikasi kode. Status historis; digantikan oleh Draft 7 untuk P1. | Keputusan lama |
| 5 | Peringkat usia toko 10 tahun ke atas, tanpa iklan, tanpa pelacakan, tanpa pengumpulan data. | **\[K\]** |
| 6 | Lisensi: teks CC BY-SA 4.0, audio tidak dilisensikan terbuka (izin terbatas dari penutur). | **\[K\]** |
| 7 | Tim: satu pengembang (pemilik produk), tiga pembuat konten selama POC, pemilik produk memegang kunci penandatangan. | **\[K\]** |

### 17.4 Keputusan dari pembaruan Draft 6

| No | Keputusan | Status |
| --- | --- | --- |
| 1 | Hanya paket Jawa-Mataraman yang dibundel. Paket bahasa dan dialek lain tidak dibundel agar ukuran aplikasi tidak besar. | **\[K\]** |
| 2 | Saat online, pengguna mengunduh dan memasang paket lain langsung dari dalam aplikasi. | **\[K\]** |
| 3 | Saat offline, fitur unduh dan pasang tidak tersedia. | **\[K\]** |
| 4 | Saat offline, pengguna mendapat file paket lewat berbagi file dan memasangnya manual lewat menu Pasang paket dari file. | **\[K\]** |
| 5 | Paket bahasa dan dialek lain menyusul setelah MVP dan POC. | **\[K\]** |
| 6 | Paket dan katalog dihosting di Vercel. | **\[K\]** |
| 7 | Log server unduhan dianonimkan dengan masa simpan 30 hari, dan unduh tersedia bagi semua pengguna aplikasi tanpa pembatasan usia tambahan. | **\[K\]** |
| 8 | Ekspor paket (FR-87) memakai salinan arsip asli yang disimpan di perangkat, dihitung dalam batas 30 MB per paket. | **\[K\]** |
| 9 | Usulan pendukung: layar Paket bahasa (FR-86), katalog bertanda tangan dan alat penerbitnya (Bagian 10, FR-93), hapus paket (FR-88), label Pembaruan tersedia (FR-83), unduhan hanya atas tindakan pengguna, dan domain sendiri untuk alamat katalog (Bagian 10). | **\[U\]** menunggu persetujuan |

### 17.5 Keputusan dari pembaruan Draft 7

| No | Keputusan | Status |
| --- | --- | --- |
| 1 | Supabase Auth menjadi layanan autentikasi akun dan Supabase Postgres menyimpan profil minimum serta data belajar tersinkron. SQLite tetap menjadi penyimpanan lokal untuk fitur offline. | **\[K\]** |
| 2 | Metode masuk P1 mencakup surel dengan konfirmasi, nomor telepon dengan verifikasi OTP SMS, dan Google OAuth. Nomor telepon bukan kolom wajib untuk pengguna surel atau Google. | **\[K\]** |
| 3 | Akun, sinkronisasi, dan dialog AI tetap hanya untuk pengguna berusia 18 tahun ke atas sampai mekanisme persetujuan orang tua dan verifikasi usia dibangun. | **\[K\]** |
| 4 | Identitas autentikasi dikelola Supabase Auth; profil dan data belajar disimpan terpisah. RLS wajib, penautan akun memerlukan pembuktian kendali metode, dan `service_role`/rahasia provider tidak boleh berada di aplikasi. | **\[K\]** |
| 5 | Penghapusan akun dari aplikasi menghapus akun Supabase Auth dan seluruh data server terkait; data lokal tetap ada kecuali pengguna memilih menghapusnya. | **\[K\]** |
| 6 | Sinkronisasi progres mengikuti lifecycle di Bagian 9.2; progres dikunci per paket/item, progres paket belum terpasang tetap tersedia di akun, dan reset progres paket oleh pengguna akun diselaraskan ke perangkat lain. Detail struktur tabel dan API ditetapkan di Arsitektur Sistem. | **\[K\]** |

### 17.6 Pertanyaan terbuka

Tidak ada. Tiga pertanyaan Draft 6 sudah dijawab pemilik produk (Bagian 17.4 nomor 6 sampai 8), dan keputusan autentikasi Draft 7 ditetapkan pada Bagian 17.5. Hal berikut dipantau sebagai ketergantungan, bukan sebagai pertanyaan:

- Pengaturan log dan syarat paket layanan Vercel: kemampuan menganonimkan atau membatasi log akses (target masa simpan 30 hari), serta kesesuaian paket gratis (Hobby, dibatasi untuk penggunaan pribadi nonkomersial) dengan penggunaan produk ini. Diperiksa sebelum unduh dibuka (Lampiran D).
- Aturan turunan PP Tunas dan penetapan profil risiko oleh Kemkomdigi. Bila ada perubahan, Bagian 11.7 dan Lampiran D diperbarui.
- Pedoman toko saat rilis (formulir data, kategori anak, syarat opsi masuk di iOS).
- Hasil uji lapangan, yang menjadi dasar kalibrasi mastery (Bagian 8.2).

## 18. Fase dan Pertimbangan Jadwal **\[T\]**

Belum ada tenggat keras yang diketahui. Jadwal berikut adalah usulan dan perlu disesuaikan dengan jadwal proposal atau lomba. Jalur kritis adalah produksi konten dan audio, bukan kode.

**Tim **\[K\]**.** Satu pengembang (pemilik produk, yang juga memegang kunci penandatangan), tiga pembuat konten selama POC (peran kontributor, Bagian 11.1), dan verifier penutur asli yang direkrut mulai Fase 1. Dengan satu pengembang, Fase 1 diperpanjang dari 7 menjadi 10 minggu dan Fase 2 digeser mengikutinya. Lingkup P0 tidak ditambah, dan penambahan lingkup harus disertai pengurangan atau perpanjangan jadwal.

**Ketergantungan akun P1:** proyek Supabase dibuat sebelum integrasi; skema Auth dan Postgres, kebijakan RLS, templat surel, konfigurasi Google OAuth/deep link, penyedia SMS OTP, retensi/penghapusan, dan kebijakan privasi diuji sebelum akun dibuka. Aktivasi nomor telepon tidak boleh bergantung pada kode OTP buatan aplikasi; verifikasi dikelola oleh Supabase Auth.

| Fase | Isi | Perkiraan |
| --- | --- | --- |
| 0. Persiapan dan validasi | Tetapkan pedoman ejaan dan register (Lampiran A.2). Bangun kerangka sistem dan skema data. Susun konten contoh U1 dan U2 berstatus `poc` (Lampiran A). Bila konten sudah diperiksa silang, uji asumsi lewat WhatsApp: 20 kata dan 5 dialog selama satu minggu pada sekitar 10 orang, lalu tanyakan apakah mereka memakai satu kata di percakapan nyata. | Minggu 1 sampai 3 |
| 1. MVP (semua P0) | Aplikasi mobile offline, paket konten bundel (hanya Jawa-Mataraman), kosakata, latihan, dialog kurasi, streak, mastery, challenge, 6 unit konten. | Minggu 4 sampai 13. Mulai minggu 4: rekrut penutur dan verifier, pesan jadwal rekaman audio, siapkan akun toko dan kebijakan privasi. |
| 2. Uji lapangan | Verifikasi penutur atas semua konten sebelum rilis publik. 20 sampai 30 pengguna selama 4 minggu, tes sebelum dan sesudah, SUS, uji offline, perbaikan. Peserta di bawah 18 tahun membutuhkan persetujuan orang tua atau wali. | Minggu 14 sampai 17 |
| 3. P1 | Akun dan sinkronisasi melalui Supabase (surel, telepon OTP, Google OAuth), dialog AI, portal kontributor, cadangan file, serta pemasangan paket tambahan: layar Paket bahasa, unduh dan pasang saat online, pasang dari file saat offline, ekspor dan hapus paket, katalog dan hosting paket. | Setelah uji lapangan |
| 4. P2 dan ekspansi | Paket selisih, rekam suara kontributor, akun di bawah 18 tahun setelah mekanisme persetujuan orang tua dan verifikasi usia tersedia, serta produksi dan penerbitan paket bahasa dan dialek berikutnya (setelah MVP dan POC **\[K\]**). | Setelah Fase 3 |

**Catatan paket tambahan** **\[U\]****.** Fase 3 membangun mekanisme pemasangannya (FR-83 dan FR-85 sampai FR-88, FR-93), sedangkan konten paket kedua dan seterusnya baru diproduksi di Fase 4. Sebelum paket kedua ada, mekanisme diuji dengan paket uji bertanda tangan. Hosting Vercel dan katalog harus siap sebelum unduh dibuka (Lampiran D).

## 19. Keterkaitan dengan SDGs

| SDG | Peran dalam produk | Fitur terkait |
| --- | --- | --- |
| SDG 4: Pendidikan Berkualitas (utama) | Materi bahasa daerah yang interaktif dan terstruktur. | Kosakata, Latihan, Dialog, Kurikulum. |
| SDG 9: Industri, Inovasi, dan Infrastruktur | Inovasi offline-first untuk daerah dengan internet terbatas, dengan jalur pasang paket tanpa internet. | Paket konten, unduh paket saat online, pasang paket dari file lewat flashdisk atau berbagi file saat offline. |
| SDG 17: Kemitraan untuk Mencapai Tujuan | Kolaborasi dengan penutur asli, komunitas budaya, dan sekolah. | Peran kontributor dan verifier, kemitraan. |
| SDG 11: Kota dan Permukiman yang Berkelanjutan (sekunder) | Pelestarian warisan budaya takbenda lewat dokumentasi bahasa dan dialek (target 11.4). | Bank konten dan audio penutur asli. |
| SDG 10: Berkurangnya Kesenjangan (pendukung) | Akses belajar yang tidak bergantung pada kualitas internet. | Mode offline, tanpa akun, pasang paket dari file. |

## Lampiran A. Panduan Pengumpulan Data untuk POC **\[U\]**

Lampiran ini menjawab kebutuhan membangun kerangka sistem dan contoh konten Jawa Mataraman tanpa kerja sama penutur asli dan kontributor pada tahap prototipe.

### A.1 Prinsip POC

1. Tujuan POC adalah membuktikan kerangka sistem (alur belajar, offline, mastery, dialog bercabang) dengan konten contoh yang cukup realistis, bukan membuktikan kebenaran linguistik secara penuh.
2. Semua konten POC berstatus `poc` dan tidak dirilis publik (Bagian 11.8).
3. Setiap item mencatat `sumber` dan `metode`, sehingga mudah diperiksa kelak.
4. Target minimum POC: U1 dan U2, yaitu sekitar 60 kata, 20 kalimat, 2 sampai 3 dialog, dan 4 challenge. Unit lain menyusul setelah alur terbukti.

### A.2 Pedoman ejaan dan register

**Ejaan.** Rujukan utama adalah *Pedoman Umum Ejaan Bahasa Jawa Huruf Latin yang Disempurnakan* terbitan Balai Bahasa Yogyakarta (edisi revisi 2006, tersedia di repositori Kemendikdasmen). Aturan operasional:

- Satu bentuk tulis per lema. Bentuk lisan informal dicatat sebagai keterangan, bukan lema utama.
- Huruf yang rawan tidak konsisten (a dan o, t dan th, d dan dh, e pepet dan é atau è) diputuskan satu per satu mengacu pedoman, lalu dicatat di tabel keputusan ejaan agar konsisten di seluruh konten.
- Audio menjadi penentu bunyi. Bila tulisan dan bunyi meragukan, utamakan pedoman untuk tulisan dan catat bunyinya.

**Register menurut lawan bicara** (usulan, mengacu pemetaan di Bagian 6):

| Lawan bicara | Register |
| --- | --- |
| Nenek, kakek, orang tua, paman, bibi, guru, orang yang dihormati | Halus (krama) |
| Tetangga atau penjual yang belum akrab, orang sebaya yang baru dikenal | Netral (ngoko alus) |
| Teman sebaya, adik, orang yang sangat akrab | Akrab (ngoko) |

Contoh ilustrasi satu makna di dua register: Wis mangan durung? (akrab) dan Sampun dhahar dereng? (halus, kepada orang yang dihormati). Contoh hanya untuk menggambarkan format dan tetap harus diperiksa silang.

### A.3 Mengumpulkan kosakata

1. Mulai dari situasi unit (Bagian 12.2), bukan dari kamus acak. Tulis sekitar 50 kandidat dalam bahasa Indonesia terlebih dahulu (makna dulu).
2. Cari padanan Jawa Mataraman dengan minimal dua sumber independen: (a) kamus, misalnya *Baoesastra Djawa* karya Poerwadarminta dan Wiktionary bahasa Jawa; (b) pemakaian nyata, misalnya Wikipedia basa Jawa, majalah Djaka Lodang, atau rubrik berbahasa Jawa di surat kabar Solo dan Yogyakarta; (c) buku pelajaran muatan lokal bahasa Jawa SD dan SMP di DIY dan Jawa Tengah untuk unggah-ungguh.
3. Pilih 30 kata dengan prioritas pada Bagian 12.4 (langsung terdengar di situasi, dibutuhkan dialog, kata fungsi).
4. Isi spreadsheet dengan kolom: id, lema, register, kelas_kata, arti_id, contoh_kalimat, tema, unit, sumber_1, sumber_2, metode, status (`poc`), keterangan_variasi, status_audio.
5. Tulis ulang arti dengan kata sendiri. Kamus dan Wiktionary hanya pembanding, jangan menyalin definisi karena terikat hak cipta atau lisensi bagi-serupa.

### A.4 Mengumpulkan kalimat

- Rancang 4 sampai 5 pola kalimat per unit (misalnya pola ingin membeli, bertanya tempat, menawarkan makanan), lalu isi tiap pola dengan kata unit sehingga tiap kata target muncul di minimal dua kalimat.
- Tulis kalimat dari situasi, bukan terjemahan harfiah dari bahasa Indonesia. Buat pasangan register (akrab dan halus) untuk kalimat kunci di U1 dan U5.
- Batasi panjang sesuai Bagian 11.3 dan biarkan alat pembuat paket memeriksa bahwa semua kata isi ada di bank kata.
- Korpus terbuka seperti NusaX (pasangan Indonesia dan Jawa) hanya untuk mengamati pola dan memeriksa kewajaran. Periksa lisensinya dan nilai sendiri kualitasnya. Tulis ulang, jangan salin.

### A.5 Menyusun skenario dialog

Tulis tiap dialog sebagai kartu skenario: situasi, lawan bicara, register, tujuan pengguna, kata target, 6 sampai 10 giliran, 2 sampai 3 titik pilihan (jenis register: pas, cukup, atau kurang pas; jenis pemahaman: pas atau tidak nyambung), serta ending dan umpan balik. Langkah:

1. Pilih situasi nyata dari unit, misalnya menanyakan harga kepada penjual di warung.
2. Tulis alur dalam bahasa Indonesia lebih dulu, termasuk tujuan dan titik keputusan.
3. Jawakan baris demi baris hanya dengan kata dari bank (maksimal 5 kata baru).
4. Rancang opsi kurang pas yang realistis, misalnya memakai register akrab kepada orang yang dihormati, dan tulis umpan balik yang tidak menghukum. Pada titik pemahaman, rancang opsi tidak nyambung beserta balasan perbaikan lawan bicara.
5. Baca keras seluruh dialog dan periksa apakah terdengar seperti percakapan sungguhan.

Sumber ide skenario: pengalaman sendiri di rumah, warung, dan pasar, percakapan keluarga yang diingat, serta menyimak tayangan atau siniar berbahasa Jawa lisan untuk mengamati pola. Pola diamati lalu ditulis ulang, bukan ditranskripsi.

### A.6 Audio pada POC

**Keputusan **\[K\]**:** selama POC, pemilik produk sendiri mengisi suara (merekam sendiri mengikuti spesifikasi Bagian 11.6 sejauh perangkat memungkinkan). Audio tetap wajib ada di setiap kata, kalimat, dan baris dialog agar alur belajar lisan bisa diuji, ditandai `status_audio` bernilai `poc`. Audio `poc` tidak boleh dirilis publik dan harus diganti rekaman penutur asli dengan persetujuan tertulis sebelum rilis.

Opsi yang dipertimbangkan (opsi 1 dipilih): (1) rekam sendiri atau anggota keluarga bila penuturnya memang berdialek Mataraman, memakai spesifikasi Bagian 11.6 dan persetujuan tertulis sederhana; (2) pakai suara sintesis (TTS) hanya sebagai penanda posisi audio dengan `status_audio` bernilai `tts_placeholder`, karena TTS tidak menjamin dialek Mataraman; (3) tunda audio dan rekam hanya satu unit untuk menguji alur. Audio TTS tidak boleh dianggap bukti kebenaran bunyi.

### A.7 Kontrol kualitas minimum tanpa penutur asli

- Setiap kata dan kalimat didukung minimal dua sumber, dan sumbernya tercatat.
- Baca ulang seluruh konten setelah jeda 24 jam, lalu jalankan validasi otomatis alat pembuat paket.
- Alat bantu AI boleh dipakai untuk menyusun kandidat kata, membuat draf kalimat, dan memeriksa konsistensi format. AI tidak boleh menjadi satu-satunya sumber, karena ketepatan register dan kata dialek perlu diperiksa silang. Tandai metode `draf_ai`.
- Pemeriksaan ringan oleh satu penutur di lingkungan sendiri (misalnya keluarga atau dosen) atas sekitar 20 item per sesi bersifat opsional, bukan kemitraan, dan sangat dianjurkan sebelum konten diuji ke pengguna lain.
- Verifikasi penutur wajib sebelum rilis publik (Bagian 11.1).

### A.8 Urutan kerja

| Tahap | Hasil |
| --- | --- |
| 1 | Tabel keputusan ejaan, pemetaan register, dan templat spreadsheet. |
| 2 | U1: 30 kata, 10 kalimat, 1 sampai 2 dialog, 2 challenge. |
| 3 | U2 dengan alur yang sama, lalu bangun paket dan uji kerangka sistem. |
| 4 | Perbaiki templat dari temuan, baru lanjut U3 sampai U6. |

## Lampiran B. User Story **\[K\]**

Dikelompokkan menurut persona. Kolom FR menunjuk persyaratan yang memenuhinya, dan kolom kasus tepi memuat keadaan khusus yang harus diuji.

| Persona | Cerita | FR | Kasus tepi |
| --- | --- | --- | --- |
| Dian | Sebagai pemula yang baru pindah ke kampung, saya ingin belajar 10 kata hari ini dengan audio agar besok bisa menyapa tetangga. | FR-10, FR-12, FR-60 | Tanpa internet. Kata tanpa audio ditandai. |
| Dian | Sebagai pemula, saya ingin berlatih dialog di warung dan mendapat umpan balik yang tidak menghukum saat salah memilih register agar tidak takut mencoba. | FR-31, FR-34 | Memilih opsi kurang pas di setiap titik tetap berujung ending dengan penjelasan. |
| Dian | Sebagai pemula, saya ingin mengulang pertanyaan setelah lawan bicara tidak paham agar tahu kata yang tepat. | FR-35 | Mengulang berkali-kali tanpa jalan buntu. |
| Dian | Sebagai siswa yang belum punya teman berbahasa daerah, saya ingin challenge varian solo agar tetap bisa berlatih. | FR-72 | Challenge tidak mengubah angka apa pun. |
| Santi | Sebagai cucu yang ingin berbicara sopan dengan nenek, saya ingin kata dan dialog bertanda register halus agar memilih tingkat tutur yang pas. | FR-10, FR-34 | Dialog dengan lawan bicara nenek memakai register halus. |
| Santi | Sebagai pengguna yang sering berganti ponsel, saya ingin masuk dengan surel, nomor telepon, atau Google agar progres tidak hilang. | FR-51 | Akun sudah berisi data: digabung, bukan ditimpa. Pengguna di bawah 18 tahun belum bisa membuat akun. |
| Torik | Sebagai pembelajar bahasa ketiga, saya ingin langsung melatih kalimat tanpa terkunci urutan agar belajar sesuai rutinitas. | FR-22 | Baru melihat sedikit kata: muncul ajakan ke Kosakata, bukan galat. |
| Torik | Sebagai pembelajar beberapa bahasa, saya ingin progres tiap bahasa dan dialek terpisah agar bisa berpindah tanpa kehilangan kemajuan. | FR-02, FR-03, FR-62 | Berpindah paket di tengah sesi. |
| Torik | Sebagai pengguna yang sudah paham, saya ingin mode tanpa bantuan agar terjemahan tidak tampil bawaan. | FR-33 | Pilihan tersimpan per pengguna. |
| Semua | Sebagai pengguna baru, saya ingin aplikasi siap dipakai tanpa internet pada pembukaan pertama agar tidak bergantung sinyal. | FR-54, FR-80 | Pemasangan terhenti: dapat dicoba ulang tanpa data setengah jadi. Aplikasi tidak meminta unduhan apa pun. |
| Semua | Sebagai pengguna, saya ingin pembaruan aplikasi menambah unit tanpa menghapus progres agar tidak mengulang. | FR-82, Bagian 8.7 | Mastery turun karena bertambahnya item: level tertinggi tetap tampil. |
| Semua | Sebagai pengguna, saya ingin menghapus atau mereset data saya agar mengendalikan privasi. | FR-55 | Konfirmasi dua langkah. |
| Torik | Sebagai pembelajar beberapa bahasa yang sedang online, saya ingin mengunduh dan memasang paket bahasa atau dialek lain langsung dari aplikasi agar tidak perlu meminta file dari siapa pun. | FR-83, FR-86 | Koneksi putus di tengah unduhan: tidak ada data setengah jadi dan bisa dicoba ulang. Ruang penyimpanan tidak cukup. Memakai data seluler: ada peringatan. Aplikasi versi lama: keterangan Perbarui aplikasi. |
| Santi | Sebagai pengguna yang neneknya tinggal di daerah tanpa sinyal, saya ingin memasang paket bahasa dari file yang dikirim keluarga lewat WhatsApp, Bluetooth, atau flashdisk agar tetap bisa menambah bahasa saat offline. | FR-85, FR-86 | Layar Paket bahasa saat offline tidak menampilkan Unduh dan pasang, tetapi menunjuk ke Pasang paket dari file. File diganti nama menjadi `.zip`. File rusak, bertanda tangan salah, atau versi lebih rendah ditolak tanpa mengubah data. |
| Santi | Sebagai pengguna yang sudah punya paket, saya ingin membagikannya ke keluarga yang offline agar mereka tidak perlu mencarinya sendiri. | FR-87 | Paket hasil ekspor terpasang di perangkat lain dalam mode pesawat. |
| Semua | Sebagai pengguna, saya ingin melihat paket yang terpasang dan menghapus yang tidak kupakai agar ruang ponsel cukup tanpa kehilangan progres. | FR-86, FR-88 | Paket bundel tidak bisa dihapus. Memasang ulang paket yang dihapus memulihkan mastery. |
| Admin | Sebagai admin konten, saya ingin menerbitkan katalog bertanda tangan yang hanya memuat paket terverifikasi agar unduhan di aplikasi selalu aman dan benar. | FR-93 | Paket `poc` ditolak masuk katalog. Katalog bertanda tangan salah ditolak aplikasi. |
| Admin | Sebagai admin konten, saya ingin alat pembuat paket menolak dialog yang punya jalan buntu atau kata di luar bank agar paket rilis selalu valid. | FR-90 | Item `poc` pada paket rilis publik ditolak. |
| Verifier | Sebagai penutur asli, saya ingin memeriksa kata, kalimat, dan register agar konten yang terbit benar. | FR-91 | Verifier harus orang yang berbeda dari pengaju. |

## Lampiran C. Model Data Lokal (draf untuk dokumen arsitektur) **\[K\]**

Semua tabel berada di SQLite. Log kejadian adalah sumber kebenaran, dan tabel turunan boleh dibangun ulang kapan saja.

| Tabel | Isi utama | Sifat |
| --- | --- | --- |
| paket_terpasang | id_paket, bahasa, dialek, versi_paket, versi_skema, tanggal_pasang, sumber_pasang (bundel, unduh, file), jalur_arsip_asli (untuk ekspor, FR-87) | Sumber |
| unit, kata, kalimat, dialog, challenge | Isi paket (id_paket, id_item, medan sesuai Bagian 10) | Sumber, hanya diubah oleh pemasangan atau penghapusan paket (FR-88). Log kejadian tidak ikut terhapus. |
| kejadian | id_kejadian (ULID), id_perangkat, id_paket, id_item, jenis (kata_dilihat, kalimat_dilihat, jawaban_gtw, jawaban_ftg, pilihan_dialog, dialog_selesai, sesi_selesai), hasil, bobot, sumber (kurasi atau ai), id_sesi, waktu_perangkat, tanggal_lokal, versi_rumus, muatan JSON | Sumber, hanya bertambah |
| kekuatan_cache | id_paket, id_item, kekuatan, waktu_ulangan_terakhir, jumlah dilihat, benar, salah | Turunan |
| skor_dialog | id_paket, id_dialog, skor_terbaik, ending_tercapai | Turunan |
| hari_aktif | tanggal_lokal | Turunan |
| level_tertinggi | id_paket, level | Turunan (nilai maksimum) |
| pengaturan | kunci, nilai, waktu_ubah | Sumber, terbaru menang |
| centang_challenge | id_challenge, waktu | Sumber, hanya lokal (FR-73) |
| akun, antrean_laporan, status_sinkron | Sesuai P1 | Sumber |

## Lampiran D. Kriteria Siap Rilis Publik MVP **\[K\]**

- [ ] Semua persyaratan P0 lulus kriteria penerimaannya, termasuk uji mode pesawat penuh.
- [ ] 100% item rilis berstatus terverifikasi, tidak ada item `poc`, dan semua audio berasal dari penutur asli dengan persetujuan tertulis.
- [ ] Uji determinisme pemutaran log lulus, dan migrasi basis data dari versi sebelumnya lulus.
- [ ] Sesi bebas crash minimal 99% pada uji lapangan menurut laporan OS.
- [ ] Ukuran pemasangan, waktu buka, dan latensi audio memenuhi Bagian 14.
- [ ] Build rilis hanya membawa paket Jawa-Mataraman dan tidak melakukan permintaan jaringan pada fitur tanpa akun.
- [ ] Uji aksesibilitas dasar (pembaca layar, huruf 200%) lulus.
- [ ] Kebijakan privasi, halaman Tentang, lisensi, dan formulir data toko selesai.
- [ ] Penilaian mandiri profil risiko (Permenkomdigi No. 9 Tahun 2026) sudah diisi, kewajiban pendaftaran penyelenggara sistem elektronik diperiksa, dan kanal pelaporan serta batas usia 10 tahun tampil di halaman Tentang dan toko.
- [ ] Sebelum akun (P1) dibuka: pejabat pelindungan data pribadi ditunjuk, penilaian dampak pelindungan data pribadi selesai, dan Supabase Auth/Postgres, RLS, Google OAuth, OTP SMS, serta penghapusan akun lulus uji.
- [ ] Sebelum unduh paket (P1) dibuka: hosting Vercel dan katalog bertanda tangan siap, konfigurasi log (anonim semampu pengaturan, masa simpan 30 hari, tanpa analitik) dan kebijakan privasi sesuai Bagian 14, syarat paket layanan Vercel serta batas bandwidth diperiksa, dan uji unduh serta uji pasang dari file lulus.
- [ ] Hasil uji lapangan (Bagian 15) dibaca dan kalibrasi mastery ditinjau (Bagian 8.2).

