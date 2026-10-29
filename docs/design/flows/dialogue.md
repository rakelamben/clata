# Flow: Curated Dialogue

## Entry

`Latihan → session setup → Dialog → pilih unit/dialogue → mulai`.

Dialog adalah salah satu jenis sesi di Latihan, bukan tab bottom navigation. Dialog dapat dimulai tanpa syarat jumlah atau riwayat `kata_dilihat`.

## Main path

```text
Dialog setup
→ transcript/line
→ icon volume bila ingin mendengar
→ choice point
→ feedback atau repair
→ node berikutnya
→ ending
→ summary singkat
```

## Dialogue presentation

- Transcript menampilkan speaker, teks bahasa daerah, dan terjemahan sesuai mode.
- `Tanpa Bantuan` menyembunyikan terjemahan dan tersimpan sebagai pengaturan pengguna.
- Audio memakai satu icon volume toggle, bukan tombol replay terpisah.
- Icon volume aktif menggunakan warna brand; play setelah stop dimulai dari awal.
- Audio baru menghentikan audio sebelumnya.
- Audio unavailable hanya menampilkan teks singkat `Audio tidak tersedia`; teks tetap usable.
- Jangan mengulang label package, unit, register, atau status pada setiap baris bila konteks sudah jelas.

## Choice points

- **Register**: semua opsi menjawab konteks yang sama dengan tingkat kepantasan berbeda.
- **Pemahaman**: minimal satu opsi terhubung dan satu opsi tidak terkait.
- Pilihan menggunakan card teks yang jelas; status `Pas`, `Cukup pas`, atau `Kurang pas` hanya ditampilkan ketika membantu feedback.
- Tidak ada warna sebagai satu-satunya penanda kualitas pilihan.

## Repair and repetition

Opsi tidak terkait menampilkan repair response singkat dari lawan bicara, lalu mengulang node dan pilihan yang sama. Tidak ada batas pengulangan dan pengguna tidak dipermalukan.

## Ending and feedback

Setiap ending menampilkan feedback Bahasa Indonesia yang singkat. Gunakan copy sederhana seperti `Pas`, `Cukup pas`, atau `Coba cara lain`. Jelaskan register hanya bila relevan terhadap pilihan pengguna.

## Ucapkan sendiri

`Ucapkan sendiri` muncul sebagai satu aksi opsional setelah pilihan. Aksi ini dapat dilewati, tidak merekam suara, dan tidak meminta izin mikrofon.

## States

`dialog setup`, `loading`, `line`, `choice`, `repair/retry`, `translation hidden`, `audio playing`, `audio stopped`, `audio unavailable`, `ending`, `interrupted`, dan `empty package`.

Sesi dialog yang terputus tidak dihitung selesai dan tidak mencatat skor ending; event lain yang sudah valid tetap mengikuti aturan progres.

## Accessibility

- Speaker, line text, translation state, dan choice group memiliki urutan fokus yang logis.
- Icon volume memiliki label `Audio baris dialog` dan state sedang diputar/berhenti.
- Choice card mengumumkan teks lengkap dan state pilihan.
- Repair response diumumkan secara polite, tidak memotong audio aktif secara tidak perlu.
- `Ucapkan sendiri` diumumkan sebagai aksi opsional dan dapat dilewati.
