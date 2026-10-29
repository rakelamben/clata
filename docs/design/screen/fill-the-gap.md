# Screen: Sesi Latihan — Fill the Gap

## Tujuan dan entry

Fill the Gap melatih pemahaman kata dalam kalimat. Sesi dibuka melalui `Latihan → Fill the Gap` dan dapat dimulai tanpa `kata_dilihat`. Soal runtime berasal dari kalimat terverifikasi dalam package.

## Setup sesi

Setup menampilkan package/dialek, unit atau tema, tingkat kesulitan, dan jumlah soal. Copy: `Lengkapi kalimat dengan kata yang paling sesuai.` Sertakan estimasi waktu dan button `Mulai latihan`. Bila tidak ada kalimat valid, tampilkan `Belum ada materi Fill the Gap untuk pilihan ini.` dengan `Pilih materi lain` atau `Pasang paket`.

## Struktur layout soal

Header safe area berisi back/keluar, `Soal 1 dari 10`, dan progress text. Konten utama terdiri dari context tema, kalimat dengan satu placeholder rumpang yang jelas, terjemahan Indonesia bila bantuan aktif, icon volume untuk audio kalimat bila tersedia, instruksi `Pilih kata untuk melengkapi kalimat.`, answer cards full-width, `Periksa jawaban`, feedback, lalu `Lanjut`.

Rumpang tidak boleh disampaikan melalui warna saja. Gunakan teks atau garis konsisten; kata sebelum dan sesudah rumpang tetap terbaca screen reader dalam urutan benar. Layout tidak boleh bergeser ketika opsi dipilih.

Accessibility label kalimat harus membaca struktur secara alami, misalnya `Sugeng [kata rumpang] enjang`, lalu menyebut `Satu kata belum diisi`; jangan membaca placeholder sebagai karakter kosong atau melewati bagian sebelum rumpang.

## Interaksi dan validasi konten

Pengguna dapat mengganti pilihan sebelum submit. Setelah submit, pilihan dikunci dan kalimat lengkap ditampilkan. Copy benar: `Kalimatnya lengkap.` Copy salah: `Belum tepat. Kata yang sesuai adalah “[kata]”. Perhatikan konteks kalimatnya.`

Setiap soal memiliki tepat satu rumpang, kata isi valid, terjemahan, register konsisten, panjang sesuai level, dan satu jawaban benar. Distraktor tidak boleh menghasilkan kalimat alternatif yang juga benar. Jika audio unavailable, teks dan fungsi jawab tetap berjalan.

## Audio dan bantuan

Terjemahan memakai toggle `Tampilkan terjemahan`/`Sembunyikan terjemahan`. Icon volume mengikuti aturan global: play, stop, dan play ulang dari awal melalui icon yang sama. Tampilkan contoh penggunaan setelah feedback hanya bila membantu.

## State lengkap

`setup loading`, `setup ready`, `question loading`, `question ready`, `translation hidden/visible`, `option selected`, `submitting`, `feedback correct`, `feedback incorrect`, `audio loading/playing/stopped/unavailable`, `empty bank`, `offline`, `interrupted`, `save failed`, dan `summary`.

Event jawaban valid yang sudah tersimpan dipertahankan saat interruption, tetapi sesi tidak dihitung selesai.

## Summary

Tampilkan jumlah soal selesai, jumlah benar, dan saran `Coba lagi untuk memperkuat konteks kalimat.` Tidak ada ranking atau tekanan mengulang.

## Accessibility tree dan focus flow

Heading `Fill the Gap`; progress; context; kalimat dengan label `Kalimat dengan satu kata rumpang`; translation toggle; audio button; answer group; submit; feedback live region; dan next button. Setelah submit fokus ke feedback, lalu ke `Lanjut`; soal berikutnya memindahkan fokus ke heading-nya. Selected, disabled, expanded, dan audio states diekspos melalui native semantics.

## Responsive, mobile, dan WCAG

Kalimat dan pilihan dapat wrap tanpa clipping pada text scaling 200%; answer cards minimal 44×44 pt iOS atau 48×48 dp Android; scroll content memiliki inset; target berdekatan diberi jarak; kontras teks 4.5:1 dan non-text 3:1; informasi tidak hanya disampaikan dengan warna; reduced motion didukung.

Mencakup WCAG 1.3.1, 1.3.2, 1.4.3, 1.4.10, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.3.1, 3.3.3, dan 4.1.2/4.1.3.

Flow detail: [Practice](../flows/practice.md).
