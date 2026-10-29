# Screen: Akun dan Autentikasi

## Tujuan dan eligibility

Screen ini diakses melalui `Profil → Akun`. Akun opsional untuk belajar offline. Akun dan AI tersedia mulai usia 10 tahun; usia 10–17 membutuhkan guardian consent sebelum pemrosesan akun, sinkronisasi, atau AI aktif.

## Signed-out layout

Header berisi back dan judul **Akun**, lalu copy `Akun membantu menyimpan progres di beberapa perangkat. Kamu tetap bisa belajar offline tanpa akun.` Tampilkan button `Daftar dengan email`, `Masuk dengan email`, `Masuk dengan nomor telepon`, dan `Lanjutkan dengan Google` sebagai action terpisah. Form tidak memakai placeholder sebagai label. Email, password, nomor telepon, OTP, show/hide password, dan submit memiliki label visible, hint, serta inline error.

## Registration dan guardian consent

Setelah submit, pengguna 10–17 melihat status `Persetujuan wali diperlukan sebelum akun dan sinkronisasi aktif.` Sediakan langkah consent yang menjelaskan data, tujuan, durasi, dan cara mencabut persetujuan. Jangan meminta data wali sebelum pengguna memilih melanjutkan alur yang jelas. Consent pending tidak boleh terlihat sebagai akun aktif.

## Forgot password

Flow: `Masuk dengan email → Lupa password? → email → Kirim tautan → reset link → password baru → Akun`. Copy sukses selalu netral: `Jika alamat ini terdaftar, kami mengirim tautan pemulihan.` Tautan kedaluwarsa menyediakan `Kirim ulang`. Password baru mendukung paste/password manager, show/hide dengan state, dan aturan minimum yang dibaca sebelum submit. Password tidak pernah ditulis ke log atau disimpan aplikasi.

## Signed-in layout dan actions

Tampilkan identitas yang dimasking, status consent, timezone, status sync terakhir, serta action `Keluar` dan `Hapus akun`. Field memakai native autofill/content type untuk email, password, nomor telepon, dan OTP. OTP memiliki `Kirim ulang` dengan cooldown dan state rate limit. Hapus akun memakai warning bottom modal dua langkah dengan konsekuensi dan opsi batal; tidak pernah menggunakan warna sebagai satu-satunya sinyal bahaya.

## State

`signed out`, `registration`, `guardian consent pending`, `email confirmation pending`, `forgot-password form`, `reset-link sent/expired`, `new-password form`, `OTP entry/expired`, `OAuth callback`, `signed in`, `session expired`, `sync pending`, `sync failed`, `deletion failed/succeeded`, dan `offline`.

## Accessibility tree dan WCAG

Heading `Akun`; method buttons; labelled fields; password visibility state; inline errors; consent status; sync status; dan destructive action dengan consequence text. Setelah submit gagal, fokus ke error summary atau field pertama yang bermasalah dan pertahankan input lain. Live status sync diumumkan polite tanpa spam. Mencakup 1.3.1, 1.3.5, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.3.1, 3.3.3, 3.3.7, dan 4.1.3.

Flow detail: [Authentication and account](../flows/account.md) dan [Synchronization](../flows/sync.md).
