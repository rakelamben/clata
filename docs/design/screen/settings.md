# Screen: Profil — Pengaturan

## Tujuan dan entry

Pengaturan berada setelah komponen progress di tab Profil. Screen ini mengelompokkan keputusan yang jarang dilakukan tanpa menyembunyikan status penting. Entry utama: `Profil →` bagian pengaturan.

## Struktur layout

Gunakan list vertikal dengan section heading yang terlihat: `Belajar` berisi `Paket Bahasa`; `Audio dan aksesibilitas` berisi pengaturan audio, reduced motion, dan ukuran teks yang mengikuti OS; `Pengingat`; `Akun`; `Data dan progres`; serta `Tentang Clata`. Detail screen: [Audio dan aksesibilitas](./audio-accessibility.md), [Pengingat](./reminders.md), [Data dan progres](./data-progress.md), dan [Tentang Clata](./about.md). Setiap row adalah native button dengan judul, supporting status, dan chevron dekoratif yang hidden dari accessibility tree.

Status offline/sinkronisasi ditampilkan sebagai row ringkas, bukan banner permanen. Jangan menaruh destructive action berdampingan dengan action rutin tanpa jarak dan penjelasan.

## Interaksi dan destructive flow

Row membuka screen detail dan mempertahankan posisi Profil ketika kembali. `Hapus progres`, `Keluar`, atau `Hapus akun` membuka warning bottom modal, bukan error-colored full panel. Modal menjelaskan konsekuensi, menyediakan `Batal` dan action dengan nama spesifik seperti `Hapus progres lokal`; focus contained selama modal terbuka dan kembali ke trigger setelah ditutup.

## State

`ready`, `offline`, `sync pending`, `server unavailable`, `download progress`, `cancelled`, `validation failed`, `storage full`, `installed`, `update available`, dan `delete confirmation`.

Error harus menyatakan tindakan pemulihan, misalnya `Koneksi belum tersedia. Coba lagi saat online.` Tidak ada auto-redirect dan tidak ada tindakan irreversible tanpa konfirmasi kedua.

## Accessibility tree dan mobile rules

Heading `Profil`; section headings; rows dengan name, role button, dan status; lalu modal dengan heading, consequence text, `Batal`, dan destructive action. Semua row minimal 44×44 pt iOS atau 48×48 dp Android, jarak antar target memadai, focus order visual, back action konsisten, safe area dihormati, dan layar tetap usable pada Dynamic Type besar serta landscape.

Mencakup WCAG 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7/2.4.11, 2.5.8, 3.2.4, 3.3.1, 3.3.3, dan 4.1.2.

Flow detail: [Settings and recovery](../flows/settings-recovery.md), [Language packages](../flows/packages.md), dan [Reminders and reports](../flows/reminders-reports.md).
