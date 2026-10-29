# Screen: Kata Feed / Entry Screen

## Tujuan

Kata Feed adalah landing screen utama setelah onboarding. Screen ini membuat pengguna langsung bertemu konten pembelajaran tanpa halaman Home/index tambahan.

## Entry and exit

- Entry: selesai onboarding, app foreground, atau tab `Kata`.
- Exit: tab `Latihan`, `Tantangan`, `Profil`, tombol `Buka Kamus`, atau back dari tooltip.
- Scroll position harus dipertahankan saat kembali dari Kamus atau tooltip.

## Layout

1. Safe-area header dengan judul **Kata**.
2. Context package hanya ditampilkan sekali bila diperlukan.
3. Tombol icon **Buka Kamus** di pojok kanan atas dengan hit area minimal sesuai platform; visual icon boleh kecil tetapi area sentuh tidak boleh.
4. `ScrollableWordFeed` memenuhi area konten utama.
5. Bottom navigation fixed: `Kata`, `Latihan`, `Tantangan`, `Profil`.

Feed tidak menampilkan search, filter, mastery, streak, CTA destruktif, atau status permanen.

## WordFeedItem

Setiap item memprioritaskan kata daerah sebagai teks terbesar, lalu icon volume, arti Indonesia, kelas kata bila membantu, dan icon info tingkat tutur. Tidak ada register badge, ikon dekoratif, atau label status berulang.

## Interaction

- Scroll vertikal menggunakan infinite feed pattern, bukan `FlatList` sebagai komponen menu.
- Item dimuat bertahap dari repository lokal.
- Setelah semua item selesai, feed kembali ke item pertama.
- Saat looping, tampilkan dan umumkan sekali: `Semua kata sudah ditampilkan. Kembali ke kata pertama.`
- Icon volume: tap pertama play, tap saat playing stop, tap berikutnya mulai dari awal.
- Icon volume aktif memakai warna brand; accessibility state tetap menyebut status.
- Icon info membuka tooltip singkat dan mengembalikan focus saat ditutup.
- Kata dihitung dilihat setelah tampil minimal satu detik di foreground.
- Streak hanya dapat bertambah dari aktivitas feed ini; audio tidak wajib.

## States

- `loading`: skeleton mengikuti bentuk WordFeedItem.
- `content`: feed siap digunakan.
- `loading next batch`: skeleton hanya di bagian bawah.
- `looping`: kembali ke item pertama tanpa transisi mengganggu.
- `audio loading/playing/stopped/unavailable`.
- `feed error`: `Daftar kata belum siap.` + `Coba lagi`.
- `package unavailable`: `Pasang paket untuk mulai belajar.` + aksi pemasangan.
- `offline`: feed tetap usable; label offline hanya sementara bila relevan.

## Bottom navigation

Gunakan native tab semantics. Tab aktif dibedakan dengan selected state dan label, bukan warna saja.

## Accessibility

Feed diumumkan sebagai scrollable region. Item mengumumkan `Kata, [lema]. [arti].` Icon volume memiliki label `Audio kata [lema]`; icon info memiliki label `Tingkat tutur kata: [register]`. Skeleton diumumkan sekali, bukan per item. Saat screen dibuka, focus menuju heading `Kata`; saat tooltip ditutup, focus kembali ke trigger; saat batch gagal, focus menuju error heading.

## Acceptance criteria

Setelah onboarding pengguna langsung melihat kata, feed tetap berfungsi offline, tidak ada search/filter di screen ini, semua control memiliki target platform, dan tidak ada informasi progress yang berulang.
