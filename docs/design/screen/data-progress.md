# Screen: Data dan Progres

## Layout

Diakses melalui `Profil → Pengaturan → Data dan progres`. Tampilkan storage summary, status sync, `Ekspor data`, `Reset progres`, dan informasi data lokal/server. Informasi destructive dipisahkan dari export.

## Destructive flow

`Reset progres` membuka warning bottom modal yang menjelaskan data yang dihapus, tombstone/version behavior, tombol `Batal`, lalu `Reset progres lokal` sebagai konfirmasi kedua. Reset yang gagal tidak boleh menghapus tampilan progress lama.

## Accessibility

Storage dan sync memiliki ringkasan teks. Export mengumumkan status file. Modal memiliki focus containment dan mengembalikan focus ke trigger.
