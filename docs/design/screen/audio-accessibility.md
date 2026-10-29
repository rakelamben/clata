# Screen: Audio dan Aksesibilitas

## Entry dan layout

Diakses melalui `Profil → Pengaturan → Audio dan aksesibilitas`. Header memiliki back button dan judul. Isi berupa rows native untuk pengaturan audio default, autoplay yang harus default off, reduced motion, dan penjelasan bahwa ukuran teks mengikuti pengaturan OS.

## Rules

Audio global menggunakan icon volume toggle: play, stop, lalu play dari awal. Audio baru menghentikan audio sebelumnya. Tidak ada autoplay pada screen atau sesi. State unavailable selalu mempertahankan teks.

## Accessibility

Setiap toggle memiliki label, state on/off, dan supporting text. Reduced motion dihormati pada feed, modal, progress, dan dialog. Semua row minimal 44×44 pt iOS atau 48×48 dp Android, dan focus kembali ke trigger setelah detail ditutup.
