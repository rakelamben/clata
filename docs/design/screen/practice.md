# Screen: Latihan

## Tujuan dan entry

`Latihan` adalah tab untuk memulai Guess the Word, Fill the Gap, atau Dialog. Pengguna masuk melalui bottom navigation dan selalu melihat session setup sebelum soal dimulai. Tidak ada syarat `kata_dilihat`; ketersediaan sesi hanya bergantung pada package dan bank konten yang valid.

## Struktur layout

Safe-area header berisi judul **Latihan** dan supporting copy `Pilih cara latihanmu.` Di bawahnya terdapat tiga full-width session cards yang berurutan: **Guess the Word**, **Fill the Gap**, dan **Dialog**. Setiap card memiliki judul, satu deskripsi manfaat, ikon dekoratif yang hidden dari screen reader, serta affordance yang jelas sebagai button. Jangan menampilkan skor atau streak sebagai penghalang sebelum sesi dimulai.

Jika package belum ada, letakkan empty state di area card: `Paket belajar belum tersedia.` dan button `Pasang paket`; jangan mengarahkan pengguna secara paksa kembali ke Kata.

## Sesi Guess the Word dan Fill the Gap

Header menampilkan progress `Soal 1 dari 10`, tombol keluar yang aman, dan area prompt. Prompt dapat berupa teks, terjemahan, atau audio dengan satu icon volume sebagai toggle play/stop. Jawaban berupa cards full-width dengan label teks; setelah dipilih, card memiliki selected state tanpa mengandalkan warna saja. Tombol `Periksa jawaban` tetap berukuran minimal 44×44 pt iOS atau 48×48 dp Android dan baru aktif setelah pilihan dibuat.

Dokumen khusus [Guess the Word](./guess-the-word.md) dan [Fill the Gap](./fill-the-gap.md) adalah spesifikasi implementasi detail untuk masing-masing sesi. Dokumen ini hanya menetapkan shell bersama, bukan pengganti spesifikasi question model, validasi konten, feedback, state, dan focus flow khusus.

Feedback berada di bawah pilihan dan menjelaskan hasil dengan bahasa suportif, misalnya `Belum tepat. Jawaban yang benar: ...` atau `Benar. Lihat contoh penggunaannya.` Setelah feedback, tampilkan satu tombol `Lanjut`. Jangan mengubah layout secara mendadak ketika feedback muncul.

## Sesi Dialog

Gunakan renderer yang sama dengan Dialogue dan AI Dialogue: transcript, speaker, terjemahan yang dapat dibuka, icon volume, choice cards, repair response, dan ending summary. Dialog tidak meminta microphone dan aksi `Ucapkan sendiri` selalu dapat dilewati.

Spesifikasi screen dan interaction detail Dialog ada di [Dialogue](./dialogue.md), termasuk setup pemilihan dialog, node bercabang, register/pemahaman, repair response, translation mode, audio state, ending, interruption, serta focus flow.

## State dan recovery

`setup`, `loading`, `question`, `selected`, `feedback correct`, `feedback incorrect`, `audio loading/playing/stopped/unavailable`, `empty package`, `content unavailable`, `interrupted`, `summary`, dan `save failed`.

Jika aplikasi ditutup, jawaban yang sudah tercatat dipertahankan tetapi sesi tidak ditandai selesai. Tampilkan `Sesi terakhir belum selesai.` dengan aksi `Lanjutkan` dan `Mulai baru`; jangan menghapus data tanpa konfirmasi.

## UX copy

- Empty: `Belum ada materi untuk sesi ini.`
- Offline: `Kamu tetap bisa berlatih dengan materi yang tersimpan.`
- Error: `Soal belum siap. Coba lagi.`
- Exit confirmation: `Keluar dari sesi? Jawaban yang sudah tersimpan tetap aman.`
- Summary: `Selesai. Terima kasih sudah berlatih.`

## Accessibility tree

Heading `Latihan`; choice group berisi tiga button bernama dan deskripsi; pada sesi heading `Soal 1 dari 10`; prompt; audio button dengan state `sedang diputar`/`berhenti`; answer group dengan selected state; feedback live region polite; dan button `Lanjut`. Fokus berpindah ke feedback setelah submit lalu ke `Lanjut`, dan kembali ke heading soal berikutnya setelah aktivasi.

## Acceptance dan WCAG 2.2

Konten tetap usable offline, target native minimal 44×44 pt iOS atau 48×48 dp Android, urutan fokus mengikuti visual, error menjelaskan pemulihan, tidak ada makna berbasis warna saja, dan teks dapat membesar tanpa terpotong. Mencakup 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.11, 2.5.8, 3.3.1, 3.3.3, 4.1.2, dan 4.1.3.

Flow detail: [Practice](../flows/practice.md) dan [Curated Dialogue](../flows/dialogue.md).
