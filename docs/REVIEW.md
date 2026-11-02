# REVIEW: Catatan Audit Penutur Jawa Mataraman

Dokumen ini memuat daftar perubahan label register dan metadata paket bahasa `jawa-mataraman` (schemaVersion 2) yang memerlukan peninjauan dan konfirmasi oleh penutur asli dialek Mataraman.

---

## 1. 17 Kata Berlabel Lama `neutral`

Tiga kata ditandai **[RAGU]** untuk konfirmasi prioritas: `awan`, `bapak`, dan `adhik`.

| Item (ID & Teks) | Label Lama | Label Baru | Alasan & Catatan Linguistik |
| :--- | :--- | :--- | :--- |
| `kata-sugeng` (sugeng) | `neutral` | `sopan` | Ungkapan sapaan kesantunan ragam krama. |
| `kata-enjing` (enjing) | `neutral` | `sopan` | Leksikon krama untuk pagi hari (ngoko: *esuk*). |
| `kata-awan` (awan) | `neutral` | `akrab` | **[RAGU]** Leksikon ngoko untuk siang hari (kramanya: *siang*). Ditetapkan akrab sementara. |
| `kata-sonten` (sonten) | `neutral` | `sopan` | Leksikon krama untuk sore hari (ngoko: *sore*). |
| `kata-dalu` (dalu) | `neutral` | `sopan` | Leksikon krama untuk malam hari (ngoko: *wengi*). |
| `kata-nedha` (nedha) | `neutral` | `sopan` | Leksikon krama andhap untuk tindakan makan diri sendiri. |
| `kata-tilem` (tilem) | `neutral` | `sopan` | Leksikon krama andhap untuk tindakan tidur diri sendiri. |
| `kata-sekul` (sekul) | `neutral` | `sopan` | Leksikon krama untuk nasi (ngoko: *sega*). |
| `kata-toya` (toya) | `neutral` | `sopan` | Leksikon krama untuk air (ngoko: *banyu*). |
| `kata-peken` (peken) | `neutral` | `sopan` | Leksikon krama untuk pasar (ngoko: *pasar*). |
| `kata-kamar` (kamar) | `neutral` | `netral` | Kata serapan umum tanpa variasi tingkatan bentuk tutur. |
| `kata-griya` (griya) | `neutral` | `sopan` | Leksikon krama untuk rumah (ngoko: *omah*). |
| `kata-maos` (maos) | `neutral` | `sopan` | Leksikon krama untuk membaca (ngoko: *maca*). |
| `kata-mlampah` (mlampah) | `neutral` | `sopan` | Leksikon krama untuk berjalan (ngoko: *mlaku*). |
| `kata-bapak` (bapak) | `neutral` | `netral` | **[RAGU]** Kata sebutan kekerabatan umum; bentuk krama inggilnya adalah *rama/romo*. |
| `kata-ibu` (ibu) | `neutral` | `netral` | Kata sebutan kekerabatan umum; dapat dipakai dalam konteks sopan maupun akrab. |
| `kata-adhik` (adhik) | `neutral` | `netral` | **[RAGU]** Sebutan adik; tidak memiliki gradasi krama khusus, dipakai umum. |

---

## 2. 5 Kata dengan Catatan Teks Pemakaian (`catatan`)

Atribut `catatan` digunakan untuk memperjelas orientasi subjek tutur pada leksikon yang sama-sama berlabel `sopan`.

| Item (ID & Teks) | Label Lama | Label Baru | Isi `catatan` | Alasan |
| :--- | :--- | :--- | :--- | :--- |
| `kata-nedha` (nedha) | `neutral` | `sopan` | "Untuk diri sendiri." | Ragam *krama andhap* merendah untuk subjek penutur/diri sendiri. |
| `kata-tilem` (tilem) | `neutral` | `sopan` | "Untuk diri sendiri." | Ragam *krama andhap* tidur untuk diri sendiri. |
| `kata-dhahar` (dhahar) | `formal` | `sopan` | "Untuk orang yang dihormati." | Ragam *krama inggil* makan menghormati mitra tutur/orang ketiga. |
| `kata-sare` (sare) | `formal` | `sopan` | "Untuk orang yang dihormati." | Ragam *krama inggil* tidur menghormati mitra tutur/orang ketiga. |
| `kata-tindak` (tindak) | `formal` | `sopan` | "Untuk orang yang dihormati." | Ragam *krama inggil* pergi/berangkat untuk orang yang dihormati. |

---

## 3. Kalimat Bertanda Campuran (`sopan` dan `akrab`)

Sesuai aturan: jika terdapat kata penyusun bertanda `sopan`, kalimat diklasifikasikan sebagai `sopan`.

| Item (ID & Teks) | Label Lama | Label Baru | Kata Penyusun & Register | Alasan & Catatan |
| :--- | :--- | :--- | :--- | :--- |
| `kalimat-06` ("sugeng awan sedaya") | `neutral` | `sopan` | `kata-sugeng` (`sopan`), `kata-awan` (`akrab`) | Mengandung kata `sugeng` (*sopan*) dan kata fokus `awan` (*akrab/ragu*). Berdasarkan aturan penentuan register kalimat, ada kata sopan maka menjadi `sopan`. Perlu dicek apakah penutur Mataraman lazim memakai frasa sapaan ini atau lebih memilih "sugeng siang sedaya". |

---

## 4. Tiga Dialog Berlabel `netral` Sementara

Ketiga dialog yang semula berlabel `neutral` sementara ditetapkan berlabel `netral` dan membutuhkan evaluasi nuansa tutur Mataraman bersama lawan bicaranya (`interlocutor`).

| Item (ID & Judul) | Interlocutor | Label Lama | Label Baru | Catatan & Konteks |
| :--- | :--- | :--- | :--- | :--- |
| `dialog-sapaan` ("Menyapa Tetangga") | `neighbor` | `neutral` | `netral` | Di lingkungan Mataraman, sapaan tetangga bisa bervariasi dari *ngoko* (tetangga sebaya/akrab) hingga *krama* (tetangga sepuh/dihormati). |
| `dialog-pasar` ("Belanja di Pasar") | `vendor` | `neutral` | `netral` | Interaksi jual beli di pasar tradisional Mataraman sering memakai ragam *krama madya* atau campuran *ngoko-krama*. |
| `dialog-warung` ("Pesan Makanan di Warung") | `seller` | `neutral` | `netral` | Percakapan memesan makanan di warung santai, perlu konfirmasi apakah lebih condong ke *akrab* atau *sopan*. |
