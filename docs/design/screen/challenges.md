# Screen: Tantangan

## Tujuan dan entry

Tantangan diakses dari tab **Tantangan** dan mengajak pengguna mempraktikkan bahasa di dunia nyata dengan risiko sosial rendah. Aktivitas ini bersifat reflektif: tidak menghasilkan skor benar/salah dan tidak memengaruhi mastery, streak, atau statistik.

## Struktur layout

Header menampilkan judul **Tantangan** dan copy `Coba sedikit demi sedikit, sesuai kenyamananmu.` Filter unit dan tingkat berada di bawah header dalam control yang dapat dibuka-tutup. Setelah filter, tampilkan satu challenge card dengan judul, durasi, tujuan, instruksi maksimal tiga kalimat, tingkat tutur, safety note, rescue phrase, serta segmented control `Solo`/`Sosial`.

Bagian bawah card menyediakan checkbox native `Sudah kucoba` dengan supporting copy `Dicatat hanya di perangkat ini.` Jangan menggunakan tombol merah untuk keadaan biasa atau menjadikan penyelesaian sebagai tuntutan.

## Interaksi

Mengganti variant memperbarui isi tanpa mengubah scroll position. `Solo` selalu tersedia sebagai alternatif sosial. Rescue phrase dapat dibuka sebagai panel teks dan memiliki icon volume bila audio tersedia. Checkbox dapat dibatalkan dan tidak memicu network request. Saat tidak ada challenge, tampilkan `Belum ada tantangan untuk filter ini.` dengan `Atur ulang filter`.

## State

`loading skeleton`, `loaded`, `filter expanded`, `filter applied`, `empty`, `offline`, `audio playing/stopped/unavailable`, `checked`, `unchecked`, dan `error`.

## Accessibility tree

Heading `Tantangan`; filter button dengan expanded/selected state; challenge title, level, duration, objective, instruction, safety note, variant tab dengan selected state, rescue phrase, audio toggle, dan checkbox dengan checked state. Focus order mengikuti urutan visual. Safety note harus dibaca sebelum action checkbox.

## UX copy, responsive, dan WCAG

Gunakan bahasa suportif seperti `Kalau belum nyaman, pilih versi Solo.` Jangan menilai keberanian pengguna. Layout harus reflow pada Dynamic Type besar dan landscape; semua target minimal 44×44 pt iOS atau 48×48 dp Android; warna bukan satu-satunya pembeda; status checkbox diumumkan sebagai live update polite.

Mencakup WCAG 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.2.4, 3.3.2, dan 4.1.2.

Flow detail: [Challenges](../flows/challenges.md).
