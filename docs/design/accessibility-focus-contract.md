# Accessibility Focus Contract

Kontrak ini berlaku untuk seluruh screen mobile Clata.

| Event | Focus/screen-reader target | Announcement |
|---|---|---|
| Screen dibuka | Heading screen | Nama screen satu kali |
| Bottom sheet dibuka | Heading sheet | Judul dan tujuan sheet |
| Sheet ditutup | Trigger pembuka | Tidak mengulang seluruh screen |
| Filter diterapkan | Ringkasan jumlah hasil | `Menampilkan X hasil` |
| Submit jawaban | Heading feedback | Feedback satu kali, polite |
| Soal berikutnya | Heading soal baru | `Soal 2 dari 10` |
| Dialog node berubah | Speaker dan line baru | Speaker, teks, lalu pilihan |
| Package install selesai | Status hasil | Versi dan package aktif |
| Error screen | Error heading | Masalah dan tindakan pemulihan |
| Modal destructive | Heading modal | Konsekuensi sebelum action |

Modal dan bottom sheet menahan focus, memiliki `Batal`/`Tutup`, dapat ditutup dengan back gesture yang aman, dan mengembalikan focus ke trigger. Tidak boleh ada focus di belakang overlay.

Native semantics wajib mengekspos `label`, `role`, `selected`, `checked`, `expanded`, `disabled`, dan `busy` bila relevan. Dynamic status memakai polite live region dan tidak diumumkan pada setiap perubahan kecil.
