# Flow: Reminders and Reports (P1)

## Entry

Both features are accessed from the vertical settings list below the progress components in **Profil**.

## Reminder

```text
Profil
→ Pengaturan
→ Pengingat
→ pilih waktu
→ minta izin notifikasi
→ aktif
```

### Rules

- Reminder adalah notifikasi lokal; tidak membutuhkan server.
- Permission hanya diminta setelah pengguna menekan `Aktifkan pengingat`.
- Copy singkat dan positif, tanpa rasa bersalah.
- Jika izin ditolak, tampilkan `Pengingat belum aktif` dan satu instruksi untuk mengubahnya di pengaturan perangkat.
- Mematikan pengingat membatalkan seluruh jadwal.
- Jangan kirim reminder bila hari ini sudah aktif.
- Tidak ada banner offline permanen di screen pengingat.

## Content report

### Entry points

Report dapat dimulai dari kata, kalimat, dialog kurasi, atau baris AI melalui action kecil yang tidak mengganggu konten utama.

```text
Content item
→ Laporkan kesalahan
→ tampilkan ringkasan ID package/item/version
→ isi catatan singkat opsional
→ pilih Kirim atau Bagikan
→ confirmation singkat
```

### Rules

- Copy action: `Laporkan kesalahan`, bukan label teknis.
- Tidak meminta microphone, camera, location, atau data pribadi yang tidak relevan.
- Pengguna tanpa akun membagikan laporan melalui email/message app miliknya.
- Pengguna dengan akun menyimpan laporan ke queue lokal dan mengirim saat online.
- Laporan AI dapat menyertakan line ID dan label `Dibuat AI`, tetapi tidak menyertakan provider API, token, atau prompt internal.
- Pengguna usia 10–17 mengikuti aturan akun/guardian consent saat laporan dikirim melalui server.
- Jika offline, tampilkan `Laporan disimpan` dan kirim saat koneksi tersedia.
- Jika gagal, tampilkan `Belum terkirim` dengan aksi `Coba lagi`.

## Accessibility

- Pengingat memiliki switch dengan selected/disabled state yang diumumkan.
- Report action memiliki label yang menyebut item secara singkat.
- Confirmation dan error diumumkan secara polite.
- Dialog report mengembalikan focus ke trigger setelah ditutup.
