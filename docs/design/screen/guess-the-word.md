# Screen: Sesi Latihan — Guess the Word

## Tujuan dan entry

Guess the Word adalah sesi pilihan ganda untuk menghubungkan kata daerah dengan arti, konteks, atau audio dengan arti. Sesi dibuka melalui `Latihan → Guess the Word` dan tidak memerlukan riwayat `kata_dilihat`.

## Setup sesi

Tampilkan pilihan package/dialek, unit atau `Semua unit`, arah soal, dan jumlah soal. Default yang aman adalah `Kata → arti` dan 10 soal. Sertakan ringkasan `10 soal · sekitar 3 menit` dan button `Mulai latihan`. Jika bank kosong, tampilkan `Belum ada materi Guess the Word untuk pilihan ini.` dengan action `Pilih materi lain` atau `Pasang paket`.

## Struktur layout soal

Header safe area berisi back/keluar, progress `Soal 1 dari 10`, dan progress indicator dengan teks. Area utama berurutan: context unit/tema bila relevan, prompt utama, icon volume bila prompt audio tersedia, pertanyaan, empat answer cards full-width, `Periksa jawaban`, feedback panel, lalu `Lanjut`. Answer cards harus dapat wrap pada Dynamic Type besar dan tidak memiliki label yang terpotong.

## Interaksi dan feedback

Tap memilih satu opsi dalam radio group; tap opsi lain memindahkan selection tanpa submit. `Periksa jawaban` mengunci pilihan, mencatat event, dan menampilkan feedback. Copy benar: `Benar. Kata ini berarti “[arti]”.` Copy salah: `Belum tepat. Jawaban yang benar adalah “[jawaban]”. Coba perhatikan contoh berikut.` Jangan memakai `Salah!` atau animasi yang mengagetkan. Distraktor harus valid, tidak ambigu, dan tidak menciptakan jawaban alternatif.

## Audio

Icon volume berlabel `Putar audio kata [lema]` saat berhenti dan `Hentikan audio kata [lema]` saat bermain. Tap berikutnya memulai audio dari awal. Jika unavailable, tampilkan `Audio tidak tersedia. Kamu tetap bisa menjawab.`

## State lengkap

`setup loading`, `setup ready`, `question loading`, `question ready`, `option selected`, `submitting`, `feedback correct`, `feedback incorrect`, `audio loading/playing/stopped/unavailable`, `content empty`, `offline`, `session interrupted`, `save failed`, dan `summary`.

Pada save failure jangan mengklaim jawaban tersimpan; sediakan `Coba lagi`. Pada interruption, event valid dipertahankan dan pengguna dapat memilih `Lanjutkan` atau `Mulai baru`. Sesi terputus tidak dihitung selesai.

## Summary

Tampilkan `Latihan selesai`, jumlah benar, jumlah soal, dan saran netral seperti `Ulangi item yang masih terasa sulit.` Jangan membandingkan pengguna dengan orang lain.

## Accessibility tree dan focus flow

Heading `Guess the Word`; status `Soal 1 dari 10`; prompt; audio button dengan playing state; answer group dengan selected state; `Periksa jawaban`; feedback live region polite; dan `Lanjut`. Setelah submit fokus ke feedback heading, lalu setelah `Lanjut` ke heading soal berikutnya. Back/close memiliki confirmation bila ada sesi berjalan.

## Responsive, mobile, dan WCAG

Target minimal 44×44 pt iOS atau 48×48 dp Android, jarak antartarget mencegah salah tap, content tidak tertutup bottom navigation, dan layout tetap usable pada portrait, landscape, serta text scaling 200%. Kontras teks minimal 4.5:1, non-text 3:1, selected/error state tidak hanya dibedakan dengan warna, dan motion menghormati reduced motion.

Mencakup WCAG 1.3.1, 1.3.2, 1.4.3, 1.4.10, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.3.1, 3.3.3, dan 4.1.2/4.1.3.

Flow detail: [Practice](../flows/practice.md).
