# Flow: Latihan

## Entry

Pengguna memilih tab **Latihan**.

## Session setup

```text
Latihan
→ session setup
→ Guess the Word / Fill the Gap / Dialog
→ mulai sesi
```

Dialog merupakan jenis sesi di dalam Latihan, bukan tab utama.

## Availability rule

Semua jenis sesi dapat dibuka tanpa syarat jumlah atau riwayat `kata_dilihat`. `kata_dilihat` tidak menentukan keterbukaan Guess the Word, Fill the Gap, atau Dialog, dan tidak dipakai untuk mengisi bank sesi.

Konten tetap harus berasal dari package yang terpasang dan bank konten yang valid. Jika package/bank benar-benar kosong, tampilkan `Belum ada materi` dan satu tindakan pemulihan yang sesuai.

## Guess the Word / Fill the Gap

`Question → select option → immediate feedback → audio/example → next → summary`.

- Distraktor tetap berasal dari bank konten yang valid.
- Tidak ada pesan yang menyuruh pengguna membuka Kata hanya untuk membuka sesi.
- Wrong answer menampilkan jawaban benar dan arahan singkat.
- No new items boleh mengulang item lemah tanpa menutup sesi.

## Dialog

`Dialog setup → transcript/line → choice point → feedback or repair → next node/ending → summary`.

Dialog dapat dimulai langsung dari session setup, termasuk ketika pengguna belum memiliki log `kata_dilihat`.

## Alternate paths

- Session interrupted → answered events remain; session is not counted complete.
- Empty package → show install/recovery action.
- Audio unavailable → text remains usable.
- Offline → all curated sessions remain available.
