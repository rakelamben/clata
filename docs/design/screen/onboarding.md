# Screen: Onboarding

## Tujuan

Onboarding memperkenalkan Clata secara singkat, menjelaskan model offline-first, meminta informasi usia, lalu menampilkan paket belajar dan menyiapkan database serta package bundel sebelum pengguna masuk ke screen Kata.

Onboarding terdiri dari empat screen berurutan. Tidak ada carousel panjang dan tidak ada permintaan login, microphone, camera, location, atau network wajib.

## Screen 1 — Info aplikasi

### Layout

Gunakan safe area dengan ilustrasi abstrak kecil bertema suara/catatan di bagian atas, heading besar, satu supporting copy, dan primary button di area bawah. Ilustrasi bersifat dekoratif dan dikeluarkan dari accessibility tree.

### UX copy

- Heading: `Belajar bahasa daerah dengan percaya diri.`
- Supporting: `Pelajari kata dan percakapan untuk digunakan sehari-hari.`
- Primary: `Lanjut`
- Secondary: `Lewati` hanya bila tidak melewati informasi wajib.

### State

`initial`, `pressed`, `loading next`, dan `error navigation`.

## Screen 2 — Profil lokal dan data offline

### Layout

Tampilkan ilustrasi minimal, heading, baris informasi, checkbox konfirmasi penyimpanan data lokal, dan satu primary button. Jangan menampilkan jargon teknis.

### UX copy

- Heading: `Siapkan profil lokal.`
- Supporting: `Aplikasi berjalan 100% offline. Tahun lahir dan paket belajar disimpan di perangkatmu, bukan di server.`
- Checkbox: `Saya memahami bahwa data hanya tersimpan di perangkat ini dan dapat hilang jika aplikasi dihapus.`
- Primary: `Lanjut`

Sinkronisasi tetap membutuhkan akun yang memenuhi syarat; penjelasan ini tidak boleh memaksa login.

## Screen 3 — Age gate

### Layout

Heading berada di atas, diikuti pemilih tanggal/tahun lahir, inline error, dan primary button.

### UX copy

- Heading: `Berapa tahun lahirmu?`
- Primary: `Lanjut`
- Error: `Pilih tanggal lahirmu terlebih dahulu.` / `Masukkan tahun lahir yang benar.`

### Rules

- Di bawah 10 tahun: tampilkan pesan ramah dan hentikan onboarding.
- Usia 10–17: P0 aktif; akun, sync, dan AI memerlukan persetujuan wali.
- Usia 18+: akun, sync, dan AI dapat digunakan sesuai syarat masing-masing.

Validasi menerima tahun numerik yang menghasilkan usia realistis. Saat error, focus kembali ke field.

## Screen 4 — Preparation & Package Install

### Layout

Tampilkan heading, deskripsi paket, kartu detail paket belajar (nama paket, deskripsi, chips konten, status offline), progress list tahap persiapan, dan primary button di footer (`Mulai` -> note saat preparing -> `Mulai belajar` saat siap -> `Coba lagi` saat gagal).

### UX copy

- Heading: `Siapkan paket belajarmu.`
- Supporting: `Paket berikut akan dipasang untuk mulai belajar. Semua materi tersedia tanpa koneksi internet.`
- Preparing Heading: `Menyiapkan ruang belajarmu.`
- Ready Heading: `Paket belajar siap`
- Failure Heading: `Persiapan belum selesai.`
- Primary Button: `Mulai` (default), `Mulai belajar` (siap), `Coba lagi` (gagal)

### Preparation stages

1. Menyiapkan basis data lokal
2. Memvalidasi materi belajar
3. Memasang paket Jawa–Mataraman

Jika aplikasi ditutup atau crash, startup recovery melanjutkan atau mengulang dengan aman tanpa package setengah jadi.

## Completion

Setelah pengguna menekan `Mulai belajar` di Screen 4, langsung buka **Kata — Scrollable Feed**. Tidak ada Home/index screen.

## Accessibility

- Heading dan satu status utama diumumkan pada setiap screen.
- Date input memiliki label, hint, error, dan validasi yang dapat dibaca screen reader.
- Preparing state diumumkan sebagai tahap bermakna.
- Semua button minimal 44×44 pt iOS atau 48×48 dp Android.
- Dynamic type 200% tidak boleh memotong CTA.

## Acceptance criteria

Flow selesai dalam mode pesawat, age gate selalu muncul, pengguna di bawah 10 berhenti, paket bundel siap digunakan, failure dapat dicoba ulang, dan pengguna masuk ke Kata setelah menekan Mulai belajar.
