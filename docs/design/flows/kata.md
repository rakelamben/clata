# Flow: Kata Feed and Navigation

## Tujuan

Menjadikan daftar kata sebagai pengalaman utama setelah onboarding: satu kata menjadi fokus, pengguna dapat membaca, mendengar, melihat tingkat tutur bila perlu, lalu berpindah ke latihan atau Kamus.

## Entry

Setelah onboarding selesai, aplikasi dibuka kembali, atau pengguna menekan tab **Kata**.

Tidak ada halaman Home/index. Screen Kata adalah landing screen utama aplikasi.

## Main path

```text
Kata
→ ScrollableWordFeed
→ scroll vertikal satu kata per fokus
→ tap icon volume bila ingin mendengar
→ tap icon info bila ingin mengetahui tingkat tutur
→ buka Latihan atau Kamus bila diperlukan
```

## ScrollableWordFeed

- Feed berjalan vertikal dan hanya berisi pengalaman scroll kata.
- Feed menggunakan infinite vertical scrollable pattern; `FlatList` tidak digunakan sebagai komponen menu Kata.
- Item dimuat bertahap dari local repository dengan windowing/prefetch agar hemat memori.
- Semua item berasal dari package; tidak ada konten yang digenerate.
- Skeleton muncul di bagian bawah saat batch berikutnya dimuat.
- Spinner hanya digunakan untuk aksi singkat, bukan sebagai pengganti seluruh feed.
- Setelah seluruh item selesai, feed kembali ke item pertama dan melanjutkan siklus.
- Perulangan tidak membuat label/status baru yang berulang atau mengganggu pembacaan.
- Scroll position dipertahankan saat kembali dari Kamus atau tooltip.
- Feed hanya menampilkan floating control atau status sementara yang relevan.
- Tidak ada aksi destruktif atau kontrol yang mengubah isi/state feed secara permanen.

## WordFeedItem

Urutan isi setiap item:

1. kata bahasa daerah sebagai fokus utama;
2. icon volume untuk audio;
3. arti Indonesia;
4. kelas kata bila memang membantu;
5. icon info untuk tingkat tutur.

### Audio

- Audio hanya memiliki satu button icon volume.
- Idle/stopped: icon volume normal.
- Playing: icon volume memakai warna aktif brand dan accessibility state `sedang diputar`.
- Menekan saat playing menghentikan audio.
- Menekan kembali setelah stop memulai audio dari awal.
- Audio baru menghentikan audio sebelumnya.
- Loading memakai spinner kecil dan button disabled.
- Audio unavailable menampilkan teks singkat `Audio tidak tersedia` tanpa button rusak.
- Audio tidak menjadi syarat streak.

### Register / tingkat tutur

- Tidak menggunakan register badge.
- Icon info membuka tooltip atau bottom sheet singkat.
- Isi minimal: nama tingkat tutur dan penjelasan satu kalimat pendek.
- Accessibility label: `Tingkat tutur kata: halus`.
- Tooltip dapat ditutup dengan `Tutup`, tap di luar, atau tombol back.
- Focus dikembalikan ke icon info setelah tooltip ditutup.

## Kamus / Data Kata

Search dan filter tidak berada di ScrollableWordFeed.

```text
Kata → icon kecil pojok kanan atas → Kamus
→ search atau filter tema/tingkat tutur
→ pilih kata bila perlu
→ kembali ke Kata
```

Kamus bekerja offline dan mengembalikan pengguna ke posisi feed sebelumnya. Search mengikuti aturan PRD untuk diakritik dan variasi `dh/th`.

## Navigation

Bottom navigation:

```text
Kata / Latihan / Tantangan / Profil
```

- Dialog berada di menu Latihan.
- Progress, mastery, streak, statistik, pengaturan, akun, data, dan status offline berada di Profil.
- Pengguna dapat berpindah tab tanpa penguncian kurikulum.
- Back dari Kamus atau tooltip kembali ke konteks Kata sebelumnya.

## States

- `loading`: skeleton feed.
- `content`: item kata siap dibaca.
- `playing`: icon volume aktif.
- `stopped`: icon volume kembali normal.
- `audio unavailable`: teks singkat tanpa control rusak.
- `looping`: feed kembali ke item pertama tanpa layar transisi yang mengganggu.
- `feed error`: pesan singkat + `Coba lagi`.
- `offline`: feed tetap usable; label offline hanya sementara bila relevan.
- `empty package`: arahkan ke pemasangan paket, bukan tampilkan feed kosong tanpa penjelasan.

## Viewed event

Kata masuk log `kata_dilihat` setelah tampil minimal satu detik di foreground. Prefetch, skeleton, item yang hanya lewat saat scroll cepat, dan pemutaran audio saja tidak dihitung sebagai kata dilihat.

## Accessibility

- Feed diumumkan sebagai region scrollable.
- Setiap item memiliki nama yang ringkas: `Kata, [lema]. [arti].`
- Icon volume memiliki label `Audio kata [lema]` dan state sedang diputar/berhenti.
- Icon info memiliki label `Tingkat tutur kata: [register]`.
- Ikon dekoratif, status berulang, dan simbol tanpa fungsi dikeluarkan dari accessibility tree.
- Loop ke item pertama tidak membuat pengumuman berulang tanpa batas.
- Skeleton diumumkan sekali sebagai `Memuat daftar kata`.
