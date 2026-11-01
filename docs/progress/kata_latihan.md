# Ringkasan Audit: Fitur Kata (Kosakata) dan Fitur Latihan (Practice)

> **Status Audit:** Selesai (30 Oktober 2026)  
> **Dokumen Acuan:** `PRD_clata.md` (Draft 7) & Keputusan Pemilik Produk Terbaru  
> **Modul Terkait:** `src/features/vocabulary/` & `src/features/practice/`  
> **Hasil Verifikasi Kode:** 40 berkas tes lulus (91 tes), TypeScript bersih (`tsc --noEmit`), ESLint bersih.

---

## 📌 Ringkasan Eksekutif
Audit ini mencocokkan implementasi teknis saat ini pada **Fitur Kata** dan **Fitur Latihan** terhadap kebutuhan bisnis di PRD. Secara umum, alur utama pembelajaran luring (*offline-first*), pemutaran audio, pencarian berdiakritik, algoritma pengulangan berjarak (*Spaced Repetition System*), serta kurikulum berbasis unit sudah berfungsi dengan baik dan stabil.

---

## 1. ✅ Apa yang Diterapkan (Implemented / Compliant)

Fitur yang sudah ada, teruji, dan sesuai spesifikasi:

### A. Fitur Kata (Kosakata / Vocabulary)
- **Daftar Kata Interaktif & Audio Offline (`FR-10`)**:
  - Menampilkan kata daerah, kelas kata (*part of speech*), tingkatan bahasa (*register*), arti bahasa Indonesia, dan contoh kalimat.
  - Audio dilafalkan langsung secara offline dari berkas lokal via Expo AV (`playVocabularyAudio.ts`).
- **Pencarian Offline & Normalisasi Aksara (`FR-11`)**:
  - Berjalan 100% luring tanpa koneksi server.
  - Normalisasi cerdas diakritik dan variasi fonetik Jawa (`dh` $\leftrightarrow$ `d`, `th` $\leftrightarrow$ `t`, `é`/`è`/`ê` $\leftrightarrow$ `e`) di `searchNormalization.ts`.
  - Filter tingkatan register (Ngoko, Madya, Krama, Krama Inggil) di layar kamus.
- **Pencatatan Paparan Kata / Viewed Rule (`FR-12`, PRD 8.8)**:
  - Kata baru dicatat ke `learning_events` (`word_viewed`) hanya jika tampil minimal 1 detik di layar dan aplikasi aktif di latar depan (*foreground*).
- **Runtutan Belajar Harian / Streak (`PRD 8.5`)**:
  - Penghitungan target 10 kata unik harian dihitung secara lokal di perangkat (`streak.ts`).

### B. Fitur Latihan (Practice)
- **Tebak Kata 3 Arah (`FR-20`)**:
  - Mendukung 3 format kuis: Kata $\rightarrow$ Arti, Arti $\rightarrow$ Kata, dan Audio $\rightarrow$ Arti.
  - 4 pilihan jawaban dengan distribusi posisi kunci jawaban acak merata (~25% tiap opsi A/B/C/D) via Fisher-Yates shuffle.
- **Kalimat Rumpang (`FR-21`)**:
  - Kalimat memuat 1 rumpang (`___`), terjemahan bahasa Indonesia selalu tampil, dan pilihan jawaban berupa kata target.
- **Algoritma Pemilihan Konten / SRS (`FR-22`, PRD 8.1 & 8.4)**:
  - Memprioritaskan kata yang baru saja dijawab salah (`lastResult === 0`), kata berkekuatan rendah, serta peluruhan waktu retensi eksponensial $0.97^{\text{hari}}$ (`contentPicker.ts`).
  - Kekuatan item otomatis diperbarui di SQLite dengan formula kurasi:  
    $$\text{kekuatan baru} = \text{lama} + 0.3 \times \text{bobot} \times (\text{hasil} - \text{lama})$$
- **Umpan Balik Seketika & Penjelasan (`FR-24`)**:
  - Menampilkan status benar/salah, penjelasan register, tombol dengar ulang audio, dan tombol navigasi soal berikutnya.
- **Navigasi Kurikulum Berbasis Unit**:
  - Kartu unit diurutkan dinamis dari `unit.json` berdasarkan field `order`.
  - Setiap unit memiliki 3 gerbang kuis (Tebak Kata, Kalimat Rumpang, Dialog) dan dialog konfirmasi pra-sesi sebelum masuk kuis.
- **Ulangan Campur Lintas Unit**:
  - Sesi kuis gabungan dinamis di bagian paling bawah antarmuka latihan, menyajikan variasi soal Tebak Kata dan Kalimat Rumpang secara acak dari semua unit yang ada.

---

## 2. 🗑️ Apa yang Dihapus (Removed / Deprecated)

Elemen lama yang dihapus demi keadilan kuis dan stabilitas aplikasi:

1. **Modulo Target Kembar (`ordered[index % length]`)**:
   - *Sebelumnya:* Mengulang kata yang sama persis jika jumlah kata dalam unit $< 10$.
   - *Status:* Dihapus. Digantikan dengan **sesi adaptif** (panjang soal menyesuaikan jumlah kata unik tanpa target kembar).
2. **Kunci Jawaban Posisi Tetap (Indeks 0)**:
   - *Sebelumnya:* Jawaban benar selalu diletakkan di slot pertama sebelum opsi distraktor.
   - *Status:* Dihapus. Digantikan dengan pengacakan posisi acak murni.
3. **Pola Selang-Seling Kaku Ulangan Campur**:
   - *Sebelumnya:* Urutan soal dibuat kaku bergantian (soal ganjil = tebak kata, genap = rumpang).
   - *Status:* Dihapus. Digantikan dengan pengacakan dinamis menyeluruh (*full shuffle*).
4. **Teks Judul Redundan pada Kartu Ulangan Campur**:
   - *Sebelumnya:* Tulisan "Ulangan Campur" muncul dua kali (di atas kartu dan di dalam kartu hero).
   - *Status:* Dihapus dari dalam kartu agar tata letak lebih rapi dan konsisten.

---

## 3. 🔄 Apa yang Diganti / Disesuaikan (Replaced / Modified)

Penyesuaian spesifikasi PRD lama dengan keputusan pemilik produk terbaru:

| Area | Spesifikasi PRD Draft 7 | Realisasi Kode & Keputusan Terbaru |
| :--- | :--- | :--- |
| **Bentuk Tampilan Kosakata** | Hanya berupa daftar vertikal standar (*infinite list*). | **Mode Ganda**: Feed Interaktif Kartu Penuh (ala Reels/TikTok) + Kamus Pencarian Klasik. |
| **Peminjaman Distraktor** | Distraktor wajib hanya dari kata yang sudah pernah dilihat pengguna. | **Boleh meminjam kata belum dilihat** dari seluruh paket agar pengguna baru tidak terblokir saat langsung latihan. |
| **Akses & Penguncian Unit** | Konsep "Unit Berjalan" (minimal 80% kata dilihat) dan unit selanjutnya dikunci/disarankan. | **Semua unit terbuka bebas**, tidak ada penguncian unit maupun label rekomendasi kaku (*self-paced*). |
| **Panjang Sesi Kuis** | Dipatok kaku 1 sesi = 10 soal. | **Sesi Adaptif**: Jika item unik unit $< 10$, jumlah soal dipendekkan (misal 4–6 soal) untuk mencegah target kembar. |
| **Struktur Navigasi Latihan** | Tombol mode global datar. | Hierarkis: **Latihan Bebas** (atas) $\rightarrow$ **Daftar Unit Belajar** (tengah) $\rightarrow$ **Ulangan Campur** (bawah). |

---

## 4. ⏳ Apa yang Belum Diterapkan (Unimplemented / Gaps)

Fitur yang tercantum di PRD namun belum dikembangkan atau belum dihubungkan ke UI:

### A. Fitur Kata (Kosakata / Vocabulary)
1. **Pengaturan Target Kata Harian (`FR-13` — P1)**:
   - Belum ada antarmuka untuk mengubah target harian (5–20 kata/hari) di menu Pengaturan pengguna.
2. **Filter Tema di Layar Kamus (`FR-11`)**:
   - Kamus baru menyediakan tombol filter *register* (Ngoko/Krama), sedangkan filter berbasis tema/kategori kata belum diekspos di UI.

### B. Fitur Latihan (Practice)
1. **Syarat 80% Keterpaparan Kata Kalimat Rumpang (`FR-22`)**:
   - Pemilih kalimat rumpang saat ini baru memvalidasi kata jawaban (*gap*). Pengecekan apakah minimal 80% kata konteks lainnya dalam kalimat sudah pernah dilihat pengguna belum diaktifkan.
2. **Mode Ketik Jawaban Kalimat Rumpang (`FR-21` — P1)**:
   - Input jawaban masih 100% pilihan ganda, belum ada opsi mengetik kata secara mandiri.
3. **Empty State Interaktif Terarah (`FR-23`)**:
   - Saat suatu unit belum memiliki konten latihan, layar baru menampilkan status kosong standar tanpa tombol tautan langsung (*deep link*) ke tab Kosakata unit tersebut.
4. **Dialog Percakapan Interaktif AI (`FR-40 s/d FR-45` — P1)**:
   - Masih menggunakan naskah skenario percakapan statis berbasis cabang (`dialog.json`). Integrasi model percakapan AI daring/luring belum diterapkan.

---

## 5. 📊 Rangkuman Kesiapan Fitur

```
[Kosakata: Tampilan & Audio]   ███████████████████░  95%
[Kosakata: Pencarian & Filter] █████████████████░░░  85%
[Kosakata: Log Paparan 1 Detik]████████████████████ 100%
[Latihan: Tebak Kata & Rumpang]███████████████████░  95%
[Latihan: Algoritma SRS & Log] ██████████████████░░  90%
[Latihan: Unit & Ulangan Campur]████████████████████ 100%
```
