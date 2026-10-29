# Flow: Language Packages (P1)

## Entry points

```text
Profil → progress → Unggah paket
Profil → Pengaturan → Paket Bahasa
```

## Upload/install from file

```text
Unggah paket
→ bottom sheet pilihan file
→ pilih .clata/.zip
→ tampilkan ukuran/version
→ validate signature/checksum/content
→ progress install
→ package aktif
```

File dapat diperoleh lewat berbagi dokumen, Bluetooth, flashdisk, atau aplikasi pesan. Upload/install berjalan tanpa internet.

Errors: corrupt, unsigned, wrong checksum, unsupported dialect, lower version, same version, storage full, interrupted install, dan app version tidak cocok. Package aktif dan progress lama tetap tidak berubah saat gagal.

## Online download

```text
Paket Bahasa
→ catalog loading saat screen dibuka
→ inspect size/version
→ warning data seluler bila relevan
→ Unduh dan pasang
→ cancel/retry
→ verify
→ atomic install
```

Catalog tidak diminta saat startup atau background. Offline/server unavailable menyembunyikan unduh tetapi tetap menyediakan `Unggah paket`.

## Export/remove

`Paket Bahasa → Bagikan paket → system share sheet` mengekspor original signed archive. `Hapus paket` hanya untuk package tambahan, memakai warning bottom modal dan konfirmasi dua langkah. Content/archive dihapus tetapi progress event dipertahankan; reinstall memulihkan progress yang cocok. Package bundel MVP tidak dapat dihapus.

## Accessibility and copy

- Gunakan copy singkat: `Memasang paket`, `Paket terpasang`, `Coba lagi`, `Paket tidak valid`.
- Progress install/download diumumkan secara polite dan tidak setiap persen.
- Tidak ada ikon dekoratif atau label status berulang.
