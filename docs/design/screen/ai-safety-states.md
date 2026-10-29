# Screen: AI Dialogue — Safety and Failure States

Dokumen ini melengkapi `ai-dialogue.md` untuk state yang memengaruhi trust dan keselamatan pengguna.

## State dan UX copy

| State | Copy utama | Action |
|---|---|---|
| Timeout | `Respons belum siap.` | `Coba lagi` / `Gunakan dialog kurasi` |
| Quota exhausted | `Kuota dialog AI hari ini sudah habis.` | `Lihat waktu reset` / fallback |
| Unsafe response blocked | `Respons ini tidak ditampilkan karena tidak sesuai untuk latihan.` | `Gunakan dialog kurasi` |
| Irrelevant response | `Respons belum sesuai konteks.` | `Coba lagi` / fallback |
| Validation failed | `Respons belum dapat diperiksa.` | Retry terbatas |
| Network lost | `Koneksi terputus. Dialog kurasi tetap tersedia.` | `Gunakan dialog kurasi` |
| Report failed | `Laporan belum terkirim.` | `Coba lagi` / `Batal` |
| Prompt too long | `Pesan terlalu panjang untuk dialog ini.` | `Perpendek pesan` |

## Rules

- Retry provider dibatasi dan tidak boleh membuat loop loading tanpa akhir.
- Provider/model/API detail tidak ditampilkan kepada pengguna.
- Respons yang diblokir tidak boleh masuk transcript atau cache lokal.
- Fallback curated tidak boleh terlihat sebagai kegagalan pengguna.
- Report form memiliki label kategori, detail opsional, validasi, cancel, submit, dan confirmation.
- Semua failure state memiliki keyboard/switch-accessible action dan tidak bergantung pada warna.
