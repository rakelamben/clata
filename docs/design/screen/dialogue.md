# Screen: Sesi Latihan — Dialog

## Tujuan dan entry

Dialogue diakses melalui `Latihan → session setup → Dialog`. Screen ini melatih pemahaman konteks, tingkat tutur, dan pemilihan respons tanpa mempermalukan pengguna atau memaksa bicara di depan orang lain.

## Setup pemilihan dialog

Sebelum transcript, tampilkan daftar dialog terverifikasi berdasarkan package, unit, tingkat, dan tema. Setiap row memuat judul, konteks singkat, estimasi giliran, dan button `Mulai dialog`. Empty state menyediakan `Pilih unit lain` atau `Pasang paket`.

## Struktur layout

Header safe area berisi back/keluar, judul konteks, dan progress giliran. Transcript berada pada scroll region utama dengan bubble yang membedakan speaker melalui nama dan urutan, bukan warna saja. Baris aktif memiliki teks bahasa daerah, terjemahan yang dapat diperluas, dan satu icon volume. Choice area berada di bawah transcript sebagai cards vertikal; pada perangkat kecil area ini tetap dapat discroll dan tidak tertutup keyboard karena microphone tidak digunakan.

Target phrase diberi penanda teks dan label `Frasa target`, bukan hanya highlight warna. Tombol `Ucapkan sendiri (opsional)` membuka instruksi singkat dan langsung dapat dilewati.

## Interaksi dan feedback

Memilih respons mengunci pilihan untuk mencegah double-submit, lalu menampilkan feedback singkat: `Pilihanmu pas.`, `Pilihan ini bisa dipahami, tetapi tingkat tuturnya kurang sesuai.`, atau `Coba pilih respons yang lebih sesuai konteks.` Opsi yang tidak nyambung menampilkan repair response dan mengulang node yang sama. Semua jalur harus berakhir pada ending yang menjelaskan hal yang berhasil dipelajari.

Terjemahan memakai toggle yang memiliki pressed state dan label `Tampilkan terjemahan`/`Sembunyikan terjemahan`. Audio memakai icon volume saja: play, stop, dan play berikutnya dari awal. Tidak ada replay button terpisah.

## State

`setup`, `loading`, `line`, `translation hidden/visible`, `audio loading/playing/stopped/unavailable`, `choice`, `repair/retry`, `interrupted`, `ending`, dan `empty package`.

Saat audio gagal, teks tetap lengkap dan muncul `Audio belum tersedia. Kamu tetap bisa melanjutkan.` Saat proses terputus, tampilkan `Percakapan belum selesai.` dengan `Lanjutkan` dan `Mulai baru`.

## Accessibility tree dan focus flow

Heading konteks → status giliran → transcript region dengan speaker, teks, dan terjemahan → audio button dengan state → choice group → optional action → ending. Choice quality harus disampaikan sebagai teks; status dinamis diumumkan polite satu kali. Setelah node berubah, fokus pindah ke heading baris baru, bukan ke posisi acak dalam transcript. Auto-scroll hanya terjadi ketika node aktif berubah dan tidak memindahkan focus pengguna yang sedang membaca transcript. Tooltip/menu mengembalikan fokus ke trigger dan modal warning memiliki focus containment serta aksi batal eksplisit.

## UX copy dan acceptance

Gunakan copy `Pilih respons yang paling sesuai konteks.` dan hindari `Salah!`. Semua teks dapat membesar, transcript dapat discroll dengan satu jari, control minimal 44×44 pt iOS atau 48×48 dp Android, motion menghormati reduced motion, dan screen tetap berfungsi dalam mode pesawat.

Mencakup WCAG 1.3.1, 1.3.2, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.2.3, 3.3.1, 4.1.2, dan 4.1.3.

Flow detail: [Curated dialogue](../flows/dialogue.md).
